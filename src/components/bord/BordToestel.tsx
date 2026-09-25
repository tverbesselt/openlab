"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock, Lock, UserRound } from "lucide-react";
import { opslag, apparaatId } from "@/lib/opslag";
import { BordInstellingen, BordItem, LiveSessie } from "@/lib/types";
import {
  MAX_NAAM,
  bewaarNaam,
  bewaardeNaam,
  eigenBijdragen,
  nieuwBordId,
  onthoudBijdrage,
  ordenBord,
  tekstGrens,
} from "@/lib/bord";
import { BordToevoegen, type NieuwKaartje } from "./BordToevoegen";
import { Muur } from "./BordLeraar";
import { t, tn } from "@/lib/i18n";
import { tr } from "@/lib/i18n/rijk";

/**
 * De cursist op het whiteboard: iets toevoegen van wat de leraar toelaat, en (als de leraar
 * dat wil) het bord live meevolgen. Wat nog op goedkeuring wacht, ziet alleen hijzelf.
 */
export function BordToestel({ code, sessie }: { code: string; sessie: LiveSessie }) {
  const apparaat = useRef(apparaatId()).current;
  const inst = sessie.bord as BordInstellingen;
  const [items, setItems] = useState<BordItem[]>([]);
  const [eigen, setEigen] = useState<BordItem[]>([]);
  const [naam, setNaam] = useState("");
  const [naamKlaar, setNaamKlaar] = useState(false);
  const [melding, setMelding] = useState("");

  useEffect(() => {
    setEigen(eigenBijdragen(code));
    const bewaard = bewaardeNaam();
    setNaam(bewaard);
    setNaamKlaar(Boolean(bewaard));
  }, [code]);

  // Alleen volgen als de leraar het bord op de toestellen toont; anders weigeren de regels.
  useEffect(() => {
    if (!inst.zichtbaar || sessie.status !== "actief") {
      setItems([]);
      return;
    }
    return opslag.volgBord(code, false, setItems, () => setItems([]));
  }, [code, inst.zichtbaar, sessie.status]);

  useEffect(() => {
    if (!melding) return;
    const klok = setTimeout(() => setMelding(""), 4000);
    return () => clearTimeout(klok);
  }, [melding]);

  const zichtbareIds = useMemo(() => new Set(items.map((i) => i.id)), [items]);
  const eigenIds = useMemo(() => new Set(eigen.map((i) => i.id)), [eigen]);
  // Wat van mij is en (nog) niet op het bord staat: wacht op de leraar.
  const wachtend = inst.nakijken ? eigen.filter((i) => !zichtbareIds.has(i.id)) : [];
  const opGebruikt = inst.maxPerCursist > 0 && eigen.length >= inst.maxPerCursist;

  const verstuur = async (kaartje: NieuwKaartje) => {
    const item: BordItem = {
      ...kaartje,
      id: nieuwBordId(),
      apparaat,
      ...(inst.namen === "naam" && naam ? { auteur: naam } : {}),
      status: inst.nakijken ? "wacht" : "zichtbaar",
      op: new Date().toISOString(),
    };
    await opslag.stuurBordItem(code, item);
    onthoudBijdrage(code, item);
    setEigen((e) => [...e, item]);
    setMelding(inst.nakijken ? t("bord.toestel.verstuurdNakijken") : t("bord.toestel.staatErop"));
  };

  if (sessie.status === "afgesloten") {
    return (
      <Kader>
        <CheckCircle2 className="w-10 h-10 text-merk mx-auto mb-3" />
        <h1 className="text-xl font-extrabold text-merk-900 mb-1">{t("bord.toestel.gesloten")}</h1>
        <p className="text-sm text-slate-600">{t("bord.toestel.bedankt")}</p>
      </Kader>
    );
  }

  if (inst.namen === "naam" && !naamKlaar) {
    return (
      <Kader>
        <UserRound className="w-10 h-10 text-merk mx-auto mb-3" />
        <h1 className="text-xl font-extrabold text-merk-900 mb-1">{t("bord.toestel.hoeHeetJe")}</h1>
        <p className="text-sm text-slate-600 mb-5">{t("bord.toestel.naamUitleg")}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const schoon = naam.replace(/\s+/g, " ").trim().slice(0, MAX_NAAM);
            if (!schoon) return;
            setNaam(schoon);
            bewaarNaam(schoon);
            setNaamKlaar(true);
          }}
          className="space-y-3"
        >
          <input
            value={naam}
            onChange={(e) => setNaam(e.target.value.slice(0, MAX_NAAM))}
            placeholder={t("bord.toestel.voornaam")}
            aria-label={t("bord.toestel.naam")}
            autoComplete="given-name"
            className="w-full px-4 py-3 text-center text-lg rounded-xl border border-veldrand bg-white focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!naam.trim()}
            className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm"
          >
            {t("algemeen.verder")}
          </button>
        </form>
      </Kader>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 u-fade">
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-xs uppercase font-bold tracking-widest text-merk-800 mb-1">{t("bord.whiteboard")}</p>
        <h1 className="text-xl sm:text-2xl font-extrabold text-merk-900 leading-tight mb-4 break-words">
          {sessie.vraag || t("bord.toestel.zetIets")}
        </h1>

        {!inst.open ? (
          <p className="flex items-start gap-2 text-sm font-semibold text-amber-900 bg-amber-50 rounded-xl px-3 py-3">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            {t("bord.toestel.dicht")}
          </p>
        ) : opGebruikt ? (
          <p className="flex items-start gap-2 text-sm font-semibold text-merk-900 bg-merk-50 rounded-xl px-3 py-3">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            {tn("bord.toestel.opGebruikt", inst.maxPerCursist)}
          </p>
        ) : (
          <BordToevoegen
            soorten={inst.soorten}
            maxTekens={tekstGrens(inst)}
            maxSeconden={inst.maxSeconden}
            kolommen={inst.kolommen}
            onVerstuur={verstuur}
          />
        )}

        {melding && (
          <p role="status" className="mt-3 text-sm font-bold text-merk-900 bg-merk-50 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {melding}
          </p>
        )}

        {inst.namen === "naam" && naam && (
          <p className="mt-3 text-xs text-slate-500">
            {tr("bord.toestel.jeStaat", { b: (s) => <strong>{s}</strong> }, { naam })}{" "}
            <button onClick={() => setNaamKlaar(false)} className="underline font-semibold hover:text-merk-900">
              {t("bord.toestel.andereNaam")}
            </button>
          </p>
        )}
      </div>

      {wachtend.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600 mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {t("bord.toestel.wachtOpLeraar")}
          </h2>
          <ul className="space-y-2">
            {wachtend.map((i) => (
              <li key={i.id} className="text-sm bg-white border border-dashed border-amber-400 rounded-xl px-3 py-2.5 text-slate-700 break-words">
                {i.tekst || (i.soort === "audio" ? t("bord.toestel.jeOpname") : i.soort === "video" ? t("bord.toestel.jeFilmpje") : i.soort === "tekening" ? t("bord.toestel.jeTekening") : t("bord.toestel.jeFoto"))}
              </li>
            ))}
          </ul>
        </section>
      )}

      {inst.zichtbaar ? (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600 mb-3">
            {t("bord.toestel.opHetBord", { n: items.length })}
          </h2>
          <Muur
            items={ordenBord(items)}
            kolommen={inst.kolommen}
            eigen={(i) => eigenIds.has(i.id)}
            leeg={t("bord.toestel.leeg")}
          />
        </section>
      ) : (
        <p className="text-sm text-slate-600 text-center py-6">
          {t("bord.toestel.vooraan")}
        </p>
      )}
    </div>
  );
}

function Kader({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-sm mx-auto py-8 u-fade">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">{children}</div>
    </div>
  );
}
