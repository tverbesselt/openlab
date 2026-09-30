"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, Loader2, Mic, Square, Trash2, Type } from "lucide-react";
import { foutMelding, kanOpnemen, schrijfUit, useSpraakKlaar } from "@/lib/inlezen";
import { STANDAARD_TAAL, TALEN } from "@/lib/spraak";
import { t } from "@/lib/i18n";

/*
 * Audio naar tekst: wat je zegt, verschijnt als tekst. Bijna live: de opname wordt geknipt
 * bij elke korte pauze en elk stukje gaat meteen naar Whisper. De tekst komt dus zin per
 * zin binnen, een paar seconden na het spreken, en niet woord per woord.
 *
 * Knippen bij een pauze en niet op een vaste klok, want een woord dat midden in een stuk
 * doorgeknipt wordt, verstaat Whisper niet meer. Stukken zonder spraak gaan niet weg: dat
 * spaart geld, en Whisper verzint soms tekst bij stilte.
 *
 * Werkt pas als een beheerder een sleutel van OpenAI instelde (Beheer > Spraak).
 */

/** Een stuk is minstens zo lang voor we bij een pauze knippen. */
const MIN_STUK_MS = 4000;
/** Zo lang moet het stil zijn om te knippen. */
const PAUZE_MS = 600;
/** Wie zonder pauze doorpraat, krijgt toch een stuk na deze tijd. */
const MAX_STUK_MS = 25000;
/** Na een uur stopt de opname vanzelf. */
const MAX_OPNAME_MS = 60 * 60 * 1000;

