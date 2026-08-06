create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_cents integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint products_name_length
    check (char_length(trim(name)) between 2 and 100),
  constraint products_name_trimmed
    check (name = trim(name)),
  constraint products_price_cents_range
    check (price_cents between 0 and 100000000)
);

create unique index products_name_unique_ci
  on public.products (lower(name));

comment on table public.products is
  'Syntetyczny katalog produktów używany przez demonstracyjną aplikację.';

alter table public.products enable row level security;

revoke all on table public.products from anon, authenticated;
grant select on table public.products to anon, authenticated;
grant all on table public.products to service_role;

create policy "Public can read active products"
  on public.products
  for select
  to anon, authenticated
  using (is_active = true);
