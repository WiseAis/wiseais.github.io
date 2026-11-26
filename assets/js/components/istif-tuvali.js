import { tohumlu, azHareket } from "../lib/rastgele.js?v=20261126a";

const GAUSS_BOY = 1 << 16;
const DARBE_MS = 1050;
const SIGMA_TABAN = 0.55;

const ISTIF_UYDU_ILK_KARE = 60;
const ISTIF_UYDU_SON_KARE = 96;
const ISTIF_UYDU_SURE_KARE = 20;
const CLIP_NOT_MS = 3000;

const STARLINK_ILK_MIN_MS = 9000;
const STARLINK_ILK_MAX_MS = 14000;
const STARLINK_ARA_MIN_MS = 40000;
const STARLINK_ARA_MAX_MS = 70000;
const STARLINK_SURE_MIN_MS = 6000;
const STARLINK_SURE_MAX_MS = 8000;
const STARLINK_IZ_MS = 1500;
const STARLINK_MAX = 3;
const RET_GOSTER_MS = 1400;

const KAYAN_ARA_MIN_MS = 14000;
const KAYAN_ARA_MAX_MS = 28000;
const KAYAN_SURE_MIN_MS = 350;
const KAYAN_SURE_MAX_MS = 700;
const CAKISMA_PAY_MS = 2500;
const BOS_OLAY = Object.freeze([]);

let gaussTablo;
function gauss() {
  if (gaussTablo) return gaussTablo;
  gaussTablo = new Float32Array(GAUSS_BOY);
  for (let i = 0; i < GAUSS_BOY; i += 2) {
    const u = Math.random() || 1e-9;
    const v = Math.random();
    const r = Math.sqrt(-2 * Math.log(u));
    gaussTablo[i] = r * Math.cos(2 * Math.PI * v);
    gaussTablo[i + 1] = r * Math.sin(2 * Math.PI * v);
  }
  return gaussTablo;
}

function degerGurultusu(G, Y, hucre, rnd) {
  const gx = Math.ceil(G / hucre) + 2;
  const gy = Math.ceil(Y / hucre) + 2;
  const izgara = new Float32Array(gx * gy).map(() => rnd());
  const cikti = new Float32Array(G * Y);
  const yumusak = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < Y; y++) {
    const fy = y / hucre;
    const iy = Math.floor(fy);
    const ty = yumusak(fy - iy);
    for (let x = 0; x < G; x++) {
      const fx = x / hucre;
      const ix = Math.floor(fx);
      const tx = yumusak(fx - ix);
      const a = izgara[iy * gx + ix];
      const b = izgara[iy * gx + ix + 1];
      const c = izgara[(iy + 1) * gx + ix];
      const d = izgara[(iy + 1) * gx + ix + 1];
      cikti[y * G + x] = a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
    }
  }
  return cikti;
}

function gerDeger(v, taban = 0.04, kazanc = 1.9) {
  const x = Math.max(0, v + taban) * kazanc;
  return (x / (1 + x * 0.55)) * 255;
}

function dikdortgenDogruKesisim(G, Y, mx, my, ux, uy, pay = 14) {
  const x0 = -pay;
  const x1 = G + pay;
  const y0 = -pay;
  const y1 = Y + pay;
  let tMin = -Infinity;
  let tMax = Infinity;

  if (Math.abs(ux) > 1e-6) {
    const a = (x0 - mx) / ux;
    const b = (x1 - mx) / ux;
    tMin = Math.max(tMin, Math.min(a, b));
    tMax = Math.min(tMax, Math.max(a, b));
  }
  if (Math.abs(uy) > 1e-6) {
    const a = (y0 - my) / uy;
    const b = (y1 - my) / uy;
    tMin = Math.max(tMin, Math.min(a, b));
    tMax = Math.min(tMax, Math.max(a, b));
  }
  if (!Number.isFinite(tMin) || !Number.isFinite(tMax) || tMax <= tMin) {
    return { basX: 0, basY: Y * 0.45, uzunluk: Math.max(100, G) };
  }
  return {
    basX: mx + tMin * ux,
    basY: my + tMin * uy,
    uzunluk: tMax - tMin,
  };
}

export function starlinkRotaHesapla(G, Y, adet, sure, rnd = Math.random) {
  const mx = G * (0.38 + rnd() * 0.24);
  const my = Y * (0.34 + rnd() * 0.28);
  const egim = (16 + rnd() * 24) * (Math.PI / 180);
  const yonX = rnd() < 0.5 ? 1 : -1;
  const yonY = rnd() < 0.5 ? 1 : -1;
  const ux = yonX * Math.cos(egim);
  const uy = yonY * Math.sin(egim);
  const aci = Math.atan2(uy, ux);
  const { basX, basY, uzunluk } = dikdortgenDogruKesisim(G, Y, mx, my, ux, uy, 14);
  const aralik = Math.min(34, Math.max(16, uzunluk * 0.025));

  const uydular = [];
  let mesafe = 0;
  for (let i = 0; i < adet; i++) {
    if (i > 0) mesafe += aralik * (0.86 + rnd() * 0.28);
    uydular.push({
      geride: mesafe,
      parlaklik: 0.42 + rnd() * 0.34,
      yaricap: 1.05 + rnd() * 0.55,
    });
  }
  const trenBoy = mesafe;

  const hiz = (uzunluk + trenBoy) / Math.max(2500, sure - STARLINK_IZ_MS);
  const izBoy = hiz * STARLINK_IZ_MS;

  return { basX, basY, ux, uy, aci, uzunluk, trenBoy, hiz, izBoy, uydular };
}

