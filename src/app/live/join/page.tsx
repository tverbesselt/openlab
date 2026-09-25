"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { opslag, apparaatId } from "@/lib/opslag";
import { LiveSessie } from "@/lib/types";
import { WedstrijdToestel } from "@/components/wedstrijd/WedstrijdToestel";
import { BordToestel } from "@/components/bord/BordToestel";
import { t } from "@/lib/i18n";
import { tr } from "@/lib/i18n/rijk";

/*
 * De cursist: pincode intypen (of via de QR-code al ingevuld), de vraag zien zodra de
 * leraar ze projecteert, antwoorden, en daarna rustig naar het bord kijken.
 *
 * Bij de begripsmeter blijft het scherm bruikbaar: die mag je de hele les bijstellen.
 */

const METER_KLEUREN = [
  "bg-emerald-50 border-emerald-400 text-emerald-900",
  "bg-amber-50 border-amber-400 text-amber-900",
  "bg-rose-50 border-rose-400 text-rose-900",
];
const METER_ACTIEF = [
  "bg-emerald-500 border-emerald-600 text-white",
  "bg-amber-500 border-amber-600 text-white",
  "bg-rose-500 border-rose-600 text-white",
];

function DeelnemenInhoud() {
  const searchParams = useSearchParams();
  const [pincode, setPincode] = useState(() =>
    (searchParams.get("code") ?? "").replace(/\D/g, "").slice(0, 6)
  );
  const [codeActief, setCodeActief] = useState<string | null>(null);
  const [fout, setFout] = useState("");

  // Met een QR-code sla je het intypen over.
  useEffect(() => {
    if (pincode.length === 6 && !codeActief) setCodeActief(pincode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (codeActief) {
    return (
      <Sessie
        code={codeActief}
        onWeg={(melding) => {
          setCodeActief(null);
          setFout(melding);
        }}
      />
    );
  }

  return (
    <div className="max-w-sm mx-auto py-8 u-fade">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
        <h1 className="text-xl font-extrabold text-merk-900 mb-1">{t("live.deelnemen.titel")}</h1>
        <p className="text-sm text-slate-600 mb-6">{t("live.deelnemen.uitleg")}</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pincode.length === 6) {
              setFout("");
              setCodeActief(pincode);
            }
          }}
          className="space-y-3"
        >
          <input
            type="text"
            inputMode="numeric"
            value={pincode.length > 3 ? `${pincode.slice(0, 3)} ${pincode.slice(3)}` : pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000 000"
            autoComplete="off"
            aria-label={t("live.deelnemen.pincodeLabel")}
            className="w-full px-4 py-3 text-center text-2xl tracking-[0.2em] rounded-xl bg-white border border-veldrand text-slate-900 font-mono font-bold placeholder-slate-500 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
          />
          {fout && (
            <p role="alert" className="text-sm font-semibold text-rose-800 bg-rose-50 rounded-xl px-3 py-2.5 flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{fout}</span>
            </p>
          )}
          <button
            type="submit"
            disabled={pincode.length !== 6}
            className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm transition-colors"
          >
            {t("live.deelnemen.doeMee")}
          </button>
        </form>
      </div>
    </div>
  );
}

function Sessie({ code, onWeg }: { code: string; onWeg: (melding: string) => void }) {
  const [sessie, setSessie] = useState<LiveSessie | null | undefined>(undefined);
  const [gekozen, setGekozen] = useState<number | null>(null);
  const [woord, setWoord] = useState("");
  const [toestand, setToestand] = useState<"open" | "bezig" | "geantwoord">("open");
  const [fout, setFout] = useState("");

  useEffect(() => {
    const stop = opslag.volgSessie(code, setSessie);
    return () => stop();
  }, [code]);

  // Al eerder geantwoord op dit toestel? Dan meteen naar "bedankt".
  useEffect(() => {
    try {
      if (sessionStorage.getItem(`openlab_geantwoord_${code}`)) setToestand("geantwoord");
    } catch {
      // Zonder sessionStorage vangen de opslagregels dubbel stemmen op.
    }
  }, [code]);

  useEffect(() => {
    if (sessie === null) onWeg(t("live.deelnemen.nietGevonden"));
  }, [sessie, onWeg]);

  const isMeter = sessie?.type === "begripsmeter";

  const antwoord = async (inhoud: { optie?: number; woord?: string }) => {
    if (toestand === "bezig") return;
    if (toestand === "geantwoord" && !isMeter) return;

    setToestand("bezig");
    setFout("");
    try {
      await opslag.stuurAntwoord(code, {
        apparaat: apparaatId(),
        op: new Date().toISOString(),
        ...inhoud,
      });
      if (typeof inhoud.optie === "number") setGekozen(inhoud.optie);
      try {
        sessionStorage.setItem(`openlab_geantwoord_${code}`, "1");
      } catch {
        // Niet erg.
      }
      setToestand("geantwoord");
    } catch {
      setToestand("open");
      setFout(t("live.deelnemen.nietAangekomen"));
    }
  };

  if (sessie === undefined || sessie === null) {
    return <p className="text-center py-20 text-sm text-slate-500">{t("live.deelnemen.verbinden")}</p>;
  }

  // Een quizwedstrijd heeft zijn eigen verloop: bijnaam, vragen, tussenstand, podium.
  if (sessie.type === "quiz" && sessie.quiz) {
    return <WedstrijdToestel code={code} sessie={sessie} />;
  }

  // Een whiteboard: zelf iets toevoegen en het bord meevolgen.
  if (sessie.type === "bord" && sessie.bord) {
    return <BordToestel code={code} sessie={sessie} />;
  }

  if (sessie.status === "afgesloten") {
    return (
      <div className="max-w-sm mx-auto text-center py-16 u-fade">
        <h1 className="text-xl font-extrabold text-merk-900 mb-1">{t("live.deelnemen.afgelopen")}</h1>
        <p className="text-sm text-slate-600">{t("live.deelnemen.bedankt")}</p>
      </div>
    );
  }

  /* ── Begripsmeter: blijft de hele les bruikbaar ─────────────────────────── */
  if (isMeter) {
    return (
      <div className="max-w-sm mx-auto py-6 u-fade">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h1 className="text-lg font-extrabold text-merk-900 leading-snug mb-1">
            {sessie.vraag}
          </h1>
          <p className="text-sm text-slate-600 mb-5">
            {t("live.deelnemen.meterUitleg")}
          </p>

          <div className="space-y-2">
            {sessie.opties.map((optie, idx) => {
              const actief = gekozen === idx;
              return (
                <button
                  key={idx}
                  onClick={() => antwoord({ optie: idx })}
                  disabled={toestand === "bezig"}
                  aria-pressed={actief}
                  className={`w-full px-4 py-4 rounded-xl border-2 text-base font-bold transition-colors ${
                    actief ? METER_ACTIEF[idx] : METER_KLEUREN[idx]
                  }`}
                >
                  {optie}
                </button>
              );
            })}
          </div>

          {gekozen !== null && (
            <p className="mt-4 text-sm text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-merk shrink-0" />
              <span>
                {tr(
                  "live.deelnemen.leraarZiet",
                  { b: (inhoud) => <strong>{inhoud}</strong> },
                  { keuze: sessie.opties[gekozen].toLowerCase() }
                )}
              </span>
            </p>
          )}

          {fout && (
            <p role="alert" className="mt-3 text-sm font-semibold text-rose-800 bg-rose-50 rounded-xl px-3 py-2.5">
              {fout}
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ── Stemming of woordwolk: één antwoord ────────────────────────────────── */
  if (toestand === "geantwoord") {
    return (
      <div className="max-w-sm mx-auto text-center py-16 u-fade">
        <CheckCircle2 className="w-12 h-12 text-merk mx-auto mb-3" />
        <h1 className="text-xl font-extrabold text-merk-900 mb-1">{t("live.deelnemen.binnen")}</h1>
        <p className="text-sm text-slate-600">
          {sessie.toonResultaten
            ? t("live.deelnemen.kijkScherm")
            : t("live.deelnemen.leraarBespreekt")}
        </p>
      </div>
    );
  }

  const isSnel = sessie.type === "snellevraag";

  return (
    <div className="max-w-sm mx-auto py-6 u-fade">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <p className="text-xs font-bold text-slate-500 mb-1">{sessie.titel}</p>
        <h1 className="text-lg font-extrabold text-merk-900 leading-snug mb-5">{sessie.vraag}</h1>

        {sessie.type === "wordcloud" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (woord.trim()) antwoord({ woord: woord.trim().slice(0, 60) });
            }}
            className="space-y-3"
          >
            <input
              type="text"
              value={woord}
              onChange={(e) => setWoord(e.target.value)}
              maxLength={60}
              placeholder={t("live.deelnemen.typWoord")}
              autoFocus
              className="w-full px-4 py-3 text-lg font-bold rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!woord.trim() || toestand === "bezig"}
              className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm transition-colors"
            >
              {t("live.deelnemen.stuur")}
            </button>
          </form>
        ) : (
          <div className={isSnel ? "grid grid-cols-2 gap-3" : "space-y-2"}>
            {sessie.opties.map((optie, idx) => (
              <button
                key={idx}
                onClick={() => antwoord({ optie: idx })}
                disabled={toestand === "bezig"}
                className={
                  isSnel
                    ? "py-8 rounded-2xl border-2 border-slate-200 bg-white text-3xl font-black text-merk-900 hover:border-merk hover:bg-merk-50 transition-colors"
                    : "w-full text-left px-4 py-3.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 hover:border-merk transition-colors"
                }
              >
                {optie}
              </button>
            ))}
          </div>
        )}

        {fout && (
          <p role="alert" className="mt-3 text-sm font-semibold text-rose-800 bg-rose-50 rounded-xl px-3 py-2.5">
            {fout}
          </p>
        )}

        <p className="mt-4 text-xs text-slate-500">{t("live.deelnemen.anoniem")}</p>
      </div>
    </div>
  );
}

export default function DeelnemenPagina() {
  return (
    <Suspense fallback={<div className="h-64" aria-hidden />}>
      <DeelnemenInhoud />
    </Suspense>
  );
}
