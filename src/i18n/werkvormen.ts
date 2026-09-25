import { definieer } from "./definieer";

/* Lesfases, werkvormen, klastools en zichtbaarheid: de woorden die overal in de app terugkomen. */

export default definieer({
  nl: {
    klastools: "Klastools",
    duur: "± {n} min",
    lesfase: {
      activate: {
        label: "Voorkennis activeren",
        wanneer: "Peil bij de start van de les wat je cursisten al weten.",
        waarom: "Je weet meteen waar je moet beginnen en cursisten haken sneller aan.",
        zegErbij: "Je weet hier al meer over dan je denkt. Alles wat je nu terugvindt, blijft beter hangen.",
      },
      automate: {
        label: "Inoefenen",
        wanneer: "Laat cursisten herhalen tot de leerstof vlot zit.",
        waarom: "Zelf ophalen uit het geheugen werkt veel beter dan herlezen.",
        zegErbij: "Bedenk eerst zelf het antwoord. Nakijken kan altijd nog, ophalen is het echte oefenen.",
      },
      check: {
        label: "Begrip controleren",
        wanneer: "Kijk tussendoor na of iedereen nog mee is.",
        waarom: "Cursisten krijgen direct uitleg bij een fout antwoord, zonder punten.",
        zegErbij: "Dit is geen toets. Een fout antwoord toont ons allebei waar we nog moeten kijken.",
      },
      reflect: {
        label: "Afsluiten en reflecteren",
        wanneer: "Sluit de les af en verzamel wat blijft hangen.",
        waarom: "Je start de volgende les met wat nog onduidelijk was.",
        zegErbij: "Schrijf op wat je vandaag leerde, in eigen woorden. Niet wat op het bord stond.",
      },
    },
    vorm: {
      flashcard: {
        label: "Flashcards",
        uitleg: "Kaartjes met vraag en antwoord. De cursist bedenkt eerst zelf het antwoord en draait dan pas om.",
      },
      wordtrainer: {
        label: "Woordtrainer",
        uitleg: "Woorden inoefenen met vertaling, uitspraak en voorbeeldzin.",
      },
      matching: {
        label: "Matching",
        uitleg: "Cursisten koppelen begrippen aan de juiste betekenis.",
      },
      quiz: {
        label: "Eenvoudige quiz",
        uitleg: "Meerkeuzevragen op eigen tempo, met directe uitleg bij elk antwoord. Geen punten, wel feedback.",
      },
      fillblank: {
        label: "Invuloefening",
        uitleg: "Cursisten vullen de ontbrekende woorden aan in een tekst.",
      },
      zinbouwen: {
        label: "Zinnen bouwen",
        uitleg: "De woorden staan door elkaar. Cursisten zetten ze in de juiste volgorde.",
      },
      volgorde: {
        label: "Stappen op volgorde",
        uitleg: "Losse stappen van een procedure, die de cursist in de juiste volgorde zet.",
      },
      sorteren: {
        label: "Sorteren",
        uitleg: "Cursisten verdelen de items over twee tot vier bakjes.",
      },
      openvraag: {
        label: "Open vraag",
        uitleg: "De cursist antwoordt in eigen woorden en vergelijkt daarna met jouw modelantwoord.",
      },
      lezen: {
        label: "Lezen met vragen",
        uitleg: "Een korte tekst met vragen ernaast. De tekst blijft zichtbaar tijdens het antwoorden.",
      },
      werkwoorden: {
        label: "Werkwoorden",
        uitleg: "Vervoegingen inoefenen: de cursist krijgt de persoon en typt de juiste vorm.",
      },
      rekenen: {
        label: "Rekenen",
        uitleg: "Elke ronde nieuwe getallen, dus onbeperkt oefenen zonder dat jij vragen typt.",
      },
      escaperoom: {
        label: "Escaperoom",
        uitleg: "Een reeks sloten die pas opengaan met het juiste antwoord. Cursisten lossen ze samen op, in groepjes of alleen.",
      },
      poll: {
        label: "Live poll",
        uitleg: "Jij projecteert de vraag, cursisten stemmen anoniem met hun smartphone.",
      },
      wordcloud: {
        label: "Woordwolk",
        uitleg: "Cursisten typen één woord. Samen vormen ze een wolk op het digibord.",
      },
      exitticket: {
        label: "Exit ticket",
        uitleg: "Drie korte vragen op het einde van de les. Jij ziet meteen wat nog onduidelijk is.",
      },
      timer: {
        label: "Klastimer",
        uitleg: "Zichtbare aftelklok voor een opdracht of pauze.",
      },
      randomizer: {
        label: "Naamkiezer",
        uitleg: "Kies willekeurig een cursist, zodat iedereen aan bod komt.",
      },
      groupmaker: {
        label: "Groepenmaker",
        uitleg: "Verdeel de klas in evenwichtige groepjes.",
      },
    },
    eenheid: {
      kaart: { one: "{n} kaart", other: "{n} kaarten" },
      woord: { one: "{n} woord", other: "{n} woorden" },
      paar: { one: "{n} paar", other: "{n} paren" },
      vraag: { one: "{n} vraag", other: "{n} vragen" },
      zin: { one: "{n} zin", other: "{n} zinnen" },
      procedure: { one: "{n} procedure", other: "{n} procedures" },
      item: { one: "{n} item", other: "{n} items" },
      werkwoord: { one: "{n} werkwoord", other: "{n} werkwoorden" },
      opgave: { one: "{n} opgave", other: "{n} opgaven" },
      slot: { one: "{n} slot", other: "{n} sloten" },
      antwoordoptie: { one: "{n} antwoordoptie", other: "{n} antwoordopties" },
      tool: { one: "{n} tool", other: "{n} tools" },
    },
    leshulp: {
      opfrissen: {
        label: "Opfrissen",
        uitleg: "Een paar vragen uit vorige lessen, groot op het digibord.",
      },
      digibord: {
        label: "Digibordscherm",
        uitleg: "Lesdoelen, de opdracht van dit moment, een klok en de code van je oefening.",
      },
    },
    zichtbaarheid: {
      prive: {
        label: "Alleen ik",
        kort: "alleen ik",
        uitleg: "Je collega's zien dit niet in de bibliotheek. Cursisten met je code of QR-code kunnen wel oefenen.",
      },
      organisatie: {
        label: "Heel {organisatie}",
        kort: "gedeeld",
        uitleg: "Elke leraar vindt dit in de bibliotheek en kan er een kopie van maken.",
      },
    },
  },
  en: {
    klastools: "Classroom tools",
    duur: "± {n} min",
    lesfase: {
      activate: {
        label: "Activate prior knowledge",
        wanneer: "At the start of the lesson, find out what your learners already know.",
        waarom: "You know right away where to start, and learners get on board faster.",
        zegErbij: "You already know more about this than you think. Whatever you recall now will stick better.",
      },
      automate: {
        label: "Practise",
        wanneer: "Let learners repeat until the material comes easily.",
        waarom: "Recalling from memory works much better than rereading.",
        zegErbij: "Think of the answer yourself first. You can always check later; recalling is the real practice.",
      },
      check: {
        label: "Check understanding",
        wanneer: "Check along the way that everyone is still following.",
        waarom: "Learners get an explanation straight away when they answer wrong, without marks.",
        zegErbij: "This isn't a test. A wrong answer shows us both where we still need to look.",
      },
      reflect: {
        label: "Wrap up and reflect",
        wanneer: "End the lesson and gather what stuck.",
        waarom: "You start the next lesson with whatever was still unclear.",
        zegErbij: "Write down what you learned today, in your own words. Not what was on the board.",
      },
    },
    vorm: {
      flashcard: {
        label: "Flashcards",
        uitleg: "Cards with a question and an answer. The learner thinks of the answer first and only then flips the card.",
      },
      wordtrainer: {
        label: "Word trainer",
        uitleg: "Practise words with a translation, pronunciation and an example sentence.",
      },
      matching: {
        label: "Matching",
        uitleg: "Learners match terms to the right meaning.",
      },
      quiz: {
        label: "Simple quiz",
        uitleg: "Multiple-choice questions at their own pace, with an instant explanation for every answer. No marks, just feedback.",
      },
      fillblank: {
        label: "Fill in the blanks",
        uitleg: "Learners fill in the missing words in a text.",
      },
      zinbouwen: {
        label: "Build sentences",
        uitleg: "The words are jumbled. Learners put them in the right order.",
      },
      volgorde: {
        label: "Steps in order",
        uitleg: "Separate steps of a procedure, which the learner puts in the right order.",
      },
      sorteren: {
        label: "Sorting",
        uitleg: "Learners sort the items into two to four boxes.",
      },
      openvraag: {
        label: "Open question",
        uitleg: "The learner answers in their own words, then compares it with your model answer.",
      },
      lezen: {
        label: "Reading with questions",
        uitleg: "A short text with questions beside it. The text stays visible while answering.",
      },
      werkwoorden: {
        label: "Verbs",
        uitleg: "Practise conjugations: the learner gets the person and types the right form.",
      },
      rekenen: {
        label: "Maths",
        uitleg: "New numbers every round, so unlimited practice without you typing any questions.",
      },
      escaperoom: {
        label: "Escape room",
        uitleg: "A series of locks that only open with the right answer. Learners solve them together, in groups or on their own.",
      },
      poll: {
        label: "Live poll",
        uitleg: "You project the question, learners vote anonymously on their smartphones.",
      },
      wordcloud: {
        label: "Word cloud",
        uitleg: "Learners type one word. Together they form a cloud on the interactive whiteboard.",
      },
      exitticket: {
        label: "Exit ticket",
        uitleg: "Three short questions at the end of the lesson. You see right away what is still unclear.",
      },
      timer: {
        label: "Class timer",
        uitleg: "A visible countdown for a task or a break.",
      },
      randomizer: {
        label: "Name picker",
        uitleg: "Pick a learner at random, so everyone gets a turn.",
      },
      groupmaker: {
        label: "Group maker",
        uitleg: "Split the class into balanced groups.",
      },
    },
    eenheid: {
      kaart: { one: "{n} card", other: "{n} cards" },
      woord: { one: "{n} word", other: "{n} words" },
      paar: { one: "{n} pair", other: "{n} pairs" },
      vraag: { one: "{n} question", other: "{n} questions" },
      zin: { one: "{n} sentence", other: "{n} sentences" },
      procedure: { one: "{n} procedure", other: "{n} procedures" },
      item: { one: "{n} item", other: "{n} items" },
      werkwoord: { one: "{n} verb", other: "{n} verbs" },
      opgave: { one: "{n} problem", other: "{n} problems" },
      slot: { one: "{n} lock", other: "{n} locks" },
      antwoordoptie: { one: "{n} answer option", other: "{n} answer options" },
      tool: { one: "{n} tool", other: "{n} tools" },
    },
    leshulp: {
      opfrissen: {
        label: "Refresh",
        uitleg: "A few questions from earlier lessons, big on the interactive whiteboard.",
      },
      digibord: {
        label: "Whiteboard screen",
        uitleg: "Lesson goals, the task of the moment, a clock and the code of your exercise.",
      },
    },
    zichtbaarheid: {
      prive: {
        label: "Only me",
        kort: "only me",
        uitleg: "Your colleagues don't see this in the library. Learners with your code or QR code can still practise.",
      },
      organisatie: {
        label: "Everyone at {organisatie}",
        kort: "shared",
        uitleg: "Every teacher finds this in the library and can make a copy of it.",
      },
    },
  },
  fr: {
    klastools: "Outils de classe",
    duur: "± {n} min",
    lesfase: {
      activate: {
        label: "Activer les connaissances préalables",
        wanneer: "Au début de la leçon, vérifiez ce que vos apprenants savent déjà.",
        waarom: "Vous savez tout de suite par où commencer, et les apprenants accrochent plus vite.",
        zegErbij: "Vous en savez déjà plus que vous ne le pensez. Tout ce que vous retrouvez maintenant se retiendra mieux.",
      },
      automate: {
        label: "S'entraîner",
        wanneer: "Faites répéter les apprenants jusqu'à ce que la matière soit bien acquise.",
        waarom: "Aller chercher soi-même dans sa mémoire marche bien mieux que relire.",
        zegErbij: "Cherchez d'abord la réponse vous-même. Vous pourrez toujours vérifier ensuite : c'est en vous rappelant que vous vous entraînez vraiment.",
      },
      check: {
        label: "Vérifier la compréhension",
        wanneer: "Vérifiez en cours de route que tout le monde suit encore.",
        waarom: "Les apprenants reçoivent tout de suite une explication après une mauvaise réponse, sans points.",
        zegErbij: "Ce n'est pas un examen. Une mauvaise réponse nous montre à tous les deux ce qu'il reste à revoir.",
      },
      reflect: {
        label: "Conclure et réfléchir",
        wanneer: "Terminez la leçon et recueillez ce qui a été retenu.",
        waarom: "Vous commencez la leçon suivante par ce qui n'était pas encore clair.",
        zegErbij: "Notez ce que vous avez appris aujourd'hui, avec vos propres mots. Pas ce qui était au tableau.",
      },
    },
    vorm: {
      flashcard: {
        label: "Cartes mémoire",
        uitleg: "Des cartes avec une question et une réponse. L'apprenant cherche d'abord la réponse, puis retourne la carte.",
      },
      wordtrainer: {
        label: "Entraîneur de vocabulaire",
        uitleg: "S'entraîner aux mots avec traduction, prononciation et phrase d'exemple.",
      },
      matching: {
        label: "Associer",
        uitleg: "Les apprenants associent des notions à leur bonne signification.",
      },
      quiz: {
        label: "Quiz simple",
        uitleg: "Des questions à choix multiples à son rythme, avec une explication immédiate pour chaque réponse. Pas de points, mais du feedback.",
      },
      fillblank: {
        label: "Texte à trous",
        uitleg: "Les apprenants complètent les mots manquants dans un texte.",
      },
      zinbouwen: {
        label: "Construire des phrases",
        uitleg: "Les mots sont mélangés. Les apprenants les remettent dans le bon ordre.",
      },
      volgorde: {
        label: "Étapes dans l'ordre",
        uitleg: "Les étapes séparées d'une procédure, que l'apprenant remet dans le bon ordre.",
      },
      sorteren: {
        label: "Trier",
        uitleg: "Les apprenants répartissent les éléments dans deux à quatre bacs.",
      },
      openvraag: {
        label: "Question ouverte",
        uitleg: "L'apprenant répond avec ses propres mots, puis compare avec votre réponse modèle.",
      },
      lezen: {
        label: "Lecture avec questions",
        uitleg: "Un texte court avec des questions à côté. Le texte reste visible pendant les réponses.",
      },
      werkwoorden: {
        label: "Verbes",
        uitleg: "S'entraîner aux conjugaisons : l'apprenant reçoit la personne et tape la bonne forme.",
      },
      rekenen: {
        label: "Calcul",
        uitleg: "De nouveaux nombres à chaque tour : un entraînement illimité sans que vous tapiez de questions.",
      },
      escaperoom: {
        label: "Escape game",
        uitleg: "Une série de cadenas qui ne s'ouvrent qu'avec la bonne réponse. Les apprenants les résolvent ensemble, en groupe ou seuls.",
      },
      poll: {
        label: "Sondage en direct",
        uitleg: "Vous projetez la question, les apprenants votent anonymement avec leur smartphone.",
      },
      wordcloud: {
        label: "Nuage de mots",
        uitleg: "Les apprenants tapent un mot. Ensemble, ils forment un nuage sur le tableau interactif.",
      },
      exitticket: {
        label: "Billet de sortie",
        uitleg: "Trois questions courtes en fin de leçon. Vous voyez tout de suite ce qui n'est pas encore clair.",
      },
      timer: {
        label: "Minuteur",
        uitleg: "Un compte à rebours visible pour une consigne ou une pause.",
      },
      randomizer: {
        label: "Tirage au sort",
        uitleg: "Choisissez un apprenant au hasard, pour que chacun ait son tour.",
      },
      groupmaker: {
        label: "Création de groupes",
        uitleg: "Répartissez la classe en groupes équilibrés.",
      },
    },
    eenheid: {
      kaart: { one: "{n} carte", other: "{n} cartes" },
      woord: { one: "{n} mot", other: "{n} mots" },
      paar: { one: "{n} paire", other: "{n} paires" },
      vraag: { one: "{n} question", other: "{n} questions" },
      zin: { one: "{n} phrase", other: "{n} phrases" },
      procedure: { one: "{n} procédure", other: "{n} procédures" },
      item: { one: "{n} élément", other: "{n} éléments" },
      werkwoord: { one: "{n} verbe", other: "{n} verbes" },
      opgave: { one: "{n} calcul", other: "{n} calculs" },
      slot: { one: "{n} cadenas", other: "{n} cadenas" },
      antwoordoptie: { one: "{n} option de réponse", other: "{n} options de réponse" },
      tool: { one: "{n} outil", other: "{n} outils" },
    },
    leshulp: {
      opfrissen: {
        label: "Réviser",
        uitleg: "Quelques questions des leçons précédentes, en grand sur le tableau interactif.",
      },
      digibord: {
        label: "Écran du tableau",
        uitleg: "Les objectifs de la leçon, la consigne du moment, une horloge et le code de votre exercice.",
      },
    },
    zichtbaarheid: {
      prive: {
        label: "Moi seul",
        kort: "moi seul",
        uitleg: "Vos collègues ne le voient pas dans la bibliothèque. Les apprenants qui ont votre code ou votre QR code peuvent quand même s'entraîner.",
      },
      organisatie: {
        label: "Partagé avec {organisatie}",
        kort: "partagé",
        uitleg: "Chaque enseignant le trouve dans la bibliothèque et peut en faire une copie.",
      },
    },
  },
  es: {
    klastools: "Herramientas de clase",
    duur: "± {n} min",
    lesfase: {
      activate: {
        label: "Activar conocimientos previos",
        wanneer: "Al empezar la clase, averigua qué saben ya tus estudiantes.",
        waarom: "Sabes enseguida por dónde empezar y los estudiantes se enganchan antes.",
        zegErbij: "Ya sabes más de esto de lo que crees. Todo lo que recuerdes ahora se te quedará mejor.",
      },
      automate: {
        label: "Practicar",
        wanneer: "Haz que los estudiantes repitan hasta que dominen la materia.",
        waarom: "Recordar por uno mismo funciona mucho mejor que releer.",
        zegErbij: "Piensa primero tú la respuesta. Comprobar siempre puedes después; recordar es la práctica de verdad.",
      },
      check: {
        label: "Comprobar la comprensión",
        wanneer: "Comprueba sobre la marcha que todos siguen el ritmo.",
        waarom: "Los estudiantes reciben una explicación inmediata cuando fallan, sin notas.",
        zegErbij: "Esto no es un examen. Una respuesta incorrecta nos muestra a los dos dónde tenemos que mirar todavía.",
      },
      reflect: {
        label: "Cerrar y reflexionar",
        wanneer: "Cierra la clase y recoge lo que se ha quedado.",
        waarom: "Empiezas la siguiente clase con lo que aún no estaba claro.",
        zegErbij: "Escribe lo que has aprendido hoy, con tus propias palabras. No lo que estaba en la pizarra.",
      },
    },
    vorm: {
      flashcard: {
        label: "Tarjetas",
        uitleg: "Tarjetas con pregunta y respuesta. El estudiante piensa primero la respuesta y solo después le da la vuelta.",
      },
      wordtrainer: {
        label: "Entrenador de vocabulario",
        uitleg: "Practicar palabras con traducción, pronunciación y una frase de ejemplo.",
      },
      matching: {
        label: "Emparejar",
        uitleg: "Los estudiantes relacionan conceptos con su significado correcto.",
      },
      quiz: {
        label: "Cuestionario sencillo",
        uitleg: "Preguntas de opción múltiple a su ritmo, con una explicación inmediata en cada respuesta. Sin notas, pero con retroalimentación.",
      },
      fillblank: {
        label: "Completar huecos",
        uitleg: "Los estudiantes completan las palabras que faltan en un texto.",
      },
      zinbouwen: {
        label: "Construir frases",
        uitleg: "Las palabras están desordenadas. Los estudiantes las ponen en el orden correcto.",
      },
      volgorde: {
        label: "Pasos en orden",
        uitleg: "Los pasos sueltos de un procedimiento, que el estudiante pone en el orden correcto.",
      },
      sorteren: {
        label: "Clasificar",
        uitleg: "Los estudiantes reparten los elementos en dos a cuatro cajas.",
      },
      openvraag: {
        label: "Pregunta abierta",
        uitleg: "El estudiante responde con sus propias palabras y luego compara con tu respuesta modelo.",
      },
      lezen: {
        label: "Lectura con preguntas",
        uitleg: "Un texto corto con preguntas al lado. El texto sigue visible mientras se responde.",
      },
      werkwoorden: {
        label: "Verbos",
        uitleg: "Practicar conjugaciones: el estudiante recibe la persona y escribe la forma correcta.",
      },
      rekenen: {
        label: "Cálculo",
        uitleg: "Números nuevos en cada ronda: práctica ilimitada sin que tengas que escribir preguntas.",
      },
      escaperoom: {
        label: "Sala de escape",
        uitleg: "Una serie de candados que solo se abren con la respuesta correcta. Los estudiantes los resuelven juntos, en grupo o por su cuenta.",
      },
      poll: {
        label: "Encuesta en directo",
        uitleg: "Tú proyectas la pregunta y los estudiantes votan de forma anónima con su móvil.",
      },
      wordcloud: {
        label: "Nube de palabras",
        uitleg: "Los estudiantes escriben una palabra. Juntas forman una nube en la pizarra digital.",
      },
      exitticket: {
        label: "Ticket de salida",
        uitleg: "Tres preguntas cortas al final de la clase. Ves enseguida lo que aún no está claro.",
      },
      timer: {
        label: "Temporizador",
        uitleg: "Una cuenta atrás visible para una tarea o una pausa.",
      },
      randomizer: {
        label: "Selector de nombres",
        uitleg: "Elige a un estudiante al azar, para que todos tengan su turno.",
      },
      groupmaker: {
        label: "Creador de grupos",
        uitleg: "Divide la clase en grupos equilibrados.",
      },
    },
    eenheid: {
      kaart: { one: "{n} tarjeta", other: "{n} tarjetas" },
      woord: { one: "{n} palabra", other: "{n} palabras" },
      paar: { one: "{n} par", other: "{n} pares" },
      vraag: { one: "{n} pregunta", other: "{n} preguntas" },
      zin: { one: "{n} frase", other: "{n} frases" },
      procedure: { one: "{n} procedimiento", other: "{n} procedimientos" },
      item: { one: "{n} elemento", other: "{n} elementos" },
      werkwoord: { one: "{n} verbo", other: "{n} verbos" },
      opgave: { one: "{n} operación", other: "{n} operaciones" },
      slot: { one: "{n} candado", other: "{n} candados" },
      antwoordoptie: { one: "{n} opción de respuesta", other: "{n} opciones de respuesta" },
      tool: { one: "{n} herramienta", other: "{n} herramientas" },
    },
    leshulp: {
      opfrissen: {
        label: "Repasar",
        uitleg: "Unas preguntas de clases anteriores, en grande en la pizarra digital.",
      },
      digibord: {
        label: "Pantalla de pizarra",
        uitleg: "Los objetivos de la clase, la tarea del momento, un reloj y el código de tu ejercicio.",
      },
    },
    zichtbaarheid: {
      prive: {
        label: "Solo yo",
        kort: "solo yo",
        uitleg: "Tus colegas no lo ven en la biblioteca. Los estudiantes con tu código o código QR sí pueden practicar.",
      },
      organisatie: {
        label: "Compartido con {organisatie}",
        kort: "compartido",
        uitleg: "Cualquier docente lo encuentra en la biblioteca y puede hacer una copia.",
      },
    },
  },
});
