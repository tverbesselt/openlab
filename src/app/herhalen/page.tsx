"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarCheck, CalendarClock } from "lucide-react";
import { opslag, useHerhalingen } from "@/lib/opslag";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Exercise, FlashcardItem, Herhaling } from "@/lib/types";
import {
  aanDeBeurt,
  datumInWoorden,
  kaartUit,
  plan,
  volgendeBeurt,
  type Zelfoordeel,
} from "@/lib/herhalen";
import { FlashcardPlayer } from "@/components/players/FlashcardPlayer";
import { Studietip } from "@/components/Studietip";
import { FunctiePoort } from "@/components/FunctiePoort";
import { t, tn } from "@/lib/i18n";

/*
 * Wat vandaag aan de beurt is, uit alle oefeningen door elkaar. Door elkaar is bewust:
 * gemengd oefenen (interleaving) werkt beter dan onderwerp per onderwerp.
 */

interface Beurt {
  kaart: FlashcardItem;
  oefening: Exercise;
  herhaling: Herhaling;
}

function HerhalenPaginaInhoud() {
  const { status, gebruiker } = useAuth();
  const { herhalingen, laden } = useHerhalingen();

  const [beurten, setBeurten] = useState<Beurt[] | null>(null);
  const planning = useRef<Map<string, Herhaling>>(new Map());

  const vandaagAanDeBeurt = useMemo(() => aanDeBeurt(herhalingen), [herhalingen]);
  const volgende = useMemo(() => volgendeBeurt(herhalingen), [herhalingen]);

  // De kaarten achter de planning ophalen: elke oefening maar één keer.
  useEffect(() => {
    if (laden) return;
    if (vandaagAanDeBeurt.length === 0) {
      setBeurten([]);
      return;
    }

    let actief = true;
    (async () => {
      planning.current = new Map(herhalingen.map((h) => [h.id, h]));
      const ids = [...new Set(vandaagAanDeBeurt.map((h) => h.oefeningId))];
      const geladen = await Promise.all(ids.map((exId) => opslag.oefening(exId).catch(() => null)));
      if (!actief) return;

      const perId = new Map<string, Exercise>();
      for (const ex of geladen) if (ex) perId.set(ex.id, ex);

      const lijst: Beurt[] = [];
      for (const herhaling of vandaagAanDeBeurt) {
        const oefening = perId.get(herhaling.oefeningId);
        if (!oefening) continue;
        const kaart = kaartUit(oefening, herhaling.kaartId);
        if (kaart) lijst.push({ kaart, oefening, herhaling });
      }
      setBeurten(lijst);
    })();

    return () => {
      actief = false;
    };
  }, [laden, herhalingen, vandaagAanDeBeurt]);

  const onthoud = useCallback(
    (kaartId: string, oordeel: Zelfoordeel) => {
      if (!gebruiker?.id || !beurten) return;
      const beurt = beurten.find((b) => b.kaart.id === kaartId);
      if (!beurt) return;

      const nieuw = plan(beurt.oefening.id, kaartId, oordeel, planning.current.get(beurt.herhaling.id));
      planning.current.set(nieuw.id, nieuw);
      opslag.bewaarHerhaling(gebruiker.id, nieuw).catch(() => {});
    },
    [gebruiker?.id, beurten]
  );

  if (status === "laden" || laden || beurten === null) {
    return <div className="h-64" aria-hidden />;
  }

  /* ── Niet aangemeld: uitleggen waarom dit iets voor jou is ─────────────── */
  if (!gebruiker) {
    return (
      <div className="max-w-md mx-auto text-center py-16 u-fade">
        <CalendarClock className="w-10 h-10 text-merk mx-auto mb-3" />
        <h1 className="text-2xl font-extrabold text-merk-900 tracking-tight mb-2">
          {t("oefenen.herhalen.aanmeldenTitel")}
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          {t("oefenen.herhalen.aanmeldenUitleg")}
        </p>
        <Link
          href="/aanmelden"
          className="inline-flex px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
        >
          {t("algemeen.aanmelden")}
        </Link>
      </div>
    );
  }

  /* ── Niets te doen ─────────────────────────────────────────────────────── */
  if (beurten.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16 u-fade">
        <CalendarCheck className="w-10 h-10 text-merk mx-auto mb-3" />
        <h1 className="text-2xl font-extrabold text-merk-900 tracking-tight mb-2">
          {herhalingen.length === 0 ? t("oefenen.herhalen.nietsTitel") : t("oefenen.herhalen.bijTitel")}
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          {herhalingen.length === 0
            ? t("oefenen.herhalen.nietsUitleg")
            : volgende
              ? t("oefenen.herhalen.volgendeKomen", { wanneer: datumInWoorden(volgende) })
              : t("oefenen.herhalen.nietsVandaag")}
        </p>
        <Link
          href="/bibliotheek"
          className="inline-flex px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
        >
          {t("oefenen.herhalen.naarOefeningen")}
        </Link>
      </div>
    );
  }

  /* ── Herhalen ──────────────────────────────────────────────────────────── */
  const aantalOefeningen = new Set(beurten.map((b) => b.oefening.id)).size;

  return (
    <div className="space-y-6 u-fade">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-merk-900 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("algemeen.terug")}</span>
        </Link>

        <div className="text-center min-w-0">
          <p className="text-xs font-semibold text-slate-500">
            {t("oefenen.herhalen.kop", {
              kaarten: tn("oefenen.herhalen.kaarten", beurten.length),
              oefeningen: tn("oefenen.herhalen.oefeningen", aantalOefeningen),
            })}
          </p>
          <h1 className="font-extrabold text-lg sm:text-xl text-merk-900 leading-tight">
            {t("oefenen.herhalen.titel")}
          </h1>
        </div>

        <span className="w-8 shrink-0" aria-hidden />
      </div>

      {aantalOefeningen > 1 && (
        <Studietip
          className="max-w-md mx-auto"
          tekst={t("oefenen.herhalen.tipGemengd")}
        />
      )}

      <FlashcardPlayer
        cards={beurten.map((b) => b.kaart)}
        onBeoordeeld={onthoud}
        naRonde={t("oefenen.herhalen.naRonde")}
      />

      <p className="max-w-lg mx-auto text-xs text-slate-500 text-center">
        {t("oefenen.herhalen.gemist")}
      </p>
    </div>
  );
}

export default function HerhalenPagina() {
  return (
    <FunctiePoort functie="herhalen">
      <HerhalenPaginaInhoud />
    </FunctiePoort>
  );
}
