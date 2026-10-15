/* ==========================================================================
   AIS.002 · Krallık Oyunu · 02 sahneleri
   Oyun tasarım aşamasında; bu çizimler kabul edilmiş tasarım kararlarını
   anlatır, oynanabilir bir sürümü göstermez.
   Sözleşme: (kok) => ({ adim(t) }) ; t saniye.
   ========================================================================== */

import { el, svg, RENK } from "../lib/svg.js";
import { tohumlu } from "../lib/rastgele.js";

const SICAK = "#ffd29a";
const yumusak = (x) => x * x * (3 - 2 * x);
const kis = (a, b, k) => a + (b - a) * k;

/* ---- 1 · Kral önce taşır, sonra liderler yönetir ----------------------- */
function devir(kok) {
  const s = svg(480, 360, kok);
  const kral = { x: 240, y: 60 };
  const gruplar = [
    { ad: "taşçılar", x: 100 },
    { ad: "çiftçiler", x: 240 },
    { ad: "avcılar", x: 380 },
  ];
  const rnd = tohumlu(9);
  const insanlar = [];
  const liderler = gruplar.map((g) => ({ ...g, y: 190 }));
  const kralCizgileri = el("g", {}, s);
  const liderCizgileri = el("g", {}, s);
  gruplar.forEach((g, gi) => {
    for (let i = 0; i < 6; i++) {
      const aci = (i / 6) * Math.PI + Math.PI * 0.08;
      insanlar.push({ g: gi, x: g.x + Math.cos(aci) * 52 * (0.8 + rnd() * 0.3), y: 270 + Math.sin(aci) * 34 });
    }
  });
  const kc = insanlar.map((p) => el("line", { x1: kral.x, y1: kral.y, x2: p.x, y2: p.y, stroke: RENK.toz, "stroke-width": 1 }, kralCizgileri));
  const lk = liderler.map((l) => el("line", { x1: kral.x, y1: kral.y, x2: l.x, y2: l.y, stroke: RENK.toz, "stroke-width": 2 }, kralCizgileri));
  const lc = insanlar.map((p) => el("line", { x1: liderler[p.g].x, y1: liderler[p.g].y, x2: p.x, y2: p.y, stroke: RENK.isik3, "stroke-width": 1 }, liderCizgileri));

  // Taç
  el("path", { d: `M${kral.x - 16} ${kral.y + 8} l4 -16 6 9 6 -13 6 13 6 -9 4 16z`, fill: RENK.toz }, s);
  el("text", { x: kral.x + 26, y: kral.y + 2, metin: "eski kral" }, s);
  const liderNoktalari = liderler.map((l) => {
    const g = el("g", {}, s);
    el("circle", { cx: l.x, cy: l.y, r: 9, fill: RENK.gok2, stroke: RENK.oiii, "stroke-width": 1.5 }, g);
    el("circle", { cx: l.x, cy: l.y, r: 3.5, fill: RENK.oiii }, g);
    el("text", { x: l.x, y: l.y - 16, "text-anchor": "middle", fill: RENK.oiii, metin: "lider" }, g);
    el("text", { x: l.x, y: 340, "text-anchor": "middle", class: "zayif", metin: l.ad }, g);
    return g;
  });
  insanlar.forEach((p) => el("circle", { cx: p.x, cy: p.y, r: 3.2, fill: SICAK }, s));
  const okuma = el("text", { x: 24, y: 24, metin: "" }, s);

  return {
    adim(t) {
      const d = t % 10;
      const k = yumusak(Math.min(1, Math.max(0, (d - 3) / 2.5)) * (d < 8.5 ? 1 : Math.max(0, 1 - (d - 8.5) / 1.2)));
      kc.forEach((c) => c.setAttribute("opacity", (0.55 * (1 - k)).toFixed(2)));
      lk.forEach((c) => c.setAttribute("opacity", k.toFixed(2)));
      lc.forEach((c) => c.setAttribute("opacity", (0.7 * k).toFixed(2)));
      liderNoktalari.forEach((g) => g.setAttribute("opacity", k.toFixed(2)));
      const bag = Math.round(kis(18, 3, k));
      okuma.textContent = `KRALIN DOĞRUDAN BAĞLANTISI: ${String(bag).padStart(2, "0")}  ·  ${k < 0.5 ? "ERKEN AŞAMA" : "YERLEŞİM BÜYÜDÜ"}`;
    },
  };
}

