"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, Eraser, Film, ImageIcon, Mic, Pencil, RotateCcw, Send, Square, Type, Undo2 } from "lucide-react";
import { BordItem, BordSoort } from "@/lib/types";
import { MediaFout } from "@/lib/media";
import { t } from "@/lib/i18n";
import {
  BORD_SOORTEN,
  MAX_TEKST,
  audioVoorBord,
  beeldVoorBord,
  videoVoorBord,
} from "@/lib/bord";
import { BordKaart } from "./BordKaart";

/** Wat het formulier oplevert; wie het instuurt, vult apparaat, status en tijd aan. */
export type NieuwKaartje = Pick<BordItem, "soort" | "tekst" | "url" | "alt" | "kolom">;

const ICONEN: Record<BordSoort, React.ElementType> = {
  tekst: Type,
  afbeelding: ImageIcon,
  tekening: Pencil,
  video: Film,
  audio: Mic,
};

/**
 * Iets op het bord zetten. Alleen de soorten die de leraar toelaat, verschijnen; bij één
 * soort vallen de tabs weg. Foto's en opnames worden hier al verkleind, zodat de cursist
 * ziet of het lukt vóór hij op "Zet op het bord" drukt.
 */
export function BordToevoegen({
  soorten,
  maxTekens,
  maxSeconden,
  kolommen,
  onVerstuur,
  knopTekst = t("bord.toevoegen.zetOpBord"),
}: {
  soorten: BordSoort[];
  /** De grens voor tekst en onderschrift. */
  maxTekens: number;
  maxSeconden: number;
  kolommen: string[];
  onVerstuur: (kaartje: NieuwKaartje) => Promise<void>;
  knopTekst?: string;
}) {
  const toegelaten = BORD_SOORTEN.filter((s) => soorten.includes(s.soort));
  const [soort, setSoort] = useState<BordSoort>(toegelaten[0]?.soort ?? "tekst");
  const [tekst, setTekst] = useState("");
  const [url, setUrl] = useState("");
  const [link, setLink] = useState("");
  const [kolom, setKolom] = useState(0);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");
  const [tekenVersie, setTekenVersie] = useState(0);
  const tekenblad = useRef<HTMLCanvasElement | null>(null);
  const [tekenLeeg, setTekenLeeg] = useState(true);

  // Zet de leraar de gekozen soort tussendoor uit, dan springt het formulier mee.
  useEffect(() => {
    if (!soorten.includes(soort) && toegelaten[0]) wissel(toegelaten[0].soort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soorten.join(",")]);

  useEffect(() => {
    if (kolom >= kolommen.length) setKolom(0);
  }, [kolommen.length, kolom]);

  const grens = Math.min(maxTekens, MAX_TEKST);

  function wissel(nieuw: BordSoort) {
    setSoort(nieuw);
    setUrl("");
    setLink("");
    setFout("");
  }

  const leeg = () => {
    setTekst("");
    setUrl("");
    setLink("");
    setTekenLeeg(true);
    setTekenVersie((v) => v + 1);
  };

  const video = soort === "video" ? videoVoorBord(link) : null;

  const klaar =
    soort === "tekst"
      ? tekst.trim().length > 0
      : soort === "tekening"
        ? !tekenLeeg
        : soort === "video"
          ? Boolean(video)
          : Boolean(url);

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!klaar || bezig) return;
    setBezig(true);
    setFout("");
    try {
      let inhoud = url;
      if (soort === "tekening") {
        const blob = await tekeningAlsBlob(tekenblad.current);
        inhoud = await beeldVoorBord(blob);
      }
      if (soort === "video") inhoud = video ?? "";
      const schoon = tekst.trim().slice(0, grens);
      await onVerstuur({
        soort,
        ...(schoon ? { tekst: schoon } : {}),
        ...(soort !== "tekst" ? { url: inhoud } : {}),
        ...(kolommen.length > 0 ? { kolom } : {}),
      });
      leeg();
    } catch (err) {
      console.error("Op het bord zetten mislukt", err);
      setFout(
        err instanceof MediaFout
          ? err.message
          : t("bord.toevoegen.mislukt")
      );
    } finally {
      setBezig(false);
    }
  };

  if (toegelaten.length === 0) {
    return <p className="text-sm text-slate-600">{t("bord.toevoegen.nietsOpen")}</p>;
  }

  return (
    <form onSubmit={verstuur} className="space-y-3">
      {toegelaten.length > 1 && (
        <div role="tablist" aria-label={t("bord.toevoegen.watToevoegen")} className="flex flex-wrap gap-1.5">
          {toegelaten.map((s) => {
            const Icon = ICONEN[s.soort];
            const actief = s.soort === soort;
            return (
              <button
                key={s.soort}
                type="button"
                role="tab"
                aria-selected={actief}
                onClick={() => wissel(s.soort)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-bold transition-colors ${
                  actief
                    ? "bg-merk-800 text-white border-merk-800"
                    : "bg-white text-slate-700 border-slate-200 hover:border-merk"
                }`}
              >
                <Icon className="w-4 h-4" />
                {s.label}
              </button>
            );
          })}
        </div>
      )}

      {soort === "afbeelding" && (
        <FotoKiezer
          url={url}
          onUrl={setUrl}
          onFout={setFout}
          onBezig={setBezig}
        />
      )}

      {soort === "tekening" && (
        <TekenBlad key={tekenVersie} canvasRef={tekenblad} onLeeg={setTekenLeeg} />
      )}

      {soort === "video" && (
        <div className="space-y-2">
          <label className="block">
            <span className="block text-xs font-bold text-slate-700 mb-1">{t("bord.toevoegen.videoLink")}</span>
            <input
              type="url"
              inputMode="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2.5 rounded-xl border border-veldrand bg-white text-sm focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
            />
          </label>
          {link.trim() && !video && (
            <p className="text-xs font-semibold text-rose-800">
              {t("bord.toevoegen.geenVideo")}
            </p>
          )}
          {video && (
            <div className="max-w-sm">
              <BordKaart item={{ id: "voorbeeld", apparaat: "", soort: "video", url: video, status: "zichtbaar", op: "" }} />
            </div>
          )}
        </div>
      )}

      {soort === "audio" && (
        <Opname maxSeconden={maxSeconden} url={url} onUrl={setUrl} onFout={setFout} />
      )}

      <label className="block">
        <span className="flex items-baseline justify-between text-xs font-bold text-slate-700 mb-1">
          <span>{soort === "tekst" ? t("bord.toevoegen.jouwTekst") : t("bord.toevoegen.onderschrift")}</span>
          <span className={`font-semibold tabular-nums ${tekst.length >= grens ? "text-rose-700" : "text-slate-500"}`}>
            {tekst.length} / {grens}
          </span>
        </span>
        <textarea
          value={tekst}
          onChange={(e) => setTekst(e.target.value.slice(0, grens))}
          maxLength={grens}
          rows={soort === "tekst" ? (grens > 140 ? 4 : 2) : 2}
          placeholder={soort === "tekst" ? t("bord.toevoegen.schrijfHier") : t("bord.toevoegen.erbijZeggen")}
          className="w-full px-3 py-2.5 rounded-xl border border-veldrand bg-white text-base focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none resize-y"
        />
      </label>

      {kolommen.length > 0 && (
        <label className="block">
          <span className="block text-xs font-bold text-slate-700 mb-1">{t("bord.toevoegen.welkeKolom")}</span>
          <select
            value={kolom}
            onChange={(e) => setKolom(Number(e.target.value))}
            className="w-full px-3 py-2.5 rounded-xl border border-veldrand bg-white text-sm font-semibold"
          >
            {kolommen.map((k, i) => (
              <option key={i} value={i}>
                {k}
              </option>
            ))}
          </select>
        </label>
      )}

      {fout && (
        <p role="alert" className="text-sm font-semibold text-rose-800 bg-rose-50 rounded-xl px-3 py-2.5">
          {fout}
        </p>
      )}

      <button
        type="submit"
        disabled={!klaar || bezig}
        className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        <span>{bezig ? t("algemeen.bezig") : knopTekst}</span>
      </button>
    </form>
  );
}

/* ── Foto ──────────────────────────────────────────────────────────────── */

function FotoKiezer({
  url,
  onUrl,
  onFout,
  onBezig,
}: {
  url: string;
  onUrl: (url: string) => void;
  onFout: (fout: string) => void;
  onBezig: (bezig: boolean) => void;
}) {
  const [verwerken, setVerwerken] = useState(false);

  const kies = async (bestand?: File | null) => {
    if (!bestand) return;
    onFout("");
    setVerwerken(true);
    onBezig(true);
    try {
      onUrl(await beeldVoorBord(bestand));
    } catch (e) {
      onFout(e instanceof MediaFout ? e.message : t("bord.toevoegen.fotoNietOpenen"));
    } finally {
      setVerwerken(false);
      onBezig(false);
    }
  };

  return (
    <div className="space-y-2">
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={t("bord.toevoegen.voorbeeldFoto")} className="max-h-60 rounded-xl border border-slate-200 bg-slate-50" />
      )}
      <div className="flex flex-wrap gap-2">
        <BestandKnop accept="image/*" onKies={kies} bezig={verwerken}>
          <ImageIcon className="w-4 h-4" />
          {url ? t("bord.toevoegen.andereFoto") : t("bord.toevoegen.kiesFoto")}
        </BestandKnop>
        {/* Op een gsm opent dit meteen de camera. */}
        <BestandKnop accept="image/*" capture="environment" onKies={kies} bezig={verwerken}>
          <Camera className="w-4 h-4" />
          {t("bord.toevoegen.neemFoto")}
        </BestandKnop>
      </div>
      {verwerken && <p className="text-xs text-slate-500">{t("bord.toevoegen.verkleinen")}</p>}
    </div>
  );
}

function BestandKnop({
  accept,
  capture,
  onKies,
  bezig,
  children,
}: {
  accept: string;
  capture?: "environment" | "user";
  onKies: (bestand?: File | null) => void;
  bezig: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:border-merk cursor-pointer focus-within:ring-2 focus-within:ring-merk/40 ${
        bezig ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {children}
      <input
        type="file"
        accept={accept}
        capture={capture}
        className="sr-only"
        onChange={(e) => {
          onKies(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </label>
  );
}

/* ── Tekening ──────────────────────────────────────────────────────────── */

const TEKEN_KLEUREN = [
  { kleur: "#0f172a", sleutel: "zwart" },
  { kleur: "#b91c1c", sleutel: "rood" },
  { kleur: "#1d4ed8", sleutel: "blauw" },
  { kleur: "#15803d", sleutel: "groen" },
  { kleur: "#c2410c", sleutel: "oranje" },
  { kleur: "#216f6d", sleutel: "turkoois" },
] as const;
const DIKTES = [4, 10, 24];
const BREEDTE = 1200;
const HOOGTE = 900;

interface Lijn {
  kleur: string;
  dikte: number;
  punten: [number, number][];
}

function TekenBlad({
  canvasRef,
  onLeeg,
}: {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  onLeeg: (leeg: boolean) => void;
}) {
  const [kleur, setKleur] = useState<string>(TEKEN_KLEUREN[0].kleur);
  const [dikte, setDikte] = useState(DIKTES[0]);
  const [gum, setGum] = useState(false);
  const lijnen = useRef<Lijn[]>([]);
  const huidig = useRef<Lijn | null>(null);
  const [aantal, setAantal] = useState(0);

  const teken = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, BREEDTE, HOOGTE);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const lijn of [...lijnen.current, ...(huidig.current ? [huidig.current] : [])]) {
      ctx.strokeStyle = lijn.kleur;
      ctx.lineWidth = lijn.dikte;
      ctx.beginPath();
      lijn.punten.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      // Eén tik tekent een stip.
      if (lijn.punten.length === 1) ctx.lineTo(lijn.punten[0][0] + 0.1, lijn.punten[0][1]);
      ctx.stroke();
    }
  };

  useEffect(teken, []); // eslint-disable-line react-hooks/exhaustive-deps

  const punt = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * BREEDTE, ((e.clientY - r.top) / r.height) * HOOGTE];
  };

  const wijzig = () => {
    setAantal(lijnen.current.length);
    onLeeg(lijnen.current.length === 0);
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={BREEDTE}
        height={HOOGTE}
        aria-label={t("bord.toevoegen.tekenblad")}
        className="w-full aspect-[4/3] rounded-xl border border-slate-300 bg-white cursor-crosshair"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          huidig.current = { kleur: gum ? "#ffffff" : kleur, dikte: gum ? 40 : dikte, punten: [punt(e)] };
          teken();
        }}
        onPointerMove={(e) => {
          if (!huidig.current) return;
          huidig.current.punten.push(punt(e));
          teken();
        }}
        onPointerUp={() => {
          if (!huidig.current) return;
          lijnen.current.push(huidig.current);
          huidig.current = null;
          teken();
          wijzig();
        }}
        onPointerCancel={() => {
          huidig.current = null;
          teken();
        }}
      />
      <div className="flex flex-wrap items-center gap-1.5">
        {TEKEN_KLEUREN.map((k) => (
          <button
            key={k.kleur}
            type="button"
            onClick={() => {
              setKleur(k.kleur);
              setGum(false);
            }}
            aria-label={t(`bord.toevoegen.kleuren.${k.sleutel}`)}
            aria-pressed={!gum && kleur === k.kleur}
            className={`w-8 h-8 rounded-full border-2 ${
              !gum && kleur === k.kleur ? "border-slate-900 ring-2 ring-offset-1 ring-merk" : "border-white shadow"
            }`}
            style={{ backgroundColor: k.kleur }}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {DIKTES.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              setDikte(d);
              setGum(false);
            }}
            aria-label={d === DIKTES[0] ? t("bord.toevoegen.dunnePen") : d === DIKTES[1] ? t("bord.toevoegen.middelstePen") : t("bord.toevoegen.dikkePen")}
            aria-pressed={!gum && dikte === d}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
              !gum && dikte === d ? "border-merk-800 bg-merk-50" : "border-slate-200 bg-white"
            }`}
          >
            <span className="rounded-full bg-slate-900" style={{ width: d / 2 + 2, height: d / 2 + 2 }} />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setGum((g) => !g)}
          aria-pressed={gum}
          aria-label={t("bord.toevoegen.gom")}
          title={t("bord.toevoegen.gom")}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
            gum ? "border-merk-800 bg-merk-50" : "border-slate-200 bg-white"
          }`}
        >
          <Eraser className="w-4 h-4" />
        </button>
        <span className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            disabled={aantal === 0}
            onClick={() => {
              lijnen.current.pop();
              teken();
              wijzig();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          >
            <Undo2 className="w-3.5 h-3.5" /> {t("algemeen.terug")}
          </button>
          <button
            type="button"
            disabled={aantal === 0}
            onClick={() => {
              lijnen.current = [];
              teken();
              wijzig();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" /> {t("bord.toevoegen.wissen")}
          </button>
        </span>
      </div>
    </div>
  );
}

function tekeningAlsBlob(canvas: HTMLCanvasElement | null): Promise<Blob> {
  return new Promise((ok, nietOk) => {
    if (!canvas) return nietOk(new MediaFout(t("bord.toevoegen.geenTekening")));
    canvas.toBlob((b) => (b ? ok(b) : nietOk(new MediaFout(t("bord.toevoegen.tekeningMislukt")))), "image/png");
  });
}

/* ── Inspreken ─────────────────────────────────────────────────────────── */

function Opname({
  maxSeconden,
  url,
  onUrl,
  onFout,
}: {
  maxSeconden: number;
  url: string;
  onUrl: (url: string) => void;
  onFout: (fout: string) => void;
}) {
  const [seconden, setSeconden] = useState<number | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const klok = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (klok.current) clearInterval(klok.current);
    klok.current = null;
    if (recorder.current?.state === "recording") recorder.current.stop();
  };

  // Stop een lopende opname als het formulier verdwijnt.
  useEffect(() => stop, []); // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    onFout("");
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      onFout(t("bord.toevoegen.geenInspreken"));
      return;
    }
    try {
      const stroom = await navigator.mediaDevices.getUserMedia({ audio: true });
      let opname: MediaRecorder;
      try {
        // Spraak heeft niet meer nodig; zo past een minuut ruim in één kaartje.
        opname = new MediaRecorder(stroom, { audioBitsPerSecond: 32_000 });
      } catch {
        opname = new MediaRecorder(stroom);
      }
      const stukken: Blob[] = [];
      opname.ondataavailable = (ev) => ev.data.size && stukken.push(ev.data);
      opname.onstop = async () => {
        stroom.getTracks().forEach((t) => t.stop());
        setSeconden(null);
        const type = (opname.mimeType || "audio/webm").split(";")[0];
        try {
          onUrl(await audioVoorBord(new Blob(stukken, { type })));
        } catch (e) {
          onFout(e instanceof MediaFout ? e.message : t("bord.toevoegen.opnameMislukt"));
        }
      };
      recorder.current = opname;
      opname.start();
      setSeconden(0);
      const begin = Date.now();
      klok.current = setInterval(() => {
        const verstreken = Math.floor((Date.now() - begin) / 1000);
        setSeconden(verstreken);
        if (verstreken >= maxSeconden) stop();
      }, 250);
    } catch {
      onFout(t("bord.toevoegen.geenMicrofoon"));
    }
  };

  const neemtOp = seconden !== null;

  return (
    <div className="space-y-2">
      {url && !neemtOp && (
        <audio controls src={url} className="w-full">
          {t("bord.kaart.geenAudio")}
        </audio>
      )}
      {neemtOp ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={stop}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-700 text-white text-sm font-bold"
          >
            <Square className="w-4 h-4 fill-current" />
            {t("bord.toevoegen.stop")}
          </button>
          <span className="text-sm font-bold text-rose-800 tabular-nums" aria-live="polite">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-600 mr-1.5 animate-pulse" aria-hidden />
            {toonSeconden(seconden)} / {toonSeconden(maxSeconden)}
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={start}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:border-merk"
        >
          <Mic className="w-4 h-4" />
          {url ? t("bord.toevoegen.opnieuwInspreken") : t("bord.toevoegen.startInspreken")}
        </button>
      )}
      <p className="text-xs text-slate-500">{t("bord.toevoegen.hoogstens", { tijd: toonSeconden(maxSeconden) })}</p>
    </div>
  );
}

function toonSeconden(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
