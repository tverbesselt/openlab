"use client";

/*
 * Een opname laten uitschrijven door Whisper, via /api/inlezen. Gedeeld door de knop in de
 * maakformulieren en de klastool "Audio naar tekst".
 *
 * Met Firebase stuurt de browser het token van de leraar mee en kiest de server de sleutel.
 * In demomodus bestaat er geen server-opslag: de beheerder vult een sleutel in die alleen
 * in deze browser blijft, en die gaat bij elke opname mee.
 */

import { useEffect, useState } from "react";
import { firebaseConfigured, getFirebaseAuth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useInstellingen } from "@/lib/instellingen/AppProvider";
import { t, type Sleutel } from "@/lib/i18n";

const DEMO_SLEUTEL = "openlab_openai_sleutel";

/** De sleutel die in deze browser staat (alleen in demomodus). */
export function demoSleutel(): string | null {
  if (firebaseConfigured) return null;
  try {
    return localStorage.getItem(DEMO_SLEUTEL);
  } catch {
    return null;
  }
}

export function bewaarDemoSleutel(sleutel: string | null): void {
  try {
    if (sleutel) localStorage.setItem(DEMO_SLEUTEL, sleutel);
    else localStorage.removeItem(DEMO_SLEUTEL);
  } catch {
    // Geblokkeerde opslag: dan werkt inlezen hier gewoon niet.
  }
  status = null;
}

/** Zelfde vorm als in src/lib/server/openai.ts. */
export function lijktOpSleutel(x: string): boolean {
  return /^sk-[A-Za-z0-9_-]{20,}$/.test(x.trim());
}

/** Een foutcode van de server of van hier, als melding in de taal van de gebruiker. */
export function foutMelding(code: string | undefined): string {
  const bekend = [
    "geenMicrofoon", "nietsVerstaan", "aanmelden", "verlopen", "geenLeraar", "teVaak",
    "geenOpname", "teLang", "onbereikbaar", "tegoedOp", "sleutelOngeldig", "geenSleutel",
  ];
  return t(`spraak.fouten.${code && bekend.includes(code) ? code : "mislukt"}` as Sleutel);
}

async function kop(): Promise<Record<string, string>> {
  if (!firebaseConfigured) {
    const eigen = demoSleutel();
    return eigen ? { "X-OpenAI-Key": eigen } : {};
  }
  const gebruiker = getFirebaseAuth().currentUser;
  if (!gebruiker) throw new Error(foutMelding("aanmelden"));
  return { Authorization: `Bearer ${await gebruiker.getIdToken()}` };
}

/* ── Staat er een sleutel klaar? ──────────────────────────────────────── */

export type Bron = "beheer" | "omgeving" | "browser" | null;

export interface SpraakStatus {
  bron: Bron;
  /** False als de server de sleutel uit het beheer niet kan lezen. */
  serverToegang: boolean;
}

let status: Promise<SpraakStatus> | null = null;

/** Eén keer per pagina gevraagd; `vers` na een wijziging in het beheer. */
export function spraakStatus(vers = false): Promise<SpraakStatus> {
  if (status && !vers) return status;
  const nieuw = (async (): Promise<SpraakStatus> => {
    if (!firebaseConfigured && demoSleutel()) return { bron: "browser", serverToegang: false };
    const antwoord = await fetch(`/api/inlezen${vers ? "?vers=1" : ""}`, { headers: await kop() });
    if (!antwoord.ok) return { bron: null, serverToegang: false };
    const data = (await antwoord.json()) as { bron?: Bron; serverToegang?: boolean };
    return { bron: data.bron ?? null, serverToegang: !!data.serverToegang };
  })().catch((): SpraakStatus => {
    status = null;
    return { bron: null, serverToegang: false };
  });
  status = nieuw;
  return nieuw;
}

/**
 * Mag deze leraar hier inlezen? De functie staat aan in het beheer, er is een sleutel en de
 * browser kan geluid opnemen. Pas na het laden bekeken, anders verschilt de serverversie.
 */
export function useSpraakKlaar(functie: "inlezen" | "audiotekst"): boolean | null {
  const { isAan } = useInstellingen();
  const { isLeraar } = useAuth();
  const aan = isAan(functie) && isLeraar;
  const [klaar, setKlaar] = useState<boolean | null>(null);

  useEffect(() => {
    if (!aan) {
      setKlaar(false);
      return;
    }
    let weg = false;
    void spraakStatus().then((s) => {
      if (!weg) setKlaar(s.bron !== null);
    });
    return () => {
      weg = true;
    };
  }, [aan]);

  return aan ? klaar : false;
}

export function kanOpnemen(): boolean {
  return typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

/* ── Uitschrijven ─────────────────────────────────────────────────────── */

/**
 * Stuurt één opname naar de server en geeft de tekst terug. Gooit een fout met een melding
 * die je zo aan de leraar kan tonen.
 *
 * @param vorige Wat er net voor deze opname gezegd werd. Whisper gebruikt dat als context,
 *   zodat een zin die over twee stukken loopt toch goed aansluit.
 */
export async function schrijfUit(opname: Blob, taal: string, vorige = ""): Promise<string> {
  const extensie = opname.type.includes("mp4") ? "mp4" : opname.type.includes("ogg") ? "ogg" : "webm";
  const formulier = new FormData();
  formulier.append("audio", opname, `opname.${extensie}`);
  formulier.append("taal", taal);
  if (vorige) formulier.append("vorige", vorige.slice(-400));

  const antwoord = await fetch("/api/inlezen", {
    method: "POST",
    headers: await kop(),
    body: formulier,
  });
  const data = (await antwoord.json().catch(() => ({}))) as { tekst?: string; fout?: string };
  if (!antwoord.ok) throw new Error(foutMelding(data.fout));
  return (data.tekst ?? "").trim();
}
