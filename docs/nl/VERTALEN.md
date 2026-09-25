# Vertalen

De app spreekt Nederlands, Engels, Frans en Spaans. De beheerder kiest in **Beheer > Talen**
welke talen beschikbaar zijn en welke de standaard is; elke gebruiker kiest daarna zelf bovenaan
de pagina.

## Hoe het werkt

- Alle teksten staan in `src/i18n/<naamruimte>.ts`, per deel van de app, in vier talen:

  ```ts
  import { definieer } from "./definieer";

  export default definieer({
    nl: { titel: "Wat wil je maken?", aantal: { one: "{n} kaart", other: "{n} kaarten" } },
    en: { titel: "What do you want to create?", aantal: { one: "{n} card", other: "{n} cards" } },
    fr: { ... },
    es: { ... },
  });
  ```

  Nederlands is de bron. TypeScript controleert dat de andere talen precies dezelfde sleutels
  hebben: een ontbrekende of overbodige sleutel breekt de build.

- In de code:

  ```ts
  import { t, tn, datum, vergelijk, locale } from "@/lib/i18n";
  import { tr } from "@/lib/i18n/rijk";

  t("maken.titel");                                  // gewone tekst
  t("maken.bewaard", { titel: oefening.title });     // {titel} invullen
  tn("maken.aantal", 12);                            // enkelvoud of meervoud, {n} = 12
  tr("maken.uitleg", { b: (s) => <strong>{s}</strong> });  // "<b>vet</b>" in de tekst
  datum(iso);                                        // datum in de huidige taal
  lijst.sort((a, b) => vergelijk(a.naam, b.naam));   // sorteren volgens de taal
  ```

  Sleutels zijn getypeerd: een tikfout in `t("...")` breekt de build.

- `{app}` en `{organisatie}` vullen zichzelf in met de naam uit het beheer.

- Roep `t()` nooit aan op het hoogste niveau van een module. Een constante lijst met teksten
  wordt een functie, of krijgt getters (`get label() { return t("...") }`). Anders staat de
  tekst vast in de taal van het moment waarop de module laadde.

- De app rendert pas in de browser, zodra de instellingen geladen zijn, en tekent alles opnieuw
  als de taal wisselt (zie `src/lib/instellingen/AppProvider.tsx`).

## Afspraken over woorden

| Nederlands | English | Français | Español |
| --- | --- | --- | --- |
| cursist | learner | apprenant(e) | estudiante |
| leraar | teacher | enseignant(e) | docente |
| werkvorm | activity | activité | actividad |
| oefening | exercise | exercice | ejercicio |
| map | folder | dossier | carpeta |
| digibord | interactive whiteboard | tableau interactif | pizarra digital |
| lesfase | lesson phase | phase de la leçon | fase de la clase |
| beheerder | administrator | administrateur | administrador |

Aanspreekvorm: *je* (nl), *you* (en), *vous* (fr), *tú* (es). Korte, gewone zinnen.

## Een taal toevoegen

1. Voeg de code toe aan `Taal` en `TALEN` in `src/lib/i18n/index.ts`.
2. Voeg de taal toe aan `Naamruimte` en `definieer()` in `src/i18n/definieer.ts`.
3. Vul in elk bestand in `src/i18n/` de nieuwe taal in; TypeScript wijst aan waar ze ontbreekt.
4. Voeg de code toe aan de lijst in de regel voor `instellingen` in `firestore.rules`.
