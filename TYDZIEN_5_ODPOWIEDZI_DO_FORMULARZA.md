# Tydzień 5 — odpowiedzi do formularza

Publiczny adres aplikacji: https://moj-koszyk.vercel.app

## 1. Automatyzacja potoku CI/CD

Wybraliśmy GitHub i Vercel. Repozytorium `jkowalski266/moj-koszyk` jest prywatne,
a instalacja aplikacji Vercel na GitHubie ma dostęp tylko do tego jednego
repozytorium. Gałęzią produkcyjną jest `main`.

Łańcuch zdarzeń wygląda następująco: wykonujemy lokalny commit i `git push` do
gałęzi `main`. GitHub zapisuje commit i wysyła zdarzenie do połączonej aplikacji
Vercel. Vercel identyfikuje repozytorium, gałąź, SHA i autora commita, pobiera
migawkę kodu do odizolowanego środowiska budowania, wykrywa projekt Vite,
instaluje zależności na podstawie plików projektu i uruchamia build produkcyjny.
Vite tworzy statyczne pliki w katalogu `dist`. Po poprawnym buildzie Vercel
publikuje wynik na niezmiennym adresie konkretnego wdrożenia, nadaje status
`Ready`, a następnie automatycznie przypisuje domenę
`https://moj-koszyk.vercel.app` do nowej wersji.

Test wykonaliśmy nieszkodliwym commitem dokumentacyjnym. Pierwsze zdarzenie
zostało poprawnie odebrane przez Vercel, ale zatrzymane przed buildem, ponieważ
lokalny adres e-mail autora commita nie był prawidłowym adresem powiązanym z
GitHubem. Panel pokazał status `Blocked` i komunikat `Fix Git Configuration`.
Ustawiliśmy adres GitHub `noreply` tylko w konfiguracji tego repozytorium i
wysłaliśmy pusty commit `e002937`. Tym razem potok uruchomił się automatycznie:
status przeszedł przez `Building` do `Ready`, cały deployment trwał 5 s, a log
Vite zawierał `vite v5.4.21 building for production`, `49 modules transformed`,
`built in 1.10s`, `Build Completed` i `Deployment completed`.

Połączenie z Supabase sprawdziliśmy po wdrożeniu na publicznym HTTPS. Aplikacja
pokazała `Źródło danych: Supabase` i 10 aktywnych produktów, w tym poprawne
polskie znaki. Dodanie Kawy i Herbaty dało 21,00 zł. Wysłanie syntetycznego
podsumowania do testowego API zakończyło się komunikatem `HTTP 200`. Produkcję
sprawdziliśmy w przeglądarce na komputerze oraz na drugim fizycznym urządzeniu —
telefonie. Na obu urządzeniach publiczny adres działał poprawnie.

## 2. Zderzenie ze środowiskiem produkcyjnym

Wybraliśmy zalecany scenariusz A, ponieważ dobrze pokazuje, że identyczny kod
może działać inaczej z powodu konfiguracji środowiska, a jednocześnie nie
wymaga celowego psucia kodu. Lokalny plik `.env` jest ignorowany przez Git i nie
został wysłany do repozytorium. Pierwsze wdrożenie wykonaliśmy bez zmiennych
`VITE_SUPABASE_URL` i `VITE_SUPABASE_PUBLISHABLE_KEY` w panelu Vercel.

Logi wdrożenia nie pokazały błędu kompilacji: Vite 5.4.21 przetworzył 49
modułów, utworzył katalog `dist`, a Vercel zakończył build i deployment ze
statusem `Ready`. Była to ważna wskazówka diagnostyczna — kod i kompilacja były
poprawne. Problem ujawnił się dopiero podczas działania aplikacji w
przeglądarce. Publiczna wersja wyświetlała `Źródło danych: lokalny katalog
produktów` i pięć pozycji z `products.json`, zamiast danych Supabase. Ponieważ
aplikacja ma zaprojektowany fallback, brak konfiguracji nie powoduje białej
strony ani błędu builda, lecz kontrolowane przejście na dane lokalne.

Naprawa polegała wyłącznie na konfiguracji otoczenia. Utworzyliśmy minimalny
projekt Supabase na planie Free w regionie West EU, zastosowaliśmy istniejącą
migrację i seed, włączyliśmy RLS oraz politykę publicznego odczytu aktywnych
produktów. W Vercel dodaliśmy dokładnie dwie wymagane zmienne wyłącznie dla
środowiska Production i wykonaliśmy redeploy tego samego commita. Po naprawie
publiczna aplikacja pokazała `Źródło danych: Supabase` i 10 aktywnych produktów.

Kod był identyczny, ale Vite wstawia zmienne `VITE_*` do paczki JavaScript w
momencie produkcyjnego builda. Na komputerze aplikacja mogła mieć lokalną
konfigurację, natomiast chmurowy proces budowania nie otrzymuje pliku `.env`
ignorowanego przez Git. Bez wartości Vercel zbudował wariant, w którym klient
Supabase nie był skonfigurowany, więc aplikacja świadomie użyła fallbacku.
Po dodaniu zmiennych i ponownym buildzie ten sam kod zawierał prawidłową
konfigurację środowiska produkcyjnego.

## 3. Audyt infrastruktury i plan awaryjny

Wybraliśmy Vercel, ponieważ dla małej aplikacji Vite zapewnia najprostszy potok:
bezpośrednią integrację z GitHubem, automatyczne rozpoznanie frameworka, build
bez własnego serwera, statyczny hosting z publicznym HTTPS, osobne niezmienne
adresy wdrożeń, czytelne logi i mechanizm Instant Rollback. Plan Hobby był
wystarczający do zadania i nie wymagał karty płatniczej. Nie potrzebowaliśmy
funkcji serwerowych ani osobnej usługi backendowej, ponieważ frontend łączy się
z Supabase przez publiczny klucz ograniczony przez RLS.

Test planu awaryjnego przeprowadziliśmy praktycznie. Najpierw utworzyliśmy
stabilne wdrożenie `7jFunXFvz…`, które korzystało z Supabase. Następnie
tymczasowo usunęliśmy dwie zmienne produkcyjne i wykonaliśmy redeploy tego
samego commita. Powstała wadliwa migawka `6CdZxV1He…`: build miał status
`Ready`, ale publiczna aplikacja ponownie pokazywała lokalny katalog. W panelu
otworzyliśmy poprzednią stabilną migawkę, wybraliśmy `Deployment Actions` →
`Instant Rollback`, wpisaliśmy powód i potwierdziliśmy `Confirm Rollback`.
Vercel bez ponownego budowania przepiął domenę produkcyjną do stabilnego
artefaktu. Po kilku sekundach adres publiczny ponownie pokazywał dane Supabase.

Po teście przywróciliśmy obie zmienne w ustawieniach Production i ponownie
włączyliśmy `Auto-assign Custom Production Domains`, aby następne commity z
`main` automatycznie trafiały na domenę produkcyjną. Potwierdził to commit
`e002937`: Vercel sam zbudował go w 5 s i oznaczył jako bieżące wdrożenie
`Ready`. Nasza procedura awaryjna brzmi: zatrzymać dalsze wydania, sprawdzić
logi i ostatni stabilny deployment, wykonać Instant Rollback z zapisanym
powodem, zweryfikować stronę oraz Supabase na publicznym HTTPS, poprawić
konfigurację lub kod przez Git, a po usunięciu przyczyny przywrócić automatyczne
przypisywanie domen. Nie edytujemy plików bezpośrednio na produkcji.
