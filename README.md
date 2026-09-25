# OpenLab

**Research-based digital learning activities, live classroom tools and practice, for teachers
and learners.** Available in English, Dutch, French and Spanish. Free and open source (MIT).

**▶ Try the demo: [openlab-ten.vercel.app](https://openlab-ten.vercel.app)**, no account needed. Choose *View as teacher* on the
sign-in page to create exercises and open the Administration page.

[Nederlands](README.nl.md) · [Setup](docs/en/setup.md) · [Administration](docs/en/administration.md) ·
[Architecture](docs/en/architecture.md) · [Translating](docs/en/translating.md) ·
[Contributing](CONTRIBUTING.md)

---

## Why OpenLab

Many classroom apps are built around points, leaderboards and speed. OpenLab starts from what
research says about learning that lasts:

- **Retrieval practice:** learners recall before they see the answer.
- **Spacing:** flashcards come back when they are about to be forgotten (Leitner boxes).
- **Formative feedback:** every wrong answer gets an explanation, without a grade.
- **Low cognitive load:** calm screens, one task at a time, large readable text.
- **No pressure by default:** the quiz competition exists, but calm mode (no speed bonus,
  explanation after every question) is the default.

The teacher thinks in **lesson phases** (activate prior knowledge, practise, check
understanding, wrap up), not in tools. Background (Dutch):
[docs/nl/WETENSCHAPPELIJKE_BASIS.md](docs/nl/WETENSCHAPPELIJKE_BASIS.md).

## Features

| Lesson phase | Activities |
| --- | --- |
| Activate prior knowledge | Live poll, word cloud |
| Practise | Flashcards, word trainer (with pronunciation), matching, fill in the blanks, sentence building, steps in order, sorting, verb conjugation, maths with endless new problems |
| Check understanding | Simple quiz (optional second attempt, photo/video/audio per question), reading with questions, open question with model answer, escape room |
| Wrap up | Exit ticket with standard questions |
| Live in class | Quick question (A–D), understanding meter, quiz competition (teams, podium), collaborative whiteboard |
| Class tools | Timer, name picker, group maker, refresh round, whiteboard screen with learning goals |
| For learners | Spaced repetition, printable worksheets and Cornell notes, study tips |

Learners join with a **six-character code or QR code**. They don't need an account to
practise; with an account the app remembers which cards they already know.

Teachers organise material in **folders**, share it with the whole organisation or keep it
private, and administrators curate **organisation folders**.

## Make it your own

Administrators get a settings page (`/beheer`):

- **Branding:** app name, organisation name, logo upload, colour scheme (presets or any
  brand colour; the palette is derived automatically and buttons keep WCAG AA contrast).
- **Languages:** switch English, Dutch, French and Spanish on or off and choose the default.
  Users pick their own language in the header.
- **Feature flags:** switch every activity type and feature on or off. Switched-off items
  disappear from menus; existing material is kept.
- **Teaching tips:** switch tips for teachers and study tips for learners on or off.
- **Access:** which email domains sign in as teacher or learner.

See [docs/en/administration.md](docs/en/administration.md).

## Quick start

Requirements: Node.js 20 or later.

```bash
git clone https://github.com/tverbesselt/openlab.git
cd openlab
npm install
npm run dev
```

Open <http://localhost:3000>. Without Firebase settings the app runs in **demo mode**: all
data stays in your browser, and you can explore as a teacher (who is also administrator) or
as a learner. That is exactly how the public demo runs.

For a real installation with Google sign-in and shared data, see
[docs/en/setup.md](docs/en/setup.md).

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Firebase Authentication,
Firestore and Storage · lucide-react icons. No server of its own: the browser talks to
Firestore, and `firestore.rules` does the access control.

## Contributing

Issues and pull requests are welcome, especially translations and new activity types. See
[CONTRIBUTING.md](CONTRIBUTING.md).

## Credits and license

Code: [MIT](LICENSE).

The study tips are written in our own words, based on *Studeren met succes* (Tine Hoof, Tim
Surma & Paul Kirschner, Thomas More, 2023, CC BY-NC-SA 4.0). They can be switched off under
Administration > Teaching tips.
