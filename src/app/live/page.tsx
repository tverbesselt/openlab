"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Play,
  ArrowLeft,
  Presentation,
  Eye,
  EyeOff,
  Square,
  Zap,
  Gauge,
  CheckCircle2,
  Trophy,
  LayoutDashboard,
} from "lucide-react";
import QRCode from "qrcode";
import { opslag, opslagGedeeld, nieuwePincode, useMateriaal } from "@/lib/opslag";
import { useAuth, type Gebruiker } from "@/lib/auth/AuthProvider";
import {
  BordInstellingen,
  Exercise,
  LiveAntwoord,
  LiveSessie,
  LiveType,
  WedstrijdInstellingen,
} from "@/lib/types";
import { WERKVORMEN, isKlassikaal } from "@/lib/labels";
import { LeraarPoort } from "@/components/LeraarPoort";
import { Studietip } from "@/components/Studietip";
import { WedstrijdOpzet } from "@/components/wedstrijd/WedstrijdOpzet";
import { WedstrijdBord } from "@/components/wedstrijd/WedstrijdBord";
import { maakWedstrijdVragen, type WedstrijdVraag } from "@/lib/wedstrijd";
import { BordOpzet } from "@/components/bord/BordOpzet";
import { BordLeraar } from "@/components/bord/BordLeraar";
import { merkTint } from "@/lib/instellingen/kleur";
import { useInstellingen } from "@/lib/instellingen/AppProvider";
import { t, tn } from "@/lib/i18n";
import { tr } from "@/lib/i18n/rijk";

/** De drie standen van de begripsmeter. Volgorde = van goed naar kwijt. */
function begripsmeterOpties(): string[] {
  return [t("live.begripsmeter.volg"), t("live.begripsmeter.twijfel"), t("live.begripsmeter.kwijt")];
}
const BEGRIPSMETER_KLEUREN = ["bg-emerald-400", "bg-amber-400", "bg-rose-400"];

/** Letters voor de snelle vraag: de leraar zegt de vraag, het bord toont alleen de keuzes. */
const LETTERS = ["A", "B", "C", "D"];

