/*
 * Studeertips, één per scherm, in eigen woorden.
 *
 * De inhoud komt uit "Studeren met succes" (Hoof, Surma & Kirschner, Thomas More, 2023),
 * een tweeluik voor cursisten en leraren over wat de wetenschap weet over effectief
 * studeren. Zie docs/nl/STUDEERTIPS.md voor de analyse en de licentie: we nemen geen tekst
 * over, elke tip verwijst wel naar de studeerkaart of paragraaf waar ze vandaan komt.
 *
 * Regels: één tip per scherm, in de handeling, nooit blokkerend. Geen reeksen, geen druk.
 *
 * De teksten staan in src/i18n/tips.ts. Elke tekst hier is een getter, zodat hij vertaald
 * wordt op het moment dat iemand hem leest. Het veld "bron" blijft Nederlands: het verwijst
 * naar een studeerkaart of paragraaf in het Nederlandstalige boekje.
 */
import { t } from "./i18n";

/** De schermen waar een roterende tip staat. */
export type TipPlek =
  | "cursist-start"
  | "leraar-start"
  | "maken"
  | "opfrissen"
  | "digibord"
  | "live";

export interface Studietip {
  id: string;
  voor: "cursist" | "leraar";
  plek: TipPlek;
  /** Kort label vooraan, bijvoorbeeld "Zeg erbij" voor een zin die de leraar letterlijk zegt. */
  kop?: string;
  tekst: string;
  /** Studeerkaart of paragraaf in het boekje, zodat elke zin herleidbaar blijft. */
  bron: string;
}

type TipTekst =
  | "kortEnVaak"
  | "nietMeteen"
  | "vastMoment"
  | "herkennen"
  | "meldingen"
  | "benoem"
  | "drieMinuten"
  | "drieKeer"
  | "codeLater"
  | "twintig"
  | "uitlegIsLeerwinst"
  | "uitgewerktVoorbeeld"
  | "opfrissenZegErbij"
  | "drieWeken"
  | "andereKleur"
  | "doelAlsKunnen"
  | "tijdErbij"
  | "eerstZelf"
  | "liveZegWaarom";

function tip(
  id: string,
  voor: Studietip["voor"],
  plek: TipPlek,
  tekst: TipTekst,
  bron: string,
  zegErbij = false
): Studietip {
  const uit: Studietip = {
    id,
    voor,
    plek,
    bron,
    get tekst() {
      return t(`tips.tip.${tekst}`);
    },
  };
  if (zegErbij) {
    Object.defineProperty(uit, "kop", { get: () => t("tips.zegErbij"), enumerable: true });
  }
  return uit;
}

export const STUDIETIPS: Studietip[] = [
  /* ── Cursist, startpagina ─────────────────────────────────────────────── */
  tip("c-kort-en-vaak", "cursist", "cursist-start", "kortEnVaak", "studeerkaart 10"),
  tip("c-niet-meteen", "cursist", "cursist-start", "nietMeteen", "3.2.1"),
  tip("c-vast-moment", "cursist", "cursist-start", "vastMoment", "2.1"),
  tip("c-herkennen", "cursist", "cursist-start", "herkennen", "3.1"),
  tip("c-meldingen", "cursist", "cursist-start", "meldingen", "1.3.2"),

  /* ── Leraar, startpagina ──────────────────────────────────────────────── */
  tip("l-benoem", "leraar", "leraar-start", "benoem", "docenten, vier stappen"),
  tip("l-drie-minuten", "leraar", "leraar-start", "drieMinuten", "docenten, braindump"),
  tip("l-drie-keer", "leraar", "leraar-start", "drieKeer", "docenten, drie tips"),
  tip("l-code-later", "leraar", "leraar-start", "codeLater", "3.2.1"),

  /* ── Leraar, maken ────────────────────────────────────────────────────── */
  tip("m-twintig", "leraar", "maken", "twintig", "studeerkaart 1"),
  tip("m-uitleg-is-leerwinst", "leraar", "maken", "uitlegIsLeerwinst", "docenten, feedback"),
  tip("m-uitgewerkt-voorbeeld", "leraar", "maken", "uitgewerktVoorbeeld", "studeerkaart 8"),
  tip("m-code-later", "leraar", "maken", "codeLater", "3.2.1"),

  /* ── Leraar, opfrissen ────────────────────────────────────────────────── */
  tip("o-zeg-erbij", "leraar", "opfrissen", "opfrissenZegErbij", "docenten, oefentoetsen", true),
  tip("o-drie-weken", "leraar", "opfrissen", "drieWeken", "docenten, spaced retrieval"),
  tip("o-andere-kleur", "leraar", "opfrissen", "andereKleur", "studeerkaart 2"),

  /* ── Leraar, digibord ─────────────────────────────────────────────────── */
  tip("d-doel-als-kunnen", "leraar", "digibord", "doelAlsKunnen", "docenten, leerdoelen"),
  tip("d-tijd-erbij", "leraar", "digibord", "tijdErbij", "docenten, braindump"),

  /* ── Leraar, live ─────────────────────────────────────────────────────── */
  tip("v-eerst-zelf", "leraar", "live", "eerstZelf", "docenten, oefentoetsen"),
  tip("v-zeg-waarom", "leraar", "live", "liveZegWaarom", "docenten, vier stappen", true),
];

/**
 * De tip van vandaag voor een scherm. Per dag één, in vaste volgorde: wie de app elke dag
 * opent, ziet in een week alle tips zonder ooit een lijst te krijgen. Het dagnummer is
 * hetzelfde op de server en in de browser, dus de pagina springt niet om bij het laden.
 */
