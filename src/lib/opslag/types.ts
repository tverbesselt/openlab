import {
  BordItem,
  Exercise,
  Herhaling,
  Inzending,
  Lesmap,
  LiveAntwoord,
  LiveSessie,
  Quizresultaat,
  WedstrijdAntwoord,
  WedstrijdSpeler,
} from "@/lib/types";
import type { Eigenaar } from "@/lib/labels";

/** Waar een code van zes tekens naartoe leidt. */
export type CodeDoel = { soort: "oefening"; id: string } | { soort: "map"; id: string };

/**
 * Eén contract voor de opslag, twee uitvoeringen:
 *  - Firestore zodra er een Firebase-project ingesteld is (gedeeld over alle toestellen);
 *  - localStorage in demomodus (alles blijft in deze browser).
 * Pagina's praten alleen met dit contract, nooit rechtstreeks met Firestore.
 */
export interface Opslag {
  /* Materiaal */

  /** Alles wat deze persoon mag zien: gedeeld met de organisatie plus eigen materiaal. */
  zichtbareOefeningen(kijker: Eigenaar | null): Promise<Exercise[]>;
  oefening(id: string): Promise<Exercise | null>;
  /** Nieuw materiaal wegschrijven, elk met zijn eigen code. */
  maakOefeningen(nieuwe: Exercise[]): Promise<void>;
  wijzigOefening(id: string, wijziging: Partial<Exercise>): Promise<void>;
  verwijderOefening(id: string): Promise<void>;

  /* Mappen */

  /** Persoonlijke mappen; organisatiemappen zitten er niet bij. */
  eigenMappen(eigenaar: Eigenaar | null): Promise<Lesmap[]>;
  /** De mappen van de school. Alleen voor leraren. */
  organisatieMappen(): Promise<Lesmap[]>;
  map(id: string): Promise<Lesmap | null>;
  maakMap(map: Lesmap): Promise<void>;
  wijzigMap(id: string, wijziging: Partial<Lesmap>): Promise<void>;
  verwijderMap(id: string): Promise<void>;
  /** Haal een oefening uit de ene map en zet ze in de andere, in één beweging. */
  verplaatsOefening(oefeningId: string, vanMapId: string, naarMapId: string): Promise<void>;

  /** Waar hoort deze code bij? */
  viaCode(code: string): Promise<CodeDoel | null>;

  /* Live in de klas */

  startSessie(sessie: LiveSessie): Promise<void>;
  wijzigSessie(code: string, wijziging: Partial<LiveSessie>): Promise<void>;
  /** Volg één sessie; null zodra ze niet (meer) bestaat. Geeft een stopfunctie terug. */
  volgSessie(code: string, bij: (sessie: LiveSessie | null) => void): () => void;
  /** Alleen de leraar die de sessie host krijgt de antwoorden binnen. */
  volgAntwoorden(code: string, bij: (antwoorden: LiveAntwoord[]) => void): () => void;
  /**
   * Eén antwoord per toestel. Bij een stemming wordt een tweede poging geweigerd; bij de
   * begripsmeter vervangt ze het vorige signaal, want die mag de hele les meebewegen.
   */
  stuurAntwoord(code: string, antwoord: LiveAntwoord): Promise<void>;

  /* Quizwedstrijd: spelers met een bijnaam, één antwoord per vraag en per toestel */

  /** Een toestel doet mee onder een bijnaam. Alleen aanmaken; de punten schrijft het bord. */
  meldSpeler(code: string, speler: WedstrijdSpeler): Promise<void>;
  /** Het toestel volgt zijn eigen stand; null zodra het bord de speler verwijderde. */
  volgSpeler(code: string, apparaat: string, bij: (speler: WedstrijdSpeler | null) => void): () => void;
  /** Alleen de host: alle spelers. */
  volgSpelers(code: string, bij: (spelers: WedstrijdSpeler[]) => void): () => void;
  /** Alleen de host: punten, reeks en plaats in één keer bijwerken. */
  werkSpelersBij(code: string, spelers: WedstrijdSpeler[]): Promise<void>;
  /** Alleen de host: een ongepaste bijnaam weghalen. */
  verwijderSpeler(code: string, apparaat: string): Promise<void>;
  /** Eén antwoord per vraag; een tweede poging wordt geweigerd. */
  stuurWedstrijdAntwoord(code: string, antwoord: WedstrijdAntwoord): Promise<void>;
  /** Alleen de host: de antwoorden op één vraag. */
  volgWedstrijdAntwoorden(
    code: string,
    vraagNr: number,
    bij: (antwoorden: WedstrijdAntwoord[]) => void
  ): () => void;

  /* Whiteboard: kaartjes van leraar en cursisten */

  /** Een kaartje op het bord zetten. Voor cursisten gelden de keuzes van de leraar. */
  stuurBordItem(code: string, item: BordItem): Promise<void>;
  /**
   * Volg het bord. De host krijgt alles, ook wat nog op goedkeuring wacht; een cursist
   * alleen wat zichtbaar is, en alleen als de leraar het bord op de toestellen toont.
   */
  volgBord(code: string, alles: boolean, bij: (items: BordItem[]) => void, bijFout?: () => void): () => void;
  /** Alleen de host: goedkeuren, vastpinnen, naar een andere kolom. */
  wijzigBordItem(code: string, id: string, wijziging: Partial<BordItem>): Promise<void>;
  /** Alleen de host. */
  verwijderBordItem(code: string, id: string): Promise<void>;

  /* Exit tickets */

  stuurInzending(oefeningId: string, antwoorden: string[]): Promise<void>;
  inzendingen(oefeningId: string): Promise<Inzending[]>;

  /* Quizresultaten: geaggregeerd en anoniem, alleen voor de maker */

  stuurQuizresultaat(
    oefeningId: string,
    foutVragen: string[],
    aantalVragen: number
  ): Promise<void>;
  quizresultaten(oefeningId: string): Promise<Quizresultaat[]>;

  /* Gespreid herhalen: van de cursist zelf, voor niemand anders leesbaar */

  herhalingen(gebruikerId: string): Promise<Herhaling[]>;
  bewaarHerhaling(gebruikerId: string, herhaling: Herhaling): Promise<void>;
}
