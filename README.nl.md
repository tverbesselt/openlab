# OpenLab

**Digitale werkvormen, live klastools en oefenen voor leraren en cursisten, gebouwd op wat
onderzoek zegt over leren.** Beschikbaar in het Nederlands, Engels, Frans en Spaans. Gratis
en open source (MIT).

**▶ Probeer de demo: [openlab-ten.vercel.app](https://openlab-ten.vercel.app)**. Je hebt geen account nodig. Kies op de
aanmeldpagina *Bekijk als leraar* om oefeningen te maken en de beheerpagina te openen. De demo
start in het Engels: kies bovenaan *NL · Nederlands*.

[English](README.md) · [Installeren](docs/nl/INSTALLEREN.md) · [Beheer](docs/nl/BEHEER.md) ·
[Vertalen](docs/nl/VERTALEN.md) · [Wetenschappelijke basis](docs/nl/WETENSCHAPPELIJKE_BASIS.md)

## Wat zit erin

- **Inoefenen:** flashcards, woordtrainer met uitspraak, matching, invuloefening, zinnen
  bouwen, stappen op volgorde, sorteren, werkwoorden, rekenen.
- **Begrip controleren:** eenvoudige quiz met uitleg (eventueel met tweede poging en met foto,
  filmpje of audio), lezen met vragen, open vraag met modelantwoord, escaperoom, exit ticket.
- **Live in de klas:** poll, woordwolk, snelle vraag, begripsmeter, quizwedstrijd,
  whiteboard. Cursisten doen mee met een code of QR-code, zonder account.
- **Klastools:** klastimer, naamkiezer, groepenmaker, opfrissen, digibordscherm, audio naar
  tekst.
- **Inlezen:** leraren spreken teksten in bij lezen, invulzinnen en zinnen bouwen. Inlezen en
  audio naar tekst gebruiken Whisper van OpenAI, met een eigen sleutel die je in het beheer
  invult.
- **Voor cursisten:** gespreid herhalen, afdrukken, studeertips.

## Eigen maken

In **Beheer** stel je de naam, het logo en het kleurschema in, kies je welke talen
beschikbaar zijn, zet je werkvormen en functies aan of uit, en ook de didactische tips. Een
sleutel van OpenAI voor inlezen vul je er ook in. Zie
[docs/nl/BEHEER.md](docs/nl/BEHEER.md).

## Snel starten

```bash
git clone https://github.com/tverbesselt/openlab.git
cd openlab
npm install
npm run dev
```

Zonder Firebase draait de app in demomodus: alles blijft in de browser. Voor een echte
installatie met Google-login: [docs/nl/INSTALLEREN.md](docs/nl/INSTALLEREN.md).

## Licentie

Code: [MIT](LICENSE). De studeertips zijn in eigen woorden geschreven, naar *Studeren met
succes* (Hoof, Surma & Kirschner, Thomas More, 2023, CC BY-NC-SA 4.0), en kunnen uit in Beheer.
