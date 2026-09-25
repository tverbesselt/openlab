"use client";

/*
 * Uitspraak nazeggen met de spraakherkenning van de browser.
 *
 * Werkt in Chrome en Edge, beperkt in Safari, niet in Firefox. Daarom is dit nooit de enige
 * weg: waar het niet kan, valt de woordtrainer terug op luisteren en vergelijken. De spraak
 * verlaat de pagina niet en wordt nergens bewaard.
 *
 * De Web Speech API zit niet in de standaardtypes van TypeScript; hieronder staat het
 * kleine stukje dat we echt gebruiken.
 */

interface HerkenningsResultaat {
  readonly transcript: string;
  readonly confidence: number;
}

interface HerkenningsAlternatieven {
  readonly length: number;
  item(index: number): HerkenningsResultaat;
  [index: number]: HerkenningsResultaat;
}

interface HerkenningsLijst {
  readonly length: number;
  item(index: number): HerkenningsAlternatieven;
  [index: number]: HerkenningsAlternatieven;
}

interface HerkenningsGebeurtenis extends Event {
  readonly results: HerkenningsLijst;
}

interface Spraakherkenner extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: HerkenningsGebeurtenis) => void) | null;
  onerror: ((e: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
}

type SpraakherkennerMaker = new () => Spraakherkenner;

function maker(): SpraakherkennerMaker | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpraakherkennerMaker;
    webkitSpeechRecognition?: SpraakherkennerMaker;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function herkenningBeschikbaar(): boolean {
  return maker() !== null;
}

export type Uitkomst =
  | { soort: "gehoord"; alternatieven: string[] }
  | { soort: "niets-gehoord" }
  | { soort: "geen-toegang" }
  | { soort: "fout" };

/**
 * Luistert één keer naar de microfoon en geeft terug wat de browser verstond. De
 * stopfunctie breekt het luisteren af, bijvoorbeeld wanneer de cursist verder klikt.
 */
export function luister(
  taal: string,
  klaar: (uitkomst: Uitkomst) => void
): { stop: () => void } | null {
  const Maker = maker();
  if (!Maker) return null;

  const herkenner = new Maker();
  herkenner.lang = taal;
  herkenner.interimResults = false;
  herkenner.continuous = false;
  // Meerdere gissingen: de browser hoort "la voiture" soms als "la voitures".
  herkenner.maxAlternatives = 5;

  let afgehandeld = false;
  const meldEenmalig = (uitkomst: Uitkomst) => {
    if (afgehandeld) return;
    afgehandeld = true;
    klaar(uitkomst);
  };

  herkenner.onresult = (e) => {
    const alternatieven: string[] = [];
    const eerste = e.results[0];
    for (let i = 0; i < eerste.length; i++) {
      const tekst = eerste[i]?.transcript?.trim();
      if (tekst) alternatieven.push(tekst);
    }
    meldEenmalig(
      alternatieven.length > 0 ? { soort: "gehoord", alternatieven } : { soort: "niets-gehoord" }
    );
  };

  herkenner.onerror = (e) => {
    const code = e.error ?? "";
    if (code === "not-allowed" || code === "service-not-allowed") {
      meldEenmalig({ soort: "geen-toegang" });
    } else if (code === "no-speech" || code === "aborted") {
      meldEenmalig({ soort: "niets-gehoord" });
    } else {
      meldEenmalig({ soort: "fout" });
    }
  };

  herkenner.onend = () => meldEenmalig({ soort: "niets-gehoord" });

  try {
    herkenner.start();
  } catch {
    meldEenmalig({ soort: "fout" });
    return null;
  }

  return {
    stop: () => {
      afgehandeld = true;
      try {
        herkenner.abort();
      } catch {
        // De herkenner was al gestopt.
      }
    },
  };
}

function normaliseer(tekst: string): string {
  return tekst
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Klonk het goed genoeg? Spraakherkenning is geen uitspraakcoach: ze zet klanken om in
 * woorden. Daarom vergelijken we soepel, zonder accenten en zonder leestekens, en
 * aanvaarden we het ook als het woord in een langere zin zit. Streng zijn zou vooral
 * de herkenning beoordelen, niet de cursist.
 */
export function klonkGoed(gehoord: string[], doel: string): boolean {
  const gezocht = normaliseer(doel);
  if (!gezocht) return false;

  // Zonder lidwoord ook goedkeuren: "de appel" tegenover "appel".
  const kern = gezocht.replace(/^(de|het|een|le|la|les|un|une|the|el|los|der|die|das)\s+/u, "");

  return gehoord.some((poging) => {
    const gezegd = normaliseer(poging);
    return (
      gezegd === gezocht ||
      gezegd === kern ||
      gezegd.includes(gezocht) ||
      (kern.length >= 4 && gezegd.includes(kern))
    );
  });
}
