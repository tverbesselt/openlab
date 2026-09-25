// Los van Weergave.tsx: die is een clientmodule, en de layout (een servercomponent) krijgt
// uit een clientmodule geen tekst maar een verwijzing. Het script kwam dan als foutmelding
// in de pagina terecht.

export const WEERGAVE_SLEUTEL = "openlab_weergave";

/**
 * Draait vóór de eerste tekening; staat als los script in de layout. Bewust in gewone
 * tekst geschreven en niet gebundeld, want alleen zo is het er op tijd.
 */
export const WEERGAVE_SCRIPT = `
(function () {
  try {
    var w = JSON.parse(localStorage.getItem("${WEERGAVE_SLEUTEL}") || "{}");
    var el = document.documentElement;
    if (w.tekst && w.tekst !== "normaal") el.setAttribute("data-tekst", w.tekst);
    if (w.contrast === "hoog") el.setAttribute("data-contrast", "hoog");
    if (w.lezen === "ruim") el.setAttribute("data-lezen", "ruim");
  } catch (e) {}
})();
`;
