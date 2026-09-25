import { QuizQuestion, WedstrijdAntwoord, WedstrijdInstellingen, WedstrijdSpeler } from "./types";
import { hussel } from "./hussel";
import { isTypAntwoordJuist, normaliseerAntwoord, toonAntwoord } from "./typantwoord";
import { t, vergelijk } from "./i18n";

/*
 * De rekenregels van de Quizwedstrijd. Het bord van de leraar rekent, nooit het toestel
 * van de cursist: zo kan niemand zijn eigen punten of tijd aanpassen.
 */

export const STANDAARD_INSTELLINGEN: WedstrijdInstellingen = {
  spelvorm: "rustig",
  seconden: 30,
  reeksbonus: true,
  tussenstand: "elkeVraag",
  teams: 0,
};

export const MAX_PUNTEN = 1000;
/** Bonus per juist antwoord op rij, vanaf het tweede. */
export const REEKS_STAP = 100;
export const REEKS_MAX = 500;
/** Hoeveel bijnamen het bord toont in de tussenstand. */
export const TOP = 5;

/** Een vraag zoals ze in de wedstrijd loopt: antwoorden gehusseld, juiste mee verschoven. */
export interface WedstrijdVraag {
  bron: QuizQuestion;
  opties: string[];
  juist: number[];
}

/** Hussel de antwoorden van elke vraag één keer, bij de start van de wedstrijd. */
export function maakWedstrijdVragen(vragen: QuizQuestion[]): WedstrijdVraag[] {
  return vragen.map((bron) => {
    // Waar/onwaar laten we staan: "Juist" hoort nu eenmaal voor "Onjuist". Bij een vraag
    // om in te typen valt er niets te husselen.
    const volgorde =
      bron.type === "true_false" || bron.type === "typ"
        ? bron.options.map((_, i) => i)
        : hussel(bron.options.map((_, i) => i));
    return {
      bron,
      opties: volgorde.map((i) => bron.options[i]),
      juist: volgorde.flatMap((oud, nieuw) => (bron.correctAnswers.includes(oud) ? [nieuw] : [])),
    };
  });
}

export function isJuist(keuze: number[], juist: number[]): boolean {
  return keuze.length === juist.length && keuze.every((k) => juist.includes(k));
}

/** Is dit antwoord juist? Werkt voor zowel kiezen als intypen. */
export function antwoordJuist(antwoord: WedstrijdAntwoord | undefined, vraag: WedstrijdVraag): boolean {
  if (!antwoord) return false;
  if (vraag.bron.type === "typ") return isTypAntwoordJuist(antwoord.tekst ?? "", vraag.bron.antwoorden);
  return isJuist(antwoord.keuze ?? [], vraag.juist);
}

/**
 * Wat de klas intypte, samengelegd: dezelfde schrijfwijze telt als één. Zo ziet de leraar
 * in één oogopslag welke fout vaak terugkomt, zonder te weten wie ze maakte.
 */
export function telGegeven(
  antwoorden: WedstrijdAntwoord[],
  vraag: WedstrijdVraag
): { tekst: string; aantal: number; juist: boolean }[] {
  const telling = new Map<string, { tekst: string; aantal: number; juist: boolean }>();
  for (const a of antwoorden) {
    const ruw = (a.tekst ?? "").trim();
    if (!ruw) continue;
    const sleutel = normaliseerAntwoord(ruw);
    const bestaand = telling.get(sleutel);
    if (bestaand) bestaand.aantal++;
    else
      telling.set(sleutel, {
        tekst: ruw,
        aantal: 1,
        juist: isTypAntwoordJuist(ruw, vraag.bron.antwoorden),
      });
  }
  return [...telling.values()].sort((a, b) => b.aantal - a.aantal || vergelijk(a.tekst, b.tekst));
}

/** Het juiste antwoord van een typvraag, om op het bord te tonen. */
export function juisteTekstVan(vraag: WedstrijdVraag): string {
  return toonAntwoord(vraag.bron.antwoorden);
}

