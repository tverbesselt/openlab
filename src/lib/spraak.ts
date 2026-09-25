"use client";

import { t } from "./i18n";

/*
 * Voorlezen met de stem van de browser (Web Speech API).
 *
 * Waarom dit één module is: het uitspreken zat verspreid en stond vast op nl-BE, waardoor
 * een Franse woordenlijst Nederlands klonk. Woorden én beeld samen aanbieden is precies
 * waar dual coding om draait (Paivio, Mayer), dus de taal moet kloppen.
 */

export interface Taal {
  code: string;
  label: string;
}

/** Een voorleestaal; het label volgt de taal van de app. */
function taal(code: string, naam: "nl" | "fr" | "en" | "es" | "de" | "it"): Taal {
  return {
    code,
    get label() {
      return t(`oefenen.spraakTalen.${naam}`);
    },
  };
}

/** De talen waarin voorgelezen kan worden. */
export const TALEN: Taal[] = [
  taal("nl-BE", "nl"),
  taal("fr-FR", "fr"),
  taal("en-GB", "en"),
  taal("es-ES", "es"),
  taal("de-DE", "de"),
  taal("it-IT", "it"),
];

export const STANDAARD_TAAL = "nl-BE";

export function taalLabel(code: string | undefined): string {
  return (TALEN.find((l) => l.code === code) ?? TALEN[0]).label;
}

export function spraakBeschikbaar(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/*
 * getVoices() is de eerste keer vaak leeg: de browser laadt de stemmen asynchroon en
 * meldt dat via voiceschanged. We houden de lijst daarom bij in de module.
 */
let stemmen: SpeechSynthesisVoice[] = [];

function ververStemmen() {
  if (!spraakBeschikbaar()) return;
  stemmen = window.speechSynthesis.getVoices();
}

if (spraakBeschikbaar()) {
  ververStemmen();
  window.speechSynthesis.addEventListener("voiceschanged", ververStemmen);
}

/** Beste stem voor deze taal: eerst een exacte match, anders dezelfde taal in een ander land. */
function kiesStem(taal: string): SpeechSynthesisVoice | undefined {
  if (stemmen.length === 0) ververStemmen();
  const gezocht = taal.toLowerCase();
  const basis = gezocht.split("-")[0];
  return (
    stemmen.find((s) => s.lang.toLowerCase() === gezocht) ??
    stemmen.find((s) => s.lang.toLowerCase().replace("_", "-").startsWith(basis))
  );
}

/**
 * Spreekt een woord of zin uit. Klikt een cursist snel door, dan vervangt elke nieuwe
 * uiting de vorige in plaats van erachter aan te schuiven.
 */
export function spreekUit(tekst: string, taal: string = STANDAARD_TAAL) {
  if (!spraakBeschikbaar() || !tekst.trim()) return;

  const synthese = window.speechSynthesis;
  synthese.cancel();

  const uiting = new SpeechSynthesisUtterance(tekst);
  uiting.lang = taal;
  const stem = kiesStem(taal);
  if (stem) uiting.voice = stem;
  // Net onder normaal tempo: cursisten moeten het kunnen nazeggen.
  uiting.rate = 0.95;
  synthese.speak(uiting);
}

/** Zwijg meteen, bijvoorbeeld wanneer de cursist naar het volgende item gaat. */
export function zwijg() {
  if (spraakBeschikbaar()) window.speechSynthesis.cancel();
}
