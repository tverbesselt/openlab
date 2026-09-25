"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusCircle, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useInstellingen } from "@/lib/instellingen/AppProvider";
import { t } from "@/lib/i18n";
import { Logo } from "@/components/Logo";
import { TaalKiezer } from "@/components/TaalKiezer";

export function Header() {
  const pathname = usePathname();
  const { status, gebruiker, isLeraar, isBeheerder, demo, afmelden } = useAuth();
  const { instellingen, isAan } = useInstellingen();
  const klastools = isAan("timer") || isAan("randomizer") || isAan("groupmaker");

  const links = isLeraar
    ? [
        { href: "/", label: t("algemeen.menu.start") },
        { href: "/mappen", label: t("algemeen.menu.mappen") },
        { href: "/bibliotheek", label: t("algemeen.menu.bibliotheek") },
        { href: "/live", label: t("algemeen.menu.inDeKlas") },
        ...(klastools ? [{ href: "/klastools", label: t("algemeen.menu.klastools") }] : []),
      ]
    : [
        { href: "/", label: t("algemeen.menu.start") },
        { href: "/bibliotheek", label: t("algemeen.menu.oefeningen") },
        ...(instellingen.tips.cursisten
          ? [{ href: "/slim-oefenen", label: t("algemeen.menu.slimOefenen") }]
          : []),
      ];

  const isActief = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="niet-afdrukken sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          <Link href="/" className="flex items-center gap-2.5 shrink-0 min-w-0">
            <Logo />
            <span className="font-extrabold text-lg text-merk-900 tracking-tight truncate">
              {instellingen.naam}
            </span>
            {demo && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                {t("algemeen.demo")}
              </span>
            )}
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm">
            {links.map((link) => (
              <NavLink key={link.href} href={link.href} actief={isActief(link.href)}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <TaalKiezer />

            {isBeheerder && (
              <Link
                href="/beheer"
                title={t("algemeen.menu.beheer")}
                aria-label={t("algemeen.menu.beheer")}
                className={`p-2 rounded-xl transition-colors ${
                  isActief("/beheer")
                    ? "bg-merk-50 text-merk-900"
                    : "text-slate-500 hover:text-merk-900 hover:bg-slate-100"
                }`}
              >
                <Settings className="w-4 h-4" />
              </Link>
            )}

            {isLeraar && (
              <Link
                href="/maken"
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t("algemeen.menu.nieuw")}</span>
              </Link>
            )}

            {status === "aangemeld" && gebruiker ? (
              <div className="flex items-center gap-1">
                <span className="hidden lg:block text-xs text-slate-600 max-w-[12rem] truncate">
                  {gebruiker.naam}
                </span>
                <button
                  onClick={afmelden}
                  title={t("algemeen.afmelden")}
                  aria-label={t("algemeen.afmelden")}
                  className="p-2 rounded-xl text-slate-500 hover:text-merk-900 hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : status === "afgemeld" ? (
              <Link
                href="/aanmelden"
                className="px-3 py-2 rounded-xl text-sm font-bold text-merk-900 hover:bg-slate-100 transition-colors"
              >
                {t("algemeen.aanmelden")}
              </Link>
            ) : null}
          </div>
        </div>

        {/* Navigatie op smalle schermen */}
        <nav className="flex md:hidden gap-1.5 pb-2 text-xs overflow-x-auto whitespace-nowrap">
          {links.map((link) => (
            <NavLink key={link.href} href={link.href} actief={isActief(link.href)}>
              {link.label}
            </NavLink>
          ))}
          {isLeraar && (
            <NavLink href="/maken" actief={isActief("/maken")}>
              {t("algemeen.menu.nieuw")}
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
  actief,
}: {
  href: string;
  children: React.ReactNode;
  actief: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={actief ? "page" : undefined}
      className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
        actief
          ? "bg-merk-50 text-merk-900"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {children}
    </Link>
  );
}