function LiveInhoud() {
  const searchParams = useSearchParams();
  const oefeningId = searchParams.get("oefening");
  const wedstrijdId = searchParams.get("wedstrijd");
  const { gebruiker, isLeraar } = useAuth();
  const { isAan } = useInstellingen();
  const { oefeningen: exercises, laden } = useMateriaal();

  const [gekozen, setGekozen] = useState<Exercise | null>(null);
  const [opzet, setOpzet] = useState<"snellevraag" | "bord" | null>(null);
  const [sessie, setSessie] = useState<LiveSessie | null>(null);
  const [fout, setFout] = useState("");
  const [bezig, setBezig] = useState(false);
  // Quizwedstrijd: eerst een quiz kiezen en instellen, dan loopt ze met gehusselde vragen.
  const [wedstrijdKeuze, setWedstrijdKeuze] = useState<Exercise | null>(null);
  const [wedstrijd, setWedstrijd] = useState<{ oefening: Exercise; vragen: WedstrijdVraag[] } | null>(null);

  useEffect(() => {
    if (oefeningId && !gekozen) {
      setGekozen(exercises.find((ex) => ex.id === oefeningId) ?? null);
    }
  }, [oefeningId, exercises, gekozen]);

  // /live?wedstrijd=<id> opent meteen de instellingen voor die quiz.
  useEffect(() => {
    if (wedstrijdId && !wedstrijdKeuze && isAan("wedstrijd")) {
      setWedstrijdKeuze(exercises.find((ex) => ex.id === wedstrijdId && ex.type === "quiz") ?? null);
    }
  }, [wedstrijdId, exercises, wedstrijdKeuze]);

  const klassikaal = exercises.filter(isKlassikaal);
  const quizzen = exercises.filter((ex) => ex.type === "quiz" && (ex.content.questions?.length ?? 0) > 0);

  const start = async (nieuw: LiveSessie) => {
    if (bezig) return;
    setBezig(true);
    setFout("");
    try {
      await opslag.startSessie(nieuw);
      setSessie(nieuw);
    } catch {
      setFout(t("live.keuze.startMislukt"));
    } finally {
      setBezig(false);
    }
  };

  const basisSessie = (
    persoon: Gebruiker,
    type: LiveType,
    velden: Partial<LiveSessie>
  ): LiveSessie => ({
    code: nieuwePincode(),
    hostId: persoon.id,
    hostNaam: persoon.naam,
    titel: "",
    type,
    vraag: "",
    opties: [],
    status: "actief",
    toonResultaten: true,
    gestartOp: new Date().toISOString(),
    ...velden,
  });

  const startMateriaal = (ex: Exercise) => {
    if (!gebruiker) return;
    start(
      basisSessie(gebruiker, ex.type === "wordcloud" ? "wordcloud" : "poll", {
        oefeningId: ex.id,
        titel: ex.title,
        vraag: ex.content.pollQuestion ?? ex.content.wordCloudPrompt ?? ex.title,
        opties: ex.type === "poll" ? (ex.content.pollOptions ?? []) : [],
      })
    );
  };

  const startSnelleVraag = (vraag: string, aantal: number) => {
    if (!gebruiker) return;
    start(
      basisSessie(gebruiker, "snellevraag", {
        titel: t("live.keuze.snelleVraag.titel"),
        vraag: vraag.trim() || t("live.keuze.snelleVraag.standaardVraag"),
        opties: LETTERS.slice(0, aantal),
      })
    );
  };

  const startWedstrijd = async (instellingen: WedstrijdInstellingen) => {
    if (!gebruiker || !wedstrijdKeuze) return;
    const vragen = maakWedstrijdVragen(wedstrijdKeuze.content.questions ?? []);
    setWedstrijd({ oefening: wedstrijdKeuze, vragen });
    await start(
      basisSessie(gebruiker, "quiz", {
        oefeningId: wedstrijdKeuze.id,
        titel: wedstrijdKeuze.title,
        vraag: wedstrijdKeuze.title,
        quiz: { fase: "wachtruimte", vraagNr: -1, aantalVragen: vragen.length, instellingen },
      })
    );
  };

  const startBord = (opdracht: string, instellingen: BordInstellingen) => {
    if (!gebruiker) return;
    start(
      basisSessie(gebruiker, "bord", {
        titel: t("live.keuze.bord.titel"),
        vraag: opdracht,
        bord: instellingen,
      })
    );
  };

  const startBegripsmeter = () => {
    if (!gebruiker) return;
    start(
      basisSessie(gebruiker, "begripsmeter", {
        titel: t("live.keuze.begripsmeter.titel"),
        vraag: t("live.keuze.begripsmeter.vraag"),
        opties: begripsmeterOpties(),
      })
    );
  };

  if (laden) return <div className="h-64" aria-hidden />;

  if (!isLeraar) {
    return (
      <LeraarPoort uitleg={t("live.keuze.poort")} />
    );
  }

  if (sessie?.type === "quiz" && wedstrijd) {
    return (
      <WedstrijdBord
        sessie={sessie}
        oefening={wedstrijd.oefening}
        vragen={wedstrijd.vragen}
        onStop={() => {
          setSessie(null);
          setWedstrijd(null);
          setWedstrijdKeuze(null);
        }}
      />
    );
  }

  if (sessie?.type === "bord") {
    return (
      <BordLeraar
        sessie={sessie}
        onStop={() => {
          setSessie(null);
          setOpzet(null);
        }}
      />
    );
  }

  if (sessie) {
    return (
      <Projectiescherm
        sessie={sessie}
        onStop={() => {
          // Terug naar het keuzescherm, niet naar het opzetformulier van daarnet.
          setSessie(null);
          setOpzet(null);
          setGekozen(null);
        }}
      />
    );
  }

  /* ── Keuzescherm ──────────────────────────────────────────────────────── */
  return (
    <div className="max-w-3xl mx-auto space-y-8 u-fade">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-merk-900 tracking-tight mb-1">
          {t("live.keuze.titel")}
        </h1>
        <p className="text-sm text-slate-600">
          {t("live.keuze.intro")}
        </p>
      </div>

      <Studietip plek="live" />

      {!opslagGedeeld && (
        <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          {tr("live.keuze.demo", { b: (inhoud) => <strong>{inhoud}</strong> })}
        </p>
      )}

      {fout && (
        <p role="alert" className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          {fout}
        </p>
      )}

      {wedstrijdKeuze ? (
        <WedstrijdOpzet
          oefening={wedstrijdKeuze}
          bezig={bezig}
          onStart={startWedstrijd}
          onAnnuleer={() => setWedstrijdKeuze(null)}
        />
      ) : gekozen ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-xs font-bold text-slate-500 mb-1">{WERKVORMEN[gekozen.type].label}</p>
          <h2 className="font-bold text-lg text-merk-900 mb-2">{gekozen.title}</h2>
          <p className="text-sm text-slate-600 mb-5">
            {gekozen.content.pollQuestion ?? gekozen.content.wordCloudPrompt ?? gekozen.title}
          </p>

          <button
            onClick={() => startMateriaal(gekozen)}
            disabled={bezig}
            className="w-full py-3.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-60 text-white font-bold text-base transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{bezig ? t("live.keuze.sessieStarten") : t("live.keuze.toonOpBord")}</span>
          </button>

          <button
            onClick={() => setGekozen(null)}
            className="mt-3 text-xs font-bold text-slate-500 hover:text-merk-900 flex items-center gap-1 mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("live.keuze.kiesIetsAnders")}</span>
          </button>
        </div>
      ) : (
        <>
          {/* Zonder voorbereiding: het meest gebruikte deel, dus bovenaan */}
          {(isAan("snellevraag") || isAan("begripsmeter") || isAan("bord")) && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600 mb-1">
              {t("live.keuze.zonderVoorbereiding.titel")}
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              {t("live.keuze.zonderVoorbereiding.uitleg")}
            </p>

            {opzet === "snellevraag" ? (
              <SnelleVraagOpzet
                bezig={bezig}
                onStart={startSnelleVraag}
                onAnnuleer={() => setOpzet(null)}
              />
            ) : opzet === "bord" ? (
              <BordOpzet bezig={bezig} onStart={startBord} onAnnuleer={() => setOpzet(null)} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {isAan("snellevraag") && (
                <SnelStartKnop
                  icon={Zap}
                  titel={t("live.keuze.snelleVraag.titel")}
                  uitleg={t("live.keuze.snelleVraag.uitleg")}
                  onClick={() => setOpzet("snellevraag")}
                />
                )}
                {isAan("begripsmeter") && (
                <SnelStartKnop
                  icon={Gauge}
                  titel={t("live.keuze.begripsmeter.titel")}
                  uitleg={t("live.keuze.begripsmeter.uitleg")}
                  onClick={startBegripsmeter}
                  bezig={bezig}
                />
                )}
                {isAan("bord") && (
                <SnelStartKnop
                  icon={LayoutDashboard}
                  titel={t("live.keuze.bord.titel")}
                  uitleg={t("live.keuze.bord.uitleg")}
                  onClick={() => setOpzet("bord")}
                />
                )}
              </div>
            )}
          </section>
          )}

          {/* Quizwedstrijd: een Eenvoudige quiz, maar klassikaal en met punten */}
          {isAan("wedstrijd") && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600 mb-1">
              {t("live.keuze.wedstrijd.titel")}
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              {t("live.keuze.wedstrijd.uitleg")}
            </p>
            {quizzen.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
                <p className="text-sm text-slate-600 mb-4">{t("live.keuze.wedstrijd.geenQuiz")}</p>
                <Link
                  href="/maken?vorm=quiz"
                  className="inline-flex px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
                >
                  {t("live.keuze.wedstrijd.maakQuiz")}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {quizzen.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => setWedstrijdKeuze(ex)}
                    className="w-full text-left flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 hover:border-merk transition-colors"
                  >
                    <span className="w-10 h-10 shrink-0 rounded-xl bg-merk-50 text-merk-900 flex items-center justify-center border border-merk/20">
                      <Trophy className="w-5 h-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-900">{ex.title}</span>
                      <span className="block text-xs text-slate-500">
                        {tn("live.keuze.wedstrijd.regel", ex.content.questions?.length ?? 0, { maker: ex.creatorName })}
                      </span>
                    </span>
                    <Play className="w-4 h-4 text-merk shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </section>
          )}

          {/* Uit je materiaal */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600 mb-3">
              {t("live.keuze.materiaal.titel")}
            </h2>

            {klassikaal.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <p className="text-sm text-slate-600 mb-4">
                  {t("live.keuze.materiaal.leeg")}
                </p>
                <Link
                  href="/maken"
                  className="inline-flex px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
                >
                  {t("live.keuze.materiaal.nieuw")}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {klassikaal.map((ex) => {
                  const Icon = WERKVORMEN[ex.type].icon;
                  return (
                    <button
                      key={ex.id}
                      onClick={() => setGekozen(ex)}
                      className="w-full text-left flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 hover:border-merk transition-colors"
                    >
                      <span className="w-10 h-10 shrink-0 rounded-xl bg-merk-50 text-merk-900 flex items-center justify-center border border-merk/20">
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-slate-900">{ex.title}</span>
                        <span className="block text-xs text-slate-500">
                          {WERKVORMEN[ex.type].label} · {ex.creatorName}
                        </span>
                      </span>
                      <Presentation className="w-4 h-4 text-merk shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function SnelStartKnop({
  icon: Icon,
  titel,
  uitleg,
  onClick,
  bezig,
}: {
  icon: React.ElementType;
  titel: string;
  uitleg: string;
  onClick: () => void;
  bezig?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={bezig}
      className="text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-merk disabled:opacity-60 transition-colors"
    >
      <span className="w-10 h-10 rounded-xl bg-merk-50 text-merk-900 flex items-center justify-center border border-merk/20 mb-3">
        <Icon className="w-5 h-5" />
      </span>
      <span className="block text-base font-bold text-slate-900 mb-1">{titel}</span>
      <span className="block text-xs text-slate-600 leading-relaxed">{uitleg}</span>
    </button>
  );
}

/** Twee keuzes voor de leraar: waarover gaat het, en hoeveel antwoordmogelijkheden. */
function SnelleVraagOpzet({
  bezig,
  onStart,
  onAnnuleer,
}: {
  bezig: boolean;
  onStart: (vraag: string, aantal: number) => void;
  onAnnuleer: () => void;
}) {
  const [vraag, setVraag] = useState("");
  const [aantal, setAantal] = useState(4);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onStart(vraag, aantal);
      }}
      className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5"
    >
      <label className="block">
        <span className="block text-sm font-bold text-slate-800 mb-1">
          {t("live.snelleVraag.vraagLabel")}{" "}
          <span className="font-normal text-slate-500">{t("live.snelleVraag.magLeeg")}</span>
        </span>
        <span className="block text-xs text-slate-500 mb-2">
          {t("live.snelleVraag.vraagUitleg")}
        </span>
        <input
          type="text"
          value={vraag}
          onChange={(e) => setVraag(e.target.value)}
          placeholder={t("live.snelleVraag.voorbeeld")}
          className="w-full p-3 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
        />
      </label>

      <div>
        <span className="block text-sm font-bold text-slate-800 mb-2">
          {t("live.snelleVraag.aantalLabel")}
        </span>
        <div className="flex gap-2">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setAantal(n)}
              aria-pressed={aantal === n}
              className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-colors ${
                aantal === n
                  ? "bg-merk-800 text-white border-merk-800"
                  : "bg-white text-slate-700 border-slate-200 hover:border-merk"
              }`}
            >
              {LETTERS.slice(0, n).join(" ")}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={bezig}
        className="w-full py-3.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-60 text-white font-bold text-base transition-colors flex items-center justify-center gap-2"
      >
        <Play className="w-5 h-5 fill-current" />
        <span>{bezig ? t("live.keuze.sessieStarten") : t("live.keuze.toonOpBord")}</span>
      </button>

      <button
        type="button"
        onClick={onAnnuleer}
        className="text-xs font-bold text-slate-500 hover:text-merk-900 flex items-center gap-1 mx-auto"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t("algemeen.terug")}</span>
      </button>
    </form>
  );
}

/* ── Projectiescherm ─────────────────────────────────────────────────────── */

function Projectiescherm({ sessie: begin, onStop }: { sessie: LiveSessie; onStop: () => void }) {
  const [sessie, setSessie] = useState<LiveSessie>(begin);
  const [antwoorden, setAntwoorden] = useState<LiveAntwoord[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
  const [fout, setFout] = useState("");

  useEffect(() => {
    const url = `${window.location.origin}/live/join?code=${begin.code}`;
    setJoinUrl(url);
    QRCode.toDataURL(url, {
      width: 250,
      margin: 2,
      color: { dark: merkTint("900"), light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [begin.code]);

  useEffect(() => {
    const stopSessie = opslag.volgSessie(begin.code, (s) => s && setSessie(s));
    const stopAntwoorden = opslag.volgAntwoorden(begin.code, setAntwoorden);
    return () => {
      stopSessie();
      stopAntwoorden();
    };
  }, [begin.code]);

  const wijzig = async (wijziging: Partial<LiveSessie>) => {
    try {
      await opslag.wijzigSessie(sessie.code, wijziging);
      setSessie({ ...sessie, ...wijziging });
      setFout("");
    } catch {
      setFout(t("live.projectie.mislukt"));
    }
  };

  const sluitAf = async () => {
    await wijzig({ status: "afgesloten" });
    onStop();
  };

  const stemmen = useMemo(() => {
    const telling = new Array(sessie.opties.length).fill(0) as number[];
    for (const a of antwoorden) {
      if (typeof a.optie === "number" && a.optie >= 0 && a.optie < telling.length) telling[a.optie]++;
    }
    return telling;
  }, [antwoorden, sessie.opties.length]);

  const woorden = useMemo(() => {
    const telling = new Map<string, number>();
    for (const a of antwoorden) {
      const w = a.woord?.trim().toLowerCase();
      if (w) telling.set(w, (telling.get(w) ?? 0) + 1);
    }
    return [...telling.entries()].sort((a, b) => b[1] - a[1]);
  }, [antwoorden]);

  const totaal = antwoorden.length;
  const pincode = `${sessie.code.slice(0, 3)} ${sessie.code.slice(3)}`;
  const isMeter = sessie.type === "begripsmeter";
  const isSnel = sessie.type === "snellevraag";

  return (
    <div className="max-w-4xl mx-auto space-y-4 u-fade">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={sluitAf}
          className="text-xs font-bold text-slate-500 hover:text-merk-900 flex items-center gap-1"
        >
          <Square className="w-3.5 h-3.5" />
          <span>{t("live.projectie.afsluiten")}</span>
        </button>

        <button
          onClick={() => wijzig({ toonResultaten: !sessie.toonResultaten })}
          className="text-xs font-bold text-slate-500 hover:text-merk-900 flex items-center gap-1"
        >
          {sessie.toonResultaten ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>
            {sessie.toonResultaten
              ? t("live.projectie.verberg")
              : t("live.projectie.toon")}
          </span>
        </button>
      </div>

      {fout && (
        <p role="alert" className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          {fout}
        </p>
      )}

      <div className="bg-merk-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 pb-6 border-b border-white/20">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-white/70 block mb-2">
              {t("live.projectie.scan")}
            </span>
            <h1 className="text-xl sm:text-3xl font-extrabold leading-snug">{sessie.vraag}</h1>
          </div>

          <div className="bg-white text-merk-900 p-4 rounded-2xl flex flex-col items-center shrink-0">
            {qrDataUrl && (
              <img src={qrDataUrl} alt={t("live.projectie.qrAlt")} className="w-32 h-32 rounded-lg mb-2" />
            )}
            <span className="text-[11px] font-semibold text-slate-500">{t("live.projectie.pincode")}</span>
            <span className="font-mono text-xl font-black tracking-widest">{pincode}</span>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between gap-3 text-xs text-white/80">
          <span className="flex items-center gap-2 font-bold bg-white/10 px-3 py-1.5 rounded-full">
            <Users className="w-4 h-4" />
            <span>
              {totaal === 0
                ? t("live.projectie.wachten")
                : isMeter
                  ? tn("live.projectie.cursisten", totaal)
                  : tn("live.projectie.antwoorden", totaal)}
            </span>
          </span>
          <span className="truncate">{joinUrl.replace(/^https?:\/\//, "")}</span>
        </div>

        {sessie.type === "wordcloud" ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 min-h-32">
            {woorden.length === 0 ? (
              <span className="text-sm text-white/60">{t("live.projectie.woordenLeeg")}</span>
            ) : (
              woorden.map(([woord, n]) => {
                const max = woorden[0][1];
                const grootte = 1 + (n / max) * 1.6;
                return (
                  <span
                    key={woord}
                    style={{ fontSize: `${grootte}rem` }}
                    className="font-extrabold leading-none transition-all"
                    title={tn("live.projectie.keer", n)}
                  >
                    {woord}
                  </span>
                );
              })
            )}
          </div>
        ) : isMeter ? (
          <Begripsmeter stemmen={stemmen} totaal={totaal} />
        ) : (
          <div className="mt-8 space-y-4">
            {sessie.opties.map((optie, idx) => {
              const pct = totaal > 0 ? Math.round((stemmen[idx] / totaal) * 100) : 0;
              const isJuist = sessie.juisteOptie === idx;
              const isAangeduid = typeof sessie.juisteOptie === "number";

              const balk = (
                <>
                  <div className="flex items-center justify-between text-sm sm:text-base font-semibold">
                    <span className="flex items-center gap-2">
                      {isSnel && (
                        <span className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center font-black text-sm shrink-0">
                          {optie}
                        </span>
                      )}
                      {!isSnel && <span>{optie}</span>}
                      {isJuist && <CheckCircle2 className="w-5 h-5 text-emerald-300" />}
                    </span>
                    <span className="font-mono">
                      {stemmen[idx]} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-4 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isJuist ? "bg-emerald-400" : isAangeduid ? "bg-white/40" : "bg-merk"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </>
              );

              // Bij een snelle vraag kan de leraar achteraf aanduiden wat juist was, zodat
              // de bespreking meteen zichtbaar wordt op het bord.
              return isSnel ? (
                <button
                  key={idx}
                  onClick={() => wijzig({ juisteOptie: isJuist ? undefined : idx })}
                  className="w-full space-y-1.5 text-left rounded-xl p-1 -m-1 hover:bg-white/5 transition-colors"
                  title={isJuist ? t("live.projectie.nietMeerJuist") : t("live.projectie.toonJuist")}
                >
                  {balk}
                </button>
              ) : (
                <div key={idx} className="space-y-1.5">
                  {balk}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isSnel && (
        <p className="text-xs text-slate-500 text-center">
          {t("live.projectie.klikBalk")}
        </p>
      )}

      {isMeter && (
        <p className="text-xs text-slate-500 text-center">
          {t("live.projectie.meterUitleg")}
        </p>
      )}

      {!opslagGedeeld && <DemoStemmen sessie={sessie} />}
    </div>
  );
}

/** Drie kleuren naast elkaar: in één oogopslag zie je of de klas nog mee is. */
function Begripsmeter({ stemmen, totaal }: { stemmen: number[]; totaal: number }) {
  const opties = begripsmeterOpties();
  return (
    <div className="mt-8">
      <div className="flex h-24 rounded-2xl overflow-hidden bg-white/10">
        {opties.map((label, idx) => {
          const pct = totaal > 0 ? (stemmen[idx] / totaal) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={label}
              style={{ width: `${pct}%` }}
              className={`${BEGRIPSMETER_KLEUREN[idx]} flex items-center justify-center transition-all duration-500`}
              title={t("live.begripsmeter.telling", { label, n: stemmen[idx] })}
            >
              <span className="text-merk-900 font-black text-2xl">{stemmen[idx]}</span>
            </div>
          );
        })}
        {totaal === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-sm text-white/60">{t("live.begripsmeter.niemand")}</span>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {opties.map((label, idx) => (
          <div key={label} className="flex items-center gap-2 text-sm">
            <span className={`w-3 h-3 rounded-full ${BEGRIPSMETER_KLEUREN[idx]} shrink-0`} />
            <span className="font-semibold">{label}</span>
            <span className="font-mono text-white/70 ml-auto">{stemmen[idx]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** In demomodus: antwoorden nabootsen zonder tweede toestel. */
function DemoStemmen({ sessie }: { sessie: LiveSessie }) {
  const [woord, setWoord] = useState("");

  const stuur = (antwoord: Partial<LiveAntwoord>) =>
    opslag
      .stuurAntwoord(sessie.code, {
        apparaat: `demo-${Math.random().toString(36).slice(2, 8)}`,
        op: new Date().toISOString(),
        ...antwoord,
      })
      .catch(() => {});

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
      <span className="text-xs font-bold text-slate-500 block">{t("live.demo.titel")}</span>
      {sessie.type === "wordcloud" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (woord.trim()) stuur({ woord: woord.trim() });
            setWoord("");
          }}
          className="flex gap-2 justify-center"
        >
          <input
            value={woord}
            onChange={(e) => setWoord(e.target.value)}
            placeholder={t("live.demo.woord")}
            className="px-3 py-1.5 text-sm rounded-xl bg-slate-50 border border-slate-200"
          />
          <button className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs">
            {t("live.demo.stuur")}
          </button>
        </form>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">
          {sessie.opties.map((optie, idx) => (
            <button
              key={idx}
              onClick={() => stuur({ optie: idx })}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-merk-50 text-slate-700 font-semibold text-xs transition-colors"
            >
              + {optie}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LivePagina() {
  return (
    <Suspense fallback={<div className="h-64" aria-hidden />}>
      <LiveInhoud />
    </Suspense>
  );
}
