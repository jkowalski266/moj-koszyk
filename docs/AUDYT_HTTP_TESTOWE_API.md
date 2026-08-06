# Audyt testowego żądania HTTP

Akcja „Wyślij testowe podsumowanie do API” wykonuje żądanie do publicznego
endpointu testowego `https://httpbin.org/post`. Dane wejściowe są syntetyczne:
identyfikatory produktów, liczba produktów, suma w groszach i czas wysłania.
Nie zawierają danych osobowych ani sekretów.

## Surowy kształt żądania

```http
POST /post HTTP/1.1
Host: httpbin.org
Content-Type: application/json
X-Client-Name: moj-koszyk-demo

{
  "action": "synthetic-cart-summary",
  "product_ids": ["local-1", "local-2"],
  "product_count": 2,
  "total_cents": 2100,
  "requested_at": "2026-07-27T12:00:00.000Z"
}
```

Endpoint jest publicznym serwerem testowym, dlatego nie wymaga nagłówka
`Authorization`. Brak klucza w przeglądarce jest celowy. W odpowiedzi serwer
zwraca JSON potwierdzający metodę, nagłówki i otrzymane ciało żądania.

## Jak przechwycić request

1. Uruchom aplikację i otwórz DevTools (`F12`).
2. Otwórz zakładkę **Network** oraz filtr **Fetch/XHR**.
3. Dodaj produkt do koszyka i kliknij „Wyślij testowe podsumowanie do API”.
4. Wybierz request `post` do `httpbin.org`.
5. Sprawdź kolejno **Headers**, **Payload** i **Response**.

Przy późniejszym dodaniu LLM należy zachować ten sam podział odpowiedzialności:
przeglądarka wysyła dane do własnego backendu, a backend przechowuje i używa
klucza API. Klucz LLM nie może być dodany do zmiennych `VITE_*`.
