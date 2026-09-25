"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { ArrowRight, CheckCircle2, Shuffle, Square, Trophy, Users, X, RefreshCw } from "lucide-react";
import { opslag, opslagGedeeld, generateShortCode } from "@/lib/opslag";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  Exercise,
  LiveSessie,
  WedstrijdAntwoord,
  WedstrijdSpeler,
  WedstrijdToestand,
} from "@/lib/types";
import {
  TOP,
  type StandRij,
  type WedstrijdVraag,
  antwoordJuist,
  juisteTekstVan,
  telGegeven,
  puntenVoor,
  rangschik,
  reeksBonus,
  spelerRijen,
  stijlVoor,
  teamNaam,
  teamStand,
  verdeelTeams,
  willekeurigeBijnaam,
} from "@/lib/wedstrijd";
import { VraagMedia } from "@/components/players/VraagMedia";
import { Vorm, VORM_NAAM } from "./Vorm";
import { merkTint } from "@/lib/instellingen/kleur";
import { t, tn, vergelijk } from "@/lib/i18n";
import { tr } from "@/lib/i18n/rijk";

/**
 * Het bord van de leraar tijdens een quizwedstrijd. Dit scherm is de scheidsrechter: het
 * opent en sluit elke vraag, meet hoe snel een antwoord binnenkomt en rekent de punten uit.
 * De toestellen sturen alleen hun keuze in.
 */

interface VraagStatistiek {
  antwoorden: number;
  fout: number;
}

