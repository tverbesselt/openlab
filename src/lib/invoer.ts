import { OrdenItem, SorteerItem, WerkwoordItem } from "./types";

/*
 * Inhoud inlezen zoals een leraar ze typt of plakt.
 *
 * Overal dezelfde gedachte: één ding per regel, en één scheidingsteken dat je kan uitleggen
 * in één zin. Zo hoeft niemand een handleiding te lezen om materiaal te maken, en werkt
 * plakken uit Word of Excel gewoon.
 */

/** Woorden van een zin. Leestekens blijven aan het woord plakken: die horen erbij. */
export function leesZinnen(tekst: string): OrdenItem[] {
  return tekst
    .split("\n")
    .map((regel) => regel.trim())
    .filter(Boolean)
    .map((zin, index) => ({ id: `zin-${index}`, delen: zin.split(/\s+/) }))
    .filter((item) => item.delen.length > 1);
}

/**
 * Procedures: `opdracht > stap > stap > stap`, één per regel. De eerste stap is de opdracht,
 * zodat de cursist weet waarover het gaat voor hij begint te ordenen.
 */
export function leesProcedures(tekst: string): OrdenItem[] {
  return tekst
    .split("\n")
    .map((regel) => regel.trim())
    .filter(Boolean)
    .map((regel, index) => {
      const delen = regel
        .split(">")
        .map((deel) => deel.trim())
        .filter(Boolean);
      const [opdracht, ...stappen] = delen;
      return { id: `proc-${index}`, opdracht, delen: stappen };
    })
    .filter((item) => item.delen.length > 1);
}

/** Items van één bakje: één per regel. */
export function leesSorteerItems(regels: string[], categorie: number, vanaf: number): SorteerItem[] {
  return regels
    .join("\n")
    .split("\n")
    .map((regel) => regel.trim())
    .filter(Boolean)
    .map((tekst, i) => ({ id: `srt-${categorie}-${vanaf + i}`, tekst, categorie }));
}

/**
 * Werkwoorden: `infinitief; persoon=vorm; persoon=vorm; ...`, één per regel.
 * Bijvoorbeeld: parler; je=parle; tu=parles; nous=parlons
 */
export function leesWerkwoorden(tekst: string): WerkwoordItem[] {
  return tekst
    .split("\n")
    .map((regel) => regel.trim())
    .filter(Boolean)
    .map((regel, index) => {
      const delen = regel
        .split(";")
        .map((deel) => deel.trim())
        .filter(Boolean);
      const [infinitief, ...rest] = delen;

      const vormen = rest
        .map((stuk) => {
          const isteken = stuk.indexOf("=");
          if (isteken === -1) return null;
          return {
            persoon: stuk.slice(0, isteken).trim(),
            vorm: stuk.slice(isteken + 1).trim(),
          };
        })
        .filter((v): v is { persoon: string; vorm: string } => !!v && !!v.persoon && !!v.vorm);

      return { id: `ww-${index}`, infinitief: (infinitief ?? "").trim(), vormen };
    })
    .filter((item) => item.infinitief && item.vormen.length > 0);
}
