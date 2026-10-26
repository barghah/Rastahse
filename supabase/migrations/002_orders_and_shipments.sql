-- ============================================================
-- Migration 002: Orders, Shipments, Order Items & Settings
-- Decouples payment status from delivery stage, adds courier tracking,
-- order items snapshot table, and shop logistics settings.
-- ============================================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. ADD NEW COLUMNS TO ORDERS TABLE
-- Note: Old 'status' column is preserved until full verification.
alter table orders
  add column if not exists payment_method text not null default 'razorpay'
    check (payment_method in ('razorpay', 'cod')),
  add column if not exists payment_status text not null default 'paid'
    check (payment_status in ('awaiting_payment', 'paid', 'cod', 'refunded')),
  add column if not exists delivery_status text not null default 'waiting_approval'
    check (delivery_status in ('waiting_approval', 'pending_dropoff', 'in_transit', 'delivered', 'retrying', 'returned', 'return_in_transit', 'cancelled')),
  add column if not exists fulfillment_mode text
    check (fulfillment_mode is null or fulfillment_mode in ('shiprocket', 'local')),
  add column if not exists needs_attention boolean not null default false,
  add column if not exists delivered_at timestamptz,
  add column if not exists expected_delivery_date date,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancel_reason text;

-- Indexes for high performance filtering and search
create index if not exists orders_payment_status_idx  on orders (payment_status);
create index if not exists orders_delivery_status_idx on orders (delivery_status);
create index if not exists orders_needs_attention_idx on orders (needs_attention);
create index if not exists orders_created_at_desc_idx on orders (created_at desc);


-- 2. ORDER ITEMS (Price, Title & SKU snapshot at time of purchase)
create table if not exists order_items (
  id           uuid        primary key default uuid_generate_v4(),
  order_id     uuid        not null references orders (id) on delete cascade,
  variant_id   uuid        references product_variants (id) on delete set null,
  sku          text        not null default '',
  name         text        not null,
  unit_price   int         not null, -- in paise
  qty          int         not null check (qty > 0),
  image        text,
  weight_grams int         check (weight_grams > 0),
  length_cm    numeric(6,2),
  breadth_cm   numeric(6,2),
  height_cm    numeric(6,2),
  created_at   timestamptz not null default now()
);

create index if not exists order_items_order_idx   on order_items (order_id);
create index if not exists order_items_variant_idx on order_items (variant_id);