export function WedstrijdBord({
  sessie: begin,
  oefening,
  vragen,
  onStop,
}: {
  sessie: LiveSessie;
  oefening: Exercise;
  vragen: WedstrijdVraag[];
  onStop: () => void;
}) {
  const code = begin.code;
  const [sessie, setSessie] = useState<LiveSessie>(begin);
  const [spelers, setSpelers] = useState<WedstrijdSpeler[]>([]);
  const [antwoorden, setAntwoorden] = useState<WedstrijdAntwoord[]>([]);
  const [fout, setFout] = useState("");
  const [bezig, setBezig] = useState(false);
  const [resterend, setResterend] = useState(0);

  const quiz = sessie.quiz as WedstrijdToestand;
  const inst = quiz.instellingen;
  const huidig = quiz.vraagNr >= 0 ? vragen[quiz.vraagNr] : undefined;

  // Wanneer het bord elk antwoord voor het eerst zag. Zo meet het bord de snelheid, niet
  // het toestel van de cursist, en valt er niet te sjoemelen met de klok.
  const gezien = useRef(new Map<string, number>());
  const vraagStart = useRef(0);
  const sluitend = useRef(false);
  const statistiek = useRef<VraagStatistiek[]>(vragen.map(() => ({ antwoorden: 0, fout: 0 })));
  const foutPerSpeler = useRef(new Map<string, string[]>());
  const resultatenGestuurd = useRef(false);

  // De laatste stand, voor de afsluitfunctie die ook vanuit een timer loopt.
  const stand = useRef({ sessie, spelers, antwoorden });
  stand.current = { sessie, spelers, antwoorden };

  useEffect(() => {
    const stopSessie = opslag.volgSessie(code, (s) => s && setSessie(s));
    const stopSpelers = opslag.volgSpelers(code, setSpelers);
    return () => {
      stopSessie();
      stopSpelers();
    };
  }, [code]);

  useEffect(() => {
    if (quiz.vraagNr < 0) return;
    return opslag.volgWedstrijdAntwoorden(code, quiz.vraagNr, (lijst) => {
      const nu = Date.now();
      for (const a of lijst) if (!gezien.current.has(a.apparaat)) gezien.current.set(a.apparaat, nu);
      setAntwoorden(lijst);
    });
  }, [code, quiz.vraagNr]);

  const zetQuiz = useCallback(
    async (nieuw: WedstrijdToestand) => {
      await opslag.wijzigSessie(code, { quiz: nieuw });
      setSessie((s) => ({ ...s, quiz: nieuw }));
    },
    [code]
  );

  const metFoutmelding = async (actie: () => Promise<void>) => {
    if (bezig) return;
    setBezig(true);
    try {
      await actie();
      setFout("");
    } catch (e) {
      console.error("Wedstrijd bijwerken mislukt", e);
      setFout(t("wedstrijd.bord.fout.verbinding"));
    } finally {
      setBezig(false);
    }
  };

  /* ── Verloop ──────────────────────────────────────────────────────────── */

  const startVraag = (nr: number) =>
    metFoutmelding(async () => {
      const v = vragen[nr];
      gezien.current = new Map();
      sluitend.current = false;
      setAntwoorden([]);
      // Vóór het wegschrijven: een snel toestel kan antwoorden nog voor de schrijfactie klaar is.
      vraagStart.current = Date.now();
      setResterend(inst.seconden);
      await zetQuiz({
        fase: "vraag",
        vraagNr: nr,
        aantalVragen: vragen.length,
        instellingen: inst,
        vraag: {
          tekst: v.bron.question,
          opties: v.opties,
          meerdere: v.bron.type === "multiple_response",
          ...(v.bron.type === "typ" ? { typen: true } : {}),
          ...(v.bron.media ? { media: v.bron.media } : {}),
        },
      });
    });

  const sluitVraag = useCallback(async () => {
    if (sluitend.current) return;
    sluitend.current = true;
    setBezig(true);

    const { sessie: s, spelers: alle, antwoorden: binnen } = stand.current;
    const q = s.quiz as WedstrijdToestand;
    const v = vragen[q.vraagNr];
    const limietMs = q.instellingen.seconden * 1000;
    const perToestel = new Map(binnen.map((a) => [a.apparaat, a]));

    const bijgewerkt = alle.map((sp) => {
      const antwoord = perToestel.get(sp.apparaat);
      const juist = antwoordJuist(antwoord, v);
      const reactie = (gezien.current.get(sp.apparaat) ?? Date.now()) - vraagStart.current;
      const punten = puntenVoor(juist, q.instellingen, reactie, limietMs);
      const reeks = juist ? (sp.reeks ?? 0) + 1 : 0;
      const bonus = juist ? reeksBonus(reeks, q.instellingen) : 0;
      if (antwoord && !juist) {
        const lijst = foutPerSpeler.current.get(sp.apparaat) ?? [];
        foutPerSpeler.current.set(sp.apparaat, [...lijst, v.bron.id]);
      }
      return {
        ...sp,
        punten: (sp.punten ?? 0) + punten + bonus,
        reeks,
        laatste: { vraagNr: q.vraagNr, beantwoord: Boolean(antwoord), juist, punten, bonus },
      };
    });
    // Eerst de plaats van elke speler, dan die van zijn team. Allebei schrijft het bord in
    // het spelersdocument, zodat elk toestel zijn stand ziet zonder de lijst te kennen.
    const gerangschikt = rangschik(bijgewerkt);
    const teamsStand = q.instellingen.teams > 0 ? teamStand(gerangschikt, q.instellingen.teams) : [];
    const metTeam = gerangschikt.map((sp) => {
      const rij = teamsStand.find((t) => t.sleutel === `team-${sp.team}`);
      return rij ? { ...sp, teamPunten: rij.punten, teamPlaats: rij.plaats } : sp;
    });

    const verdeling = v.opties.map(() => 0);
    let aantalFout = 0;
    for (const a of binnen) {
      for (const k of a.keuze ?? []) if (k >= 0 && k < verdeling.length) verdeling[k]++;
      if (!antwoordJuist(a, v)) aantalFout++;
    }
    statistiek.current[q.vraagNr] = { antwoorden: binnen.length, fout: aantalFout };
    // Bij een typvraag toont het bord wat de klas intypte in plaats van een verdeling.
    const isTyp = v.bron.type === "typ";

    try {
      // Eerst de punten, dan de fase: zo ziet een toestel zijn resultaat meteen.
      if (metTeam.length) await opslag.werkSpelersBij(code, metTeam);
      await zetQuiz({
        ...q,
        fase: "uitleg",
        juist: v.juist,
        uitleg: v.bron.explanation,
        verdeling,
        ...(isTyp ? { juisteTekst: juisteTekstVan(v), gegeven: telGegeven(binnen, v) } : {}),
      });
      setFout("");
    } catch (e) {
      console.error("Vraag afsluiten mislukt", e);
      sluitend.current = false;
      setFout(t("wedstrijd.bord.fout.sluiten"));
    } finally {
      setBezig(false);
    }
  }, [code, vragen, zetQuiz]);

  // De klok: sluit af als de tijd om is, of zodra iedereen geantwoord heeft.
  useEffect(() => {
    if (quiz.fase !== "vraag") return;
    const tik = setInterval(() => {
      if (inst.seconden > 0) {
        const over = Math.max(0, inst.seconden - (Date.now() - vraagStart.current) / 1000);
        setResterend(Math.ceil(over));
        if (over <= 0) sluitVraag();
      }
    }, 250);
    return () => clearInterval(tik);
  }, [quiz.fase, inst.seconden, sluitVraag]);

  const iedereen = spelers.length > 0 && antwoorden.length >= spelers.length;
  useEffect(() => {
    if (quiz.fase !== "vraag" || !iedereen) return;
    // Heel even wachten, zodat de laatste cursist ziet dat zijn antwoord binnen is.
    const t = setTimeout(sluitVraag, 800);
    return () => clearTimeout(t);
  }, [quiz.fase, iedereen, sluitVraag]);

  const isLaatste = quiz.vraagNr >= vragen.length - 1;

  const naarPodium = () =>
    metFoutmelding(async () => {
      await zetQuiz({ ...quiz, fase: "podium" });
      stuurResultaten();
    });

  const volgende = () => {
    if (quiz.fase === "uitleg" && inst.tussenstand === "elkeVraag" && !isLaatste) {
      return metFoutmelding(() => zetQuiz({ ...quiz, fase: "tussenstand" }));
    }
    return isLaatste ? naarPodium() : startVraag(quiz.vraagNr + 1);
  };

  /**
   * Welke vragen fout gingen, per toestel en zonder naam, zoals bij de Eenvoudige quiz.
   * Zo ziet de maker later welke vraag het moeilijkst was.
   */
  const stuurResultaten = () => {
    if (resultatenGestuurd.current) return;
    resultatenGestuurd.current = true;
    const gespeeld = Math.max(1, quiz.vraagNr + 1);
    for (const sp of stand.current.spelers) {
      if (!sp.laatste) continue;
      opslag
        .stuurQuizresultaat(oefening.id, foutPerSpeler.current.get(sp.apparaat) ?? [], gespeeld)
        .catch(() => {});
    }
  };

  const sluitAf = () =>
    metFoutmelding(async () => {
      await opslag.wijzigSessie(code, { status: "afgesloten" });
      onStop();
    });

  /* ── Weergave ─────────────────────────────────────────────────────────── */

  // Wat het bord toont in de tussenstand en op het podium: de teams of de spelers.
  const rijen = useMemo(
    () => (inst.teams > 0 ? teamStand(spelers, inst.teams) : spelerRijen(spelers)),
    [spelers, inst.teams]
  );

  return (
    <div className="max-w-5xl mx-auto space-y-4 u-fade">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={sluitAf}
          className="text-xs font-bold text-slate-500 hover:text-merk-900 flex items-center gap-1"
        >
          <Square className="w-3.5 h-3.5" />
          <span>{t("wedstrijd.bord.stoppen")}</span>
        </button>
        <span className="text-xs font-bold text-slate-500">
          {[
            inst.spelvorm === "rustig" ? t("wedstrijd.bord.instellingen.rustig") : t("wedstrijd.bord.instellingen.klassiek"),
            inst.seconden
              ? t("wedstrijd.bord.instellingen.perVraag", { n: inst.seconden })
              : t("wedstrijd.bord.instellingen.zelfAfsluiten"),
            inst.reeksbonus ? t("wedstrijd.bord.instellingen.reeksbonusAan") : t("wedstrijd.bord.instellingen.reeksbonusUit"),
            ...(inst.teams > 0 ? [tn("wedstrijd.bord.instellingen.teams", inst.teams)] : []),
          ].join(" · ")}
        </span>
      </div>

      {fout && (
        <p role="alert" className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          {fout}
        </p>
      )}

      <div className="bg-merk-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg min-h-[28rem]">
        {quiz.fase === "wachtruimte" && (
          <Wachtruimte
            code={code}
            titel={oefening.title}
            spelers={spelers}
            teams={inst.teams}
            onVerwijder={(a) => opslag.verwijderSpeler(code, a).catch(() => setFout(t("wedstrijd.bord.fout.verwijderen")))}
            onVerdeel={() =>
              opslag
                .werkSpelersBij(code, verdeelTeams(spelers, inst.teams))
                .catch(() => setFout(t("wedstrijd.bord.fout.verdelen")))
            }
          />
        )}

        {quiz.fase === "vraag" && huidig && (
          <VraagScherm
            nr={quiz.vraagNr}
            totaal={vragen.length}
            vraag={huidig}
            resterend={inst.seconden ? resterend : null}
            binnen={antwoorden.length}
            spelers={spelers.length}
            code={code}
          />
        )}

        {quiz.fase === "uitleg" && huidig && (
          <UitlegScherm
            vraag={huidig}
            verdeling={quiz.verdeling ?? []}
            binnen={antwoorden.length}
            gegeven={quiz.gegeven}
          />
        )}

        {quiz.fase === "tussenstand" && (
          <Tussenstand rijen={rijen} nr={quiz.vraagNr} totaal={vragen.length} teams={inst.teams > 0} />
        )}

        {quiz.fase === "podium" && <Podium rijen={rijen} teams={inst.teams > 0} />}
      </div>

      {/* De knop die het verloop verder zet: altijd op dezelfde plek. */}
      {quiz.fase === "wachtruimte" && (
        <Hoofdknop onClick={() => startVraag(0)} bezig={bezig}>
          {spelers.length === 0
            ? t("wedstrijd.bord.knop.startLeeg")
            : t("wedstrijd.bord.knop.startMet", { n: spelers.length })}
        </Hoofdknop>
      )}
      {quiz.fase === "vraag" && (
        <Hoofdknop onClick={sluitVraag} bezig={bezig} rustig>
          {t("wedstrijd.bord.knop.sluitNu")}
        </Hoofdknop>
      )}
      {(quiz.fase === "uitleg" || quiz.fase === "tussenstand") && (
        <Hoofdknop onClick={volgende} bezig={bezig}>
          {quiz.fase === "uitleg" && inst.tussenstand === "elkeVraag" && !isLaatste
            ? t("wedstrijd.bord.knop.tussenstand")
            : isLaatste
              ? t("wedstrijd.bord.knop.podium")
              : t("wedstrijd.bord.knop.volgende")}
        </Hoofdknop>
      )}

      {quiz.fase === "podium" && (
        <Afsluiter
          oefening={oefening}
          vragen={vragen}
          statistiek={statistiek.current}
          onSluit={sluitAf}
        />
      )}

      {!opslagGedeeld && (
        <DemoSpelers code={code} quiz={quiz} spelers={spelers} antwoorden={antwoorden} />
      )}
    </div>
  );
}

