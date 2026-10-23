import { tohumlu, azHareket } from "../lib/rastgele.js";

const HEDEFLER = [
  { ad: "orman", x: 0.13 },
  { ad: "kuyu", x: 0.63 },
  { ad: "taş ocağı", x: 0.78 },
  { ad: "tarla", x: 0.92 },
];
const KAPI_X = 0.445;
const EV_YERLERI = [0.27, 0.58, 0.23, 0.62, 0.19, 0.67, 0.31, 0.55];

class KaleGecesi extends HTMLElement {
  connectedCallback() {
    if (this._tuval) return;
    this.setAttribute("role", "img");
    this.setAttribute("aria-label", "Gece, harabe bir kale. Küçük ışıklar kaleden çıkıp ormana, kuyuya, taş ocağına ve tarlaya yürüyor; zamanla etrafında yeni evler beliriyor.");
    this._tuval = document.createElement("canvas");
    this._sayac = document.createElement("p");
    this._sayac.className = "kg-sayac veri";
    this._sayac.setAttribute("aria-hidden", "true");
    this.append(this._tuval, this._sayac);
    this._ctx = this._tuval.getContext("2d");

    this._yildizlar = [];
    const rnd = tohumlu(1453);
    for (let i = 0; i < 170; i++) {
      this._yildizlar.push({ x: rnd(), y: Math.pow(rnd(), 1.4) * 0.66, r: rnd() * 1.1 + 0.25, faz: rnd() * 6.28, hiz: 0.6 + rnd() * 1.6 });
    }
    this._sifirla();

    new ResizeObserver(() => this._boyutla()).observe(this);
    new IntersectionObserver(([g]) => {
      this._gorunur = g.isIntersecting;
      if (this._gorunur) this._baslat();
    }).observe(this);
  }

  _sifirla() {
    this._gun = 1;
    this._evler = [];
    this._gruplar = [];
    this._zaman = 0;
    this._sonGrup = -99;
    this._sonGun = 0;
  }

