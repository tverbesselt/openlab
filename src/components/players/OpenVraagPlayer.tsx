"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, RefreshCw, Eye } from "lucide-react";
import { OpenVraag } from "@/lib/types";
import { Voortgang } from "./FlashcardPlayer";
import { t, tn } from "@/lib/i18n";

type Oordeel = "had" | "half" | "niet";

/** Een functie en geen constante: de labels volgen de taal van het moment. */
function oordelenLijst(): { id: Oordeel; label: string; kleur: string }[] {
  return [
    { id: "niet", label: t("spelers.open.niet"), kleur: "bg-rose-50 hover:bg-rose-100 text-rose-800" },
    { id: "half", label: t("spelers.open.half"), kleur: "bg-amber-50 hover:bg-amber-100 text-amber-800" },
    { id: "had", label: t("spelers.open.had"), kleur: "bg-emerald-50 hover:bg-emerald-100 text-emerald-800" },
  ];
}

/*
 * Open vraag met modelantwoord.
 *
 * Er wordt niets automatisch nagekeken, en dat is de bedoeling: het antwoord in eigen
 * woorden formuleren is precies het ophalen dat het geheugen versterkt (Karpicke). Daarna
 * vergelijkt de cursist zelf met het modelantwoord en beoordeelt hij zichzelf. Dat oordeel
 * gaat nergens naartoe; het is er om te weten wat je nog moet nakijken.
 */
export function OpenVraagPlayer({ vragen }: { vragen: OpenVraag[] }) {
  const [rij, setRij] = useState<OpenVraag[]>(vragen);
  const [index, setIndex] = useState(0);
  const [antwoord, setAntwoord] = useState("");
  const [toont, setToont] = useState(false);
  const [oordelen, setOordelen] = useState<Record<string, Oordeel>>({});
  const [klaar, setKlaar] = useState(false);

  const huidig = rij[index];

  const herstel = (nieuweRij: OpenVraag[]) => {
    setRij(nieuweRij);
    setIndex(0);
    setAntwoord("");
    setToont(false);
    setOordelen({});
    setKlaar(false);
  };

  const beoordeel = (oordeel: Oordeel) => {
    setOordelen({ ...oordelen, [huidig.id]: oordeel });
    setAntwoord("");
    setToont(false);
    if (index + 1 < rij.length) setIndex(index + 1);
    else setKlaar(true);
  };

  if (vragen.length === 0) return null;

  if (klaar) {
    const naTeKijken = rij.filter((v) => oordelen[v.id] !== "had");
    const gewetenAantal = rij.filter((v) => oordelen[v.id] === "had").length;

    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 text-center max-w-lg mx-auto u-pop">
        <CheckCircle2 className="w-10 h-10 text-merk mx-auto mb-3" />
        <h3 className="text-xl font-extrabold text-merk-900 mb-1">{t("spelers.gemeen.rond")}</h3>
        <p className="text-sm text-slate-600 mb-6">
          {t("spelers.open.zelfBeoordeeld")}
        </p>

        <div className="p-6 rounded-xl bg-slate-50 mb-6">
          <span className="text-4xl font-extrabold text-merk-900 block mb-1">
            {gewetenAantal}/{rij.length}
          </span>
          <span className="text-sm text-slate-600">
            {gewetenAantal === rij.length
              ? t("spelers.open.allemaal")
              : tn("spelers.open.naTeKijken", naTeKijken.length)}
          </span>
        </div>

        {naTeKijken.length > 0 && (
          <button
            onClick={() => herstel(naTeKijken)}
            className="w-full py-3 mb-3 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t("spelers.open.doeOpnieuw", { n: naTeKijken.length })}</span>
          </button>
        )}

        <button
          onClick={() => herstel(vragen)}
          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
        >
          {t("spelers.gemeen.alleVragenOpnieuw")}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <Voortgang
        label={t("spelers.gemeen.vraagVan", { nr: index + 1, n: rij.length })}
        percentage={Math.round(((index + 1) / rij.length) * 100)}
      />

      <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-5">
        <span className="text-xs font-bold text-slate-500 block mb-2">
          {t("spelers.open.eigenWoorden")}
        </span>
        <h2 className="text-lg font-extrabold text-merk-900 leading-snug mb-5">
          {huidig.vraag}
        </h2>

        <textarea
          rows={5}
          value={antwoord}
          onChange={(e) => setAntwoord(e.target.value)}
          disabled={toont}
          placeholder={t("spelers.open.placeholder")}
          aria-label={t("spelers.open.jouwAntwoord")}
          className="w-full p-3 text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-merk focus:outline-none disabled:opacity-70"
        />

        {toont && (
          <div className="mt-5 pt-5 border-t border-slate-200 u-rise">
            <span className="text-xs font-bold text-slate-500 block mb-2">
              {t("spelers.open.modelLeraar")}
            </span>
            <p className="text-sm text-slate-800 leading-relaxed bg-merk-50 rounded-xl p-4">
              {huidig.modelantwoord}
            </p>
          </div>
        )}
      </div>

      {!toont ? (
        <>
          <button
            onClick={() => setToont(true)}
            className="w-full py-3.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            <span>{t("spelers.open.toonModel")}</span>
          </button>
          <p className="mt-3 text-xs text-slate-500 text-center">
            {t("spelers.open.eerstZelf")}
          </p>
        </>
      ) : (
        <div className="u-rise">
          <p className="text-sm text-center text-slate-600 mb-3">
            {t("spelers.open.hoeDicht")}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {oordelenLijst().map((o) => (
              <button
                key={o.id}
                onClick={() => beoordeel(o.id)}
                className={`py-3 rounded-xl font-bold text-xs transition-colors ${o.kleur}`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500 text-center flex items-center justify-center gap-1">
            <ArrowRight className="w-3.5 h-3.5" />
            <span>{index + 1 < rij.length ? t("spelers.open.daarnaVolgende") : t("spelers.open.daarnaOverzicht")}</span>
          </p>
        </div>
      )}
    </div>
  );
}