/**
 * Punten voor één antwoord, zonder reeksbonus.
 *  - rustig: 1000 voor juist, snelheid telt niet;
 *  - klassiek: tussen 500 en 1000, lineair minder naarmate je later antwoordt (zoals Kahoot).
 */
export function puntenVoor(
  juist: boolean,
  instellingen: WedstrijdInstellingen,
  reactieMs: number,
  limietMs: number
): number {
  if (!juist) return 0;
  if (instellingen.spelvorm === "rustig" || limietMs <= 0) return MAX_PUNTEN;
  const deel = Math.min(1, Math.max(0, reactieMs / limietMs));
  return Math.round(MAX_PUNTEN * (1 - deel / 2));
}

/** Bonus voor een reeks: het tweede juiste antwoord op rij +100, het derde +200, ... tot +500. */
export function reeksBonus(reeks: number, instellingen: WedstrijdInstellingen): number {
  if (!instellingen.reeksbonus || reeks < 2) return 0;
  return Math.min(REEKS_MAX, (reeks - 1) * REEKS_STAP);
}

/**
 * Plaatsen toekennen. Gelijke punten delen dezelfde plaats (1, 2, 2, 4), zodat niemand
 * lager eindigt omdat hij later binnenkwam.
 */
export function rangschik<T extends Pick<WedstrijdSpeler, "punten" | "bijnaam">>(
  spelers: T[]
): (T & { plaats: number })[] {
  const gesorteerd = [...spelers].sort(
    (a, b) => (b.punten ?? 0) - (a.punten ?? 0) || vergelijk(a.bijnaam, b.bijnaam)
  );
  let vorige = Number.NaN;
  let plaats = 0;
  return gesorteerd.map((s, i) => {
    const punten = s.punten ?? 0;
    if (punten !== vorige) {
      plaats = i + 1;
      vorige = punten;
    }
    return { ...s, plaats };
  });
}

/* ── Teams ─────────────────────────────────────────────────────────────── */

export const MAX_TEAMS = 4;
/** De letters van de teams; de naam eromheen ("Team A") komt uit de vertaling. */
export const TEAM_LETTERS = ["A", "B", "C", "D"];

export function teamNaam(team: number | undefined): string {
  if (team === undefined) return "";
  return t("live.team", { letter: TEAM_LETTERS[team] ?? String(team + 1) });
}

/** Eén rij in de tussenstand: een speler of een team, met dezelfde vorm. */
export interface StandRij {
  sleutel: string;
  naam: string;
  punten: number;
  /** Wat er bij de laatste vraag bij kwam, als dat te tonen valt. */
  winst?: number;
  /** Alleen bij teams: hoeveel leden meespelen. */
  leden?: number;
}

/**
 * De stand per team. De teamscore is het gemiddelde van de leden: zo wint een team niet
 * omdat het groter is. Een leeg team doet niet mee aan de rangschikking.
 */
export function teamStand(spelers: WedstrijdSpeler[], aantalTeams: number): (StandRij & { plaats: number })[] {
  const rijen: StandRij[] = [];
  for (let t = 0; t < aantalTeams; t++) {
    const leden = spelers.filter((s) => s.team === t);
    if (leden.length === 0) continue;
    const som = leden.reduce((n, s) => n + (s.punten ?? 0), 0);
    const winst = leden.reduce((n, s) => n + (s.laatste ? s.laatste.punten + s.laatste.bonus : 0), 0);
    rijen.push({
      sleutel: `team-${t}`,
      naam: teamNaam(t),
      punten: Math.round(som / leden.length),
      winst: Math.round(winst / leden.length),
      leden: leden.length,
    });
  }
  return rangschikRijen(rijen);
}

export function spelerRijen(spelers: WedstrijdSpeler[]): (StandRij & { plaats: number })[] {
  return rangschikRijen(
    spelers.map((s) => ({
      sleutel: s.apparaat,
      naam: s.bijnaam,
      punten: s.punten ?? 0,
      winst: s.laatste ? s.laatste.punten + s.laatste.bonus : undefined,
    }))
  );
}

