"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { firebaseConfigured, getDb } from "@/lib/firebase/client";
import { normaliseer, STANDAARD_INSTELLINGEN, type Instellingen } from "./types";

/*
 * Waar de instellingen staan. Met Firebase in Firestore (instellingen/app), zodat elke
 * gebruiker dezelfde app ziet. Zonder Firebase, in demomodus, in deze browser.
 *
 * De laatst geladen versie staat ook in localStorage. Zo tekent de app bij een volgend
 * bezoek meteen in de juiste kleur en taal, terwijl de verse versie nog onderweg is.
 */

const LOKAAL = "openlab_instellingen";
const CACHE = "openlab_instellingen_cache";

export function uitCache(): Instellingen | null {
  try {
    const bewaard = localStorage.getItem(firebaseConfigured ? CACHE : LOKAAL);
    return bewaard ? normaliseer(JSON.parse(bewaard)) : null;
  } catch {
    return null;
  }
}

function naarCache(i: Instellingen) {
  try {
    localStorage.setItem(firebaseConfigured ? CACHE : LOKAAL, JSON.stringify(i));
  } catch {
    // Vol of geblokkeerd: dan laden we de volgende keer gewoon opnieuw.
  }
}

export async function laadInstellingen(): Promise<Instellingen> {
  if (!firebaseConfigured) return uitCache() ?? STANDAARD_INSTELLINGEN;
  const snap = await getDoc(doc(getDb(), "instellingen", "app"));
  const i = snap.exists() ? normaliseer(snap.data()) : STANDAARD_INSTELLINGEN;
  naarCache(i);
  return i;
}

export async function bewaarInstellingen(i: Instellingen): Promise<void> {
  const schoon = normaliseer(i);
  if (firebaseConfigured) await setDoc(doc(getDb(), "instellingen", "app"), schoon);
  naarCache(schoon);
}
