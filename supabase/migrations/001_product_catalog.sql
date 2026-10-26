-- ============================================================
-- Rastahse Migration 001 — Full Product Catalog
-- Run this ONCE in the Supabase SQL Editor (Dashboard → SQL Editor).
-- It is idempotent: safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE).
-- DO NOT edit schema.sql or schema_v2.sql; add new changes as new migration files.
-- ============================================================

-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for fast ILIKE / similarity search on products & orders


-- ============================================================
-- 1. PRODUCT STATUS ENUM
-- ============================================================
do $$ begin
  create type product_status as enum ('draft', 'active', 'archived');
exception
  when duplicate_object then null;
end $$;


-- ============================================================
-- 2. CATEGORIES
-- ============================================================
create table if not exists categories (
  id           uuid        primary key default uuid_generate_v4(),
  slug         text        not null unique,
  name         text        not null,
  description  text,
  icon_path    text,                        -- e.g. "/brand/icons/apparel.png"
  fruit_color  text,                        -- brand hex colour per category
  sort_order   int         not null default 0,
  is_visible   boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists categories_slug_idx    on categories (slug);
create index if not exists categories_visible_idx on categories (is_visible);


-- ============================================================
-- 3. PRODUCTS
-- ============================================================
create table if not exists products (
  id              text        primary key,        -- kept as prod_002 etc. so existing references survive
  sku             text        not null unique,     -- primary operational identifier shown in admin
  slug            text        not null unique,
  name            text        not null,
  origin          text,                           -- e.g. "Pondicherry, Tamil Nadu"
  artisan_name    text,                           -- name of the maker / studio
  description     text        not null default '',
  story           text        not null default '',
  curator_note    text,
  category_id     uuid        references categories (id) on delete set null,

  -- Pricing (all in paise, i.e. rupees × 100, consistent with existing code)
  base_price      bigint      not null check (base_price >= 0),
  compare_price   bigint      check (compare_price >= 0),
  cost_price      bigint      check (cost_price >= 0),       -- COGS; used in accounting later

  -- India-specific compliance
  gst_rate        numeric(5,2) not null default 0,           -- e.g. 5.00, 12.00, 18.00
  hsn_code        text,                                      -- HSN / SAC code for GST filing
  barcode         text,                                      -- EAN-13 or internal barcode

  -- Shipping dimensions (Shiprocket requires these per order item)
  weight_grams    int         check (weight_grams > 0),
  length_cm       numeric(6,2) check (length_cm > 0),
  breadth_cm      numeric(6,2) check (breadth_cm > 0),
  height_cm       numeric(6,2) check (height_cm > 0),

  -- Catalog flags
  tags            text[]      not null default '{}',
  status          product_status not null default 'active',
  is_curated      boolean     not null default false,
  curated_order   int,
  is_one_of_one   boolean     not null default false,
  is_hidden       boolean     not null default false,        -- admin soft-hide (not shown on storefront)
  is_deleted      boolean     not null default false,        -- soft delete; never physically removed

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Full-text / ILIKE search support
create index if not exists products_sku_idx         on products (sku);
create index if not exists products_slug_idx        on products (slug);
create index if not exists products_category_idx    on products (category_id);
create index if not exists products_status_idx      on products (status);
create index if not exists products_name_trgm_idx   on products using gin (name gin_trgm_ops);
create index if not exists products_sku_trgm_idx    on products using gin (sku  gin_trgm_ops);
create index if not exists products_tags_idx        on products using gin (tags);


-- ============================================================
-- 4. PRODUCT VARIANTS (stock lives here)
-- ============================================================
create table if not exists product_variants (
  id                  uuid        primary key default uuid_generate_v4(),
  product_id          text        not null references products (id) on delete cascade,
  sku                 text        not null unique,            -- variant-level SKU (e.g. KOD-NAT-001)
  variant_name        text        not null,                   -- e.g. "Natural Palm", "Default"
  price_delta         bigint      not null default 0,         -- added to base_price for this variant (paise)

  -- ── STOCK MODEL ────────────────────────────────────────────
  -- total_stock:     physical units we own (including reserved)
  -- withheld_stock:  units locked to pending/in-transit orders
  -- available_stock: GENERATED = total - withheld (what storefront sells from)
  -- Rule: never write available_stock directly — it is always derived.
  total_stock         int         not null default 0 check (total_stock >= 0),
  withheld_stock      int         not null default 0 check (withheld_stock >= 0),
  available_stock     int         generated always as (total_stock - withheld_stock) stored,

  low_stock_threshold int         not null default 2,

  -- Shipping overrides at variant level (overrides product-level if set)
  weight_grams        int         check (weight_grams > 0),

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint withheld_lte_total check (withheld_stock <= total_stock)
);

create index if not exists variants_product_idx     on product_variants (product_id);
create index if not exists variants_sku_idx         on product_variants (sku);
create index if not exists variants_available_idx   on product_variants (available_stock);


-- ============================================================
-- 5. PRODUCT IMAGES
-- ============================================================
create table if not exists product_images (
  id          uuid        primary key default uuid_generate_v4(),
  product_id  text        not null references products (id) on delete cascade,
  url         text        not null,
  alt_text    text        not null default '',
  width       int,
  height      int,
  sort_order  int         not null default 0,
  is_primary  boolean     not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists images_product_idx on product_images (product_id);
-- Each product can have only one primary image
create unique index if not exists images_one_primary_per_product
  on product_images (product_id)
  where is_primary = true;


-- ============================================================
-- 6. STOCK MOVEMENTS (append-only audit ledger)
-- ============================================================
do $$ begin
  create type stock_movement_reason as enum (
    'initial',           -- set during catalog seeding
    'manual_adjustment', -- admin corrects a count
    'order_reserved',    -- checkout reserves stock (withheld++)
    'order_released',    -- cancellation releases reserved stock (withheld--)
    'order_delivered',   -- delivery confirmed; total-- and withheld--
    'return_restocked',  -- inspected return; total++
    'rto_restocked',     -- courier returned; total++
    'write_off'          -- damaged/lost; total--
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists stock_movements (
  id             uuid                   primary key default uuid_generate_v4(),
  variant_id     uuid                   not null references product_variants (id) on delete cascade,
  order_id       uuid,                  -- nullable; NULL for manual adjustments
  delta_total    int                    not null,  -- positive = added, negative = removed
  delta_withheld int                    not null,  -- positive = reserved, negative = released
  reason         stock_movement_reason  not null,
  actor          text                   not null default 'system',  -- admin user id or 'system'
  note           text,
  created_at     timestamptz            not null default now()
);

create index if not exists movements_variant_idx on stock_movements (variant_id);
create index if not exists movements_order_idx   on stock_movements (order_id);
create index if not exists movements_created_idx on stock_movements (created_at desc);


-- ============================================================
-- 7. UPDATED_AT TRIGGERS (auto-stamp on any row change)
-- ============================================================
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated_at   on products;
create trigger trg_products_updated_at
  before update on products
  for each row execute function touch_updated_at();

drop trigger if exists trg_variants_updated_at   on product_variants;
create trigger trg_variants_updated_at
  before update on product_variants
  for each row execute function touch_updated_at();

drop trigger if exists trg_categories_updated_at on categories;
create trigger trg_categories_updated_at
  before update on categories
  for each row execute function touch_updated_at();


-- ============================================================
-- 8. STOCK FUNCTIONS (called via supabase.rpc — never raw reads then writes)
-- Each function:
--   • locks the variant row (FOR UPDATE) to prevent race conditions
--   • writes a stock_movements row for every change
--   • raises a descriptive error on constraint failure
-- ============================================================

-- 8a. reserve_stock
-- Called when an order is confirmed (paid or COD).
-- Increments withheld_stock for each item in the order.
-- Fails with a clear message if available_stock < qty for any item.
-- order_items_json format: [{"variant_id": "uuid", "qty": 2}, ...]
create or replace function reserve_stock(
  p_order_id   uuid,
  p_items_json jsonb,
  p_actor      text default 'system'
)
returns void
language plpgsql
as $$
declare
  item      jsonb;
  v_id      uuid;
  qty       int;
  variant   product_variants%rowtype;
begin
  for item in select * from jsonb_array_elements(p_items_json)
  loop
    v_id := (item->>'variant_id')::uuid;
    qty  := (item->>'qty')::int;

    -- Lock the row to prevent concurrent over-selling
    select * into variant
    from product_variants
    where id = v_id
    for update;

    if not found then
      raise exception 'Variant % not found', v_id;
    end if;

    if (variant.available_stock < qty) then
      raise exception
        'Insufficient stock for variant % (available: %, requested: %)',
        v_id, variant.available_stock, qty
        using errcode = 'P0001';
    end if;

    -- Reserve
    update product_variants
    set withheld_stock = withheld_stock + qty
    where id = v_id;

    -- Audit
    insert into stock_movements (variant_id, order_id, delta_total, delta_withheld, reason, actor)
    values (v_id, p_order_id, 0, qty, 'order_reserved', p_actor);
  end loop;
end;
$$;


-- 8b. release_stock
-- Called on order cancellation.
-- Decrements withheld_stock (returns units to available pool).
create or replace function release_stock(
  p_order_id   uuid,
  p_items_json jsonb,
  p_actor      text default 'system'
)
returns void
language plpgsql
as $$
declare
  item   jsonb;
  v_id   uuid;
  qty    int;
begin
  for item in select * from jsonb_array_elements(p_items_json)
  loop
    v_id := (item->>'variant_id')::uuid;
    qty  := (item->>'qty')::int;

    -- Lock row
    perform id from product_variants where id = v_id for update;

    update product_variants
    set withheld_stock = greatest(0, withheld_stock - qty)
    where id = v_id;

    insert into stock_movements (variant_id, order_id, delta_total, delta_withheld, reason, actor)
    values (v_id, p_order_id, 0, -qty, 'order_released', p_actor);
  end loop;
end;
$$;


-- 8c. complete_stock
-- Called when an order is confirmed as delivered.
-- Both total_stock and withheld_stock decrease by qty (the goods left our warehouse).
create or replace function complete_stock(
  p_order_id   uuid,
  p_items_json jsonb,
  p_actor      text default 'system'
)
returns void
language plpgsql
as $$
declare
  item   jsonb;
  v_id   uuid;
  qty    int;
begin
  for item in select * from jsonb_array_elements(p_items_json)
  loop
    v_id := (item->>'variant_id')::uuid;
    qty  := (item->>'qty')::int;

    perform id from product_variants where id = v_id for update;

    update product_variants
    set
      total_stock    = greatest(0, total_stock    - qty),
      withheld_stock = greatest(0, withheld_stock - qty)
    where id = v_id;

    insert into stock_movements (variant_id, order_id, delta_total, delta_withheld, reason, actor)
    values (v_id, p_order_id, -qty, -qty, 'order_delivered', p_actor);
  end loop;
end;
$$;


-- 8d. restock_variant
-- Called after a manual stock addition, inspected return, or RTO.
-- Only total_stock increases; available_stock rises accordingly.
create or replace function restock_variant(
  p_variant_id uuid,
  p_qty        int,
  p_reason     stock_movement_reason,
  p_actor      text default 'system',
  p_note       text default null,
  p_order_id   uuid default null
)
returns void
language plpgsql
as $$
begin
  if p_qty <= 0 then
    raise exception 'Restock quantity must be positive, got %', p_qty;
  end if;

  perform id from product_variants where id = p_variant_id for update;

  update product_variants
  set total_stock = total_stock + p_qty
  where id = p_variant_id;

  insert into stock_movements (variant_id, order_id, delta_total, delta_withheld, reason, actor, note)
  values (p_variant_id, p_order_id, p_qty, 0, p_reason, p_actor, p_note);
end;
$$;


-- ============================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================

-- ── Categories ──────────────────────────────────────────────
alter table categories enable row level security;

create policy "Public reads visible categories"
  on categories for select
  using (is_visible = true);
-- All writes go through server actions using the service role (bypasses RLS).

-- ── Products ────────────────────────────────────────────────
alter table products enable row level security;

create policy "Public reads active products"
  on products for select
  using (
    status    = 'active'
    and is_hidden  = false
    and is_deleted = false
  );

-- ── Product Variants ────────────────────────────────────────
alter table product_variants enable row level security;

create policy "Public reads variants of active products"
  on product_variants for select
  using (
    exists (
      select 1 from products p
      where p.id = product_variants.product_id
        and p.status    = 'active'
        and p.is_hidden  = false
        and p.is_deleted = false
    )
  );

-- ── Product Images ──────────────────────────────────────────
alter table product_images enable row level security;

create policy "Public reads images of active products"
  on product_images for select
  using (
    exists (
      select 1 from products p
      where p.id = product_images.product_id
        and p.status    = 'active'
        and p.is_hidden  = false
        and p.is_deleted = false
    )
  );

-- ── Stock Movements — admin-only ────────────────────────────
alter table stock_movements enable row level security;
-- No public read policy; only the service role can read/write.


-- ============================================================
-- 10. SUPABASE STORAGE BUCKET: product-media
-- ============================================================
-- Run this AFTER creating the bucket in the Supabase Dashboard
-- (Storage → New bucket → "product-media" → Public).
-- Then paste the policy below in the SQL editor.

-- Public read (storefront can display images without auth)
-- insert into storage.buckets (id, name, public) values ('product-media', 'product-media', true)
-- on conflict (id) do nothing;

-- Only service role / authenticated admins may upload:
-- (handled by server actions using the service-role key — no policy needed for writes)

-- ============================================================
-- END OF MIGRATION 001
-- ============================================================
