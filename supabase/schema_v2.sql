-- ============================================================
-- Rastahse — Supabase Schema v2
-- Run this in your Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- ─── Profiles ─────────────────────────────────────────────────────────────────
-- One row per auth.users row. Auto-created via trigger.
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  display_name  text,
  phone         text,
  is_admin      boolean not null default false
);

alter table profiles enable row level security;

-- Users can read & update their own profile
create policy "Users read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Service role can read all profiles (for admin queries)
-- (service role bypasses RLS by default — no policy needed)

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, phone, display_name)
  values (
    new.id,
    new.phone,
    coalesce(new.raw_user_meta_data->>'display_name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Update orders RLS to also allow phone-matched lookups ────────────────────
-- Drop and recreate the select policy to include phone match
drop policy if exists "Users read own orders" on orders;

create policy "Users read own orders"
  on orders for select
  using (
    auth.uid() = user_id
    or (
      phone is not null
      and phone = (
        select p.phone from profiles p where p.id = auth.uid() limit 1
      )
    )
  );

-- ─── Product Overrides ────────────────────────────────────────────────────────
-- Admin-editable overrides for products defined in code.
-- product_id matches the id field in src/lib/products.ts
create table if not exists product_overrides (
  product_id            text primary key,
  price_override        numeric(10, 2),
  description_override  text,
  in_stock              boolean not null default true,
  updated_at            timestamptz not null default now()
);

alter table product_overrides enable row level security;

-- Anyone can read overrides (to display current price/stock)
create policy "Anyone reads product overrides"
  on product_overrides for select
  using (true);

-- Only service role can write (admin actions use service role key)
-- No insert/update/delete policies needed — service role bypasses RLS

-- ─── Helper: is current user an admin? ────────────────────────────────────────
create or replace function is_admin()
returns boolean
language sql
security definer
as $$
  select coalesce(
    (select is_admin from profiles where id = auth.uid() limit 1),
    false
  );
$$;