/* ---- 2 · Kişi sayısını seç, hedefi göster ------------------------------ */
function gorev(kok) {
  const s = svg(480, 360, kok);
  const zemin = 250;
  const defs = el("defs", {}, s);
  const parilti = el("filter", { id: "gorev-parilti", x: "-200%", y: "-200%", width: "500%", height: "500%" }, defs);
  el("feGaussianBlur", { stdDeviation: 2.2 }, parilti);
  const hale = el("radialGradient", { id: "gorev-hale" }, defs);
  el("stop", { offset: "0", "stop-color": RENK.toz, "stop-opacity": 0.28 }, hale);
  el("stop", { offset: "1", "stop-color": RENK.toz, "stop-opacity": 0 }, hale);

  // Gece: yıldızlar ve kalenin ateşinden yansıyan ufuk
  const rnd = tohumlu(312);
  const yildizlar = Array.from({ length: 60 }, () => el("circle", { cx: rnd() * 480, cy: rnd() * 200, r: 0.4 + rnd() * 0.9, fill: "#fff4e2", opacity: 0.5 }, s));
  el("ellipse", { cx: 96, cy: zemin - 10, rx: 120, ry: 70, fill: "url(#gorev-hale)" }, s);
  el("rect", { x: 0, y: zemin, width: 480, height: 110, fill: "#050608" }, s);
  el("line", { x1: 0, x2: 480, y1: zemin, y2: zemin, stroke: RENK.isik4 }, s);

  // Harabe kale silueti
  el("path", { d: `M56 ${zemin} v-64 h6 v-7 h5 v7 h5 v-7 h5 v7 h6 v28 h14 v-10 h4 l3 6 3 -9 4 13 v40z`, fill: "#030405" }, s);
  el("rect", { x: 66, y: zemin - 52, width: 4, height: 7, fill: SICAK, opacity: 0.85 }, s);
  el("path", { d: `M83 ${zemin} v-14 q6 -7 12 0 v14z`, fill: RENK.toz, opacity: 0.75 }, s);
  el("text", { x: 90, y: zemin + 22, "text-anchor": "middle", metin: "kale" }, s);

  const hedefler = [
    { ad: "orman", x: 230 },
    { ad: "taş ocağı", x: 330 },
    { ad: "tarla", x: 420 },
  ];
  // Orman siluetleri
  for (const [dx, b] of [[-16, 1], [-6, 1.3], [6, 1.1], [16, 0.9]]) {
    el("path", { d: `M${230 + dx - 6 * b} ${zemin} L${230 + dx} ${zemin - 22 * b} L${230 + dx + 6 * b} ${zemin}z`, fill: "#030405" }, s);
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
      // 0–1 sn seçim, 1–4 yürüyüş, 4–5 iş, 5–7.5 dönüş
      let ilerleme = 0;
      if (d > 1 && d <= 4) ilerleme = yumusak((d - 1) / 3);
      else if (d > 4 && d <= 5) ilerleme = 1;
      else if (d > 5) ilerleme = 1 - yumusak(Math.min(1, (d - 5) / 2.5));
      kisiler.forEach((k, i) => {
        const aktif = i < n;
        const x = aktif ? kis(110, hedef.x - 12, ilerleme) - i * 9 : 112 - i * 6;
        const yuruyor = aktif && ilerleme > 0 && ilerleme < 1;
        const sek = yuruyor ? Math.abs(Math.sin(t * 9 + i)) * 3 : 0;
        k.setAttribute("transform", `translate(${x.toFixed(1)} ${(zemin - 5 - sek).toFixed(1)})`);
        k.setAttribute("opacity", aktif ? 1 : 0.3);
      });
      const gorevde = d > 1 && d < 7.5 ? n : 0;
      secim.textContent = `${n} KİŞİ → ${hedef.ad.toLocaleUpperCase("tr")}`;
      nufus.textContent = `kullanılabilir nüfus: ${12 - gorevde} / 12`;
      durum.textContent = d < 1 ? "kişi sayısı seçiliyor" : d < 4 ? "hedefe yürüyorlar; görevdeyken nüfustan düşerler" : d < 5 ? "çalışıyorlar" : "dönüyorlar";
    },
  };
}

