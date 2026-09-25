import { Exercise, Lesmap } from "./types";

export const INITIAL_EXERCISES: Exercise[] = [
  {
    id: "ex-nt2-1",
    title: "NT2 — Woordenschat: Naar de markt",
    description: "Inoefenen van groenten, fruit en gewichten op de markt via actieve ophaalpraktijk (Retrieval Practice).",
    category: "language",
    didacticGoal: "automate",
    type: "wordtrainer",
    creatorName: "Demo",
    creatorId: "leraar@example.org",
    visibility: "organisatie",
    shareCode: "MARKT1",
    tags: ["NT2", "Woordenschat", "Niveau 1", "Boodschappen"],
    content: {
      wordTrainerItems: [
        { id: "w1", word: "de appel", translation: "pomme (FR) / apple (EN)", exampleSentence: "Ik koop één kilo appels." },
        { id: "w2", word: "de wortel", translation: "carotte (FR) / carrot (EN)", exampleSentence: "Wortels zijn oranje." },
        { id: "w3", word: "de aardbei", translation: "fraise (FR) / strawberry (EN)", exampleSentence: "Aardbeien zijn zoet." },
        { id: "w4", word: "het pond", translation: "500 gram", exampleSentence: "Een pond kaas, alstublieft." },
        { id: "w5", word: "de wisselkoers / het wisselgeld", translation: "monnaie (FR) / change (EN)", exampleSentence: "Hier is uw wisselgeld." },
      ],
      flashcards: [
        { id: "f1", front: "de appel", back: "pomme / apple", exampleSentence: "Ik koop een kilo appels." },
        { id: "f2", front: "de wortel", back: "carotte / carrot", exampleSentence: "Wortels zijn oranje." },
        { id: "f3", front: "de aardbei", back: "fraise / strawberry", exampleSentence: "Verse aardbeien zijn lekker." },
        { id: "f4", front: "het pond", back: "500 gram", exampleSentence: "Geef mij een pond druiven." },
      ]
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: true,
      enableGamification: false
    },
    createdAt: "2026-08-01"
  },
  {
    id: "ex-frans-1",
    title: "Frans — Reguliere werkwoorden op -ER",
    description: "Verkozen tot beste formatieve zelftest voor Frans Niveau 1. Directe feedback bij elke vervoeging.",
    category: "quiz",
    didacticGoal: "check",
    type: "quiz",
    creatorName: "Marc Hermans",
    visibility: "organisatie",
    shareCode: "FRQUIZ",
    tags: ["Frans", "Grammatica", "Werkwoorden"],
    content: {
      questions: [
        {
          id: "q1",
          question: "Vervoeg 'parler' bij 'nous': Nous ______ français.",
          options: ["parlons", "parlez", "parlent", "parles"],
          correctAnswers: [0],
          type: "multiple_choice",
          explanation: "Bij 'nous' krijgt een regulier -ER werkwoord de uitgang '-ons': nous parlons."
        },
        {
          id: "q2",
          question: "Welke vormen zijn correct voor 'habiter'? (Selecteer alle juiste antwoorden)",
          options: ["J'habite", "Tu habites", "Il habites", "Ils habitent"],
          correctAnswers: [0, 1, 3],
          type: "multiple_response",
          explanation: "'Il habite' is zonder -s! 'J'habite', 'Tu habites' en 'Ils habitent' zijn wel correct."
        },
        {
          id: "q3",
          question: "Is 'vous écoutez' de correcte vorm voor 'jullie luisteren'?",
          options: ["Waar", "Niet waar"],
          correctAnswers: [0],
          type: "true_false",
          explanation: "Correct! Bij 'vous' is de uitgang altijd '-ez'."
        }
      ]
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: true,
      enableGamification: false
    },
    createdAt: "2026-08-04"
  },
  {
    id: "ex-elec-1",
    title: "Elektriciteit — Symbolen & Schakelingen",
    description: "Sleep het elektrisch symbool naar de juiste naam. Essentieel voor technisch tekenen.",
    category: "practice",
    didacticGoal: "automate",
    type: "matching",
    creatorName: "Luc Van Den Broeck",
    visibility: "prive",
    shareCode: "VOLT24",
    tags: ["Elektriciteit", "Techniek", "Symbolen"],
    content: {
      matchingPairs: [
        { id: "m1", left: "Wisselspanningsbron", right: "AC Symbool (~)" },
        { id: "m2", left: "Gelijkspanningsbron", right: "DC Symbool (=)" },
        { id: "m3", left: "Schakelaar open", right: "Onderbroken lijn met hendel" },
        { id: "m4", left: "Zekering", right: "Rechthoek met doorlopende lijn" },
        { id: "m5", left: "Aardleiding", right: "Horizontale streep met zakkende streepjes" }
      ]
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: true,
      enableGamification: false
    },
    createdAt: "2026-08-05"
  },
  {
    id: "ex-live-ai",
    title: "Live Poll: Voorkennis AI in het Onderwijs",
    description: "Activeer voorkennis aan de start van de les. Cursisten antwoorden anoniem via hun smartphone.",
    category: "live",
    didacticGoal: "activate",
    type: "poll",
    creatorName: "Demo",
    creatorId: "leraar@example.org",
    visibility: "prive",
    shareCode: "AIPOLL",
    tags: ["Live", "AI", "Voorkennis"],
    content: {
      pollQuestion: "Hoe vaak gebruik je al tools zoals ChatGPT of Gemini voor je werk of studie?",
      pollOptions: [
        "1. Nog nooit gebruikt",
        "2. Af en toe (1-2 keer per maand)",
        "3. Wekelijks",
        "4. Dagelijks / Intensief"
      ]
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: false,
      enableGamification: false
    },
    createdAt: "2026-08-08"
  },
  {
    id: "ex-exit-ticket-1",
    title: "Exit Ticket — Einde van de les",
    description: "Formatieve check in 3 snelle vragen: Wat is helder, wat behoeft extra uitleg, en hoe zeker voel je je?",
    category: "collaboration",
    didacticGoal: "reflect",
    type: "exitticket",
    creatorName: "Voorbeeldmateriaal",
    visibility: "organisatie",
    shareCode: "EXIT01",
    tags: ["Reflectie", "Exit Ticket", "Formatief"],
    content: {
      exitTicketPrompts: [
        "Wat is het belangrijkste dat je vandaag hebt geleerd?",
        "Welk onderdeel is nog onduidelijk of behoeft herhaling?",
        "Hoe zeker voel je je over de leerstof voor de volgende les?"
      ]
    },
    didacticConfig: {
      showImmediateFeedback: false,
      allowRetryMissed: false,
      enableGamification: false
    },
    createdAt: "2026-08-09"
  },
  {
    id: "ex-invul-nt2",
    title: "NT2 - werkwoorden in de zin",
    description: "Vul het werkwoord aan op de juiste plaats en in de juiste vorm.",
    category: "language",
    didacticGoal: "automate",
    type: "fillblank",
    creatorName: "Voorbeeldmateriaal",
    visibility: "organisatie",
    shareCode: "INVUL1",
    tags: ["NT2", "Grammatica", "Werkwoorden"],
    content: {
      fillBlanks: [
        { id: "fb1", textWithBlanks: "Ik [[ga]] elke dag met de tram naar mijn werk.", answers: ["ga"] },
        { id: "fb2", textWithBlanks: "Zij [[woont]] al drie jaar in Gent.", answers: ["woont"] },
        { id: "fb3", textWithBlanks: "Gisteren [[heb]] ik soep gemaakt.", answers: ["heb"] },
        { id: "fb4", textWithBlanks: "Morgen [[gaan]] wij samen naar de markt.", answers: ["gaan"] },
        { id: "fb5", textWithBlanks: "Wij [[kopen|halen]] brood bij de bakker.", answers: ["kopen"] }
      ]
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: true,
      enableGamification: false,
      spraakTaal: "nl-BE"
    },
    createdAt: "2026-09-09"
  },
  {
    id: "ex-wolk-veilig",
    title: "Waar denk je aan bij veilig werken?",
    description: "Woordwolk om bij de start van de les te peilen wat er al leeft in de groep.",
    category: "live",
    didacticGoal: "activate",
    type: "wordcloud",
    creatorName: "Voorbeeldmateriaal",
    visibility: "organisatie",
    shareCode: "WOLK01",
    tags: ["Live", "Techniek", "Voorkennis"],
    content: {
      wordCloudPrompt: "Welk woord past bij veilig werken?"
    },
    didacticConfig: {
      showImmediateFeedback: false,
      allowRetryMissed: false,
      enableGamification: false
    },
    createdAt: "2026-09-09"
  },
  {
    id: "ex-zin-nt2",
    title: "NT2 - woordvolgorde in de zin",
    description: "De woorden staan door elkaar. Zet ze in de juiste volgorde.",
    category: "language",
    didacticGoal: "automate",
    type: "zinbouwen",
    creatorName: "Voorbeeldmateriaal",
    visibility: "organisatie",
    shareCode: "ZINNEN",
    tags: ["NT2", "Zinsbouw"],
    content: {
      ordenItems: [
        { id: "z1", delen: ["Morgen", "ga", "ik", "naar", "de", "dokter."] },
        { id: "z2", delen: ["Zij", "werkt", "elke", "zaterdag", "in", "de", "winkel."] },
        { id: "z3", delen: ["Wij", "hebben", "gisteren", "samen", "gekookt."] },
        { id: "z4", delen: ["Omdat", "het", "regent,", "neem", "ik", "de", "tram."] }
      ]
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: true,
      enableGamification: false
    },
    createdAt: "2026-09-09"
  },
  {
    id: "ex-sorteer-dehet",
    title: "NT2 - de of het",
    description: "Sorteer de woorden in het juiste bakje.",
    category: "language",
    didacticGoal: "automate",
    type: "sorteren",
    creatorName: "Voorbeeldmateriaal",
    visibility: "organisatie",
    shareCode: "DEHET1",
    tags: ["NT2", "Lidwoorden"],
    content: {
      categorieen: ["de", "het"],
      sorteerItems: [
        { id: "s1", tekst: "tafel", categorie: 0 },
        { id: "s2", tekst: "huis", categorie: 1 },
        { id: "s3", tekst: "stoel", categorie: 0 },
        { id: "s4", tekst: "boek", categorie: 1 },
        { id: "s5", tekst: "fiets", categorie: 0 },
        { id: "s6", tekst: "raam", categorie: 1 },
        { id: "s7", tekst: "trein", categorie: 0 },
        { id: "s8", tekst: "brood", categorie: 1 }
      ]
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: true,
      enableGamification: false
    },
    createdAt: "2026-09-09"
  },
  {
    id: "ex-escape-elektriciteit",
    title: "Elektriciteit - ontsnap uit het labo",
    description: "Open de sloten één voor één met het juiste antwoord.",
    category: "collaboration",
    didacticGoal: "check",
    type: "escaperoom",
    creatorName: "Voorbeeldmateriaal",
    visibility: "organisatie",
    shareCode: "ESCAPE",
    tags: ["Escaperoom", "Samenwerken", "Elektriciteit"],
    content: {
      escaperoom: {
        verhaal:
          "De technieker is naar huis en de deur van het labo zit op slot. Het codeslot vraagt vier antwoorden. Alleen wie de basis van elektriciteit kent, komt eruit.",
        sloten: [
          {
            id: "slot-1",
            opdracht: "Een lamp op 230 V trekt 0,5 A. Hoeveel watt verbruikt ze?",
            antwoorden: ["115", "115 W", "115 watt"],
            hint: "Vermogen = spanning × stroom."
          },
          {
            id: "slot-2",
            opdracht:
              "Welk onderdeel in de verdeelkast schakelt de stroom af als ze te groot wordt?",
            antwoorden: ["zekering", "automaat", "smeltzekering"],
            hint: "Het zit in elke verdeelkast, en je zet het terug op als het is 'gesprongen'."
          },
          {
            id: "slot-3",
            opdracht: "Door een weerstand van 4 Ω loopt 2,5 A. Hoeveel volt staat erover?",
            antwoorden: ["10", "10 V", "10 volt"],
            hint: "Wet van Ohm: U = R × I."
          },
          {
            id: "slot-4",
            opdracht: "Welke twee kleuren heeft de aardingsdraad?",
            antwoorden: ["geel en groen", "groen en geel", "geelgroen", "groengeel"],
            hint: "Denk aan een banaan en een blad."
          }
        ],
        afloop:
          "De deur gaat open. Bespreek met je groepje welk slot het moeilijkst was, en waarom."
      }
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: true,
      enableGamification: false
    },
    createdAt: "2026-09-24"
  },
  {
    id: "ex-volgorde-zorg",
    title: "Zorg - handelingen stap voor stap",
    description: "Zet de stappen van elke handeling in de juiste volgorde.",
    category: "practice",
    didacticGoal: "automate",
    type: "volgorde",
    creatorName: "Voorbeeldmateriaal",
    visibility: "organisatie",
    shareCode: "STAPPN",
    tags: ["Zorg", "Procedure"],
    content: {
      ordenItems: [
        {
          id: "p1",
          opdracht: "Hoe verzorg je een kleine wonde?",
          delen: [
            "handen wassen",
            "wonde spoelen met water",
            "wonde ontsmetten",
            "verband aanbrengen",
            "handen opnieuw wassen"
          ]
        },
        {
          id: "p2",
          opdracht: "Hoe help je iemand veilig rechtstaan?",
          delen: [
            "vraag of de persoon wil rechtstaan",
            "zet de rem op de rolstoel",
            "plaats de voeten stevig op de grond",
            "ondersteun bij de heupen",
            "sta samen rustig recht"
          ]
        }
      ]
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: true,
      enableGamification: false
    },
    createdAt: "2026-09-09"
  },
  {
    id: "ex-reken-btw",
    title: "Verkoop - btw berekenen",
    description: "Van een prijs zonder btw naar een prijs met btw. Elke ronde nieuwe getallen.",
    category: "practice",
    didacticGoal: "automate",
    type: "rekenen",
    creatorName: "Voorbeeldmateriaal",
    visibility: "organisatie",
    shareCode: "BTW021",
    tags: ["Rekenen", "Verkoop"],
    content: {
      rekenopdracht: { soort: "btw", aantal: 10 }
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: true,
      enableGamification: false
    },
    createdAt: "2026-09-09"
  },
  {
    id: "ex-ww-frans",
    title: "Frans - werkwoorden op -ER",
    description: "De vormen komen door elkaar aan bod, niet als rijtje.",
    category: "language",
    didacticGoal: "automate",
    type: "werkwoorden",
    creatorName: "Voorbeeldmateriaal",
    visibility: "organisatie",
    shareCode: "PARLER",
    tags: ["Frans", "Werkwoorden"],
    content: {
      werkwoorden: [
        {
          id: "w1",
          infinitief: "parler",
          vormen: [
            { persoon: "je", vorm: "parle" },
            { persoon: "tu", vorm: "parles" },
            { persoon: "nous", vorm: "parlons" },
            { persoon: "vous", vorm: "parlez" }
          ]
        },
        {
          id: "w2",
          infinitief: "habiter",
          vormen: [
            { persoon: "j'", vorm: "habite" },
            { persoon: "tu", vorm: "habites" },
            { persoon: "nous", vorm: "habitons" }
          ]
        }
      ]
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: true,
      enableGamification: false,
      spraakTaal: "fr-FR"
    },
    createdAt: "2026-09-09"
  }
];

export const INITIAL_MAPPEN: Lesmap[] = [
  {
    id: "set-nt2-pakket",
    title: "NT2 niveau 1 — boodschappen en markt",
    description:
      "Eerst de woordenschat inoefenen, daarna controleren of ze blijft hangen. Samen goed voor één les.",
    exerciseIds: ["ex-nt2-1", "ex-frans-1"],
    creatorName: "Demo",
    creatorId: "leraar@example.org",
    shareCode: "NT2SET",
    createdAt: "2026-08-07"
  },
  {
    id: "org-nt2",
    title: "Nederlands tweede taal",
    description: "Gedeeld materiaal voor NT2, geordend door de beheerders.",
    exerciseIds: ["ex-invul-nt2", "ex-zin-nt2", "ex-sorteer-dehet"],
    creatorName: "Voorbeeldmateriaal",
    shareCode: "ORGNT2",
    createdAt: "2026-09-01",
    organisatie: true
  },
  {
    id: "org-rekenen",
    title: "Rekenen en wiskunde",
    description: "",
    exerciseIds: ["ex-reken-btw"],
    creatorName: "Voorbeeldmateriaal",
    shareCode: "ORGREK",
    createdAt: "2026-09-01",
    organisatie: true
  }
];
