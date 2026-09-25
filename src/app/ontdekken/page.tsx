import { redirect } from "next/navigation";

/** De catalogus en "mijn materiaal" zijn samengevoegd tot één bibliotheek. */
export default async function OntdekkenPagina({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  redirect(q ? `/bibliotheek?q=${encodeURIComponent(q)}` : "/bibliotheek");
}
