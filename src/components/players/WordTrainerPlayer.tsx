"use client";

import React, { useEffect, useRef, useState } from "react";
import { WordTrainerItem, DidacticConfig } from "@/lib/types";
import { FlashcardPlayer, Voortgang } from "./FlashcardPlayer";
import { MatchingPlayer } from "./MatchingPlayer";
import { QuizPlayer } from "./QuizPlayer";
import { WERKVORMEN } from "@/lib/labels";
import { spraakBeschikbaar, spreekUit, STANDAARD_TAAL } from "@/lib/spraak";
import { vergelijk, isJuist as isJuistGespeld } from "@/lib/dictee";
import { herkenningBeschikbaar, klonkGoed, luister, type Uitkomst } from "@/lib/uitspraak";
import type { Zelfoordeel } from "@/lib/herhalen";
import { t } from "@/lib/i18n";
import { tr } from "@/lib/i18n/rijk";
import { Keyboard, CheckCircle2, XCircle, Volume2, Ear, Mic, MicOff } from "lucide-react";

interface WordTrainerPlayerProps {
  items: WordTrainerItem[];
  title: string;
  didacticConfig?: DidacticConfig;
  onBeoordeeld?: (kaartId: string, oordeel: Zelfoordeel) => void;
}

type Manier = "flashcards" | "matching" | "quiz" | "typen" | "dictee" | "uitspraak";

/** Een functie en geen constante: de labels volgen de taal van het moment. */
function alleManieren(): { id: Manier; label: string; icon: React.ElementType }[] {
  return [
    { id: "flashcards", label: WERKVORMEN.flashcard.label, icon: WERKVORMEN.flashcard.icon },
    { id: "matching", label: WERKVORMEN.matching.label, icon: WERKVORMEN.matching.icon },
    { id: "quiz", label: WERKVORMEN.quiz.label, icon: WERKVORMEN.quiz.icon },
    { id: "typen", label: t("spelers.woordtrainer.typen"), icon: Keyboard },
    { id: "dictee", label: t("spelers.woordtrainer.dictee"), icon: Ear },
    { id: "uitspraak", label: t("spelers.woordtrainer.uitspraak"), icon: Mic },
  ];
}

