"use client";

import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  CheckCheck,
  Expand,
  Lock,
  LockOpen,
  Plus,
  Printer,
  QrCode,
  Settings2,
  Shrink,
  Square,
  X,
} from "lucide-react";
import { opslag, opslagGedeeld } from "@/lib/opslag";
import { useAuth } from "@/lib/auth/AuthProvider";
import { BordInstellingen, BordItem, LiveSessie } from "@/lib/types";
import { MAX_TEKST, nieuwBordId, ordenBord, soortLabel } from "@/lib/bord";
import { BordKaart, type KaartActies } from "./BordKaart";
import { BordToevoegen, type NieuwKaartje } from "./BordToevoegen";
import { BordInstellingenVelden, schoonInstellingen } from "./BordOpzet";
import { merkTint } from "@/lib/instellingen/kleur";
import { t, tn } from "@/lib/i18n";
import { tr } from "@/lib/i18n/rijk";

/**
 * Het whiteboard zoals de leraar het projecteert. Kaartjes verschijnen live; de leraar
 * keurt goed (als nakijken aan staat), pint vast, verplaatst, toont één kaartje groot of
 * haalt het weg. Wat cursisten mogen toevoegen, stelt hij hier ook tijdens de les bij.
 */
export function BordLeraar({ sessie: begin, onStop }: { sessie: LiveSessie; onStop: () => void }) {
  const code = begin.code;
  const { gebruiker } = useAuth();
  const [sessie, setSessie] = useState<LiveSessie>(begin);
  const [items, setItems] = useState<BordItem[]>([]);
  const [fout, setFout] = useState("");
  const [paneel, setPaneel] = useState<"toevoegen" | "instellingen" | null>(null);
  const [concept, setConcept] = useState<BordInstellingen | null>(null);
  const [groot, setGroot] = useState<string | null>(null);
  const [vol, setVol] = useState(false);
  const [toonCode, setToonCode] = useState(true);

  const inst = sessie.bord as BordInstellingen;

  useEffect(() => {
    const stopSessie = opslag.volgSessie(code, (s) => s && setSessie(s));
    const stopBord = opslag.volgBord(code, true, setItems, () =>
      setFout(t("bord.leraar.volgenMislukt"))
    );
    return () => {
      stopSessie();
      stopBord();
    };
  }, [code]);

  // Esc sluit eerst het grote kaartje, dan het volle scherm.
  useEffect(() => {
    const op = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (groot) setGroot(null);
      else if (vol) setVol(false);
    };
    window.addEventListener("keydown", op);
    return () => window.removeEventListener("keydown", op);
  }, [groot, vol]);

  const metFout = async (actie: () => Promise<void>) => {
    try {
      await actie();
      setFout("");
    } catch (e) {
      console.error("Bord bijwerken mislukt", e);
      setFout(t("bord.leraar.mislukt"));
    }
  };

  const zetInstellingen = (nieuw: BordInstellingen) =>
    metFout(async () => {
      await opslag.wijzigSessie(code, { bord: nieuw });
      setSessie((s) => ({ ...s, bord: nieuw }));
    });

  const sluitAf = () =>
    metFout(async () => {
      await opslag.wijzigSessie(code, { status: "afgesloten" });
      onStop();
    });

  const zetZelf = async (kaartje: NieuwKaartje) => {
    const item: BordItem = {
      ...kaartje,
      id: nieuwBordId(),
      apparaat: "leraar",
      leraar: true,
      ...(gebruiker?.naam ? { auteur: gebruiker.naam } : {}),
      status: "zichtbaar",
      op: new Date().toISOString(),
    };
    await opslag.stuurBordItem(code, item);
    setPaneel(null);
  };

  const geordend = useMemo(() => ordenBord(items), [items]);
  const wachtend = geordend.filter((i) => i.status === "wacht");
  const zichtbaar = geordend.filter((i) => i.status === "zichtbaar");
  const grootItem = groot ? items.find((i) => i.id === groot) : undefined;

  const acties = (item: BordItem): KaartActies => ({
    onGoedkeuren: () => metFout(() => opslag.wijzigBordItem(code, item.id, { status: "zichtbaar" })),
    onVerberg: () => metFout(() => opslag.wijzigBordItem(code, item.id, { status: "wacht", vast: false })),
    onVastpinnen: () => metFout(() => opslag.wijzigBordItem(code, item.id, { vast: !item.vast })),
    onVerwijder: () => metFout(() => opslag.verwijderBordItem(code, item.id)),
    onGroot: () => setGroot(item.id),
    onKolom: (kolom) => metFout(() => opslag.wijzigBordItem(code, item.id, { kolom })),
    kolommen: inst.kolommen,
  });

  const keurAllesGoed = () =>
    metFout(async () => {
      await Promise.all(wachtend.map((i) => opslag.wijzigBordItem(code, i.id, { status: "zichtbaar" })));
    });

  const knop =
    "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors";
  const knopRustig = `${knop} bg-white border-slate-200 text-slate-700 hover:border-merk`;

  return (
    <div
      className={
        vol
          ? "fixed inset-0 z-50 overflow-y-auto bg-[var(--achtergrond)] p-4 sm:p-6"
          : "max-w-7xl mx-auto u-fade"
      }
    >
      {/* Bediening: niet op het afgedrukte bord */}
      <div className="flex flex-wrap items-center gap-2 mb-4 niet-afdrukken">
        <button onClick={sluitAf} className={knopRustig}>
          <Square className="w-3.5 h-3.5" />
          {t("bord.leraar.afsluiten")}
        </button>
        <span className="flex-1" />
        <button
          onClick={() => zetInstellingen({ ...inst, open: !inst.open })}
          aria-pressed={!inst.open}
          className={
            inst.open
              ? knopRustig
              : `${knop} bg-amber-100 border-amber-400 text-amber-900`
          }
          title={inst.open ? t("bord.leraar.nuDicht") : t("bord.leraar.weerOpen")}
        >
          {inst.open ? <LockOpen className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          {inst.open ? t("bord.leraar.open") : t("bord.leraar.dicht")}
        </button>
        <button
          onClick={() => {
            setConcept(null);
            setPaneel(paneel === "toevoegen" ? null : "toevoegen");
          }}
          aria-expanded={paneel === "toevoegen"}
          className={`${knop} bg-merk-800 border-merk-800 text-white hover:bg-merk-900`}
        >
          <Plus className="w-3.5 h-3.5" />
          {t("bord.leraar.zelfToevoegen")}
        </button>
        <button
          onClick={() => {
            setConcept(inst);
            setPaneel(paneel === "instellingen" ? null : "instellingen");
          }}
          aria-expanded={paneel === "instellingen"}
          className={knopRustig}
        >
          <Settings2 className="w-3.5 h-3.5" />
          {t("bord.leraar.watMagErop")}
        </button>
        <button onClick={() => setToonCode((v) => !v)} aria-pressed={toonCode} className={knopRustig}>
          <QrCode className="w-3.5 h-3.5" />
          {toonCode ? t("bord.leraar.verbergCode") : t("bord.leraar.toonCode")}
        </button>
        <button onClick={() => window.print()} className={knopRustig} title={t("bord.leraar.afdrukkenUitleg")}>
          <Printer className="w-3.5 h-3.5" />
          {t("algemeen.afdrukken")}
        </button>
        <button onClick={() => setVol((v) => !v)} className={knopRustig}>
          {vol ? <Shrink className="w-3.5 h-3.5" /> : <Expand className="w-3.5 h-3.5" />}
          {vol ? t("bord.leraar.kleiner") : t("bord.leraar.volScherm")}
        </button>
      </div>

      {fout && (
        <p role="alert" className="mb-4 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 niet-afdrukken">
          {fout}
        </p>
      )}

      {!opslagGedeeld && !vol && (
        <p className="mb-4 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 niet-afdrukken">
          {tr("bord.leraar.demo", { b: (s) => <strong>{s}</strong> })}
        </p>
      )}

      {/* Kop: de opdracht en hoe je meedoet */}
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <p className="text-xs uppercase font-bold tracking-widest text-merk-800 mb-1">
            {t("bord.whiteboard")} · {tn("bord.leraar.kaartjes", zichtbaar.length)}
            {!inst.open && ` · ${t("bord.leraar.isDicht")}`}
          </p>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-merk-900 leading-tight break-words">
            {sessie.vraag || t("bord.leraar.onsBord")}
          </h1>
          <p className="text-sm text-slate-600 mt-2 niet-afdrukken">
            {t(
              inst.soorten.includes("tekst") && inst.maxTekens > 0
                ? "bord.leraar.kunnenToevoegenGrens"
                : "bord.leraar.kunnenToevoegen",
              {
                soorten: inst.soorten.map(soortLabel).join(", ").toLowerCase() || t("bord.leraar.niets"),
                n: inst.maxTekens,
              }
            )}
            {inst.nakijken && ` ${t("bord.leraar.eerstGoedkeuren")}`}
          </p>
        </div>
        {toonCode && <Pincode code={code} />}
      </header>

      {paneel === "toevoegen" && (
        <Paneel titel={t("bord.leraar.zelfTitel")} onSluit={() => setPaneel(null)}>
          <BordToevoegen
            soorten={["tekst", "afbeelding", "tekening", "video", "audio"]}
            maxTekens={MAX_TEKST}
            maxSeconden={120}
            kolommen={inst.kolommen}
            onVerstuur={zetZelf}
          />
        </Paneel>
      )}

      {paneel === "instellingen" && concept && (
        <Paneel titel={t("bord.leraar.instellingenTitel")} onSluit={() => setPaneel(null)}>
          <BordInstellingenVelden inst={concept} onWijzig={setConcept} tijdensLes />
          <div className="flex flex-wrap gap-2 mt-6">
            <button
              onClick={async () => {
                await zetInstellingen(schoonInstellingen(concept));
                setPaneel(null);
              }}
              disabled={concept.soorten.length === 0}
              className="px-5 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm"
            >
              {t("bord.leraar.toepassen")}
            </button>
            <button
              onClick={() => setPaneel(null)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100"
            >
              {t("algemeen.annuleren")}
            </button>
          </div>
        </Paneel>
      )}

      {wachtend.length > 0 && (
        <section className="mb-6 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50/60 p-4 niet-afdrukken">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-bold text-amber-900">
              {tn("bord.leraar.wachten", wachtend.length)}
            </h2>
            <button
              onClick={keurAllesGoed}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-merk-800 hover:bg-merk-900 text-white text-xs font-bold"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              {t("bord.leraar.allesGoedkeuren")}
            </button>
          </div>
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
            {wachtend.map((item) => (
              <BordKaart key={item.id} item={item} acties={acties(item)} />
            ))}
          </div>
        </section>
      )}

      <Muur items={zichtbaar} kolommen={inst.kolommen} acties={acties} />

      {grootItem && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/80 flex items-center justify-center p-4 sm:p-10 niet-afdrukken"
          onClick={() => setGroot(null)}
          role="dialog"
          aria-modal="true"
          aria-label={t("bord.leraar.kaartjeGroot")}
        >
          <div className="w-full max-w-5xl max-h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <BordKaart item={grootItem} groot />
          </div>
          <button
            onClick={() => setGroot(null)}
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg"
            aria-label={t("algemeen.sluiten")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

/** De kaartjes: op één muur, of in kolommen als de leraar er zette. */
export function Muur({
  items,
  kolommen,
  acties,
  eigen,
  leeg = t("bord.leraar.leeg"),
}: {
  items: BordItem[];
  kolommen: string[];
  acties?: (item: BordItem) => KaartActies;
  eigen?: (item: BordItem) => boolean;
  leeg?: string;
}) {
  if (kolommen.length > 0) {
    // Een kaartje in een kolom die niet meer bestaat, komt in de eerste.
    const perKolom = kolommen.map((_, k) =>
      items.filter((i) => ((i.kolom ?? 0) < kolommen.length ? (i.kolom ?? 0) : 0) === k)
    );
    return (
      // Op een gsm onder elkaar, op een groter scherm naast elkaar.
      <div className="flex flex-col sm:flex-row gap-4 sm:overflow-x-auto pb-4">
        {kolommen.map((naam, k) => (
          <section key={k} className="sm:min-w-[16rem] flex-1">
            <h2 className="text-sm font-extrabold text-merk-900 bg-merk-50 border border-merk/30 rounded-xl px-3 py-2 mb-3 flex justify-between gap-2">
              <span className="truncate">{naam}</span>
              <span className="text-merk-800 tabular-nums">{perKolom[k].length}</span>
            </h2>
            {perKolom[k].map((item) => (
              <BordKaart key={item.id} item={item} acties={acties?.(item)} eigen={eigen?.(item)} />
            ))}
          </section>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-center text-sm text-slate-500 py-16 border-2 border-dashed border-slate-200 rounded-2xl">
        {leeg}
      </p>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
      {items.map((item) => (
        <BordKaart key={item.id} item={item} acties={acties?.(item)} eigen={eigen?.(item)} />
      ))}
    </div>
  );
}

function Paneel({ titel, onSluit, children }: { titel: string; onSluit: () => void; children: React.ReactNode }) {
  return (
    <section className="mb-6 bg-white rounded-2xl border border-slate-200 p-5 max-w-2xl niet-afdrukken u-rise">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="font-bold text-merk-900">{titel}</h2>
        <button
          onClick={onSluit}
          aria-label={t("algemeen.sluiten")}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {children}
    </section>
  );
}

function Pincode({ code }: { code: string }) {
  const [qr, setQr] = useState("");
  const [url, setUrl] = useState("");
  useEffect(() => {
    const u = `${window.location.origin}/live/join?code=${code}`;
    setUrl(u);
    QRCode.toDataURL(u, { width: 240, margin: 2, color: { dark: merkTint("900"), light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [code]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center gap-3 shrink-0 niet-afdrukken">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {qr && <img src={qr} alt={t("bord.leraar.qr")} className="w-24 h-24 rounded-lg" />}
      <div>
        <span className="block text-[11px] font-semibold text-slate-500">
          {url.replace(/^https?:\/\//, "").replace(/\?.*$/, "")}
        </span>
        <span className="block text-[11px] font-semibold text-slate-500">{t("bord.leraar.pincode")}</span>
        <span className="block font-mono text-3xl font-black tracking-widest text-merk-900">
          {code.slice(0, 3)} {code.slice(3)}
        </span>
      </div>
    </div>
  );
}
