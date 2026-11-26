import { tohumlu, azHareket } from "../lib/rastgele.js?v=20261126a";

const KOK = "/assets/img/krallik/";
const SIZES = "(max-width: 760px) 100vw, 55vw";
const OTOMATIK_MS = 7500;
const PARLA_MS = 450;
const BOYUT_BEKLE_MS = 150;
const KIVILCIM_SAYISI = 14;
const KAR_SAYISI = 18;
const IKI_PI = Math.PI * 2;
const KIVILCIM_RENKLER = ["#ffd29a", "#f0b475", "#e0a26a", "#ff9d5c"];
const KAR_RENKLER = ["#e6efff", "#cfe0ff", "#f4f8ff"];

const KARELER = [
  {
    src: `${KOK}gercek-01-2000.jpg`,
    srcset: `${KOK}gercek-01-1000.jpg 1000w, ${KOK}gercek-01-2000.jpg 2000w`,
    etiket: "01/09 · İLK OCAK · GECE",
    mevsim: "gece",
    alt: "Gece, ormanla çevrili bir tepede dört kuleli taş kale ve avlunun ortasında yanan ilk ocak ateşi.",
  },
  {
    src: `${KOK}galeri/genel-3-1600.jpg`,
    srcset: `${KOK}galeri/genel-3-800.jpg 800w, ${KOK}galeri/genel-3-1600.jpg 1600w`,
    etiket: "02/09 · YERLEŞİM · GENEL",
    mevsim: "gece",
    alt: "Büyüyen taş yerleşimin gece kuş bakışı görünümü: evler, yollar, dere ve parlayan ocak ışıkları.",
  },
  {
    src: `${KOK}galeri/gorev-1-1600.jpg`,
    srcset: `${KOK}galeri/gorev-1-800.jpg 800w, ${KOK}galeri/gorev-1-1600.jpg 1600w`,
    etiket: "03/09 · GÖREV · OCAK",
    mevsim: "gorev",
    alt: "Krallık yerleşiminde ocak çevresinde yeni görev kararının açıldığı gece sahnesi.",
  },
  {
    src: `${KOK}galeri/gorev-2-1600.jpg`,
    srcset: `${KOK}galeri/gorev-2-800.jpg 800w, ${KOK}galeri/gorev-2-1600.jpg 1600w`,
    etiket: "04/09 · GÖREV · GECE",
    mevsim: "gorev",
    alt: "Gece karanlığında ateşlerle aydınlanan kalenin surları ve aktif görev sahnesi.",
  },
  {
    src: `${KOK}galeri/kis-1-1600.jpg`,
    srcset: `${KOK}galeri/kis-1-800.jpg 800w, ${KOK}galeri/kis-1-1600.jpg 1600w`,
    etiket: "05/09 · KIŞ · İLK KAR",
    mevsim: "kis",
    alt: "Yerleşimin ve çam ağaçlarının üzerine ilk karın yağdığı soğuk kış karesi.",
  },
  {
    src: `${KOK}galeri/kis-2-1600.jpg`,
    srcset: `${KOK}galeri/kis-2-800.jpg 800w, ${KOK}galeri/kis-2-1600.jpg 1600w`,
    etiket: "06/09 · KIŞ · KALE",
    mevsim: "kis",
    alt: "Kar altındaki kuleler, buz tutmuş çevre ve soğuğa direnen kale avlusu.",
  },
  {
    src: `${KOK}galeri/kis-3-1600.jpg`,
    srcset: `${KOK}galeri/kis-3-800.jpg 800w, ${KOK}galeri/kis-3-1600.jpg 1600w`,
    etiket: "07/09 · KIŞ · DON",
    mevsim: "kis",
    alt: "Derin kış donunda maviye çalan gece ışığı altında karla kaplı krallık.",
  },
  {
    src: `${KOK}galeri/lider-1-1600.jpg`,
    srcset: `${KOK}galeri/lider-1-800.jpg 800w, ${KOK}galeri/lider-1-1600.jpg 1600w`,
    etiket: "08/09 · LİDER · KARAR",
    mevsim: "lider",
    alt: "Krallığın gidişatını belirleyen liderlik kararı anında yerleşim sahnesi.",
  },
  {
    src: `${KOK}galeri/tac-1-1600.jpg`,
    srcset: `${KOK}galeri/tac-1-800.jpg 800w, ${KOK}galeri/tac-1-1600.jpg 1600w`,
    etiket: "09/09 · TAÇ · SALON",
    mevsim: "tac",
    alt: "Sıcak ışıkla aydınlanan taç salonu ve yeniden kurulmuş krallığın final karesi.",
  },
];

