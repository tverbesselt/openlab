"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Share2,
  Play,
  Plus,
  X,
  Trash2,
  Pencil,
  Check,
  Lock,
  Building2,
  FolderInput,
  Search,
} from "lucide-react";
import { opslag, useMateriaal } from "@/lib/opslag";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Exercise, Lesmap } from "@/lib/types";
import {
  WERKVORMEN,
  inhoudSamenvatting,
  isEigenMateriaal,
  isEigenMap,
  lesfaseLabel,
  pastInOrganisatiemap,
} from "@/lib/labels";
import { ShareModal } from "@/components/ShareModal";
import { Studietip } from "@/components/Studietip";
import { t, tn } from "@/lib/i18n";
import { tr } from "@/lib/i18n/rijk";

export default function MapPagina() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { gebruiker, isLeraar, isBeheerder } = useAuth();

  // De map zelf en haar inhoud haal je op id op: zo werkt de code van een map ook voor
  // cursisten, en ook voor privé materiaal dat erin zit.
  const [map, setMap] = useState<Lesmap | null>(null);
  const [inhoudPerId, setInhoudPerId] = useState<Record<string, Exercise>>({});
  const [geladen, setGeladen] = useState(false);
  const [fout, setFout] = useState("");
  const [delenOpen, setDelenOpen] = useState(false);
  const [voegToe, setVoegToe] = useState(false);
  const [wijzigNaam, setWijzigNaam] = useState<string | null>(null);
  const [zoek, setZoek] = useState("");
  const [verplaatsVoor, setVerplaatsVoor] = useState<string | null>(null);
  const [doelMapId, setDoelMapId] = useState("");
  const [melding, setMelding] = useState<{ tekst: string; mapId: string } | null>(null);

  // Materiaal om toe te voegen, en de andere mappen om naar te verplaatsen.
  const { oefeningen, mappen, orgMappen } = useMateriaal();

  useEffect(() => {
    let actief = true;
    (async () => {
      try {
        const gevonden = await opslag.map(id);
        if (!actief) return;
        setMap(gevonden);
        if (gevonden) {
          const items = await Promise.all(gevonden.exerciseIds.map((exId) => opslag.oefening(exId)));
          if (!actief) return;
          const perId: Record<string, Exercise> = {};
          for (const ex of items) if (ex) perId[ex.id] = ex;
          setInhoudPerId(perId);
        }
      } catch {
        if (actief) setFout(t("materiaal.map.laadFout"));
      } finally {
        if (actief) setGeladen(true);
      }
    })();
    return () => {
      actief = false;
    };
  }, [id]);

  const isOrgMap = !!map?.organisatie;
  // Een persoonlijke map beheert haar eigenaar; een organisatiemap elke beheerder.
  const magBeheren =
    !!map && isLeraar && (isOrgMap ? isBeheerder : isEigenMap(map, gebruiker));

  /** Behoud de volgorde van de map, niet die van de bibliotheek. */
  const inhoud = useMemo(() => {
    if (!map) return [];
    return map.exerciseIds
      .map((exId) => inhoudPerId[exId])
      .filter((e): e is Exercise => !!e)
      // Werd iets in een organisatiemap later terug privé gezet, dan is het niet meer
      // voor collega's bedoeld. De beheerder ziet het wel, om het op te ruimen.
      .filter((ex) => !isOrgMap || magBeheren || pastInOrganisatiemap(ex));
  }, [map, inhoudPerId, isOrgMap, magBeheren]);

  const toevoegbaar = useMemo(() => {
    if (!map) return [];
    const q = zoek.trim().toLowerCase();
    return oefeningen.filter(
      (ex) =>
        (isOrgMap ? pastInOrganisatiemap(ex) : isEigenMateriaal(ex, gebruiker)) &&
        !map.exerciseIds.includes(ex.id) &&
        (!q ||
          ex.title.toLowerCase().includes(q) ||
          ex.creatorName.toLowerCase().includes(q) ||
          ex.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }, [map, oefeningen, gebruiker, isOrgMap, zoek]);

  /** Waar een oefening uit deze map naartoe kan: een andere map van dezelfde soort. */
  const andereMappen = useMemo(() => {
    if (!map) return [];
    return (isOrgMap ? orgMappen : mappen).filter((m) => m.id !== map.id);
  }, [map, isOrgMap, orgMappen, mappen]);

  const verplaats = async (ex: Exercise) => {
    if (!map) return;
    const doel = andereMappen.find((m) => m.id === doelMapId);
    if (!doel) return;
    try {
      await opslag.verplaatsOefening(ex.id, map.id, doel.id);
      setMap({ ...map, exerciseIds: map.exerciseIds.filter((i) => i !== ex.id) });
      setMelding({
        tekst: t("materiaal.map.verplaatst", { titel: ex.title, map: doel.title }),
        mapId: doel.id,
      });
      setVerplaatsVoor(null);
      setDoelMapId("");
      setFout("");
    } catch {
      setFout(t("materiaal.map.verplaatsenMislukt"));
    }
  };

  const wijzigMap = async (verandering: Partial<Lesmap>) => {
    if (!map) return;
    try {
      await opslag.wijzigMap(map.id, verandering);
      setMap({ ...map, ...verandering });
      if (verandering.exerciseIds) {
        // Nieuw toegevoegde oefeningen kennen we al uit het eigen materiaal.
        const perId = { ...inhoudPerId };
        for (const ex of oefeningen) if (verandering.exerciseIds.includes(ex.id)) perId[ex.id] = ex;
        setInhoudPerId(perId);
      }
      setFout("");
    } catch {
      setFout(t("materiaal.map.wijzigingMislukt"));
    }
  };

  const verwijderMap = async () => {
    if (!map) return;
    const vraag = isOrgMap
      ? t("materiaal.map.verwijderOrgVraag", { titel: map.title })
      : t("materiaal.map.verwijderVraag", { titel: map.title });
    if (!confirm(vraag)) return;
    try {
      await opslag.verwijderMap(map.id);
      router.push("/mappen");
    } catch {
      setFout(t("materiaal.map.verwijderenMislukt"));
    }
  };

  if (!geladen) return <div className="h-64" aria-hidden />;

  if (!map) {
    return (
      <div className="max-w-sm mx-auto text-center py-20 u-fade">
        <h1 className="text-xl font-extrabold text-merk-900 mb-2">
          {t("materiaal.map.bestaatNiet")}
        </h1>
        <p className="text-sm text-slate-600 mb-5">
          {t("materiaal.map.nietGevonden")}
        </p>
        <Link
          href="/mappen"
          className="inline-flex px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
        >
          {t("materiaal.map.naarMijnMappen")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 u-fade">

      <div className="flex items-center justify-between gap-4">
        <Link
          href={isLeraar ? "/mappen" : "/"}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-merk-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("algemeen.terug")}</span>
        </Link>

        <div className="flex items-center gap-1">
          {magBeheren && (
            <button
              onClick={verwijderMap}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title={t("materiaal.map.mapVerwijderen")}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setDelenOpen(true)}
            className="px-3 py-2 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{t("materiaal.map.deelMap")}</span>
          </button>
        </div>
      </div>

      <header>
        {wijzigNaam !== null ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (wijzigNaam.trim()) wijzigMap({ title: wijzigNaam.trim() });
              setWijzigNaam(null);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={wijzigNaam}
              onChange={(e) => setWijzigNaam(e.target.value)}
              aria-label={t("materiaal.map.naamLabel")}
              autoFocus
              className="flex-1 px-3 py-2 text-lg font-bold rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-merk-800 hover:bg-merk-900 text-white transition-colors"
              aria-label={t("materiaal.map.naamBewaren")}
            >
              <Check className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="flex items-start gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-merk-900 tracking-tight leading-snug">
              {map.title}
            </h1>
            {magBeheren && (
              <button
                onClick={() => setWijzigNaam(map.title)}
                className="p-1.5 mt-1 rounded-lg text-slate-500 hover:text-merk-900 hover:bg-slate-100 transition-colors shrink-0"
                title={t("materiaal.map.naamAanpassen")}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
          {isOrgMap && <Building2 className="w-3.5 h-3.5 shrink-0" />}
          {tn("materiaal.oefeningen", inhoud.length)} ·{" "}
          {isOrgMap
            ? t("materiaal.map.mapVanOrganisatie")
            : t("materiaal.map.mapVan", { naam: map.creatorName })}
        </p>
        {map.description && (
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{map.description}</p>
        )}
      </header>

      {fout && (
        <p role="alert" className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          {fout}
        </p>
      )}

      {melding && (
        <p role="status" className="text-xs font-semibold text-merk-900 bg-merk-50 border border-merk/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <span>{melding.tekst}</span>
          <Link href={`/mappen/${melding.mapId}`} className="font-bold underline shrink-0">
            {t("materiaal.map.naarDieMap")}
          </Link>
        </p>
      )}

      {!magBeheren && inhoud.length > 1 && (
        <Studietip
          tekst={
            inhoud.some((ex) => ex.type === "flashcard") &&
            inhoud.some((ex) => ex.type === "quiz" || ex.type === "matching")
              ? t("materiaal.map.tipFlashcards")
              : t("materiaal.map.tipNietAlles")
          }
        />
      )}

      {inhoud.length === 0 ? (
        <p className="text-sm text-slate-600 bg-white border border-slate-200 rounded-2xl p-8 text-center">
          {t("materiaal.map.leeg")}
        </p>
      ) : (
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {inhoud.map((ex, index) => {
            const Icon = WERKVORMEN[ex.type].icon;
            return (
              <div key={ex.id} className="py-3.5">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 shrink-0 rounded-full bg-merk-50 text-merk-900 text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>

                <Link href={`/oefen/${ex.id}`} className="min-w-0 flex-1 group">
                  <span className="block text-sm font-bold text-slate-900 truncate group-hover:text-merk-900 transition-colors">
                    {ex.title}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {WERKVORMEN[ex.type].label} · {inhoudSamenvatting(ex)} ·{" "}
                    {lesfaseLabel(ex.didacticGoal).toLowerCase()}
                    {ex.visibility === "prive" && (
                      <Lock className="w-3 h-3 text-amber-600" aria-label={t("materiaal.alleenIk")} />
                    )}
                  </span>
                </Link>

                <Link
                  href={`/oefen/${ex.id}`}
                  className="px-3 py-2 rounded-xl bg-merk-800 hover:bg-merk-900 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{t("materiaal.map.start")}</span>
                </Link>

                {magBeheren && andereMappen.length > 0 && (
                  <button
                    onClick={() => {
                      setVerplaatsVoor(verplaatsVoor === ex.id ? null : ex.id);
                      setDoelMapId("");
                    }}
                    aria-expanded={verplaatsVoor === ex.id}
                    className="p-2 rounded-lg text-slate-500 hover:text-merk-900 hover:bg-slate-100 transition-colors shrink-0"
                    title={t("materiaal.map.naarAndereMap")}
                  >
                    <FolderInput className="w-4 h-4" />
                  </button>
                )}

                {magBeheren && (
                  <button
                    onClick={() =>
                      wijzigMap({ exerciseIds: map.exerciseIds.filter((i) => i !== ex.id) })
                    }
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                    title={t("materiaal.map.uitMapHalen")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {verplaatsVoor === ex.id && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    verplaats(ex);
                  }}
                  className="mt-3 ml-10 flex flex-wrap items-center gap-2"
                >
                  <label htmlFor={`doel-${ex.id}`} className="text-xs font-bold text-slate-700">
                    {t("materiaal.map.verplaatsenNaar")}
                  </label>
                  <select
                    id={`doel-${ex.id}`}
                    value={doelMapId}
                    onChange={(e) => setDoelMapId(e.target.value)}
                    autoFocus
                    className="flex-1 min-w-0 px-3 py-2 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
                  >
                    <option value="">{t("materiaal.map.kiesMap")}</option>
                    {andereMappen.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={!doelMapId}
                    className="px-3 py-2 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-40 text-white font-bold text-xs transition-colors"
                  >
                    {t("materiaal.map.verplaats")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerplaatsVoor(null)}
                    className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
                  >
                    {t("materiaal.map.annuleer")}
                  </button>
                </form>
              )}
              </div>
            );
          })}
        </div>
      )}

      {magBeheren && (
        <section>
          {!voegToe ? (
            <button
              onClick={() => setVoegToe(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:border-merk hover:text-merk-900 font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t("materiaal.map.toevoegen")}</span>
            </button>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900">
                  {isOrgMap ? t("materiaal.map.uitGedeeld") : t("materiaal.map.uitJouw")}
                </h2>
                <button
                  onClick={() => {
                    setVoegToe(false);
                    setZoek("");
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                  aria-label={t("algemeen.sluiten")}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <label className="relative block mb-3">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={zoek}
                  onChange={(e) => setZoek(e.target.value)}
                  placeholder={isOrgMap ? t("materiaal.map.zoekOrg") : t("materiaal.map.zoekEigen")}
                  aria-label={t("materiaal.map.zoekLabel")}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white border border-veldrand text-slate-900 placeholder-slate-500 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
                />
              </label>

              {toevoegbaar.length === 0 && zoek.trim() ? (
                <p className="text-sm text-slate-600">
                  {t("materiaal.map.nietsGevonden", { zoek: zoek.trim() })}
                </p>
              ) : toevoegbaar.length === 0 && isOrgMap ? (
                <p className="text-sm text-slate-600">
                  {t("materiaal.map.alGedeeldErin")}
                </p>
              ) : toevoegbaar.length === 0 ? (
                <p className="text-sm text-slate-600">
                  {tr("materiaal.map.alEigenErin", {
                    link: (s) => (
                      <Link href="/maken" className="font-bold text-merk-900 hover:underline">
                        {s}
                      </Link>
                    ),
                  })}
                </p>
              ) : (
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {toevoegbaar.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() =>
                        wijzigMap({ exerciseIds: [...map.exerciseIds, ex.id] })
                      }
                      className="w-full flex items-center gap-3 py-2.5 text-left group"
                    >
                      <Plus className="w-4 h-4 text-slate-500 group-hover:text-merk shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-slate-900 truncate">
                          {ex.title}
                        </span>
                        <span className="block text-xs text-slate-500 truncate">
                          {WERKVORMEN[ex.type].label} · {inhoudSamenvatting(ex)}
                          {isOrgMap && ` · ${t("materiaal.vanMaker", { naam: ex.creatorName })}`}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <ShareModal
        isOpen={delenOpen}
        onClose={() => setDelenOpen(false)}
        title={map.title}
        shareCode={map.shareCode}
        id={map.id}
        isSet
      />
    </div>
  );
}
