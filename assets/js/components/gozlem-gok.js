import { azHareket } from "../lib/rastgele.js?v=20261127a";

const STARLINK_ILK_MIN_MS = 9500;
const STARLINK_ILK_MAX_MS = 14000;
const STARLINK_ARA_MIN_MS = 32000;
const STARLINK_ARA_MAX_MS = 52000;
const STARLINK_SURE_MIN_MS = 5600;
const STARLINK_SURE_MAX_MS = 7400;
const STARLINK_IZ_MS = 1400;
const STARLINK_MAX = 2;
const RET_GOSTER_MS = 1400;

const KAYAN_ILK_MIN_MS = 5500;
const KAYAN_ILK_MAX_MS = 10500;
const KAYAN_ARA_MIN_MS = 14000;
const KAYAN_ARA_MAX_MS = 26000;
const KAYAN_SURE_MIN_MS = 380;
const KAYAN_SURE_MAX_MS = 680;
const CAKISMA_PAY_MS = 2200;
const BOS_OLAY = Object.freeze([]);

export function kapakStarlinkRota(G, Y, adet, sure, rnd = Math.random) {
  const soldan = rnd() < 0.5;
  const basX = soldan ? -18 : G + 18;
  const basY = Y * (0.08 + rnd() * 0.28);
  const egim = (10 + rnd() * 14) * (Math.PI / 180);
  const ux = (soldan ? 1 : -1) * Math.cos(egim);
  const uy = Math.sin(egim);
  const aci = Math.atan2(uy, ux);
  const uzunluk = Math.hypot(G + 36, (G + 36) * Math.tan(egim));
  const aralik = Math.min(30, Math.max(15, G * 0.022));

  const uydular = [];
  let mesafe = 0;
  for (let i = 0; i < adet; i++) {
    if (i > 0) mesafe += aralik * (0.85 + rnd() * 0.3);
    uydular.push({
      geride: mesafe,
      parlaklik: 0.44 + rnd() * 0.34,
      yaricap: 1.0 + rnd() * 0.5,
    });
  }
  const trenBoy = mesafe;
  const hiz = (uzunluk + trenBoy) / Math.max(2400, sure - STARLINK_IZ_MS);
  const izBoy = hiz * STARLINK_IZ_MS;
  return { basX, basY, ux, uy, aci, uzunluk, trenBoy, hiz, izBoy, uydular };
}

export function kapakKayanYildiz(G, Y, sure, rnd = Math.random) {
  const boy = 115 + rnd() * 125;
  const yol = boy * 1.18;
  const renkSec = rnd();
  const renkTip = renkSec < 0.72 ? 0 : renkSec < 0.88 ? 1 : 2;
  const sola = rnd() < 0.5;
  const derece = sola ? 124 + rnd() * 32 : 24 + rnd() * 32;
  const aci = derece * (Math.PI / 180);
  const ux = Math.cos(aci);
  const uy = Math.sin(aci);
  const basX = G * (sola ? 0.42 + rnd() * 0.5 : 0.08 + rnd() * 0.5);
  const basY = Y * (0.06 + rnd() * 0.36);
  return { basX, basY, ux, uy, aci, boy, yol, sure, renkTip };
}

export class GozlemGokTakvimi {
  constructor(rnd = Math.random) {
    this.rnd = rnd;
    this.saat = 0;
    this.gorunur = true;
    this.starlinkSayisi = 0;
    this.starlink = null;
    this.retBitisSaat = null;
    this.kayan = null;
    this.sonrakiStarlinkSaat = this._aralik(STARLINK_ILK_MIN_MS, STARLINK_ILK_MAX_MS);
    this.sonrakiKayanSaat = this._aralik(KAYAN_ILK_MIN_MS, KAYAN_ILK_MAX_MS);
  }

  _aralik(min, max) {
    return min + this.rnd() * (max - min);
  }

  gorunurlukAyarla(acik) {
    this.gorunur = Boolean(acik);
  }

  uyduyuAt() {
    if (!this.starlink) return null;
    this.starlink = null;
    this.retBitisSaat = this.saat + RET_GOSTER_MS;
    this.sonrakiStarlinkSaat =
      this.starlinkSayisi < STARLINK_MAX
        ? this.saat + this._aralik(STARLINK_ARA_MIN_MS, STARLINK_ARA_MAX_MS)
        : Infinity;
    if (this.sonrakiKayanSaat !== null && this.sonrakiKayanSaat <= this.retBitisSaat + CAKISMA_PAY_MS) {
      this.sonrakiKayanSaat = this.retBitisSaat + CAKISMA_PAY_MS + this.rnd() * 3000;
    }
    return { tip: "starlink-atildi" };
  }

