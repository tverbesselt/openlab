"use client";

import React, { useState } from "react";
import { Check, EyeOff, Maximize2, Pin, PinOff, Play, Trash2 } from "lucide-react";
import { BordItem } from "@/lib/types";
import { herkenVideo, startUitLink, videoInbedden } from "@/lib/media";
import { t } from "@/lib/i18n";

/**
 * Eén kaartje op het bord. Op het bord van de leraar komen de knoppen erbij om goed te
 * keuren, vast te pinnen, te verplaatsen, groot te tonen of weg te halen.
 */

export interface KaartActies {
  onGoedkeuren?: () => void;
  onVerberg?: () => void;
  onVastpinnen?: () => void;
  onVerwijder?: () => void;
  onGroot?: () => void;
  onKolom?: (kolom: number) => void;
  kolommen?: string[];
}

export function BordKaart({
  item,
  groot = false,
  eigen = false,
  acties,
}: {
  item: BordItem;
  /** Op het volle scherm, voor één kaartje dat de leraar uitvergroot. */
  groot?: boolean;
  /** Door dit toestel gezet. */
  eigen?: boolean;
  acties?: KaartActies;
}) {
  const wacht = item.status === "wacht";
  const kortTekst = item.soort === "tekst" && (item.tekst?.length ?? 0) <= 60;

  return (
    <article
      className={`group relative break-inside-avoid mb-4 rounded-2xl border bg-white overflow-hidden u-pop ${
        wacht
          ? "border-dashed border-amber-500"
          : item.leraar
            ? "border-merk-800 border-2"
            : item.vast
              ? "border-merk"
              : "border-slate-200"
      } ${groot ? "shadow-2xl" : "shadow-sm"}`}
    >
      {(wacht || item.vast || item.leraar) && (
        <div className="flex flex-wrap gap-1.5 px-4 pt-3">
          {wacht && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
              {t("bord.kaart.wacht")}
            </span>
          )}
          {item.vast && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-merk-50 text-merk-900 inline-flex items-center gap-1">
              <Pin className="w-3 h-3" /> {t("bord.kaart.vastgepind")}
            </span>
          )}
          {item.leraar && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-merk-800 text-white">
              {t("bord.kaart.leraar")}
            </span>
          )}
        </div>
      )}

      <Inhoud item={item} groot={groot} />

      {item.soort !== "tekst" && item.tekst && (
        <p
          className={`px-4 pt-3 text-slate-800 whitespace-pre-wrap break-words ${
            groot ? "text-2xl" : "text-sm"
          }`}
        >
          {item.tekst}
        </p>
      )}

      {item.soort === "tekst" && (
        <p
          className={`px-4 pt-3 text-slate-900 whitespace-pre-wrap break-words font-semibold leading-snug ${
            groot ? "text-4xl sm:text-5xl" : kortTekst ? "text-xl" : "text-base"
          }`}
        >
          {item.tekst}
        </p>
      )}

      <footer className="flex items-center justify-between gap-2 px-4 pb-3 pt-2 min-h-[2rem]">
        <span className={`text-xs font-semibold truncate ${eigen ? "text-merk-900" : "text-slate-500"}`}>
          {eigen ? t("bord.kaart.vanJou") : (item.auteur ?? "")}
        </span>
        {acties && <Acties item={item} acties={acties} />}
      </footer>
    </article>
  );
}

function Inhoud({ item, groot }: { item: BordItem; groot: boolean }) {
  if ((item.soort === "afbeelding" || item.soort === "tekening") && item.url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.url}
        alt={item.alt || item.tekst || (item.soort === "tekening" ? t("bord.kaart.tekening") : t("bord.kaart.foto"))}
        className={`block w-full object-contain bg-slate-50 mt-3 ${groot ? "max-h-[70vh]" : "max-h-80"}`}
        loading="lazy"
      />
    );
  }
  if (item.soort === "audio" && item.url) {
    return (
      <div className="px-4 pt-3">
        <audio controls preload="metadata" src={item.url} className="w-full">
          {t("bord.kaart.geenAudio")}
        </audio>
      </div>
    );
  }
  if (item.soort === "video" && item.url) {
    return <Video link={item.url} groot={groot} />;
  }
  return null;
}

