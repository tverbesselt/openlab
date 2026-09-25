"use client";

import React, { useState } from "react";
import { Shuffle } from "lucide-react";
import { useKlaslijst } from "@/lib/klaslijst";
import { Klaslijst } from "./Klaslijst";
import { t, tn } from "@/lib/i18n";

export function GroupGenerator() {
  const lijst = useKlaslijst();
  const [aantalGroepen, setAantalGroepen] = useState(4);
  const [groepen, setGroepen] = useState<string[][]>([]);

  // Alleen wie er vandaag is, wordt verdeeld.
  const meedoen = lijst.aanwezig;

  const verdeel = () => {
    if (meedoen.length === 0) return;

    // Nooit meer groepen dan er cursisten zijn: een lege groep helpt niemand.
    const groepenNu = Math.min(aantalGroepen, meedoen.length);
    const geschud = [...meedoen].sort(() => 0.5 - Math.random());
    const resultaat: string[][] = Array.from({ length: groepenNu }, () => []);
    geschud.forEach((naam, idx) => resultaat[idx % groepenNu].push(naam));

    setGroepen(resultaat);
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 max-w-2xl mx-auto u-pop space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <label className="block sm:w-48">
          <span className="block text-xs font-bold text-slate-700 mb-1">{t("klas.groepen.aantal")}</span>
          <select
            value={aantalGroepen}
            onChange={(e) => setAantalGroepen(Number(e.target.value))}
            className="w-full p-3 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl text-merk-900 focus:border-merk focus:outline-none"
          >
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {tn("klas.groepen.optie", n)}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={verdeel}
          disabled={meedoen.length === 0}
          className="flex-1 py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
        >
          <Shuffle className="w-4 h-4" />
          <span>
            {meedoen.length === 0
              ? t("klas.groepen.niemand")
              : tn("klas.groepen.verdeel", meedoen.length)}
          </span>
        </button>
      </div>

      {groepen.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 u-rise">
          {groepen.map((groep, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                <span className="font-bold text-sm text-merk-900">{t("klas.groepen.groep", { n: idx + 1 })}</span>
                <span className="text-xs text-slate-500">
                  {tn("klas.groepen.cursisten", groep.length)}
                </span>
              </div>
              <ul className="space-y-1">
                {groep.map((naam, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-merk shrink-0" />
                    <span>{naam}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Klaslijst lijst={lijst} />
    </div>
  );
}
