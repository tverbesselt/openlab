"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  BRON,
  SLIM_OEFENEN_CURSIST,
  SLIM_OEFENEN_LERAAR,
  type TipBlok,
} from "@/lib/studietips";
import { FunctiePoort } from "@/components/FunctiePoort";
import { t } from "@/lib/i18n";
import { tr } from "@/lib/i18n/rijk";

/*
 * Alle studeertips op een rij, voor wie meer wil dan de ene zin op een scherm. Twee
 * tabbladen: hoe je slim oefent (cursist) en hoe je het in de klas inzet (leraar).
 * Dit is de enige plek waar we het boekje bij naam noemen.
 */

type Tab = "cursist" | "leraar";

function SlimOefenenPaginaInhoud() {
  const { isLeraar } = useAuth();
  const [tab, setTab] = useState<Tab>("cursist");

  // Een leraar landt op zijn eigen tabblad; wisselen kan altijd.
  useEffect(() => {
    if (isLeraar) setTab("leraar");
  }, [isLeraar]);

  const blokken = tab === "cursist" ? SLIM_OEFENEN_CURSIST : SLIM_OEFENEN_LERAAR;

  return (
    <div className="max-w-3xl mx-auto space-y-8 u-fade">
      <div>
        <span className="w-11 h-11 rounded-2xl bg-merk-50 text-merk-900 flex items-center justify-center border border-merk/20 mb-3">
          <Lightbulb className="w-5 h-5" />
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-merk-900 tracking-tight mb-1">
          {t("tips.slim.titel")}
        </h1>
        <p className="text-sm text-slate-600">{t("tips.slim.intro")}</p>
      </div>

      <div className="flex gap-2" role="tablist" aria-label={t("tips.slim.voorWie")}>
        <TabKnop actief={tab === "cursist"} onClick={() => setTab("cursist")}>
          {t("tips.slim.alsJeOefent")}
        </TabKnop>
        <TabKnop actief={tab === "leraar"} onClick={() => setTab("leraar")}>
          {t("tips.slim.inDeKlas")}
        </TabKnop>
      </div>

      <ol className="space-y-4">
        {blokken.map((blok, index) => (
          <Blok key={blok.id} nummer={index + 1} blok={blok} />
        ))}
      </ol>

      <p className="text-xs text-slate-500 border-t border-slate-200 pt-4">
        {tr(
          "tips.slim.bron",
          { em: (s) => <em>{s}</em> },
          {
            titel: BRON.titel,
            auteurs: BRON.auteurs,
            uitgever: BRON.uitgever,
            jaar: BRON.jaar,
            licentie: BRON.licentie,
          }
        )}
      </p>
    </div>
  );
}

function Blok({ nummer, blok }: { nummer: number; blok: TipBlok }) {
  return (
    <li className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex gap-4">
      <span className="font-mono text-sm text-slate-300 tabular-nums shrink-0 pt-0.5">
        0{nummer}
      </span>
      <div className="min-w-0">
        <h2 className="font-bold text-lg text-slate-900 leading-snug mb-1.5">{blok.kop}</h2>
        <p className="text-sm text-slate-600 leading-relaxed">{blok.tekst}</p>
        {blok.link && (
          <Link
            href={blok.link.href}
            className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-merk-900 hover:text-merk transition-colors"
          >
            <span>{blok.link.label}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </li>
  );
}

function TabKnop({
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
      role="tab"
      aria-selected={actief}
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl border font-bold text-sm transition-colors ${
        actief
          ? "bg-merk-800 text-white border-merk-800"
          : "bg-white text-slate-700 border-slate-200 hover:border-merk"
      }`}
    >
      {children}
    </button>
  );
}

export default function SlimOefenenPagina() {
  return (
    <FunctiePoort tips="cursisten">
      <SlimOefenenPaginaInhoud />
    </FunctiePoort>
  );
}
