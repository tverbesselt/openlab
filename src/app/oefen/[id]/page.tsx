"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  CheckCircle2,
  Inbox,
  CalendarClock,
  BarChart3,
  Printer,
  Trophy,
} from "lucide-react";
import { opslag } from "@/lib/opslag";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Exercise, Inzending, Herhaling, Quizresultaat } from "@/lib/types";
import { WERKVORMEN, inhoudSamenvatting, isEigenMateriaal } from "@/lib/labels";
import { plan, sleutel, datumInWoorden, type Zelfoordeel } from "@/lib/herhalen";
import { FlashcardPlayer } from "@/components/players/FlashcardPlayer";
import { QuizPlayer } from "@/components/players/QuizPlayer";
import { WordTrainerPlayer } from "@/components/players/WordTrainerPlayer";
import { MatchingPlayer } from "@/components/players/MatchingPlayer";
import { FillBlankPlayer } from "@/components/players/FillBlankPlayer";
import { OrdenenPlayer } from "@/components/players/OrdenenPlayer";
import { SorteerPlayer } from "@/components/players/SorteerPlayer";
import { OpenVraagPlayer } from "@/components/players/OpenVraagPlayer";
import { LeesPlayer } from "@/components/players/LeesPlayer";
import { WerkwoordPlayer } from "@/components/players/WerkwoordPlayer";
import { RekenPlayer } from "@/components/players/RekenPlayer";
import { EscaperoomPlayer } from "@/components/players/EscaperoomPlayer";
import { ShareModal } from "@/components/ShareModal";
import { Studietip } from "@/components/Studietip";
import { useInstellingen } from "@/lib/instellingen/AppProvider";
import { Uitgeschakeld } from "@/components/Uitgeschakeld";
import { t, tn } from "@/lib/i18n";
import { tr } from "@/lib/i18n/rijk";

/** Eén zin per werkvorm, onder de speler: waarom je het zo doet. */
const TIP_WERKVORMEN = ["matching", "quiz", "werkwoorden", "rekenen", "lezen", "escaperoom", "fillblank"] as const;

function tipPerWerkvorm(type: Exercise["type"]): string | undefined {
  const w = TIP_WERKVORMEN.find((x) => x === type);
  return w ? t(`oefenen.tip.${w}`) : undefined;
}

