"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  RotateCcw,
  Settings2,
  Check,
  Plus,
  Trash2,
  Presentation,
} from "lucide-react";
import QRCode from "qrcode";
import { useMateriaal } from "@/lib/opslag";
import { useAuth } from "@/lib/auth/AuthProvider";
import { isEigenMateriaal, isKlassikaal } from "@/lib/labels";
import { LeraarPoort } from "@/components/LeraarPoort";
import { Studietip } from "@/components/Studietip";
import { KLASOPDRACHTEN } from "@/lib/studietips";
import { merkTint } from "@/lib/instellingen/kleur";
import { FunctiePoort } from "@/components/FunctiePoort";
import { t } from "@/lib/i18n";
import { tr } from "@/lib/i18n/rijk";

/*
 * Eén scherm dat de hele les kan blijven staan: de lesdoelen, de opdracht van dit moment,
 * een klok en de code van de oefening.
 *
 * Rosenshine zet doelen vooraf en een zichtbare opdracht bij de kern van goed lesgeven;
 * hier hoeft de leraar daar niet telkens een dia voor te maken. Alles staat groot en
 * rustig, want dit hangt achteraan in de klas ook nog leesbaar te zijn.
 */

const OPSLAG = "openlab_digibord";

interface Bordinhoud {
  doelen: string[];
  opdracht: string;
  oefeningId: string;
}

const LEEG: Bordinhoud = { doelen: [""], opdracht: "", oefeningId: "" };

