import test from 'node:test';
import assert from 'node:assert/strict';

import { dodajProdukt, obliczSumeGroszy } from '../cart.js';

const MAKSYMALNA_CENA_GROSZE = 100_000_000;

function poprawnyProdukt(nadpisania = {}) {
  return {
    id: 'produkt-1',
    name: 'Kawa',
    price_cents: 1_200,
    ...nadpisania,
  };
}

function produktBezPola(pole) {
  const produkt = poprawnyProdukt();
  delete produkt[pole];
  return produkt;
}

test('pusty koszyk ma sumę równą zero', () => {
  // Arrange
  const koszyk = [];

  // Act
  const suma = obliczSumeGroszy(koszyk);

  // Assert
  assert.equal(suma, 0);
});

test('dodanie jednego poprawnego produktu tworzy nowy koszyk z kopią produktu', () => {
  // Arrange
  const koszyk = [];
  const produkt = poprawnyProdukt();

  // Act
  const wynik = dodajProdukt(koszyk, produkt);

  // Assert
  assert.deepEqual(wynik, [produkt]);
  assert.notStrictEqual(wynik, koszyk);
  assert.notStrictEqual(wynik[0], produkt);
  assert.equal(obliczSumeGroszy(wynik), 1_200);
});

test('kilka poprawnych produktów zachowuje kolejność i daje poprawną sumę', () => {
  // Arrange
  const kawa = poprawnyProdukt({ id: 'kawa', name: 'Kawa', price_cents: 1_200 });
  const herbata = poprawnyProdukt({ id: 'herbata', name: 'Herbata', price_cents: 900 });
  const woda = poprawnyProdukt({ id: 'woda', name: 'Woda', price_cents: 600 });

  // Act
  const poKawie = dodajProdukt([], kawa);
  const poHerbacie = dodajProdukt(poKawie, herbata);
  const wynik = dodajProdukt(poHerbacie, woda);

  // Assert
  assert.deepEqual(wynik.map(({ id }) => id), ['kawa', 'herbata', 'woda']);
  assert.equal(obliczSumeGroszy(wynik), 2_700);
});

test('wielokrotne dodanie tego samego produktu oznacza kolejne sztuki', () => {
  // Arrange
  const produkt = poprawnyProdukt({ id: 'kawa', price_cents: 1_200 });

  // Act
  const raz = dodajProdukt([], produkt);
  const dwaRazy = dodajProdukt(raz, produkt);
  const trzyRazy = dodajProdukt(dwaRazy, produkt);

  // Assert
  assert.equal(trzyRazy.length, 3);
  assert.equal(obliczSumeGroszy(trzyRazy), 3_600);
});

test('cena zero i maksymalna dozwolona cena są akceptowane', () => {
  // Arrange
  const darmowy = poprawnyProdukt({ id: 'gratis', price_cents: 0 });
  const maksymalny = poprawnyProdukt({
    id: 'maksymalny',
    price_cents: MAKSYMALNA_CENA_GROSZE,
  });

  // Act
  const koszyk = dodajProdukt(dodajProdukt([], darmowy), maksymalny);
  const suma = obliczSumeGroszy(koszyk);

  // Assert
  assert.equal(suma, MAKSYMALNA_CENA_GROSZE);
});

for (const [opis, nieTablica] of [
  ['null', null],
  ['zwykły obiekt', {}],
  ['tekst', 'koszyk'],
  ['iterator niebędący tablicą', { *[Symbol.iterator]() { yield poprawnyProdukt(); } }],
]) {
  test(`dodawanie odrzuca koszyk niebędący tablicą: ${opis}`, () => {
    // Arrange
    const produkt = poprawnyProdukt();

    // Act
    const akcja = () => dodajProdukt(nieTablica, produkt);

    // Assert
    assert.throws(akcja, TypeError);
  });

  test(`sumowanie odrzuca koszyk niebędący tablicą: ${opis}`, () => {
    // Arrange
    const koszyk = nieTablica;

    // Act
    const akcja = () => obliczSumeGroszy(koszyk);

    // Assert
    assert.throws(akcja, TypeError);
  });
}

