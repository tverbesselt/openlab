"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { CornellBlad } from "@/components/CornellBlad";
import { FunctiePoort } from "@/components/FunctiePoort";
import { t } from "@/lib/i18n";

/*
 * Een leeg notitieblad in twee kolommen, los van een oefening. Voor cursisten die thuis of
 * in de les notities willen nemen waarmee ze zichzelf later kunnen testen, en voor leraren
 * die het blad in de klas uitdelen.
 */

function CornellPaginaInhoud() {
  const [titel, setTitel] = useState("");

  return (
    <div className="max-w-3xl mx-auto">
      <div className="niet-afdrukken space-y-4 mb-6 pb-4 border-b border-slate-200">
        <Link
          href="/slim-oefenen"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-merk-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("klas.cornell.terug")}</span>
        </Link>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-merk-900 tracking-tight mb-1">
            {t("klas.cornell.titel")}
          </h1>
          <p className="text-sm text-slate-600">
            {t("klas.cornell.intro")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <label className="block flex-1">
            <span className="block text-sm font-bold text-slate-800 mb-1">
              {t("klas.cornell.onderwerp")}{" "}
              <span className="font-normal text-slate-500">{t("klas.magLeeg")}</span>
            </span>
            <input
              type="text"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder={t("klas.cornell.onderwerpVoorbeeld")}
              className="w-full p-3 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
            />
          </label>
          <button
            onClick={() => window.print()}
            className="px-4 py-3 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>{t("algemeen.afdrukken")}</span>
          </button>
        </div>

        <p className="text-xs text-slate-500">
          {t("klas.papier")}
        </p>
      </div>

      <CornellBlad titel={titel.trim() || undefined} />
    </div>
  );
}

export default function CornellPagina() {
  return (
    <FunctiePoort functie="afdrukken">
      <CornellPaginaInhoud />
    </FunctiePoort>
  );
}
