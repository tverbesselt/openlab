"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  Share2,
  type LucideIcon,
} from "lucide-react";
import { generateExercisesFromWordList } from "@/lib/didacticEngine";
import { gatenVan, heeftGat, ontleedInvulzin } from "@/lib/invulzin";
import { leesBegrippen } from "@/lib/begrippen";
import { TALEN, STANDAARD_TAAL } from "@/lib/spraak";
import { t, tn } from "@/lib/i18n";
import { tr } from "@/lib/i18n/rijk";
import { opslag, generateShortCode, useMateriaal } from "@/lib/opslag";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Exercise, ExerciseType, QuizQuestion, QuizMedia, FillBlankItem, Lesmap, Zichtbaarheid } from "@/lib/types";
import { useInstellingen } from "@/lib/instellingen/AppProvider";
import {
  WERKVORMEN,
  ZICHTBAARHEID,
  inhoudSamenvatting,
  eigenMappen,
  isKlassikaal,
} from "@/lib/labels";
import { ShareModal } from "@/components/ShareModal";
import { LeraarPoort } from "@/components/LeraarPoort";
import { Studietip } from "@/components/Studietip";
import { Veld, Foutmelding, FeedbackKiezer } from "@/components/maken/Velden";
import { InleesKnop } from "@/components/maken/InleesKnop";
import {
  ZinbouwenVorm,
  VolgordeVorm,
  SorterenVorm,
  OpenVraagVorm,
  LezenVorm,
  WerkwoordenVorm,
  RekenenVorm,
  type VormProps,
} from "@/components/maken/NieuweVormen";
import { ExitTicketVorm } from "@/components/maken/ExitTicketVorm";
import { EscaperoomVorm } from "@/components/maken/EscaperoomVorm";
import { MediaKiezer } from "@/components/maken/MediaKiezer";

type Modus =
  | "begrippen"
  | "invul"
  | "zinbouwen"
  | "volgorde"
  | "sorteren"
  | "werkwoorden"
  | "rekenen"
  | "quiz"
  | "lezen"
  | "openvraag"
  | "escaperoom"
  | "exitticket"
  | "poll"
  | "wordcloud";

interface NieuweVraag {
  /** Vaste sleutel, zodat een vraag verwijderen de media van de volgende niet verschuift. */
  sleutel: string;
  /** Kiezen uit antwoorden, of het antwoord zelf intypen. */
  soort: "keuze" | "typ";
  vraag: string;
  juist: string;
  fout1: string;
  fout2: string;
  /** Alleen bij intypen: andere schrijfwijzen die ook goed zijn, één per regel. */
  andere: string;
  uitleg: string;
  media?: QuizMedia;
}

let volgnummer = 0;
const legeVraag = (): NieuweVraag => ({
  sleutel: `v${++volgnummer}`,
  soort: "keuze",
  vraag: "",
  juist: "",
  fout1: "",
  fout2: "",
  andere: "",
  uitleg: "",
});

/** Welke werkvormen een keuze maakt. Staan ze allemaal uit, dan verdwijnt de keuze. */
const WERKVORMEN_VAN: Record<Modus, ExerciseType[]> = {
  begrippen: ["flashcard", "matching", "quiz"],
  invul: ["fillblank"],
  zinbouwen: ["zinbouwen"],
  volgorde: ["volgorde"],
  sorteren: ["sorteren"],
  werkwoorden: ["werkwoorden"],
  rekenen: ["rekenen"],
  quiz: ["quiz"],
  lezen: ["lezen"],
  openvraag: ["openvraag"],
  escaperoom: ["escaperoom"],
  exitticket: ["exitticket"],
  poll: ["poll"],
  wordcloud: ["wordcloud"],
};

type Keuzegroep = {
  titel: string;
  uitleg: string;
  vormen: { modus: Modus; titel: string; uitleg: string; icon: LucideIcon }[];
};

/**
 * Alles wat een leraar kan maken, gegroepeerd per moment in de les. Eén lijst voedt zowel
 * het keuzescherm (stap 1) als de kop boven het formulier (stap 2). Een functie en geen
 * constante: de teksten volgen de taal, en de beheerder kan werkvormen uitzetten.
 */
function keuzes(isAan: (type: ExerciseType) => boolean): Keuzegroep[] {
  return alleKeuzes()
    .map((groep) => ({
      ...groep,
      vormen: groep.vormen.filter((v) => WERKVORMEN_VAN[v.modus].some(isAan)),
    }))
    .filter((groep) => groep.vormen.length > 0);
}

