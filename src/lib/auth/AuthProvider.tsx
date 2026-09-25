"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  firebaseConfigured,
  getFirebaseAuth,
  aanmeldenMetGoogle,
  verwerkRedirectResultaat,
  afmelden as firebaseAfmelden,
} from "@/lib/firebase/client";
import { bepaalRol, enigDomein, naamVanEmail, weigeringsUitleg, type Rol } from "@/lib/auth/account";
import { isBeheerderAccount } from "@/lib/auth/beheerder";
import { useInstellingen } from "@/lib/instellingen/AppProvider";
import { t } from "@/lib/i18n";

const DEMO_SLEUTEL = "openlab_demo_rol";

export type AuthStatus = "laden" | "afgemeld" | "aangemeld";

export interface Gebruiker {
  /** Firebase-uid, of het e-mailadres in demomodus. Hieraan hangt het eigen materiaal. */
  id: string;
  email: string;
  naam: string;
  rol: Rol;
  /** Leraar die de organisatiemappen mag beheren. */
  beheerder: boolean;
}

interface AuthContext {
  status: AuthStatus;
  gebruiker: Gebruiker | null;
  isLeraar: boolean;
  isBeheerder: boolean;
  foutmelding: string | null;
  /** True zolang er geen Firebase-project ingesteld is; dan is enkel de demo mogelijk. */
  demoBeschikbaar: boolean;
  demo: boolean;
  aanmelden: () => Promise<void>;
  kiesDemo: (rol: Rol) => void;
  afmelden: () => Promise<void>;
}

const Ctx = createContext<AuthContext | null>(null);

/** Voorbeeldgebruikers voor de demo. De naam is een vertaling, dus een functie. */
function demoGebruiker(rol: Rol): Gebruiker {
  return rol === "leraar"
    ? {
        id: "leraar@example.org",
        email: "leraar@example.org",
        naam: t("aanmelden.demo.leraarNaam"),
        rol: "leraar",
        // In de demo toont de leraar ook wat een beheerder kan.
        beheerder: true,
      }
    : {
        id: "cursist@example.org",
        email: "cursist@example.org",
        naam: t("aanmelden.demo.cursistNaam"),
        rol: "cursist",
        beheerder: false,
      };
}

/** Firebase-foutcodes vertaald naar iets waar je als gebruiker mee verder kan. */
function foutTekst(code: string): string {
  switch (code) {
    case "auth/unauthorized-domain":
      return t("aanmelden.fout.domein");
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return t("aanmelden.fout.venster");
    case "auth/popup-blocked":
      return t("aanmelden.fout.geblokkeerd");
    case "auth/network-request-failed":
      return t("aanmelden.fout.netwerk");
    default:
      return t("aanmelden.fout.algemeen");
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("laden");
  const [gebruiker, setGebruiker] = useState<Gebruiker | null>(null);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const { instellingen } = useInstellingen();
  // De toegangsregels kunnen wijzigen terwijl de aanmeldluisteraar al loopt.
  const toegang = useRef(instellingen.toegang);
  toegang.current = instellingen.toegang;

  useEffect(() => {
    if (!firebaseConfigured) {
      // Geen project ingesteld: enkel de demo. Een eerder gekozen rol blijft staan.
      const bewaard = localStorage.getItem(DEMO_SLEUTEL);
      if (bewaard === "leraar" || bewaard === "cursist") {
        setDemo(true);
        setGebruiker(demoGebruiker(bewaard));
        setStatus("aangemeld");
      } else {
        setStatus("afgemeld");
      }
      return;
    }

    verwerkRedirectResultaat().catch((e) => {
      setFoutmelding(foutTekst((e as { code?: string })?.code ?? ""));
    });

    const stop = onAuthStateChanged(getFirebaseAuth(), async (u: User | null) => {
      if (!u) {
        setGebruiker(null);
        setStatus("afgemeld");
        return;
      }

      const email = u.email ?? "";
      // Eerst weten of dit een beheerder is: een beheerder is altijd leraar, ook buiten de
      // ingestelde domeinen. Zo kan de eerste beheerder de toegang zelf instellen.
      const beheerder = u.emailVerified && email ? await isBeheerderAccount(email) : false;
      const rol = u.emailVerified ? bepaalRol(email, toegang.current, beheerder) : null;
      if (rol === null) {
        // Verkeerd account: uitleggen wat wél werkt en meteen afmelden, anders blijft de
        // gebruiker in een half-aangemelde toestand hangen.
        setFoutmelding(weigeringsUitleg(u.email, toegang.current));
        setGebruiker(null);
        setStatus("afgemeld");
        firebaseAfmelden().catch(() => {});
        return;
      }

      setFoutmelding(null);
      setGebruiker({
        id: u.uid,
        email,
        naam: u.displayName || naamVanEmail(email),
        rol,
        beheerder,
      });
      setStatus("aangemeld");
    });

    return () => stop();
  }, []);

  const aanmelden = useCallback(async () => {
    setFoutmelding(null);
    if (!firebaseConfigured) {
      setFoutmelding(t("aanmelden.fout.geenFirebase"));
      return;
    }
    try {
      await aanmeldenMetGoogle(enigDomein(toegang.current));
    } catch (e) {
      setFoutmelding(foutTekst((e as { code?: string })?.code ?? ""));
    }
  }, []);

  const kiesDemo = useCallback((rol: Rol) => {
    localStorage.setItem(DEMO_SLEUTEL, rol);
    setDemo(true);
    setGebruiker(demoGebruiker(rol));
    setFoutmelding(null);
    setStatus("aangemeld");
  }, []);

  const afmelden = useCallback(async () => {
    localStorage.removeItem(DEMO_SLEUTEL);
    setDemo(false);
    setGebruiker(null);
    setStatus("afgemeld");
    await firebaseAfmelden().catch(() => {});
  }, []);

  return (
    <Ctx.Provider
      value={{
        status,
        gebruiker,
        isLeraar: gebruiker?.rol === "leraar",
        isBeheerder: gebruiker?.rol === "leraar" && gebruiker.beheerder,
        foutmelding,
        demoBeschikbaar: !firebaseConfigured,
        demo,
        aanmelden,
        kiesDemo,
        afmelden,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthContext {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth moet binnen <AuthProvider> gebruikt worden.");
  return v;
}
