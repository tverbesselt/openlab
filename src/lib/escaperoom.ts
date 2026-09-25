/*
 * Een escaperoom: sloten die één voor één opengaan met het juiste antwoord.
 *
 * Nakijken gebeurt zoals bij een quizvraag waarbij je het antwoord intypt: hoofdletters,
 * accenten en extra spaties tellen niet. Bij een getal maakt een komma of een punt als
 * decimaalteken ook niets uit, want dat verschilt per toestel en per land.
 */

import { isTypAntwoordJuist } from "./typantwoord";

/** Na zoveel foute pogingen mag de cursist de oplossing bekijken. */
export const POGINGEN_VOOR_OPLOSSING = 3;

/** "3,5" en "3.5" zijn hetzelfde getal. Tekst blijft zoals ze is. */
function decimaalGelijk(tekst: string): string {
  return tekst.replace(/(\d),(\d)/g, "$1.$2");
}

/** Opent dit antwoord het slot? */
export function opentSlot(gegeven: string, antwoorden: string[] = []): boolean {
  return isTypAntwoordJuist(
    decimaalGelijk(gegeven),
    antwoorden.map(decimaalGelijk)
  );
}

/** Eén antwoord per regel, lege regels vallen weg. */
export function leesAntwoorden(juist: string, andere: string): string[] {
  return [juist, ...andere.split("\n")].map((a) => a.trim()).filter(Boolean);
}
