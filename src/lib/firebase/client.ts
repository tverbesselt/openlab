"use client";

// Firebase-clientconfiguratie (Google-login). Zonder ingevulde omgevingsvariabelen blijft
// firebaseConfigured false en draait de app in demomodus — handig lokaal en in CI.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  type Auth,
} from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.projectId);

let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;
let cachedStorage: FirebaseStorage | null = null;

export function getFirebaseAuth(): Auth {
  if (!firebaseConfigured) throw new Error("Firebase is niet geconfigureerd.");
  const app: FirebaseApp = getApps().length ? getApp() : initializeApp(config);
  cachedAuth ??= getAuth(app);
  return cachedAuth;
}

/** Firestore van hetzelfde project; de regels staan in firestore.rules. */
export function getDb(): Firestore {
  if (!firebaseConfigured) throw new Error("Firebase is niet geconfigureerd.");
  const app: FirebaseApp = getApps().length ? getApp() : initializeApp(config);
  if (!cachedDb) {
    // Optioneel een benoemde databank binnen het project. Leeg = de standaarddatabank.
    // Let op: storage.rules leest de toegang uit de standaarddatabank.
    const databank = process.env.NEXT_PUBLIC_FIRESTORE_DATABASE;
    cachedDb = databank ? getFirestore(app, databank) : getFirestore(app);
    // Lokaal testen tegen de emulator, zonder de productiedata te raken.
    const emulator = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR;
    if (emulator) {
      const [host, poort] = emulator.split(":");
      connectFirestoreEmulator(cachedDb, host, Number(poort) || 8080);
    }
  }
  return cachedDb;
}

/**
 * Waar de foto's en audiofragmenten bij quizvragen staan (regels in storage.rules). Zonder
 * bucket blijft uploaden uit en werkt demomodus met data-URL's.
 */
export const mediaBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "";

export function getMediaOpslag(): FirebaseStorage {
  if (!firebaseConfigured || !mediaBucket) throw new Error("Firebase Storage is niet geconfigureerd.");
  const app: FirebaseApp = getApps().length ? getApp() : initializeApp(config);
  cachedStorage ??= getStorage(app, `gs://${mediaBucket}`);
  return cachedStorage;
}

function googleProvider(domein?: string): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  // hd beperkt de accountkiezer tot het schooldomein; de echte controle gebeurt in
  // AuthProvider en firestore.rules, want hd is een hint en geen beveiliging.
  provider.setCustomParameters(
    domein ? { hd: domein, prompt: "select_account" } : { prompt: "select_account" }
  );
  return provider;
}

// Codes waarbij de popup onbruikbaar is (geblokkeerd of niet ondersteund, vaak op mobiel).
// Dan vallen we terug op een volledige redirect in plaats van te falen.
const REDIRECT_FALLBACK = new Set([
  "auth/popup-blocked",
  "auth/operation-not-supported-in-this-environment",
  "auth/cancelled-popup-request",
  "auth/web-storage-unsupported",
]);

export async function aanmeldenMetGoogle(domein?: string): Promise<void> {
  const auth = getFirebaseAuth();
  try {
    await signInWithPopup(auth, googleProvider(domein));
  } catch (e) {
    const code = (e as { code?: string })?.code ?? "";
    if (REDIRECT_FALLBACK.has(code)) {
      await signInWithRedirect(auth, googleProvider(domein));
      return; // de pagina navigeert weg; het resultaat komt via verwerkRedirectResultaat()
    }
    throw e;
  }
}

export async function verwerkRedirectResultaat(): Promise<void> {
  if (!firebaseConfigured) return;
  await getRedirectResult(getFirebaseAuth());
}

export async function afmelden(): Promise<void> {
  if (firebaseConfigured) await signOut(getFirebaseAuth());
}
