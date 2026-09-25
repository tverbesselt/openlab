import { Exercise, FlashcardItem, Herhaling } from "./types";
import { t, datum as toonDatum } from "./i18n";

/*
 * Gespreid herhalen volgens het Leitner-principe.
 *
 * Een kaart die je wist, komt pas veel later terug; een kaart die je niet wist, morgen al.
 * Precies dat spreiden zorgt dat kennis blijft hangen (Cepeda e.a. 2006; Dunlosky e.a. 2013).
 *
 * Bewust géén straf bij een gemiste dag: volwassen cursisten haken af bij reeksen en
 * strafpunten, en missen doen ze niet uit onwil maar omdat het leven tussenkomt (Knowles).
 * Wie een week wegblijft, vindt gewoon zijn kaarten terug, niet een verloren reeks.
 */

/** Aantal dagen tot de volgende beurt, per doos. Doos 0 = nog in deze sessie. */
export const DAGEN_PER_DOOS = [0, 1, 2, 4, 8, 16];

export const HOOGSTE_DOOS = DAGEN_PER_DOOS.length - 1;

export type Zelfoordeel = "wist" | "twijfel" | "niet";

/** Datum van vandaag als JJJJ-MM-DD, in de tijdzone van de gebruiker. */
export function vandaag(datum: Date = new Date()): string {
  const maand = String(datum.getMonth() + 1).padStart(2, "0");
  const dag = String(datum.getDate()).padStart(2, "0");
  return `${datum.getFullYear()}-${maand}-${dag}`;
}

export function overDagen(dagen: number, vanaf: Date = new Date()): string {
  const later = new Date(vanaf);
  later.setDate(later.getDate() + dagen);
  return vandaag(later);
}

/**
 * Waar de kaart na dit oordeel terechtkomt. Twijfel houdt de kaart waar ze is: je kende
 * het antwoord, maar niet vlot genoeg om de tussenpoos te verlengen.
 */
export function volgendeDoos(doos: number, oordeel: Zelfoordeel): number {
  if (oordeel === "niet") return 0;
  if (oordeel === "twijfel") return Math.max(0, Math.min(doos, HOOGSTE_DOOS));
  return Math.min(doos + 1, HOOGSTE_DOOS);
}

export function sleutel(oefeningId: string, kaartId: string): string {
  return `${oefeningId}__${kaartId}`;
}

/** De bijgewerkte planning voor één kaart na een zelfbeoordeling. */
export function plan(
  oefeningId: string,
  kaartId: string,
  oordeel: Zelfoordeel,
  bestaand?: Herhaling
): Herhaling {
  const doos = volgendeDoos(bestaand?.doos ?? 0, oordeel);
  return {
    id: sleutel(oefeningId, kaartId),
    oefeningId,
    kaartId,
    doos,
    volgende: overDagen(DAGEN_PER_DOOS[doos]),
    bijgewerkt: new Date().toISOString(),
  };
}

/** Staat deze kaart vandaag (of eerder al) klaar? */
export function isAanDeBeurt(herhaling: Herhaling, op: string = vandaag()): boolean {
  return herhaling.volgende <= op;
}

/**
 * Wat de cursist te zien krijgt: "Vandaag: 8 kaarten". Kaarten die hij nog nooit zag,
 * tellen niet mee — die horen bij de oefening zelf, niet bij het herhalen.
 */
export function aanDeBeurt(herhalingen: Herhaling[], op: string = vandaag()): Herhaling[] {
  return herhalingen
    .filter((h) => isAanDeBeurt(h, op))
    .sort((a, b) => a.volgende.localeCompare(b.volgende));
}

/** Eerstvolgende datum waarop er weer iets klaarstaat, of null als er niets gepland is. */
export function volgendeBeurt(herhalingen: Herhaling[], op: string = vandaag()): string | null {
  const later = herhalingen.map((h) => h.volgende).filter((d) => d > op);
  return later.length > 0 ? later.sort()[0] : null;
}

/** "vandaag", "morgen" of "op 14 september" — in de taal van de cursist. */
export function datumInWoorden(datum: string, op: string = vandaag()): string {
  if (datum <= op) return t("oefenen.datum.vandaag");
  if (datum === overDagen(1, new Date(`${op}T12:00:00`))) return t("oefenen.datum.morgen");

  // Om 12 uur 's middags, zodat een tijdzone de dag niet verschuift.
  const dag = toonDatum(`${datum}T12:00:00`, { day: "numeric", month: "long" });
  return t("oefenen.datum.op", { datum: dag });
}

/**
 * De kaart achter een herhaling. Flashcards en woorden uit de woordtrainer worden allebei
 * als kaart geoefend, dus ze komen hier op dezelfde vorm uit.
 */
export function kaartUit(ex: Exercise, kaartId: string): FlashcardItem | null {
  const kaart = ex.content.flashcards?.find((k) => k.id === kaartId);
  if (kaart) return kaart;

  const woord = ex.content.wordTrainerItems?.find((w) => w.id === kaartId);
  if (woord) {
    return {
      id: woord.id,
      front: woord.word,
      back: woord.translation,
      exampleSentence: woord.exampleSentence,
    };
  }
  return null;
}
