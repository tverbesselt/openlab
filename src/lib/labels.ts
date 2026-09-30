import {
  Layers,
  Languages,
  Link2,
  CheckSquare,
  TextCursorInput,
  Radio,
  Cloud,
  MessageSquareText,
  Clock,
  Dices,
  Users,
  Lock,
  Building2,
  History,
  Presentation,
  ArrowDownUp,
  ListOrdered,
  Boxes,
  PenLine,
  AudioLines,
  BookOpen,
  Repeat2,
  Calculator,
  KeyRound,
  type LucideIcon,
} from "lucide-react";
import { DidacticGoal, Exercise, ExerciseType, Lesmap, Zichtbaarheid } from "./types";
import { t, tn, vergelijk } from "./i18n";

/**
 * Eén centrale plek voor alles wat de leraar te zien krijgt.
 * De app spreekt in lesfases en werkvormen, nooit in systeemwaarden
 * zoals "wordtrainer" of "collaboration".
 *
 * De teksten staan in src/i18n/werkvormen.ts. Elke tekst hier is een getter, zodat hij
 * vertaald wordt op het moment dat iemand hem leest, in de taal van dat moment.
 */

/* ── Lesfases (didactische doelen) ─────────────────────────────────────── */

export interface Lesfase {
  id: DidacticGoal;
  nummer: number;
  label: string;
  /** Wat de leraar op dat moment in de les wil doen. */
  wanneer: string;
  /** Waarom het werkt, in één zin. */
  waarom: string;
  /**
   * Wat de leraar er in de klas letterlijk bij zegt. Cursisten nemen een manier van
   * oefenen pas over als ze weten dat ze werkt (Studeren met succes, vier stappen).
   */
  zegErbij: string;
  werkvormen: ExerciseType[];
}

type FaseId = "activate" | "automate" | "check" | "reflect";

function fase(id: FaseId, nummer: number, werkvormen: ExerciseType[]): Lesfase {
  return {
    id,
    nummer,
    werkvormen,
    get label() {
      return t(`werkvormen.lesfase.${id}.label`);
    },
    get wanneer() {
      return t(`werkvormen.lesfase.${id}.wanneer`);
    },
    get waarom() {
      return t(`werkvormen.lesfase.${id}.waarom`);
    },
    get zegErbij() {
      return t(`werkvormen.lesfase.${id}.zegErbij`);
    },
  };
}

export const LESFASES: Lesfase[] = [
  fase("activate", 1, ["poll", "wordcloud"]),
  fase("automate", 2, [
    "flashcard",
    "wordtrainer",
    "matching",
    "fillblank",
    "zinbouwen",
    "volgorde",
    "sorteren",
    "werkwoorden",
    "rekenen",
  ]),
  fase("check", 3, ["quiz", "lezen", "openvraag", "escaperoom"]),
  fase("reflect", 4, ["exitticket"]),
];

export const LESFASE_BY_ID: Record<DidacticGoal, Lesfase | undefined> = {
  activate: LESFASES[0],
  automate: LESFASES[1],
  check: LESFASES[2],
  reflect: LESFASES[3],
  facilitate: undefined,
};

export function lesfaseLabel(goal: DidacticGoal): string {
  return LESFASE_BY_ID[goal]?.label ?? t("werkvormen.klastools");
}

/* ── Werkvormen ────────────────────────────────────────────────────────── */

export interface Werkvorm {
  id: ExerciseType;
  label: string;
  /** Wat is dit, in mensentaal. Eén zin, voor een leraar die het nog nooit zag. */
  uitleg: string;
  icon: LucideIcon;
  /** Waar draait de werkvorm: op het digibord of op het toestel van de cursist. */
  waar: "klas" | "cursist";
  /**
   * Enkelvoud/meervoud van de inhoud, zonder getal. Voor "12 kaarten" gebruik je
   * inhoudSamenvatting(): die kent de meervoudsregels van elke taal.
   */
  eenheid: [enkelvoud: string, meervoud: string];
}

