import { el, svg, CIZGI, RENK } from "../lib/svg.js";
import { tohumlu } from "../lib/rastgele.js";

const nmX = (nm, a = 400, b = 700, x0 = 40, x1 = 440) => x0 + ((nm - a) / (b - a)) * (x1 - x0);
const gaus = (x, m, s) => Math.exp(-((x - m) ** 2) / (2 * s * s));

const KANALLAR = [
  { ad: "B", m: 465, s: 28, p: 0.85 },
  { ad: "G", m: 535, s: 36, p: 1 },
  { ad: "R", m: 602, s: 30, p: 0.8 },
];
const yanit = (k, nm) => k.p * gaus(nm, k.m, k.s) + (k.ad === "R" ? 0.35 * gaus(nm, 655, 16) : 0);

function spektrum(kok) {
  const s = svg(480, 360, kok);
  const ust = 40;
  const taban = 190;
  const yuks = 130;

  for (let nm = 400; nm <= 700; nm += 50) {
    el("line", { x1: nmX(nm), x2: nmX(nm), y1: taban, y2: taban + 5, stroke: RENK.isik4 }, s);
    el("text", { x: nmX(nm), y: taban + 18, "text-anchor": "middle", metin: nm }, s);
  }
  el("text", { x: 440, y: taban + 32, "text-anchor": "end", metin: "dalga boyu · nm" }, s);

  for (const k of KANALLAR) {
    let d = "";
    for (let nm = 400; nm <= 700; nm += 3) d += `${nm === 400 ? "M" : "L"}${nmX(nm).toFixed(1)} ${(taban - yanit(k, nm) * yuks).toFixed(1)}`;
    el("path", { d, fill: "none", stroke: RENK.isik3, "stroke-dasharray": "3 3", "stroke-width": 1 }, s);
    el("text", { x: nmX(k.m), y: taban - k.p * yuks - 8, "text-anchor": "middle", class: "zayif", metin: k.ad }, s);
  }
  el("line", { x1: 40, x2: 440, y1: taban, y2: taban, stroke: RENK.isik3 }, s);

  const cizgiler = [CIZGI.hb, CIZGI.oiii2, CIZGI.oiii, CIZGI.ha];
  const gruplar = cizgiler.map((c, i) => {
    const g = el("g", { class: "nabiz", style: `--gecikme:${[0, 0.66, 0.66, 1.32][i]}s` }, s);
    const h = c.nm === 495.9 ? 0.45 : 1;
    el("line", { x1: nmX(c.nm), x2: nmX(c.nm), y1: taban, y2: ust + (1 - h) * 90, stroke: c.renk, "stroke-width": 2 }, g);
    el("circle", { cx: nmX(c.nm), cy: ust + (1 - h) * 90, r: 3, fill: c.renk }, g);
    if (c.nm !== 495.9) el("text", { x: nmX(c.nm) + (c.nm === 500.7 ? 8 : c.nm === 486.1 ? -8 : 0), y: ust - 10, "text-anchor": c.nm === 500.7 ? "start" : c.nm === 486.1 ? "end" : "middle", fill: c.renk, metin: `${c.ad} ${c.nm}` }, g);
    return g;
  });

  const hucre = 34;
  const x0 = 300;
  const y0 = 250;
  el("text", { x: 40, y: y0 + 12, metin: "M · kamera × filtre" }, s);
  el("text", { x: 40, y: y0 + 28, class: "zayif", metin: "temsilî değerler" }, s);
  el("text", { x: 40, y: y0 + 60, class: "formul", metin: "RGB ≈ M · x" }, s);
  const sutun = [CIZGI.ha, CIZGI.oiii, CIZGI.hb];
  sutun.forEach((c, j) => el("text", { x: x0 + j * (hucre + 4) + hucre / 2, y: y0 - 8, "text-anchor": "middle", fill: c.renk, metin: c.ad }, s));
  [...KANALLAR].reverse().forEach((k, i) => {
    el("text", { x: x0 - 10, y: y0 + i * (hucre + 4) + 17, "text-anchor": "end", metin: k.ad }, s);
    sutun.forEach((c, j) => {
      const v = Math.min(1, yanit(k, c.nm) / 0.9);
      el("rect", { x: x0 + j * (hucre + 4), y: y0 + i * (hucre + 4), width: hucre, height: hucre, fill: c.renk, "fill-opacity": (0.08 + v * 0.8).toFixed(2), class: "nabiz", style: `--gecikme:${[1.32, 0.66, 0][j]}s` }, s);
    });
  });
  return {};
}

