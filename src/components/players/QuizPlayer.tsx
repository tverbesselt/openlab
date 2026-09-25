"use client";

import React, { useMemo, useRef, useState } from "react";
import { QuizQuestion, DidacticConfig } from "@/lib/types";
import { CheckCircle2, XCircle, ArrowRight, RefreshCw, RotateCcw } from "lucide-react";
import { Voortgang } from "./FlashcardPlayer";
import { VraagMedia } from "./VraagMedia";
import { hussel } from "@/lib/hussel";
import { MAX_TYPANTWOORD, isTypAntwoordJuist, toonAntwoord } from "@/lib/typantwoord";
import { t, tn } from "@/lib/i18n";
import { tr } from "@/lib/i18n/rijk";

interface QuizPlayerProps {
  questions: QuizQuestion[];
  didacticConfig?: DidacticConfig;
  onComplete?: (scorePct: number) => void;
  /**
   * Welke vragen fout gingen, na de eerste volledige ronde. Alleen dat: geen naam, geen
   * score per persoon. De leraar ziet er straks mee waar de klas struikelt. Met een tweede
   * poging telt een vraag als fout zodra de eerste poging mis was.
   */
  onKlaar?: (foutVragen: string[], aantalVragen: number) => void;
}

/**
 * Een tweede poging heeft alleen zin als er na een fout nog iets te kiezen valt. Bij waar
 * of niet waar, of bij twee antwoorden, ligt het juiste antwoord dan al vast.
 */
function kanTweedePoging(q: QuizQuestion) {
  return q.type === "typ" || q.type === "multiple_response" || q.options.length > 2;
}

