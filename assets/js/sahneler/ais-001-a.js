import { el, svg, CIZGI, RENK } from "../lib/svg.js?v=20261127a";
import { tohumlu, azHareket } from "../lib/rastgele.js?v=20261127a";

export const gaus = (x, m, s) => Math.exp(-((x - m) ** 2) / (2 * s * s));

export const sinirla = (v, a, b) => Math.max(a, Math.min(b, v));

export const nmToX = (nm, a = 400, b = 700, x0 = 44, x1 = 516) =>
  x0 + ((nm - a) / (b - a)) * (x1 - x0);

export const xToNm = (x, a = 400, b = 700, x0 = 44, x1 = 516) =>
  sinirla(a + ((x - x0) / (x1 - x0)) * (b - a), a, b);

export const KANALLAR = [
  { ad: "B", m: 465, s: 28, p: 0.85, renk: "#8aa2ff" },
  { ad: "G", m: 535, s: 36, p: 1.0, renk: "#45d6c8" },
  { ad: "R", m: 602, s: 30, p: 0.8, renk: "#ff4f61" },
];

export const kameraYanit = (k, nm) =>
  k.p * gaus(nm, k.m, k.s) + (k.ad === "R" ? 0.35 * gaus(nm, 655, 16) : 0);

export const EMISYON_CIZGILER = [
  { id: "hb", ad: "Hβ", nm: 486.1, renk: CIZGI.hb.renk, sutun: 2, boy: 0.92 },
  { id: "oiii2", ad: "[O III]", nm: 495.9, renk: CIZGI.oiii2.renk, sutun: 1, boy: 0.36 },
  { id: "oiii", ad: "[O III]", nm: 500.7, renk: CIZGI.oiii.renk, sutun: 1, boy: 0.98 },
  { id: "ha", ad: "Hα", nm: 656.3, renk: CIZGI.ha.renk, sutun: 0, boy: 1.0 },
];

const SUTUN_CIZGILER = [
  { id: "ha", ad: "Hα", nm: 656.3, renk: CIZGI.ha.renk },
  { id: "oiii", ad: "[O III]", nm: 500.7, renk: CIZGI.oiii.renk },
  { id: "hb", ad: "Hβ", nm: 486.1, renk: CIZGI.hb.renk },
];

export function tutunNm(hamNm) {
  const sinirli = sinirla(hamNm, 400, 700);
  let enYakin = null;
  let enFark = Infinity;
  for (const c of EMISYON_CIZGILER) {
    const fark = Math.abs(sinirli - c.nm);
    if (fark < enFark) {
      enFark = fark;
      enYakin = c;
    }
  }
  if (!enYakin) return { nm: sinirli, cizgi: null, tutundu: false, sutun: -1 };

  let cekirdek = 3.6;
  let cekim = 7.2;
  if (enYakin.id === "oiii2" || enYakin.id === "oiii") {
    cekirdek = 1.8;
    cekim = 2.38;
  } else if (enYakin.id === "hb") {
    cekirdek = 2.6;
    cekim = 4.8;
  }
  if (enFark <= cekirdek) {
    return { nm: enYakin.nm, cizgi: enYakin, tutundu: true, sutun: enYakin.sutun };
  }
  if (enFark < cekim) {
    const u = (enFark - cekirdek) / (cekim - cekirdek);
    const yumusak = u * u * (3 - 2 * u);
    const cekilmis = enYakin.nm + Math.sign(sinirli - enYakin.nm) * (enFark * yumusak);
    return { nm: cekilmis, cizgi: null, tutundu: false, sutun: -1 };
  }
  return { nm: sinirli, cizgi: null, tutundu: false, sutun: -1 };
}

export function dalgaBoyuRenk(nm) {
  const duraklar = [
    [400, [118, 108, 224]],
    [460, [120, 146, 255]],
    [486.1, [138, 162, 255]],
    [500.7, [69, 214, 200]],
    [545, [114, 214, 152]],
    [590, [224, 174, 106]],
    [630, [248, 118, 98]],
    [656.3, [255, 79, 97]],
    [700, [196, 48, 72]],
  ];
  const n = sinirla(nm, 400, 700);
  for (let i = 0; i < duraklar.length - 1; i++) {
    const [a, ca] = duraklar[i];
    const [b, cb] = duraklar[i + 1];
    if (n >= a && n <= b) {
      const t = (n - a) / (b - a);
      const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
      const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
      const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
      return `rgb(${r},${g},${bl})`;
    }
  }
  return RENK.ha;
}

export function karisimMatrisi() {
  const satirKanallari = [KANALLAR[2], KANALLAR[1], KANALLAR[0]];
  return satirKanallari.map((k) => {
    const ha = kameraYanit(k, 656.3);
    const oiii = (2.98 * kameraYanit(k, 500.7) + kameraYanit(k, 495.9)) / 3.98;
    const hb = kameraYanit(k, 486.1);
    return [ha, oiii, hb];
  });
}

