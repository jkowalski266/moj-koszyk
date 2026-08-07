import test from 'node:test';
import assert from 'node:assert/strict';

import { dodajProdukt, obliczSumeGroszy } from '../cart.js';

function produkt(nadpisania = {}) {
  return {
    id: 'bezpieczny-produkt',
    name: 'Bezpieczny produkt',
    price_cents: 100,
    ...nadpisania,
  };
}

test('stabilny getter wymaganego pola jest odrzucany', () => {
  const dane = produkt();
  Object.defineProperty(dane, 'name', {
    enumerable: true,
    get: () => 'Pozornie stabilna nazwa',
  });

  assert.throws(() => dodajProdukt([], dane), TypeError);
});

test('getter w dodatkowych danych jest odrzucany bez uruchamiania', () => {
  let wywolania = 0;
  const metadata = {};
  Object.defineProperty(metadata, 'sekret', {
    enumerable: true,
    get() {
      wywolania += 1;
      return 'wartość';
    },
  });

  assert.throws(() => dodajProdukt([], produkt({ metadata })), TypeError);
  assert.equal(wywolania, 0);
});

test('zagnieżdżone tablice i obiekty są kopiowane niezależnie', () => {
  const dane = produkt({
    metadata: {
      tags: ['promocja', { source: 'Supabase' }],
    },
  });

  const wynik = dodajProdukt([], dane);
  dane.metadata.tags[1].source = 'zmienione';

  assert.equal(wynik[0].metadata.tags[1].source, 'Supabase');
  assert.notStrictEqual(wynik[0].metadata.tags, dane.metadata.tags);
});

test('rzadka tablica w dodatkowych danych jest odrzucana', () => {
  const tags = new Array(2);
  tags[1] = 'drugi';

  assert.throws(
    () => dodajProdukt([], produkt({ metadata: { tags } })),
    TypeError,
  );
});

test('nietypowy obiekt w dodatkowych danych jest odrzucany', () => {
  assert.throws(
    () => dodajProdukt([], produkt({ metadata: new Date() })),
    TypeError,
  );
});

test('symboliczne pole produktu jest odrzucane', () => {
  const dane = produkt();
  dane[Symbol('ukryte')] = 'wartość';

  assert.throws(() => dodajProdukt([], dane), TypeError);
});

test('błąd pułapki Proxy jest normalizowany do TypeError', () => {
  const dane = new Proxy(produkt(), {
    ownKeys() {
      throw new Error('niekontrolowany błąd Proxy');
    },
  });

  assert.throws(() => dodajProdukt([], dane), TypeError);
});

test('akcesor indeksu koszyka jest odrzucany bez uruchamiania', () => {
  let wywolania = 0;
  const koszyk = [];
  Object.defineProperty(koszyk, '0', {
    configurable: true,
    get() {
      wywolania += 1;
      return produkt();
    },
  });

  assert.throws(() => obliczSumeGroszy(koszyk), TypeError);
  assert.equal(wywolania, 0);
});

test('limit pozycji jest sprawdzany przed iterowaniem koszyka', () => {
  const zbytDuzyKoszyk = new Array(100_001);

  assert.throws(() => obliczSumeGroszy(zbytDuzyKoszyk), RangeError);
});

test('dodawanie blokuje wzrost koszyka ponad limit interfejsu', () => {
  const pozycja = Object.freeze(produkt());
  const pelnyKoszyk = Array.from({ length: 500 }, () => pozycja);

  assert.throws(() => dodajProdukt(pelnyKoszyk, produkt()), RangeError);
});

test('pole __proto__ pozostaje zwykłą daną i nie zmienia prototypu', () => {
  const metadata = JSON.parse('{"__proto__":{"polluted":true}}');
  const wynik = dodajProdukt([], produkt({ metadata }));

  assert.equal(Object.getPrototypeOf(wynik[0].metadata), Object.prototype);
  assert.equal(Object.hasOwn(wynik[0].metadata, '__proto__'), true);
  assert.equal({}.polluted, undefined);
});