function alleKeuzes(): Keuzegroep[] {
  return [
  {
    titel: t("maken.groepen.inoefenen.titel"),
    uitleg: t("maken.groepen.inoefenen.uitleg"),
    vormen: [
      {
        modus: "begrippen",
        titel: t("maken.vormen.begrippen.titel"),
        uitleg: t("maken.vormen.begrippen.uitleg"),
        icon: WERKVORMEN.flashcard.icon,
      },
      {
        modus: "invul",
        titel: t("maken.vormen.invul.titel"),
        uitleg: t("maken.vormen.invul.uitleg"),
        icon: WERKVORMEN.fillblank.icon,
      },
      {
        modus: "zinbouwen",
        titel: t("maken.vormen.zinbouwen.titel"),
        uitleg: t("maken.vormen.zinbouwen.uitleg"),
        icon: WERKVORMEN.zinbouwen.icon,
      },
      {
        modus: "volgorde",
        titel: t("maken.vormen.volgorde.titel"),
        uitleg: t("maken.vormen.volgorde.uitleg"),
        icon: WERKVORMEN.volgorde.icon,
      },
      {
        modus: "sorteren",
        titel: t("maken.vormen.sorteren.titel"),
        uitleg: t("maken.vormen.sorteren.uitleg"),
        icon: WERKVORMEN.sorteren.icon,
      },
      {
        modus: "werkwoorden",
        titel: t("maken.vormen.werkwoorden.titel"),
        uitleg: t("maken.vormen.werkwoorden.uitleg"),
        icon: WERKVORMEN.werkwoorden.icon,
      },
      {
        modus: "rekenen",
        titel: t("maken.vormen.rekenen.titel"),
        uitleg: t("maken.vormen.rekenen.uitleg"),
        icon: WERKVORMEN.rekenen.icon,
      },
    ],
  },
  {
    titel: t("maken.groepen.controleren.titel"),
    uitleg: t("maken.groepen.controleren.uitleg"),
    vormen: [
      {
        modus: "quiz",
        titel: t("maken.vormen.quiz.titel"),
        uitleg: t("maken.vormen.quiz.uitleg"),
        icon: WERKVORMEN.quiz.icon,
      },
      {
        modus: "lezen",
        titel: t("maken.vormen.lezen.titel"),
        uitleg: t("maken.vormen.lezen.uitleg"),
        icon: WERKVORMEN.lezen.icon,
      },
      {
        modus: "openvraag",
        titel: t("maken.vormen.openvraag.titel"),
        uitleg: t("maken.vormen.openvraag.uitleg"),
        icon: WERKVORMEN.openvraag.icon,
      },
      {
        modus: "escaperoom",
        titel: t("maken.vormen.escaperoom.titel"),
        uitleg: t("maken.vormen.escaperoom.uitleg"),
        icon: WERKVORMEN.escaperoom.icon,
      },
    ],
  },
  {
    titel: t("maken.groepen.afsluiten.titel"),
    uitleg: t("maken.groepen.afsluiten.uitleg"),
    vormen: [
      {
        modus: "exitticket",
        titel: t("maken.vormen.exitticket.titel"),
        uitleg: t("maken.vormen.exitticket.uitleg"),
        icon: WERKVORMEN.exitticket.icon,
      },
    ],
  },
  {
    titel: t("maken.groepen.klassikaal.titel"),
    uitleg: t("maken.groepen.klassikaal.uitleg"),
    vormen: [
      {
        modus: "poll",
        titel: t("maken.vormen.poll.titel"),
        uitleg: t("maken.vormen.poll.uitleg"),
        icon: WERKVORMEN.poll.icon,
      },
      {
        modus: "wordcloud",
        titel: t("maken.vormen.wordcloud.titel"),
        uitleg: t("maken.vormen.wordcloud.uitleg"),
        icon: WERKVORMEN.wordcloud.icon,
      },
    ],
  },
  ];
}