/* ---- 3 · Araştırma: harcanan XP değil, yeniden dağıtılan kapasite ------ */
function kapasite(kok) {
  const s = svg(480, 360, kok);
  const dallar = [
    { ad: "Tarım", renk: RENK.toz },
    { ad: "Yapı", renk: RENK.isik2 },
    { ad: "Kimya", renk: RENK.oiii },
    { ad: "Rün", renk: RENK.ha },
  ];
  const x0 = 40;
  const genislik = 400;
  el("text", { x: x0, y: 40, metin: "TOPLAM ARAŞTIRMA KAPASİTESİ · %100" }, s);
  const parcalar = dallar.map((d) => el("rect", { y: 56, height: 34, fill: d.renk, "fill-opacity": 0.75 }, s));
  const etiketler = dallar.map(() => el("text", { y: 78, "text-anchor": "middle", fill: RENK.gok2, class: "koyu" }, s));
  const satirlar = dallar.map((d, i) => {
    const y = 140 + i * 42;
    el("text", { x: x0, y: y + 4, fill: d.renk, metin: d.ad }, s);
    el("rect", { x: 140, y: y - 8, width: 300, height: 14, fill: RENK.gok2 }, s);
    const cubuk = el("rect", { x: 140, y: y - 8, height: 14, fill: RENK.ha, "fill-opacity": 0.5 }, s);
    const deger = el("text", { x: 440, y: y - 14, "text-anchor": "end", class: "zayif" }, s);
    return { cubuk, deger };
  });
  el("text", { x: x0, y: 120, class: "zayif", metin: "o daldaki topluluğun etkin iş gücü kaybı" }, s);
  el("text", { x: x0, y: 330, class: "formul", metin: "kayıp = pay / 2" }, s);
  el("text", { x: 440, y: 330, "text-anchor": "end", class: "zayif", metin: "kapasite harcanmaz, yer değiştirir" }, s);

  const desenler = [
    [40, 30, 20, 10],
    [20, 25, 40, 15],
    [25, 15, 20, 40],
    [35, 35, 15, 15],
  ];
  return {
    adim(t) {
      const i = Math.floor(t / 3) % desenler.length;
      const k = yumusak(Math.min(1, (t % 3) / 1.2));
      const a = desenler[i];
      const b = desenler[(i + 1) % desenler.length];
      const pay = a.map((v, j) => kis(v, b[j], k));
      let x = x0;
      pay.forEach((p, j) => {
        const w = (p / 100) * genislik;
        parcalar[j].setAttribute("x", x.toFixed(1));
        parcalar[j].setAttribute("width", Math.max(0, w - 2).toFixed(1));
        etiketler[j].setAttribute("x", (x + w / 2).toFixed(1));
        etiketler[j].textContent = w > 40 ? `%${Math.round(p)}` : "";
        satirlar[j].cubuk.setAttribute("width", ((p / 2 / 25) * 300).toFixed(1));
        satirlar[j].deger.textContent = `−%${(p / 2).toFixed(1)}`;
        x += w;
      });
    },
  };
}

