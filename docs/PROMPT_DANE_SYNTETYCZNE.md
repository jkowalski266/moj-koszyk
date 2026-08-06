# Prompt do generowania danych syntetycznych

Poniższy prompt został użyty jako specyfikacja rekordów zapisanych w
`supabase/seed.sql`.

## Dokładny prompt

```text
Jesteś generatorem bezpiecznych danych testowych dla PostgreSQL w Supabase.

Wygeneruj 12 całkowicie syntetycznych rekordów dla tabeli public.products:

- id: UUID, klucz główny,
- name: text, wartość wymagana, unikalna bez rozróżniania wielkości liter,
  po usunięciu spacji ma mieć od 2 do 100 znaków,
- price_cents: integer, wartość od 0 do 100000000, cena zapisana w groszach,
- is_active: boolean, wartość wymagana,
- created_at: timestamptz w formacie ISO 8601 i strefie UTC.

Wymagania bezpieczeństwa i integralności:
1. Nie używaj prawdziwych imion i nazwisk, adresów, e-maili, telefonów,
   firm ani innych danych osobowych.
2. Użyj nazw zwykłych produktów spożywczych. Wszystkie rekordy są fikcyjne.
3. Każdy identyfikator ma być unikalnym, poprawnym składniowo UUID v4.
4. Każda nazwa ma być unikalna także po zamianie liter na małe.
5. Zastosuj polskie znaki w co najmniej dwóch nazwach.
6. Uwzględnij cenę z końcówką groszową, która nie jest pełną złotówką.
7. Uwzględnij jeden nieaktywny rekord z ceną 0 jako przypadek graniczny.
8. Uwzględnij jeszcze jeden nieaktywny produkt, aby sprawdzić politykę RLS.
9. Znaczniki czasu mają być poprawne, rosnące i oddalone o jedną minutę.
10. Zwróć wyłącznie instrukcję SQL INSERT zgodną z PostgreSQL.
11. Instrukcja ma być powtarzalna: przy konflikcie identyfikatora ma
    aktualizować wartości zamiast tworzyć duplikat.

Przed zwróceniem SQL sprawdź wewnętrznie zgodność typów, unikalność UUID,
unikalność nazw, zakres cen i brak danych osobowych. Nie dodawaj komentarza
ani objaśnień do wyniku.
```

## Obsłużone przypadki skrajne

- cena `0` występuje wyłącznie w nieaktywnym rekordzie testowym,
- cena `1499` sprawdza poprawne przeliczenie groszy na `14,99 zł`,
- dwa rekordy nieaktywne weryfikują filtrowanie przez RLS,
- nazwy zawierają polskie znaki i mają różne długości,
- deterministyczne UUID oraz czasy ułatwiają powtarzalny reset bazy.

Wygenerowane dane nie opisują klientów ani innych osób. Są sztucznym
katalogiem produktów przeznaczonym wyłącznie do rozwoju i testów.
