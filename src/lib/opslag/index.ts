"use client";

import { useCallback, useEffect, useState } from "react";
import { firebaseConfigured } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useInstellingen } from "@/lib/instellingen/AppProvider";
import { Exercise, Herhaling, Lesmap } from "@/lib/types";
import { lokaleOpslag } from "./lokaal";
import { firestoreOpslag } from "./firestore";
import type { Opslag } from "./types";
import { t } from "@/lib/i18n";

export type { Opslag, CodeDoel } from "./types";
export { generateShortCode, nieuwePincode } from "@/lib/codes";

/**
 * Dé ingang voor alle opslag. Met een Firebase-project praat dit met Firestore en zien
 * leraar en cursist hetzelfde op elk toestel. Zonder project blijft alles in deze browser.
 */
export const opslag: Opslag = firebaseConfigured ? firestoreOpslag : lokaleOpslag;

/** Is het materiaal gedeeld over toestellen, of zit het alleen in deze browser? */
export const opslagGedeeld = firebaseConfigured;

const APPARAAT_SLEUTEL = "openlab_apparaat";

/**
 * Een vast, willekeurig id voor dit toestel. Daarmee stem je in een live-sessie maar
 * één keer, zonder dat je je moet aanmelden.
 */
export function apparaatId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(APPARAAT_SLEUTEL);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(APPARAAT_SLEUTEL, id);
  }
  return id;
}

/**
 * Het materiaal dat de aangemelde persoon mag zien, plus zijn eigen mappen en, voor een
 * leraar, de mappen van de organisatie. Wacht tot de aanmelding bekend is, anders zou een
 * leraar eerst een lege bibliotheek zien.
 */
export function useMateriaal() {
  const { status, gebruiker } = useAuth();
  const { isAan } = useInstellingen();
  const [oefeningen, setOefeningen] = useState<Exercise[]>([]);
  const [mappen, setMappen] = useState<Lesmap[]>([]);
  const [orgMappen, setOrgMappen] = useState<Lesmap[]>([]);
  const [laden, setLaden] = useState(true);
  const [fout, setFout] = useState<string | null>(null);

  const kijkerId = gebruiker?.id;
  const kijkerNaam = gebruiker?.naam;
  const kijkerIsLeraar = gebruiker?.rol === "leraar";

  const vernieuw = useCallback(async () => {
    const kijker = kijkerNaam ? { id: kijkerId, naam: kijkerNaam } : null;
    try {
      const [o, m, org] = await Promise.all([
        opslag.zichtbareOefeningen(kijker),
        opslag.eigenMappen(kijker),
        // Cursisten mogen de lijst niet opvragen; zij krijgen een map via haar code.
        kijkerIsLeraar ? opslag.organisatieMappen() : Promise.resolve([]),
      ]);
      setOefeningen(o);
      setMappen(m);
      setOrgMappen(org);
      setFout(null);
    } catch (e) {
      console.error("Materiaal laden mislukt", e);
      setFout(t("materiaal.opslag.laadFout"));
    } finally {
      setLaden(false);
    }
  }, [kijkerId, kijkerNaam, kijkerIsLeraar]);

  useEffect(() => {
    if (status === "laden") return;
    vernieuw();
  }, [status, vernieuw]);

  return {
    // Wat de beheerder uitzette, blijft bewaard maar verschijnt nergens in een lijst.
    oefeningen: oefeningen.filter((ex) => isAan(ex.type)),
    mappen,
    orgMappen,
    laden: status === "laden" || laden,
    fout,
    vernieuw,
    setOefeningen,
    setMappen,
    setOrgMappen,
  };
}

/**
 * De herhaalplanning van de aangemelde persoon. Leeg voor wie niet aangemeld is: zonder
 * account is er niets om aan vast te knopen, en oefenen blijft ook dan gewoon werken.
 */
export function useHerhalingen() {
  const { status, gebruiker } = useAuth();
  const [herhalingen, setHerhalingen] = useState<Herhaling[]>([]);
  const [laden, setLaden] = useState(true);

  const gebruikerId = gebruiker?.id;

  const vernieuw = useCallback(async () => {
    if (!gebruikerId) {
      setHerhalingen([]);
      setLaden(false);
      return;
    }
    try {
      setHerhalingen(await opslag.herhalingen(gebruikerId));
    } catch (e) {
      console.error("Herhalingen laden mislukt", e);
      setHerhalingen([]);
    } finally {
      setLaden(false);
    }
  }, [gebruikerId]);

  useEffect(() => {
    if (status === "laden") return;
    vernieuw();
  }, [status, vernieuw]);

  return { herhalingen, laden: status === "laden" || laden, vernieuw };
}
