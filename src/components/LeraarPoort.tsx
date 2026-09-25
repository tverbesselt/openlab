"use client";

import React from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";

/** Getoond wanneer iemand zonder leraaraccount op een leraarpagina belandt. */
export function LeraarPoort({ uitleg }: { uitleg: string }) {
  return (
    <div className="max-w-md mx-auto text-center py-16 u-fade">
      <h1 className="text-2xl font-extrabold text-merk-900 tracking-tight mb-2">
        {t("tips.leraarPoort.titel")}
      </h1>
      <p className="text-sm text-slate-600 mb-6">{uitleg}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/aanmelden"
          className="px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
        >
          {t("tips.leraarPoort.aanmelden")}
        </Link>
        <Link
          href="/bibliotheek"
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
        >
          {t("tips.leraarPoort.naarBibliotheek")}
        </Link>
      </div>
    </div>
  );
}
