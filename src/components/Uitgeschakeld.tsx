"use client";

import React from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";

/** Getoond wanneer iemand een werkvorm of functie opent die de beheerder uitzette. */
export function Uitgeschakeld() {
  return (
    <div className="max-w-sm mx-auto text-center py-20 u-fade">
      <h1 className="text-xl font-extrabold text-merk-900 mb-2">{t("algemeen.uitgeschakeld.titel")}</h1>
      <p className="text-sm text-slate-600 mb-5">{t("algemeen.uitgeschakeld.uitleg")}</p>
      <Link
        href="/"
        className="inline-flex px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
      >
        {t("algemeen.uitgeschakeld.naarStart")}
      </Link>
    </div>
  );
}
