/*
 * Inlezen: een leraar spreekt een tekst in, Whisper (OpenAI) schrijft hem uit.
 *
 * Waarom via de server: de sleutel van OpenAI mag niet in de browser van elke leraar staan.
 * Deze route controleert eerst of er een leraar aangemeld is, anders kan iedereen op kosten
 * van de organisatie laten uitschrijven. Waar de sleutel staat: zie src/lib/server/openai.ts.
 *
 * De opname wordt nergens bewaard: ze gaat alleen door naar OpenAI en het antwoord komt
 * als tekst terug.
 *
 * Fouten komen terug als een code ({ fout: "teLang" }); de browser zet die om naar een
 * melding in de taal van de gebruiker (spraak.fouten in src/i18n/spraak.ts).
 */

import {
  aanvragerVan,
  firebaseOpServer,
  lijktOpSleutel,
  sleutelStand,
} from "@/lib/server/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** OpenAI aanvaardt tot 25 MB; tien minuten spraak in webm/opus is een paar MB. */
const MAX_BYTES = 20 * 1024 * 1024;

const MODEL = "whisper-1";

/*
 * Whisper neemt de schrijfwijze over van een korte voorbeeldtekst. Zonder zo'n voorbeeld
 * komt er soms een lange reeks woorden terug zonder hoofdletters of leestekens, en daar
 * kan je geen oefening mee maken.
 */
const STIJLVOORBEELD: Record<string, string> = {
  nl: "Goedemorgen, welkom in de les. Vandaag lezen we samen een korte tekst.",
  fr: "Bonjour, bienvenue au cours. Aujourd'hui, nous lisons ensemble un texte court.",
  en: "Hello, welcome to the lesson. Today, we will read a short text together.",
  es: "Hola, bienvenidos a la clase. Hoy leemos juntos un texto corto.",
  de: "Guten Morgen, willkommen im Unterricht. Heute lesen wir zusammen einen kurzen Text.",
  it: "Buongiorno, benvenuti alla lezione. Oggi leggiamo insieme un breve testo.",
};

/*
 * Eenvoudige rem per gebruiker, per serverinstantie. Geen echte beveiliging, maar het vangt
 * een knop die per ongeluk in een lus blijft hangen. Live uitschrijven stuurt een stukje
 * per pauze, ongeveer zes per minuut: een uur doorpraten blijft hier onder.
 */
const PER_UUR = 500;
const gebruik = new Map<string, number[]>();

function teVaak(wie: string): boolean {
  const nu = Date.now();
  const recent = (gebruik.get(wie) ?? []).filter((t) => nu - t < 60 * 60 * 1000);
  if (recent.length >= PER_UUR) {
    gebruik.set(wie, recent);
    return true;
  }
  recent.push(nu);
  gebruik.set(wie, recent);
  return false;
}

function fout(status: number, code: string) {
  return Response.json({ fout: code }, { status });
}

function tokenUit(request: Request): string | null {
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || null;
}

/**
 * Welke sleutel deze aanvraag gebruikt, of een foutantwoord. In demomodus mag de browser
 * zijn eigen sleutel meegeven; met Firebase nooit, daar beslist de server.
 */
async function sleutelVoor(request: Request): Promise<{ sleutel: string; wie: string } | Response> {
  if (!firebaseOpServer) {
    const eigen = request.headers.get("x-openai-key");
    const wie = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "demo";
    if (lijktOpSleutel(eigen)) return { sleutel: eigen.trim(), wie };
    const { sleutel } = await sleutelStand();
    return sleutel ? { sleutel, wie } : fout(503, "geenSleutel");
  }

  const idToken = tokenUit(request);
  if (!idToken) return fout(401, "aanmelden");
  const aanvrager = await aanvragerVan(idToken).catch(() => null);
  if (!aanvrager) return fout(401, "verlopen");
  if (aanvrager.rol !== "leraar") return fout(403, "geenLeraar");

  const { sleutel } = await sleutelStand();
  if (!sleutel) return fout(503, "geenSleutel");
  return { sleutel, wie: aanvrager.email };
}

/**
 * Staat inlezen klaar? De app vraagt dit één keer per pagina, zodat de knoppen alleen
 * verschijnen als er een sleutel is. Het beheer vraagt het vers op, na een wijziging.
 */
export async function GET(request: Request) {
  const vers = new URL(request.url).searchParams.has("vers");

  if (!firebaseOpServer) {
    const { bron } = await sleutelStand(vers);
    return Response.json({ firebase: false, bron, serverToegang: false });
  }

  const idToken = tokenUit(request);
  if (!idToken) return fout(401, "aanmelden");
  const aanvrager = await aanvragerVan(idToken).catch(() => null);
  if (!aanvrager) return fout(401, "verlopen");
  if (aanvrager.rol !== "leraar") return fout(403, "geenLeraar");

  const { bron, serverToegang } = await sleutelStand(vers);
  return Response.json({ firebase: true, bron, serverToegang });
}

export async function POST(request: Request) {
  const gevonden = await sleutelVoor(request);
  if (gevonden instanceof Response) return gevonden;
  const { sleutel, wie } = gevonden;
  if (teVaak(wie)) return fout(429, "teVaak");

  let formulier: FormData;
  try {
    formulier = await request.formData();
  } catch {
    return fout(400, "geenOpname");
  }

  const audio = formulier.get("audio");
  if (!(audio instanceof File) || audio.size === 0) return fout(400, "geenOpname");
  if (audio.size > MAX_BYTES) return fout(413, "teLang");

  // nl-BE → nl. Whisper raadt de taal ook zelf, maar met een hint gaat het beter.
  const taal = String(formulier.get("taal") ?? "").split("-")[0].toLowerCase();

  const naarOpenai = new FormData();
  naarOpenai.append("file", audio, audio.name || "opname.webm");
  naarOpenai.append("model", MODEL);
  naarOpenai.append("response_format", "json");
  if (/^[a-z]{2}$/.test(taal)) naarOpenai.append("language", taal);
  // Bij live uitschrijven komt het vorige stuk mee: zo sluit een zin over twee stukken aan.
  const vorige = String(formulier.get("vorige") ?? "").slice(-400);
  const voorbeeld = [STIJLVOORBEELD[taal], vorige].filter(Boolean).join(" ");
  if (voorbeeld) naarOpenai.append("prompt", voorbeeld);

  let antwoord: Response;
  try {
    antwoord = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${sleutel}` },
      body: naarOpenai,
    });
  } catch {
    return fout(502, "onbereikbaar");
  }

  if (!antwoord.ok) {
    // De details horen in de serverlogs, niet bij de leraar.
    const details = await antwoord.text().catch(() => "");
    console.error("inlezen: OpenAI gaf", antwoord.status, details);
    // Opnieuw proberen helpt hier niet: zeg dan wie er iets aan kan doen.
    if (details.includes("insufficient_quota")) return fout(503, "tegoedOp");
    if (antwoord.status === 401) return fout(503, "sleutelOngeldig");
    return fout(502, "mislukt");
  }

  const data = (await antwoord.json()) as { text?: string };
  return Response.json({ tekst: (data.text ?? "").trim() });
}
