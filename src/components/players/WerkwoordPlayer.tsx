"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle2, XCircle, RefreshCw, Volume2 } from "lucide-react";
import { WerkwoordItem, DidacticConfig } from "@/lib/types";
import { hussel } from "@/lib/hussel";
import { vergelijk, isJuist as isJuistGespeld } from "@/lib/dictee";
import { spraakBeschikbaar, spreekUit, STANDAARD_TAAL } from "@/lib/spraak";
import { Voortgang } from "./FlashcardPlayer";
import { t, tn } from "@/lib/i18n";

interface Beurt {
  id: string;
  infinitief: string;
  persoon: string;
  vorm: string;
}

/*
 * Werkwoorden vervoegen. Elke vorm is een aparte beurt, door elkaar gehusseld: zo leert
 * een cursist de vormen echt uit elkaar houden in plaats van het rijtje op te dreunen
 * (interleaving). De vergelijking per letter komt uit het dictee.
 */
export function WerkwoordPlayer({
  items,
  didacticConfig,
}: {
  items: WerkwoordItem[];
  didacticConfig?: DidacticConfig;
}) {
  const alleBeurten = useMemo<Beurt[]>(
    () =>
      hussel(
        items.flatMap((werkwoord) =>
          werkwoord.vormen
            .filter((v) => v.persoon.trim() && v.vorm.trim())
            .map((v, i) => ({
              id: `${werkwoord.id}-${i}`,
              infinitief: werkwoord.infinitief,
              persoon: v.persoon,
              vorm: v.vorm,
            }))
        )
      ),
    [items]
  );

  const [rij, setRij] = useState<Beurt[]>(alleBeurten);
  const [index, setIndex] = useState(0);
  const [antwoord, setAntwoord] = useState("");
  const [gecontroleerd, setGecontroleerd] = useState(false);
  const [juistAantal, setJuistAantal] = useState(0);
  const [foutIds, setFoutIds] = useState<string[]>([]);
  const [klaar, setKlaar] = useState(false);

  const taal = didacticConfig?.spraakTaal ?? STANDAARD_TAAL;
  const huidig = rij[index];
  const juist = gecontroleerd && isJuistGespeld(antwoord, huidig.vorm);

  if (alleBeurten.length === 0) {
    return (
      <p className="max-w-lg mx-auto text-sm text-slate-600 bg-white border border-slate-200 rounded-2xl p-8 text-center">
        {t("oefenen.werkwoorden.leeg")}
      </p>
    );
  }

  const herstel = (nieuweRij: Beurt[]) => {
    setRij(hussel(nieuweRij));
    setIndex(0);
    setAntwoord("");
    setGecontroleerd(false);
    setJuistAantal(0);
    setFoutIds([]);
    setKlaar(false);
  };

  const controleer = () => {
    if (gecontroleerd || !antwoord.trim()) return;
    setGecontroleerd(true);
    if (isJuistGespeld(antwoord, huidig.vorm)) setJuistAantal((n) => n + 1);
    else setFoutIds((lijst) => [...lijst, huidig.id]);
  };

  const volgende = () => {
    setAntwoord("");
    setGecontroleerd(false);
    if (index + 1 < rij.length) setIndex(index + 1);
    else setKlaar(true);
  };

  if (klaar) {
    const foute = alleBeurten.filter((b) => foutIds.includes(b.id));
    const score = Math.round((juistAantal / rij.length) * 100);

    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 text-center max-w-lg mx-auto u-pop">
        <CheckCircle2 className="w-10 h-10 text-merk mx-auto mb-3" />
        <h3 className="text-xl font-extrabold text-merk-900 mb-1">{t("oefenen.speler.rond")}</h3>
        <p className="text-sm text-slate-600 mb-6">{t("oefenen.speler.geenPunten")}</p>

        <div className="p-6 rounded-xl bg-slate-50 mb-6">
          <span className="text-4xl font-extrabold text-merk-900 block mb-1">{score}%</span>
          <span className="text-sm text-slate-600">
            {tn("oefenen.werkwoorden.score", rij.length, { juist: juistAantal })}
          </span>
        </div>

        {foute.length > 0 && (
          <button
            onClick={() => herstel(foute)}
            className="w-full py-3 mb-3 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>
              {tn("oefenen.werkwoorden.opnieuw", foute.length)}
            </span>
          </button>
        )}

        <button
          onClick={() => herstel(alleBeurten)}
          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
        >
          {t("oefenen.werkwoorden.opnieuwAlles")}
        </button>
      </div>
    );
  }

  const stappen = gecontroleerd ? vergelijk(antwoord.trim(), huidig.vorm.trim()) : [];

  return (
    <div className="max-w-lg mx-auto">
      <Voortgang
        label={t("oefenen.werkwoorden.voortgang", { nr: index + 1, totaal: rij.length })}
        percentage={Math.round(((index + 1) / rij.length) * 100)}
      />

      <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center u-pop">
        <p className="text-sm text-slate-600 mb-1">{t("oefenen.werkwoorden.vervoeg")}</p>
        <p className="text-lg font-semibold text-slate-500 mb-1">({huidig.infinitief})</p>
        <p className="text-3xl font-extrabold text-merk-900 mb-5">
          {huidig.persoon} <span className="text-slate-300">...</span>
        </p>

        <input
          type="text"
          value={antwoord}
          disabled={gecontroleerd}
          onChange={(e) => setAntwoord(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (gecontroleerd ? volgende() : controleer())}
          placeholder={t("oefenen.werkwoorden.typVorm")}
          aria-label={t("oefenen.werkwoorden.typVorm")}
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
                  <span>{t("oefenen.speler.juist")}</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>{t("oefenen.werkwoorden.verschil")}</span>
                </>
              )}
            </p>

            {!juist && (
              <p className="font-mono text-xl tracking-wide break-all mb-2">
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
                    {stap.teken}
                  </span>
                ))}
              </p>
            )}

            <p className="text-sm text-slate-700">
              {huidig.persoon} <strong>{huidig.vorm}</strong>
            </p>

            {spraakBeschikbaar() && (
              <button
                onClick={() => spreekUit(`${huidig.persoon} ${huidig.vorm}`, taal)}
                className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-merk-900 hover:bg-merk-50 font-bold text-xs transition-colors"
              >
                <Volume2 className="w-4 h-4" />
                <span>{t("oefenen.werkwoorden.luister")}</span>
              </button>
            )}
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
            {index + 1 < rij.length ? t("oefenen.werkwoorden.volgende") : t("oefenen.speler.resultaat")}
          </button>
        )}
      </div>
    </div>
  );
}