  _boyutla() {
    const k = this.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1);
    this._W = k.width;
    this._H = k.height;
    this._tuval.width = Math.round(k.width * dpr);
    this._tuval.height = Math.round(k.height * dpr);
    this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (azHareket()) {
      this._evler = EV_YERLERI.slice(0, 5).map((x) => ({ x, t: 99 }));
      this._ciz(0);
    }
  }

  _baslat() {
    if (azHareket() || this._raf) return;
    let son = performance.now();
    const tik = (t) => {
      const dt = Math.min(64, t - son) / 1000;
      son = t;
      if (!this._gorunur) {
        this._raf = null;
        return;
      }
      this._guncelle(dt);
      this._ciz(t / 1000);
      this._raf = requestAnimationFrame(tik);
    };
    this._raf = requestAnimationFrame(tik);
  }

  zeminY(x) {

    return this._H * (0.74 + Math.sin(x * 7.1) * 0.012 + Math.sin(x * 2.3 + 1) * 0.018);
  }

  _guncelle(dt) {
    this._zaman += dt;

    if (this._zaman - this._sonGun > 5) {
      this._sonGun = this._zaman;
      this._gun++;
      if (this._gun % 2 === 0 && this._evler.length < EV_YERLERI.length) {
        this._evler.push({ x: EV_YERLERI[this._evler.length], t: 0 });
      }
      if (this._gun > 22) this._sifirla();
    }
    for (const e of this._evler) e.t += dt;

    if (this._zaman - this._sonGrup > 2.2 && this._gruplar.length < 3 + this._evler.length / 2) {
      this._sonGrup = this._zaman;
      const hedef = HEDEFLER[(Math.random() * HEDEFLER.length) | 0];
      const kisi = 2 + ((Math.random() * (3 + this._evler.length / 2)) | 0);
      this._gruplar.push({ hedef, kisi, x: KAPI_X, yon: 1, bekle: 0, hiz: 0.022 + Math.random() * 0.01 });
    }
    for (const g of this._gruplar) {
      if (g.bekle > 0) {
        g.bekle -= dt;
        if (g.bekle <= 0) g.yon = -1;
        continue;
      }
      const hedefX = g.yon > 0 ? g.hedef.x : KAPI_X;
      const fark = hedefX - g.x;
      const adim = Math.sign(fark) * g.hiz * dt;
      if (Math.abs(fark) <= Math.abs(adim)) {
        g.x = hedefX;
        if (g.yon > 0) g.bekle = 1.8 + Math.random() * 1.5;
        else g.bitti = true;
      } else {
        g.x += adim;
      }
    }
    this._gruplar = this._gruplar.filter((g) => !g.bitti);

    const nufus = 7 + this._evler.length * 4;
    const gorevde = this._gruplar.reduce((t, g) => t + g.kisi, 0);
    this._sayac.textContent = `GÜN ${String(this._gun).padStart(2, "0")} · NÜFUS ${nufus} · GÖREVDE ${gorevde} · LİDER ${1 + Math.floor(this._evler.length / 3)}`;
  }

  _ciz(t) {
    const c = this._ctx;
    const W = this._W;
    const H = this._H;
    if (!W || !H) return;

    const gok = c.createLinearGradient(0, 0, 0, H);
    gok.addColorStop(0, "#07080b");
    gok.addColorStop(0.55, "#0c0d13");
    gok.addColorStop(0.74, "#1d1612");
    gok.addColorStop(1, "#07080b");
    c.fillStyle = gok;
    c.fillRect(0, 0, W, H);

    for (const y of this._yildizlar) {
      const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * y.hiz + y.faz));
      c.globalAlpha = a * 0.85;
      c.fillStyle = "#fff4e2";
      c.beginPath();
      c.arc(y.x * W, y.y * H, y.r, 0, 6.283);
      c.fill();
    }
    c.globalAlpha = 1;

    const hale = c.createRadialGradient(W * KAPI_X, H * 0.66, 0, W * KAPI_X, H * 0.66, W * 0.32);
    hale.addColorStop(0, "rgba(224,162,106,0.22)");
    hale.addColorStop(1, "rgba(224,162,106,0)");
    c.fillStyle = hale;
    c.fillRect(0, 0, W, H);

    this._kale(c, W, H, t);

    c.fillStyle = "#050608";
    c.beginPath();
    c.moveTo(0, H);
    for (let i = 0; i <= 60; i++) c.lineTo((i / 60) * W, this.zeminY(i / 60));
    c.lineTo(W, H);
    c.fill();

    this._hedefleriCiz(c, W, H);

    for (const e of this._evler) {
      const b = Math.min(1, e.t / 1.2);
      const x = e.x * W;
      const y = this.zeminY(e.x);
      const g = W * 0.022;
      const h = g * 0.8 * b;
      c.fillStyle = "#050608";
      c.beginPath();
      c.moveTo(x - g / 2, y + 1);
      c.lineTo(x - g / 2, y - h);
      c.lineTo(x, y - h - g * 0.55 * b);
      c.lineTo(x + g / 2, y - h);
      c.lineTo(x + g / 2, y + 1);
      c.fill();
      if (b === 1) {
        const titrek = 0.7 + 0.3 * Math.sin(t * 9 + e.x * 50);
        c.fillStyle = `rgba(255,190,120,${titrek})`;
        c.fillRect(x - g * 0.12, y - h * 0.62, g * 0.24, g * 0.24);
      }
    }

    for (const g of this._gruplar) {
      for (let k = 0; k < g.kisi; k++) {
        const ofs = (k - g.kisi / 2) * 0.0045 * -g.yon;
        const x = (g.x + ofs) * W;
        const sek = g.bekle > 0 ? 0 : Math.abs(Math.sin(t * 10 + k * 1.7)) * 1.4;
        const y = this.zeminY(g.x + ofs) - 2.5 - sek;
        c.fillStyle = "#ffd6a0";
        c.shadowColor = "rgba(255,190,120,0.9)";
        c.shadowBlur = 6;
        c.beginPath();
        c.arc(x, y, 1.5, 0, 6.283);
        c.fill();
      }
    }
    c.shadowBlur = 0;
  }

  _kale(c, W, H, t) {

    const zemin = H * 0.8;
    const X = (v) => v * W;
    const Y = (v) => v * H;
    c.fillStyle = "#040507";

    const mazgal = (x1, x2, ust, dis, bozuk = []) => {
      c.beginPath();
      c.moveTo(X(x1), zemin);
      c.lineTo(X(x1), Y(ust));
      const adim = (x2 - x1) / dis;
      for (let i = 0; i < dis; i++) {
        const a = x1 + i * adim;
        const kirik = bozuk.includes(i);
        const yuk = kirik ? ust + 0.02 + (i % 2) * 0.012 : ust;
        c.lineTo(X(a), Y(yuk));
        c.lineTo(X(a + adim * 0.5), Y(yuk));
        c.lineTo(X(a + adim * 0.5), Y(yuk + 0.018));
        c.lineTo(X(a + adim), Y(yuk + 0.018));
      }
      c.lineTo(X(x2), Y(ust));
      c.lineTo(X(x2), zemin);
      c.fill();
    };

    mazgal(0.33, 0.43, 0.57, 6, [4, 5]);
    mazgal(0.47, 0.57, 0.585, 6, [0, 1]);

    c.beginPath();
    c.moveTo(X(0.43), zemin);
    c.lineTo(X(0.43), Y(0.6));
    c.lineTo(X(0.437), Y(0.625));
    c.lineTo(X(0.445), Y(0.61));
    c.lineTo(X(0.455), Y(0.64));
    c.lineTo(X(0.463), Y(0.62));
    c.lineTo(X(0.47), Y(0.6));
    c.lineTo(X(0.47), zemin);
    c.fill();

    mazgal(0.3, 0.345, 0.43, 4);

    mazgal(0.385, 0.425, 0.36, 4, [3]);

    c.beginPath();
    c.moveTo(X(0.555), zemin);
    c.lineTo(X(0.555), Y(0.5));
    c.lineTo(X(0.565), Y(0.47));
    c.lineTo(X(0.572), Y(0.49));
    c.lineTo(X(0.58), Y(0.455));
    c.lineTo(X(0.59), Y(0.5));
    c.lineTo(X(0.59), zemin);
    c.fill();

    const ates = (x, y, w, h, faz) => {
      const a = 0.55 + 0.35 * Math.sin(t * 7 + faz) * Math.sin(t * 3.1 + faz * 2);
      c.fillStyle = `rgba(255,170,95,${a})`;
      c.fillRect(X(x), Y(y), X(w), Y(h));
    };
    ates(0.316, 0.48, 0.008, 0.022, 1);
    ates(0.4, 0.4, 0.007, 0.02, 2);
    ates(0.4, 0.47, 0.007, 0.02, 3.4);
    ates(0.567, 0.53, 0.007, 0.018, 5);

    const k = 0.55 + 0.25 * Math.sin(t * 5.3);
    c.fillStyle = `rgba(255,170,95,${k * 0.8})`;
    c.beginPath();
    c.moveTo(X(KAPI_X - 0.012), zemin);
    c.lineTo(X(KAPI_X - 0.012), Y(0.705));
    c.quadraticCurveTo(X(KAPI_X), Y(0.68), X(KAPI_X + 0.012), Y(0.705));
    c.lineTo(X(KAPI_X + 0.012), zemin);
    c.fill();
  }

  _hedefleriCiz(c, W) {
    c.font = `500 ${Math.max(9, W * 0.0105)}px "JetBrains Mono", monospace`;
    c.textAlign = "center";
    for (const h of HEDEFLER) {
      const x = h.x * W;
      const y = this.zeminY(h.x);

      c.strokeStyle = "rgba(224,162,106,0.55)";
      c.setLineDash([2, 3]);
      c.beginPath();
      c.moveTo(x, y - 6);
      c.lineTo(x, y - 26);
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = "rgba(224,162,106,0.9)";
      c.beginPath();
      c.moveTo(x, y - 26);
      c.lineTo(x + 8, y - 23);
      c.lineTo(x, y - 20);
      c.fill();
      c.fillStyle = "rgba(169,167,163,0.75)";
      c.fillText(h.ad.toLocaleUpperCase("tr"), x, y + 18);

      if (h.ad === "orman") {
        c.fillStyle = "#040507";
        for (const [dx, s] of [[-18, 1], [-8, 1.3], [4, 1.1], [14, 0.9]]) {
          c.beginPath();
          c.moveTo(x + dx - 6 * s, y + 1);
          c.lineTo(x + dx, y - 20 * s);
          c.lineTo(x + dx + 6 * s, y + 1);
          c.fill();
        }
      }
    }
  }
}

customElements.define("kale-gecesi", KaleGecesi);
