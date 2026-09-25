"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { opslag } from "@/lib/opslag";
import { Exercise } from "@/lib/types";
import { WERKVORMEN } from "@/lib/labels";
import { ontleedInvulzin } from "@/lib/invulzin";
import { hussel } from "@/lib/hussel";
import { maakRonde, toonAntwoord } from "@/lib/rekenen";
import { CornellBlad } from "@/components/CornellBlad";
import { FunctiePoort } from "@/components/FunctiePoort";
import { useInstellingen } from "@/lib/instellingen/AppProvider";
import { t } from "@/lib/i18n";
import { tr } from "@/lib/i18n/rijk";

/*
 * Afdrukbare versie van een oefening.
 *
 * Niet elke cursist heeft een smartphone bij zich, en sommigen oefenen liever op papier.
 * Dat is geen tweederangs oplossing maar een tweede weg naar dezelfde inhoud (UDL).
 *
 * Eenvoudige, rustige opmaak: links uitgelijnd, geen cursief, en invullen op lijntjes in
 * plaats van puntjes.
 */

/** Een invullijn waarop met de hand geschreven wordt. */
function Lijn({ breedte = "10rem" }: { breedte?: string }) {
  return (
    <span
      className="inline-block border-b border-black align-baseline mx-1"
      style={{ width: breedte, height: "1.1em" }}
    />
  );
}

function Schrijfruimte({ regels = 3 }: { regels?: number }) {
  return (
    <div className="mt-2 space-y-5">
      {Array.from({ length: regels }, (_, i) => (
        <div key={i} className="border-b border-black" />
      ))}
    </div>
  );
}

