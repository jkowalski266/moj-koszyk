# Tydzień 4 — odpowiedzi do formularza

## 1. Dekompozycja modułu w praktyce

Wybraliśmy złożony `main.js`, który łączył cztery odpowiedzialności: (A) katalog
produktów — Supabase, lokalny fallback i normalizacja; (B) logikę koszyka — dodanie
pozycji, walidacja i suma; (C) prezentację — DOM, komunikaty i format PLN; (D)
integrację HTTP — payload, `fetch` i obsługa odpowiedzi. Do implementacji wybraliśmy
B jako `cart.js`, ponieważ może być czystym modułem bez DOM, sieci i bazy danych.

Sekwencja promptów:

```text
PROMPT 1
Przeanalizuj dostarczone pliki aplikacji „Mój Koszyk”, przede wszystkim main.js.
Nie pisz kodu. Wypisz odpowiedzialności main.js, a dla każdej wskaż dane wejściowe,
wynik, zależności, efekty uboczne i powiązania. Wskaż miejsca, w których moduł zna
zbyt wiele szczegółów innych warstw.

PROMPT 2
Na podstawie analizy zaproponuj minimum 3 niezależne, luźno powiązane zadania.
Dla każdego podaj odpowiedzialność, pliki, publiczny interfejs, dozwolone i
zabronione zależności, kryteria akceptacji oraz zakres wyłączony. Zachowaj
jednokierunkowy przepływ: źródło danych -> logika domenowa -> kontroler/UI.
Nie generuj kodu.

PROMPT 3
Wybieramy wydzielenie czystej logiki koszyka. Przygotuj kontrakt cart.js. Moduł
nie może używać DOM, fetch, Supabase ani zmiennych środowiskowych; operuje na
całkowitych groszach, jawnie odrzuca błędne dane, nie mutuje argumentów i daje się
testować w Node.js. Podaj sygnatury, niezmienniki i kryteria. Nie implementuj.

PROMPT 4
Wykonaj krytyczny przegląd podziału i znajdź ukryte sprzężenia między koszykiem,
DOM, katalogiem i API. Następnie podaj zamkniętą listę plików, które wolno zmienić.
Nie pisz kodu.
```

Powstały granice: `cart.js` nie importuje niczego, a `main.js` wyłącznie wywołuje
jego interfejs. Implementacja mogła zmienić tylko `cart.js` i minimalnie `main.js`.
Katalog, UI, Supabase i HTTP pozostały poza zakresem, co zapobiegło „przy okazji”
refaktoryzowaniu całej aplikacji. Skróty SHA-256 potwierdziły brak innych zmian.

## 2. Zarządzanie oknem kontekstu

Po dekompozycji zaktualizowaliśmy README, wykonaliśmy nową sesję i przekazaliśmy
wyłącznie `README.md`, `main.js` oraz `package.json`. README było jedynym źródłem
prawdy: zawierało mapę modułów, format produktu, kontrakt obu funkcji, zakazane
zależności, zamknięty zakres plików i kryteria akceptacji. `main.js` był potrzebny
tylko jako punkt integracji, a `package.json` określał ESM i narzędzia. Nie
przekazaliśmy CSS, migracji, poprzednich formularzy ani historii rozmowy.

Pierwszy prompt po resecie:

```text
Pracujesz nad aplikacją „Mój Koszyk” w sterylnej sesji. README.md jest jedynym
źródłem prawdy o architekturze, granicach i kryteriach. Gdy kod lub przypuszczenia
są sprzeczne z README, zatrzymaj się i zgłoś sprzeczność.

Dostępne pliki: README.md — kontrakt; main.js — punkt integracji; package.json —
środowisko. Cel: wydzielić logikę koszyka do cart.js i wykonać minimalną integrację
w main.js. Wolno zmienić tylko cart.js i main.js. Nie zmieniaj HTML, CSS, Supabase,
katalogu produktów, HTTP ani zależności. Najpierw streść kontrakt, listę plików i
kryteria. Nie pisz kodu, dopóki nie potwierdzę interpretacji.
```

