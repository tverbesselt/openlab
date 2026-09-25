# Architecture

Identifiers and code comments are in Dutch (the project started at a Flemish adult-education
centre). This page maps the main Dutch terms and explains how the pieces fit.

## Folder structure

```
src/
  app/                 Next.js routes (App Router), all client-rendered
    beheer/            Administration
    maken/             Create material
    bibliotheek/       Library        mappen/  Folders
    oefen/[id]/        Practise one exercise
    live/, live/join/  Live sessions (teacher / learner)
    klastools/, digibord/, opfrissen/, herhalen/, afdrukken/, slim-oefenen/
  components/          UI; players/ (one per activity), maken/ (forms), wedstrijd/ (quiz
                       competition), bord/ (whiteboard), tools/ (class tools)
  i18n/                Translations: one file per area, four languages side by side
  lib/
    i18n/              t(), tn(), tr(), locale(), datum(), vergelijk()
    instellingen/      Settings: types, feature list, colour palette, AppProvider
    auth/              Google sign-in, roles, administrators
    opslag/            Storage interface with two implementations: firestore.ts, lokaal.ts
    labels.ts          Lesson phases and activity types (labels, icons, units)
    types.ts           Data model
```

## Glossary

| Dutch | English |
| --- | --- |
| oefening | exercise |
| werkvorm | activity type |
| lesfase | lesson phase |
| map / organisatiemap | folder / organisation folder |
| leraar / cursist | teacher / learner |
| beheer / beheerder | administration / administrator |
| instellingen | settings |
| opslag | storage |
| sessie | live session |
| wedstrijd | quiz competition |
| bord | whiteboard |
| herhalen | spaced repetition |
| vertalen / taal | translate / language |

## Startup

`src/app/layout.tsx` renders two inline scripts in `<head>` that apply the stored display
preferences and colour palette before first paint. Then:

1. **`AppProvider`** (`lib/instellingen/AppProvider.tsx`) loads the settings (cached copy
   first, then Firestore or localStorage), sets the language and palette, and only then
   renders the app. Changing language re-mounts the tree (`key={taal}`), which is why `t()`
   can be a plain function usable outside React.
2. **`AuthProvider`** resolves the Google user, checks `beheerders/{email}`, and derives the
   role from the access settings.
3. Pages use `useInstellingen().isAan(feature)` for feature flags and `useMateriaal()` for
   data. `useMateriaal()` already filters out exercises whose type is switched off.

## Storage

`lib/opslag/index.ts` exports `opslag`: Firestore when Firebase is configured, otherwise the
localStorage implementation (demo). Both implement the same `Opslag` interface
(`lib/opslag/types.ts`), so pages never know which one they talk to. Live sessions in demo
mode work between tabs of one browser.

## Feature flags

`lib/instellingen/functies.ts` lists every feature: all `ExerciseType`s plus extra features
(quiz competition, whiteboard, spaced repetition, ...). To add an activity type:

1. Add it to `ExerciseType` in `types.ts` and to `WERKVORMEN` in `labels.ts`.
2. Add its texts to `src/i18n/werkvormen.ts` (four languages).
3. Add it to a group in `FUNCTIEGROEPEN` so it gets a switch in Administration.
4. Add a player in `components/players/`, a form in `app/maken/`, and a case in
   `app/oefen/[id]/page.tsx`.

## Security

There is no application server. The browser talks to Firestore directly and
`firestore.rules` enforces who may read and write what, including the role check (the same
logic as `lib/auth/account.ts`). If you change roles or data shapes, change the rules too,
and test them with the emulator (`firebase emulators:start`, then set
`NEXT_PUBLIC_FIRESTORE_EMULATOR`).