  adim(dtMs) {
    if (!this.gorunur || dtMs <= 0) return BOS_OLAY;
    this.saat += dtMs;
    let olaylar = null;
    const ekle = (o) => {
      if (!olaylar) olaylar = [];
      olaylar.push(o);
    };

    if (this.retBitisSaat !== null && this.saat >= this.retBitisSaat) {
      this.retBitisSaat = null;
      ekle({ tip: "ret-bitti" });
    }

    if (this.starlink && this.saat - this.starlink.basSaat >= this.starlink.sure) {
      this.starlink = null;
      ekle({ tip: "starlink-gecti" });
      this.sonrakiStarlinkSaat =
        this.starlinkSayisi < STARLINK_MAX
          ? this.saat + this._aralik(STARLINK_ARA_MIN_MS, STARLINK_ARA_MAX_MS)
          : Infinity;
      if (this.sonrakiKayanSaat !== null && this.sonrakiKayanSaat <= this.saat + CAKISMA_PAY_MS) {
        this.sonrakiKayanSaat = this.saat + CAKISMA_PAY_MS + this.rnd() * 3000;
      }
    }

    if (this.kayan && this.saat - this.kayan.basSaat >= this.kayan.sure) {
      this.kayan = null;
      this.sonrakiKayanSaat = this.saat + this._aralik(KAYAN_ARA_MIN_MS, KAYAN_ARA_MAX_MS);
    }

    if (
      !this.starlink &&
      this.retBitisSaat === null &&
      this.starlinkSayisi < STARLINK_MAX &&
      this.sonrakiStarlinkSaat !== null &&
      this.saat >= this.sonrakiStarlinkSaat
    ) {
      if (this.kayan) {
        this.sonrakiStarlinkSaat = this.kayan.basSaat + this.kayan.sure + 450;
      } else {
        this.starlinkSayisi += 1;
        const sure = this._aralik(STARLINK_SURE_MIN_MS, STARLINK_SURE_MAX_MS);
        const adet = 5 + Math.floor(this.rnd() * 5);
        this.starlink = { basSaat: this.saat, sure, adet };
        this.sonrakiStarlinkSaat = null;
        ekle({ tip: "starlink-basladi", starlink: this.starlink });
      }
    }

    if (!this.kayan && this.sonrakiKayanSaat !== null && this.saat >= this.sonrakiKayanSaat) {
      if (this.starlink || this.retBitisSaat !== null) {

      } else if (
        this.sonrakiStarlinkSaat !== null &&
        this.sonrakiStarlinkSaat < Infinity &&
        this.sonrakiStarlinkSaat - this.saat < 1200
      ) {
        this.sonrakiKayanSaat = this.sonrakiStarlinkSaat + STARLINK_SURE_MAX_MS + CAKISMA_PAY_MS;
      } else {
        const sure = this._aralik(KAYAN_SURE_MIN_MS, KAYAN_SURE_MAX_MS);
        this.kayan = { basSaat: this.saat, sure };
        this.sonrakiKayanSaat = null;
        ekle({ tip: "kayan-basladi", kayan: this.kayan });
      }
    }

    return olaylar || BOS_OLAY;
  }
}

