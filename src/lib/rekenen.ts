import { Rekensoort } from "./types";
import { t, locale, type Sleutel } from "./i18n";

/*
 * Rekenopgaven met telkens nieuwe getallen.
 *
 * De leraar kiest één keer een type; de app maakt daarna onbeperkt opgaven. Zo kan een
 * cursist blijven oefenen tot het automatisch gaat, zonder dat er honderd vragen getypt
 * moeten worden. De contexten komen uit de studiegebieden zelf: btw en korting voor
 * verkoop en boekhouden, eenheden en Ohm voor techniek, verhoudingen voor koken.
 */

export interface Opgave {
  id: string;
  vraag: string;
  antwoord: number;
  /** Wat er achter het antwoord hoort, bijvoorbeeld "euro" of "gram". */
  eenheid?: string;
  /** Hoe je eraan komt. Verschijnt na het antwoord. */
  uitleg: string;
  /** Aantal decimalen waarop we vergelijken. */
  decimalen: number;
}

export interface Rekentype {
  soort: Rekensoort;
  label: string;
  uitleg: string;
  voorbeeld: string;
}

/** Een rekentype met teksten in de huidige taal: getters, zodat t() pas bij het lezen loopt. */
function metTekst(soort: Rekensoort): Rekentype {
  return {
    soort,
    get label() {
      return t(`makenvormen.rekentypes.${soort}.label` as Sleutel);
    },
    get uitleg() {
      return t(`makenvormen.rekentypes.${soort}.uitleg` as Sleutel);
    },
    get voorbeeld() {
      return t(`makenvormen.rekentypes.${soort}.voorbeeld` as Sleutel);
    },
  };
}

export const REKENTYPES: Rekentype[] = [
  metTekst("procent"),
  metTekst("btw"),
  metTekst("korting"),
  metTekst("eenheden"),
  metTekst("breuken"),
  metTekst("ohm"),
  metTekst("verhouding"),
];

export function rekentype(soort: Rekensoort): Rekentype {
  return REKENTYPES.find((r) => r.soort === soort) ?? REKENTYPES[0];
}

function tussen(laag: number, hoog: number): number {
  return laag + Math.floor(Math.random() * (hoog - laag + 1));
}

function kies<T>(lijst: readonly T[]): T {
  return lijst[Math.floor(Math.random() * lijst.length)];
}

/** Bedragen met twee decimalen, met het decimaalteken van de huidige taal. */
function bedrag(waarde: number): string {
  return waarde.toLocaleString(locale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  });
}

/** Een getal zonder overbodige nullen, met het decimaalteken van de huidige taal. */
function getal(waarde: number): string {
  return waarde.toLocaleString(locale(), { maximumFractionDigits: 2, useGrouping: false });
}

type Eenheid = "gram" | "milliliter" | "centimeter" | "meter" | "kg" | "liter" | "km";

/** De naam van een eenheid in de huidige taal. */
function eenheidNaam(e: Eenheid | "euro" | "ampere" | "volt"): string {
  return t(`makenvormen.eenheden.${e}`);
}

function rond(waarde: number, decimalen: number): number {
  const factor = 10 ** decimalen;
  return Math.round(waarde * factor) / factor;
}

const EENHEDEN: { van: Eenheid; naar: Eenheid; factor: number; stap: number }[] = [
  { van: "kg", naar: "gram", factor: 1000, stap: 0.5 },
  { van: "liter", naar: "milliliter", factor: 1000, stap: 0.5 },
  { van: "meter", naar: "centimeter", factor: 100, stap: 0.5 },
  { van: "km", naar: "meter", factor: 1000, stap: 0.5 },
];

const BREUKEN: [number, number][] = [
  [1, 2],
  [1, 4],
  [3, 4],
  [1, 3],
  [2, 3],
  [1, 5],
  [2, 5],
];

const INGREDIENTEN = ["rijst", "bloem", "suiker", "pasta", "aardappelen"] as const;

