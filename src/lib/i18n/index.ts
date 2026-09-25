/*
 * Vertalen.
 *
 *   t("algemeen.opslaan")                      → "Opslaan" / "Save" / ...
 *   t("maken.bewaard", { titel: "Les 3" })      → vult {titel} in
 *   tn("werkvormen.eenheid.kaart", 12)          → kiest .one of .other en vult {n} in
 *
 * {app} en {organisatie} vullen zichzelf in met de naam uit het beheer.
 *
 * De huidige taal is één waarde voor de hele app. De app rendert pas in de browser, nadat
 * de instellingen geladen zijn (zie AppProvider), en tekent alles opnieuw als de taal
 * wisselt. Daarom mag t() overal gebruikt worden: in componenten, in lib-bestanden en in
 * getters van constante lijsten. Roep t() niet aan op het hoogste niveau van een module:
 * dan staat de tekst vast in de taal van het moment waarop de module laadde.
 */
import { NAAMRUIMTES, type Sleutel, type MeervoudSleutel } from "@/i18n";
import type { Boom } from "@/i18n/definieer";

export type { Sleutel, MeervoudSleutel } from "@/i18n";

export type Taal = "nl" | "en" | "fr" | "es";

export interface TaalInfo {
  code: Taal;
  /** De naam in de taal zelf: zo vindt iedereen zijn eigen taal terug. */
  naam: string;
  /** BCP 47, voor datums, getallen en sorteren. */
  locale: string;
}

export const TALEN: TaalInfo[] = [
  { code: "nl", naam: "Nederlands", locale: "nl-BE" },
  { code: "en", naam: "English", locale: "en-GB" },
  { code: "fr", naam: "Français", locale: "fr-BE" },
  { code: "es", naam: "Español", locale: "es-ES" },
];

export const ALLE_TALEN: Taal[] = TALEN.map((l) => l.code);

export function isTaal(x: unknown): x is Taal {
  return typeof x === "string" && (ALLE_TALEN as string[]).includes(x);
}

export type Vars = Record<string, string | number>;

let huidig: Taal = "nl";
let vaste: Vars = {};

/** De taal waarin de app nu spreekt. */
export function taal(): Taal {
  return huidig;
}

/** BCP 47-code van de huidige taal, voor toLocaleDateString, localeCompare en Intl. */
export function locale(): string {
  return TALEN.find((l) => l.code === huidig)?.locale ?? "nl-BE";
}

/** Alleen voor AppProvider: de taal en de vaste invulwaarden zetten. */
export function zetTaal(nieuw: Taal, vast: Vars = vaste): void {
  huidig = nieuw;
  vaste = vast;
}

/** Een vaste invulwaarde zoals {app}, of undefined. */
export function vasteWaarde(naam: string): string | undefined {
  const w = vaste[naam];
  return w === undefined ? undefined : String(w);
}

/* ── Opzoeken ──────────────────────────────────────────────────────────── */

const platCache = new Map<Taal, Map<string, string>>();

function plat(boom: Boom, voor: string, uit: Map<string, string>) {
  for (const [k, v] of Object.entries(boom)) {
    const pad = voor ? `${voor}.${k}` : k;
    if (typeof v === "string") uit.set(pad, v);
    else plat(v, pad, uit);
  }
}

function woordenboek(l: Taal): Map<string, string> {
  let w = platCache.get(l);
  if (!w) {
    w = new Map();
    for (const [naam, ruimte] of Object.entries(NAAMRUIMTES)) {
      plat((ruimte as unknown as Record<Taal, Boom>)[l], naam, w);
    }
    platCache.set(l, w);
  }
  return w;
}

function vul(tekst: string, vars?: Vars): string {
  return tekst.replace(/\{(\w+)\}/g, (heel, naam: string) => {
    const w = vars?.[naam] ?? vaste[naam];
    return w === undefined ? heel : String(w);
  });
}

/** De ruwe tekst, zonder invullen. Valt terug op Nederlands, dan op de sleutel zelf. */
export function ruw(sleutel: string): string {
  return woordenboek(huidig).get(sleutel) ?? woordenboek("nl").get(sleutel) ?? sleutel;
}

/** Vertaal een sleutel naar de huidige taal. */
export function t(sleutel: Sleutel, vars?: Vars): string {
  return vul(ruw(sleutel), vars);
}

/**
 * Enkelvoud of meervoud. De sleutel wijst naar een tak met "one" en "other"; {n} is het
 * getal. Frans telt 0 als enkelvoud, daarom Intl.PluralRules en geen n === 1.
 */
export function tn(sleutel: MeervoudSleutel, n: number, vars?: Vars): string {
  const vorm = new Intl.PluralRules(locale()).select(n) === "one" ? "one" : "other";
  return vul(ruw(`${sleutel}.${vorm}`), { n, ...vars });
}

/** Bestaat deze sleutel? Handig bij sleutels die uit data komen. */
export function heeftSleutel(sleutel: string): boolean {
  return woordenboek("nl").has(sleutel);
}

/** Een datum in de huidige taal, bijvoorbeeld "12 maart 2026". */
export function datum(d: Date | string | number, opties?: Intl.DateTimeFormatOptions): string {
  return new Date(d).toLocaleDateString(locale(), opties ?? { day: "numeric", month: "long", year: "numeric" });
}

/** Sorteren volgens de huidige taal. */
export function vergelijk(a: string, b: string): number {
  return a.localeCompare(b, locale());
}
