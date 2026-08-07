const MAKSYMALNA_CENA_GROSZE = 100_000_000;
const MAKSYMALNA_LICZBA_POZYCJI_KOSZYKA = 500;
const MAKSYMALNA_LICZBA_SUMOWANYCH_POZYCJI = 100_000;
const MAKSYMALNA_GLEBOKOSC_DANYCH = 20;
const MAKSYMALNA_LICZBA_POL = 1_000;
const LICZBA_ODCZYTOW_GETTERA = 8;

function bladDanych(komunikat, przyczyna) {
  return new TypeError(komunikat, { cause: przyczyna });
}

function wykonajBezpiecznie(operacja, komunikat) {
  try {
    return operacja();
  } catch (error) {
    if (error instanceof TypeError || error instanceof RangeError) {
      throw error;
    }

    throw bladDanych(komunikat, error);
  }
}

function sprawdzCene(cena, getter = false) {
  if (typeof cena !== 'number' || !Number.isFinite(cena)) {
    throw new TypeError('Cena produktu musi być bezpieczną liczbą całkowitą.');
  }

  if (getter && (cena < 0 || cena > MAKSYMALNA_CENA_GROSZE)) {
    throw new RangeError('Cena produktu jest poza dozwolonym zakresem.');
  }

  if (!Number.isSafeInteger(cena)) {
    throw new TypeError('Cena produktu musi być bezpieczną liczbą całkowitą.');
  }

  if (cena < 0 || cena > MAKSYMALNA_CENA_GROSZE) {
    throw new RangeError('Cena produktu jest poza dozwolonym zakresem.');
  }
}

function sprawdzTekst(wartosc, pole) {
  if (typeof wartosc !== 'string' || wartosc.trim() === '') {
    throw new TypeError(`${pole} produktu musi być niepustym tekstem.`);
  }
}

function odczytajWymaganePole(produkt, deskryptor, nazwaPola) {
  if (!deskryptor) {
    throw new TypeError(`Produkt nie zawiera wymaganego pola ${nazwaPola}.`);
  }

  if (Object.hasOwn(deskryptor, 'value')) {
    return deskryptor.value;
  }

  if (typeof deskryptor.get !== 'function') {
    throw new TypeError(`Pole ${nazwaPola} produktu nie może być akcesorem.`);
  }

  let ostatniaWartosc;
  let pierwszaWartosc;

  for (let indeks = 0; indeks < LICZBA_ODCZYTOW_GETTERA; indeks += 1) {
    try {
      ostatniaWartosc = Reflect.apply(deskryptor.get, produkt, []);
    } catch (error) {
      throw bladDanych(
        `Nie można bezpiecznie odczytać pola ${nazwaPola} produktu.`,
        error,
      );
    }

    if (indeks === 0) {
      pierwszaWartosc = ostatniaWartosc;
    }
  }

  if (nazwaPola === 'price_cents') {
    sprawdzCene(ostatniaWartosc, true);
  } else {
    sprawdzTekst(
      ostatniaWartosc,
      nazwaPola === 'id' ? 'Identyfikator' : 'Nazwa',
    );
  }

  if (!Object.is(pierwszaWartosc, ostatniaWartosc)) {
    throw new TypeError(`Pole ${nazwaPola} produktu zwraca zmienne wartości.`);
  }

  throw new TypeError(`Pole ${nazwaPola} produktu nie może być getterem.`);
}

function pobierzDeskryptoryProduktu(produkt) {
  if (produkt === null || typeof produkt !== 'object' || Array.isArray(produkt)) {
    throw new TypeError('Produkt musi być zwykłym, niepustym obiektem.');
  }

  return wykonajBezpiecznie(() => {
    if (Object.getPrototypeOf(produkt) !== Object.prototype) {
      throw new TypeError('Produkt musi być zwykłym, niepustym obiektem.');
    }

    const deskryptory = Object.getOwnPropertyDescriptors(produkt);
    if (Reflect.ownKeys(deskryptory).length === 0) {
      throw new TypeError('Produkt musi być zwykłym, niepustym obiektem.');
    }

    return deskryptory;
  }, 'Nie można bezpiecznie sprawdzić produktu.');
}

function sprawdzProdukt(produkt) {
  const deskryptory = pobierzDeskryptoryProduktu(produkt);
  const id = odczytajWymaganePole(produkt, deskryptory.id, 'id');
  const name = odczytajWymaganePole(produkt, deskryptory.name, 'name');
  const priceCents = odczytajWymaganePole(
    produkt,
    deskryptory.price_cents,
    'price_cents',
  );

  sprawdzTekst(id, 'Identyfikator');
  sprawdzTekst(name, 'Nazwa');
  sprawdzCene(priceCents);

  return { deskryptory, id, name, priceCents };
}