/** De eenheden in src/i18n/werkvormen.ts, onder "eenheid". */
type Eenheid =
  | "kaart"
  | "woord"
  | "paar"
  | "vraag"
  | "zin"
  | "procedure"
  | "item"
  | "werkwoord"
  | "opgave"
  | "slot"
  | "antwoordoptie"
  | "tool";

const EENHEID: Record<ExerciseType, Eenheid> = {
  flashcard: "kaart",
  wordtrainer: "woord",
  matching: "paar",
  quiz: "vraag",
  fillblank: "zin",
  zinbouwen: "zin",
  volgorde: "procedure",
  sorteren: "item",
  openvraag: "vraag",
  lezen: "vraag",
  werkwoorden: "werkwoord",
  rekenen: "opgave",
  escaperoom: "slot",
  poll: "antwoordoptie",
  wordcloud: "vraag",
  exitticket: "vraag",
  timer: "tool",
  randomizer: "tool",
  groupmaker: "tool",
};

/** Het woord zonder getal: "{n} kaarten" wordt "kaarten". */
function eenheidWoord(e: Eenheid, vorm: "one" | "other"): string {
  return t(`werkvormen.eenheid.${e}.${vorm}`, { n: "" }).trim();
}

function werkvorm(id: ExerciseType, icon: LucideIcon, waar: "klas" | "cursist"): Werkvorm {
  return {
    id,
    icon,
    waar,
    get label() {
      return t(`werkvormen.vorm.${id}.label`);
    },
    get uitleg() {
      return t(`werkvormen.vorm.${id}.uitleg`);
    },
    get eenheid(): [string, string] {
      return [eenheidWoord(EENHEID[id], "one"), eenheidWoord(EENHEID[id], "other")];
    },
  };
}

export const WERKVORMEN: Record<ExerciseType, Werkvorm> = {
  flashcard: werkvorm("flashcard", Layers, "cursist"),
  wordtrainer: werkvorm("wordtrainer", Languages, "cursist"),
  matching: werkvorm("matching", Link2, "cursist"),
  quiz: werkvorm("quiz", CheckSquare, "cursist"),
  fillblank: werkvorm("fillblank", TextCursorInput, "cursist"),
  zinbouwen: werkvorm("zinbouwen", ArrowDownUp, "cursist"),
  volgorde: werkvorm("volgorde", ListOrdered, "cursist"),
  sorteren: werkvorm("sorteren", Boxes, "cursist"),
  openvraag: werkvorm("openvraag", PenLine, "cursist"),
  lezen: werkvorm("lezen", BookOpen, "cursist"),
  werkwoorden: werkvorm("werkwoorden", Repeat2, "cursist"),
  rekenen: werkvorm("rekenen", Calculator, "cursist"),
  escaperoom: werkvorm("escaperoom", KeyRound, "cursist"),
  poll: werkvorm("poll", Radio, "klas"),
  wordcloud: werkvorm("wordcloud", Cloud, "klas"),
  exitticket: werkvorm("exitticket", MessageSquareText, "cursist"),
  timer: werkvorm("timer", Clock, "klas"),
  randomizer: werkvorm("randomizer", Dices, "klas"),
  groupmaker: werkvorm("groupmaker", Users, "klas"),
};

/**
 * Een klastool: dezelfde velden als de werkvorm, met een eigen id en een link. Geen spread
 * van de werkvorm, want die zou de getters één keer uitlezen en de tekst vastzetten.
 */
function klastool<Id extends string>(id: Id, vorm: "timer" | "randomizer" | "groupmaker", href: string) {
  const bron = WERKVORMEN[vorm];
  return {
    id,
    href,
    icon: bron.icon,
    waar: bron.waar,
    get label() {
      return bron.label;
    },
    get uitleg() {
      return bron.uitleg;
    },
    get eenheid() {
      return bron.eenheid;
    },
  };
}

