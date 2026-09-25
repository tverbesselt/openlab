import React from "react";
import { ruw, vasteWaarde, type Sleutel, type Vars } from "./index";

/**
 * Vertaling met opmaak erin. In de tekst staan tags, de aanroep zegt wat ze worden:
 *
 *   nl: "Typ <b>één woord</b> of <link>lees de uitleg</link>."
 *   tr("maken.uitleg", { b: (s) => <strong>{s}</strong>, link: (s) => <Link href="/x">{s}</Link> })
 *
 * Tags worden niet genest. {naam} vult zich in zoals bij t(), ook met een React-element.
 */
export function tr(
  sleutel: Sleutel,
  tags: Record<string, (inhoud: React.ReactNode) => React.ReactNode> = {},
  vars: Record<string, React.ReactNode> = {}
): React.ReactNode {
  const tekst = ruw(sleutel);
  const delen: React.ReactNode[] = [];
  const re = /<(\w+)>([\s\S]*?)<\/\1>/g;
  let vorige = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(tekst))) {
    if (m.index > vorige) delen.push(...vulIn(tekst.slice(vorige, m.index), vars, i++));
    const maak = tags[m[1]];
    const binnen = vulIn(m[2], vars, i++);
    delen.push(
      <React.Fragment key={`t${i++}`}>{maak ? maak(binnen) : binnen}</React.Fragment>
    );
    vorige = m.index + m[0].length;
  }
  if (vorige < tekst.length) delen.push(...vulIn(tekst.slice(vorige), vars, i++));
  return <>{delen}</>;
}

function vulIn(stuk: string, vars: Record<string, React.ReactNode>, sleutel: number): React.ReactNode[] {
  const uit: React.ReactNode[] = [];
  const re = /\{(\w+)\}/g;
  let vorige = 0;
  let m: RegExpExecArray | null;
  let j = 0;
  while ((m = re.exec(stuk))) {
    if (m.index > vorige) uit.push(stuk.slice(vorige, m.index));
    const w = m[1] in vars ? vars[m[1]] : vasteWaarde(m[1]);
    uit.push(<React.Fragment key={`v${sleutel}-${j++}`}>{w ?? m[0]}</React.Fragment>);
    vorige = m.index + m[0].length;
  }
  if (vorige < stuk.length) uit.push(stuk.slice(vorige));
  return uit;
}

export type { Vars };
