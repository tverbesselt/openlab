# Translating

All user-facing text lives in `src/i18n/`, one file per area of the app. Each file holds the
same tree in four languages:

```ts
import { definieer } from "./definieer";

export default definieer({
  nl: { titel: "Wat wil je maken?", aantal: { one: "{n} kaart", other: "{n} kaarten" } },
  en: { titel: "What do you want to create?", aantal: { one: "{n} card", other: "{n} cards" } },
  fr: { titel: "Que voulez-vous créer ?", aantal: { one: "{n} carte", other: "{n} cartes" } },
  es: { titel: "¿Qué quieres crear?", aantal: { one: "{n} tarjeta", other: "{n} tarjetas" } },
});
```

Dutch (`nl`) is the source. TypeScript checks that every language has exactly the same keys,
and that every key used in the code exists, so `npm run build` fails on a missing
translation or a typo.

## Using translations in code

```ts
import { t, tn, datum, vergelijk } from "@/lib/i18n";
import { tr } from "@/lib/i18n/rijk";

t("maken.kiezen.titel");                              // plain text
t("maken.bewaard", { titel: exercise.title });        // fills {titel}
tn("werkvormen.eenheid.kaart", 12);                   // plural via Intl.PluralRules, {n} = 12
tr("maken.uitleg", { b: (s) => <strong>{s}</strong> }); // "<b>bold</b>" inside the text
datum(isoDate);                                       // date in the current language
items.sort((a, b) => vergelijk(a.name, b.name));      // locale-aware sorting
```

`{app}` and `{organisatie}` fill themselves in with the names from Administration.

Rules:

- Never call `t()` at the top level of a module; the text would be frozen in the language that
  was active when the module loaded. Use a function or a getter
  (`get label() { return t("...") }`).
- Don't glue sentence fragments together; word order differs between languages. Use
  placeholders or `tr()`.
- Plurals always go through `tn()` with `one` and `other`.

## Terminology

| Dutch | English | French | Spanish |
| --- | --- | --- | --- |
| cursist | learner | apprenant | estudiante |
| leraar | teacher | enseignant | docente |
| werkvorm | activity | activité | actividad |
| oefening | exercise | exercice | ejercicio |
| map | folder | dossier | carpeta |
| digibord | interactive whiteboard | tableau interactif | pizarra digital |
| lesfase | lesson phase | phase de la leçon | fase de la clase |
| beheerder | administrator | administrateur | administrador |

Tone: short, plain sentences. Address the reader as *je* (nl), *you* (en), *vous* (fr),
*tú* (es).

## Adding a language

1. Add the code to `Taal` and `TALEN` in `src/lib/i18n/index.ts`.
2. Add the language to `Naamruimte` and `definieer()` in `src/i18n/definieer.ts`.
3. Fill in the new language in every file in `src/i18n/`; TypeScript points out what's missing.
4. Add the code to the `talen.hasOnly([...])` list in `firestore.rules`.
