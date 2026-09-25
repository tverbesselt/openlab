export type DidacticGoal = 
  | 'activate'     // Voorkennis activeren & interesse wekken
  | 'automate'     // Inoefenen & automatiseren (Retrieval Practice)
  | 'check'        // Begrip controleren & formatieve toetsing
  | 'reflect'      // Metacognitie & samenwerken
  | 'facilitate';  // Lesfacilitatie & klastools

export type ExerciseCategory = 
  | 'practice'      // Oefenen & Onthouden
  | 'quiz'          // Quiz & Kennischeck
  | 'live'          // Live in de Klas
  | 'language'      // Taal & Woordenschat
  | 'media'         // Afbeelding & Media
  | 'collaboration' // Samenwerken & Reflecteren
  | 'tool';         // Klastools

export type ExerciseType =
  | 'flashcard'
  | 'quiz'
  | 'matching'
  | 'wordtrainer'
  | 'fillblank'
  | 'zinbouwen'
  | 'volgorde'
  | 'sorteren'
  | 'openvraag'
  | 'lezen'
  | 'werkwoorden'
  | 'rekenen'
  | 'escaperoom'
  | 'poll'
  | 'wordcloud'
  | 'exitticket'
  | 'timer'
  | 'randomizer'
  | 'groupmaker';

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  audio?: string;
  image?: string;
  exampleSentence?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  /** Leeg bij een vraag van het type 'typ': daar is er niets om uit te kiezen. */
  options: string[];
  correctAnswers: number[]; // index numbers
  type: 'multiple_choice' | 'multiple_response' | 'true_false' | 'typ';
  /**
   * Alleen bij 'typ': de antwoorden die goed gerekend worden. Het eerste is het antwoord
   * dat we tonen. Hoofdletters, accenten en extra spaties maken niet uit
   * (zie src/lib/typantwoord.ts).
   */
  antwoorden?: string[];
  explanation: string; // Actionable immediate feedback explaining WHY
  /** Een foto, filmpje of audiofragment waar de vraag over gaat. */
  media?: QuizMedia;
}

/**
 * Media bij een quizvraag.
 *  - afbeelding en audio staan in Firebase Storage (of als data-URL in demomodus);
 *  - video is altijd een link naar YouTube of Vimeo: uploaden is te zwaar en te duur.
 */
