"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle2, XCircle, RefreshCw, Undo2 } from "lucide-react";
import { SorteerItem } from "@/lib/types";
import { hussel } from "@/lib/hussel";
import { Voortgang } from "./FlashcardPlayer";
import { t, tn } from "@/lib/i18n";

interface SorteerPlayerProps {
  categorieen: string[];
  items: SorteerItem[];
}

/** Kleuren per bakje: rustig, en genoeg verschil om ze uit elkaar te houden. */
const BAKKLEUREN = [
  "bg-merk-50 border-merk text-merk-900",
  "bg-amber-50 border-amber-400 text-amber-900",
  "bg-violet-50 border-violet-400 text-violet-900",
  "bg-sky-50 border-sky-400 text-sky-900",
];

/*
 * Sorteren in bakjes: één item tegelijk, met de bakjes als knoppen eronder.
 *
 * Eén item tegelijk houdt de belasting laag (Sweller) en werkt op elke schermbreedte;
 * de gevulde bakjes blijven zichtbaar, zodat de indeling toch als geheel groeit.
 */
export function SorteerPlayer({ categorieen, items }: SorteerPlayerProps) {
  const [rij, setRij] = useState<SorteerItem[]>(() => hussel(items));
  const [index, setIndex] = useState(0);
  // Per item: in welk bakje de cursist het legde.
  const [gelegd, setGelegd] = useState<Record<string, number>>({});
  const [klaar, setKlaar] = useState(false);

  const huidig = rij[index];

  const perBak = useMemo(() => {
    const bakken: SorteerItem[][] = categorieen.map(() => []);
    for (const item of rij) {
      const bak = gelegd[item.id];
      if (bak !== undefined) bakken[bak]?.push(item);
    }
    return bakken;
  }, [rij, gelegd, categorieen]);

  const juistAantal = rij.filter((i) => gelegd[i.id] === i.categorie).length;

  const leg = (bak: number) => {
    if (!huidig) return;
    setGelegd({ ...gelegd, [huidig.id]: bak });
    if (index + 1 < rij.length) setIndex(index + 1);
    else setKlaar(true);
  };

  const terug = () => {
    if (index === 0) return;
    const vorige = rij[index - 1];
    const kopie = { ...gelegd };
    delete kopie[vorige.id];
    setGelegd(kopie);
    setIndex(index - 1);
  };

  const herstel = (nieuweRij: SorteerItem[]) => {
    setRij(hussel(nieuweRij));
    setIndex(0);
    setGelegd({});
    setKlaar(false);
  };

  if (items.length === 0 || categorieen.length < 2) {
    return (
      <p className="max-w-lg mx-auto text-sm text-slate-600 bg-white border border-slate-200 rounded-2xl p-8 text-center">
        {t("oefenen.sorteren.leeg")}
      </p>
    );
  }

  /* ── Nakijken ──────────────────────────────────────────────────────────── */
  if (klaar) {
    const foute = rij.filter((i) => gelegd[i.id] !== i.categorie);
    const score = Math.round((juistAantal / rij.length) * 100);

    return (
      <div className="max-w-xl mx-auto space-y-5">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center u-pop">
          <CheckCircle2 className="w-10 h-10 text-merk mx-auto mb-3" />
          <h3 className="text-xl font-extrabold text-merk-900 mb-1">{t("oefenen.speler.rond")}</h3>
          <p className="text-sm text-slate-600 mb-5">{t("oefenen.speler.geenPunten")}</p>

          <div className="p-6 rounded-xl bg-slate-50">
            <span className="text-4xl font-extrabold text-merk-900 block mb-1">{score}%</span>
            <span className="text-sm text-slate-600">
              {t("oefenen.sorteren.score", { juist: juistAantal, totaal: rij.length })}
            </span>
          </div>
        </div>

        {/* Per bakje tonen wat erin ligt, met de fouten aangeduid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categorieen.map((naam, bak) => (
            <div key={bak} className={`rounded-2xl border p-4 ${BAKKLEUREN[bak % BAKKLEUREN.length]}`}>
              <h4 className="text-sm font-extrabold mb-2">{naam}</h4>
              <ul className="space-y-1.5">
                {perBak[bak].length === 0 && (
                  <li className="text-xs opacity-70">{t("oefenen.sorteren.niets")}</li>
                )}
                {perBak[bak].map((item) => {
                  const goed = item.categorie === bak;
                  return (
                    <li key={item.id} className="text-sm flex items-start gap-1.5">
                      {goed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                      )}
                      <span className={goed ? "" : "line-through opacity-70"}>{item.tekst}</span>
                      {!goed && (
                        <span className="text-xs opacity-80">
                          {t("oefenen.sorteren.hoortBij", { bak: categorieen[item.categorie] })}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {foute.length > 0 && (
            <button
              onClick={() => herstel(foute)}
              className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>
                {tn("oefenen.sorteren.opnieuw", foute.length)}
              </span>
            </button>
          )}
          <button
            onClick={() => herstel(items)}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
          >
            {t("oefenen.sorteren.opnieuwAlles")}
          </button>
        </div>
      </div>
    );
  }

  /* ── Sorteren ──────────────────────────────────────────────────────────── */
  return (
    <div className="max-w-xl mx-auto">
      <Voortgang
        label={t("oefenen.sorteren.voortgang", { nr: index + 1, totaal: rij.length })}
        percentage={Math.round(((index + 1) / rij.length) * 100)}
      />

      <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-5 text-center u-pop">
        <p className="text-xs font-bold text-slate-500 mb-3">{t("oefenen.sorteren.waar")}</p>
        <p className="text-2xl font-extrabold text-merk-900 leading-snug">{huidig.tekst}</p>
      </div>

      <div className={`grid gap-3 mb-4 ${categorieen.length > 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
        {categorieen.map((naam, bak) => (
          <button
            key={bak}
            onClick={() => leg(bak)}
            className={`px-4 py-5 rounded-2xl border-2 font-bold text-sm transition-transform hover:scale-[1.02] ${BAKKLEUREN[bak % BAKKLEUREN.length]}`}
          >
            <span className="block">{naam}</span>
            <span className="block text-xs font-semibold opacity-70 mt-1">
              {tn("oefenen.sorteren.items", perBak[bak].length)}
            </span>
          </button>
        ))}
      </div>

      {index > 0 && (
        <button
          onClick={terug}
          className="text-xs font-bold text-slate-500 hover:text-merk-900 flex items-center gap-1 mx-auto"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>{t("oefenen.sorteren.vorige")}</span>
        </button>
      )}
    </div>
  );
}