-- 3. SHIPMENTS (One order can have forward, re-ship, or return shipments)
create table if not exists shipments (
  id                     uuid        primary key default uuid_generate_v4(),
  order_id               uuid        not null references orders (id) on delete cascade,
  kind                   text        not null default 'forward' check (kind in ('forward', 'return')),
  sr_order_id            text,
  sr_shipment_id         text,
  awb                    text,
  courier_id             text,
  courier_name           text,
  freight_charge         numeric(10,2),
  pickup_location_name   text,
  pickup_pincode         text,
  handover_method        text        not null default 'dropoff' check (handover_method in ('pickup', 'dropoff')),
  pickup_scheduled_for   date,
  label_url              text,
  manifest_url           text,
  tracking_url           text,
  etd                    date,
  booking_step           text        not null default 'serviceability_checked'
    check (booking_step in ('serviceability_checked', 'sr_order_created', 'awb_assigned', 'pickup_requested', 'label_ready', 'done')),
  status                 text        not null default 'waiting_approval'
    check (status in ('waiting_approval', 'pending_dropoff', 'in_transit', 'delivered', 'retrying', 'returned', 'return_in_transit', 'cancelled')),
  last_sr_status         text,
  last_sr_payload        jsonb,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists shipments_order_idx on shipments (order_id);
create index if not exists shipments_awb_idx   on shipments (awb);
create index if not exists shipments_status_idx on shipments (status);


-- 4. SHIPMENT EVENTS (Tracking audit timeline with deduplication)
create table if not exists shipment_events (
  id            uuid        primary key default uuid_generate_v4(),
  shipment_id   uuid        not null references shipments (id) on delete cascade,
  sr_status     text        not null,
  mapped_status text        not null,
  location      text,
  occurred_at   timestamptz not null default now(),
  payload       jsonb,
  created_at    timestamptz not null default now(),
  constraint uq_shipment_event_occurred unique (shipment_id, sr_status, occurred_at)
);

create index if not exists shipment_events_shipment_idx on shipment_events (shipment_id);
create index if not exists shipment_events_occurred_idx on shipment_events (occurred_at desc);


-- 5. NDR CASES (Non-Delivery Reports)
create table if not exists ndr_cases (
  id           uuid        primary key default uuid_generate_v4(),
  shipment_id  uuid        not null references shipments (id) on delete cascade,
  attempt_no   int         not null default 1,
  reason       text,
  resolved     boolean     not null default false,
  action_taken text,
  created_at   timestamptz not null default now()
);

create index if not exists ndr_shipment_idx on ndr_cases (shipment_id);


-- 6. SHOP SETTINGS (Logistics & Checkout limits)
create table if not exists shop_settings (
  id                           int primary key default 1 check (id = 1),
  cod_enabled                  boolean not null default true,
  cod_max_amount               int     not null default 10000,
  cod_blocked_pincodes         text[]  not null default '{}',
  default_pickup_location_name text    not null default 'Primary Studio',
  ndr_max_attempts             int     not null default 3,
  return_window_days           int     not null default 7,
  updated_at                   timestamptz not null default now()
);

insert into shop_settings (id, cod_enabled, cod_max_amount, default_pickup_location_name)
values (1, true, 10000, 'Primary Studio')
on conflict (id) do nothing;


-- 7. PICKUP LOCATIONS CACHE
create table if not exists pickup_locations (
  id         uuid        primary key default uuid_generate_v4(),
  name       text        not null unique,
  pin        text        not null,
  address    text        not null,
  city       text        not null,
  state      text        not null,
  phone      text        not null,
  is_default boolean     not null default false,
  synced_at  timestamptz not null default now()
);

insert into pickup_locations (name, pin, address, city, state, phone, is_default)
values (
  'Primary Studio',
  '560038',
  '100ft Road, Indiranagar',
  'Bengaluru',
  'Karnataka',
  '+91 98765 43210',
  true
)
on conflict (name) do nothing;


-- 8. DATA MIGRATION: POPULATE NEW ORDER COLUMNS & ORDER_ITEMS
do $$
declare
  ord record;
  it jsonb;
  v_sku text;
  v_var_id uuid;
  v_unit_price int;
  v_qty int;
  v_shipment_id uuid;
begin
  -- 8a. Migrate existing orders to new statuses
  for ord in select * from orders loop
    update orders
    set
      payment_method = case
        when ord.status = 'pending' and (ord.razorpay_payment_id is null or ord.razorpay_payment_id = '') then 'cod'
        else 'razorpay'
      end,
      payment_status = case
        when ord.status = 'pending' and (ord.razorpay_payment_id is null or ord.razorpay_payment_id = '') then 'cod'
        when ord.status = 'cancelled' and ord.razorpay_payment_id is not null then 'refunded'
        when ord.status in ('paid', 'processing', 'shipped', 'delivered') then 'paid'
        else 'paid'
      end,
      delivery_status = case
        when ord.status in ('pending', 'paid', 'processing') then 'waiting_approval'
        when ord.status = 'shipped' then 'in_transit'
        when ord.status = 'delivered' then 'delivered'
        when ord.status = 'cancelled' then 'cancelled'
        else 'waiting_approval'
      end,
      fulfillment_mode = case
        when ord.tracking_number is not null and ord.tracking_number != '' then 'shiprocket'
        else null
      end,
      delivered_at = case
        when ord.status = 'delivered' then now()
        else null
      end,
      cancelled_at = case
        when ord.status = 'cancelled' then now()
        else null
      end
    where id = ord.id;

    -- 8b. Migrate items JSONB array into order_items
    if ord.items is not null and jsonb_typeof(ord.items) = 'array' then
      for it in select * from jsonb_array_elements(ord.items) loop
        -- Find variant ID if present
        v_var_id := null;
        if (it->>'variantId') is not null and (it->>'variantId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
          v_var_id := (it->>'variantId')::uuid;
        end if;

        v_sku := coalesce(it->>'sku', it->>'id', 'ITEM');
        v_unit_price := coalesce((it->>'price')::int, 0);
        v_qty := greatest(1, coalesce((it->>'qty')::int, (it->>'quantity')::int, 1));

        insert into order_items (
          order_id,
          variant_id,
          sku,
          name,
          unit_price,
          qty,
          image,
          weight_grams,
          length_cm,
          breadth_cm,
          height_cm
        ) values (
          ord.id,
          v_var_id,
          v_sku,
          coalesce(it->>'name', 'Handcrafted Object'),
          v_unit_price,
          v_qty,
          it->>'image',
          coalesce((it->>'weight_grams')::int, 500),
          coalesce((it->>'length_cm')::numeric, 15.0),
          coalesce((it->>'breadth_cm')::numeric, 10.0),
          coalesce((it->>'height_cm')::numeric, 5.0)
        );
      end loop;
    end if;

    -- 8c. If order has existing tracking number, insert initial forward shipment
    if ord.tracking_number is not null and ord.tracking_number != '' then
      insert into shipments (
        order_id,
        kind,
        awb,
        courier_name,
        handover_method,
        status,
        booking_step
      ) values (
        ord.id,
        'forward',
        ord.tracking_number,
        'Shiprocket Courier',
        'dropoff',
        case when ord.status = 'delivered' then 'delivered' else 'in_transit' end,
        'done'
      )
      returning id into v_shipment_id;

      -- Add initial tracking event
      insert into shipment_events (shipment_id, sr_status, mapped_status, location, occurred_at)
      values (
        v_shipment_id,
        'PICKED_UP',
        case when ord.status = 'delivered' then 'delivered' else 'in_transit' end,
        'Bengaluru Hub',
        now()
      )
      on conflict (shipment_id, sr_status, occurred_at) do nothing;
    end if;

  end loop;
end $$;
