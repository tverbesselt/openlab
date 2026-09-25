"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, Dices, Clock, Trophy } from "lucide-react";
import { opslag, apparaatId } from "@/lib/opslag";
import { LiveSessie, WedstrijdSpeler, WedstrijdToestand } from "@/lib/types";
import {
  MAX_BIJNAAM,
  TOP,
  schoneBijnaam,
  stijlVoor,
  teamNaam,
  willekeurigeBijnaam,
} from "@/lib/wedstrijd";
import { MAX_TYPANTWOORD } from "@/lib/typantwoord";
import { VraagMedia } from "@/components/players/VraagMedia";
import { Vorm } from "./Vorm";
import { t, tn, locale, type MeervoudSleutel } from "@/lib/i18n";
import { tr } from "@/lib/i18n/rijk";

/** Enkelvoud of meervoud kiezen voor een tekst met opmaak (tr kent geen tn). */
function trn(
  sleutel: MeervoudSleutel,
  n: number,
  tags: Parameters<typeof tr>[1],
  vars: Parameters<typeof tr>[2] = {}
): React.ReactNode {
  const vorm = new Intl.PluralRules(locale()).select(n) === "one" ? "one" : "other";
  return tr(`${sleutel}.${vorm}` as Parameters<typeof tr>[0], tags, { n, ...vars });
}

/**
 * De cursist tijdens een quizwedstrijd: een bijnaam kiezen, antwoorden en daarna zien hoe
 * het afliep. Alles wat telt, rekent het bord uit; dit scherm toont alleen de eigen stand.
 */
