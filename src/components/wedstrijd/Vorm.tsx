import React from "react";
import type { Vorm as VormNaam } from "@/lib/wedstrijd";
import { t } from "@/lib/i18n";

/** Een vorm bij een antwoordmogelijkheid, in de kleur van de tekst (currentColor). */
export function Vorm({ vorm, className = "w-6 h-6" }: { vorm: VormNaam; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden focusable="false">
      {vorm === "driehoek" && <path d="M12 3 22 20H2z" />}
      {vorm === "ruit" && <path d="M12 2 22 12 12 22 2 12z" />}
      {vorm === "cirkel" && <circle cx="12" cy="12" r="10" />}
      {vorm === "vierkant" && <rect x="3" y="3" width="18" height="18" rx="1.5" />}
      {vorm === "ster" && (
        <path d="m12 2 2.9 6.6 7.1.6-5.4 4.7 1.6 7.1L12 17.3 5.8 21l1.6-7.1L2 9.2l7.1-.6z" />
      )}
      {vorm === "zeshoek" && <path d="M7 3h10l5 9-5 9H7l-5-9z" />}
    </svg>
  );
}

/** De naam van de vorm, voor schermlezers en voor wie het bord beschrijft. */
export const VORM_NAAM: Record<VormNaam, string> = {
  get driehoek() { return t("live.vormen.driehoek"); },
  get ruit() { return t("live.vormen.ruit"); },
  get cirkel() { return t("live.vormen.cirkel"); },
  get vierkant() { return t("live.vormen.vierkant"); },
  get ster() { return t("live.vormen.ster"); },
  get zeshoek() { return t("live.vormen.zeshoek"); },
};
