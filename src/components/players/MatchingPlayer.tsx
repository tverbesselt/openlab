"use client";

import React, { useState, useEffect } from "react";
import { MatchingPair } from "@/lib/types";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { t, tn } from "@/lib/i18n";

interface MatchingPlayerProps {
  pairs: MatchingPair[];
}

export function MatchingPlayer({ pairs }: MatchingPlayerProps) {
  const [links, setLinks] = useState<{ id: string; text: string }[]>([]);
  const [rechts, setRechts] = useState<{ id: string; text: string }[]>([]);

  const [gekozenLinks, setGekozenLinks] = useState<string | null>(null);
  const [gekozenRechts, setGekozenRechts] = useState<string | null>(null);
  const [gevonden, setGevonden] = useState<string[]>([]);
  const [foutePoging, setFoutePoging] = useState(false);

  const schud = () => {
    setLinks(pairs.map((p) => ({ id: p.id, text: p.left })).sort(() => 0.5 - Math.random()));
    setRechts(pairs.map((p) => ({ id: p.id, text: p.right })).sort(() => 0.5 - Math.random()));
  };

  useEffect(schud, [pairs]);

  const controleer = (linkerId: string, rechterId: string) => {
    if (linkerId === rechterId) {
      setGevonden((prev) => [...prev, linkerId]);
      setGekozenLinks(null);
      setGekozenRechts(null);
    } else {
      setFoutePoging(true);
      setTimeout(() => {
        setGekozenLinks(null);
        setGekozenRechts(null);
        setFoutePoging(false);
      }, 700);
    }
  };

  const klikLinks = (id: string) => {
    if (gevonden.includes(id)) return;
    setGekozenLinks(id);
    if (gekozenRechts) controleer(id, gekozenRechts);
  };

  const klikRechts = (id: string) => {
    if (gevonden.includes(id)) return;
    setGekozenRechts(id);
    if (gekozenLinks) controleer(gekozenLinks, id);
  };

  const allesGevonden = pairs.length > 0 && gevonden.length === pairs.length;

  if (allesGevonden) {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 text-center max-w-md mx-auto u-pop">
        <CheckCircle2 className="w-10 h-10 text-merk mx-auto mb-3" />
        <h3 className="text-xl font-extrabold text-merk-900 mb-1">{t("spelers.koppelen.allesGekoppeld")}</h3>
        <p className="text-sm text-slate-600 mb-6">
          {tn("spelers.koppelen.gevondenAlle", pairs.length)}
        </p>
        <button
          onClick={() => {
            setGevonden([]);
            setGekozenLinks(null);
            setGekozenRechts(null);
            schud();
          }}
          className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{t("spelers.koppelen.nogEens")}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 mb-4">
        <span>
          {tn("spelers.koppelen.gevonden", pairs.length, { gevonden: gevonden.length })}
        </span>
        <span>{t("spelers.koppelen.uitleg")}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Kolom
          items={links}
          gevonden={gevonden}
          gekozen={gekozenLinks}
          fout={foutePoging}
          onKlik={klikLinks}
        />
        <Kolom
          items={rechts}
          gevonden={gevonden}
          gekozen={gekozenRechts}
          fout={foutePoging}
          onKlik={klikRechts}
        />
      </div>
    </div>
  );
}

function Kolom({
  items,
  gevonden,
  gekozen,
  fout,
  onKlik,
}: {
  items: { id: string; text: string }[];
  gevonden: string[];
  gekozen: string | null;
  fout: boolean;
  onKlik: (id: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const isGevonden = gevonden.includes(item.id);
        const isGekozen = gekozen === item.id;

        let stijl = "bg-white border-slate-200 text-slate-800 hover:border-merk";
        if (isGevonden) {
          stijl = "bg-emerald-50 border-emerald-200 text-emerald-800 opacity-60 pointer-events-none";
        } else if (isGekozen) {
          stijl = fout
            ? "bg-rose-50 border-rose-400 text-rose-800"
            : "bg-merk-50 border-merk text-merk-900 font-bold";
        }

        return (
          <button
            key={item.id}
            onClick={() => onKlik(item.id)}
            className={`w-full p-4 rounded-xl border text-sm text-left transition-colors flex items-center justify-between gap-2 ${stijl}`}
          >
            <span>{item.text}</span>
            {isGevonden && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}
