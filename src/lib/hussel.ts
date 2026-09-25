/** Willekeurige volgorde (Fisher-Yates), zonder de oorspronkelijke lijst te wijzigen. */
export function hussel<T>(lijst: T[]): T[] {
  const kopie = [...lijst];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}

/**
 * Husselen met de garantie dat het resultaat verschilt van het origineel. Anders staat een
 * zin van drie woorden geregeld meteen goed, en dan valt er niets te oefenen.
 */
export function husselAnders<T>(lijst: T[], gelijk: (a: T, b: T) => boolean = Object.is): T[] {
  if (lijst.length < 2) return [...lijst];

  for (let poging = 0; poging < 12; poging++) {
    const geschud = hussel(lijst);
    if (geschud.some((waarde, i) => !gelijk(waarde, lijst[i]))) return geschud;
  }
  // Alle items zijn blijkbaar gelijk; dan maakt de volgorde toch niets uit.
  return hussel(lijst);
}
