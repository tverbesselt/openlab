import { redirect } from "next/navigation";

/** Eigen materiaal is een filter binnen de bibliotheek, geen aparte pagina meer. */
export default function MijnMateriaalPagina() {
  redirect("/bibliotheek?van=mij");
}
