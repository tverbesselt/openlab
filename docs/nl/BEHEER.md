# Beheer

De beheerpagina (`/beheer`, het tandwiel bovenaan) is er alleen voor beheerders. In
demomodus is de demoleraar beheerder, en blijven de instellingen in die browser.

Wat je wijzigt, is een concept tot je op **Bewaren** klikt. Daarna geldt het meteen voor
iedereen. Het kleurvoorbeeld verandert terwijl je kiest.

## Huisstijl

- **Naam van de app:** in de kop, het tabblad en op afdrukken.
- **Naam van je organisatie** (optioneel): in teksten zoals "gedeeld met {organisatie}" en
  onderaan de pagina. Leeg = de teksten zeggen "je organisatie".
- **Logo:** PNG, JPG, WebP of SVG. De browser verkleint het tot 256 pixels en het wordt in
  de instellingen bewaard; Storage is niet nodig. Het is ook het icoon van het tabblad.
- **Kleurschema:** acht voorkeuzes of een eigen kleur. De app rekent de lichtere en
  donkerdere tinten zelf uit. Is de kleur licht, dan worden knoppen donkerder, zodat witte
  tekst minstens 4,5:1 contrast haalt (WCAG AA).

## Talen

Zet Nederlands, Engels, Frans en Spaans aan of uit (minstens één blijft aan) en kies de
standaardtaal. Staan er meerdere aan, dan kiest elke gebruiker bovenaan zijn eigen taal;
die keuze blijft per toestel bewaard. De inhoud van oefeningen wordt niet vertaald.

## Werkvormen en functies

Elke werkvorm en functie heeft een eigen schakelaar, per lesfase gegroepeerd. Wat uit staat,
verdwijnt uit de menu's, het maakscherm, de bibliotheek en de live-activiteiten. Bestaand
materiaal blijft bewaard; wie het opent, ziet dat het niet beschikbaar is. Zet je het weer
aan, dan is alles terug. De quizwedstrijd werkt alleen als de eenvoudige quiz aan staat.

De groep **Spraak (OpenAI)** bevat *Inlezen* (een knop bij lezen, invulzinnen en zinnen
bouwen) en de klastool *Audio naar tekst*. Ze verschijnen pas als er ook een sleutel is, zie
hieronder.

## Didactische tips

- **Tips voor leraren:** bij het maken van materiaal, in de klas, en de uitleg bij elke
  lesfase.
- **Studeertips voor cursisten:** op de startpagina, bij het oefenen en de pagina *Slim
  oefenen*.

## Spraak

Inlezen en Audio naar tekst gebruiken Whisper van OpenAI. Maak op
<https://platform.openai.com/api-keys> een sleutel aan en vul hem in. De kosten gaan naar die
rekening, ongeveer 0,006 dollar per minuut opname.

- **Met Firebase** gaat de sleutel naar `geheimen/openai` in Firestore. Een beheerder kan hem
  zetten en wissen, maar niemand kan hem via de app teruglezen: alleen de server leest hem,
  met `firebase-admin`. Op Firebase App Hosting werkt dat zonder extra instellingen; op een
  andere host zet je een serviceaccount in `FIREBASE_SERVICE_ACCOUNT` (zie
  [INSTALLEREN.md](INSTALLEREN.md#7-spraak-optioneel)).
- **Liever geen sleutel in Firestore?** Zet hem in de omgevingsvariabele `OPENAI_API_KEY`. Een
  sleutel in het beheer gaat daar boven.
- **In demomodus** blijft de sleutel in de browser van wie hem invult. Hij gaat bij elke
  opname mee naar de server, die hem doorgeeft aan OpenAI en niet bewaart.

Alleen leraren kunnen inlezen. De opname wordt nergens bewaard.

## Toegang

Alleen met Firebase. Zie [INSTALLEREN.md, stap 4](INSTALLEREN.md#4-toegang-instellen).
