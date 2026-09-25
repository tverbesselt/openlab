"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ClassroomTimer } from "@/components/tools/ClassroomTimer";
import { StudentRandomizer } from "@/components/tools/StudentRandomizer";
import { GroupGenerator } from "@/components/tools/GroupGenerator";
import { KLASTOOLS } from "@/lib/labels";
import { useInstellingen } from "@/lib/instellingen/AppProvider";
import { Uitgeschakeld } from "@/components/Uitgeschakeld";
import { t } from "@/lib/i18n";

type ToolId = "timer" | "randomizer" | "groups";

function KlastoolsInhoud() {
  const searchParams = useSearchParams();
  const { isAan } = useInstellingen();
  // "groups" is de groepenmaker; de andere ids zijn gelijk aan hun werkvorm.
  const tools = KLASTOOLS.filter((k) => isAan(k.id === "groups" ? "groupmaker" : k.id));
  const [actief, setActief] = useState<ToolId>(tools[0]?.id ?? "timer");

  useEffect(() => {
    const param = searchParams.get("tool");
    if (tools.some((k) => k.id === param)) setActief(param as ToolId);
    // tools volgt uit de instellingen; de param is wat telt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const huidig = tools.find((k) => k.id === actief);

  if (tools.length === 0) return <Uitgeschakeld />;

  return (
    <div className="max-w-3xl mx-auto space-y-6 u-fade">

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-merk-900 tracking-tight mb-1">
          {t("klas.klastools.titel")}
        </h1>
        <p className="text-sm text-slate-600">
          {t("klas.klastools.intro")}
        </p>
      </div>

      <div className={`grid gap-2 ${tools.length === 3 ? "grid-cols-3" : tools.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActief = actief === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActief(tool.id)}
              aria-pressed={isActief}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors border ${
                isActief
                  ? "bg-merk-800 text-white border-merk-800"
                  : "bg-white text-slate-700 border-slate-200 hover:border-merk"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>

      {huidig && <p className="text-xs text-slate-600 text-center">{huidig.uitleg}</p>}

      <div>
        {huidig?.id === "timer" && <ClassroomTimer />}
        {huidig?.id === "randomizer" && <StudentRandomizer />}
        {huidig?.id === "groups" && <GroupGenerator />}
      </div>
    </div>
  );
}

export default function KlastoolsPagina() {
  return (
    <Suspense fallback={<div className="h-64" aria-hidden />}>
      <KlastoolsInhoud />
    </Suspense>
  );
}
