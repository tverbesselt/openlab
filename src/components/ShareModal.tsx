"use client";

import React, { useState, useEffect } from "react";
import { X, Copy, Check } from "lucide-react";
import QRCode from "qrcode";
import { merkTint } from "@/lib/instellingen/kleur";
import { t } from "@/lib/i18n";
import { tr } from "@/lib/i18n/rijk";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  shareCode: string;
  id: string;
  isSet?: boolean;
}

export function ShareModal({ isOpen, onClose, title, shareCode, id, isSet }: ShareModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [gekopieerd, setGekopieerd] = useState<"link" | "code" | null>(null);

  const basis = typeof window !== "undefined" ? window.location.origin : "";
  const deelUrl = isSet ? `${basis}/mappen/${id}` : `${basis}/oefen/${id}`;

  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(deelUrl, {
      width: 300,
      margin: 2,
      color: { dark: merkTint("900"), light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [isOpen, deelUrl]);

  useEffect(() => {
    if (!isOpen) return;
    const sluitBijEscape = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", sluitBijEscape);
    return () => window.removeEventListener("keydown", sluitBijEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const kopieer = (tekst: string, wat: "link" | "code") => {
    navigator.clipboard.writeText(tekst);
    setGekopieerd(wat);
    setTimeout(() => setGekopieerd(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs u-fade"
      role="dialog"
      aria-modal="true"
      aria-label={t("materiaal.delen.dialoog", { titel: title })}
    >
      {/* Tussenlaag: vangt de klik naast het venster op en houdt het gecentreerd,
          ook wanneer het hoger is dan het scherm en er dus gescrold moet worden. */}
      <div className="flex min-h-full items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 relative u-pop"
      >
        <button
          onClick={onClose}
          aria-label={t("algemeen.sluiten")}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5 pr-8">
          <p className="text-xs font-bold text-slate-500 mb-1">{t("materiaal.delen.kop")}</p>
          <h3 className="font-extrabold text-lg text-merk-900 leading-snug line-clamp-2">
            {title}
          </h3>
        </div>

        <div className="bg-slate-50 rounded-2xl p-5 flex flex-col items-center mb-5">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={t("materiaal.delen.qrAlt")}
              className="w-44 h-44 rounded-xl border border-slate-200 bg-white"
            />
          ) : (
            <div className="w-44 h-44 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs text-slate-500">
              {t("materiaal.delen.qrLaden")}
            </div>
          )}

          <p className="text-xs text-slate-600 mt-4 text-center">
            {t("materiaal.delen.projecteer")}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono font-extrabold text-2xl tracking-widest text-merk-900 bg-white px-4 py-1.5 rounded-xl border border-slate-200">
              {shareCode}
            </span>
            <button
              onClick={() => kopieer(shareCode, "code")}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-merk-900 hover:border-merk transition-colors"
              title={t("materiaal.delen.kopieerCode")}
            >
              {gekopieerd === "code" ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <label className="block mb-4">
          <span className="block text-xs font-bold text-slate-700 mb-1.5">{t("materiaal.delen.link")}</span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={deelUrl}
              className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 truncate"
            />
            <button
              onClick={() => kopieer(deelUrl, "link")}
              className="px-3 py-2.5 text-xs font-bold rounded-xl bg-merk-800 hover:bg-merk-900 text-white transition-colors flex items-center gap-1.5 shrink-0"
            >
              {gekopieerd === "link" ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{t("algemeen.gekopieerd")}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t("materiaal.delen.kopieer")}</span>
                </>
              )}
            </button>
          </div>
        </label>

        <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3">
          {tr("materiaal.delen.moodleTip", { b: (s) => <strong>{s}</strong> })}
        </p>
      </div>
      </div>
    </div>
  );
}