export interface QuizMedia {
  soort: 'afbeelding' | 'video' | 'audio';
  url: string;
  /** Beschrijving voor wie de afbeelding niet ziet. Verplicht bij een afbeelding. */
  alt?: string;
  /** Alleen video: vanaf en tot welke seconde het fragment loopt. */
  start?: number;
  eind?: number;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface WordTrainerItem {
  id: string;
  word: string;
  translation: string;
  definition?: string;
  exampleSentence?: string;
}

export interface FillBlankItem {
  id: string;
  textWithBlanks: string; // e.g. "De hoofdstad van België is [[Brussel]]."
  answers: string[];
}

/**
 * Eén reeks die op volgorde moet komen: de woorden van een zin, of de stappen van een
 * procedure. De volgorde in `delen` is de juiste; de speler husselt.
 */
export interface OrdenItem {
  id: string;
  /** Optionele opdracht boven de reeks, bijvoorbeeld "Hoe verzorg je een wonde?". */
  opdracht?: string;
  delen: string[];
}

export interface SorteerItem {
  id: string;
  tekst: string;
  /** Index in content.categorieen. */
  categorie: number;
}

export interface OpenVraag {
  id: string;
  vraag: string;
  modelantwoord: string;
}

/** Eén werkwoord met zijn vormen. De persoon staat erbij, zodat de vraag klopt. */
export interface WerkwoordItem {
  id: string;
  infinitief: string;
  /** Bijvoorbeeld { persoon: "nous", vorm: "parlons" }. */
  vormen: { persoon: string; vorm: string }[];
}

export type Rekensoort =
  | 'procent'
  | 'btw'
  | 'korting'
  | 'eenheden'
  | 'breuken'
  | 'ohm'
  | 'verhouding';

/**
 * Rekenen met telkens nieuwe getallen. De leraar kiest het type; de app maakt de
 * opgaven, zodat een cursist onbeperkt kan oefenen zonder dat er honderd vragen getypt zijn.
 */
export interface Rekenopdracht {
  soort: Rekensoort;
  /** Hoeveel opgaven per ronde. */
  aantal: number;
}

/**
 * Eén slot in een escaperoom: een opdracht, en het antwoord dat het slot opent. Dat
 * antwoord is een woord, een getal of een code; het wordt nagekeken zoals een quizvraag
 * waarbij je het antwoord intypt (zie src/lib/escaperoom.ts).
 */
export interface Slot {
  id: string;
  opdracht: string;
  /** Wat het slot opent. Het eerste tonen we als oplossing. */
  antwoorden: string[];
  /** Een duwtje in de goede richting, voor wie vastzit. */
  hint?: string;
  /** Een foto, filmpje of audiofragment waar de opdracht over gaat. */
  media?: QuizMedia;
}

/**
 * Een reeks sloten die één voor één opengaan. Het verhaal zet de toon, de afloop is wat
 * de cursisten te lezen krijgen als het laatste slot open is.
 */
export interface Escaperoom {
  verhaal?: string;
  sloten: Slot[];
  afloop?: string;
}

export interface DidacticConfig {
  showImmediateFeedback: boolean;
  allowRetryMissed: boolean;
  enableGamification: boolean; // default false (Andragogie rule)
  /**
   * Alleen bij een quiz (ook de vragen bij een leestekst). Aan: wie fout antwoordt, krijgt
   * eerst te horen dat het nog niet juist is, zonder het juiste antwoord, en probeert een
   * tweede keer. Pas daarna volgen het juiste antwoord en de uitleg. Uit of leeg: meteen
   * het juiste antwoord, zoals vroeger. De leraar kiest dit bij het maken.
   */
  tweedeKans?: boolean;
  timerSeconds?: number;
  /**
   * Taal waarin de voorleesknop het materiaal uitspreekt, bijvoorbeeld "fr-FR".
   * Leeg = Nederlands. Zie src/lib/spraak.ts voor de talen.
   */
  spraakTaal?: string;
}

/**
 * Wie ziet dit materiaal staan?
 *  - prive       enkel de leraar die het maakte. Cursisten met de code of QR-code kunnen
 *                het wél openen — dat is het hele punt van drempelloos oefenen.
 *  - organisatie iedereen van de organisatie vindt het in de bibliotheek.
 */
export type Zichtbaarheid = 'prive' | 'organisatie';

export interface Exercise {
  id: string;
  title: string;
  description: string;
  category: ExerciseCategory;
  didacticGoal: DidacticGoal;
  type: ExerciseType;
  creatorName: string;
  /**
   * Wie het maakte: de Firebase-uid van de leraar, of het e-mailadres in demomodus.
   * Voorbeeldmateriaal heeft dit niet; daar valt de eigenaarscheck terug op de naam.
   */
  creatorId?: string;
  visibility: Zichtbaarheid;
  shareCode: string;
  content: {
    flashcards?: FlashcardItem[];
    questions?: QuizQuestion[];
    matchingPairs?: MatchingPair[];
    wordTrainerItems?: WordTrainerItem[];
    fillBlanks?: FillBlankItem[];
    /** Voor 'zinbouwen' en 'volgorde': rijen die in de juiste volgorde moeten komen. */
    ordenItems?: OrdenItem[];
    /** Voor 'sorteren'. */
    categorieen?: string[];
    sorteerItems?: SorteerItem[];
    openVragen?: OpenVraag[];
    /** Voor 'lezen': de tekst waar de vragen bij horen; de vragen zitten in questions. */
    leestekst?: string;
    werkwoorden?: WerkwoordItem[];
    rekenopdracht?: Rekenopdracht;
    escaperoom?: Escaperoom;
    pollQuestion?: string;
    pollOptions?: string[];
    wordCloudPrompt?: string;
    exitTicketPrompts?: string[];
  };
  didacticConfig: DidacticConfig;
  createdAt: string;
  tags: string[];
}

/**
 * Een map waarin een leraar materiaal ordent, bijvoorbeeld "Wiskunde les 1".
 * De map is van de leraar zelf, maar heeft een eigen code: zo geef je een hele les
 * in één keer mee aan je cursisten.
 *
 * Een organisatiemap is van de hele organisatie: elke leraar ziet ze, alleen een
 * beheerder maakt ze aan en schikt er gedeeld materiaal in.
 */
export interface Lesmap {
  id: string;
  title: string;
  description: string;
  exerciseIds: string[];
  creatorName: string;
  creatorId?: string;
  shareCode: string;
  createdAt: string;
  organisatie?: boolean;
}

/**
 * Een klassikale sessie: de leraar projecteert, cursisten antwoorden op hun toestel.
 * De pincode van zes cijfers is meteen de sleutel van de sessie.
 */
/**
 * De klassikale werkvormen.
 *  - poll en wordcloud komen uit klaargezet materiaal;
 *  - snellevraag, begripsmeter en bord start de leraar ter plekke, zonder voorbereiding;
 *  - quiz is de Quizwedstrijd, met een Eenvoudige quiz als bron.
 */
export type LiveType = 'poll' | 'wordcloud' | 'snellevraag' | 'begripsmeter' | 'quiz' | 'bord';

/* ── Whiteboard ────────────────────────────────────────────────────────────
 * Een live-sessie van het type 'bord': leraar en cursisten zetten tekst, foto's,
 * tekeningen, filmpjes en ingesproken audio op één bord, en iedereen ziet het groeien.
 * De leraar kiest wat cursisten mogen toevoegen en kan dat tijdens de les bijstellen.
 */

export type BordSoort = 'tekst' | 'afbeelding' | 'tekening' | 'video' | 'audio';

export interface BordInstellingen {
  /** Wat cursisten mogen toevoegen. De leraar zelf mag altijd alles. */
  soorten: BordSoort[];
  /** Hoeveel tekens een tekst mag tellen. 0 = geen eigen grens (dan 1000). */
  maxTekens: number;
  /** Hoe lang een ingesproken fragment mag duren, in seconden. */
  maxSeconden: number;
  /** Hoeveel bijdragen per toestel. 0 = onbeperkt. Het toestel houdt dit bij. */
  maxPerCursist: number;
  /** Anoniem, of met een naam die de cursist zelf kiest. */
  namen: 'anoniem' | 'naam';
  /** Eerst goedkeuren: een bijdrage verschijnt pas als de leraar ze vrijgeeft. */
  nakijken: boolean;
  /** Zien cursisten het bord op hun toestel, of alleen vooraan? */
  zichtbaar: boolean;
  /** Optionele kolommen, bv. "Voordelen" en "Nadelen". Leeg = één muur. */
  kolommen: string[];
  /** Kunnen cursisten nu iets toevoegen? De leraar zet het bord tussendoor even dicht. */
  open: boolean;
}

/** Eén kaartje op het bord. */
export interface BordItem {
  id: string;
  apparaat: string;
  /** Alleen bij een bord met namen. */
  auteur?: string;
  /** Gezet door de leraar zelf. */
  leraar?: boolean;
  soort: BordSoort;
  /** De tekst, of het onderschrift bij een foto, tekening, filmpje of fragment. */
  tekst?: string;
  /**
   * Foto, tekening en audio: een data-URL, verkleind in de browser zodat een kaartje in
   * één document past. Video: de link naar YouTube of Vimeo.
   */
  url?: string;
  /** Beschrijving van een foto, voor wie hem niet ziet. */
  alt?: string;
  /** In welke kolom, vanaf 0. Ontbreekt bij een bord zonder kolommen. */
  kolom?: number;
  status: 'wacht' | 'zichtbaar';
  /** Vastgepind: staat bovenaan. */
  vast?: boolean;
  op: string;
}

/* ── Quizwedstrijd ─────────────────────────────────────────────────────────
 * Een live-sessie van het type 'quiz'. Het bord van de leraar stuurt het verloop en
 * berekent de punten; de toestellen sturen alleen hun keuze in.
 */

export type WedstrijdFase = 'wachtruimte' | 'vraag' | 'uitleg' | 'tussenstand' | 'podium';

export interface WedstrijdInstellingen {
  /** rustig: 1000 punten per juist antwoord. klassiek: sneller antwoorden levert meer op. */
  spelvorm: 'rustig' | 'klassiek';
  /** Seconden per vraag. 0 = de leraar sluit de vraag zelf af (alleen bij rustig). */
  seconden: number;
  reeksbonus: boolean;
  /** Na elke vraag de tussenstand tonen, of pas op het einde. */
  tussenstand: 'elkeVraag' | 'einde';
  /**
   * In hoeveel teams de klas speelt. 0 = ieder voor zich. De teamscore is het gemiddelde
   * van de leden, zodat een groter team geen voordeel heeft.
   */
  teams: number;
}

/** Wat alle toestellen van de wedstrijd zien. Het juiste antwoord pas na de vraag. */
export interface WedstrijdToestand {
  fase: WedstrijdFase;
  /** Welke vraag loopt of net liep, vanaf 0. -1 in de wachtruimte. */
  vraagNr: number;
  aantalVragen: number;
  instellingen: WedstrijdInstellingen;
  /** De vraag zoals het toestel ze toont, met de antwoorden al gehusseld. */
  vraag?: {
    tekst: string;
    opties: string[];
    meerdere: boolean;
    /** Bij 'typ' typt de cursist zijn antwoord; dan zijn er geen opties. */
    typen?: boolean;
    media?: QuizMedia;
  };
  /** Na het afsluiten van de vraag. */
  juist?: number[];
  /** Bij 'typ': het juiste antwoord, uitgeschreven. */
  juisteTekst?: string;
  uitleg?: string;
  /** Hoeveel toestellen elke optie kozen. */
  verdeling?: number[];
  /** Bij 'typ': wat de klas intypte, met hoe vaak. Zonder namen. */
  gegeven?: { tekst: string; aantal: number; juist: boolean }[];
}

/** Eén deelnemer, met een bijnaam. De punten schrijft alleen het bord. */
export interface WedstrijdSpeler {
  apparaat: string;
  bijnaam: string;
  op: string;
  /** In welk team, vanaf 0. Ontbreekt bij een wedstrijd zonder teams. */
  team?: number;
  punten?: number;
  /** Aantal juiste antwoorden op rij. */
  reeks?: number;
  plaats?: number;
  /** De stand van het eigen team; het bord rekent ze uit. */
  teamPunten?: number;
  teamPlaats?: number;
  /** Hoe de laatste vraag voor dit toestel afliep. */
  laatste?: { vraagNr: number; beantwoord: boolean; juist: boolean; punten: number; bonus: number };
}

/** Het antwoord van één toestel op één vraag. */
export interface WedstrijdAntwoord {
  apparaat: string;
  vraagNr: number;
  /** De gekozen opties, in de gehusselde volgorde van het toestel. */
  keuze?: number[];
  /** Bij een vraag van het type 'typ': wat de cursist intypte. */
  tekst?: string;
  op: string;
}

export interface LiveSessie {
  code: string;
  hostId: string;
  hostNaam: string;
  /** Ontbreekt bij een snelle vraag of begripsmeter: die hangen aan geen materiaal. */
  oefeningId?: string;
  titel: string;
  type: LiveType;
  vraag: string;
  /** De antwoordmogelijkheden. Bij een woordwolk leeg. */
  opties: string[];
  status: 'actief' | 'afgesloten';
  /** Zolang dit uit staat, ziet de cursist alleen "bedankt", geen tussenstand. */
  toonResultaten: boolean;
  /** Alleen bij een snelle vraag: wat de leraar achteraf als juist aanduidt. */
  juisteOptie?: number;
  gestartOp: string;
  /** Alleen bij een quizwedstrijd. */
  quiz?: WedstrijdToestand;
  /** Alleen bij een whiteboard. */
  bord?: BordInstellingen;
}

/** Eén antwoord van één toestel. Het toestel-id is de sleutel: zo stem je maar één keer. */
export interface LiveAntwoord {
  apparaat: string;
  /** Index van de gekozen optie (poll). */
  optie?: number;
  /** Ingetypt woord (woordwolk). */
  woord?: string;
  op: string;
}

/** Wat een cursist instuurt bij een exit ticket. Anoniem, alleen voor de maker leesbaar. */
export interface Inzending {
  id: string;
  antwoorden: string[];
  op: string;
}

/**
 * Wanneer een cursist een kaart weer moet zien. Gespreid herhalen laat kennis van het
 * werkgeheugen naar het langetermijngeheugen verhuizen (Cepeda e.a., Dunlosky e.a.).
 */
export interface Herhaling {
  /** oefeningId en kaartId samen; dat is ook de sleutel in de opslag. */
  id: string;
  oefeningId: string;
  kaartId: string;
  /** Leitner-doos 0 tot 5. Hoe hoger, hoe langer tot de volgende beurt. */
  doos: number;
  /** Datum JJJJ-MM-DD waarop de kaart weer aan de beurt is. */
  volgende: string;
  bijgewerkt: string;
}

/**
 * Wat een quiz opleverde, zonder wie het was. De leraar ziet daarmee welke vraag het
 * vaakst fout ging, niet hoe een cursist scoorde.
 */
export interface Quizresultaat {
  id: string;
  /** Ids van de vragen die fout beantwoord werden. */
  foutVragen: string[];
  aantalVragen: number;
  op: string;
}
