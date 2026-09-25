"use client";

import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
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
} from "@/lib/types";
import type { Opslag, CodeDoel } from "./types";
import { vergelijk } from "@/lib/i18n";

/*
 * Firestore-uitvoering. Verzamelingen (zie firestore.rules voor wie wat mag):
 *   oefeningen/{id}                 het materiaal zelf
 *   oefeningen/{id}/inzendingen/{id} exit tickets, alleen leesbaar voor de maker
 *   oefeningen/{id}/resultaten/{id} anonieme quizresultaten, alleen voor de maker
 *   mappen/{id}                     lesmappen, persoonlijk of van de organisatie
 *   beheerders/{e-mail}             wie organisatiemappen beheert (alleen via de console)
 *   codes/{CODE}                    code van zes tekens -> oefening of map
 *   sessies/{pincode}               een live-sessie op het digibord
 *   sessies/{pincode}/antwoorden/{apparaat}  één antwoord per toestel
 *   sessies/{pincode}/spelers/{apparaat}     quizwedstrijd: bijnaam en punten
 *   sessies/{pincode}/quizantwoorden/{apparaat}_{vraag}  quizwedstrijd: één antwoord per vraag
 *   sessies/{pincode}/bord/{id}              whiteboard: één kaartje per document
 *   herhalingen/{uid}/items/{id}    de eigen herhaalplanning van een cursist
 */

const OEFENINGEN = "oefeningen";
const MAPPEN = "mappen";
const CODES = "codes";
const SESSIES = "sessies";
const HERHALINGEN = "herhalingen";

/** Firestore weigert undefined; dit gooit lege velden weg zonder de rest te raken. */
function schoon<T>(waarde: T): T {
  return JSON.parse(JSON.stringify(waarde)) as T;
}

