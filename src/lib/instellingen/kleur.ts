/*
 * Het kleurschema. De beheerder kiest één merkkleur; de rest van de schaal volgt daaruit.
 *
 * De donkere tinten zijn de merkkleur gemengd met zwart, de lichte met wit. Knoppen
 * gebruiken tint 800 met witte tekst: die moet 4,5:1 halen (WCAG AA). Is de gekozen kleur
 * te licht, dan schuiven de donkere tinten op tot dat lukt. De merkkleur zelf blijft
 * zoals gekozen, voor lijnen, iconen en accenten.
 */

export type Tint = "50" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
export type Palet = Record<Tint, string>;

export interface Kleurschema {
  id: string;
  kleur: string;
}

/** Kant-en-klare schema's. De namen staan in de vertaling: beheer.kleuren.<id>. */
export const KLEURSCHEMAS: Kleurschema[] = [
  { id: "blauw", kleur: "#2f6fde" },
  { id: "turkoois", kleur: "#34b0ad" },
  { id: "groen", kleur: "#2e9e5b" },
  { id: "paars", kleur: "#7c4dcc" },
  { id: "roze", kleur: "#d6457f" },
  { id: "rood", kleur: "#d64545" },
  { id: "oranje", kleur: "#e07b24" },
  { id: "leisteen", kleur: "#475569" },
];

export const STANDAARD_KLEUR = KLEURSCHEMAS[0].kleur;

export function isHex(x: unknown): x is string {
  return typeof x === "string" && /^#[0-9a-fA-F]{6}$/.test(x);
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function hex([r, g, b]: [number, number, number]): string {
  return "#" + [r, g, b].map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0")).join("");
}

/** Meng met wit (aandeel > 0) of zwart (aandeel < 0). */
function meng(kleur: string, aandeel: number): string {
  const c = rgb(kleur);
  if (aandeel >= 0) return hex(c.map((x) => x + (255 - x) * aandeel) as [number, number, number]);
  return hex(c.map((x) => x * (1 + aandeel)) as [number, number, number]);
}

function luminantie(kleur: string): number {
  const [r, g, b] = rgb(kleur).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrastverhouding tussen twee kleuren, van 1 tot 21. */
export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminantie(a), luminantie(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

export function maakPalet(kleur: string): Palet {
  const basis = isHex(kleur) ? kleur.toLowerCase() : STANDAARD_KLEUR;
  // Hoeveel zwart erbij moet voor tint 800. Standaard 36%; meer als wit er niet op leesbaar is.
  let donker = 0.36;
  while (contrast(meng(basis, -donker), "#ffffff") < 4.5 && donker < 0.9) donker += 0.04;
  const extra = donker - 0.36;
  return {
    "50": meng(basis, 0.93),
    "300": meng(basis, 0.43),
    "400": meng(basis, 0.2),
    "500": basis,
    "600": meng(basis, -(0.1 + extra * 0.5)),
    "700": meng(basis, -(0.2 + extra * 0.8)),
    "800": meng(basis, -donker),
    "900": meng(basis, -Math.min(0.92, donker + 0.15)),
  };
}

/** De CSS-variabelen die globals.css leest. */
export function paletVariabelen(palet: Palet): Record<string, string> {
  const uit: Record<string, string> = {};
  for (const [tint, waarde] of Object.entries(palet)) uit[`--merk-${tint}`] = waarde;
  return uit;
}

export function pasPaletToe(palet: Palet): void {
  const stijl = document.documentElement.style;
  for (const [naam, waarde] of Object.entries(paletVariabelen(palet))) stijl.setProperty(naam, waarde);
}

/** De tint die nu op de pagina staat, bijvoorbeeld voor een QR-code in de merkkleur. */
export function merkTint(tint: Tint): string {
  if (typeof document === "undefined") return "#1f2937";
  const w = getComputedStyle(document.documentElement).getPropertyValue(`--merk-${tint}`).trim();
  return isHex(w) ? w : "#1f2937";
}
