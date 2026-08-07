# Mój Koszyk

Prosta aplikacja zakupowa zbudowana w JavaScript i Vite. Wyświetla katalog
produktów, pozwala dodawać pozycje do koszyka, oblicza sumę w PLN i wysyła
syntetyczne podsumowanie do testowego API.

## Uruchomienie

```powershell
npm install
npm run dev
```

Kontrola przed wydaniem:

```powershell
npm test
npm run build
```

Potok Vercel wykonuje oba polecenia automatycznie przed publikacją.

## Konfiguracja

Aplikacja może pobierać aktywne produkty z Supabase. Bez poprawnej konfiguracji
lub przy błędzie sieci używa lokalnego pliku `products.json`.

Skopiuj `.env.example` do lokalnego `.env` i uzupełnij wyłącznie:

- `VITE_SUPABASE_URL` — adres HTTPS projektu w domenie `supabase.co`;
- `VITE_SUPABASE_PUBLISHABLE_KEY` — publiczny klucz publishable Supabase.

Zmienne `VITE_*` trafiają do kodu przeglądarkowego i nie mogą zawierać sekretów.
Nie wolno tu umieszczać klucza `service_role`, hasła bazy, prywatnego tokenu API
ani innych danych poufnych. Pliki `.env` są ignorowane przez Git.

## Architektura

- `main.js` — pobranie i walidacja katalogu, kontroler oraz bezpieczne operacje DOM;
- `cart.js` — niezależna od DOM i sieci logika domenowa koszyka;
- `supabaseClient.js` — opcjonalny klient Supabase z walidacją publicznej konfiguracji;
- `products.json` — lokalny katalog awaryjny;
- `tests/` — testy kontraktu, Red Team i regresji bezpieczeństwa.

Kwoty są przechowywane jako całkowita liczba groszy. Formatowanie na PLN odbywa
się wyłącznie w interfejsie.

## Zabezpieczenia

- pełna walidacja `id`, `name` i `price_cents` przed użyciem danych;
- odrzucanie getterów, akcesorów, tablic rzadkich, zmienionych iteratorów i
  obiektów o nieoczekiwanym prototypie;
- bezpieczna głęboka kopia dodatkowych danych produktu oraz ochrona przed
  prototype pollution;
- kontrola przepełnienia `Number.MAX_SAFE_INTEGER`;
- limity katalogu, koszyka, sumowania, zagnieżdżenia i rozmiaru metadanych;
- obsługa błędnych rekordów bez przerwania działania interfejsu;
- renderowanie tekstu przez `textContent`, bez wykonywania HTML z danych;
- timeout żądania do testowego API i blokada wielokrotnego wysyłania;
- akceptowanie tylko adresu HTTPS Supabase oraz klucza publishable;
- nagłówki CSP, COOP, CORP, Permissions-Policy, Referrer-Policy, `nosniff` i
  blokada osadzania strony zdefiniowane w `vercel.json`;
- testy oraz build są obowiązkową bramką wdrożenia.

Bezpieczeństwo danych Supabase wymaga również włączonego RLS i minimalnej polityki
publicznego odczytu po stronie bazy. Frontend nie zastępuje tych zabezpieczeń.

## Stan weryfikacji

Audyt przed publikacją zakończył się następująco:

- 63/63 testów przechodzi, w tym wszystkie 52 testy Red Team z tygodnia 4;
- produkcyjny build Vite przechodzi i przetwarza 49 modułów;
- test przeglądarkowy potwierdza katalog awaryjny, koszyk `Kawa + Herbata = 21,00 zł`
  oraz odpowiedź testowego API HTTP 200;
- konsola przeglądarki nie zawiera błędów aplikacji;
- skan bieżących plików i historii Git nie wykrywa kluczy, haseł, tokenów,
  prywatnych adresów ani plików `.env`.

Historyczny raport z wykrycia problemów znajduje się w
`docs/AUDYT_RED_TEAM_TYDZIEN_4.md`. Opis ich naprawy i aktualnego stanu znajduje
się w `docs/AUDYT_BEZPIECZENSTWA_PRZED_PUBLIKACJA.md`.