function piksel(kok) {
  const s = svg(480, 360, kok);
  const S = 12;
  const Y = 7;
  const H = 28;
  const x0 = (480 - S * H) / 2;
  const y0 = 40;
  const rnd = tohumlu(31);
  const hucreler = [];
  for (let y = 0; y < Y; y++) {
    for (let x = 0; x < S; x++) {

      const ha = 0.25 + 0.6 * gaus(x, 3, 3) * gaus(y, 2, 3);
      const oiii = 0.15 + 0.55 * gaus(x, 9, 2.5) * gaus(y, 5, 2.5);
      const hb = ha * 0.3;
      const g = el("g", {}, s);
      const zemin = el("rect", { x: x0 + x * H, y: y0 + y * H, width: H - 2, height: H - 2 }, g);
      const cubuklar = [CIZGI.ha, CIZGI.oiii, CIZGI.hb].map((c, k) =>
        el("rect", { x: x0 + x * H + 4 + k * 7, width: 5, y: y0 + y * H + H - 4, height: 0, fill: c.renk }, g),
      );
      hucreler.push({ zemin, cubuklar, ha, oiii, hb, x, y, rnd: [rnd(), rnd(), rnd()] });
    }
  }
  const imlec = el("rect", { width: H + 2, height: H + 2, fill: "none", stroke: RENK.isik, "stroke-width": 1.5 }, s);
  const okuma = el("text", { x: x0, y: y0 + Y * H + 30, metin: "" }, s);
  el("text", { x: x0, y: y0 + Y * H + 50, class: "zayif", metin: "Her piksel tek başına çözülür. Komşusunun ne olduğunu bilmez." }, s);
  el("text", { x: x0 + S * H, y: y0 - 12, "text-anchor": "end", class: "formul", metin: "x ≥ 0" }, s);

  const renk = (h, t) => {
    const n = (h.rnd[0] - 0.5) * 0.35 + Math.sin(t * 3 + h.rnd[1] * 9) * 0.05;
    const r = Math.min(1, h.ha + n) * 255;
    const gg = Math.min(1, h.oiii * 0.9 + n * 0.8) * 255;
    const b = Math.min(1, h.oiii * 0.8 + h.hb + n * 0.6) * 255;
    return `rgb(${r | 0},${gg | 0},${b | 0})`;
  };
  let sira = 0;
  let son = -1;
  return {
    adim(t) {
      const adim = Math.floor(t * 9) % (hucreler.length + 18);
      if (adim === son) return;
      son = adim;
      if (adim === 0) sira = 0;
      hucreler.forEach((h, i) => {
        const cozuldu = i < adim;
        h.zemin.setAttribute("fill", cozuldu ? RENK.gok2 : renk(h, t));
        const deger = [h.ha, h.oiii, h.hb].map((v, k) => Math.max(0, v + (h.rnd[k] - 0.5) * 0.5));
        h.cubuklar.forEach((c, k) => {
          const boy = cozuldu ? deger[k] * (H - 8) : 0;
          c.setAttribute("height", boy.toFixed(1));
          c.setAttribute("y", (y0 + h.y * H + H - 4 - boy).toFixed(1));
        });
      });
      const aktif = hucreler[Math.min(adim, hucreler.length - 1)];
      imlec.setAttribute("x", x0 + aktif.x * H - 2);
      imlec.setAttribute("y", y0 + aktif.y * H - 2);
      imlec.setAttribute("opacity", adim < hucreler.length ? 1 : 0);
      const d = [aktif.ha, aktif.oiii, aktif.hb].map((v, k) => Math.max(0, v + (aktif.rnd[k] - 0.5) * 0.5).toFixed(2));
      okuma.textContent = `PİKSEL (${aktif.x},${aktif.y}) → Hα ${d[0]} · [O III] ${d[1]} · Hβ ${d[2]}`;
      sira++;
    },
  };
}

