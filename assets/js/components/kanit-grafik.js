/* ==========================================================================
   <kanit-grafik tur="kosullar|nii|kalan" veri="/assets/data/ais001-graxpert.json">
   03 raporundaki kanıt grafikleri. Sayılar 29 Eylül 2026 deney kayıtlarından
   (chart-data.json, snr-error-data.json) aynen alınır; yalnız çizim yenidir.
   Her nokta <title> taşır: üstüne gelince değeri söyler.
   ========================================================================== */

import { el, svg, RENK } from "../lib/svg.js";

const CIZGILER = [
  { anahtar: "Ha", veriAnahtar: "Ha", ad: "Fiziksel Hα", renk: RENK.ha },
  { anahtar: "OIII", veriAnahtar: "OIII_total", ad: "[O III] toplamı", renk: RENK.oiii },
  { anahtar: "Hb", veriAnahtar: "Hb", ad: "Hβ", renk: RENK.hb },
];
const yuzde = (v, h = 1) => `%${v.toLocaleString("tr-TR", { minimumFractionDigits: h, maximumFractionDigits: h })}`;

const veriOnbellek = new Map();
const veriGetir = (yol) => {
  if (!veriOnbellek.has(yol)) veriOnbellek.set(yol, fetch(yol).then((r) => r.json()));
  return veriOnbellek.get(yol);
};

/* ---- 1 · 12 koşulda RMSE azalması (nokta grafiği) ---------------------- */
function kosullar(kok, veri) {
  const satir = 30;
  const sol = 190;
  const sag = 620;
  const ust = 46;
  const Y = ust + veri.kosullar.length * satir + 40;
  const s = svg(660, Y, kok);
  const X = (v) => sol + (v / 60) * (sag - sol);

  for (let v = 0; v <= 60; v += 10) {
    el("line", { x1: X(v), x2: X(v), y1: ust - 10, y2: Y - 34, stroke: v ? RENK.cizgi : RENK.isik4 }, s);
    el("text", { x: X(v), y: Y - 18, "text-anchor": "middle", metin: `%${v}` }, s);
  }
  el("text", { x: sag, y: Y - 2, "text-anchor": "end", class: "zayif", metin: "RMSE azalması · 100 × (1 − sonra / önce)" }, s);

  CIZGILER.forEach((c, i) => {
    el("circle", { cx: sol + i * 130 + 5, cy: 14, r: 5, fill: c.renk }, s);
    el("text", { x: sol + i * 130 + 16, y: 18, metin: c.ad }, s);
  });

  veri.kosullar.forEach((k, i) => {
    const y = ust + i * satir;
    // Koşul aileleri arasında ince bir ayraç
    const grupBasi = ["continuum-low", "nii-low", "sii-low", "combined-low-noise"].includes(k.id);
    if (grupBasi) el("line", { x1: 0, x2: sag, y1: y - satir / 2, y2: y - satir / 2, stroke: RENK.isik4, "stroke-dasharray": "2 4" }, s);
    el("text", { x: sol - 16, y: y + 4, "text-anchor": "end", class: k.id === "nii-high" || k.id.startsWith("combined") ? "vurgu" : "", metin: k.ad }, s);
    const degerler = CIZGILER.map((c) => k[c.anahtar]);
    el("line", { x1: X(Math.min(...degerler)), x2: X(Math.max(...degerler)), y1: y, y2: y, stroke: RENK.isik4, "stroke-width": 2 }, s);
    CIZGILER.forEach((c) => {
      const n = el("circle", { cx: X(k[c.anahtar]), cy: y, r: c.anahtar === "Ha" ? 6 : 4.5, fill: c.renk, class: "nokta" }, s);
      el("title", { metin: `${k.ad} · ${c.ad}: ${yuzde(k[c.anahtar])}` }, n);
    });
    el("text", { x: X(k.Ha) + (k.Ha < 10 ? 10 : -10), y: y - 9, "text-anchor": k.Ha < 10 ? "start" : "end", fill: RENK.ha, class: "kucuk", metin: yuzde(k.Ha) }, s);
  });
}

/* ---- 2 · Yüksek [N II]: iki hedef, iki hikâye (eğim grafiği) ----------- */
function nii(kok, veri) {
  const s = svg(660, 330, kok);
  const sol = 170;
  const sag = 470;
  const ust = 40;
  const alt = 270;
  const Y = (v) => alt - (v / 7) * (alt - ust);
  for (let v = 0; v <= 7; v++) {
    el("line", { x1: sol - 30, x2: sag + 30, y1: Y(v), y2: Y(v), stroke: v ? RENK.cizgi : RENK.isik4 }, s);
    el("text", { x: sol - 40, y: Y(v) + 4, "text-anchor": "end", metin: v }, s);
  }
  el("text", { x: sol - 40, y: ust - 16, "text-anchor": "end", class: "zayif", metin: "RMSE · ×10⁻⁵ model birimi" }, s);
  el("text", { x: sol, y: alt + 26, "text-anchor": "middle", metin: "GraXpert öncesi" }, s);
  el("text", { x: sag, y: alt + 26, "text-anchor": "middle", metin: "sonrası" }, s);

  const hedefler = [
    { v: veri.yuksekNII.Ha, renk: RENK.ha, ad: "Fiziksel Hα" },
    { v: veri.yuksekNII.ha_equiv_line, renk: RENK.toz, ad: "HaEq_line · tanısal" },
  ];
  for (const h of hedefler) {
    el("line", { x1: sol, x2: sag, y1: Y(h.v.once), y2: Y(h.v.sonra), stroke: h.renk, "stroke-width": 2.5 }, s);
    for (const [x, d] of [[sol, h.v.once], [sag, h.v.sonra]]) {
      const n = el("circle", { cx: x, cy: Y(d), r: 6, fill: h.renk, class: "nokta" }, s);
      el("title", { metin: `${h.ad}: ${d.toLocaleString("tr-TR")} ×10⁻⁵` }, n);
    }
    el("text", { x: sol - 12, y: Y(h.v.once) - 10, "text-anchor": "end", fill: h.renk, metin: h.v.once.toLocaleString("tr-TR") }, s);
    el("text", { x: sag + 14, y: Y(h.v.sonra) + 4, fill: h.renk, metin: `${h.v.sonra.toLocaleString("tr-TR")}  ·  ${h.ad}` }, s);
    el("text", { x: sag + 14, y: Y(h.v.sonra) + 26, fill: h.renk, class: "buyuk-sayi", metin: `−${yuzde(h.v.azalma)}` }, s);
  }
}

