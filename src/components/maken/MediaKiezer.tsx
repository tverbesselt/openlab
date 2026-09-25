"use client";

import React, { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Film, Mic, Square, Trash2, Upload, Loader2 } from "lucide-react";
import { QuizMedia } from "@/lib/types";
import {
  MAX_AUDIO_MB,
  MediaFout,
  controleerAudio,
  herkenVideo,
  leesTijd,
  startUitLink,
  toonTijd,
  uploadMedia,
  uploadenGedeeld,
  verkleinAfbeelding,
} from "@/lib/media";
import { useAuth } from "@/lib/auth/AuthProvider";
import { VraagMedia } from "@/components/players/VraagMedia";
import { t, locale } from "@/lib/i18n";

type Soort = QuizMedia["soort"];

const SOORTEN: { soort: Soort; label: string; icon: typeof Film }[] = [
  {
    soort: "afbeelding",
    get label() {
      return t("makenvormen.mediakiezer.soorten.foto");
    },
    icon: ImageIcon,
  },
  {
    soort: "video",
    get label() {
      return t("makenvormen.mediakiezer.soorten.filmpje");
    },
    icon: Film,
  },
  {
    soort: "audio",
    get label() {
      return t("makenvormen.mediakiezer.soorten.audio");
    },
    icon: Mic,
  },
];

const KLEIN_VELD =
  "w-full p-2.5 text-sm rounded-lg bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none";

/**
 * Een foto, filmpje of audiofragment bij één quizvraag. Het is altijd optioneel: een
 * vraag zonder media blijft een gewone vraag.
 */
