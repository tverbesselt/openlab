"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { KLASOPDRACHTEN, type Klasopdracht } from "@/lib/studietips";
import { t } from "@/lib/i18n";

export function ClassroomTimer() {
  const [secondsLeft, setSecondsLeft] = useState(300); // Default 5 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [initialSeconds, setInitialSeconds] = useState(300);

  /*
    Een opdracht met een vaste tijd, zoals "wat weet je nog, drie minuten". De opdracht staat
    groot boven de klok, zodat de klas weet wat ze doet terwijl de tijd loopt.
  */
  const [opdracht, setOpdracht] = useState<Klasopdracht | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  const setPreset = (mins: number) => {
    const totalSecs = mins * 60;
    setInitialSeconds(totalSecs);
    setSecondsLeft(totalSecs);
    setIsRunning(false);
    setOpdracht(null);
  };

  const kiesOpdracht = (gekozen: Klasopdracht) => {
    const totalSecs = gekozen.minuten * 60;
    setInitialSeconds(totalSecs);
    setSecondsLeft(totalSecs);
    setIsRunning(false);
    setOpdracht(gekozen);
  };

  const progressPct = Math.round(((initialSeconds - secondsLeft) / initialSeconds) * 100);

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 max-w-xl mx-auto text-center u-pop">

      {opdracht && (
        <p className="text-xl sm:text-2xl font-extrabold text-merk-900 leading-snug mb-6 u-rise">
          {opdracht.opdracht}
        </p>
      )}

      {/* Aftelklok */}
      <div className="relative w-64 h-64 mx-auto mb-8 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="110"
            stroke="currentColor"
            strokeWidth="12"
            className="text-merk-50"
            fill="transparent"
          />
          <circle
            cx="128"
            cy="128"
            r="110"
            stroke="currentColor"
            strokeWidth="12"
            className="text-merk transition-all duration-1000"
            fill="transparent"
            strokeDasharray={2 * Math.PI * 110}
            strokeDashoffset={(2 * Math.PI * 110 * (100 - progressPct)) / 100}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-6xl font-extrabold text-merk-900 tracking-wider">
            {formatTime(secondsLeft)}
          </span>
          <span className="text-xs text-slate-500 font-semibold mt-1">
            {secondsLeft === 0
              ? t("klas.timer.tijdOm")
              : isRunning
                ? t("klas.timer.loopt")
                : t("klas.timer.gepauzeerd")}
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <button
          onClick={() => setIsRunning(!isRunning)}
          aria-label={isRunning ? t("klas.timer.pauzeer") : t("klas.timer.start")}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 ${
            isRunning ? "bg-amber-500 hover:bg-amber-600" : "bg-merk-800 hover:bg-merk-900"
          }`}
        >
          {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </button>

        <button
          onClick={() => {
            setIsRunning(false);
            setSecondsLeft(initialSeconds);
          }}
          className="w-12 h-12 rounded-2xl bg-merk-50 hover:bg-merk/20 text-merk-900 flex items-center justify-center transition-colors"
          title={t("klas.timer.terugzetten")}
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Opdrachten met hun tijd */}
      <div className="mb-5">
        <span className="block text-xs font-bold text-slate-500 mb-2">{t("klas.timer.metOpdracht")}</span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {KLASOPDRACHTEN.map((o) => (
            <button
              key={o.id}
              onClick={() => kiesOpdracht(o)}
              aria-pressed={opdracht?.id === o.id}
              title={o.opdracht}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors border ${
                opdracht?.id === o.id
                  ? "bg-merk-800 text-white border-merk-800"
                  : "bg-white text-merk-900 border-merk/30 hover:bg-merk-50"
              }`}
            >
              {o.label} · {t("klas.minuten", { n: o.minuten })}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Presets */}
      <span className="block text-xs font-bold text-slate-500 mb-2">{t("klas.timer.alleenKlok")}</span>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {[1, 2, 3, 5, 10, 15, 20].map((m) => (
          <button
            key={m}
            onClick={() => setPreset(m)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              !opdracht && initialSeconds === m * 60 && secondsLeft === initialSeconds
                ? "bg-merk-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-merk-50"
            }`}
          >
            {t("klas.minuten", { n: m })}
          </button>
        ))}
      </div>

    </div>
  );
}