/* ---- 4 · Simya: kimya yol açar, rün bedel ister ------------------------ */
function simya(kok) {
  const s = svg(480, 360, kok);
  const x0 = 50;
  const x1 = 440;
  const taban = 290;
  el("line", { x1: x0, x2: x1, y1: taban, y2: taban, stroke: RENK.isik4 }, s);
  el("line", { x1: x0, x2: x0, y1: 40, y2: taban, stroke: RENK.isik4 }, s);
  el("text", { x: x1, y: taban + 20, "text-anchor": "end", class: "zayif", metin: "zaman →" }, s);
  el("text", { x: x0 - 8, y: 46, "text-anchor": "end", class: "zayif", metin: "güç" }, s);
  el("circle", { cx: x0, cy: taban - 20, r: 5, fill: RENK.toz }, s);
  el("text", { x: x0 + 10, y: taban - 26, metin: "simya" }, s);

  const N = 40;
  const rnd = tohumlu(1307);
  const kimya = [];
  const run = [];
  const kayiplar = [];
  let k = 0;
  let r = 0;
  for (let i = 0; i < N; i++) {
    k += 4.2;
    if (i % 4 === 0) k += 6; // yeni gelişim kapısı
    r += 7.5;
    if (rnd() < 0.14 && i > 3) {
      r -= 26 + rnd() * 16;
      kayiplar.push(i);
    }
    kimya.push(k);
    run.push(Math.max(0, r));
  }
  const X = (i) => x0 + (i / (N - 1)) * (x1 - x0);
  const Y = (v) => taban - 20 - (v / 260) * (taban - 70);
  const yol = (dizi, son) => dizi.slice(0, son).map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join("");
  const kc = el("path", { fill: "none", stroke: RENK.oiii, "stroke-width": 2.2 }, s);
  const rc = el("path", { fill: "none", stroke: RENK.ha, "stroke-width": 2.2 }, s);
  const isaretler = kayiplar.map((i) => {
    const g = el("g", { opacity: 0 }, s);
    el("path", { d: `M${X(i) - 4} ${Y(run[i]) - 14} l8 8 m0 -8 l-8 8`, stroke: RENK.ha, "stroke-width": 1.5 }, g);
    return { g, i };
  });
  const kEt = el("text", { fill: RENK.oiii, metin: "kimya · yeni yollar açar" }, s);
  const rEt = el("text", { fill: RENK.ha, metin: "rün · güçlü ama riskli" }, s);
  el("text", { x: x0, y: 330, class: "zayif", metin: "rüne yatırılan her pay, kimyadan geri kalma bedeli taşır" }, s);

  return {
    adim(t) {
      const son = Math.max(2, Math.min(N, Math.floor((t % 9) / 7 * N)));
      kc.setAttribute("d", yol(kimya, son));
      rc.setAttribute("d", yol(run, son));
      isaretler.forEach((m) => m.g.setAttribute("opacity", m.i < son ? 1 : 0));
      kEt.setAttribute("x", Math.min(X(son - 1) + 8, 330));
      kEt.setAttribute("y", Y(kimya[son - 1]) + 16);
      rEt.setAttribute("x", Math.min(X(son - 1) + 8, 330));
      rEt.setAttribute("y", Y(run[son - 1]) - 10);
    },
  };
}