export function WedstrijdToestel({ code, sessie }: { code: string; sessie: LiveSessie }) {
  const apparaat = useRef(apparaatId()).current;
  const [speler, setSpeler] = useState<WedstrijdSpeler | null | undefined>(undefined);
  // Was dit toestel al binnen? Dan betekent "geen speler" dat de leraar de bijnaam weghaalde.
  const wasBinnen = useRef(false);

  useEffect(() => opslag.volgSpeler(code, apparaat, setSpeler), [code, apparaat]);
  useEffect(() => {
    if (speler) wasBinnen.current = true;
  }, [speler]);

  const quiz = sessie.quiz as WedstrijdToestand;

  if (sessie.status === "afgesloten") {
    return (
      <Kader>
        <Trophy className="w-10 h-10 text-merk mx-auto mb-3" />
        <h1 className="text-xl font-extrabold text-merk-900 mb-1">{t("wedstrijd.toestel.afgelopen.titel")}</h1>
        {speler?.plaats && (
          <p className="text-sm text-slate-700 mb-1">
            {trn(
              "wedstrijd.toestel.afgelopen.plaats",
              speler.punten ?? 0,
              { b: (s) => <strong>{s}</strong> },
              { plaats: speler.plaats }
            )}
          </p>
        )}
        <p className="text-sm text-slate-600">{t("wedstrijd.toestel.afgelopen.bedankt")}</p>
      </Kader>
    );
  }

  if (speler === undefined) {
    return <p className="text-center py-20 text-sm text-slate-500">{t("wedstrijd.toestel.verbinden")}</p>;
  }

  if (speler === null) {
    return (
      <BijnaamKiezen
        code={code}
        apparaat={apparaat}
        weggehaald={wasBinnen.current}
        teams={quiz.instellingen.teams}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto py-4 u-fade">
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-3 px-1">
        <span className="truncate">
          {speler.bijnaam}
          {speler.team !== undefined && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {teamNaam(speler.team)}
            </span>
          )}
        </span>
        <span className="tabular-nums">{tn("wedstrijd.toestel.punten", speler.punten ?? 0)}</span>
      </div>

      {quiz.fase === "wachtruimte" && (
        <Kader>
          <CheckCircle2 className="w-10 h-10 text-merk mx-auto mb-3" />
          <h1 className="text-xl font-extrabold text-merk-900 mb-1">{t("wedstrijd.toestel.wachtruimte.titel")}</h1>
          <p className="text-sm text-slate-600">
            {t("wedstrijd.toestel.wachtruimte.uitleg")}
          </p>
        </Kader>
      )}

      {quiz.fase === "vraag" && <Antwoorden key={quiz.vraagNr} code={code} apparaat={apparaat} quiz={quiz} />}

      {quiz.fase === "uitleg" && <Resultaat speler={speler} quiz={quiz} />}

      {quiz.fase === "tussenstand" && (
        <Kader>
          <p className="text-xs font-bold text-slate-500 mb-2">
            {t("wedstrijd.naVraag", { nr: quiz.vraagNr + 1, totaal: quiz.aantalVragen })}
          </p>
          {speler.team !== undefined ? (
            <>
              <p className="text-5xl font-black text-merk-900 mb-1 tabular-nums">
                {speler.teamPlaats ?? "–"}
              </p>
              <p className="text-sm text-slate-700 mb-3">
                {tn("wedstrijd.toestel.tussenstand.team", speler.teamPunten ?? 0, {
                  team: teamNaam(speler.team),
                  eigen: speler.punten ?? 0,
                })}
              </p>
            </>
          ) : (
            <>
              <p className="text-5xl font-black text-merk-900 mb-1 tabular-nums">
                {speler.plaats ?? "–"}
              </p>
              <p className="text-sm text-slate-700 mb-3">
                {tn(
                  speler.plaats === 1 ? "wedstrijd.toestel.tussenstand.opKop" : "wedstrijd.toestel.tussenstand.jePlaats",
                  speler.punten ?? 0
                )}
              </p>
            </>
          )}
          <p className="text-xs text-slate-500">{t("wedstrijd.toestel.tussenstand.top", { top: TOP })}</p>
        </Kader>
      )}

      {quiz.fase === "podium" && (
        <Kader>
          <Trophy className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          {speler.team !== undefined ? (
            <>
              <h1 className="text-xl font-extrabold text-merk-900 mb-1">
                {speler.teamPlaats === 1
                  ? t("wedstrijd.toestel.podium.teamGewonnen", { team: teamNaam(speler.team) })
                  : t("wedstrijd.toestel.podium.teamPlaats", {
                      team: teamNaam(speler.team),
                      plaats: speler.teamPlaats ?? "–",
                    })}
              </h1>
              <p className="text-sm text-slate-700">
                {tn("wedstrijd.toestel.podium.jijHaalde", speler.punten ?? 0)}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-extrabold text-merk-900 mb-1">
                {speler.plaats === 1
                  ? t("wedstrijd.toestel.podium.gewonnen")
                  : t("wedstrijd.toestel.podium.plaats", { plaats: speler.plaats ?? "–" })}
              </h1>
              <p className="text-sm text-slate-700">{tn("wedstrijd.toestel.podium.metPunten", speler.punten ?? 0)}</p>
            </>
          )}
        </Kader>
      )}
    </div>
  );
}

/* ── Bijnaam ────────────────────────────────────────────────────────────── */

