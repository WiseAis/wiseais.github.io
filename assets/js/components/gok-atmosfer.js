import { tohumlu, azHareket } from "../lib/rastgele.js?v=20261126a";

const YILDIZ_SAYISI = 54;
const TOHUM = 20261124;
const RENKLER = ["#c6d8ff", "#fff4e2", "#ffd5a8", "#dce7ff"];
const PARALAKS = [0.04, 0.09, 0.15];
const KATMAN_HIZ = [0.78, 1.0, 1.22];
const SURUKLENME_HIZ = 0.22;
const SURUKLENME_X = SURUKLENME_HIZ * 0.848;
const SURUKLENME_Y = -SURUKLENME_HIZ * 0.53;
const IKI_PI = Math.PI * 2;
const BOYUT_BEKLE_MS = 150;

function yildizlariUret() {
  const rng = tohumlu(TOHUM);
  const liste = [];
  for (let i = 0; i < YILDIZ_SAYISI; i++) {
    const katman = i % 3;
    const minOp = katman === 0 ? 0.06 : katman === 1 ? 0.09 : 0.13;
    const maxOp = katman === 0 ? 0.13 : katman === 1 ? 0.18 : 0.24;
    const minR = katman === 0 ? 0.55 : katman === 1 ? 0.75 : 0.95;
    const maxR = katman === 0 ? 0.8 : katman === 1 ? 1.05 : 1.3;
    liste.push({
      x: rng(),
      y: rng(),
      katman,
      renk: RENKLER[Math.floor(rng() * RENKLER.length)],
      opaklik: minOp + rng() * (maxOp - minOp),
      yaricap: minR + rng() * (maxR - minR),
      faz: rng() * IKI_PI,
      titreHiz: 0.24 + rng() * 0.42,
    });
  }
  return liste;
}

class GokAtmosfer extends HTMLElement {
  constructor() {
    super();
    this._kuruldu = false;
    this._raf = null;
    this._boyutZamanlayici = null;
    this._gecen = 0;
    this._sonZaman = 0;
    this._scrollY = 0;
    this._g = 0;
    this._y = 0;
    this._yildizlar = yildizlariUret();

    this._adimBagli = (t) => this._adim(t);
    this._kaydirBagli = () => {
      this._scrollY = window.scrollY || 0;
    };
    this._gorunurlukBagli = () => this._durumuGuncelle();
    this._hareketDegistiBagli = () => this._durumuGuncelle();
    this._boyutPlanlaBagli = () => this._boyutPlanla();
  }

  connectedCallback() {
    if (!this._kuruldu) {
      this._kuruldu = true;
      this.setAttribute("aria-hidden", "true");
      this.innerHTML = `<div class="gok-isima" aria-hidden="true"></div><canvas class="gok-yildiz" aria-hidden="true"></canvas>`;
      this._tuval = this.querySelector(".gok-yildiz");
      this._ctx = this._tuval.getContext("2d");
    }

    this._scrollY = window.scrollY || 0;
    this._hareketMedya = matchMedia("(prefers-reduced-motion: reduce)");

    window.addEventListener("scroll", this._kaydirBagli, { passive: true });
    document.addEventListener("visibilitychange", this._gorunurlukBagli);
    this._hareketMedya.addEventListener?.("change", this._hareketDegistiBagli);

    if (typeof ResizeObserver === "function") {
      this._boyutGozcu = new ResizeObserver(this._boyutPlanlaBagli);
      this._boyutGozcu.observe(this);
    } else {
      window.addEventListener("resize", this._boyutPlanlaBagli, { passive: true });
    }

    this._boyutlandir();
    this._durumuGuncelle();
  }

  disconnectedCallback() {
    this._durdur();
    clearTimeout(this._boyutZamanlayici);
    window.removeEventListener("scroll", this._kaydirBagli);
    window.removeEventListener("resize", this._boyutPlanlaBagli);
    document.removeEventListener("visibilitychange", this._gorunurlukBagli);
    this._hareketMedya?.removeEventListener?.("change", this._hareketDegistiBagli);
    this._boyutGozcu?.disconnect();
    this._boyutGozcu = null;
  }

  _boyutPlanla() {
    if (this._boyutZamanlayici) return;
    this._boyutZamanlayici = setTimeout(() => {
      this._boyutZamanlayici = null;
      this._boyutlandir();
    }, BOYUT_BEKLE_MS);
  }

  _boyutlandir() {
    if (!this._tuval || !this._ctx) return;
    const g = Math.max(1, Math.round(this.clientWidth || window.innerWidth));
    const y = Math.max(1, Math.round(this.clientHeight || window.innerHeight));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const tuvalG = Math.round(g * dpr);
    const tuvalY = Math.round(y * dpr);

    if (this._tuval.width !== tuvalG || this._tuval.height !== tuvalY) {
      this._tuval.width = tuvalG;
      this._tuval.height = tuvalY;
    }
    this._g = g;
    this._y = y;
    this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._ciz(this._gecen, azHareket());
  }

  _durumuGuncelle() {
    if (!this.isConnected || document.hidden || azHareket()) {
      this._durdur();
      if (this.isConnected && !document.hidden) {
        this._ciz(this._gecen, true);
      }
      return;
    }
    this._baslat();
  }

  _baslat() {
    if (this._raf !== null) return;
    this._sonZaman = performance.now();
    this._raf = requestAnimationFrame(this._adimBagli);
  }

  _durdur() {
    if (this._raf !== null) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
  }

  _adim(simdi) {
    const dt = Math.min(0.1, Math.max(0, (simdi - this._sonZaman) / 1000));
    this._sonZaman = simdi;
    this._gecen += dt;
    this._ciz(this._gecen, false);
    this._raf = requestAnimationFrame(this._adimBagli);
  }

  _ciz(gecen, sabit) {
    const ctx = this._ctx;
    const g = this._g;
    const y = this._y;
    if (!ctx || !g || !y) return;

    ctx.clearRect(0, 0, g, y);
    const scrollY = sabit ? 0 : this._scrollY;

    for (let i = 0; i < this._yildizlar.length; i++) {
      const s = this._yildizlar[i];
      const k = s.katman;
      const hizOlcek = KATMAN_HIZ[k];
      const dx = sabit ? 0 : gecen * SURUKLENME_X * hizOlcek;
      const dy = sabit ? 0 : gecen * SURUKLENME_Y * hizOlcek - scrollY * PARALAKS[k];

      const px = (((s.x * g + dx) % g) + g) % g;
      const py = (((s.y * y + dy) % y) + y) % y;

      const titre = sabit ? 1 : 0.88 + 0.12 * Math.sin(gecen * s.titreHiz + s.faz);
      const op = Math.max(0.06, Math.min(0.24, s.opaklik * titre));

      ctx.globalAlpha = op;
      ctx.fillStyle = s.renk;
      ctx.beginPath();
      ctx.arc(px, py, s.yaricap, 0, IKI_PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

customElements.define("gok-atmosfer", GokAtmosfer);