class ProduktKlasowy {
  constructor() {
    this.id = 'klasa-1';
    this.name = 'Produkt klasowy';
    this.price_cents = 100;
  }
}

for (const [opis, produkt] of [
  ['null', null],
  ['tablica', []],
  ['Date', new Date('2026-08-03T00:00:00.000Z')],
  ['instancja klasy', new ProduktKlasowy()],
  ['pusty obiekt', {}],
]) {
  test(`dodawanie odrzuca produkt, który nie jest zwykłym niepustym obiektem: ${opis}`, () => {
    // Arrange
    const koszyk = [];

    // Act
    const akcja = () => dodajProdukt(koszyk, produkt);

    // Assert
    assert.throws(akcja, TypeError);
  });
}

for (const pole of ['id', 'name', 'price_cents']) {
  test(`dodawanie odrzuca produkt bez pola ${pole}`, () => {
    // Arrange
    const produkt = produktBezPola(pole);

    // Act
    const akcja = () => dodajProdukt([], produkt);

    // Assert
    assert.throws(akcja, TypeError);
  });
}

for (const pole of ['id', 'name']) {
  test(`dodawanie odrzuca pole ${pole} złożone wyłącznie z białych znaków`, () => {
    // Arrange
    const produkt = poprawnyProdukt({ [pole]: ' \t\n\r ' });

    // Act
    const akcja = () => dodajProdukt([], produkt);

    // Assert
    assert.throws(akcja, TypeError);
  });
}

for (const [opis, cena, TypBledu] of [
  ['tekst', '1200', TypeError],
  ['NaN', Number.NaN, TypeError],
  ['Infinity', Number.POSITIVE_INFINITY, TypeError],
  ['liczba ułamkowa', 12.5, TypeError],
  ['liczba ujemna', -1, RangeError],
  ['cena ponad limit', MAKSYMALNA_CENA_GROSZE + 1, RangeError],
]) {
  test(`dodawanie odrzuca niepoprawną cenę: ${opis}`, () => {
    // Arrange
    const produkt = poprawnyProdukt({ price_cents: cena });

    // Act
    const akcja = () => dodajProdukt([], produkt);

    // Assert
    assert.throws(akcja, TypBledu);
  });
}

test('dodawanie nie mutuje wejściowej tablicy ani jej wcześniejszych pozycji', () => {
  // Arrange
  const poprzedniaPozycja = Object.freeze(poprawnyProdukt({ id: 'stary' }));
  const koszyk = Object.freeze([poprzedniaPozycja]);
  const nowyProdukt = poprawnyProdukt({ id: 'nowy' });

  // Act
  const wynik = dodajProdukt(koszyk, nowyProdukt);

  // Assert
  assert.deepEqual(koszyk, [poprzedniaPozycja]);
  assert.equal(wynik.length, 2);
  assert.strictEqual(wynik[0], poprzedniaPozycja);
});

test('dodawanie nie mutuje wejściowego produktu', () => {
  // Arrange
  const produkt = Object.freeze(poprawnyProdukt());
  const stanPrzed = { ...produkt };

  // Act
  const wynik = dodajProdukt([], produkt);

  // Assert
  assert.deepEqual(produkt, stanPrzed);
  assert.deepEqual(wynik[0], stanPrzed);
});

test('mutacja źródłowego produktu po dodaniu nie zmienia pozycji w koszyku', () => {
  // Arrange
  const produkt = poprawnyProdukt();
  const koszyk = dodajProdukt([], produkt);

  // Act
  produkt.id = 'zmienione-id';
  produkt.name = 'Zmieniona nazwa';
  produkt.price_cents = 99_999;

  // Assert
  assert.deepEqual(koszyk[0], {
    id: 'produkt-1',
    name: 'Kawa',
    price_cents: 1_200,
  });
});

