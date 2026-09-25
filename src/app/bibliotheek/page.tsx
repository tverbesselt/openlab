"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, PlusCircle, Info } from "lucide-react";
import { ShareModal } from "@/components/ShareModal";
import { MateriaalKaart } from "@/components/MateriaalKaart";
import { MapKiezer } from "@/components/MapKiezer";
import { opslag, generateShortCode, useMateriaal } from "@/lib/opslag";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Exercise, DidacticGoal, ExerciseType } from "@/lib/types";
import {
  LESFASES,
  LESFASE_BY_ID,
  WERKVORMEN,
  isEigenMateriaal,
  zichtbaarVoor,
  mappenVanOefening,
} from "@/lib/labels";
import { useInstellingen } from "@/lib/instellingen/AppProvider";
import { t } from "@/lib/i18n";

function BibliotheekInhoud() {
  const searchParams = useSearchParams();

  const { gebruiker, isLeraar, isBeheerder } = useAuth();
  const { isAan, instellingen } = useInstellingen();
  const {
    oefeningen: exercises,
    mappen,
    orgMappen,
    laden,
    fout,
    setOefeningen: setExercises,
    setMappen,
    setOrgMappen,
  } = useMateriaal();
  const [mapVoor, setMapVoor] = useState<Exercise | null>(null);
  const [orgMapVoor, setOrgMapVoor] = useState<Exercise | null>(null);
  const [zoek, setZoek] = useState(searchParams.get("q") ?? "");
  const [fase, setFase] = useState<DidacticGoal | "alle">(
    (searchParams.get("fase") as DidacticGoal) ?? "alle"
  );
  const [enkelVanMij, setEnkelVanMij] = useState(searchParams.get("van") === "mij");
  const [selectedShare, setSelectedShare] = useState<Exercise | null>(null);
  const [melding, setMelding] = useState("");

  const gefilterd = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    // Privé materiaal van collega's hoort hier niet thuis.
    return zichtbaarVoor(exercises, gebruiker).filter((ex) => {
      const matchZoek =
        !q ||
        ex.title.toLowerCase().includes(q) ||
        ex.description.toLowerCase().includes(q) ||
        ex.tags.some((t) => t.toLowerCase().includes(q)) ||
        WERKVORMEN[ex.type].label.toLowerCase().includes(q);

      const matchFase = fase === "alle" || ex.didacticGoal === fase;
      const matchEigenaar = !enkelVanMij || isEigenMateriaal(ex, gebruiker);

      return matchZoek && matchFase && matchEigenaar;
    });
  }, [exercises, zoek, fase, enkelVanMij, gebruiker]);

  /** Materiaal gegroepeerd per werkvorm, zodat meteen duidelijk is wát er is. */
  const perWerkvorm = useMemo(() => {
    const groepen = new Map<ExerciseType, Exercise[]>();
    for (const ex of gefilterd) {
      const lijst = groepen.get(ex.type) ?? [];
      lijst.push(ex);
      groepen.set(ex.type, lijst);
    }
    return [...groepen.entries()];
  }, [gefilterd]);

  const mislukt = (wat: "kopieren" | "zichtbaarheid" | "verwijderen") =>
    setMelding(t(`materiaal.bibliotheek.mislukt.${wat}`));

  const handleKopieer = async (ex: Exercise) => {
    // Een kopie is nieuw materiaal van jou: eigen code, standaard alleen voor jou.
    const kopie: Exercise = {
      ...ex,
      id: `kopie-${Date.now()}`,
      title: t("materiaal.bibliotheek.kopieTitel", { titel: ex.title }),
      creatorName: gebruiker?.naam ?? t("materiaal.bibliotheek.onbekend"),
      creatorId: gebruiker?.id,
      visibility: "prive",
      shareCode: generateShortCode(),
      createdAt: new Date().toISOString().split("T")[0],
    };
    try {
      await opslag.maakOefeningen([kopie]);
      setExercises([kopie, ...exercises]);
      setMelding(t("materiaal.bibliotheek.gekopieerd", { titel: ex.title }));
    } catch {
      mislukt("kopieren");
    }
  };

  /** Privé of gedeeld met de hele organisatie — één klik heen en terug. */
  const handleZichtbaarheid = async (ex: Exercise) => {
    const nieuw = ex.visibility === "prive" ? ("organisatie" as const) : ("prive" as const);
    try {
      await opslag.wijzigOefening(ex.id, { visibility: nieuw });
      setExercises(exercises.map((o) => (o.id === ex.id ? { ...o, visibility: nieuw } : o)));
      setMelding(
        nieuw === "organisatie"
          ? t("materiaal.bibliotheek.nuGedeeld", { titel: ex.title })
          : t("materiaal.bibliotheek.nuPrive", { titel: ex.title })
      );
    } catch {
      mislukt("zichtbaarheid");
    }
  };

  const handleVerwijder = async (id: string) => {
    if (!confirm(t("materiaal.bibliotheek.verwijderVraag"))) return;
    try {
      await opslag.verwijderOefening(id);
      setExercises(exercises.filter((ex) => ex.id !== id));
    } catch {
      mislukt("verwijderen");
    }
  };

  const actieveFase = fase !== "alle" ? LESFASE_BY_ID[fase] : undefined;

  return (
    <div className="space-y-6 u-fade">

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-merk-900 tracking-tight mb-1">
            {t("materiaal.bibliotheek.titel")}
          </h1>
          <p className="text-sm text-slate-600">
            {t("materiaal.bibliotheek.intro")}
          </p>
        </div>

        {isLeraar && (
          <Link
            href="/maken"
            className="shrink-0 px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t("materiaal.bibliotheek.nieuweOefening")}</span>
          </Link>
        )}
      </div>

      {/* Filters: zoeken, lesfase, eigenaar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={zoek}
              onChange={(e) => setZoek(e.target.value)}
              placeholder={t("materiaal.bibliotheek.zoekPlaatshouder")}
              aria-label={t("materiaal.bibliotheek.zoekLabel")}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-merk focus:outline-none text-slate-800 placeholder-slate-400"
            />
          </div>

          {isLeraar && (
            <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs font-bold shrink-0">
              <button
                onClick={() => setEnkelVanMij(false)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  !enkelVanMij ? "bg-white text-merk-900 shadow-xs" : "text-slate-500"
                }`}
              >
                {t("materiaal.bibliotheek.alles")}
              </button>
              <button
                onClick={() => setEnkelVanMij(true)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  enkelVanMij ? "bg-white text-merk-900 shadow-xs" : "text-slate-500"
                }`}
              >
                {t("materiaal.bibliotheek.vanMij")}
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <FaseKnop actief={fase === "alle"} onClick={() => setFase("alle")}>
            {t("materiaal.bibliotheek.alleLesfases")}
          </FaseKnop>
          {LESFASES.filter((f) => f.werkvormen.some(isAan)).map((f) => (
            <FaseKnop key={f.id} actief={fase === f.id} onClick={() => setFase(f.id)}>
              {f.nummer}. {f.label}
            </FaseKnop>
          ))}
        </div>
      </div>

      {actieveFase && (
        <p className="text-xs text-merk-900 bg-merk-50 border border-merk/20 rounded-xl px-4 py-3 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-px" />
          <span>
            <strong>{actieveFase.label}:</strong> {actieveFase.wanneer}
            {instellingen.tips.leraren && <> {actieveFase.waarom}</>}
            {isLeraar && instellingen.tips.leraren && (
              <>
                {" "}
                <strong>{t("materiaal.bibliotheek.zegErbij")}</strong> &ldquo;{actieveFase.zegErbij}&rdquo;
              </>
            )}
          </span>
        </p>
      )}

      {melding && (
        <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          {melding}
        </p>
      )}

      {fout && (
        <p role="alert" className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          {fout}
        </p>
      )}

      {/* Resultaten, gegroepeerd per werkvorm */}
      {laden ? (
        <div className="h-40" aria-hidden />
      ) : perWerkvorm.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <p className="text-sm text-slate-600 mb-4">
            {enkelVanMij
              ? t("materiaal.bibliotheek.geenEigen")
              : t("materiaal.bibliotheek.geenGevonden")}
          </p>
          {isLeraar && (
            <Link
              href="/maken"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t("materiaal.bibliotheek.eersteOefening")}</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {perWerkvorm.map(([type, lijst]) => {
            const werkvorm = WERKVORMEN[type];
            const Icon = werkvorm.icon;

            return (
              <section key={type}>
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-9 h-9 shrink-0 rounded-xl bg-merk-50 text-merk-900 flex items-center justify-center border border-merk/20">
                    <Icon className="w-4.5 h-4.5" />
                  </span>
                  <div>
                    <h2 className="font-bold text-base text-merk-900 leading-tight">
                      {werkvorm.label}{" "}
                      <span className="font-semibold text-slate-500">({lijst.length})</span>
                    </h2>
                    <p className="text-xs text-slate-600 max-w-2xl">{werkvorm.uitleg}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lijst.map((ex) => (
                    <MateriaalKaart
                      key={ex.id}
                      ex={ex}
                      isLeraar={isLeraar}
                      isEigen={isEigenMateriaal(ex, gebruiker)}
                      onDelen={setSelectedShare}
                      mapNamen={mappenVanOefening([...mappen, ...orgMappen], ex.id).map(
                        (m) => m.title
                      )}
                      onKopieer={isLeraar ? handleKopieer : undefined}
                      onVerwijder={isLeraar ? handleVerwijder : undefined}
                      onInMap={isLeraar ? setMapVoor : undefined}
                      onInOrganisatiemap={isBeheerder ? setOrgMapVoor : undefined}
                      onZichtbaarheid={isLeraar ? handleZichtbaarheid : undefined}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {mapVoor && gebruiker && (
        <MapKiezer
          oefening={mapVoor}
          eigenaar={gebruiker}
          onSluit={() => setMapVoor(null)}
          onGewijzigd={setMappen}
        />
      )}

      {orgMapVoor && gebruiker && (
        <MapKiezer
          oefening={orgMapVoor}
          eigenaar={gebruiker}
          organisatie
          onSluit={() => setOrgMapVoor(null)}
          onGewijzigd={setOrgMappen}
        />
      )}

      {selectedShare && (
        <ShareModal
          isOpen={!!selectedShare}
          onClose={() => setSelectedShare(null)}
          title={selectedShare.title}
          shareCode={selectedShare.shareCode}
          id={selectedShare.id}
        />
      )}
    </div>
  );
}

function FaseKnop({
  actief,
  onClick,
  children,
}: {
  actief: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
        actief
          ? "bg-merk-900 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-merk-50 hover:text-merk-900"
      }`}
    >
      {children}
    </button>
  );
}

export default function BibliotheekPagina() {
  return (
    <Suspense fallback={<div className="h-64" aria-hidden />}>
      <BibliotheekInhoud />
    </Suspense>
  );
}
