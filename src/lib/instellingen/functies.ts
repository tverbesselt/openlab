import type { ExerciseType } from "@/lib/types";

/*
 * Alles wat de beheerder aan of uit kan zetten.
 *
 * Een functie die uit staat, verdwijnt uit de menu's en de keuzeschermen. Bestaand materiaal
 * van dat type blijft bewaard, maar opent niet meer: wie het probeert, ziet dat deze
 * werkvorm uitgeschakeld is. Zet je ze weer aan, dan is alles terug.
 */

/** Live-activiteiten en hulpmiddelen die geen eigen oefeningstype zijn. */
export type ExtraFunctie =
  | "snellevraag"
  | "begripsmeter"
  | "wedstrijd"
  | "bord"
  | "opfrissen"
  | "digibord"
  | "herhalen"
  | "afdrukken"
  | "inlezen"
  | "audiotekst";

export type FunctieId = ExerciseType | ExtraFunctie;

export interface Functiegroep {
  /** Naam in de vertaling: beheer.groepen.<id>. */
  id: "inoefenen" | "controleren" | "activeren" | "live" | "klastools" | "cursist" | "spraak";
  functies: FunctieId[];
}

export const FUNCTIEGROEPEN: Functiegroep[] = [
  {
    id: "inoefenen",
    functies: [
      "flashcard",
      "wordtrainer",
      "matching",
      "fillblank",
      "zinbouwen",
      "volgorde",
      "sorteren",
      "werkwoorden",
      "rekenen",
    ],
  },
  { id: "controleren", functies: ["quiz", "lezen", "openvraag", "escaperoom", "exitticket"] },
  { id: "activeren", functies: ["poll", "wordcloud"] },
  { id: "live", functies: ["snellevraag", "begripsmeter", "wedstrijd", "bord"] },
  { id: "klastools", functies: ["timer", "randomizer", "groupmaker", "opfrissen", "digibord"] },
  { id: "cursist", functies: ["herhalen", "afdrukken"] },
  // Werkt pas met een sleutel van OpenAI (Beheer > Spraak). Zonder sleutel blijven de knoppen weg.
  { id: "spraak", functies: ["inlezen", "audiotekst"] },
];

export const ALLE_FUNCTIES: FunctieId[] = FUNCTIEGROEPEN.flatMap((g) => g.functies);

/** Is dit een eigen oefeningstype (en dus een label in WERKVORMEN)? */
export function isExtraFunctie(id: FunctieId): id is ExtraFunctie {
  return [
    "snellevraag",
    "begripsmeter",
    "wedstrijd",
    "bord",
    "opfrissen",
    "digibord",
    "herhalen",
    "afdrukken",
    "inlezen",
    "audiotekst",
  ].includes(id);
}

/**
 * Sommige functies hangen van een andere af. De quizwedstrijd speelt een Eenvoudige quiz,
 * dus zonder quiz is er ook geen wedstrijd.
 */
export const HANGT_AF_VAN: Partial<Record<FunctieId, FunctieId>> = {
  wedstrijd: "quiz",
};
