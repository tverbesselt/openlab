"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { QuizMedia, Slot } from "@/lib/types";
import { leesAntwoorden } from "@/lib/escaperoom";
import { t, tn } from "@/lib/i18n";
import { MediaKiezer } from "./MediaKiezer";
import type { VormProps } from "./NieuweVormen";
import { Veld, Foutmelding, MaakKnop, Toelichting, INVOER } from "./Velden";

const KLEIN_VELD =
  "w-full p-2.5 text-sm rounded-lg bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none";

interface NieuwSlot {
  /** Vaste sleutel, zodat een slot verwijderen de media van het volgende niet verschuift. */
  sleutel: string;
  opdracht: string;
  juist: string;
  /** Andere schrijfwijzen die het slot ook openen, één per regel. */
  andere: string;
  hint: string;
  media?: QuizMedia;
}

let volgnummer = 0;
const leegSlot = (): NieuwSlot => ({
  sleutel: `s${++volgnummer}`,
  opdracht: "",
  juist: "",
  andere: "",
  hint: "",
});

/**
 * Escaperoom maken: een verhaal, een reeks sloten en een afloop. Elk slot is een opdracht
 * met het antwoord dat het opent. Verhaal, hint en afloop zijn optioneel: een reeks
 * opdrachten met antwoorden is al een volwaardige escaperoom.
 */
export function EscaperoomVorm(p: VormProps) {
  const [titel, setTitel] = useState("");
  const [verhaal, setVerhaal] = useState("");
  const [afloop, setAfloop] = useState("");
  const [sloten, setSloten] = useState<NieuwSlot[]>(() => [leegSlot(), leegSlot(), leegSlot()]);
  const [uploads, setUploads] = useState(0);

  const wijzig = (sleutel: string, veld: keyof Omit<NieuwSlot, "sleutel" | "media">, waarde: string) =>
    setSloten((huidig) => huidig.map((s) => (s.sleutel === sleutel ? { ...s, [veld]: waarde } : s)));

  const gevuld = sloten.filter((s) => s.opdracht.trim() && s.juist.trim());

  const maak = (e: React.FormEvent) => {
    e.preventDefault();
    if (gevuld.length === 0) {
      p.setFout(t("maken.escaperoom.foutGeen"));
      return;
    }
    const half = sloten.find(
      (s) => (s.opdracht.trim() && !s.juist.trim()) || (!s.opdracht.trim() && s.juist.trim())
    );
    if (half) {
      p.setFout(t("maken.escaperoom.foutHalf", { n: sloten.indexOf(half) + 1 }));
      return;
    }

    const klaar: Slot[] = gevuld.map((s, i) => ({
      id: `slot-${i + 1}`,
      opdracht: s.opdracht.trim(),
      antwoorden: leesAntwoorden(s.juist, s.andere),
      ...(s.hint.trim() && { hint: s.hint.trim() }),
      ...(s.media && { media: s.media }),
    }));

    p.bewaar([
      {
        ...p.basis(),
        id: `escape-${Date.now()}`,
        title: titel.trim(),
        description: t("maken.escaperoom.beschrijving"),
        category: "collaboration",
        didacticGoal: "check",
        type: "escaperoom",
        tags: [t("maken.tags.escaperoom"), t("maken.tags.samenwerken")],
        content: {
          escaperoom: {
            ...(verhaal.trim() && { verhaal: verhaal.trim() }),
            sloten: klaar,
            ...(afloop.trim() && { afloop: afloop.trim() }),
          },
        },
        didacticConfig: {
          showImmediateFeedback: true,
          allowRetryMissed: true,
          enableGamification: false,
        },
      },
    ]);
  };

  return (
    <form onSubmit={maak} className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5">
      <Veld label={t("maken.veld.onderwerp")} hint={t("maken.escaperoom.onderwerpHint")}>
        <input
          type="text"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder={t("maken.escaperoom.titel")}
          required
          className={INVOER}
        />
      </Veld>

      <Veld
        label={t("maken.escaperoom.verhaal")}
        hint={t("maken.escaperoom.verhaalHint")}
      >
        <textarea
          rows={3}
          value={verhaal}
          onChange={(e) => setVerhaal(e.target.value)}
          placeholder={t("maken.escaperoom.verhaalVoorbeeld")}
          className={INVOER}
        />
      </Veld>

      <div className="space-y-4">
        {sloten.map((slot, index) => (
          <div key={slot.sleutel} className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-500">{t("maken.escaperoom.slot", { n: index + 1 })}</span>
              {sloten.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSloten(sloten.filter((s) => s.sleutel !== slot.sleutel))}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                  aria-label={t("maken.escaperoom.verwijder", { n: index + 1 })}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <textarea
              rows={2}
              value={slot.opdracht}
              onChange={(e) => wijzig(slot.sleutel, "opdracht", e.target.value)}
              placeholder={t("maken.escaperoom.opdracht")}
              aria-label={t("maken.escaperoom.opdrachtLabel", { n: index + 1 })}
              className={KLEIN_VELD}
            />

            <MediaKiezer
              waarde={slot.media}
              bij="opdracht"
              // Functioneel bijwerken: een upload kan klaar zijn terwijl je al verder typt.
              onWijzig={(media) =>
                setSloten((huidig) =>
                  huidig.map((s) => (s.sleutel === slot.sleutel ? { ...s, media } : s))
                )
              }
              onBezig={(b) => setUploads((n) => Math.max(0, n + (b ? 1 : -1)))}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={slot.juist}
                onChange={(e) => wijzig(slot.sleutel, "juist", e.target.value)}
                placeholder={t("maken.escaperoom.juist")}
                aria-label={t("maken.escaperoom.juistLabel", { n: index + 1 })}
                className={KLEIN_VELD}
              />
              <textarea
                rows={1}
                value={slot.andere}
                onChange={(e) => wijzig(slot.sleutel, "andere", e.target.value)}
                placeholder={t("maken.escaperoom.andere")}
                aria-label={t("maken.escaperoom.andereLabel", { n: index + 1 })}
                className={KLEIN_VELD}
              />
            </div>

            <input
              type="text"
              value={slot.hint}
              onChange={(e) => wijzig(slot.sleutel, "hint", e.target.value)}
              placeholder={t("maken.escaperoom.hint")}
              aria-label={t("maken.escaperoom.hintLabel", { n: index + 1 })}
              className={KLEIN_VELD}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setSloten([...sloten, leegSlot()])}
        className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:border-merk hover:text-merk-900 font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
      >
        <Plus className="w-4 h-4" />
        <span>{t("maken.escaperoom.nogEen")}</span>
      </button>

      <Veld
        label={t("maken.escaperoom.afloop")}
        hint={t("maken.escaperoom.afloopHint")}
      >
        <textarea
          rows={2}
          value={afloop}
          onChange={(e) => setAfloop(e.target.value)}
          placeholder={t("maken.escaperoom.afloopVoorbeeld")}
          className={INVOER}
        />
      </Veld>

      <Toelichting>
        {t("maken.escaperoom.toelichting")}{" "}
        {gevuld.length > 0 && <strong>{tn("maken.escaperoom.klaar", gevuld.length)}</strong>}
      </Toelichting>

      {p.bestemming}
      <Foutmelding tekst={p.fout} />
      <MaakKnop bezig={p.bezig} uploads={uploads} label={t("maken.knop.escaperoom")} />
    </form>
  );
}