function tijd(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function AudioNaarTekst() {
  const spraakKlaar = useSpraakKlaar("audiotekst");
  const [taal, setTaal] = useState(STANDAARD_TAAL);
  const [opnemen, setOpnemen] = useState(false);
  const [duur, setDuur] = useState(0);
  const [tekst, setTekst] = useState("");
  const [wachtend, setWachtend] = useState(0);
  const [melding, setMelding] = useState("");
  const [groot, setGroot] = useState(false);
  const [gekopieerd, setGekopieerd] = useState(false);
  const [kan, setKan] = useState(true);

  // Alles rond de opname leeft in refs: de meetlus mag niet bij elke render herstarten.
  const stroom = useRef<MediaStream | null>(null);
  const context = useRef<AudioContext | null>(null);
  const opnemer = useRef<MediaRecorder | null>(null);
  const lus = useRef<ReturnType<typeof setInterval> | null>(null);
  const tekstRef = useRef("");
  // Stukken komen niet altijd in volgorde terug; we plakken ze pas aan als ze aan de beurt zijn.
  const volgnummer = useRef(0);
  const aanDeBeurt = useRef(0);
  const klaar = useRef(new Map<number, string>());
  const tekstvak = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setKan(kanOpnemen());
    return () => stopAlles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live meelezen: het vak volgt de nieuwste tekst.
  useEffect(() => {
    if (opnemen && tekstvak.current) tekstvak.current.scrollTop = tekstvak.current.scrollHeight;
  }, [tekst, opnemen]);

  const zetTekst = (nieuw: string) => {
    tekstRef.current = nieuw;
    setTekst(nieuw);
  };

  const plakAan = () => {
    let nieuw = tekstRef.current;
    while (klaar.current.has(aanDeBeurt.current)) {
      const stuk = klaar.current.get(aanDeBeurt.current) ?? "";
      klaar.current.delete(aanDeBeurt.current);
      aanDeBeurt.current += 1;
      if (stuk) nieuw = nieuw ? `${nieuw} ${stuk}` : stuk;
    }
    zetTekst(nieuw);
  };

  const verstuur = async (opname: Blob) => {
    const nummer = volgnummer.current++;
    setWachtend((n) => n + 1);
    try {
      const stuk = await schrijfUit(opname, taal, tekstRef.current);
      klaar.current.set(nummer, stuk);
    } catch (e) {
      klaar.current.set(nummer, "");
      setMelding((e as Error).message || foutMelding("mislukt"));
      // Lukt het niet, dan lukt het volgende stuk meestal ook niet: stoppen spaart frustratie.
      stopAlles();
    } finally {
      setWachtend((n) => n - 1);
      plakAan();
    }
  };

  /** Start een nieuw stuk op dezelfde microfoon. */
  const nieuwStuk = (spraakGehoord: { waarde: boolean }) => {
    if (!stroom.current) return;
    const rec = new MediaRecorder(stroom.current);
    const delen: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) delen.push(e.data);
    };
    rec.onstop = () => {
      if (spraakGehoord.waarde && delen.length > 0) {
        void verstuur(new Blob(delen, { type: rec.mimeType || "audio/webm" }));
      }
    };
    rec.start();
    opnemer.current = rec;
  };

  function stopAlles() {
    if (lus.current) clearInterval(lus.current);
    lus.current = null;
    if (opnemer.current?.state === "recording") opnemer.current.stop();
    opnemer.current = null;
    stroom.current?.getTracks().forEach((t) => t.stop());
    stroom.current = null;
    void context.current?.close().catch(() => {});
    context.current = null;
    setOpnemen(false);
  }

  const start = async () => {
    setMelding("");
    try {
      stroom.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch {
      setMelding(foutMelding("geenMicrofoon"));
      return;
    }

    // Het volume meten om pauzes te vinden.
    const ctx = new AudioContext();
    context.current = ctx;
    const meter = ctx.createAnalyser();
    meter.fftSize = 2048;
    ctx.createMediaStreamSource(stroom.current).connect(meter);
    const monsters = new Float32Array(meter.fftSize);

    let ruis = 0.01;
    let stukBegin = Date.now();
    let stilSinds: number | null = null;
    let spraak = { waarde: false };
    const opnameBegin = Date.now();

    nieuwStuk(spraak);
    setOpnemen(true);
    setDuur(0);

    lus.current = setInterval(() => {
      const nu = Date.now();
      meter.getFloatTimeDomainData(monsters);
      let som = 0;
      for (const m of monsters) som += m * m;
      const volume = Math.sqrt(som / monsters.length);

      // De achtergrondruis van het lokaal volgen: snel omlaag, heel traag omhoog.
      ruis = volume < ruis ? volume : ruis + (volume - ruis) * 0.002;
      const praat = volume > Math.max(0.01, ruis * 3);

      if (praat) {
        spraak.waarde = true;
        stilSinds = null;
      } else if (stilSinds === null) {
        stilSinds = nu;
      }

      const lengte = nu - stukBegin;
      const pauze = stilSinds !== null && nu - stilSinds >= PAUZE_MS;
      if ((lengte >= MIN_STUK_MS && pauze) || lengte >= MAX_STUK_MS) {
        // Alleen knippen als er iets gezegd is; anders loopt het stille stuk gewoon door.
        if (spraak.waarde || lengte >= MAX_STUK_MS) {
          opnemer.current?.stop();
          spraak = { waarde: false };
          stukBegin = nu;
          nieuwStuk(spraak);
        }
      }

      setDuur(nu - opnameBegin);
      if (nu - opnameBegin >= MAX_OPNAME_MS) stopAlles();
    }, 100);
  };

  const kopieer = async () => {
    try {
      await navigator.clipboard.writeText(tekst);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 2000);
    } catch {
      setMelding(t("spraak.tool.kopierenMislukt"));
    }
  };

  const download = () => {
    const bestand = new Blob([tekst], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(bestand);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${t("spraak.tool.bestandsnaam")}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (spraakKlaar === null) return <div className="h-48" aria-hidden />;

  if (!spraakKlaar) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-sm text-slate-600">
        {t("spraak.tool.nietKlaar")}
      </div>
    );
  }

  if (!kan) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-sm text-slate-600">
        {t("spraak.tool.geenBrowser")}
      </div>
    );
  }

  const bezig = opnemen || wachtend > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <span>{t("spraak.tool.taal")}</span>
          <select
            value={taal}
            onChange={(e) => setTaal(e.target.value)}
            disabled={opnemen}
            className="p-2 text-sm rounded-lg bg-white border border-veldrand text-slate-900 disabled:opacity-60"
          >
            {TALEN.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

        {opnemen ? (
          <button
            type="button"
            onClick={stopAlles}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-sm font-bold"
          >
            <Square className="w-4 h-4" aria-hidden />
            <span>{t("spraak.knop.stop", { tijd: tijd(duur) })}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={wachtend > 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-60 text-white text-sm font-bold"
          >
            <Mic className="w-4 h-4" aria-hidden />
            <span>{tekst ? t("spraak.tool.verder") : t("spraak.tool.start")}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setGroot(!groot)}
          aria-pressed={groot}
          className={`ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-colors ${
            groot
              ? "bg-merk-50 border-merk-800 text-merk-900"
              : "bg-white border-slate-300 text-slate-700 hover:border-merk"
          }`}
        >
          <Type className="w-3.5 h-3.5" aria-hidden />
          <span>{t("spraak.tool.grooteLetters")}</span>
        </button>
      </div>

      {opnemen ? (
        <div
          ref={tekstvak}
          aria-live="polite"
          className={`min-h-48 max-h-[60vh] overflow-y-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 whitespace-pre-wrap ${
            groot ? "text-3xl leading-snug font-semibold" : "text-base leading-relaxed"
          }`}
        >
          {tekst || <span className="text-slate-400">{t("spraak.tool.beginTePraten")}</span>}
        </div>
      ) : (
        <textarea
          value={tekst}
          onChange={(e) => zetTekst(e.target.value)}
          readOnly={wachtend > 0}
          rows={groot ? 8 : 10}
          placeholder={t("spraak.tool.placeholder")}
          aria-label={t("spraak.knop.tekstLabel")}
          className={`w-full p-4 rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none ${
            groot ? "text-3xl leading-snug font-semibold" : "text-base leading-relaxed"
          }`}
        />
      )}

      <div className="flex flex-wrap items-center gap-2 min-h-9">
        {wachtend > 0 && (
          <span role="status" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
            {t("spraak.knop.bezig")}
          </span>
        )}
        {melding && (
          <span role="alert" className="text-xs font-semibold text-rose-800">
            {melding}
          </span>
        )}
        {!bezig && tekst && (
          <div className="flex flex-wrap gap-2 ml-auto">
            <button
              type="button"
              onClick={kopieer}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-merk-800 hover:bg-merk-900 text-white text-xs font-bold"
            >
              {gekopieerd ? <Check className="w-3.5 h-3.5" aria-hidden /> : <Copy className="w-3.5 h-3.5" aria-hidden />}
              <span>{gekopieerd ? t("spraak.tool.gekopieerd") : t("spraak.tool.kopieer")}</span>
            </button>
            <button
              type="button"
              onClick={download}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:border-merk text-slate-800 text-xs font-bold"
            >
              <Download className="w-3.5 h-3.5" aria-hidden />
              <span>{t("spraak.tool.download")}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                zetTekst("");
                setMelding("");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 hover:text-rose-700 text-xs font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden />
              <span>{t("spraak.tool.wissen")}</span>
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">{t("spraak.tool.privacy")}</p>
    </div>
  );
}