export default function MakenPagina() {
  const { status, isLeraar, gebruiker } = useAuth();
  const { isAan } = useInstellingen();
  const KEUZES = keuzes(isAan);
  const ALLE_VORMEN = KEUZES.flatMap((groep) => groep.vormen);
  // Nog niets gekozen = stap 1 (kiezen). Een gekozen werkvorm = stap 2 (invullen).
  const [modus, setModus] = useState<Modus | null>(null);

  // De keuze staat ook in de URL (/maken?vorm=quiz): zo werkt de terugknop van de browser
  // zoals je verwacht, en kan een link meteen het juiste formulier openen.
  useEffect(() => {
    const lees = () => {
      const vorm = new URLSearchParams(window.location.search).get("vorm");
      setModus(ALLE_VORMEN.some((v) => v.modus === vorm) ? (vorm as Modus) : null);
    };
    lees();
    window.addEventListener("popstate", lees);
    return () => window.removeEventListener("popstate", lees);
    // ALLE_VORMEN volgt uit de instellingen, die veranderen niet terwijl je hier bent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kies = (nieuw: Modus | null) => {
    window.history.pushState(null, "", nieuw ? `/maken?vorm=${nieuw}` : "/maken");
    setModus(nieuw);
    setFout("");
    window.scrollTo({ top: 0 });
  };
  const [resultaat, setResultaat] = useState<Exercise[] | null>(null);
  const [delen, setDelen] = useState<Exercise | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  // Waar het resultaat terechtkomt: standaard privé, want niet alles hoeft gedeeld.
  const [zichtbaarheid, setZichtbaarheid] = useState<Zichtbaarheid>("prive");
  const [mapId, setMapId] = useState("");
  const { mappen, setMappen } = useMateriaal();

  // Begrippenlijst
  const [titel, setTitel] = useState("");
  const [begrippen, setBegrippen] = useState("");

  // Quiz
  const [quizTitel, setQuizTitel] = useState("");
  const [tweedeKans, setTweedeKans] = useState(true);
  const [vragen, setVragen] = useState<NieuweVraag[]>(() => [legeVraag()]);
  // Hoeveel foto's of fragmenten nog aan het uploaden zijn: zolang dat loopt, wacht bewaren.
  const [uploads, setUploads] = useState(0);

  // Live poll
  const [pollVraag, setPollVraag] = useState("");
  const [pollOpties, setPollOpties] = useState(["", "", "", ""]);

  // Invuloefening
  const [invulTitel, setInvulTitel] = useState("");
  const [invulZinnen, setInvulZinnen] = useState("");

  // Woordwolk
  const [wolkVraag, setWolkVraag] = useState("");

  // Taal van de voorleesknop. Alleen zinvol bij materiaal dat voorgelezen wordt.
  const [spraakTaal, setSpraakTaal] = useState(STANDAARD_TAAL);

  /** Velden die elke nieuwe oefening deelt. */
  const basis = () => ({
    creatorName: gebruiker?.naam ?? t("maken.onbekend"),
    creatorId: gebruiker?.id,
    visibility: zichtbaarheid,
    shareCode: generateShortCode(),
    createdAt: new Date().toISOString().split("T")[0],
  });

  const bewaar = async (nieuwe: Exercise[]) => {
    if (bezig) return;
    setBezig(true);
    setFout("");
    try {
      await opslag.maakOefeningen(nieuwe);

      const map = mapId ? mappen.find((m) => m.id === mapId) : undefined;
      if (map) {
        const exerciseIds = [...map.exerciseIds, ...nieuwe.map((n) => n.id)];
        await opslag.wijzigMap(map.id, { exerciseIds });
        setMappen(mappen.map((m) => (m.id === map.id ? { ...m, exerciseIds } : m)));
      }

      setResultaat(nieuwe);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFout(t("maken.bewarenMislukt"));
    } finally {
      setBezig(false);
    }
  };

  const maakUitBegrippen = (e: React.FormEvent) => {
    e.preventDefault();
    const { begrippen: items } = leesBegrippen(begrippen);

    if (items.length === 0) {
      setFout(t("maken.begrippen.fout"));
      return;
    }

    const { flashcardExercise, matchingExercise, quizExercise } = generateExercisesFromWordList(
      titel.trim(),
      items,
      {
        creatorName: gebruiker?.naam ?? t("maken.onbekend"),
        creatorId: gebruiker?.id,
        zichtbaarheid,
        spraakTaal,
      }
    );
    // Alleen de werkvormen die in deze installatie aan staan.
    bewaar([flashcardExercise, matchingExercise, quizExercise].filter((ex) => isAan(ex.type)));
  };

  const maakInvuloefening = (e: React.FormEvent) => {
    e.preventDefault();
    const bruikbaar = invulZinnen
      .split("\n")
      .map((zin) => zin.trim())
      .filter((zin) => zin && heeftGat(zin));

    if (bruikbaar.length === 0) {
      setFout(t("maken.invul.fout"));
      return;
    }

    const fillBlanks: FillBlankItem[] = bruikbaar.map((zin, index) => ({
      id: `fb-${index}`,
      textWithBlanks: zin,
      // Het eerste antwoord per gat; de speler leest de rest uit de zin zelf.
      answers: gatenVan(zin).map((gat) => gat.antwoorden[0]),
    }));

    bewaar([
      {
        ...basis(),
        id: `invul-${Date.now()}`,
        title: invulTitel.trim(),
        description: t("maken.invul.beschrijving"),
        category: "practice",
        didacticGoal: "automate",
        type: "fillblank",
        tags: [t("maken.tags.invul")],
        content: { fillBlanks },
        didacticConfig: {
          showImmediateFeedback: true,
          allowRetryMissed: true,
          enableGamification: false,
          spraakTaal,
        },
      },
    ]);
  };

  const maakWoordwolk = (e: React.FormEvent) => {
    e.preventDefault();
    const vraag = wolkVraag.trim();
    if (!vraag) return;

    bewaar([
      {
        ...basis(),
        id: `wolk-${Date.now()}`,
        title: vraag,
        description: t("maken.woordwolk.beschrijving"),
        category: "live",
        didacticGoal: "activate",
        type: "wordcloud",
        tags: [t("maken.tags.live"), t("maken.tags.voorkennis")],
        content: { wordCloudPrompt: vraag },
        didacticConfig: {
          showImmediateFeedback: false,
          allowRetryMissed: false,
          enableGamification: false,
        },
      },
    ]);
  };

  const maakQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    const bruikbaar = vragen.filter((v) => v.vraag.trim() && v.juist.trim());
    if (bruikbaar.length === 0) return;

    const questions: QuizQuestion[] = bruikbaar.map((v, index) => {
      const media = v.media ? { media: { ...v.media, alt: v.media.alt?.trim() } } : {};
      const uitleg = v.uitleg.trim() || t("maken.quiz.standaardUitleg", { antwoord: v.juist.trim() });

      if (v.soort === "typ") {
        // Elke regel is een schrijfwijze die goed gerekend wordt; de eerste tonen we.
        const antwoorden = [v.juist, ...v.andere.split(/\r?\n|,/)]
          .map((a) => a.trim())
          .filter(Boolean);
        return {
          id: `q-${index}`,
          question: v.vraag.trim(),
          options: [],
          correctAnswers: [],
          type: "typ",
          antwoorden,
          explanation: uitleg,
          ...media,
        };
      }

      const opties = [v.juist, v.fout1, v.fout2].filter((o) => o.trim());
      return {
        id: `q-${index}`,
        question: v.vraag.trim(),
        options: opties,
        correctAnswers: [0],
        type: "multiple_choice",
        explanation: uitleg,
        ...media,
      };
    });

    const quiz: Exercise = {
      id: `quiz-${Date.now()}`,
      title: quizTitel.trim(),
      description: tweedeKans
        ? t("maken.quiz.beschrijvingTweedeKans")
        : t("maken.quiz.beschrijving"),
      category: "quiz",
      didacticGoal: "check",
      type: "quiz",
      creatorName: gebruiker?.naam ?? t("maken.onbekend"),
      creatorId: gebruiker?.id,
      visibility: zichtbaarheid,
      shareCode: generateShortCode(),
      tags: [t("maken.tags.quiz")],
      content: { questions },
      didacticConfig: {
        showImmediateFeedback: true,
        allowRetryMissed: true,
        enableGamification: false,
        tweedeKans,
      },
      createdAt: new Date().toISOString().split("T")[0],
    };

    bewaar([quiz]);
  };

  const maakPoll = (e: React.FormEvent) => {
    e.preventDefault();
    const opties = pollOpties.map((o) => o.trim()).filter(Boolean);
    if (!pollVraag.trim() || opties.length < 2) return;

    const poll: Exercise = {
      id: `poll-${Date.now()}`,
      title: pollVraag.trim(),
      description: t("maken.poll.beschrijving"),
      category: "live",
      didacticGoal: "activate",
      type: "poll",
      creatorName: gebruiker?.naam ?? t("maken.onbekend"),
      creatorId: gebruiker?.id,
      visibility: zichtbaarheid,
      shareCode: generateShortCode(),
      tags: [t("maken.tags.live"), t("maken.tags.voorkennis")],
      content: { pollQuestion: pollVraag.trim(), pollOptions: opties },
      didacticConfig: {
        showImmediateFeedback: false,
        allowRetryMissed: false,
        enableGamification: false,
      },
      createdAt: new Date().toISOString().split("T")[0],
    };

    bewaar([poll]);
  };

  /* ── Alleen leraren maken materiaal ───────────────────────────────────── */
  if (status === "laden") {
    return <div className="h-64" aria-hidden />;
  }

  if (!isLeraar) {
    return (
      <LeraarPoort uitleg={t("maken.poort")} />
    );
  }

  /* ── Resultaat: wat is er precies gemaakt? ────────────────────────────── */
  if (resultaat) {
    return (
      <div className="max-w-2xl mx-auto space-y-5 u-fade">
        <div className="text-center">
          <CheckCircle2 className="w-10 h-10 text-merk mx-auto mb-2" />
          <h1 className="text-2xl font-extrabold text-merk-900 tracking-tight">
            {t("maken.resultaat.titel")}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {resultaat.length === 1
              ? t("maken.resultaat.een")
              : tn("maken.resultaat.meer", resultaat.length)}
          </p>
        </div>

        <div className="space-y-3">
          {resultaat.map((ex) => {
            const Icon = WERKVORMEN[ex.type].icon;
            return (
              <div
                key={ex.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3"
              >
                <span className="w-10 h-10 shrink-0 rounded-xl bg-merk-50 text-merk-900 flex items-center justify-center border border-merk/20">
                  <Icon className="w-5 h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {WERKVORMEN[ex.type].label}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t("maken.resultaat.code", { samenvatting: inhoudSamenvatting(ex), code: ex.shareCode })}
                  </p>
                </div>
                {isKlassikaal(ex) ? (
                  <Link
                    href={`/live?oefening=${ex.id}`}
                    className="px-3 py-2 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-xs transition-colors"
                  >
                    {t("maken.resultaat.startInDeKlas")}
                  </Link>
                ) : (
                  <button
                    onClick={() => setDelen(ex)}
                    className="px-3 py-2 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{t("maken.resultaat.deel")}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/bibliotheek?van=mij"
            className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm text-center transition-colors"
          >
            {t("maken.resultaat.naarBibliotheek")}
          </Link>
          <button
            onClick={() => {
              setResultaat(null);
              setTitel("");
              setBegrippen("");
              setQuizTitel("");
              setVragen([legeVraag()]);
              setPollVraag("");
              setPollOpties(["", "", "", ""]);
              setInvulTitel("");
              setInvulZinnen("");
              setWolkVraag("");
              setFout("");
            }}
            className="flex-1 py-3 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
          >
            {t("maken.resultaat.nogEen")}
          </button>
        </div>

        {delen && (
          <ShareModal
            isOpen={!!delen}
            onClose={() => setDelen(null)}
            title={delen.title}
            shareCode={delen.shareCode}
            id={delen.id}
          />
        )}
      </div>
    );
  }

  /* ── Wat elke werkvorm deelt: zichtbaarheid, map, taal ─────────────────── */
  const bestemming = (
    <Bestemming
      zichtbaarheid={zichtbaarheid}
      setZichtbaarheid={setZichtbaarheid}
      mapId={mapId}
      setMapId={setMapId}
      mappen={eigenMappen(mappen, gebruiker)}
    />
  );

  const vormProps: VormProps = {
    basis,
    bezig,
    fout,
    setFout,
    bewaar,
    bestemming,
    spraakTaal,
    taalKiezer: <TaalKiezer waarde={spraakTaal} onWijzig={setSpraakTaal} wat="inhoud" />,
  };

  /* ── Stap 1: wat wil je maken? ────────────────────────────────────────── */
  if (!modus) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 u-fade">
        <div>
          <Stap nummer={1} />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-merk-900 tracking-tight mb-1">
            {t("maken.kiezen.titel")}
          </h1>
          <p className="text-sm text-slate-700">
            {t("maken.kiezen.intro")}
          </p>
        </div>

        {KEUZES.map((groep) => (
          <section key={groep.titel}>
            <div className="mb-3">
              <h2 className="text-base font-extrabold text-slate-900">{groep.titel}</h2>
              <p className="text-sm text-slate-600">{groep.uitleg}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {groep.vormen.map((vorm) => {
                const Icon = vorm.icon;
                return (
                  <button
                    key={vorm.modus}
                    onClick={() => kies(vorm.modus)}
                    className="group text-left p-4 rounded-2xl bg-white border border-slate-300 shadow-sm hover:border-merk-800 hover:shadow-md transition-all cursor-pointer flex items-center gap-3"
                  >
                    <span className="w-11 h-11 shrink-0 rounded-xl bg-merk-50 text-merk-900 border border-merk/30 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-900">{vorm.titel}</span>
                      <span className="block text-xs text-slate-600 mt-0.5 leading-snug">
                        {vorm.uitleg}
                      </span>
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0 text-slate-500 group-hover:text-merk-900 group-hover:translate-x-0.5 transition-all" />
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        <Studietip plek="maken" meer />
      </div>
    );
  }

  /* ── Stap 2: inhoud invullen ──────────────────────────────────────────── */
  const gekozen = ALLE_VORMEN.find((v) => v.modus === modus)!;
  const GekozenIcon = gekozen.icon;

  return (
    <div className="max-w-2xl mx-auto space-y-5 u-fade">
      <div>
        <button
          onClick={() => kies(null)}
          className="inline-flex items-center gap-1.5 -ml-2 px-2 py-1.5 rounded-lg text-sm font-bold text-merk-900 hover:bg-merk-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("maken.kiezen.andere")}</span>
        </button>

        <div className="flex items-center gap-3 mt-3">
          <span className="w-12 h-12 shrink-0 rounded-xl bg-merk-800 text-white flex items-center justify-center">
            <GekozenIcon className="w-6 h-6" />
          </span>
          <div className="min-w-0">
            <Stap nummer={2} />
            <h1 className="text-2xl font-extrabold text-merk-900 tracking-tight leading-tight">
              {gekozen.titel}
            </h1>
            <p className="text-sm text-slate-700">{gekozen.uitleg}</p>
          </div>
        </div>
      </div>

      {modus === "poll" && (
        <form onSubmit={maakPoll} className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5">
          <Veld
            label={t("maken.veld.jeVraag")}
            hint={t("maken.poll.vraagHint")}
          >
            <input
              type="text"
              value={pollVraag}
              onChange={(e) => setPollVraag(e.target.value)}
              placeholder={t("maken.poll.vraagVoorbeeld")}
              required
              className="w-full p-3 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
            />
          </Veld>

          <Veld label={t("maken.poll.opties")} hint={t("maken.poll.optiesHint")}>
            <div className="space-y-2">
              {pollOpties.map((optie, index) => (
                <input
                  key={index}
                  type="text"
                  value={optie}
                  onChange={(e) =>
                    setPollOpties(pollOpties.map((o, i) => (i === index ? e.target.value : o)))
                  }
                  placeholder={t("maken.poll.antwoord", { n: index + 1 })}
                  aria-label={t("maken.poll.antwoord", { n: index + 1 })}
                  className="w-full p-2.5 text-sm rounded-lg bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
                />
              ))}
            </div>
          </Veld>

          <Bestemming
            zichtbaarheid={zichtbaarheid}
            setZichtbaarheid={setZichtbaarheid}
            mapId={mapId}
            setMapId={setMapId}
            mappen={eigenMappen(mappen, gebruiker)}
          />

          <Foutmelding tekst={fout} />

          <button
            type="submit"
            disabled={bezig}
            className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-60 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>{bezig ? t("maken.knop.bezig") : t("maken.knop.poll")}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {modus === "begrippen" && (
        <form
          onSubmit={maakUitBegrippen}
          className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5"
        >
          <Veld label={t("maken.veld.onderwerp")} hint={t("maken.begrippen.onderwerpHint")}>
            <input
              type="text"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder={t("maken.veld.titelOefening")}
              required
              className="w-full p-3 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
            />
          </Veld>

          <Veld
            label={t("maken.begrippen.label")}
            hint={t("maken.begrippen.labelHint")}
          >
            <textarea
              rows={7}
              value={begrippen}
              onChange={(e) => setBegrippen(e.target.value)}
              placeholder={t("maken.begrippen.voorbeeld")}
              required
              className="w-full p-3 font-mono text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
            />
          </Veld>

          <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3">
            {tr("maken.begrippen.uitleg", { b: (s) => <strong>{s}</strong> })}
          </p>

          <BegrippenVoorbeeld tekst={begrippen} />

          <TaalKiezer waarde={spraakTaal} onWijzig={setSpraakTaal} wat="begrippen" />

          <Bestemming
            zichtbaarheid={zichtbaarheid}
            setZichtbaarheid={setZichtbaarheid}
            mapId={mapId}
            setMapId={setMapId}
            mappen={eigenMappen(mappen, gebruiker)}
          />

          <Foutmelding tekst={fout} />

          <button
            type="submit"
            disabled={bezig}
            className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-60 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>{bezig ? t("maken.knop.bezig") : t("maken.knop.werkvormen")}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {modus === "quiz" && (
        <form onSubmit={maakQuiz} className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5">
          <Veld label={t("maken.quiz.titel")}>
            <input
              type="text"
              value={quizTitel}
              onChange={(e) => setQuizTitel(e.target.value)}
              placeholder={t("maken.quiz.titelVoorbeeld")}
              required
              className="w-full p-3 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
            />
          </Veld>

          {vragen.map((vraag, index) => (
            <div key={vraag.sleutel} className="rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{t("maken.veld.vraagN", { n: index + 1 })}</span>
                {vragen.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setVragen(vragen.filter((_, i) => i !== index))}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                    aria-label={t("maken.veld.verwijderVraag", { n: index + 1 })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <input
                type="text"
                value={vraag.vraag}
                onChange={(e) => wijzig(vragen, setVragen, index, "vraag", e.target.value)}
                placeholder={t("maken.veld.jeVraag")}
                required
                className="w-full p-2.5 text-sm rounded-lg bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
              />

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500">{t("maken.quiz.hoeAntwoorden")}</span>
                {(
                  [
                    ["keuze", t("maken.quiz.keuze")],
                    ["typ", t("maken.quiz.typ")],
                  ] as const
                ).map(([soort, label]) => (
                  <button
                    key={soort}
                    type="button"
                    aria-pressed={vraag.soort === soort}
                    onClick={() =>
                      setVragen((huidig) => huidig.map((v, i) => (i === index ? { ...v, soort } : v)))
                    }
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                      vraag.soort === soort
                        ? "bg-merk-800 text-white border-merk-800"
                        : "bg-white text-slate-700 border-slate-200 hover:border-merk"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <MediaKiezer
                waarde={vraag.media}
                // Functioneel bijwerken: een upload kan klaar zijn terwijl je al verder typt.
                onWijzig={(media) =>
                  setVragen((huidig) => huidig.map((v, i) => (i === index ? { ...v, media } : v)))
                }
                onBezig={(b) => setUploads((n) => Math.max(0, n + (b ? 1 : -1)))}
              />

              <input
                type="text"
                value={vraag.juist}
                onChange={(e) => wijzig(vragen, setVragen, index, "juist", e.target.value)}
                placeholder={t("maken.quiz.juist")}
                required
                className="w-full p-2.5 text-sm rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold focus:border-emerald-400 focus:outline-none"
              />

              {vraag.soort === "typ" ? (
                <div>
                  <textarea
                    value={vraag.andere}
                    onChange={(e) => wijzig(vragen, setVragen, index, "andere", e.target.value)}
                    placeholder={t("maken.quiz.andere")}
                    rows={2}
                    className="w-full p-2.5 text-sm rounded-lg bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {t("maken.quiz.andereUitleg")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={vraag.fout1}
                    onChange={(e) => wijzig(vragen, setVragen, index, "fout1", e.target.value)}
                    placeholder={t("maken.quiz.fout1")}
                    required
                    className="w-full p-2.5 text-sm rounded-lg bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={vraag.fout2}
                    onChange={(e) => wijzig(vragen, setVragen, index, "fout2", e.target.value)}
                    placeholder={t("maken.quiz.fout2")}
                    className="w-full p-2.5 text-sm rounded-lg bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
                  />
                </div>
              )}

              <input
                type="text"
                value={vraag.uitleg}
                onChange={(e) => wijzig(vragen, setVragen, index, "uitleg", e.target.value)}
                placeholder={t("maken.quiz.uitleg")}
                className="w-full p-2.5 text-sm rounded-lg bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={() => setVragen([...vragen, legeVraag()])}
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:border-merk hover:text-merk-900 font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t("maken.veld.nogEenVraag")}</span>
          </button>

          <FeedbackKiezer tweedeKans={tweedeKans} onWijzig={setTweedeKans} />

          <Bestemming
            zichtbaarheid={zichtbaarheid}
            setZichtbaarheid={setZichtbaarheid}
            mapId={mapId}
            setMapId={setMapId}
            mappen={eigenMappen(mappen, gebruiker)}
          />

          <Foutmelding tekst={fout} />

          <button
            type="submit"
            disabled={bezig || uploads > 0}
            className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-60 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>
              {bezig
                ? t("maken.knop.bezig")
                : uploads > 0
                  ? t("maken.knop.upload")
                  : t("maken.knop.quiz")}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {modus === "zinbouwen" && <ZinbouwenVorm {...vormProps} />}
      {modus === "volgorde" && <VolgordeVorm {...vormProps} />}
      {modus === "sorteren" && <SorterenVorm {...vormProps} />}
      {modus === "werkwoorden" && <WerkwoordenVorm {...vormProps} />}
      {modus === "rekenen" && <RekenenVorm {...vormProps} />}
      {modus === "lezen" && <LezenVorm {...vormProps} />}
      {modus === "openvraag" && <OpenVraagVorm {...vormProps} />}
      {modus === "escaperoom" && <EscaperoomVorm {...vormProps} />}
      {modus === "exitticket" && <ExitTicketVorm {...vormProps} />}

      {modus === "invul" && (
        <form
          onSubmit={maakInvuloefening}
          className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5"
        >
          <Veld label={t("maken.veld.onderwerp")} hint={t("maken.invul.onderwerpHint")}>
            <input
              type="text"
              value={invulTitel}
              onChange={(e) => setInvulTitel(e.target.value)}
              placeholder={t("maken.veld.titelOefening")}
              required
              className="w-full p-3 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
            />
          </Veld>

          <Veld
            label={t("maken.invul.label")}
            hint={t("maken.invul.labelHint")}
          >
            <textarea
              rows={7}
              value={invulZinnen}
              onChange={(e) => setInvulZinnen(e.target.value)}
              placeholder={t("maken.invul.voorbeeld")}
              required
              className="w-full p-3 font-mono text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
            />
          </Veld>

          <InleesKnop taal={spraakTaal} huidig={invulZinnen} onTekst={setInvulZinnen} zinPerRegel />

          <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3">
            {tr("maken.invul.uitleg", { code: (s) => <span className="font-mono">{s}</span> })}
          </p>

          <InvulVoorbeeld zinnen={invulZinnen} />

          <TaalKiezer waarde={spraakTaal} onWijzig={setSpraakTaal} wat="zinnen" />

          <Bestemming
            zichtbaarheid={zichtbaarheid}
            setZichtbaarheid={setZichtbaarheid}
            mapId={mapId}
            setMapId={setMapId}
            mappen={eigenMappen(mappen, gebruiker)}
          />

          <Foutmelding tekst={fout} />

          <button
            type="submit"
            disabled={bezig}
            className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-60 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>{bezig ? t("maken.knop.bezig") : t("maken.knop.invul")}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {modus === "wordcloud" && (
        <form
          onSubmit={maakWoordwolk}
          className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5"
        >
          <Veld
            label={t("maken.veld.jeVraag")}
            hint={t("maken.woordwolk.vraagHint")}
          >
            <input
              type="text"
              value={wolkVraag}
              onChange={(e) => setWolkVraag(e.target.value)}
              placeholder={t("maken.woordwolk.vraagVoorbeeld")}
              required
              className="w-full p-3 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
            />
          </Veld>

          <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3">
            {t("maken.woordwolk.uitleg")}
          </p>

          <Bestemming
            zichtbaarheid={zichtbaarheid}
            setZichtbaarheid={setZichtbaarheid}
            mapId={mapId}
            setMapId={setMapId}
            mappen={eigenMappen(mappen, gebruiker)}
          />

          <Foutmelding tekst={fout} />

          <button
            type="submit"
            disabled={bezig}
            className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-60 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>{bezig ? t("maken.knop.bezig") : t("maken.knop.woordwolk")}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

    </div>
  );
}

function wijzig(
  vragen: NieuweVraag[],
  setVragen: (v: NieuweVraag[]) => void,
  index: number,
  veld: keyof NieuweVraag,
  waarde: string
) {
  setVragen(vragen.map((v, i) => (i === index ? { ...v, [veld]: waarde } : v)));
}

/** Klein label boven de titel: waar zit je in de twee stappen? */
function Stap({ nummer }: { nummer: 1 | 2 }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600 mb-1">
      {nummer === 1 ? t("maken.stap1") : t("maken.stap2")}
    </p>
  );
}

/**
 * Taal van de voorleesknop. Staat los van de taal van de app: een leraar Frans maakt
 * Nederlandstalige schermen met Franse woorden erin.
 */
function TaalKiezer({
  waarde,
  onWijzig,
  wat,
}: {
  waarde: string;
  onWijzig: (taal: string) => void;
  wat: "inhoud" | "begrippen" | "zinnen";
}) {
  const hint = {
    inhoud: t("maken.taalKiezer.hint.inhoud"),
    begrippen: t("maken.taalKiezer.hint.begrippen"),
    zinnen: t("maken.taalKiezer.hint.zinnen"),
  }[wat];
  return (
    <Veld label={t("maken.taalKiezer.label")} hint={hint}>
      <select
        value={waarde}
        onChange={(e) => onWijzig(e.target.value)}
        className="w-full p-2.5 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
      >
        {TALEN.map((taal) => (
          <option key={taal.code} value={taal.code}>
            {taal.label}
          </option>
        ))}
      </select>
    </Veld>
  );
}

/**
 * Controlestap bij een begrippenlijst: wat las de app in, en wat viel weg? Wie uit Excel
 * plakt, ziet zo meteen of de kolommen goed uit elkaar gehaald zijn.
 */
function BegrippenVoorbeeld({ tekst }: { tekst: string }) {
  const { begrippen, overgeslagen } = leesBegrippen(tekst);
  if (begrippen.length === 0 && overgeslagen.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 p-4 space-y-2">
      <p className="text-sm font-bold text-slate-800">{t("maken.begrippenVoorbeeld.titel")}</p>

      {begrippen.length === 0 ? (
        <p className="text-xs text-amber-800">
          {t("maken.begrippenVoorbeeld.geen")}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {begrippen.slice(0, 4).map((begrip, index) => (
            <li key={index} className="flex items-baseline gap-3 py-1.5 text-sm">
              <span className="font-bold text-slate-900">{begrip.word}</span>
              <span className="text-slate-500">=</span>
              <span className="text-slate-700 min-w-0 truncate">{begrip.translation}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-500">
        {begrippen.length > 4
          ? t("maken.begrippenVoorbeeld.klaarEerste4", { n: begrippen.length })
          : tn("maken.begrippenVoorbeeld.klaar", begrippen.length)}
        {overgeslagen.length > 0 &&
          ` ${tn("maken.begrippenVoorbeeld.weg", overgeslagen.length)}`}
      </p>
    </div>
  );
}

/**
 * Toont wat de app van de zinnen begrijpt, voor de leraar op bewaren klikt. Een gat dat
 * je vergat aan te duiden, zie je zo meteen.
 */
function InvulVoorbeeld({ zinnen }: { zinnen: string }) {
  const regels = zinnen
    .split("\n")
    .map((zin) => zin.trim())
    .filter(Boolean);

  if (regels.length === 0) return null;

  const bruikbaar = regels.filter(heeftGat);
  const zonderGat = regels.length - bruikbaar.length;

  return (
    <div className="rounded-xl border border-slate-200 p-4 space-y-2">
      <p className="text-sm font-bold text-slate-800">
        {t("maken.invulVoorbeeld.titel")}
      </p>

      {bruikbaar.length === 0 ? (
        <p className="text-xs text-amber-800">
          {t("maken.invulVoorbeeld.geen")}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {bruikbaar.slice(0, 4).map((zin, index) => (
            <li key={index} className="text-sm text-slate-700 leading-relaxed">
              {ontleedInvulzin(zin).map((stuk, i) =>
                stuk.soort === "tekst" ? (
                  <span key={i}>{stuk.waarde}</span>
                ) : (
                  <span
                    key={i}
                    className="inline-block mx-1 px-3 py-0.5 rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 text-xs align-middle"
                  >
                    {stuk.antwoorden.length > 1
                      ? tn("maken.invulVoorbeeld.goedeAntwoorden", stuk.antwoorden.length)
                      : t("maken.invulVoorbeeld.inTeVullen")}
                  </span>
                )
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-500">
        {bruikbaar.length > 4
          ? t("maken.invulVoorbeeld.klaarEerste4", { n: bruikbaar.length })
          : tn("maken.invulVoorbeeld.klaar", bruikbaar.length)}
        {zonderGat > 0 && ` ${tn("maken.invulVoorbeeld.weg", zonderGat)}`}
      </p>
    </div>
  );
}

/** Zichtbaarheid en map kiezen: twee keuzes die de leraar bewust maakt, niet wij. */
function Bestemming({
  zichtbaarheid,
  setZichtbaarheid,
  mapId,
  setMapId,
  mappen,
}: {
  zichtbaarheid: Zichtbaarheid;
  setZichtbaarheid: (z: Zichtbaarheid) => void;
  mapId: string;
  setMapId: (id: string) => void;
  mappen: Lesmap[];
}) {
  return (
    <div className="rounded-xl bg-slate-100 border border-slate-200 p-4 space-y-3">
      <p className="text-sm font-bold text-slate-800">{t("maken.bestemming.titel")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(["prive", "organisatie"] as const).map((keuze) => {
          const meta = ZICHTBAARHEID[keuze];
          const Icon = meta.icon;
          const actief = zichtbaarheid === keuze;
          return (
            <button
              key={keuze}
              type="button"
              onClick={() => setZichtbaarheid(keuze)}
              aria-pressed={actief}
              className={`text-left p-3 rounded-xl border-2 transition-colors cursor-pointer ${
                actief
                  ? "bg-merk-50 border-merk-800"
                  : "bg-white border-slate-300 hover:border-merk-800"
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                <Icon className="w-4 h-4 text-slate-600" />
                {meta.label}
                {actief && <CheckCircle2 className="w-4 h-4 text-merk-800 ml-auto" />}
              </span>
              <span className="block text-xs text-slate-600 mt-1 leading-snug">{meta.uitleg}</span>
            </button>
          );
        })}
      </div>

      {mappen.length > 0 && (
        <label className="block">
          <span className="block text-sm font-bold text-slate-800 mb-1">
            {tr("maken.bestemming.map", {
              klein: (s) => <span className="font-normal text-slate-500">{s}</span>,
            })}
          </span>
          <select
            value={mapId}
            onChange={(e) => setMapId(e.target.value)}
            className="w-full p-2.5 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
          >
            <option value="">{t("maken.bestemming.geenMap")}</option>
            {mappen.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