export function QuizPlayer({ questions, didacticConfig, onComplete, onKlaar }: QuizPlayerProps) {
  const tweedeKans = didacticConfig?.tweedeKans ?? false;
  const [queue, setQueue] = useState<QuizQuestion[]>(questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [getypt, setGetypt] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  /** De eerste poging was mis; de cursist is nu aan de tweede. */
  const [tweedePoging, setTweedePoging] = useState(false);
  /** Bij één antwoord kiezen: de eerste keuze, zodat die niet nog eens gekozen wordt. */
  const [eersteKeuze, setEersteKeuze] = useState<number[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [pasBijTweede, setPasBijTweede] = useState(0);
  // Niet meteen juist: fout bij de eerste (of enige) poging.
  const [foutIds, setFoutIds] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  // Alleen de eerste volledige ronde telt mee. Wie daarna enkel de foute vragen herdoet,
  // zou het beeld anders scheeftrekken.
  const gemeld = useRef(false);

  const currentQ = queue[currentIndex];

  // De maker typt het juiste antwoord altijd eerst. Zonder husselen stond het dus altijd
  // bovenaan. Per ronde één vaste volgorde; waar/onwaar blijft in zijn gewone volgorde.
  const volgorde = useMemo(
    () =>
      new Map(
        queue.map((q) => {
          const idx = q.options.map((_, i) => i);
          return [q.id, q.type === "true_false" ? idx : hussel(idx)];
        })
      ),
    [queue]
  );

  const kiesOptie = (index: number) => {
    if (isAnswered || eersteKeuze.includes(index)) return;

    if (currentQ.type === "multiple_response") {
      setSelectedOptions(
        selectedOptions.includes(index)
          ? selectedOptions.filter((i) => i !== index)
          : [...selectedOptions, index]
      );
    } else {
      setSelectedOptions([index]);
    }
  };

  const isTyp = currentQ?.type === "typ";

  const isJuist = () =>
    isTyp
      ? isTypAntwoordJuist(getypt, currentQ.antwoorden)
      : selectedOptions.length === currentQ.correctAnswers.length &&
        selectedOptions.every((val) => currentQ.correctAnswers.includes(val));

  const controleer = () => {
    if (isAnswered) return;
    if (isTyp ? !getypt.trim() : selectedOptions.length === 0) return;

    const juist = isJuist();

    // Vertraagde feedback: zeg alleen dat het nog niet juist is en laat opnieuw proberen.
    // Het juiste antwoord en de uitleg komen pas na de tweede poging.
    if (!juist && tweedeKans && !tweedePoging && kanTweedePoging(currentQ)) {
      setTweedePoging(true);
      setFoutIds((prev) => [...prev, currentQ.id]);
      if (currentQ.type !== "multiple_response" && !isTyp) {
        setEersteKeuze(selectedOptions);
        setSelectedOptions([]);
      }
      return;
    }

    setIsAnswered(true);
    if (juist) {
      setCorrectCount((prev) => prev + 1);
      if (tweedePoging) setPasBijTweede((prev) => prev + 1);
    } else if (!tweedePoging) {
      setFoutIds((prev) => [...prev, currentQ.id]);
    }
  };

  const volgende = () => {
    setSelectedOptions([]);
    setGetypt("");
    setIsAnswered(false);
    setTweedePoging(false);
    setEersteKeuze([]);

    if (currentIndex + 1 < queue.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      onComplete?.(Math.round((correctCount / queue.length) * 100));
      if (!gemeld.current) {
        gemeld.current = true;
        onKlaar?.(foutIds, queue.length);
      }
    }
  };

  const herstel = (nieuweQueue: QuizQuestion[]) => {
    setQueue(nieuweQueue);
    setCurrentIndex(0);
    setSelectedOptions([]);
    setGetypt("");
    setIsAnswered(false);
    setTweedePoging(false);
    setEersteKeuze([]);
    setCorrectCount(0);
    setPasBijTweede(0);
    setFoutIds([]);
    setIsCompleted(false);
  };

  if (isCompleted) {
    const score = Math.round((correctCount / queue.length) * 100);
    const foute = questions.filter((q) => foutIds.includes(q.id));

    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 text-center max-w-lg mx-auto u-pop">
        <CheckCircle2 className="w-10 h-10 text-merk mx-auto mb-3" />
        <h3 className="text-xl font-extrabold text-merk-900 mb-1">{t("spelers.gemeen.rond")}</h3>
        <p className="text-sm text-slate-600 mb-6">{t("spelers.quiz.telNiet")}</p>

        <div className="p-6 rounded-xl bg-slate-50 mb-6">
          <span className="text-4xl font-extrabold text-merk-900 block mb-1">{score}%</span>
          <span className="text-sm text-slate-600">
            {tn("spelers.quiz.juistAantal", queue.length, { juist: correctCount })}
          </span>
          {pasBijTweede > 0 && (
            <span className="text-sm text-slate-600 block mt-1">
              {pasBijTweede < correctCount
                ? t("spelers.quiz.waarvanTweede", { n: pasBijTweede })
                : correctCount === 1
                  ? t("spelers.quiz.bijTweede")
                  : t("spelers.quiz.allemaalTweede")}
            </span>
          )}
        </div>

        {foute.length > 0 && (
          <button
            onClick={() => herstel(foute)}
            className="w-full py-3 mb-3 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>
              {tweedeKans
                ? tn("spelers.quiz.oefenNietMeteen", foute.length)
                : tn("spelers.quiz.enkelFoute", foute.length)}
            </span>
          </button>
        )}

        <button
          onClick={() => herstel(questions)}
          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
        >
          {t("spelers.gemeen.alleVragenOpnieuw")}
        </button>
      </div>
    );
  }

  if (!currentQ) return null;

  const voortgang = Math.round(((currentIndex + 1) / queue.length) * 100);
  const juist = isAnswered && isJuist();

  return (
    <div className="max-w-xl mx-auto">
      <Voortgang label={t("spelers.gemeen.vraagVan", { nr: currentIndex + 1, n: queue.length })} percentage={voortgang} />

      <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-5">
        <span className="text-xs font-bold text-slate-500 block mb-2">
          {isTyp
            ? t("spelers.gemeen.typAntwoord")
            : currentQ.type === "multiple_response"
              ? t("spelers.quiz.meerdere")
              : t("spelers.quiz.kiesEen")}
        </span>

        {currentQ.media && (
          <div className="mb-4">
            <VraagMedia media={currentQ.media} />
          </div>
        )}

        <h2 className="text-lg font-extrabold text-merk-900 leading-snug mb-5">
          {currentQ.question}
        </h2>

        {isTyp ? (
          <div className="space-y-2">
            <input
              type="text"
              value={getypt}
              onChange={(e) => setGetypt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isAnswered) {
                  e.preventDefault();
                  controleer();
                }
              }}
              maxLength={MAX_TYPANTWOORD}
              placeholder={t("spelers.gemeen.typAntwoord")}
              aria-label={t("spelers.quiz.jeAntwoord")}
              autoComplete="off"
              autoCapitalize="none"
              disabled={isAnswered}
              className={`w-full px-4 py-3.5 text-base font-bold rounded-xl border text-slate-900 focus:outline-none ${
                isAnswered
                  ? juist
                    ? "bg-emerald-50 border-emerald-400"
                    : "bg-rose-50 border-rose-400"
                  : "bg-white border-veldrand focus:border-merk-800 focus:ring-2 focus:ring-merk/40"
              }`}
            />
            {!isAnswered && (
              <p className="text-xs text-slate-500">
                {t("spelers.quiz.hoofdletters")}
              </p>
            )}
            {isAnswered && !juist && (
              <p className="text-sm text-slate-800">
                {tr(
                  "spelers.quiz.juisteAntwoord",
                  { b: (s) => <strong>{s}</strong> },
                  { antwoord: toonAntwoord(currentQ.antwoorden) }
                )}
              </p>
            )}
          </div>
        ) : (
        <div className="space-y-2.5">
          {(volgorde.get(currentQ.id) ?? currentQ.options.map((_, i) => i)).map((idx) => {
            const optie = currentQ.options[idx];
            const gekozen = selectedOptions.includes(idx);
            const isJuisteOptie = currentQ.correctAnswers.includes(idx);
            const alGeprobeerd = eersteKeuze.includes(idx);

            let stijl = "bg-slate-50 border-slate-200 text-slate-800 hover:border-merk";
            if (alGeprobeerd && !isAnswered) {
              stijl = "bg-slate-50 border-slate-200 text-slate-400 line-through";
            } else if (gekozen && !isAnswered) {
              stijl = "bg-merk-50 border-merk text-merk-900 font-bold";
            } else if (isAnswered) {
              if (isJuisteOptie) stijl = "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold";
              else if (gekozen) stijl = "bg-rose-50 border-rose-400 text-rose-900";
              else stijl = "bg-slate-50 border-slate-200 text-slate-400";
            }

            return (
              <button
                key={idx}
                disabled={isAnswered || alGeprobeerd}
                onClick={() => kiesOptie(idx)}
                className={`w-full p-4 rounded-xl border text-left text-sm transition-colors flex items-center justify-between gap-3 ${stijl}`}
              >
                <span>{optie}</span>
                {isAnswered && isJuisteOptie && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                {isAnswered && gekozen && !isJuisteOptie && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
        )}
      </div>

      {/* Na een eerste foute poging: geen antwoord, wel een nieuwe kans */}
      {tweedePoging && !isAnswered && (
        <div
          role="status"
          className="p-5 rounded-2xl mb-5 u-rise bg-amber-50 text-amber-900 border border-amber-200"
        >
          <div className="flex items-center gap-2 font-bold text-sm mb-1">
            <RotateCcw className="w-5 h-5 text-amber-700" />
            <span>{t("spelers.quiz.probeerNog")}</span>
          </div>
          <p className="text-sm leading-relaxed">
            {isTyp
              ? t("spelers.quiz.tipTyp")
              : currentQ.type === "multiple_response"
                ? t("spelers.quiz.tipMeerdere")
                : t("spelers.quiz.tipKies")}{" "}
            {t("spelers.quiz.daarnaAntwoord")}
          </p>
        </div>
      )}

      {/* Feedback met uitleg: meteen, of na de tweede poging */}
      {isAnswered && (
        <div
          className={`p-5 rounded-2xl mb-5 u-rise ${
            juist ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm mb-2">
            {juist ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>
              {juist
                ? tweedePoging
                  ? t("spelers.quiz.juistTweede")
                  : t("spelers.quiz.juist")
                : tweedePoging
                  ? t("spelers.quiz.ookNuNiet")
                  : t("spelers.gemeen.nogNietJuist")}
            </span>
          </div>
          <p className="text-sm leading-relaxed">{currentQ.explanation}</p>
        </div>
      )}

      {!isAnswered ? (
        <button
          disabled={isTyp ? !getypt.trim() : selectedOptions.length === 0}
          onClick={controleer}
          className="w-full py-3.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm transition-colors"
        >
          {tweedePoging ? t("spelers.quiz.controleerOpnieuw") : t("spelers.gemeen.controleer")}
        </button>
      ) : (
        <button
          onClick={volgende}
          className="w-full py-3.5 rounded-xl bg-merk-900 hover:bg-merk-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 u-rise"
        >
          <span>{currentIndex + 1 < queue.length ? t("spelers.quiz.volgendeVraag") : t("spelers.gemeen.resultaat")}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