function spriteTamponUret() {
  const nokta = document.createElement("canvas");
  nokta.width = 28;
  nokta.height = 28;
  const nc = nokta.getContext("2d");
  const ng = nc.createRadialGradient(14, 14, 0, 14, 14, 14);
  ng.addColorStop(0, "rgba(255, 250, 240, 1)");
  ng.addColorStop(0.25, "rgba(255, 245, 228, 0.72)");
  ng.addColorStop(0.58, "rgba(236, 232, 225, 0.16)");
  ng.addColorStop(1, "rgba(236, 232, 225, 0)");
  nc.fillStyle = ng;
  nc.fillRect(0, 0, 28, 28);

  const iz = document.createElement("canvas");
  iz.width = 256;
  iz.height = 6;
  const ic = iz.getContext("2d");
  const ig = ic.createLinearGradient(0, 0, 256, 0);
  ig.addColorStop(0, "rgba(236, 232, 225, 0)");
  ig.addColorStop(0.45, "rgba(236, 232, 225, 0.14)");
  ig.addColorStop(0.85, "rgba(255, 246, 230, 0.52)");
  ig.addColorStop(1, "rgba(255, 250, 240, 0.85)");
  ic.fillStyle = ig;
  ic.fillRect(0, 2.2, 256, 1.6);

  const kayanRenkler = [
    [255, 247, 234],
    [186, 245, 238],
    [255, 220, 178],
  ];
  const kayanlar = kayanRenkler.map(([r, g, b]) => {
    const kt = document.createElement("canvas");
    kt.width = 256;
    kt.height = 14;
    const kc = kt.getContext("2d");
    const kg = kc.createLinearGradient(0, 7, 246, 7);
    kg.addColorStop(0, `rgba(${r},${g},${b},0)`);
    kg.addColorStop(0.4, `rgba(${r},${g},${b},0.18)`);
    kg.addColorStop(0.8, `rgba(${r},${g},${b},0.65)`);
    kg.addColorStop(1, "rgba(255,255,255,1)");
    kc.fillStyle = kg;
    kc.beginPath();
    kc.moveTo(0, 7);
    kc.lineTo(244, 5.4);
    kc.lineTo(248, 7);
    kc.lineTo(244, 8.6);
    kc.closePath();
    kc.fill();

    const bg = kc.createRadialGradient(246, 7, 0, 246, 7, 6.5);
    bg.addColorStop(0, "rgba(255,255,255,1)");
    bg.addColorStop(0.35, `rgba(${r},${g},${b},0.75)`);
    bg.addColorStop(1, `rgba(${r},${g},${b},0)`);
    kc.fillStyle = bg;
    kc.fillRect(238, 0, 18, 14);
    return kt;
  });

  return { nokta, iz, kayanlar };
}

let kuruldu = false;

