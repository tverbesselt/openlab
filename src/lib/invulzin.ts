/*
 * Invulzinnen. De leraar typt de zin met het antwoord tussen dubbele haken:
 *
 *   De hoofdstad van België is [[Brussel]].
 *   Ik [[ga|loop]] naar de winkel.        <- meerdere antwoorden zijn goed
 *
 * Zo staat het antwoord waar het hoort, midden in de zin. Dat scheelt de leraar een
 * tweede invulveld en de cursist het heen-en-weer kijken (split attention, Mayer).
 */

export type Stuk =
  | { soort: "tekst"; waarde: string }
  | { soort: "gat"; nummer: number; antwoorden: string[] };

const GAT = /\[\[(.+?)\]\]/g;

/** Splitst een zin in gewone tekst en gaten. */
export function ontleedInvulzin(zin: string): Stuk[] {
  const stukken: Stuk[] = [];
  let positie = 0;
  let nummer = 0;

  for (const treffer of zin.matchAll(GAT)) {
    const start = treffer.index ?? 0;
    if (start > positie) {
      stukken.push({ soort: "tekst", waarde: zin.slice(positie, start) });
    }
    const antwoorden = treffer[1]
      .split("|")
      .map((a) => a.trim())
      .filter(Boolean);
    stukken.push({ soort: "gat", nummer: nummer++, antwoorden });
    positie = start + treffer[0].length;
  }

  if (positie < zin.length) {
    stukken.push({ soort: "tekst", waarde: zin.slice(positie) });
  }
  return stukken;
}

/** Alleen de gaten, in volgorde. */
export function gatenVan(zin: string): { nummer: number; antwoorden: string[] }[] {
  return ontleedInvulzin(zin).filter((s): s is Extract<Stuk, { soort: "gat" }> => s.soort === "gat");
}

/** Heeft deze zin minstens één bruikbaar gat? */
export function heeftGat(zin: string): boolean {
  return gatenVan(zin).some((g) => g.antwoorden.length > 0);
}

/** De zin zoals ze klinkt, met de antwoorden ingevuld. Voor de voorleesknop. */
export function volledigeZin(zin: string): string {
  return ontleedInvulzin(zin)
    .map((s) => (s.soort === "tekst" ? s.waarde : s.antwoorden[0] ?? ""))
    .join("");
}

function normaliseer(tekst: string): string {
  return tekst.trim().toLowerCase().replace(/\s+/g, " ");
}

function zonderAccenten(tekst: string): string {
  return tekst.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export type Oordeel = "juist" | "accenten" | "fout";

/**
 * Beoordeelt één ingevuld antwoord. "accenten" is een apart geval: de cursist had het
 * woord, maar niet de accenten. Dat is een andere fout dan het verkeerde woord, en
 * verdient dus een andere boodschap (feed forward, Hattie & Timperley).
 */
export function beoordeel(gegeven: string, antwoorden: string[]): Oordeel {
  const ingevuld = normaliseer(gegeven);
  if (!ingevuld) return "fout";

  const goed = antwoorden.map(normaliseer);
  if (goed.includes(ingevuld)) return "juist";
  if (goed.some((a) => zonderAccenten(a) === zonderAccenten(ingevuld))) return "accenten";
  return "fout";
}
