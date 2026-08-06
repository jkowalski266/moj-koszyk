# Mój Koszyk

Prosta aplikacja sklepowa w JavaScript i Vite. Wyświetla katalog produktów,
pozwala dodawać produkty do koszyka, oblicza kwotę w złotych oraz może wysłać
syntetyczne podsumowanie do testowego API.

Ten plik jest jedynym źródłem prawdy o architekturze podczas zadania z tygodnia 4.
Jeżeli opis rozmowy, przypuszczenia agenta albo wcześniejsze materiały są z nim
sprzeczne, obowiązuje README.

## Uruchomienie

W katalogu projektu:

```powershell
npm install
npm run dev
```

Następnie otwórz adres pokazany przez Vite, zwykle `http://localhost:5173/`.

Kontrola produkcyjnego buildu:

```powershell
npm run build
```

Projekt używa modułów ECMAScript (`"type": "module"`). Kwoty pieniężne są
przechowywane jako całkowita liczba groszy, a formatowanie na PLN odbywa się
wyłącznie w warstwie interfejsu.

## Stan bazowy przed zadaniem z tygodnia 4

Stan został sprawdzony 3 sierpnia 2026 r.:

- build Vite kończy się powodzeniem;
- katalog lokalny zawiera pięć produktów;
- pusty koszyk pokazuje `0,00 zł`;
- Kawa za `12,00 zł` i Herbata za `9,00 zł` dają razem `21,00 zł`;
- ponowne dodanie Kawy tworzy trzecią pozycję i daje razem `33,00 zł`;
- wielokrotne dodawanie tego samego produktu jest dozwolonym zachowaniem;
- test przeglądarkowy nie wykazał błędów ani ostrzeżeń aplikacji.

Aktualnie `main.js` jest modułem złożonym. Odpowiada jednocześnie za pobieranie
danych, logikę koszyka, renderowanie DOM oraz komunikację HTTP. Plik `cart.js`
jeszcze nie istnieje. Jego utworzenie jest wybranym zadaniem implementacyjnym.

## Dekompozycja dużej funkcjonalności

### Zadanie A — katalog produktów

Odpowiedzialność:

- odczyt produktów z Supabase;
- użycie lokalnego `products.json` jako fallbacku;
- normalizacja danych do wspólnego formatu.

Dozwolone zależności: `supabaseClient.js`, `products.json`.

Zabronione zależności: DOM, stan koszyka, testowe API.

Proponowany przyszły moduł: `catalog.js`. Zadanie A nie jest implementowane
w ramach bieżącego ćwiczenia.

### Zadanie B — logika domenowa koszyka (wybrane)

Odpowiedzialność:

- dodanie poprawnego produktu do koszyka;
- obliczenie całkowitej wartości koszyka w groszach;
- walidacja danych mających wpływ na wynik finansowy;
- brak efektów ubocznych względem argumentów.

Dozwolone zależności: wyłącznie standardowy JavaScript.

Zabronione zależności: DOM, `fetch`, Supabase, pliki środowiskowe, formatowanie
waluty i szczegóły testowego API.

Plik docelowy: `cart.js`.

### Zadanie C — prezentacja i kontroler UI

Odpowiedzialność:

- tworzenie elementów DOM;
- renderowanie produktów i pozycji koszyka;
- formatowanie groszy jako PLN;
- obsługa kliknięć i komunikatów dla użytkownika.

Dozwolone zależności: publiczne interfejsy katalogu i koszyka.

Zabronione zależności: bezpośrednie zapytania do Supabase i implementacja reguł
obliczania sumy.

Proponowany przyszły moduł: `ui.js`. Zadanie C nie jest implementowane w ramach
bieżącego ćwiczenia.

### Zadanie D — integracja z testowym API

Odpowiedzialność:

- zbudowanie syntetycznego payloadu;
- wysłanie żądania HTTP;
- interpretacja statusu i błędów sieciowych.

Dozwolone zależności: gotowe dane wejściowe przekazane przez kontroler.

Zabronione zależności: DOM, Supabase i modyfikowanie stanu koszyka.

