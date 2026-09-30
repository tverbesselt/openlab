"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ImagePlus,
  Languages,
  Lightbulb,
  LayoutGrid,
  Lock,
  Mic,
  Palette,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useInstellingen } from "@/lib/instellingen/AppProvider";
import { bewaarInstellingen } from "@/lib/instellingen/opslag";
import { MAX_LOGO, normaliseer, type Instellingen } from "@/lib/instellingen/types";
import {
  FUNCTIEGROEPEN,
  HANGT_AF_VAN,
  isExtraFunctie,
  type FunctieId,
} from "@/lib/instellingen/functies";
import { KLEURSCHEMAS, contrast, isHex, maakPalet, type Tint } from "@/lib/instellingen/kleur";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
import { firebaseConfigured, getDb } from "@/lib/firebase/client";
import { bewaarDemoSleutel, lijktOpSleutel, spraakStatus, type SpraakStatus } from "@/lib/inlezen";
import { TALEN, t, type Taal } from "@/lib/i18n";
import { tr } from "@/lib/i18n/rijk";
import { WERKVORMEN } from "@/lib/labels";

/*
 * Beheer: alles wat deze installatie eigen maakt. Alleen voor beheerders (beheerders/{e-mail}
 * in Firestore; in demomodus is de demoleraar beheerder).
 *
 * Je werkt op een kopie. Pas bij "Bewaren" gaat het naar de opslag en geldt het voor
 * iedereen. De kleur zie je wel meteen in het voorbeeld.
 */