export const KLASTOOLS = [
  klastool("timer", "timer", "/klastools?tool=timer"),
  klastool("randomizer", "randomizer", "/klastools?tool=randomizer"),
  klastool("groups", "groupmaker", "/klastools?tool=groups"),
  {
    // Geen werkvorm: er komt geen oefening uit, alleen tekst om verder te gebruiken.
    id: "audiotekst" as const,
    href: "/klastools?tool=audiotekst",
    icon: AudioLines as LucideIcon,
    waar: "klas" as const,
    get label() {
      return t("werkvormen.leshulp.audiotekst.label");
    },
    get uitleg() {
      return t("werkvormen.leshulp.audiotekst.uitleg");
    },
  },
];

/**
 * Alles wat je tijdens de les zonder voorbereiding opent. De klastools plus het opfrissen,
 * dat wel materiaal gebruikt maar geen enkele voorbereiding vraagt.
 */
export interface Leshulp {
  id: string;
  label: string;
  uitleg: string;
  icon: LucideIcon;
  href: string;
}

function leshulp(id: "opfrissen" | "digibord", icon: LucideIcon, href: string): Leshulp {
  return {
    id,
    icon,
    href,
    get label() {
      return t(`werkvormen.leshulp.${id}.label`);
    },
    get uitleg() {
      return t(`werkvormen.leshulp.${id}.uitleg`);
    },
  };
}

export const LESHULP: Leshulp[] = [
  ...KLASTOOLS.map(
    (tool): Leshulp => ({
      id: tool.id,
      icon: tool.icon,
      href: tool.href,
      get label() {
        return tool.label;
      },
      get uitleg() {
        return tool.uitleg;
      },
    })
  ),
  leshulp("opfrissen", History, "/opfrissen"),
  leshulp("digibord", Presentation, "/digibord"),
];

/* ── Zichtbaarheid ─────────────────────────────────────────────────────── */

function zichtbaarheid(id: Zichtbaarheid, icon: LucideIcon) {
  return {
    icon,
    get label() {
      return t(`werkvormen.zichtbaarheid.${id}.label`);
    },
    get kort() {
      return t(`werkvormen.zichtbaarheid.${id}.kort`);
    },
    get uitleg() {
      return t(`werkvormen.zichtbaarheid.${id}.uitleg`);
    },
  };
}

export const ZICHTBAARHEID: Record<
  Zichtbaarheid,
  { label: string; kort: string; uitleg: string; icon: LucideIcon }
> = {
  prive: zichtbaarheid("prive", Lock),
  organisatie: zichtbaarheid("organisatie", Building2),
};


/* ── Helpers ───────────────────────────────────────────────────────────── */

/** Hoeveel items zitten er in deze oefening? */
export function aantalItems(ex: Exercise): number {
  const c = ex.content;
  const perType: Partial<Record<ExerciseType, number>> = {
    flashcard: c.flashcards?.length,
    quiz: c.questions?.length,
    matching: c.matchingPairs?.length,
    wordtrainer: c.wordTrainerItems?.length,
    fillblank: c.fillBlanks?.length,
    zinbouwen: c.ordenItems?.length,
    volgorde: c.ordenItems?.length,
    sorteren: c.sorteerItems?.length,
    openvraag: c.openVragen?.length,
    lezen: c.questions?.length,
    werkwoorden: c.werkwoorden?.length,
    rekenen: c.rekenopdracht?.aantal,
    escaperoom: c.escaperoom?.sloten.length,
    poll: c.pollOptions?.length,
    wordcloud: c.wordCloudPrompt ? 1 : 0,
    exitticket: c.exitTicketPrompts?.length,
  };
  return perType[ex.type] ?? 0;
}

/** Aantal items in een oefening, plus het juiste woord erbij. */
export function inhoudSamenvatting(ex: Exercise): string {
  return tn(`werkvormen.eenheid.${EENHEID[ex.type]}`, aantalItems(ex));
}

/**
 * Ruwe tijdsinschatting per werkvorm, in seconden per item. Bewust aan de royale
 * kant: een cursist die sneller klaar is voelt zich goed, omgekeerd niet.
 */
