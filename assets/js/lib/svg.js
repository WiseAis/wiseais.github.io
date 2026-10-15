/* Küçük SVG yardımcıları: bileşenler aynı dili konuşsun */
export const NS = "http://www.w3.org/2000/svg";

export function el(ad, oz = {}, ebeveyn) {
  const d = document.createElementNS(NS, ad);
  for (const [k, v] of Object.entries(oz)) {
    if (k === "metin") d.textContent = v;
    else d.setAttribute(k, v);
  }
  if (ebeveyn) ebeveyn.appendChild(d);
  return d;
}

export function svg(genislik, yukseklik, ebeveyn) {
  return el("svg", { viewBox: `0 0 ${genislik} ${yukseklik}`, "aria-hidden": "true" }, ebeveyn);
}

/* Emisyon çizgileri ve renkleri: sitenin paleti buradan gelir */
export const CIZGI = {
  ha: { ad: "Hα", nm: 656.3, renk: "#ff4f61" },
  oiii: { ad: "[O III]", nm: 500.7, renk: "#45d6c8" },
  oiii2: { ad: "[O III]", nm: 495.9, renk: "#45d6c8" },
  hb: { ad: "Hβ", nm: 486.1, renk: "#8aa2ff" },
  nii1: { ad: "[N II]", nm: 654.8, renk: "#e0a26a" },
  nii2: { ad: "[N II]", nm: 658.3, renk: "#e0a26a" },
  sii1: { ad: "[S II]", nm: 671.6, renk: "#c98bd8" },
  sii2: { ad: "[S II]", nm: 673.1, renk: "#c98bd8" },
};

export const RENK = {
  isik: "#ece8e1",
  isik2: "#a9a7a3",
  isik3: "#85858b",
  isik4: "#3d3f46",
  cizgi: "rgba(236,232,225,0.12)",
  ha: "#ff4f61",
  oiii: "#45d6c8",
  hb: "#8aa2ff",
  toz: "#e0a26a",
  gok2: "#13161d",
};
