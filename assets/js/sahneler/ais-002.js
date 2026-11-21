import { el, svg, RENK } from "../lib/svg.js?v=20261121g";
import { tohumlu } from "../lib/rastgele.js?v=20261121g";

const SICAK = "#ffd29a";
const SOGUK = "#8aa2ff";
const DAL = "#8a6a4a";
const yumusak = (x) => x * x * (3 - 2 * x);
const ara = (a, b, k) => a + (b - a) * k;
const sinir = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const pencere = (t, a, b) => sinir((t - a) / (b - a));
const virgul = (v, b = 1) => v.toFixed(b).replace(".", ",");

function parlakFiltre(defs, id, sapma = 2.2) {
  const f = el("filter", { id, x: "-200%", y: "-200%", width: "500%", height: "500%" }, defs);
  el("feGaussianBlur", { stdDeviation: sapma }, f);
}

function yildizAlani(s, tohum, n, yMax) {
  const rnd = tohumlu(tohum);
  return Array.from({ length: n }, () =>
    el("circle", { cx: (rnd() * 480).toFixed(1), cy: (rnd() * yMax).toFixed(1), r: (0.4 + rnd() * 0.9).toFixed(2), fill: "#fff4e2", opacity: 0.5 }, s),
  );
}

function parilda(liste, t, carpan = 1) {
  liste.forEach((y, i) => y.setAttribute("opacity", (carpan * (0.3 + 0.4 * (0.5 + 0.5 * Math.sin(t * 1.3 + i)))).toFixed(2)));
}

function insan(ebeveyn, filtre) {
  const g = el("g", {}, ebeveyn);
  const hale = el("circle", { r: 4.5, fill: SICAK, opacity: 0.8, filter: `url(#${filtre})` }, g);
  const cekirdek = el("circle", { r: 2.2, fill: "#fff4e2" }, g);
  return { g, hale, cekirdek };
}

function prensCiz(ebeveyn) {
  const g = el("g", {}, ebeveyn);
  el("path", { d: "M-3.6 0 L-2.6 -11 L2.6 -11 L3.6 0z", fill: RENK.isik2 }, g);
  el("circle", { cx: 0, cy: -14.5, r: 3.2, fill: RENK.isik2 }, g);
  return g;
}

