import { redirect } from "next/navigation";

/** Oefenpakketten heten nu mappen; oude gedeelde links blijven werken. */
export default async function OudeSetPagina({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/mappen/${id}`);
}