export function istifUyduRotaHesapla(G, Y, rnd = Math.random) {
  const mx = G * (0.35 + rnd() * 0.3);
  const my = Y * (0.3 + rnd() * 0.34);
  const egim = (12 + rnd() * 28) * (Math.PI / 180);
  const yonX = rnd() < 0.5 ? 1 : -1;
  const yonY = rnd() < 0.5 ? 1 : -1;
  const ux = yonX * Math.cos(egim);
  const uy = yonY * Math.sin(egim);
  const aci = Math.atan2(uy, ux);
  const { basX, basY, uzunluk } = dikdortgenDogruKesisim(G, Y, mx, my, ux, uy, 10);
  return { basX, basY, aci, uzunluk };
}

export function kayanYildizHesapla(G, Y, sure, rnd = Math.random) {
  const boy = 120 + rnd() * 140;
  const yol = boy * 1.15;
  const renkSec = rnd();
  const renkTip = renkSec < 0.75 ? 0 : renkSec < 0.875 ? 1 : 2;

  const asagi = rnd() < 0.85;
  const sola = rnd() < 0.5;
  const derece = asagi
    ? sola
      ? 118 + rnd() * 38
      : 24 + rnd() * 38
    : sola
      ? 192 + rnd() * 24
      : -36 + rnd() * 24;
  const aci = derece * (Math.PI / 180);
  const ux = Math.cos(aci);
  const uy = Math.sin(aci);

  const minX = Math.max(G * 0.08, -ux * yol + 20);
  const maxX = Math.min(G * 0.92, G - ux * yol - 20);
  const minY = Math.max(Y * 0.06, -uy * yol + 20);
  const maxY = Math.min(Y * 0.62, Y - uy * yol - 20);
  const basX = minX < maxX ? minX + rnd() * (maxX - minX) : G * (sola ? 0.82 : 0.18);
  const basY = minY < maxY ? minY + rnd() * (maxY - minY) : Y * 0.18;

  return { basX, basY, ux, uy, aci, boy, yol, sure, renkTip };
}

export class GokTakvimi {
  constructor(rnd = Math.random) {
    this.rnd = rnd;
    this.saat = 0;
    this.etkin = false;
    this.gorunur = true;
    this.starlinkSayisi = 0;
    this.starlink = null;
    this.retBitisSaat = null;
    this.sonrakiStarlinkSaat = null;
    this.kayan = null;
    this.sonrakiKayanSaat = null;
  }

  _aralik(min, max) {
    return min + this.rnd() * (max - min);
  }

  gorunurlukAyarla(acik) {
    this.gorunur = Boolean(acik);
  }

  istifBasladi() {
    const uyariAcikti = Boolean(this.starlink || this.retBitisSaat !== null);
    this.etkin = false;
    this.starlink = null;
    this.retBitisSaat = null;
    this.kayan = null;
    this.sonrakiStarlinkSaat = null;
    this.sonrakiKayanSaat = null;
    return uyariAcikti ? [{ tip: "uyari-temizle" }] : BOS_OLAY;
  }

