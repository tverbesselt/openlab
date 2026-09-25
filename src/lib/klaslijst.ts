"use client";

import { useCallback, useEffect, useState } from "react";
import { t } from "./i18n";

/*
 * Eén klaslijst voor de klastools, met wie er vandaag is.
 *
 * Een leraar typt zijn groep één keer in en gebruikt ze in de naamkiezer én de
 * groepenmaker. Wie afwezig is, klik je weg: die krijgt geen beurt en komt niet in een
 * groep. Afwezigen blijven in de lijst staan, want volgende les zijn ze er weer.
 *
 * De lijst blijft in de browser van de leraar (localStorage). Namen van cursisten gaan dus
 * nooit naar de databank: de klastools hebben daar niets voor nodig.
 */

const OPSLAG = "openlab_klaslijst";

/** Een voorbeeldlijst met namen, in de taal van de app. */
export function voorbeeldlijst(): string {
  return t("klas.klaslijst.voorbeeld");
}

interface Bewaard {
  tekst: string;
  afwezig: string[];
}

/** Namen uit de invoer: gescheiden door komma of nieuwe regel, zonder dubbels. */
export function leesNamen(tekst: string): string[] {
  const namen = tekst
    .split(/[\n,]/)
    .map((n) => n.trim())
    .filter(Boolean);
  return [...new Set(namen)];
}

export interface Klaslijst {
  /** De ruwe invoer, zoals de leraar ze typte. */
  tekst: string;
  zetTekst: (tekst: string) => void;
  /** Alle namen, aanwezig en afwezig. */
  namen: string[];
  /** Wie vandaag niet meedoet. */
  afwezig: string[];
  /** Wie wel meedoet: hieruit kiest de naamkiezer en maakt de groepenmaker groepen. */
  aanwezig: string[];
  isAfwezig: (naam: string) => boolean;
  wissel: (naam: string) => void;
  iedereenAanwezig: () => void;
  /** Klaar met laden uit de browseropslag; tot dan tonen we de lijst nog niet. */
  geladen: boolean;
}

export function useKlaslijst(): Klaslijst {
  const [tekst, setTekst] = useState(voorbeeldlijst);
  const [afwezig, setAfwezig] = useState<string[]>([]);
  const [geladen, setGeladen] = useState(false);

  // Wat je vorige les intypte, staat er nog. Afwezigheden ook: een les duurt zelden één dag.
  useEffect(() => {
    try {
      const bewaard = localStorage.getItem(OPSLAG);
      if (bewaard) {
        const inhoud = JSON.parse(bewaard) as Partial<Bewaard>;
        if (typeof inhoud.tekst === "string") setTekst(inhoud.tekst);
        if (Array.isArray(inhoud.afwezig)) setAfwezig(inhoud.afwezig.filter((n) => typeof n === "string"));
      }
    } catch {
      // Geen opslag of onleesbare inhoud: dan begin je met de voorbeeldlijst.
    }
    setGeladen(true);
  }, []);

  const bewaar = useCallback((nieuweTekst: string, nieuwAfwezig: string[]) => {
    try {
      localStorage.setItem(OPSLAG, JSON.stringify({ tekst: nieuweTekst, afwezig: nieuwAfwezig }));
    } catch {
      // Niet erg; de tools werken ook zonder onthouden.
    }
  }, []);

  const namen = leesNamen(tekst);

  // Namen die uit de lijst verdwenen, hoeven niet afwezig te blijven.
  const afwezigInLijst = afwezig.filter((n) => namen.includes(n));

  const zetTekst = useCallback(
    (nieuw: string) => {
      setTekst(nieuw);
      const overblijvend = afwezig.filter((n) => leesNamen(nieuw).includes(n));
      setAfwezig(overblijvend);
      bewaar(nieuw, overblijvend);
    },
    [afwezig, bewaar]
  );

  const wissel = useCallback(
    (naam: string) => {
      const nieuw = afwezig.includes(naam)
        ? afwezig.filter((n) => n !== naam)
        : [...afwezig, naam];
      setAfwezig(nieuw);
      bewaar(tekst, nieuw);
    },
    [afwezig, tekst, bewaar]
  );

  const iedereenAanwezig = useCallback(() => {
    setAfwezig([]);
    bewaar(tekst, []);
  }, [tekst, bewaar]);

  return {
    tekst,
    zetTekst,
    namen,
    afwezig: afwezigInLijst,
    aanwezig: namen.filter((n) => !afwezigInLijst.includes(n)),
    isAfwezig: (naam: string) => afwezigInLijst.includes(naam),
    wissel,
    iedereenAanwezig,
    geladen,
  };
}