const SECONDEN_PER_ITEM: Record<ExerciseType, number> = {
  flashcard: 15,
  wordtrainer: 25,
  matching: 20,
  quiz: 30,
  fillblank: 25,
  zinbouwen: 40,
  volgorde: 60,
  sorteren: 15,
  openvraag: 90,
  lezen: 45,
  werkwoorden: 20,
  rekenen: 45,
  // Samen overleggen, zoeken en een hint lezen kost tijd.
  escaperoom: 120,
  poll: 20,
  wordcloud: 20,
  exitticket: 60,
  timer: 0,
  randomizer: 0,
  groupmaker: 0,
};

/** "± 3 min" — geeft de cursist vooraf zicht op wat hij aangaat. */
export function geschatteDuur(ex: Exercise): string {
  const seconden = aantalItems(ex) * SECONDEN_PER_ITEM[ex.type];
  const minuten = Math.max(1, Math.round(seconden / 60));
  return t("werkvormen.duur", { n: minuten });
}

/** Draait deze werkvorm klassikaal op het digibord? */
export function isKlassikaal(ex: Exercise): boolean {
  return WERKVORMEN[ex.type].waar === "klas";
}

/** Wie er kijkt: genoeg om te weten of iets van hem is. */
export interface Eigenaar {
  /** Firebase-uid, of het e-mailadres in demomodus. */
  id?: string;
  naam: string;
}

function isVan(
  item: { creatorId?: string; creatorName: string },
  eigenaar: Eigenaar | null | undefined
): boolean {
  if (!eigenaar) return false;
  // Materiaal met een eigenaar-id vergelijk je op id; voorbeeldmateriaal heeft er geen en
  // valt terug op de naam.
  if (item.creatorId) return !!eigenaar.id && item.creatorId === eigenaar.id;
  return item.creatorName.toLowerCase().startsWith(eigenaar.naam.toLowerCase());
}

/** Materiaal dat de leraar zelf maakte of kopieerde. */
export function isEigenMateriaal(ex: Exercise, eigenaar: Eigenaar | null | undefined): boolean {
  return isVan(ex, eigenaar);
}

/** Is deze map van deze leraar? */
export function isEigenMap(map: Lesmap, eigenaar: Eigenaar | null | undefined): boolean {
  return isVan(map, eigenaar);
}

/**
 * Wat deze persoon in de bibliotheek te zien krijgt: alles wat met de organisatie
 * gedeeld is, plus het eigen materiaal. Privé materiaal van een collega blijft weg.
 */
export function zichtbaarVoor(
  oefeningen: Exercise[],
  eigenaar: Eigenaar | null | undefined
): Exercise[] {
  return oefeningen.filter(
    (ex) => ex.visibility === "organisatie" || isEigenMateriaal(ex, eigenaar)
  );
}

/**
 * De persoonlijke mappen van deze leraar, nieuwste eerst. Een organisatiemap die een
 * beheerder aanmaakte, hoort daar niet bij: die is van de school.
 */
export function eigenMappen(mappen: Lesmap[], eigenaar: Eigenaar | null | undefined): Lesmap[] {
  if (!eigenaar) return [];
  return mappen
    .filter((m) => !m.organisatie && isEigenMap(m, eigenaar))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** De mappen van de organisatie, alfabetisch: zo vind je een vak of opleiding snel terug. */
export function organisatieMappen(mappen: Lesmap[]): Lesmap[] {
  return mappen
    .filter((m) => m.organisatie)
    .sort((a, b) => vergelijk(a.title, b.title));
}

/**
 * Past deze oefening in een organisatiemap? Alleen wat met heel de school gedeeld is:
 * privé materiaal zou er voor collega's als een gat in de map staan.
 */
export function pastInOrganisatiemap(ex: Exercise): boolean {
  return ex.visibility === "organisatie";
}

/** In welke mappen zit deze oefening? */
export function mappenVanOefening(mappen: Lesmap[], oefeningId: string): Lesmap[] {
  return mappen.filter((m) => m.exerciseIds.includes(oefeningId));
}