export function nnls3(M, y) {
  const [y0, y1, y2] = y;
  const col = (j) => [M[0][j], M[1][j], M[2][j]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  const artikKare = (x) => {
    let s = 0;
    for (let i = 0; i < 3; i++) {
      const r = M[i][0] * x[0] + M[i][1] * x[1] + M[i][2] * x[2] - y[i];
      s += r * r;
    }
    return s;
  };

  const det3 = (a, b, c) =>
    a[0] * (b[1] * c[2] - b[2] * c[1]) -
    b[0] * (a[1] * c[2] - a[2] * c[1]) +
    c[0] * (a[1] * b[2] - a[2] * b[1]);

  const c0 = col(0);
  const c1 = col(1);
  const c2 = col(2);
  const D = det3(c0, c1, c2);
  let serbest = [0, 0, 0];
  if (Math.abs(D) > 1e-12) {
    serbest = [
      det3([y0, y1, y2], c1, c2) / D,
      det3(c0, [y0, y1, y2], c2) / D,
      det3(c0, c1, [y0, y1, y2]) / D,
    ];
  }

  let enIyiX = [0, 0, 0];
  let enIyiHata = y0 * y0 + y1 * y1 + y2 * y2;

  const dene = (aday) => {
    if (aday[0] < -1e-12 || aday[1] < -1e-12 || aday[2] < -1e-12) return;
    const temiz = [Math.max(0, aday[0]), Math.max(0, aday[1]), Math.max(0, aday[2])];
    const h = artikKare(temiz);
    if (h < enIyiHata) {
      enIyiHata = h;
      enIyiX = temiz;
    }
  };

  if (Math.abs(D) > 1e-12) dene(serbest);

  const sutunlar = [c0, c1, c2];
  for (let j = 0; j < 3; j++) {
    const a = sutunlar[j];
    const aa = dot(a, a);
    if (aa > 1e-12) {
      const x = [0, 0, 0];
      x[j] = dot(a, y) / aa;
      dene(x);
    }
  }

  const ikililer = [
    [0, 1],
    [0, 2],
    [1, 2],
  ];
  for (const [j, k] of ikililer) {
    const a = sutunlar[j];
    const b = sutunlar[k];
    const g00 = dot(a, a);
    const g01 = dot(a, b);
    const g11 = dot(b, b);
    const det = g00 * g11 - g01 * g01;
    if (Math.abs(det) > 1e-12) {
      const r0 = dot(a, y);
      const r1 = dot(b, y);
      const x = [0, 0, 0];
      x[j] = (g11 * r0 - g01 * r1) / det;
      x[k] = (-g01 * r0 + g00 * r1) / det;
      dene(x);
    }
  }

  const kirpildi = [0, 1, 2].map((i) => serbest[i] < -0.015 && enIyiX[i] <= 1e-6);
  return { x: enIyiX, serbest, kirpildi, artik: Math.sqrt(enIyiHata) };
}

export const VEIL_KIRP = [0.27, 0.28, 0.44, 0.48];
export const VEIL_YAY_KIRP = [0.311, 0.626, 0.078, 0.072];

const VEIL_YEDEK_12X8 = [
  [31,22,27],[16,11,17],[14,26,20],[58,78,73],[33,24,31],[16,13,12],[19,18,18],[12,10,12],[14,11,13],[19,18,20],[22,18,19],[12,10,13],
  [14,9,13],[14,12,14],[17,16,17],[50,64,58],[78,26,34],[30,13,15],[19,12,12],[16,9,15],[14,12,13],[30,17,17],[43,22,23],[22,23,27],
  [19,9,11],[14,12,15],[16,14,12],[49,67,64],[102,56,56],[26,14,14],[45,15,13],[33,16,13],[21,16,16],[42,16,20],[40,18,18],[34,20,23],
  [14,9,10],[17,15,17],[16,11,12],[47,71,69],[79,36,29],[85,58,61],[104,40,36],[35,22,23],[61,20,27],[14,19,23],[41,18,25],[40,26,33],
  [17,16,14],[13,10,11],[95,86,91],[17,31,29],[13,41,47],[66,97,98],[87,59,66],[45,39,52],[47,43,38],[21,21,28],[48,41,41],[25,15,21],
  [16,16,15],[13,12,13],[10,10,11],[15,14,14],[12,18,23],[15,25,34],[54,114,114],[51,80,92],[11,22,25],[23,50,50],[16,20,21],[20,15,14],
  [11,10,13],[11,11,15],[11,10,14],[15,14,19],[13,10,14],[18,10,13],[22,32,32],[36,109,107],[49,71,87],[27,35,36],[31,31,29],[17,15,15],
  [13,11,13],[13,14,16],[13,12,14],[11,11,13],[25,27,26],[13,11,11],[12,11,10],[15,13,19],[37,64,75],[17,27,27],[14,22,25],[21,24,30],
];

export function pikselSinyalCevir(rgb, gurultu = [0, 0, 0]) {
  const taban = [11, 10, 12];
  return [0, 1, 2].map((i) => Math.max(0, (rgb[i] - taban[i]) / 112 + gurultu[i]));
}

export function sentetikAlanOlustur(G = 96) {
  const rnd = tohumlu(15);
  const gercek = new Float32Array(G * G);
  for (let y = 0; y < G; y++) {
    const ny = y / (G - 1);
    for (let x = 0; x < G; x++) {
      const nx = x / (G - 1);

      const bulut = 0.78 * gaus(nx, 0.38, 0.19) * gaus(ny, 0.45, 0.22);
      const dugum = 0.56 * gaus(nx, 0.68, 0.1) * gaus(ny, 0.56, 0.11);
      const yayEgrisi = 0.48 + 0.16 * Math.sin(nx * 5.2 - 0.8);
      const iplik = 0.44 * gaus(ny, yayEgrisi, 0.042) * gaus(nx, 0.54, 0.32);
      gercek[y * G + x] = sinirla(bulut + dugum + iplik, 0, 1);
    }
  }
  const gurultu = new Float32Array(G * G);
  for (let i = 0; i < G * G; i++) {
    gurultu[i] = (rnd() + rnd() + rnd() - 1.5) * 1.15;
  }
  return { G, gercek, gurultu };
}

export function sentetikDegerlendir(gercek, gurultu, sigma, ofset = 0) {
  const n = gercek.length;
  const kestirim = new Float32Array(n);
  const hata = new Float32Array(n);
  let butunKare = 0;
  let yerelKare = 0;
  let yerelSayi = 0;
  for (let i = 0; i < n; i++) {
    const g = gurultu[(i * 7 + ofset) % n] * sigma;
    const k = Math.max(0, gercek[i] + g);
    const e = k - gercek[i];
    kestirim[i] = k;
    hata[i] = e;
    const e2 = e * e;
    butunKare += e2;
    if (gercek[i] > 0.18) {
      yerelKare += e2;
      yerelSayi++;
    }
  }
  const butunSapma = Math.sqrt(butunKare / n);
  const yerelSapma = yerelSayi > 0 ? Math.sqrt(yerelKare / yerelSayi) : 0;
  return {
    kestirim,
    hata,
    butunOran: sinirla(butunSapma / 0.24, 0, 1),
    yerelOran: sinirla(yerelSapma / 0.24, 0, 1),
  };
}

export function komsulukTabanOlustur(N = 160) {
  const rnd = tohumlu(4);
  const gercek = Array.from(
    { length: N },
    (_, i) => 0.42 * gaus(i, 55, 22) + 0.75 * gaus(i, 112, 2.2) + 0.08,
  );
  const gurultu = Array.from({ length: N }, () => (rnd() + rnd() + rnd() - 1.5) * 0.28);
  return { N, gercek, gurultu };
}

export function bulanik1B(dizi, sg) {
  if (sg < 0.25) return dizi.slice();
  const N = dizi.length;
  const r = Math.ceil(sg * 3);
  return dizi.map((_, i) => {
    let t = 0;
    let w = 0;
    for (let k = -r; k <= r; k++) {
      const j = sinirla(i + k, 0, N - 1);
      const a = gaus(k, 0, sg);
      t += dizi[j] * a;
      w += a;
    }
    return t / w;
  });
}

export function fwhmOlc(sonuc, tabanSeviye) {
  let tepe = 0;
  let tepeI = 112;
  for (let i = 100; i <= 125; i++) {
    if (sonuc[i] > tepe) {
      tepe = sonuc[i];
      tepeI = i;
    }
  }
  const yari = (tepe + tabanSeviye) / 2;
  let a = tepeI;
  while (a > 96 && sonuc[a] > yari) a--;
  let sol = a;
  if (a < tepeI && sonuc[a + 1] !== sonuc[a]) {
    sol = a + (yari - sonuc[a]) / (sonuc[a + 1] - sonuc[a]);
  }
  let b = tepeI;
  while (b < 130 && sonuc[b] > yari) b++;
  let sag = b;
  if (b > tepeI && sonuc[b - 1] !== sonuc[b]) {
    sag = b - 1 + (sonuc[b - 1] - yari) / (sonuc[b - 1] - sonuc[b]);
  }
  return { tepe, tepeI, yari, sol, sag, genislik: Math.max(1, sag - sol) };
}

export function komsulukProfil(lambda, taban = komsulukTabanOlustur()) {
  const lam = sinirla(lambda, 0, 0.3);
  const l = lam / 0.3;
  const { gercek, gurultu } = taban;
  const gurultulu = gercek.map((v, i) => v + gurultu[i] * (1 - l));
  const sonuc = bulanik1B(gurultulu, l * 4.5);
  const tabanSeviye = 0.08 + 0.42 * gaus(112, 55, 22);
  const baz = fwhmOlc(gercek, tabanSeviye);
  const olcum = fwhmOlc(sonuc, tabanSeviye);
  return {
    lambda: lam,
    oran: l,
    sonuc,
    ...olcum,
    bazGenislik: baz.genislik,
    genisleme: olcum.genislik / baz.genislik,
  };
}

function egimYardimcisiKur(kok, egilenEl, maksDerece = 3.8) {
  let kutu = null;
  let hedefRx = 0;
  let hedefRy = 0;
  let rx = 0;
  let ry = 0;
  let sonRx = null;
  let sonRy = null;
  let sonDx = null;
  let sonDy = null;

  const kutuyuAl = () => {
    if (!kutu) kutu = kok.getBoundingClientRect();
    return kutu;
  };
  const sifirlaKutu = () => {
    kutu = null;
  };

  const onEnter = () => {
    kutu = kok.getBoundingClientRect();
  };
  const onMove = (e) => {
    if (e.pointerType === "touch" || azHareket()) return;
    const r = kutuyuAl();
    if (!r.width || !r.height) return;
    const nx = sinirla(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    const ny = sinirla(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
    hedefRy = nx * maksDerece;
    hedefRx = -ny * (maksDerece * 0.85);
  };
  const onLeave = () => {
    hedefRx = 0;
    hedefRy = 0;
  };

  kok.addEventListener("pointerenter", onEnter, { passive: true });
  kok.addEventListener("pointermove", onMove, { passive: true });
  kok.addEventListener("pointerleave", onLeave, { passive: true });
  window.addEventListener("scroll", sifirlaKutu, { passive: true, capture: true });
  window.addEventListener("resize", sifirlaKutu, { passive: true });

  return {
    kutuyuAl,
    sifirlaKutu,
    adim(ekX = 0, ekY = 0) {
      if (azHareket()) return;
      rx += (hedefRx - rx) * 0.1;
      ry += (hedefRy - ry) * 0.1;
      if (Math.abs(hedefRx - rx) < 0.01) rx = hedefRx;
      if (Math.abs(hedefRy - ry) < 0.01) ry = hedefRy;
      const rxs = rx.toFixed(2);
      const rys = ry.toFixed(2);
      const dxs = ekX.toFixed(2);
      const dys = ekY.toFixed(2);

      if (rxs === sonRx && rys === sonRy && dxs === sonDx && dys === sonDy) return;
      sonRx = rxs;
      sonRy = rys;
      sonDx = dxs;
      sonDy = dys;
      egilenEl.style.setProperty("--eg-rx", `${rxs}deg`);
      egilenEl.style.setProperty("--eg-ry", `${rys}deg`);
      egilenEl.style.setProperty("--dx", `${dxs}px`);
      egilenEl.style.setProperty("--dy", `${dys}px`);
    },
    yokEt() {
      kok.removeEventListener("pointerenter", onEnter);
      kok.removeEventListener("pointermove", onMove);
      kok.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", sifirlaKutu, { capture: true });
      window.removeEventListener("resize", sifirlaKutu);
    },
  };
}

function h(tag, sinif, metin) {
  const d = document.createElement(tag);
  if (sinif) d.className = sinif;
  if (metin !== undefined) d.textContent = metin;
  return d;
}

function spektrum(kok) {
  const M = karisimMatrisi();
  const sarmal = h("div", "a1a-sahne sp-sahne");
  const duzlem = h("div", "a1a-duzlem sp-duzlem");
  sarmal.append(duzlem);

  const ust = h("div", "a1a-ust veri");
  const durumYazi = h("span", "sp-durum");
  const ipucu = h("span", "a1a-ipucu", "tarama kılını sürükle");
  ust.append(durumYazi, ipucu);

  const grafikKap = h("div", "sp-grafik");
  grafikKap.setAttribute("tabindex", "0");
  grafikKap.setAttribute("role", "slider");
  grafikKap.setAttribute("aria-label", "Tayf tarama kılı, 400 ile 700 nanometre arası");
  grafikKap.setAttribute("aria-valuemin", "400");
  grafikKap.setAttribute("aria-valuemax", "700");
  grafikKap.setAttribute("aria-valuenow", "656.3");

  const W = 560;
  const H = 248;
  const X0 = 40;
  const X1 = 524;
  const UST = 44;
  const TABAN = 194;
  const YUKS = 132;
  const X = (nm) => nmToX(nm, 400, 700, X0, X1);

  const s = svg(W, H, grafikKap);
  s.setAttribute("class", "sp-svg");

  const defs = el("defs", {}, s);
  const fBloom = el("filter", { id: "sp-bloom", x: "-40%", y: "-40%", width: "180%", height: "180%" }, defs);
  el("feGaussianBlur", { stdDeviation: "4.5", result: "b" }, fBloom);
  const fm = el("feMerge", {}, fBloom);
  el("feMergeNode", { in: "b" }, fm);
  el("feMergeNode", { in: "SourceGraphic" }, fm);

  const fYumusak = el("filter", { id: "sp-yumusak", x: "-50%", y: "-50%", width: "200%", height: "200%" }, defs);
  el("feGaussianBlur", { stdDeviation: "7" }, fYumusak);

  const gTayf = el("linearGradient", { id: "sp-tayf-grad", x1: "0%", y1: "0%", x2: "100%", y2: "0%" }, defs);
  [
    ["0%", "#4e49a8", "0"],
    ["10%", "#6979e6", "0.42"],
    ["28.7%", "#8aa2ff", "0.68"],
    ["33.6%", "#45d6c8", "0.75"],
    ["52%", "#66be90", "0.38"],
    ["68%", "#e0a26a", "0.45"],
    ["85.4%", "#ff4f61", "0.82"],
    ["96%", "#b82c44", "0.35"],
    ["100%", "#8a1e33", "0"],
  ].forEach(([o, c, op]) => el("stop", { offset: o, "stop-color": c, "stop-opacity": op }, gTayf));

  const gYarikMaske = el("linearGradient", { id: "sp-yarik-dikey", x1: "0%", y1: "0%", x2: "0%", y2: "100%" }, defs);
  el("stop", { offset: "0%", "stop-color": "#fff", "stop-opacity": "0" }, gYarikMaske);
  el("stop", { offset: "72%", "stop-color": "#fff", "stop-opacity": "0.18" }, gYarikMaske);
  el("stop", { offset: "100%", "stop-color": "#fff", "stop-opacity": "0.85" }, gYarikMaske);

  for (const k of KANALLAR) {
    const gr = el("linearGradient", { id: `sp-alan-${k.ad}`, x1: "0%", y1: "0%", x2: "0%", y2: "100%" }, defs);
    el("stop", { offset: "0%", "stop-color": k.renk, "stop-opacity": "0.18" }, gr);
    el("stop", { offset: "100%", "stop-color": k.renk, "stop-opacity": "0" }, gr);
  }

  el("rect", { x: X0, y: TABAN - 26, width: X1 - X0, height: 26, fill: "url(#sp-tayf-grad)", opacity: "0.24", filter: "url(#sp-yumusak)" }, s);
  el("rect", { x: X0, y: TABAN - 3, width: X1 - X0, height: 3, fill: "url(#sp-tayf-grad)", opacity: "0.9" }, s);

  for (let nm = 400; nm <= 700; nm += 50) {
    const x = X(nm);
    el("line", { x1: x, x2: x, y1: UST + 10, y2: TABAN, stroke: "rgba(236,232,225,0.05)", "stroke-width": 1 }, s);
    el("line", { x1: x, x2: x, y1: TABAN, y2: TABAN + 5, stroke: RENK.isik4 }, s);
    el("text", { x, y: TABAN + 19, "text-anchor": "middle", class: "zayif", metin: nm }, s);
  }
  el("line", { x1: X0, x2: X1, y1: TABAN, y2: TABAN, stroke: "rgba(236,232,225,0.22)" }, s);
  el("text", { x: X1, y: TABAN + 36, "text-anchor": "end", class: "zayif", metin: "dalga boyu · nm" }, s);

  const egriOgeleri = {};
  for (const k of KANALLAR) {
    let dCizgi = "";
    for (let nm = 400; nm <= 700; nm += 2.5) {
      dCizgi += `${nm === 400 ? "M" : "L"}${X(nm).toFixed(1)} ${(TABAN - kameraYanit(k, nm) * YUKS).toFixed(1)}`;
    }
    const dAlan = `${dCizgi} L${X1} ${TABAN} L${X0} ${TABAN} Z`;
    const g = el("g", { class: `sp-egri sp-egri-${k.ad}` }, s);
    const alan = el("path", { d: dAlan, fill: `url(#sp-alan-${k.ad})`, opacity: "0.45" }, g);
    const parilti = el("path", { d: dCizgi, fill: "none", stroke: k.renk, "stroke-width": 3.5, opacity: "0.14", filter: "url(#sp-yumusak)" }, g);
    const hat = el("path", { d: dCizgi, fill: "none", stroke: k.renk, "stroke-dasharray": "4 3", "stroke-width": 1.25, opacity: "0.52" }, g);
    const etiket = el("text", { x: X(k.m), y: TABAN - k.p * YUKS - 8, "text-anchor": "middle", fill: k.renk, opacity: "0.68", metin: k.ad }, g);
    egriOgeleri[k.ad] = { alan, parilti, hat, etiket };
  }

  const cizgiOgeleri = EMISYON_CIZGILER.map((c) => {
    const cx = X(c.nm);
    const ustY = UST + (1 - c.boy) * 96;
    const g = el("g", { class: "sp-cizgi", "data-cizgi": c.id }, s);
    const hale = el("line", { x1: cx, x2: cx, y1: TABAN, y2: ustY, stroke: c.renk, "stroke-width": 6, opacity: "0.28", filter: "url(#sp-yumusak)" }, g);
    const oz = el("line", { x1: cx, x2: cx, y1: TABAN, y2: ustY, stroke: c.renk, "stroke-width": 1.9, opacity: "0.85" }, g);
    const nokta = el("circle", { cx, cy: ustY, r: 3.1, fill: c.renk, filter: "url(#sp-bloom)" }, g);

    let etiket = null;
    if (c.id === "oiii2") {
      etiket = el("text", { x: cx - 5, y: ustY - 8, "text-anchor": "end", fill: c.renk, opacity: "0", class: "sp-cizgi-etiket", metin: "495.9" }, g);
    } else {
      const dx = c.id === "hb" ? -7 : c.id === "oiii" ? 8 : 0;
      const anchor = c.id === "hb" ? "end" : c.id === "oiii" ? "start" : "middle";
      etiket = el("text", { x: cx + dx, y: UST - 13, "text-anchor": anchor, fill: c.renk, class: "sp-cizgi-etiket", metin: `${c.ad} ${c.nm}` }, g);
    }
    return { c, g, hale, oz, nokta, etiket, cx, ustY };
  });

  const darbeHalka = el("circle", { cx: X(656.3), cy: 120, r: 0, fill: "none", stroke: RENK.ha, "stroke-width": 1.6, opacity: "0" }, s);

  const kilGrup = el("g", { class: "sp-kil" }, s);
  const kilHale = el("line", { y1: UST - 4, y2: TABAN + 4, "stroke-width": 7, opacity: "0.26", filter: "url(#sp-yumusak)" }, kilGrup);
  const kilHat = el("line", { y1: UST - 6, y2: TABAN + 6, "stroke-width": 1.35, opacity: "0.95" }, kilGrup);
  const kilUst = el("polygon", { points: "0,-5 4.5,0 0,5 -4.5,0", filter: "url(#sp-bloom)" }, kilGrup);
  const kilAlt = el("circle", { r: 3.5, fill: RENK.isik }, kilGrup);
  const kilEtiketG = el("g", { class: "sp-kil-rozet" }, kilGrup);
  const kilEtiketArka = el("rect", { x: -34, y: TABAN + 10, width: 68, height: 18, rx: 2, fill: "rgba(9,11,16,0.88)", stroke: "rgba(236,232,225,0.22)", "stroke-width": 0.9 }, kilEtiketG);
  const kilEtiketYazi = el("text", { x: 0, y: TABAN + 22, "text-anchor": "middle", fill: RENK.isik, metin: "656.3 nm" }, kilEtiketG);

  const kesisimNoktalari = {};
  for (const k of KANALLAR) {
    const cg = el("g", {}, kilGrup);
    const halka = el("circle", { r: 7, fill: "none", stroke: k.renk, "stroke-width": 1, opacity: "0.45" }, cg);
    const ic = el("circle", { r: 3.4, fill: k.renk, filter: "url(#sp-bloom)" }, cg);
    kesisimNoktalari[k.ad] = { halka, ic };
  }

  const alt = h("div", "sp-alt");

  const solBilgi = h("div", "sp-bilgi");
  const rgbOkuma = h("div", "sp-rgb veri");
  const rgbBarlar = {};
  for (const k of [KANALLAR[2], KANALLAR[1], KANALLAR[0]]) {
    const satir = h("div", "sp-rgb-satir");
    satir.style.setProperty("--c", k.renk);
    const ad = h("b", "", k.ad);
    const ray = h("span", "sp-rgb-ray");
    const ic = document.createElement("i");
    ray.append(ic);
    const deger = h("span", "sp-rgb-sayi", "0.00");
    satir.append(ad, ray, deger);
    rgbOkuma.append(satir);
    rgbBarlar[k.ad] = { satir, ic, deger };
  }
  const notlar = h("div", "sp-notlar veri");
  notlar.append(
    h("span", "sp-formul", "RGB ≈ M · x"),
    h("span", "sp-etiket", "M · kamera × filtre"),
    h("span", "sp-temsili", "temsilî değerler"),
  );
  solBilgi.append(rgbOkuma, notlar);

  const matrisKap = h("div", "sp-matris veri");
  matrisKap.setAttribute("aria-label", "3 çarpı 3 temsilî karışım matrisi M");
  const matrisUst = h("div", "sp-m-basliklar");
  matrisUst.append(h("span", "sp-m-kose", "M"));
  const sutunBaslikEl = SUTUN_CIZGILER.map((c, j) => {
    const b = h("button", "sp-m-sutun-btn", c.ad);
    b.type = "button";
    b.style.setProperty("--c", c.renk);
    b.title = `${c.ad} (${c.nm} nm) çizgisine git`;
    b.addEventListener("click", () => {
      etkilesimOldu = true;
      ipucu.classList.add("sakin");
      hedefNm = c.nm;
      if (azHareket()) {
        mevcutNm = c.nm;
        ciz();
      }
    });
    matrisUst.append(b);
    return b;
  });

  const matrisGovde = h("div", "sp-m-izgara");
  const matrisHucreler = [];
  const satirAdlar = [
    { ad: "R", renk: KANALLAR[2].renk },
    { ad: "G", renk: KANALLAR[1].renk },
    { ad: "B", renk: KANALLAR[0].renk },
  ];
  satirAdlar.forEach((sat, i) => {
    const satEt = h("span", "sp-m-satir", sat.ad);
    satEt.style.setProperty("--c", sat.renk);
    matrisGovde.append(satEt);
    for (let j = 0; j < 3; j++) {
      const c = SUTUN_CIZGILER[j];
      const v = M[i][j];
      const yogunluk = sinirla(v / 0.72, 0, 1);
      const hucre = h("div", "sp-m-hucre");
      hucre.style.setProperty("--c", c.renk);
      hucre.style.setProperty("--y", yogunluk.toFixed(3));
      const sayi = h("span", "", v.toFixed(2));
      hucre.append(sayi);
      matrisGovde.append(hucre);
      matrisHucreler.push({ el: hucre, i, j, v });
    }
  });
  matrisKap.append(matrisUst, matrisGovde);

  alt.append(solBilgi, matrisKap);
  duzlem.append(ust, grafikKap, alt);
  kok.append(sarmal);

  const az = azHareket();
  let mevcutNm = az ? 656.3 : 616;
  let hedefNm = 656.3;
  let surukleniyor = false;
  let etkilesimOldu = false;
  let ilkGirisBitti = az;
  let sonCizilenNm = -1;
  let darbeDurum = null;
  let grafikKutu = null;

  const egim = egimYardimcisiKur(sarmal, duzlem, 3.6);

  const clientXToNm = (clientX) => {
    if (!grafikKutu) grafikKutu = s.getBoundingClientRect();
    if (!grafikKutu.width) return hedefNm;
    const svgX = ((clientX - grafikKutu.left) / grafikKutu.width) * W;
    return xToNm(svgX, 400, 700, X0, X1);
  };

  const onDown = (e) => {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse") return;
    grafikKutu = s.getBoundingClientRect();
    surukleniyor = true;
    etkilesimOldu = true;
    ilkGirisBitti = true;
    ipucu.classList.add("sakin");
    grafikKap.classList.add("surukleniyor");
    grafikKap.setPointerCapture?.(e.pointerId);
    const t = tutunNm(clientXToNm(e.clientX));
    hedefNm = t.nm;
    if (azHareket()) {
      mevcutNm = hedefNm;
      ciz();
    }
  };
  const onMove = (e) => {
    if (!surukleniyor) return;
    const t = tutunNm(clientXToNm(e.clientX));
    hedefNm = t.nm;
    if (azHareket()) {
      mevcutNm = hedefNm;
      ciz();
    }
  };
  const onUp = () => {
    if (!surukleniyor) return;
    surukleniyor = false;
    grafikKap.classList.remove("surukleniyor");
  };
  const onKey = (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    etkilesimOldu = true;
    ilkGirisBitti = true;
    ipucu.classList.add("sakin");
    const adim = e.shiftKey ? 15 : 5;
    const ham = sinirla(hedefNm + (e.key === "ArrowRight" ? adim : -adim), 400, 700);
    hedefNm = tutunNm(ham).nm;
    if (azHareket()) {
      mevcutNm = hedefNm;
      ciz();
    }
  };
  const kutuTemizle = () => {
    grafikKutu = null;
  };

  grafikKap.addEventListener("pointerdown", onDown);
  grafikKap.addEventListener("pointermove", onMove);
  grafikKap.addEventListener("pointerup", onUp);
  grafikKap.addEventListener("pointercancel", onUp);
  grafikKap.addEventListener("keydown", onKey);
  window.addEventListener("resize", kutuTemizle, { passive: true });
  window.addEventListener("scroll", kutuTemizle, { passive: true, capture: true });

  function ciz(darbeNmSapma = 0) {
    const nm = sinirla(mevcutNm + darbeNmSapma, 400, 700);
    const tut = tutunNm(nm);
    const aktifRenk = tut.cizgi ? tut.cizgi.renk : dalgaBoyuRenk(nm);
    const kx = X(nm);

    kilHale.setAttribute("x1", kx.toFixed(1));
    kilHale.setAttribute("x2", kx.toFixed(1));
    kilHale.setAttribute("stroke", aktifRenk);
    kilHat.setAttribute("x1", kx.toFixed(1));
    kilHat.setAttribute("x2", kx.toFixed(1));
    kilHat.setAttribute("stroke", aktifRenk);
    kilUst.setAttribute("transform", `translate(${kx.toFixed(1)} ${UST - 6})`);
    kilUst.setAttribute("fill", aktifRenk);
    kilAlt.setAttribute("cx", kx.toFixed(1));
    kilAlt.setAttribute("cy", TABAN);
    kilAlt.setAttribute("fill", aktifRenk);

    const rozetX = sinirla(kx, X0 + 36, X1 - 36);
    kilEtiketG.setAttribute("transform", `translate(${rozetX.toFixed(1)} 0)`);
    kilEtiketArka.setAttribute("stroke", aktifRenk);
    kilEtiketYazi.textContent = `${nm.toFixed(1)} nm`;

    for (const k of KANALLAR) {
      const yVal = kameraYanit(k, nm);
      const cy = TABAN - yVal * YUKS;
      const n = kesisimNoktalari[k.ad];
      n.halka.setAttribute("cx", kx.toFixed(1));
      n.halka.setAttribute("cy", cy.toFixed(1));
      n.halka.setAttribute("r", (4.5 + yVal * 5).toFixed(1));
      n.halka.setAttribute("opacity", (0.15 + yVal * 0.65).toFixed(2));
      n.ic.setAttribute("cx", kx.toFixed(1));
      n.ic.setAttribute("cy", cy.toFixed(1));
      n.ic.setAttribute("r", (2.2 + yVal * 2.4).toFixed(1));

      const eo = egriOgeleri[k.ad];
      eo.hat.setAttribute("opacity", (0.34 + yVal * 0.62).toFixed(2));
      eo.parilti.setAttribute("opacity", (0.08 + yVal * 0.36).toFixed(2));
      eo.alan.setAttribute("opacity", (0.25 + yVal * 0.55).toFixed(2));

      const bar = rgbBarlar[k.ad];
      bar.ic.style.transform = `scaleX(${sinirla(yVal, 0, 1).toFixed(3)})`;
      bar.deger.textContent = yVal.toFixed(2);
      bar.satir.classList.toggle("parlak", yVal > 0.28);
    }

    for (const o of cizgiOgeleri) {
      const secili = tut.cizgi?.id === o.c.id;
      o.hale.setAttribute("opacity", secili ? "0.78" : "0.22");
      o.oz.setAttribute("stroke-width", secili ? "2.6" : "1.6");
      o.oz.setAttribute("opacity", secili ? "1" : "0.62");
      o.nokta.setAttribute("r", secili ? "4.3" : "2.7");
      if (o.c.id === "oiii2") {
        o.etiket.setAttribute("opacity", secili ? "0.98" : "0");
      } else {
        o.etiket.setAttribute("opacity", secili ? "1" : "0.65");
      }
    }

    sutunBaslikEl.forEach((b, j) => b.classList.toggle("aktif", tut.sutun === j));
    for (const hcr of matrisHucreler) {
      hcr.el.classList.toggle("aktif", tut.sutun === hcr.j);
      hcr.el.classList.toggle("soluk", tut.sutun !== -1 && tut.sutun !== hcr.j);
    }

    if (tut.cizgi) {
      durumYazi.innerHTML = `<b style="color:${tut.cizgi.renk}">${tut.cizgi.ad}</b> · ${tut.cizgi.nm.toFixed(1)} nm · M sütunu aydınlandı`;
    } else {
      durumYazi.innerHTML = `<b style="color:${aktifRenk}">${nm.toFixed(1)} nm</b> · serbest tarama`;
    }
    grafikKap.setAttribute("aria-valuenow", nm.toFixed(1));
    sonCizilenNm = nm;
  }

  ciz();

  return {
    adim(t) {
      if (azHareket()) {
        mevcutNm = hedefNm;
        if (Math.abs(mevcutNm - sonCizilenNm) > 0.01) ciz();
        return;
      }

      if (!ilkGirisBitti && !etkilesimOldu) {
        const p = sinirla(t / 0.85, 0, 1);
        const e = 1 - Math.pow(1 - p, 3);
        mevcutNm = 616 + (656.3 - 616) * e;
        if (p >= 1) {
          mevcutNm = 656.3;
          ilkGirisBitti = true;
        }
      } else {
        mevcutNm += (hedefNm - mevcutNm) * (surukleniyor ? 0.36 : 0.16);
        if (Math.abs(hedefNm - mevcutNm) < 0.04) mevcutNm = hedefNm;
      }

      let dx = 0;
      let dy = 0;
      let nmSapma = 0;
      if (darbeDurum) {
        const dt = performance.now() / 1000 - darbeDurum.t0;
        if (dt > 0.5) {
          darbeDurum = null;
          darbeHalka.setAttribute("opacity", "0");
        } else {
          const sonum = Math.exp(-dt * 7.5);
          const tit = sonum * Math.cos(dt * 30);
          dx = darbeDurum.nx * tit * 6;
          dy = darbeDurum.ny * tit * 4.5;
          nmSapma = darbeDurum.nx * tit * 7.5;
          darbeHalka.setAttribute("cx", darbeDurum.sx.toFixed(1));
          darbeHalka.setAttribute("cy", darbeDurum.sy.toFixed(1));
          darbeHalka.setAttribute("r", (12 + dt * 190).toFixed(1));
          darbeHalka.setAttribute("opacity", (sonum * 0.72).toFixed(2));
        }
      }

      egim.adim(dx, dy);
      if (Math.abs(mevcutNm + nmSapma - sonCizilenNm) > 0.03 || darbeDurum) {
        ciz(nmSapma);
      }
    },

    darbe(x, y, nx, ny) {
      if (azHareket()) return;
      const r = s.getBoundingClientRect();
      const sx = r.width ? sinirla(((x - r.left) / r.width) * W, 30, W - 30) : X(mevcutNm);
      const sy = r.height ? sinirla(((y - r.top) / r.height) * H, 30, H - 30) : 120;
      darbeDurum = { t0: performance.now() / 1000, nx: nx || 1, ny: ny || 0, sx, sy };
      darbeHalka.setAttribute("stroke", dalgaBoyuRenk(mevcutNm));
    },

    yokEt() {
      egim.yokEt();
      grafikKap.removeEventListener("pointerdown", onDown);
      grafikKap.removeEventListener("pointermove", onMove);
      grafikKap.removeEventListener("pointerup", onUp);
      grafikKap.removeEventListener("pointercancel", onUp);
      grafikKap.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", kutuTemizle);
      window.removeEventListener("scroll", kutuTemizle, { capture: true });
    },
  };
}

function piksel(kok) {
  const S = 12;
  const Y = 8;
  const M = karisimMatrisi();
  const rnd = tohumlu(2026);
  const MERKEZ_X = 5;
  const MERKEZ_Y = 3;

  const hamPikseller = VEIL_YEDEK_12X8.map((p) => p.slice());

  const sarmal = h("div", "a1a-sahne pk-sahne");
  const duzlem = h("div", "a1a-duzlem pk-duzlem");
  sarmal.append(duzlem);

  const ust = h("div", "pk-ust veri");
  const bulucuKap = h("div", "pk-bulucu");
  const bulucuTuval = document.createElement("canvas");
  bulucuTuval.width = 96;
  bulucuTuval.height = 76;
  bulucuTuval.className = "pk-bulucu-tuval";
  bulucuTuval.setAttribute("aria-hidden", "true");
  const bulucuYazi = h("div", "pk-bulucu-yazi");
  bulucuYazi.append(
    h("span", "pk-bulucu-ad", "PEÇE · 12×8 BÜYÜTME"),
    h("span", "pk-bulucu-alt", "gerçek Peçe yayından"),
  );
  bulucuKap.append(bulucuTuval, bulucuYazi);

  const ustSag = h("div", "pk-ust-sag");
  const kosulEl = h("span", "pk-kosul", "x ≥ 0");
  const ipucu = h("span", "a1a-ipucu", "piksele gel · basılı tut");
  ustSag.append(kosulEl, ipucu);
  ust.append(bulucuKap, ustSag);

  const izgaraKap = h("div", "pk-izgara");
  izgaraKap.setAttribute("tabindex", "0");
  izgaraKap.setAttribute("role", "application");
  izgaraKap.setAttribute("aria-label", "Peçe bulutsusundan 12 çarpı 8 piksel ızgarası; seçmek için gezin, gürültü eklemek için basılı tutun");

  const tuval = document.createElement("canvas");
  const TW = 576;
  const TH = 384;
  tuval.width = TW;
  tuval.height = TH;
  tuval.className = "pk-tuval";
  const ctx = tuval.getContext("2d");

  const arkaTuval = document.createElement("canvas");
  arkaTuval.width = TW;
  arkaTuval.height = TH;
  const arkaCtx = arkaTuval.getContext("2d");
  let arkaHazir = false;

  izgaraKap.append(tuval);

  const okumaKap = h("div", "pk-okuma veri");
  const okumaUst = h("div", "pk-okuma-ust");
  const pikselBilgi = h("span", "pk-piksel-bilgi");
  const nnlsEtiket = h("span", "pk-nnls-etiket", "temsilî NNLS (x ≥ 0)");
  okumaUst.append(pikselBilgi, nnlsEtiket);

  const cubuklarKap = h("div", "pk-cubuklar");
  const bilesenMeta = [
    { id: "ha", ad: "Hα", renk: CIZGI.ha.renk },
    { id: "oiii", ad: "[O III]", renk: CIZGI.oiii.renk },
    { id: "hb", ad: "Hβ", renk: CIZGI.hb.renk },
  ];
  const cubukOgeleri = bilesenMeta.map((b) => {
    const satir = h("div", "pk-cubuk-satir");
    satir.style.setProperty("--c", b.renk);
    const ad = h("b", "", b.ad);
    const ray = h("span", "pk-cubuk-ray");
    const temizIz = h("span", "pk-cubuk-temiz");
    const dolgu = document.createElement("i");
    const kirpRozet = h("span", "pk-kirp-not", "x ≥ 0");
    ray.append(temizIz, dolgu);
    const deger = h("span", "pk-cubuk-sayi", "0.00");
    satir.append(ad, ray, deger, kirpRozet);
    cubuklarKap.append(satir);
    return { satir, temizIz, dolgu, deger, kirpRozet };
  });

  const altNot = h("p", "pk-alt-not", "Her piksel tek başına çözülür. Komşusunun ne olduğunu bilmez.");
  okumaKap.append(okumaUst, cubuklarKap, altNot);

  duzlem.append(ust, izgaraKap, okumaKap);
  kok.append(sarmal);

  function bulucuCiz(img) {
    const bc = bulucuTuval.getContext("2d");
    const [kx, ky, kg, kh] = VEIL_KIRP;
    bc.clearRect(0, 0, bulucuTuval.width, bulucuTuval.height);
    if (img) {
      bc.drawImage(
        img,
        kx * img.naturalWidth,
        ky * img.naturalHeight,
        kg * img.naturalWidth,
        kh * img.naturalHeight,
        0,
        0,
        bulucuTuval.width,
        bulucuTuval.height,
      );

      const [yx, yy, yg, yh] = VEIL_YAY_KIRP;
      const rx = ((yx - kx) / kg) * bulucuTuval.width;
      const ry = ((yy - ky) / kh) * bulucuTuval.height;
      const rw = (yg / kg) * bulucuTuval.width;
      const rh = (yh / kh) * bulucuTuval.height;
      bc.strokeStyle = "rgba(255, 79, 97, 0.92)";
      bc.lineWidth = 1.25;
      bc.strokeRect(rx, ry, rw, rh);
    }
  }

  function ornekleVeil(img) {
    const [yx, yy, yg, yh] = VEIL_YAY_KIRP;
    const sx = Math.round(yx * img.naturalWidth);
    const sy = Math.round(yy * img.naturalHeight);
    const sg = Math.max(S, Math.round(yg * img.naturalWidth));
    const sh = Math.max(Y, Math.round(yh * img.naturalHeight));

    const gecici = document.createElement("canvas");
    gecici.width = sg;
    gecici.height = sh;
    const gc = gecici.getContext("2d", { willReadFrequently: true });
    gc.drawImage(img, sx, sy, sg, sh, 0, 0, sg, sh);
    const veri = gc.getImageData(0, 0, sg, sh).data;

    for (let gy = 0; gy < Y; gy++) {
      const py0 = Math.floor((gy * sh) / Y);
      const py1 = Math.max(py0 + 1, Math.floor(((gy + 1) * sh) / Y));
      for (let gx = 0; gx < S; gx++) {
        const px0 = Math.floor((gx * sg) / S);
        const px1 = Math.max(px0 + 1, Math.floor(((gx + 1) * sg) / S));
        const rs = [];
        const gs = [];
        const bs = [];
        for (let py = py0; py < py1; py++) {
          for (let px = px0; px < px1; px++) {
            const p = (py * sg + px) * 4;
            rs.push(veri[p]);
            gs.push(veri[p + 1]);
            bs.push(veri[p + 2]);
          }
        }
        rs.sort((a, b) => a - b);
        gs.sort((a, b) => a - b);
        bs.sort((a, b) => a - b);
        const k = Math.min(rs.length - 1, Math.floor(rs.length * 0.8));
        hamPikseller[gy * S + gx] = [rs[k], gs[k], bs[k]];
      }
    }

    arkaCtx.clearRect(0, 0, TW, TH);
    arkaCtx.save();
    arkaCtx.filter = "blur(10px) saturate(1.45) brightness(1.4)";
    arkaCtx.drawImage(gecici, 0, 0, TW, TH);
    arkaCtx.restore();
    arkaHazir = true;

    bulucuCiz(img);
    kirli = true;
    if (azHareket()) ciz(0);
  }

  {
    const bc = bulucuTuval.getContext("2d");
    const gr = bc.createRadialGradient(24, 56, 4, 48, 38, 46);
    gr.addColorStop(0, "rgba(255, 79, 97, 0.42)");
    gr.addColorStop(0.5, "rgba(69, 214, 200, 0.24)");
    gr.addColorStop(1, "rgba(7, 8, 11, 0)");
    bc.fillStyle = gr;
    bc.fillRect(0, 0, bulucuTuval.width, bulucuTuval.height);
    const [kx, ky, kg, kh] = VEIL_KIRP;
    const [yx, yy, yg, yh] = VEIL_YAY_KIRP;
    bc.strokeStyle = "rgba(255, 79, 97, 0.9)";
    bc.lineWidth = 1.25;
    bc.strokeRect(
      ((yx - kx) / kg) * bulucuTuval.width,
      ((yy - ky) / kh) * bulucuTuval.height,
      (yg / kg) * bulucuTuval.width,
      (yh / kh) * bulucuTuval.height,
    );
  }

  const veilImg = new Image();
  veilImg.decoding = "async";
  veilImg.onload = () => ornekleVeil(veilImg);
  veilImg.src = "/assets/img/gozlem/veil-1000.jpg";
  if (veilImg.complete && veilImg.naturalWidth > 0) ornekleVeil(veilImg);

  let aktifX = MERKEZ_X;
  let aktifY = MERKEZ_Y;
  let basili = false;
  let dokunmaZamanlayici = 0;
  let dokunmaBaslangic = null;
  let gurultuGucu = 0;
  let aktifGurultu = [0, 0, 0];
  let sonGurultuAdim = -1;
  const baslangicCoz = nnls3(M, pikselSinyalCevir(hamPikseller[MERKEZ_Y * S + MERKEZ_X]));
  let gosterilenX = baslangicCoz.x.slice();
  let kirli = true;
  let ilkNefes = !azHareket();
  let darbeDurum = null;
  let izgaraKutu = null;

  const egim = egimYardimcisiKur(sarmal, duzlem, 3.6);

  const hucreBul = (clientX, clientY) => {
    if (!izgaraKutu) izgaraKutu = izgaraKap.getBoundingClientRect();
    if (!izgaraKutu.width || !izgaraKutu.height) return null;
    const gx = sinirla(Math.floor(((clientX - izgaraKutu.left) / izgaraKutu.width) * S), 0, S - 1);
    const gy = sinirla(Math.floor(((clientY - izgaraKutu.top) / izgaraKutu.height) * Y), 0, Y - 1);
    return { gx, gy };
  };

  const yeniGurultuUret = (guc) => {

    const r = (rnd() - 0.5) * 1.15 * guc;
    const g = (rnd() - 0.5) * 1.25 * guc;
    const b = (rnd() - 0.5) * 1.25 * guc;
    return [r, g, b];
  };

  const gurultuBaslat = () => {
    basili = true;
    ipucu.classList.add("sakin");
    izgaraKap.classList.add("gurultulu");
    if (azHareket()) {
      gurultuGucu = 0.62;
      aktifGurultu = [0.28, -0.34, 0.36];
      ciz(0);
    }
  };

  const gurultuBitir = () => {
    if (dokunmaZamanlayici) {
      clearTimeout(dokunmaZamanlayici);
      dokunmaZamanlayici = 0;
    }
    dokunmaBaslangic = null;
    if (!basili) return;
    basili = false;
    izgaraKap.classList.remove("gurultulu");
    if (azHareket()) {
      gurultuGucu = 0;
      aktifGurultu = [0, 0, 0];
      ciz(0);
    }
  };

  const onEnter = () => {
    izgaraKutu = izgaraKap.getBoundingClientRect();
  };
  const onMove = (e) => {
    if (e.pointerType === "touch") {
      if (dokunmaBaslangic) {
        const dist = Math.hypot(e.clientX - dokunmaBaslangic.x, e.clientY - dokunmaBaslangic.y);
        if (dist > 10 && dokunmaZamanlayici) {
          clearTimeout(dokunmaZamanlayici);
          dokunmaZamanlayici = 0;
        }
      }
      if (!basili) return;
    }
    const hcr = hucreBul(e.clientX, e.clientY);
    if (!hcr) return;
    if (hcr.gx !== aktifX || hcr.gy !== aktifY) {
      aktifX = hcr.gx;
      aktifY = hcr.gy;
      ilkNefes = false;
      kirli = true;
      if (azHareket()) ciz(0);
    }
  };
  const onDown = (e) => {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse") return;
    izgaraKutu = izgaraKap.getBoundingClientRect();
    ilkNefes = false;
    const hcr = hucreBul(e.clientX, e.clientY);
    if (hcr) {
      aktifX = hcr.gx;
      aktifY = hcr.gy;
      kirli = true;
    }
    if (e.pointerType === "touch") {

      dokunmaBaslangic = { x: e.clientX, y: e.clientY };
      if (azHareket()) ciz(0);
      clearTimeout(dokunmaZamanlayici);
      dokunmaZamanlayici = setTimeout(() => {
        dokunmaZamanlayici = 0;
        gurultuBaslat();
      }, 170);
    } else {
      izgaraKap.setPointerCapture?.(e.pointerId);
      gurultuBaslat();
    }
  };
  const onKey = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!basili) gurultuBaslat();
      return;
    }
    const yon = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!yon) return;
    e.preventDefault();
    ilkNefes = false;
    ipucu.classList.add("sakin");
    aktifX = sinirla(aktifX + yon[0], 0, S - 1);
    aktifY = sinirla(aktifY + yon[1], 0, Y - 1);
    kirli = true;
    if (azHareket()) ciz(0);
  };
  const onKeyUp = (e) => {
    if (e.key === " " || e.key === "Enter") gurultuBitir();
  };
  const kutuTemizle = () => {
    izgaraKutu = null;
  };

  izgaraKap.addEventListener("pointerenter", onEnter, { passive: true });
  izgaraKap.addEventListener("pointermove", onMove, { passive: true });
  izgaraKap.addEventListener("pointerdown", onDown);
  izgaraKap.addEventListener("pointerup", gurultuBitir);
  izgaraKap.addEventListener("pointercancel", gurultuBitir);
  izgaraKap.addEventListener("pointerleave", gurultuBitir);
  izgaraKap.addEventListener("keydown", onKey);
  izgaraKap.addEventListener("keyup", onKeyUp);
  window.addEventListener("resize", kutuTemizle, { passive: true });
  window.addEventListener("scroll", kutuTemizle, { passive: true, capture: true });

  const hucreStil = (rgb) => {
    const ger = (v, taban) => Math.pow(sinirla((v - taban) / 118, 0, 1), 0.78);
    const rr = ger(rgb[0], 9);
    const gg = ger(rgb[1], 8);
    const bb = ger(rgb[2], 10);
    const maks = Math.max(rr, gg, bb);
    const a = 0.16 + maks * 0.82;
    const r = Math.round(18 + rr * 237);
    const g = Math.round(20 + gg * 214);
    const b = Math.round(28 + bb * 227);
    return { r, g, b, a, maks };
  };

  function ciz(t) {
    const cw = TW / S;
    const ch = TH / Y;
    ctx.clearRect(0, 0, TW, TH);

    if (arkaHazir) {
      ctx.save();
      ctx.globalAlpha = 0.24;
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(arkaTuval, 0, 0);
      ctx.restore();
    }

    const aktifIndeks = aktifY * S + aktifX;
    const hamAktif = hamPikseller[aktifIndeks];

    for (let gy = 0; gy < Y; gy++) {
      for (let gx = 0; gx < S; gx++) {
        const idx = gy * S + gx;
        const aktifMi = gx === aktifX && gy === aktifY;
        const komsuMu = !aktifMi && Math.abs(gx - aktifX) <= 1 && Math.abs(gy - aktifY) <= 1;
        let rgb = hamPikseller[idx];
        if (aktifMi && gurultuGucu > 0.01) {
          rgb = [
            sinirla(rgb[0] + aktifGurultu[0] * 145, 0, 255),
            sinirla(rgb[1] + aktifGurultu[1] * 145, 0, 255),
            sinirla(rgb[2] + aktifGurultu[2] * 145, 0, 255),
          ];
        }
        const st = hucreStil(rgb);
        const x = gx * cw + 2;
        const y = gy * ch + 2;
        const w = cw - 4;
        const hBox = ch - 4;

        if (st.maks > 0.24 || aktifMi) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          const gxM = gx * cw + cw / 2;
          const gyM = gy * ch + ch / 2;
          const rad = ctx.createRadialGradient(gxM, gyM, 2, gxM, gyM, cw * (aktifMi ? 1.05 : 0.78));
          rad.addColorStop(0, `rgba(${st.r},${st.g},${st.b},${(aktifMi ? 0.42 : st.maks * 0.26).toFixed(2)})`);
          rad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = rad;
          ctx.fillRect(gxM - cw, gyM - ch, cw * 2, ch * 2);
          ctx.restore();
        }

        ctx.fillStyle = `rgba(${st.r},${st.g},${st.b},${st.a.toFixed(2)})`;
        ctx.fillRect(x, y, w, hBox);

        ctx.strokeStyle = komsuMu
          ? "rgba(236,232,225,0.14)"
          : "rgba(236,232,225,0.065)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, hBox - 1);

        if (komsuMu && gurultuGucu > 0.04) {
          ctx.save();
          ctx.strokeStyle = `rgba(224, 162, 106, ${(gurultuGucu * 0.35).toFixed(2)})`;
          ctx.setLineDash([2, 3]);
          ctx.strokeRect(x + 2.5, y + 2.5, w - 5, hBox - 5);
          ctx.restore();
        }
      }
    }

    if (darbeDurum) {
      const dt = performance.now() / 1000 - darbeDurum.t0;
      if (dt < 0.48) {
        const sonum = Math.exp(-dt * 7);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = `rgba(69, 214, 200, ${(sonum * 0.65).toFixed(2)})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(darbeDurum.cx, darbeDurum.cy, 12 + dt * 210, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    const ax = aktifX * cw;
    const ay = aktifY * ch;
    const nefes = ilkNefes && !azHareket() ? 0.5 + 0.5 * Math.sin(t * 2.6) : 0;
    const cLen = 9;
    ctx.save();
    ctx.strokeStyle = gurultuGucu > 0.08 ? RENK.toz : RENK.isik;
    ctx.lineWidth = 1.8;
    ctx.shadowColor = gurultuGucu > 0.08 ? RENK.toz : "rgba(236,232,225,0.65)";
    ctx.shadowBlur = 8 + nefes * 6;
    ctx.beginPath();

    ctx.moveTo(ax, ay + cLen); ctx.lineTo(ax, ay); ctx.lineTo(ax + cLen, ay);
    ctx.moveTo(ax + cw - cLen, ay); ctx.lineTo(ax + cw, ay); ctx.lineTo(ax + cw, ay + cLen);
    ctx.moveTo(ax + cw, ay + ch - cLen); ctx.lineTo(ax + cw, ay + ch); ctx.lineTo(ax + cw - cLen, ay + ch);
    ctx.moveTo(ax + cLen, ay + ch); ctx.lineTo(ax, ay + ch); ctx.lineTo(ax, ay + ch - cLen);
    ctx.stroke();

    if (gurultuGucu > 0.06) {
      ctx.strokeStyle = `rgba(255, 79, 97, ${(gurultuGucu * 0.72).toFixed(2)})`;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(ax - 3, ay - 3, cw + 6, ch + 6);
    }
    ctx.restore();

    const temizSinyal = pikselSinyalCevir(hamAktif);
    const temizCoz = nnls3(M, temizSinyal);
    const guncelSinyal = pikselSinyalCevir(hamAktif, aktifGurultu);
    const coz = nnls3(M, guncelSinyal);

    let cubukHareket = false;
    for (let i = 0; i < 3; i++) {
      if (azHareket() || Math.abs(coz.x[i] - gosterilenX[i]) < 0.004) {
        gosterilenX[i] = coz.x[i];
      } else {
        gosterilenX[i] += (coz.x[i] - gosterilenX[i]) * 0.28;
        cubukHareket = true;
      }
      const bar = cubukOgeleri[i];
      const oran = sinirla(gosterilenX[i] / 1.85, 0, 1);
      const temizOran = sinirla(temizCoz.x[i] / 1.85, 0, 1);
      bar.dolgu.style.transform = `scaleX(${oran.toFixed(3)})`;
      bar.temizIz.style.left = `${(temizOran * 100).toFixed(1)}%`;
      bar.temizIz.style.opacity = gurultuGucu > 0.05 ? "0.85" : "0";
      bar.deger.textContent = gosterilenX[i].toFixed(2);
      bar.satir.classList.toggle("kirpildi", coz.kirpildi[i]);
    }

    const rG = Math.round(sinirla(hamAktif[0] + aktifGurultu[0] * 145, 0, 255));
    const gG = Math.round(sinirla(hamAktif[1] + aktifGurultu[1] * 145, 0, 255));
    const bG = Math.round(sinirla(hamAktif[2] + aktifGurultu[2] * 145, 0, 255));
    if (gurultuGucu > 0.08) {
      pikselBilgi.innerHTML = `<span class="pk-renk-nokta" style="background:rgb(${rG},${gG},${bG})"></span>PİKSEL (${aktifX},${aktifY}) · <b class="toz">+ε GÜRÜLTÜ</b> · komşular sabit`;
    } else {
      pikselBilgi.innerHTML = `<span class="pk-renk-nokta" style="background:rgb(${rG},${gG},${bG})"></span>PİKSEL (${aktifX},${aktifY}) · RGB (${rG},${gG},${bG})`;
    }

    kirli = cubukHareket;
  }

  ciz(0);

  return {
    adim(t) {
      if (azHareket()) {
        if (kirli) ciz(t);
        return;
      }

      const hedefGuc = basili ? 0.72 : 0;
      gurultuGucu += (hedefGuc - gurultuGucu) * (basili ? 0.16 : 0.18);
      if (gurultuGucu > 0.015) {
        const gurultuAdim = Math.floor(t * 11);
        if (gurultuAdim !== sonGurultuAdim) {
          sonGurultuAdim = gurultuAdim;
          aktifGurultu = yeniGurultuUret(gurultuGucu);
        }
        kirli = true;
      } else if (aktifGurultu[0] || aktifGurultu[1] || aktifGurultu[2]) {
        aktifGurultu = [0, 0, 0];
        gurultuGucu = 0;
        kirli = true;
      }

      let dx = 0;
      let dy = 0;
      if (darbeDurum) {
        const dt = performance.now() / 1000 - darbeDurum.t0;
        if (dt > 0.5) {
          darbeDurum = null;
        } else {
          const sonum = Math.exp(-dt * 7);
          const tit = sonum * Math.cos(dt * 28);
          dx = darbeDurum.nx * tit * 5.5;
          dy = darbeDurum.ny * tit * 4.5;
          kirli = true;
        }
      }

      if (ilkNefes && t >= 1.65) {
        ilkNefes = false;
        kirli = true;
      }

      egim.adim(dx, dy);
      if (kirli || ilkNefes || gurultuGucu > 0.01) {
        ciz(t);
      }
    },

    darbe(x, y, nx, ny) {
      if (azHareket()) return;
      const r = izgaraKap.getBoundingClientRect();
      const cx = r.width ? sinirla(((x - r.left) / r.width) * TW, 20, TW - 20) : TW / 2;
      const cy = r.height ? sinirla(((y - r.top) / r.height) * TH, 20, TH - 20) : TH / 2;
      darbeDurum = { t0: performance.now() / 1000, nx: nx || 1, ny: ny || 0, cx, cy };
      gurultuGucu = Math.max(gurultuGucu, 0.36);
      aktifGurultu = yeniGurultuUret(0.36);
      kirli = true;
    },

    yokEt() {
      egim.yokEt();
      clearTimeout(dokunmaZamanlayici);
      izgaraKap.removeEventListener("pointerenter", onEnter);
      izgaraKap.removeEventListener("pointermove", onMove);
      izgaraKap.removeEventListener("pointerdown", onDown);
      izgaraKap.removeEventListener("pointerup", gurultuBitir);
      izgaraKap.removeEventListener("pointercancel", gurultuBitir);
      izgaraKap.removeEventListener("pointerleave", gurultuBitir);
      izgaraKap.removeEventListener("keydown", onKey);
      izgaraKap.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", kutuTemizle);
      window.removeEventListener("scroll", kutuTemizle, { capture: true });
    },
  };
}

function sentetik(kok) {
  const { G, gercek, gurultu } = sentetikAlanOlustur(96);
  const KESIT_Y = 0.48;
  const MAKS_SIGMA = 0.32;

  const sarmal = h("div", "a1a-sahne sn-sahne");
  const duzlem = h("div", "a1a-duzlem sn-duzlem");
  sarmal.append(duzlem);

  const ust = h("div", "a1a-ust veri");
  const etiketTemsili = h("span", "sn-temsili", "temsilî sentetik sahne");
  const ipucu = h("span", "a1a-ipucu", "yatay: çapraz kıl · dikey: gürültü σ");
  ust.append(etiketTemsili, ipucu);

  const sahneSatir = h("div", "sn-govde");
  const paneller = h("div", "sn-paneller");
  paneller.setAttribute("tabindex", "0");
  paneller.setAttribute("role", "application");
  paneller.setAttribute("aria-label", "Üç sentetik harita paneli: Bilinen, Kestirim, Hata. Yatay konum çapraz kılı, dikey konum gürültü düzeyini değiştirir.");

  const panelAdlar = [
    { id: "bilinen", baslik: "Bilinen harita" },
    { id: "kestirim", baslik: "Kestirim" },
    { id: "hata", baslik: "Hata" },
  ];

  const panelKayit = panelAdlar.map((p) => {
    const kap = h("figure", `sn-panel sn-panel-${p.id}`);
    const kare = h("div", "sn-kare");
    const c = document.createElement("canvas");
    c.width = G;
    c.height = G;
    c.className = "sn-tuval";
    const kil = h("div", "sn-kil");
    kil.setAttribute("aria-hidden", "true");
    const kilX = h("span", "sn-kil-x");
    const kilY = h("span", "sn-kil-y");
    const kilNokta = h("span", "sn-kil-nokta");
    kil.append(kilX, kilY, kilNokta);
    kare.append(c, kil);
    const ad = h("figcaption", "sn-ad veri", p.baslik);
    kap.append(kare, ad);
    paneller.append(kap);
    const ctx = c.getContext("2d");
    return { id: p.id, kap, kare, tuval: c, ctx, resim: ctx.createImageData(G, G) };
  });

  const olcek = h("div", "sn-olcek veri");
  olcek.setAttribute("aria-hidden", "true");
  const olcekUst = h("span", "", "0.32");
  const olcekRay = h("div", "sn-olcek-ray");
  const olcekDolgu = h("i", "sn-olcek-dolgu");
  const olcekImlec = h("span", "sn-olcek-imlec");
  olcekRay.append(olcekDolgu, olcekImlec);
  const olcekAlt = h("span", "", "0.00");
  const olcekAd = h("b", "", "σ");
  olcek.append(olcekAd, olcekUst, olcekRay, olcekAlt);

  sahneSatir.append(paneller, olcek);

  const alt = h("div", "sn-alt veri");
  const durumSatir = h("div", "sn-durum-satir");
  const sigmaYazi = h("span", "sn-sigma-yazi");
  const bolgeYazi = h("span", "sn-bolge-yazi");
  durumSatir.append(sigmaYazi, bolgeYazi);

  const kiyasSatir = h("div", "sn-kiyas");
  const barOlustur = (ad, sinif) => {
    const k = h("div", `sn-bar ${sinif}`);
    const etiket = h("span", "", ad);
    const ray = h("span", "sn-bar-ray");
    const ic = document.createElement("i");
    ray.append(ic);
    k.append(etiket, ray);
    return { k, ic };
  };
  const butunBar = barOlustur("bütün alan", "sn-bar-butun");
  const yerelBar = barOlustur("gaz bölgesi", "sn-bar-yerel");
  const kesisimBar = barOlustur("kıl farkı", "sn-bar-kil");
  kiyasSatir.append(butunBar.k, yerelBar.k, kesisimBar.k);

  alt.append(durumSatir, kiyasSatir);
  duzlem.append(ust, sahneSatir, alt);
  kok.append(sarmal);

  const yazEmisyon = (kayit, alan) => {
    const d = kayit.resim.data;
    for (let i = 0; i < alan.length; i++) {
      const v = sinirla(alan[i], 0, 1);
      const parlak = Math.pow(v, 0.85);
      const p = i * 4;
      d[p] = Math.min(255, Math.round(28 + parlak * 227));
      d[p + 1] = Math.min(255, Math.round(14 + Math.pow(v, 1.45) * 165));
      d[p + 2] = Math.min(255, Math.round(26 + Math.pow(v, 1.35) * 172));
      d[p + 3] = Math.min(255, Math.round(18 + Math.pow(v, 0.72) * 237));
    }
    kayit.ctx.putImageData(kayit.resim, 0, 0);
  };

  const yazHata = (kayit, hataAlan) => {
    const d = kayit.resim.data;
    for (let i = 0; i < hataAlan.length; i++) {
      const e = hataAlan[i];
      const mag = sinirla(Math.abs(e) * 3.1, 0, 1);
      const p = i * 4;
      if (e >= 0) {

        d[p] = Math.round(224 + mag * 31);
        d[p + 1] = Math.round(162 + mag * 72);
        d[p + 2] = Math.round(106 + mag * 88);
      } else {

        d[p] = Math.round(69 + mag * 85);
        d[p + 1] = Math.round(214 + mag * 36);
        d[p + 2] = Math.round(200 + mag * 46);
      }
      d[p + 3] = Math.min(255, Math.round(12 + Math.pow(mag, 0.78) * 242));
    }
    kayit.ctx.putImageData(kayit.resim, 0, 0);
  };

  yazEmisyon(panelKayit[0], gercek);

  const az = azHareket();
  let u = 0.42;
  let hedefU = 0.42;
  let sonCizilenU = -1;
  let sigma = az ? 0.22 : 0.08;
  let hedefSigma = 0.22;
  let sonCizilenSigma = -1;
  let sonKareOfset = -1;
  let sonDeger = null;
  let etkilesimOldu = false;
  let ilkNefesBitti = az;
  let surukleniyor = false;
  let darbeDurum = null;
  let panelKutulari = null;
  let genelKutu = null;

  const egim = egimYardimcisiKur(sarmal, duzlem, 3.2);

  const kutulariOlc = () => {
    genelKutu = paneller.getBoundingClientRect();
    panelKutulari = panelKayit.map((p) => p.kare.getBoundingClientRect());
  };

  const imlecOku = (clientX, clientY, dokunmatikMi = false) => {
    if (!genelKutu || !panelKutulari) kutulariOlc();
    if (!genelKutu.width || !genelKutu.height) return;

    if (dokunmatikMi) {
      hedefU = sinirla((clientX - genelKutu.left) / genelKutu.width, 0.02, 0.98);
    } else {
      for (const r of panelKutulari) {
        if (clientX >= r.left && clientX <= r.right && r.width > 0) {
          hedefU = sinirla((clientX - r.left) / r.width, 0.02, 0.98);
          break;
        }
      }
    }

    const py = sinirla((clientY - genelKutu.top) / genelKutu.height, 0, 1);
    hedefSigma = sinirla((1 - py) * MAKS_SIGMA, 0, MAKS_SIGMA);
  };

  const onEnter = (e) => {
    kutulariOlc();
    if (e.pointerType !== "touch") {
      etkilesimOldu = true;
      ilkNefesBitti = true;
      ipucu.classList.add("sakin");
      imlecOku(e.clientX, e.clientY, false);
      if (azHareket()) {
        u = hedefU;
        sigma = hedefSigma;
        ciz(0, true);
      }
    }
  };
  const onMove = (e) => {
    const dokunmatik = e.pointerType === "touch";
    if (dokunmatik && !surukleniyor) return;
    etkilesimOldu = true;
    ilkNefesBitti = true;
    ipucu.classList.add("sakin");
    imlecOku(e.clientX, e.clientY, dokunmatik);
    if (azHareket()) {
      u = hedefU;
      sigma = hedefSigma;
      ciz(0, true);
    }
  };
  const onDown = (e) => {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse") return;
    kutulariOlc();
    surukleniyor = true;
    etkilesimOldu = true;
    ilkNefesBitti = true;
    ipucu.classList.add("sakin");
    paneller.setPointerCapture?.(e.pointerId);
    imlecOku(e.clientX, e.clientY, e.pointerType === "touch");
    if (azHareket()) {
      u = hedefU;
      sigma = hedefSigma;
      ciz(0, true);
    }
  };
  const onUp = () => {
    surukleniyor = false;
  };
  const onKey = (e) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    etkilesimOldu = true;
    ilkNefesBitti = true;
    ipucu.classList.add("sakin");
    if (e.key === "ArrowLeft") hedefU = sinirla(hedefU - 0.05, 0.02, 0.98);
    if (e.key === "ArrowRight") hedefU = sinirla(hedefU + 0.05, 0.02, 0.98);
    if (e.key === "ArrowUp") hedefSigma = sinirla(hedefSigma + 0.03, 0, MAKS_SIGMA);
    if (e.key === "ArrowDown") hedefSigma = sinirla(hedefSigma - 0.03, 0, MAKS_SIGMA);
    if (azHareket()) {
      u = hedefU;
      sigma = hedefSigma;
      ciz(0, true);
    }
  };
  const kutuTemizle = () => {
    genelKutu = null;
    panelKutulari = null;
  };

  paneller.addEventListener("pointerenter", onEnter, { passive: true });
  paneller.addEventListener("pointermove", onMove, { passive: true });
  paneller.addEventListener("pointerdown", onDown);
  paneller.addEventListener("pointerup", onUp);
  paneller.addEventListener("pointercancel", onUp);
  paneller.addEventListener("keydown", onKey);
  window.addEventListener("resize", kutuTemizle, { passive: true });
  window.addEventListener("scroll", kutuTemizle, { passive: true, capture: true });

  function ciz(ofset, zorla = false, ekSigma = 0) {
    const effSigma = sinirla(sigma + ekSigma, 0, MAKS_SIGMA + 0.06);
    const tuvalGuncelle = zorla || Math.abs(effSigma - sonCizilenSigma) > 0.002 || ofset !== sonKareOfset;
    if (tuvalGuncelle) {
      sonDeger = sentetikDegerlendir(gercek, gurultu, effSigma, ofset);
      yazEmisyon(panelKayit[1], sonDeger.kestirim);
      yazHata(panelKayit[2], sonDeger.hata);
      sonCizilenSigma = effSigma;
      sonKareOfset = ofset;
    }

    const cxYuzde = `${(u * 100).toFixed(2)}%`;
    const cyYuzde = `${(KESIT_Y * 100).toFixed(1)}%`;
    paneller.style.setProperty("--cx", cxYuzde);
    paneller.style.setProperty("--cy", cyYuzde);

    const sOran = sinirla(effSigma / MAKS_SIGMA, 0, 1);
    olcekRay.style.setProperty("--s", sOran.toFixed(3));

    const gx = sinirla(Math.round(u * (G - 1)), 0, G - 1);
    const gy = sinirla(Math.round(KESIT_Y * (G - 1)), 0, G - 1);
    const idx = gy * G + gx;
    const yerelGercek = gercek[idx];
    const yerelHata = sonDeger ? Math.abs(sonDeger.hata[idx]) : 0;
    const gazdaMi = yerelGercek > 0.18;

    if (effSigma < 0.015) {
      sigmaYazi.innerHTML = `<b>σ = 0.00</b> · <span class="toz">temiz sahne (yalnız iç tutarlılık)</span>`;
    } else {
      sigmaYazi.innerHTML = `<b>σ = ${effSigma.toFixed(2)}</b> · <span class="ha">gürültü hatayı büyütür</span>`;
    }
    bolgeYazi.textContent = gazdaMi ? "kıl: gaz bölgesi" : "kıl: boş gök";
    bolgeYazi.classList.toggle("gaz", gazdaMi);

    if (sonDeger) {
      butunBar.ic.style.transform = `scaleX(${sonDeger.butunOran.toFixed(3)})`;
      yerelBar.ic.style.transform = `scaleX(${sonDeger.yerelOran.toFixed(3)})`;
      kesisimBar.ic.style.transform = `scaleX(${sinirla(yerelHata / 0.28, 0, 1).toFixed(3)})`;
    }
    sonCizilenU = u;
  }

  ciz(0, true);

  return {
    adim(t) {
      if (azHareket()) return;
      if (!ilkNefesBitti && !etkilesimOldu) {
        const p = sinirla(t / 0.9, 0, 1);
        const e = 1 - Math.pow(1 - p, 3);
        sigma = 0.08 + (0.22 - 0.08) * e;
        if (p >= 1) {
          sigma = 0.22;
          ilkNefesBitti = true;
        }
      } else {
        sigma += (hedefSigma - sigma) * 0.22;
        if (Math.abs(hedefSigma - sigma) < 0.0005) sigma = hedefSigma;
      }
      u += (hedefU - u) * 0.26;
      if (Math.abs(hedefU - u) < 0.0005) u = hedefU;

      let dx = 0;
      let dy = 0;
      let ekSigma = 0;
      let ofset = 0;
      if (darbeDurum) {
        const dt = performance.now() / 1000 - darbeDurum.t0;
        if (dt > 0.52) {
          darbeDurum = null;
          sarmal.classList.remove("sn-darbe");
        } else {
          const sonum = Math.exp(-dt * 6.5);
          const tit = sonum * Math.cos(dt * 28);
          dx = darbeDurum.nx * tit * 5.5;
          dy = darbeDurum.ny * tit * 4;
          ekSigma = sonum * 0.09;
          ofset = (Math.floor(dt * 18) * 131) % (G * G);
        }
      }

      egim.adim(dx, dy);

      const degisti =
        Math.abs(sigma + ekSigma - sonCizilenSigma) > 0.0015 ||
        Math.abs(u - sonCizilenU) > 0.0008 ||
        ofset !== sonKareOfset;
      if (degisti) {
        ciz(ofset, false, ekSigma);
      }
    },

    darbe(x, y, nx, ny) {
      if (azHareket()) return;
      void x;
      void y;
      darbeDurum = { t0: performance.now() / 1000, nx: nx || 1, ny: ny || 0 };
      sarmal.classList.add("sn-darbe");
    },

    yokEt() {
      egim.yokEt();
      paneller.removeEventListener("pointerenter", onEnter);
      paneller.removeEventListener("pointermove", onMove);
      paneller.removeEventListener("pointerdown", onDown);
      paneller.removeEventListener("pointerup", onUp);
      paneller.removeEventListener("pointercancel", onUp);
      paneller.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", kutuTemizle);
      window.removeEventListener("scroll", kutuTemizle, { capture: true });
    },
  };
}

function komsuluk(kok) {
  const taban = komsulukTabanOlustur(160);
  const { N, gercek } = taban;
  const W = 560;
  const H = 276;
  const X0 = 36;
  const X1 = 524;
  const TABAN = 236;
  const YUKS = 186;
  const X = (i) => X0 + (i / (N - 1)) * (X1 - X0);
  const Yy = (v) => TABAN - v * YUKS;
  const yol = (dizi) => dizi.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Yy(v).toFixed(1)}`).join("");

  const pSifir = komsulukProfil(0, taban);
  const pOtuz = komsulukProfil(0.3, taban);
  const TEPE_Y_UST = Yy(pSifir.tepe);
  const TEPE_Y_ALT = Yy(pOtuz.tepe);
  const IPLIK_X = X(112);

  const sarmal = h("div", "a1a-sahne km-sahne");
  const duzlem = h("div", "a1a-duzlem km-duzlem");
  sarmal.append(duzlem);

  const ust = h("div", "a1a-ust veri");
  const lejant = h("div", "km-lejant");
  lejant.innerHTML =
    '<span class="km-lej-bilinen"><i></i>bilinen</span><span class="km-lej-kestirim"><i></i>kestirim</span>';
  const ipucu = h("span", "a1a-ipucu", "ipliği aşağı çek · düzleştir");
  ust.append(lejant, ipucu);

  const grafikKap = h("div", "km-grafik");
  grafikKap.setAttribute("tabindex", "0");
  grafikKap.setAttribute("role", "slider");
  grafikKap.setAttribute("aria-label", "Komşuluk ağırlığı λ, 0.00 ile 0.30 arası; ince ipliği dikey çekin");
  grafikKap.setAttribute("aria-valuemin", "0");
  grafikKap.setAttribute("aria-valuemax", "0.30");
  grafikKap.setAttribute("aria-valuenow", "0.30");

  const s = svg(W, H, grafikKap);
  s.setAttribute("class", "km-svg");

  const defs = el("defs", {}, s);
  const fBloom = el("filter", { id: "km-bloom", x: "-30%", y: "-30%", width: "160%", height: "160%" }, defs);
  el("feGaussianBlur", { stdDeviation: "4", result: "b" }, fBloom);
  const fm = el("feMerge", {}, fBloom);
  el("feMergeNode", { in: "b" }, fm);
  el("feMergeNode", { in: "SourceGraphic" }, fm);

  const fYum = el("filter", { id: "km-yumusak", x: "-30%", y: "-40%", width: "160%", height: "180%" }, defs);
  el("feGaussianBlur", { stdDeviation: "6" }, fYum);

  const gAlan = el("linearGradient", { id: "km-alan-grad", x1: "0%", y1: "0%", x2: "0%", y2: "100%" }, defs);
  el("stop", { offset: "0%", "stop-color": RENK.ha, "stop-opacity": "0.26" }, gAlan);
  el("stop", { offset: "78%", "stop-color": RENK.ha, "stop-opacity": "0.05" }, gAlan);
  el("stop", { offset: "100%", "stop-color": RENK.ha, "stop-opacity": "0" }, gAlan);

  const gTaban = el("linearGradient", { id: "km-taban-grad", x1: "0%", y1: "0%", x2: "100%", y2: "0%" }, defs);
  el("stop", { offset: "0%", "stop-color": RENK.isik, "stop-opacity": "0" }, gTaban);
  el("stop", { offset: "12%", "stop-color": RENK.isik, "stop-opacity": "0.26" }, gTaban);
  el("stop", { offset: "88%", "stop-color": RENK.isik, "stop-opacity": "0.26" }, gTaban);
  el("stop", { offset: "100%", "stop-color": RENK.isik, "stop-opacity": "0" }, gTaban);

  el("line", { x1: X0, x2: X1, y1: TABAN, y2: TABAN, stroke: "url(#km-taban-grad)", "stroke-width": 1 }, s);

  el("line", {
    x1: IPLIK_X,
    x2: IPLIK_X,
    y1: TEPE_Y_UST,
    y2: TEPE_Y_ALT + 10,
    stroke: "rgba(224, 162, 106, 0.24)",
    "stroke-dasharray": "2 4",
    "stroke-width": 1,
  }, s);
  el("circle", { cx: IPLIK_X, cy: TEPE_Y_UST, r: 2.2, fill: "rgba(236, 232, 225, 0.4)" }, s);

  el("path", { d: yol(gercek), fill: "none", stroke: "rgba(236,232,225,0.44)", "stroke-dasharray": "4 4", "stroke-width": 1.15 }, s);

  const kestirimAlan = el("path", { fill: "url(#km-alan-grad)" }, s);
  const kestirimHale = el("path", { fill: "none", stroke: RENK.ha, "stroke-width": 5.5, opacity: "0.42", filter: "url(#km-yumusak)" }, s);
  const kestirimHat = el("path", { fill: "none", stroke: "#ff6676", "stroke-width": 2, "stroke-linejoin": "round" }, s);

  el("text", { x: X(55), y: Yy(0.56), "text-anchor": "middle", class: "zayif", metin: "geniş yapı" }, s);
  el("text", { x: IPLIK_X, y: 26, "text-anchor": "middle", fill: RENK.isik, metin: "ince iplik" }, s);

  const kumpasG = el("g", { class: "km-kumpas" }, s);
  const kumpasSolIz = el("line", { stroke: "rgba(224,162,106,0.22)", "stroke-dasharray": "2 3", "stroke-width": 1 }, kumpasG);
  const kumpasSagIz = el("line", { stroke: "rgba(224,162,106,0.22)", "stroke-dasharray": "2 3", "stroke-width": 1 }, kumpasG);
  const kumpasHatHale = el("line", { stroke: RENK.toz, "stroke-width": 5, opacity: "0.35", filter: "url(#km-yumusak)" }, kumpasG);
  const kumpasHat = el("line", { stroke: RENK.toz, "stroke-width": 1.8 }, kumpasG);
  const kumpasSolCene = el("line", { stroke: RENK.toz, "stroke-width": 1.8 }, kumpasG);
  const kumpasSagCene = el("line", { stroke: RENK.toz, "stroke-width": 1.8 }, kumpasG);
  const kumpasYazi = el("text", { "text-anchor": "start", fill: RENK.toz, class: "km-kumpas-yazi", metin: "" }, kumpasG);

  const tutamakG = el("g", { class: "km-tutamak" }, s);
  const tutamakHalkaDis = el("circle", { cx: IPLIK_X, r: 13, fill: "rgba(255,79,97,0.08)", stroke: RENK.ha, "stroke-width": 1, opacity: "0.55" }, tutamakG);
  const tutamakOkUst = el("path", { d: "M-3.5 -17 L0 -21 L3.5 -17", fill: "none", stroke: RENK.isik2, "stroke-width": 1.2 }, tutamakG);
  const tutamakOkAlt = el("path", { d: "M-3.5 17 L0 21 L3.5 17", fill: "none", stroke: RENK.toz, "stroke-width": 1.3 }, tutamakG);
  const tutamakCekirdek = el("circle", { cx: IPLIK_X, r: 4.5, fill: RENK.isik, stroke: RENK.ha, "stroke-width": 2, filter: "url(#km-bloom)" }, tutamakG);

  const tutamakBolge = h("div", "km-tutamak-bolge");
  tutamakBolge.setAttribute("aria-hidden", "true");
  grafikKap.append(tutamakBolge);

  const alt = h("div", "km-alt veri");
  const canliSatir = h("div", "km-canli");
  const lamYazi = h("span", "km-lam");
  const genisYazi = h("span", "km-genis");
  canliSatir.append(lamYazi, genisYazi);

  const gercekSatir = h("div", "km-gercek");
  const gercekBas = h("span", "km-gercek-bas", "Sentetik vaka (λ = 0.30) · yerel medyan hata (Hα / Hβ / [O III])");
  const gercekSayi = h("span", "km-gercek-sayi", "%39 / %55 / %53  →  %8 / %15 / %18");
  gercekSatir.append(gercekBas, gercekSayi);

  alt.append(canliSatir, gercekSatir);
  duzlem.append(ust, grafikKap, alt);
  kok.append(sarmal);

  const az = azHareket();
  let mevcutLam = az ? 0.3 : 0.1;
  let hedefLam = 0.3;
  let surukleniyor = false;
  let etkilesimOldu = false;
  let ilkNefesBitti = az;
  let sonCizilenLam = -1;
  let darbeDurum = null;
  let grafikKutu = null;

  const egim = egimYardimcisiKur(sarmal, duzlem, 3.4);

  const clientYToLambda = (clientY) => {
    if (!grafikKutu) grafikKutu = s.getBoundingClientRect();
    if (!grafikKutu.height) return hedefLam;
    const svgY = ((clientY - grafikKutu.top) / grafikKutu.height) * H;
    const oran = sinirla((svgY - TEPE_Y_UST) / (TEPE_Y_ALT - TEPE_Y_UST), 0, 1);
    return oran * 0.3;
  };

  const baslatSurukle = (e) => {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse") return;
    grafikKutu = s.getBoundingClientRect();
    surukleniyor = true;
    etkilesimOldu = true;
    ilkNefesBitti = true;
    ipucu.classList.add("sakin");
    grafikKap.classList.add("surukleniyor");
    e.currentTarget.setPointerCapture?.(e.pointerId);
    hedefLam = clientYToLambda(e.clientY);
    if (azHareket()) {
      mevcutLam = hedefLam;
      ciz(0);
    }
  };
  const surukle = (e) => {
    if (!surukleniyor) return;
    hedefLam = clientYToLambda(e.clientY);
    if (azHareket()) {
      mevcutLam = hedefLam;
      ciz(0);
    }
  };
  const bitirSurukle = () => {
    if (!surukleniyor) return;
    surukleniyor = false;
    grafikKap.classList.remove("surukleniyor");
  };

  const onGrafikDown = (e) => {
    if (e.pointerType === "touch") return;
    baslatSurukle(e);
  };
  const onKey = (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    etkilesimOldu = true;
    ilkNefesBitti = true;
    ipucu.classList.add("sakin");
    const yon = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1;
    hedefLam = sinirla(hedefLam + yon * 0.03, 0, 0.3);
    if (azHareket()) {
      mevcutLam = hedefLam;
      ciz(0);
    }
  };
  const kutuTemizle = () => {
    grafikKutu = null;
  };

  grafikKap.addEventListener("pointerdown", onGrafikDown);
  grafikKap.addEventListener("pointermove", surukle);
  grafikKap.addEventListener("pointerup", bitirSurukle);
  grafikKap.addEventListener("pointercancel", bitirSurukle);
  tutamakBolge.addEventListener("pointerdown", baslatSurukle);
  tutamakBolge.addEventListener("pointermove", surukle);
  tutamakBolge.addEventListener("pointerup", bitirSurukle);
  tutamakBolge.addEventListener("pointercancel", bitirSurukle);
  grafikKap.addEventListener("keydown", onKey);
  window.addEventListener("resize", kutuTemizle, { passive: true });
  window.addEventListener("scroll", kutuTemizle, { passive: true, capture: true });

  function ciz(t, darbeDalga = null) {
    const p = komsulukProfil(mevcutLam, taban);
    let egriDizi = p.sonuc;

    if (darbeDalga) {
      egriDizi = p.sonuc.map((v, i) => {
        const dist = Math.abs(i - darbeDalga.merkezI);
        const zarf = Math.exp(-dist * 0.065) * darbeDalga.genlik;
        return Math.max(0.02, v + Math.sin(dist * 0.55 - darbeDalga.dt * 24) * zarf);
      });
    }

    const dHat = yol(egriDizi);
    const dAlan = `${dHat} L${X1} ${TABAN} L${X0} ${TABAN} Z`;
    kestirimAlan.setAttribute("d", dAlan);
    kestirimHale.setAttribute("d", dHat);
    kestirimHat.setAttribute("d", dHat);

    const xSol = X(p.sol);
    const xSag = X(p.sag);
    const yK = Yy(p.yari);
    const ceneYari = 7;

    kumpasSolIz.setAttribute("x1", xSol.toFixed(1));
    kumpasSolIz.setAttribute("x2", xSol.toFixed(1));
    kumpasSolIz.setAttribute("y1", yK.toFixed(1));
    kumpasSolIz.setAttribute("y2", TABAN);
    kumpasSagIz.setAttribute("x1", xSag.toFixed(1));
    kumpasSagIz.setAttribute("x2", xSag.toFixed(1));
    kumpasSagIz.setAttribute("y1", yK.toFixed(1));
    kumpasSagIz.setAttribute("y2", TABAN);

    kumpasHatHale.setAttribute("x1", xSol.toFixed(1));
    kumpasHatHale.setAttribute("x2", xSag.toFixed(1));
    kumpasHatHale.setAttribute("y1", yK.toFixed(1));
    kumpasHatHale.setAttribute("y2", yK.toFixed(1));
    kumpasHat.setAttribute("x1", xSol.toFixed(1));
    kumpasHat.setAttribute("x2", xSag.toFixed(1));
    kumpasHat.setAttribute("y1", yK.toFixed(1));
    kumpasHat.setAttribute("y2", yK.toFixed(1));

    kumpasSolCene.setAttribute("x1", xSol.toFixed(1));
    kumpasSolCene.setAttribute("x2", xSol.toFixed(1));
    kumpasSolCene.setAttribute("y1", (yK - ceneYari).toFixed(1));
    kumpasSolCene.setAttribute("y2", (yK + ceneYari).toFixed(1));
    kumpasSagCene.setAttribute("x1", xSag.toFixed(1));
    kumpasSagCene.setAttribute("x2", xSag.toFixed(1));
    kumpasSagCene.setAttribute("y1", (yK - ceneYari).toFixed(1));
    kumpasSagCene.setAttribute("y2", (yK + ceneYari).toFixed(1));

    const acikMi = p.oran > 0.25;
    kumpasG.setAttribute("opacity", (0.28 + p.oran * 0.72).toFixed(2));
    kumpasYazi.setAttribute("x", (xSag + 9).toFixed(1));
    kumpasYazi.setAttribute("y", (yK + 3.5).toFixed(1));
    kumpasYazi.textContent = acikMi ? `genişledi ×${p.genisleme.toFixed(1)}` : "FWHM";

    const tepeY = Yy(p.tepe);
    const nefes = !etkilesimOldu && !azHareket() ? Math.sin(t * 2.4) * 2.2 : 0;
    tutamakHalkaDis.setAttribute("cy", tepeY.toFixed(1));
    tutamakHalkaDis.setAttribute("r", (12 + Math.abs(nefes)).toFixed(1));
    tutamakCekirdek.setAttribute("cy", tepeY.toFixed(1));
    tutamakOkUst.setAttribute("transform", `translate(${IPLIK_X.toFixed(1)} ${(tepeY - nefes * 0.6).toFixed(1)})`);
    tutamakOkAlt.setAttribute("transform", `translate(${IPLIK_X.toFixed(1)} ${(tepeY + nefes * 0.6).toFixed(1)})`);
    tutamakOkUst.setAttribute("opacity", p.oran > 0.08 ? "0.7" : "0.18");
    tutamakOkAlt.setAttribute("opacity", p.oran < 0.92 ? "0.9" : "0.22");

    lamYazi.innerHTML = `DÜZLEŞTİRME <b><span class="km-kucuk">λ</span> = ${p.lambda.toFixed(2)}</b> / 0.30`;
    genisYazi.innerHTML = `İPLİK FWHM <b class="${acikMi ? "toz" : ""}">×${p.genisleme.toFixed(2)}</b> · temsilî`;
    grafikKap.setAttribute("aria-valuenow", p.lambda.toFixed(2));
    sonCizilenLam = mevcutLam;
  }

  ciz(0);

  return {
    adim(t) {
      if (azHareket()) {
        mevcutLam = hedefLam;
        if (Math.abs(mevcutLam - sonCizilenLam) > 0.001) ciz(0);
        return;
      }
      if (!ilkNefesBitti && !etkilesimOldu) {
        const p = sinirla(t / 0.95, 0, 1);
        const e = 1 - Math.pow(1 - p, 3);
        mevcutLam = 0.1 + (0.3 - 0.1) * e;
        if (p >= 1) {
          mevcutLam = 0.3;
          ilkNefesBitti = true;
        }
      } else {
        mevcutLam += (hedefLam - mevcutLam) * (surukleniyor ? 0.35 : 0.16);
        if (Math.abs(hedefLam - mevcutLam) < 0.0008) mevcutLam = hedefLam;
      }

      let dx = 0;
      let dy = 0;
      let darbeDalga = null;
      if (darbeDurum) {
        const dt = performance.now() / 1000 - darbeDurum.t0;
        if (dt > 0.56) {
          darbeDurum = null;
        } else {
          const sonum = Math.exp(-dt * 6);
          const tit = sonum * Math.cos(dt * 26);
          dx = darbeDurum.nx * tit * 5;
          dy = darbeDurum.ny * tit * 4;
          darbeDalga = { merkezI: darbeDurum.merkezI, dt, genlik: sonum * 0.075 };
        }
      }

      egim.adim(dx, dy);

      const nefesAktif = !etkilesimOldu && t < 1.8;
      if (Math.abs(mevcutLam - sonCizilenLam) > 0.0008 || nefesAktif || darbeDalga) {
        ciz(t, darbeDalga);
      }
    },

    darbe(x, y, nx, ny) {
      if (azHareket()) return;
      void y;
      const r = s.getBoundingClientRect();
      const oranX = r.width ? sinirla((x - r.left) / r.width, 0, 1) : 0.7;
      darbeDurum = {
        t0: performance.now() / 1000,
        nx: nx || 1,
        ny: ny || 0,
        merkezI: Math.round(oranX * (N - 1)),
      };
    },

    yokEt() {
      egim.yokEt();
      grafikKap.removeEventListener("pointerdown", onGrafikDown);
      grafikKap.removeEventListener("pointermove", surukle);
      grafikKap.removeEventListener("pointerup", bitirSurukle);
      grafikKap.removeEventListener("pointercancel", bitirSurukle);
      tutamakBolge.removeEventListener("pointerdown", baslatSurukle);
      tutamakBolge.removeEventListener("pointermove", surukle);
      tutamakBolge.removeEventListener("pointerup", bitirSurukle);
      tutamakBolge.removeEventListener("pointercancel", bitirSurukle);
      grafikKap.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", kutuTemizle);
      window.removeEventListener("scroll", kutuTemizle, { capture: true });
    },
  };
}

export default { spektrum, piksel, sentetik, komsuluk };
