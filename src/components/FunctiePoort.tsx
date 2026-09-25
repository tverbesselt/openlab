"use client";

import React from "react";
import { useInstellingen } from "@/lib/instellingen/AppProvider";
import type { FunctieId } from "@/lib/instellingen/functies";
import { Uitgeschakeld } from "@/components/Uitgeschakeld";

/**
 * Toont de pagina alleen als de functie aan staat. Een aparte laag rond de pagina, zodat de
 * pagina zelf haar hooks altijd in dezelfde volgorde blijft aanroepen.
 */
export function FunctiePoort({
  functie,
  tips,
  children,
}: {
  functie?: FunctieId;
  /** In plaats van een functie: alleen tonen als deze soort tips aan staat. */
  tips?: "cursisten" | "leraren";
  children: React.ReactNode;
}) {
  const { isAan, instellingen } = useInstellingen();
  const aan = (functie ? isAan(functie) : true) && (tips ? instellingen.tips[tips] : true);
  return aan ? <>{children}</> : <Uitgeschakeld />;
}