test('kopia danych produktu nie współdzieli z wejściem zagnieżdżonych referencji', () => {
  // Arrange
  const produkt = poprawnyProdukt({ metadata: { source: 'Supabase' } });
  const koszyk = dodajProdukt([], produkt);

  // Act
  produkt.metadata.source = 'atakujący';

  // Assert
  assert.equal(koszyk[0].metadata.source, 'Supabase');
  assert.notStrictEqual(koszyk[0].metadata, produkt.metadata);
});

test('sumowanie nie mutuje tablicy ani produktów', () => {
  // Arrange
  const pierwszy = Object.freeze(poprawnyProdukt({ id: 'pierwszy', price_cents: 100 }));
  const drugi = Object.freeze(poprawnyProdukt({ id: 'drugi', price_cents: 200 }));
  const koszyk = Object.freeze([pierwszy, drugi]);

  // Act
  const suma = obliczSumeGroszy(koszyk);

  // Assert
  assert.equal(suma, 300);
  assert.deepEqual(koszyk, [pierwszy, drugi]);
});

for (const [opis, niepoprawnaPozycja, TypBledu] of [
  ['null', null, TypeError],
  ['obiekt bez id', produktBezPola('id'), TypeError],
  ['cena jako tekst', poprawnyProdukt({ price_cents: '100' }), TypeError],
  ['cena ujemna', poprawnyProdukt({ price_cents: -1 }), RangeError],
]) {
  test(`sumowanie waliduje każdą pozycję i odrzuca: ${opis}`, () => {
    // Arrange
    const koszyk = [poprawnyProdukt(), niepoprawnaPozycja, poprawnyProdukt()];

    // Act
    const akcja = () => obliczSumeGroszy(koszyk);

    // Assert
    assert.throws(akcja, TypBledu);
  });
}

test('sumowanie odrzuca tablicę rzadką zamiast pomijać puste miejsce', () => {
  // Arrange
  const koszyk = new Array(2);
  koszyk[1] = poprawnyProdukt({ price_cents: 100 });

  // Act
  const akcja = () => obliczSumeGroszy(koszyk);

  // Assert
  assert.throws(akcja, TypeError);
});

test('bardzo duża liczba poprawnych pozycji jest sumowana bez utraty poprawności', () => {
  // Arrange
  const liczbaPozycji = 100_000;
  const produkt = Object.freeze(poprawnyProdukt({ price_cents: MAKSYMALNA_CENA_GROSZE }));
  const koszyk = Array.from({ length: liczbaPozycji }, () => produkt);

  // Act
  const suma = obliczSumeGroszy(koszyk);

  // Assert
  assert.equal(suma, liczbaPozycji * MAKSYMALNA_CENA_GROSZE);
  assert.equal(Number.isSafeInteger(suma), true);
});

test('cena na granicy Number.MAX_SAFE_INTEGER jest odrzucana przez limit domenowy', () => {
  // Arrange
  const produkt = poprawnyProdukt({ price_cents: Number.MAX_SAFE_INTEGER });

  // Act
  const akcja = () => obliczSumeGroszy([produkt]);

  // Assert
  assert.throws(akcja, RangeError);
});

test('cena ponad Number.MAX_SAFE_INTEGER jest odrzucana jako niebezpieczna liczba', () => {
  // Arrange
  const produkt = poprawnyProdukt({ price_cents: Number.MAX_SAFE_INTEGER + 1 });

  // Act
  const akcja = () => obliczSumeGroszy([produkt]);

  // Assert
  assert.throws(akcja, TypeError);
});

test('nadpisane forEach tablicy nie może ominąć walidacji ani sumowania pozycji', () => {
  // Arrange
  const koszyk = [poprawnyProdukt({ price_cents: 777 })];
  koszyk.forEach = () => {};

  // Act
  const suma = obliczSumeGroszy(koszyk);

  // Assert
  assert.equal(suma, 777);
});

