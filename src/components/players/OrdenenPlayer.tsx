"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, ArrowRight, RefreshCw, RotateCcw, Volume2 } from "lucide-react";
import { OrdenItem, DidacticConfig } from "@/lib/types";
import { husselAnders } from "@/lib/hussel";
import { spraakBeschikbaar, spreekUit, STANDAARD_TAAL } from "@/lib/spraak";
import { Voortgang } from "./FlashcardPlayer";
import { t, tn } from "@/lib/i18n";

interface OrdenenPlayerProps {
  items: OrdenItem[];
  didacticConfig?: DidacticConfig;
  /** Woorden van een zin naast elkaar, of stappen van een procedure onder elkaar. */
  weergave: "zin" | "stappen";
}

/*
 * Op volgorde zetten door te tikken, niet door te slepen.
 *
 * Slepen werkt slecht op een smartphone, en juist daar oefenen cursisten. Tikken doet
 * hetzelfde werk: je tikt een deel aan om het toe te voegen, en tikt het in je antwoord
 * aan om het terug te halen. Zo blijft de werkvorm op elk toestel bruikbaar (UDL).
 */
export function OrdenenPlayer({ items, didacticConfig, weergave }: OrdenenPlayerProps) {
  const bruikbaar = useMemo(() => items.filter((i) => i.delen.length > 1), [items]);

  const [rij, setRij] = useState<OrdenItem[]>(bruikbaar);
  const [index, setIndex] = useState(0);
  const [gekozen, setGekozen] = useState<number[]>([]);
  const [gecontroleerd, setGecontroleerd] = useState(false);
  const [juistAantal, setJuistAantal] = useState(0);
  const [foutIds, setFoutIds] = useState<string[]>([]);
  const [klaar, setKlaar] = useState(false);

  const taal = didacticConfig?.spraakTaal ?? STANDAARD_TAAL;
  const huidig = rij[index];

  // De door elkaar gehaalde delen; per opgave één keer bepaald.
  const [volgorde, setVolgorde] = useState<number[]>([]);
  useEffect(() => {
    if (!huidig) return;
    setVolgorde(husselAnders(huidig.delen.map((_, i) => i)));
    setGekozen([]);
    setGecontroleerd(false);
  }, [huidig]);

  if (bruikbaar.length === 0) {
    return (
      <p className="max-w-lg mx-auto text-sm text-slate-600 bg-white border border-slate-200 rounded-2xl p-8 text-center">
        {t("oefenen.ordenen.leeg")}
      </p>
    );
  }

  const herstel = (nieuweRij: OrdenItem[]) => {
    setRij(nieuweRij);
    setIndex(0);
    setJuistAantal(0);
    setFoutIds([]);
    setKlaar(false);
    setGekozen([]);
    setGecontroleerd(false);
  };

  if (klaar) {
    const foute = bruikbaar.filter((i) => foutIds.includes(i.id));
    const score = Math.round((juistAantal / rij.length) * 100);
    const zin = weergave === "zin";

    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 text-center max-w-lg mx-auto u-pop">
        <CheckCircle2 className="w-10 h-10 text-merk mx-auto mb-3" />
        <h3 className="text-xl font-extrabold text-merk-900 mb-1">{t("oefenen.speler.rond")}</h3>
        <p className="text-sm text-slate-600 mb-6">{t("oefenen.speler.geenPunten")}</p>

        <div className="p-6 rounded-xl bg-slate-50 mb-6">
          <span className="text-4xl font-extrabold text-merk-900 block mb-1">{score}%</span>
          <span className="text-sm text-slate-600">
            {tn(zin ? "oefenen.ordenen.scoreZin" : "oefenen.ordenen.scoreStappen", rij.length, { juist: juistAantal })}
          </span>
        </div>

        {foute.length > 0 && (
          <button
            onClick={() => herstel(foute)}
            className="w-full py-3 mb-3 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>
              {tn(zin ? "oefenen.ordenen.opnieuwZin" : "oefenen.ordenen.opnieuwStappen", foute.length)}
            </span>
          </button>
        )}

        <button
          onClick={() => herstel(bruikbaar)}
          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
        >
          {t("oefenen.speler.beginOpnieuw")}
        </button>
      </div>
    );
  }

  if (!huidig) return null;

  const beschikbaar = volgorde.filter((i) => !gekozen.includes(i));
  const compleet = gekozen.length === huidig.delen.length;
  const allesJuist = gecontroleerd && gekozen.every((deel, positie) => deel === positie);

  const controleer = () => {
    if (gecontroleerd || !compleet) return;
    setGecontroleerd(true);
    if (gekozen.every((deel, positie) => deel === positie)) setJuistAantal((n) => n + 1);
    else setFoutIds((lijst) => [...lijst, huidig.id]);
  };

  const volgende = () => {
    if (index + 1 < rij.length) setIndex(index + 1);
    else setKlaar(true);
  };

  const juisteTekst = huidig.delen.join(weergave === "zin" ? " " : " · ");

  return (
    <div className="max-w-xl mx-auto">
      <Voortgang
        label={t(weergave === "zin" ? "oefenen.ordenen.voortgangZin" : "oefenen.ordenen.voortgangStappen", {
          nr: index + 1,
          totaal: rij.length,
        })}
        percentage={Math.round(((index + 1) / rij.length) * 100)}
      />

      <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-500 block">
              {weergave === "zin"
                ? t("oefenen.ordenen.opdrachtZin")
                : t("oefenen.ordenen.opdrachtStappen")}
            </span>
            {huidig.opdracht && (
              <h2 className="text-base font-bold text-merk-900 mt-1 leading-snug">
                {huidig.opdracht}
              </h2>
            )}
          </div>

          {gecontroleerd && weergave === "zin" && spraakBeschikbaar() && (
            <button
              onClick={() => spreekUit(huidig.delen.join(" "), taal)}
              className="p-2 rounded-lg text-merk hover:bg-merk-50 transition-colors shrink-0"
              title={t("oefenen.ordenen.luister")}
              aria-label={t("oefenen.ordenen.luister")}
            >
              <Volume2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Jouw antwoord */}
        <div
          className={`min-h-20 rounded-xl border-2 border-dashed p-3 mb-4 transition-colors ${
            gecontroleerd
              ? allesJuist
                ? "border-emerald-300 bg-emerald-50/50"
                : "border-rose-300 bg-rose-50/50"
              : "border-slate-300 bg-slate-50"
          } ${weergave === "zin" ? "flex flex-wrap gap-2 items-start" : "space-y-2"}`}
        >
          {gekozen.length === 0 && (
            <span className="text-sm text-slate-400">
              {t("oefenen.ordenen.tikEerste")}
            </span>
          )}

          {gekozen.map((deel, positie) => {
            const opJuistePlek = deel === positie;
            const stijl = !gecontroleerd
              ? "bg-white border-merk text-merk-900"
              : opJuistePlek
                ? "bg-emerald-100 border-emerald-400 text-emerald-900"
                : "bg-rose-100 border-rose-400 text-rose-900";

            return (
              <button
                key={`${deel}-${positie}`}
                onClick={() => !gecontroleerd && setGekozen(gekozen.filter((_, i) => i !== positie))}
                disabled={gecontroleerd}
                className={`${weergave === "zin" ? "" : "w-full text-left flex items-center gap-2"} px-3 py-2 rounded-lg border font-semibold text-sm transition-colors ${stijl}`}
              >
                {weergave === "stappen" && (
                  <span className="w-6 h-6 shrink-0 rounded-full bg-white/70 text-xs font-bold flex items-center justify-center">
                    {positie + 1}
                  </span>
                )}
                <span>{huidig.delen[deel]}</span>
              </button>
            );
          })}
        </div>

        {/* Wat er nog te kiezen valt */}
        {!gecontroleerd && (
          <>
            <div className={weergave === "zin" ? "flex flex-wrap gap-2" : "space-y-2"}>
              {beschikbaar.map((deel) => (
                <button
                  key={deel}
                  onClick={() => setGekozen([...gekozen, deel])}
                  className={`${weergave === "zin" ? "" : "w-full text-left"} px-3 py-2 rounded-lg border border-slate-200 bg-white hover:border-merk text-sm font-semibold text-slate-800 transition-colors`}
                >
                  {huidig.delen[deel]}
                </button>
              ))}
            </div>

            {gekozen.length > 0 && (
              <button
                onClick={() => setGekozen([])}
                className="mt-4 text-xs font-bold text-slate-500 hover:text-merk-900 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t("oefenen.ordenen.beginDezeOpnieuw")}</span>
              </button>
            )}
          </>
        )}
      </div>

      {gecontroleerd && (
        <div
          className={`p-5 rounded-2xl mb-5 u-rise ${
            allesJuist ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm mb-2">
            {allesJuist ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>{allesJuist ? t("oefenen.ordenen.juisteVolgorde") : t("oefenen.ordenen.nietJuist")}</span>
          </div>
          {!allesJuist && <p className="text-sm leading-relaxed">{t("oefenen.ordenen.zoHoorthet", { tekst: juisteTekst })}</p>}
        </div>
      )}

      {!gecontroleerd ? (
        <button
          disabled={!compleet}
          onClick={controleer}
          className="w-full py-3.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm transition-colors"
        >
          {t("oefenen.speler.controleer")}
        </button>
      ) : (
        <button
          onClick={volgende}
          className="w-full py-3.5 rounded-xl bg-merk-900 hover:bg-merk-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 u-rise"
        >
          <span>{index + 1 < rij.length ? t("algemeen.volgende") : t("oefenen.speler.resultaat")}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
