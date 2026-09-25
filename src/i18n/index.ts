/*
 * Alle vertaalbestanden op één plek. Een nieuw bestand in deze map voeg je hier toe; de
 * naam hier is het eerste deel van elke sleutel, zoals "maken.titel".
 */
import type { Pad } from "./definieer";
import algemeen from "./algemeen";
import aanmelden from "./aanmelden";
import beheer from "./beheer";
import werkvormen from "./werkvormen";
import maken from "./maken";
import makenvormen from "./makenvormen";
import live from "./live";
import wedstrijd from "./wedstrijd";
import bord from "./bord";
import spelers from "./spelers";
import oefenen from "./oefenen";
import materiaal from "./materiaal";
import klas from "./klas";
import tips from "./tips";

export const NAAMRUIMTES = {
  algemeen,
  aanmelden,
  beheer,
  werkvormen,
  maken,
  makenvormen,
  live,
  wedstrijd,
  bord,
  spelers,
  oefenen,
  materiaal,
  klas,
  tips,
};

type Ruimtes = typeof NAAMRUIMTES;

/** Elke geldige vertaalsleutel, zoals "algemeen.opslaan". */
export type Sleutel = {
  [N in keyof Ruimtes & string]: `${N}.${Pad<Ruimtes[N]["nl"]>}`;
}[keyof Ruimtes & string];

/** Sleutels met een enkelvoud en meervoud: "x.one" en "x.other" bestaan allebei. */
type Meervoud<S> = S extends `${infer P}.one` ? (`${P}.other` extends Sleutel ? P : never) : never;
export type MeervoudSleutel = Meervoud<Sleutel>;
