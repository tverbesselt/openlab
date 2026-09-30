"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  ArrowRight,
  Folder,
  Lock,
  Play,
  Clock,
  Shuffle,
  AlertCircle,
  CalendarClock,
} from "lucide-react";
import { ShareModal } from "@/components/ShareModal";
import { Studietip } from "@/components/Studietip";
import { opslag, useMateriaal, useHerhalingen } from "@/lib/opslag";
import { aanDeBeurt, datumInWoorden, volgendeBeurt } from "@/lib/herhalen";
import { useAuth, type Gebruiker } from "@/lib/auth/AuthProvider";
import { Exercise, Lesmap } from "@/lib/types";
import {
  LESFASES,
  LESHULP,
  WERKVORMEN,
  isEigenMateriaal,
  isKlassikaal,
  inhoudSamenvatting,
  geschatteDuur,
  zichtbaarVoor,
  eigenMappen,
} from "@/lib/labels";
import { useInstellingen } from "@/lib/instellingen/AppProvider";
import type { FunctieId } from "@/lib/instellingen/functies";
import { t, tn } from "@/lib/i18n";
import { tr } from "@/lib/i18n/rijk";

export default function StartPagina() {
  const { gebruiker, isLeraar } = useAuth();
  const { oefeningen: exercises, mappen, laden } = useMateriaal();

  if (laden) {
    return <div className="h-64" aria-hidden />;
  }

  // Privé materiaal van collega's hoort nergens in een overzicht te staan.
  const zichtbaar = zichtbaarVoor(exercises, gebruiker);

  if (isLeraar && gebruiker) {
    return <LeraarStart gebruiker={gebruiker} exercises={zichtbaar} mappen={mappen} />;
  }

  return <CursistStart gebruiker={gebruiker} exercises={zichtbaar} mappen={mappen} />;
}

/* ── Startscherm voor de leraar: kiezen wat je in je les doet ──────────── */

/** Welke functie achter een leshulp zit; "groups" is de groepenmaker. */
const LESHULP_FUNCTIE: Record<string, FunctieId> = {
  timer: "timer",
  randomizer: "randomizer",
  groups: "groupmaker",
  opfrissen: "opfrissen",
  digibord: "digibord",
  audiotekst: "audiotekst",
};

