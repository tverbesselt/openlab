"use client";

import React, { useMemo, useRef, useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, RefreshCw, Volume2 } from "lucide-react";
import { FillBlankItem, DidacticConfig } from "@/lib/types";
import { beoordeel, ontleedInvulzin, volledigeZin, type Oordeel } from "@/lib/invulzin";
import { spraakBeschikbaar, spreekUit, zwijg, STANDAARD_TAAL } from "@/lib/spraak";
import { Voortgang } from "./FlashcardPlayer";
import { t, tn } from "@/lib/i18n";

interface FillBlankPlayerProps {
  items: FillBlankItem[];
  didacticConfig?: DidacticConfig;
}

/**
 * Invuloefening: de cursist vult de ontbrekende woorden aan in de zin zelf. Het antwoord
 * staat waar het hoort, dus er is geen heen-en-weer kijken tussen zin en antwoordlijst.
 */
export function FillBlankPlayer({ items, didacticConfig }: FillBlankPlayerProps) {
  const bruikbaar = useMemo(
    () => items.filter((i) => ontleedInvulzin(i.textWithBlanks).some((s) => s.soort === "gat")),
    [items]
  );

  const [rij, setRij] = useState<FillBlankItem[]>(bruikbaar);
  const [index, setIndex] = useState(0);
  const [ingevuld, setIngevuld] = useState<string[]>([]);
  const [oordelen, setOordelen] = useState<Oordeel[] | null>(null);
  const [juistAantal, setJuistAantal] = useState(0);
  const [foutIds, setFoutIds] = useState<string[]>([]);
  const [klaar, setKlaar] = useState(false);
  const eersteVeld = useRef<HTMLInputElement>(null);

  const taal = didacticConfig?.spraakTaal ?? STANDAARD_TAAL;
  const huidig = rij[index];
  const stukken = useMemo(
    () => (huidig ? ontleedInvulzin(huidig.textWithBlanks) : []),
    [huidig]
  );
  const gaten = stukken.filter((s) => s.soort === "gat");

  const herstel = (nieuweRij: FillBlankItem[]) => {
    zwijg();
    setRij(nieuweRij);
    setIndex(0);
    setIngevuld([]);
    setOordelen(null);
    setJuistAantal(0);
    setFoutIds([]);
    setKlaar(false);
  };

  const controleer = () => {
    if (oordelen || !huidig) return;
    const uitslag = gaten.map((gat) =>
      gat.soort === "gat" ? beoordeel(ingevuld[gat.nummer] ?? "", gat.antwoorden) : "fout"
    );
    setOordelen(uitslag);

    if (uitslag.every((o) => o === "juist")) setJuistAantal((n) => n + 1);
    else setFoutIds((lijst) => [...lijst, huidig.id]);
  };

  const volgende = () => {
    zwijg();
    setIngevuld([]);
    setOordelen(null);
    if (index + 1 < rij.length) setIndex(index + 1);
    else setKlaar(true);
    // Meteen kunnen doortypen zonder eerst te klikken.
    setTimeout(() => eersteVeld.current?.focus(), 50);
  };

  if (bruikbaar.length === 0) {
    return (
      <p className="max-w-lg mx-auto text-sm text-slate-600 bg-white border border-slate-200 rounded-2xl p-8 text-center">
        {t("spelers.invullen.geenZinnen")}
      </p>
    );
  }

  if (klaar) {
    const fouteZinnen = bruikbaar.filter((i) => foutIds.includes(i.id));
    const score = Math.round((juistAantal / rij.length) * 100);

    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 text-center max-w-lg mx-auto u-pop">
        <CheckCircle2 className="w-10 h-10 text-merk mx-auto mb-3" />
        <h3 className="text-xl font-extrabold text-merk-900 mb-1">{t("spelers.gemeen.rond")}</h3>
        <p className="text-sm text-slate-600 mb-6">{t("spelers.invullen.telNiet")}</p>

        <div className="p-6 rounded-xl bg-slate-50 mb-6">
          <span className="text-4xl font-extrabold text-merk-900 block mb-1">{score}%</span>
          <span className="text-sm text-slate-600">
            {tn("spelers.invullen.juistAantal", rij.length, { juist: juistAantal })}
          </span>
        </div>

        {fouteZinnen.length > 0 && (
          <button
            onClick={() => herstel(fouteZinnen)}
            className="w-full py-3 mb-3 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>
              {tn("spelers.invullen.enkelFoute", fouteZinnen.length)}
            </span>
          </button>
        )}

        <button
          onClick={() => herstel(bruikbaar)}
          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
        >
          {t("spelers.invullen.alleOpnieuw")}
        </button>
      </div>
    );
  }

  if (!huidig) return null;

  const allesIngevuld = gaten.every((g) => g.soort === "gat" && (ingevuld[g.nummer] ?? "").trim());
  const allesJuist = oordelen?.every((o) => o === "juist") ?? false;

  return (
    <div className="max-w-xl mx-auto">
      <Voortgang
        label={t("spelers.invullen.zinVan", { nr: index + 1, n: rij.length })}
        percentage={Math.round(((index + 1) / rij.length) * 100)}
      />

      <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="text-xs font-bold text-slate-500">
            {tn("spelers.invullen.vulAan", gaten.length)}
          </span>
          {oordelen && spraakBeschikbaar() && (
            <button
              onClick={() => spreekUit(volledigeZin(huidig.textWithBlanks), taal)}
              className="p-2 rounded-lg text-merk hover:bg-merk-50 transition-colors shrink-0"
              title={t("spelers.invullen.luisterZin")}
            >
              <Volume2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* De zin zelf, met de invulvelden op hun plaats in de tekst */}
        <p className="text-lg leading-loose text-slate-900">
          {stukken.map((stuk, i) =>
            stuk.soort === "tekst" ? (
              <span key={i}>{stuk.waarde}</span>
            ) : (
              <Gat
                key={i}
                ref={stuk.nummer === 0 ? eersteVeld : undefined}
                nummer={stuk.nummer}
                totaal={gaten.length}
                waarde={ingevuld[stuk.nummer] ?? ""}
                oordeel={oordelen?.[stuk.nummer]}
                onWijzig={(waarde) => {
                  const kopie = [...ingevuld];
                  kopie[stuk.nummer] = waarde;
                  setIngevuld(kopie);
                }}
                onEnter={() => (oordelen ? volgende() : controleer())}
              />
            )
          )}
        </p>
      </div>

      {/* Directe feedback: wat stond er, en waar zat het verschil */}
      {oordelen && (
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
            <span>{allesJuist ? t("spelers.invullen.helemaalJuist") : t("spelers.gemeen.nogNietJuist")}</span>
          </div>

          {!allesJuist && (
            <ul className="space-y-1.5 text-sm">
              {gaten.map((gat, i) => {
                if (gat.soort !== "gat" || oordelen[i] === "juist") return null;
                const juisteVorm = gat.antwoorden[0];
                return (
                  <li key={i} className="flex items-start gap-2">
                    {oordelen[i] === "accenten" ? (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    ) : (
                      <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    )}
                    <span>
                      {gaten.length > 1 && <strong>{t("spelers.invullen.woordNr", { nr: gat.nummer + 1 })}</strong>}
                      {oordelen[i] === "accenten"
                        ? t("spelers.invullen.accenten", { woord: juisteVorm })
                        : t("spelers.invullen.juisteIs", { woord: juisteVorm })}
                      {gat.antwoorden.length > 1 && (
                        <span className="text-slate-600">
                          {" "}
                          {t("spelers.invullen.ookGoed", {
                            lijst: gat.antwoorden.slice(1).map((a) => `"${a}"`).join(", "),
                          })}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {huidig.answers.length === 0 && allesJuist && (
            <p className="text-sm">{t("spelers.invullen.volledigJuist")}</p>
          )}
        </div>
      )}

      {!oordelen ? (
        <button
          disabled={!allesIngevuld}
          onClick={controleer}
          className="w-full py-3.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm transition-colors"
        >
          {t("spelers.gemeen.controleer")}
        </button>
      ) : (
        <button
          onClick={volgende}
          className="w-full py-3.5 rounded-xl bg-merk-900 hover:bg-merk-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 u-rise"
        >
          <span>{index + 1 < rij.length ? t("spelers.invullen.volgendeZin") : t("spelers.gemeen.resultaat")}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/** Eén invulveld midden in de zin. Groeit mee met wat de cursist typt. */
const Gat = React.forwardRef<
  HTMLInputElement,
  {
    nummer: number;
    totaal: number;
    waarde: string;
    oordeel?: Oordeel;
    onWijzig: (waarde: string) => void;
    onEnter: () => void;
  }
>(function Gat({ nummer, totaal, waarde, oordeel, onWijzig, onEnter }, ref) {
  let stijl = "bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-merk";
  if (oordeel === "juist") stijl = "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold";
  else if (oordeel === "accenten") stijl = "bg-amber-50 border-amber-400 text-amber-900 font-bold";
  else if (oordeel === "fout") stijl = "bg-rose-50 border-rose-400 text-rose-900 font-bold";

  return (
    <input
      ref={ref}
      type="text"
      value={waarde}
      disabled={!!oordeel}
      onChange={(e) => onWijzig(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onEnter();
        }
      }}
      // Automatische hulp uit: anders vult de telefoon het antwoord in.
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      aria-label={totaal === 1 ? t("spelers.invullen.gatEen") : t("spelers.invullen.gatNr", { nr: nummer + 1, n: totaal })}
      style={{ width: `${Math.max(8, waarde.length + 2)}ch` }}
      className={`inline-block mx-1 px-2 py-1 align-baseline text-center text-base rounded-lg border-2 border-dashed transition-colors focus:outline-none ${stijl}`}
    />
  );
});
