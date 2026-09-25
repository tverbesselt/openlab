/*
 * Hulpstukken voor de vertaalbestanden in deze map.
 *
 * Elk bestand hoort bij een deel van de app (een naamruimte) en bevat dezelfde boom in vier
 * talen. Nederlands is de bron: de andere talen moeten precies dezelfde sleutels hebben.
 * TypeScript controleert dat, dus een ontbrekende of overbodige sleutel breekt de build.
 */

/** Een boom van teksten: elke tak is een tekst of een nieuwe boom. */
export interface Boom {
  [sleutel: string]: string | Boom;
}

/** Dezelfde vorm als T, maar met willekeurige tekst in de bladeren. */
export type ZelfdeVorm<T> = {
  [K in keyof T]: T[K] extends string ? string : ZelfdeVorm<T[K]>;
};

export interface Naamruimte<T extends Boom> {
  nl: T;
  en: ZelfdeVorm<T>;
  fr: ZelfdeVorm<T>;
  es: ZelfdeVorm<T>;
}

/**
 * Een naamruimte met de vier talen. Gebruik:
 *
 *   export default definieer({
 *     nl: { titel: "Hallo {naam}", aantal: { one: "{n} kaart", other: "{n} kaarten" } },
 *     en: { titel: "Hello {naam}", aantal: { one: "{n} card", other: "{n} cards" } },
 *     fr: { ... },
 *     es: { ... },
 *   });
 */
export function definieer<T extends Boom>(n: {
  nl: T;
  en: NoInfer<ZelfdeVorm<T>>;
  fr: NoInfer<ZelfdeVorm<T>>;
  es: NoInfer<ZelfdeVorm<T>>;
}): Naamruimte<T> {
  return n;
}

/** Alle paden naar een tekst in een boom, zoals "kop.titel". */
export type Pad<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${Pad<T[K]>}`;
}[keyof T & string];
