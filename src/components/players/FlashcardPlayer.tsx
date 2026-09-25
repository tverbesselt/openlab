"use client";

import React, { useState } from "react";
import { FlashcardItem, DidacticConfig } from "@/lib/types";
import { spraakBeschikbaar, spreekUit, STANDAARD_TAAL } from "@/lib/spraak";
import type { Zelfoordeel } from "@/lib/herhalen";
import { t, tn } from "@/lib/i18n";
import {
  RotateCw,
  Volume2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  ArrowRight,
  ArrowLeftRight,
} from "lucide-react";

interface FlashcardPlayerProps {
  cards: FlashcardItem[];
  didacticConfig?: DidacticConfig;
  onComplete?: (masteredCount: number) => void;
  /**
   * Wordt geroepen bij elk zelfoordeel. Daarmee plant de oefenpagina wanneer deze kaart
   * weer aan de beurt is, zodat de cursist thuis gespreid kan herhalen.
   */
  onBeoordeeld?: (kaartId: string, oordeel: Zelfoordeel) => void;
  /**
   * Wat er staat als de ronde rond is. De oefenpagina zegt "stop gerust, morgen weet je
   * meer", de herhaalpagina "wat je niet wist komt morgen terug".
   */
  naRonde?: string;
}

const ALS_ZELFOORDEEL: Record<"mastered" | "review" | "failed", Zelfoordeel> = {
  mastered: "wist",
  review: "twijfel",
  failed: "niet",
};

