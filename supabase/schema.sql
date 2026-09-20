-- ============================================================
-- Rastahse — Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the database.
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Order Status Enum ───────────────────────────────────────────────────────
do $$ begin
  create type order_status as enum (
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
  );
exception
  when duplicate_object then null;
end $$;

-- ─── Orders ──────────────────────────────────────────────────────────────────
-- One row per order. Items stored as JSONB array of {product_id, name, price, qty, image}.
create table if not exists orders (
  id                   uuid primary key default uuid_generate_v4(),
  created_at           timestamptz not null default now(),
  user_id              uuid references auth.users(id) on delete set null,
  email                text not null,
  phone                text,
  status               order_status not null default 'pending',
  items                jsonb not null,
  subtotal             numeric(10, 2) not null,
  shipping_fee         numeric(10, 2) not null default 0,
  total                numeric(10, 2) not null,
  shipping_address     jsonb not null,
  razorpay_order_id    text unique,
  razorpay_payment_id  text unique,
  shiprocket_order_id  text,
  tracking_number      text,
  notes                text
);

-- Indexes
create index if not exists orders_user_id_idx on orders(user_id);
create index if not exists orders_email_idx on orders(email);
create index if not exists orders_status_idx on orders(status);
create index if not exists orders_razorpay_order_id_idx on orders(razorpay_order_id);

-- RLS
alter table orders enable row level security;

-- Users can read their own orders (by auth user id)
create policy "Users read own orders"
  on orders for select
  using (auth.uid() = user_id);

-- Guest orders readable by email match (requires service role for lookups)
-- Orders insertable by anyone (guest checkout)
create policy "Anyone can place an order"
  on orders for insert
  with check (true);

-- ─── Wishlists ───────────────────────────────────────────────────────────────
create table if not exists wishlists (
  id          uuid primary key default uuid_generate_v4(),
  created_at  timestamptz not null default now(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  product_id  text not null,
  unique(user_id, product_id)
);

create index if not exists wishlists_user_id_idx on wishlists(user_id);

alter table wishlists enable row level security;

create policy "Users manage own wishlist"
  on wishlists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Contact Messages ─────────────────────────────────────────────────────────
create table if not exists contact_messages (
  id          uuid primary key default uuid_generate_v4(),
  created_at  timestamptz not null default now(),
  name        text not null,
  email       text not null,
  subject     text,
  message     text not null,
  replied     boolean not null default false
);

alter table contact_messages enable row level security;

-- Only service role / admin can read messages
-- Anon can insert (submit contact form)
create policy "Anyone can submit a contact message"
  on contact_messages for insert
  with check (true);

-- ─── Helper: Get order by Razorpay order id ───────────────────────────────────
create or replace function get_order_by_razorpay_id(p_razorpay_order_id text)
returns setof orders
language sql
security definer
as $$
  select * from orders where razorpay_order_id = p_razorpay_order_id limit 1;
$$;