export default function OefenPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { gebruiker, isLeraar } = useAuth();
  const { isAan } = useInstellingen();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [toestand, setToestand] = useState<"laden" | "klaar" | "niet-gevonden" | "fout">("laden");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [volgendeKeer, setVolgendeKeer] = useState<string | null>(null);

  useEffect(() => {
    let actief = true;
    opslag
      .oefening(id)
      .then((gevonden) => {
        if (!actief) return;
        setExercise(gevonden);
        setToestand(gevonden ? "klaar" : "niet-gevonden");
      })
      .catch(() => actief && setToestand("fout"));
    return () => {
      actief = false;
    };
  }, [id]);

  /*
   * De herhaalplanning van deze persoon, één keer opgehaald. Elk zelfoordeel werkt ze
   * hier bij, zodat de kaart op het juiste moment terugkomt (gespreid herhalen).
   */
  const planning = useRef<Map<string, Herhaling>>(new Map());
  const gebruikerId = gebruiker?.id;

  useEffect(() => {
    if (!gebruikerId) return;
    let actief = true;
    opslag
      .herhalingen(gebruikerId)
      .then((lijst) => {
        if (actief) planning.current = new Map(lijst.map((h) => [h.id, h]));
      })
      .catch(() => {
        // Zonder planning oefent de cursist gewoon verder; alleen het spreiden valt weg.
      });
    return () => {
      actief = false;
    };
  }, [gebruikerId]);

  const onthoud = useCallback(
    (kaartId: string, oordeel: Zelfoordeel) => {
      if (!gebruikerId) return;
      const nieuw = plan(id, kaartId, oordeel, planning.current.get(sleutel(id, kaartId)));
      planning.current.set(nieuw.id, nieuw);
      setVolgendeKeer(nieuw.volgende);
      opslag.bewaarHerhaling(gebruikerId, nieuw).catch(() => {});
    },
    [gebruikerId, id]
  );

  const meldQuizresultaat = useCallback(
    (foutVragen: string[], aantalVragen: number) => {
      opslag.stuurQuizresultaat(id, foutVragen, aantalVragen).catch(() => {});
    },
    [id]
  );

  if (toestand === "laden") {
    return <div className="h-64" aria-hidden />;
  }

  if (!exercise) {
    return (
      <div className="max-w-sm mx-auto text-center py-20 u-fade">
        <h1 className="text-xl font-extrabold text-merk-900 mb-2">
          {toestand === "fout" ? t("oefenen.pagina.geenVerbinding") : t("oefenen.pagina.bestaatNiet")}
        </h1>
        <p className="text-sm text-slate-600 mb-5">
          {toestand === "fout"
            ? t("oefenen.pagina.geenVerbindingUitleg")
            : t("oefenen.pagina.bestaatNietUitleg")}
        </p>
        <Link
          href="/"
          className="inline-flex px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
        >
          {t("oefenen.pagina.naarStart")}
        </Link>
      </div>
    );
  }

  if (!isAan(exercise.type)) return <Uitgeschakeld />;

  const isEigenaar = isLeraar && isEigenMateriaal(exercise, gebruiker);
  const metKaarten = exercise.type === "flashcard" || exercise.type === "wordtrainer";

  return (
    <div className="space-y-6 u-fade">

      {/* Kopbalk */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-merk-900 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("algemeen.terug")}</span>
        </button>

        <div className="text-center min-w-0">
          <p className="text-xs font-semibold text-slate-500">
            {WERKVORMEN[exercise.type].label} · {inhoudSamenvatting(exercise)}
          </p>
          <h1 className="font-extrabold text-lg sm:text-xl text-merk-900 leading-tight line-clamp-1">
            {exercise.title}
          </h1>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isLeraar && exercise.type === "quiz" && isAan("wedstrijd") && (
            <Link
              href={`/live?wedstrijd=${exercise.id}`}
              className="p-2 rounded-xl text-slate-500 hover:text-merk-900 hover:bg-slate-100 transition-colors"
              title={t("oefenen.pagina.speelAlsWedstrijd")}
              aria-label={t("oefenen.pagina.speelAlsWedstrijd")}
            >
              <Trophy className="w-4 h-4" />
            </Link>
          )}
          {isAan("afdrukken") && (
          <Link
            href={`/afdrukken/${exercise.id}`}
            className="p-2 rounded-xl text-slate-500 hover:text-merk-900 hover:bg-slate-100 transition-colors"
            title={t("oefenen.pagina.afdrukken")}
            aria-label={t("oefenen.pagina.afdrukken")}
          >
            <Printer className="w-4 h-4" />
          </Link>
          )}
          <button
            onClick={() => setIsShareOpen(true)}
            className="p-2 rounded-xl bg-merk-50 text-merk-900 hover:bg-merk/20 transition-colors"
            title={t("oefenen.pagina.delen")}
            aria-label={t("oefenen.pagina.delen")}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* De juiste speler voor deze werkvorm */}
      <div className="py-4">
        {exercise.type === "flashcard" && exercise.content.flashcards && (
          <FlashcardPlayer
            cards={exercise.content.flashcards}
            didacticConfig={exercise.didacticConfig}
            onBeoordeeld={onthoud}
          />
        )}

        {exercise.type === "quiz" && exercise.content.questions && (
          <QuizPlayer
            questions={exercise.content.questions}
            didacticConfig={exercise.didacticConfig}
            onKlaar={meldQuizresultaat}
          />
        )}

        {exercise.type === "wordtrainer" && exercise.content.wordTrainerItems && (
          <WordTrainerPlayer
            items={exercise.content.wordTrainerItems}
            title={exercise.title}
            didacticConfig={exercise.didacticConfig}
            onBeoordeeld={onthoud}
          />
        )}

        {exercise.type === "fillblank" && exercise.content.fillBlanks && (
          <FillBlankPlayer
            items={exercise.content.fillBlanks}
            didacticConfig={exercise.didacticConfig}
          />
        )}

        {exercise.type === "matching" && exercise.content.matchingPairs && (
          <MatchingPlayer pairs={exercise.content.matchingPairs} />
        )}

        {(exercise.type === "zinbouwen" || exercise.type === "volgorde") &&
          exercise.content.ordenItems && (
            <OrdenenPlayer
              items={exercise.content.ordenItems}
              didacticConfig={exercise.didacticConfig}
              weergave={exercise.type === "zinbouwen" ? "zin" : "stappen"}
            />
          )}

        {exercise.type === "sorteren" &&
          exercise.content.sorteerItems &&
          exercise.content.categorieen && (
            <SorteerPlayer
              categorieen={exercise.content.categorieen}
              items={exercise.content.sorteerItems}
            />
          )}

        {exercise.type === "openvraag" && exercise.content.openVragen && (
          <OpenVraagPlayer vragen={exercise.content.openVragen} />
        )}

        {exercise.type === "lezen" && exercise.content.leestekst && exercise.content.questions && (
          <LeesPlayer
            tekst={exercise.content.leestekst}
            vragen={exercise.content.questions}
            didacticConfig={exercise.didacticConfig}
            onKlaar={meldQuizresultaat}
          />
        )}

        {exercise.type === "werkwoorden" && exercise.content.werkwoorden && (
          <WerkwoordPlayer
            items={exercise.content.werkwoorden}
            didacticConfig={exercise.didacticConfig}
          />
        )}

        {exercise.type === "rekenen" && exercise.content.rekenopdracht && (
          <RekenPlayer opdracht={exercise.content.rekenopdracht} />
        )}

        {exercise.type === "escaperoom" && exercise.content.escaperoom && (
          <EscaperoomPlayer escaperoom={exercise.content.escaperoom} />
        )}

        {exercise.type === "exitticket" && exercise.content.exitTicketPrompts && (
          <ExitTicket oefeningId={exercise.id} vragen={exercise.content.exitTicketPrompts} />
        )}

        {(exercise.type === "poll" || exercise.type === "wordcloud") && (
          <div className="max-w-lg mx-auto bg-white rounded-2xl p-6 border border-slate-200 text-center u-pop">
            <p className="text-sm text-slate-600 mb-4">
              {t("oefenen.pagina.klassikaal")}
            </p>
            {isLeraar && (
              <Link
                href={`/live?oefening=${exercise.id}`}
                className="inline-flex px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
              >
                {t("algemeen.menu.startInDeKlas")}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Gespreid herhalen: alleen zinvol als er iets aan je account hangt */}
      {metKaarten && gebruikerId && (
        <p className="max-w-lg mx-auto text-xs text-slate-500 flex items-start gap-2">
          <CalendarClock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            {volgendeKeer
              ? t("oefenen.pagina.herhaalGepland", { wanneer: datumInWoorden(volgendeKeer) })
              : t("oefenen.pagina.herhaalUitleg")}
          </span>
        </p>
      )}

      {!isEigenaar && tipPerWerkvorm(exercise.type) && (
        <Studietip tekst={tipPerWerkvorm(exercise.type)} className="max-w-lg mx-auto" />
      )}

      {isEigenaar && exercise.type === "exitticket" && (
        <InzendingenVanLeraar oefeningId={exercise.id} vragen={exercise.content.exitTicketPrompts ?? []} />
      )}

      {isEigenaar && (exercise.type === "quiz" || exercise.type === "lezen") && (
        <QuizOverzicht oefening={exercise} />
      )}

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={exercise.title}
        shareCode={exercise.shareCode}
        id={exercise.id}
      />

    </div>
  );
}

/* ── Exit ticket: de cursist vult in, de leraar ontvangt ─────────────────── */

function ExitTicket({ oefeningId, vragen }: { oefeningId: string; vragen: string[] }) {
  const [antwoorden, setAntwoorden] = useState<string[]>(() => vragen.map(() => ""));
  const [toestand, setToestand] = useState<"invullen" | "bezig" | "verstuurd" | "fout">("invullen");

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    setToestand("bezig");
    try {
      await opslag.stuurInzending(
        oefeningId,
        antwoorden.map((a) => a.trim().slice(0, 1000))
      );
      setToestand("verstuurd");
    } catch {
      setToestand("fout");
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-2xl p-6 border border-slate-200 u-pop">
      <h2 className="text-lg font-extrabold text-merk-900 mb-1">{t("oefenen.exitticket.titel")}</h2>
      <p className="text-sm text-slate-600 mb-5">
        {t("oefenen.exitticket.uitleg")}
      </p>

      {toestand === "verstuurd" ? (
        <div className="text-center py-6">
          <CheckCircle2 className="w-10 h-10 text-merk mx-auto mb-2" />
          <p className="font-bold text-base text-merk-900">{t("oefenen.exitticket.bedankt")}</p>
          <p className="text-sm text-slate-600">{t("oefenen.exitticket.ontvangen")}</p>
        </div>
      ) : (
        <form onSubmit={verstuur} className="space-y-4">
          {vragen.map((p, idx) => (
            <label key={idx} className="block">
              <span className="block text-sm font-bold text-slate-800 mb-1.5">
                {idx + 1}. {p}
              </span>
              <textarea
                rows={2}
                required
                maxLength={1000}
                value={antwoorden[idx]}
                onChange={(e) =>
                  setAntwoorden(antwoorden.map((a, i) => (i === idx ? e.target.value : a)))
                }
                placeholder={t("oefenen.exitticket.placeholder")}
                className="w-full p-3 text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-merk focus:outline-none"
              />
            </label>
          ))}

          {toestand === "fout" && (
            <p role="alert" className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              {t("oefenen.exitticket.fout")}
            </p>
          )}

          <button
            type="submit"
            disabled={toestand === "bezig"}
            className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-60 text-white font-bold text-sm transition-colors"
          >
            {toestand === "bezig" ? t("oefenen.exitticket.bezig") : t("oefenen.exitticket.versturen")}
          </button>
        </form>
      )}
    </div>
  );
}

/** Wat cursisten instuurden, alleen zichtbaar voor de leraar die het exit ticket maakte. */
function InzendingenVanLeraar({ oefeningId, vragen }: { oefeningId: string; vragen: string[] }) {
  const [inzendingen, setInzendingen] = useState<Inzending[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    opslag
      .inzendingen(oefeningId)
      .then(setInzendingen)
      .catch(() => setInzendingen([]));
  }, [oefeningId]);

  if (inzendingen === null) return null;

  return (
    <section className="max-w-lg mx-auto border-t border-slate-200 pt-6">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 text-left"
      >
        <Inbox className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-bold text-slate-900 flex-1">
          {inzendingen.length === 0
            ? t("oefenen.inzendingen.geen")
            : tn("oefenen.inzendingen.aantal", inzendingen.length)}
        </span>
        <span className="text-xs font-bold text-merk-900">
          {inzendingen.length > 0 && (open ? t("oefenen.inzendingen.verberg") : t("oefenen.inzendingen.bekijk"))}
        </span>
      </button>
      <p className="text-xs text-slate-500 mt-1 ml-6">{t("oefenen.inzendingen.alleenJij")}</p>

      {open && inzendingen.length > 0 && (
        <div className="mt-4 space-y-6">
          {vragen.map((vraag, idx) => (
            <div key={idx}>
              <h3 className="text-sm font-bold text-slate-800 mb-2">
                {idx + 1}. {vraag}
              </h3>
              <ul className="space-y-1.5">
                {inzendingen.map((inz) => (
                  <li
                    key={inz.id}
                    className="text-sm text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2"
                  >
                    {inz.antwoorden[idx] || <span className="text-slate-400">{t("oefenen.inzendingen.leeg")}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Voor de leraar: welke vraag ging het vaakst fout. Geaggregeerd over alle cursisten, dus
 * je ziet waar de klas struikelt zonder te weten wie wat deed.
 */
function QuizOverzicht({ oefening }: { oefening: Exercise }) {
  const [resultaten, setResultaten] = useState<Quizresultaat[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    opslag
      .quizresultaten(oefening.id)
      .then(setResultaten)
      .catch(() => setResultaten([]));
  }, [oefening.id]);

  if (resultaten === null) return null;

  const vragen = oefening.content.questions ?? [];
  const totaal = resultaten.length;

  // Per vraag: hoe vaak ging ze fout, over alle ingestuurde rondes heen.
  const perVraag = vragen
    .map((vraag) => ({
      vraag,
      fout: resultaten.filter((r) => r.foutVragen.includes(vraag.id)).length,
    }))
    .sort((a, b) => b.fout - a.fout);

  const moeilijkste = perVraag[0];

  return (
    <section className="max-w-lg mx-auto border-t border-slate-200 pt-6">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 text-left"
      >
        <BarChart3 className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-bold text-slate-900 flex-1">
          {totaal === 0
            ? t("oefenen.quizoverzicht.niemand")
            : tn("oefenen.quizoverzicht.gemaakt", totaal)}
        </span>
        <span className="text-xs font-bold text-merk-900">
          {totaal > 0 && (open ? t("oefenen.inzendingen.verberg") : t("oefenen.inzendingen.bekijk"))}
        </span>
      </button>

      <p className="text-xs text-slate-500 mt-1 ml-6">
        {totaal === 0
          ? t("oefenen.quizoverzicht.zodra")
          : moeilijkste && moeilijkste.fout > 0
            ? t("oefenen.quizoverzicht.struikelvraag", { vraag: moeilijkste.vraag.question })
            : t("oefenen.quizoverzicht.allesJuist")}
      </p>

      {moeilijkste && moeilijkste.fout > 0 && (
        <Studietip
          voor="leraar"
          className="mt-3"
          tekst={tr(
            "oefenen.quizoverzicht.tip",
            {
              link: (s) => (
                <Link href="/opfrissen" className="font-bold hover:underline">
                  {s}
                </Link>
              ),
            },
            { opfrissen: t("werkvormen.leshulp.opfrissen.label") }
          )}
        />
      )}

      {open && totaal > 0 && (
        <ul className="mt-4 space-y-3">
          {perVraag.map(({ vraag, fout }) => {
            const pct = Math.round((fout / totaal) * 100);
            return (
              <li key={vraag.id}>
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="text-sm text-slate-800 min-w-0">{vraag.question}</span>
                  <span className="text-xs font-bold text-slate-500 tabular-nums shrink-0">
                    {t("oefenen.quizoverzicht.foutVan", { fout, totaal })}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pct >= 50 ? "bg-rose-400" : pct > 0 ? "bg-amber-400" : "bg-emerald-400"}`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