class KrallikSahne extends HTMLElement {
  constructor() {
    super();
    this._kuruldu = false;
    this._indeks = 0;
    this._etkinKatman = 0;
    this._gecisNo = 0;
    this._elle = false;
    this._gorunur = false;
    this._mevsimTip = "sicak";
    this._parcaciklar = [];
    this._ekstraKivilcim = [];
    this._onYuklenen = new Set();

    this._raf = null;
    this._sonZaman = 0;
    this._otomatikZamanlayici = null;
    this._parlaZamanlayici = null;
    this._parlaRaf = null;
    this._boyutZamanlayici = null;
    this._isikRaf = null;
    this._bekleyenIsik = null;
    this._kutu = null;
    this._g = 0;
    this._y = 0;
    this._dokunus = null;
    this._rng = tohumlu(90421);

    this._adimBagli = (t) => this._adim(t);
    this._klavyeBagli = (e) => this._klavye(e);
    this._gorunurlukBagli = () => this._durumSenkron();
    this._hareketDegistiBagli = () => this._durumSenkron();
    this._scrollBagli = () => {
      this._kutu = null;
    };
    this._boyutPlanlaBagli = () => this._boyutPlanla();
  }

  connectedCallback() {
    if (!this._kuruldu) {
      this._kuruldu = true;
      this._olustur();
    }

    this._hareketMedya = matchMedia("(prefers-reduced-motion: reduce)");
    document.addEventListener("keydown", this._klavyeBagli);
    document.addEventListener("visibilitychange", this._gorunurlukBagli);
    window.addEventListener("scroll", this._scrollBagli, { passive: true });
    this._hareketMedya.addEventListener?.("change", this._hareketDegistiBagli);

    if (typeof ResizeObserver === "function") {
      this._boyutGozcu = new ResizeObserver(this._boyutPlanlaBagli);
      this._boyutGozcu.observe(this._cerceve);
    } else {
      window.addEventListener("resize", this._boyutPlanlaBagli, { passive: true });
    }

    this._gorunurlukGozcu = new IntersectionObserver(
      (girdiler) => {
        const g = girdiler[0];
        if (!g) return;
        this._gorunur = g.isIntersecting;
        this._durumSenkron();
      },
      { threshold: 0.15 },
    );
    this._gorunurlukGozcu.observe(this);

    this._boyutlandir();
    this._yayinla(0);
    this._onYukle(1);
    this._durumSenkron();
  }

  disconnectedCallback() {
    this._parcacikDurdur();
    this._otomatikDurdur();
    clearTimeout(this._boyutZamanlayici);
    clearTimeout(this._parlaZamanlayici);
    if (this._parlaRaf) cancelAnimationFrame(this._parlaRaf);
    if (this._isikRaf) cancelAnimationFrame(this._isikRaf);

    document.removeEventListener("keydown", this._klavyeBagli);
    document.removeEventListener("visibilitychange", this._gorunurlukBagli);
    window.removeEventListener("scroll", this._scrollBagli);
    window.removeEventListener("resize", this._boyutPlanlaBagli);
    this._hareketMedya?.removeEventListener?.("change", this._hareketDegistiBagli);
    this._boyutGozcu?.disconnect();
    this._gorunurlukGozcu?.disconnect();
    this._boyutGozcu = null;
    this._gorunurlukGozcu = null;
  }

  get indeks() {
    return this._indeks;
  }

