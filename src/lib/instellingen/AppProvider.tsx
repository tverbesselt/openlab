"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { t, zetTaal, isTaal, type Taal } from "@/lib/i18n";
import { laadInstellingen, uitCache } from "./opslag";
import { STANDAARD_INSTELLINGEN, type Instellingen } from "./types";
import { HANGT_AF_VAN, type FunctieId } from "./functies";
import { maakPalet, paletVariabelen, pasPaletToe } from "./kleur";
import { THEMA_SLEUTEL } from "./themaScript";

/*
 * De instellingen en de taal voor de hele app.
 *
 * De app rendert pas in de browser, zodra de instellingen er zijn. Anders zou een
 * uitgeschakelde werkvorm even zichtbaar zijn, of de pagina in de verkeerde taal of kleur
 * verschijnen. Bij een tweede bezoek komen ze meteen uit de cache, dus dat merk je niet.
 *
 * Wisselt de taal, dan tekent alles opnieuw (key={taal}). Zo volgen ook teksten die buiten
 * React vertaald worden, in lib-bestanden en lijsten.
 */

const TAAL_SLEUTEL = "openlab_taal";

interface AppContext {
  instellingen: Instellingen;
  taal: Taal;
  kiesTaal: (taal: Taal) => void;
  /** Staat deze functie aan? */
  isAan: (functie: FunctieId) => boolean;
  /** Na bewaren in het beheer: meteen overal toepassen. */
  vervang: (nieuw: Instellingen) => void;
}

const Ctx = createContext<AppContext | null>(null);

let huidige: Instellingen = STANDAARD_INSTELLINGEN;

/** Voor code buiten React. In componenten: useInstellingen(). */
export function instellingenNu(): Instellingen {
  return huidige;
}

/** Staat deze functie aan? Voor code buiten React; in componenten: useInstellingen().isAan. */
export function functieAan(functie: FunctieId, i: Instellingen = huidige): boolean {
  if (i.uit.includes(functie)) return false;
  const nodig = HANGT_AF_VAN[functie];
  return nodig ? functieAan(nodig, i) : true;
}

function bewaardeTaal(): Taal | null {
  try {
    const t = localStorage.getItem(TAAL_SLEUTEL);
    return isTaal(t) ? t : null;
  } catch {
    return null;
  }
}

function kiesGeldigeTaal(i: Instellingen, gewenst: Taal | null): Taal {
  return gewenst && i.talen.includes(gewenst) ? gewenst : i.standaardTaal;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [instellingen, setInstellingen] = useState<Instellingen | null>(null);
  const [taal, setTaal] = useState<Taal>("nl");

  const pasToe = useCallback((i: Instellingen, gewenst: Taal | null) => {
    huidige = i;
    const nieuweTaal = kiesGeldigeTaal(i, gewenst);
    // Eerst de taal, dan pas de vaste waarden: de standaardnaam van de organisatie is zelf
    // een vertaling.
    zetTaal(nieuweTaal, { app: i.naam });
    zetTaal(nieuweTaal, { app: i.naam, organisatie: i.organisatie || t("algemeen.jouwOrganisatie") });
    setTaal(nieuweTaal);
    setInstellingen(i);

    const palet = maakPalet(i.kleur);
    pasPaletToe(palet);
    try {
      localStorage.setItem(THEMA_SLEUTEL, JSON.stringify(paletVariabelen(palet)));
    } catch {
      // Niet erg: de volgende keer verschijnt de kleur een fractie later.
    }
    document.documentElement.lang = nieuweTaal;
    document.title = i.naam;
    zetFavicon(i.logo);
  }, []);

  useEffect(() => {
    const gewenst = bewaardeTaal();
    const cache = uitCache();
    if (cache) pasToe(cache, gewenst);
    laadInstellingen()
      .then((i) => pasToe(i, bewaardeTaal()))
      .catch((e) => {
        console.error("Instellingen laden mislukt", e);
        if (!cache) pasToe(STANDAARD_INSTELLINGEN, gewenst);
      });
  }, [pasToe]);

  const kiesTaal = useCallback(
    (nieuw: Taal) => {
      try {
        localStorage.setItem(TAAL_SLEUTEL, nieuw);
      } catch {
        // Dan geldt de keuze alleen voor dit bezoek.
      }
      pasToe(huidige, nieuw);
    },
    [pasToe]
  );

  const vervang = useCallback((nieuw: Instellingen) => pasToe(nieuw, bewaardeTaal()), [pasToe]);

  const waarde = useMemo<AppContext | null>(
    () =>
      instellingen && {
        instellingen,
        taal,
        kiesTaal,
        isAan: (f: FunctieId) => functieAan(f, instellingen),
        vervang,
      },
    [instellingen, taal, kiesTaal, vervang]
  );

  if (!waarde) return <div className="min-h-dvh" aria-busy="true" />;

  return (
    <Ctx.Provider value={waarde}>
      <React.Fragment key={taal}>{children}</React.Fragment>
    </Ctx.Provider>
  );
}

function zetFavicon(logo: string | null) {
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon'][data-app]");
  if (!logo) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.dataset.app = "1";
    document.head.appendChild(link);
  }
  link.href = logo;
}

export function useInstellingen(): AppContext {
  const v = useContext(Ctx);
  if (!v) throw new Error("useInstellingen moet binnen <AppProvider> gebruikt worden.");
  return v;
}
