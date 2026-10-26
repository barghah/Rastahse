-- ============================================================
-- Migration 004: Customer Addresses & Multi-Address Management
-- Allows customers to save up to 3 delivery addresses (e.g. Home, Work, Studio)
-- for fast checkout and profile management.
-- ============================================================

create table if not exists customer_addresses (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  label       text        not null default 'Home', -- e.g. Home, Work, Studio, Other
  full_name   text        not null,
  phone       text        not null,
  line1       text        not null,
  line2       text,
  city        text        not null,
  state       text        not null,
  pincode     text        not null,
  is_default  boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index for speedy address lookups per customer
create index if not exists customer_addresses_user_idx on customer_addresses (user_id);

-- Enforce max 3 addresses per user via trigger
create or replace function check_max_customer_addresses()
returns trigger as $$
begin
  if (select count(*) from customer_addresses where user_id = new.user_id and id != coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)) >= 3 then
    raise exception 'You can save a maximum of 3 delivery addresses.';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists enforce_max_customer_addresses on customer_addresses;
create trigger enforce_max_customer_addresses
  before insert on customer_addresses
  for each row execute function check_max_customer_addresses();

-- Enable Row Level Security (RLS)
alter table customer_addresses enable row level security;

-- Policies: customers can only view and modify their own addresses
create policy "Customers can view their own addresses"
  on customer_addresses for select
  using (auth.uid() = user_id);

create policy "Customers can insert their own addresses"
  on customer_addresses for insert
  with check (auth.uid() = user_id);

create policy "Customers can update their own addresses"
  on customer_addresses for update
  using (auth.uid() = user_id);

create policy "Customers can delete their own addresses"
  on customer_addresses for delete
  using (auth.uid() = user_id);

-- Updated_at auto trigger
create or replace function update_customer_address_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_customer_address_timestamp on customer_addresses;
create trigger set_customer_address_timestamp
  before update on customer_addresses
  for each row execute function update_customer_address_timestamp();
