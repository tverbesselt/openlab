// Koppeling tussen een Google-account en een rol in de app.
//
// Wie leraar of cursist is, stelt de beheerder in (Beheer > Toegang):
//   - leraarDomeinen:  e-maildomeinen van leraren, bijvoorbeeld "school.org";
//   - cursistDomeinen: e-maildomeinen van cursisten, of "*" voor elk Google-account;
//   - cursistPatroon:  optioneel, een patroon op het volledige adres dat altijd een cursist
//                      aanduidt. Nodig als leraren en cursisten op hetzelfde domein zitten.
// Een beheerder (beheerders/{e-mail} in Firestore) is altijd ook leraar.
//
// firestore.rules past exact dezelfde regels toe. Deze controle bepaalt alleen wat de app
// toont; de regels bepalen wat iemand echt mag.

import type { Toegang } from "@/lib/instellingen/types";
import { t } from "@/lib/i18n";

export type Rol = "leraar" | "cursist";

function domeinVan(email: string | null | undefined): string | null {
  if (!email) return null;
  const delen = email.trim().toLowerCase().split("@");
  return delen.length === 2 && delen[1] ? delen[1] : null;
}

/** Het patroon moet het hele adres dekken, zoals in de Firestore-regels. */
function volgtPatroon(email: string, patroon: string): boolean {
  if (!patroon) return false;
  try {
    return new RegExp(`^(?:${patroon})$`).test(email);
  } catch {
    return false;
  }
}

export function bepaalRol(
  email: string | null | undefined,
  toegang: Toegang,
  beheerder = false
): Rol | null {
  if (beheerder) return "leraar";
  const domein = domeinVan(email);
  if (!email || !domein) return null;
  const adres = email.trim().toLowerCase();
  const cursistOveral = toegang.cursistDomeinen.includes("*");
  const opLeraarDomein = toegang.leraarDomeinen.includes(domein);
  const opCursistDomein = cursistOveral || toegang.cursistDomeinen.includes(domein);

  if (volgtPatroon(adres, toegang.cursistPatroon) && (opLeraarDomein || opCursistDomein)) {
    return "cursist";
  }
  if (opLeraarDomein) return "leraar";
  if (opCursistDomein) return "cursist";
  return null;
}

/**
 * Een hint voor de accountkiezer van Google: als alle toegelaten adressen op één domein
 * zitten, toont Google alleen die accounts. Het is een hint, geen beveiliging.
 */
export function enigDomein(toegang: Toegang): string | undefined {
  if (toegang.cursistDomeinen.includes("*")) return undefined;
  const alle = new Set([...toegang.leraarDomeinen, ...toegang.cursistDomeinen]);
  return alle.size === 1 ? [...alle][0] : undefined;
}

/**
 * Uitleg bij een account dat niet door de controle komt. Zegt wat de gebruiker concreet
 * moet doen: een kale weigering laat mensen vastzitten.
 */
export function weigeringsUitleg(email: string | null | undefined, toegang: Toegang): string {
  const domeinen = [...toegang.leraarDomeinen, ...toegang.cursistDomeinen].filter((d) => d !== "*");
  if (domeinen.length === 0) return t("aanmelden.weigering.nogNietIngesteld");
  return t("aanmelden.weigering.verkeerdAccount", {
    email: email ?? "?",
    domeinen: domeinen.map((d) => `@${d}`).join(", "),
  });
}

/** Toonbare naam wanneer Google er geen meegeeft: het deel voor de @. */
export function naamVanEmail(email: string): string {
  return email.split("@")[0] || email;
}