export function MediaKiezer({
  waarde,
  onWijzig,
  onBezig,
  bij = "vraag",
}: {
  waarde?: QuizMedia;
  onWijzig: (media: QuizMedia | undefined) => void;
  /** Laat het formulier weten dat er nog iets aan het uploaden is. */
  onBezig?: (bezig: boolean) => void;
  /**
   * Waar de media bij hoort, voor het label: "vraag" of "opdracht". De oude waarden
   * "de vraag" en "de opdracht" werken ook nog.
   */
  bij?: "vraag" | "opdracht" | "de vraag" | "de opdracht";
}) {
  const [soort, setSoort] = useState<Soort | null>(waarde?.soort ?? null);
  const waarbij = bij === "opdracht" || bij === "de opdracht" ? "opdracht" : "vraag";

  if (!soort) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">{t(`makenvormen.mediakiezer.toevoegen.${waarbij}`)}</span>
        {SOORTEN.map(({ soort: s, label, icon: Icon }) => (
          <button
            key={s}
            type="button"
            onClick={() => setSoort(s)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:border-merk hover:text-merk-900"
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
    );
  }

  const weg = () => {
    onWijzig(undefined);
    setSoort(null);
  };

  const titel = SOORTEN.find((s) => s.soort === soort)!;

  return (
    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <titel.icon className="w-3.5 h-3.5" />
          {t(`makenvormen.mediakiezer.kop.${waarbij}`, { soort: titel.label })}
        </span>
        <button
          type="button"
          onClick={weg}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-rose-700"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {t("makenvormen.mediakiezer.weghalen")}
        </button>
      </div>

      {soort === "afbeelding" && <FotoKiezer waarde={waarde} onWijzig={onWijzig} onBezig={onBezig} />}
      {soort === "video" && <VideoKiezer waarde={waarde} onWijzig={onWijzig} />}
      {soort === "audio" && <AudioKiezer waarde={waarde} onWijzig={onWijzig} onBezig={onBezig} />}

      {!uploadenGedeeld && soort !== "video" && (
        <p className="text-xs text-slate-500">
          {t("makenvormen.mediakiezer.demo")}
        </p>
      )}
    </div>
  );
}

/* ── Foto ──────────────────────────────────────────────────────────────── */

function FotoKiezer({
  waarde,
  onWijzig,
  onBezig,
}: {
  waarde?: QuizMedia;
  onWijzig: (m: QuizMedia | undefined) => void;
  onBezig?: (b: boolean) => void;
}) {
  const { upload, bezig, fout } = useUpload(onBezig);
  const heeftFoto = waarde?.soort === "afbeelding" && waarde.url;

  const kies = async (bestand: File | undefined) => {
    if (!bestand) return;
    const url = await upload(async () => verkleinAfbeelding(bestand));
    if (url) onWijzig({ soort: "afbeelding", url, alt: waarde?.alt ?? "" });
  };

  return (
    <div className="space-y-2">
      {heeftFoto && <VraagMedia media={waarde} />}
      <BestandKnop
        accept="image/*"
        label={heeftFoto ? t("makenvormen.mediakiezer.foto.ander") : t("makenvormen.mediakiezer.foto.kies")}
        bezig={bezig}
        onKies={kies}
      />
      {heeftFoto && (
        <label className="block">
          <span className="block text-xs font-bold text-slate-700 mb-1">
            {t("makenvormen.mediakiezer.foto.altLabel")}
          </span>
          <input
            type="text"
            value={waarde.alt ?? ""}
            onChange={(e) => onWijzig({ ...waarde, alt: e.target.value })}
            placeholder={t("makenvormen.mediakiezer.foto.altVoorbeeld")}
            required
            maxLength={200}
            className={KLEIN_VELD}
          />
        </label>
      )}
      <UploadFout tekst={fout} />
    </div>
  );
}

/* ── Video ─────────────────────────────────────────────────────────────── */

function VideoKiezer({
  waarde,
  onWijzig,
}: {
  waarde?: QuizMedia;
  onWijzig: (m: QuizMedia | undefined) => void;
}) {
  const huidig = waarde?.soort === "video" ? waarde : undefined;
  const [link, setLink] = useState(huidig?.url ?? "");
  const [start, setStart] = useState(toonTijd(huidig?.start));
  const [eind, setEind] = useState(toonTijd(huidig?.eind));

  const bron = link.trim() ? herkenVideo(link) : null;
  const s = leesTijd(start);
  const e = leesTijd(eind);
  const tijdFout = s !== undefined && e !== undefined && e <= s;

  // Alleen een herkende link komt in de vraag terecht.
  useEffect(() => {
    onWijzig(bron && !tijdFout ? { soort: "video", url: link.trim(), start: s, eind: e } : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link, start, eind]);

  return (
    <div className="space-y-2">
      <input
        type="url"
        value={link}
        onChange={(ev) => {
          setLink(ev.target.value);
          // Wie op YouTube "delen vanaf 0:45" koos, hoeft dat hier niet opnieuw te typen.
          const tijd = startUitLink(ev.target.value);
          if (tijd && !start.trim()) setStart(toonTijd(tijd));
        }}
        placeholder={t("makenvormen.mediakiezer.video.link")}
        className={KLEIN_VELD}
      />
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="block text-xs font-bold text-slate-700 mb-1">{t("makenvormen.mediakiezer.video.vanaf")}</span>
          <input
            type="text"
            inputMode="numeric"
            value={start}
            onChange={(ev) => setStart(ev.target.value)}
            placeholder="0:45"
            className={KLEIN_VELD}
          />
        </label>
        <label className="block">
          <span className="block text-xs font-bold text-slate-700 mb-1">{t("makenvormen.mediakiezer.video.tot")}</span>
          <input
            type="text"
            inputMode="numeric"
            value={eind}
            onChange={(ev) => setEind(ev.target.value)}
            placeholder="1:30"
            className={KLEIN_VELD}
          />
        </label>
      </div>
      {link.trim() && !bron && (
        <UploadFout tekst={t("makenvormen.mediakiezer.video.onbekend")} />
      )}
      {tijdFout && <UploadFout tekst={t("makenvormen.mediakiezer.video.tijdFout")} />}
      {huidig && <VraagMedia media={huidig} />}
    </div>
  );
}

/* ── Audio ─────────────────────────────────────────────────────────────── */

function AudioKiezer({
  waarde,
  onWijzig,
  onBezig,
}: {
  waarde?: QuizMedia;
  onWijzig: (m: QuizMedia | undefined) => void;
  onBezig?: (b: boolean) => void;
}) {
  const { upload, bezig, fout, setFout } = useUpload(onBezig);
  const [neemtOp, setNeemtOp] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const heeftAudio = waarde?.soort === "audio" && waarde.url;

  const bewaar = async (blob: Blob) => {
    const url = await upload(async () => {
      controleerAudio(blob);
      return blob;
    });
    if (url) onWijzig({ soort: "audio", url });
  };

  const startOpname = async () => {
    setFout("");
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setFout(t("makenvormen.mediakiezer.audio.geenOpname"));
      return;
    }
    try {
      const stroom = await navigator.mediaDevices.getUserMedia({ audio: true });
      const opname = new MediaRecorder(stroom);
      const stukken: Blob[] = [];
      opname.ondataavailable = (ev) => ev.data.size && stukken.push(ev.data);
      opname.onstop = () => {
        stroom.getTracks().forEach((spoor) => spoor.stop());
        setNeemtOp(false);
        const type = (opname.mimeType || "audio/webm").split(";")[0];
        bewaar(new Blob(stukken, { type }));
      };
      recorder.current = opname;
      opname.start();
      setNeemtOp(true);
    } catch {
      setFout(t("makenvormen.mediakiezer.audio.geenMicrofoon"));
    }
  };

  // Stop een lopende opname als het formulier verdwijnt.
  useEffect(() => () => recorder.current?.state === "recording" ? recorder.current.stop() : undefined, []);

  return (
    <div className="space-y-2">
      {heeftAudio && <VraagMedia media={waarde} />}
      <div className="flex flex-wrap gap-2">
        <BestandKnop
          accept="audio/*"
          label={heeftAudio ? t("makenvormen.mediakiezer.audio.ander") : t("makenvormen.mediakiezer.audio.kies")}
          bezig={bezig}
          onKies={(b) => b && bewaar(b)}
        />
        {neemtOp ? (
          <button
            type="button"
            onClick={() => recorder.current?.stop()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold"
          >
            <Square className="w-3.5 h-3.5" />
            {t("makenvormen.mediakiezer.audio.stop")}
          </button>
        ) : (
          <button
            type="button"
            disabled={bezig}
            onClick={startOpname}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:border-merk disabled:opacity-50"
          >
            <Mic className="w-3.5 h-3.5" />
            {t("makenvormen.mediakiezer.audio.zelf")}
          </button>
        )}
      </div>
      {neemtOp && <p className="text-xs font-bold text-rose-700">{t("makenvormen.mediakiezer.audio.bezig")}</p>}
      <p className="text-xs text-slate-500">
        {t("makenvormen.mediakiezer.audio.formaten", { mb: MAX_AUDIO_MB.toLocaleString(locale()) })}
      </p>
      <UploadFout tekst={fout} />
    </div>
  );
}

/* ── Gedeeld ───────────────────────────────────────────────────────────── */

function useUpload(onBezig?: (b: boolean) => void) {
  const { gebruiker } = useAuth();
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  const upload = async (maak: () => Promise<Blob>): Promise<string | null> => {
    setFout("");
    setBezig(true);
    onBezig?.(true);
    try {
      const blob = await maak();
      return await uploadMedia(blob, gebruiker?.id ?? "demo");
    } catch (e) {
      console.error("Media uploaden mislukt", e);
      setFout(
        e instanceof MediaFout
          ? e.message
          : t("makenvormen.mediakiezer.uploadMislukt")
      );
      return null;
    } finally {
      setBezig(false);
      onBezig?.(false);
    }
  };

  return { upload, bezig, fout, setFout };
}

function BestandKnop({
  accept,
  label,
  bezig,
  onKies,
}: {
  accept: string;
  label: string;
  bezig: boolean;
  onKies: (bestand: File | undefined) => void;
}) {
  return (
    <label
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:border-merk cursor-pointer ${
        bezig ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      {bezig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
      {bezig ? t("makenvormen.mediakiezer.uploaden") : label}
      <input
        type="file"
        accept={accept}
        className="sr-only"
        disabled={bezig}
        onChange={(e) => {
          onKies(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function UploadFout({ tekst }: { tekst: string }) {
  if (!tekst) return null;
  return (
    <p role="alert" className="text-xs font-semibold text-rose-800">
      {tekst}
    </p>
  );
}