export function gozlemGokKur() {
  if (kuruldu || typeof document === "undefined") return;
  if (document.body?.dataset?.sayfa !== "gozlem") return;
  const kapak = document.getElementById("kapak");
  if (!kapak) return;
  kuruldu = true;

  const tuval = document.createElement("canvas");
  tuval.className = "gg-tuval";
  tuval.setAttribute("aria-hidden", "true");
  kapak.prepend(tuval);

  const uyari = document.createElement("div");
  uyari.className = "gg-uyari veri";
  uyari.setAttribute("role", "status");
  uyari.setAttribute("aria-live", "polite");

  const uyariMetin = document.createElement("span");
  uyariMetin.textContent = "1 kare kirli ·";

  const atBtn = document.createElement("button");
  atBtn.type = "button";
  atBtn.className = "gg-at";
  atBtn.textContent = "[At]";

  uyari.append(uyariMetin, " ", atBtn);
  kapak.append(uyari);

  const ctx = tuval.getContext("2d");
  const spritelar = spriteTamponUret();
  const takvim = new GozlemGokTakvimi();

  let cssG = 0;
  let cssY = 0;
  let dpr = 1;
  let gorunur = false;
  let raf = 0;
  let sonT = 0;
  let tuvalDolu = false;

  const olc = () => {
    const r = kapak.getBoundingClientRect();
    cssG = Math.max(1, r.width);
    cssY = Math.max(1, r.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(cssG * dpr);
    const h = Math.round(cssY * dpr);
    if (tuval.width !== w || tuval.height !== h) {
      tuval.width = w;
      tuval.height = h;
      tuvalDolu = false;
    }
  };

  const temizle = () => {
    if (!ctx || !tuvalDolu) return;
    ctx.clearRect(0, 0, tuval.width, tuval.height);
    tuvalDolu = false;
  };

  const uyariGizle = () => {
    uyari.classList.remove("gorunur", "reddedildi");
  };

  atBtn.addEventListener("click", () => {
    const sonuc = takvim.uyduyuAt();
    if (!sonuc) return;
    temizle();
    atBtn.hidden = true;
    uyariMetin.textContent = "REJECTED: 1";
    uyari.classList.add("reddedildi", "gorunur");

    document.dispatchEvent(new CustomEvent("starlink-gecis", { detail: { tip: "atildi", kaynak: "gozlem" } }));
  });

  const starlinkCiz = (s, gecenMs) => {
    const liderS = s.hiz * gecenMs;
    const izBoyPx = s.izBoy * dpr;
    const izKalinlik = 2.0 * dpr;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < s.uydular.length; i++) {
      const u = s.uydular[i];
      const pos = liderS - u.geride;
      if (pos < -14 || pos - s.izBoy > s.uzunluk + 14) continue;
      const x = (s.basX + s.ux * pos) * dpr;
      const y = (s.basY + s.uy * pos) * dpr;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(s.aci);
      ctx.globalAlpha = u.parlaklik * 0.24;
      ctx.drawImage(spritelar.iz, -izBoyPx, -izKalinlik * 0.5, izBoyPx, izKalinlik);
      ctx.restore();

      if (pos >= -10 && pos <= s.uzunluk + 10) {
        const cap = u.yaricap * 3.4 * dpr;
        ctx.globalAlpha = u.parlaklik * 0.9;
        ctx.drawImage(spritelar.nokta, x - cap * 0.5, y - cap * 0.5, cap, cap);
      }
    }
    ctx.restore();
  };

  const kayanCiz = (k, gecenMs) => {
    const u = Math.min(1, Math.max(0, gecenMs / k.sure));
    const zarf = u < 0.16 ? u / 0.16 : Math.pow(Math.max(0, 1 - (u - 0.16) / 0.84), 1.45);
    if (zarf <= 0.005) return;
    const ilerleme = 1 - Math.pow(1 - u, 1.35);
    const s = ilerleme * k.yol;
    const kx = (k.basX + k.ux * s) * dpr;
    const ky = (k.basY + k.uy * s) * dpr;
    const acilis = Math.min(1, u / 0.25);
    const kuyrukCss = k.boy * acilis * (1 - Math.max(0, u - 0.6) * 0.65);
    const hPx = 6 * dpr;
    const sprite = spritelar.kayanlar[k.renkTip] || spritelar.kayanlar[0];

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = zarf * 0.92;
    ctx.translate(kx, ky);
    ctx.rotate(k.aci);
    ctx.drawImage(sprite, -kuyrukCss * dpr, -hPx * 0.5, (kuyrukCss + 5) * dpr, hPx);
    ctx.restore();
  };

  const durdur = () => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  const adim = (t) => {
    if (!gorunur || document.hidden || azHareket()) {
      raf = 0;
      return;
    }
    if (!sonT) sonT = t;
    const dt = Math.min(50, Math.max(0, t - sonT));
    sonT = t;

    const olaylar = takvim.adim(dt);
    for (let i = 0; i < olaylar.length; i++) {
      const o = olaylar[i];
      if (o.tip === "starlink-basladi") {
        Object.assign(o.starlink, kapakStarlinkRota(cssG, cssY, o.starlink.adet, o.starlink.sure));
        uyari.classList.remove("reddedildi");
        uyariMetin.textContent = "1 kare kirli ·";
        atBtn.hidden = false;
        uyari.classList.add("gorunur");
      } else if (o.tip === "starlink-gecti") {
        uyariGizle();
        document.dispatchEvent(new CustomEvent("starlink-gecis", { detail: { tip: "gecti", kaynak: "gozlem" } }));
      } else if (o.tip === "ret-bitti") {
        uyariGizle();
      } else if (o.tip === "kayan-basladi") {
        Object.assign(o.kayan, kapakKayanYildiz(cssG, cssY, o.kayan.sure));
      }
    }

    const s = takvim.starlink;
    const k = takvim.kayan;
    if (!s && !k) {
      if (tuvalDolu) temizle();
    } else if (ctx) {
      ctx.clearRect(0, 0, tuval.width, tuval.height);
      tuvalDolu = true;
      if (s) starlinkCiz(s, takvim.saat - s.basSaat);
      if (k) kayanCiz(k, takvim.saat - k.basSaat);
    }

    raf = requestAnimationFrame(adim);
  };

  const durumEslestir = () => {
    const etkin = gorunur && !document.hidden && !azHareket();
    takvim.gorunurlukAyarla(etkin);
    if (!etkin) {
      durdur();
      if (azHareket()) {
        temizle();
        uyariGizle();
      }
      return;
    }
    if (!cssG) olc();
    if (!raf) {
      sonT = 0;
      raf = requestAnimationFrame(adim);
    }
  };

  olc();
  const gozcu = new IntersectionObserver(
    ([g]) => {
      if (!g) return;
      gorunur = g.isIntersecting;
      durumEslestir();
    },
    { threshold: 0.15 },
  );
  gozcu.observe(kapak);

  let boyutZaman = 0;
  const boyutGozcu = new ResizeObserver(() => {
    clearTimeout(boyutZaman);
    boyutZaman = setTimeout(olc, 140);
  });
  boyutGozcu.observe(kapak);

  document.addEventListener("visibilitychange", durumEslestir);
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener?.("change", durumEslestir);
}