export function rangschikRijen(rijen: StandRij[]): (StandRij & { plaats: number })[] {
  const gesorteerd = [...rijen].sort((a, b) => b.punten - a.punten || vergelijk(a.naam, b.naam));
  let vorige = Number.NaN;
  let plaats = 0;
  return gesorteerd.map((r, i) => {
    if (r.punten !== vorige) {
      plaats = i + 1;
      vorige = r.punten;
    }
    return { ...r, plaats };
  });
}

/**
 * De teams even groot maken. Wie al een team koos, wordt herverdeeld: bij een wedstrijd
 * van twee tegen zes helpt kiezen niet, en zo kost het de leraar één klik.
 */
export function verdeelTeams(spelers: WedstrijdSpeler[], aantalTeams: number): WedstrijdSpeler[] {
  if (aantalTeams < 2) return spelers.map((s) => ({ ...s, team: undefined }));
  return hussel(spelers).map((s, i) => ({ ...s, team: i % aantalTeams }));
}

/* ── Bijnamen ──────────────────────────────────────────────────────────── */

export const MAX_BIJNAAM = 20;

/*
 * Bijnamen komen uit de vertaling: een lijst eigenschappen, een lijst dieren en de volgorde
 * waarin ze in die taal staan. De lijsten zijn zo gekozen dat eigenschap en dier altijd
 * grammaticaal passen (in het Nederlands alleen de-woorden, in het Frans en Spaans alleen
 * mannelijke dieren).
 */
function woordenlijst(sleutel: "live.bijnaam.eigenschappen" | "live.bijnaam.dieren"): string[] {
  return t(sleutel)
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean);
}

function maakBijnaam(): string {
  return t("live.bijnaam.vorm", {
    eigenschap: kies(woordenlijst("live.bijnaam.eigenschappen")),
    dier: kies(woordenlijst("live.bijnaam.dieren")),
  });
}

export function willekeurigeBijnaam(bezet: string[] = []): string {
  const bezetKlein = new Set(bezet.map((b) => b.toLowerCase()));
  for (let poging = 0; poging < 30; poging++) {
    const naam = maakBijnaam();
    if (!bezetKlein.has(naam.toLowerCase())) return naam;
  }
  return `${maakBijnaam()} ${Math.floor(Math.random() * 90) + 10}`;
}

/** Spaties opkuisen en inkorten. Leeg blijft leeg. */
export function schoneBijnaam(tekst: string): string {
  return tekst.replace(/\s+/g, " ").trim().slice(0, MAX_BIJNAAM);
}

function kies<T>(lijst: T[]): T {
  return lijst[Math.floor(Math.random() * lijst.length)];
}

/* ── Kleuren en vormen ─────────────────────────────────────────────────── */

/**
 * Elke antwoordmogelijkheid heeft een kleur én een vorm, zodat ze ook te onderscheiden is
 * voor wie kleurenblind is. De tekst staat er altijd bij.
 */
export const ANTWOORD_STIJLEN = [
  { vorm: "driehoek", vlak: "bg-rose-700", rand: "border-rose-700", licht: "bg-rose-50" },
  { vorm: "ruit", vlak: "bg-sky-700", rand: "border-sky-700", licht: "bg-sky-50" },
  { vorm: "cirkel", vlak: "bg-amber-600", rand: "border-amber-600", licht: "bg-amber-50" },
  { vorm: "vierkant", vlak: "bg-emerald-700", rand: "border-emerald-700", licht: "bg-emerald-50" },
  { vorm: "ster", vlak: "bg-violet-700", rand: "border-violet-700", licht: "bg-violet-50" },
  { vorm: "zeshoek", vlak: "bg-slate-700", rand: "border-slate-700", licht: "bg-slate-100" },
] as const;

export type Vorm = (typeof ANTWOORD_STIJLEN)[number]["vorm"];

export function stijlVoor(index: number) {
  return ANTWOORD_STIJLEN[index % ANTWOORD_STIJLEN.length];
}
