/*
 * Alleen op de server: waar de sleutel van OpenAI vandaan komt en wie hem mag gebruiken.
 *
 * De sleutel kan op twee plaatsen staan:
 *   1. in het beheer van de app (Firestore: geheimen/openai). Niemand kan dat document
 *      lezen via de app, ook de beheerder niet: alleen de server, met firebase-admin;
 *   2. in de omgevingsvariabele OPENAI_API_KEY, voor wie liever niets in Firestore zet.
 * Staat hij op beide plaatsen, dan wint die uit het beheer: die kan een beheerder wijzigen.
 *
 * In demomodus (zonder Firebase) is er geen server-opslag. Daar geeft de browser zijn eigen
 * sleutel mee, die de beheerder in deze browser invulde. Zie src/lib/inlezen.ts.
 */

import { bepaalRol, type Rol } from "@/lib/auth/account";
import { normaliseer } from "@/lib/instellingen/types";

export const firebaseOpServer = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";
const DATABANK = process.env.NEXT_PUBLIC_FIRESTORE_DATABASE || "(default)";

/** Hoe een sleutel van OpenAI er ongeveer uitziet. Geen garantie, wel een vangnet voor typfouten. */
export function lijktOpSleutel(x: unknown): x is string {
  return typeof x === "string" && /^sk-[A-Za-z0-9_-]{20,}$/.test(x.trim());
}

/* ── Wie vraagt het? ─────────────────────────────────────────────────── */

/**
 * Controleert het ID-token van Firebase bij Google zelf. Zo is er voor de aanmelding geen
 * firebase-admin nodig: accounts:lookup weigert een vals of verlopen token.
 */
async function emailVanToken(idToken: string): Promise<string | null> {
  const sleutel = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!sleutel) return null;
  const antwoord = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${sleutel}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );
  if (!antwoord.ok) return null;
  const data = (await antwoord.json()) as { users?: { email?: string; emailVerified?: boolean }[] };
  const gebruiker = data.users?.[0];
  if (!gebruiker?.email || !gebruiker.emailVerified) return null;
  return gebruiker.email.toLowerCase();
}

/** Een waarde uit de REST-API van Firestore omzetten naar gewone JavaScript. */
function gewoon(w: Record<string, unknown> | undefined): unknown {
  if (!w) return undefined;
  if ("stringValue" in w) return w.stringValue;
  if ("booleanValue" in w) return w.booleanValue;
  if ("integerValue" in w) return Number(w.integerValue);
  if ("doubleValue" in w) return w.doubleValue;
  if ("nullValue" in w) return null;
  if ("arrayValue" in w) {
    const waarden = (w.arrayValue as { values?: Record<string, unknown>[] }).values ?? [];
    return waarden.map(gewoon);
  }
  if ("mapValue" in w) {
    const velden = (w.mapValue as { fields?: Record<string, Record<string, unknown>> }).fields ?? {};
    return Object.fromEntries(Object.entries(velden).map(([k, v]) => [k, gewoon(v)]));
  }
  return undefined;
}

/**
 * Leest een document met het token van de gebruiker zelf, dus volgens firestore.rules.
 * Geeft null als het niet bestaat of niet leesbaar is.
 */
async function leesAlsGebruiker(pad: string, idToken: string): Promise<Record<string, unknown> | null> {
  const antwoord = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/${DATABANK}/documents/${pad}`,
    { headers: { Authorization: `Bearer ${idToken}` }, cache: "no-store" }
  );
  if (!antwoord.ok) return null;
  const doc = (await antwoord.json()) as { fields?: Record<string, Record<string, unknown>> };
  return gewoon({ mapValue: { fields: doc.fields ?? {} } }) as Record<string, unknown>;
}

export interface Aanvrager {
  email: string;
  rol: Rol | null;
}

/**
 * Wie er achter dit token zit en wat die in de app is. Met exact dezelfde regels als in de
 * app en in firestore.rules: de toegang uit het beheer, en een beheerder is altijd leraar.
 */
export async function aanvragerVan(idToken: string): Promise<Aanvrager | null> {
  const email = await emailVanToken(idToken).catch(() => null);
  if (!email) return null;
  const [instellingen, beheerder] = await Promise.all([
    leesAlsGebruiker("instellingen/app", idToken).catch(() => null),
    leesAlsGebruiker(`beheerders/${encodeURIComponent(email)}`, idToken).catch(() => null),
  ]);
  const { toegang } = normaliseer(instellingen);
  return { email, rol: bepaalRol(email, toegang, beheerder !== null) };
}

/* ── De sleutel ──────────────────────────────────────────────────────── */

export type Bron = "beheer" | "omgeving";

export interface SleutelStand {
  sleutel: string | null;
  bron: Bron | null;
  /**
   * False als de server Firestore niet kan lezen (geen firebase-admin-toegang). Een sleutel
   * uit het beheer werkt dan niet; OPENAI_API_KEY nog wel.
   */
  serverToegang: boolean;
}

/*
 * Even onthouden, want "Audio naar tekst" stuurt een paar stukjes per minuut. Een nieuwe
 * sleutel uit het beheer geldt dus binnen een halve minuut.
 */
const BEWAAR_MS = 30_000;
let onthouden: { stand: SleutelStand; tot: number } | null = null;

async function uitBeheer(): Promise<string | null> {
  // Pas laden als het nodig is: zonder Firebase hoeft deze module er niet te zijn.
  const { initializeApp, getApps, cert, applicationDefault } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");

  // Op Firebase App Hosting en Cloud Run werkt de standaardidentiteit van de server. Elders
  // (bijvoorbeeld Vercel) geef je een serviceaccount mee in FIREBASE_SERVICE_ACCOUNT.
  const serviceaccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  const app =
    getApps().find((a) => a.name === "openlab-server") ??
    initializeApp(
      {
        projectId: PROJECT,
        credential: serviceaccount ? cert(JSON.parse(serviceaccount)) : applicationDefault(),
      },
      "openlab-server"
    );
  const db = DATABANK === "(default)" ? getFirestore(app) : getFirestore(app, DATABANK);
  const snap = await db.collection("geheimen").doc("openai").get();
  const sleutel = snap.exists ? snap.get("sleutel") : null;
  return lijktOpSleutel(sleutel) ? sleutel.trim() : null;
}

export async function sleutelStand(vers = false): Promise<SleutelStand> {
  if (!vers && onthouden && onthouden.tot > Date.now()) return onthouden.stand;

  let beheer: string | null = null;
  let serverToegang = false;
  if (firebaseOpServer) {
    try {
      beheer = await uitBeheer();
      serverToegang = true;
    } catch (e) {
      console.error("openai: kan geheimen/openai niet lezen", e);
    }
  }
  const omgeving = lijktOpSleutel(process.env.OPENAI_API_KEY) ? process.env.OPENAI_API_KEY!.trim() : null;

  const stand: SleutelStand = beheer
    ? { sleutel: beheer, bron: "beheer", serverToegang }
    : omgeving
      ? { sleutel: omgeving, bron: "omgeving", serverToegang }
      : { sleutel: null, bron: null, serverToegang };
  onthouden = { stand, tot: Date.now() + BEWAAR_MS };
  return stand;
}