Proponowany przyszły moduł: `summaryApi.js`. Zadanie D nie jest implementowane
w ramach bieżącego ćwiczenia.

## Kierunek zależności

Obowiązuje jednokierunkowy przepływ:

```text
źródła danych -> kontroler main.js -> czysta logika cart.js
                              |
                              +-> DOM
                              +-> testowe API
```

`cart.js` jest modułem domenowym i nie zna żadnej warstwy zewnętrznej. `main.js`
może importować funkcje z `cart.js`, ale `cart.js` nie może importować `main.js`.

## Kontrakt danych produktu

Produkt przekazywany do modułu koszyka ma postać:

```js
{
  id: 'niepusty-identyfikator',
  name: 'Nazwa produktu',
  price_cents: 1200
}
```

Niezmienniki istotne dla koszyka:

- produkt jest zwykłym, niepustym obiektem;
- `id` jest niepustym ciągiem znaków po usunięciu białych znaków;
- `name` jest niepustym ciągiem znaków po usunięciu białych znaków;
- `price_cents` jest bezpieczną liczbą całkowitą;
- `price_cents` mieści się w zakresie od 0 do 100 000 000 groszy;
- wielokrotne wystąpienie tego samego `id` jest dozwolone i oznacza kolejną sztukę.

Moduł ma odrzucać niepoprawne dane za pomocą `TypeError` albo `RangeError`, a nie
próbować automatycznie zamieniać tekstu na liczbę lub poprawiać danych wejściowych.

## Publiczny kontrakt planowanego `cart.js`

```js
dodajProdukt(koszyk, produkt) -> nowaTablicaKoszyka
obliczSumeGroszy(koszyk) -> bezpiecznaLiczbaCałkowita
```

### `dodajProdukt(koszyk, produkt)`

- sprawdza, czy `koszyk` jest tablicą;
- sprawdza kontrakt produktu;
- nie modyfikuje wejściowej tablicy ani wejściowego obiektu produktu;
- zwraca nową tablicę z niezależną kopią danych produktu;
- zachowuje wcześniejsze pozycje;
- pozwala dodać ten sam produkt ponownie.

### `obliczSumeGroszy(koszyk)`

- sprawdza, czy argument jest tablicą;
- sprawdza każdą pozycję według kontraktu produktu;
- dla pustej tablicy zwraca `0`;
- nie modyfikuje tablicy ani produktów;
- zgłasza `RangeError`, jeśli wynik przekroczyłby bezpieczny zakres `Number`.

## Zamknięty zakres implementacji

W sterylnej sesji implementacyjnej wolno:

- utworzyć `cart.js`;
- wykonać minimalną integrację w `main.js` przez import funkcji, zastąpienie
  bezpośredniego `push` i zastąpienie ręcznego sumowania wywołaniem modułu.

Nie wolno wtedy zmieniać:

- `index.html`;
- `style.css`;
- `products.json`;
- `supabaseClient.js`;
- plików Supabase;
- adresu, nagłówków ani formatu żądania testowego API;
- `package.json` ani zależności;
- tekstów i wyglądu interfejsu poza zmianą konieczną do integracji.

## Kryteria akceptacji zadania B

1. Istnieje niezależny `cart.js` bez importów i efektów ubocznych.
2. `main.js` nie używa `koszyk.push(...)` i nie oblicza sumy własną pętlą ani
   własnym `reduce`.
3. Pusty koszyk nadal pokazuje `0,00 zł`.
4. Kawa i Herbata nadal dają `21,00 zł`.
5. Drugie dodanie Kawy nadal tworzy trzecią pozycję i sumę `33,00 zł`.
6. Niepoprawne ceny nie mogą prowadzić do `NaN`, konkatenacji tekstu ani kwoty
   ujemnej.
7. Mutacja oryginalnego produktu po dodaniu nie zmienia pozycji zapisanej w koszyku.
8. `npm run build` kończy się powodzeniem.
9. Pliki spoza zamkniętego zakresu pozostają bez zmian.

## Inżynieria czystego kontekstu

Po dekompozycji należy wykonać `/clear` albo otworzyć nową pustą sesję. Agent
implementujący otrzyma wyłącznie:

- ten `README.md` jako źródło prawdy o architekturze i kontrakcie;
- aktualny `main.js` jako punkt integracji;
- `package.json` jako opis środowiska uruchomieniowego.

Nie należy przekazywać historii rozmowy, poprzednich formularzy, CSS, migracji,
dokumentów z wcześniejszych tygodni ani kodu Supabase. Nie są one potrzebne do
zadania B i zwiększałyby ryzyko wyjścia poza zakres.

## Sekwencja promptów dekompozycyjnych

Poniższe prompty dokumentują logiczną sekwencję zastosowaną przed implementacją.

### Prompt 1 — identyfikacja odpowiedzialności

```text
Przeanalizuj dostarczone pliki aplikacji „Mój Koszyk”, przede wszystkim main.js.
Na tym etapie nie pisz kodu i nie modyfikuj plików.

Wypisz wszystkie odpowiedzialności realizowane przez main.js. Dla każdej wskaż:
1. dane wejściowe,
2. wynik,
3. zależności zewnętrzne,
4. efekty uboczne,
5. powiązania z innymi fragmentami aplikacji.

Na końcu wskaż miejsca, w których jeden moduł zna zbyt wiele szczegółów innych warstw.
```

### Prompt 2 — granice modułów

```text
Na podstawie poprzedniej analizy zaproponuj podział funkcjonalności na minimum
3 niezależne, luźno powiązane zadania implementacyjne.

Dla każdego zadania podaj:
- pojedynczą odpowiedzialność,
- proponowane pliki,
- publiczny interfejs modułu,
- dozwolone zależności,
- zależności zabronione,
- kryteria akceptacji,
- zakres, którego zadanie nie może zmieniać.

Zachowaj jednokierunkowy przepływ zależności:
źródło danych -> logika domenowa -> kontroler/UI.
Nie generuj jeszcze kodu.
```

### Prompt 3 — kontrakt wybranego modułu

```text
Wybieramy zadanie „wydzielenie czystej logiki domenowej koszyka”.

Przygotuj precyzyjny kontrakt modułu cart.js. Moduł:
- nie może używać DOM, fetch, Supabase ani zmiennych środowiskowych,
- ma operować na kwotach całkowitych w groszach,
- ma mieć jawne zachowanie dla niepoprawnych danych,
- nie może modyfikować przekazanych tablic i obiektów,
- musi dać się testować w Node.js bez przeglądarki.

Podaj sygnatury funkcji, niezmienniki, przypadki błędne i kryteria akceptacji.
Nie implementuj modułu.
```

### Prompt 4 — kontrola izolacji

```text
Wykonaj krytyczny przegląd zaproponowanego podziału. Spróbuj znaleźć ukryte
sprzężenia między modułem koszyka, DOM, katalogiem produktów i testowym API.

Jeżeli kontrakt wymaga korekty, przedstaw minimalną poprawkę. Następnie przygotuj
zamkniętą listę plików, które wolno zmienić podczas implementacji wybranego zadania.
Nie pisz kodu.
```

## Prompt inicjalizujący sesję po resecie

```text
Pracujesz nad aplikacją „Mój Koszyk” w sterylnej sesji.

README.md jest jedynym źródłem prawdy o architekturze, granicach modułów,
niezmiennikach i kryteriach akceptacji. Jeżeli kod i Twoje przypuszczenia są
sprzeczne z README, zatrzymaj się i zgłoś sprzeczność zamiast wymyślać rozwiązanie.

Dostępne pliki:
- README.md — obowiązujący kontrakt architektoniczny,
- main.js — istniejący punkt integracji,
- package.json — środowisko uruchomieniowe.

Cel: wydzielić z main.js czystą logikę koszyka do modułu cart.js i wykonać wyłącznie
minimalną integrację w main.js.

Wolno zmienić tylko:
- cart.js,
- main.js.

Nie wolno zmieniać HTML, CSS, konfiguracji Supabase, katalogu produktów,
komunikacji HTTP ani zależności projektu.

Najpierw streść własnymi słowami kontrakt, listę plików i kryteria akceptacji.
Nie pisz kodu, dopóki nie potwierdzę, że interpretacja jest poprawna.
```