  get toplam() {
    return KARELER.length;
  }

  git(hedefIndeks, kullanici = true) {
    const n = KARELER.length;
    const yeni = ((hedefIndeks % n) + n) % n;
    if (kullanici) {
      this._elle = true;
      this._otomatikDurdur();
    }
    if (yeni === this._indeks) return;
    this._indeks = yeni;
    this._kareyiGoster(yeni);
  }

  parla() {
    clearTimeout(this._parlaZamanlayici);
    if (this._parlaRaf) cancelAnimationFrame(this._parlaRaf);

    const tetikle = () => {
      this.classList.add("parliyor");
      this._parlaZamanlayici = setTimeout(() => {
        this.classList.remove("parliyor");
        this._parlaZamanlayici = null;
      }, PARLA_MS);
    };

    if (this.classList.contains("parliyor")) {
      this.classList.remove("parliyor");
      this._parlaRaf = requestAnimationFrame(() => {
        this._parlaRaf = null;
        tetikle();
      });
    } else {
      tetikle();
    }

    if (!azHareket() && this._gorunur && this._mevsimTip !== "kis" && this._g && this._y) {
      for (let i = 0; i < 4; i++) {
        this._ekstraKivilcim.push({
          x: this._g * (0.42 + this._rng() * 0.24),
          y: this._y * (0.36 + this._rng() * 0.16),
          vx: (this._rng() - 0.5) * 44,
          vy: -(30 + this._rng() * 52),
          r: 1.2 + this._rng() * 1.4,
          omur: 0,
          sure: 0.45 + this._rng() * 0.35,
          renk: KIVILCIM_RENKLER[Math.floor(this._rng() * KIVILCIM_RENKLER.length)],
        });
      }
    }
  }

