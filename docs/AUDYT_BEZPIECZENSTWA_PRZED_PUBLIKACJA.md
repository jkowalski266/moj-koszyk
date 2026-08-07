# Audyt bezpieczeństwa przed publikacją

Data weryfikacji: 7 sierpnia 2026 r.

## Wynik

Aplikacja przeszła lokalny audyt kodu, danych, historii Git, zależności, testów i
produkcjnego buildu. Wszystkie 52 testy Red Team z tygodnia 4 oraz 11 dodatkowych
testów regresji bezpieczeństwa przechodzą — łącznie 63/63.

Nie znaleziono w bieżących plikach ani osiągalnej historii Git rzeczywistych
kluczy API, tokenów GitHub, JWT, haseł bazy, kluczy prywatnych, produkcyjnego
adresu Supabase, plików `.env` ani lokalnych ścieżek użytkownika. Wartości w
`.env.example` są wyłącznie jawnymi placeholderami.

## Usunięte problemy Red Team

- tablice rzadkie nie mogą ominąć walidacji;
- nadpisane `forEach` i iteratory nie wpływają na kopiowanie ani sumowanie;
- wymagane pola są odczytywane w sposób odporny na TOCTOU;
- gettery i inne akcesory są odrzucane bez wykonywania ich kodu;
- pola niewyliczalne są poprawnie kopiowane;
- dodatkowe dane są kopiowane głęboko w kontrolowanym formacie;
- wyjątki pochodzące z obiektów wejściowych są normalizowane do błędów kontraktu.

## Dodatkowe zabezpieczenia

- limit 1000 produktów w katalogu i 500 pozycji dostępnych z interfejsu;
- limit 100 000 pozycji dla funkcji sumującej;
- limity liczby pól, głębokości i rozmiaru tablic w metadanych;
- ochrona przed prototype pollution oraz odrzucanie symboli i nietypowych
  prototypów;
- kontrolowana obsługa wadliwego rekordu katalogu w UI;
- timeout 30 sekund i blokada przycisku podczas żądania do testowego API;
- brak wyświetlania surowych odpowiedzi i szczegółów błędów z usług zewnętrznych;
- walidacja adresu i rodzaju publicznego klucza Supabase;
- polityka nagłówków bezpieczeństwa dla wdrożenia Vercel;
- `npm test` i `npm run build` jako obowiązkowa bramka CI/CD.

## Granice audytu

Żadna aplikacja internetowa nie może otrzymać bezwarunkowej gwarancji
bezpieczeństwa. Klucz publishable Supabase jest z definicji widoczny w
przeglądarce, dlatego dostęp do danych musi być ograniczony przez RLS. Sekrety
serwerowe nie mogą być używane w tej aplikacji frontendowej. Po wdrożeniu należy
ponownie sprawdzić nagłówki odpowiedzi HTTPS, konfigurację RLS, logi Vercel i
działanie produkcyjne.
