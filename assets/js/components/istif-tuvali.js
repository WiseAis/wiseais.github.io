import { tohumlu } from "../lib/rastgele.js";

const GAUSS_BOY = 1 << 16;
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

class IstifTuvali extends HTMLElement {
  connectedCallback() {
    if (this._tuval) return;
    this._tuval = document.createElement("canvas");
    this._tuval.setAttribute("aria-hidden", "true");
    this.append(this._tuval);
    this._hedef = Number(this.getAttribute("kare")) || 160;
    this._gorunur = true;

    new IntersectionObserver(([g]) => {
      this._gorunur = g.isIntersecting;
      if (this._gorunur && this._calisiyor) this._planla();
    }).observe(this);

    let zaman;
    new ResizeObserver(() => {
      clearTimeout(zaman);
      zaman = setTimeout(() => this.kur(), 160);
    }).observe(this);
  }

  async kur() {
    const kutu = this.getBoundingClientRect();
    if (!kutu.width || !kutu.height) return;
    const olcek = Math.min(1, 760 / kutu.width);
    const G = Math.max(240, Math.round(kutu.width * olcek));
    const Y = Math.max(160, Math.round(kutu.height * olcek));
    if (this._G === G && this._Y === Y && this._sinyal) return;
    this._G = G;
    this._Y = Y;
    this._tuval.width = G;
    this._tuval.height = Y;
    this._ctx = this._tuval.getContext("2d");
    this._resim = this._ctx.createImageData(G, Y);

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

    const fraktal = (taban) => {
      const toplam = new Float32Array(N);
      let agirlik = 0.5;
      let hucre = Math.round(G / taban);
      let norm = 0;
      for (let o = 0; o < 5; o++) {
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
      R[i] += kirmizi;
      Gr[i] += kirmizi * 0.18 + mavi * 0.85;
      B[i] += kirmizi * 0.3 + mavi * 0.78;
    }

    const yildizSayisi = Math.round(N / 520);
    for (let s = 0; s < yildizSayisi; s++) {
      const x = rnd() * G;
      const y = rnd() * Y;
      const parlak = Math.pow(rnd(), 9) * 2.4 + 0.12;
      const sigma = 0.55 + parlak * 0.75;
      const renk = rnd();
      const [cr, cg, cb] = renk < 0.2 ? [0.75, 0.85, 1] : renk > 0.85 ? [1, 0.82, 0.62] : [1, 0.97, 0.92];
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

    this._sinyal = [R, Gr, B];
    this._top = [new Float32Array(N), new Float32Array(N), new Float32Array(N)];
  }

  basla() {
    if (!this._sinyal) return;
    for (const t of this._top) t.fill(0);
    this._kare = 0;
    this._calisiyor = true;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {

      this._istifle(this._hedef);
      this._ciz();
      this._calisiyor = false;
      this.dispatchEvent(new Event("bitti"));
      return;
    }
    this._planla();
  }

  _planla() {
    cancelAnimationFrame(this._raf);
    this._raf = requestAnimationFrame(() => this._tik());
  }

  _tik() {
    if (!this._calisiyor || !this._gorunur) return;

    const adim = this._kare < 12 ? 1 : this._kare < 40 ? 2 : 4;
    const simdi = performance.now();
    if (this._son && simdi - this._son < (this._kare < 12 ? 110 : 40)) {
      this._planla();
      return;
    }
    this._son = simdi;
    this._istifle(adim);
    this._ciz();
    if (this._kare >= this._hedef) {
      this._calisiyor = false;
      this.dispatchEvent(new Event("bitti"));
      return;
    }
    this._planla();
  }

  _istifle(adet) {
    const tablo = gauss();
    const sigma = 0.55;
    const [R, G, B] = this._sinyal;
    const [tR, tG, tB] = this._top;
    const N = R.length;
    for (let k = 0; k < adet; k++) {
      let o = (Math.random() * GAUSS_BOY) | 0;
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

    const taban = 0.04;
    const kazanc = 1.9;
    const ger = (v) => {
      const x = Math.max(0, v / n + taban) * kazanc;
      return (x / (1 + x * 0.55)) * 255;
    };
    for (let i = 0, j = 0; i < N; i++, j += 4) {
      d[j] = ger(tR[i]);
      d[j + 1] = ger(tG[i]);
      d[j + 2] = ger(tB[i]);
      d[j + 3] = 255;
    }
    this._ctx.putImageData(this._resim, 0, 0);
  }
}

customElements.define("istif-tuvali", IstifTuvali);
