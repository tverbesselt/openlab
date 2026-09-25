"use client";

import React, { useState } from "react";
import { Volume2, Type } from "lucide-react";
import { QuizQuestion, DidacticConfig } from "@/lib/types";
import { spraakBeschikbaar, spreekUit, zwijg, STANDAARD_TAAL } from "@/lib/spraak";
import { QuizPlayer } from "./QuizPlayer";
import { t } from "@/lib/i18n";

interface LeesPlayerProps {
  tekst: string;
  vragen: QuizQuestion[];
  didacticConfig?: DidacticConfig;
  onKlaar?: (foutVragen: string[], aantalVragen: number) => void;
}

/*
 * Lezen met vragen. De tekst blijft náást of bóven de vragen staan, nooit op een vorig
 * scherm: heen en weer moeten bladeren tussen tekst en vraag kost werkgeheugen dat je
 * voor het begrijpen nodig hebt (split-attention, Mayer & Moreno).
 */
export function LeesPlayer({ tekst, vragen, didacticConfig, onKlaar }: LeesPlayerProps) {
  const [groot, setGroot] = useState(false);
  const taal = didacticConfig?.spraakTaal ?? STANDAARD_TAAL;

  const alineas = tekst.split(/\n\s*\n|\n/).map((r) => r.trim()).filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* De tekst; op een breed scherm blijft ze meescrollen naast de vragen. */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 lg:sticky lg:top-24">
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-500">{t("spelers.lezen.deTekst")}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setGroot(!groot)}
              aria-pressed={groot}
              className={`p-2 rounded-lg transition-colors ${
                groot ? "bg-merk-50 text-merk-900" : "text-slate-500 hover:bg-slate-100"
              }`}
              title={groot ? t("spelers.lezen.gewoneGrootte") : t("spelers.lezen.groter")}
            >
              <Type className="w-4 h-4" />
            </button>
            {spraakBeschikbaar() && (
              <button
                onClick={() => spreekUit(tekst, taal)}
                onDoubleClick={zwijg}
                className="p-2 rounded-lg text-merk hover:bg-merk-50 transition-colors"
                title={t("spelers.lezen.voorlezen")}
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div
          className={`max-h-[28rem] overflow-y-auto pr-1 space-y-3 text-slate-800 leading-relaxed ${
            groot ? "text-lg leading-loose" : "text-sm"
          }`}
        >
          {alineas.map((alinea, i) => (
            <p key={i}>{alinea}</p>
          ))}
        </div>
      </section>

      {/* De vragen bij de tekst */}
      <section>
        <QuizPlayer questions={vragen} didacticConfig={didacticConfig} onKlaar={onKlaar} />
      </section>
    </div>
  );
}