export default function BeheerPagina() {
  const { status, isBeheerder } = useAuth();
  const { instellingen, vervang } = useInstellingen();
  const [concept, setConcept] = useState<Instellingen>(instellingen);
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState<{ soort: "ok" | "fout"; tekst: string } | null>(null);

  // Nieuwe instellingen van elders (bijvoorbeeld de eerste keer laden): overnemen.
  useEffect(() => setConcept(instellingen), [instellingen]);

  const gewijzigd = useMemo(
    () => JSON.stringify(normaliseer(concept)) !== JSON.stringify(instellingen),
    [concept, instellingen]
  );

  if (status === "laden") return <div className="h-64" aria-hidden />;

  if (!isBeheerder) {
    return (
      <div className="max-w-md mx-auto text-center py-16 u-fade">
        <Lock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <h1 className="text-2xl font-extrabold text-merk-900 tracking-tight mb-2">
          {t("beheer.geenToegang.titel")}
        </h1>
        <p className="text-sm text-slate-600 mb-6">{t("beheer.geenToegang.uitleg")}</p>
        <Link
          href="/"
          className="inline-flex px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
        >
          {t("algemeen.uitgeschakeld.naarStart")}
        </Link>
      </div>
    );
  }

  const wijzig = (verandering: Partial<Instellingen>) => {
    setMelding(null);
    setConcept((c) => ({ ...c, ...verandering }));
  };

  const bewaar = async () => {
    setBezig(true);
    setMelding(null);
    try {
      const schoon = normaliseer(concept);
      await bewaarInstellingen(schoon);
      vervang(schoon);
      setMelding({ soort: "ok", tekst: t("beheer.bewaard") });
    } catch (e) {
      console.error("Instellingen bewaren mislukt", e);
      setMelding({ soort: "fout", tekst: t("beheer.bewarenMislukt") });
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 u-fade pb-24">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-merk-900 tracking-tight mb-1">
          {t("beheer.titel")}
        </h1>
        <p className="text-sm text-slate-600">{t("beheer.intro")}</p>
        {!firebaseConfigured && (
          <p className="mt-3 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            {t("beheer.demoOpslag")}
          </p>
        )}
      </div>

      <Huisstijl concept={concept} wijzig={wijzig} />
      <Talen concept={concept} wijzig={wijzig} />
      <Werkvormen concept={concept} wijzig={wijzig} />
      <Tips concept={concept} wijzig={wijzig} />
      <Spraak />
      {firebaseConfigured && <ToegangBlok concept={concept} wijzig={wijzig} />}

      {/* Bewaren blijft altijd in beeld: de pagina is lang. */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0 text-xs" role="status" aria-live="polite">
            {melding ? (
              <span
                className={`inline-flex items-center gap-1.5 font-semibold ${
                  melding.soort === "ok" ? "text-emerald-800" : "text-rose-800"
                }`}
              >
                {melding.soort === "ok" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {melding.tekst}
              </span>
            ) : gewijzigd ? (
              <span className="text-slate-600">{t("beheer.nietBewaard")}</span>
            ) : null}
          </div>
          {gewijzigd && (
            <button
              onClick={() => {
                setConcept(instellingen);
                setMelding(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
            >
              {t("algemeen.annuleren")}
            </button>
          )}
          <button
            onClick={bewaar}
            disabled={bezig || !gewijzigd}
            className="px-5 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm transition-colors"
          >
            {bezig ? t("algemeen.bezig") : t("algemeen.bewaren")}
          </button>
        </div>
      </div>
    </div>
  );
}

interface BlokProps {
  concept: Instellingen;
  wijzig: (verandering: Partial<Instellingen>) => void;
}

function Blok({
  icon: Icon,
  titel,
  uitleg,
  children,
}: {
  icon: React.ElementType;
  titel: string;
  uitleg: string;
  children: React.ReactNode;
}) {
  return (
    <section className="u-card p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-5">
        <span className="w-9 h-9 shrink-0 rounded-xl bg-merk-50 text-merk-900 flex items-center justify-center border border-merk/20">
          <Icon className="w-4 h-4" />
        </span>
        <div>
          <h2 className="font-extrabold text-lg text-merk-900">{titel}</h2>
          <p className="text-sm text-slate-600">{uitleg}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

const veldKlasse =
  "w-full px-3 py-2.5 rounded-xl border border-veldrand bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-merk";

/* ── Huisstijl: naam, logo, kleur ──────────────────────────────────────── */

function Huisstijl({ concept, wijzig }: BlokProps) {
  const invoer = useRef<HTMLInputElement>(null);
  const [logoFout, setLogoFout] = useState<string | null>(null);
  const eigenKleur = !KLEURSCHEMAS.some((k) => k.kleur === concept.kleur);
  const palet = maakPalet(concept.kleur);
  const aangepast = contrast(concept.kleur, "#ffffff") < 4.5;

  const kiesLogo = async (bestand: File | undefined) => {
    setLogoFout(null);
    if (!bestand) return;
    if (!bestand.type.startsWith("image/")) {
      setLogoFout(t("beheer.huisstijl.logoGeenAfbeelding"));
      return;
    }
    try {
      const url = await verkleinLogo(bestand);
      if (url.length > MAX_LOGO) {
        setLogoFout(t("beheer.huisstijl.logoTeGroot"));
        return;
      }
      wijzig({ logo: url });
    } catch {
      setLogoFout(t("beheer.huisstijl.logoMislukt"));
    } finally {
      if (invoer.current) invoer.current.value = "";
    }
  };

  return (
    <Blok icon={Palette} titel={t("beheer.huisstijl.titel")} uitleg={t("beheer.huisstijl.uitleg")}>
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <label className="block">
          <span className="block text-sm font-bold text-slate-800 mb-1">
            {t("beheer.huisstijl.naam")}
          </span>
          <input
            value={concept.naam}
            maxLength={40}
            onChange={(e) => wijzig({ naam: e.target.value })}
            className={veldKlasse}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-bold text-slate-800 mb-1">
            {t("beheer.huisstijl.organisatie")}{" "}
            <span className="font-normal text-slate-500">({t("algemeen.optioneel")})</span>
          </span>
          <input
            value={concept.organisatie}
            maxLength={80}
            placeholder={t("beheer.huisstijl.organisatieVoorbeeld")}
            onChange={(e) => wijzig({ organisatie: e.target.value })}
            className={veldKlasse}
          />
        </label>
      </div>

      {/* Logo */}
      <div className="mb-6">
        <span className="block text-sm font-bold text-slate-800 mb-1">{t("beheer.huisstijl.logo")}</span>
        <p className="text-xs text-slate-500 mb-3">{t("beheer.huisstijl.logoUitleg")}</p>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
            {concept.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={concept.logo} alt={t("beheer.huisstijl.logoHuidig")} className="w-full h-full object-contain" />
            ) : (
              <ImagePlus className="w-6 h-6 text-slate-400" aria-hidden />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => invoer.current?.click()}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
            >
              {concept.logo ? t("beheer.huisstijl.logoVervangen") : t("beheer.huisstijl.logoUploaden")}
            </button>
            {concept.logo && (
              <button
                onClick={() => wijzig({ logo: null })}
                className="px-3 py-2 rounded-xl text-rose-800 hover:bg-rose-50 font-bold text-sm transition-colors inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                {t("algemeen.verwijderen")}
              </button>
            )}
          </div>
          <input
            ref={invoer}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => kiesLogo(e.target.files?.[0])}
          />
        </div>
        {logoFout && (
          <p role="alert" className="mt-2 text-xs font-semibold text-rose-800">
            {logoFout}
          </p>
        )}
      </div>

      {/* Kleurschema */}
      <div>
        <span className="block text-sm font-bold text-slate-800 mb-1">{t("beheer.huisstijl.kleur")}</span>
        <p className="text-xs text-slate-500 mb-3">{t("beheer.huisstijl.kleurUitleg")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {KLEURSCHEMAS.map((k) => {
            const actief = concept.kleur === k.kleur;
            return (
              <button
                key={k.id}
                onClick={() => wijzig({ kleur: k.kleur })}
                aria-pressed={actief}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-bold transition-colors ${
                  actief ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200 hover:border-slate-400"
                }`}
              >
                <span className="w-5 h-5 rounded-full shrink-0" style={{ background: k.kleur }} aria-hidden />
                <span className="flex-1 text-left text-slate-800">
                  {t(`beheer.kleuren.${k.id}` as `beheer.kleuren.blauw`)}
                </span>
                {actief && <Check className="w-4 h-4 text-slate-900" />}
              </button>
            );
          })}
        </div>

        <label
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-bold w-full sm:w-auto sm:inline-flex ${
            eigenKleur ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200"
          }`}
        >
          <input
            type="color"
            value={isHex(concept.kleur) ? concept.kleur : "#2f6fde"}
            onChange={(e) => wijzig({ kleur: e.target.value.toLowerCase() })}
            className="w-8 h-8 rounded-lg border-0 p-0 bg-transparent cursor-pointer"
          />
          <span className="text-slate-800">{t("beheer.huisstijl.eigenKleur")}</span>
          <input
            value={concept.kleur}
            onChange={(e) => {
              const w = e.target.value.trim();
              if (/^#?[0-9a-fA-F]{0,6}$/.test(w)) wijzig({ kleur: w.startsWith("#") ? w : `#${w}` });
            }}
            aria-label={t("beheer.huisstijl.hexcode")}
            className="w-24 px-2 py-1 rounded-lg border border-veldrand font-mono text-xs"
          />
        </label>

        {/* Voorbeeld met de gekozen kleur, los van de rest van de pagina */}
        <div className="mt-4 rounded-2xl border border-slate-200 p-4" style={paletStijl(palet)}>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            {t("beheer.huisstijl.voorbeeld")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-4 py-2 rounded-xl text-white font-bold text-sm" style={{ background: "var(--merk-800)" }}>
              {t("beheer.huisstijl.voorbeeldKnop")}
            </span>
            <span
              className="px-3 py-1.5 rounded-lg font-semibold text-sm"
              style={{ background: "var(--merk-50)", color: "var(--merk-900)" }}
            >
              {t("beheer.huisstijl.voorbeeldActief")}
            </span>
            <span className="font-extrabold" style={{ color: "var(--merk-900)" }}>
              {concept.naam}
            </span>
            <span className="flex gap-1" aria-hidden>
              {(["50", "300", "400", "500", "600", "700", "800", "900"] as Tint[]).map((tint) => (
                <span key={tint} className="w-5 h-5 rounded" style={{ background: palet[tint] }} />
              ))}
            </span>
          </div>
          {aangepast && (
            <p className="mt-3 text-xs text-slate-600">{t("beheer.huisstijl.contrastAangepast")}</p>
          )}
        </div>
      </div>
    </Blok>
  );
}

function paletStijl(palet: Record<Tint, string>): React.CSSProperties {
  const stijl: Record<string, string> = {};
  for (const [tint, w] of Object.entries(palet)) stijl[`--merk-${tint}`] = w;
  return stijl as React.CSSProperties;
}

/** Verklein naar hoogstens 256 px en bewaar als webp (of png als de browser geen webp kan). */
async function verkleinLogo(bestand: File): Promise<string> {
  const url = URL.createObjectURL(bestand);
  try {
    const img = await new Promise<HTMLImageElement>((ok, nietOk) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = nietOk;
      i.src = url;
    });
    const max = 256;
    const breedte = img.naturalWidth || max;
    const hoogte = img.naturalHeight || max;
    const schaal = Math.min(1, max / Math.max(breedte, hoogte));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(breedte * schaal));
    canvas.height = Math.max(1, Math.round(hoogte * schaal));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("geen canvas");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const webp = canvas.toDataURL("image/webp", 0.9);
    return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ── Talen ─────────────────────────────────────────────────────────────── */

function Talen({ concept, wijzig }: BlokProps) {
  const zet = (code: Taal, aan: boolean) => {
    const talen = aan
      ? TALEN.map((l) => l.code).filter((c) => c === code || concept.talen.includes(c))
      : concept.talen.filter((c) => c !== code);
    if (talen.length === 0) return;
    wijzig({
      talen,
      standaardTaal: talen.includes(concept.standaardTaal) ? concept.standaardTaal : talen[0],
    });
  };

  return (
    <Blok icon={Languages} titel={t("beheer.talen.titel")} uitleg={t("beheer.talen.uitleg")}>
      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
        {TALEN.map((l) => {
          const aan = concept.talen.includes(l.code);
          const enige = aan && concept.talen.length === 1;
          return (
            <div key={l.code} className="flex items-center gap-3 px-4 py-3">
              <Schakelaar
                aan={aan}
                uitgeschakeld={enige}
                label={l.naam}
                onChange={(w) => zet(l.code, w)}
              />
              <span className="flex-1 text-sm font-bold text-slate-800" lang={l.code}>
                {l.naam}
              </span>
              <label
                className={`flex items-center gap-1.5 text-xs ${aan ? "text-slate-700" : "text-slate-400"}`}
              >
                <input
                  type="radio"
                  name="standaardtaal"
                  checked={concept.standaardTaal === l.code}
                  disabled={!aan}
                  onChange={() => wijzig({ standaardTaal: l.code })}
                  className="accent-[var(--merk-800)]"
                />
                {t("beheer.talen.standaard")}
              </label>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-500">{t("beheer.talen.minstensEen")}</p>
    </Blok>
  );
}

/* ── Werkvormen en functies ────────────────────────────────────────────── */

function functieLabel(id: FunctieId): string {
  return isExtraFunctie(id)
    ? t(`beheer.functies.${id}.label` as `beheer.functies.wedstrijd.label`)
    : WERKVORMEN[id].label;
}

function functieUitleg(id: FunctieId): string {
  return isExtraFunctie(id)
    ? t(`beheer.functies.${id}.uitleg` as `beheer.functies.wedstrijd.uitleg`)
    : WERKVORMEN[id].uitleg;
}

function Werkvormen({ concept, wijzig }: BlokProps) {
  const zet = (id: FunctieId, aan: boolean) =>
    wijzig({ uit: aan ? concept.uit.filter((f) => f !== id) : [...concept.uit, id] });
  const zetGroep = (ids: FunctieId[], aan: boolean) =>
    wijzig({
      uit: aan
        ? concept.uit.filter((f) => !ids.includes(f))
        : [...concept.uit.filter((f) => !ids.includes(f)), ...ids],
    });

  return (
    <Blok icon={LayoutGrid} titel={t("beheer.werkvormen.titel")} uitleg={t("beheer.werkvormen.uitleg")}>
      <div className="space-y-6">
        {FUNCTIEGROEPEN.map((groep) => {
          const alleAan = groep.functies.every((f) => !concept.uit.includes(f));
          return (
            <div key={groep.id}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                  {t(`beheer.groepen.${groep.id}` as `beheer.groepen.inoefenen`)}
                </h3>
                <button
                  onClick={() => zetGroep(groep.functies, !alleAan)}
                  className="text-xs font-bold text-merk-900 hover:underline"
                >
                  {alleAan ? t("beheer.werkvormen.alleUit") : t("beheer.werkvormen.alleAan")}
                </button>
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {groep.functies.map((id) => {
                  const aan = !concept.uit.includes(id);
                  const nodig = HANGT_AF_VAN[id];
                  const geblokkeerd = !!nodig && concept.uit.includes(nodig);
                  return (
                    <div key={id} className="flex items-start gap-3 px-4 py-3">
                      <Schakelaar aan={aan} label={functieLabel(id)} onChange={(w) => zet(id, w)} />
                      <div className="min-w-0">
                        <p className={`text-sm font-bold ${aan ? "text-slate-800" : "text-slate-500"}`}>
                          {functieLabel(id)}
                        </p>
                        <p className="text-xs text-slate-500">{functieUitleg(id)}</p>
                        {geblokkeerd && aan && (
                          <p className="text-xs text-amber-800 mt-1">
                            {t("beheer.werkvormen.hangtAf", { nodig: functieLabel(nodig) })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Blok>
  );
}

/* ── Didactische tips ──────────────────────────────────────────────────── */

function Tips({ concept, wijzig }: BlokProps) {
  const rijen: { id: keyof Instellingen["tips"]; label: string; uitleg: string }[] = [
    { id: "leraren", label: t("beheer.tips.leraren"), uitleg: t("beheer.tips.lerarenUitleg") },
    { id: "cursisten", label: t("beheer.tips.cursisten"), uitleg: t("beheer.tips.cursistenUitleg") },
  ];
  return (
    <Blok icon={Lightbulb} titel={t("beheer.tips.titel")} uitleg={t("beheer.tips.uitleg")}>
      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
        {rijen.map((r) => (
          <div key={r.id} className="flex items-start gap-3 px-4 py-3">
            <Schakelaar
              aan={concept.tips[r.id]}
              label={r.label}
              onChange={(w) => wijzig({ tips: { ...concept.tips, [r.id]: w } })}
            />
            <div>
              <p className="text-sm font-bold text-slate-800">{r.label}</p>
              <p className="text-xs text-slate-500">{r.uitleg}</p>
            </div>
          </div>
        ))}
      </div>
    </Blok>
  );
}

/* ── Spraak: de sleutel van OpenAI ─────────────────────────────────────── */

/*
 * Staat los van "Bewaren" onderaan: een sleutel hoort niet in het gewone instellingen-
 * document, want dat kan iedereen lezen. Met Firebase gaat hij naar geheimen/openai, dat
 * alleen de server kan lezen; in demomodus blijft hij in deze browser.
 */
function Spraak() {
  const [stand, setStand] = useState<SpraakStatus | null>(null);
  const [invoer, setInvoer] = useState("");
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState<{ soort: "ok" | "fout"; tekst: string } | null>(null);

  useEffect(() => {
    void spraakStatus(true).then(setStand);
  }, []);

  const ververs = async () => setStand(await spraakStatus(true));

  const bewaar = async () => {
    setMelding(null);
    const sleutel = invoer.trim();
    if (!lijktOpSleutel(sleutel)) {
      setMelding({ soort: "fout", tekst: t("beheer.spraak.ongeldig") });
      return;
    }
    setBezig(true);
    try {
      if (firebaseConfigured) await setDoc(doc(getDb(), "geheimen", "openai"), { sleutel });
      else bewaarDemoSleutel(sleutel);
      setInvoer("");
      setMelding({
        soort: "ok",
        tekst: firebaseConfigured ? t("beheer.spraak.bewaard") : t("beheer.spraak.bewaardDemo"),
      });
      await ververs();
    } catch (e) {
      console.error("Sleutel bewaren mislukt", e);
      setMelding({ soort: "fout", tekst: t("beheer.spraak.mislukt") });
    } finally {
      setBezig(false);
    }
  };

  const verwijder = async () => {
    setMelding(null);
    setBezig(true);
    try {
      if (firebaseConfigured) await deleteDoc(doc(getDb(), "geheimen", "openai"));
      else bewaarDemoSleutel(null);
      setMelding({ soort: "ok", tekst: t("beheer.spraak.verwijderd") });
      await ververs();
    } catch (e) {
      console.error("Sleutel verwijderen mislukt", e);
      setMelding({ soort: "fout", tekst: t("beheer.spraak.mislukt") });
    } finally {
      setBezig(false);
    }
  };

  const statusTekst = !stand
    ? t("beheer.spraak.laden")
    : stand.bron === "beheer"
      ? t("beheer.spraak.statusBeheer")
      : stand.bron === "omgeving"
        ? t("beheer.spraak.statusOmgeving")
        : stand.bron === "browser"
          ? t("beheer.spraak.statusBrowser")
          : t("beheer.spraak.statusGeen");
  const eigenSleutel = stand?.bron === "beheer" || stand?.bron === "browser";

  return (
    <Blok icon={Mic} titel={t("beheer.spraak.titel")} uitleg={t("beheer.spraak.uitleg")}>
      <div className="space-y-4">
        <p
          role="status"
          className={`flex items-start gap-2 text-sm rounded-xl px-4 py-3 ${
            stand?.bron ? "bg-emerald-50 text-emerald-900" : "bg-slate-50 text-slate-700"
          }`}
        >
          {stand?.bron ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
          )}
          <span>{statusTekst}</span>
        </p>

        {firebaseConfigured && stand && !stand.serverToegang && (
          <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            {t("beheer.spraak.geenServertoegang")}
          </p>
        )}

        <div>
          <label htmlFor="openai-sleutel" className="block text-sm font-bold text-slate-800 mb-1">
            {t("beheer.spraak.sleutel")}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="openai-sleutel"
              aria-describedby="openai-sleutel-hint"
              type="password"
              value={invoer}
              onChange={(e) => {
                setInvoer(e.target.value);
                setMelding(null);
              }}
              placeholder="sk-..."
              autoComplete="off"
              spellCheck={false}
              className={`${veldKlasse} font-mono`}
            />
            <button
              onClick={bewaar}
              disabled={bezig || !invoer.trim()}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm transition-colors"
            >
              {t("beheer.spraak.bewaren")}
            </button>
          </div>
          <p id="openai-sleutel-hint" className="text-xs text-slate-500 mt-1">
            {tr("beheer.spraak.sleutelHint", {
              link: (s) => (
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-merk-900 underline"
                >
                  {s}
                </a>
              ),
            })}
          </p>
        </div>

        {melding && (
          <p
            role={melding.soort === "fout" ? "alert" : "status"}
            className={`text-xs font-semibold ${melding.soort === "ok" ? "text-emerald-800" : "text-rose-800"}`}
          >
            {melding.tekst}
          </p>
        )}

        {eigenSleutel && (
          <button
            onClick={verwijder}
            disabled={bezig}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-rose-700 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden />
            {t("beheer.spraak.verwijderen")}
          </button>
        )}

        <p className="text-xs text-slate-600 bg-slate-50 rounded-xl px-4 py-3">
          {firebaseConfigured ? t("beheer.spraak.firebaseUitleg") : t("beheer.spraak.demoUitleg")}
        </p>
      </div>
    </Blok>
  );
}

/* ── Toegang ───────────────────────────────────────────────────────────── */

function lijstNaarTekst(l: string[]) {
  return l.join(", ");
}

function tekstNaarLijst(s: string) {
  return s
    .split(/[\s,;]+/)
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

function ToegangBlok({ concept, wijzig }: BlokProps) {
  const { toegang } = concept;
  // Los tekstveld, zodat een komma typen niet meteen verdwijnt.
  const [leraren, setLeraren] = useState(lijstNaarTekst(toegang.leraarDomeinen));
  const [cursisten, setCursisten] = useState(lijstNaarTekst(toegang.cursistDomeinen));

  let patroonFout = false;
  try {
    if (toegang.cursistPatroon) new RegExp(toegang.cursistPatroon);
  } catch {
    patroonFout = true;
  }

  return (
    <Blok icon={Lock} titel={t("beheer.toegang.titel")} uitleg={t("beheer.toegang.uitleg")}>
      <div className="space-y-4">
        <label className="block">
          <span className="block text-sm font-bold text-slate-800 mb-1">
            {t("beheer.toegang.leraarDomeinen")}
          </span>
          <input
            value={leraren}
            placeholder="school.org"
            onChange={(e) => {
              setLeraren(e.target.value);
              wijzig({ toegang: { ...toegang, leraarDomeinen: tekstNaarLijst(e.target.value) } });
            }}
            className={`${veldKlasse} font-mono`}
          />
          <span className="block text-xs text-slate-500 mt-1">{t("beheer.toegang.domeinenHint")}</span>
        </label>

        <label className="block">
          <span className="block text-sm font-bold text-slate-800 mb-1">
            {t("beheer.toegang.cursistDomeinen")}
          </span>
          <input
            value={cursisten}
            placeholder="students.school.org"
            onChange={(e) => {
              setCursisten(e.target.value);
              wijzig({ toegang: { ...toegang, cursistDomeinen: tekstNaarLijst(e.target.value) } });
            }}
            className={`${veldKlasse} font-mono`}
          />
          <span className="block text-xs text-slate-500 mt-1">
            {tr("beheer.toegang.cursistDomeinenHint", { code: (s) => <code className="font-mono">{s}</code> })}
          </span>
        </label>

        <label className="block">
          <span className="block text-sm font-bold text-slate-800 mb-1">
            {t("beheer.toegang.patroon")}{" "}
            <span className="font-normal text-slate-500">({t("algemeen.optioneel")})</span>
          </span>
          <input
            value={toegang.cursistPatroon}
            placeholder="s[0-9]+@school[.]org"
            onChange={(e) => wijzig({ toegang: { ...toegang, cursistPatroon: e.target.value } })}
            className={`${veldKlasse} font-mono`}
          />
          <span className="block text-xs text-slate-500 mt-1">{t("beheer.toegang.patroonHint")}</span>
          {patroonFout && (
            <span role="alert" className="block text-xs font-semibold text-rose-800 mt-1">
              {t("beheer.toegang.patroonFout")}
            </span>
          )}
        </label>

        <p className="text-xs text-slate-600 bg-slate-50 rounded-xl px-4 py-3">
          {tr("beheer.toegang.beheerders", { code: (s) => <code className="font-mono">{s}</code> })}
        </p>
      </div>
    </Blok>
  );
}

/* ── Schakelaar ────────────────────────────────────────────────────────── */

function Schakelaar({
  aan,
  label,
  onChange,
  uitgeschakeld = false,
}: {
  aan: boolean;
  label: string;
  onChange: (aan: boolean) => void;
  uitgeschakeld?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={aan}
      aria-label={label}
      disabled={uitgeschakeld}
      onClick={() => onChange(!aan)}
      className={`relative w-10 h-6 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        aan ? "bg-merk-800" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          aan ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}
