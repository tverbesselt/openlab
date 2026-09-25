/*
 * Vergelijken van een ingetypt antwoord met wat de leraar als juist opgaf.
 *
 * De regel is bewust mild en voorspelbaar: hoofdletters, accenten, extra spaties en een
 * punt of vraagteken op het einde maken niets uit. Een cursist die op een gsm typt, mag
 * niet zakken op een ontbrekend accent. Wil een leraar strenger zijn, dan zet hij de
 * spelling in de vraag ("Schrijf met accent").
 */

/** Alles wat niet telt bij het vergelijken, weghalen. */
export function normaliseerAntwoord(tekst: string): string {
  return tekst
    .normalize("NFD")
    // Accenttekens weghalen: é wordt e, ç wordt c.
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.,;:!?'"]+$/g, "")
    .replace(/^[¿¡'"]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Klopt het ingetypte antwoord met één van de goede antwoorden? */
export function isTypAntwoordJuist(gegeven: string, antwoorden: string[] = []): boolean {
  const g = normaliseerAntwoord(gegeven);
  if (!g) return false;
  return antwoorden.some((a) => normaliseerAntwoord(a) === g);
}

/** Het antwoord dat we tonen als "het juiste antwoord": het eerste dat de leraar opgaf. */
export function toonAntwoord(antwoorden: string[] = []): string {
  return antwoorden[0] ?? "";
}

export const MAX_TYPANTWOORD = 100;
