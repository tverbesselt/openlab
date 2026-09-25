"use client";

import React, { useEffect, useState } from "react";
import { Settings2, X, Check } from "lucide-react";
import { t } from "@/lib/i18n";

/*
 * Weergave-instellingen: grotere tekst, meer contrast, ruimer lezen.
 *
 * Universal Design for Learning vraagt meerdere manieren om dezelfde inhoud aan te bieden.
 * Wie kleine letters moeilijk leest, of last heeft van weinig contrast, hoort niet te
 * moeten inzoomen of een bril te zoeken: hij zet het één keer goed en het blijft staan.
 *
 * De keuze staat in localStorage en wordt als attribuut op <html> gezet. Een klein script
 * in de layout leest ze terug vóór de eerste tekening, zodat de pagina niet omspringt.
 */

import { WEERGAVE_SLEUTEL } from "./weergaveScript";

export interface Weergave {
  tekst: "normaal" | "groot" | "extra";
  contrast: "normaal" | "hoog";
  lezen: "normaal" | "ruim";
}

const STANDAARD: Weergave = { tekst: "normaal", contrast: "normaal", lezen: "normaal" };


function pas(weergave: Weergave) {
  const el = document.documentElement;
  el.toggleAttribute("data-tekst", false);
  if (weergave.tekst !== "normaal") el.setAttribute("data-tekst", weergave.tekst);
  else el.removeAttribute("data-tekst");

  if (weergave.contrast === "hoog") el.setAttribute("data-contrast", "hoog");
  else el.removeAttribute("data-contrast");

  if (weergave.lezen === "ruim") el.setAttribute("data-lezen", "ruim");
  else el.removeAttribute("data-lezen");
}

export function WeergaveKnop() {
  const [open, setOpen] = useState(false);
  const [weergave, setWeergave] = useState<Weergave>(STANDAARD);

  useEffect(() => {
    try {
      const bewaard = localStorage.getItem(WEERGAVE_SLEUTEL);
      if (bewaard) setWeergave({ ...STANDAARD, ...JSON.parse(bewaard) });
    } catch {
      // Geen opslag beschikbaar: dan blijft alles op de standaardweergave staan.
    }
  }, []);

  const wijzig = (verandering: Partial<Weergave>) => {
    const nieuw = { ...weergave, ...verandering };
    setWeergave(nieuw);
    pas(nieuw);
    try {
      localStorage.setItem(WEERGAVE_SLEUTEL, JSON.stringify(nieuw));
    } catch {
      // Niet erg: de instelling geldt dan alleen voor dit bezoek.
    }
  };

  useEffect(() => {
    const sluitBijEscape = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", sluitBijEscape);
    return () => window.removeEventListener("keydown", sluitBijEscape);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 hover:text-merk-900 transition-colors"
      >
        <Settings2 className="w-3.5 h-3.5" />
        <span>{t("tips.weergave.knop")}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs u-fade"
          role="dialog"
          aria-modal="true"
          aria-label={t("tips.weergave.dialoog")}
        >
          {/* Tussenlaag: vangt de klik naast het venster op. Met grote tekst wordt dit
              venster hoger dan een klein scherm, en dan moet er gescrold kunnen worden. */}
          <div
            className="flex min-h-full items-end sm:items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 relative u-pop"
          >
            <button
              onClick={() => setOpen(false)}
              aria-label={t("algemeen.sluiten")}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-5 pr-8">
              <h3 className="font-extrabold text-lg text-merk-900">{t("tips.weergave.knop")}</h3>
              <p className="text-sm text-slate-600">{t("tips.weergave.uitleg")}</p>
            </div>

            <div className="space-y-5">
              <Keuze
                label={t("tips.weergave.tekst")}
                opties={[
                  { id: "normaal", label: t("tips.weergave.normaal") },
                  { id: "groot", label: t("tips.weergave.groot") },
                  { id: "extra", label: t("tips.weergave.extra") },
                ]}
                gekozen={weergave.tekst}
                onKies={(id) => wijzig({ tekst: id as Weergave["tekst"] })}
              />

              <Keuze
                label={t("tips.weergave.contrast")}
                hint={t("tips.weergave.contrastHint")}
                opties={[
                  { id: "normaal", label: t("tips.weergave.normaal") },
                  { id: "hoog", label: t("tips.weergave.hoogContrast") },
                ]}
                gekozen={weergave.contrast}
                onKies={(id) => wijzig({ contrast: id as Weergave["contrast"] })}
              />

              <Keuze
                label={t("tips.weergave.lezen")}
                hint={t("tips.weergave.lezenHint")}
                opties={[
                  { id: "normaal", label: t("tips.weergave.normaal") },
                  { id: "ruim", label: t("tips.weergave.ruim") },
                ]}
                gekozen={weergave.lezen}
                onKies={(id) => wijzig({ lezen: id as Weergave["lezen"] })}
              />
            </div>

            <button
              onClick={() => wijzig(STANDAARD)}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
            >
              {t("tips.weergave.standaard")}
            </button>
          </div>
          </div>
        </div>
      )}
    </>
  );
}

function Keuze({
  label,
  hint,
  opties,
  gekozen,
  onKies,
}: {
  label: string;
  hint?: string;
  opties: { id: string; label: string }[];
  gekozen: string;
  onKies: (id: string) => void;
}) {
  return (
    <div>
      <span className="block text-sm font-bold text-slate-800">{label}</span>
      {hint && <span className="block text-xs text-slate-500 mb-2">{hint}</span>}
      <div className={`grid gap-2 ${opties.length === 3 ? "grid-cols-3" : "grid-cols-2"} ${hint ? "" : "mt-2"}`}>
        {opties.map((optie) => {
          const actief = gekozen === optie.id;
          return (
            <button
              key={optie.id}
              onClick={() => onKies(optie.id)}
              aria-pressed={actief}
              className={`py-2.5 px-2 rounded-xl border font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                actief
                  ? "bg-merk-800 text-white border-merk-800"
                  : "bg-white text-slate-700 border-slate-200 hover:border-merk"
              }`}
            >
              {actief && <Check className="w-3.5 h-3.5" />}
              <span>{optie.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
