"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { foutMelding, kanOpnemen, schrijfUit, useSpraakKlaar } from "@/lib/inlezen";
import { t } from "@/lib/i18n";
import { INVOER } from "./Velden";

/*
 * Een tekst inlezen in plaats van typen. De opname gaat via /api/inlezen naar Whisper en
 * komt als tekst terug. Die tekst belandt eerst in een voorbeeldvak: de leraar leest hem
 * na voor hij in de oefening komt, want spraakherkenning maakt fouten.
 *
 * De knop verschijnt alleen als Inlezen aan staat in het beheer en er een sleutel is.
 */

/** Langer dan dit wordt een tekst te lang om in één keer na te lezen. */
const MAX_SECONDEN = 10 * 60;

type Stand =
  | { soort: "rust" }
  | { soort: "opnemen"; seconden: number }
  | { soort: "uitschrijven" }
  | { soort: "voorbeeld"; tekst: string }
  | { soort: "fout"; melding: string };

/** Zet een doorlopende tekst om naar één zin per regel. */
function perZin(tekst: string): string {
  return tekst
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?…])\s+(?=[A-ZÀ-ÖØ-Þ0-9"'«(¿¡])/u)
    .map((z) => z.trim())
    .filter(Boolean)
    .join("\n");
}

function tijd(seconden: number): string {
  const m = Math.floor(seconden / 60);
  const s = seconden % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function InleesKnop({
  taal,
  huidig,
  onTekst,
  zinPerRegel = false,
}: {
  /** Taal van de opname, bv. nl-BE; helpt Whisper. */
  taal: string;
  /** Wat er nu al in het veld staat: bepaalt of we "toevoegen" aanbieden. */
  huidig: string;
  onTekst: (tekst: string) => void;
  /** Voor velden met één zin per regel. */
  zinPerRegel?: boolean;
}) {
  const klaar = useSpraakKlaar("inlezen");
  const [stand, setStand] = useState<Stand>({ soort: "rust" });
  const recorder = useRef<MediaRecorder | null>(null);
  const stukken = useRef<Blob[]>([]);
  const klok = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopKlok = () => {
    if (klok.current) clearInterval(klok.current);
    klok.current = null;
  };

  // Weg van de pagina tijdens het opnemen: microfoon los en klok stil.
  useEffect(
    () => () => {
      stopKlok();
      recorder.current?.stream.getTracks().forEach((t) => t.stop());
    },
    []
  );

  // Pas na het laden bekijken, anders verschilt de serverversie van die in de browser.
  const [opnemenKan, setOpnemenKan] = useState(false);
  useEffect(() => setOpnemenKan(kanOpnemen()), []);

  if (!klaar || !opnemenKan) return null;

  const uitschrijven = async (opname: Blob) => {
    setStand({ soort: "uitschrijven" });
    try {
      const tekst = await schrijfUit(opname, taal);
      if (!tekst) throw new Error(foutMelding("nietsVerstaan"));
      setStand({ soort: "voorbeeld", tekst: zinPerRegel ? perZin(tekst) : tekst });
    } catch (e) {
      setStand({ soort: "fout", melding: (e as Error).message || foutMelding("mislukt") });
    }
  };

  const start = async () => {
    let stroom: MediaStream;
    try {
      stroom = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStand({ soort: "fout", melding: foutMelding("geenMicrofoon") });
      return;
    }

    const opnemer = new MediaRecorder(stroom);
    stukken.current = [];
    opnemer.ondataavailable = (e) => {
      if (e.data.size > 0) stukken.current.push(e.data);
    };
    opnemer.onstop = () => {
      stopKlok();
      stroom.getTracks().forEach((t) => t.stop());
      const opname = new Blob(stukken.current, { type: opnemer.mimeType || "audio/webm" });
      void uitschrijven(opname);
    };
    recorder.current = opnemer;
    opnemer.start();

    setStand({ soort: "opnemen", seconden: 0 });
    const begin = Date.now();
    klok.current = setInterval(() => {
      const seconden = Math.floor((Date.now() - begin) / 1000);
      if (seconden >= MAX_SECONDEN) {
        stop();
        return;
      }
      setStand({ soort: "opnemen", seconden });
    }, 500);
  };

  const stop = () => {
    stopKlok();
    if (recorder.current?.state === "recording") recorder.current.stop();
  };

  const gebruik = (tekst: string, toevoegen: boolean) => {
    const schoon = tekst.trim();
    if (toevoegen && huidig.trim()) {
      onTekst(`${huidig.replace(/\s+$/, "")}${zinPerRegel ? "\n" : "\n\n"}${schoon}`);
    } else {
      onTekst(schoon);
    }
    setStand({ soort: "rust" });
  };

  if (stand.soort === "voorbeeld") {
    return (
      <div className="rounded-xl border border-merk-800 bg-merk-50 p-3 space-y-2">
        <p className="text-xs font-bold text-slate-800">{t("spraak.knop.naLezen")}</p>
        <textarea
          rows={6}
          value={stand.tekst}
          onChange={(e) => setStand({ soort: "voorbeeld", tekst: e.target.value })}
          aria-label={t("spraak.knop.tekstLabel")}
          className={INVOER}
        />
        <div className="flex flex-wrap gap-2">
          {huidig.trim() ? (
            <>
              <button
                type="button"
                onClick={() => gebruik(stand.tekst, true)}
                className="px-3 py-2 rounded-lg bg-merk-800 hover:bg-merk-900 text-white text-xs font-bold"
              >
                {t("spraak.knop.toevoegen")}
              </button>
              <button
                type="button"
                onClick={() => gebruik(stand.tekst, false)}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:border-merk text-slate-800 text-xs font-bold"
              >
                {t("spraak.knop.vervangen")}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => gebruik(stand.tekst, false)}
              className="px-3 py-2 rounded-lg bg-merk-800 hover:bg-merk-900 text-white text-xs font-bold"
            >
              {t("spraak.knop.gebruiken")}
            </button>
          )}
          <button
            type="button"
            onClick={() => setStand({ soort: "rust" })}
            className="px-3 py-2 rounded-lg text-slate-600 hover:text-rose-700 text-xs font-bold"
          >
            {t("spraak.knop.weggooien")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {stand.soort === "opnemen" ? (
        <button
          type="button"
          onClick={stop}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
        >
          <Square className="w-3.5 h-3.5" aria-hidden />
          <span>{t("spraak.knop.stop", { tijd: tijd(stand.seconden) })}</span>
        </button>
      ) : stand.soort === "uitschrijven" ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600" role="status">
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
          {t("spraak.knop.bezig")}
        </span>
      ) : (
        <button
          type="button"
          onClick={start}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:border-merk hover:text-merk-900 text-slate-700 text-xs font-bold transition-colors"
        >
          <Mic className="w-3.5 h-3.5" aria-hidden />
          <span>{t("spraak.knop.inlezen")}</span>
        </button>
      )}
      {stand.soort === "opnemen" && (
        <span className="text-xs text-slate-500">{t("spraak.knop.opnemen")}</span>
      )}
      {stand.soort === "rust" && (
        <span className="text-xs text-slate-500">{t("spraak.knop.uitleg")}</span>
      )}
      {stand.soort === "fout" && (
        <span role="alert" className="text-xs font-semibold text-rose-800">
          {stand.melding}
        </span>
      )}
    </div>
  );
}
