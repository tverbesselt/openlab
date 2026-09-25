/*
 * Vergelijken wat de cursist typte met wat er stond, letter per letter.
 *
 * Alleen "fout" zeggen helpt niemand vooruit. Door te tonen wélke letter ontbrak of te
 * veel was, wordt de fout een leermoment in plaats van een oordeel (Hattie & Timperley).
 */

export type Soort = "gelijk" | "ontbrak" | "teveel";

export interface Stap {
  teken: string;
  soort: Soort;
}

function gelijkTeken(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/**
 * Zet het getypte woord naast het juiste woord. Het resultaat leest van links naar rechts
 * als het juiste woord, met daartussen de letters die de cursist te veel typte.
 *
 * Gebruikt de langste gemeenschappelijke deelreeks, zodat één vergeten letter niet de rest
 * van het woord fout kleurt.
 */
export function vergelijk(gegeven: string, juist: string): Stap[] {
  const a = [...gegeven];
  const b = [...juist];

  // tabel[i][j] = lengte van de langste gemeenschappelijke deelreeks van a[i:] en b[j:].
  const tabel: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      tabel[i][j] = gelijkTeken(a[i], b[j])
        ? tabel[i + 1][j + 1] + 1
        : Math.max(tabel[i + 1][j], tabel[i][j + 1]);
    }
  }

  const stappen: Stap[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (gelijkTeken(a[i], b[j])) {
      // De juiste schrijfwijze tonen, ook als de cursist een hoofdletter gebruikte.
      stappen.push({ teken: b[j], soort: "gelijk" });
      i++;
      j++;
    } else if (tabel[i + 1][j] >= tabel[i][j + 1]) {
      stappen.push({ teken: a[i], soort: "teveel" });
      i++;
    } else {
      stappen.push({ teken: b[j], soort: "ontbrak" });
      j++;
    }
  }
  while (i < a.length) stappen.push({ teken: a[i++], soort: "teveel" });
  while (j < b.length) stappen.push({ teken: b[j++], soort: "ontbrak" });

  return stappen;
}

/** Helemaal juist gespeld? Hoofdletters tellen niet mee. */
export function isJuist(gegeven: string, juist: string): boolean {
  return gegeven.trim().toLowerCase() === juist.trim().toLowerCase();
}

/** Hoeveel letters zaten er naast? Voor een korte samenvatting onder het antwoord. */
export function aantalAfwijkingen(stappen: Stap[]): number {
  return stappen.filter((s) => s.soort !== "gelijk").length;
}
