# Administration

The Administration page (`/beheer`, gear icon in the header) is only visible to
administrators. In demo mode the demo teacher is administrator, and settings are stored in
that browser only.

Changes are a draft until you press **Save**; then they apply to everyone immediately. The
colour preview updates while you choose.

## Branding

- **App name**: shown in the header, the browser tab and on printouts.
- **Organisation name** (optional): used in texts such as "shared with {organisation}" and
  in the footer. Empty = texts say "your organisation".
- **Logo**: PNG, JPG, WebP or SVG. It is scaled down to 256 px in the browser and stored as
  an image inside the settings document (no Storage bucket needed). It also becomes the
  favicon. A square logo works best.
- **Colour scheme**: eight presets or any colour. OpenLab derives a full palette (tints
  50–900). Buttons use tint 800 with white text; if your colour is light, the darker tints
  are shifted until white text reaches a 4.5:1 contrast ratio (WCAG AA). The chosen colour
  itself stays as it is for lines and accents.

## Languages

Switch English, Dutch, French and Spanish on or off (at least one stays on) and pick the
default language. With more than one language on, users choose theirs in the header; the
choice is remembered per device.

Exercise content is not translated: a teacher writes it in the language they teach.

## Activity types and features

Every activity type and feature has its own switch, grouped by lesson phase:

- Practise: flashcards, word trainer, matching, fill in the blanks, sentence building, steps
  in order, sorting, verbs, maths
- Check understanding and wrap up: simple quiz, reading, open question, escape room, exit ticket
- Activate prior knowledge: live poll, word cloud
- Live in class: quick question, understanding meter, quiz competition, whiteboard
- Class tools: timer, name picker, group maker, refresh round, whiteboard screen
- For learners: spaced repetition, printing
- Speech (OpenAI): dictation in the editors, speech to text (class tool). These only appear
  once there is an OpenAI key, see below.

What is switched off disappears from menus, the creation screen, the library and the lists
of live activities. Existing material is kept; opening it shows "not available". Switch it on
again and everything is back. The quiz competition needs the simple quiz.

The list is stored as what is **off**, so activity types added in a future version are on by
default.

## Teaching tips

- **Tips for teachers**: rotating tips while creating material and in class, and the
  explanation for each lesson phase (why it works, what to tell learners).
- **Study tips for learners**: on the home page, while practising, and the *Smart practice*
  page.

## Speech

Dictation and Speech to text use OpenAI's Whisper. Create a key at
<https://platform.openai.com/api-keys> and enter it. Costs go to that account, about
0.006 dollars per minute of recording.

- **With Firebase** the key is stored in `geheimen/openai`. Administrators can set and remove
  it, but nobody can read it back through the app: only the server reads it, using
  `firebase-admin`. On Firebase App Hosting this works without extra setup; on other hosts,
  put a service account in `FIREBASE_SERVICE_ACCOUNT` (see
  [setup.md](setup.md#8-speech-optional)).
- **Rather not store the key in Firestore?** Set the `OPENAI_API_KEY` environment variable. A
  key set in Administration takes priority.
- **In demo mode** the key stays in the browser of whoever enters it. It is sent with each
  recording to the server, which passes it on to OpenAI and does not store it.

Only teachers can dictate. Recordings are not stored.

## Access (production only)

See [setup.md, step 6](setup.md#6-configure-access).
