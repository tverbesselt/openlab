"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Exercise, QuizQuestion, Rekensoort } from "@/lib/types";
import { leesProcedures, leesSorteerItems, leesWerkwoorden, leesZinnen } from "@/lib/invoer";
import { REKENTYPES } from "@/lib/rekenen";
import { Veld, Foutmelding, MaakKnop, Toelichting, FeedbackKiezer, INVOER, INVOER_MONO } from "./Velden";
import { t, tn } from "@/lib/i18n";
import { tr } from "@/lib/i18n/rijk";

/**
 * De maakformulieren van de werkvormen uit ronde 3. Ze delen allemaal dezelfde vorm:
 * titel, inhoud, bestemming, knop. Zo hoeft een leraar maar één keer te leren hoe het werkt.
 */
export interface VormProps {
  /** De velden die elke oefening deelt: maker, zichtbaarheid, code, datum. */
  basis: () => Pick<
    Exercise,
    "creatorName" | "creatorId" | "visibility" | "shareCode" | "createdAt"
  >;
  bezig: boolean;
  fout: string;
  setFout: (tekst: string) => void;
  bewaar: (nieuwe: Exercise[]) => void;
  /** De gedeelde blokken onderaan: wie mag dit zien, en in welke map. */
  bestemming: React.ReactNode;
  /** Taal van de voorleesknop, gekozen bovenaan het formulier. */
  spraakTaal: string;
  taalKiezer: React.ReactNode;
}

const OEFEN_CONFIG = {
  showImmediateFeedback: true,
  allowRetryMissed: true,
  enableGamification: false,
};

/* ── Zinnen bouwen ───────────────────────────────────────────────────────── */

export function ZinbouwenVorm(p: VormProps) {
  const [titel, setTitel] = useState("");
  const [zinnen, setZinnen] = useState("");

  const gelezen = leesZinnen(zinnen);

  const maak = (e: React.FormEvent) => {
    e.preventDefault();
    if (gelezen.length === 0) {
      p.setFout(t("makenvormen.zinbouwen.fout"));
      return;
    }
    p.bewaar([
      {
        ...p.basis(),
        id: `zin-${Date.now()}`,
        title: titel.trim(),
        description: t("makenvormen.zinbouwen.beschrijving"),
        category: "language",
        didacticGoal: "automate",
        type: "zinbouwen",
        tags: [t("makenvormen.zinbouwen.tag")],
        content: { ordenItems: gelezen },
        didacticConfig: { ...OEFEN_CONFIG, spraakTaal: p.spraakTaal },
      },
    ]);
  };

  return (
    <form onSubmit={maak} className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5">
      <Veld label={t("makenvormen.gedeeld.waarover")} hint={t("makenvormen.zinbouwen.titelHint")}>
        <input
          type="text"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder={t("makenvormen.gedeeld.titelLabel")}
          required
          className={INVOER}
        />
      </Veld>

      <Veld label={t("makenvormen.zinbouwen.label")} hint={t("makenvormen.zinbouwen.hint")}>
        <textarea
          rows={6}
          value={zinnen}
          onChange={(e) => setZinnen(e.target.value)}
          placeholder={t("makenvormen.zinbouwen.voorbeeld")}
          required
          className={INVOER_MONO}
        />
      </Veld>

      <Toelichting>
        {t("makenvormen.zinbouwen.toelichting")}{" "}
        {gelezen.length > 0 && <strong>{tn("makenvormen.zinbouwen.klaar", gelezen.length)}</strong>}
      </Toelichting>

      {p.taalKiezer}
      {p.bestemming}
      <Foutmelding tekst={p.fout} />
      <MaakKnop bezig={p.bezig} label={t("makenvormen.zinbouwen.knop")} />
    </form>
  );
}

/* ── Stappen op volgorde ─────────────────────────────────────────────────── */

