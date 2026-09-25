"use client";

import React from "react";
import { useInstellingen } from "@/lib/instellingen/AppProvider";
import { t } from "@/lib/i18n";

/*
 * Een leeg notitieblad volgens de Cornell-methode (Studeren met succes, studeerkaart 7):
 * rechts brede kolom voor notities, links smalle kolom voor kernwoorden en vragen, onderaan
 * ruimte om in twee zinnen samen te vatten. Het grootste voordeel komt achteraf: wie de
 * rechterkolom afdekt, kan zichzelf testen met de linker.
 *
 * Eenvoudige, rustige opmaak: links uitgelijnd, geen cursief, schrijven op lijntjes.
 * Staand A4, één pagina.
 */

const REGELS_NOTITIES = 18;
const REGELS_SAMENVATTING = 3;

function Regels({ aantal, hoogte = "1.8rem" }: { aantal: number; hoogte?: string }) {
  return (
    <div>
      {Array.from({ length: aantal }, (_, i) => (
        <div key={i} className="border-b border-slate-400" style={{ height: hoogte }} />
      ))}
    </div>
  );
}

export function CornellBlad({ titel }: { titel?: string }) {
  const { instellingen } = useInstellingen();

  return (
    <article className="bg-white text-black p-8 sm:p-10 rounded-2xl border border-slate-200 print:border-0 print:p-0 print:rounded-none leading-relaxed">
      <header className="mb-5 pb-3 border-b border-black">
        <p className="text-sm font-bold flex items-center gap-2">
          {instellingen.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={instellingen.logo} alt="" className="h-6 w-auto" />
          )}
          <span>{instellingen.organisatie || instellingen.naam}</span>
        </p>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2 mt-2 text-sm">
          <p className="flex-1 min-w-[16rem] flex items-end gap-2">
            <span className="font-bold shrink-0">{t("klas.cornellBlad.lesonderwerp")}</span>
            {titel ? (
              <span className="text-lg font-extrabold leading-tight">{titel}</span>
            ) : (
              <span className="flex-1 border-b border-black h-5" />
            )}
          </p>
          <p className="flex items-end gap-2">
            <span className="font-bold">{t("klas.cornellBlad.datum")}</span>
            <span className="inline-block w-28 border-b border-black h-5" />
          </p>
        </div>
      </header>

      <ol className="text-xs mb-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5 list-decimal pl-4">
        <li>{t("klas.cornellBlad.stap1")}</li>
        <li>{t("klas.cornellBlad.stap2")}</li>
        <li>{t("klas.cornellBlad.stap3")}</li>
        <li>{t("klas.cornellBlad.stap4")}</li>
      </ol>

      <div className="grid border border-black" style={{ gridTemplateColumns: "30% 70%" }}>
        <div className="border-r border-black px-3 pt-2">
          <p className="text-xs font-bold pb-1 border-b border-black">{t("klas.cornellBlad.kernwoorden")}</p>
          <Regels aantal={REGELS_NOTITIES} />
        </div>
        <div className="px-3 pt-2">
          <p className="text-xs font-bold pb-1 border-b border-black">{t("klas.cornellBlad.notities")}</p>
          <Regels aantal={REGELS_NOTITIES} />
        </div>
      </div>

      <div className="border border-t-0 border-black px-3 pt-2 pb-1">
        <p className="text-xs font-bold pb-1 border-b border-black">
          {t("klas.cornellBlad.samenvatting")}
        </p>
        <Regels aantal={REGELS_SAMENVATTING} />
      </div>

      <footer className="mt-4 text-xs">
        {instellingen.organisatie
          ? t("klas.cornellBlad.voet", {
              app: instellingen.naam,
              organisatie: instellingen.organisatie,
            })
          : t("klas.cornellBlad.voetZonderOrganisatie", { app: instellingen.naam })}
      </footer>
    </article>
  );
}
