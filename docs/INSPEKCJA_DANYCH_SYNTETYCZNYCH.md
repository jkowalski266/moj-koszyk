# Inspekcja danych syntetycznych

## Zakres

Inspekcja objęła 12 rekordów z pliku `supabase/seed.sql`, przeznaczonych do
tabeli `public.products`. Jest to analiza lokalnego zestawu seedów; uruchomienie
migracji i kontrola tych samych danych w panelu Supabase wymagają zalogowanego
projektu Supabase.

## Wynik kontroli integralności

| Kontrola | Wynik |
| --- | --- |
| Liczba rekordów | 12 |
| Poprawne UUID v4 | 12 z 12 |
| Unikalne UUID | 12 z 12 |
| Poprawne timestampy UTC ISO 8601 | 12 z 12 |
| Rosnące znaczniki czasu | 12 z 12 |
| Unikalne nazwy bez rozróżniania wielkości liter | 12 z 12 |
| Ceny w dozwolonym zakresie | 12 z 12 |
| Rekordy aktywne | 10 |
| Rekordy nieaktywne | 2 |

Identyfikatory mają poprawny format UUID v4, np.
`10000000-0000-4000-8000-000000000001`. Kolumna `created_at` używa typu
`timestamptz`; każda wartość jest zapisana w UTC, np.
`2026-01-15T08:00:00Z`. Ceny są całkowitymi liczbami groszy (`integer`), co
eliminuje błędy zaokrągleń typowe dla wartości zmiennoprzecinkowych.

## Kontrola danych osobowych

Wszystkie rekordy opisują wyłącznie fikcyjne produkty, np. „Kawa”, „Herbata”
i „Chleb żytni”. Zestaw nie zawiera imion i nazwisk, adresów, adresów e-mail,
numerów telefonów, identyfikatorów klientów, danych logowania ani treści
powiązanych z prawdziwymi osobami. W kontrolowanym pliku seedów nie występują
dane osobowe.

## Przypadki skrajne

- `Próbka testowa` ma cenę `0` i status nieaktywny.
- `Produkt wycofany` jest nieaktywny, co pozwala sprawdzić politykę RLS.
- `Czekolada gorzka` ma cenę `1499`, czyli `14,99 zł`, co testuje obsługę
  groszy.
- Nazwy zawierają polskie znaki, m.in. „Chleb żytni”.

Polityka RLS z migracji pozwala klientowi przeglądarkowemu odczytywać wyłącznie
rekordy z `is_active = true`. Dzięki temu dwa rekordy testowe nie pojawią się
w widoku produktów aplikacji.
