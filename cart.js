const MAKSYMALNA_CENA_GROSZE = 100_000_000;

function sprawdzProdukt(produkt) {
  if (
    produkt === null ||
    typeof produkt !== 'object' ||
    Array.isArray(produkt) ||
    Object.getPrototypeOf(produkt) !== Object.prototype ||
    Object.keys(produkt).length === 0
  ) {
    throw new TypeError('Produkt musi być zwykłym, niepustym obiektem.');
  }

  if (typeof produkt.id !== 'string' || produkt.id.trim() === '') {
    throw new TypeError('Identyfikator produktu musi być niepustym tekstem.');
  }

  if (typeof produkt.name !== 'string' || produkt.name.trim() === '') {
    throw new TypeError('Nazwa produktu musi być niepustym tekstem.');
  }

  if (
    typeof produkt.price_cents !== 'number' ||
    !Number.isSafeInteger(produkt.price_cents)
  ) {
    throw new TypeError('Cena produktu musi być bezpieczną liczbą całkowitą.');
  }

  if (
    produkt.price_cents < 0 ||
    produkt.price_cents > MAKSYMALNA_CENA_GROSZE
  ) {
    throw new RangeError('Cena produktu jest poza dozwolonym zakresem.');
  }
}

export function dodajProdukt(koszyk, produkt) {
  if (!Array.isArray(koszyk)) {
    throw new TypeError('Koszyk musi być tablicą.');
  }

  sprawdzProdukt(produkt);
  return [...koszyk, { ...produkt }];
}

export function obliczSumeGroszy(koszyk) {
  if (!Array.isArray(koszyk)) {
    throw new TypeError('Koszyk musi być tablicą.');
  }

  let sumaGrosze = 0;

  koszyk.forEach((produkt) => {
    sprawdzProdukt(produkt);

    if (sumaGrosze > Number.MAX_SAFE_INTEGER - produkt.price_cents) {
      throw new RangeError('Suma koszyka przekracza bezpieczny zakres Number.');
    }

    sumaGrosze += produkt.price_cents;
  });

  return sumaGrosze;
}
