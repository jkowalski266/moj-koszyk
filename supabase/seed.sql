insert into public.products (
  id,
  name,
  price_cents,
  is_active,
  created_at
)
values
  ('10000000-0000-4000-8000-000000000001', 'Kawa', 1200, true, '2026-01-15T08:00:00Z'),
  ('10000000-0000-4000-8000-000000000002', 'Herbata', 900, true, '2026-01-15T08:01:00Z'),
  ('10000000-0000-4000-8000-000000000003', 'Sok pomarańczowy', 1100, true, '2026-01-15T08:02:00Z'),
  ('10000000-0000-4000-8000-000000000004', 'Woda mineralna', 600, true, '2026-01-15T08:03:00Z'),
  ('10000000-0000-4000-8000-000000000005', 'Ciastko owsiane', 800, true, '2026-01-15T08:04:00Z'),
  ('10000000-0000-4000-8000-000000000006', 'Mleko owsiane', 1350, true, '2026-01-15T08:05:00Z'),
  ('10000000-0000-4000-8000-000000000007', 'Chleb żytni', 750, true, '2026-01-15T08:06:00Z'),
  ('10000000-0000-4000-8000-000000000008', 'Jabłka', 990, true, '2026-01-15T08:07:00Z'),
  ('10000000-0000-4000-8000-000000000009', 'Czekolada gorzka', 1499, true, '2026-01-15T08:08:00Z'),
  ('10000000-0000-4000-8000-000000000010', 'Zestaw śniadaniowy', 2599, true, '2026-01-15T08:09:00Z'),
  ('10000000-0000-4000-8000-000000000011', 'Próbka testowa', 0, false, '2026-01-15T08:10:00Z'),
  ('10000000-0000-4000-8000-000000000012', 'Produkt wycofany', 1999, false, '2026-01-15T08:11:00Z')
on conflict (id) do update
set
  name = excluded.name,
  price_cents = excluded.price_cents,
  is_active = excluded.is_active,
  created_at = excluded.created_at;