/** Eén nieuwe opgave van het gevraagde type. */
export function maakOpgave(soort: Rekensoort, nummer: number): Opgave {
  const id = `opg-${nummer}-${Math.random().toString(36).slice(2, 7)}`;

  switch (soort) {
    case "procent": {
      const percent = kies([5, 10, 15, 20, 25, 30, 40, 50, 75]);
      const grondtal = tussen(2, 40) * 10;
      const antwoord = rond((grondtal * percent) / 100, 2);
      return {
        id,
        vraag: t("makenvormen.opgaven.procent", { percent, getal: grondtal }),
        antwoord,
        uitleg: `${grondtal} × ${percent} ÷ 100 = ${bedrag(antwoord)}`,
        decimalen: 2,
      };
    }

    case "btw": {
      const tarief = kies([6, 12, 21]);
      const prijs = rond(tussen(500, 25000) / 100, 2);
      const antwoord = rond(prijs * (1 + tarief / 100), 2);
      return {
        id,
        vraag: t("makenvormen.opgaven.btw", { prijs: bedrag(prijs), tarief }),
        antwoord,
        eenheid: eenheidNaam("euro"),
        uitleg: `${bedrag(prijs)} × ${bedrag(1 + tarief / 100)} = ${bedrag(antwoord)} ${eenheidNaam("euro")}`,
        decimalen: 2,
      };
    }

    case "korting": {
      const percent = kies([10, 15, 20, 25, 30, 40, 50]);
      const prijs = tussen(20, 300);
      const antwoord = rond(prijs * (1 - percent / 100), 2);
      return {
        id,
        vraag: t("makenvormen.opgaven.korting", { prijs: bedrag(prijs), percent }),
        antwoord,
        eenheid: eenheidNaam("euro"),
        uitleg: `${prijs} − (${prijs} × ${percent} ÷ 100) = ${bedrag(antwoord)} ${eenheidNaam("euro")}`,
        decimalen: 2,
      };
    }

    case "eenheden": {
      const eenheid = kies(EENHEDEN);
      const waarde = rond(tussen(1, 20) * eenheid.stap, 1);
      const antwoord = rond(waarde * eenheid.factor, 2);
      return {
        id,
        vraag: t("makenvormen.opgaven.eenheden", {
          waarde: getal(waarde),
          van: eenheidNaam(eenheid.van),
          naar: eenheidNaam(eenheid.naar),
        }),
        antwoord,
        eenheid: eenheidNaam(eenheid.naar),
        uitleg: `${getal(waarde)} × ${eenheid.factor} = ${getal(antwoord)} ${eenheidNaam(eenheid.naar)}`,
        decimalen: 2,
      };
    }

    case "breuken": {
      const [teller, noemer] = kies(BREUKEN);
      const geheel = noemer * tussen(2, 20);
      const antwoord = rond((geheel * teller) / noemer, 2);
      return {
        id,
        vraag: t("makenvormen.opgaven.breuken", { teller, noemer, getal: geheel }),
        antwoord,
        uitleg: `${geheel} ÷ ${noemer} × ${teller} = ${getal(antwoord)}`,
        decimalen: 2,
      };
    }

    case "ohm": {
      const stroom = kies([0.5, 1, 1.5, 2, 2.5, 3, 4, 5]);
      const weerstand = kies([4, 5, 8, 10, 12, 20, 25, 47]);
      const spanning = rond(stroom * weerstand, 2);

      // Afwisselen welke grootheid gevraagd wordt: anders leert de cursist één trucje.
      if (Math.random() < 0.5) {
        return {
          id,
          vraag: t("makenvormen.opgaven.ohmStroom", { weerstand, spanning: bedrag(spanning) }),
          antwoord: rond(stroom, 2),
          eenheid: eenheidNaam("ampere"),
          uitleg: `I = U ÷ R = ${bedrag(spanning)} ÷ ${weerstand} = ${getal(stroom)} A`,
          decimalen: 2,
        };
      }
      return {
        id,
        vraag: t("makenvormen.opgaven.ohmSpanning", { weerstand, stroom: getal(stroom) }),
        antwoord: spanning,
        eenheid: eenheidNaam("volt"),
        uitleg: `U = I × R = ${getal(stroom)} × ${weerstand} = ${bedrag(spanning)} V`,
        decimalen: 2,
      };
    }

    case "verhouding":
    default: {
      const personen = tussen(2, 6);
      const nieuwePersonen = personen + tussen(1, 6);
      const perPersoon = kies([50, 60, 75, 80, 100, 125, 150]);
      const hoeveelheid = perPersoon * personen;
      const antwoord = perPersoon * nieuwePersonen;
      const ingredient = kies(INGREDIENTEN);
      return {
        id,
        vraag: t("makenvormen.opgaven.verhouding", {
          personen,
          hoeveelheid,
          ingredient: t(`makenvormen.ingredienten.${ingredient}`),
          nieuw: nieuwePersonen,
        }),
        antwoord,
        eenheid: eenheidNaam("gram"),
        uitleg: `${hoeveelheid} ÷ ${personen} × ${nieuwePersonen} = ${antwoord} ${eenheidNaam("gram")}`,
        decimalen: 0,
      };
    }
  }
}

export function maakRonde(soort: Rekensoort, aantal: number): Opgave[] {
  return Array.from({ length: aantal }, (_, i) => maakOpgave(soort, i));
}

/**
 * Klopt het antwoord? Een komma of een punt maakt niet uit, en een euroteken of eenheid
 * die de cursist meetypt evenmin: het gaat om het rekenwerk, niet om de notatie.
 */
export function isJuist(gegeven: string, opgave: Opgave): boolean {
  const opgeschoond = gegeven
    .trim()
    .replace(/[€\s]/g, "")
    .replace(/[a-zA-Zµ]+$/u, "")
    .replace(",", ".");
  if (!opgeschoond) return false;

  const getal = Number(opgeschoond);
  if (!Number.isFinite(getal)) return false;

  return rond(getal, opgave.decimalen) === rond(opgave.antwoord, opgave.decimalen);
}

/** Het antwoord zoals wij het tonen: met het decimaalteken van de taal, en zonder overbodige nullen. */
export function toonAntwoord(opgave: Opgave): string {
  const tekst = opgave.decimalen === 0 ? String(opgave.antwoord) : bedrag(opgave.antwoord);
  return opgave.eenheid ? `${tekst} ${opgave.eenheid}` : tekst;
}