function DigibordPaginaInhoud() {
  const { isLeraar, gebruiker } = useAuth();
  const { oefeningen, laden } = useMateriaal();

  const [inhoud, setInhoud] = useState<Bordinhoud>(LEEG);
  const [instellen, setInstellen] = useState(true);
  const [qr, setQr] = useState("");

  // Een klasopdracht zet de klok op haar tijd. De sleutel laat de klok opnieuw beginnen.
  const [klok, setKlok] = useState({ minuten: 5, sleutel: 0 });

  // Wat je vorige les intypte, staat er nog: een lesdoel verandert niet elke dag.
  useEffect(() => {
    try {
      const bewaard = localStorage.getItem(OPSLAG);
      if (bewaard) setInhoud({ ...LEEG, ...JSON.parse(bewaard) });
    } catch {
      // Geen opslag: dan begin je met een leeg bord.
    }
  }, []);

  const bewaar = (nieuw: Bordinhoud) => {
    setInhoud(nieuw);
    try {
      localStorage.setItem(OPSLAG, JSON.stringify(nieuw));
    } catch {
      // Niet erg; het bord werkt ook zonder onthouden.
    }
  };

  const deelbaar = useMemo(
    () => oefeningen.filter((ex) => !isKlassikaal(ex) && isEigenMateriaal(ex, gebruiker)),
    [oefeningen, gebruiker]
  );
  const gekozen = deelbaar.find((ex) => ex.id === inhoud.oefeningId);

  useEffect(() => {
    if (!gekozen) {
      setQr("");
      return;
    }
    QRCode.toDataURL(`${window.location.origin}/oefen/${gekozen.id}`, {
      width: 260,
      margin: 2,
      color: { dark: merkTint("900"), light: "#ffffff" },
    })
      .then(setQr)
      .catch(() => setQr(""));
  }, [gekozen]);

  if (laden) return <div className="h-64" aria-hidden />;

  if (!isLeraar) {
    return (
      <LeraarPoort uitleg={t("klas.digibord.leraarPoort")} />
    );
  }

  const doelen = inhoud.doelen.map((d) => d.trim()).filter(Boolean);

  return (
    <div className="space-y-5 u-fade">
      <div className="flex items-center justify-between gap-3 niet-afdrukken">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-merk-900 tracking-tight">
            {t("klas.digibord.titel")}
          </h1>
          <p className="text-sm text-slate-600">
            {t("klas.digibord.intro")}
          </p>
        </div>

        <button
          onClick={() => setInstellen(!instellen)}
          className="shrink-0 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-merk text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5"
        >
          {instellen ? <Presentation className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
          <span>{instellen ? t("klas.digibord.alleenBord") : t("klas.digibord.aanpassen")}</span>
        </button>
      </div>

      {/* Het bord zelf */}
      <div className="bg-merk-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 min-w-0">
            {doelen.length > 0 && (
              <section className="mb-8">
                <span className="text-xs uppercase font-bold tracking-widest text-white/70 block mb-3">
                  {t("klas.digibord.vandaag")}
                </span>
                <ul className="space-y-2">
                  {doelen.map((doel, i) => (
                    <li key={i} className="flex items-start gap-3 text-lg sm:text-2xl font-bold leading-snug">
                      <Check className="w-6 h-6 shrink-0 mt-1 text-merk-300" />
                      <span>{doel}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <span className="text-xs uppercase font-bold tracking-widest text-white/70 block mb-3">
                {t("klas.digibord.nu")}
              </span>
              {inhoud.opdracht.trim() ? (
                <p className="text-2xl sm:text-4xl font-extrabold leading-snug">
                  {inhoud.opdracht}
                </p>
              ) : (
                <p className="text-lg text-white/60">
                  {t("klas.digibord.typHieronder")}
                </p>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <Bordklok key={klok.sleutel} beginMinuten={klok.minuten} />

            {gekozen && (
              <div className="bg-white text-merk-900 rounded-2xl p-4 flex flex-col items-center text-center">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  {t("klas.digibord.oefeningVanLes")}
                </span>
                {qr && <img src={qr} alt={t("klas.digibord.qrAlt")} className="w-36 h-36 rounded-lg" />}
                <span className="font-mono text-2xl font-black tracking-widest mt-2">
                  {gekozen.shareCode}
                </span>
                <span className="text-xs text-slate-500 mt-1 line-clamp-2">{gekozen.title}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instellen */}
      {instellen && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 niet-afdrukken">
          <div>
            <span className="block text-sm font-bold text-slate-800 mb-1">{t("klas.digibord.lesdoelen")}</span>
            <span className="block text-xs text-slate-500 mb-2">
              {t("klas.digibord.lesdoelenUitleg")}
            </span>
            <div className="space-y-2">
              {inhoud.doelen.map((doel, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={doel}
                    onChange={(e) =>
                      bewaar({
                        ...inhoud,
                        doelen: inhoud.doelen.map((d, i) => (i === index ? e.target.value : d)),
                      })
                    }
                    placeholder={t("klas.digibord.doelVoorbeeld")}
                    aria-label={t("klas.digibord.doel", { n: index + 1 })}
                    className="flex-1 p-3 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
                  />
                  {inhoud.doelen.length > 1 && (
                    <button
                      onClick={() =>
                        bewaar({ ...inhoud, doelen: inhoud.doelen.filter((_, i) => i !== index) })
                      }
                      className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                      aria-label={t("klas.digibord.doelVerwijderen", { n: index + 1 })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {inhoud.doelen.length < 5 && (
              <button
                onClick={() => bewaar({ ...inhoud, doelen: [...inhoud.doelen, ""] })}
                className="mt-2 w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:border-merk hover:text-merk-900 font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{t("klas.digibord.nogEenDoel")}</span>
              </button>
            )}
          </div>

          <Studietip plek="digibord" toon="toelichting" />

          <label className="block">
            <span className="block text-sm font-bold text-slate-800 mb-1">{t("klas.digibord.watNu")}</span>
            <span className="block text-xs text-slate-500 mb-2">
              {t("klas.digibord.watNuUitleg")}
            </span>
            <input
              type="text"
              value={inhoud.opdracht}
              onChange={(e) => bewaar({ ...inhoud, opdracht: e.target.value })}
              placeholder={t("klas.digibord.opdrachtVoorbeeld")}
              className="w-full p-3 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
            />
          </label>

          <div className="-mt-2">
            <span className="block text-xs text-slate-500 mb-2">
              {t("klas.digibord.kiesKort")}
            </span>
            <div className="flex flex-wrap gap-2">
              {KLASOPDRACHTEN.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    bewaar({ ...inhoud, opdracht: o.opdracht });
                    setKlok((vorige) => ({ minuten: o.minuten, sleutel: vorige.sleutel + 1 }));
                  }}
                  aria-pressed={inhoud.opdracht === o.opdracht}
                  title={o.opdracht}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
                    inhoud.opdracht === o.opdracht
                      ? "bg-merk-800 text-white border-merk-800"
                      : "bg-white text-merk-900 border-merk/30 hover:bg-merk-50"
                  }`}
                >
                  {o.label} · {t("klas.minuten", { n: o.minuten })}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="block text-sm font-bold text-slate-800 mb-1">
              {t("klas.digibord.delen")}{" "}
              <span className="font-normal text-slate-500">{t("klas.magLeeg")}</span>
            </span>
            <span className="block text-xs text-slate-500 mb-2">
              {t("klas.digibord.delenUitleg")}
            </span>
            <select
              value={inhoud.oefeningId}
              onChange={(e) => bewaar({ ...inhoud, oefeningId: e.target.value })}
              className="w-full p-2.5 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
            >
              <option value="">{t("klas.digibord.geenOefening")}</option>
              {deelbaar.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title}
                </option>
              ))}
            </select>
            {deelbaar.length === 0 && (
              <span className="block text-xs text-slate-500 mt-2">
                {tr("klas.digibord.geenEigen", {
                  link: (s) => (
                    <Link href="/maken" className="font-bold text-merk-900 hover:underline">
                      {s}
                    </Link>
                  ),
                })}
              </span>
            )}
          </label>
        </div>
      )}
    </div>
  );
}

/** Grote klok voor op het bord: aftellen of gewoon laten lopen. */
function Bordklok({ beginMinuten = 5 }: { beginMinuten?: number }) {
  const [seconden, setSeconden] = useState(beginMinuten * 60);
  const [begin, setBegin] = useState(beginMinuten * 60);
  const [loopt, setLoopt] = useState(false);
  const tik = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!loopt) return;
    tik.current = setInterval(() => {
      setSeconden((vorige) => {
        if (vorige <= 1) {
          setLoopt(false);
          return 0;
        }
        return vorige - 1;
      });
    }, 1000);
    return () => {
      if (tik.current) clearInterval(tik.current);
    };
  }, [loopt]);

  const zet = (minuten: number) => {
    setBegin(minuten * 60);
    setSeconden(minuten * 60);
    setLoopt(false);
  };

  const minuten = Math.floor(seconden / 60);
  const rest = seconden % 60;
  const afgelopen = seconden === 0;

  return (
    <div className="bg-white/10 rounded-2xl p-4 text-center">
      <span className="text-[11px] font-bold uppercase tracking-widest text-white/70 block mb-2">
        {t("klas.digibord.klok.tijd")}
      </span>

      <p
        className={`font-mono text-5xl font-black tabular-nums mb-3 ${
          afgelopen ? "text-amber-300" : "text-white"
        }`}
        aria-live="polite"
      >
        {String(minuten).padStart(2, "0")}:{String(rest).padStart(2, "0")}
      </p>

      <div className="flex justify-center gap-2 mb-3">
        <button
          onClick={() => setLoopt(!loopt)}
          disabled={afgelopen}
          className="px-3 py-2 rounded-xl bg-white text-merk-900 hover:bg-white/90 disabled:opacity-50 font-bold text-xs transition-colors flex items-center gap-1.5"
        >
          {loopt ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{loopt ? t("klas.digibord.klok.pauze") : t("klas.digibord.klok.start")}</span>
        </button>
        <button
          onClick={() => {
            setSeconden(begin);
            setLoopt(false);
          }}
          className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t("klas.digibord.klok.terug")}</span>
        </button>
      </div>

      <div className="flex justify-center gap-1.5">
        {[2, 5, 10, 15].map((m) => (
          <button
            key={m}
            onClick={() => zet(m)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              begin === m * 60 ? "bg-white text-merk-900" : "bg-white/15 text-white hover:bg-white/25"
            }`}
          >
            {t("klas.digibord.klok.minuten", { n: m })}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DigibordPagina() {
  return (
    <FunctiePoort functie="digibord">
      <DigibordPaginaInhoud />
    </FunctiePoort>
  );
}