function sklonujDane(wartosc, odwiedzone, glebokosc) {
  if (glebokosc > MAKSYMALNA_GLEBOKOSC_DANYCH) {
    throw new RangeError('Dane produktu są zbyt głęboko zagnieżdżone.');
  }

  if (
    wartosc === null ||
    typeof wartosc === 'string' ||
    typeof wartosc === 'boolean' ||
    typeof wartosc === 'undefined'
  ) {
    return wartosc;
  }

  if (typeof wartosc === 'number') {
    if (!Number.isFinite(wartosc)) {
      throw new TypeError('Dodatkowe dane produktu zawierają niepoprawną liczbę.');
    }

    return wartosc;
  }

  if (typeof wartosc !== 'object') {
    throw new TypeError('Dodatkowe dane produktu muszą być danymi strukturalnymi.');
  }

  if (odwiedzone.has(wartosc)) {
    return odwiedzone.get(wartosc);
  }

  if (Array.isArray(wartosc)) {
    if (wartosc.length > MAKSYMALNA_LICZBA_POL) {
      throw new RangeError('Tablica w danych produktu jest zbyt duża.');
    }

    const kopia = new Array(wartosc.length);
    odwiedzone.set(wartosc, kopia);

    for (let indeks = 0; indeks < wartosc.length; indeks += 1) {
      const deskryptor = wykonajBezpiecznie(
        () => Object.getOwnPropertyDescriptor(wartosc, String(indeks)),
        'Nie można bezpiecznie skopiować danych produktu.',
      );

      if (!deskryptor || !Object.hasOwn(deskryptor, 'value')) {
        throw new TypeError('Tablice w danych produktu muszą być gęste i bez getterów.');
      }

      kopia[indeks] = sklonujDane(
        deskryptor.value,
        odwiedzone,
        glebokosc + 1,
      );
    }

    return kopia;
  }

  const prototyp = wykonajBezpiecznie(
    () => Object.getPrototypeOf(wartosc),
    'Nie można bezpiecznie skopiować danych produktu.',
  );
  if (prototyp !== Object.prototype && prototyp !== null) {
    throw new TypeError('Dodatkowe dane produktu muszą być zwykłymi obiektami.');
  }

  const deskryptory = wykonajBezpiecznie(
    () => Object.getOwnPropertyDescriptors(wartosc),
    'Nie można bezpiecznie skopiować danych produktu.',
  );
  const klucze = Reflect.ownKeys(deskryptory);
  if (klucze.length > MAKSYMALNA_LICZBA_POL) {
    throw new RangeError('Obiekt w danych produktu ma zbyt wiele pól.');
  }

  const kopia = {};
  odwiedzone.set(wartosc, kopia);

  for (const klucz of klucze) {
    if (typeof klucz !== 'string') {
      throw new TypeError('Dodatkowe dane produktu nie mogą używać symboli.');
    }

    const deskryptor = deskryptory[klucz];
    if (!Object.hasOwn(deskryptor, 'value')) {
      throw new TypeError('Dodatkowe dane produktu nie mogą zawierać getterów.');
    }

    Object.defineProperty(kopia, klucz, {
      value: sklonujDane(deskryptor.value, odwiedzone, glebokosc + 1),
      enumerable: deskryptor.enumerable,
      configurable: true,
      writable: true,
    });
  }

  return kopia;
}

function skopiujProdukt(produkt, deskryptory) {
  const kopia = {};
  const odwiedzone = new WeakMap([[produkt, kopia]]);
  const klucze = Reflect.ownKeys(deskryptory);

  if (klucze.length > MAKSYMALNA_LICZBA_POL) {
    throw new RangeError('Produkt ma zbyt wiele pól.');
  }

  for (const klucz of klucze) {
    if (typeof klucz !== 'string') {
      throw new TypeError('Produkt nie może zawierać pól symbolicznych.');
    }

    const deskryptor = deskryptory[klucz];
    if (!Object.hasOwn(deskryptor, 'value')) {
      throw new TypeError('Produkt nie może zawierać getterów ani setterów.');
    }

    Object.defineProperty(kopia, klucz, {
      value: sklonujDane(deskryptor.value, odwiedzone, 1),
      enumerable: deskryptor.enumerable,
      configurable: true,
      writable: true,
    });
  }

  return kopia;
}

function sprawdzKoszyk(
  koszyk,
  maksymalnaDlugosc = MAKSYMALNA_LICZBA_SUMOWANYCH_POZYCJI,
) {
  if (!Array.isArray(koszyk)) {
    throw new TypeError('Koszyk musi być tablicą.');
  }

  if (koszyk.length > maksymalnaDlugosc) {
    throw new RangeError('Koszyk zawiera zbyt wiele pozycji.');
  }
}

function pobierzPozycjeKoszyka(koszyk, indeks) {
  const deskryptor = wykonajBezpiecznie(
    () => Object.getOwnPropertyDescriptor(koszyk, String(indeks)),
    'Nie można bezpiecznie odczytać pozycji koszyka.',
  );

  if (!deskryptor || !Object.hasOwn(deskryptor, 'value')) {
    throw new TypeError('Koszyk musi być gęstą tablicą bez getterów.');
  }

  return deskryptor.value;
}

export function dodajProdukt(koszyk, produkt) {
  sprawdzKoszyk(koszyk, MAKSYMALNA_LICZBA_POZYCJI_KOSZYKA - 1);
  const sprawdzonyProdukt = sprawdzProdukt(produkt);
  const wynik = new Array(koszyk.length + 1);

  for (let indeks = 0; indeks < koszyk.length; indeks += 1) {
    const pozycja = pobierzPozycjeKoszyka(koszyk, indeks);
    sprawdzProdukt(pozycja);
    wynik[indeks] = pozycja;
  }

  wynik[koszyk.length] = skopiujProdukt(
    produkt,
    sprawdzonyProdukt.deskryptory,
  );
  return wynik;
}

export function obliczSumeGroszy(koszyk) {
  sprawdzKoszyk(koszyk);
  let sumaGrosze = 0;

  for (let indeks = 0; indeks < koszyk.length; indeks += 1) {
    const produkt = pobierzPozycjeKoszyka(koszyk, indeks);
    const { priceCents } = sprawdzProdukt(produkt);

    if (sumaGrosze > Number.MAX_SAFE_INTEGER - priceCents) {
      throw new RangeError('Suma koszyka przekracza bezpieczny zakres Number.');
    }

    sumaGrosze += priceCents;
  }

  return sumaGrosze;
}
