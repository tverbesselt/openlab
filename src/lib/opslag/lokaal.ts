"use client";

import {
  BordItem,
  Exercise,
  Herhaling,
  Inzending,
  Lesmap,
  LiveAntwoord,
  LiveSessie,
  Quizresultaat,
  WedstrijdAntwoord,
  WedstrijdSpeler,
  Zichtbaarheid,
} from "@/lib/types";
import { INITIAL_EXERCISES, INITIAL_MAPPEN } from "@/lib/mockData";
import {
  zichtbaarVoor,
  eigenMappen as filterEigenMappen,
  organisatieMappen as filterOrganisatieMappen,
} from "@/lib/labels";
import type { Opslag, CodeDoel } from "./types";
import { t } from "@/lib/i18n";

/*
 * Demomodus: alles in localStorage van deze browser. Live-sessies werken hier tussen
 * tabbladen van dezelfde browser, via het storage-event. Handig om te tonen hoe het
 * werkt zonder Firebase-project; op school draait de Firestore-uitvoering.
 */

const OPSLAG_OEFENINGEN = "openlab_exercises_v1";
const OPSLAG_MAPPEN = "openlab_sets_v1";
const OPSLAG_SESSIE = "openlab_sessie_";
const OPSLAG_ANTWOORDEN = "openlab_antwoorden_";
const OPSLAG_SPELERS = "openlab_spelers_";
const OPSLAG_WEDSTRIJD = "openlab_quizantwoorden_";
const OPSLAG_BORD = "openlab_bord_";
const OPSLAG_INZENDINGEN = "openlab_inzendingen_";
const OPSLAG_RESULTATEN = "openlab_resultaten_";
const OPSLAG_HERHALINGEN = "openlab_herhalingen_";

/**
 * Oudere versies bewaarden 'private', 'shared' of een bibliotheekwaarde. Alles wat niet
 * uitdrukkelijk privé was, stond voor iedereen open — dus zo lezen we het terug.
 */
function normaliseerZichtbaarheid(waarde: unknown): Zichtbaarheid {
  return waarde === "prive" || waarde === "private" ? "prive" : "organisatie";
}

function lees<T>(sleutel: string, standaard: T[]): T[] {
  if (typeof window === "undefined") return standaard;
  const bewaard = localStorage.getItem(sleutel);
  if (bewaard) {
    try {
      const gelezen = JSON.parse(bewaard);
      if (Array.isArray(gelezen) && gelezen.length > 0) return gelezen;
    } catch {
      // Onleesbare opslag: val terug op de voorbeeldgegevens.
    }
  }
  return standaard;
}

function leesEen<T>(sleutel: string): T | null {
  if (typeof window === "undefined") return null;
  const bewaard = localStorage.getItem(sleutel);
  if (!bewaard) return null;
  try {
    return JSON.parse(bewaard) as T;
  } catch {
    return null;
  }
}

function schrijf(sleutel: string, waarde: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(sleutel, JSON.stringify(waarde));
}

function alleOefeningen(): Exercise[] {
  return lees<Exercise>(OPSLAG_OEFENINGEN, INITIAL_EXERCISES).map((ex) => ({
    ...ex,
    visibility: normaliseerZichtbaarheid(ex.visibility),
  }));
}

function alleMappen(): Lesmap[] {
  return lees<Lesmap>(OPSLAG_MAPPEN, INITIAL_MAPPEN);
}

/**
 * Luister naar wijzigingen aan één sleutel, uit een ander tabblad (storage-event) of uit
 * dit tabblad (eigen event, want de browser vuurt storage niet voor de schrijver zelf).
 */
const EIGEN_EVENT = "openlab-opslag";

function meldWijziging(sleutel: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EIGEN_EVENT, { detail: sleutel }));
}

function volgSleutel(sleutel: string, bij: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const opStorage = (e: StorageEvent) => {
    if (e.key === sleutel) bij();
  };
  const opEigen = (e: Event) => {
    if ((e as CustomEvent<string>).detail === sleutel) bij();
  };
  window.addEventListener("storage", opStorage);
  window.addEventListener(EIGEN_EVENT, opEigen);
  return () => {
    window.removeEventListener("storage", opStorage);
    window.removeEventListener(EIGEN_EVENT, opEigen);
  };
}

