import { Exercise } from "./types";
import { ontleedInvulzin, volledigeZin } from "./invulzin";
import { t } from "./i18n";

/*
 * Dagelijkse herhaling: bij de start van de les een paar vragen uit vorige lessen op het
 * bord, eerst zonder antwoord.
 *
 * Rosenshine noemt dagelijkse herhaling als eerste van zijn tien principes, en het is
 * meteen de goedkoopste: vijf minuten, geen voorbereiding, en het haalt de stof terug
 * boven vóór er nieuwe leerstof bijkomt.
 */

export interface OpfrisItem {
  id: string;
  vraag: string;
  antwoord: string;
  /** Uit welke oefening dit komt; klein onderaan het bord. */
  bron: string;
  /** Extra uitleg bij een quizvraag, als de leraar die meegaf. */
  toelichting?: string;
}

/** Alles uit één oefening waar een vraag en een antwoord in zit. */
export function opfrisItemsVan(ex: Exercise): OpfrisItem[] {
  const bron = ex.title;
  const c = ex.content;

  switch (ex.type) {
    case "flashcard":
      return (c.flashcards ?? []).map((kaart) => ({
        id: `${ex.id}-${kaart.id}`,
        vraag: kaart.front,
        antwoord: kaart.back,
        bron,
        toelichting: kaart.exampleSentence,
      }));

    case "wordtrainer":
      return (c.wordTrainerItems ?? []).map((woord) => ({
        id: `${ex.id}-${woord.id}`,
        vraag: woord.word,
        antwoord: woord.translation,
        bron,
        toelichting: woord.exampleSentence,
      }));

    case "matching":
      return (c.matchingPairs ?? []).map((paar) => ({
        id: `${ex.id}-${paar.id}`,
        vraag: paar.left,
        antwoord: paar.right,
        bron,
      }));

    case "quiz":
    case "lezen":
      return (c.questions ?? []).map((vraag) => ({
        id: `${ex.id}-${vraag.id}`,
        vraag: vraag.question,
        antwoord: vraag.correctAnswers
          .map((i) => vraag.options[i])
          .filter(Boolean)
          .join(" · "),
        bron,
        toelichting: vraag.explanation,
      }));

    case "fillblank":
      return (c.fillBlanks ?? []).map((zin) => ({
        id: `${ex.id}-${zin.id}`,
        // De zin met een streep waar het gat zit; het antwoord is de volledige zin.
        vraag: ontleedInvulzin(zin.textWithBlanks)
          .map((stuk) => (stuk.soort === "tekst" ? stuk.waarde : " ______ "))
          .join("")
          .replace(/\s+/g, " ")
          .trim(),
        antwoord: volledigeZin(zin.textWithBlanks),
        bron,
      }));

    case "zinbouwen":
      return (c.ordenItems ?? []).map((item) => ({
        id: `${ex.id}-${item.id}`,
        vraag: t("klas.opfrissen.zinbouwen", {
          woorden: [...item.delen].sort(() => 0.5 - Math.random()).join(" · "),
        }),
        antwoord: item.delen.join(" "),
        bron,
      }));

    case "volgorde":
      return (c.ordenItems ?? []).map((item) => ({
        id: `${ex.id}-${item.id}`,
        vraag: item.opdracht ?? t("klas.opfrissen.volgorde"),
        antwoord: item.delen.map((stap, i) => `${i + 1}. ${stap}`).join("  "),
        bron,
      }));

    case "sorteren":
      return (c.sorteerItems ?? []).map((item) => ({
        id: `${ex.id}-${item.id}`,
        vraag: t("klas.opfrissen.sorteren", { tekst: item.tekst }),
        antwoord: (c.categorieen ?? [])[item.categorie] ?? "",
        bron,
      }));

    case "openvraag":
      return (c.openVragen ?? []).map((vraag) => ({
        id: `${ex.id}-${vraag.id}`,
        vraag: vraag.vraag,
        antwoord: vraag.modelantwoord,
        bron,
      }));

    case "werkwoorden":
      return (c.werkwoorden ?? []).flatMap((werkwoord) =>
        werkwoord.vormen.map((vorm, i) => ({
          id: `${ex.id}-${werkwoord.id}-${i}`,
          vraag: `${werkwoord.infinitief}: ${vorm.persoon} ...`,
          antwoord: vorm.vorm,
          bron,
        }))
      );

    case "escaperoom":
      return (c.escaperoom?.sloten ?? []).map((slot) => ({
        id: `${ex.id}-${slot.id}`,
        vraag: slot.opdracht,
        antwoord: slot.antwoorden[0] ?? "",
        bron,
      }));

    // Polls, woordwolken, exit tickets en rekenen hebben geen vaste vraag met antwoord
    // om uit een vorige les op te frissen.
    default:
      return [];
  }
}

export function opfrisItems(oefeningen: Exercise[]): OpfrisItem[] {
  return oefeningen.flatMap(opfrisItemsVan);
}

/** Een willekeurige greep, zonder herhaling. */
export function kiesWillekeurig<T>(lijst: T[], aantal: number): T[] {
  const kopie = [...lijst];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie.slice(0, aantal);
}
