"use client";

import React from "react";
import { Globe } from "lucide-react";
import { TALEN, t, type Taal } from "@/lib/i18n";
import { useInstellingen } from "@/lib/instellingen/AppProvider";

/** Kies de taal van de app, uit de talen die de beheerder aanzette. Eén taal: niets te kiezen. */
export function TaalKiezer({ className = "" }: { className?: string }) {
  const { instellingen, taal, kiesTaal } = useInstellingen();
  const talen = TALEN.filter((l) => instellingen.talen.includes(l.code));
  if (talen.length < 2) return null;

  return (
    <label className={`relative inline-flex items-center gap-1 text-slate-600 ${className}`}>
      <Globe className="w-4 h-4 pointer-events-none" aria-hidden />
      <span className="sr-only">{t("algemeen.taal")}</span>
      <select
        value={taal}
        onChange={(e) => kiesTaal(e.target.value as Taal)}
        className="appearance-none bg-transparent text-xs font-bold uppercase tracking-wide pr-1 py-2 cursor-pointer hover:text-merk-900 focus:outline-none"
      >
        {talen.map((l) => (
          <option key={l.code} value={l.code} lang={l.code}>
            {l.code.toUpperCase()} · {l.naam}
          </option>
        ))}
      </select>
    </label>
  );
}
