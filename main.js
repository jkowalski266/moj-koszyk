import {
  supabase,
  supabaseConfigured,
} from './supabaseClient.js';
import produktyLokalne from './products.json';
import { dodajProdukt, obliczSumeGroszy } from './cart.js';

let koszyk = [];
const MAKSYMALNA_LICZBA_PRODUKTOW = 1_000;
const LIMIT_CZASU_API_MS = 30_000;
const formatCeny = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
});

function formatujCene(cenaGrosze) {
  return formatCeny.format(cenaGrosze / 100);
}

function pobierzProduktyLokalne() {
  if (!Array.isArray(produktyLokalne)) {
    throw new TypeError('Lokalny katalog produktów musi być tablicą.');
  }

  return produktyLokalne.map((produkt, indeks) => {
    if (
      produkt === null ||
      typeof produkt !== 'object' ||
      typeof produkt.nazwa !== 'string' ||
      typeof produkt.cena !== 'number'
    ) {
      throw new TypeError('Lokalny katalog zawiera niepoprawny produkt.');
    }

    return {
      id: `local-${indeks + 1}`,
      name: produkt.nazwa,
      price_cents: Math.round(produkt.cena * 100),
      is_active: true,
      created_at: null,
    };
  });
}

function sprawdzKatalog(produkty) {
  if (!Array.isArray(produkty)) {
    throw new TypeError('Katalog produktów musi być tablicą.');
  }

  if (produkty.length > MAKSYMALNA_LICZBA_PRODUKTOW) {
    throw new RangeError('Katalog produktów jest zbyt duży.');
  }

  const sprawdzoneProdukty = new Array(produkty.length);
  for (let indeks = 0; indeks < produkty.length; indeks += 1) {
    if (!Object.hasOwn(produkty, indeks)) {
      throw new TypeError('Katalog produktów nie może być tablicą rzadką.');
    }

    sprawdzoneProdukty[indeks] = dodajProdukt([], produkty[indeks])[0];
  }

  return sprawdzoneProdukty;
}

async function pobierzProduktyZSupabase() {
  const { data, error } = await supabase
    .from('products')
    .select('id,name,price_cents,is_active,created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Supabase: ${error.message}`);
  }

  return sprawdzKatalog(data);
}

async function pobierzProdukty() {
  if (supabaseConfigured) {
    try {
      return {
        produkty: await pobierzProduktyZSupabase(),
        zrodlo: 'Supabase',
      };
    } catch (error) {
      console.warn(
        'Nie udało się pobrać danych z Supabase. Używam danych lokalnych.',
      );
    }
  }

  return {
    produkty: sprawdzKatalog(pobierzProduktyLokalne()),
    zrodlo: 'lokalny katalog produktów',
  };
}

function ustawStatusDanych(tekst, czyBlad = false) {
  const status = document.getElementById('status-danych');
  status.textContent = tekst;
  status.classList.toggle('status-danych--blad', czyBlad);
}

function utworzSpan(klasa, tekst) {
  const span = document.createElement('span');
  span.className = klasa;
  span.textContent = tekst;
  return span;
}

async function wczytajProdukty() {
  const listaProduktow = document.getElementById('lista-produktow');
  listaProduktow.replaceChildren();
  ustawStatusDanych('Ładowanie produktów…');

  try {
    const { produkty, zrodlo } = await pobierzProdukty();

    for (const produkt of produkty) {
      const przycisk = document.createElement('button');
      przycisk.type = 'button';
      przycisk.className = 'produkt';
      przycisk.append(
        utworzSpan('produkt-nazwa', produkt.name),
        utworzSpan('produkt-cena', formatujCene(produkt.price_cents)),
      );
      przycisk.addEventListener('click', () => dodajDoKoszyka(produkt));
      listaProduktow.appendChild(przycisk);
    }

    ustawStatusDanych(`Źródło danych: ${zrodlo}`);
  } catch (error) {
    console.error('Nie udało się wczytać produktów.');
    ustawStatusDanych('Nie udało się wczytać produktów.', true);
  }
}

function dodajDoKoszyka(produkt) {
  try {
    koszyk = dodajProdukt(koszyk, produkt);
    pokazKoszyk();
  } catch {
    console.error('Odrzucono niepoprawny produkt lub osiągnięto limit koszyka.');
    ustawStatusDanych('Nie można dodać tego produktu do koszyka.', true);
  }
}

function pokazKoszyk() {
  const listaKoszyka = document.getElementById('lista-koszyka');
  listaKoszyka.replaceChildren();

  if (koszyk.length === 0) {
    const pustyKoszyk = document.createElement('li');
    pustyKoszyk.className = 'pusty';
    pustyKoszyk.textContent =
      'Koszyk jest pusty — kliknij produkt, aby dodać.';
    listaKoszyka.appendChild(pustyKoszyk);
  }

  for (const produkt of koszyk) {
    const element = document.createElement('li');
    element.append(
      utworzSpan('', produkt.name),
      utworzSpan('', formatujCene(produkt.price_cents)),
    );
    listaKoszyka.appendChild(element);
  }

  const sumaGrosze = obliczSumeGroszy(koszyk);
  document.getElementById('suma').textContent = formatujCene(sumaGrosze);
}

async function wyslijPodsumowanieDoApi() {
  const statusApi = document.getElementById('status-api');
  const przycisk = document.getElementById('wyslij-podsumowanie');

  if (koszyk.length === 0) {
    statusApi.textContent = 'Dodaj co najmniej jeden produkt do koszyka.';
    return;
  }

  const sumaGrosze = obliczSumeGroszy(koszyk);
  const productIds = new Array(koszyk.length);
  for (let indeks = 0; indeks < koszyk.length; indeks += 1) {
    productIds[indeks] = koszyk[indeks].id;
  }

  const payload = {
    action: 'synthetic-cart-summary',
    product_ids: productIds,
    product_count: koszyk.length,
    total_cents: sumaGrosze,
    requested_at: new Date().toISOString(),
  };

  statusApi.textContent = 'Wysyłanie syntetycznego podsumowania…';
  przycisk.disabled = true;
  const kontroler = new AbortController();
  const limitCzasu = setTimeout(() => kontroler.abort(), LIMIT_CZASU_API_MS);

  try {
    const odpowiedz = await fetch('https://httpbin.org/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Name': 'moj-koszyk-demo',
      },
      body: JSON.stringify(payload),
      signal: kontroler.signal,
    });

    if (!odpowiedz.ok) {
      throw new Error(`API zwróciło status ${odpowiedz.status}`);
    }

    statusApi.textContent = `API potwierdziło żądanie (HTTP ${odpowiedz.status}).`;
  } catch {
    console.error('Nie udało się wysłać podsumowania do API.');
    statusApi.textContent = kontroler.signal.aborted
      ? 'Testowe API nie odpowiedziało w wymaganym czasie.'
      : 'Nie udało się połączyć z testowym API.';
  } finally {
    clearTimeout(limitCzasu);
    przycisk.disabled = false;
  }
}

wczytajProdukty();
pokazKoszyk();
document
  .getElementById('wyslij-podsumowanie')
  .addEventListener('click', wyslijPodsumowanieDoApi);