export const lokaleOpslag: Opslag = {
  async zichtbareOefeningen(kijker) {
    return zichtbaarVoor(alleOefeningen(), kijker);
  },

  async oefening(id) {
    return alleOefeningen().find((ex) => ex.id === id) ?? null;
  },

  async maakOefeningen(nieuwe) {
    schrijf(OPSLAG_OEFENINGEN, [...nieuwe, ...alleOefeningen()]);
  },

  async wijzigOefening(id, wijziging) {
    schrijf(
      OPSLAG_OEFENINGEN,
      alleOefeningen().map((ex) => (ex.id === id ? { ...ex, ...wijziging } : ex))
    );
  },

  async verwijderOefening(id) {
    schrijf(
      OPSLAG_OEFENINGEN,
      alleOefeningen().filter((ex) => ex.id !== id)
    );
  },

  async eigenMappen(eigenaar) {
    return filterEigenMappen(alleMappen(), eigenaar);
  },

  async organisatieMappen() {
    return filterOrganisatieMappen(alleMappen());
  },

  async map(id) {
    return alleMappen().find((m) => m.id === id) ?? null;
  },

  async maakMap(map) {
    schrijf(OPSLAG_MAPPEN, [map, ...alleMappen()]);
  },

  async wijzigMap(id, wijziging) {
    schrijf(
      OPSLAG_MAPPEN,
      alleMappen().map((m) => (m.id === id ? { ...m, ...wijziging } : m))
    );
  },

  async verwijderMap(id) {
    schrijf(
      OPSLAG_MAPPEN,
      alleMappen().filter((m) => m.id !== id)
    );
  },

  async verplaatsOefening(oefeningId, vanMapId, naarMapId) {
    schrijf(
      OPSLAG_MAPPEN,
      alleMappen().map((m) => {
        if (m.id === vanMapId) {
          return { ...m, exerciseIds: m.exerciseIds.filter((id) => id !== oefeningId) };
        }
        if (m.id === naarMapId && !m.exerciseIds.includes(oefeningId)) {
          return { ...m, exerciseIds: [...m.exerciseIds, oefeningId] };
        }
        return m;
      })
    );
  },

  async viaCode(code): Promise<CodeDoel | null> {
    const gezocht = code.toUpperCase();
    const oefening = alleOefeningen().find((ex) => ex.shareCode.toUpperCase() === gezocht);
    if (oefening) return { soort: "oefening", id: oefening.id };
    const map = alleMappen().find((m) => m.shareCode.toUpperCase() === gezocht);
    if (map) return { soort: "map", id: map.id };
    return null;
  },

  /* Live: één sleutel per sessie, één lijst met antwoorden ernaast. */

  async startSessie(sessie) {
    schrijf(OPSLAG_SESSIE + sessie.code, sessie);
    schrijf(OPSLAG_ANTWOORDEN + sessie.code, []);
    meldWijziging(OPSLAG_SESSIE + sessie.code);
  },

  async wijzigSessie(code, wijziging) {
    const huidig = leesEen<LiveSessie>(OPSLAG_SESSIE + code);
    if (!huidig) return;
    schrijf(OPSLAG_SESSIE + code, { ...huidig, ...wijziging });
    meldWijziging(OPSLAG_SESSIE + code);
  },

  volgSessie(code, bij) {
    const sleutel = OPSLAG_SESSIE + code;
    bij(leesEen<LiveSessie>(sleutel));
    return volgSleutel(sleutel, () => bij(leesEen<LiveSessie>(sleutel)));
  },

  volgAntwoorden(code, bij) {
    const sleutel = OPSLAG_ANTWOORDEN + code;
    bij(leesEen<LiveAntwoord[]>(sleutel) ?? []);
    return volgSleutel(sleutel, () => bij(leesEen<LiveAntwoord[]>(sleutel) ?? []));
  },

  async stuurAntwoord(code, antwoord) {
    const sessie = leesEen<LiveSessie>(OPSLAG_SESSIE + code);
    if (!sessie || sessie.status !== "actief") {
      throw new Error(t("materiaal.opslag.sessieNietActief"));
    }
    const sleutel = OPSLAG_ANTWOORDEN + code;
    const huidige = leesEen<LiveAntwoord[]>(sleutel) ?? [];
    const alGeantwoord = huidige.some((a) => a.apparaat === antwoord.apparaat);

    if (alGeantwoord && sessie.type !== "begripsmeter") {
      throw new Error(t("materiaal.opslag.alGeantwoord"));
    }

    // De begripsmeter loopt de hele les mee: een nieuw signaal vervangt het vorige.
    const bijgewerkt = alGeantwoord
      ? huidige.map((a) => (a.apparaat === antwoord.apparaat ? antwoord : a))
      : [...huidige, antwoord];

    schrijf(sleutel, bijgewerkt);
    meldWijziging(sleutel);
  },

  /* Quizwedstrijd: één lijst spelers en één lijst antwoorden per sessie. */

  async meldSpeler(code, speler) {
    const sessie = leesEen<LiveSessie>(OPSLAG_SESSIE + code);
    if (!sessie || sessie.status !== "actief") throw new Error(t("materiaal.opslag.sessieNietActief"));
    const sleutel = OPSLAG_SPELERS + code;
    const huidige = leesEen<WedstrijdSpeler[]>(sleutel) ?? [];
    if (huidige.some((s) => s.apparaat === speler.apparaat)) throw new Error(t("materiaal.opslag.doetAlMee"));
    schrijf(sleutel, [...huidige, speler]);
    meldWijziging(sleutel);
  },

  volgSpeler(code, apparaat, bij) {
    const sleutel = OPSLAG_SPELERS + code;
    const zoek = () =>
      bij((leesEen<WedstrijdSpeler[]>(sleutel) ?? []).find((s) => s.apparaat === apparaat) ?? null);
    zoek();
    return volgSleutel(sleutel, zoek);
  },

  volgSpelers(code, bij) {
    const sleutel = OPSLAG_SPELERS + code;
    bij(leesEen<WedstrijdSpeler[]>(sleutel) ?? []);
    return volgSleutel(sleutel, () => bij(leesEen<WedstrijdSpeler[]>(sleutel) ?? []));
  },

  async werkSpelersBij(code, spelers) {
    const sleutel = OPSLAG_SPELERS + code;
    const nieuw = new Map(spelers.map((s) => [s.apparaat, s]));
    const huidige = leesEen<WedstrijdSpeler[]>(sleutel) ?? [];
    // Wie intussen verwijderd werd, komt niet terug.
    schrijf(sleutel, huidige.map((s) => nieuw.get(s.apparaat) ?? s));
    meldWijziging(sleutel);
  },

  async verwijderSpeler(code, apparaat) {
    const sleutel = OPSLAG_SPELERS + code;
    const huidige = leesEen<WedstrijdSpeler[]>(sleutel) ?? [];
    schrijf(sleutel, huidige.filter((s) => s.apparaat !== apparaat));
    meldWijziging(sleutel);
  },

  async stuurWedstrijdAntwoord(code, antwoord) {
    const sessie = leesEen<LiveSessie>(OPSLAG_SESSIE + code);
    if (
      !sessie ||
      sessie.status !== "actief" ||
      sessie.quiz?.fase !== "vraag" ||
      sessie.quiz.vraagNr !== antwoord.vraagNr
    ) {
      throw new Error(t("materiaal.opslag.vraagAfgesloten"));
    }
    const sleutel = OPSLAG_WEDSTRIJD + code;
    const huidige = leesEen<WedstrijdAntwoord[]>(sleutel) ?? [];
    if (huidige.some((a) => a.apparaat === antwoord.apparaat && a.vraagNr === antwoord.vraagNr)) {
      throw new Error(t("materiaal.opslag.alGeantwoord"));
    }
    schrijf(sleutel, [...huidige, antwoord]);
    meldWijziging(sleutel);
  },

  volgWedstrijdAntwoorden(code, vraagNr, bij) {
    const sleutel = OPSLAG_WEDSTRIJD + code;
    const lees = () =>
      bij((leesEen<WedstrijdAntwoord[]>(sleutel) ?? []).filter((a) => a.vraagNr === vraagNr));
    lees();
    return volgSleutel(sleutel, lees);
  },

  /* Whiteboard: één lijst kaartjes per sessie. */

  async stuurBordItem(code, item) {
    const sessie = leesEen<LiveSessie>(OPSLAG_SESSIE + code);
    if (!sessie || sessie.status !== "actief") throw new Error(t("materiaal.opslag.bordGesloten"));
    const inst = sessie.bord;
    if (!item.leraar && (!inst?.open || !inst.soorten.includes(item.soort))) {
      throw new Error(t("materiaal.opslag.magNietOpBord"));
    }
    const sleutel = OPSLAG_BORD + code;
    const huidige = leesEen<BordItem[]>(sleutel) ?? [];
    try {
      schrijf(sleutel, [...huidige, item]);
    } catch {
      // localStorage is maar een paar MB groot; op school geldt die grens niet.
      throw new Error(t("materiaal.opslag.bordVol"));
    }
    meldWijziging(sleutel);
  },

  volgBord(code, alles, bij) {
    const sleutel = OPSLAG_BORD + code;
    const lees = () => {
      const items = leesEen<BordItem[]>(sleutel) ?? [];
      if (alles) return bij(items);
      const sessie = leesEen<LiveSessie>(OPSLAG_SESSIE + code);
      bij(sessie?.bord?.zichtbaar ? items.filter((i) => i.status === "zichtbaar") : []);
    };
    lees();
    return volgSleutel(sleutel, lees);
  },

  async wijzigBordItem(code, id, wijziging) {
    const sleutel = OPSLAG_BORD + code;
    const huidige = leesEen<BordItem[]>(sleutel) ?? [];
    schrijf(sleutel, huidige.map((i) => (i.id === id ? { ...i, ...wijziging } : i)));
    meldWijziging(sleutel);
  },

  async verwijderBordItem(code, id) {
    const sleutel = OPSLAG_BORD + code;
    const huidige = leesEen<BordItem[]>(sleutel) ?? [];
    schrijf(sleutel, huidige.filter((i) => i.id !== id));
    meldWijziging(sleutel);
  },

  /* Exit tickets */

  async stuurInzending(oefeningId, antwoorden) {
    const sleutel = OPSLAG_INZENDINGEN + oefeningId;
    const huidige = leesEen<Inzending[]>(sleutel) ?? [];
    const nieuw: Inzending = {
      id: `inz-${Date.now()}`,
      antwoorden,
      op: new Date().toISOString(),
    };
    schrijf(sleutel, [nieuw, ...huidige]);
  },

  async inzendingen(oefeningId) {
    return leesEen<Inzending[]>(OPSLAG_INZENDINGEN + oefeningId) ?? [];
  },

  async stuurQuizresultaat(oefeningId, foutVragen, aantalVragen) {
    const sleutel = OPSLAG_RESULTATEN + oefeningId;
    const huidige = leesEen<Quizresultaat[]>(sleutel) ?? [];
    const nieuw: Quizresultaat = {
      id: `res-${Date.now()}`,
      foutVragen,
      aantalVragen,
      op: new Date().toISOString(),
    };
    schrijf(sleutel, [nieuw, ...huidige]);
  },

  async quizresultaten(oefeningId) {
    return leesEen<Quizresultaat[]>(OPSLAG_RESULTATEN + oefeningId) ?? [];
  },

  async herhalingen(gebruikerId) {
    return leesEen<Herhaling[]>(OPSLAG_HERHALINGEN + gebruikerId) ?? [];
  },

  async bewaarHerhaling(gebruikerId, herhaling) {
    const sleutel = OPSLAG_HERHALINGEN + gebruikerId;
    const huidige = leesEen<Herhaling[]>(sleutel) ?? [];
    const zonderOude = huidige.filter((h) => h.id !== herhaling.id);
    schrijf(sleutel, [...zonderOude, herhaling]);
  },
};