function LeraarStart({
  gebruiker,
  exercises,
  mappen,
}: {
  gebruiker: Gebruiker;
  exercises: Exercise[];
  mappen: Lesmap[];
}) {
  const { isAan } = useInstellingen();
  // Alleen lesfases en leshulp met minstens één werkvorm die aan staat.
  const lesfases = LESFASES.filter((f) => f.werkvormen.some(isAan));
  const leshulp = LESHULP.filter((h) => isAan(LESHULP_FUNCTIE[h.id] ?? "timer"));
  const [selectedShare, setSelectedShare] = useState<Exercise | null>(null);

  const voornaam = gebruiker.naam.split(" ")[0];
  const eigenMateriaal = exercises.filter((ex) => isEigenMateriaal(ex, gebruiker));
  const recent = (eigenMateriaal.length > 0 ? eigenMateriaal : exercises).slice(0, 3);
  const mijnMappen = eigenMappen(mappen, gebruiker).slice(0, 4);

  return (
    <div className="max-w-5xl mx-auto space-y-14 u-fade">

      <header className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 pt-2">
        <div>
          <p className="text-sm text-slate-600 mb-1.5">{t("materiaal.start.dag", { naam: voornaam })}</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-merk-900 tracking-tight">
            {t("materiaal.start.titel")}
          </h1>
        </div>

        {/* Enkel op gsm: op groter scherm staat 'Nieuw' al in de kopbalk */}
        <Link
          href="/maken"
          className="sm:hidden shrink-0 self-start inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white text-sm font-bold transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t("materiaal.start.nieuweOefening")}</span>
        </Link>
      </header>

      {/* De vier lesfases dragen de pagina — verder niets dat om aandacht vraagt */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-px bg-slate-300 rounded-2xl overflow-hidden border border-slate-300 shadow-sm">
        {lesfases.map((fase, index) => {
          const aantal = exercises.filter((ex) => ex.didacticGoal === fase.id).length;
          const werkvormen = fase.werkvormen
            .filter(isAan)
            .slice(0, 3)
            .map((w) => WERKVORMEN[w].label)
            .join(" · ");

          return (
            <Link
              key={fase.id}
              href={`/bibliotheek?fase=${fase.id}`}
              style={{ animationDelay: `${index * 60}ms` }}
              className="group u-rise bg-white hover:bg-merk-50/40 transition-colors p-6 flex flex-col"
            >
              <span className="font-mono text-sm text-slate-500 mb-6 tabular-nums">
                0{fase.nummer}
              </span>

              <h2 className="font-bold text-lg text-slate-900 leading-snug mb-2">{fase.label}</h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-1">{fase.wanneer}</p>

              <p className="text-xs text-slate-600 mb-1.5">{werkvormen}</p>
              <span className="text-sm font-bold text-merk-900 flex items-center gap-1">
                {aantal === 0 ? t("materiaal.start.nogNietsKlaar") : tn("materiaal.start.klaar", aantal)}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          );
        })}
      </section>

      {/* Klastools: één regel, geen kaders */}
      <section>
        <SectieTitel>{t("materiaal.start.tijdensDeLes")}</SectieTitel>
        <div className="flex flex-col sm:flex-row sm:items-center gap-x-8 gap-y-3">
          {leshulp.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.id}
                href={tool.href}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-merk-900 transition-colors"
              >
                <Icon className="w-4 h-4 text-slate-500" />
                <span>{tool.label}</span>
              </Link>
            );
          })}
          <span className="text-sm text-slate-600 sm:ml-auto">{t("materiaal.start.geenVoorbereiding")}</span>
        </div>
      </section>

      {mijnMappen.length > 0 && (
        <section>
          <SectieTitel
            actie={
              <Link
                href="/mappen"
                className="text-xs font-bold text-merk-900 hover:text-merk transition-colors"
              >
                {t("materiaal.start.alleMappen")}
              </Link>
            }
          >
            {t("materiaal.start.mijnMappen")}
          </SectieTitel>

          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {mijnMappen.map((map) => (
              <Link
                key={map.id}
                href={`/mappen/${map.id}`}
                className="flex items-center gap-3 py-3.5 group"
              >
                <Folder className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-900 truncate group-hover:text-merk-900 transition-colors">
                    {map.title}
                  </span>
                  <span className="block text-xs text-slate-600">
                    {tn("materiaal.oefeningen", map.exerciseIds.length)}
                  </span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-merk group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectieTitel
          actie={
            <Link
              href="/bibliotheek"
              className="text-xs font-bold text-merk-900 hover:text-merk transition-colors"
            >
              {tn("materiaal.start.alleBekijken", exercises.length)}
            </Link>
          }
        >
          {eigenMateriaal.length > 0
            ? t("materiaal.start.jouwMateriaal")
            : t("materiaal.start.materiaalCollegas")}
        </SectieTitel>

        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {recent.map((ex) => (
            <MateriaalRegel key={ex.id} ex={ex} onDelen={setSelectedShare} />
          ))}
        </div>
      </section>

      <Studietip plek="leraar-start" meer />

      <p className="text-xs text-slate-600">
        {t("materiaal.start.cursistenStarten")}
      </p>

      {selectedShare && (
        <ShareModal
          isOpen={!!selectedShare}
          onClose={() => setSelectedShare(null)}
          title={selectedShare.title}
          shareCode={selectedShare.shareCode}
          id={selectedShare.id}
        />
      )}
    </div>
  );
}

/**
 * Compacte regel voor de startpagina. In de bibliotheek blader je en vergelijk
 * je — daar staan volwaardige kaarten. Hier grijp je iets wat je al kent.
 */
function MateriaalRegel({
  ex,
  onDelen,
}: {
  ex: Exercise;
  onDelen: (ex: Exercise) => void;
}) {
  const werkvorm = WERKVORMEN[ex.type];
  const Icon = werkvorm.icon;
  const klassikaal = isKlassikaal(ex);

  return (
    <div className="flex items-center gap-3 py-3.5">
      <Icon className="w-4 h-4 text-slate-500 shrink-0" />

      <Link href={`/oefen/${ex.id}`} className="min-w-0 flex-1 group">
        <span className="block text-sm font-bold text-slate-900 truncate group-hover:text-merk-900 transition-colors">
          {ex.title}
        </span>
        <span className="text-xs text-slate-500 flex items-center gap-1.5">
          {werkvorm.label} · {inhoudSamenvatting(ex)}
          {ex.visibility === "prive" && (
            <Lock className="w-3 h-3 text-amber-600" aria-label={t("materiaal.alleenIk")} />
          )}
        </span>
      </Link>

      {klassikaal ? (
        <Link
          href={`/live?oefening=${ex.id}`}
          className="shrink-0 text-xs font-bold text-merk-900 hover:text-merk transition-colors"
        >
          {t("materiaal.start.startInDeKlas")}
        </Link>
      ) : (
        <button
          onClick={() => onDelen(ex)}
          className="shrink-0 text-xs font-bold text-merk-900 hover:text-merk transition-colors"
        >
          {t("algemeen.delen")}
        </button>
      )}
    </div>
  );
}

/**
 * Wat vandaag aan de beurt is om te herhalen. Verschijnt pas zodra er echt iets gepland
 * staat: wie nog nooit een kaart beoordeelde, heeft hier niets aan.
 */
function HerhaalBlok() {
  const { herhalingen, laden } = useHerhalingen();
  const { isAan } = useInstellingen();

  if (laden || herhalingen.length === 0 || !isAan("herhalen")) return null;

  const vandaag = aanDeBeurt(herhalingen);
  const volgende = volgendeBeurt(herhalingen);

  if (vandaag.length === 0 && !volgende) return null;

  if (vandaag.length === 0) {
    return (
      <section className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <CalendarClock className="w-5 h-5 text-slate-500 shrink-0" />
        <p className="text-sm text-slate-600">
          {tr(
            "materiaal.start.herhaal.bij",
            { b: (s) => <strong className="text-slate-900">{s}</strong> },
            { datum: datumInWoorden(volgende!) }
          )}
        </p>
      </section>
    );
  }

  return (
    <Link
      href="/herhalen"
      className="group flex items-center gap-4 rounded-2xl border border-merk bg-merk-50 px-5 py-4 hover:bg-merk-50/70 transition-colors"
    >
      <span className="w-10 h-10 rounded-xl bg-white text-merk-900 flex items-center justify-center border border-merk/20 shrink-0">
        <CalendarClock className="w-5 h-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold text-merk-900">
          {tn("materiaal.start.herhaal.vandaag", vandaag.length)}
        </span>
        <span className="block text-xs text-slate-600">
          {t("materiaal.start.herhaal.uitleg")}
        </span>
      </span>
      <ArrowRight className="w-4 h-4 text-merk group-hover:translate-x-0.5 transition-transform shrink-0" />
    </Link>
  );
}

function SectieTitel({
  children,
  actie,
}: {
  children: React.ReactNode;
  actie?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 mb-4">
      <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">{children}</h2>
      {actie}
    </div>
  );
}

/* == Landingspagina voor cursisten =========================================
   Een ding staat centraal: beginnen. De code is de held van de pagina, en wie
   geen code heeft ziet meteen wat hij zelf kan aanpakken. De uitdaging zit in
   concrete cijfers (hoeveel items, hoe lang), niet in punten of badges - dat
   laatste werkt averechts bij volwassen cursisten.
   ========================================================================= */

function CursistStart({
  gebruiker,
  exercises,
  mappen,
}: {
  gebruiker: Gebruiker | null;
  exercises: Exercise[];
  mappen: Lesmap[];
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [fout, setFout] = useState("");
  const [zoekt, setZoekt] = useState(false);

  // Alleen wat een cursist zelf kan doen; klassikale werkvormen horen op het digibord.
  const teOefenen = exercises.filter((ex) => !isKlassikaal(ex));
  const volledig = code.length === 6;

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || zoekt) return;

    // Een code hoort bij een oefening of bij een hele map.
    setZoekt(true);
    try {
      const doel = await opslag.viaCode(code);
      if (doel?.soort === "oefening") {
        router.push(`/oefen/${doel.id}`);
        return;
      }
      if (doel?.soort === "map") {
        router.push(`/mappen/${doel.id}`);
        return;
      }
      setFout(t("materiaal.start.cursist.nietsGevonden", { code }));
    } catch {
      setFout(t("materiaal.start.cursist.opzoekenMislukt"));
    } finally {
      setZoekt(false);
    }
  };

  const verrasMe = () => {
    if (teOefenen.length === 0) return;
    const keuze = teOefenen[Math.floor(Math.random() * teOefenen.length)];
    router.push(`/oefen/${keuze.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 u-fade">

      {/* Hero: de code speelt de hoofdrol */}
      <section className="u-teal-gradient rounded-3xl px-6 py-10 sm:px-10 sm:py-12 text-center text-white">
        {gebruiker && (
          <p className="text-sm text-white/85 mb-2">
            {t("materiaal.start.dag", { naam: gebruiker.naam.split(" ")[0] })}
          </p>
        )}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3">
          {t("materiaal.start.cursist.titel")}
        </h1>
        <p className="text-sm sm:text-base text-white/85 max-w-md mx-auto">
          {t("materiaal.start.cursist.uitleg")}
        </p>

        <form onSubmit={start} className="mt-8 max-w-sm mx-auto">
          <label htmlFor="oefencode" className="sr-only">
            {t("materiaal.start.cursist.codeLabel")}
          </label>
          <input
            id="oefencode"
            type="text"
            inputMode="text"
            value={code}
            onChange={(e) => {
              // Hoofdletters, geen spaties: zo kan een code nooit verkeerd getypt zijn.
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
              setFout("");
            }}
            placeholder="MARKT1"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-describedby="codehulp"
            className="w-full px-4 py-5 text-center text-3xl sm:text-4xl tracking-[0.3em] rounded-2xl bg-white text-slate-900 font-mono font-bold placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-white/70 transition-shadow"
          />

          <button
            type="submit"
            disabled={!code || zoekt}
            className="mt-3 w-full py-4 rounded-2xl bg-white text-merk-900 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed font-extrabold text-base transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{t("materiaal.start.cursist.start")}</span>
          </button>

          <p id="codehulp" className="mt-3 text-xs text-white/85">
            {volledig
              ? t("materiaal.start.cursist.zesIngevuld")
              : t("materiaal.start.cursist.zesTekens")}
          </p>

          {fout && (
            <p
              role="alert"
              className="mt-3 text-sm font-semibold text-white bg-rose-600 rounded-xl px-3 py-2.5 flex items-start gap-2 text-left"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{fout}</span>
            </p>
          )}
        </form>
      </section>

      <HerhaalBlok />

      {teOefenen.length > 0 ? (
        <>
          {/* Geen code? Dan kies je zelf je uitdaging. */}
          <section className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <h2 className="text-lg font-extrabold text-merk-900 tracking-tight">
                {t("materiaal.start.cursist.geenCode")}
              </h2>
              <p className="text-sm text-slate-600">
                {tn("materiaal.start.cursist.staanKlaar", teOefenen.length)}
              </p>
            </div>

            <button
              onClick={verrasMe}
              className="shrink-0 px-4 py-3 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Shuffle className="w-4 h-4" />
              <span>{t("materiaal.start.cursist.verrasMe")}</span>
            </button>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teOefenen.map((ex, index) => {
              const werkvorm = WERKVORMEN[ex.type];
              const Icon = werkvorm.icon;

              return (
                <Link
                  key={ex.id}
                  href={`/oefen/${ex.id}`}
                  style={{ animationDelay: `${Math.min(index, 5) * 50}ms` }}
                  className="group u-rise bg-white rounded-2xl border border-slate-200 p-5 flex flex-col hover:border-merk hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-9 h-9 rounded-xl bg-merk-50 text-merk-900 flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5" />
                    </span>
                    <span className="text-xs font-bold text-slate-500">{werkvorm.label}</span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 leading-snug mb-2 line-clamp-2">
                    {ex.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4 flex-1">
                    {ex.description}
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {geschatteDuur(ex)} · {inhoudSamenvatting(ex)}
                    </span>
                    <span className="text-sm font-bold text-merk-900 flex items-center gap-1">
                      {t("materiaal.start.cursist.oefenen")}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </section>
        </>
      ) : (
        <p className="text-sm text-slate-600 text-center">
          {t("materiaal.start.cursist.geenOefening")}
        </p>
      )}

      <Studietip plek="cursist-start" meer />

      {!gebruiker && (
        <p className="text-center text-xs text-slate-600">
          {t("materiaal.start.cursist.lesgeven")}{" "}
          <Link href="/aanmelden" className="font-bold text-merk-900 hover:underline">
            {t("materiaal.start.cursist.aanmelden")}
          </Link>
        </p>
      )}
    </div>
  );
}
