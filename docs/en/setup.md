# Setup

OpenLab runs in two modes:

| Mode | When | Data | Sign-in |
| --- | --- | --- | --- |
| **Demo** | No Firebase variables set | In the visitor's browser (localStorage) | Pick *teacher* or *learner*, no account |
| **Production** | Firebase variables set | Firestore (shared across devices) | Google accounts, roles by email domain |

## 1. Run locally

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build, also type-checks every translation key
```

Node.js 20 or later.

## 2. Create a Firebase project

1. Create a project in the [Firebase console](https://console.firebase.google.com).
2. **Authentication** → Sign-in method → enable **Google**. Under *Settings → Authorized
   domains*, add every domain the app runs on.
3. **Firestore** → create the **(default)** database. A named database also works
   (`NEXT_PUBLIC_FIRESTORE_DATABASE`), but `storage.rules` reads access settings from the
   default database.
4. **Storage** (optional) → create a bucket. It holds photos and audio attached to quiz
   questions. Without it, uploading is disabled.
5. **Project settings → Your apps** → register a web app and copy the configuration.

## 3. Configure

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Meaning |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | yes | Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | yes | Usually `<project-id>.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | yes | Project id |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | yes | Web app id |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | no | Bucket name for quiz media |
| `NEXT_PUBLIC_FIRESTORE_DATABASE` | no | Named Firestore database; empty = default |
| `NEXT_PUBLIC_DEFAULT_LANGUAGE` | no | `nl`, `en`, `fr` or `es`: default language until an administrator saves settings (default `nl`) |
| `NEXT_PUBLIC_FIRESTORE_EMULATOR` | no | `host:port` of a local emulator, for testing only |

These values are public by design; security comes from the rules files.

## 4. Deploy the rules

```bash
npm install -g firebase-tools
firebase login
firebase use <project-id>          # or edit .firebaserc
firebase deploy --only firestore,storage
```

## 5. Add the first administrator

Administrators live in the Firestore collection **`beheerders`**. In the console, create a
document whose **id is the administrator's email address in lower case** (fields don't
matter; an empty document is fine). Nobody can make themselves administrator from the app.

An administrator is always a teacher, even before any domains are configured. Sign in and
open **Administration** (the gear icon in the header).

## 6. Configure access

In **Administration → Access**:

- **Teacher email domains**, e.g. `school.org`: these accounts can create and share material.
- **Learner email domains**, e.g. `students.school.org`, or `*` for any Google account.
- **Learner account pattern** (optional): a regular expression on the full address that
  always means *learner*, even on a teacher domain, e.g. `s[0-9]+@school[.]org`. Needed when
  everyone shares one domain.

The app (`src/lib/auth/account.ts`) and the rules (`firestore.rules`, `storage.rules`) apply
exactly the same logic.

## 7. Host it

The public demo, <https://openlab-ten.vercel.app>, is this repository on Vercel without any
Firebase variables, with `NEXT_PUBLIC_DEFAULT_LANGUAGE=en`.

Any Next.js host works.

- **Vercel:** import the repository, add the variables above, deploy. Without variables you
  get the demo.
- **Firebase App Hosting:** fill in `apphosting.yaml`, then
  `firebase apphosting:backends:create`.
- **Self-hosted:** `npm run build && npm start` behind a reverse proxy.

`next.config.js` proxies `/__/auth/*` to Firebase so that redirect sign-in (the fallback on
mobile) works on your own domain.

## Data model

| Collection | Contents | Who reads | Who writes |
| --- | --- | --- | --- |
| `instellingen/app` | Branding, languages, feature flags, tips, access | everyone | administrators |
| `beheerders/{email}` | Administrator list | the person themself | console only |
| `oefeningen/{id}` | Exercises (+ `inzendingen`, `resultaten`) | by id: anyone; lists: own or shared | teachers |
| `mappen/{id}` | Folders, personal or organisation | by id: anyone | owner / administrators |
| `codes/{code}` | Six-character share codes | anyone by code | teachers |
| `sessies/{pin}` | Live sessions (+ `antwoorden`, `spelers`, `quizantwoorden`, `bord`) | anyone by PIN | host teacher |
| `herhalingen/{uid}/items` | A learner's spaced-repetition schedule | only that learner | only that learner |

Learner submissions (votes, exit tickets, quiz results) are anonymous and size-limited.
