"use client";

import React from "react";
import Link from "next/link";
import { WeergaveKnop } from "@/components/Weergave";
import { Logo } from "@/components/Logo";
import { useInstellingen } from "@/lib/instellingen/AppProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { t } from "@/lib/i18n";

export function Footer() {
  const { instellingen, isAan } = useInstellingen();
  const { isLeraar } = useAuth();
  const klastools = isAan("timer") || isAan("randomizer") || isAan("groupmaker");

  return (
    <footer className="niet-afdrukken mt-16 border-t border-slate-200 bg-white/60 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Logo grootte="sm" />
            <div>
              <p className="font-bold text-sm text-merk-900">{instellingen.naam}</p>
              {instellingen.organisatie && (
                <p className="text-xs text-slate-500">{instellingen.organisatie}</p>
              )}
            </div>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
            <Link href="/bibliotheek" className="hover:text-merk-900">
              {t("algemeen.menu.bibliotheek")}
            </Link>
            {isLeraar && (
              <Link href="/maken" className="hover:text-merk-900">
                {t("algemeen.menu.nieuweOefening")}
              </Link>
            )}
            {isLeraar && klastools && (
              <Link href="/klastools" className="hover:text-merk-900">
                {t("algemeen.menu.klastools")}
              </Link>
            )}
            {isLeraar && (
              <Link href="/live" className="hover:text-merk-900">
                {t("algemeen.menu.startInDeKlas")}
              </Link>
            )}
            {instellingen.tips.cursisten && (
              <Link href="/slim-oefenen" className="hover:text-merk-900">
                {t("algemeen.menu.slimOefenen")}
              </Link>
            )}
            <WeergaveKnop />
          </nav>
        </div>

        {instellingen.organisatie && (
          <p className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
            © {new Date().getFullYear()} {instellingen.organisatie}
          </p>
        )}
      </div>
    </footer>
  );
}