/* ---- 3 · Başlangıç SNR'sine göre kalan hata (küçük çoklu, log ölçek) --- */
function kalan(kok, veri) {
  const genislik = 660;
  const s = svg(genislik, 360, kok);
  const panel = [
    { anahtar: "noise", ad: "Yalnız gürültü", x0: 60 },
    { anahtar: "combined", ad: "Birleşik kirletici", x0: 370 },
  ];
  const pg = 250;
  const ust = 56;
  const alt = 290;
  const lg = (v) => Math.log10(v);
  const Y = (v) => alt - ((lg(v) - lg(1)) / (lg(300) - lg(1))) * (alt - ust);
  const gruplar = veri.snrGruplari;

  CIZGILER.forEach((c, i) => {
    el("circle", { cx: 60 + i * 130, cy: 14, r: 5, fill: c.renk }, s);
    el("text", { x: 71 + i * 130, y: 18, metin: c.ad }, s);
  });
  el("line", { x1: 450, x2: 474, y1: 14, y2: 14, stroke: RENK.isik2, "stroke-dasharray": "3 3", "stroke-width": 1.5 }, s);
  el("text", { x: 480, y: 18, metin: "önce" }, s);
  el("line", { x1: 530, x2: 554, y1: 14, y2: 14, stroke: RENK.isik2, "stroke-width": 2 }, s);
  el("text", { x: 560, y: 18, metin: "sonra" }, s);

  for (const p of panel) {
    const X = (i) => p.x0 + (i / (gruplar.length - 1)) * pg;
    el("text", { x: p.x0, y: ust - 14, class: "baslik", metin: p.ad }, s);
    for (const v of [1, 3, 10, 30, 100, 300]) {
      el("line", { x1: p.x0, x2: p.x0 + pg, y1: Y(v), y2: Y(v), stroke: RENK.cizgi }, s);
      if (p.x0 === 60) el("text", { x: p.x0 - 10, y: Y(v) + 4, "text-anchor": "end", metin: `%${v}` }, s);
    }
    gruplar.forEach((g, i) => el("text", { x: X(i), y: alt + 18, "text-anchor": "middle", metin: g }, s));
    el("text", { x: p.x0 + pg / 2, y: alt + 36, "text-anchor": "middle", class: "zayif", metin: "başlangıç SNR grubu" }, s);

    for (const c of CIZGILER) {
      const d = veri.kalanHata[p.anahtar][c.veriAnahtar];
      const yol = (dizi) => dizi.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join("");
      el("path", { d: yol(d.once), fill: "none", stroke: c.renk, "stroke-width": 1.5, "stroke-dasharray": "3 3", opacity: 0.7 }, s);
      el("path", { d: yol(d.sonra), fill: "none", stroke: c.renk, "stroke-width": c.anahtar === "Ha" ? 2.6 : 1.8 }, s);
      d.sonra.forEach((v, i) => {
        const n = el("circle", { cx: X(i), cy: Y(v), r: 3, fill: c.renk, class: "nokta" }, s);
        el("title", { metin: `${p.ad} · ${c.ad} · SNR ${gruplar[i]}: önce ${yuzde(d.once[i], 2)}, sonra ${yuzde(d.sonra[i], 2)}` }, n);
      });
    }
    const son = veri.kalanHata[p.anahtar].Ha.sonra.at(-1);
    el("text", { x: X(4) + 10, y: Y(son) + 6, fill: RENK.ha, class: "buyuk-sayi", metin: yuzde(son, 2) }, s);
  }
}

const TURLER = { kosullar, nii, kalan };

class KanitGrafik extends HTMLElement {
  async connectedCallback() {
    if (this._kuruldu) return;
    this._kuruldu = true;
    const tur = TURLER[this.getAttribute("tur")];
    if (!tur) return;
    this.classList.add("grafik");
    try {
      const veri = await veriGetir(this.getAttribute("veri"));
      tur(this, veri);
    } catch {
      this.textContent = "Grafik verisi yüklenemedi. Sayfayı bir yerel sunucu üzerinden aç.";
    }
  }
}

customElements.define("kanit-grafik", KanitGrafik);