function BijnaamKiezen({
  code,
  apparaat,
  weggehaald,
  teams,
}: {
  code: string;
  apparaat: string;
  weggehaald: boolean;
  teams: number;
}) {
  const [bijnaam, setBijnaam] = useState("");
  const [team, setTeam] = useState<number | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  const doeMee = async (e: React.FormEvent) => {
    e.preventDefault();
    const naam = schoneBijnaam(bijnaam);
    if (!naam || bezig || (teams > 0 && team === null)) return;
    setBezig(true);
    setFout("");
    try {
      await opslag.meldSpeler(code, {
        apparaat,
        bijnaam: naam,
        op: new Date().toISOString(),
        ...(team !== null ? { team } : {}),
      });
    } catch {
      setFout(t("wedstrijd.toestel.bijnaam.fout"));
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto py-8 u-fade">
      <form onSubmit={doeMee} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-extrabold text-merk-900 mb-1">{t("wedstrijd.toestel.bijnaam.titel")}</h1>
          <p className="text-sm text-slate-600">
            {t("wedstrijd.toestel.bijnaam.uitleg")}
          </p>
        </div>

        {weggehaald && (
          <p role="alert" className="text-sm font-semibold text-amber-900 bg-amber-50 rounded-xl px-3 py-2.5">
            {t("wedstrijd.toestel.bijnaam.weggehaald")}
          </p>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={bijnaam}
            onChange={(e) => setBijnaam(e.target.value)}
            maxLength={MAX_BIJNAAM}
            placeholder={t("wedstrijd.toestel.bijnaam.placeholder")}
            autoComplete="off"
            aria-label={t("wedstrijd.toestel.bijnaam.label")}
            autoFocus
            className="flex-1 min-w-0 px-4 py-3 text-lg font-bold rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setBijnaam(willekeurigeBijnaam())}
            className="px-3 rounded-xl border border-slate-300 text-slate-700 hover:border-merk"
            aria-label={t("wedstrijd.toestel.bijnaam.verzin")}
            title={t("wedstrijd.toestel.bijnaam.verzin")}
          >
            <Dices className="w-5 h-5" />
          </button>
        </div>

        {teams > 0 && (
          <fieldset>
            <legend className="block text-sm font-bold text-slate-800 mb-2">{t("wedstrijd.toestel.bijnaam.teamVraag")}</legend>
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: teams }, (_, nr) => (
                <button
                  key={nr}
                  type="button"
                  onClick={() => setTeam(nr)}
                  aria-pressed={team === nr}
                  className={`py-3 rounded-xl border-2 font-bold text-sm transition-colors ${
                    team === nr
                      ? "bg-merk-800 text-white border-merk-800"
                      : "bg-white text-slate-700 border-slate-200 hover:border-merk"
                  }`}
                >
                  {teamNaam(nr)}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {t("wedstrijd.toestel.bijnaam.teamUitleg")}
            </p>
          </fieldset>
        )}

        {fout && (
          <p role="alert" className="text-sm font-semibold text-rose-800 bg-rose-50 rounded-xl px-3 py-2.5">
            {fout}
          </p>
        )}

        <button
          type="submit"
          disabled={!schoneBijnaam(bijnaam) || bezig || (teams > 0 && team === null)}
          className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm transition-colors"
        >
          {bezig ? t("wedstrijd.toestel.bijnaam.geduld") : t("wedstrijd.toestel.bijnaam.doeMee")}
        </button>
      </form>
    </div>
  );
}

/* ── Antwoorden ─────────────────────────────────────────────────────────── */

function Antwoorden({
  code,
  apparaat,
  quiz,
}: {
  code: string;
  apparaat: string;
  quiz: WedstrijdToestand;
}) {
  const vraag = quiz.vraag!;
  const sleutel = `openlab_wedstrijd_${code}_${quiz.vraagNr}`;
  const [gekozen, setGekozen] = useState<number[]>([]);
  const [toestand, setToestand] = useState<"open" | "bezig" | "binnen">(() => {
    try {
      return sessionStorage.getItem(sleutel) ? "binnen" : "open";
    } catch {
      return "open";
    }
  });
  const [fout, setFout] = useState("");

  // De klok op het toestel is alleen een hulp: het bord sluit de vraag af.
  const seconden = quiz.instellingen.seconden;
  const [over, setOver] = useState(seconden);
  useEffect(() => {
    if (!seconden) return;
    const begin = Date.now();
    const tik = setInterval(() => setOver(Math.max(0, Math.ceil(seconden - (Date.now() - begin) / 1000))), 250);
    return () => clearInterval(tik);
  }, [seconden]);

  const [getypt, setGetypt] = useState("");

  const stuur = async (inhoud: { keuze?: number[]; tekst?: string }) => {
    if (toestand !== "open") return;
    if (!inhoud.keuze?.length && !inhoud.tekst?.trim()) return;
    setToestand("bezig");
    setFout("");
    try {
      await opslag.stuurWedstrijdAntwoord(code, {
        apparaat,
        vraagNr: quiz.vraagNr,
        ...inhoud,
        op: new Date().toISOString(),
      });
      try {
        sessionStorage.setItem(sleutel, "1");
      } catch {
        // Niet erg: de opslagregels weigeren een tweede antwoord toch.
      }
      if (inhoud.keuze) setGekozen(inhoud.keuze);
      setToestand("binnen");
    } catch {
      setToestand("open");
      setFout(t("wedstrijd.toestel.antwoorden.fout"));
    }
  };

  if (toestand === "binnen") {
    return (
      <Kader>
        <CheckCircle2 className="w-12 h-12 text-merk mx-auto mb-3" />
        <h1 className="text-xl font-extrabold text-merk-900 mb-1">{t("wedstrijd.toestel.antwoorden.binnen")}</h1>
        {gekozen.length > 0 && (
          <p className="text-sm text-slate-700 mb-1">
            {t("wedstrijd.toestel.antwoorden.koos", { keuze: gekozen.map((i) => vraag.opties[i]).join(", ") })}
          </p>
        )}
        {getypt.trim() && <p className="text-sm text-slate-700 mb-1">{t("wedstrijd.toestel.antwoorden.typte", { tekst: getypt.trim() })}</p>}
        <p className="text-sm text-slate-600">{t("wedstrijd.toestel.antwoorden.wachten")}</p>
      </Kader>
    );
  }

  const tijdOm = seconden > 0 && over === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
        <span>{t("wedstrijd.vraagVan", { nr: quiz.vraagNr + 1, totaal: quiz.aantalVragen })}</span>
        {seconden > 0 && (
          <span className={`flex items-center gap-1 tabular-nums ${over <= 5 ? "text-amber-700" : ""}`}>
            <Clock className="w-3.5 h-3.5" />
            {t("wedstrijd.toestel.antwoorden.seconden", { n: over })}
          </span>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        {vraag.media?.soort === "afbeelding" && (
          <div className="mb-3">
            <VraagMedia media={vraag.media} />
          </div>
        )}
        {(vraag.media?.soort === "video" || vraag.media?.soort === "audio") && (
          <p className="text-xs font-bold text-slate-500 mb-2">
            {vraag.media.soort === "video"
              ? t("wedstrijd.toestel.antwoorden.video")
              : t("wedstrijd.toestel.antwoorden.audio")}
          </p>
        )}
        <h1 className="text-lg font-extrabold text-merk-900 leading-snug">{vraag.tekst}</h1>
        {vraag.meerdere && <p className="text-xs font-bold text-slate-500 mt-1">{t("wedstrijd.toestel.antwoorden.meerdere")}</p>}
      </div>

      {vraag.typen ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            stuur({ tekst: getypt.trim().slice(0, MAX_TYPANTWOORD) });
          }}
          className="space-y-2.5"
        >
          <input
            type="text"
            value={getypt}
            onChange={(e) => setGetypt(e.target.value)}
            maxLength={MAX_TYPANTWOORD}
            placeholder={t("wedstrijd.toestel.antwoorden.placeholder")}
            aria-label={t("wedstrijd.toestel.antwoorden.label")}
            autoFocus
            autoComplete="off"
            autoCapitalize="none"
            disabled={toestand === "bezig" || tijdOm}
            className="w-full px-4 py-4 text-lg font-bold rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
          />
          <p className="text-xs text-slate-500">
            {t("wedstrijd.toestel.antwoorden.hoofdletters")}
          </p>
          <button
            type="submit"
            disabled={!getypt.trim() || toestand === "bezig" || tijdOm}
            className="w-full py-3.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm"
          >
            {t("wedstrijd.toestel.antwoorden.stuur")}
          </button>
        </form>
      ) : (
      <div className="grid grid-cols-1 gap-2.5">
        {vraag.opties.map((optie, i) => {
          const stijl = stijlVoor(i);
          const aan = gekozen.includes(i);
          return (
            <button
              key={i}
              disabled={toestand === "bezig" || tijdOm}
              aria-pressed={vraag.meerdere ? aan : undefined}
              onClick={() =>
                vraag.meerdere
                  ? setGekozen((g) => (g.includes(i) ? g.filter((x) => x !== i) : [...g, i]))
                  : stuur({ keuze: [i] })
              }
              className={`w-full min-h-16 rounded-2xl text-white text-left flex items-center gap-3 px-4 py-3 font-bold text-base transition-transform active:scale-[0.98] disabled:opacity-60 ${
                stijl.vlak
              } ${vraag.meerdere && aan ? "ring-4 ring-offset-2 ring-merk-900" : ""}`}
            >
              <Vorm vorm={stijl.vorm} className="w-7 h-7 shrink-0" />
              <span className="flex-1 leading-snug">{optie}</span>
              {vraag.meerdere && aan && <CheckCircle2 className="w-6 h-6 shrink-0" />}
            </button>
          );
        })}
      </div>
      )}

      {vraag.meerdere && (
        <button
          onClick={() => stuur({ keuze: gekozen })}
          disabled={gekozen.length === 0 || toestand === "bezig" || tijdOm}
          className="w-full py-3.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm"
        >
          {t("wedstrijd.toestel.antwoorden.bevestig")}
        </button>
      )}

      {tijdOm && <p className="text-sm font-bold text-center text-slate-600">{t("wedstrijd.toestel.antwoorden.tijdOm")}</p>}

      {fout && (
        <p role="alert" className="text-sm font-semibold text-rose-800 bg-rose-50 rounded-xl px-3 py-2.5">
          {fout}
        </p>
      )}
    </div>
  );
}

/* ── Resultaat na een vraag ─────────────────────────────────────────────── */

function Resultaat({ speler, quiz }: { speler: WedstrijdSpeler; quiz: WedstrijdToestand }) {
  const laatste = speler.laatste?.vraagNr === quiz.vraagNr ? speler.laatste : undefined;
  const juisteTekst =
    quiz.juisteTekst ?? (quiz.juist ?? []).map((i) => quiz.vraag?.opties[i]).filter(Boolean).join(", ");

  if (!laatste) {
    return (
      <Kader>
        <p className="text-sm text-slate-600">{t("wedstrijd.toestel.resultaat.rekenen")}</p>
      </Kader>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className={`rounded-2xl p-6 text-center u-pop ${
          laatste.juist ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"
        }`}
      >
        {laatste.juist ? (
          <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-600" />
        ) : (
          <XCircle className="w-12 h-12 mx-auto mb-2 text-rose-600" />
        )}
        <h1 className="text-2xl font-extrabold mb-1">
          {laatste.juist
            ? t("wedstrijd.toestel.resultaat.juist")
            : laatste.beantwoord
              ? t("wedstrijd.toestel.resultaat.nietJuist")
              : t("wedstrijd.toestel.resultaat.geenAntwoord")}
        </h1>
        {laatste.juist ? (
          <p className="text-lg font-bold tabular-nums">
            {laatste.bonus > 0
              ? tr(
                  "wedstrijd.toestel.resultaat.metBonus",
                  { s: (s) => <span className="text-sm font-bold">{s}</span> },
                  { punten: laatste.punten, bonus: laatste.bonus }
                )
              : `+${laatste.punten}`}
          </p>
        ) : (
          <p className="text-sm">
            {tr(
              "wedstrijd.toestel.resultaat.juisteAntwoord",
              { b: (s) => <strong>{s}</strong> },
              { antwoord: juisteTekst }
            )}
          </p>
        )}
      </div>

      {quiz.uitleg && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500 mb-1">{t("wedstrijd.waarom")}</p>
          <p className="text-sm text-slate-800 leading-relaxed">{quiz.uitleg}</p>
        </div>
      )}
    </div>
  );
}

function Kader({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center u-fade">{children}</div>;
}