export function FlashcardPlayer({
  cards,
  didacticConfig,
  onComplete,
  onBeoordeeld,
  naRonde = t("spelers.flashcard.naRonde"),
}: FlashcardPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Drie stapels volgens het Leitner-principe: gewist, twijfel, niet geweten.
  const [masteredIds, setMasteredIds] = useState<string[]>([]);
  const [reviewIds, setReviewIds] = useState<string[]>([]);
  const [failedIds, setFailedIds] = useState<string[]>([]);
  const [activeQueue, setActiveQueue] = useState<FlashcardItem[]>(cards);
  const [isCompleted, setIsCompleted] = useState(false);

  /*
    Andersom: de betekenis vooraan, het woord als antwoord. Wie een woord in twee richtingen
    kent, kent het echt (Studeren met succes, studeerkaart 1). De herhaalplanning blijft per
    kaart, in welke richting je ook oefent.
  */
  const [andersom, setAndersom] = useState(false);

  const currentCard = activeQueue[currentIndex];

  /*
    De voorkant is het woord dat de cursist leert, de achterkant de Nederlandse betekenis.
    Daarom klinkt de voorkant in de taal van de oefening en de achterkant altijd Nederlands:
    anders leest een Nederlandse stem het Franse woord voor.
  */
  const taal = didacticConfig?.spraakTaal ?? STANDAARD_TAAL;
  const speel = (tekst: string, achterkant: boolean) => {
    spreekUit(tekst, achterkant ? STANDAARD_TAAL : taal);
  };

  /** Welke kant van de kaart nu zichtbaar is, rekening houdend met de richting. */
  const toontAchterkant = isFlipped !== andersom;

  const beoordeel = (oordeel: "mastered" | "review" | "failed") => {
    if (!currentCard) return;

    onBeoordeeld?.(currentCard.id, ALS_ZELFOORDEEL[oordeel]);

    if (oordeel === "mastered") setMasteredIds((prev) => [...prev, currentCard.id]);
    else if (oordeel === "review") setReviewIds((prev) => [...prev, currentCard.id]);
    else setFailedIds((prev) => [...prev, currentCard.id]);

    setIsFlipped(false);

    if (currentIndex + 1 < activeQueue.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      onComplete?.(masteredIds.length + (oordeel === "mastered" ? 1 : 0));
    }
  };

  const herhaalMoeilijke = () => {
    const moeilijk = cards.filter((c) => failedIds.includes(c.id) || reviewIds.includes(c.id));
    if (moeilijk.length === 0) return;
    setActiveQueue(moeilijk);
    setCurrentIndex(0);
    setFailedIds([]);
    setReviewIds([]);
    setIsCompleted(false);
    setIsFlipped(false);
  };

  const draaiRichting = () => {
    setAndersom((vorige) => !vorige);
    setIsFlipped(false);
  };

  const oefenAndersom = () => {
    setAndersom(true);
    beginOpnieuw();
  };

  const beginOpnieuw = () => {
    setActiveQueue(cards);
    setCurrentIndex(0);
    setMasteredIds([]);
    setReviewIds([]);
    setFailedIds([]);
    setIsCompleted(false);
    setIsFlipped(false);
  };

  if (isCompleted) {
    const teHerhalen = failedIds.length + reviewIds.length;

    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 text-center max-w-lg mx-auto u-pop">
        <CheckCircle2 className="w-10 h-10 text-merk mx-auto mb-3" />
        <h3 className="text-xl font-extrabold text-merk-900 mb-1">{t("spelers.gemeen.rond")}</h3>
        <p className="text-sm text-slate-600 mb-6">
          {tn("spelers.flashcard.doorgenomen", cards.length)} {naRonde}
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Stapel
            aantal={masteredIds.length}
            label={t("spelers.flashcard.wistIk")}
            kleur="bg-emerald-50 text-emerald-800"
          />
          <Stapel aantal={reviewIds.length} label={t("spelers.flashcard.twijfel")} kleur="bg-amber-50 text-amber-800" />
          <Stapel
            aantal={failedIds.length}
            label={t("spelers.flashcard.nietGeweten")}
            kleur="bg-rose-50 text-rose-800"
          />
        </div>

        {teHerhalen > 0 && (
          <button
            onClick={herhaalMoeilijke}
            className="w-full py-3 mb-3 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{tn("spelers.flashcard.herhaalMoeilijk", teHerhalen)}</span>
          </button>
        )}

        {!andersom && (
          <button
            onClick={oefenAndersom}
            className="w-full py-2.5 mb-3 rounded-xl bg-merk-50 hover:bg-merk/20 text-merk-900 font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>{t("spelers.flashcard.andersomZelfde")}</span>
          </button>
        )}

        <button
          onClick={beginOpnieuw}
          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
        >
          {t("spelers.flashcard.alleOpnieuw")}
        </button>

        {!andersom && (
          <p className="mt-4 text-xs text-slate-500">
            {t("spelers.flashcard.ookAndersom")}
          </p>
        )}
      </div>
    );
  }

  if (!currentCard) return null;

  const voortgang = Math.round(((currentIndex + 1) / activeQueue.length) * 100);

  return (
    <div className="max-w-md mx-auto">

      <Voortgang
        label={t("spelers.flashcard.kaartVan", { nr: currentIndex + 1, n: activeQueue.length })}
        percentage={voortgang}
      />

      {/* Richting: gewoon of andersom */}
      <div className="flex justify-end -mt-3 mb-3">
        <button
          onClick={draaiRichting}
          aria-pressed={andersom}
          title={t("spelers.flashcard.tweeRichtingen")}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            andersom
              ? "bg-merk-50 text-merk-900"
              : "text-slate-500 hover:text-merk-900 hover:bg-slate-100"
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>{andersom ? t("spelers.flashcard.gewoneRichting") : t("spelers.flashcard.andersomOefenen")}</span>
        </button>
      </div>

      {/* Kaart die je omdraait */}
      <div
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? t("spelers.flashcard.draaiTerug") : t("spelers.flashcard.toonAntwoord")}
        onClick={() => setIsFlipped(!isFlipped)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsFlipped(!isFlipped);
          }
        }}
        className="w-full h-80 rounded-2xl bg-white border border-slate-200 hover:border-merk cursor-pointer transition-colors relative flex flex-col justify-between p-6 text-center select-none"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">
            {isFlipped ? t("spelers.flashcard.antwoord") : t("spelers.flashcard.vraag")}
          </span>
          {spraakBeschikbaar() && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                speel(
                  toontAchterkant ? currentCard.back : currentCard.front,
                  toontAchterkant
                );
              }}
              className="p-2 rounded-lg text-merk hover:bg-merk-50 transition-colors"
              title={t("spelers.gemeen.luisterUitspraak")}
            >
              <Volume2 className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <p className="text-3xl font-extrabold text-merk-900 tracking-tight">
            {toontAchterkant ? currentCard.back : currentCard.front}
          </p>
          {isFlipped && currentCard.exampleSentence && (
            <p className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-xl mt-4">
              {currentCard.exampleSentence}
            </p>
          )}
        </div>

        <span className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <RotateCw className="w-3.5 h-3.5" />
          {isFlipped ? t("spelers.flashcard.klikTerug") : t("spelers.flashcard.klikToon")}
        </span>
      </div>

      {/* Zelfbeoordeling */}
      <div className="mt-6">
        <p className="text-sm text-center text-slate-600 mb-3">
          {isFlipped
            ? t("spelers.flashcard.tipNa")
            : t("spelers.flashcard.tipVoor")}
        </p>

        {isFlipped ? (
          <div className="grid grid-cols-3 gap-3 u-rise">
            <Oordeel
              onClick={() => beoordeel("failed")}
              icon={XCircle}
              label={t("spelers.flashcard.nietGeweten")}
              kleur="bg-rose-50 hover:bg-rose-100 text-rose-800"
            />
            <Oordeel
              onClick={() => beoordeel("review")}
              icon={AlertCircle}
              label={t("spelers.flashcard.twijfel")}
              kleur="bg-amber-50 hover:bg-amber-100 text-amber-800"
            />
            <Oordeel
              onClick={() => beoordeel("mastered")}
              icon={CheckCircle2}
              label={t("spelers.flashcard.wistIk")}
              kleur="bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
            />
          </div>
        ) : (
          <button
            onClick={() => setIsFlipped(true)}
            className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>{t("spelers.flashcard.toonAntwoord")}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function Voortgang({ label, percentage }: { label: string; percentage: number }) {
  return (
    <>
      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
        <span>{label}</span>
        <span>{t("spelers.gemeen.procentKlaar", { pct: percentage })}</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-6">
        <div
          className="h-full bg-merk transition-all duration-300 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </>
  );
}

function Stapel({ aantal, label, kleur }: { aantal: number; label: string; kleur: string }) {
  return (
    <div className={`p-3 rounded-xl ${kleur}`}>
      <span className="text-xl font-extrabold block">{aantal}</span>
      <span className="text-xs font-semibold">{label}</span>
    </div>
  );
}

function Oordeel({
  onClick,
  icon: Icon,
  label,
  kleur,
}: {
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  kleur: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors ${kleur}`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}
