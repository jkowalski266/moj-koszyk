# Odpowiedzi do formularza

## 1. Mapa błędów

1. **Błąd składni**
   - Surowy komunikat i ślad stosu:

     ```text
     main.js:55
     pokazKoszyk();
                 ^

     SyntaxError: missing ) after argument list
         at checkSyntax (node:internal/main/check_syntax:72:5)
     ```

   - Panel: **Terminal**.
   - Klasyfikacja: **składnia**.
   - Przyczyna: wywołanie `wczytajProdukty(` nie miało zamykającego nawiasu i średnika.

2. **Błąd wykonania**
   - Surowy komunikat i ślad stosu:

     ```text
     TypeError: Cannot set properties of null (setting 'textContent')
         at pokazKoszyk (http://127.0.0.1:5173/main.js:50:48)
         at http://127.0.0.1:5173/main.js:55:1
     ```

   - Panel: **Console**.
   - Klasyfikacja: **runtime**.
   - Przyczyna: JavaScript szukał elementu `id="total"`, podczas gdy HTML zawierał `id="suma"`.

3. **Błąd żądania danych**
   - Surowy trop z żądania wykonywanego przez aplikację:

     ```text
     GET http://127.0.0.1:5173/produkty.json
     HTTP/1.1 200 OK
     Content-Type: text/html
     ```

     Status `200` był mylący: serwer Vite zastosował fallback SPA i zamiast JSON-u zwrócił `index.html`. To samo żądanie z nagłówkiem `Accept: application/json` potwierdziło brak zasobu statusem `404 Not Found`. W Console skutkiem błędnej odpowiedzi było:

     ```text
     Uncaught (in promise) SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
     ```

   - Panel: **Network** (status/odpowiedź i błędny adres zasobu; Console pokazała tylko skutek parsowania).
   - Klasyfikacja: **sieć**.
   - Przyczyna: kod żądał `produkty.json`, a rzeczywisty plik nazywał się `products.json`.

4. **Błąd wyliczenia sumy**
   - Surowy komunikat: **brak komunikatu**.
   - Zły wynik: po dodaniu „Kawa” za 12 zł i „Herbata” za 9 zł koszyk zawierał obie pozycje, ale pole „Razem” pokazywało `0KawaHerbata zł` zamiast `21 zł`.
   - Panel: **Obserwacja wyniku**.
   - Klasyfikacja: **logika**.
   - Przyczyna: pętla dodawała `produkt.nazwa` zamiast `produkt.cena`.

## 2. Prompt naprawczy

Surowy tekst promptu:

```text
Przeanalizuj błąd runtime w aplikacji „Mój Koszyk”.

AKCJA: Uruchamiam projekt poleceniem npm run dev i otwieram http://127.0.0.1:5173/. Po załadowaniu strony wykonywana jest funkcja pokazKoszyk().

OCZEKIWANY WYNIK: Aplikacja ma wyświetlić pusty koszyk, ustawić pole „Razem” na 0 zł i kontynuować wczytywanie listy produktów bez wyjątków w Console.

WYNIK FAKTYCZNY:
TypeError: Cannot set properties of null (setting 'textContent')
    at pokazKoszyk (http://127.0.0.1:5173/main.js:50:48)
    at http://127.0.0.1:5173/main.js:55:1

Najpierw wykonaj wyłącznie diagnozę — nie generuj jeszcze kodu i nie modyfikuj plików. Wskaż miejsce awarii, przedstaw co najmniej dwie hipotezy przyczyny w kolejności od najbardziej prawdopodobnej oraz opisz, jak zweryfikujesz każdą z nich w HTML, JavaScript i DevTools. Następnie wskaż najbardziej prawdopodobną przyczynę i zaproponuj minimalny zakres poprawki. Kod lub diff pokaż dopiero w drugiej części odpowiedzi, po wyraźnym oddzieleniu go od analizy. Po zmianie podaj test potwierdzający, że błąd zniknął i że pole „Razem” nadal działa.
```

Kontekst został ułożony zgodnie z ramą **akcja → oczekiwany wynik → wynik faktyczny**: opisałem sposób odtworzenia awarii, poprawny stan UI oraz wkleiłem pełny, surowy wyjątek wraz ze stosem. Polecenie „najpierw wykonaj wyłącznie diagnozę” oraz wymaganie co najmniej dwóch uporządkowanych hipotez z testami wymusiły analizę przed propozycją zmiany. Dodatkowo ograniczenie do minimalnego zakresu poprawki zapobiegało przypadkowemu przebudowaniu działających fragmentów aplikacji.

## 3. Git jako wehikuł czasu

Najpierw zapisałem niezmieniony, uszkodzony projekt jako punkt odniesienia. Następnie po każdej minimalnej poprawce ponownie uruchamiałem właściwy test i dopiero po jego powodzeniu tworzyłem commit. Historia wygląda następująco:

1. `6e8196b chore: zapisz stan początkowy uszkodzonej aplikacji` — czysty punkt startowy przed śledztwem.
2. `bd501b7 fix: napraw błąd składni uruchamiania aplikacji` — po pozytywnym `node --check main.js`.
3. `ffdad4d fix: użyj poprawnego pola sumy koszyka` — po zniknięciu `TypeError` z Console.
4. `f3365fe fix: pobieraj istniejący plik products.json` — po wyświetleniu wszystkich pięciu produktów i braku błędów parsowania JSON.
5. `bf79f3a fix: sumuj ceny produktów zamiast ich nazw` — po uzyskaniu poprawnej sumy `46 zł` dla wszystkich pięciu produktów.
6. `3dd3d25 chore: ignoruj zależności i artefakty buildu` — porządkowy checkpoint utrzymujący czysty stan repozytorium.

Małe, tematyczne commity pozwalały testować jedną hipotezę naraz i natychmiast porównywać zmianę z ostatnim działającym etapem. Dzięki temu ryzyko eksperymentu ograniczało się do jednego pliku i jednej poprawki, a powrót do checkpointu był prosty.

Nie wystąpiła konieczność użycia `git restore`: żadna błędna modyfikacja kodu nie pozostała w katalogu roboczym. Przed każdym commitem sprawdzałem diff i zachowanie aplikacji. Gdyby test nie przeszedł, planowanym mechanizmem cofnięcia było `git restore main.js`, a następnie doprecyzowanie promptu o nowy komunikat i wynik testu.
