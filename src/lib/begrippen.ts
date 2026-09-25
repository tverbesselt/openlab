/*
 * Een begrippenlijst inlezen zoals een leraar ze aanlevert.
 *
 * Wie uit Excel of Word plakt, krijgt tabs tussen de kolommen, niet de puntkomma die het
 * invulveld voorstelt. Dat is precies waar het vroeger misliep: de lijst leek leeg. Daarom
 * aanvaardt de app tab, puntkomma en komma, in die volgorde.
 */

export interface Begrip {
  word: string;
  translation: string;
}

/**
 * Splitst één regel in begrip en betekenis. Een tab wint van een puntkomma, en een komma
 * gebruiken we alleen als er niets anders staat: betekenissen bevatten vaak zelf een komma
 * ("pomme, la").
 */
function splitsRegel(regel: string): [string, string] | null {
  const scheiders = ["\t", ";"];
  for (const scheider of scheiders) {
    if (regel.includes(scheider)) {
      const [links, ...rest] = regel.split(scheider);
      return [links, rest.join(scheider)];
    }
  }
  // Eén komma: dan is dat duidelijk de scheiding. Meer komma's: te dubbelzinnig.
  const komma = regel.indexOf(",");
  if (komma !== -1 && regel.indexOf(",", komma + 1) === -1) {
    return [regel.slice(0, komma), regel.slice(komma + 1)];
  }
  return null;
}

export interface Inlezing {
  begrippen: Begrip[];
  /** Regels waarin geen scheiding te vinden was; die vallen weg. */
  overgeslagen: string[];
}

export function leesBegrippen(tekst: string): Inlezing {
  const begrippen: Begrip[] = [];
  const overgeslagen: string[] = [];

  for (const ruweRegel of tekst.split("\n")) {
    const regel = ruweRegel.trim();
    if (!regel) continue;

    const delen = splitsRegel(regel);
    const woord = delen?.[0].trim() ?? "";
    const betekenis = delen?.[1].trim() ?? "";

    if (woord && betekenis) begrippen.push({ word: woord, translation: betekenis });
    else overgeslagen.push(regel);
  }

  return { begrippen, overgeslagen };
}
