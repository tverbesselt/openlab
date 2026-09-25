"use client";

import React, { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { EXIT_TICKET_SETS, type Vragenset } from "@/lib/studietips";
import { t } from "@/lib/i18n";
import { Veld, Foutmelding, MaakKnop, Toelichting, INVOER } from "./Velden";
import type { VormProps } from "./NieuweVormen";

const MAX_VRAGEN = 5;

/**
 * Een exit ticket: een paar korte vragen op het einde van de les. De leraar kiest uit drie
 * sets standaardvragen uit Studeren met succes (ophalen, inschatten, vooruitkijken) of typt
 * er zelf een. Cursisten antwoorden anoniem; de antwoorden verschijnen bij de oefening.
 */
export function ExitTicketVorm(p: VormProps) {
  const [titel, setTitel] = useState("");
  const [vragen, setVragen] = useState<string[]>([]);

  const ingevuld = vragen.map((v) => v.trim()).filter(Boolean);
  const vol = vragen.length >= MAX_VRAGEN;

  /*
    Standaardvragen staan altijd in dezelfde volgorde, ongeacht de volgorde waarin je de sets
    aanklikt: eerst ophalen, dan inschatten, dan vooruitkijken. Eigen vragen komen erna.
  */
  const STANDAARD = EXIT_TICKET_SETS.flatMap((s) => s.vragen);

  const voegSetToe = (set: Vragenset) => {
    const nieuw = [...vragen];
    for (const vraag of set.vragen) {
      if (nieuw.length >= MAX_VRAGEN) break;
      if (!nieuw.some((v) => v.trim() === vraag)) nieuw.push(vraag);
    }
    const plaats = (v: string) => {
      const i = STANDAARD.indexOf(v);
      return i === -1 ? STANDAARD.length : i;
    };
    setVragen(nieuw.map((v, i) => ({ v, i })).sort((a, b) => plaats(a.v) - plaats(b.v) || a.i - b.i).map((x) => x.v));
  };

  const heeftSet = (set: Vragenset) => set.vragen.every((v) => vragen.includes(v));

  const maak = (e: React.FormEvent) => {
    e.preventDefault();
    if (ingevuld.length === 0) {
      p.setFout(t("maken.exitticket.fout"));
      return;
    }

    p.bewaar([
      {
        ...p.basis(),
        id: `exit-${Date.now()}`,
        title: titel.trim(),
        description: t("maken.exitticket.beschrijving"),
        category: "collaboration",
        didacticGoal: "reflect",
        type: "exitticket",
        tags: [t("maken.tags.exitticket"), t("maken.tags.reflectie")],
        content: { exitTicketPrompts: ingevuld },
        didacticConfig: {
          showImmediateFeedback: false,
          allowRetryMissed: false,
          enableGamification: false,
        },
      },
    ]);
  };

  return (
    <form onSubmit={maak} className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5">
      <Veld label={t("maken.exitticket.titel")} hint={t("maken.exitticket.titelVoorbeeld")}>
        <input
          type="text"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder={t("maken.exitticket.titel")}
          required
          className={INVOER}
        />
      </Veld>

      <div>
        <span className="block text-sm font-bold text-slate-800 mb-1">{t("maken.exitticket.standaard")}</span>
        <span className="block text-xs text-slate-500 mb-2">
          {t("maken.exitticket.standaardUitleg")}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {EXIT_TICKET_SETS.map((set) => {
            const gekozen = heeftSet(set);
            return (
              <button
                key={set.id}
                type="button"
                onClick={() => voegSetToe(set)}
                disabled={gekozen || vol}
                aria-pressed={gekozen}
                className={`text-left p-3 rounded-xl border transition-colors disabled:cursor-default ${
                  gekozen
                    ? "bg-merk-50 border-merk"
                    : "bg-white border-slate-200 hover:border-merk disabled:opacity-50"
                }`}
              >
                <span className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                  {gekozen ? (
                    <Check className="w-3.5 h-3.5 text-merk" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  {set.label}
                </span>
                <span className="block text-xs text-slate-600 mt-0.5">{set.uitleg}</span>
              </button>
            );
          })}
        </div>
      </div>

      {vragen.length > 0 && (
        <div className="space-y-2">
          <span className="block text-sm font-bold text-slate-800">{t("maken.exitticket.jeVragen")}</span>
          {vragen.map((vraag, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={vraag}
                onChange={(e) =>
                  setVragen(vragen.map((v, i) => (i === index ? e.target.value : v)))
                }
                aria-label={t("maken.veld.vraagN", { n: index + 1 })}
                placeholder={t("maken.veld.jeVraag")}
                className={INVOER}
              />
              <button
                type="button"
                onClick={() => setVragen(vragen.filter((_, i) => i !== index))}
                className="p-2.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                aria-label={t("maken.veld.verwijderVraag", { n: index + 1 })}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!vol && (
        <button
          type="button"
          onClick={() => setVragen([...vragen, ""])}
          className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:border-merk hover:text-merk-900 font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{vragen.length === 0 ? t("maken.exitticket.zelfTypen") : t("maken.veld.nogEenVraag")}</span>
        </button>
      )}

      <Toelichting>
        {t("maken.exitticket.toelichting")}
      </Toelichting>

      {p.bestemming}
      <Foutmelding tekst={p.fout} />
      <MaakKnop bezig={p.bezig} label={t("maken.knop.exitticket")} />
    </form>
  );
}