test('nadpisany iterator tablicy nie może podmienić pozycji zachowywanych przy dodawaniu', () => {
  // Arrange
  const oryginalny = poprawnyProdukt({ id: 'oryginalny' });
  const podstawiony = poprawnyProdukt({ id: 'podstawiony' });
  const koszyk = [oryginalny];
  koszyk[Symbol.iterator] = function* iteratorAtakujacy() {
    yield podstawiony;
  };

  // Act
  const wynik = dodajProdukt(koszyk, poprawnyProdukt({ id: 'nowy' }));

  // Assert
  assert.deepEqual(wynik.map(({ id }) => id), ['oryginalny', 'nowy']);
});

test('zmienny getter id nie może zapisać produktu niespełniającego kontraktu', () => {
  // Arrange
  let odczyty = 0;
  const produkt = poprawnyProdukt();
  Object.defineProperty(produkt, 'id', {
    enumerable: true,
    get() {
      odczyty += 1;
      return odczyty < 3 ? 'poprawne-id' : '   ';
    },
  });

  // Act
  const akcja = () => dodajProdukt([], produkt);

  // Assert
  assert.throws(akcja, TypeError);
});

for (const [opis, wartoscKoncowa, TypBledu] of [
  ['NaN', Number.NaN, TypeError],
  ['tekst powodujący konkatenację', '100', TypeError],
  ['wartość ujemna', -1, RangeError],
  ['wartość ponad bezpieczny zakres Number', Number.MAX_SAFE_INTEGER + 1, RangeError],
]) {
  test(`zmienny getter ceny nie może wytworzyć błędnej sumy: ${opis}`, () => {
    // Arrange
    let odczyty = 0;
    const produkt = poprawnyProdukt();
    Object.defineProperty(produkt, 'price_cents', {
      enumerable: true,
      get() {
        odczyty += 1;
        return odczyty < 6 ? 100 : wartoscKoncowa;
      },
    });

    // Act
    const akcja = () => obliczSumeGroszy([produkt]);

    // Assert
    assert.throws(akcja, TypBledu);
  });
}

test('błąd gettera z danych zewnętrznych jest normalizowany do kontrolowanego błędu kontraktu', () => {
  // Arrange
  const produkt = poprawnyProdukt();
  Object.defineProperty(produkt, 'name', {
    enumerable: true,
    get() {
      throw new Error('niekontrolowany błąd źródła danych');
    },
  });

  // Act
  const akcja = () => dodajProdukt([], produkt);

  // Assert
  assert.throws(
    akcja,
    (error) => error instanceof TypeError || error instanceof RangeError,
  );
});

test('kopiowanie produktu zachowuje wymagane pola także wtedy, gdy nie są wyliczalne', () => {
  // Arrange
  const produkt = { znacznik: true };
  Object.defineProperties(produkt, {
    id: { value: 'ukryty-id', enumerable: false },
    name: { value: 'Ukryta nazwa', enumerable: false },
    price_cents: { value: 500, enumerable: false },
  });

  // Act
  const koszyk = dodajProdukt([], produkt);

  // Assert
  assert.equal(koszyk[0].id, 'ukryty-id');
  assert.equal(koszyk[0].name, 'Ukryta nazwa');
  assert.equal(koszyk[0].price_cents, 500);
  assert.equal(obliczSumeGroszy(koszyk), 500);
});

test('treść przypominająca HTML pozostaje zwykłą nazwą produktu w logice koszyka', () => {
  // Arrange
  const nazwa = '<img src=x onerror=alert(1)>';
  const produkt = poprawnyProdukt({ name: nazwa });

  // Act
  const koszyk = dodajProdukt([], produkt);

  // Assert
  assert.equal(koszyk[0].name, nazwa);
  assert.equal(obliczSumeGroszy(koszyk), 1_200);
});
