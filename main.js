import {
  supabase,
  supabaseConfigured,
} from './supabaseClient.js';
import produktyLokalne from './products.json';
import { dodajProdukt, obliczSumeGroszy } from './cart.js';

let koszyk = [];
const formatCeny = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
});

function formatujCene(cenaGrosze) {
  return formatCeny.format(cenaGrosze / 100);
}

function pobierzProduktyLokalne() {
  return produktyLokalne.map((produkt, indeks) => ({
    id: `local-${indeks + 1}`,
    name: produkt.nazwa,
    price_cents: Math.round(Number(produkt.cena) * 100),
    is_active: true,
    created_at: null,
  }));
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

  return data;
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
        error,
      );
    }
  }

  return {
    produkty: pobierzProduktyLokalne(),
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

    produkty.forEach((produkt) => {
      const przycisk = document.createElement('button');
      przycisk.className = 'produkt';
      przycisk.append(
        utworzSpan('produkt-nazwa', produkt.name),
        utworzSpan('produkt-cena', formatujCene(produkt.price_cents)),
      );
      przycisk.addEventListener('click', () => dodajDoKoszyka(produkt));
      listaProduktow.appendChild(przycisk);
    });

    ustawStatusDanych(`Źródło danych: ${zrodlo}`);
  } catch (error) {
    console.error('Nie udało się wczytać produktów.', error);
    ustawStatusDanych('Nie udało się wczytać produktów.', true);
  }
}

function dodajDoKoszyka(produkt) {
  koszyk = dodajProdukt(koszyk, produkt);
  pokazKoszyk();
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

  koszyk.forEach((produkt) => {
    const element = document.createElement('li');
    element.append(
      utworzSpan('', produkt.name),
      utworzSpan('', formatujCene(produkt.price_cents)),
    );
    listaKoszyka.appendChild(element);
  });

  const sumaGrosze = obliczSumeGroszy(koszyk);
  document.getElementById('suma').textContent = formatujCene(sumaGrosze);
}

async function wyslijPodsumowanieDoApi() {
  const statusApi = document.getElementById('status-api');

  if (koszyk.length === 0) {
    statusApi.textContent = 'Dodaj co najmniej jeden produkt do koszyka.';
    return;
  }

  const sumaGrosze = obliczSumeGroszy(koszyk);
  const payload = {
    action: 'synthetic-cart-summary',
    product_ids: koszyk.map((produkt) => produkt.id),
    product_count: koszyk.length,
    total_cents: sumaGrosze,
    requested_at: new Date().toISOString(),
  };

  statusApi.textContent = 'Wysyłanie syntetycznego podsumowania…';

  try {
    const odpowiedz = await fetch('https://httpbin.org/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Name': 'moj-koszyk-demo',
      },
      body: JSON.stringify(payload),
    });

    if (!odpowiedz.ok) {
      throw new Error(`API zwróciło status ${odpowiedz.status}`);
    }

    const odpowiedzJson = await odpowiedz.json();
    console.info('Odpowiedź testowego API:', odpowiedzJson);
    statusApi.textContent = `API potwierdziło żądanie (HTTP ${odpowiedz.status}).`;
  } catch (error) {
    console.error('Nie udało się wysłać podsumowania do API.', error);
    statusApi.textContent = 'Nie udało się połączyć z testowym API.';
  }
}

wczytajProdukty();
pokazKoszyk();
document
  .getElementById('wyslij-podsumowanie')
  .addEventListener('click', wyslijPodsumowanieDoApi);