  _olustur() {
    const ilk = KARELER[0];
    this.dataset.mevsim = ilk.mevsim;
    this.style.setProperty("--fx", "52%");
    this.style.setProperty("--fy", "43%");

    const centikler = KARELER.map(
      (k, i) =>
        `<button class="ks-centik${i === 0 ? " etkin" : ""}" type="button" data-indeks="${i}" aria-label="${k.etiket}" aria-pressed="${i === 0 ? "true" : "false"}"><span></span></button>`,
    ).join("");

    this.innerHTML = `
      <figure class="ks-cerceve krallik-kare" tabindex="0" role="region" aria-roledescription="sahne" aria-label="Krallık oyun içi sahneleri">
        <img class="ks-foto etkin" src="${ilk.src}" srcset="${ilk.srcset}" sizes="${SIZES}" width="2000" height="1250" alt="${ilk.alt}" decoding="async">
        <img class="ks-foto" aria-hidden="true" width="1600" height="1000" alt="" decoding="async">
        <span class="ks-isik" aria-hidden="true"></span>
        <span class="krallik-fener" aria-hidden="true"></span>
        <canvas class="ks-parcacik" aria-hidden="true"></canvas>
      </figure>
      <div class="ks-kontrol">
        <div class="ks-serit" role="group" aria-label="Sahne seçimi">${centikler}</div>
        <div class="ks-alt veri">
          <span class="ks-etiket" aria-live="polite">${ilk.etiket}</span>
          <span class="ks-ipucu" aria-hidden="true">← → SAHNE</span>
        </div>
      </div>`;

    this._cerceve = this.querySelector(".ks-cerceve");
    this._fotolar = [...this.querySelectorAll(".ks-foto")];
    this._tuval = this.querySelector(".ks-parcacik");
    this._ctx = this._tuval.getContext("2d");
    this._centikler = [...this.querySelectorAll(".ks-centik")];
    this._etiketEl = this.querySelector(".ks-etiket");

    this._onYuklenen.add(ilk.src);

    this._centikler.forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.indeks);
        if (!Number.isNaN(i)) this.git(i, true);
      });
    });

    this._cerceve.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "touch") return;
      this._kutu = this._cerceve.getBoundingClientRect();
      this.classList.add("isik-aktif");
      this._isikKonumla(e.clientX, e.clientY);
    });

    this._cerceve.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      this._isikKonumla(e.clientX, e.clientY);
    });

    this._cerceve.addEventListener("pointerleave", () => {
      this.classList.remove("isik-aktif");
      this._kutu = null;
    });

    this._cerceve.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length !== 1) return;
        this._dokunus = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      },
      { passive: true },
    );

    this._cerceve.addEventListener(
      "touchend",
      (e) => {
        if (!this._dokunus || !e.changedTouches.length) return;
        const dx = e.changedTouches[0].clientX - this._dokunus.x;
        const dy = e.changedTouches[0].clientY - this._dokunus.y;
        this._dokunus = null;
        if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.4) {
          this.git(this._indeks + (dx < 0 ? 1 : -1), true);
        }
      },
      { passive: true },
    );
  }

  _isikKonumla(cx, cy) {
    this._bekleyenIsik = { cx, cy };
    if (this._isikRaf) return;
    this._isikRaf = requestAnimationFrame(() => {
      this._isikRaf = null;
      const p = this._bekleyenIsik;
      if (!p || !this._cerceve) return;
      if (!this._kutu) this._kutu = this._cerceve.getBoundingClientRect();
      const k = this._kutu;
      if (!k.width || !k.height) return;
      const fx = Math.max(0, Math.min(100, ((p.cx - k.left) / k.width) * 100));
      const fy = Math.max(0, Math.min(100, ((p.cy - k.top) / k.height) * 100));
      this.style.setProperty("--fx", `${fx.toFixed(2)}%`);
      this.style.setProperty("--fy", `${fy.toFixed(2)}%`);
    });
  }

  _kareyiGoster(indeks) {
    const kare = KARELER[indeks];
    const gecisNo = ++this._gecisNo;
    const eskiKatman = this._etkinKatman;
    const yeniKatman = 1 - eskiKatman;
    const eskiImg = this._fotolar[eskiKatman];
    const yeniImg = this._fotolar[yeniKatman];

    this._arayuzuGuncelle(indeks);
    this._yayinla(indeks);
    this._mevsimGuncelle(kare.mevsim);
    this._onYukle((indeks + 1) % KARELER.length);

    const degistir = () => {
      if (gecisNo !== this._gecisNo) return;
      this._etkinKatman = yeniKatman;
      yeniImg.removeAttribute("aria-hidden");
      yeniImg.classList.add("etkin");
      eskiImg.setAttribute("aria-hidden", "true");
      eskiImg.classList.remove("etkin");
    };

    yeniImg.alt = kare.alt;
    yeniImg.sizes = SIZES;
    yeniImg.srcset = kare.srcset;
    yeniImg.src = kare.src;
    this._onYuklenen.add(kare.src);

    if (yeniImg.complete && yeniImg.naturalWidth > 0) {
      requestAnimationFrame(degistir);
    } else if (typeof yeniImg.decode === "function") {
      yeniImg.decode().then(degistir, degistir);
    } else {
      yeniImg.addEventListener("load", degistir, { once: true });
      yeniImg.addEventListener("error", degistir, { once: true });
    }
  }

  _arayuzuGuncelle(indeks) {
    const kare = KARELER[indeks];
    this._etiketEl.textContent = kare.etiket;
    this.dataset.mevsim = kare.mevsim;
    this._centikler.forEach((btn, i) => {
      const etkin = i === indeks;
      btn.classList.toggle("etkin", etkin);
      btn.setAttribute("aria-pressed", String(etkin));
    });
  }

  _yayinla(indeks) {
    const kare = KARELER[indeks];
    document.body.dataset.krallikMevsim = kare.mevsim;
    document.dispatchEvent(
      new CustomEvent("krallik-mevsim", {
        detail: {
          mevsim: kare.mevsim,
          indeks,
          toplam: KARELER.length,
          etiket: kare.etiket,
        },
      }),
    );
  }

  _onYukle(indeks) {
    const kare = KARELER[indeks];
    if (!kare || this._onYuklenen.has(kare.src)) return;
    this._onYuklenen.add(kare.src);
    const img = new Image();
    img.decoding = "async";
    img.sizes = SIZES;
    img.srcset = kare.srcset;
    img.src = kare.src;
  }

  _klavye(e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const hedef = e.target instanceof Element ? e.target : document.body;
    if (hedef.closest("input, textarea, select, [contenteditable]")) return;

    const odakta = this.contains(document.activeElement);
    const bolumAktif = this._gorunur || document.body.dataset.ekran === "ais-002";
    if (!odakta && !bolumAktif) return;

    e.preventDefault();
    this.git(this._indeks + (e.key === "ArrowRight" ? 1 : -1), true);
  }

  _otomatikBaslat() {
    if (this._elle || azHareket() || !this._gorunur || document.hidden) return;
    if (this._otomatikZamanlayici) return;
    this._otomatikZamanlayici = setInterval(() => {
      if (this._elle || !this._gorunur || document.hidden || azHareket()) {
        this._otomatikDurdur();
        return;
      }
      this.git(this._indeks + 1, false);
    }, OTOMATIK_MS);
  }

  _otomatikDurdur() {
    if (this._otomatikZamanlayici) {
      clearInterval(this._otomatikZamanlayici);
      this._otomatikZamanlayici = null;
    }
  }

  _durumSenkron() {
    if (!this.isConnected || !this._gorunur || document.hidden || azHareket()) {
      this._parcacikDurdur();
      this._otomatikDurdur();
      if (azHareket() && this._ctx && this._g && this._y) {
        this._ctx.clearRect(0, 0, this._g, this._y);
      }
      return;
    }
    this._parcacikBaslat();
    this._otomatikBaslat();
  }

  _mevsimGuncelle(mevsim) {
    const yeniTip = mevsim === "kis" ? "kis" : "sicak";
    if (yeniTip === this._mevsimTip) return;
    this._mevsimTip = yeniTip;
    this._ekstraKivilcim.length = 0;
    this._havuzuKur();
  }

  _boyutPlanla() {
    if (this._boyutZamanlayici) return;
    this._boyutZamanlayici = setTimeout(() => {
      this._boyutZamanlayici = null;
      this._kutu = null;
      this._boyutlandir();
    }, BOYUT_BEKLE_MS);
  }

  _boyutlandir() {
    if (!this._cerceve || !this._tuval || !this._ctx) return;
    const g = Math.max(1, Math.round(this._cerceve.clientWidth));
    const y = Math.max(1, Math.round(this._cerceve.clientHeight));
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
    if (!this._parcaciklar.length) this._havuzuKur();
  }

  _havuzuKur() {
    const g = this._g || 640;
    const y = this._y || 400;
    this._parcaciklar = [];
    if (this._mevsimTip === "kis") {
      for (let i = 0; i < KAR_SAYISI; i++) {
        this._parcaciklar.push(this._yeniKar(g, y, true));
      }
    } else {
      for (let i = 0; i < KIVILCIM_SAYISI; i++) {
        this._parcaciklar.push(this._yeniKivilcim(g, y, true));
      }
    }
  }

  _yeniKivilcim(g, y, rastgeleY) {
    const r = this._rng;
    return {
      x: g * (0.14 + r() * 0.72),
      y: rastgeleY ? y * (0.2 + r() * 0.8) : y * (0.86 + r() * 0.14),
      vy: -(11 + r() * 17),
      salinimGenlik: 6 + r() * 12,
      salinimHiz: 0.9 + r() * 1.4,
      faz: r() * IKI_PI,
      r: 0.9 + r() * 1.35,
      opaklik: 0.28 + r() * 0.44,
      renk: KIVILCIM_RENKLER[Math.floor(r() * KIVILCIM_RENKLER.length)],
    };
  }

  _yeniKar(g, y, rastgeleY) {
    const r = this._rng;
    const derinlik = 0.55 + r() * 0.9;
    return {
      x: r() * g,
      y: rastgeleY ? r() * y : -6 - r() * 24,
      vx: (16 + r() * 18) * derinlik,
      vy: (24 + r() * 26) * derinlik,
      salinimHiz: 0.7 + r() * 1.1,
      faz: r() * IKI_PI,
      r: 0.85 + derinlik * 0.85,
      opaklik: 0.22 + derinlik * 0.34,
      renk: KAR_RENKLER[Math.floor(r() * KAR_RENKLER.length)],
    };
  }

  _parcacikBaslat() {
    if (this._raf !== null) return;
    if (!this._parcaciklar.length) this._havuzuKur();
    this._sonZaman = performance.now();
    this._raf = requestAnimationFrame(this._adimBagli);
  }

  _parcacikDurdur() {
    if (this._raf !== null) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
  }

  _adim(simdi) {
    const dt = Math.min(0.06, Math.max(0.001, (simdi - this._sonZaman) / 1000));
    this._sonZaman = simdi;
    this._cizParcacik(dt, simdi / 1000);
    this._raf = requestAnimationFrame(this._adimBagli);
  }

  _cizParcacik(dt, t) {
    const ctx = this._ctx;
    const g = this._g;
    const y = this._y;
    if (!ctx || !g || !y) return;

    ctx.clearRect(0, 0, g, y);

    if (this._mevsimTip === "kis") {
      for (let i = 0; i < this._parcaciklar.length; i++) {
        const p = this._parcaciklar[i];
        p.x += (p.vx + Math.sin(t * p.salinimHiz + p.faz) * 5) * dt;
        p.y += p.vy * dt;
        if (p.y > y + 8 || p.x > g + 12) {
          this._parcaciklar[i] = this._yeniKar(g, y, false);
          if (p.x > g + 12 && p.y < y * 0.8) {
            this._parcaciklar[i].x = -6;
            this._parcaciklar[i].y = this._rng() * y * 0.7;
          }
          continue;
        }
        const kenarY = Math.min(1, p.y / (y * 0.14), (y - p.y) / (y * 0.16));
        const op = Math.max(0, p.opaklik * kenarY);
        if (op <= 0.01) continue;
        ctx.globalAlpha = op;
        ctx.fillStyle = p.renk;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, IKI_PI);
        ctx.fill();
      }
    } else {
      for (let i = 0; i < this._parcaciklar.length; i++) {
        const p = this._parcaciklar[i];
        p.y += p.vy * dt;
        const sx = p.x + Math.sin(t * p.salinimHiz + p.faz) * p.salinimGenlik;
        if (p.y < y * 0.08) {
          this._parcaciklar[i] = this._yeniKivilcim(g, y, false);
          continue;
        }
        const yukari = (p.y - y * 0.08) / (y * 0.92);
        const altSolma = Math.min(1, (y - p.y) / (y * 0.14));
        const titre = 0.72 + 0.28 * Math.sin(t * 3.1 + p.faz);
        const op = Math.max(0, p.opaklik * Math.pow(Math.max(0, yukari), 0.7) * altSolma * titre);
        if (op <= 0.01) continue;
        ctx.globalAlpha = op;
        ctx.fillStyle = p.renk;
        ctx.beginPath();
        ctx.arc(sx, p.y, p.r, 0, IKI_PI);
        ctx.fill();
      }

      for (let i = this._ekstraKivilcim.length - 1; i >= 0; i--) {
        const k = this._ekstraKivilcim[i];
        k.omur += dt;
        if (k.omur >= k.sure) {
          this._ekstraKivilcim.splice(i, 1);
          continue;
        }
        k.x += k.vx * dt;
        k.y += k.vy * dt;
        k.vx *= 0.96;
        const oran = 1 - k.omur / k.sure;
        ctx.globalAlpha = oran * 0.85;
        ctx.fillStyle = k.renk;
        ctx.beginPath();
        ctx.arc(k.x, k.y, k.r * (0.5 + oran * 0.5), 0, IKI_PI);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}

customElements.define("krallik-sahne", KrallikSahne);
