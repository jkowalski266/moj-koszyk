# Audyt Red Team — tydzień 4

> Status historyczny. Wszystkie opisane niżej problemy zostały naprawione przed
> publikacją. Aktualny wynik to 52/52 testów z tego pliku oraz 63/63 testów
> łącznie. Szczegóły: `AUDYT_BEZPIECZENSTWA_PRZED_PUBLIKACJA.md`.

## Zakres i separacja ról

Audyt przeprowadzono w osobnej sesji po zakończeniu implementacji `cart.js`.
Agent-Tester otrzymał prawo utworzenia wyłącznie `tests/cart.test.js` oraz zakaz
modyfikowania kodu produkcyjnego, README, manifestu zależności i konfiguracji.
Skróty SHA-256 plików chronionych były identyczne przed i po audycie.

## Wynik automatyczny

Polecenie:

```text
node --test tests/cart.test.js
```

Systemowy Node nie był dostępny, dlatego użyto dołączonego Node.js bez instalowania
pakietów. Wynik został następnie niezależnie odtworzony:

- testy: 52;
- zaliczone: 41;
- niezaliczone: 11;
- pominięte: 0;
- kod wyjścia: 1;
- SHA-256 `tests/cart.test.js`:
  `2F7C932E78C0118C1BE259E6A860E5C49B2C93661281298FFE34D40D6FD300ED`.

## Struktura testu

Test używa wyłącznie `node:test` oraz `node:assert/strict`. Każdy przypadek ma
opis zachowania biznesowego i układ Arrange–Act–Assert. Testy tabelaryczne
sprawdzają klasy niepoprawnych danych, a osobne testy adversarial kontrolują
tablice rzadkie, nadpisane metody, gettery i mutacje referencji.

Przykładowy schemat:

```js
test('sumowanie odrzuca tablicę rzadką zamiast pomijać puste miejsce', () => {
  // Arrange
  const koszyk = new Array(2);
  koszyk[1] = poprawnyProdukt({ price_cents: 100 });

  // Act
  const akcja = () => obliczSumeGroszy(koszyk);

  // Assert
  assert.throws(akcja, TypeError);
});
```

## Co działa prawidłowo

Zaliczone przypadki potwierdziły między innymi:

- sumę pustego koszyka, jednego produktu, wielu produktów i duplikatów;
- akceptację ceny 0 oraz maksymalnej ceny domenowej;
- odrzucanie wartości tekstowych, `NaN`, `Infinity`, ułamków i cen ujemnych;
- odrzucanie brakujących pól oraz obiektów innych niż zwykły obiekt;
- brak bezpośredniej mutacji argumentów;
- niezależność podstawowych pól po zmianie obiektu źródłowego;
- poprawne zsumowanie 100 000 pozycji;
- brak wykonania HTML z nazwy produktu; UI używa `textContent`.

## Potwierdzone naruszenia kontraktu

Niezależna weryfikacja potwierdziła dziewięć naruszeń:

1. `forEach` pomija puste miejsca w tablicy rzadkiej, dlatego nie każda pozycja
   jest walidowana.
2. Własne `koszyk.forEach` może całkowicie pominąć walidację i zwrócić sumę 0.
3. Operator spread korzysta z nadpisanego iteratora tablicy, więc wcześniejsza
   pozycja może zostać podmieniona podczas dodawania produktu.
4. Zmienny getter `id` może zwrócić poprawną wartość podczas walidacji, a białe
   znaki podczas kopiowania.
5. Zmienny getter ceny może po walidacji zwrócić `NaN`.
6. Zmienny getter ceny może po walidacji zwrócić tekst i wywołać konkatenację.
7. Zmienny getter ceny może po walidacji zwrócić wartość ujemną.
8. Zmienny getter ceny może po walidacji zwrócić wartość przekraczającą bezpieczny
   zakres `Number`.
9. Wymagane, ale niewyliczalne pola przechodzą walidację, po czym spread ich nie
   kopiuje i tworzy pozycję bez `id`, `name` oraz `price_cents`.

Najpoważniejszą klasą błędów jest TOCTOU: kod wielokrotnie odczytuje właściwość,
więc wartość sprawdzona i wartość użyta w obliczeniu nie muszą być identyczne.

## Dwa przypadki niejednoznaczne

Nie należy przedstawiać wszystkich 11 testów jako bezspornych błędów:

- README wymaga „niezależnej kopii danych produktu”, ale nie rozstrzyga jasno,
  czy dodatkowe zagnieżdżone pola, np. `metadata`, wymagają kopii głębokiej;
- README wymaga `TypeError` lub `RangeError` dla niepoprawnych danych, ale nie
  określa jednoznacznie, czy zwykły `Error` rzucony wewnątrz gettera ma zostać
  opakowany w błąd kontraktu.

Te wyniki są wartościowymi lukami specyfikacji, a nie pewnymi regresjami.

## Ocena bezpieczeństwa w kontekście aplikacji

- Integralność obliczeń jest zagrożona, jeśli moduł otrzyma adversarialne obiekty
  JavaScript albo tablicę z nadpisanymi metodami.
- W obecnej aplikacji ekspozycja jest ograniczona: JSON i Supabase zwykle zwracają
  zwykłe rekordy danych, bez getterów i funkcji. Waga błędu modułu jest więc większa
  niż jego aktualna osiągalność z interfejsu.
- `main.js` nie przechwytuje wyjątku z `dodajProdukt` w obsłudze kliknięcia. Wadliwy
  rekord z Supabase może więc spowodować niekontrolowany błąd UI.
- Brak limitu liczby pozycji oraz pełne kopiowanie, sumowanie i renderowanie po
  każdym dodaniu tworzą ryzyko narastającego kosztu zbliżonego do O(n²).
- Wstrzyknięcie HTML przez nazwę produktu nie zostało potwierdzone, ponieważ UI
  przypisuje nazwę przez `textContent`.

## Decyzja po audycie

Kod produkcyjny nie został naprawiony w sesji testera. Zachowano separację ról i
pozostawiono niezaliczone testy jako odtwarzalny dowód dla raportu. Ewentualna
naprawa powinna być osobnym, późniejszym zadaniem implementacyjnym.
