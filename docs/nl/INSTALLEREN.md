# Installeren

## 1. Demomodus

```bash
npm install
npm run dev
```

Zonder `.env.local` draait de app in demomodus. Alles blijft in de browser. Je kiest op
`/aanmelden` of je rondkijkt als leraar of als cursist. De demoleraar is ook beheerder, dus
je kan `/beheer` meteen uitproberen.

## 2. Firebase-project

1. Maak een project in de [Firebase-console](https://console.firebase.google.com).
2. **Authentication:** zet de aanmeldmethode *Google* aan. Voeg onder *Settings > Authorized
   domains* het domein toe waarop de app draait.
3. **Firestore:** maak de standaarddatabank aan (`(default)`).
4. **Storage** (optioneel, voor foto's en audio bij quizvragen): maak een bucket aan.
5. **Web-app:** registreer een web-app en neem de configuratie over in `.env.local`
   (zie `.env.example`) of in `apphosting.yaml`.
6. Zet de regels en indexen live:

   ```bash
   firebase use <project-id>
   firebase deploy --only firestore,storage
   ```

## 3. De eerste beheerder

Beheerders staan in Firestore, in de collectie `beheerders`. Maak daar in de console een
document met als id het e-mailadres van de beheerder, **in kleine letters**. De velden maken
niet uit; een leeg document volstaat.

Een beheerder is altijd leraar, ook zonder ingestelde domeinen. Meld je aan en ga naar
**Beheer** (het tandwiel bovenaan).

## 4. Toegang instellen

In **Beheer > Toegang**:

- **E-maildomeinen van leraren**, bijvoorbeeld `school.org`. Wie zich aanmeldt met een
  account op dat domein, kan oefeningen maken en delen.
- **E-maildomeinen van cursisten**, bijvoorbeeld `leerlingen.school.org`, of `*` voor elk
  Google-account. Cursisten hebben geen account nodig om te oefenen; met een account onthoudt
  de app welke kaarten ze al kennen.
- **Patroon voor cursistenaccounts** (optioneel): een reguliere expressie op het volledige
  adres. Nodig als leraren en cursisten op hetzelfde domein zitten, bijvoorbeeld
  `s[0-9]+@school[.]org` voor leerlingnummers.

De app en `firestore.rules` passen exact dezelfde regels toe. `storage.rules` leest ze uit de
standaarddatabank.

## 5. Huisstijl, talen, werkvormen en tips

Ook in **Beheer**: naam en logo, kleurschema, beschikbare talen en standaardtaal, welke
werkvormen en functies aan staan, en of de didactische tips verschijnen. Wijzigingen gelden
na **Bewaren** meteen voor iedereen.

## 6. Hosting

Elke host voor Next.js werkt. Met Firebase App Hosting:

```bash
firebase apphosting:backends:create
```

Vul de waarden in `apphosting.yaml` in. `next.config.js` stuurt `/__/auth/*` door naar
Firebase, zodat aanmelden via een redirect ook op mobiel werkt.

## 7. Spraak (optioneel)

Voor inlezen en audio naar tekst is een sleutel van OpenAI nodig. Die vul je in via
**Beheer > Spraak**; de server leest hem uit Firestore met `firebase-admin`.

- **Firebase App Hosting:** niets extra te doen, de server gebruikt de identiteit van de
  backend.
- **Andere host (Vercel, eigen server):** maak in de Google Cloud-console een serviceaccount
  met de rol *Cloud Datastore User*, download de sleutel als JSON en zet de volledige inhoud
  in `FIREBASE_SERVICE_ACCOUNT`.
- **Zonder serviceaccount:** zet de sleutel van OpenAI in `OPENAI_API_KEY`.

Vergeet niet de regels opnieuw te deployen (`firebase deploy --only firestore:rules`): ze
bevatten de regel voor `geheimen/openai`.