/**
 * Een filmpje laadt pas als iemand op afspelen drukt. Twintig spelers tegelijk laden zou
 * het wifi-netwerk van een klas plat leggen.
 */
function Video({ link, groot }: { link: string; groot: boolean }) {
  const [spelen, setSpelen] = useState(false);
  const bron = herkenVideo(link);
  if (!bron) return null;
  const start = startUitLink(link);

  if (spelen) {
    const url = videoInbedden(bron, start);
    return (
      <div className={`relative w-full aspect-video bg-black mt-3 ${groot ? "max-h-[70vh]" : ""}`}>
        <iframe
          src={bron.dienst === "youtube" ? `${url}&autoplay=1` : url}
          title={t("bord.kaart.filmpje")}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setSpelen(true)}
      className="relative block w-full aspect-video bg-slate-900 mt-3 overflow-hidden"
      aria-label={t("bord.kaart.afspelen")}
    >
      {bron.dienst === "youtube" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://i.ytimg.com/vi/${bron.id}/hqdefault.jpg`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-90"
          loading="lazy"
        />
      )}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="w-14 h-14 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-lg">
          <Play className="w-6 h-6 fill-current ml-0.5" />
        </span>
      </span>
      <span className="absolute bottom-2 left-3 text-[11px] font-bold text-white/90">
        {bron.dienst === "youtube" ? "YouTube" : "Vimeo"}
      </span>
    </button>
  );
}

function Acties({ item, acties }: { item: BordItem; acties: KaartActies }) {
  const [zeker, setZeker] = useState(false);
  const knop =
    "w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-merk-900 transition-colors";

  if (zeker) {
    return (
      <span className="flex items-center gap-1 niet-afdrukken">
        <button
          type="button"
          onClick={acties.onVerwijder}
          className="px-2.5 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-bold"
        >
          {t("bord.kaart.weghalen")}
        </button>
        <button
          type="button"
          onClick={() => setZeker(false)}
          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
        >
          {t("bord.kaart.tochNiet")}
        </button>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-0.5 shrink-0 niet-afdrukken">
      {item.status === "wacht" && acties.onGoedkeuren && (
        <button
          type="button"
          onClick={acties.onGoedkeuren}
          className="px-2.5 py-1.5 mr-1 rounded-lg bg-merk-800 hover:bg-merk-900 text-white text-xs font-bold inline-flex items-center gap-1"
        >
          <Check className="w-3.5 h-3.5" /> {t("bord.kaart.goedkeuren")}
        </button>
      )}
      {acties.kolommen && acties.kolommen.length > 0 && acties.onKolom && (
        <select
          value={item.kolom ?? 0}
          onChange={(e) => acties.onKolom?.(Number(e.target.value))}
          aria-label={t("bord.kaart.verplaats")}
          className="max-w-[7.5rem] h-8 mr-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 px-1.5"
        >
          {acties.kolommen.map((k, i) => (
            <option key={i} value={i}>
              {k}
            </option>
          ))}
        </select>
      )}
      {item.status === "zichtbaar" && acties.onGroot && (
        <button type="button" onClick={acties.onGroot} className={knop} title={t("bord.kaart.grootTonen")} aria-label={t("bord.kaart.grootTonen")}>
          <Maximize2 className="w-4 h-4" />
        </button>
      )}
      {item.status === "zichtbaar" && acties.onVastpinnen && (
        <button
          type="button"
          onClick={acties.onVastpinnen}
          className={knop}
          title={item.vast ? t("bord.kaart.losmaken") : t("bord.kaart.vastpinnen")}
          aria-label={item.vast ? t("bord.kaart.losmaken") : t("bord.kaart.vastpinnen")}
        >
          {item.vast ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
        </button>
      )}
      {item.status === "zichtbaar" && !item.leraar && acties.onVerberg && (
        <button type="button" onClick={acties.onVerberg} className={knop} title={t("bord.kaart.verbergen")} aria-label={t("bord.kaart.verbergen")}>
          <EyeOff className="w-4 h-4" />
        </button>
      )}
      {acties.onVerwijder && (
        <button
          type="button"
          onClick={() => setZeker(true)}
          className={`${knop} hover:!text-rose-700`}
          title={t("bord.kaart.weghalen")}
          aria-label={t("bord.kaart.weghalen")}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </span>
  );
}