const yerlestir = (g, x, y, olcek = 1) =>
  g.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})${olcek === 1 ? "" : ` scale(${olcek.toFixed(3)})`}`);

function perdeKur(s) {
  return el("rect", { x: -40, y: -40, width: 560, height: 440, fill: "#07080b", opacity: 0 }, s);
}

function ates(kok) {
  const s = svg(480, 360, kok);
  const T = 16;
  const tepe = (x) =>
    x < 200 ? 264 + 36 * ((200 - x) / 200) ** 2 : x < 330 ? 264 - (2 * (x - 200)) / 130 : 262 + 34 * ((x - 330) / 150) ** 2;
  const ocak = { x: 262, y: tepe(262) };
  const dal = { x: 160, y: tepe(160) };

  const defs = el("defs", {}, s);
  parlakFiltre(defs, "ates-parilti");
  const sisFiltre = el("filter", { id: "ates-sis", x: "-50%", y: "-120%", width: "200%", height: "340%" }, defs);
  el("feGaussianBlur", { stdDeviation: 10 }, sisFiltre);
  const havuzG = el("radialGradient", { id: "ates-havuz" }, defs);
  el("stop", { offset: "0", "stop-color": SICAK, "stop-opacity": 0.42 }, havuzG);
  el("stop", { offset: "0.4", "stop-color": RENK.toz, "stop-opacity": 0.16 }, havuzG);
  el("stop", { offset: "1", "stop-color": RENK.toz, "stop-opacity": 0 }, havuzG);
  const ufukSoguk = el("radialGradient", { id: "ates-ufuk-soguk" }, defs);
  el("stop", { offset: "0", "stop-color": SOGUK, "stop-opacity": 0.2 }, ufukSoguk);
  el("stop", { offset: "1", "stop-color": SOGUK, "stop-opacity": 0 }, ufukSoguk);
  const ufukSabah = el("radialGradient", { id: "ates-ufuk-sabah" }, defs);
  el("stop", { offset: "0", "stop-color": RENK.toz, "stop-opacity": 0.22 }, ufukSabah);
  el("stop", { offset: "1", "stop-color": RENK.toz, "stop-opacity": 0 }, ufukSabah);

  const gokSoguk = el("ellipse", { cx: 240, cy: 262, rx: 280, ry: 170, fill: "url(#ates-ufuk-soguk)" }, s);
  const gokSabah = el("ellipse", { cx: 240, cy: 262, rx: 280, ry: 150, fill: "url(#ates-ufuk-sabah)", opacity: 0 }, s);
  const yildiz = yildizAlani(s, 2026, 55, 190);

  el("path", { d: "M296 270 V238 h6 v-6 h5 v6 h5 v-4 h6 V270z M332 272 V250 h4 l3 -5 3 7 h5 V272z", fill: "#030405" }, s);
  el("path", { d: "M392 280 V196 h4 v-6 h5 v6 h5 v-6 h5 v6 h4 V280z", fill: "#030405" }, s);
  el("rect", { x: 401, y: 206, width: 5, height: 7, fill: RENK.isik4 }, s);

  let alan = "M0 360";
  let kenar = "";
  for (let x = 0; x <= 480; x += 8) {
    alan += ` L${x} ${tepe(x).toFixed(1)}`;
    kenar += `${x ? "L" : "M"}${x} ${tepe(x).toFixed(1)}`;
  }
  const toprak = el("linearGradient", { id: "ates-toprak", x1: 0, y1: 250, x2: 0, y2: 360, gradientUnits: "userSpaceOnUse" }, defs);
  el("stop", { offset: "0", "stop-color": "#050608", "stop-opacity": 1 }, toprak);
  el("stop", { offset: "0.55", "stop-color": "#050608", "stop-opacity": 0.85 }, toprak);
  el("stop", { offset: "1", "stop-color": "#050608", "stop-opacity": 0 }, toprak);
  el("path", { d: `${alan} L480 360z`, fill: "url(#ates-toprak)" }, s);
  el("path", { d: kenar, fill: "none", stroke: RENK.isik4 }, s);

  const havuz = el("ellipse", { cx: ocak.x, cy: ocak.y - 12, rx: 0, ry: 0, fill: "url(#ates-havuz)" }, s);

  const yigin = el("g", { transform: `translate(${dal.x} ${dal.y.toFixed(1)})` }, s);
  const dallar = [
    [-9, -1, 8, -6],
    [-8, -5, 9, -1],
    [-6, -3, 7, -9],
    [-4, -8, 6, -2],
  ].map(([x1, y1, x2, y2]) => el("line", { x1, y1, x2, y2, stroke: DAL, "stroke-width": 1.6, "stroke-linecap": "round" }, yigin));
  el("text", { x: dal.x, y: dal.y + 24, "text-anchor": "middle", class: "zayif", metin: "dal yığını" }, s);

  const ocakG = el("g", { transform: `translate(${ocak.x} ${ocak.y.toFixed(1)})` }, s);
  [-9, -4.5, 0, 4.5, 9].forEach((dx, i) => el("rect", { x: dx - 2, y: -3 - (i % 2), width: 4, height: 3, fill: RENK.isik3 }, ocakG));
  const alevler = [
    [RENK.toz, 1],
    [SICAK, 0.68],
    ["#fff4e2", 0.36],
  ].map(([renk, o]) => ({ p: el("path", { d: "M0 0 C-7 -4 -5 -14 0 -22 C5 -14 7 -4 0 0z", fill: renk, transform: "scale(0)" }, ocakG), o }));
  const kivilcim = Array.from({ length: 6 }, () => el("circle", { r: 1.1, fill: SICAK, opacity: 0 }, ocakG));
  el("text", { x: ocak.x, y: ocak.y + 24, "text-anchor": "middle", class: "zayif", metin: "yıkık ocak" }, s);

  const prens = prensCiz(s);
  const eldeDal = el("line", { x1: 2, y1: -7, x2: 12, y2: -13, stroke: DAL, "stroke-width": 1.6, "stroke-linecap": "round", opacity: 0 }, prens);
  const ais = el("g", {}, s);
  el("circle", { r: 5, fill: SICAK, opacity: 0.85, filter: "url(#ates-parilti)" }, ais);
  el("circle", { r: 2, fill: "#fff4e2" }, ais);

  const gelenler = [
    { bas: -14, son: ocak.x - 62, t0: 8.0 },
    { bas: 494, son: ocak.x + 28, t0: 8.3 },
    { bas: -14, son: ocak.x - 46, t0: 8.6 },
    { bas: 494, son: ocak.x + 44, t0: 8.9 },
    { bas: -14, son: ocak.x - 31, t0: 9.3 },
    { bas: 494, son: ocak.x + 60, t0: 9.7 },
  ].map((g) => ({ ...g, k: insan(s, "ates-parilti") }));

  const sisG = el("g", { filter: "url(#ates-sis)" }, s);
  const rnd = tohumlu(41);
  const sis = Array.from({ length: 9 }, (_, i) => {
    const x = 26 + i * 54 + (rnd() - 0.5) * 30;
    return { e: el("ellipse", { rx: (46 + rnd() * 30).toFixed(1), ry: (12 + rnd() * 8).toFixed(1), fill: "#9fb0dc" }, sisG), x, y: tepe(x) - 12 - rnd() * 36, faz: rnd() * 6 };
  });

  const soz = el("text", { x: ocak.x - 10, y: 188, "text-anchor": "middle", fill: SICAK, opacity: 0, metin: "“Işığınızı tepe yolundan gördük.”" }, s);
  el("text", { x: 24, y: 28, class: "zayif", metin: "HEDEF" }, s);
  const hedef1 = el("text", { x: 24, y: 48, class: "formul", metin: "GECE GELMEDEN ATEŞ YAK" }, s);
  const hedef2 = el("text", { x: 24, y: 48, class: "formul", fill: SICAK, opacity: 0, metin: "KIŞ GELMEDEN HAZIRLAN" }, s);
  const saat = el("text", { x: 456, y: 28, "text-anchor": "end", class: "zayif" }, s);
  const durum = el("text", { x: 24, y: 340, class: "zayif" }, s);
  const perde = perdeKur(s);

  return {
    adim(t) {
      const d = t % T;

      let x = 214;
      let yuruyor = false;
      if (d < 1.2) x = 214;
      else if (d < 2.8) [x, yuruyor] = [ara(214, dal.x + 10, yumusak(pencere(d, 1.2, 2.8))), true];
      else if (d < 3.4) x = dal.x + 10;
      else if (d < 5.6) [x, yuruyor] = [ara(dal.x + 10, ocak.x - 14, yumusak(pencere(d, 3.4, 5.6))), true];
      else x = ocak.x - 14;
      const sek = yuruyor ? Math.abs(Math.sin(t * 9)) * 1.5 : 0;
      yerlestir(prens, x, tepe(x) - sek);
      const tasiyor = d > 3.1 && d < 5.8;
      eldeDal.setAttribute("opacity", tasiyor ? 1 : 0);
      dallar[3].setAttribute("opacity", d > 3.1 ? 0 : 1);
      yerlestir(ais, x - 11, tepe(x) - 30 + Math.sin(t * 2.1) * 2.5);

      const cakmak = d > 5.6 && d < 6.4 ? 0.25 * (0.5 + 0.5 * Math.sin(t * 34)) : 0;
      const alev = Math.max(cakmak, yumusak(pencere(d, 6.2, 7.4)));
      alevler.forEach(({ p, o }, j) => {
        const sx = alev * o;
        const sy = alev * o * (1 + 0.14 * Math.sin(t * 13 + j * 1.7));
        p.setAttribute("transform", `translate(0 -2) scale(${sx.toFixed(3)} ${sy.toFixed(3)})`);
      });
      kivilcim.forEach((k, i) => {
        const f = (t * 0.7 + i / 6) % 1;
        k.setAttribute("cx", (Math.sin(i * 2.3 + f * 5) * 6).toFixed(1));
        k.setAttribute("cy", (-12 - f * 42).toFixed(1));
        k.setAttribute("opacity", (alev > 0.5 ? alev * (1 - f) * 0.9 : 0).toFixed(2));
      });

      const isik = yumusak(pencere(d, 6.4, 9.5));
      const sabah = yumusak(pencere(d, 12.4, 14));
      havuz.setAttribute("rx", (20 + 150 * isik).toFixed(1));
      havuz.setAttribute("ry", (10 + 70 * isik).toFixed(1));
      havuz.setAttribute("opacity", (alev * (0.45 + 0.55 * isik) * (0.92 + 0.08 * Math.sin(t * 11)) * (1 - 0.35 * sabah)).toFixed(2));
      sis.forEach(({ e, x: sx, y: sy, faz }) => {
        const yon = Math.sign(sx - ocak.x) || 1;
        const kac = yon * (60 + Math.abs(sx - ocak.x) * 0.6) * isik;
        e.setAttribute("cx", (sx + kac + Math.sin(t * 0.3 + faz) * 6).toFixed(1));
        e.setAttribute("cy", sy.toFixed(1));
        e.setAttribute("opacity", (0.24 * (1 - 0.65 * isik) * (1 - 0.6 * sabah)).toFixed(3));
      });
      gokSoguk.setAttribute("opacity", (1 - 0.5 * isik - 0.4 * sabah).toFixed(2));
      gokSabah.setAttribute("opacity", sabah.toFixed(2));
      const gece = pencere(d, 5, 8) * (1 - sabah);
      parilda(yildiz, t, 0.25 + 0.75 * gece);

      gelenler.forEach(({ bas, son, t0, k }, i) => {
        const yol = pencere(d, t0, t0 + 2.6);
        const gx = ara(bas, son, yumusak(yol));
        const adimda = yol > 0 && yol < 1;
        yerlestir(k.g, gx, tepe(gx) - 5 - (adimda ? Math.abs(Math.sin(t * 9 + i)) * 2.5 : 0));
        k.g.setAttribute("opacity", d < t0 ? 0 : pencere(d, t0, t0 + 0.4).toFixed(2));
      });
      soz.setAttribute("opacity", (pencere(d, 10, 10.6) * (1 - pencere(d, 13.2, 13.8))).toFixed(2));

      const yandi = d > 7;
      hedef1.textContent = yandi ? "GECE GELMEDEN ATEŞ YAK ✓" : "GECE GELMEDEN ATEŞ YAK";
      hedef1.setAttribute("fill", yandi ? RENK.toz : RENK.isik);
      hedef1.setAttribute("opacity", (1 - sabah).toFixed(2));
      hedef2.setAttribute("opacity", sabah.toFixed(2));
      saat.textContent = d < 6.6 ? "YAZ 3 · AKŞAMÜSTÜ" : d < 12.4 ? "YAZ 3 · GECE" : "YAZ 4 · SABAH";
      durum.textContent =
        d < 1.2 ? "akşamüstü · soğuk mavi sis"
        : d < 3.4 ? "prens dal yığınına yürüyor"
        : d < 6.2 ? "dalı yıkık ocağa taşıyor"
        : d < 8.2 ? "ateş tuttu · sis geri çekiliyor"
        : d < 12.4 ? "ışığı görenler tepeye tırmanıyor"
        : "sabah · hedef değişti";
      perde.setAttribute("opacity", Math.max(1 - pencere(d, 0, 0.7), pencere(d, 15.2, 16)).toFixed(2));
    },
  };
}

function gorev(kok) {
  const s = svg(480, 360, kok);
  const zemin = 250;
  const defs = el("defs", {}, s);
  const parilti = el("filter", { id: "gorev-parilti", x: "-200%", y: "-200%", width: "500%", height: "500%" }, defs);
  el("feGaussianBlur", { stdDeviation: 2.2 }, parilti);
  const hale = el("radialGradient", { id: "gorev-hale" }, defs);
  el("stop", { offset: "0", "stop-color": RENK.toz, "stop-opacity": 0.28 }, hale);
  el("stop", { offset: "1", "stop-color": RENK.toz, "stop-opacity": 0 }, hale);

  const rnd = tohumlu(312);
  const yildizlar = Array.from({ length: 60 }, () => el("circle", { cx: rnd() * 480, cy: rnd() * 200, r: 0.4 + rnd() * 0.9, fill: "#fff4e2", opacity: 0.5 }, s));
  el("ellipse", { cx: 96, cy: zemin - 10, rx: 120, ry: 70, fill: "url(#gorev-hale)" }, s);
  el("rect", { x: 0, y: zemin, width: 480, height: 110, fill: "#050608" }, s);
  el("line", { x1: 0, x2: 480, y1: zemin, y2: zemin, stroke: RENK.isik4 }, s);

  el("path", { d: `M56 ${zemin} v-64 h6 v-7 h5 v7 h5 v-7 h5 v7 h6 v28 h14 v-10 h4 l3 6 3 -9 4 13 v40z`, fill: "#030405" }, s);
  el("rect", { x: 66, y: zemin - 52, width: 4, height: 7, fill: SICAK, opacity: 0.85 }, s);
  el("path", { d: `M83 ${zemin} v-14 q6 -7 12 0 v14z`, fill: RENK.toz, opacity: 0.75 }, s);
  el("text", { x: 90, y: zemin + 22, "text-anchor": "middle", metin: "kale" }, s);

  const hedefler = [
    { ad: "orman", x: 230 },
    { ad: "taş ocağı", x: 330 },
    { ad: "çalılık", x: 420 },
  ];

  for (const [dx, b] of [[-16, 1], [-6, 1.3], [6, 1.1], [16, 0.9]]) {
    el("path", { d: `M${230 + dx - 6 * b} ${zemin} L${230 + dx} ${zemin - 22 * b} L${230 + dx + 6 * b} ${zemin}z`, fill: "#030405" }, s);
  }

  for (const [dx, r] of [[-13, 6], [-3, 8], [9, 6.5], [18, 5]]) {
    el("path", { d: `M${420 + dx - r} ${zemin} a${r} ${r * 0.85} 0 0 1 ${2 * r} 0z`, fill: "#030405" }, s);
  }
  const isaret = hedefler.map((h) => {
    const g = el("g", { opacity: 0.4 }, s);
    el("line", { x1: h.x, x2: h.x, y1: zemin - 2, y2: zemin - 46, stroke: RENK.toz, "stroke-dasharray": "2 3" }, g);
    el("path", { d: `M${h.x} ${zemin - 46} l14 5 -14 5z`, fill: RENK.toz }, g);
    el("text", { x: h.x, y: zemin + 22, "text-anchor": "middle", metin: h.ad }, g);
    return g;
  });
  const kisiler = Array.from({ length: 6 }, () => {
    const g = el("g", {}, s);
    el("circle", { r: 4.5, fill: SICAK, opacity: 0.8, filter: "url(#gorev-parilti)" }, g);
    el("circle", { r: 2.2, fill: "#fff4e2" }, g);
    return g;
  });
  const secim = el("text", { x: 24, y: 40, class: "formul", metin: "" }, s);
  const nufus = el("text", { x: 24, y: 60, metin: "" }, s);
  const durum = el("text", { x: 24, y: 320, class: "zayif", metin: "" }, s);

  return {
    adim(t) {
      const tur = Math.floor(t / 8);
      const d = t % 8;
      const hedef = hedefler[tur % hedefler.length];
      const n = 3 + (tur % 3);
      isaret.forEach((g, i) => g.setAttribute("opacity", hedefler[i] === hedef && d > 1 ? 1 : 0.35));
      yildizlar.forEach((y, i) => y.setAttribute("opacity", (0.3 + 0.4 * (0.5 + 0.5 * Math.sin(t * 1.3 + i))).toFixed(2)));

      let ilerleme = 0;
      if (d > 1 && d <= 4) ilerleme = yumusak((d - 1) / 3);
      else if (d > 4 && d <= 5) ilerleme = 1;
      else if (d > 5) ilerleme = 1 - yumusak(Math.min(1, (d - 5) / 2.5));
      kisiler.forEach((k, i) => {
        const aktif = i < n;
        const x = aktif ? ara(110, hedef.x - 12, ilerleme) - i * 9 : 112 - i * 6;
        const yuruyor = aktif && ilerleme > 0 && ilerleme < 1;
        const sek = yuruyor ? Math.abs(Math.sin(t * 9 + i)) * 3 : 0;
        k.setAttribute("transform", `translate(${x.toFixed(1)} ${(zemin - 5 - sek).toFixed(1)})`);
        k.setAttribute("opacity", aktif ? 1 : 0.3);
      });
      const gorevde = d > 1 && d < 7.5 ? n : 0;
      secim.textContent = `${n} KİŞİ → ${hedef.ad.toLocaleUpperCase("tr")}`;
      nufus.textContent = `kullanılabilir nüfus: ${7 - gorevde} / 7`;
      durum.textContent = d < 1 ? "kişi sayısı seçiliyor" : d < 4 ? "hedefe yürüyorlar; görevdeyken nüfustan düşerler" : d < 5 ? "çalışıyorlar" : "dönüyorlar";
    },
  };
}

function kis(kok) {
  const s = svg(480, 360, kok);
  const T = 22;
  const x0 = 40;
  const gw = 400 / 24;
  const zemin = 300;
  const MEVSIM = ["Bahar", "Yaz", "Sonbahar", "Kış"];
  const MRENK = [RENK.isik3, RENK.isik3, RENK.toz, SOGUK];

  const defs = el("defs", {}, s);
  parlakFiltre(defs, "kis-parilti");

  el("text", { x: x0, y: 22, class: "formul", metin: "KIŞ HESABI" }, s);
  const tarih = el("text", { x: 440, y: 22, "text-anchor": "end" }, s);

  const hucreler = Array.from({ length: 24 }, (_, i) =>
    el("rect", { x: (x0 + i * gw + 0.75).toFixed(1), y: 44, width: (gw - 1.5).toFixed(1), height: 12, fill: MRENK[Math.floor(i / 6)], "fill-opacity": 0.18 }, s),
  );
  MEVSIM.forEach((ad, m) => el("text", { x: x0 + m * 100, y: 74, fill: m > 1 ? MRENK[m] : RENK.isik2, metin: ad.toLocaleUpperCase("tr") }, s));
  el("text", { x: x0 + 200, y: 88, class: "zayif", metin: "hasat ×1,5" }, s);
  el("text", { x: x0 + 300, y: 88, class: "zayif", metin: "toplama yok" }, s);
  for (const [gun, ad] of [[8, "gün 1"], [18, "gün 11 · ilk kış"]]) {
    el("line", { x1: x0 + gun * gw, x2: x0 + gun * gw, y1: 34, y2: 44, stroke: RENK.isik4 }, s);
    el("text", { x: x0 + gun * gw + 4, y: 38, class: "zayif", metin: ad }, s);
  }
  const imlec = el("g", {}, s);
  el("line", { x1: 0, x2: 0, y1: 40, y2: 60, stroke: SICAK, "stroke-width": 1.5 }, imlec);
  el("path", { d: "M0 60 l-4 6 h8z", fill: SICAK }, imlec);

  const GUN_PX = 18;
  const cubuk = (y, ad, renk) => {
    el("text", { x: x0, y: y + 4, metin: ad }, s);
    el("rect", { x: 120, y: y - 5, width: 216, height: 10, fill: RENK.gok2 }, s);
    const dolu = el("rect", { x: 120, y: y - 5, height: 10, fill: renk, "fill-opacity": 0.8 }, s);
    const deger = el("text", { x: 440, y: y + 4, "text-anchor": "end" }, s);
    return { dolu, deger, renk };
  };
  el("line", { x1: 120 + 6 * GUN_PX, x2: 120 + 6 * GUN_PX, y1: 112, y2: 160, stroke: SOGUK, "stroke-dasharray": "2 3" }, s);
  el("text", { x: 120 + 6 * GUN_PX, y: 108, "text-anchor": "middle", fill: SOGUK, metin: "kış: 6 gün" }, s);
  const yiyecekC = cubuk(124, "yiyecek", SICAK);
  const odunC = cubuk(150, "odun", RENK.toz);
  el("text", { x: x0, y: 178, class: "zayif", metin: "odun/kişi/gün · çatı altı 0,5 · açıkta 4,5" }, s);

  el("rect", { x: 0, y: zemin, width: 480, height: 60, fill: "#050608" }, s);
  el("line", { x1: 0, x2: 480, y1: zemin, y2: zemin, stroke: RENK.isik4 }, s);
  const ocakX = 272;
  const alev = el("path", { d: "M0 0 C-6 -3 -4 -12 0 -18 C4 -12 6 -3 0 0z", fill: RENK.toz }, s);
  el("path", { d: `M${ocakX - 8} ${zemin} h16`, stroke: RENK.isik3, "stroke-width": 3 }, s);
  const ONARIM = [
    [12.0, 13.0],
    [15.6, 16.6],
    null,
  ];
  const evler = [92, 156, 392].map((x, i) => {
    const harabe = el("path", {
      d: `M${x - 17} ${zemin} V${zemin - 22} H${x + 17} V${zemin}z M${x - 21} ${zemin - 22} L${x} ${zemin - 38} L${x + 21} ${zemin - 22}z`,
      fill: "none",
      "stroke-linejoin": "miter",
      "stroke-linecap": "butt",
      stroke: RENK.isik3,
      "stroke-dasharray": "3 3",
    }, s);
    const onarik = el("g", { opacity: 0 }, s);
    el("path", { d: `M${x - 17} ${zemin} V${zemin - 22} H${x + 17} V${zemin}z M${x - 21} ${zemin - 22} L${x} ${zemin - 38} L${x + 21} ${zemin - 22}z`, fill: "#0b0d12", stroke: RENK.toz, "stroke-opacity": 0.7 }, onarik);
    el("rect", { x: x - 4, y: zemin - 16, width: 8, height: 7, fill: SICAK }, onarik);
    const etiket = el("text", { x, y: zemin + 18, "text-anchor": "middle", class: "zayif" }, s);
    return { x, harabe, onarik, etiket, onarim: ONARIM[i] };
  });

  const DUR = [-50, -40, -30, -20, -10, 12, 22, 32, 42, 52];
  const kisiler = DUR.map((dx, i) => ({ ...insan(s, "kis-parilti"), x: ocakX + dx, ev: i < 4 ? 0 : i < 8 ? 1 : -1 }));
  const HASTA = 9;

  const rk = tohumlu(88);
  const kar = Array.from({ length: 46 }, () => ({ e: el("circle", { r: (0.9 + rk() * 0.9).toFixed(2), fill: "#d6deff", opacity: 0 }, s), x: rk() * 480, y: rk() * 110, h: 10 + rk() * 14 }));

  const sayim = el("text", { x: x0, y: 340, metin: "" }, s);
  const olay = el("text", { x: x0, y: 355, class: "zayif", metin: "" }, s);
  const perde = perdeKur(s);

  const insanSay = (p) => (p < 21.2 ? 10 : 9);
  const catiAlti = (p) => (p >= 13 ? 4 : 0) + (p >= 16.6 ? 4 : 0);
  const yiyecek = (p) => (p < 12 ? ara(24, 40, (p - 8.7) / 3.3) : p < 18 ? ara(40, 100, (p - 12) / 6) : p < 21.2 ? 100 - (p - 18) * 10 : 68 - (p - 21.2) * 9);
  const odun = (p) => {
    if (p < 18) return ara(8, 72, sinir((p - 8.7) / 9.3)) - (p >= 12 ? 6 : 0) - (p >= 15.6 ? 6 : 0);

    return p < 21.2 ? 60 - (p - 18) * 7 : 37.6 - (p - 21.2) * 2.5;
  };

  return {
    adim(t) {
      const d = t % T;
      const p = Math.min(23.99, 8.7 + 15.29 * pencere(d, 0.6, 18.6));
      const gun = Math.floor(p);
      const m = Math.floor(p / 6);
      tarih.textContent = `GÜN ${gun - 7} · ${MEVSIM[m].toLocaleUpperCase("tr")} ${(gun % 6) + 1}`;
      hucreler.forEach((h, i) => h.setAttribute("fill-opacity", i < gun ? 0.55 : i === gun ? 0.9 : 0.18));
      imlec.setAttribute("transform", `translate(${(x0 + p * gw).toFixed(1)} 0)`);

      const n = insanSay(p);
      const ic = catiAlti(p);
      const acik = n - ic;
      const yGun = yiyecek(p) / n;
      const oGun = odun(p) / (ic * 0.5 + acik * 4.5);
      for (const [c, v] of [[yiyecekC, yGun], [odunC, oGun]]) {
        c.dolu.setAttribute("width", (Math.min(12, v) * GUN_PX).toFixed(1));
        c.dolu.setAttribute("fill", v < 1.5 ? RENK.ha : c.renk);
        c.deger.textContent = v >= 12 ? "12+ gün yeter" : `${virgul(v)} gün yeter`;
      }

      evler.forEach((e) => {
        const r = e.onarim ? pencere(p, e.onarim[0], e.onarim[1]) : 0;
        e.harabe.setAttribute("opacity", (1 - r).toFixed(2));
        e.onarik.setAttribute("opacity", r.toFixed(2));
        e.etiket.textContent = !e.onarim ? "harabe · 10 taş + 6 odun" : r === 0 ? "harabe" : r < 1 ? "onarılıyor" : "4 kişi";
      });
      alev.setAttribute("transform", `translate(${ocakX} ${zemin - 2}) scale(${(0.9 + 0.1 * Math.sin(t * 12)).toFixed(3)} ${(1 + 0.12 * Math.sin(t * 9)).toFixed(3)})`);

      const kisK = pencere(p, 18, 18.6);
      kisiler.forEach((k, i) => {
        let x = k.x;
        let o = 1;
        if (k.ev >= 0) {
          const varis = evler[k.ev].onarim[1];
          const yol = yumusak(pencere(p, varis, varis + 0.8));
          x = ara(k.x, evler[k.ev].x + (i % 4) * 4 - 6, yol);
          o = 1 - pencere(p, varis + 0.6, varis + 1);
        }
        let y = zemin - 5 + Math.sin(t * 1.6 + i) * 0.8;
        if (i === HASTA) {
          const git = yumusak(pencere(p, 20.4, 21.2));
          x = ara(k.x, 476, git);
          y -= git > 0 && git < 1 ? Math.abs(Math.sin(t * 7)) * 2 : 0;
          o = 1 - pencere(p, 20.8, 21.2);
          const hasta = pencere(p, 19.4, 19.9);
          k.hale.setAttribute("fill", hasta > 0.5 ? SOGUK : SICAK);
          k.cekirdek.setAttribute("fill", hasta > 0.5 ? "#c9d3ff" : "#fff4e2");
        }
        yerlestir(k.g, x, y);
        k.g.setAttribute("opacity", o.toFixed(2));
      });
      kar.forEach((k, i) => {
        const y = 190 + ((k.y + t * k.h) % 62);
        k.e.setAttribute("cx", (k.x + Math.sin(t * 0.8 + i) * 4).toFixed(1));
        k.e.setAttribute("cy", y.toFixed(1));
        k.e.setAttribute("opacity", (kisK * 0.65).toFixed(2));
      });

      sayim.textContent = `ÇATI ALTINDA ${ic} · AÇIKTA ${acik}`;
      olay.textContent =
        p < 12 ? "yaz · herkes ocağın başında, açıkta"
        : p < 13 ? "ilk ev onarılıyor"
        : p < 15.6 ? "ilk ev onarıldı · 4 kişi çatı altında"
        : p < 16.6 ? "ikinci ev onarılıyor"
        : p < 18 ? "sonbahar hasadı ×1,5"
        : p < 19.4 ? "kış geldi · toplama durdu"
        : p < 20.4 ? "açıkta üşüyen biri hastalandı"
        : p < 21.8 ? "hasta ayrıldı"
        : "kış sürüyor";
      perde.setAttribute("opacity", Math.max(1 - pencere(d, 0, 0.6), pencere(d, 21.2, 22)).toFixed(2));
    },
  };
}

function lider(kok) {
  const s = svg(480, 360, kok);
  const T = 10;
  const zemin = 292;
  const yer = 392;
  const KARTLAR = [
    { ad: "Mother Hazel", topluluk: "Oduncular", is: "orman", yuk: DAL, kick: "Tanışma", baslik: "Ormanın Kıyısı", secenek: ["Kıyıdan kes, yerine fidan dik", "İç ormandan kes, odun bol olsun"], sonuc: "kıyıdaki kütüklerin yanına fidan dikiliyor" },
    { ad: "Goodman Tobin", topluluk: "Çiftçiler", is: "calilik", yuk: SICAK, kick: "Tanışma", baslik: "Tarla Nereye?", secenek: ["Yamaçta aç", "Nehir kıyısında aç"], sonuc: "yamaçta tarla açılıyor" },
    { ad: "Master Dunstan", topluluk: "Taşçılar", is: "enkaz", yuk: RENK.isik3, kick: "Tanışma", baslik: "Önce Hangi Duvar?", secenek: ["Kapı kulesi", "Ana salonun çatısı"], sonuc: "kapı kulesi yükseliyor" },
    { ad: "Mother Hazel", topluluk: "Oduncular", is: "orman", yuk: DAL, kick: "Dilekçe", baslik: "Sönen Ocak", atif: ["Hazel'la ilk tanıştığınızda", "“Kıyıdan kes, yerine fidan dik” demiştin."], secenek: ["İki eve ocak yaptır, söz ver", "Avluda ortak bir ocak yak"], sonuc: "söz verildi · iki eve ocak taşı ayrılıyor", dogmus: true },
  ];

  const defs = el("defs", {}, s);
  parlakFiltre(defs, "lider-parilti");
  const yildiz = yildizAlani(s, 451, 40, 210);
  el("rect", { x: 0, y: zemin, width: 480, height: 68, fill: "#050608" }, s);
  el("line", { x1: 0, x2: 480, y1: zemin, y2: zemin, stroke: RENK.isik4 }, s);

  el("path", { d: `M40 ${zemin} v-58 h6 v-7 h5 v7 h5 v-7 h5 v7 h6 v24 h12 v-8 h4 l3 6 3 -8 4 12 v34z`, fill: "#030405" }, s);
  el("rect", { x: 50, y: zemin - 46, width: 4, height: 7, fill: SICAK, opacity: 0.85 }, s);
  el("text", { x: 70, y: zemin + 22, "text-anchor": "middle", metin: "kale" }, s);
  const yerler = {
    orman: el("g", {}, s),
    calilik: el("g", {}, s),
    enkaz: el("g", {}, s),
  };
  for (const [dx, b] of [[-14, 1], [-4, 1.35], [8, 1.1], [18, 0.9]]) {
    el("path", { d: `M${yer + dx - 6 * b} ${zemin} L${yer + dx} ${zemin - 24 * b} L${yer + dx + 6 * b} ${zemin}z`, fill: "#030405", stroke: RENK.isik4, "stroke-width": 0.6 }, yerler.orman);
  }
  for (const [dx, r] of [[-13, 6], [-3, 8], [9, 6.5], [18, 5]]) {
    el("path", { d: `M${yer + dx - r} ${zemin} a${r} ${r * 0.85} 0 0 1 ${2 * r} 0z`, fill: "#030405", stroke: RENK.isik4, "stroke-width": 0.6 }, yerler.calilik);
  }
  for (const [dx, w, h] of [[-16, 10, 7], [-5, 12, 10], [8, 9, 6], [2, 8, 5], [16, 7, 8]]) {
    el("rect", { x: yer + dx, y: zemin - h - (dx === 2 ? 10 : 0), width: w, height: h, fill: "#030405", stroke: RENK.isik4, "stroke-width": 0.6 }, yerler.enkaz);
  }
  const YER_AD = { orman: "orman", calilik: "çalılık", enkaz: "enkaz" };
  const yerEtiket = el("text", { x: yer, y: zemin + 22, "text-anchor": "middle" }, s);

  const kisiler = [0, 1, 2].map(() => {
    const k = insan(s, "lider-parilti");
    k.yuk = el("rect", { x: -3, y: -11, width: 6, height: 4, opacity: 0 }, k.g);
    return k;
  });
  const halka = el("circle", { r: 10, fill: "none", stroke: RENK.isik4 }, s);
  const CEVRE = 2 * Math.PI * 10;
  const halkaDolu = el("circle", { r: 10, fill: "none", stroke: RENK.toz, "stroke-width": 1.5, "stroke-dasharray": CEVRE.toFixed(2), transform: "rotate(-90)" }, s);
  const halkaG = el("g", {}, s);
  halkaG.append(halka, halkaDolu);
  const liderAd = el("text", { "text-anchor": "middle", class: "formul", fill: SICAK, opacity: 0 }, s);
  const liderGrup = el("text", { "text-anchor": "middle", class: "zayif", opacity: 0 }, s);
  const dilekceIkon = el("g", { opacity: 0 }, s);
  el("rect", { x: -4, y: -6, width: 8, height: 10, fill: "none", stroke: SICAK, "stroke-width": 1.2 }, dilekceIkon);
  el("path", { d: "M-2 -3 h4 M-2 0 h4 M-2 3 h2", stroke: SICAK, "stroke-width": 0.8 }, dilekceIkon);

  const prens = prensCiz(s);
  const fener = el("circle", { cx: 5, cy: -6, r: 3, fill: SICAK, filter: "url(#lider-parilti)" }, prens);

  const KX = 124;
  const KY = 36;
  const KW = 332;
  const KH = 166;
  const kart = el("g", { opacity: 0 }, s);
  el("rect", { x: KX, y: KY, width: KW, height: KH, rx: 3, fill: RENK.gok2, stroke: RENK.toz, "stroke-opacity": 0.55 }, kart);
  const kick = el("text", { x: KX + 16, y: KY + 22, fill: RENK.toz }, kart);
  const kim = el("text", { x: KX + KW - 16, y: KY + 22, "text-anchor": "end", class: "zayif" }, kart);
  const atif = [0, 1].map((i) => el("text", { x: KX + 16, y: KY + 44 + i * 14, class: "zayif" }, kart));
  const baslik = el("text", { x: KX + 16, class: "formul" }, kart);
  const satirlar = [0, 1].map(() => {
    const arka = el("rect", { x: KX + 10, width: KW - 20, height: 20, fill: RENK.toz, "fill-opacity": 0 }, kart);
    const nokta = el("circle", { cx: KX + 22, r: 3.5, fill: "none", stroke: RENK.isik3 }, kart);
    const yazi = el("text", { x: KX + 34 }, kart);
    return { arka, nokta, yazi };
  });
  el("text", { x: KX + 16, y: KY + KH - 14, class: "zayif", metin: "SONRA" }, kart);
  const onayZemin = el("rect", { x: KX + KW - 86, y: KY + KH - 28, width: 72, height: 20, fill: RENK.toz, "fill-opacity": 0.08, stroke: RENK.toz, "stroke-opacity": 0.5 }, kart);
  el("text", { x: KX + KW - 50, y: KY + KH - 14, "text-anchor": "middle", fill: RENK.toz, metin: "ONAYLA" }, kart);

  const sayac = el("text", { x: 24, y: 24, metin: "" }, s);
  const sonuc = el("text", { x: 24, y: 340, class: "zayif", metin: "" }, s);
  const perde = perdeKur(s);

  let sira = -1;
  const kartiKur = (k) => {
    Object.entries(yerler).forEach(([ad, g]) => g.setAttribute("opacity", ad === k.is ? 1 : 0));
    yerEtiket.textContent = YER_AD[k.is];
    kisiler.forEach((p) => p.yuk.setAttribute("fill", k.yuk));
    kick.textContent = k.dogmus ? "DİLEKÇE" : `DİLEKÇE · ${k.kick.toLocaleUpperCase("tr")}`;
    kim.textContent = k.ad;
    atif.forEach((a, i) => (a.textContent = k.atif ? k.atif[i] : ""));
    const by = k.atif ? KY + 86 : KY + 52;
    baslik.setAttribute("y", by);
    baslik.textContent = k.baslik;
    satirlar.forEach((r, i) => {
      const y = by + 26 + i * 24;
      r.arka.setAttribute("y", y - 14);
      r.nokta.setAttribute("cy", y - 4);
      r.yazi.setAttribute("y", y);
      r.yazi.textContent = k.secenek[i];
    });
    liderAd.textContent = k.ad;
    liderGrup.textContent = `${k.topluluk} · lider`;
  };

  const yol = (d, i) => {
    const a = 112 + i * 8;
    const b = yer - 30 - i * 12;
    const dd = d - i * 0.12;
    if (dd < 0.4) return { x: a };
    if (dd < 1.4) return { x: ara(a, b, yumusak(dd - 0.4)), yuruyor: true };
    if (dd < 1.8) return { x: b, calisiyor: true };
    if (dd < 2.8) return { x: ara(b, a, yumusak(dd - 1.8)), yuruyor: true, yuklu: true };
    if (dd < 2.9) return { x: a };
    if (dd < 3.9) return { x: ara(a, b, yumusak(dd - 2.9)), yuruyor: true };
    return { x: b, calisiyor: true };
  };

  return {
    adim(t) {
      const tur = Math.floor(t / T) % KARTLAR.length;
      const d = t % T;
      const k = KARTLAR[tur];
      if (tur !== sira) {
        sira = tur;
        kartiKur(k);
      }
      parilda(yildiz, t);

      const dogus = k.dogmus ? 1 : yumusak(pencere(d, 4.8, 5.4));
      const liderX = yer - 30;
      kisiler.forEach((p, i) => {
        const lider = i === 0;
        let durum = yol(d, i);
        if (lider && k.dogmus) durum = { x: liderX, calisiyor: true };
        const sek = durum.yuruyor ? Math.abs(Math.sin(t * 9 + i)) * 2.5 : durum.calisiyor ? Math.abs(Math.sin(t * 5 + i)) * 1.2 : 0;
        const olcek = lider ? 1 + 0.45 * dogus : 1;
        yerlestir(p.g, durum.x, zemin - 5 - sek, olcek);
        p.yuk.setAttribute("opacity", durum.yuklu ? 1 : 0);
        if (lider) {
          yerlestir(halkaG, durum.x, zemin - 5 - sek);
          const doluluk = k.dogmus ? 1 : pencere(d, 0.4, 4.8);
          halkaDolu.setAttribute("stroke-dashoffset", (CEVRE * (1 - doluluk)).toFixed(2));
          halkaDolu.setAttribute("stroke", dogus > 0.5 ? SICAK : RENK.toz);
          liderAd.setAttribute("x", durum.x);
          liderAd.setAttribute("y", zemin - 38);
          liderGrup.setAttribute("x", durum.x);
          liderGrup.setAttribute("y", zemin - 24);
          const ikonY = zemin - 62 + Math.sin(t * 3) * 2;
          yerlestir(dilekceIkon, durum.x, ikonY);
        }
      });
      liderAd.setAttribute("opacity", dogus.toFixed(2));
      liderGrup.setAttribute("opacity", dogus.toFixed(2));
      dilekceIkon.setAttribute("opacity", (pencere(d, 5.2, 5.6) * (1 - pencere(d, 6.2, 6.5))).toFixed(2));

      const pYol = yumusak(pencere(d, 5.0, 6.4));
      const px = ara(96, liderX - 26, pYol);
      yerlestir(prens, px, zemin - (pYol > 0 && pYol < 1 ? Math.abs(Math.sin(t * 9)) * 1.5 : 0));
      prens.setAttribute("opacity", d < 5 ? 0 : pencere(d, 5, 5.3).toFixed(2));
      fener.setAttribute("opacity", (0.8 + 0.2 * Math.sin(t * 7)).toFixed(2));

      const kartO = pencere(d, 6.4, 6.8) * (1 - pencere(d, 9.0, 9.4));
      kart.setAttribute("opacity", kartO.toFixed(2));
      kart.setAttribute("transform", `translate(0 ${(8 * (1 - pencere(d, 6.4, 6.8))).toFixed(1)})`);
      const secildi = d > 7.8;
      satirlar.forEach((r, i) => {
        const bu = secildi && i === 0;
        r.arka.setAttribute("fill-opacity", bu ? 0.16 : 0);
        r.nokta.setAttribute("fill", bu ? RENK.toz : "none");
        r.nokta.setAttribute("stroke", bu ? RENK.toz : RENK.isik3);
        r.yazi.setAttribute("fill", bu ? RENK.isik : RENK.isik2);
      });
      onayZemin.setAttribute("fill-opacity", d > 8.5 ? 0.3 : 0.08);

      const gunSay = d < 2.8 ? 0 : d < 4.8 ? 1 : 2;
      sayac.textContent = k.dogmus
        ? `${k.ad.toLocaleUpperCase("tr")} · İKİNCİ DİLEKÇE`
        : d < 4.8 ? `3 KİŞİ · AYNI İŞ · İŞ-GÜNÜ ${gunSay}/2`
        : "ALIŞKANLIK → LİDER";
      sayac.setAttribute("opacity", (1 - kartO).toFixed(2));
      sonuc.textContent = d > 9.0 ? k.sonuc : d > 6.4 ? "Sonra dersen dilekçe bekler; sabır azalır" : "";
      perde.setAttribute("opacity", Math.max(1 - pencere(d, 0, 0.5), pencere(d, 9.5, 10)).toFixed(2));
    },
  };
}

function merdiven(kok) {
  const s = svg(480, 360, kok);
  const T = 24;
  const fx = 300;
  const fy = 178;

  const defs = el("defs", {}, s);
  parlakFiltre(defs, "merdiven-parilti", 3);
  const haleG = el("radialGradient", { id: "merdiven-hale" }, defs);
  el("stop", { offset: "0", "stop-color": SICAK, "stop-opacity": 0.45 }, haleG);
  el("stop", { offset: "0.5", "stop-color": RENK.toz, "stop-opacity": 0.14 }, haleG);
  el("stop", { offset: "1", "stop-color": RENK.toz, "stop-opacity": 0 }, haleG);
  const yildiz = yildizAlani(s, 707, 46, 250);

  const BASAMAK = [
    { y: 232, ad: "FENER", unvan: "Warden" },
    { y: 152, ad: "AISEN", unvan: "Lord Protector" },
    { y: 72, ad: "AISENIT", unvan: "King · Taç" },
  ];
  for (const x of [50, 78]) el("line", { x1: x, x2: x, y1: 56, y2: 250, stroke: RENK.isik4 }, s);
  for (let y = 72; y <= 232; y += 40) {
    const ana = (y - 72) % 80 === 0;
    el("line", { x1: 50, x2: 78, y1: y, y2: y, stroke: ana ? RENK.isik3 : RENK.isik4, "stroke-width": ana ? 2 : 1 }, s);
  }
  const etiketler = BASAMAK.map((b) => ({
    ad: el("text", { x: 94, y: b.y - 2, class: "koyu", metin: b.ad }, s),
    unvan: el("text", { x: 94, y: b.y + 12, class: "zayif", metin: b.unvan }, s),
  }));
  const isaretci = el("g", {}, s);
  el("circle", { r: 7, fill: SICAK, opacity: 0.7, filter: "url(#merdiven-parilti)" }, isaretci);
  el("circle", { r: 3, fill: "#fff4e2" }, isaretci);

  el("line", { x1: 210, x2: 470, y1: 248, y2: 248, stroke: RENK.isik4 }, s);
  el("path", { d: "M418 248 V108 h4 v-6 h5 v6 h4 v-6 h5 v6 h4 V248z", fill: "#030405", stroke: RENK.isik4, "stroke-width": 0.6 }, s);
  el("rect", { x: 425, y: 118, width: 8, height: 10, fill: RENK.isik4 }, s);
  const lamba = el("circle", { cx: 429, cy: 123, r: 9, fill: SICAK, filter: "url(#merdiven-parilti)", opacity: 0 }, s);
  const lambaCekirdek = el("rect", { x: 425, y: 118, width: 8, height: 10, fill: SICAK, opacity: 0 }, s);

  const IZLER = [[230, 236], [252, 92], [372, 238], [392, 64], [212, 160], [462, 196], [140, 40]];
  const ipler = IZLER.map(([x, y]) => el("line", { x1: x, y1: y, x2: x, y2: y, stroke: SICAK, "stroke-width": 1, "stroke-opacity": 0.7 }, s));
  const izler = IZLER.map(([x, y]) => el("circle", { cx: x, cy: y, r: 1.8, fill: SICAK }, s));

  const hale = el("ellipse", { cx: fx, cy: fy, rx: 84, ry: 84, fill: "url(#merdiven-hale)" }, s);
  const fenerG = el("g", {}, s);
  el("path", { d: `M${fx - 16} ${fy - 68} a16 14 0 0 1 32 0`, fill: "none", stroke: RENK.isik3, "stroke-width": 2 }, fenerG);
  el("path", { d: `M${fx - 34} ${fy - 56} h68 l-10 -12 h-48z`, fill: RENK.isik4 }, fenerG);
  el("rect", { x: fx - 48, y: fy - 56, width: 96, height: 112, fill: SICAK, "fill-opacity": 0.03, stroke: RENK.isik3 }, fenerG);
  el("path", { d: `M${fx - 54} ${fy + 56} h108 l-6 10 h-96z`, fill: RENK.isik4 }, fenerG);

  const maskot = document.createElement("ais-maskot");
  maskot.className = "sahne-maskot";
  maskot.setAttribute("faz", "ais");
  maskot.setAttribute("boyut", "80");
  maskot.setAttribute("aria-hidden", "true");
  maskot.style.left = `${((fx / 480) * 100).toFixed(2)}%`;
  maskot.style.top = `${((fy / 360) * 100).toFixed(2)}%`;
  kok.append(maskot);
  let faz = "ais";
  const fazAyarla = (yeni) => {
    if (yeni === faz) return;
    faz = yeni;

    if (yeni === "aisenit") maskot.setAttribute("aksesuar", "tac");
    else maskot.removeAttribute("aksesuar");
    maskot.setAttribute("faz", yeni);
  };

  const baslik = el("text", { x: 40, y: 274, fill: RENK.toz }, s);
  el("text", { x: 440, y: 274, "text-anchor": "end", class: "zayif", metin: "taşlar · işlenmiş Aisenit: henüz kapalı" }, s);
  const satir = (y, ad) => {
    const etiket = el("text", { x: 40, y: y + 4, metin: ad }, s);
    el("rect", { x: 150, y: y - 5, width: 220, height: 10, fill: RENK.gok2 }, s);
    const dolu = el("rect", { x: 150, y: y - 5, height: 10, fill: RENK.toz, "fill-opacity": 0.8 }, s);
    const esik = el("line", { y1: y - 9, y2: y + 9, stroke: SICAK }, s);
    const deger = el("text", { x: 440, y: y + 4, "text-anchor": "end" }, s);
    return { etiket, dolu, esik, deger };
  };
  const tanima = satir(296, "tanınma");
  const kale = satir(318, "kale");
  for (let i = 1; i < 5; i++) el("line", { x1: 150 + i * 44, x2: 150 + i * 44, y1: 313, y2: 323, stroke: "#07080b", "stroke-width": 2 }, s);
  const ucuncu = el("text", { x: 40, y: 344 }, s);
  const parcalar = [0, 1, 2].map((i) => el("path", { d: `M${158 + i * 22} 334 l6 6 -6 6 -6 -6z`, fill: "none", stroke: SICAK }, s));
  const ucuncuDeger = el("text", { x: 440, y: 344, "text-anchor": "end" }, s);
  const onay = el("text", { x: 440, y: 344, "text-anchor": "end", fill: SICAK, metin: "✓" }, s);

  const durum = el("text", { x: 24, y: 24, metin: "" }, s);
  const soz = el("text", { x: fx, y: 52, "text-anchor": "middle", fill: SICAK, opacity: 0, metin: "“Bu gece ikisi birden.”" }, s);
  const perde = perdeKur(s);

  const cubukAyarla = (c, deger, max, hedef, metin) => {
    c.dolu.setAttribute("width", ((deger / max) * 220).toFixed(1));
    c.esik.setAttribute("x1", (150 + (hedef / max) * 220).toFixed(1));
    c.esik.setAttribute("x2", (150 + (hedef / max) * 220).toFixed(1));
    c.dolu.setAttribute("fill", deger >= hedef ? SICAK : RENK.toz);
    c.deger.textContent = metin;
  };

  return {
    adim(t) {
      const d = t % T;
      const taca = d >= 9.4;

      const evre = yumusak(pencere(d, 8.2, 9.2)) + yumusak(pencere(d, 16.4, 17.4));
      const y = ara(232, 72, evre / 2);
      yerlestir(isaretci, 64, y);
      const basamak = d < 8.7 ? 0 : d < 19.2 ? 1 : 2;
      etiketler.forEach((e, i) => {
        e.ad.setAttribute("fill", i === basamak ? SICAK : RENK.isik3);
        e.unvan.setAttribute("opacity", i <= basamak ? 1 : 0.5);
      });
      fazAyarla(["ais", "aisen", "aisenit"][basamak]);
      maskot.style.opacity = basamak === 0 ? "0.72" : basamak === 1 ? "0.9" : "1";
      parilda(yildiz, t, 0.8);

      let tan;
      let kal;
      if (!taca) {
        baslik.textContent = "ŞART · AISEN İÇİN";
        tan = 50 * yumusak(pencere(d, 0.8, 7.2));
        kal = (d > 2.6) + (d > 4.6) + (d > 6.8);
        const ham = (d > 3.4) + (d > 5.6) + (d > 7.6);
        cubukAyarla(tanima, tan, 100, 50, `${Math.round(tan)} / 50`);
        cubukAyarla(kale, kal, 5, 3, `${kal} / 3`);
        ucuncu.textContent = "ham Aisenit";
        parcalar.forEach((p, i) => {
          p.setAttribute("opacity", 1);
          p.setAttribute("fill", i < ham ? SICAK : "none");
        });
        ucuncuDeger.textContent = `${ham} / 3`;
        onay.setAttribute("opacity", 0);
      } else {
        baslik.textContent = "ŞART · TAÇ İÇİN";
        tan = ara(50, 85, yumusak(pencere(d, 9.6, 15.8)));
        kal = 3 + (d > 12) + (d > 15.2);
        cubukAyarla(tanima, tan, 100, 85, `${Math.round(tan)} / 85`);
        cubukAyarla(kale, kal, 5, 5, `${kal} / 5`);
        ucuncu.textContent = "Ais Aisen evresinde";
        parcalar.forEach((p) => p.setAttribute("opacity", 0));
        ucuncuDeger.textContent = "";
        onay.setAttribute("opacity", 1);
      }

      hale.setAttribute("opacity", (0.35 + 0.3 * evre).toFixed(2));
      const ip = yumusak(pencere(d, 17.4, 19.2));
      const ipSon = 1 - pencere(d, 19.6, 20.6);
      ipler.forEach((l, i) => {
        const [x, iy] = IZLER[i];
        l.setAttribute("x2", ara(x, fx, ip).toFixed(1));
        l.setAttribute("y2", ara(iy, fy, ip).toFixed(1));
        l.setAttribute("opacity", (ip > 0 ? ipSon : 0).toFixed(2));
      });
      izler.forEach((iz, i) => iz.setAttribute("opacity", ((0.35 + 0.25 * Math.sin(t * 1.7 + i)) * (1 - ip * 0.6)).toFixed(2)));
      fenerG.setAttribute("opacity", (1 - 0.85 * pencere(d, 19.2, 20)).toFixed(2));
      const yan = yumusak(pencere(d, 19.6, 20.4));
      lamba.setAttribute("opacity", (yan * (0.85 + 0.15 * Math.sin(t * 6))).toFixed(2));
      lambaCekirdek.setAttribute("opacity", yan.toFixed(2));
      soz.setAttribute("opacity", (pencere(d, 20, 20.6) * (1 - pencere(d, 22.6, 23.2))).toFixed(2));

      durum.textContent =
        d < 3.4 ? "UNVAN: WARDEN · AIS FENERDE DİNLENİYOR"
        : d < 8.2 ? "HAM AISENIT · AIS DUYAR, YERİNİ BİLMEZ"
        : d < 16.4 ? "UNVAN: LORD PROTECTOR"
        : "TAÇ TÖRENİ · “my prince” → “my king”";
      perde.setAttribute("opacity", Math.max(1 - pencere(d, 0, 0.6), pencere(d, 23.2, 24)).toFixed(2));
    },
  };
}

export default { ates, gorev, kis, lider, merdiven };
