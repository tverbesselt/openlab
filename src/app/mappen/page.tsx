"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Folder, FolderPlus, ArrowRight, Lock, Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { opslag, generateShortCode, useMateriaal } from "@/lib/opslag";
import { Exercise, Lesmap } from "@/lib/types";
import { eigenMappen, isEigenMateriaal, pastInOrganisatiemap } from "@/lib/labels";
import { LeraarPoort } from "@/components/LeraarPoort";
import { MapKiezer } from "@/components/MapKiezer";
import { t, tn, vergelijk } from "@/lib/i18n";

export default function MappenPagina() {
  const { isLeraar, isBeheerder, gebruiker } = useAuth();
  const { mappen, orgMappen, oefeningen, laden, setMappen, setOrgMappen } = useMateriaal();
  const [fout, setFout] = useState("");
  const [orgMapVoor, setOrgMapVoor] = useState<Exercise | null>(null);

  if (laden) return <div className="h-64" aria-hidden />;
  if (!isLeraar) {
    return (
      <LeraarPoort uitleg={t("materiaal.mappen.leraarPoort")} />
    );
  }

  const mijnMappen = eigenMappen(mappen, gebruiker);
  const mijnOefeningen = oefeningen.filter((ex) => isEigenMateriaal(ex, gebruiker));
  const inEenMap = new Set(mijnMappen.flatMap((m) => m.exerciseIds));
  const ongeordend = mijnOefeningen.filter((ex) => !inEenMap.has(ex.id));

  // Voor de beheerder: gedeeld materiaal dat nog in geen enkele organisatiemap staat.
  const inEenOrgMap = new Set(orgMappen.flatMap((m) => m.exerciseIds));
  const zonderOrgMap = oefeningen.filter(
    (ex) => pastInOrganisatiemap(ex) && !inEenOrgMap.has(ex.id)
  );

  const maakMap = async (titel: string, organisatie: boolean) => {
    if (!gebruiker) return false;
    const nieuw: Lesmap = {
      id: `map-${Date.now()}`,
      title: titel,
      description: "",
      exerciseIds: [],
      creatorName: gebruiker.naam,
      creatorId: gebruiker.id,
      shareCode: generateShortCode(),
      createdAt: new Date().toISOString().split("T")[0],
      ...(organisatie && { organisatie: true }),
    };
    try {
      await opslag.maakMap(nieuw);
      if (organisatie) {
        setOrgMappen(
          [...orgMappen, nieuw].sort((a, b) => vergelijk(a.title, b.title))
        );
      } else {
        setMappen([nieuw, ...mappen]);
      }
      setFout("");
      return true;
    } catch {
      setFout(t("materiaal.mapBewarenMislukt"));
      return false;
    }
  };

  const toonOrganisatie = isBeheerder || orgMappen.length > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-10 u-fade">

      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-merk-900 tracking-tight mb-1">
          {t("algemeen.menu.mappen")}
        </h1>
        <p className="text-sm text-slate-600">
          {t("materiaal.mappen.intro")}
        </p>
      </header>

      <NieuweMap
        label={t("materiaal.mappen.nieuweMapLabel")}
        voorbeeld={t("materiaal.mappen.nieuweMapVoorbeeld")}
        knop={t("materiaal.mappen.nieuweMap")}
        onMaak={(titel) => maakMap(titel, false)}
      />

      {fout && (
        <p role="alert" className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          {fout}
        </p>
      )}

      {mijnMappen.length === 0 ? (
        <p className="text-sm text-slate-600 bg-white border border-slate-200 rounded-2xl p-8 text-center">
          {t("materiaal.mappen.geenMappen")}
        </p>
      ) : (
        <MapLijst mappen={mijnMappen} oefeningen={oefeningen} />
      )}

      {ongeordend.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600 mb-3">
            {t("materiaal.mappen.nogLos")}
          </h2>
          <p className="text-sm text-slate-600 mb-3">
            {tn("materiaal.mappen.losAantal", ongeordend.length)}
          </p>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {ongeordend.slice(0, 5).map((ex) => (
              <Link
                key={ex.id}
                href={`/bibliotheek?van=mij&q=${encodeURIComponent(ex.title)}`}
                className="flex items-center gap-3 py-3 group"
              >
                <span className="min-w-0 flex-1 text-sm font-bold text-slate-900 truncate group-hover:text-merk-900 transition-colors">
                  {ex.title}
                </span>
                <span className="text-xs font-bold text-merk-900 shrink-0">
                  {t("materiaal.inMapPlaatsen")}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {toonOrganisatie && (
        <section className="space-y-4 pt-2">
          <div>
            <h2 className="text-xl font-extrabold text-merk-900 tracking-tight mb-1 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {t("materiaal.mappen.orgTitel")}
            </h2>
            <p className="text-sm text-slate-600">
              {isBeheerder
                ? t("materiaal.mappen.orgUitlegBeheerder")
                : t("materiaal.mappen.orgUitleg")}
            </p>
          </div>

          {isBeheerder && (
            <NieuweMap
              label={t("materiaal.mappen.nieuweOrgLabel")}
              voorbeeld={t("materiaal.mappen.nieuweOrgVoorbeeld")}
              knop={t("materiaal.mappen.nieuweOrg")}
              onMaak={(titel) => maakMap(titel, true)}
            />
          )}

          {orgMappen.length === 0 ? (
            <p className="text-sm text-slate-600 bg-white border border-slate-200 rounded-2xl p-8 text-center">
              {t("materiaal.mappen.geenOrg")}
            </p>
          ) : (
            <MapLijst mappen={orgMappen} oefeningen={oefeningen} organisatie />
          )}

          {isBeheerder && zonderOrgMap.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600 mb-3 mt-6">
                {t("materiaal.mappen.zonderOrgTitel")}
              </h3>
              <p className="text-sm text-slate-600 mb-3">
                {tn("materiaal.mappen.zonderOrgAantal", zonderOrgMap.length)}
              </p>
              <div className="divide-y divide-slate-200 border-y border-slate-200">
                {zonderOrgMap.slice(0, 8).map((ex) => (
                  <div key={ex.id} className="flex items-center gap-3 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-900 truncate">
                        {ex.title}
                      </span>
                      <span className="block text-xs text-slate-500 truncate">
                        {t("materiaal.vanMaker", { naam: ex.creatorName })}
                      </span>
                    </span>
                    <button
                      onClick={() => setOrgMapVoor(ex)}
                      className="text-xs font-bold text-merk-900 hover:underline shrink-0"
                    >
                      {t("materiaal.inOrgPlaatsen")}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
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
    </div>
  );
}

function NieuweMap({
  label,
  voorbeeld,
  knop,
  onMaak,
}: {
  label: string;
  voorbeeld: string;
  knop: string;
  /** Geeft true terug als de map bewaard is; dan maken we het veld leeg. */
  onMaak: (titel: string) => Promise<boolean>;
}) {
  const [naam, setNaam] = useState("");

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    const titel = naam.trim();
    if (titel && (await onMaak(titel))) setNaam("");
  };

  return (
    <form onSubmit={verstuur} className="flex gap-2">
      <input
        type="text"
        value={naam}
        onChange={(e) => setNaam(e.target.value)}
        placeholder={voorbeeld}
        aria-label={label}
        className="flex-1 min-w-0 px-3.5 py-2.5 text-sm rounded-xl bg-white border border-veldrand text-slate-900 placeholder-slate-500 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
      />
      <button
        type="submit"
        disabled={!naam.trim()}
        className="px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-40 text-white font-bold text-sm transition-colors flex items-center gap-1.5 shrink-0"
      >
        <FolderPlus className="w-4 h-4" />
        <span className="hidden sm:inline">{knop}</span>
      </button>
    </form>
  );
}

function MapLijst({
  mappen,
  oefeningen,
  organisatie = false,
}: {
  mappen: Lesmap[];
  oefeningen: Exercise[];
  organisatie?: boolean;
}) {
  return (
    <div className="divide-y divide-slate-200 border-y border-slate-200">
      {mappen.map((map) => {
        const aantalPrive = organisatie
          ? 0
          : map.exerciseIds.filter((id) => {
              const ex = oefeningen.find((o) => o.id === id);
              return ex?.visibility === "prive";
            }).length;
        const Icoon = organisatie ? Building2 : Folder;

        return (
          <Link key={map.id} href={`/mappen/${map.id}`} className="flex items-center gap-3 py-4 group">
            <Icoon className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-slate-900 truncate group-hover:text-merk-900 transition-colors">
                {map.title}
              </span>
              <span className="block text-xs text-slate-500 flex items-center gap-1.5">
                {tn("materiaal.oefeningen", map.exerciseIds.length)}
                {aantalPrive > 0 && (
                  <>
                    <span aria-hidden>·</span>
                    <Lock className="w-3 h-3" />
                    {t("materiaal.mappen.alleenVoorJou", { n: aantalPrive })}
                  </>
                )}
              </span>
            </span>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-merk group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}
