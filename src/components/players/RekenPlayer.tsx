"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Rekenopdracht } from "@/lib/types";
import { isJuist, maakRonde, rekentype, toonAntwoord, type Opgave } from "@/lib/rekenen";
import { Voortgang } from "./FlashcardPlayer";
import { t, tn } from "@/lib/i18n";

/*
 * Rekenen met telkens nieuwe getallen. Elke ronde wordt opnieuw gegenereerd, dus een
 * cursist kan blijven oefenen tot het vlot gaat, zonder ooit dezelfde opgave te herkennen.
 * Dat is precies wat automatiseren vraagt: veel korte herhalingen, geen memorisatie van
 * één specifieke som.
 */
export function RekenPlayer({ opdracht }: { opdracht: Rekenopdracht }) {
  const type = rekentype(opdracht.soort);
  const [ronde, setRonde] = useState<Opgave[]>(() => maakRonde(opdracht.soort, opdracht.aantal));
  const [index, setIndex] = useState(0);
  const [antwoord, setAntwoord] = useState("");
  const [gecontroleerd, setGecontroleerd] = useState(false);
  const [juistAantal, setJuistAantal] = useState(0);
  const [klaar, setKlaar] = useState(false);

  const huidig = ronde[index];
  const juist = gecontroleerd && isJuist(antwoord, huidig);

  const nieuweRonde = () => {
    setRonde(maakRonde(opdracht.soort, opdracht.aantal));
    setIndex(0);
    setAntwoord("");
    setGecontroleerd(false);
    setJuistAantal(0);
    setKlaar(false);
  };

  const controleer = () => {
    if (gecontroleerd || !antwoord.trim()) return;
    setGecontroleerd(true);
    if (isJuist(antwoord, huidig)) setJuistAantal((n) => n + 1);
  };

  const volgende = () => {
    setAntwoord("");
    setGecontroleerd(false);
    if (index + 1 < ronde.length) setIndex(index + 1);
    else setKlaar(true);
  };

  if (klaar) {
    const score = Math.round((juistAantal / ronde.length) * 100);
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 text-center max-w-lg mx-auto u-pop">
        <CheckCircle2 className="w-10 h-10 text-merk mx-auto mb-3" />
        <h3 className="text-xl font-extrabold text-merk-900 mb-1">{t("oefenen.rekenen.rondeAf")}</h3>
        <p className="text-sm text-slate-600 mb-6">{t("oefenen.speler.geenPunten")}</p>

        <div className="p-6 rounded-xl bg-slate-50 mb-6">
          <span className="text-4xl font-extrabold text-merk-900 block mb-1">{score}%</span>
          <span className="text-sm text-slate-600">
            {tn("oefenen.rekenen.score", ronde.length, { juist: juistAantal })}
          </span>
        </div>

        <button
          onClick={nieuweRonde}
          className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{t("oefenen.rekenen.nieuweRonde")}</span>
        </button>

        <p className="mt-3 text-xs text-slate-500">
          {t("oefenen.rekenen.telkensAnders")}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <Voortgang
        label={t("oefenen.rekenen.voortgang", { nr: index + 1, totaal: ronde.length })}
        percentage={Math.round(((index + 1) / ronde.length) * 100)}
      />

      <div className="bg-white rounded-2xl p-6 border border-slate-200 u-pop">
        <p className="text-xs font-bold text-slate-500 mb-3 text-center">{type.label}</p>
        <p className="text-xl sm:text-2xl font-extrabold text-merk-900 leading-snug text-center mb-5">
          {huidig.vraag}
        </p>

        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            inputMode="decimal"
            value={antwoord}
            disabled={gecontroleerd}
            onChange={(e) => setAntwoord(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (gecontroleerd ? volgende() : controleer())}
            placeholder={t("oefenen.speler.jouwAntwoord")}
            aria-label={t("oefenen.speler.jouwAntwoord")}
            autoComplete="off"
            autoFocus
            className="flex-1 text-center text-lg font-bold p-3 rounded-xl bg-white border border-veldrand text-slate-900 placeholder-slate-500 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
          />
          {huidig.eenheid && (
            <span className="text-sm font-bold text-slate-500 shrink-0">{huidig.eenheid}</span>
          )}
        </div>

        {gecontroleerd && (
          <div
            className={`p-4 rounded-xl mb-4 ${juist ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"}`}
          >
            <p className="text-sm font-bold flex items-center gap-2 mb-1">
              {juist ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{t("oefenen.speler.juist")}</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>{t("oefenen.rekenen.antwoordIs", { antwoord: toonAntwoord(huidig) })}</span>
                </>
              )}
            </p>
            <p className="text-sm">{huidig.uitleg}</p>
          </div>
        )}

        {!gecontroleerd ? (
          <button
            onClick={controleer}
            disabled={!antwoord.trim()}
            className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm transition-colors"
          >
            {t("oefenen.speler.controleer")}
          </button>
        ) : (
          <button
            onClick={volgende}
            className="w-full py-3 rounded-xl bg-merk-900 hover:bg-merk-700 text-white font-bold text-sm transition-colors"
          >
            {index + 1 < ronde.length ? t("oefenen.rekenen.volgende") : t("oefenen.speler.resultaat")}
          </button>
        )}

        <p className="mt-4 text-xs text-slate-500 text-center">
          {t("oefenen.rekenen.kommaPunt")}
        </p>
      </div>
    </div>
  );
}