  istifBitti() {
    this.etkin = true;
    if (this.starlinkSayisi < STARLINK_MAX) {
      this.sonrakiStarlinkSaat =
        this.starlinkSayisi === 0
          ? this.saat + this._aralik(STARLINK_ILK_MIN_MS, STARLINK_ILK_MAX_MS)
          : this.saat + this._aralik(STARLINK_ARA_MIN_MS, STARLINK_ARA_MAX_MS);
    } else {
      this.sonrakiStarlinkSaat = Infinity;
    }
    this.sonrakiKayanSaat = this.saat + this._aralik(KAYAN_ARA_MIN_MS, KAYAN_ARA_MAX_MS);
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
      this.sonrakiKayanSaat = this.retBitisSaat + CAKISMA_PAY_MS + this.rnd() * 3500;
    }
    return { tip: "starlink-atildi" };
  }

  adim(dtMs) {
    if (!this.etkin || !this.gorunur || dtMs <= 0) return BOS_OLAY;
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
        this.sonrakiKayanSaat = this.saat + CAKISMA_PAY_MS + this.rnd() * 3500;
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
        this.sonrakiStarlinkSaat = this.kayan.basSaat + this.kayan.sure + 400;
      } else {
        this.starlinkSayisi += 1;
        const sure = this._aralik(STARLINK_SURE_MIN_MS, STARLINK_SURE_MAX_MS);
        const adet = 6 + Math.floor(this.rnd() * 7);
        this.starlink = { basSaat: this.saat, sure, izSure: STARLINK_IZ_MS, adet };
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

const TemelOge = typeof HTMLElement !== "undefined" ? HTMLElement : class {};

class IstifTuvali extends TemelOge {
  connectedCallback() {
    if (this._tuval) return;
    this._tuval = document.createElement("canvas");
    this._tuval.setAttribute("aria-hidden", "true");
    this._ustTuval = document.createElement("canvas");
    this._ustTuval.setAttribute("aria-hidden", "true");
    this._ustTuval.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;";
    this.append(this._tuval, this._ustTuval);

    this._hedef = Number(this.getAttribute("kare")) || 160;
    this._gorunur = true;
    this._bitti = false;
    this._darbeler = [];
    this._ustDolu = false;
    this._istifUydu = null;
    this._istifUyduYapildi = false;
    this._istifUyduKare = ISTIF_UYDU_ILK_KARE;
    this._clipNotZamanlayici = null;
    this._clipNotKalanMs = 0;
    this._clipNotBas = 0;
    this._takvim = new GokTakvimi();
    this._efektTamponKur();

    this._gozcu = new IntersectionObserver(([g]) => {
      this._gorunur = g.isIntersecting;
      this._durumEslestir();
    });
    this._gozcu.observe(this);

    let zaman;
    this._boyutGozcu = new ResizeObserver(() => {
      clearTimeout(zaman);
      zaman = setTimeout(() => this.kur(), 160);
    });
    this._boyutGozcu.observe(this);

    this._gorunurlukDegisti = () => this._durumEslestir();
    document.addEventListener("visibilitychange", this._gorunurlukDegisti);

    this._hareketMedya = matchMedia("(prefers-reduced-motion: reduce)");
    this._hareketDegisti = () => {
      if (azHareket()) {
        this._canliDurdur();
        this._clipNotTemizle();
        this._istifUydu = null;
        const olaylar = this._takvim.istifBasladi();
        if (olaylar.length) this._uyariBildir("gizli");
        this._ustTemizle();
      } else {
        this._durumEslestir();
      }
    };
    this._hareketMedya.addEventListener?.("change", this._hareketDegisti);
  }

  disconnectedCallback() {
    cancelAnimationFrame(this._raf);
    this._canliDurdur();
    this._clipNotTemizle(false);
    this._gozcu?.disconnect();
    this._boyutGozcu?.disconnect();
    document.removeEventListener("visibilitychange", this._gorunurlukDegisti);
    this._hareketMedya?.removeEventListener?.("change", this._hareketDegisti);
  }

  _durumEslestir() {
    const etkin = this._gorunur && !document.hidden && !azHareket();
    this._takvim.gorunurlukAyarla(etkin);
    if (!etkin) {
      cancelAnimationFrame(this._raf);
      this._canliDurdur();
      this._clipNotDuraklat();
      return;
    }
    this._clipNotSurdur();
    if (this._calisiyor) this._planla();
    else if (this._bitti) this._canliBaslat();
  }

  _efektTamponKur() {
    if (this._uyduNoktaSprite) return;

    const nokta = document.createElement("canvas");
    nokta.width = 32;
    nokta.height = 32;
    const nc = nokta.getContext("2d");
    const ng = nc.createRadialGradient(16, 16, 0, 16, 16, 16);
    ng.addColorStop(0, "rgba(255, 250, 240, 1)");
    ng.addColorStop(0.24, "rgba(255, 245, 228, 0.72)");
    ng.addColorStop(0.55, "rgba(236, 232, 225, 0.16)");
    ng.addColorStop(1, "rgba(236, 232, 225, 0)");
    nc.fillStyle = ng;
    nc.fillRect(0, 0, 32, 32);
    this._uyduNoktaSprite = nokta;

    const iz = document.createElement("canvas");
    iz.width = 256;
    iz.height = 6;
    const ic = iz.getContext("2d");
    const ig = ic.createLinearGradient(0, 0, 256, 0);
    ig.addColorStop(0, "rgba(236, 232, 225, 0)");
    ig.addColorStop(0.45, "rgba(236, 232, 225, 0.14)");
    ig.addColorStop(0.85, "rgba(255, 246, 230, 0.55)");
    ig.addColorStop(1, "rgba(255, 250, 240, 0.85)");
    ic.fillStyle = ig;
    ic.fillRect(0, 2.2, 256, 1.6);
    const idg = ic.createLinearGradient(0, 0, 0, 6);
    idg.addColorStop(0, "rgba(0,0,0,0)");
    idg.addColorStop(0.5, "rgba(0,0,0,1)");
    idg.addColorStop(1, "rgba(0,0,0,0)");
    ic.globalCompositeOperation = "destination-in";
    ic.fillStyle = idg;
    ic.fillRect(0, 0, 256, 6);
    this._uyduIzSprite = iz;

    const istifIz = document.createElement("canvas");
    istifIz.width = 256;
    istifIz.height = 8;
    const sc = istifIz.getContext("2d");
    const sg = sc.createLinearGradient(0, 0, 0, 8);
    sg.addColorStop(0, "rgba(255, 246, 232, 0)");
    sg.addColorStop(0.32, "rgba(255, 246, 232, 0.22)");
    sg.addColorStop(0.5, "rgba(255, 252, 246, 0.96)");
    sg.addColorStop(0.68, "rgba(255, 246, 232, 0.22)");
    sg.addColorStop(1, "rgba(255, 246, 232, 0)");
    sc.fillStyle = sg;
    sc.fillRect(0, 0, 256, 8);
    this._istifUyduSprite = istifIz;

    const kayanRenkler = [
      [255, 247, 234],
      [216, 248, 234],
      [255, 224, 184],
    ];
    this._kayanSpritelar = kayanRenkler.map(([r, g, b]) => {
      const kt = document.createElement("canvas");
      kt.width = 256;
      kt.height = 16;
      const kc = kt.getContext("2d");

      const kg = kc.createLinearGradient(0, 8, 246, 8);
      kg.addColorStop(0, `rgba(${r},${g},${b},0)`);
      kg.addColorStop(0.35, `rgba(${r},${g},${b},0.16)`);
      kg.addColorStop(0.75, `rgba(${r},${g},${b},0.62)`);
      kg.addColorStop(0.96, `rgba(${r},${g},${b},0.96)`);
      kg.addColorStop(1, "rgba(255,255,255,1)");
      kc.fillStyle = kg;
      kc.beginPath();
      kc.moveTo(0, 8);
      kc.lineTo(244, 6.2);
      kc.lineTo(248, 8);
      kc.lineTo(244, 9.8);
      kc.closePath();
      kc.fill();

      const bg = kc.createRadialGradient(246, 8, 0, 246, 8, 7.5);
      bg.addColorStop(0, "rgba(255,255,255,1)");
      bg.addColorStop(0.3, `rgba(${r},${g},${b},0.78)`);
      bg.addColorStop(0.7, `rgba(${r},${g},${b},0.16)`);
      bg.addColorStop(1, `rgba(${r},${g},${b},0)`);
      kc.fillStyle = bg;
      kc.fillRect(238, 0, 18, 16);
      return kt;
    });
  }

  async kur() {
    const kutu = this.getBoundingClientRect();
    if (!kutu.width || !kutu.height) return;
    const olcek = Math.min(1, 760 / kutu.width);
    const G = Math.max(240, Math.round(kutu.width * olcek));
    const Y = Math.max(160, Math.round(kutu.height * olcek));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const ustG = Math.round(kutu.width * dpr);
    const ustY = Math.round(kutu.height * dpr);

    this._cssG = kutu.width;
    this._cssY = kutu.height;
    this._dpr = dpr;
    if (this._ustTuval.width !== ustG || this._ustTuval.height !== ustY) {
      this._ustTuval.width = ustG;
      this._ustTuval.height = ustY;
      this._ustCtx = this._ustTuval.getContext("2d");
      this._ustDolu = false;
    }

    if (this._G === G && this._Y === Y && this._sinyal) {
      return;
    }
    this._G = G;
    this._Y = Y;
    this._tuval.width = G;
    this._tuval.height = Y;
    this._ctx = this._tuval.getContext("2d");
    this._resim = this._ctx.createImageData(G, Y);

    this._tabanTuval = document.createElement("canvas");
    this._tabanTuval.width = G;
    this._tabanTuval.height = Y;
    this._tabanCtx = this._tabanTuval.getContext("2d");

    await this._sinyalUret();
    this.basla();
  }

  async _sinyalUret() {
    const G = this._G;
    const Y = this._Y;
    const N = G * Y;
    const rnd = tohumlu(2026);
    const R = new Float32Array(N);
    const Gr = new Float32Array(N);
    const B = new Float32Array(N);
    const nebR = new Float32Array(N);
    const nebG = new Float32Array(N);
    const nebB = new Float32Array(N);

    const fraktal = (taban, oktav = 5) => {
      const toplam = new Float32Array(N);
      let agirlik = 0.5;
      let hucre = Math.round(G / taban);
      let norm = 0;
      for (let o = 0; o < oktav; o++) {
        const n = degerGurultusu(G, Y, Math.max(3, hucre), rnd);
        for (let i = 0; i < N; i++) toplam[i] += n[i] * agirlik;
        norm += agirlik;
        agirlik *= 0.52;
        hucre = Math.round(hucre / 2.1);
      }
      for (let i = 0; i < N; i++) toplam[i] /= norm;
      return toplam;
    };

    const ha = fraktal(3.2);
    const oiii = fraktal(4.5);
    for (let i = 0; i < N; i++) {
      const sirt = 1 - Math.abs(ha[i] - 0.5) * 2;
      const kirmizi = Math.pow(Math.max(0, sirt - 0.55) / 0.45, 2.2) * 0.34 + Math.max(0, ha[i] - 0.6) * 0.18;
      const mavi = Math.pow(Math.max(0, oiii[i] - 0.6) / 0.4, 1.8) * 0.2;
      nebR[i] = kirmizi;
      nebG[i] = kirmizi * 0.18 + mavi * 0.85;
      nebB[i] = kirmizi * 0.3 + mavi * 0.78;
      R[i] += nebR[i];
      Gr[i] += nebG[i];
      B[i] += nebB[i];
    }

    const yildizSayisi = Math.round(N / 520);
    const yildizlar = [];
    for (let s = 0; s < yildizSayisi; s++) {
      const x = rnd() * G;
      const y = rnd() * Y;
      const parlak = Math.pow(rnd(), 9) * 2.4 + 0.12;
      const sigma = 0.55 + parlak * 0.75;
      const renk = rnd();
      const [cr, cg, cb] = renk < 0.2 ? [0.75, 0.85, 1] : renk > 0.85 ? [1, 0.82, 0.62] : [1, 0.97, 0.92];
      yildizlar.push({ x, y, parlak, sigma, cr, cg, cb });
      const yaricap = Math.ceil(sigma * 3);
      for (let dy = -yaricap; dy <= yaricap; dy++) {
        const py = Math.round(y) + dy;
        if (py < 0 || py >= Y) continue;
        for (let dx = -yaricap; dx <= yaricap; dx++) {
          const px = Math.round(x) + dx;
          if (px < 0 || px >= G) continue;
          const d2 = (px - x) ** 2 + (py - y) ** 2;
          const v = parlak * Math.exp(-d2 / (2 * sigma * sigma));
          const i = py * G + px;
          R[i] += v * cr;
          Gr[i] += v * cg;
          B[i] += v * cb;
        }
      }
    }

    const metin = this.getAttribute("metin");
    if (metin) {
      const boy = Math.round(Math.min(Y * 0.36, G * 0.2));
      const font = `italic 340 ${boy}px Fraunces`;
      try {
        await document.fonts.load(font, metin);
      } catch {}
      const ara = document.createElement("canvas");
      ara.width = G;
      ara.height = Y;
      const c = ara.getContext("2d");
      c.font = font;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillStyle = "#fff";
      c.filter = "blur(0.6px)";
      c.fillText(metin, G / 2, Y * 0.47);
      const alfa = c.getImageData(0, 0, G, Y).data;
      for (let i = 0; i < N; i++) {
        const a = alfa[i * 4 + 3] / 255;
        if (!a) continue;
        R[i] += a * 0.62;
        Gr[i] += a * 0.6;
        B[i] += a * 0.57;
      }
    }

    yildizlar.sort((a, b) => b.parlak - a.parlak);
    this._parlakYildizlar = yildizlar.slice(0, 16).map((y, idx) => ({
      ...y,
      faz: idx * 1.37 + rnd() * Math.PI * 2,
      w1: 0.0024 + rnd() * 0.0026,
      w2: 0.0052 + rnd() * 0.0042,
    }));

    this._bulutsuTuval = this._katmanTuval(G, Y, nebR, nebG, nebB, 0, 2.1);
    this._temizTuval = this._katmanTuval(G, Y, R, Gr, B, 0.04, 1.98);

    this._sinyal = [R, Gr, B];
    this._top = [new Float32Array(N), new Float32Array(N), new Float32Array(N)];
  }

  _katmanTuval(G, Y, rA, gA, bA, taban, kazanc) {
    const t = document.createElement("canvas");
    t.width = G;
    t.height = Y;
    const c = t.getContext("2d");
    const img = c.createImageData(G, Y);
    const d = img.data;
    const N = G * Y;
    for (let i = 0, j = 0; i < N; i++, j += 4) {
      d[j] = gerDeger(rA[i], taban, kazanc);
      d[j + 1] = gerDeger(gA[i], taban, kazanc);
      d[j + 2] = gerDeger(bA[i], taban, kazanc);
      d[j + 3] = 255;
    }
    c.putImageData(img, 0, 0);
    return t;
  }

  basla() {
    if (!this._sinyal) return;
    this._canliDurdur();
    this._clipNotTemizle();
    const iptalOlaylar = this._takvim.istifBasladi();
    if (iptalOlaylar.length) this._uyariBildir("gizli");
    this._istifUydu = null;
    this._istifUyduYapildi = false;

    this._istifUyduKare =
      ISTIF_UYDU_ILK_KARE + Math.floor(Math.random() * (ISTIF_UYDU_SON_KARE - ISTIF_UYDU_ILK_KARE + 1));
    this._ustTemizle();

    for (const t of this._top) t.fill(0);
    this._kare = 0;
    this._bitti = false;
    this._calisiyor = true;
    if (azHareket()) {

      this._kare = this._hedef;
      const snr = Math.sqrt(this._kare) / SIGMA_TABAN;
      this.dispatchEvent(new CustomEvent("istif", { detail: { kare: this._kare, hedef: this._hedef, snr } }));
      this._ctx.drawImage(this._temizTuval, 0, 0);
      this._tabanCtx.drawImage(this._temizTuval, 0, 0);
      this._calisiyor = false;
      this._bitti = true;
      this.dispatchEvent(new Event("bitti"));
      return;
    }
    this._planla();
  }

  uyduyuAt() {
    const sonuc = this._takvim.uyduyuAt();
    if (!sonuc) return;
    this._ustTemizle();
    this._uyariBildir("reddedildi");
    document.dispatchEvent(new CustomEvent("starlink-gecis", { detail: { tip: "atildi", kaynak: "giris" } }));
  }

  _uyariBildir(durum) {
    this.dispatchEvent(new CustomEvent("starlink-uyari", { detail: { durum } }));
  }

  _clipNotBaslat(sureMs = CLIP_NOT_MS) {
    this._clipNotTemizle(false);
    this._clipNotKalanMs = sureMs;
    this.dispatchEvent(new CustomEvent("istif-uydu", { detail: { aktif: true } }));
    if (this._gorunur && !document.hidden && !azHareket()) {
      this._clipNotSurdur();
    }
  }

  _clipNotDuraklat() {
    if (!this._clipNotZamanlayici) return;
    clearTimeout(this._clipNotZamanlayici);
    this._clipNotZamanlayici = null;
    this._clipNotKalanMs = Math.max(0, this._clipNotKalanMs - (performance.now() - this._clipNotBas));
  }

  _clipNotSurdur() {
    if (this._clipNotZamanlayici || this._clipNotKalanMs <= 0) return;
    this._clipNotBas = performance.now();
    this._clipNotZamanlayici = setTimeout(() => {
      this._clipNotZamanlayici = null;
      this._clipNotKalanMs = 0;
      this.dispatchEvent(new CustomEvent("istif-uydu", { detail: { aktif: false } }));
    }, this._clipNotKalanMs);
  }

  _clipNotTemizle(bildir = true) {
    const acikti = Boolean(this._clipNotZamanlayici || this._clipNotKalanMs > 0);
    if (this._clipNotZamanlayici) {
      clearTimeout(this._clipNotZamanlayici);
      this._clipNotZamanlayici = null;
    }
    this._clipNotKalanMs = 0;
    if (bildir && acikti) {
      this.dispatchEvent(new CustomEvent("istif-uydu", { detail: { aktif: false } }));
    }
  }

  darbe(ekranX, ekranY) {
    if (azHareket() || !this._G || !this._tuval) return;
    const k = this._tuval.getBoundingClientRect();
    if (!k.width || !k.height) return;
    const cx = ((ekranX - k.left) / k.width) * this._G;
    const cy = ((ekranY - k.top) / k.height) * this._Y;
    if (cx < -40 || cx > this._G + 40 || cy < -40 || cy > this._Y + 40) return;
    this._darbeler.push({
      x: cx,
      y: cy,
      aci: (Math.random() - 0.5) * 0.24,
      bas: performance.now(),
      sure: DARBE_MS,
      tohum: (Math.random() * 1e6) | 0,
    });
    if (this._bitti && this._gorunur && !document.hidden) this._canliBaslat();
  }

  _planla() {
    cancelAnimationFrame(this._raf);
    this._raf = requestAnimationFrame(() => this._tik());
  }

  _tik() {
    if (!this._calisiyor || !this._gorunur || document.hidden) return;

    const adim = this._kare < 12 ? 1 : this._kare < 40 ? 2 : 4;
    const simdi = performance.now();
    if (this._son && simdi - this._son < (this._kare < 12 ? 110 : 40)) {
      this._planla();
      return;
    }
    this._son = simdi;
    this._istifle(adim);

    if (!azHareket() && !this._istifUyduYapildi && this._kare >= this._istifUyduKare && this._kare <= 100) {
      this._istifUyduYapildi = true;
      this._istifUydu = {
        basKare: this._kare,
        sureKare: ISTIF_UYDU_SURE_KARE,
        ...istifUyduRotaHesapla(this._cssG || this._G, this._cssY || this._Y),
      };
      this._clipNotBaslat(CLIP_NOT_MS);
    }

    this._ciz();
    if (this._kare >= this._hedef) {
      this._calisiyor = false;
      this._bitti = true;
      this._istifUydu = null;
      this._ustTemizle();
      this._tabanCtx.putImageData(this._resim, 0, 0);
      this.dispatchEvent(new Event("bitti"));
      if (!azHareket()) {
        this._takvim.gorunurlukAyarla(this._gorunur && !document.hidden);
        this._takvim.istifBitti();
        if (this._gorunur && !document.hidden) this._canliBaslat();
      }
      return;
    }
    this._planla();
  }

  _istifle(adet) {
    const tablo = gauss();
    const sigma = SIGMA_TABAN;
    const [R, G, B] = this._sinyal;
    const [tR, tG, tB] = this._top;
    const N = R.length;
    for (let k = 0; k < adet; k++) {
      const o = (Math.random() * GAUSS_BOY) | 0;
      const kanal = Math.random() < 0.5;
      for (let i = 0; i < N; i++) {
        const ortak = tablo[(o + i) & (GAUSS_BOY - 1)] * sigma;
        const renk = tablo[(o + i * 7 + 11) & (GAUSS_BOY - 1)] * sigma * 0.35;
        tR[i] += R[i] + ortak + (kanal ? renk : -renk);
        tG[i] += G[i] + ortak;
        tB[i] += B[i] + ortak + (kanal ? -renk : renk);
      }
      this._kare++;
    }
    const snr = Math.sqrt(this._kare) / sigma;
    this.dispatchEvent(new CustomEvent("istif", { detail: { kare: this._kare, hedef: this._hedef, snr } }));
  }

  _ciz() {
    const [tR, tG, tB] = this._top;
    const d = this._resim.data;
    const n = this._kare || 1;
    const N = tR.length;
    for (let i = 0, j = 0; i < N; i++, j += 4) {
      d[j] = gerDeger(tR[i] / n);
      d[j + 1] = gerDeger(tG[i] / n);
      d[j + 2] = gerDeger(tB[i] / n);
      d[j + 3] = 255;
    }
    this._ctx.putImageData(this._resim, 0, 0);
    if (this._istifUydu) this._istifUyduCiz();
    if (this._darbeler.length) this._darbeleriCiz(performance.now());
  }

  _canliBaslat() {
    if (this._canliRaf || azHareket() || !this._gorunur || !this._bitti || document.hidden) return;
    this._canliSon = performance.now();
    const adim = (t) => {
      if (!this._gorunur || !this._bitti || document.hidden || azHareket()) {
        this._canliRaf = 0;
        return;
      }
      const dt = Math.min(50, Math.max(0, t - this._canliSon));
      this._canliSon = t;
      this._canliCiz(t, dt);
      this._canliRaf = requestAnimationFrame(adim);
    };
    this._canliRaf = requestAnimationFrame(adim);
  }

  _canliDurdur() {
    if (this._canliRaf) {
      cancelAnimationFrame(this._canliRaf);
      this._canliRaf = 0;
    }
  }

  _ustTemizle() {
    if (!this._ustCtx || !this._ustDolu) return;
    this._ustCtx.clearRect(0, 0, this._ustTuval.width, this._ustTuval.height);
    this._ustDolu = false;
  }

  _canliCiz(t, dt) {
    const ctx = this._ctx;

    ctx.drawImage(this._tabanTuval, 0, 0);

    const solunum = (Math.sin((t / 18000) * Math.PI * 2) * 0.5 + 0.5) * 0.12;
    if (solunum > 0.004) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = solunum;
      ctx.drawImage(this._bulutsuTuval, 0, 0);
      ctx.restore();
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const s of this._parlakYildizlar) {
      const titresim = Math.sin(t * s.w1 + s.faz) * Math.sin(t * s.w2 + s.faz * 1.7);
      const siddet = Math.max(0, titresim * 0.14 + 0.06);
      const r = Math.max(2, s.sigma * (2.6 + titresim * 0.35));
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
      const cr = Math.round(s.cr * 255);
      const cg = Math.round(s.cg * 255);
      const cb = Math.round(s.cb * 255);
      grad.addColorStop(0, `rgba(${cr},${cg},${cb},${(siddet * 0.72).toFixed(3)})`);
      grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(s.x - r, s.y - r, r * 2, r * 2);
    }
    ctx.restore();

    this._gokOlaylariniIsle(dt);

    if (this._darbeler.length) this._darbeleriCiz(t);
  }

  _gokOlaylariniIsle(dt) {
    const olaylar = this._takvim.adim(dt);
    if (olaylar.length) {
      const G = this._cssG || this._G;
      const Y = this._cssY || this._Y;
      for (let i = 0; i < olaylar.length; i++) {
        const o = olaylar[i];
        if (o.tip === "starlink-basladi") {
          Object.assign(o.starlink, starlinkRotaHesapla(G, Y, o.starlink.adet, o.starlink.sure));
          this._uyariBildir("aktif");
        } else if (o.tip === "starlink-gecti") {
          this._uyariBildir("gizli");
          document.dispatchEvent(new CustomEvent("starlink-gecis", { detail: { tip: "gecti", kaynak: "giris" } }));
        } else if (o.tip === "ret-bitti") {
          this._uyariBildir("gizli");
        } else if (o.tip === "kayan-basladi") {
          Object.assign(o.kayan, kayanYildizHesapla(G, Y, o.kayan.sure));
        }
      }
    }

    const starlink = this._takvim.starlink;
    const kayan = this._takvim.kayan;
    if (!starlink && !kayan) {
      if (this._ustDolu) this._ustTemizle();
      return;
    }

    const c = this._ustCtx;
    if (!c) return;
    c.clearRect(0, 0, this._ustTuval.width, this._ustTuval.height);
    this._ustDolu = true;

    if (starlink) this._starlinkCiz(c, starlink, this._takvim.saat - starlink.basSaat);
    if (kayan) this._kayanYildizCiz(c, kayan, this._takvim.saat - kayan.basSaat);
  }

  _istifUyduCiz() {
    const u = this._istifUydu;
    const c = this._ustCtx;
    if (!u || !c) return;
    const gecenKare = this._kare - u.basKare;
    if (gecenKare >= u.sureKare) {
      this._istifUydu = null;
      this._ustTemizle();
      return;
    }
    const p = gecenKare / u.sureKare;
    const alfa = p <= 0.15 ? 0.82 : 0.82 * Math.pow(Math.max(0, 1 - (p - 0.15) / 0.85), 1.45);
    const dpr = this._dpr || 1;
    const kalinlik = 2.6 * dpr;

    c.clearRect(0, 0, this._ustTuval.width, this._ustTuval.height);
    c.save();
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = alfa;
    c.translate(u.basX * dpr, u.basY * dpr);
    c.rotate(u.aci);
    c.drawImage(this._istifUyduSprite, 0, -kalinlik * 0.5, u.uzunluk * dpr, kalinlik);
    c.restore();
    this._ustDolu = true;
  }

  _starlinkCiz(c, s, gecenMs) {
    const dpr = this._dpr || 1;
    const liderS = s.hiz * gecenMs;
    const izBoyPx = s.izBoy * dpr;
    const izKalinlik = 2.2 * dpr;
    const uydular = s.uydular;

    c.save();
    c.globalCompositeOperation = "lighter";

    for (let i = 0; i < uydular.length; i++) {
      const u = uydular[i];
      const pos = liderS - u.geride;
      if (pos < -12 || pos - s.izBoy > s.uzunluk + 12) continue;

      const x = (s.basX + s.ux * pos) * dpr;
      const y = (s.basY + s.uy * pos) * dpr;

      c.save();
      c.translate(x, y);
      c.rotate(s.aci);
      c.globalAlpha = u.parlaklik * 0.22;
      c.drawImage(this._uyduIzSprite, -izBoyPx, -izKalinlik * 0.5, izBoyPx, izKalinlik);
      c.restore();

      if (pos >= -10 && pos <= s.uzunluk + 10) {
        const cap = u.yaricap * 3.4 * dpr;
        c.globalAlpha = u.parlaklik * 0.9;
        c.drawImage(this._uyduNoktaSprite, x - cap * 0.5, y - cap * 0.5, cap, cap);
      }
    }

    c.restore();
  }

  _kayanYildizCiz(c, k, gecenMs) {
    const u = Math.min(1, Math.max(0, gecenMs / k.sure));
    const zarf = u < 0.16 ? u / 0.16 : Math.pow(Math.max(0, 1 - (u - 0.16) / 0.84), 1.45);
    if (zarf <= 0.005) return;

    const dpr = this._dpr || 1;
    const ilerleme = 1 - Math.pow(1 - u, 1.35);
    const s = ilerleme * k.yol;
    const kx = (k.basX + k.ux * s) * dpr;
    const ky = (k.basY + k.uy * s) * dpr;
    const acilis = Math.min(1, u / 0.25);
    const kuyrukCss = k.boy * acilis * (1 - Math.max(0, u - 0.6) * 0.65);
    const hPx = 6.5 * dpr;
    const sprite = this._kayanSpritelar[k.renkTip] || this._kayanSpritelar[0];

    c.save();
    c.globalCompositeOperation = "lighter";
    c.globalAlpha = zarf * 0.95;
    c.translate(kx, ky);
    c.rotate(k.aci);
    c.drawImage(sprite, -kuyrukCss * dpr, -hPx * 0.5, (kuyrukCss + 5) * dpr, hPx);
    c.restore();
  }

  _darbeleriCiz(simdi) {
    const ctx = this._ctx;
    const G = this._G;
    const kalan = [];
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const d of this._darbeler) {
      const oran = (simdi - d.bas) / d.sure;
      if (oran >= 1) continue;
      kalan.push(d);

      const siddet = (1 / Math.sqrt(1 + oran * 24)) * (1 - oran);
      const rnd = tohumlu(d.tohum);
      const boy = Math.max(G * 0.45, 220);
      const cos = Math.cos(d.aci);
      const sin = Math.sin(d.aci);
      const adimSayisi = Math.round(boy / 3);
      for (let i = -adimSayisi; i <= adimSayisi; i++) {
        const u = i / adimSayisi;
        const zarf = Math.max(0, 1 - u * u);
        if (rnd() > 0.72) continue;
        const px = d.x + i * 3 * cos;
        const py = d.y + i * 3 * sin + (rnd() - 0.5) * 1.4;
        const parlak = (0.35 + rnd() * 0.65) * siddet * zarf;
        const sicak = rnd();
        const renk =
          sicak < 0.25
            ? `rgba(255,95,112,${parlak.toFixed(3)})`
            : sicak > 0.78
              ? `rgba(110,224,212,${parlak.toFixed(3)})`
              : `rgba(244,238,228,${parlak.toFixed(3)})`;
        ctx.fillStyle = renk;
        ctx.fillRect(px, py, 2.5, 1.3);
      }
    }
    ctx.restore();
    this._darbeler = kalan;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("istif-tuvali")) {
  customElements.define("istif-tuvali", IstifTuvali);
}
