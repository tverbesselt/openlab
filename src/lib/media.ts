"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { firebaseConfigured, getMediaOpslag, mediaBucket } from "@/lib/firebase/client";
import { t, locale } from "@/lib/i18n";

/*
 * Media bij quizvragen: een foto, een audiofragment of een link naar een filmpje.
 *
 * Foto's worden in de browser eerst verkleind, zodat een foto van 8 MB van een gsm geen
 * 8 MB kost op elk toestel in de klas. Video uploaden kan niet: dat is te zwaar voor de
 * opslag en voor het wifi-netwerk. Een link naar YouTube of Vimeo werkt wel.
 */

/** Grootste zijde van een verkleinde foto, in pixels. Scherp genoeg voor het digibord. */
const MAX_ZIJDE = 1600;
/** Grootste audiobestand dat we aannemen. Een fragment van een paar minuten past ruim. */
export const MAX_AUDIO_MB = 10;
/** In demomodus komt alles in localStorage terecht: daar is maar een paar MB plaats. */
const MAX_DEMO_MB = 1.5;

/** Kan er echt geüpload worden, of werken we in deze browser met data-URL's? */
export const uploadenGedeeld = firebaseConfigured && Boolean(mediaBucket);

export class MediaFout extends Error {}

/**
 * Verklein een foto tot hoogstens `maxZijde` pixels, als WebP (of JPEG als dat niet lukt).
 * Een bewegende GIF blijft standaard zoals hij is, want verkleinen zet hem stil; met
 * `gifOok` wordt ook een GIF een stilstaand beeld.
 */
export async function verkleinAfbeelding(
  bestand: Blob,
  { maxZijde = MAX_ZIJDE, kwaliteit = 0.82, gifOok = false } = {}
): Promise<Blob> {
  if (!bestand.type.startsWith("image/")) {
    throw new MediaFout(t("makenvormen.media.geenAfbeelding"));
  }
  if (bestand.type === "image/gif" && !gifOok) return bestand;

  const beeld = await laadBeeld(bestand);
  const schaal = Math.min(1, maxZijde / Math.max(beeld.width, beeld.height));
  const breedte = Math.round(beeld.width * schaal);
  const hoogte = Math.round(beeld.height * schaal);

  const canvas = document.createElement("canvas");
  canvas.width = breedte;
  canvas.height = hoogte;
  const ctx = canvas.getContext("2d");
  if (!ctx) return bestand;
  ctx.drawImage(beeld, 0, 0, breedte, hoogte);

  const webp = await naarBlob(canvas, "image/webp", kwaliteit);
  if (webp && webp.type === "image/webp") return webp;
  return (await naarBlob(canvas, "image/jpeg", Math.min(1, kwaliteit + 0.03))) ?? bestand;
}

/** Controleer een audiobestand voor het uploaden. */
export function controleerAudio(bestand: Blob): void {
  if (!bestand.type.startsWith("audio/")) {
    throw new MediaFout(t("makenvormen.media.geenAudio"));
  }
  if (bestand.size > MAX_AUDIO_MB * 1024 * 1024) {
    throw new MediaFout(t("makenvormen.media.teGroot", { mb: MAX_AUDIO_MB.toLocaleString(locale()) }));
  }
}

/**
 * Zet een foto of audiofragment online en geef de link terug. In demomodus wordt het een
 * data-URL, want daar is geen gedeelde opslag.
 */
export async function uploadMedia(blob: Blob, eigenaarId: string): Promise<string> {
  if (!uploadenGedeeld) {
    if (blob.size > MAX_DEMO_MB * 1024 * 1024) {
      throw new MediaFout(
        t("makenvormen.media.demoTeGroot", { mb: MAX_DEMO_MB.toLocaleString(locale()) })
      );
    }
    return leesAlsDataUrl(blob);
  }

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  const pad = `media/${eigenaarId}/${id}.${extensie(blob.type)}`;
  const doel = ref(getMediaOpslag(), pad);
  await uploadBytes(doel, blob, {
    contentType: blob.type,
    cacheControl: "public, max-age=31536000, immutable",
  });
  return getDownloadURL(doel);
}