Agent najpierw poprawnie powtórzył kontrakt, a implementację dostał dopiero po
akceptacji. Zmienił dwa dozwolone pliki; build przeszedł, a test UI zachował sumy
0,00 zł, 21,00 zł i 33,00 zł. Nie wystąpiło zapętlenie ani nadpisywanie działającego
kodu. Problemem było jedynie niedostępne systemowe `node`; rozwiązano go przez
dołączone środowisko bez instalowania pakietów. Selekcja kontekstu była kluczowa,
bo agent nie miał materiałów zachęcających do zmian w Supabase, CSS lub API.

## 3. Procedura Red Team i testy automatyczne

Prompt użyty w oddzielnej sesji Testera:

```text
Wciel się w rolę niezależnego, rygorystycznego Agenta-Testera Red Team aplikacji
„Mój Koszyk”.

KONTEKST:
- README.md jest jedynym źródłem prawdy o kontrakcie i architekturze.
- cart.js jest gotową funkcjonalnością podlegającą testom.
- main.js można odczytać wyłącznie w celu audytu integracji.
- package.json opisuje środowisko uruchomieniowe.

BEZWZGLĘDNE OGRANICZENIA:
- nie edytuj cart.js, main.js, README.md ani package.json;
- nie zmieniaj HTML, CSS, produktów, Supabase ani pozostałych plików;
- nie instaluj pakietów, nie generuj poprawek i nie naprawiaj kodu produkcyjnego.

Wolno Ci wyłącznie utworzyć tests/cart.test.js, użyć wbudowanych node:test oraz
node:assert/strict, uruchomić testy i przedstawić tekstowy raport. Przed pracą
zapisz SHA-256 README.md, cart.js, main.js, package.json, products.json,
index.html, style.css i supabaseClient.js.

Sprawdź co najmniej: pusty koszyk; jeden i kilka produktów; duplikaty; cenę 0 i
maksymalną; koszyk niebędący tablicą; produkt null, tablicę, Date, instancję klasy
i pusty obiekt; brak id, name lub price_cents; białe znaki; cenę jako tekst, NaN,
Infinity, ułamek, wartość ujemną i ponad limit; brak mutacji argumentów; mutację
produktu źródłowego; błędne pozycje podczas sumowania; tablicę rzadką; dużą liczbę
pozycji; granicę bezpiecznego Number i dodatkowe przypadki adversarial.

Sprawdź też możliwość obejścia walidacji przez nietypową tablicę, iterator lub
nadpisane metody; gettery zmieniające wartość; NaN, konkatenację, wartość ujemną i
przepełnienie; współdzielone referencje; niekontrolowany wyjątek z Supabase; DoS;
wstrzyknięcie do UI i spójność payloadu API.

Stosuj Arrange–Act–Assert i nazwy zachowań. Oczekiwania wyprowadzaj z README, nie
z implementacji. Uruchom: node --test tests/cart.test.js. W raporcie rozdziel:
A. testy przechodzące, B. nieprzechodzące, C. błędy logiczne, D. ryzyka,
E. niejednoznaczności. Dla każdego błędu podaj nazwę, wejście, wynik oczekiwany,
faktyczny i poziom ryzyka. Na końcu ponownie policz SHA-256 i potwierdź, że zmienił
się tylko tests/cart.test.js. Zatrzymaj się bez naprawiania kodu.
```

Test ma 52 przypadki w `node:test`, używa `assert/strict`, nazw zachowań i układu
Arrange–Act–Assert. Wynik: 41 zaliczonych i 11 niezaliczonych. Dziewięć wyników
potwierdziło luki kontraktu: `forEach` pomija dziury i można go nadpisać; spread
ufa nadpisanemu iteratorowi; wielokrotne odczyty getterów pozwalają po walidacji
podmienić `id` albo cenę na NaN, tekst, wartość ujemną lub niebezpiecznie dużą;
spread gubi wymagane pola niewyliczalne. Dwa wyniki ujawniły niejasność specyfikacji:
czy kopiować głęboko dodatkowe `metadata` i czy opakowywać błąd rzucony przez getter.
Ryzyko integralności modułu jest wysokie dla wrogich obiektów JS, ale w bieżącym UI
osiągalność jest mniejsza, bo JSON/Supabase dostarczają zwykłe rekordy. Test HTML
potwierdził ochronę przez `textContent`. Tester nie zmienił kodu produkcyjnego.
