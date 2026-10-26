-- ============================================================
-- Migration 003: Product Price History Ledger
-- Tracks history of cost price, regular selling price, and offer price
-- over time for historical analytics, margins, and graph plotting.
-- ============================================================

create table if not exists product_price_history (
  id            uuid        primary key default uuid_generate_v4(),
  product_id    text        not null references products (id) on delete cascade,
  cost_price    bigint,     -- in paise
  regular_price bigint      not null, -- in paise
  offer_price   bigint,     -- in paise, nullable if not on offer
  note          text,
  created_at    timestamptz not null default now()
);

create index if not exists price_history_product_idx on product_price_history (product_id);
create index if not exists price_history_created_idx on product_price_history (created_at desc);

-- Seed initial history record for existing products
insert into product_price_history (product_id, cost_price, regular_price, offer_price, note, created_at)
select
  id,
  cost_price,
  coalesce(compare_price, base_price),
  case when compare_price is not null and compare_price > base_price then base_price else null end,
  'Initial catalog price baseline',
  created_at
from products
on conflict do nothing;