function sentetik(kok) {
  const G = 48;
  const tuval = document.createElement("canvas");
  tuval.width = G * 3 + 16;
  tuval.height = G;
  tuval.className = "piksel-tuval";
  const etiketler = document.createElement("div");
  etiketler.className = "sc-etiketler veri";
  etiketler.innerHTML = "<span>Bilinen harita</span><span>Kestirim</span><span>Hata</span>";
  const okuma = document.createElement("p");
  okuma.className = "sc-okuma veri";
  kok.append(tuval, etiketler, okuma);
  const c = tuval.getContext("2d");
  const resim = c.createImageData(tuval.width, G);
  const rnd = tohumlu(15);
  const gercek = new Float32Array(G * G);
  for (let y = 0; y < G; y++)
    for (let x = 0; x < G; x++)
      gercek[y * G + x] = 0.9 * gaus(x, 18, 9) * gaus(y, 20, 11) + 0.6 * gaus(x, 34, 5) * gaus(y, 30, 6) + 0.25 * gaus(x + y, 40, 4);
  const gurultu = new Float32Array(G * G).map(() => (rnd() + rnd() + rnd() - 1.5) * 1.15);

  const yaz = (ofs, deger, renkF) => {
    for (let y = 0; y < G; y++)
      for (let x = 0; x < G; x++) {
        const [r, g, b] = renkF(deger[y * G + x]);
        const i = (y * tuval.width + x + ofs) * 4;
        resim.data[i] = r;
        resim.data[i + 1] = g;
        resim.data[i + 2] = b;
        resim.data[i + 3] = 255;
      }
  };
  const kirmizi = (v) => {
    const k = Math.max(0, Math.min(1, v));
    return [30 + k * 225, 20 + k * 60, 30 + k * 70];
  };
  const hataRenk = (v) => {
    const k = Math.min(1, Math.abs(v) * 2.2);
    return [20 + k * 230, 22 + k * 200, 28 + k * 180];
  };
  let karis = 0;
  return {
    adim(t) {
      const sigma = Math.max(0, Math.sin(t * 0.45 - 1.2)) * 0.32;
      if (Math.abs(sigma - karis) < 0.004 && t > 0.1) return;
      karis = sigma;
      const kestirim = new Float32Array(G * G);
      const hata = new Float32Array(G * G);
      let kare = 0;
      for (let i = 0; i < G * G; i++) {
        kestirim[i] = Math.max(0, gercek[i] + gurultu[(i * 7 + Math.floor(t * 4) * 131) % (G * G)] * sigma);
        hata[i] = kestirim[i] - gercek[i];
        kare += hata[i] ** 2;
      }
      yaz(0, gercek, kirmizi);
      yaz(G + 8, kestirim, kirmizi);
      yaz(2 * G + 16, hata, hataRenk);
      c.putImageData(resim, 0, 0);
      const rmse = Math.sqrt(kare / (G * G));
      okuma.innerHTML = sigma < 0.01
        ? "σ = 0 · RMSE ≈ 0 · <span class='toz'>bu yalnız iç tutarlılık</span>"
        : `σ = ${sigma.toFixed(2)} · RMSE = ${rmse.toFixed(3)} · <span class='ha'>gürültü hatayı büyütür</span>`;
    },
  };
}