/* ---- 5 · Yol menüden seçilmez; kararlar biriktirir --------------------- */
function yol(kok) {
  const s = svg(480, 360, kok);
  const m = { x: 240, y: 185 };
  const R = 130;
  const uclar = ["Askerî restorasyon", "Refah", "Diplomasi", "Rünler", "Halk desteği"].map((ad, i) => {
    const a = -Math.PI / 2 + (i / 5) * Math.PI * 2;
    return { ad, x: m.x + Math.cos(a) * R, y: m.y + Math.sin(a) * R };
  });
  el("polygon", { points: uclar.map((u) => `${u.x},${u.y}`).join(" "), fill: "none", stroke: RENK.isik4 }, s);
  uclar.forEach((u) => el("line", { x1: m.x, y1: m.y, x2: u.x, y2: u.y, stroke: RENK.cizgi }, s));
  const etiketler = uclar.map((u) => {
    const sag = u.x > m.x + 5;
    const sol = u.x < m.x - 5;
    return el("text", { x: u.x + (sag ? 10 : sol ? -10 : 0), y: u.y + (u.y < m.y ? -10 : 18), "text-anchor": sag ? "start" : sol ? "end" : "middle", metin: u.ad }, s);
  });
  const iz = el("polyline", { fill: "none", stroke: RENK.toz, "stroke-width": 1.4, "stroke-opacity": 0.7 }, s);
  const nokta = el("circle", { r: 6, fill: SICAK }, s);
  const okuma = el("text", { x: 24, y: 340, metin: "" }, s);
  let tur = -1;
  let noktalar = [];
  let rnd;
  return {
    adim(t) {
      const yeniTur = Math.floor(t / 12);
      if (yeniTur !== tur) {
        tur = yeniTur;
        rnd = tohumlu(77 + tur * 13);
        noktalar = [{ ...m }];
        for (let i = 0; i < 22; i++) {
          const son = noktalar.at(-1);
          // Her karar bir yöne hafif çeker; eğilim oyuncunun geçmişinden doğar
          const yon = uclar[(rnd() * 5) | 0];
          const egilim = uclar[tur % 5];
          noktalar.push({
            x: son.x + (yon.x - son.x) * 0.09 + (egilim.x - son.x) * 0.06,
            y: son.y + (yon.y - son.y) * 0.09 + (egilim.y - son.y) * 0.06,
          });
        }
      }
      const k = Math.min(noktalar.length, 1 + Math.floor((t % 12) / 0.4));
      const gorunen = noktalar.slice(0, k);
      iz.setAttribute("points", gorunen.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "));
      const son = gorunen.at(-1);
      nokta.setAttribute("cx", son.x.toFixed(1));
      nokta.setAttribute("cy", son.y.toFixed(1));
      let yakin = 0;
      uclar.forEach((u, i) => {
        if (Math.hypot(u.x - son.x, u.y - son.y) < Math.hypot(uclar[yakin].x - son.x, uclar[yakin].y - son.y)) yakin = i;
      });
      const bitti = k >= noktalar.length;
      etiketler.forEach((e, i) => e.setAttribute("fill", bitti && i === yakin ? RENK.toz : RENK.isik2));
      okuma.textContent = bitti ? `22 KARAR SONRA EĞİLİM: ${uclar[yakin].ad.toLocaleUpperCase("tr")}` : `KARAR ${String(k - 1).padStart(2, "0")} / 22`;
    },
  };
}

/* ---- 6 · Üç his ---------------------------------------------------------- */
function his(kok) {
  const s = svg(480, 360, kok);
  const defs = el("defs", {}, s);
  const isik = el("radialGradient", { id: "his-isik" }, defs);
  el("stop", { offset: "0", "stop-color": SICAK, "stop-opacity": 0.5 }, isik);
  el("stop", { offset: "0.6", "stop-color": RENK.toz, "stop-opacity": 0.12 }, isik);
  el("stop", { offset: "1", "stop-color": RENK.toz, "stop-opacity": 0 }, isik);
  const zemin = 230;
  const sutunlar = [
    { x: 80, ad: "Don't Starve", his: "gece yaklaşıyor" },
    { x: 240, ad: "Clash of Clans", his: "yerleşim görünür büyür" },
    { x: 400, ad: "Stardew Valley", his: "sıcak, kendi temposunda" },
  ];
  sutunlar.forEach((c) => {
    el("line", { x1: c.x - 60, x2: c.x + 60, y1: zemin, y2: zemin, stroke: RENK.isik4 }, s);
    el("text", { x: c.x, y: 290, "text-anchor": "middle", fill: RENK.isik, metin: c.ad }, s);
    el("text", { x: c.x, y: 308, "text-anchor": "middle", class: "zayif", metin: c.his }, s);
  });

  // 1 · Kamp ateşi: ışık çemberi daralır, odun atılınca geri açılır
  const atesIsik = el("circle", { cx: 80, cy: zemin - 6, fill: "url(#his-isik)" }, s);
  const alev = el("path", { fill: RENK.toz }, s);
  el("path", { d: `M66 ${zemin} l28 -6 M66 ${zemin - 6} l28 6`, stroke: "#5a4030", "stroke-width": 3, "stroke-linecap": "round" }, s);
  const gozler = el("g", {}, s);
  for (const [x, y] of [[30, 150], [128, 140], [36, 196]]) {
    el("circle", { cx: x, cy: y, r: 1.4, fill: RENK.ha }, gozler);
    el("circle", { cx: x + 5, cy: y, r: 1.4, fill: RENK.ha }, gozler);
  }

  // 2 · Yükselen evler
  const evler = [0, 1, 2, 3, 4].map((i) => {
    const g = el("g", {}, s);
    const govde = el("rect", { x: 186 + i * 22, width: 16, fill: "#1c1e25", stroke: RENK.toz, "stroke-opacity": 0.5 }, g);
    const cati = el("path", { fill: RENK.toz, "fill-opacity": 0.8 }, g);
    return { govde, cati, x: 186 + i * 22, boy: 22 + i * 9 };
  });

  // 3 · Sıcak pencere
  el("path", { d: `M370 ${zemin} v-36 l30 -22 30 22 v36z`, fill: "#1c1e25", stroke: RENK.isik4 }, s);
  const pencere = el("rect", { x: 391, y: zemin - 30, width: 18, height: 16, fill: SICAK }, s);
  const pencereHale = el("circle", { cx: 400, cy: zemin - 22, fill: "url(#his-isik)" }, s);
  el("line", { x1: 400, x2: 400, y1: zemin - 30, y2: zemin - 14, stroke: "#1c1e25", "stroke-width": 1.5 }, s);

  return {
    adim(t) {
      // Ateş: 6 sn'de sönmeye yaklaşır, sonra yeniden alevlenir
      const d = (t % 6) / 6;
      const guc = d < 0.85 ? 1 - d * 0.9 : 0.25 + ((d - 0.85) / 0.15) * 0.75;
      atesIsik.setAttribute("r", (20 + guc * 52).toFixed(1));
      const h = 8 + guc * 14 + Math.sin(t * 11) * 2;
      alev.setAttribute("d", `M72 ${zemin - 4} Q80 ${zemin - 4 - h} 88 ${zemin - 4} Q80 ${zemin - 4 - h * 0.4} 72 ${zemin - 4}z`);
      gozler.setAttribute("opacity", Math.max(0, 1 - guc * 1.6).toFixed(2));

      evler.forEach((e, i) => {
        const k = Math.max(0, Math.min(1, ((t % 9) - i * 1.1) / 1.4));
        const b = e.boy * k;
        e.govde.setAttribute("y", (zemin - b).toFixed(1));
        e.govde.setAttribute("height", b.toFixed(1));
        e.cati.setAttribute("d", k > 0 ? `M${e.x - 2} ${zemin - b} l10 ${-8 * k} 10 ${8 * k}z` : "");
      });

      const n = 0.5 + 0.5 * Math.sin(t * 1.4);
      pencere.setAttribute("fill-opacity", (0.65 + n * 0.35).toFixed(2));
      pencereHale.setAttribute("r", (30 + n * 14).toFixed(1));
    },
  };
}

export default { devir, gorev, kapasite, simya, yol, his };
