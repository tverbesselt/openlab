"use client";

import React, { useState } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { Exercise, WedstrijdInstellingen } from "@/lib/types";
import { MAX_TEAMS, STANDAARD_INSTELLINGEN } from "@/lib/wedstrijd";
import { t, tn } from "@/lib/i18n";

const TIJDEN = [10, 20, 30, 60, 90, 120];

/**
 * De keuzes voor één wedstrijd. De standaard is bewust rustig: punten voor een juist
 * antwoord, zonder snelheidsbonus (zie docs/nl/WETENSCHAPPELIJKE_BASIS.md).
 */
export function WedstrijdOpzet({
  oefening,
  bezig,
  onStart,
  onAnnuleer,
}: {
  oefening: Exercise;
  bezig: boolean;
  onStart: (instellingen: WedstrijdInstellingen) => void;
  onAnnuleer: () => void;
}) {
  const [inst, setInst] = useState<WedstrijdInstellingen>(STANDAARD_INSTELLINGEN);
  const zet = (wijziging: Partial<WedstrijdInstellingen>) => setInst((i) => ({ ...i, ...wijziging }));
  const aantal = oefening.content.questions?.length ?? 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onStart(inst);
      }}
      className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6"
    >
      <div>
        <p className="text-xs font-bold text-slate-500 mb-1">{t("live.opzet.label")}</p>
        <h2 className="font-bold text-lg text-merk-900">{oefening.title}</h2>
        <p className="text-sm text-slate-600">
          {tn("live.opzet.aantal", aantal)}
        </p>
      </div>

      <Groep titel={t("live.opzet.spelvorm")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Keuzekaart
            actief={inst.spelvorm === "rustig"}
            onClick={() => zet({ spelvorm: "rustig" })}
            titel={t("live.opzet.rustig")}
            label={t("live.opzet.aanbevolen")}
            uitleg={t("live.opzet.rustigUitleg")}
          />
          <Keuzekaart
            actief={inst.spelvorm === "klassiek"}
            onClick={() => zet({ spelvorm: "klassiek", seconden: inst.seconden || 30 })}
            titel={t("live.opzet.klassiek")}
            uitleg={t("live.opzet.klassiekUitleg")}
          />
        </div>
      </Groep>

      <Groep titel={t("live.opzet.tijd")}>
        <div className="flex flex-wrap gap-2">
          {TIJDEN.map((s) => (
            <Chip key={s} actief={inst.seconden === s} onClick={() => zet({ seconden: s })}>
              {s < 60
                ? t("live.opzet.seconden", { s })
                : s % 60
                  ? t("live.opzet.minutenSeconden", { m: Math.floor(s / 60), s: s % 60 })
                  : t("live.opzet.minuten", { m: s / 60 })}
            </Chip>
          ))}
          {inst.spelvorm === "rustig" && (
            <Chip actief={inst.seconden === 0} onClick={() => zet({ seconden: 0 })}>
              {t("live.opzet.zelfAfsluiten")}
            </Chip>
          )}
        </div>
        {inst.spelvorm === "klassiek" && (
          <p className="text-xs text-slate-500 mt-2">{t("live.opzet.klassiekTijd")}</p>
        )}
      </Groep>

      <Groep titel={t("live.opzet.reeks")}>
        <div className="flex flex-wrap gap-2">
          <Chip actief={inst.reeksbonus} onClick={() => zet({ reeksbonus: true })}>
            {t("algemeen.aan")}
          </Chip>
          <Chip actief={!inst.reeksbonus} onClick={() => zet({ reeksbonus: false })}>
            {t("algemeen.uit")}
          </Chip>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {t("live.opzet.reeksUitleg")}
        </p>
      </Groep>

      <Groep titel={t("live.opzet.teams")}>
        <div className="flex flex-wrap gap-2">
          <Chip actief={inst.teams === 0} onClick={() => zet({ teams: 0 })}>
            {t("live.opzet.iederVoorZich")}
          </Chip>
          {Array.from({ length: MAX_TEAMS - 1 }, (_, i) => i + 2).map((n) => (
            <Chip key={n} actief={inst.teams === n} onClick={() => zet({ teams: n })}>
              {tn("live.opzet.aantalTeams", n)}
            </Chip>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {t("live.opzet.teamsUitleg")}
        </p>
      </Groep>

      <Groep titel={t("live.opzet.tussenstand")}>
        <div className="flex flex-wrap gap-2">
          <Chip actief={inst.tussenstand === "elkeVraag"} onClick={() => zet({ tussenstand: "elkeVraag" })}>
            {t("live.opzet.naElkeVraag")}
          </Chip>
          <Chip actief={inst.tussenstand === "einde"} onClick={() => zet({ tussenstand: "einde" })}>
            {t("live.opzet.alleenEinde")}
          </Chip>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {t("live.opzet.tussenstandUitleg")}
        </p>
      </Groep>

      <button
        type="submit"
        disabled={bezig || aantal === 0}
        className="w-full py-3.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-60 text-white font-bold text-base transition-colors flex items-center justify-center gap-2"
      >
        <Play className="w-5 h-5 fill-current" />
        <span>{bezig ? t("live.opzet.openen") : t("live.opzet.open")}</span>
      </button>

      <button
        type="button"
        onClick={onAnnuleer}
        className="text-xs font-bold text-slate-500 hover:text-merk-900 flex items-center gap-1 mx-auto"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t("live.opzet.andereQuiz")}</span>
      </button>
    </form>
  );
}

function Groep({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="block text-sm font-bold text-slate-800 mb-2">{titel}</legend>
      {children}
    </fieldset>
  );
}

function Chip({
  actief,
  onClick,
  children,
}: {
  actief: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actief}
      className={`px-4 py-2 rounded-xl border text-sm font-bold transition-colors ${
        actief
          ? "bg-merk-800 text-white border-merk-800"
          : "bg-white text-slate-700 border-slate-200 hover:border-merk"
      }`}
    >
      {children}
    </button>
  );
}

function Keuzekaart({
  actief,
  onClick,
  titel,
  label,
  uitleg,
}: {
  actief: boolean;
  onClick: () => void;
  titel: string;
  label?: string;
  uitleg: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actief}
      className={`text-left p-4 rounded-xl border-2 transition-colors ${
        actief ? "border-merk-800 bg-merk-50" : "border-slate-200 bg-white hover:border-merk"
      }`}
    >
      <span className="flex items-center gap-2 mb-1">
        <span className="font-bold text-slate-900">{titel}</span>
        {label && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-merk-800 text-white">
            {label}
          </span>
        )}
      </span>
      <span className="block text-xs text-slate-600 leading-relaxed">{uitleg}</span>
    </button>
  );
}
