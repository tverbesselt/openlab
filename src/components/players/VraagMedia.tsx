"use client";

import React from "react";
import { QuizMedia } from "@/lib/types";
import { herkenVideo, videoInbedden } from "@/lib/media";
import { t } from "@/lib/i18n";
import { tr } from "@/lib/i18n/rijk";

/**
 * De foto, het filmpje of het audiofragment bij een quizvraag. Staat boven de vraag,
 * want de vraag gaat erover. `groot` is voor het digibord.
 */
export function VraagMedia({ media, groot = false }: { media: QuizMedia; groot?: boolean }) {
  if (media.soort === "afbeelding") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={media.url}
        alt={media.alt ?? ""}
        className={`block mx-auto rounded-xl border border-slate-200 bg-slate-50 object-contain w-auto max-w-full ${
          groot ? "max-h-[50vh]" : "max-h-72"
        }`}
      />
    );
  }

  if (media.soort === "audio") {
    return (
      <audio controls preload="metadata" src={media.url} className="w-full">
        {t("spelers.media.audioNiet")}
      </audio>
    );
  }

  const bron = herkenVideo(media.url);
  if (!bron) {
    return (
      <p className="text-sm text-slate-600">
        {tr("spelers.media.filmpjeNiet", {
          link: (s) => (
            <a href={media.url} target="_blank" rel="noreferrer" className="underline">
              {s}
            </a>
          ),
        })}
      </p>
    );
  }

  return (
    <div className={`relative w-full aspect-video rounded-xl overflow-hidden bg-black ${groot ? "max-h-[55vh]" : ""}`}>
      <iframe
        src={videoInbedden(bron, media.start, media.eind)}
        title={t("spelers.media.filmpjeTitel")}
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