function nieuwsteEerst<T extends { createdAt: string }>(lijst: T[]): T[] {
  return [...lijst].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function alsOefening(id: string, data: DocumentData): Exercise {
  return { ...(data as Exercise), id };
}

function alsMap(id: string, data: DocumentData): Lesmap {
  return { ...(data as Lesmap), id };
}

export const firestoreOpslag: Opslag = {
  async zichtbareOefeningen(kijker) {
    const db = getDb();
    const ref = collection(db, OEFENINGEN);

    // Twee gerichte vragen in plaats van één brede: de regels laten geen lijst toe die
    // ook privé materiaal van collega's zou bevatten.
    const vragen = [getDocs(query(ref, where("visibility", "==", "organisatie")))];
    if (kijker?.id) {
      vragen.push(getDocs(query(ref, where("creatorId", "==", kijker.id))));
    }
    const resultaten = await Promise.all(vragen);

    const perId = new Map<string, Exercise>();
    for (const snap of resultaten) {
      snap.forEach((d) => perId.set(d.id, alsOefening(d.id, d.data())));
    }
    return nieuwsteEerst([...perId.values()]);
  },

  async oefening(id) {
    const snap = await getDoc(doc(getDb(), OEFENINGEN, id));
    return snap.exists() ? alsOefening(snap.id, snap.data()) : null;
  },

  async maakOefeningen(nieuwe) {
    const db = getDb();
    const batch = writeBatch(db);
    for (const ex of nieuwe) {
      batch.set(doc(db, OEFENINGEN, ex.id), schoon(ex));
      batch.set(doc(db, CODES, ex.shareCode.toUpperCase()), {
        soort: "oefening",
        doelId: ex.id,
        creatorId: ex.creatorId ?? null,
      });
    }
    await batch.commit();
  },

  async wijzigOefening(id, wijziging) {
    await updateDoc(doc(getDb(), OEFENINGEN, id), schoon(wijziging));
  },

  async verwijderOefening(id) {
    const db = getDb();
    const ref = doc(db, OEFENINGEN, id);
    const snap = await getDoc(ref);
    const batch = writeBatch(db);
    batch.delete(ref);
    const code = snap.exists() ? (snap.data() as Exercise).shareCode : null;
    if (code) batch.delete(doc(db, CODES, code.toUpperCase()));
    await batch.commit();
  },

  async eigenMappen(eigenaar) {
    if (!eigenaar?.id) return [];
    const snap = await getDocs(
      query(collection(getDb(), MAPPEN), where("creatorId", "==", eigenaar.id))
    );
    const lijst: Lesmap[] = [];
    snap.forEach((d) => lijst.push(alsMap(d.id, d.data())));
    // Een organisatiemap die deze beheerder aanmaakte, is niet persoonlijk.
    return nieuwsteEerst(lijst.filter((m) => !m.organisatie));
  },

  async organisatieMappen() {
    const snap = await getDocs(
      query(collection(getDb(), MAPPEN), where("organisatie", "==", true))
    );
    const lijst: Lesmap[] = [];
    snap.forEach((d) => lijst.push(alsMap(d.id, d.data())));
    return lijst.sort((a, b) => vergelijk(a.title, b.title));
  },

  async map(id) {
    const snap = await getDoc(doc(getDb(), MAPPEN, id));
    return snap.exists() ? alsMap(snap.id, snap.data()) : null;
  },

  async maakMap(map) {
    const db = getDb();
    const batch = writeBatch(db);
    batch.set(doc(db, MAPPEN, map.id), schoon(map));
    batch.set(doc(db, CODES, map.shareCode.toUpperCase()), {
      soort: "map",
      doelId: map.id,
      creatorId: map.creatorId ?? null,
      // Zo kan een andere beheerder de code mee opruimen als de map verdwijnt.
      organisatie: map.organisatie === true,
    });
    await batch.commit();
  },

  async wijzigMap(id, wijziging) {
    await updateDoc(doc(getDb(), MAPPEN, id), schoon(wijziging));
  },

  async verwijderMap(id) {
    const db = getDb();
    const ref = doc(db, MAPPEN, id);
    const snap = await getDoc(ref);
    const batch = writeBatch(db);
    batch.delete(ref);
    const code = snap.exists() ? (snap.data() as Lesmap).shareCode : null;
    if (code) batch.delete(doc(db, CODES, code.toUpperCase()));
    await batch.commit();
  },

  async verplaatsOefening(oefeningId, vanMapId, naarMapId) {
    // arrayRemove en arrayUnion: een collega die tegelijk iets in dezelfde map zet,
    // overschrijft dit niet en wordt er zelf ook niet door overschreven.
    const db = getDb();
    const batch = writeBatch(db);
    batch.update(doc(db, MAPPEN, vanMapId), { exerciseIds: arrayRemove(oefeningId) });
    batch.update(doc(db, MAPPEN, naarMapId), { exerciseIds: arrayUnion(oefeningId) });
    await batch.commit();
  },

  async viaCode(code): Promise<CodeDoel | null> {
    const snap = await getDoc(doc(getDb(), CODES, code.toUpperCase()));
    if (!snap.exists()) return null;
    const data = snap.data() as { soort: "oefening" | "map"; doelId: string };
    return { soort: data.soort, id: data.doelId };
  },

  /* Live in de klas */

  async startSessie(sessie) {
    await setDoc(doc(getDb(), SESSIES, sessie.code), schoon(sessie));
  },

  async wijzigSessie(code, wijziging) {
    await updateDoc(doc(getDb(), SESSIES, code), schoon(wijziging));
  },

  volgSessie(code, bij) {
    return onSnapshot(
      doc(getDb(), SESSIES, code),
      (snap) => bij(snap.exists() ? (snap.data() as LiveSessie) : null),
      () => bij(null)
    );
  },

  volgAntwoorden(code, bij) {
    return onSnapshot(collection(getDb(), SESSIES, code, "antwoorden"), (snap) => {
      const lijst: LiveAntwoord[] = [];
      snap.forEach((d) => lijst.push(d.data() as LiveAntwoord));
      bij(lijst);
    });
  },

  async stuurAntwoord(code, antwoord) {
    // Het toestel-id is de documentnaam: een tweede stem van hetzelfde toestel botst
    // op de regel "alleen aanmaken", en dat is precies de bedoeling.
    await setDoc(
      doc(getDb(), SESSIES, code, "antwoorden", antwoord.apparaat),
      schoon(antwoord)
    );
  },

  /* Quizwedstrijd */

  async meldSpeler(code, speler) {
    await setDoc(doc(getDb(), SESSIES, code, "spelers", speler.apparaat), schoon(speler));
  },

  volgSpeler(code, apparaat, bij) {
    return onSnapshot(
      doc(getDb(), SESSIES, code, "spelers", apparaat),
      (snap) => bij(snap.exists() ? (snap.data() as WedstrijdSpeler) : null),
      () => bij(null)
    );
  },

  volgSpelers(code, bij) {
    return onSnapshot(collection(getDb(), SESSIES, code, "spelers"), (snap) => {
      const lijst: WedstrijdSpeler[] = [];
      snap.forEach((d) => lijst.push(d.data() as WedstrijdSpeler));
      bij(lijst);
    });
  },

  async werkSpelersBij(code, spelers) {
    const db = getDb();
    // Een batch telt tot 500 schrijfacties; een klas zit daar ver onder.
    const batch = writeBatch(db);
    for (const speler of spelers) {
      batch.set(doc(db, SESSIES, code, "spelers", speler.apparaat), schoon(speler));
    }
    await batch.commit();
  },

  async verwijderSpeler(code, apparaat) {
    await deleteDoc(doc(getDb(), SESSIES, code, "spelers", apparaat));
  },

  async stuurWedstrijdAntwoord(code, antwoord) {
    // Toestel en vraag vormen samen de documentnaam: een tweede antwoord op dezelfde
    // vraag botst op de regel "alleen aanmaken".
    await setDoc(
      doc(getDb(), SESSIES, code, "quizantwoorden", `${antwoord.apparaat}_${antwoord.vraagNr}`),
      schoon(antwoord)
    );
  },

  volgWedstrijdAntwoorden(code, vraagNr, bij) {
    const ref = collection(getDb(), SESSIES, code, "quizantwoorden");
    return onSnapshot(query(ref, where("vraagNr", "==", vraagNr)), (snap) => {
      const lijst: WedstrijdAntwoord[] = [];
      snap.forEach((d) => lijst.push(d.data() as WedstrijdAntwoord));
      bij(lijst);
    });
  },

  /* Whiteboard */

  async stuurBordItem(code, item) {
    await setDoc(doc(getDb(), SESSIES, code, "bord", item.id), schoon(item));
  },

  volgBord(code, alles, bij, bijFout) {
    const ref = collection(getDb(), SESSIES, code, "bord");
    // Een cursist mag alleen vragen naar wat zichtbaar is; de regels weigeren de rest.
    const vraag = alles ? ref : query(ref, where("status", "==", "zichtbaar"));
    return onSnapshot(
      vraag,
      (snap) => {
        const lijst: BordItem[] = [];
        snap.forEach((d) => lijst.push(d.data() as BordItem));
        bij(lijst);
      },
      (e) => {
        console.error("Bord volgen mislukt", e);
        bijFout?.();
      }
    );
  },

  async wijzigBordItem(code, id, wijziging) {
    await updateDoc(doc(getDb(), SESSIES, code, "bord", id), schoon(wijziging));
  },

  async verwijderBordItem(code, id) {
    await deleteDoc(doc(getDb(), SESSIES, code, "bord", id));
  },

  /* Exit tickets */

  async stuurInzending(oefeningId, antwoorden) {
    const ref = doc(collection(getDb(), OEFENINGEN, oefeningId, "inzendingen"));
    await setDoc(ref, { antwoorden, op: new Date().toISOString() });
  },

  async inzendingen(oefeningId) {
    const snap = await getDocs(collection(getDb(), OEFENINGEN, oefeningId, "inzendingen"));
    const lijst: Inzending[] = [];
    snap.forEach((d) => lijst.push({ id: d.id, ...(d.data() as Omit<Inzending, "id">) }));
    return lijst.sort((a, b) => b.op.localeCompare(a.op));
  },

  /* Quizresultaten */

  async stuurQuizresultaat(oefeningId, foutVragen, aantalVragen) {
    const ref = doc(collection(getDb(), OEFENINGEN, oefeningId, "resultaten"));
    await setDoc(ref, { foutVragen, aantalVragen, op: new Date().toISOString() });
  },

  async quizresultaten(oefeningId) {
    const snap = await getDocs(collection(getDb(), OEFENINGEN, oefeningId, "resultaten"));
    const lijst: Quizresultaat[] = [];
    snap.forEach((d) => lijst.push({ id: d.id, ...(d.data() as Omit<Quizresultaat, "id">) }));
    return lijst.sort((a, b) => b.op.localeCompare(a.op));
  },

  /* Gespreid herhalen */

  async herhalingen(gebruikerId) {
    const snap = await getDocs(collection(getDb(), HERHALINGEN, gebruikerId, "items"));
    const lijst: Herhaling[] = [];
    snap.forEach((d) => lijst.push(d.data() as Herhaling));
    return lijst;
  },

  async bewaarHerhaling(gebruikerId, herhaling) {
    await setDoc(doc(getDb(), HERHALINGEN, gebruikerId, "items", herhaling.id), schoon(herhaling));
  },
};
