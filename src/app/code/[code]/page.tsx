"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { opslag } from "@/lib/opslag";
import { t } from "@/lib/i18n";
import { tr } from "@/lib/i18n/rijk";

/** Korte link uit het deelvenster: /code/MARKT1 opent meteen de juiste oefening. */
export default function CodePagina() {
  const params = useParams();
  const router = useRouter();
  const [toestand, setToestand] = useState<"zoekt" | "niet-gevonden" | "fout">("zoekt");

  const code = String(params.code ?? "").toUpperCase();

  useEffect(() => {
    let actief = true;
    // Een code hoort bij één oefening of bij een hele map.
    opslag
      .viaCode(code)
      .then((doel) => {
        if (!actief) return;
        if (doel?.soort === "oefening") router.replace(`/oefen/${doel.id}`);
        else if (doel?.soort === "map") router.replace(`/mappen/${doel.id}`);
        else setToestand("niet-gevonden");
      })
      .catch(() => actief && setToestand("fout"));
    return () => {
      actief = false;
    };
  }, [code, router]);

  if (toestand === "zoekt") {
    return <p className="text-center py-20 text-sm text-slate-500">{t("live.code.geduld")}</p>;
  }

  return (
    <div className="max-w-sm mx-auto text-center py-20 u-fade">
      <h1 className="text-xl font-extrabold text-merk-900 mb-2">
        {toestand === "fout" ? t("live.code.geenVerbinding") : t("live.code.bestaatNiet")}
      </h1>
      <p className="text-sm text-slate-600 mb-5">
        {toestand === "fout"
          ? t("live.code.geenVerbindingUitleg")
          : tr(
              "live.code.bestaatNietUitleg",
              { code: (inhoud) => <strong className="font-mono">{inhoud}</strong> },
              { code }
            )}
      </p>
      <Link
        href="/"
        className="inline-flex px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
      >
        {t("live.code.naarStart")}
      </Link>
    </div>
  );
}