export function WordTrainerPlayer({
  items,
  didacticConfig,
  onBeoordeeld,
}: WordTrainerPlayerProps) {
  const [manier, setManier] = useState<Manier>("flashcards");

  /*
    Twee manieren hangen af van wat de browser kan: een dictee vraagt een stem, uitspraak
    nazeggen vraagt bovendien spraakherkenning (niet in Firefox). Wat niet kan, tonen we
    niet: een knop die niets doet, is erger dan een knop die er niet is.
  */
  const manieren = alleManieren().filter((m) => {
    if (m.id === "dictee") return spraakBeschikbaar();
    if (m.id === "uitspraak") return spraakBeschikbaar() && herkenningBeschikbaar();
    return true;
  });

  const flashcards = items.map((i) => ({
    id: i.id,
    front: i.word,
    back: i.translation,
    exampleSentence: i.exampleSentence,
  }));

  const paren = items.map((i) => ({ id: i.id, left: i.word, right: i.translation }));

  const vragen = items.map((item, idx) => {
    const afleiders = items
      .filter((_, i) => i !== idx)
      .map((i) => i.translation)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const opties = [item.translation, ...afleiders].sort(() => 0.5 - Math.random());

    return {
      id: `wt-q-${idx}`,
      question: t("spelers.woordtrainer.watBetekent", { woord: item.word }),
      options: opties,
      correctAnswers: [opties.indexOf(item.translation)],
      type: "multiple_choice" as const,
      explanation: t("spelers.woordtrainer.betekent", { woord: item.word, vertaling: item.translation }),
    };
  });

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <p className="text-sm text-slate-600 text-center mb-3">
          {t("spelers.woordtrainer.kiesManier", { n: manieren.length })}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {manieren.map((m) => {
            const Icon = m.icon;
            const actief = manier === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setManier(m.id)}
                aria-pressed={actief}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors border ${
                  actief
                    ? "bg-merk-800 text-white border-merk-800"
                    : "bg-white text-slate-700 border-slate-200 hover:border-merk"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {manier === "flashcards" && (
        <FlashcardPlayer
          cards={flashcards}
          didacticConfig={didacticConfig}
          onBeoordeeld={onBeoordeeld}
        />
      )}
      {manier === "matching" && <MatchingPlayer pairs={paren} />}
      {manier === "quiz" && <QuizPlayer questions={vragen} didacticConfig={didacticConfig} />}
      {manier === "typen" && <TypeOefening items={items} didacticConfig={didacticConfig} />}
      {manier === "dictee" && <Dictee items={items} didacticConfig={didacticConfig} />}
      {manier === "uitspraak" && <Uitspraak items={items} didacticConfig={didacticConfig} />}
    </div>
  );
}

/**
 * Uitspraak nazeggen. Je hoort het woord, spreekt het na, en de browser zet je spraak om
 * in tekst. Dat is geen uitspraakcoach: het zegt of je herkenbaar was, niet of je accent
 * klopt. Daarom is het oordeel soepel en staat de nadruk op durven spreken.
 *
 * De opname blijft in de browser en wordt nergens bewaard.
 */
function Uitspraak({
  items,
  didacticConfig,
}: {
  items: WordTrainerItem[];
  didacticConfig?: DidacticConfig;
}) {
  const [index, setIndex] = useState(0);
  const [luistert, setLuistert] = useState(false);
  const [uitkomst, setUitkomst] = useState<Uitkomst | null>(null);
  const sessie = useRef<{ stop: () => void } | null>(null);

  const taal = didacticConfig?.spraakTaal ?? STANDAARD_TAAL;
  const huidig = items[index];
  const goed = uitkomst?.soort === "gehoord" && klonkGoed(uitkomst.alternatieven, huidig.word);

  // De microfoon nooit laten doorlopen wanneer de cursist wegklikt.
  useEffect(() => {
    return () => sessie.current?.stop();
  }, []);

  const spreekNa = () => {
    if (luistert) return;
    setUitkomst(null);
    setLuistert(true);
    sessie.current = luister(taal, (resultaat) => {
      setUitkomst(resultaat);
      setLuistert(false);
    });
    if (!sessie.current) setLuistert(false);
  };

  const volgende = () => {
    sessie.current?.stop();
    setUitkomst(null);
    setLuistert(false);
    setIndex(index + 1 < items.length ? index + 1 : 0);
  };

  return (
    <div className="max-w-lg mx-auto">
      <Voortgang
        label={t("spelers.gemeen.woordVan", { nr: index + 1, n: items.length })}
        percentage={Math.round(((index + 1) / items.length) * 100)}
      />

      <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center u-pop">
        <p className="text-sm text-slate-600 mb-1">{t("spelers.woordtrainer.nazeggen.uitleg")}</p>
        <p className="text-3xl font-extrabold text-merk-900 mb-1">{huidig.word}</p>
        <p className="text-sm text-slate-500 mb-5">{huidig.translation}</p>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            onClick={() => spreekUit(huidig.word, taal)}
            className="flex-1 py-3 rounded-xl bg-merk-50 text-merk-900 hover:bg-merk/20 font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Volume2 className="w-4 h-4" />
            <span>{t("spelers.woordtrainer.nazeggen.voorbeeld")}</span>
          </button>

          <button
            onClick={spreekNa}
            disabled={luistert}
            className="flex-1 py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-70 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Mic className="w-4 h-4" />
            <span>{luistert ? t("spelers.woordtrainer.nazeggen.ikLuister") : t("spelers.woordtrainer.nazeggen.zegNa")}</span>
          </button>
        </div>

        {uitkomst && (
          <div
            className={`p-4 rounded-xl mb-4 text-sm ${
              goed ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"
            }`}
          >
            {uitkomst.soort === "gehoord" ? (
              <>
                <p className="font-bold flex items-center justify-center gap-2 mb-1">
                  {goed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{t("spelers.woordtrainer.nazeggen.duidelijk")}</span>
                    </>
                  ) : (
                    <>
                      <MicOff className="w-4 h-4 text-amber-600" />
                      <span>{t("spelers.woordtrainer.nazeggen.nietHelemaal")}</span>
                    </>
                  )}
                </p>
                <p>
                  {tr(
                    "spelers.woordtrainer.nazeggen.ikHoorde",
                    { b: (s) => <strong>{s}</strong> },
                    { tekst: uitkomst.alternatieven[0] }
                  )}
                </p>
                {!goed && (
                  <p className="text-xs mt-1">
                    {t("spelers.woordtrainer.nazeggen.nietHelemaalUitleg")}
                  </p>
                )}
              </>
            ) : uitkomst.soort === "geen-toegang" ? (
              <p>
                {t("spelers.woordtrainer.nazeggen.geenToegang")}
              </p>
            ) : uitkomst.soort === "niets-gehoord" ? (
              <p>{t("spelers.woordtrainer.nazeggen.nietsGehoord")}</p>
            ) : (
              <p>{t("spelers.woordtrainer.nazeggen.fout")}</p>
            )}
          </div>
        )}

        <button
          onClick={volgende}
          className="w-full py-3 rounded-xl bg-merk-900 hover:bg-merk-700 text-white font-bold text-sm transition-colors"
        >
          {t("spelers.gemeen.volgendWoord")}
        </button>

        <p className="mt-4 text-xs text-slate-500">
          {t("spelers.woordtrainer.nazeggen.privacy")}
        </p>
      </div>
    </div>
  );
}

/** Spelling oefenen: je typt het woord zelf, dat is sterker dan herkennen. */
function TypeOefening({
  items,
  didacticConfig,
}: {
  items: WordTrainerItem[];
  didacticConfig?: DidacticConfig;
}) {
  const [index, setIndex] = useState(0);
  const [antwoord, setAntwoord] = useState("");
  const [gecontroleerd, setGecontroleerd] = useState(false);
  const [juist, setJuist] = useState(false);

  const taal = didacticConfig?.spraakTaal ?? STANDAARD_TAAL;
  const huidig = items[index];

  const controleer = () => {
    if (!antwoord.trim()) return;
    const ingevuld = antwoord.trim().toLowerCase();
    setJuist(
      ingevuld === huidig.word.trim().toLowerCase() ||
        ingevuld === huidig.translation.trim().toLowerCase()
    );
    setGecontroleerd(true);
  };

  const volgende = () => {
    setAntwoord("");
    setGecontroleerd(false);
    setIndex(index + 1 < items.length ? index + 1 : 0);
  };

  return (
    <div className="max-w-lg mx-auto">
      <Voortgang
        label={t("spelers.gemeen.woordVan", { nr: index + 1, n: items.length })}
        percentage={Math.round(((index + 1) / items.length) * 100)}
      />

      <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center u-pop">
        <p className="text-sm text-slate-600 mb-1">{t("spelers.woordtrainer.typ.welkWoord")}</p>
        <p className="text-2xl font-extrabold text-merk-900 mb-5">{huidig.translation}</p>

        <input
          type="text"
          value={antwoord}
          disabled={gecontroleerd}
          onChange={(e) => setAntwoord(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (gecontroleerd ? volgende() : controleer())}
          placeholder={t("spelers.gemeen.typAntwoord")}
          aria-label={t("spelers.gemeen.typAntwoord")}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full text-center text-lg font-bold p-3 rounded-xl bg-white border border-veldrand text-slate-900 placeholder-slate-500 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none mb-4"
        />

        {gecontroleerd && (
          <div
            className={`p-4 rounded-xl mb-4 text-sm font-semibold flex items-center justify-center gap-2 ${
              juist ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"
            }`}
          >
            {juist ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t("spelers.gemeen.juistGespeld")}</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>{t("spelers.woordtrainer.typ.juisteSpelling", { woord: huidig.word })}</span>
              </>
            )}
          </div>
        )}

        {/* Pas na het antwoord te horen: zo blijft het typen echt ophalen uit het geheugen,
            en hoort de cursist meteen hoe het woord klinkt bij de juiste spelling. */}
        {gecontroleerd && spraakBeschikbaar() && (
          <button
            onClick={() => spreekUit(huidig.word, taal)}
            className="mb-4 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-merk-50 text-merk-900 hover:bg-merk/20 font-bold text-xs transition-colors"
          >
            <Volume2 className="w-4 h-4" />
            <span>{t("spelers.gemeen.luisterUitspraak")}</span>
          </button>
        )}

        {!gecontroleerd ? (
          <button
            onClick={controleer}
            className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
          >
            {t("spelers.gemeen.controleer")}
          </button>
        ) : (
          <button
            onClick={volgende}
            className="w-full py-3 rounded-xl bg-merk-900 hover:bg-merk-700 text-white font-bold text-sm transition-colors"
          >
            {t("spelers.gemeen.volgendWoord")}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Dictee: je hoort het woord en typt wat je hoort. Luisteren en schrijven samen leggen
 * twee geheugensporen aan (dual coding), en de vergelijking per letter maakt van een fout
 * meteen een leermoment in plaats van een oordeel.
 */
function Dictee({
  items,
  didacticConfig,
}: {
  items: WordTrainerItem[];
  didacticConfig?: DidacticConfig;
}) {
  const [index, setIndex] = useState(0);
  const [antwoord, setAntwoord] = useState("");
  const [gecontroleerd, setGecontroleerd] = useState(false);

  const taal = didacticConfig?.spraakTaal ?? STANDAARD_TAAL;
  const huidig = items[index];
  const juist = gecontroleerd && isJuistGespeld(antwoord, huidig.word);
  const stappen = gecontroleerd ? vergelijk(antwoord.trim(), huidig.word.trim()) : [];

  // Elk nieuw woord meteen laten horen; anders moet de cursist eerst een knop zoeken.
  useEffect(() => {
    spreekUit(huidig.word, taal);
  }, [huidig.word, taal]);

  const volgende = () => {
    setAntwoord("");
    setGecontroleerd(false);
    setIndex(index + 1 < items.length ? index + 1 : 0);
  };

  return (
    <div className="max-w-lg mx-auto">
      <Voortgang
        label={t("spelers.gemeen.woordVan", { nr: index + 1, n: items.length })}
        percentage={Math.round(((index + 1) / items.length) * 100)}
      />

      <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center u-pop">
        <p className="text-sm text-slate-600 mb-4">{t("spelers.woordtrainer.dicteeScherm.uitleg")}</p>

        <button
          onClick={() => spreekUit(huidig.word, taal)}
          className="mb-5 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
        >
          <Volume2 className="w-5 h-5" />
          <span>{gecontroleerd ? t("spelers.woordtrainer.dicteeScherm.nogEens") : t("spelers.woordtrainer.dicteeScherm.speelAf")}</span>
        </button>

        <input
          type="text"
          value={antwoord}
          disabled={gecontroleerd}
          onChange={(e) => setAntwoord(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            if (gecontroleerd) volgende();
            else if (antwoord.trim()) setGecontroleerd(true);
          }}
          placeholder={t("spelers.woordtrainer.dicteeScherm.typHoort")}
          aria-label={t("spelers.woordtrainer.dicteeScherm.typHoort")}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          autoFocus
          className="w-full text-center text-lg font-bold p-3 rounded-xl bg-white border border-veldrand text-slate-900 placeholder-slate-500 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none mb-4"
        />

        {gecontroleerd && (
          <div className={`p-4 rounded-xl mb-4 ${juist ? "bg-emerald-50" : "bg-rose-50"}`}>
            <p
              className={`text-sm font-bold flex items-center justify-center gap-2 mb-2 ${
                juist ? "text-emerald-900" : "text-rose-900"
              }`}
            >
              {juist ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{t("spelers.gemeen.juistGespeld")}</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>{t("spelers.woordtrainer.dicteeScherm.verschil")}</span>
                </>
              )}
            </p>

            {/* Letter per letter: groen wat klopte, doorstreept wat je te veel typte,
                onderstreept wat je miste. */}
            <p className="font-mono text-xl tracking-wide break-all">
              {stappen.map((stap, i) => (
                <span
                  key={i}
                  className={
                    stap.soort === "gelijk"
                      ? "text-emerald-700"
                      : stap.soort === "teveel"
                        ? "text-rose-500 line-through"
                        : "text-rose-700 underline decoration-2 underline-offset-4"
                  }
                >
                  {stap.teken === " " ? " " : stap.teken}
                </span>
              ))}
            </p>

            <p className="text-xs text-slate-600 mt-2">
              {t("spelers.woordtrainer.dicteeScherm.woordIs", { woord: huidig.word, vertaling: huidig.translation })}
            </p>
          </div>
        )}

        {!gecontroleerd ? (
          <button
            onClick={() => antwoord.trim() && setGecontroleerd(true)}
            disabled={!antwoord.trim()}
            className="w-full py-3 rounded-xl bg-merk-900 hover:bg-merk-700 disabled:opacity-50 text-white font-bold text-sm transition-colors"
          >
            {t("spelers.gemeen.controleer")}
          </button>
        ) : (
          <button
            onClick={volgende}
            className="w-full py-3 rounded-xl bg-merk-900 hover:bg-merk-700 text-white font-bold text-sm transition-colors"
          >
            {t("spelers.gemeen.volgendWoord")}
          </button>
        )}
      </div>
    </div>
  );
}
