"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Play,
  Share2,
  Copy,
  Trash2,
  Presentation,
  Eye,
  MoreHorizontal,
  FolderPlus,
  Lock,
  Building2,
} from "lucide-react";
import { Exercise } from "@/lib/types";
import {
  WERKVORMEN,
  ZICHTBAARHEID,
  inhoudSamenvatting,
  isKlassikaal,
  lesfaseLabel,
} from "@/lib/labels";
import { t } from "@/lib/i18n";

interface MateriaalKaartProps {
  ex: Exercise;
  /** Toont de leraaracties (delen, klassikaal starten, ordenen). */
  isLeraar: boolean;
  isEigen?: boolean;
  /** Namen van de mappen waarin dit materiaal zit. */
  mapNamen?: string[];
  onDelen: (ex: Exercise) => void;
  onKopieer?: (ex: Exercise) => void;
  onVerwijder?: (id: string) => void;
  onInMap?: (ex: Exercise) => void;
  /** Alleen voor een beheerder, bij materiaal dat met de organisatie gedeeld is. */
  onInOrganisatiemap?: (ex: Exercise) => void;
  onZichtbaarheid?: (ex: Exercise) => void;
}

export function MateriaalKaart({
  ex,
  isLeraar,
  isEigen,
  mapNamen,
  onDelen,
  onKopieer,
  onVerwijder,
  onInMap,
  onInOrganisatiemap,
  onZichtbaarheid,
}: MateriaalKaartProps) {
  const werkvorm = WERKVORMEN[ex.type];
  const Icon = werkvorm.icon;
  const klassikaal = isKlassikaal(ex);
  const zichtbaarheid = ZICHTBAARHEID[ex.visibility];

  return (
    <article className="bg-white rounded-2xl border border-slate-200 hover:border-merk transition-colors flex flex-col">
      <div className="p-5 flex-1">
        <div className="flex items-start gap-3 mb-3">
          <span className="w-10 h-10 shrink-0 rounded-xl bg-merk-50 text-merk-900 flex items-center justify-center border border-merk/20">
            <Icon className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-merk-900 leading-tight">
              {werkvorm.label}
            </p>
            <p className="text-xs text-slate-600">
              {inhoudSamenvatting(ex)} · {lesfaseLabel(ex.didacticGoal).toLowerCase()}
            </p>
          </div>
        </div>

        <h3 className="font-bold text-base text-slate-900 leading-snug mb-1 line-clamp-2">
          {ex.title}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{ex.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px] text-slate-600">
          <span
            className={`px-2 py-0.5 rounded-md font-semibold ${
              klassikaal
                ? "bg-rose-50 text-rose-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {klassikaal ? t("materiaal.kaart.opHetDigibord") : t("materiaal.kaart.opEigenTempo")}
          </span>

          {isEigen && ex.visibility === "prive" && (
            <span
              className="px-2 py-0.5 rounded-md font-semibold bg-amber-50 text-amber-800 inline-flex items-center gap-1"
              title={zichtbaarheid.uitleg}
            >
              <Lock className="w-3 h-3" />
              {zichtbaarheid.label}
            </span>
          )}

          <span>{isEigen ? t("materiaal.kaart.vanJou") : ex.creatorName}</span>
        </div>

        {mapNamen && mapNamen.length > 0 && (
          <p className="mt-2 text-[11px] text-slate-600 truncate" title={mapNamen.join(", ")}>
            {t("materiaal.kaart.inMappen", { mappen: mapNamen.join(" · ") })}
          </p>
        )}
      </div>

      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
        {isLeraar ? (
          <>
            <div className="flex items-center gap-1">
              <Link
                href={`/oefen/${ex.id}`}
                className="p-2 rounded-lg text-slate-500 hover:text-merk-900 hover:bg-merk-50 transition-colors"
                title={t("materiaal.kaart.zelfBekijken")}
              >
                <Eye className="w-4 h-4" />
              </Link>

              <Menu label={t("materiaal.kaart.meerVoor", { titel: ex.title })}>
                {isEigen && onInMap && (
                  <MenuKnop icon={FolderPlus} onClick={() => onInMap(ex)}>
                    {t("materiaal.inMapPlaatsen")}
                  </MenuKnop>
                )}
                {onInOrganisatiemap && ex.visibility === "organisatie" && (
                  <MenuKnop icon={Building2} onClick={() => onInOrganisatiemap(ex)}>
                    {t("materiaal.inOrgPlaatsen")}
                  </MenuKnop>
                )}
                {isEigen && onZichtbaarheid && (
                  <MenuKnop
                    icon={ex.visibility === "prive" ? Building2 : Lock}
                    onClick={() => onZichtbaarheid(ex)}
                  >
                    {ex.visibility === "prive"
                      ? t("materiaal.kaart.delenMetOrg")
                      : t("materiaal.kaart.terugAlleenIk")}
                  </MenuKnop>
                )}
                {onKopieer && (
                  <MenuKnop icon={Copy} onClick={() => onKopieer(ex)}>
                    {isEigen ? t("materiaal.kaart.dupliceren") : t("materiaal.kaart.kopierenNaarMijn")}
                  </MenuKnop>
                )}
                {isEigen && onVerwijder && (
                  <MenuKnop icon={Trash2} onClick={() => onVerwijder(ex.id)} gevaarlijk>
                    {t("algemeen.verwijderen")}
                  </MenuKnop>
                )}
              </Menu>
            </div>

            {klassikaal ? (
              <Link
                href={`/live?oefening=${ex.id}`}
                className="px-3 py-2 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>{t("algemeen.menu.startInDeKlas")}</span>
              </Link>
            ) : (
              <button
                onClick={() => onDelen(ex)}
                className="px-3 py-2 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{t("materiaal.kaart.deelMetCursisten")}</span>
              </button>
            )}
          </>
        ) : (
          <>
            <span className="font-mono text-xs font-bold text-merk-900 bg-merk-50 px-2 py-1 rounded-lg border border-merk/20">
              {ex.shareCode}
            </span>
            <Link
              href={`/oefen/${ex.id}`}
              className="px-3 py-2 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{t("materiaal.kaart.oefenen")}</span>
            </Link>
          </>
        )}
      </div>
    </article>
  );
}

/** Klein menu achter de drie puntjes: houdt de kaart rustig zonder acties te verstoppen. */
function Menu({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const houder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const sluit = (e: MouseEvent) => {
      if (!houder.current?.contains(e.target as Node)) setOpen(false);
    };
    const sluitBijEscape = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", sluit);
    window.addEventListener("keydown", sluitBijEscape);
    return () => {
      document.removeEventListener("mousedown", sluit);
      window.removeEventListener("keydown", sluitBijEscape);
    };
  }, [open]);

  return (
    <div ref={houder} className="relative" onClick={() => setOpen(false)}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label={label}
        aria-expanded={open}
        className="p-2 rounded-lg text-slate-500 hover:text-merk-900 hover:bg-merk-50 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute left-0 bottom-full mb-1 z-20 w-64 bg-white rounded-xl border border-slate-200 shadow-lg py-1 u-pop">
          {children}
        </div>
      )}
    </div>
  );
}

function MenuKnop({
  icon: Icon,
  onClick,
  children,
  gevaarlijk,
}: {
  icon: React.ElementType;
  onClick: () => void;
  children: React.ReactNode;
  gevaarlijk?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors ${
        gevaarlijk
          ? "text-rose-700 hover:bg-rose-50"
          : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{children}</span>
    </button>
  );
}