export function VolgordeVorm(p: VormProps) {
  const [titel, setTitel] = useState("");
  const [procedures, setProcedures] = useState("");

  const gelezen = leesProcedures(procedures);

  const maak = (e: React.FormEvent) => {
    e.preventDefault();
    if (gelezen.length === 0) {
      p.setFout(t("makenvormen.volgorde.fout"));
      return;
    }
    p.bewaar([
      {
        ...p.basis(),
        id: `volg-${Date.now()}`,
        title: titel.trim(),
        description: t("makenvormen.volgorde.beschrijving"),
        category: "practice",
        didacticGoal: "automate",
        type: "volgorde",
        tags: [t("makenvormen.volgorde.tag")],
        content: { ordenItems: gelezen },
        didacticConfig: OEFEN_CONFIG,
      },
    ]);
  };

  return (
    <form onSubmit={maak} className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5">
      <Veld label={t("makenvormen.gedeeld.waarover")} hint={t("makenvormen.volgorde.titelHint")}>
        <input
          type="text"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder={t("makenvormen.gedeeld.titelLabel")}
          required
          className={INVOER}
        />
      </Veld>

      <Veld
        label={t("makenvormen.volgorde.label")}
        hint={t("makenvormen.volgorde.hint")}
      >
        <textarea
          rows={6}
          value={procedures}
          onChange={(e) => setProcedures(e.target.value)}
          placeholder={t("makenvormen.volgorde.voorbeeld")}
          required
          className={INVOER_MONO}
        />
      </Veld>

      <Toelichting>
        {t("makenvormen.volgorde.toelichting")}{" "}
        {gelezen.length > 0 && <strong>{tn("makenvormen.volgorde.klaar", gelezen.length)}</strong>}
      </Toelichting>

      {p.bestemming}
      <Foutmelding tekst={p.fout} />
      <MaakKnop bezig={p.bezig} label={t("makenvormen.volgorde.knop")} />
    </form>
  );
}

/* ── Sorteren ────────────────────────────────────────────────────────────── */