/* ── Video ─────────────────────────────────────────────────────────────── */

export interface VideoBron {
  dienst: "youtube" | "vimeo";
  id: string;
}

/** Herken een link naar YouTube of Vimeo. Geeft null voor al de rest. */
export function herkenVideo(link: string): VideoBron | null {
  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return geldigYoutubeId(id) ? { dienst: "youtube", id } : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v && geldigYoutubeId(v)) return { dienst: "youtube", id: v };
    const pad = url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/);
    return pad ? { dienst: "youtube", id: pad[1] } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const pad = url.pathname.match(/(\d{6,})/);
    return pad ? { dienst: "vimeo", id: pad[1] } : null;
  }
  return null;
}

/** De starttijd die al in een gedeelde link zit (youtu.be/...?t=45 of ?t=1m30s). */
export function startUitLink(link: string): number | undefined {
  try {
    const t = new URL(link.trim()).searchParams.get("t");
    if (!t) return undefined;
    const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
    if (!m) return undefined;
    const seconden = Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
    return seconden || undefined;
  } catch {
    return undefined;
  }
}

/** De ingebedde speler, met het fragment tussen start en eind. */
export function videoInbedden(bron: VideoBron, start?: number, eind?: number): string {
  if (bron.dienst === "youtube") {
    const p = new URLSearchParams({ rel: "0", modestbranding: "1" });
    if (start) p.set("start", String(start));
    if (eind) p.set("end", String(eind));
    // youtube-nocookie: geen trackingcookies tot er op afspelen gedrukt wordt.
    return `https://www.youtube-nocookie.com/embed/${bron.id}?${p}`;
  }
  const p = new URLSearchParams({ dnt: "1" });
  return `https://player.vimeo.com/video/${bron.id}?${p}${start ? `#t=${start}s` : ""}`;
}

/** "1:30" of "90" wordt 90 seconden. Leeg of ongeldig wordt undefined. */
export function leesTijd(tekst: string): number | undefined {
  const t = tekst.trim();
  if (!t) return undefined;
  const delen = t.split(":").map((d) => Number(d));
  if (delen.some((d) => !Number.isFinite(d) || d < 0)) return undefined;
  const seconden = delen.reduce((som, d) => som * 60 + d, 0);
  return Math.round(seconden);
}

/** 90 wordt "1:30". */
export function toonTijd(seconden?: number): string {
  if (seconden === undefined) return "";
  const m = Math.floor(seconden / 60);
  const s = seconden % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ── Hulpjes ───────────────────────────────────────────────────────────── */

function geldigYoutubeId(id: string): boolean {
  return /^[\w-]{11}$/.test(id);
}

function laadBeeld(bestand: Blob): Promise<HTMLImageElement> {
  return new Promise((ok, nietOk) => {
    const url = URL.createObjectURL(bestand);
    const beeld = new Image();
    beeld.onload = () => {
      URL.revokeObjectURL(url);
      ok(beeld);
    };
    beeld.onerror = () => {
      URL.revokeObjectURL(url);
      nietOk(new MediaFout(t("makenvormen.media.nietOpenen")));
    };
    beeld.src = url;
  });
}

function naarBlob(canvas: HTMLCanvasElement, type: string, kwaliteit: number): Promise<Blob | null> {
  return new Promise((ok) => canvas.toBlob(ok, type, kwaliteit));
}

export function leesAlsDataUrl(blob: Blob): Promise<string> {
  return new Promise((ok, nietOk) => {
    const lezer = new FileReader();
    lezer.onload = () => ok(String(lezer.result));
    lezer.onerror = () => nietOk(new MediaFout(t("makenvormen.media.nietLezen")));
    lezer.readAsDataURL(blob);
  });
}

function extensie(type: string): string {
  const deel = type.split("/")[1]?.split(";")[0] ?? "bin";
  const namen: Record<string, string> = { jpeg: "jpg", mpeg: "mp3", "x-m4a": "m4a", mp4: "m4a" };
  return namen[deel] ?? deel.replace(/[^a-z0-9]/g, "");
}
