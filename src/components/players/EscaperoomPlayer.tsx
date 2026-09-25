"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, KeyRound, Lightbulb, Lock, LockOpen, RotateCcw, Users } from "lucide-react";
import { Escaperoom } from "@/lib/types";
import { POGINGEN_VOOR_OPLOSSING, opentSlot } from "@/lib/escaperoom";
import { MAX_TYPANTWOORD, toonAntwoord } from "@/lib/typantwoord";
import { VraagMedia } from "./VraagMedia";
import { t, tn } from "@/lib/i18n";

/*
 * Escaperoom: de sloten gaan één voor één open, telkens met het juiste antwoord.
 *
 * Bedoeld om samen op te lossen. Er loopt geen klok en er zijn geen punten: het gaat om
 * het overleg in het groepje, niet om wie het snelst is. Wil de leraar toch een tijd, dan
 * zet hij de klastimer op het digibord.
 *
 * Niemand mag vastlopen. Wie hulp zoekt, leest de hint. Na een paar foute pogingen mag de
 * cursist de oplossing bekijken en verder; op het einde ziet hij hoeveel sloten hij op
 * eigen kracht opende.
 */
export function EscaperoomPlayer({ escaperoom }: { escaperoom: Escaperoom }) {
  const { sloten } = escaperoom;
  const [fase, setFase] = useState<"start" | "bezig" | "klaar">("start");
  const [index, setIndex] = useState(0);
  const [invoer, setInvoer] = useState("");
  const [pogingen, setPogingen] = useState(0);
  const [dicht, setDicht] = useState(false);
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState(false);
  const [oplossing, setOplossing] = useState(false);
  /** Sloten die pas opengingen na het bekijken van de oplossing. */
  const [metHulp, setMetHulp] = useState<string[]>([]);

  const invoerRef = useRef<HTMLInputElement>(null);
  const verderRef = useRef<HTMLButtonElement>(null);

  const huidig = sloten[index];

  // Na een open slot staat de focus op "verder", anders op het invoerveld: zo kan je met
  // alleen het toetsenbord door de hele escaperoom.
  useEffect(() => {
    if (fase !== "bezig") return;
    if (open) verderRef.current?.focus();
    else invoerRef.current?.focus();
  }, [fase, index, open]);

  if (sloten.length === 0) return null;

  const begin = () => {
    setFase("bezig");
    setIndex(0);
    setMetHulp([]);
    nieuwSlot();
  };

  const nieuwSlot = () => {
    setInvoer("");
    setPogingen(0);
    setDicht(false);
    setOpen(false);
    setHint(false);
    setOplossing(false);
  };

  const probeer = (e: React.FormEvent) => {
    e.preventDefault();
    if (open || !invoer.trim()) return;
    if (opentSlot(invoer, huidig.antwoorden)) {
      setOpen(true);
      setDicht(false);
    } else {
      setPogingen(pogingen + 1);
      setDicht(true);
    }
  };

  const toonOplossing = () => {
    setOplossing(true);
    setOpen(true);
    setDicht(false);
    setInvoer(toonAntwoord(huidig.antwoorden));
    setMetHulp([...metHulp, huidig.id]);
  };

  const verder = () => {
    if (index + 1 < sloten.length) {
      setIndex(index + 1);
      nieuwSlot();
    } else {
      setFase("klaar");
    }
  };

  /** Hoeveel sloten zijn er al open, voor de rij bovenaan. */
  const aantalOpen = fase === "klaar" ? sloten.length : index + (open ? 1 : 0);

  const slotenrij = (
    <ol className="flex flex-wrap justify-center gap-2 mb-6" aria-label={t("oefenen.escaperoom.voortgang")}>
      {sloten.map((slot, i) => {
        const isOpen = i < aantalOpen;
        const isHuidig = fase === "bezig" && i === index;
        const Icoon = isOpen ? LockOpen : Lock;
        return (
          <li
            key={slot.id}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              isOpen
                ? "bg-merk-50 text-merk-900"
                : "bg-slate-100 text-slate-400"
            } ${isHuidig ? "ring-2 ring-merk-800" : ""}`}
          >
            <Icoon className="w-4 h-4" aria-hidden />
            <span className="sr-only">
              {t(
                isOpen
                  ? isHuidig
                    ? "oefenen.escaperoom.slotOpenHier"
                    : "oefenen.escaperoom.slotOpen"
                  : isHuidig
                    ? "oefenen.escaperoom.slotDichtHier"
                    : "oefenen.escaperoom.slotDicht",
                { nr: i + 1 }
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );

  if (fase === "start") {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 u-pop">
        <KeyRound className="w-10 h-10 text-merk mx-auto mb-3" />
        <h2 className="text-xl font-extrabold text-merk-900 text-center mb-1">
          {tn("oefenen.escaperoom.teOpenen", sloten.length)}
        </h2>
        <p className="text-sm text-slate-600 text-center mb-6">
          {t("oefenen.escaperoom.uitleg")}
        </p>

        {slotenrij}

        {escaperoom.verhaal && (
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50 rounded-xl p-4 mb-6">
            {escaperoom.verhaal}
          </p>
        )}

        <p className="text-xs text-slate-600 flex items-start gap-2 mb-6">
          <Users className="w-4 h-4 shrink-0 text-merk-900" />
          <span>
            {t("oefenen.escaperoom.groepje")}
          </span>
        </p>

        <button
          onClick={begin}
          className="w-full py-3.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <span>{t("oefenen.escaperoom.begin")}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (fase === "klaar") {
    const zelf = sloten.length - metHulp.length;
    return (
      <div className="max-w-xl mx-auto bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 text-center u-pop">
        <LockOpen className="w-10 h-10 text-merk mx-auto mb-3" />
        <h2 className="text-xl font-extrabold text-merk-900 mb-1">
          {t("oefenen.escaperoom.alleOpen")}
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          {metHulp.length === 0
            ? t("oefenen.escaperoom.allesZelf")
            : t("oefenen.escaperoom.deelsZelf", { zelf, totaal: sloten.length })}
        </p>

        {slotenrij}

        {escaperoom.afloop && (
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-merk-50 rounded-xl p-4 mb-6 text-left">
            {escaperoom.afloop}
          </p>
        )}

        <button
          onClick={begin}
          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t("oefenen.speler.beginOpnieuw")}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      {slotenrij}

      <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-5">
        <span className="text-xs font-bold text-slate-500 block mb-2">
          {t("oefenen.escaperoom.slotVan", { nr: index + 1, totaal: sloten.length })}
        </span>

        {huidig.media && (
          <div className="mb-4">
            <VraagMedia media={huidig.media} />
          </div>
        )}

        <h2 className="text-lg font-extrabold text-merk-900 leading-snug whitespace-pre-line mb-5">
          {huidig.opdracht}
        </h2>

        <form onSubmit={probeer} className="flex flex-col sm:flex-row gap-2">
          <input
            ref={invoerRef}
            type="text"
            value={invoer}
            onChange={(e) => {
              setInvoer(e.target.value);
              setDicht(false);
            }}
            disabled={open}
            maxLength={MAX_TYPANTWOORD}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder={t("oefenen.escaperoom.placeholder")}
            aria-label={t("oefenen.escaperoom.invoerLabel")}
            className="flex-1 p-3 text-base rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-merk focus:outline-none disabled:opacity-70"
          />
          {!open && (
            <button
              type="submit"
              disabled={!invoer.trim()}
              className="px-5 py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{t("oefenen.escaperoom.open")}</span>
            </button>
          )}
        </form>

        <div aria-live="polite">
          {dicht && (
            <p className="mt-4 text-sm font-semibold text-amber-900 bg-amber-50 rounded-xl px-4 py-3 u-rise">
              {t("oefenen.escaperoom.blijftDicht")}
            </p>
          )}

          {open && (
            <p className="mt-4 text-sm font-semibold text-merk-900 bg-merk-50 rounded-xl px-4 py-3 flex items-center gap-2 u-rise">
              <LockOpen className="w-4 h-4 shrink-0" />
              <span>
                {oplossing
                  ? t("oefenen.escaperoom.oplossing", { antwoord: toonAntwoord(huidig.antwoorden) })
                  : t("oefenen.escaperoom.isOpen")}
              </span>
            </p>
          )}
        </div>

        {hint && huidig.hint && !open && (
          <p className="mt-4 text-sm text-slate-800 bg-slate-50 rounded-xl px-4 py-3 flex items-start gap-2 u-rise">
            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>{huidig.hint}</span>
          </p>
        )}
      </div>

      {open ? (
        <button
          ref={verderRef}
          onClick={verder}
          className="w-full py-3.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 u-rise"
        >
          <span>{index + 1 < sloten.length ? t("oefenen.escaperoom.volgendSlot") : t("oefenen.escaperoom.uitgang")}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {huidig.hint && !hint && (
            <button
              onClick={() => setHint(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              <span>{t("oefenen.escaperoom.hint")}</span>
            </button>
          )}
          {pogingen >= POGINGEN_VOOR_OPLOSSING && (
            <button
              onClick={toonOplossing}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
            >
              {t("oefenen.escaperoom.vast")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
