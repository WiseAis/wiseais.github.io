import { azHareket } from "../lib/rastgele.js?v=20261126a";
import { oturum, oturumGuncelle } from "../lib/oturum.js?v=20261126a";

const UYKU_MS = 28000;
const UCUS_MS = 1250;
const IZ_ARALIK = 34;
const IZ_RENK = ["var(--toz)", "var(--isik)", "var(--isik)", "var(--ha)"];

const SURTUNME = 0.00115;

const SABIT_YAVASLAMA = 0.0012;

const SEKME = 0.67;
const SURUKLE_ESIK = 6;
const HAFIF_ESIK = 0.45;
const CARPISMA_HIZ_ESIK = 0.65;

const SERT_CARPISMA_ESIK = 0.25;
const SERI_PENCERE_MS = 30000;
const AGIR_SURE_MS = 10000;

const KENAR_PAY = 8;
const UST_PAY = 56;
export const VMAX = 3.6;
const TIK_BASTIR_MS = 350;

const HIZ_PARCA_MIN_MS = 12;
const HIZ_SON_PENCERE_MS = 40;
const HIZ_YAVASLAMA_TABAN = 0.74;
const HIZ_TEPE_PLATO_ORAN = 0.8;
const DURAKLAMA_KORU_MS = 200;
const DURAKLAMA_SIFIR_MS = 400;
const IZ_GECMIS_MS = 450;
const IZ_MAKS_ORNEK = 64;
const ANLAMLI_HAREKET_PX = 2;
const AGIR_ATIS_CARPAN = 0.85;
const GUVENLIK_ARALIK_MS = 400;
const SIKISMA_PENCERE_MS = 300;
const SIKISMA_ZIT_ESIK = -0.5;
const SIKISMA_ESIK_SAYI = 3;
const KURTARMA_MIN_MS = 90;
const KURTARMA_MAKS_MS = 180;
const KURTARMA_HIZ_ORAN = 0.6;
const KURTARMA_BOSLUK_PAY = 6;

const ATIS_SOZLERI = [
  "Uçuyorum! Pek isteyerek değil.",
  "Güzel atış. Ben beğenmedim.",
  "Bir daha yaparsan fenere kapanırım.",
  "Yıldızlar böyle mi düşüyordu? Şimdi anladım.",
];

const YUKSEK_HIZ_SOZLERI = [
  "Bu hızla Andromeda'ya ben önce varırım.",
  "Bu ivmeyle istife giremem, iz bırakırım.",
];

const STARLINK_GECTI_SOZLERI = [
  "Bir uydu daha geçti. Neyse, sigma-clipping halleder.",
  "Starlink. Beş saniyelik kareyi yedi.",
];

const FAZ_SOZLERI = {
  ais: "Tek kareye döndük. Yine biraz bulanığım.",
  aisen: "Pikselim yarıya indi. Drizzle böyle bir şey.",
  aisenit: "1 piksel ızgara. Artık fazla sallamayın.",
};

function fazCoz(girdi) {
  if (typeof girdi === "number" && Number.isFinite(girdi)) {
    if (girdi >= 1000) return "aisenit";
    if (girdi >= 40) return "aisen";
    return "ais";
  }
  if (girdi === "ais" || girdi === "aisen" || girdi === "aisenit") return girdi;
  return null;
}

export function sinirKutusu(b, vw, vh) {
  const boyut = Number.isFinite(b) && b > 0 ? b : 84;
  const minX = Math.min(KENAR_PAY, Math.max(4, (vw - boyut) / 2));
  const maxX = Math.max(minX, vw - boyut - KENAR_PAY);
  const ustPay = vh > boyut + UST_PAY + KENAR_PAY ? UST_PAY : KENAR_PAY;
  const minY = Math.min(ustPay, Math.max(4, (vh - boyut) / 2));
  const maxY = Math.max(minY, vh - boyut - KENAR_PAY);
  return { minX, maxX, minY, maxY };
}

function noktaSinirla(p, b, vw, vh) {
  const s = sinirKutusu(b, vw, vh);
  const x = Number.isFinite(p?.x) ? p.x : s.minX;
  const y = Number.isFinite(p?.y) ? p.y : s.minY;
  return {
    x: Math.max(s.minX, Math.min(s.maxX, x)),
    y: Math.max(s.minY, Math.min(s.maxY, y)),
  };
}

export function hizSinirla(vx, vy) {
  if (!Number.isFinite(vx) || !Number.isFinite(vy)) return { vx: 0, vy: 0 };
  const hiz = Math.hypot(vx, vy);
  if (hiz <= 1e-6) return { vx: 0, vy: 0 };
  const cikis = VMAX * Math.tanh(hiz / VMAX);
  const olcek = cikis / hiz;
  return { vx: vx * olcek, vy: vy * olcek };
}

export function disbukeyZarf(noktalar) {
  const temiz = [];
  for (const p of noktalar) {
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) temiz.push({ x: p.x, y: p.y });
  }
  if (temiz.length < 3) return temiz;
  temiz.sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

  const tekil = [temiz[0]];
  for (let i = 1; i < temiz.length; i++) {
    const onceki = tekil[tekil.length - 1];
    if (Math.hypot(temiz[i].x - onceki.x, temiz[i].y - onceki.y) > 1e-4) {
      tekil.push(temiz[i]);
    }
  }
  if (tekil.length < 3) return tekil;

  const capraz = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const alt = [];
  for (const p of tekil) {
    while (alt.length >= 2 && capraz(alt[alt.length - 2], alt[alt.length - 1], p) <= 0) alt.pop();
    alt.push(p);
  }
  const ust = [];
  for (let i = tekil.length - 1; i >= 0; i--) {
    const p = tekil[i];
    while (ust.length >= 2 && capraz(ust[ust.length - 2], ust[ust.length - 1], p) <= 0) ust.pop();
    ust.push(p);
  }
  alt.pop();
  ust.pop();
  return alt.concat(ust);
}

function cokgenYonDuzelt(noktalar) {
  let alan2 = 0;
  for (let i = 0; i < noktalar.length; i++) {
    const a = noktalar[i];
    const b = noktalar[(i + 1) % noktalar.length];
    alan2 += a.x * b.y - b.x * a.y;
  }
  return alan2 < 0 ? [...noktalar].reverse() : noktalar;
}

export function cokgenHedefYap(noktalar, meta = {}) {
  const zarf = disbukeyZarf(noktalar);
  if (zarf.length < 3) return null;
  let l = Infinity;
  let t = Infinity;
  let r = -Infinity;
  let b = -Infinity;
  for (const p of zarf) {
    if (p.x < l) l = p.x;
    if (p.x > r) r = p.x;
    if (p.y < t) t = p.y;
    if (p.y > b) b = p.y;
  }
  return {
    el: null,
    tur: "genel",
    sabit: false,
    ...meta,
    l,
    t,
    r,
    b,
    noktalar: zarf,
    sonCarpma: -Infinity,
    icinde: false,
  };
}

export function daireKutuCarpisma(ax, ay, yaricap, h) {
  const cx = Math.max(h.l, Math.min(h.r, ax));
  const cy = Math.max(h.t, Math.min(h.b, ay));
  const dx = ax - cx;
  const dy = ay - cy;
  const distSq = dx * dx + dy * dy;
  if (distSq >= yaricap * yaricap) return null;

  if (distSq > 1e-6) {
    const dist = Math.sqrt(distSq);
    return {
      outX: dx / dist,
      outY: dy / dist,
      pen: yaricap - dist,
      temasX: cx,
      temasY: cy,
    };
  }

  const dSol = ax - h.l;
  const dSag = h.r - ax;
  const dUst = ay - h.t;
  const dAlt = h.b - ay;
  const enKucuk = Math.min(dSol, dSag, dUst, dAlt);
  if (enKucuk === dSol) return { outX: -1, outY: 0, pen: dSol + yaricap, temasX: h.l, temasY: ay };
  if (enKucuk === dSag) return { outX: 1, outY: 0, pen: dSag + yaricap, temasX: h.r, temasY: ay };
  if (enKucuk === dUst) return { outX: 0, outY: -1, pen: dUst + yaricap, temasX: ax, temasY: h.t };
  return { outX: 0, outY: 1, pen: dAlt + yaricap, temasX: ax, temasY: h.b };
}

export function daireCokgenCarpisma(ax, ay, yaricap, h) {
  if (!h.noktalar || h.noktalar.length < 3) return daireKutuCarpisma(ax, ay, yaricap, h);
  if (ax + yaricap <= h.l || ax - yaricap >= h.r || ay + yaricap <= h.t || ay - yaricap >= h.b) return null;

  if (!h._yonHazir) {
    h.noktalar = cokgenYonDuzelt(h.noktalar);
    h._yonHazir = true;
  }
  const P = h.noktalar;
  const n = P.length;

  let maksSd = -Infinity;
  let enYakinNx = 0;
  let enYakinNy = -1;
  let disMaksSd = -Infinity;
  let disNx = 0;
  let disNy = -1;
  let minD2 = Infinity;
  let enYakinX = ax;
  let enYakinY = ay;

  for (let i = 0; i < n; i++) {
    const a = P[i];
    const b = P[(i + 1) % n];
    const ex = b.x - a.x;
    const ey = b.y - a.y;
    const lenSq = ex * ex + ey * ey;
    if (lenSq < 1e-9) continue;

    const len = Math.sqrt(lenSq);
    const nx = ey / len;
    const ny = -ex / len;
    const sd = (ax - a.x) * nx + (ay - a.y) * ny;
    if (sd >= yaricap) return null;

    if (sd > maksSd) {
      maksSd = sd;
      enYakinNx = nx;
      enYakinNy = ny;
    }

    if (h.aralikKopru && Math.abs(nx * h.aralikUx + ny * h.aralikUy) < 0.7 && sd > disMaksSd) {
      disMaksSd = sd;
      disNx = nx;
      disNy = ny;
    }

    const u = Math.max(0, Math.min(1, ((ax - a.x) * ex + (ay - a.y) * ey) / lenSq));
    const qx = a.x + u * ex;
    const qy = a.y + u * ey;
    const d2 = (ax - qx) * (ax - qx) + (ay - qy) * (ay - qy);
    if (d2 < minD2) {
      minD2 = d2;
      enYakinX = qx;
      enYakinY = qy;
    }
  }

  if (maksSd <= 0) {
    const kulSd = h.aralikKopru && disMaksSd > -Infinity ? disMaksSd : maksSd;
    const kulNx = h.aralikKopru && disMaksSd > -Infinity ? disNx : enYakinNx;
    const kulNy = h.aralikKopru && disMaksSd > -Infinity ? disNy : enYakinNy;
    return {
      outX: kulNx,
      outY: kulNy,
      pen: yaricap - kulSd,
      temasX: ax - kulSd * kulNx,
      temasY: ay - kulSd * kulNy,
    };
  }

  if (minD2 >= yaricap * yaricap) return null;
  const dist = Math.sqrt(minD2);
  if (dist <= 1e-6) {
    return { outX: enYakinNx, outY: enYakinNy, pen: yaricap, temasX: enYakinX, temasY: enYakinY };
  }
  return {
    outX: (ax - enYakinX) / dist,
    outY: (ay - enYakinY) / dist,
    pen: yaricap - dist,
    temasX: enYakinX,
    temasY: enYakinY,
  };
}