export function SorterenVorm(p: VormProps) {
  const [titel, setTitel] = useState("");
  const [bakjes, setBakjes] = useState([
    { naam: "", items: "" },
    { naam: "", items: "" },
  ]);

  const wijzig = (index: number, veld: "naam" | "items", waarde: string) =>
    setBakjes(bakjes.map((b, i) => (i === index ? { ...b, [veld]: waarde } : b)));

  const gevuld = bakjes.filter((b) => b.naam.trim() && b.items.trim());

  const maak = (e: React.FormEvent) => {
    e.preventDefault();
    if (gevuld.length < 2) {
      p.setFout(t("makenvormen.sorteren.fout"));
      return;
    }

    const categorieen = gevuld.map((b) => b.naam.trim());
    let teller = 0;
    const sorteerItems = gevuld.flatMap((bakje, index) => {
      const items = leesSorteerItems([bakje.items], index, teller);
      teller += items.length;
      return items;
    });

    if (sorteerItems.length === 0) {
      p.setFout(t("makenvormen.sorteren.geenItems"));
      return;
    }

    p.bewaar([
      {
        ...p.basis(),
        id: `sort-${Date.now()}`,
        title: titel.trim(),
        description: t("makenvormen.sorteren.beschrijving"),
        category: "practice",
        didacticGoal: "automate",
        type: "sorteren",
        tags: [t("makenvormen.sorteren.tag")],
        content: { categorieen, sorteerItems },
        didacticConfig: OEFEN_CONFIG,
      },
    ]);
  };

  return (
    <form onSubmit={maak} className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5">
      <Veld label={t("makenvormen.gedeeld.waarover")} hint={t("makenvormen.sorteren.titelHint")}>
        <input
          type="text"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder={t("makenvormen.gedeeld.titelLabel")}
          required
          className={INVOER}
        />
      </Veld>

      <div className="space-y-4">
        {bakjes.map((bakje, index) => (
          <div key={index} className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-500">{t("makenvormen.sorteren.bakje", { n: index + 1 })}</span>
              {bakjes.length > 2 && (
                <button
                  type="button"
                  onClick={() => setBakjes(bakjes.filter((_, i) => i !== index))}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                  aria-label={t("makenvormen.sorteren.verwijder", { n: index + 1 })}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <input
              type="text"
              value={bakje.naam}
              onChange={(e) => wijzig(index, "naam", e.target.value)}
              placeholder={
                index === 0
                  ? t("makenvormen.sorteren.naam1")
                  : index === 1
                    ? t("makenvormen.sorteren.naam2")
                    : t("makenvormen.sorteren.naamPlaceholder")
              }
              aria-label={t("makenvormen.sorteren.naamLabel", { n: index + 1 })}
              className={INVOER}
            />

            <textarea
              rows={4}
              value={bakje.items}
              onChange={(e) => wijzig(index, "items", e.target.value)}
              placeholder={
                index === 0
                  ? t("makenvormen.sorteren.items1")
                  : index === 1
                    ? t("makenvormen.sorteren.items2")
                    : t("makenvormen.sorteren.itemsPlaceholder")
              }
              aria-label={t("makenvormen.sorteren.itemsLabel", { n: index + 1 })}
              className={INVOER_MONO}
            />
          </div>
        ))}
      </div>

      {bakjes.length < 4 && (
        <button
          type="button"
          onClick={() => setBakjes([...bakjes, { naam: "", items: "" }])}
          className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:border-merk hover:text-merk-900 font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{t("makenvormen.sorteren.nogEen")}</span>
        </button>
      )}

      <Toelichting>
        {t("makenvormen.sorteren.toelichting")}
      </Toelichting>

      {p.bestemming}
      <Foutmelding tekst={p.fout} />
      <MaakKnop bezig={p.bezig} label={t("makenvormen.sorteren.knop")} />
    </form>
  );
}

/* ── Open vraag ──────────────────────────────────────────────────────────── */

interface NieuweOpenVraag {
  vraag: string;
  modelantwoord: string;
}

const LEEG_OPEN: NieuweOpenVraag = { vraag: "", modelantwoord: "" };

export function OpenVraagVorm(p: VormProps) {
  const [titel, setTitel] = useState("");
  const [vragen, setVragen] = useState<NieuweOpenVraag[]>([{ ...LEEG_OPEN }]);

  const wijzig = (index: number, veld: keyof NieuweOpenVraag, waarde: string) =>
    setVragen(vragen.map((v, i) => (i === index ? { ...v, [veld]: waarde } : v)));

  const maak = (e: React.FormEvent) => {
    e.preventDefault();
    const bruikbaar = vragen.filter((v) => v.vraag.trim() && v.modelantwoord.trim());
    if (bruikbaar.length === 0) {
      p.setFout(t("makenvormen.openvraag.fout"));
      return;
    }

    p.bewaar([
      {
        ...p.basis(),
        id: `open-${Date.now()}`,
        title: titel.trim(),
        description: t("makenvormen.openvraag.beschrijving"),
        category: "practice",
        didacticGoal: "check",
        type: "openvraag",
        tags: [t("makenvormen.openvraag.tag")],
        content: {
          openVragen: bruikbaar.map((v, index) => ({
            id: `ov-${index}`,
            vraag: v.vraag.trim(),
            modelantwoord: v.modelantwoord.trim(),
          })),
        },
        didacticConfig: OEFEN_CONFIG,
      },
    ]);
  };

  return (
    <form onSubmit={maak} className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5">
      <Veld label={t("makenvormen.gedeeld.titelLabel")} hint={t("makenvormen.openvraag.titelHint")}>
        <input
          type="text"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder={t("makenvormen.gedeeld.titelLabel")}
          required
          className={INVOER}
        />
      </Veld>

      {vragen.map((vraag, index) => (
        <div key={index} className="rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t("makenvormen.gedeeld.vraagNr", { n: index + 1 })}</span>
            {vragen.length > 1 && (
              <button
                type="button"
                onClick={() => setVragen(vragen.filter((_, i) => i !== index))}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                aria-label={t("makenvormen.gedeeld.verwijderVraag", { n: index + 1 })}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <input
            type="text"
            value={vraag.vraag}
            onChange={(e) => wijzig(index, "vraag", e.target.value)}
            placeholder={t("makenvormen.openvraag.vraagPlaceholder")}
            required
            className={INVOER}
          />

          <textarea
            rows={3}
            value={vraag.modelantwoord}
            onChange={(e) => wijzig(index, "modelantwoord", e.target.value)}
            placeholder={t("makenvormen.openvraag.modelPlaceholder")}
            required
            aria-label={t("makenvormen.openvraag.modelLabel", { n: index + 1 })}
            className={INVOER}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => setVragen([...vragen, { ...LEEG_OPEN }])}
        className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:border-merk hover:text-merk-900 font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
      >
        <Plus className="w-4 h-4" />
        <span>{t("makenvormen.gedeeld.nogEenVraag")}</span>
      </button>

      <Toelichting>
        {t("makenvormen.openvraag.toelichting")}
      </Toelichting>

      {p.bestemming}
      <Foutmelding tekst={p.fout} />
      <MaakKnop bezig={p.bezig} label={t("makenvormen.openvraag.knop")} />
    </form>
  );
}

/* ── Lezen met vragen ────────────────────────────────────────────────────── */

interface NieuweLeesVraag {
  vraag: string;
  juist: string;
  fout1: string;
  fout2: string;
  uitleg: string;
}

const LEEG_LEES: NieuweLeesVraag = { vraag: "", juist: "", fout1: "", fout2: "", uitleg: "" };

export function LezenVorm(p: VormProps) {
  const [titel, setTitel] = useState("");
  const [tekst, setTekst] = useState("");
  const [vragen, setVragen] = useState<NieuweLeesVraag[]>([{ ...LEEG_LEES }]);
  const [tweedeKans, setTweedeKans] = useState(true);

  const wijzig = (index: number, veld: keyof NieuweLeesVraag, waarde: string) =>
    setVragen(vragen.map((v, i) => (i === index ? { ...v, [veld]: waarde } : v)));

  const woorden = tekst.trim() ? tekst.trim().split(/\s+/).length : 0;

  const maak = (e: React.FormEvent) => {
    e.preventDefault();
    const bruikbaar = vragen.filter((v) => v.vraag.trim() && v.juist.trim());
    if (!tekst.trim() || bruikbaar.length === 0) {
      p.setFout(t("makenvormen.lezen.fout"));
      return;
    }

    const questions: QuizQuestion[] = bruikbaar.map((v, index) => {
      const opties = [v.juist, v.fout1, v.fout2].map((o) => o.trim()).filter(Boolean);
      return {
        id: `lv-${index}`,
        question: v.vraag.trim(),
        options: opties,
        correctAnswers: [0],
        type: "multiple_choice",
        explanation: v.uitleg.trim() || t("makenvormen.lezen.uitlegStandaard", { antwoord: v.juist.trim() }),
      };
    });

    p.bewaar([
      {
        ...p.basis(),
        id: `lees-${Date.now()}`,
        title: titel.trim(),
        description: t("makenvormen.lezen.beschrijving"),
        category: "language",
        didacticGoal: "check",
        type: "lezen",
        tags: [t("makenvormen.lezen.tagLezen"), t("makenvormen.lezen.tagBegrijpend")],
        content: { leestekst: tekst.trim(), questions },
        didacticConfig: { ...OEFEN_CONFIG, spraakTaal: p.spraakTaal, tweedeKans },
      },
    ]);
  };

  return (
    <form onSubmit={maak} className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5">
      <Veld label={t("makenvormen.gedeeld.titelLabel")} hint={t("makenvormen.lezen.titelHint")}>
        <input
          type="text"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder={t("makenvormen.gedeeld.titelLabel")}
          required
          className={INVOER}
        />
      </Veld>

      <Veld
        label={t("makenvormen.lezen.tekstLabel")}
        hint={t("makenvormen.lezen.tekstHint")}
      >
        <textarea
          rows={8}
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          placeholder={t("makenvormen.lezen.tekstPlaceholder")}
          required
          className={INVOER}
        />
      </Veld>

      {woorden > 0 && (
        <Toelichting>
          {tn("makenvormen.lezen.woorden", woorden)}
          {woorden > 400 && ` ${t("makenvormen.lezen.teLang")}`}
          {" "}
          {t("makenvormen.lezen.naast")}
        </Toelichting>
      )}

      {vragen.map((vraag, index) => (
        <div key={index} className="rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t("makenvormen.gedeeld.vraagNr", { n: index + 1 })}</span>
            {vragen.length > 1 && (
              <button
                type="button"
                onClick={() => setVragen(vragen.filter((_, i) => i !== index))}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                aria-label={t("makenvormen.gedeeld.verwijderVraag", { n: index + 1 })}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <input
            type="text"
            value={vraag.vraag}
            onChange={(e) => wijzig(index, "vraag", e.target.value)}
            placeholder={t("makenvormen.lezen.vraagPlaceholder")}
            required
            className={INVOER}
          />
          <input
            type="text"
            value={vraag.juist}
            onChange={(e) => wijzig(index, "juist", e.target.value)}
            placeholder={t("makenvormen.lezen.juist")}
            required
            className="w-full p-2.5 text-sm rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold focus:border-emerald-400 focus:outline-none"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={vraag.fout1}
              onChange={(e) => wijzig(index, "fout1", e.target.value)}
              placeholder={t("makenvormen.lezen.fout1")}
              required
              className={INVOER}
            />
            <input
              type="text"
              value={vraag.fout2}
              onChange={(e) => wijzig(index, "fout2", e.target.value)}
              placeholder={t("makenvormen.lezen.fout2")}
              className={INVOER}
            />
          </div>
          <input
            type="text"
            value={vraag.uitleg}
            onChange={(e) => wijzig(index, "uitleg", e.target.value)}
            placeholder={t("makenvormen.lezen.uitleg")}
            className={INVOER}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => setVragen([...vragen, { ...LEEG_LEES }])}
        className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:border-merk hover:text-merk-900 font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
      >
        <Plus className="w-4 h-4" />
        <span>{t("makenvormen.gedeeld.nogEenVraag")}</span>
      </button>

      <FeedbackKiezer tweedeKans={tweedeKans} onWijzig={setTweedeKans} />
      {p.taalKiezer}
      {p.bestemming}
      <Foutmelding tekst={p.fout} />
      <MaakKnop bezig={p.bezig} label={t("makenvormen.lezen.knop")} />
    </form>
  );
}

/* ── Werkwoorden ─────────────────────────────────────────────────────────── */

export function WerkwoordenVorm(p: VormProps) {
  const [titel, setTitel] = useState("");
  const [regels, setRegels] = useState("");

  const gelezen = leesWerkwoorden(regels);
  const aantalVormen = gelezen.reduce((som, w) => som + w.vormen.length, 0);

  const maak = (e: React.FormEvent) => {
    e.preventDefault();
    if (gelezen.length === 0) {
      p.setFout(t("makenvormen.werkwoorden.fout"));
      return;
    }
    p.bewaar([
      {
        ...p.basis(),
        id: `ww-${Date.now()}`,
        title: titel.trim(),
        description: t("makenvormen.werkwoorden.beschrijving"),
        category: "language",
        didacticGoal: "automate",
        type: "werkwoorden",
        tags: [t("makenvormen.werkwoorden.tagWerkwoorden"), t("makenvormen.werkwoorden.tagGrammatica")],
        content: { werkwoorden: gelezen },
        didacticConfig: { ...OEFEN_CONFIG, spraakTaal: p.spraakTaal },
      },
    ]);
  };

  return (
    <form onSubmit={maak} className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5">
      <Veld label={t("makenvormen.gedeeld.waarover")} hint={t("makenvormen.werkwoorden.titelHint")}>
        <input
          type="text"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder={t("makenvormen.gedeeld.titelLabel")}
          required
          className={INVOER}
        />
      </Veld>

      <Veld
        label={t("makenvormen.werkwoorden.label")}
        hint={t("makenvormen.werkwoorden.hint")}
      >
        <textarea
          rows={6}
          value={regels}
          onChange={(e) => setRegels(e.target.value)}
          placeholder={t("makenvormen.werkwoorden.voorbeeld")}
          required
          className={INVOER_MONO}
        />
      </Veld>

      <Toelichting>
        {t("makenvormen.werkwoorden.toelichting")}{" "}
        {gelezen.length > 0 && (
          <strong>
            {t("makenvormen.werkwoorden.telling", {
              werkwoorden: tn("makenvormen.werkwoorden.aantalWerkwoorden", gelezen.length),
              vormen: tn("makenvormen.werkwoorden.aantalVormen", aantalVormen),
            })}
          </strong>
        )}
      </Toelichting>

      {p.taalKiezer}
      {p.bestemming}
      <Foutmelding tekst={p.fout} />
      <MaakKnop bezig={p.bezig} label={t("makenvormen.werkwoorden.knop")} />
    </form>
  );
}

/* ── Rekenen ─────────────────────────────────────────────────────────────── */

export function RekenenVorm(p: VormProps) {
  const [titel, setTitel] = useState("");
  const [soort, setSoort] = useState<Rekensoort>("procent");
  const [aantal, setAantal] = useState(10);

  const gekozen = REKENTYPES.find((r) => r.soort === soort) ?? REKENTYPES[0];

  const maak = (e: React.FormEvent) => {
    e.preventDefault();
    p.bewaar([
      {
        ...p.basis(),
        id: `reken-${Date.now()}`,
        title: titel.trim() || gekozen.label,
        description: t("makenvormen.rekenenVorm.beschrijving", { uitleg: gekozen.uitleg }),
        category: "practice",
        didacticGoal: "automate",
        type: "rekenen",
        tags: [t("makenvormen.rekenenVorm.tag"), gekozen.label],
        content: { rekenopdracht: { soort, aantal } },
        didacticConfig: OEFEN_CONFIG,
      },
    ]);
  };

  return (
    <form onSubmit={maak} className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5">
      <Veld
        label={t("makenvormen.gedeeld.titelLabel")}
        hint={t("makenvormen.rekenenVorm.titelHint")}
      >
        <input
          type="text"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder={t("makenvormen.rekenenVorm.titelVoorbeeld", { type: gekozen.label })}
          className={INVOER}
        />
      </Veld>

      <div>
        <span className="block text-sm font-bold text-slate-800 mb-1">{t("makenvormen.rekenenVorm.watOefenen")}</span>
        <span className="block text-xs text-slate-500 mb-2">
          {t("makenvormen.rekenenVorm.geenSom")}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {REKENTYPES.map((type) => (
            <button
              key={type.soort}
              type="button"
              onClick={() => setSoort(type.soort)}
              aria-pressed={soort === type.soort}
              className={`text-left p-3 rounded-xl border transition-colors ${
                soort === type.soort
                  ? "bg-merk-50 border-merk"
                  : "bg-white border-slate-200 hover:border-merk"
              }`}
            >
              <span className="block text-sm font-bold text-slate-900">{type.label}</span>
              <span className="block text-xs text-slate-600 mt-0.5">{type.uitleg}</span>
            </button>
          ))}
        </div>
      </div>

      <Toelichting>
        {tr(
          "makenvormen.rekenenVorm.toelichting",
          { b: (s) => <strong>{s}</strong> },
          { voorbeeld: gekozen.voorbeeld }
        )}
      </Toelichting>

      <div>
        <span className="block text-sm font-bold text-slate-800 mb-2">{t("makenvormen.rekenenVorm.hoeveel")}</span>
        <div className="flex gap-2">
          {[5, 10, 15, 20].map((n) => (
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
              {n}
            </button>
          ))}
        </div>
      </div>

      {p.bestemming}
      <Foutmelding tekst={p.fout} />
      <MaakKnop bezig={p.bezig} label={t("makenvormen.rekenenVorm.knop")} />
    </form>
  );
}