function komsuluk(kok) {
  const s = svg(480, 360, kok);
  const N = 160;
  const x0 = 40;
  const x1 = 440;
  const taban = 250;
  const yuks = 170;
  const rnd = tohumlu(4);
  const gercek = Array.from({ length: N }, (_, i) => 0.42 * gaus(i, 55, 22) + 0.75 * gaus(i, 112, 2.2) + 0.08);
  const gurultu = Array.from({ length: N }, () => (rnd() + rnd() + rnd() - 1.5) * 0.28);
  const X = (i) => x0 + (i / (N - 1)) * (x1 - x0);
  const Yy = (v) => taban - v * yuks;
  const yol = (dizi) => dizi.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Yy(v).toFixed(1)}`).join("");
  const bulanik = (dizi, sg) => {
    if (sg < 0.3) return dizi.slice();
    const r = Math.ceil(sg * 3);
    return dizi.map((_, i) => {
      let t = 0;
      let w = 0;
      for (let k = -r; k <= r; k++) {
        const j = Math.min(N - 1, Math.max(0, i + k));
        const a = gaus(k, 0, sg);
        t += dizi[j] * a;
        w += a;
      }
      return t / w;
    });
  };

  el("line", { x1: x0, x2: x1, y1: taban, y2: taban, stroke: RENK.isik3 }, s);
  el("path", { d: yol(gercek), fill: "none", stroke: RENK.isik2, "stroke-dasharray": "4 4", "stroke-width": 1 }, s);
  const cizgi = el("path", { fill: "none", stroke: RENK.ha, "stroke-width": 1.8, "stroke-linejoin": "round" }, s);
  const genislik = el("g", {}, s);
  const gL = el("line", { stroke: RENK.toz, "stroke-width": 1 }, genislik);
  const gT = el("text", { "text-anchor": "middle", fill: RENK.toz, metin: "" }, genislik);
  el("text", { x: X(112), y: 28, "text-anchor": "middle", metin: "ince iplik" }, s);
  el("text", { x: X(55), y: Yy(0.55), "text-anchor": "middle", metin: "geniş yapı" }, s);

  const lam = el("text", { x: x0, y: taban + 30, metin: "" }, s);
  el("text", { x: x0, y: taban + 50, class: "zayif", metin: "Sentetik vaka · yerel medyan hata (Hα / Hβ / [O III])" }, s);
  el("text", { x: x0, y: taban + 70, class: "formul", metin: "%39 / %55 / %53  →  %8 / %15 / %18" }, s);
  el("line", { x1: x0, x2: x0 + 20, y1: 24, y2: 24, stroke: RENK.isik2, "stroke-dasharray": "4 4" }, s);
  el("text", { x: x0 + 26, y: 28, metin: "bilinen" }, s);
  el("line", { x1: x0, x2: x0 + 20, y1: 42, y2: 42, stroke: RENK.ha, "stroke-width": 1.8 }, s);
  el("text", { x: x0 + 26, y: 46, metin: "kestirim" }, s);

  return {
    adim(t) {
      const l = 0.5 - 0.5 * Math.cos(t * 0.55);
      const gurultulu = gercek.map((v, i) => v + gurultu[i] * (1 - l));
      const sonuc = bulanik(gurultulu, l * 4.5);
      cizgi.setAttribute("d", yol(sonuc));

      let tepe = 0;
      for (let i = 100; i < 125; i++) tepe = Math.max(tepe, sonuc[i]);
      const yari = (tepe + 0.08 + 0.42 * gaus(112, 55, 22)) / 2;
      let a = 112;
      let b = 112;
      while (a > 100 && sonuc[a] > yari) a--;
      while (b < 125 && sonuc[b] > yari) b++;
      const y = Yy(yari);
      gL.setAttribute("x1", X(a));
      gL.setAttribute("x2", X(b));
      gL.setAttribute("y1", y);
      gL.setAttribute("y2", y);
      gT.setAttribute("x", X(112));
      gT.setAttribute("y", y - 8);
      gT.textContent = l > 0.4 ? "genişledi" : "";
      lam.textContent = `KOMŞULUK AĞIRLIĞI ${(l * 0.3).toFixed(2)} / 0.30`;
    },
  };
}

function taban(kok) {
  const s = svg(480, 360, kok);
  const seritler = [
    { c: CIZGI.ha, y: 90 },
    { c: CIZGI.oiii, y: 175 },
    { c: CIZGI.hb, y: 260 },
  ];
  const N = 80;
  const x0 = 40;
  const x1 = 360;
  const X = (i) => x0 + (i / (N - 1)) * (x1 - x0);
  const yapilar = seritler.map((sr, k) => {
    const profil = Array.from({ length: N }, (_, i) => [0.7 * gaus(i, 28, 9) + 0.3 * gaus(i, 60, 4), 0.55 * gaus(i, 52, 10), 0.25 * gaus(i, 28, 9)][k]);
    el("text", { x: x0, y: sr.y - 58, fill: sr.c.renk, metin: sr.c.ad }, s);
    el("line", { x1: x0, x2: x1, y1: sr.y, y2: sr.y, stroke: RENK.isik4 }, s);
    const tabanAlan = el("rect", { x: x0, width: x1 - x0, fill: RENK.toz, "fill-opacity": 0.22 }, s);
    const alan = el("path", { fill: sr.c.renk, "fill-opacity": 0.35, stroke: sr.c.renk, "stroke-width": 1.2 }, s);
    return { profil, alan, tabanAlan, y: sr.y };
  });
  const olcer = el("rect", { x: 400, y: 50, width: 14, height: 220, fill: "none", stroke: RENK.isik3 }, s);
  const dolgu = el("rect", { x: 401, width: 12, fill: RENK.toz }, s);
  el("text", { x: 407, y: 290, "text-anchor": "middle", metin: "destek" }, s);
  const doydu = el("text", { x: 407, y: 40, "text-anchor": "middle", fill: RENK.toz, metin: "" }, s);
  const okuma = el("text", { x: x0, y: 320, metin: "" }, s);
  void olcer;
  return {
    adim(t) {
      const p = Math.min(1, (t % 7) / 4.5) * 0.3;
      for (const y of yapilar) {
        const ust = (v) => y.y - (v + p) * 50;
        y.tabanAlan.setAttribute("y", (y.y - p * 50).toFixed(1));
        y.tabanAlan.setAttribute("height", (p * 50).toFixed(1));
        let d = `M${x0} ${y.y}`;
        y.profil.forEach((v, i) => (d += `L${X(i).toFixed(1)} ${ust(v).toFixed(1)}`));
        d += `L${x1} ${y.y}Z`;
        y.alan.setAttribute("d", d);
      }
      const oran = Math.min(1, 0.35 + p * 2.6);
      dolgu.setAttribute("y", (51 + 218 * (1 - oran)).toFixed(1));
      dolgu.setAttribute("height", (218 * oran).toFixed(1));
      doydu.textContent = oran >= 1 ? "DOYDU" : "";
      okuma.textContent = p > 0.05 ? `ORTAK TABAN +${p.toFixed(2)} → ÜÇ BİLEŞENE DE SIZDI` : "İLK NGC 7000 KOŞUSU · 16 EYLÜL";
    },
  };
}

function kirmizi(kok) {
  const s = svg(480, 360, kok);
  const a = 640;
  const b = 680;
  const X = (nm) => nmX(nm, a, b, 40, 330);
  const taban = 220;
  for (let nm = 645; nm <= 675; nm += 10) el("text", { x: X(nm), y: taban + 18, "text-anchor": "middle", metin: nm }, s);
  let d = "";
  for (let nm = a; nm <= b; nm += 0.5) d += `${nm === a ? "M" : "L"}${X(nm).toFixed(1)} ${(taban - 150 * (0.55 + 0.4 * gaus(nm, 657, 30))).toFixed(1)}`;
  el("path", { d, fill: "none", stroke: RENK.isik3, "stroke-dasharray": "3 3" }, s);
  el("text", { x: X(642), y: taban - 150 * 0.95 - 6, class: "zayif", metin: "R kanalı" }, s);
  el("line", { x1: 40, x2: 330, y1: taban, y2: taban, stroke: RENK.isik3 }, s);

  const cizgiler = [
    { c: CIZGI.ha, h: 1, sabit: true },
    { c: CIZGI.nii1, h: 0.33 },
    { c: CIZGI.nii2, h: 1 },
    { c: CIZGI.sii1, h: 0.45 },
    { c: CIZGI.sii2, h: 0.35 },
  ].map((k) => {
    const l = el("line", { x1: X(k.c.nm), x2: X(k.c.nm), y1: taban, stroke: k.c.renk, "stroke-width": 2.2 }, s);
    return { ...k, l };
  });
  el("text", { x: X(656.3), y: 36, "text-anchor": "middle", fill: RENK.ha, metin: "Hα 656.3" }, s);
  el("text", { x: X(658.3) + 6, y: 70, fill: RENK.toz, metin: "[N II]" }, s);
  el("text", { x: X(672.3), y: 120, "text-anchor": "middle", fill: "#c98bd8", metin: "[S II]" }, s);

  el("rect", { x: 380, y: 60, width: 40, height: 160, fill: "none", stroke: RENK.isik3 }, s);
  const cubuk = el("rect", { x: 381, width: 38, fill: RENK.ha, "fill-opacity": 0.7 }, s);
  el("text", { x: 400, y: 240, "text-anchor": "middle", metin: "çıktı" }, s);
  el("text", { x: 400, y: 254, "text-anchor": "middle", class: "zayif", metin: "Hα eşdeğeri" }, s);
  const ok = el("path", { d: "M340 140 L370 140", stroke: RENK.isik2, "marker-end": "" }, s);
  void ok;

  const damga = el("g", { transform: "translate(240 300) rotate(-6)", opacity: 0 }, s);
  el("rect", { x: -78, y: -18, width: 156, height: 32, fill: "none", stroke: RENK.toz, "stroke-width": 2 }, damga);
  el("text", { x: 0, y: 4, "text-anchor": "middle", fill: RENK.toz, class: "damga", metin: "ABSTAIN" }, damga);
  const not = el("text", { x: 240, y: 340, "text-anchor": "middle", class: "zayif", metin: "" }, s);

  return {
    adim(t) {
      const k = 0.5 + 0.5 * Math.sin(t * 0.8);
      let toplam = 0;
      for (const c of cizgiler) {
        const h = c.sabit ? c.h : c.h * k;
        c.l.setAttribute("y2", (taban - h * 160).toFixed(1));
        toplam += h * (0.55 + 0.4 * gaus(c.c.nm, 657, 30));
      }
      const boy = Math.min(158, toplam * 48);
      cubuk.setAttribute("y", (219 - boy).toFixed(1));
      cubuk.setAttribute("height", boy.toFixed(1));
      const kacin = k > 0.35;
      damga.setAttribute("opacity", kacin ? 1 : 0);
      not.textContent = kacin ? "[N II] için güvenilir aralık yok → temiz Hα sayısı verilmez" : "ek çizgiler zayıfken bile kırmızı çıktı bir karışımdır";
    },
  };
}

const KOSULLAR = [
  ["G·D", "Yalnız gürültü · düşük", 56.3],
  ["G·O", "Yalnız gürültü · orta", 55.9],
  ["G·Y", "Yalnız gürültü · yüksek", 56.0],
  ["C·D", "Continuum · düşük", 53.5],
  ["C·Y", "Continuum · yüksek", 42.8],
  ["N·D", "[N II] · düşük", 26.5],
  ["N·Y", "[N II] · yüksek", 4.6],
  ["S·D", "[S II] · düşük", 54.4],
  ["S·Y", "[S II] · yüksek", 44.6],
  ["B·D", "Birleşik · düşük gürültü", 2.6],
  ["B·O", "Birleşik · orta gürültü", 8.0],
  ["B·Y", "Birleşik · yüksek gürültü", 18.0],
];

function kirkSekiz(kok) {
  const s = svg(480, 360, kok);
  const H = 30;
  const B = 4;
  const x0 = (480 - KOSULLAR.length * (H + B)) / 2;
  const y0 = 70;
  const rnd = tohumlu(48);
  const karolar = [];
  KOSULLAR.forEach(([kisa, , deger], j) => {
    for (let i = 0; i < 4; i++) {
      const x = x0 + j * (H + B);
      const y = y0 + i * (H + B);
      const g = el("g", {}, s);
      const zemin = el("rect", { x, y, width: H, height: H, fill: RENK.gok2 }, g);
      const noktalar = [];
      for (let n = 0; n < 7; n++) noktalar.push(el("rect", { x: x + rnd() * (H - 3), y: y + rnd() * (H - 3), width: 3, height: 3, fill: RENK.isik3 }, g));
      karolar.push({ j, i, zemin, noktalar, deger });
    }
    el("text", { x: x0 + j * (H + B) + H / 2, y: y0 + 4 * (H + B) + 14, "text-anchor": "middle", class: "zayif", metin: kisa }, s);
  });
  el("text", { x: x0, y: y0 - 30, metin: "12 KOŞUL × 2 MORFOLOJİ × 2 GÜRÜLTÜ ÖRNEĞİ = 48 SAHNE" }, s);
  el("text", { x: x0, y: y0 - 14, class: "zayif", metin: "Renk yoğunluğu: GraXpert sonrası fiziksel Hα RMSE azalması" }, s);

  const vurgula = (j, metin, renk, sat) => {
    const x = x0 + j * (H + B) + H / 2;
    const yAlt = y0 + 4 * (H + B) + 24;
    el("line", { x1: x, x2: x, y1: yAlt, y2: yAlt + 20 + sat * 26, stroke: renk }, s);
    el("text", { x: x + 6, y: yAlt + 26 + sat * 26, fill: renk, class: "buyuk-sayi", metin }, s);
  };
  vurgula(1, "%56", RENK.ha, 0);
  vurgula(6, "%4,6", RENK.toz, 1);
  vurgula(9, "%2,6", RENK.toz, 2);
  el("text", { x: 480 - x0, y: 356, "text-anchor": "end", class: "zayif", metin: "G gürültü · C continuum · N [N II] · S [S II] · B birleşik" }, s);

  return {
    adim(t) {
      const dongu = t % 9;
      const ilerleme = Math.min(1, dongu / 4.5) * (KOSULLAR.length + 1);
      for (const k of karolar) {
        const acik = k.j + k.i * 0.2 < ilerleme && dongu < 8.2;
        k.zemin.setAttribute("fill", acik ? RENK.ha : RENK.gok2);
        k.zemin.setAttribute("fill-opacity", acik ? (0.08 + (k.deger / 56.3) * 0.85).toFixed(2) : 1);
        for (const n of k.noktalar) n.setAttribute("opacity", acik ? 0 : 0.4 + Math.random() * 0.6);
      }
    },
  };
}

function gercek(kok) {
  const G = 120;
  const Y = 80;
  const tuval = document.createElement("canvas");
  tuval.width = G;
  tuval.height = Y;
  tuval.className = "piksel-tuval gercek-tuval";
  const izgara = document.createElement("div");
  izgara.className = "sc-izgara";
  const okuma = document.createElement("p");
  okuma.className = "sc-okuma veri";
  const sarmal = document.createElement("div");
  sarmal.className = "sc-sarmal";
  sarmal.append(tuval, izgara);
  kok.append(sarmal, okuma);
  const c = tuval.getContext("2d");
  const resim = c.createImageData(G, Y);
  const rnd = tohumlu(7000);
  const sinyal = new Float32Array(G * Y);

  for (let y = 0; y < Y; y++)
    for (let x = 0; x < G; x++) {
      const kita = gaus(x, 48, 26) * gaus(y, 42, 22) * (1 - gaus(x, 70, 7) * gaus(y, 52, 12) * 0.9);
      sinyal[y * G + x] = 0.12 + kita * 0.7 + 0.22 * gaus(x - y * 0.6, 40, 3) * gaus(y, 50, 22);
    }
  const gurultu = new Float32Array(G * Y * 4).map(() => (rnd() + rnd() + rnd() - 1.5) * 0.3);
  let son = -1;
  return {
    adim(t) {
      const kare = Math.floor(t * 8);
      if (kare === son) return;
      son = kare;
      const sonra = Math.floor(t / 3.2) % 2 === 1;
      const olcek = sonra ? 0.4 : 1;
      const o = (kare * 977) % (G * Y * 3);
      for (let i = 0; i < G * Y; i++) {
        const v = Math.max(0, sinyal[i] + gurultu[o + i] * olcek);
        resim.data[i * 4] = Math.min(255, 20 + v * 300);
        resim.data[i * 4 + 1] = Math.min(255, 12 + v * 70);
        resim.data[i * 4 + 2] = Math.min(255, 22 + v * 90);
        resim.data[i * 4 + 3] = 255;
      }
      c.putImageData(resim, 0, 0);
      kok.classList.toggle("sonra", sonra);
      okuma.innerHTML = sonra
        ? "GRAXPERT SONRASI · küçük ölçek dalgalanma <b>× 0.40</b> · doğruluk: <b class='toz'>?</b><br><span class='zayif'>yapı temsilî; 0.40 ve 100 karo gerçek kayıttan</span>"
        : "ÖNCESİ · aynı model, aynı 100 karo · doğruluk: <b class='toz'>?</b><br><span class='zayif'>yapı temsilî; 0.40 ve 100 karo gerçek kayıttan</span>";
    },
  };
}

export default { spektrum, piksel, sentetik, komsuluk, taban, kirmizi, "kirk-sekiz": kirkSekiz, gercek };