export function tipVanDeDag(plek: TipPlek, nu: number = Date.now()): Studietip | null {
  const tips = STUDIETIPS.filter((tip) => tip.plek === plek);
  if (tips.length === 0) return null;
  const dag = Math.floor(nu / 86_400_000);
  return tips[dag % tips.length];
}

/* ── Klasopdrachten met een vaste tijd ────────────────────────────────── */

/**
 * Korte opdrachten uit de boekjes, met de tijd die erbij hoort. De klastimer en het
 * digibordscherm zetten er met één klik de opdracht en de klok voor klaar.
 */
export interface Klasopdracht {
  id: string;
  label: string;
  minuten: number;
  opdracht: string;
  bron: string;
}

function klasopdracht(
  id: string,
  sleutel: "watWeetJeNog" | "eerstZelf" | "legUit",
  minuten: number,
  bron: string
): Klasopdracht {
  return {
    id,
    minuten,
    bron,
    get label() {
      return t(`tips.opdracht.${sleutel}.label`);
    },
    get opdracht() {
      return t(`tips.opdracht.${sleutel}.opdracht`);
    },
  };
}

export const KLASOPDRACHTEN: Klasopdracht[] = [
  klasopdracht("wat-weet-je-nog", "watWeetJeNog", 3, "studeerkaart 2, braindump"),
  klasopdracht("eerst-zelf", "eerstZelf", 1, "docenten, oefentoetsen"),
  klasopdracht("leg-uit", "legUit", 2, "studeerkaart 5"),
];

/* ── Standaardvragen voor het exit ticket ─────────────────────────────── */

/*
 * De vragen worden de vraagtekst van een nieuwe oefening, dus in de taal van wie de
 * oefening maakt.
 */
export interface Vragenset {
  id: string;
  label: string;
  uitleg: string;
  vragen: string[];
}

export const EXIT_TICKET_SETS: Vragenset[] = [
  {
    id: "ophalen",
    get label() {
      return t("tips.exitTicket.ophalen.label");
    },
    get uitleg() {
      return t("tips.exitTicket.ophalen.uitleg");
    },
    get vragen() {
      return [t("tips.exitTicket.ophalen.vraag1")];
    },
  },
  {
    id: "inschatten",
    get label() {
      return t("tips.exitTicket.inschatten.label");
    },
    get uitleg() {
      return t("tips.exitTicket.inschatten.uitleg");
    },
    get vragen() {
      return [t("tips.exitTicket.inschatten.vraag1"), t("tips.exitTicket.inschatten.vraag2")];
    },
  },
  {
    id: "vooruitkijken",
    get label() {
      return t("tips.exitTicket.vooruitkijken.label");
    },
    get uitleg() {
      return t("tips.exitTicket.vooruitkijken.uitleg");
    },
    get vragen() {
      return [t("tips.exitTicket.vooruitkijken.vraag1")];
    },
  },
];

/* ── Overzichtspagina "Slim oefenen" ──────────────────────────────────── */

export interface TipBlok {
  /** Vaste sleutel, los van de taal. */
  id: string;
  kop: string;
  tekst: string;
  /** Waar je dit in de app toepast. */
  link?: { href: string; label: string };
}

type CursistBlok = "ophalen" | "kortEnVaak" | "doorElkaar" | "inschatten" | "zonderApp";
type CursistBlokMetLink = Exclude<CursistBlok, "inschatten">;
type LeraarBlok = "benoem" | "ophalen" | "cumulatief" | "fouten" | "zelfVragen";

function cursistBlok(id: CursistBlok): TipBlok {
  return {
    id: `cursist-${id}`,
    get kop() {
      return t(`tips.slim.cursist.${id}.kop`);
    },
    get tekst() {
      return t(`tips.slim.cursist.${id}.tekst`);
    },
  };
}

function cursistBlokMetLink(id: CursistBlokMetLink, href: string): TipBlok {
  return {
    id: `cursist-${id}`,
    get kop() {
      return t(`tips.slim.cursist.${id}.kop`);
    },
    get tekst() {
      return t(`tips.slim.cursist.${id}.tekst`);
    },
    link: {
      href,
      get label() {
        return t(`tips.slim.cursist.${id}.link`);
      },
    },
  };
}

function leraarBlok(id: LeraarBlok, href: string): TipBlok {
  return {
    id: `leraar-${id}`,
    get kop() {
      return t(`tips.slim.leraar.${id}.kop`);
    },
    get tekst() {
      return t(`tips.slim.leraar.${id}.tekst`);
    },
    link: {
      href,
      get label() {
        return t(`tips.slim.leraar.${id}.link`);
      },
    },
  };
}

export const SLIM_OEFENEN_CURSIST: TipBlok[] = [
  cursistBlokMetLink("ophalen", "/bibliotheek"),
  cursistBlokMetLink("kortEnVaak", "/herhalen"),
  cursistBlokMetLink("doorElkaar", "/herhalen"),
  cursistBlok("inschatten"),
  cursistBlokMetLink("zonderApp", "/afdrukken/cornell"),
];

export const SLIM_OEFENEN_LERAAR: TipBlok[] = [
  leraarBlok("benoem", "/bibliotheek"),
  leraarBlok("ophalen", "/klastools?tool=timer"),
  leraarBlok("cumulatief", "/opfrissen"),
  leraarBlok("fouten", "/maken"),
  leraarBlok("zelfVragen", "/maken?vorm=exitticket"),
];

/** De bron. De titel blijft Nederlands: zo heet het boek. */
export const BRON = {
  titel: "Studeren met succes",
  get auteurs() {
    return t("tips.slim.auteurs");
  },
  uitgever: "Thomas More",
  jaar: 2023,
  get licentie() {
    return t("tips.slim.licentie");
  },
};
