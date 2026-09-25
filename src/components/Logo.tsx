"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { useInstellingen } from "@/lib/instellingen/AppProvider";

/** Het logo uit het beheer, of het standaardicoon in de merkkleur. */
export function Logo({ grootte = "md" }: { grootte?: "sm" | "md" }) {
  const { instellingen } = useInstellingen();
  const maat = grootte === "sm" ? "w-8 h-8 rounded-lg" : "w-9 h-9 rounded-xl";

  if (instellingen.logo) {
    return (
      // Een data-URL uit het beheer: next/image voegt daar niets aan toe.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={instellingen.logo} alt="" className={`${maat} object-contain shrink-0`} />
    );
  }
  return (
    <span className={`${maat} bg-merk-800 flex items-center justify-center text-white shrink-0`}>
      <Sparkles className={grootte === "sm" ? "w-4 h-4" : "w-5 h-5"} />
    </span>
  );
}
