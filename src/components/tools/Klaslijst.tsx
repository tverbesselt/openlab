"use client";

import React, { useState } from "react";
import { Check, Pencil, UserX } from "lucide-react";
import type { Klaslijst as KlaslijstGegevens } from "@/lib/klaslijst";
import { t, tn } from "@/lib/i18n";
import { tr } from "@/lib/i18n/rijk";

/*
 * De klaslijst onder de naamkiezer en de groepenmaker: wie is er vandaag?
 *
 * Eén klik zet een cursist op afwezig. Die krijgt dan geen beurt en komt niet in een groep,
 * maar blijft wel in de lijst staan voor de volgende les. Zo hoeft de leraar zijn groep niet
 * telkens opnieuw te typen.
 */

export function Klaslijst({ lijst }: { lijst: KlaslijstGegevens }) {
  const [aanpassen, setAanpassen] = useState(false);

  if (!lijst.geladen) return <div className="h-32" aria-hidden />;

  const { namen, afwezig, aanwezig } = lijst;

  return (
    <div className="border-t border-slate-200 pt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-1">
        <span className="text-xs font-bold text-slate-700">
          {t("klas.klaslijst.wie")}{" "}
          <span className="font-normal text-slate-500">
            {t("klas.klaslijst.aanwezig", { n: aanwezig.length, totaal: namen.length })}
            {afwezig.length > 0 && ` · ${tn("klas.klaslijst.afwezig", afwezig.length)}`}
          </span>
        </span>

        <div className="flex items-center gap-3">
          {afwezig.length > 0 && (
            <button
              type="button"
              onClick={lijst.iedereenAanwezig}
              className="text-xs font-bold text-merk-900 hover:underline"
            >
              {t("klas.klaslijst.iedereen")}
            </button>
          )}
          <button
            type="button"
            onClick={() => setAanpassen(!aanpassen)}
            aria-expanded={aanpassen}
            className="text-xs font-bold text-slate-600 hover:text-merk-900 flex items-center gap-1"
          >
            <Pencil className="w-3 h-3" />
            <span>{aanpassen ? t("algemeen.klaar") : t("klas.klaslijst.aanpassen")}</span>
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-3">
        {t("klas.klaslijst.uitleg")}
      </p>

      {aanpassen ? (
        <label className="block">
          <span className="block text-xs text-slate-500 mb-2">
            {t("klas.klaslijst.invoerUitleg")}
          </span>
          <textarea
            rows={4}
            value={lijst.tekst}
            onChange={(e) => lijst.zetTekst(e.target.value)}
            aria-label={t("klas.klaslijst.invoerLabel")}
            className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-merk focus:outline-none"
          />
        </label>
      ) : namen.length === 0 ? (
        <p className="text-sm text-slate-600">
          {tr("klas.klaslijst.leeg", { b: (s) => <strong>{s}</strong> })}
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {namen.map((naam) => {
            const weg = lijst.isAfwezig(naam);
            return (
              <li key={naam}>
                <button
                  type="button"
                  onClick={() => lijst.wissel(naam)}
                  aria-pressed={!weg}
                  title={
                    weg
                      ? t("klas.klaslijst.isAfwezig", { naam })
                      : t("klas.klaslijst.doetMee", { naam })
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-semibold transition-colors ${
                    weg
                      ? "bg-slate-100 border-slate-200 text-slate-400 line-through"
                      : "bg-white border-merk/30 text-slate-800 hover:border-merk"
                  }`}
                >
                  {weg ? (
                    <UserX className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Check className="w-3.5 h-3.5 shrink-0 text-merk" />
                  )}
                  <span>{naam}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