export function hedefTemas(ax, ay, yaricap, h) {
  return h.noktalar && h.noktalar.length >= 3
    ? daireCokgenCarpisma(ax, ay, yaricap, h)
    : daireKutuCarpisma(ax, ay, yaricap, h);
}

function hedefKoseler(h) {
  if (h.noktalar && h.noktalar.length >= 3) {
    if (!h._yonHazir) {
      h.noktalar = cokgenYonDuzelt(h.noktalar);
      h._yonHazir = true;
    }
    return h.noktalar;
  }
  return [
    { x: h.l, y: h.t },
    { x: h.r, y: h.t },
    { x: h.r, y: h.b },
    { x: h.l, y: h.b },
  ];
}

function noktaCokgenIcinde(px, py, P) {
  for (let i = 0; i < P.length; i++) {
    const a = P[i];
    const b = P[(i + 1) % P.length];
    if ((px - a.x) * (b.y - a.y) - (py - a.y) * (b.x - a.x) > 1e-6) return false;
  }
  return true;
}

function dogruParcalariKesisir(a, b, c, d) {
  const ccw = (p, q, r) => (r.y - p.y) * (q.x - p.x) - (q.y - p.y) * (r.x - p.x);
  const d1 = ccw(a, b, c);
  const d2 = ccw(a, b, d);
  const d3 = ccw(c, d, a);
  const d4 = ccw(c, d, b);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function enYakinNoktaParca(px, py, a, b) {
  const ex = b.x - a.x;
  const ey = b.y - a.y;
  const lenSq = ex * ex + ey * ey;
  if (lenSq < 1e-9) return { x: a.x, y: a.y, d2: (px - a.x) ** 2 + (py - a.y) ** 2 };
  const u = Math.max(0, Math.min(1, ((px - a.x) * ex + (py - a.y) * ey) / lenSq));
  const qx = a.x + u * ex;
  const qy = a.y + u * ey;
  return { x: qx, y: qy, d2: (px - qx) ** 2 + (py - qy) ** 2 };
}

function cokgenMesafe(PA, PB) {
  for (const p of PA) if (noktaCokgenIcinde(p.x, p.y, PB)) return { dist: 0, pA: p, pB: p };
  for (const p of PB) if (noktaCokgenIcinde(p.x, p.y, PA)) return { dist: 0, pA: p, pB: p };
  for (let i = 0; i < PA.length; i++) {
    const a1 = PA[i];
    const a2 = PA[(i + 1) % PA.length];
    for (let j = 0; j < PB.length; j++) {
      if (dogruParcalariKesisir(a1, a2, PB[j], PB[(j + 1) % PB.length])) {
        return { dist: 0, pA: a1, pB: PB[j] };
      }
    }
  }

  let minD2 = Infinity;
  let enA = PA[0];
  let enB = PB[0];
  for (const p of PA) {
    for (let j = 0; j < PB.length; j++) {
      const q = enYakinNoktaParca(p.x, p.y, PB[j], PB[(j + 1) % PB.length]);
      if (q.d2 < minD2) {
        minD2 = q.d2;
        enA = p;
        enB = { x: q.x, y: q.y };
      }
    }
  }
  for (const p of PB) {
    for (let i = 0; i < PA.length; i++) {
      const q = enYakinNoktaParca(p.x, p.y, PA[i], PA[(i + 1) % PA.length]);
      if (q.d2 < minD2) {
        minD2 = q.d2;
        enA = { x: q.x, y: q.y };
        enB = p;
      }
    }
  }
  return { dist: Math.sqrt(minD2), pA: enA, pB: enB };
}

function profilKesit(uw, w0) {
  let uMin = Infinity;
  let uMax = -Infinity;
  for (let i = 0; i < uw.length; i++) {
    const a = uw[i];
    const b = uw[(i + 1) % uw.length];
    if ((a.w <= w0 + 1e-6 && b.w >= w0 - 1e-6) || (b.w <= w0 + 1e-6 && a.w >= w0 - 1e-6)) {
      if (Math.abs(b.w - a.w) < 1e-9) {
        if (a.u < uMin) uMin = a.u;
        if (a.u > uMax) uMax = a.u;
        if (b.u < uMin) uMin = b.u;
        if (b.u > uMax) uMax = b.u;
      } else {
        const s = Math.max(0, Math.min(1, (w0 - a.w) / (b.w - a.w)));
        const u = a.u + s * (b.u - a.u);
        if (u < uMin) uMin = u;
        if (u > uMax) uMax = u;
      }
    }
  }
  return { uMin, uMax };
}

export function aralikKopruleriEkle(hedefler, cap, ax, ay, yaricap) {
  if (!Array.isArray(hedefler) || hedefler._kopruHazir) return hedefler;
  const katilar = hedefler.filter((h) => h.tur !== "istif" && !h.aralikKopru);
  const koseler = katilar.map(hedefKoseler);
  const eklenenler = [];

  for (let i = 0; i < katilar.length; i++) {
    const A = katilar[i];
    for (let j = i + 1; j < katilar.length; j++) {
      const B = katilar[j];
      if (Boolean(A.sabit) !== Boolean(B.sabit)) continue;
      const dxK = Math.max(0, A.l - B.r, B.l - A.r);
      const dyK = Math.max(0, A.t - B.b, B.t - A.b);
      if (dxK * dxK + dyK * dyK >= cap * cap) continue;

      const { dist, pA, pB } = cokgenMesafe(koseler[i], koseler[j]);
      if (dist <= 1e-3 || dist >= cap) continue;

      const ux = (pB.x - pA.x) / dist;
      const uy = (pB.y - pA.y) / dist;
      const wx = -uy;
      const wy = ux;
      const proj = (p) => ({ u: p.x * ux + p.y * uy, w: p.x * wx + p.y * wy });
      const geri = (u, w) => ({ x: u * ux + w * wx, y: u * uy + w * wy });

      const uwA = koseler[i].map(proj);
      const uwB = koseler[j].map(proj);
      let wAmin = Infinity;
      let wAmax = -Infinity;
      for (const p of uwA) {
        if (p.w < wAmin) wAmin = p.w;
        if (p.w > wAmax) wAmax = p.w;
      }
      let wBmin = Infinity;
      let wBmax = -Infinity;
      for (const p of uwB) {
        if (p.w < wBmin) wBmin = p.w;
        if (p.w > wBmax) wBmax = p.w;
      }

      const wLo = Math.max(wAmin, wBmin);
      const wHi = Math.min(wAmax, wBmax);
      const kopruHam = [];

      if (wHi - wLo < 1) {

        kopruHam.push(
          { x: pA.x - wx * 3, y: pA.y - wy * 3 },
          { x: pB.x - wx * 3, y: pB.y - wy * 3 },
          { x: pB.x + wx * 3, y: pB.y + wy * 3 },
          { x: pA.x + wx * 3, y: pA.y + wy * 3 },
        );
      } else {
        const hamW = [wLo, wHi];
        for (const p of uwA) if (p.w > wLo && p.w < wHi) hamW.push(p.w);
        for (const p of uwB) if (p.w > wLo && p.w < wHi) hamW.push(p.w);
        hamW.sort((a, b) => a - b);
        const ws = [hamW[0]];
        for (let k = 1; k < hamW.length; k++) {
          if (hamW[k] - ws[ws.length - 1] > 1e-4) ws.push(hamW[k]);
        }

        for (let k = 0; k < ws.length - 1; k++) {
          const w0 = ws[k];
          const w1 = ws[k + 1];
          const a0 = profilKesit(uwA, w0).uMax;
          const b0 = profilKesit(uwB, w0).uMin;
          const a1 = profilKesit(uwA, w1).uMax;
          const b1 = profilKesit(uwB, w1).uMin;
          if (!Number.isFinite(a0) || !Number.isFinite(b0) || !Number.isFinite(a1) || !Number.isFinite(b1)) continue;
          const g0 = b0 - a0;
          const g1 = b1 - a1;
          if (g0 >= cap && g1 >= cap) continue;

          let sw0 = w0;
          let sa0 = a0;
          let sb0 = b0;
          let sw1 = w1;
          let sa1 = a1;
          let sb1 = b1;
          if (g0 >= cap && g1 < cap) {
            const s = (cap - g0) / (g1 - g0);
            sw0 = w0 + s * (w1 - w0);
            sa0 = a0 + s * (a1 - a0);
            sb0 = b0 + s * (b1 - b0);
          } else if (g0 < cap && g1 >= cap) {
            const s = (cap - g0) / (g1 - g0);
            sw1 = w0 + s * (w1 - w0);
            sa1 = a0 + s * (a1 - a0);
            sb1 = b0 + s * (b1 - b0);
          }
          kopruHam.push(geri(sa0, sw0), geri(sb0, sw0), geri(sb1, sw1), geri(sa1, sw1));
        }
      }

      const kopru = cokgenHedefYap(kopruHam, {
        tur: "aralik",
        sabit: Boolean(A.sabit && B.sabit),
        aralikKopru: true,
        aralikUx: ux,
        aralikUy: uy,
        ebeveynler: [A, B],
      });
      if (!kopru) continue;
      let alan2 = 0;
      for (let k = 0; k < kopru.noktalar.length; k++) {
        const p = kopru.noktalar[k];
        const q = kopru.noktalar[(k + 1) % kopru.noktalar.length];
        alan2 += p.x * q.y - q.x * p.y;
      }
      if (Math.abs(alan2) < 8) continue;
      kopru.icinde = Boolean(
        Number.isFinite(ax) && Number.isFinite(ay) && Number.isFinite(yaricap) && hedefTemas(ax, ay, yaricap, kopru),
      );
      eklenenler.push(kopru);
    }
  }

  for (const k of eklenenler) hedefler.push(k);
  hedefler._kopruHazir = true;
  return hedefler;
}

function yakinEbeveyn(kopru, tx, ty) {
  const [a, b] = kopru.ebeveynler || [];
  if (!a) return kopru;
  if (!b) return a;
  const da = (tx - Math.max(a.l, Math.min(a.r, tx))) ** 2 + (ty - Math.max(a.t, Math.min(a.b, ty))) ** 2;
  const db = (tx - Math.max(b.l, Math.min(b.r, tx))) ** 2 + (ty - Math.max(b.t, Math.min(b.b, ty))) ** 2;
  return da <= db ? a : b;
}

function alanBosMu(x, y, b, yaricap, hedefler) {
  const ax = x + b / 2;
  const ay = y + b / 2;
  const r = yaricap + KURTARMA_BOSLUK_PAY;
  for (const h of hedefler) {
    if (h.tur === "istif") continue;
    if (hedefTemas(ax, ay, r, h)) return false;
  }
  return true;
}

function enYakinBosAlan(basX, basY, b, yaricap, s, vw, vh, hedefler, n1, n2) {
  const adayYonler = [];
  const yonEkle = (dx, dy) => {
    const l = Math.hypot(dx, dy);
    if (l < 1e-4) return;
    adayYonler.push({ x: dx / l, y: dy / l });
  };

  const ax = n1.x - n2.x;
  const ay = n1.y - n2.y;
  const al = Math.hypot(ax, ay);
  const bx = n1.x + n2.x;
  const by = n1.y + n2.y;
  yonEkle(bx, by);
  if (al > 1e-4) {
    const ux = ax / al;
    const uy = ay / al;
    const wx = -uy;
    const wy = ux;
    yonEkle(wx, wy);
    yonEkle(-wx, -wy);
    yonEkle(wx * 0.96 + ux * 0.28, wy * 0.96 + uy * 0.28);
    yonEkle(wx * 0.96 - ux * 0.28, wy * 0.96 - uy * 0.28);
    yonEkle(-wx * 0.96 + ux * 0.28, -wy * 0.96 + uy * 0.28);
    yonEkle(-wx * 0.96 - ux * 0.28, -wy * 0.96 - uy * 0.28);
    yonEkle(wx * 0.88 + ux * 0.47, wy * 0.88 + uy * 0.47);
    yonEkle(wx * 0.88 - ux * 0.47, wy * 0.88 - uy * 0.47);
    yonEkle(-wx * 0.88 + ux * 0.47, -wy * 0.88 + uy * 0.47);
    yonEkle(-wx * 0.88 - ux * 0.47, -wy * 0.88 - uy * 0.47);
  } else {
    for (const [dx, dy] of [
      [0, -1],
      [0, 1],
      [1, 0],
      [-1, 0],
      [0.707, -0.707],
      [-0.707, -0.707],
      [0.707, 0.707],
      [-0.707, 0.707],
    ]) {
      yonEkle(dx, dy);
    }
  }

  const maksMesafe = Math.hypot(vw, vh);
  let enIyi = null;

  for (const d of adayYonler) {
    for (let mesafe = 8; mesafe <= maksMesafe; mesafe += 8) {
      const tx = basX + d.x * mesafe;
      const ty = basY + d.y * mesafe;
      if (tx < s.minX || tx > s.maxX || ty < s.minY || ty > s.maxY) break;
      if (alanBosMu(tx, ty, b, yaricap, hedefler)) {
        const kenarPay = Math.min(tx - s.minX, s.maxX - tx, ty - s.minY, s.maxY - ty);

        const skor = mesafe + (kenarPay < 24 ? (24 - kenarPay) * 1.5 : 0);
        if (!enIyi || skor < enIyi.skor) {
          enIyi = { x: tx, y: ty, dist: mesafe, dx: d.x, dy: d.y, skor };
        }
        break;
      }
    }
  }

  if (enIyi) return enIyi;

  for (let r = 24; r <= maksMesafe; r += 24) {
    for (let k = 0; k < 16; k++) {
      const aci = (Math.PI * 2 * k) / 16;
      const tx = Math.max(s.minX, Math.min(s.maxX, basX + Math.cos(aci) * r));
      const ty = Math.max(s.minY, Math.min(s.maxY, basY + Math.sin(aci) * r));
      if (alanBosMu(tx, ty, b, yaricap, hedefler)) {
        const dx = tx - basX;
        const dy = ty - basY;
        const dist = Math.hypot(dx, dy) || 1;
        return { x: tx, y: ty, dist, dx: dx / dist, dy: dy / dist, skor: dist };
      }
    }
  }

  const ortaX = Math.max(s.minX, Math.min(s.maxX, vw / 2 - b / 2));
  const ortaY = Math.max(s.minY, Math.min(s.maxY, vh / 2 - b / 2));
  const dx = ortaX - basX;
  const dy = ortaY - basY;
  const dist = Math.hypot(dx, dy) || 1;
  return { x: ortaX, y: ortaY, dist, dx: dx / dist, dy: dy / dist, skor: dist };
}

export function baslangicOrtusturmeyiCoz(durum, b, yaricap, vw, vh, hedefler) {
  if (!durum || !Array.isArray(hedefler) || !hedefler.length) return { cozuldu: false, yansidi: false };
  if (!hedefler._kopruHazir) {
    aralikKopruleriEkle(hedefler, yaricap * 2, durum.x + b / 2, durum.y + b / 2, yaricap);
  }
  const s = sinirKutusu(b, vw, vh);
  const gecirgen = new Set();
  let cozuldu = false;
  let yansidi = false;

  for (let tur = 0; tur < 4; tur++) {
    const ax = durum.x + b / 2;
    const ay = durum.y + b / 2;
    let enDerin = null;

    for (const h of hedefler) {
      if (h.tur === "istif" || gecirgen.has(h)) continue;
      if (h.r <= 0 || h.l >= vw || h.b <= 0 || h.t >= vh) continue;
      const temas = hedefTemas(ax, ay, yaricap, h);
      if (!temas) continue;

      if (temas.pen >= yaricap) {
        h.icinde = true;
        gecirgen.add(h);
        continue;
      }
      if (!enDerin || temas.pen > enDerin.temas.pen) {
        enDerin = { h, temas };
      }
    }

    if (!enDerin) break;
    const { outX, outY, pen } = enDerin.temas;
    const onceX = durum.x;
    const onceY = durum.y;

    durum.x = Math.max(s.minX, Math.min(s.maxX, durum.x + outX * (pen + 0.5)));
    durum.y = Math.max(s.minY, Math.min(s.maxY, durum.y + outY * (pen + 0.5)));
    cozuldu = true;

    const vn = durum.vx * outX + durum.vy * outY;
    if (vn < 0) {
      durum.vx -= (1 + SEKME) * vn * outX;
      durum.vy -= (1 + SEKME) * vn * outY;
      yansidi = true;
    }

    if (Math.hypot(durum.x - onceX, durum.y - onceY) < 0.01) break;
  }

  for (const h of hedefler) {
    if (h.tur !== "istif") h.icinde = gecirgen.has(h);
  }

  return { cozuldu, yansidi };
}

export function fizikAdim(durum, dt, b, yaricap, vw, vh, hedefler) {
  const adimDt = Number.isFinite(dt) ? Math.max(0, Math.min(40, dt)) : 0;
  const s = sinirKutusu(b, vw, vh);
  if (!Number.isFinite(durum.x) || !Number.isFinite(durum.y)) {
    durum.x = s.minX;
    durum.y = s.minY;
    durum.vx = 0;
    durum.vy = 0;
    durum.kurtarma = null;
    return { kenarSekti: false, knx: 0, kny: 0, carpmalar: [], kurtarmaBasladi: false };
  }
  if (!Number.isFinite(durum.vx) || !Number.isFinite(durum.vy)) {
    durum.vx = 0;
    durum.vy = 0;
  }
  if (!Number.isFinite(durum.zaman)) durum.zaman = 0;
  if (!Array.isArray(durum.carpmaGecmisi)) durum.carpmaGecmisi = [];
  if (!Number.isFinite(durum.kurtarmaSayisi)) durum.kurtarmaSayisi = 0;
  if (adimDt === 0) return { kenarSekti: false, knx: 0, kny: 0, carpmalar: [], kurtarmaBasladi: false };

  if (Array.isArray(hedefler) && !hedefler._kopruHazir) {
    aralikKopruleriEkle(hedefler, yaricap * 2, durum.x + b / 2, durum.y + b / 2, yaricap);
  }

  if (durum.kurtarma) {
    durum.zaman += adimDt;
    const k = durum.kurtarma;
    k.gecen += adimDt;
    const p = Math.min(1, k.gecen / k.sure);

    const e = p * (1.35 - 0.35 * p);
    durum.x = Math.max(s.minX, Math.min(s.maxX, k.basX + (k.hedefX - k.basX) * e));
    durum.y = Math.max(s.minY, Math.min(s.maxY, k.basY + (k.hedefY - k.basY) * e));
    durum.vx = k.cikisVx;
    durum.vy = k.cikisVy;
    if (p >= 1) {
      durum.x = k.hedefX;
      durum.y = k.hedefY;
      durum.kurtarma = null;
      durum.carpmaGecmisi.length = 0;
      const ax = durum.x + b / 2;
      const ay = durum.y + b / 2;
      for (const h of hedefler) {
        h.icinde = Boolean(hedefTemas(ax, ay, yaricap, h));
      }
    }
    return { kenarSekti: false, knx: 0, kny: 0, carpmalar: [], kurtarmaBasladi: false };
  }

  const uzaklik = Math.hypot(durum.vx * adimDt, durum.vy * adimDt);
  const maksAltAdimMesafe = Math.max(4, yaricap * 0.5);
  const altAdim = Math.min(64, Math.max(1, Math.ceil(uzaklik / maksAltAdimMesafe)));
  const sdt = adimDt / altAdim;
  const azal = Math.exp(-SURTUNME * sdt);

  let kenarSekti = false;
  let knx = 0;
  let kny = 0;
  let kurtarmaBasladi = false;
  const carpmalar = [];

  const gecmis = durum.carpmaGecmisi;
  const carpmaKaydet = (nx, ny, hizOnce, hedef) => {
    gecmis.push({ t: durum.zaman, nx, ny, hiz: hizOnce, hedef });
    while (gecmis.length && durum.zaman - gecmis[0].t > SIKISMA_PENCERE_MS) {
      gecmis.shift();
    }
  };

  const sikismaKontrol = () => {
    if (gecmis.length < SIKISMA_ESIK_SAYI) return false;
    const zitlar = [];
    let ciftA = null;
    let ciftB = null;
    for (let a = 0; a < gecmis.length; a++) {
      let karsiVar = false;
      for (let c = 0; c < gecmis.length; c++) {
        if (a === c) continue;
        if (gecmis[a].nx * gecmis[c].nx + gecmis[a].ny * gecmis[c].ny < SIKISMA_ZIT_ESIK) {
          karsiVar = true;
          if (a > c) {
            ciftA = gecmis[c];
            ciftB = gecmis[a];
          }
        }
      }
      if (karsiVar) zitlar.push(gecmis[a]);
    }
    if (zitlar.length < SIKISMA_ESIK_SAYI || !ciftA || !ciftB) return false;

    if (!zitlar.some((z) => z.hedef !== "kenar")) return false;

    const ilkHiz = zitlar[0].hiz;
    const mevcutHiz = Math.hypot(durum.vx, durum.vy);
    const korunanHiz = Math.min(VMAX, Math.max(mevcutHiz, ilkHiz * KURTARMA_HIZ_ORAN));
    const cikis = enYakinBosAlan(
      durum.x,
      durum.y,
      b,
      yaricap,
      s,
      vw,
      vh,
      hedefler,
      { x: ciftA.nx, y: ciftA.ny },
      { x: ciftB.nx, y: ciftB.ny },
    );
    const sure = Math.max(KURTARMA_MIN_MS, Math.min(KURTARMA_MAKS_MS, cikis.dist / Math.max(0.55, korunanHiz)));
    durum.kurtarma = {
      basX: durum.x,
      basY: durum.y,
      hedefX: cikis.x,
      hedefY: cikis.y,
      gecen: 0,
      sure,
      cikisVx: cikis.dx * korunanHiz,
      cikisVy: cikis.dy * korunanHiz,
    };
    durum.vx = durum.kurtarma.cikisVx;
    durum.vy = durum.kurtarma.cikisVy;
    durum.kurtarmaSayisi += 1;
    gecmis.length = 0;
    kurtarmaBasladi = true;
    return true;
  };

  for (let i = 0; i < altAdim; i++) {
    durum.zaman += sdt;
    durum.x += durum.vx * sdt;
    durum.y += durum.vy * sdt;

    const istifAx = durum.x + b / 2;
    const istifAy = durum.y + b / 2;
    for (const h of hedefler) {
      if (h.tur !== "istif") continue;
      if (h.r <= 0 || h.l >= vw || h.b <= 0 || h.t >= vh) {
        h.icinde = false;
        continue;
      }
      const temas = hedefTemas(istifAx, istifAy, yaricap, h);
      if (!temas) {
        h.icinde = false;
        continue;
      }
      if (h.icinde) continue;
      h.icinde = true;
      carpmalar.push({
        h,
        nx: 0,
        ny: 0,
        outX: 0,
        outY: 0,
        temasX: temas.temasX,
        temasY: temas.temasY,
        sert: false,
        hiz: Math.hypot(durum.vx, durum.vy),
        kopru: false,
      });
    }

    for (let tur = 0; tur < 3; tur++) {
      const ax = durum.x + b / 2;
      const ay = durum.y + b / 2;
      let enDerin = null;

      for (const h of hedefler) {
        if (h.tur === "istif") continue;
        if (h.r <= 0 || h.l >= vw || h.b <= 0 || h.t >= vh) {
          h.icinde = false;
          continue;
        }
        const temas = hedefTemas(ax, ay, yaricap, h);
        if (!temas) {
          h.icinde = false;
          continue;
        }
        if (h.icinde) continue;
        if (!enDerin || temas.pen > enDerin.temas.pen) {
          enDerin = { h, temas };
        }
      }

      if (!enDerin) break;
      const { h, temas } = enDerin;
      const { outX, outY, pen, temasX, temasY } = temas;
      const hizOnce = Math.hypot(durum.vx, durum.vy);

      durum.x += outX * (pen + 0.25);
      durum.y += outY * (pen + 0.25);

      const vn = durum.vx * outX + durum.vy * outY;
      if (vn < 0) {
        durum.vx -= (1 + SEKME) * vn * outX;
        durum.vy -= (1 + SEKME) * vn * outY;
        const raporHedef = h.aralikKopru ? yakinEbeveyn(h, temasX, temasY) : h;
        const nx = Math.abs(outX) >= Math.abs(outY) ? -Math.sign(outX) : 0;
        const ny = Math.abs(outY) > Math.abs(outX) ? -Math.sign(outY) : 0;
        carpmalar.push({
          h: raporHedef,
          nx,
          ny,
          outX,
          outY,
          temasX,
          temasY,
          sert: true,
          hiz: -vn,
          kopru: Boolean(h.aralikKopru),
        });
        carpmaKaydet(outX, outY, hizOnce, raporHedef);
        if (sikismaKontrol()) break;
      }
    }

    if (kurtarmaBasladi) break;

    if (durum.x < s.minX) {
      durum.x = s.minX;
      if (durum.vx < 0) {
        const hizOnce = Math.hypot(durum.vx, durum.vy);
        durum.vx = Math.abs(durum.vx) * SEKME;
        kenarSekti = true;
        knx = -1;
        carpmaKaydet(1, 0, hizOnce, "kenar");
      }
    } else if (durum.x > s.maxX) {
      durum.x = s.maxX;
      if (durum.vx > 0) {
        const hizOnce = Math.hypot(durum.vx, durum.vy);
        durum.vx = -Math.abs(durum.vx) * SEKME;
        kenarSekti = true;
        knx = 1;
        carpmaKaydet(-1, 0, hizOnce, "kenar");
      }
    }

    if (durum.y < s.minY) {
      durum.y = s.minY;
      if (durum.vy < 0) {
        const hizOnce = Math.hypot(durum.vx, durum.vy);
        durum.vy = Math.abs(durum.vy) * SEKME;
        kenarSekti = true;
        kny = -1;
        carpmaKaydet(0, 1, hizOnce, "kenar");
      }
    } else if (durum.y > s.maxY) {
      durum.y = s.maxY;
      if (durum.vy > 0) {
        const hizOnce = Math.hypot(durum.vx, durum.vy);
        durum.vy = -Math.abs(durum.vy) * SEKME;
        kenarSekti = true;
        kny = 1;
        carpmaKaydet(0, -1, hizOnce, "kenar");
      }
    }

    if (sikismaKontrol()) break;

    durum.vx *= azal;
    durum.vy *= azal;

    const hiz = Math.hypot(durum.vx, durum.vy);
    const yeniHiz = Math.max(0, hiz - SABIT_YAVASLAMA * sdt);
    if (hiz > 1e-9 && yeniHiz > 0) {
      const olcek = yeniHiz / hiz;
      durum.vx *= olcek;
      durum.vy *= olcek;
    } else {
      durum.vx = 0;
      durum.vy = 0;
    }
  }

  return { kenarSekti, knx, kny, carpmalar, kurtarmaBasladi };
}

function olayZamani(e) {
  return Number.isFinite(e?.timeStamp) ? e.timeStamp : performance.now();
}

export function olayNoktalari(e) {
  const birlesik = typeof e?.getCoalescedEvents === "function" ? e.getCoalescedEvents() : null;
  const kaynak = birlesik && birlesik.length ? birlesik : [e];
  const noktalar = [];
  for (const o of kaynak) {
    if (!o || !Number.isFinite(o.clientX) || !Number.isFinite(o.clientY)) continue;
    noktalar.push({ x: o.clientX, y: o.clientY, t: olayZamani(o) });
  }
  return noktalar;
}

export function izEkle(izler, nokta) {
  const son = izler.at(-1);
  if (son && nokta.t < son.t) return;
  if (son && nokta.t === son.t && nokta.x === son.x && nokta.y === son.y) return;
  izler.push(nokta);
  while (izler.length > IZ_MAKS_ORNEK || (izler.length > 2 && nokta.t - izler[0].t > IZ_GECMIS_MS)) {
    izler.shift();
  }
}

export function hizTahminEt(izler, birakT) {
  if (!Array.isArray(izler) || izler.length < 2) return { vx: 0, vy: 0 };

  let sonIdx = izler.length - 1;
  const enSon = izler[sonIdx];
  while (
    sonIdx > 0 &&
    Math.hypot(enSon.x - izler[sonIdx - 1].x, enSon.y - izler[sonIdx - 1].y) < ANLAMLI_HAREKET_PX
  ) {
    sonIdx -= 1;
  }
  if (sonIdx < 1) return { vx: 0, vy: 0 };

  const sureSonum = (gecenMs) => {
    if (gecenMs >= DURAKLAMA_SIFIR_MS) return 0;
    if (gecenMs <= DURAKLAMA_KORU_MS) return 1;
    return (DURAKLAMA_SIFIR_MS - gecenMs) / (DURAKLAMA_SIFIR_MS - DURAKLAMA_KORU_MS);
  };

  const sonT = izler[sonIdx].t;
  const referansT = Number.isFinite(birakT) ? birakT : sonT;
  const duraklama = Math.max(0, referansT - sonT);
  const sonum = sureSonum(duraklama);
  if (sonum <= 0) return { vx: 0, vy: 0 };

  const pencereBas = sonT - IZ_GECMIS_MS;
  let basIdx = sonIdx;
  while (basIdx > 0 && izler[basIdx - 1].t >= pencereBas) {
    basIdx -= 1;
  }
  if (basIdx === sonIdx && sonIdx > 0 && sonT - izler[sonIdx - 1].t <= DURAKLAMA_KORU_MS) {
    basIdx = sonIdx - 1;
  }
  if (sonIdx - basIdx < 1) return { vx: 0, vy: 0 };

  const parcalar = [];
  let pBas = basIdx;
  for (let i = basIdx + 1; i <= sonIdx; i++) {
    const dt = izler[i].t - izler[pBas].t;
    if (dt >= HIZ_PARCA_MIN_MS) {
      const vx = (izler[i].x - izler[pBas].x) / dt;
      const vy = (izler[i].y - izler[pBas].y) / dt;
      parcalar.push({ bas: pBas, bit: i, vx, vy, hiz: Math.hypot(vx, vy) });
      pBas = i;
    }
  }

  if (pBas < sonIdx) {
    if (parcalar.length > 0) {
      const sonParca = parcalar[parcalar.length - 1];
      const dt = izler[sonIdx].t - izler[sonParca.bas].t;
      if (dt > 1e-3) {
        const vx = (izler[sonIdx].x - izler[sonParca.bas].x) / dt;
        const vy = (izler[sonIdx].y - izler[sonParca.bas].y) / dt;
        sonParca.bit = sonIdx;
        sonParca.vx = vx;
        sonParca.vy = vy;
        sonParca.hiz = Math.hypot(vx, vy);
      }
    } else {
      const dt = izler[sonIdx].t - izler[pBas].t;
      if (dt > 1e-3) {
        const vx = (izler[sonIdx].x - izler[pBas].x) / dt;
        const vy = (izler[sonIdx].y - izler[pBas].y) / dt;
        parcalar.push({ bas: pBas, bit: sonIdx, vx, vy, hiz: Math.hypot(vx, vy) });
      }
    }
  }
  if (parcalar.length === 0) return { vx: 0, vy: 0 };

  const sonPencereBas = sonT - HIZ_SON_PENCERE_MS;
  let sonBasIdx = sonIdx;
  while (sonBasIdx > basIdx && izler[sonBasIdx - 1].t >= sonPencereBas) {
    sonBasIdx -= 1;
  }
  while (sonBasIdx > basIdx && sonT - izler[sonBasIdx].t < HIZ_PARCA_MIN_MS) {
    sonBasIdx -= 1;
  }
  if (sonBasIdx === sonIdx && sonIdx > basIdx) sonBasIdx = sonIdx - 1;
  const sonDt = sonT - izler[sonBasIdx].t;
  const sonVx = sonDt > 1e-3 ? (izler[sonIdx].x - izler[sonBasIdx].x) / sonDt : 0;
  const sonVy = sonDt > 1e-3 ? (izler[sonIdx].y - izler[sonBasIdx].y) / sonDt : 0;
  const sonHiz = Math.hypot(sonVx, sonVy);

  let tepeHiz = 0;
  let yavaslamaSureCarpan = 1;
  let yonX = 0;
  let yonY = 0;

  if (parcalar.length === 1) {
    tepeHiz = parcalar[0].hiz;
    yavaslamaSureCarpan = sureSonum(Math.max(0, sonT - izler[parcalar[0].bit].t));
    if (tepeHiz > 1e-6) {
      yonX = parcalar[0].vx / tepeHiz;
      yonY = parcalar[0].vy / tepeHiz;
    }
  } else {

    const ciftSec = (yonFiltreli) => {
      const adaylar = [];
      let maksHiz = 0;
      for (let i = 0; i < parcalar.length - 1; i++) {
        const a = parcalar[i];
        const b = parcalar[i + 1];
        if (a.hiz <= 1e-6 || b.hiz <= 1e-6) continue;
        const uyum = (a.vx * b.vx + a.vy * b.vy) / (a.hiz * b.hiz);
        if (uyum <= 0) continue;
        const tx = a.vx + b.vx;
        const ty = a.vy + b.vy;
        const tBoy = Math.hypot(tx, ty);
        if (tBoy <= 1e-6) continue;
        const ux = tx / tBoy;
        const uy = ty / tBoy;
        if (yonFiltreli && ux * sonVx + uy * sonVy < 0) continue;
        const ciftHiz = Math.min(a.hiz, b.hiz) * Math.sqrt((1 + uyum) / 2);
        if (ciftHiz > maksHiz) maksHiz = ciftHiz;
        adaylar.push({ hiz: ciftHiz, bitT: izler[b.bit].t, ux, uy });
      }
      if (maksHiz <= 1e-6) return { hiz: 0, carpan: 0, ux: 0, uy: 0 };
      const platoEsik = maksHiz * HIZ_TEPE_PLATO_ORAN;
      let secilen = adaylar[0];
      for (const aday of adaylar) {

        if (aday.hiz >= platoEsik) secilen = aday;
      }
      const ciftSureCarpan = sureSonum(Math.max(0, sonT - secilen.bitT));
      return { hiz: secilen.hiz, carpan: ciftSureCarpan, ux: secilen.ux, uy: secilen.uy };
    };

    const sonYonGuvenilir = sonHiz >= HAFIF_ESIK;
    let secim = sonYonGuvenilir ? ciftSec(true) : ciftSec(false);
    if (secim.hiz <= 1e-6 && sonYonGuvenilir) {
      secim = ciftSec(false);
    }
    tepeHiz = secim.hiz;
    yavaslamaSureCarpan = secim.carpan;
    yonX = secim.ux;
    yonY = secim.uy;
  }

  if (tepeHiz <= 1e-6 || yavaslamaSureCarpan <= 0) return { vx: 0, vy: 0 };

  const sonIleri = Math.max(0, sonVx * yonX + sonVy * yonY);
  const sonOran = Math.min(1, sonIleri / tepeHiz);
  const yavaslamaCarpan = HIZ_YAVASLAMA_TABAN + (1 - HIZ_YAVASLAMA_TABAN) * sonOran;

  const cikisHiz = tepeHiz * yavaslamaCarpan * yavaslamaSureCarpan * sonum;
  const vx = yonX * cikisHiz;
  const vy = yonY * cikisHiz;
  if (!Number.isFinite(vx) || !Number.isFinite(vy)) return { vx: 0, vy: 0 };
  return { vx, vy };
}

export function yolArkadasi(ais) {
  const ekranlar = [...document.querySelectorAll("main > .ekran[data-ais-hedef]")];
  if (!ais || !ekranlar.length) return { evrimle: () => {}, konus: () => {} };

  const boyut = () => ais.offsetWidth || Number(ais.getAttribute("boyut")) || 84;

  let olculenBoyut = boyut();
  const dar = () => matchMedia("(max-width: 760px)").matches;
  const soylendi = new Set();
  const gorunurEvler = new Set();
  const darbeZamanlayici = new WeakMap();

  let simdiki = null;
  let konum = { x: 0, y: 0 };
  let egim = 0;
  let ucus = null;
  let ucusEgimSayac = null;
  let bekleyenKonus = null;
  let fizik = null;
  let aktifDurum = null;
  let aktifHedefler = null;
  let fizikKaydirTemizle = null;
  let evde = false;
  let ezilmeSayac = null;
  let evrimSayac = null;
  let ozelSus = null;
  let ozelUzat = null;
  let agirlasmaBitis = 0;
  let agirSayac = null;
  let starlinkSira = 0;
  let atisZamanlari = [];
  let tutus = null;
  let sonAtis = 0;

  let tikBastirBitis = 0;
  let tikBastirSayac = null;
  const tikBastirDinleyici = (c) => {
    const aktif = performance.now() <= tikBastirBitis;
    tikBastirTemizle();
    if (aktif) c.stopImmediatePropagation();
  };
  const tikBastirTemizle = () => {
    clearTimeout(tikBastirSayac);
    tikBastirSayac = null;
    tikBastirBitis = 0;
    ais.removeEventListener("click", tikBastirDinleyici, { capture: true });
  };
  const tiklamaBastir = (sureMs = TIK_BASTIR_MS) => {
    tikBastirTemizle();
    tikBastirBitis = performance.now() + sureMs;
    ais.addEventListener("click", tikBastirDinleyici, { capture: true });
    tikBastirSayac = setTimeout(tikBastirTemizle, sureMs);
  };

  const balonuSustur = () => {
    clearTimeout(ozelSus);
    clearTimeout(ozelUzat);
    if (ais.balonuKapat) ais.balonuKapat();
    else ais.classList.remove("konusuyor");
  };

  const konus = (metin, sureMs) => {
    if (!metin || evde) return;

    if (tutus?.surukleniyor) return;
    if (ucus) {
      bekleyenKonus = { metin, sureMs };
      return;
    }
    clearTimeout(ozelSus);
    clearTimeout(ozelUzat);
    ais.soyle?.(metin);
    if (fizik) ais.balonuTakipEt?.(konum.x, konum.y, olculenBoyut);
    if (typeof sureMs === "number" && sureMs > 0) {
      if (sureMs > 5400) {
        ozelUzat = setTimeout(() => {
          if (!evde && !tutus?.surukleniyor && !ucus) {
            ais.soyle?.(metin);
            if (fizik) ais.balonuTakipEt?.(konum.x, konum.y, olculenBoyut);
          }
        }, 4800);
      }
      ozelSus = setTimeout(() => {
        clearTimeout(ozelUzat);
        if (ais.balonuKapat) ais.balonuKapat();
        else ais.classList.remove("konusuyor");
      }, sureMs);
    }
  };

  const evrimle = (faz, sessiz = false) => {
    const yeniFaz = fazCoz(faz);
    if (!yeniFaz) return;
    if ((ais.getAttribute("faz") || "ais") !== yeniFaz) {
      ais.setAttribute("faz", yeniFaz);
    }
    if (!azHareket()) {
      ais.classList.remove("evrildi");
      void ais.offsetWidth;
      ais.classList.add("evrildi");
      clearTimeout(evrimSayac);
      evrimSayac = setTimeout(() => ais.classList.remove("evrildi"), 760);
    }
    if (!sessiz && !evde && FAZ_SOZLERI[yeniFaz]) {
      konus(FAZ_SOZLERI[yeniFaz]);
    }
  };

  const evrim40Kontrol = (kare) => {
    if (oturum.evrildi40 || kare < 40 || evde) return;
    oturumGuncelle({ evrildi40: true });
    evrimle("aisen", true);
    konus("40 kare birikti. Pikselim yarıya indi; fırlatırken biraz daha saygı bekliyorum.", 6800);
  };

  const sinirla = (p, b = olculenBoyut) => noktaSinirla(p, b, innerWidth, innerHeight);

  const yerlestir = (p, r = egim, sinirlaUygula = true) => {
    const guvenliP = sinirlaUygula ? sinirla(p) : p;
    const guvenliR = Number.isFinite(r) ? r : 0;
    konum = guvenliP;
    egim = guvenliR;
    ais.style.transform = `translate(${guvenliP.x.toFixed(1)}px, ${guvenliP.y.toFixed(1)}px)`;
    ais.style.setProperty("--egim", guvenliR.toFixed(1));
  };

  const tunek = (ekran) => {
    const b = boyut();
    olculenBoyut = b;
    if (dar()) return sinirla({ x: innerWidth - b - 16, y: innerHeight - b - 20 }, b);
    const hedef = ekran.matches(ekran.dataset.aisHedef) ? ekran : ekran.querySelector(ekran.dataset.aisHedef);
    const e = ekran.getBoundingClientRect();
    const h = (hedef || ekran).getBoundingClientRect();
    const [fx, fy, dx = 0, dy = 0] = (ekran.dataset.aisKonum || "1 1 -48 -48").split(" ").map(Number);
    return sinirla({ x: h.left + fx * h.width - b / 2 + dx, y: h.top - e.top + fy * h.height - b / 2 + dy }, b);
  };

  const durdur = () => {
    if (fizik) cancelAnimationFrame(fizik);
    fizik = null;
    aktifDurum = null;
    aktifHedefler = null;
    fizikKaydirTemizle?.();
    fizikKaydirTemizle = null;
  };

  const secimiEngelle = (e) => {
    e.preventDefault();
  };
  let tutusEngelAktif = false;
  const tutusEngelAc = () => {
    if (tutusEngelAktif) return;
    tutusEngelAktif = true;
    document.documentElement.classList.add("ais-tutus");
    document.addEventListener("selectstart", secimiEngelle, true);
    document.addEventListener("dragstart", secimiEngelle, true);
  };
  const tutusEngelKapat = () => {
    if (!tutusEngelAktif) return;
    tutusEngelAktif = false;
    document.documentElement.classList.remove("ais-tutus");
    document.removeEventListener("selectstart", secimiEngelle, true);
    document.removeEventListener("dragstart", secimiEngelle, true);
  };

  const tutusuBitir = (e, firlatilsin = false) => {
    if (!tutus) {
      tutusEngelKapat();
      return;
    }
    if (e && typeof e.pointerId === "number" && e.pointerId !== tutus.id) return;
    const t = tutus;
    tutus = null;
    tutusEngelKapat();
    ais.classList.remove("tutuluyor");
    if (ais.hasPointerCapture?.(t.id)) {
      try {
        ais.releasePointerCapture(t.id);
      } catch {

      }
    }

    if (!t.surukleniyor) {
      if (e?.type === "pointerup" && t.uykudan) {
        tiklamaBastir(TIK_BASTIR_MS);
        konus("Kare yarım kaldı. Baştan alacağız.");
        return;
      }
      if (!evde && e?.type !== "pointerup") yerlestir(sinirla(konum), 0);
      return;
    }

    tiklamaBastir(TIK_BASTIR_MS);
    ais.classList.add("tasindi");
    if (firlatilsin && !evde) {
      const simdi = performance.now();

      const tahmin = hizTahminEt(t.izler, olayZamani(e));
      const agirCarpan = simdi < agirlasmaBitis ? AGIR_ATIS_CARPAN : 1;

      const sinirli = hizSinirla(tahmin.vx * agirCarpan, tahmin.vy * agirCarpan);
      firlat({ x: sinirli.vx, y: sinirli.vy }, t.uykudan);
      return;
    }
    if (!evde) yerlestir(sinirla(konum), 0);
  };

  const tutusuKapat = () => tutusuBitir(null, false);

  const evdeGuncelle = (zorlaGizle) => {
    const yeniEvde =
      typeof zorlaGizle === "boolean"
        ? zorlaGizle
        : gorunurEvler.size > 0 || Boolean(simdiki?.hasAttribute("data-ais-ev"));

    if (yeniEvde) {
      evde = true;
      bekleyenKonus = null;
      tutusuKapat();
      durdur();
      clearTimeout(ucusEgimSayac);
      ucusEgimSayac = null;
      if (ucus) {
        ucus.cancel();
        ucus = null;
      }
      balonuSustur();
      ais.classList.add("evde");
      ais.classList.remove("konusuyor", "tutuluyor", "ezildi");
      return;
    }

    if (evde) {
      evde = false;
      ais.classList.remove("evde");
      yerlestir(sinirla(konum), 0);
      evrim40Kontrol(oturum.kare);
    }
  };

  const iz = (x, y, b) => {
    if (evde || azHareket()) return;

    const k =
      typeof x === "number" && typeof y === "number"
        ? { left: x, top: y, width: b || olculenBoyut, height: b || olculenBoyut }
        : ais.getBoundingClientRect();
    const n = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.className = "ais-iz";
      const kenar = Math.random() < 0.7 ? 3 : 5;
      p.style.cssText = `left:${k.left + k.width / 2 + (Math.random() - 0.5) * k.width * 0.5}px;top:${k.top + k.height / 2 + (Math.random() - 0.5) * k.height * 0.5}px;width:${kenar}px;height:${kenar}px;background:${IZ_RENK[Math.floor(Math.random() * IZ_RENK.length)]};--dy:${8 + Math.random() * 18}px`;
      p.addEventListener("animationend", () => p.remove(), { once: true });
      document.body.append(p);
    }
  };

  const kivilcimSac = (x, y) => {
    if (azHareket()) return;
    const adet = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < adet; i++) {
      const aci = (Math.PI * 2 * i) / adet + (Math.random() - 0.5) * 0.7;
      const uzak = 14 + Math.random() * 18;
      const p = document.createElement("i");
      p.className = "ais-kivilcim";
      const kenar = Math.random() < 0.5 ? 3 : 4;
      p.style.cssText = `left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${kenar}px;height:${kenar}px;background:${IZ_RENK[i % IZ_RENK.length]};--kx:${(Math.cos(aci) * uzak).toFixed(1)}px;--ky:${(Math.sin(aci) * uzak).toFixed(1)}px`;
      const sil = () => p.remove();
      p.addEventListener("animationend", sil, { once: true });
      setTimeout(sil, 460);
      document.body.append(p);
    }
  };

  const ezil = (nx, ny) => {
    if (azHareket()) return;
    ais.style.setProperty("--ez-x", nx !== 0 ? "0.84" : "1.14");
    ais.style.setProperty("--ez-y", ny !== 0 ? "0.84" : "1.14");
    ais.classList.add("ezildi");
    clearTimeout(ezilmeSayac);
    ezilmeSayac = setTimeout(() => ais.classList.remove("ezildi"), 90);
  };

  const hedefEsnet = (el, nx, ny) => {
    if (!el || azHareket()) return;
    el.style.setProperty("--cx", `${(nx * 3).toFixed(1)}px`);
    el.style.setProperty("--cy", `${(ny * 3).toFixed(1)}px`);
    el.classList.add("ais-darbe");
    clearTimeout(darbeZamanlayici.get(el));
    darbeZamanlayici.set(
      el,
      setTimeout(() => {
        el.classList.remove("ais-darbe");
      }, 130),
    );
  };

  const ucur = (hedef, bitince, sureMs = UCUS_MS) => {
    clearTimeout(ucusEgimSayac);
    ucusEgimSayac = null;
    ucus?.cancel();
    durdur();
    balonuSustur();
    ais.classList.remove("tasindi", "konusuyor");
    olculenBoyut = boyut();
    const bas = sinirla(konum);
    const sonHedef = sinirla(hedef);
    const yukari = Math.min(140, 40 + Math.hypot(sonHedef.x - bas.x, sonHedef.y - bas.y) * 0.18);

    const orta = sinirla({ x: (bas.x + sonHedef.x) / 2, y: Math.min(bas.y, sonHedef.y) - yukari });
    const yatik = Math.sign(sonHedef.x - bas.x) * 8;
    ais.classList.add("ucuyor");
    const anim = ais.animate(
      [
        { transform: `translate(${bas.x}px, ${bas.y}px)` },
        { transform: `translate(${orta.x}px, ${orta.y}px)`, offset: 0.45 },
        { transform: `translate(${sonHedef.x}px, ${sonHedef.y}px)` },
      ],
      { duration: sureMs, easing: "cubic-bezier(0.45, 0, 0.2, 1)" },
    );
    ucus = anim;
    const izci = setInterval(iz, IZ_ARALIK);
    const bitir = () => {
      clearInterval(izci);
      clearTimeout(ucusEgimSayac);
      ucusEgimSayac = null;
      ais.classList.remove("ucuyor");
    };
    anim.onfinish = () => {
      bitir();
      if (ucus === anim) ucus = null;
      yerlestir(sonHedef, 0);
      bitince?.();
      if (bekleyenKonus && !evde && !tutus?.surukleniyor) {
        const sira = bekleyenKonus;
        bekleyenKonus = null;
        konus(sira.metin, sira.sureMs);
      }
    };
    anim.oncancel = () => {
      bitir();
      if (ucus === anim) ucus = null;
    };
    yerlestir(sonHedef, yatik);
    ucusEgimSayac = setTimeout(() => {
      if (ucus === anim) yerlestir(sonHedef, 0);
    }, sureMs * 0.55);
  };

  const tac = (takili) => {
    const simdi = ais.getAttribute("aksesuar") === "tac";
    if (simdi === takili) return;
    if (takili) ais.setAttribute("aksesuar", "tac");
    else ais.removeAttribute("aksesuar");
    ais._ciz?.();
  };

  const sozler = (ekran) => {
    try {
      return JSON.parse(ekran.dataset.aisSozler || "[]");
    } catch {
      return [];
    }
  };

  const sozleriKur = (ekran) => {
    const liste = sozler(ekran);
    const tikla = liste.length < 2 ? liste : ekran === ekranlar[0] ? liste.slice(1) : [...liste.slice(1), liste[0]];
    if (tikla.length) ais.dataset.sozler = JSON.stringify(tikla);
  };

  const ilkSoz = (ekran) => {
    if (soylendi.has(ekran.id)) return;
    const ilk = sozler(ekran)[0];
    if (!ilk) return;
    soylendi.add(ekran.id);
    setTimeout(() => simdiki === ekran && !evde && konus(ilk), ekran === ekranlar[0] ? 1600 : 0);
  };

  const vardi = (ekran) => {
    if (ekran === simdiki) return;
    simdiki = ekran;
    const fener = ekran.hasAttribute("data-ais-fener");
    const ev = ekran.hasAttribute("data-ais-ev");
    ais.classList.toggle("fener", fener);
    tac(fener);
    sozleriKur(ekran);

    if (ev) {
      tutusuKapat();
      yerlestir(tunek(ekran), 0);
      evdeGuncelle(true);
      return;
    }

    evdeGuncelle();
    if (evde) return;

    if (tutus) return;
    if (azHareket()) {
      yerlestir(tunek(ekran), 0);
      ilkSoz(ekran);
      return;
    }
    ucur(tunek(ekran), () => simdiki === ekran && !evde && ilkSoz(ekran));
  };

  ais.classList.add("yol-arkadasi");
  simdiki = ekranlar[0];
  sozleriKur(simdiki);
  yerlestir(tunek(simdiki), 0);

  const evOgeleri = [...document.querySelectorAll("[data-ais-ev], footer.alt")];
  if (evOgeleri.length) {
    const evGozcusu = new IntersectionObserver(
      (girdiler) => {
        for (const g of girdiler) {
          const esik = dar() ? 0.04 : 0.12;
          if (g.isIntersecting && g.intersectionRatio >= esik) gorunurEvler.add(g.target);
          else gorunurEvler.delete(g.target);
        }
        evdeGuncelle();
      },
      { threshold: [0, 0.04, 0.12, 0.25] },
    );
    evOgeleri.forEach((o) => evGozcusu.observe(o));
  }

  document.addEventListener("aisenit-oturum", (e) => {
    evrim40Kontrol(e.detail?.kare ?? oturum.kare);
  });

  document.addEventListener("starlink-gecis", (e) => {
    if (evde) return;
    const d = e.detail;
    const atildi =
      d === "atildi" ||
      d?.durum === "atildi" ||
      d?.sonuc === "atildi" ||
      d?.tip === "atildi" ||
      d?.atildi === true;
    const gecti =
      d === "gecti" ||
      d?.durum === "gecti" ||
      d?.sonuc === "gecti" ||
      d?.tip === "gecti" ||
      d?.gecti === true ||
      (!atildi && d?.atildi === false);

    if (atildi) {
      konus("İyi refleks. Kareyi attık.");
    } else if (gecti) {
      const soz = STARLINK_GECTI_SOZLERI[starlinkSira % STARLINK_GECTI_SOZLERI.length];
      starlinkSira += 1;
      konus(soz);
    }
  });

  const gozcu = new IntersectionObserver(
    (girdiler) => {
      for (const g of girdiler) if (g.isIntersecting) vardi(g.target);
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  ekranlar.forEach((e) => gozcu.observe(e));

  ilkSoz(simdiki);

  const metinKabugu = (el) => {
    if (!el || typeof document === "undefined" || !document.createRange) return null;
    try {
      const range = document.createRange();
      range.selectNodeContents(el);
      const kutular = [...range.getClientRects()].filter((k) => k.width >= 2 && k.height >= 2);
      if (!kutular.length) return null;
      const noktalar = [];
      for (const k of kutular) {
        noktalar.push(
          { x: k.left, y: k.top },
          { x: k.right, y: k.top },
          { x: k.right, y: k.bottom },
          { x: k.left, y: k.bottom },
        );
      }
      const zarf = disbukeyZarf(noktalar);
      return zarf.length >= 3 ? zarf : null;
    } catch {
      return null;
    }
  };

  const hedefleriTopla = (ax, ay, yaricap) => {
    const liste = [];
    const eklenen = new Set();

    const ekle = (el, tur, ozelKutu, sabit = false, cokgen = null) => {
      if (!el || eklenen.has(el)) return;
      let hedef;
      if (Array.isArray(cokgen) && cokgen.length >= 3) {
        hedef = cokgenHedefYap(cokgen, { el, tur, sabit });
        if (!hedef || hedef.r - hedef.l < 6 || hedef.b - hedef.t < 6) return;
      } else {
        const r = ozelKutu || el.getBoundingClientRect();
        if (r.width < 6 || r.height < 6) return;
        hedef = {
          el,
          tur,
          sabit,
          l: r.left,
          t: r.top,
          r: r.right,
          b: r.bottom,

          sonCarpma: -Infinity,
          icinde: false,
        };
      }

      if (hedef.b <= -innerHeight || hedef.t >= innerHeight * 2 || hedef.r <= 0 || hedef.l >= innerWidth) return;
      eklenen.add(el);

      hedef.icinde = Boolean(hedefTemas(ax, ay, yaricap, hedef));
      liste.push(hedef);
    };

    const ent = document.querySelector(".ust .entegrasyon");
    if (ent) ekle(ent, "entegrasyon", null, true);

    if (!simdiki) return liste;

    const kanal = simdiki.querySelector("kanal-ayrimi");
    if (kanal) {

      const zarf = kanal.carpismaKabugu?.();
      if (zarf && zarf.length >= 3) {
        ekle(kanal, "kanal", null, false, zarf);
      } else {
        const yigin = kanal.querySelector(".ka-yigin");
        ekle(kanal, "kanal", yigin ? yigin.getBoundingClientRect() : null);
      }
    } else if (simdiki.classList.contains("proje-001")) {
      const pg = simdiki.querySelector(".proje-gorsel");
      if (pg) ekle(pg, "kanal");
    }

    const krallik = simdiki.querySelector("krallik-sahne, .krallik-kare");
    if (krallik) {

      const krallikGorsel = krallik.matches(".ks-cerceve, .krallik-kare")
        ? krallik
        : krallik.querySelector(".ks-cerceve, .krallik-kare, img.ks-foto.etkin, img") || krallik;
      ekle(krallikGorsel, "krallik");
    }

    const istif = simdiki.querySelector("istif-tuvali");
    if (istif) {
      const r = istif.getBoundingClientRect();

      const band = {
        left: r.left + r.width * 0.16,
        right: r.left + r.width * 0.84,
        top: r.top + r.height * 0.24,
        bottom: r.top + r.height * 0.58,
        width: r.width * 0.68,
        height: r.height * 0.34,
      };
      ekle(istif, "istif", band);
    }

    simdiki.querySelectorAll("h2, .proje-gorsel, .mozaik .kare").forEach((el) => {
      if (el.classList.contains("proje-gorsel") && el.querySelector("kanal-ayrimi, krallik-sahne, .krallik-kare")) {
        return;
      }
      if (el.tagName === "H2") {

        ekle(el, "genel", null, false, metinKabugu(el));
        return;
      }
      ekle(el, "genel");
    });

    return aralikKopruleriEkle(liste, yaricap * 2, ax, ay, yaricap);
  };

  addEventListener("resize", () => {
    olculenBoyut = boyut();
    if (evde) return;
    if (fizik) {
      const yeniP = sinirla(aktifDurum || konum);
      if (aktifDurum) {
        aktifDurum.x = yeniP.x;
        aktifDurum.y = yeniP.y;
      }
      yerlestir(yeniP, egim, false);
      aktifHedefler = hedefleriTopla(yeniP.x + olculenBoyut / 2, yeniP.y + olculenBoyut / 2, olculenBoyut * 0.38);
      if (ais.classList.contains("konusuyor")) ais.balonuTakipEt?.(yeniP.x, yeniP.y, olculenBoyut);
      return;
    }
    if (tutus) {
      yerlestir(sinirla(konum), egim);
      return;
    }
    if (ucus) {
      ucus.cancel();
      ucus = null;
      if (simdiki) yerlestir(tunek(simdiki), 0);
      return;
    }
    if (ais.classList.contains("tasindi")) {
      yerlestir(sinirla(konum), 0);
      ais.balonuYerlestir?.();
      return;
    }
    if (simdiki) {
      yerlestir(tunek(simdiki), 0);
      ais.balonuYerlestir?.();
    }
  });

  const guvenlikKontrol = () => {
    if (evde || document.hidden || tutus) return;
    const b = olculenBoyut || 84;
    const gecersiz = !Number.isFinite(konum.x) || !Number.isFinite(konum.y);
    let disinda =
      gecersiz ||
      konum.x < 4 ||
      konum.x + b > innerWidth - 4 ||
      konum.y < 4 ||
      konum.y + b > innerHeight - 4;

    if (!disinda && !ucus && !fizik) {
      const r = ais.getBoundingClientRect();
      if (r.width > 0 && (r.left < 3.5 || r.right > innerWidth - 3.5 || r.top < 3.5 || r.bottom > innerHeight - 3.5)) {
        disinda = true;
      }
    }
    if (!disinda) return;

    durdur();
    const hedef = tunek(simdiki || ekranlar[0]);
    if (azHareket()) {
      yerlestir(hedef, 0);
      return;
    }
    if (gecersiz) {
      konum = sinirla({ x: innerWidth / 2 - b / 2, y: innerHeight / 2 - b / 2 }, b);
    }
    ucur(hedef, null, 480);
  };
  setInterval(guvenlikKontrol, GUVENLIK_ARALIK_MS);

  if (azHareket()) {
    return { evrimle, konus };
  }

  const simdikiKonum = () => {
    const k = ais.getBoundingClientRect();
    const b = olculenBoyut;
    return sinirla({ x: k.left + (k.width - b) / 2, y: k.top + (k.height - b) / 2 }, b);
  };

  let uykuSayac;
  let ilkUyanis = true;
  let uykudanEtkilesim = false;

  const uykuyuKur = () => {
    clearTimeout(uykuSayac);
    uykuSayac = setTimeout(() => {
      if (!evde && !tutus && !fizik) ais.classList.add("uyuyor");
    }, UYKU_MS);
  };

  const uyan = () => {
    if (ais.classList.contains("uyuyor")) {
      ais.classList.remove("uyuyor");
      if (ilkUyanis && !evde && !uykudanEtkilesim) {
        ilkUyanis = false;
        konus("Uyumuyordum. Uzun pozlamadaydım.");
      }
    }
    uykudanEtkilesim = false;
    uykuyuKur();
  };

  for (const olay of ["pointermove", "wheel", "keydown", "touchstart", "scroll"]) {
    addEventListener(olay, uyan, { passive: true });
  }
  uykuyuKur();

  ais.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || evde) return;

    e.preventDefault();
    if (typeof getSelection === "function") getSelection()?.removeAllRanges?.();

    tikBastirTemizle();
    if (tutus) tutusuKapat();
    tutusEngelAc();
    olculenBoyut = boyut();
    const uykudan = ais.classList.contains("uyuyor");
    if (uykudan) {
      uykudanEtkilesim = true;
      ais.classList.remove("uyuyor");
      uykuyuKur();
    }
    if (ucus) {
      const p = simdikiKonum();
      ucus.cancel();
      ucus = null;
      yerlestir(p, egim);
    }
    durdur();
    tutus = {
      id: e.pointerId,
      dx: e.clientX - konum.x,
      dy: e.clientY - konum.y,
      x0: e.clientX,
      y0: e.clientY,
      surukleniyor: false,
      uykudan,

      izler: [{ x: e.clientX, y: e.clientY, t: olayZamani(e) }],
    };
    try {
      ais.setPointerCapture(e.pointerId);
    } catch {

    }
  });

  addEventListener("pointermove", (e) => {
    if (!tutus || e.pointerId !== tutus.id) return;

    if (e.buttons === 0) {
      tutusuBitir(e, true);
      return;
    }

    const noktalar = olayNoktalari(e);
    for (const n of noktalar) {
      izEkle(tutus.izler, n);
      if (!tutus.surukleniyor && Math.hypot(n.x - tutus.x0, n.y - tutus.y0) >= SURUKLE_ESIK) {
        tutus.surukleniyor = true;
        bekleyenKonus = null;
        ais.classList.add("tutuluyor");
        balonuSustur();
      }
    }
    if (!tutus.surukleniyor) return;
    const hedefP = { x: e.clientX - tutus.dx, y: e.clientY - tutus.dy };

    const p = sinirla(hedefP);
    yerlestir(p, Math.max(-20, Math.min(20, (p.x - konum.x) * 1.2)), false);
  });

  const birak = (e) => tutusuBitir(e, true);

  addEventListener("pointerup", birak, true);
  addEventListener("pointercancel", birak, true);
  ais.addEventListener("lostpointercapture", birak);
  addEventListener("blur", () => tutusuBitir(null, false));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) tutusuBitir(null, false);
  });

  function firlat(v, uykudan = false) {
    const hiz = Math.hypot(v.x, v.y);

    if (!Number.isFinite(hiz) || hiz < HAFIF_ESIK) {
      yerlestir(sinirla(konum), 0);
      return;
    }

    const simdi = performance.now();
    oturumGuncelle({ atis: oturum.atis + 1 });

    atisZamanlari = atisZamanlari.filter((ts) => simdi - ts <= SERI_PENCERE_MS);
    atisZamanlari.push(simdi);
    const seri = atisZamanlari.length;

    let oncelikliKonustu = false;
    let ozelKonustu = false;

    if (uykudan) {
      oncelikliKonustu = true;
      konus("Uykudan fırlatılmak... bu da ilk.");
    } else if (seri === 10) {
      oncelikliKonustu = true;
      agirlasmaBitis = simdi + AGIR_SURE_MS;
      ais.classList.add("agir");
      clearTimeout(agirSayac);
      agirSayac = setTimeout(() => ais.classList.remove("agir"), AGIR_SURE_MS);
      konus("Bundan sonraki atışları sensör hatası sayıyorum.");
    } else if (seri === 7) {
      oncelikliKonustu = true;
      konus("Bu artık astrofizik değil, stres testi.");
    } else if (seri === 4) {
      oncelikliKonustu = true;
      konus("Deneyin hipotezi ne tam olarak?");
    } else if (hiz >= 2.3) {
      konus(YUKSEK_HIZ_SOZLERI[Math.floor(Math.random() * YUKSEK_HIZ_SOZLERI.length)]);
    } else if (hiz > 1.4 && simdi - sonAtis > 6000) {
      sonAtis = simdi;
      konus(ATIS_SOZLERI[Math.floor(Math.random() * ATIS_SOZLERI.length)]);
    }

    olculenBoyut = boyut();
    const b = olculenBoyut;
    const yaricap = b * 0.38;
    const bas = sinirla(konum, b);
    aktifHedefler = hedefleriTopla(bas.x + b / 2, bas.y + b / 2, yaricap);

    let sonScrollX = scrollX;
    let sonScrollY = scrollY;
    const kaydirGuncelle = () => {
      if (!aktifHedefler) return;
      const dsx = scrollX - sonScrollX;
      const dsy = scrollY - sonScrollY;
      sonScrollX = scrollX;
      sonScrollY = scrollY;
      if (!dsx && !dsy) return;
      for (const h of aktifHedefler) {
        if (h.sabit) continue;
        h.l -= dsx;
        h.r -= dsx;
        h.t -= dsy;
        h.b -= dsy;
        if (h.noktalar) {
          for (const p of h.noktalar) {
            p.x -= dsx;
            p.y -= dsy;
          }
        }
      }
    };
    addEventListener("scroll", kaydirGuncelle, { passive: true });
    fizikKaydirTemizle = () => removeEventListener("scroll", kaydirGuncelle);

    const durum = { x: bas.x, y: bas.y, vx: v.x, vy: v.y };

    const basCozum = baslangicOrtusturmeyiCoz(durum, b, yaricap, innerWidth, innerHeight, aktifHedefler);
    if (basCozum.cozuldu) {
      yerlestir({ x: durum.x, y: durum.y }, egim, false);
    }
    aktifDurum = durum;
    if (ais.classList.contains("konusuyor")) {
      ais.balonuTakipEt?.(durum.x, durum.y, b);
    }
    let son = null;
    let sonIz = 0;
    let sekmeSayisi = 0;

    const sekmeKaydet = () => {
      sekmeSayisi += 1;
      if (sekmeSayisi > oturum.maksSekme) {
        oturumGuncelle({ maksSekme: sekmeSayisi });
      }
    };

    const adim = (t) => {
      if (evde) {
        durdur();
        return;
      }

      if (son === null) son = t;
      const dt = Math.max(0, Math.min(40, t - son));
      son = t;

      const hedefler = aktifHedefler || [];
      const bAnlik = olculenBoyut;
      const { kenarSekti, knx, kny, carpmalar } = fizikAdim(
        durum,
        dt,
        bAnlik,
        bAnlik * 0.38,
        innerWidth,
        innerHeight,
        hedefler,
      );

      if (kenarSekti) {
        sekmeKaydet();
        ezil(knx, kny);
      }

      for (const c of carpmalar) {
        const { h, nx, ny, temasX, temasY, sert, hiz: carpmaHiz } = c;

        const esik = sert ? SERT_CARPISMA_ESIK : CARPISMA_HIZ_ESIK;
        if (carpmaHiz <= esik || t - h.sonCarpma < 240) continue;
        h.sonCarpma = t;

        if (sert) sekmeKaydet();
        oturumGuncelle({ carpisma: oturum.carpisma + 1 });
        ezil(nx, ny);
        kivilcimSac(temasX, temasY);

        if (h.tur !== "istif") hedefEsnet(h.el, nx, ny);

        if (h.tur === "entegrasyon") {
          if (!oncelikliKonustu && !ozelKonustu) {
            ozelKonustu = true;
            konus("Pozlamaya çarptım. Sigma-clipping bu kareyi reddeder.");
          }
        } else if (h.tur === "kanal") {
          document.querySelector("kanal-ayrimi")?.sars?.();
          if (!oncelikliKonustu && !ozelKonustu) {
            ozelKonustu = true;
            konus("Bir anlığına üçe ayrıldım. Hiç hoş değildi.");
          }
        } else if (h.tur === "krallik") {
          document.querySelector("krallik-sahne")?.parla?.();
          if (!oncelikliKonustu && !ozelKonustu) {
            ozelKonustu = true;
            konus("Kale duvarına çarptım. Prens görmemiştir umarım.");
          }
        } else if (h.tur === "istif") {
          document.querySelector("istif-tuvali")?.darbe?.(temasX, temasY);
          if (!oncelikliKonustu && !ozelKonustu) {
            ozelKonustu = true;
            konus("İstifin üstünden geçtim. On kareye düzelir.");
          }
        }
      }

      const h = Math.hypot(durum.vx, durum.vy);
      yerlestir({ x: durum.x, y: durum.y }, egim * 0.9 + durum.vx * 6 * 0.1, false);
      if (ais.classList.contains("konusuyor")) {
        ais.balonuTakipEt?.(durum.x, durum.y, bAnlik);
      }

      if (h > 0.25 && t - sonIz > IZ_ARALIK) {
        sonIz = t;
        iz(durum.x, durum.y, bAnlik);
      }
      if (!durum.kurtarma && h < 0.02) {
        durdur();
        yerlestir(sinirla({ x: durum.x, y: durum.y }, bAnlik), 0, false);
        ais.balonuYerlestir?.();
        if (sekmeSayisi > oturum.maksSekme) {
          oturumGuncelle({ maksSekme: sekmeSayisi });
        }
        if (sekmeSayisi >= 4 && !oncelikliKonustu && !ozelKonustu) {
          konus(`${sekmeSayisi} sekme. Kaçış hızına yaklaştık.`);
        }
        return;
      }
      fizik = requestAnimationFrame(adim);
    };

    fizik = requestAnimationFrame(adim);
  }

  return { evrimle, konus };
}