function AfdrukkenPaginaInhoud() {
  const params = useParams();
  const { instellingen } = useInstellingen();
  const id = params.id as string;

  const [oefening, setOefening] = useState<Exercise | null>(null);
  const [toestand, setToestand] = useState<"laden" | "klaar" | "weg">("laden");
  const [metAntwoorden, setMetAntwoorden] = useState(false);
  // Een leeg notitieblad met de titel van deze oefening als lesonderwerp.
  const [cornell, setCornell] = useState(false);

  useEffect(() => {
    opslag
      .oefening(id)
      .then((gevonden) => {
        setOefening(gevonden);
        setToestand(gevonden ? "klaar" : "weg");
      })
      .catch(() => setToestand("weg"));
  }, [id]);

  // Rekenopgaven worden gegenereerd; voor een werkblad zetten we ze één keer vast.
  const rekenronde = useMemo(() => {
    const opdracht = oefening?.content.rekenopdracht;
    return opdracht ? maakRonde(opdracht.soort, opdracht.aantal) : [];
  }, [oefening]);

  if (toestand === "laden") return <div className="h-64" aria-hidden />;

  if (!oefening) {
    return (
      <div className="max-w-sm mx-auto text-center py-20">
        <h1 className="text-xl font-extrabold text-merk-900 mb-2">
          {t("klas.afdrukken.nietGevonden")}
        </h1>
        <Link href="/bibliotheek" className="text-sm font-bold text-merk-900 underline">
          {t("klas.afdrukken.naarBibliotheek")}
        </Link>
      </div>
    );
  }

  const c = oefening.content;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Bediening; verdwijnt op papier */}
      <div className="niet-afdrukken flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200">
        <Link
          href={`/oefen/${oefening.id}`}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-merk-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("klas.afdrukken.terug")}</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs font-bold">
            <button
              onClick={() => {
                setMetAntwoorden(false);
                setCornell(false);
              }}
              aria-pressed={!metAntwoorden && !cornell}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                !metAntwoorden && !cornell ? "bg-white text-merk-900 shadow-xs" : "text-slate-500"
              }`}
            >
              {t("klas.afdrukken.werkblad")}
            </button>
            <button
              onClick={() => {
                setMetAntwoorden(true);
                setCornell(false);
              }}
              aria-pressed={metAntwoorden && !cornell}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                metAntwoorden && !cornell ? "bg-white text-merk-900 shadow-xs" : "text-slate-500"
              }`}
            >
              {t("klas.afdrukken.metAntwoorden")}
            </button>
            <button
              onClick={() => setCornell(true)}
              aria-pressed={cornell}
              title={t("klas.afdrukken.notitiebladTitel")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                cornell ? "bg-white text-merk-900 shadow-xs" : "text-slate-500"
              }`}
            >
              {t("klas.afdrukken.notitieblad")}
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>{t("algemeen.afdrukken")}</span>
          </button>
        </div>
      </div>

      <p className="niet-afdrukken text-xs text-slate-500 mb-6">
        {t("klas.papier")}{" "}
        {cornell ? t("klas.afdrukken.uitlegCornell") : t("klas.afdrukken.uitlegWerkblad")}
      </p>

      {cornell && <CornellBlad titel={oefening.title} />}

      {/* Het blad zelf */}
      {!cornell && (
      <article className="bg-white text-black p-8 sm:p-10 rounded-2xl border border-slate-200 print:border-0 print:p-0 print:rounded-none leading-relaxed">
        <header className="mb-8 pb-4 border-b border-black">
          <p className="text-sm font-bold flex items-center gap-2">
            {instellingen.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={instellingen.logo} alt="" className="h-6 w-auto" />
            )}
            <span>{instellingen.organisatie || instellingen.naam}</span>
          </p>
          <h1 className="text-2xl font-extrabold mt-1">{oefening.title}</h1>
          <p className="text-sm mt-1">
            {WERKVORMEN[oefening.type].label}
            {metAntwoorden && ` — ${t("klas.afdrukken.voorLeraar")}`}
          </p>
          {!metAntwoorden && (
            <p className="text-sm mt-4">
              {tr("klas.afdrukken.naamDatum", {
                naam: () => <Lijn breedte="14rem" />,
                datum: () => <Lijn breedte="8rem" />,
              })}
            </p>
          )}
        </header>

        {/* Flashcards en woorden: knipblad met voor- en achterkant */}
        {(oefening.type === "flashcard" || oefening.type === "wordtrainer") && (
          <section>
            <h2 className="text-base font-bold mb-1">{t("klas.afdrukken.kaartjes.titel")}</h2>
            <p className="text-sm mb-5">
              {t("klas.afdrukken.kaartjes.uitleg")}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(oefening.type === "flashcard"
                ? (c.flashcards ?? []).map((k) => ({ id: k.id, voor: k.front, achter: k.back }))
                : (c.wordTrainerItems ?? []).map((w) => ({
                    id: w.id,
                    voor: w.word,
                    achter: w.translation,
                  }))
              ).map((kaart) => (
                <div key={kaart.id} className="afdruk-blad border border-black rounded">
                  <div className="p-3 min-h-16 flex items-center justify-center text-center font-bold">
                    {kaart.voor}
                  </div>
                  <div className="p-3 min-h-16 flex items-center justify-center text-center border-t border-dashed border-black text-sm">
                    {kaart.achter}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quiz en lezen met vragen */}
        {(oefening.type === "quiz" || oefening.type === "lezen") && (
          <section className="space-y-6">
            {oefening.type === "lezen" && c.leestekst && (
              <div className="afdruk-blad mb-8">
                <h2 className="text-base font-bold mb-2">{t("klas.afdrukken.quiz.tekst")}</h2>
                <div className="space-y-2 text-sm">
                  {c.leestekst
                    .split(/\n\s*\n|\n/)
                    .map((r) => r.trim())
                    .filter(Boolean)
                    .map((alinea, i) => (
                      <p key={i}>{alinea}</p>
                    ))}
                </div>
              </div>
            )}

            <h2 className="text-base font-bold">{t("klas.afdrukken.quiz.vragen")}</h2>
            <ol className="space-y-5 list-decimal pl-5">
              {(c.questions ?? []).map((vraag) => (
                <li key={vraag.id} className="afdruk-blad">
                  {vraag.media?.soort === "afbeelding" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={vraag.media.url}
                      alt={vraag.media.alt ?? ""}
                      className="block max-h-56 max-w-full w-auto mb-2 border border-black"
                    />
                  )}
                  {(vraag.media?.soort === "video" || vraag.media?.soort === "audio") && (
                    <p className="text-xs italic mb-1">
                      {vraag.media.soort === "video"
                        ? t("klas.afdrukken.quiz.video")
                        : t("klas.afdrukken.quiz.audio")}
                    </p>
                  )}
                  <p className="font-bold">{vraag.question}</p>
                  {vraag.type === "typ" ? (
                    <div className="mt-2 text-sm">
                      {metAntwoorden ? (
                        <p>
                          {t("klas.afdrukken.antwoord")} <strong>{(vraag.antwoorden ?? [])[0]}</strong>
                        </p>
                      ) : (
                        <p className="border-b border-black h-6" aria-hidden />
                      )}
                    </div>
                  ) : (
                  <ul className="mt-2 space-y-1.5">
                    {vraag.options.map((optie, i) => {
                      const isJuist = vraag.correctAnswers.includes(i);
                      return (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="inline-block w-4 h-4 border border-black shrink-0 mt-0.5 text-center leading-none text-xs">
                            {metAntwoorden && isJuist ? "×" : ""}
                          </span>
                          <span className={metAntwoorden && isJuist ? "font-bold" : ""}>{optie}</span>
                        </li>
                      );
                    })}
                  </ul>
                  )}
                  {metAntwoorden && vraag.explanation && (
                    <p className="text-sm mt-2">{t("klas.afdrukken.uitleg", { uitleg: vraag.explanation })}</p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Invuloefening */}
        {oefening.type === "fillblank" && (
          <section>
            <h2 className="text-base font-bold mb-4">{t("klas.afdrukken.invullen")}</h2>
            <ol className="space-y-5 list-decimal pl-5">
              {(c.fillBlanks ?? []).map((zin) => (
                <li key={zin.id} className="afdruk-blad">
                  {ontleedInvulzin(zin.textWithBlanks).map((stuk, i) =>
                    stuk.soort === "tekst" ? (
                      <span key={i}>{stuk.waarde}</span>
                    ) : metAntwoorden ? (
                      <strong key={i} className="underline"> {stuk.antwoorden[0]} </strong>
                    ) : (
                      <Lijn key={i} breedte="7rem" />
                    )
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Matching */}
        {oefening.type === "matching" && (
          <section>
            <h2 className="text-base font-bold mb-1">{t("klas.afdrukken.verbinden.titel")}</h2>
            <p className="text-sm mb-5">{t("klas.afdrukken.verbinden.uitleg")}</p>
            <div className="grid grid-cols-2 gap-x-10 gap-y-3">
              <ol className="space-y-3 list-decimal pl-5">
                {(c.matchingPairs ?? []).map((paar) => (
                  <li key={paar.id} className="text-sm">
                    {paar.left}
                    {metAntwoorden && <strong> — {paar.right}</strong>}
                  </li>
                ))}
              </ol>
              {!metAntwoorden && (
                <ul className="space-y-3">
                  {hussel(c.matchingPairs ?? []).map((paar) => (
                    <li key={paar.id} className="text-sm">
                      {paar.right}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* Zinnen bouwen en stappen op volgorde */}
        {(oefening.type === "zinbouwen" || oefening.type === "volgorde") && (
          <section>
            <h2 className="text-base font-bold mb-4">
              {oefening.type === "zinbouwen"
                ? t("klas.afdrukken.zinbouwen")
                : t("klas.afdrukken.volgorde")}
            </h2>
            <ol className="space-y-6 list-decimal pl-5">
              {(c.ordenItems ?? []).map((item) => (
                <li key={item.id} className="afdruk-blad">
                  {item.opdracht && <p className="font-bold mb-1">{item.opdracht}</p>}

                  {oefening.type === "zinbouwen" ? (
                    <>
                      <p className="text-sm">{hussel(item.delen).join(" · ")}</p>
                      {metAntwoorden ? (
                        <p className="text-sm mt-1">
                          <strong>{item.delen.join(" ")}</strong>
                        </p>
                      ) : (
                        <div className="border-b border-black mt-4" />
                      )}
                    </>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {(metAntwoorden ? item.delen : hussel(item.delen)).map((stap, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm">
                          <span className="inline-block w-7 h-7 border border-black text-center leading-7 shrink-0">
                            {metAntwoorden ? i + 1 : ""}
                          </span>
                          <span>{stap}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Sorteren */}
        {oefening.type === "sorteren" && (
          <section>
            <h2 className="text-base font-bold mb-1">{t("klas.afdrukken.sorteren.titel")}</h2>
            <p className="text-sm mb-5">
              {t("klas.afdrukken.sorteren.uitleg", {
                bakjes: (c.categorieen ?? []).map((naam, i) => `${i + 1} = ${naam}`).join(", "),
              })}
            </p>
            <ol className="grid grid-cols-2 gap-x-8 gap-y-3 list-decimal pl-5">
              {hussel(c.sorteerItems ?? []).map((item) => (
                <li key={item.id} className="text-sm">
                  {item.tekst}
                  {metAntwoorden ? (
                    <strong> — {(c.categorieen ?? [])[item.categorie]}</strong>
                  ) : (
                    <Lijn breedte="3rem" />
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Open vragen */}
        {oefening.type === "openvraag" && (
          <section>
            <h2 className="text-base font-bold mb-4">{t("klas.afdrukken.openvraag")}</h2>
            <ol className="space-y-8 list-decimal pl-5">
              {(c.openVragen ?? []).map((vraag) => (
                <li key={vraag.id} className="afdruk-blad">
                  <p className="font-bold">{vraag.vraag}</p>
                  {metAntwoorden ? (
                    <p className="text-sm mt-2">{t("klas.afdrukken.modelantwoord", { antwoord: vraag.modelantwoord })}</p>
                  ) : (
                    <Schrijfruimte regels={4} />
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Werkwoorden */}
        {oefening.type === "werkwoorden" && (
          <section>
            <h2 className="text-base font-bold mb-4">{t("klas.afdrukken.werkwoorden")}</h2>
            <div className="space-y-6">
              {(c.werkwoorden ?? []).map((werkwoord) => (
                <div key={werkwoord.id} className="afdruk-blad">
                  <p className="font-bold mb-2">{werkwoord.infinitief}</p>
                  <ul className="grid grid-cols-2 gap-x-8 gap-y-2">
                    {werkwoord.vormen.map((vorm, i) => (
                      <li key={i} className="text-sm">
                        {vorm.persoon}{" "}
                        {metAntwoorden ? <strong>{vorm.vorm}</strong> : <Lijn breedte="6rem" />}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rekenen */}
        {oefening.type === "rekenen" && (
          <section>
            <h2 className="text-base font-bold mb-1">{t("klas.afdrukken.rekenen.titel")}</h2>
            <p className="text-sm mb-5">
              {t("klas.afdrukken.rekenen.uitleg")}
            </p>
            <ol className="space-y-5 list-decimal pl-5">
              {rekenronde.map((opgave) => (
                <li key={opgave.id} className="afdruk-blad text-sm">
                  <p>{opgave.vraag}</p>
                  {metAntwoorden ? (
                    <p className="mt-1">
                      <strong>{toonAntwoord(opgave)}</strong> — {opgave.uitleg}
                    </p>
                  ) : (
                    <p className="mt-2">
                      {t("klas.afdrukken.antwoord")} <Lijn breedte="9rem" />
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Escaperoom: op papier een reeks opdrachten met een vakje per slot */}
        {oefening.type === "escaperoom" && c.escaperoom && (
          <section>
            <h2 className="text-base font-bold mb-1">{t("klas.afdrukken.escaperoom.titel")}</h2>
            <p className="text-sm mb-5">
              {t("klas.afdrukken.escaperoom.uitleg")}
            </p>
            {c.escaperoom.verhaal && (
              <p className="text-sm mb-6 whitespace-pre-line">{c.escaperoom.verhaal}</p>
            )}
            <ol className="space-y-6 list-decimal pl-5">
              {c.escaperoom.sloten.map((slot) => (
                <li key={slot.id} className="afdruk-blad text-sm">
                  <p className="font-bold whitespace-pre-line">{slot.opdracht}</p>
                  {slot.media?.soort === "afbeelding" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={slot.media.url}
                      alt={slot.media.alt ?? ""}
                      className="mt-2 max-h-48 w-auto"
                    />
                  )}
                  {slot.media && slot.media.soort !== "afbeelding" && (
                    <p className="mt-1">{t("klas.afdrukken.escaperoom.fragment")}</p>
                  )}
                  {slot.hint && !metAntwoorden && <p className="mt-1">{t("klas.afdrukken.hint", { hint: slot.hint })}</p>}
                  {metAntwoorden ? (
                    <p className="mt-2">
                      <strong>{slot.antwoorden.join(" / ")}</strong>
                    </p>
                  ) : (
                    <p className="mt-2">
                      {t("klas.afdrukken.antwoord")} <Lijn breedte="12rem" />
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Exit ticket */}
        {oefening.type === "exitticket" && (
          <section>
            <h2 className="text-base font-bold mb-4">{t("klas.afdrukken.exitticket")}</h2>
            <ol className="space-y-8 list-decimal pl-5">
              {(c.exitTicketPrompts ?? []).map((vraag, i) => (
                <li key={i} className="afdruk-blad">
                  <p className="font-bold">{vraag}</p>
                  <Schrijfruimte regels={3} />
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Klassikale werkvormen horen op het bord, niet op papier */}
        {(oefening.type === "poll" || oefening.type === "wordcloud") && (
          <p className="text-sm">
            {t("klas.afdrukken.klassikaal")}
          </p>
        )}

        <footer className="mt-10 pt-3 border-t border-black text-xs">
          {instellingen.organisatie
            ? t("klas.afdrukken.voet", {
                app: instellingen.naam,
                organisatie: instellingen.organisatie,
                code: oefening.shareCode,
              })
            : t("klas.afdrukken.voetZonderOrganisatie", {
                app: instellingen.naam,
                code: oefening.shareCode,
              })}
        </footer>
      </article>
      )}
    </div>
  );
}

export default function AfdrukkenPagina() {
  return (
    <FunctiePoort functie="afdrukken">
      <AfdrukkenPaginaInhoud />
    </FunctiePoort>
  );
}