/* ── Onderdelen van het bord ────────────────────────────────────────────── */

function Hoofdknop({
  onClick,
  bezig,
  rustig,
  children,
}: {
  onClick: () => void;
  bezig: boolean;
  rustig?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={bezig}
      className={`w-full py-4 rounded-2xl font-bold text-base transition-colors flex items-center justify-center gap-2 disabled:opacity-60 ${
        rustig
          ? "bg-white border border-slate-300 text-slate-800 hover:border-merk"
          : "bg-merk-800 hover:bg-merk-900 text-white"
      }`}
    >
      <span>{children}</span>
      {!rustig && <ArrowRight className="w-5 h-5" />}
    </button>
  );
}

function usePincode(code: string) {
  const [qr, setQr] = useState("");
  const [url, setUrl] = useState("");
  useEffect(() => {
    const u = `${window.location.origin}/live/join?code=${code}`;
    setUrl(u);
    QRCode.toDataURL(u, { width: 280, margin: 2, color: { dark: merkTint("900"), light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [code]);
  return { qr, url, pincode: `${code.slice(0, 3)} ${code.slice(3)}` };
}

function Wachtruimte({
  code,
  titel,
  spelers,
  teams,
  onVerwijder,
  onVerdeel,
}: {
  code: string;
  titel: string;
  spelers: WedstrijdSpeler[];
  teams: number;
  onVerwijder: (apparaat: string) => void;
  onVerdeel: () => void;
}) {
  const { qr, url, pincode } = usePincode(code);
  const gesorteerd = [...spelers].sort((a, b) => vergelijk(a.op, b.op));

  return (
    <div>
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 pb-6 border-b border-white/20">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-white/70 block mb-2">
            {t("wedstrijd.bord.wachtruimte.kop")}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight mb-3">{titel}</h1>
          <p className="text-white/80 text-sm sm:text-base">
            {tr(
              "wedstrijd.bord.wachtruimte.surf",
              { b: (s) => <strong className="text-white">{s}</strong> },
              { adres: url.replace(/^https?:\/\//, "").replace(/\?.*$/, "") }
            )}
          </p>
        </div>
        <div className="bg-white text-merk-900 p-4 rounded-2xl flex flex-col items-center shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr && <img src={qr} alt={t("wedstrijd.bord.wachtruimte.qrAlt")} className="w-40 h-40 rounded-lg mb-2" />}
          <span className="text-[11px] font-semibold text-slate-500">{t("wedstrijd.bord.wachtruimte.pincode")}</span>
          <span className="font-mono text-3xl font-black tracking-widest">{pincode}</span>
        </div>
      </div>

      <div className="pt-5">
        <p className="flex items-center gap-2 text-sm font-bold mb-4">
          <Users className="w-4 h-4" />
          {spelers.length === 0
            ? t("wedstrijd.bord.wachtruimte.wachten")
            : tn("wedstrijd.bord.wachtruimte.deelnemers", spelers.length)}
        </p>
        {teams > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: teams }, (_, nr) => (
                <div key={nr} className="rounded-2xl bg-white/10 p-3">
                  <p className="text-sm font-black mb-2">
                    {teamNaam(nr)}{" "}
                    <span className="font-bold text-white/60">
                      ({gesorteerd.filter((s) => s.team === nr).length})
                    </span>
                  </p>
                  <ul className="space-y-1">
                    {gesorteerd
                      .filter((s) => s.team === nr)
                      .map((s) => (
                        <Naamkaartje key={s.apparaat} speler={s} onVerwijder={onVerwijder} />
                      ))}
                  </ul>
                </div>
              ))}
            </div>

            {gesorteerd.some((s) => s.team === undefined) && (
              <div>
                <p className="text-sm font-bold text-white/70 mb-2">{t("wedstrijd.bord.wachtruimte.geenTeam")}</p>
                <ul className="flex flex-wrap gap-2">
                  {gesorteerd
                    .filter((s) => s.team === undefined)
                    .map((s) => (
                      <Naamkaartje key={s.apparaat} speler={s} onVerwijder={onVerwijder} />
                    ))}
                </ul>
              </div>
            )}

            {spelers.length > 1 && (
              <button
                onClick={onVerdeel}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-bold"
              >
                <Shuffle className="w-4 h-4" />
                {t("wedstrijd.bord.wachtruimte.verdeel")}
              </button>
            )}
          </div>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {gesorteerd.map((s) => (
              <Naamkaartje key={s.apparaat} speler={s} onVerwijder={onVerwijder} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Eén bijnaam in de wachtruimte, met het kruisje om ze weg te halen. */
function Naamkaartje({
  speler,
  onVerwijder,
}: {
  speler: WedstrijdSpeler;
  onVerwijder: (apparaat: string) => void;
}) {
  return (
    <li className="u-pop inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full bg-white/15 text-sm font-bold">
      {speler.bijnaam}
      <button
        onClick={() => onVerwijder(speler.apparaat)}
        className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/20"
        aria-label={t("wedstrijd.bord.naamkaartje.verwijder", { naam: speler.bijnaam })}
        title={t("wedstrijd.bord.naamkaartje.verwijderTitel")}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </li>
  );
}

function VraagScherm({
  nr,
  totaal,
  vraag,
  resterend,
  binnen,
  spelers,
  code,
}: {
  nr: number;
  totaal: number;
  vraag: WedstrijdVraag;
  resterend: number | null;
  binnen: number;
  spelers: number;
  code: string;
}) {
  const bijna = resterend !== null && resterend <= 5;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 text-sm font-bold text-white/80">
        <span>{t("wedstrijd.vraagVan", { nr: nr + 1, totaal })}</span>
        <span className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {t("wedstrijd.bord.vraag.antwoordden", { binnen, spelers })}
          </span>
          {resterend !== null && (
            <span
              className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black tabular-nums ${
                bijna ? "bg-amber-400 text-merk-900" : "bg-white/15 text-white"
              }`}
              aria-label={tn("wedstrijd.bord.vraag.nogSeconden", resterend)}
            >
              {resterend}
            </span>
          )}
        </span>
      </div>

      {vraag.bron.media && (
        <div className="bg-white/5 rounded-2xl p-2">
          <VraagMedia media={vraag.bron.media} groot />
        </div>
      )}

      <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight text-center">{vraag.bron.question}</h1>
      {vraag.bron.type === "multiple_response" && (
        <p className="text-center text-sm font-bold text-white/70 -mt-3">{t("wedstrijd.bord.vraag.meerdere")}</p>
      )}

      {vraag.bron.type === "typ" ? (
        <p className="text-center text-lg sm:text-2xl font-bold text-white/80">
          {t("wedstrijd.bord.vraag.typ")}
        </p>
      ) : (
        <OptieRaster opties={vraag.opties} />
      )}

      <p className="text-xs text-white/60 text-center">
        {tr(
          "wedstrijd.bord.vraag.laterBinnen",
          { code: (s) => <span className="font-mono font-bold">{s}</span> },
          { pincode: `${code.slice(0, 3)} ${code.slice(3)}` }
        )}
      </p>
    </div>
  );
}

function OptieRaster({
  opties,
  juist,
  verdeling,
  totaal,
}: {
  opties: string[];
  juist?: number[];
  verdeling?: number[];
  totaal?: number;
}) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {opties.map((optie, i) => {
        const stijl = stijlVoor(i);
        const isJuisteOptie = juist?.includes(i);
        const gedimd = juist && !isJuisteOptie;
        const n = verdeling?.[i] ?? 0;
        const pct = totaal ? Math.round((n / totaal) * 100) : 0;
        return (
          <li
            key={i}
            className={`relative overflow-hidden rounded-2xl ${stijl.vlak} text-white flex items-center gap-4 p-4 sm:p-5 min-h-20 transition-opacity ${
              gedimd ? "opacity-40" : ""
            }`}
          >
            <Vorm vorm={stijl.vorm} className="w-8 h-8 shrink-0" />
            <span className="sr-only">{VORM_NAAM[stijl.vorm]}:</span>
            <span className="text-lg sm:text-2xl font-bold leading-snug flex-1">{optie}</span>
            {isJuisteOptie && <CheckCircle2 className="w-8 h-8 shrink-0" aria-label={t("wedstrijd.bord.vraag.juist")} />}
            {verdeling && (
              <span className="font-mono text-lg font-black shrink-0" title={`${pct}%`}>
                {n}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function UitlegScherm({
  vraag,
  verdeling,
  binnen,
  gegeven,
}: {
  vraag: WedstrijdVraag;
  verdeling: number[];
  binnen: number;
  gegeven?: { tekst: string; aantal: number; juist: boolean }[];
}) {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl sm:text-3xl font-extrabold leading-tight text-center">{vraag.bron.question}</h1>
      {vraag.bron.type === "typ" ? (
        <GetypteAntwoorden vraag={vraag} gegeven={gegeven ?? []} />
      ) : (
        <OptieRaster opties={vraag.opties} juist={vraag.juist} verdeling={verdeling} totaal={binnen} />
      )}
      {vraag.bron.explanation && (
        <div className="bg-white text-merk-900 rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-merk-700 mb-1">{t("wedstrijd.waarom")}</p>
          <p className="text-base sm:text-lg leading-relaxed">{vraag.bron.explanation}</p>
        </div>
      )}
    </div>
  );
}

/** Bij een typvraag: het juiste antwoord groot, daaronder wat de klas typte. */
function GetypteAntwoorden({
  vraag,
  gegeven,
}: {
  vraag: WedstrijdVraag;
  gegeven: { tekst: string; aantal: number; juist: boolean }[];
}) {
  const juist = juisteTekstVan(vraag);
  const andere = (vraag.bron.antwoorden ?? []).slice(1);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-emerald-600 text-white p-5 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-white/80 mb-1">{t("wedstrijd.bord.getypt.juisteAntwoord")}</p>
        <p className="text-2xl sm:text-4xl font-extrabold break-words">{juist}</p>
        {andere.length > 0 && (
          <p className="text-sm text-white/80 mt-2">{t("wedstrijd.bord.getypt.ookGoed", { lijst: andere.join(", ") })}</p>
        )}
      </div>

      {gegeven.length > 0 && (
        <div>
          <p className="text-sm font-bold text-white/70 mb-2">{t("wedstrijd.bord.getypt.klasTypte")}</p>
          <ul className="flex flex-wrap gap-2">
            {gegeven.map((g) => (
              <li
                key={g.tekst}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${
                  g.juist ? "bg-emerald-500/30 text-emerald-100" : "bg-white/10 text-white/80"
                }`}
              >
                {g.juist && <CheckCircle2 className="w-4 h-4" />}
                <span className="break-words">{g.tekst}</span>
                {g.aantal > 1 && <span className="font-mono text-white/60">{g.aantal}×</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Tussenstand({
  rijen,
  nr,
  totaal,
  teams,
}: {
  rijen: (StandRij & { plaats: number })[];
  nr: number;
  totaal: number;
  teams: boolean;
}) {
  const top = rijen.slice(0, TOP);
  return (
    <div>
      <p className="text-sm font-bold text-white/70 mb-1">{t("wedstrijd.naVraag", { nr: nr + 1, totaal })}</p>
      <h1 className="text-2xl sm:text-4xl font-extrabold mb-6">{t("wedstrijd.bord.tussenstand.titel")}</h1>
      {top.length === 0 ? (
        <p className="text-white/70">{t("wedstrijd.bord.tussenstand.geenDeelnemers")}</p>
      ) : (
        <ol className="space-y-2">
          {top.map((r) => (
            <li
              key={r.sleutel}
              className="u-rise flex items-center gap-4 rounded-2xl bg-white/10 px-5 py-3 text-lg sm:text-xl"
            >
              <span className="w-8 font-black text-white/70 tabular-nums">{r.plaats}</span>
              <span className="flex-1 font-bold truncate">
                {r.naam}
                {r.leden !== undefined && (
                  <span className="ml-2 text-sm font-bold text-white/60">
                    {tn("wedstrijd.bord.tussenstand.spelers", r.leden)}
                  </span>
                )}
              </span>
              {r.winst !== undefined && r.winst > 0 && (
                <span className="text-sm font-bold text-emerald-300">+{r.winst}</span>
              )}
              <span className="font-mono font-black tabular-nums">{r.punten}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-5 text-sm text-white/70">
        {teams
          ? t("wedstrijd.bord.tussenstand.uitlegTeams")
          : t("wedstrijd.bord.tussenstand.uitlegSpelers")}
      </p>
    </div>
  );
}

function Podium({ rijen, teams }: { rijen: (StandRij & { plaats: number })[]; teams: boolean }) {
  // Rustige confetti, één keer, en niet voor wie minder beweging wil.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    import("canvas-confetti")
      .then(({ default: confetti }) =>
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.35 }, disableForReducedMotion: true })
      )
      .catch(() => {});
  }, []);

  const [eerste, tweede, derde] = rijen;
  const blokken = [
    { s: tweede, hoogte: "h-28", plek: 2 },
    { s: eerste, hoogte: "h-40", plek: 1 },
    { s: derde, hoogte: "h-20", plek: 3 },
  ];

  return (
    <div className="text-center">
      <Trophy className="w-10 h-10 mx-auto mb-2 text-amber-300" />
      <h1 className="text-2xl sm:text-4xl font-extrabold mb-2">{t("wedstrijd.bord.podium.titel")}</h1>
      <p className="text-sm text-white/70 mb-6">
        {teams ? t("wedstrijd.bord.podium.perTeam") : t("wedstrijd.bord.podium.opPunten")}
      </p>
      {rijen.length === 0 ? (
        <p className="text-white/70">{t("wedstrijd.bord.podium.niemand")}</p>
      ) : (
        <div className="flex items-end justify-center gap-3 sm:gap-6">
          {blokken.map(({ s, hoogte, plek }) => (
            <div key={plek} className="w-28 sm:w-44 flex flex-col items-center">
              {s ? (
                <>
                  <span className="font-bold text-base sm:text-xl leading-tight mb-1 break-words">{s.naam}</span>
                  <span className="font-mono text-sm text-white/80 mb-2">{s.punten}</span>
                </>
              ) : (
                <span className="mb-2 text-white/40">—</span>
              )}
              <div
                className={`w-full ${hoogte} rounded-t-2xl flex items-start justify-center pt-2 text-3xl font-black ${
                  plek === 1 ? "bg-amber-300 text-merk-900" : "bg-white/20"
                }`}
              >
                {s ? s.plaats : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Na het podium, alleen voor de leraar: waar de klas struikelde, en die vragen meteen
 * meegeven als Eenvoudige quiz om rustig te herhalen.
 */
function Afsluiter({
  oefening,
  vragen,
  statistiek,
  onSluit,
}: {
  oefening: Exercise;
  vragen: WedstrijdVraag[];
  statistiek: VraagStatistiek[];
  onSluit: () => void;
}) {
  const { gebruiker } = useAuth();
  const [herhaal, setHerhaal] = useState<Exercise | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  const moeilijkst = vragen
    .map((v, i) => ({ v, ...statistiek[i] }))
    .filter((r) => r.fout > 0 && r.antwoorden > 0)
    .sort((a, b) => b.fout / b.antwoorden - a.fout / a.antwoorden)
    .slice(0, 3);

  const maakHerhaling = async () => {
    if (bezig || moeilijkst.length === 0) return;
    setBezig(true);
    setFout("");
    const nieuw: Exercise = {
      id: `quiz-${Date.now()}`,
      title: t("wedstrijd.bord.afsluiter.herhalingTitel", { titel: oefening.title }).slice(0, 200),
      description: t("wedstrijd.bord.afsluiter.herhalingBeschrijving"),
      category: "quiz",
      didacticGoal: "check",
      type: "quiz",
      creatorName: gebruiker?.naam ?? t("wedstrijd.bord.afsluiter.onbekend"),
      creatorId: gebruiker?.id,
      visibility: "prive",
      shareCode: generateShortCode(),
      tags: ["Quiz", t("wedstrijd.bord.afsluiter.herhalingTag")],
      content: { questions: moeilijkst.map((r) => r.v.bron) },
      didacticConfig: { ...oefening.didacticConfig, showImmediateFeedback: true, allowRetryMissed: true },
      createdAt: new Date().toISOString().split("T")[0],
    };
    try {
      await opslag.maakOefeningen([nieuw]);
      setHerhaal(nieuw);
    } catch (e) {
      console.error("Herhaalquiz maken mislukt", e);
      setFout(t("wedstrijd.bord.afsluiter.fout"));
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <div>
        <p className="text-xs font-bold text-slate-500 mb-1">{t("wedstrijd.bord.afsluiter.alleenJij")}</p>
        <h2 className="text-lg font-extrabold text-merk-900">{t("wedstrijd.bord.afsluiter.titel")}</h2>
      </div>

      {moeilijkst.length === 0 ? (
        <p className="text-sm text-slate-600">{t("wedstrijd.bord.afsluiter.geenFout")}</p>
      ) : (
        <ol className="space-y-2">
          {moeilijkst.map((r) => (
            <li key={r.v.bron.id} className="flex items-start gap-3 text-sm">
              <span className="font-mono font-bold text-rose-700 shrink-0 w-12">
                {Math.round((r.fout / r.antwoorden) * 100)}%
              </span>
              <span className="text-slate-800">{r.v.bron.question}</span>
            </li>
          ))}
        </ol>
      )}
      {moeilijkst.length > 0 && <p className="text-xs text-slate-500">{t("wedstrijd.bord.afsluiter.percentage")}</p>}

      {herhaal ? (
        <div className="rounded-xl bg-merk-50 border border-merk/30 p-4 text-sm text-merk-900">
          <p className="font-bold mb-1">{t("wedstrijd.bord.afsluiter.klaarTitel")}</p>
          <p>
            {tr(
              "wedstrijd.bord.afsluiter.klaarUitleg",
              {
                code: (s) => <span className="font-mono font-black">{s}</span>,
                link: (s) => (
                  <Link href={`/oefen/${herhaal.id}`} className="underline font-bold">
                    {s}
                  </Link>
                ),
              },
              { code: herhaal.shareCode }
            )}
          </p>
        </div>
      ) : (
        moeilijkst.length > 0 && (
          <button
            onClick={maakHerhaling}
            disabled={bezig}
            className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {bezig ? t("algemeen.bezig") : tn("wedstrijd.bord.afsluiter.geefMee", moeilijkst.length)}
          </button>
        )
      )}
      {fout && <p role="alert" className="text-xs font-semibold text-rose-800">{fout}</p>}

      <button
        onClick={onSluit}
        className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm"
      >
        {t("wedstrijd.bord.afsluiter.afsluiten")}
      </button>
    </div>
  );
}

/** In demomodus: deelnemers en antwoorden nabootsen zonder tweede toestel. */
function DemoSpelers({
  code,
  quiz,
  spelers,
  antwoorden,
}: {
  code: string;
  quiz: WedstrijdToestand;
  spelers: WedstrijdSpeler[];
  antwoorden: WedstrijdAntwoord[];
}) {
  const voegToe = () => {
    const apparaat = `demo-${Math.random().toString(36).slice(2, 8)}`;
    const teams = quiz.instellingen.teams;
    opslag
      .meldSpeler(code, {
        apparaat,
        bijnaam: willekeurigeBijnaam(spelers.map((s) => s.bijnaam)),
        op: new Date().toISOString(),
        ...(teams > 0 ? { team: Math.floor(Math.random() * teams) } : {}),
      })
      .catch(() => {});
  };

  const laatAntwoorden = () => {
    const aantal = quiz.vraag?.opties.length ?? 0;
    const typen = quiz.vraag?.typen;
    for (const s of spelers) {
      if (!s.apparaat.startsWith("demo-") || antwoorden.some((a) => a.apparaat === s.apparaat)) continue;
      opslag
        .stuurWedstrijdAntwoord(code, {
          apparaat: s.apparaat,
          vraagNr: quiz.vraagNr,
          ...(typen
            ? {
                tekst: [
                  t("wedstrijd.bord.demo.antwoord1"),
                  t("wedstrijd.bord.demo.antwoord2"),
                  t("wedstrijd.bord.demo.antwoord3"),
                ][Math.floor(Math.random() * 3)],
              }
            : { keuze: [Math.floor(Math.random() * aantal)] }),
          op: new Date().toISOString(),
        })
        .catch(() => {});
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
      <span className="text-xs font-bold text-slate-500 block">{t("wedstrijd.bord.demo.kop")}</span>
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={voegToe} className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-merk-50 text-slate-700 font-semibold text-xs">
          {t("wedstrijd.bord.demo.deelnemer")}
        </button>
        {quiz.fase === "vraag" && (
          <button onClick={laatAntwoorden} className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-merk-50 text-slate-700 font-semibold text-xs">
            {t("wedstrijd.bord.demo.laatAntwoorden")}
          </button>
        )}
      </div>
    </div>
  );
}
