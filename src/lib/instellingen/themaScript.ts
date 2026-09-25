// Los van AppProvider, want de layout (een servercomponent) leest deze tekst.

export const THEMA_SLEUTEL = "openlab_thema";

/** Draait vóór de eerste tekening, zoals het weergavescript: de kleuren van de vorige keer. */
export const THEMA_SCRIPT = `
(function () {
  try {
    var v = JSON.parse(localStorage.getItem("${THEMA_SLEUTEL}") || "{}");
    for (var k in v) document.documentElement.style.setProperty(k, v[k]);
  } catch (e) {}
})();
`;
