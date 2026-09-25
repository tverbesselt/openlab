# Contributing

Thanks for helping! Issues and pull requests are welcome, in English or Dutch.

## Good first contributions

- **Translations:** improve wording in `src/i18n/`, or add a language
  ([docs/en/translating.md](docs/en/translating.md)).
- **Bugs:** open an issue with the steps to reproduce, the browser, and whether it happens in
  demo mode.
- **Activity types:** open an issue first to discuss the didactic idea; see
  [docs/en/architecture.md](docs/en/architecture.md#feature-flags) for the technical steps.

## Principles

OpenLab is built on research on learning. Please keep these in mind:

- Retrieval before feedback; feedback explains *why*.
- No time pressure, streaks or leaderboards by default. Competitive modes are an explicit
  choice of the teacher.
- Calm, accessible screens: WCAG AA contrast, keyboard use, readable text, respect for
  `prefers-reduced-motion`.
- Learners can practise without an account; nothing personal is stored about them beyond
  what they choose.

## Development

```bash
npm install
npm run dev
npm run build   # must pass: it type-checks every translation key
```

- Test your change in demo mode (no `.env.local`) and, if it touches data, against Firestore
  or the emulator.
- New or changed text needs all four languages.
- If you change data shapes or roles, update `firestore.rules` and `storage.rules`.
- Match the surrounding code style. Identifiers and comments are in Dutch; English comments
  in new code are fine.

By contributing you agree that your contribution is licensed under the MIT License.
