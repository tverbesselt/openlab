import { ALLE_TALEN, isTaal, type Taal } from "@/lib/i18n";
import { ALLE_FUNCTIES, type FunctieId } from "./functies";
import { STANDAARD_KLEUR, isHex } from "./kleur";

/**
 * De instellingen van deze installatie. Eén document, dat iedereen mag lezen en alleen een
 * beheerder mag wijzigen (Firestore: instellingen/app; zonder Firebase: deze browser).
 */
export interface Instellingen {
  /** Naam van de app, in de kop, de titel van het tabblad en op afdrukken. */
  naam: string;
  /** Naam van de school of organisatie. Leeg = geen naam tonen. */
  organisatie: string;
  /** Logo als data-URL (webp of png), al verkleind. Null = het standaardicoon. */
  logo: string | null;
  /** De merkkleur; de rest van het schema volgt daaruit. */
  kleur: string;
  /** Talen waartussen gebruikers kunnen kiezen. Minstens één. */
  talen: Taal[];
  /** De taal voor wie nog niets koos. Altijd één van `talen`. */
  standaardTaal: Taal;
  /**
   * Functies die uit staan. Een lijst van wat uit staat, en niet van wat aan staat: zo staat
   * een werkvorm die er in een nieuwe versie bijkomt, meteen aan.
   */
  uit: FunctieId[];
  tips: {
    /** Studeertips voor cursisten: op de startpagina, bij het oefenen, "Slim oefenen". */
    cursisten: boolean;
    /** Didactische tips voor leraren: bij het maken, in de klas, de lesfases. */
    leraren: boolean;
  };
  /** Wie als leraar of cursist mag aanmelden. Alleen van belang met Firebase. */
  toegang: Toegang;
}

export interface Toegang {
  /** E-maildomeinen van leraren, zoals "school.org". */
  leraarDomeinen: string[];
  /** E-maildomeinen van cursisten. "*" = elk Google-account. */
  cursistDomeinen: string[];
  /**
   * Optioneel: een reguliere expressie op het volledige e-mailadres die altijd een cursist
   * aanduidt, ook op een leraardomein. Voor scholen waar iedereen op hetzelfde domein zit,
   * bijvoorbeeld ^s\d+@school\.org$ voor leerlingnummers.
   */
  cursistPatroon: string;
}

export const STANDAARD_INSTELLINGEN: Instellingen = {
  naam: "OpenLab",
  organisatie: "",
  logo: null,
  kleur: STANDAARD_KLEUR,
  talen: [...ALLE_TALEN],
  // Tot een beheerder iets bewaart. De publieke demo zet hier Engels.
  standaardTaal: isTaal(process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE) ? process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE : "nl",
  uit: [],
  tips: { cursisten: true, leraren: true },
  toegang: { leraarDomeinen: [], cursistDomeinen: [], cursistPatroon: "" },
};

/** Grootste logo dat we bewaren, in tekens van de data-URL. */
export const MAX_LOGO = 200_000;

function lijst(x: unknown): string[] {
  return Array.isArray(x) ? x.filter((d): d is string => typeof d === "string") : [];
}

/**
 * Maakt van wat er bewaard staat een volledig en geldig geheel. Oude of half ingevulde
 * documenten vallen zo terug op de standaard, in plaats van de app te laten vastlopen.
 */
export function normaliseer(ruw: unknown): Instellingen {
  const r = (ruw && typeof ruw === "object" ? ruw : {}) as Record<string, unknown>;
  const s = STANDAARD_INSTELLINGEN;
  const talen = lijst(r.talen).filter(isTaal);
  const geldigeTalen = talen.length ? talen : s.talen;
  const standaardTaal = isTaal(r.standaardTaal) && geldigeTalen.includes(r.standaardTaal)
    ? r.standaardTaal
    : geldigeTalen[0];
  const tips = (r.tips && typeof r.tips === "object" ? r.tips : {}) as Record<string, unknown>;
  const toegang = (r.toegang && typeof r.toegang === "object" ? r.toegang : {}) as Record<string, unknown>;
  const logo = typeof r.logo === "string" && r.logo.startsWith("data:image/") && r.logo.length <= MAX_LOGO
    ? r.logo
    : null;

  return {
    naam: typeof r.naam === "string" && r.naam.trim() ? r.naam.trim().slice(0, 40) : s.naam,
    organisatie: typeof r.organisatie === "string" ? r.organisatie.trim().slice(0, 80) : s.organisatie,
    logo,
    kleur: isHex(r.kleur) ? r.kleur.toLowerCase() : s.kleur,
    talen: geldigeTalen,
    standaardTaal,
    uit: lijst(r.uit).filter((f): f is FunctieId => (ALLE_FUNCTIES as string[]).includes(f)),
    tips: {
      cursisten: typeof tips.cursisten === "boolean" ? tips.cursisten : s.tips.cursisten,
      leraren: typeof tips.leraren === "boolean" ? tips.leraren : s.tips.leraren,
    },
    toegang: {
      leraarDomeinen: lijst(toegang.leraarDomeinen).map((d) => d.trim().toLowerCase()).filter(Boolean),
      cursistDomeinen: lijst(toegang.cursistDomeinen).map((d) => d.trim().toLowerCase()).filter(Boolean),
      cursistPatroon: typeof toegang.cursistPatroon === "string" ? toegang.cursistPatroon.trim() : "",
    },
  };
}
