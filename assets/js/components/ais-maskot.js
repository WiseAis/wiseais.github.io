import { tohumlu, azHareket } from "../lib/rastgele.js?v=20261126a";
import { el } from "../lib/svg.js?v=20261126a";

let sayac = 0;

const YUZ = {
  sol: { x: -13, y: -6, g: 6, y2: 8 },
  sag: { x: 5, y: -7, g: 6, y2: 9 },
  sicak: { x: 14, y: 6, g: 4 },
  agiz: "M-6 10h4v2h4v-2h4",
  koyu: "#0b0a10",
};

export const SOZLER = {
  ais: [
    "Ben bir yıldızım. Galiba. Ya da sensör gürültüsüyüm, daha istiflenmedim.",
    "Tek kareyim, beni şimdilik ciddiye alma.",
    "Yanağımdaki kırmızı nokta sıcak piksel. Ben ona ben diyorum.",
    "Kalibrasyon karelerimi evde unuttum.",
  ],
  aisen: [
    "92 kare sonra: evet, kesinlikle yıldızım.",
    "Pikselim yarıya indi, özgüvenim ikiye katlandı. Drizzle böyle bir şey.",
    "Saçımdaki çivileri objektifin diyaframı yaptı. Doğal.",
    "Gürültüm √N kadar azaldı, özgüvenim N kadar arttı.",
    "Sıcak pikselim gitmedi. Artık karakterimin parçası.",
  ],
  aisenit: [
    "Aisenit · nadir mineral. Sertlik: Mohs 7. Sabır: 2597 × 8 sn.",
    "Aisen'in perçemi bende de var. Sadece daha iyi taranmış.",
    "En ince ızgaradayım. Yine de pikselim, unutmayalım.",
    "Çivilerim artık bir piksel. İnce ama keskin.",
    "Sıcak pikselim hâlâ yerinde. Bazı şeyler kalibre edilmez.",
  ],
};

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bayer = (ix, iy) => BAYER[(iy & 3) * 4 + (ix & 3)];
const sinirla = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

function ditherSec(tonlar, v, ix, iy) {
  const t = sinirla(v) * (tonlar.length - 1);
  let i = Math.floor(t);
  if (t - i > bayer(ix, iy)) i++;
  return tonlar[Math.min(tonlar.length - 1, i)];
}

function rasterCiz(g, boy, renkF, alan = 60) {
  const yollar = new Map();
  for (let y = -alan; y < alan; y += boy) {
    let oncekiRenk = null;
    let basla = 0;
    const kapat = (bitis) => {
      if (!oncekiRenk) return;
      yollar.set(oncekiRenk, (yollar.get(oncekiRenk) || "") + `M${basla} ${y}h${bitis - basla}v${boy}h${basla - bitis}z`);
    };
    for (let x = -alan; x <= alan; x += boy) {
      const renk = x < alan ? renkF(x + boy / 2, y + boy / 2, Math.round(x / boy), Math.round(y / boy)) : null;
      if (renk !== oncekiRenk) {
        kapat(x);
        oncekiRenk = renk;
        basla = x;
      }
    }
  }
  for (const [fill, d] of yollar) el("path", { d, fill, "shape-rendering": "crispEdges" }, g);
}

function sicakPiksel(g) {
  const { x, y, g: b } = YUZ.sicak;
  el("rect", { x, y, width: b, height: b, fill: "#ff4f61", class: "m-sicak", "shape-rendering": "crispEdges" }, g);
}

function yuzCiz(yuz, { yuvarlak = false, ikinciParilti = false } = {}) {
  const gozler = el("g", { class: "m-goz" }, yuz);
  for (const k of [YUZ.sol, YUZ.sag]) {
    const d = yuvarlak
      ? `M${k.x + 1} ${k.y}h${k.g - 2}v1h1v${k.y2 - 2}h-1v1h${2 - k.g}v-1h-1v${2 - k.y2}h1z`
      : `M${k.x} ${k.y}h${k.g}v${k.y2}h${-k.g}z`;
    el("path", { d, fill: YUZ.koyu, "shape-rendering": "crispEdges" }, gozler);
    el("rect", { x: k.x + 1, y: k.y + 1, width: 2, height: 2, fill: "#fffaf2", "shape-rendering": "crispEdges" }, gozler);
    if (ikinciParilti) el("rect", { x: k.x + k.g - 2, y: k.y + k.y2 - 3, width: 1, height: 1, fill: "#fffaf2", "shape-rendering": "crispEdges" }, gozler);
  }
  el("path", { d: YUZ.agiz, fill: "none", stroke: YUZ.koyu, "stroke-width": 2, "shape-rendering": "crispEdges" }, yuz);
}

function allik(x, y) {
  const sol = ((x + 17) / 3.5) ** 2 + ((y - 7) / 1.6) ** 2 <= 1;
  const sag = ((x - 17) / 3.5) ** 2 + ((y - 9) / 1.6) ** 2 <= 1;
  return sol || sag;
}

function cizAis(svg, _id, ilkGenlik = 1) {
  const g = el("g", { class: "m-govde m-ais" }, svg);
  const pikseller = el("g", { class: "m-pikseller" }, g);
  const rnd = tohumlu(7);
  const H = 4;
  const hucreler = [];
  for (let y = -32; y < 32; y += H) {
    for (let x = -32; x < 32; x += H) {
      const cx = x + H / 2;
      const cy = y + H / 2;

      const r = Math.hypot(cx * 1.04, (cy - 2) * 0.96);
      const sinir = 29 + (rnd() - 0.5) * 6;
      if (r > sinir) continue;
      const temel = 1 - Math.pow(r / 31, 2.2);
      const rect = el("rect", { x, y, width: H, height: H, "shape-rendering": "crispEdges" }, pikseller);
      hucreler.push({ rect, temel, kenar: r > sinir - 4 });
    }
  }
  const boya = (genlik = 1) => {
    const s = sinirla(genlik, 0, 1);

    const kenarOlasilik = 0.3 * s;
    const kenarSaydam = (0.35 + (1 - s) * 0.15).toFixed(2);
    for (const h of hucreler) {
      const gurultu = (Math.random() - 0.5) * 0.52 * s;
      const v = sinirla(0.44 + h.temel * 0.53 + gurultu, 0.12, 1);
      const ton = Math.round(112 + v * 128);
      h.rect.setAttribute("fill", `rgb(${ton},${ton - 2},${ton - 6})`);

      const kirpik = h.kenar && Math.random() < kenarOlasilik;
      h.rect.setAttribute("opacity", kirpik ? kenarSaydam : "1");
    }
  };
  boya(ilkGenlik);

  const yuz = el("g", { class: "m-yuz" }, g);
  yuzCiz(yuz);

  sicakPiksel(yuz);
  return { boya };
}

function percemNoktalari() {
  const nokta = [];
  for (let t = 0; t <= 1; t += 0.02) {
    const u = 1 - t;
    const x = 3 * u * u * t * 2 + 3 * u * t * t * -3 + t ** 3 * 4;
    const y = u ** 3 * -27 + 3 * u * u * t * -36 + 3 * u * t * t * -44 + t ** 3 * -46;
    nokta.push([x, y]);
  }
  for (let t = 0; t <= 1; t += 0.05) nokta.push([4 + Math.sin(t * Math.PI) * 6 + t * 4, -46 + t * 5 - Math.sin(t * Math.PI) * 2]);
  return nokta;
}

const AISEN_TON = ["#c97f4a", "#eea566", "#ffc98a", "#ffe0b4", "#fff1da", "#fffbf3"];

function cizAisen(svg) {
  const g = el("g", { class: "m-govde m-aisen" }, svg);
  const R = 27;

  rasterCiz(el("g", { class: "m-hale" }, g), 2, (x, y, ix, iy) => {
    const r = Math.hypot(x, y);
    if (r <= R || r > 38) return null;
    return bayer(ix, iy) < (1 - (r - R) / 11) * 0.42 ? "#ffe2b866" : null;
  });

  rasterCiz(el("g", { class: "m-civiler" }, g), 2, (x, y, ix, iy) => {
    const yatay = y > -2 && y < 0;
    const dikey = x > -2 && x < 0;
    if (!yatay && !dikey) return null;
    const d = yatay ? Math.abs(x) : Math.abs(y);
    if (d <= R || d > 56) return null;
    return bayer(ix, iy) < 1 - (d - R) / 29 ? "#fff4e2" : null;
  });

  const percem = percemNoktalari();
  rasterCiz(el("g", { class: "m-percem" }, g), 2, (x, y) => (percem.some(([px, py]) => Math.abs(px - x) < 1.2 && Math.abs(py - y) < 1.2) ? "#fff4e2" : null));

  rasterCiz(g, 2, (x, y, ix, iy) => {
    const r = Math.hypot(x, y);
    if (r > R) return null;
    if (allik(x, y)) return "#ff9aa6";
    const isik = 1 - Math.pow(r / R, 1.8);
    const yon = ((-x * 0.6 - y * 0.8) / R) * 0.28;
    return ditherSec(AISEN_TON, isik * 0.82 + 0.12 + yon, ix, iy);
  });

  const yuz = el("g", { class: "m-yuz" }, g);
  yuzCiz(yuz, { yuvarlak: true });
  sicakPiksel(yuz);

  const kivilcim = el("g", { class: "m-kivilcim" }, g);
  for (const [x, y] of [[-40, -28], [36, -36], [40, 22], [-36, 32]]) {
    el("rect", { x, y, width: 2, height: 2, fill: "#fff4e2", "shape-rendering": "crispEdges" }, kivilcim);
  }
  return {};
}

const AISENIT_TON = ["#b9683a", "#d9864f", "#f0a565", "#ffc387", "#ffdcb0", "#ffeed6", "#fff8ec", "#fffdf8"];

function cizAisenit(svg) {
  const g = el("g", { class: "m-govde m-aisenit" }, svg);
  const R = 29;

  rasterCiz(el("g", { class: "m-hale" }, g), 1, (x, y, ix, iy) => {
    const r = Math.hypot(x, y);
    if (r <= R || r > 44) return null;
    if (bayer(ix, iy) >= (1 - (r - R) / 15) * 0.4) return null;
    if (r < R + 5) return "#ffe2b866";
    const yon = (x - y) / r;
    if (yon < -0.55) return "#ff7a8a59";
    if (yon > 0.55) return "#6fe3d659";
    return "#ffe2b84d";
  });

  rasterCiz(el("g", { class: "m-civiler" }, g), 1, (x, y, ix, iy) => {
    const ana = Math.abs(y) < 1 || Math.abs(x) < 1;
    const kose = Math.abs(Math.abs(x) - Math.abs(y)) < 1;
    if (!ana && !kose) return null;
    const d = ana ? Math.max(Math.abs(x), Math.abs(y)) : Math.hypot(x, y);
    const boy = ana ? 30 : 14;
    if (d <= R || d > R + boy) return null;
    return bayer(ix, iy) < 1 - (d - R) / boy ? (ana ? "#fff4e2" : "#ffe2b8") : null;
  });

  const percem = percemNoktalari();
  rasterCiz(el("g", { class: "m-percem" }, g), 1, (x, y) => (percem.some(([px, py]) => Math.abs(px - x) < 1 && Math.abs(py - y) < 1) ? "#fff4e2" : null));

  rasterCiz(g, 1, (x, y, ix, iy) => {
    const r = Math.hypot(x, y);
    if (r > R) return null;
    if (allik(x, y)) return "#ff9aa6";
    const isik = 1 - Math.pow(r / R, 1.8);
    const yon = ((-x * 0.6 - y * 0.8) / R) * 0.28;
    return ditherSec(AISENIT_TON, isik * 0.84 + 0.1 + yon, ix, iy);
  });

  el("path", { d: "M-17 -14h3v1h1v3h-1v1h-3v-1h-1v-3h1z", fill: "#ffffff", opacity: 0.85, "shape-rendering": "crispEdges" }, g);

  const yuz = el("g", { class: "m-yuz" }, g);
  yuzCiz(yuz, { yuvarlak: true, ikinciParilti: true });
  sicakPiksel(yuz);

  const kivilcim = el("g", { class: "m-kivilcim" }, g);
  for (const [x, y, fill] of [[-42, -26, "#ff7a8a"], [38, -34, "#fff4e2"], [41, 24, "#6fe3d6"], [-37, 33, "#fff4e2"]]) {
    el("path", { d: `M${x} ${y - 1}h1v1h1v1h-1v1h-1v-1h-1v-1h1z`, fill, "shape-rendering": "crispEdges" }, kivilcim);
  }

  el("path", { d: "M36 -45h1v9h-1z M32 -41h9v1h-9z", fill: "#fff4e2", class: "m-parilti", "shape-rendering": "crispEdges" }, g);
  return {};
}

const TAC = ["X...X...X", "XX.XXX.XX", "XXXXXXXXX", "XXXXRXXXX", "XXXXXXXXX"];
function tacCiz(svg, faz) {
  const yer = { ais: "translate(-2 -40) rotate(10)", aisen: "translate(-7 -46) rotate(16)", aisenit: "translate(-6 -50) rotate(8)" }[faz];
  const g = el("g", { class: "m-tac", transform: yer }, svg);
  TAC.forEach((satir, y) =>
    [...satir].forEach((h, x) => {
      if (h === ".") return;
      el("rect", { x: x * 1.6, y: y * 1.6, width: 1.6, height: 1.6, fill: h === "R" ? "#ff4f61" : y === 0 ? "#fff1c9" : "#e0a26a", "shape-rendering": "crispEdges" }, g);
    }),
  );
}

const CIZIMLER = { ais: cizAis, aisen: cizAisen, aisenit: cizAisenit };
const ETIKET = {
  ais: "Ais, maskotun ilk fazı: gürültülü, kaba pikselli bir yığın",
  aisen: "Aisen, maskotun ikinci fazı: daha ince pikselli, istiflenmiş bir yıldız",
  aisenit: "Aisenit, maskotun son fazı: en ince pikselli, keskin çivili bir yıldız",
};

class AisMaskot extends HTMLElement {
  static observedAttributes = ["faz", "boyut", "aksesuar", "kare"];

  connectedCallback() {
    if (this._hazir) return;
    this._hazir = true;
    this._gorunur = true;
    this._gurultuGenlik = 1;
    this._sonBoya = 0;
    this.classList.add("maskot");
    this.setAttribute("role", "img");
    this._ciz();
    if (this.hasAttribute("konus")) this._konusmayiKur();

    this._gozcu = new IntersectionObserver(([g]) => {
      this._gorunur = g.isIntersecting;
      this._hareketDurumuGuncelle();
    });
    this._gozcu.observe(this);

    this._gorunurlukDegisti = () => this._hareketDurumuGuncelle();
    document.addEventListener("visibilitychange", this._gorunurlukDegisti);
    this._hareketDurumuGuncelle();
  }

  disconnectedCallback() {
    this._donguDurdur();
    clearInterval(this._gurultu);
    this._gurultu = 0;
    this._gozcu?.disconnect();
    document.removeEventListener("visibilitychange", this._gorunurlukDegisti);
    this._konusmaYokEt?.();
    this._hazir = false;
  }

  attributeChangedCallback(ad, eski, yeni) {
    if (!this._hazir || eski === yeni) return;
    if (ad === "kare") {
      this._kareUygula(true);
      return;
    }
    if (ad === "faz") {
      this._konusmaTemizle?.();
    }
    this._ciz();
  }

  get faz() {
    const f = this.getAttribute("faz");
    return CIZIMLER[f] ? f : "ais";
  }

  _ciz() {
    const boyut = Number(this.getAttribute("boyut")) || 96;
    const id = `m${++sayac}`;
    this.style.setProperty("--boyut", `${boyut}px`);
    this.dataset.faz = this.faz;
    this.setAttribute("aria-label", ETIKET[this.faz]);

    this._kareHesapla();
    this.querySelector(":scope > svg")?.remove();
    const svg = el("svg", { viewBox: "-60 -60 120 120", width: boyut, height: boyut, "aria-hidden": "true" });
    this.prepend(svg);
    this._cizim = CIZIMLER[this.faz](svg, id, this._gurultuGenlik);
    if (this.getAttribute("aksesuar") === "tac") tacCiz(svg, this.faz);

    this._hareketDurumuGuncelle();
  }

  _kareHesapla() {
    const faz = this.faz;
    const varMi = this.hasAttribute("kare");
    const n = Math.max(1, Number(this.getAttribute("kare")) || 1);

    if (faz === "ais") {
      const genlik = varMi ? 1 / Math.sqrt(n) : 1;
      const oran = varMi ? sinirla((n - 1) / 38) : 0;
      this._gurultuGenlik = genlik;
      this.style.setProperty("--gurultu-genlik", genlik.toFixed(3));
      this.style.setProperty("--evrim-oran", oran.toFixed(3));
      return;
    }

    this._gurultuGenlik = 0;
    this.style.setProperty("--gurultu-genlik", "0");
    if (faz === "aisen") {
      const oran = varMi ? sinirla(Math.log(Math.max(40, n) / 40) / Math.log(999 / 40)) : 1;
      this.style.setProperty("--evrim-oran", oran.toFixed(3));
      return;
    }

    const oran = varMi ? sinirla(Math.log(Math.max(1000, n) / 1000) / Math.log(2597 / 1000)) : 1;
    this.style.setProperty("--evrim-oran", oran.toFixed(3));
  }

  _kareUygula(anlikBoya = false) {
    this._kareHesapla();
    if (anlikBoya && this.faz === "ais" && this._cizim?.boya && this._gorunur && !document.hidden) {
      const simdi = performance.now();
      if (simdi - this._sonBoya >= 48) {
        this._sonBoya = simdi;
        this._cizim.boya(this._gurultuGenlik);
      }
    }
  }

  _hareketDurumuGuncelle() {
    const etkin = this._gorunur && !document.hidden && !azHareket();

    if (etkin && this._cizim?.boya) {
      if (!this._gurultu) {
        this._gurultu = setInterval(() => {
          if (this._gorunur && !document.hidden) {
            this._cizim?.boya?.(this._gurultuGenlik);
          }
        }, 260);
      }
    } else if (this._gurultu) {
      clearInterval(this._gurultu);
      this._gurultu = 0;
    }

    if (etkin && typeof this._cizim?.adim === "function") {
      this._donguBaslat();
    } else {
      this._donguDurdur();
    }
  }

  _donguBaslat() {
    if (this._raf || azHareket() || !this._gorunur || document.hidden || typeof this._cizim?.adim !== "function") return;
    let son = performance.now();
    const tik = (t) => {
      if (!this._gorunur || document.hidden || azHareket() || typeof this._cizim?.adim !== "function") {
        this._raf = 0;
        return;
      }
      this._cizim.adim(t - son);
      son = t;
      this._raf = requestAnimationFrame(tik);
    };
    this._raf = requestAnimationFrame(tik);
  }

  _donguDurdur() {
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = 0;
    }
  }

  _konusmayiKur() {
    konusmayiKur(this, () => SOZLER[this.faz]);
  }
}

const ONEMLI = "a[href], button, summary, h1, h2, h3, p, figcaption, label, input, [role='button'], [tabindex]";

function maskotKutusu(maskot) {
  const k = maskot.getBoundingClientRect();
  const svg = maskot.querySelector(":scope > svg");
  const s = svg ? svg.getBoundingClientRect() : null;
  if (s && s.width > 0 && s.height > 0) {
    return {
      k,
      mk: {
        left: Math.min(k.left, s.left),
        top: Math.min(k.top, s.top),
        right: Math.max(k.right, s.right),
        bottom: Math.max(k.bottom, s.bottom),
      },
    };
  }
  return {
    k,
    mk: { left: k.left, top: k.top, right: k.right, bottom: k.bottom },
  };
}

function balonuKacir(maskot, balon, olcuKayit) {
  if (!maskot.isConnected) return;
  const { k, mk } = maskotKutusu(maskot);
  if (!k.width || k.bottom < 0 || k.top > innerHeight) return;

  balon.classList.remove("serbest", "takip");
  for (const ozellik of ["left", "right", "top", "bottom", "max-width", "--tx"]) balon.style.removeProperty(ozellik);

  const onemli = [];
  for (const e of document.querySelectorAll(ONEMLI)) {
    if (e === document.body || e.closest(".maskot, ais-maskot")) continue;
    const r = e.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth) {
      onemli.push(r);
    }
  }

  const kesisim = (a, b) => Math.max(0, Math.min(a.r, b.right) - Math.max(a.l, b.left)) * Math.max(0, Math.min(a.b, b.bottom) - Math.max(a.t, b.top));
  const cx = (mk.left + mk.right) / 2;
  const cy = (mk.top + mk.bottom) / 2;
  const PAY = 10;
  const SERBEST_PAY = 12;
  const KENAR = 8;

  const vp = {
    left: KENAR,
    right: Math.max(KENAR + 1, innerWidth - KENAR),
    top: KENAR,
    bottom: Math.max(KENAR + 1, innerHeight - KENAR),
  };
  const ustBar = { left: 0, right: innerWidth, top: 0, bottom: 64 };
  const mkGuvenli = { left: mk.left - 4, top: mk.top - 4, right: mk.right + 4, bottom: mk.bottom + 4 };
  const sonuc = [];
  const olculer = [];
  const ilkSola = balon.classList.contains("sola");
  const ilkAlta = balon.classList.contains("alta");
  const genislikler = ["", "13rem", "11rem"];

  for (let gi = 0; gi < genislikler.length; gi++) {
    const g = genislikler[gi];
    balon.style.maxWidth = g;
    const w = balon.offsetWidth;
    const h = balon.offsetHeight;
    olculer.push({ g, w, h, gi });
    for (const alta of [ilkAlta, !ilkAlta]) {
      for (const sola of [ilkSola, !ilkSola]) {
        const l = sola ? k.left + k.width / 2 + 0.12 * w - w : k.left + k.width / 2 - 0.12 * w;
        const t = alta ? k.bottom + PAY : k.top - PAY - h;
        const kutu = { l, t, r: l + w, b: t + h };
        const maskotCak = kesisim(kutu, mk);
        const disari = Math.max(0, w * h - kesisim(kutu, vp));
        const ustCak = kesisim(kutu, ustBar);
        const metinCak = onemli.reduce((n, r) => n + kesisim(kutu, r), 0);
        const gecerli = maskotCak === 0 && disari <= 0.5;
        const ceza = metinCak + ustCak * 3 + (gecerli ? 0 : 1e9 + (maskotCak + disari) * 1000);
        sonuc.push({ g, w, h, alta, sola, ceza, gecerli });
      }
    }
  }

  const en = sonuc.reduce((a, b) => (b.ceza < a.ceza - 1 ? b : a));
  if (en.gecerli && en.ceza <= 1) {
    balon.style.maxWidth = en.g;
    balon.classList.toggle("sola", en.sola);
    balon.classList.toggle("alta", en.alta);
    if (olcuKayit) {
      olcuKayit.w = en.w;
      olcuKayit.h = en.h;
    }
    return;
  }

  let secim = null;
  for (const { g, w, h, gi } of olculer) {
    const maxL = Math.max(vp.left, vp.right - w);
    const maxT = Math.max(vp.top, vp.bottom - h);
    const sinirL = (x) => Math.max(vp.left, Math.min(maxL, x));
    const sinirT = (y) => Math.max(vp.top, Math.min(maxT, y));

    const xs = [];
    const xEkle = (x) => {
      if (!xs.some((v) => Math.abs(v - x) < 2)) xs.push(x);
    };
    xEkle(sinirL(cx - w / 2));
    xEkle(sinirL(cx - 0.12 * w));
    xEkle(sinirL(cx + 0.12 * w - w));
    xEkle(vp.left);
    xEkle(maxL);

    const adaylar = [];
    const ustT = mk.top - SERBEST_PAY - h;
    if (ustT >= vp.top) {
      for (const l of xs) adaylar.push([l, ustT]);
    }
    const altT = mk.bottom + SERBEST_PAY;
    if (altT + h <= vp.bottom) {
      for (const l of xs) adaylar.push([l, altT]);
    }
    const solL = mk.left - SERBEST_PAY - w;
    if (solL >= vp.left) {
      for (const t of [sinirT(cy - h / 2), sinirT(mk.top), sinirT(mk.bottom - h)]) adaylar.push([solL, t]);
    }
    const sagL = mk.right + SERBEST_PAY;
    if (sagL + w <= vp.right) {
      for (const t of [sinirT(cy - h / 2), sinirT(mk.top), sinirT(mk.bottom - h)]) adaylar.push([sagL, t]);
    }
    const taramaX = [];
    for (const x of [sinirL(cx - w / 2), vp.left, maxL]) {
      if (!taramaX.some((v) => Math.abs(v - x) < 2)) taramaX.push(x);
    }
    for (const l of taramaX) {
      for (let t = vp.top; t <= maxT; t += 16) adaylar.push([l, t]);
    }

    for (const [l, t] of adaylar) {
      const kutu = { l, t, r: l + w, b: t + h };
      if (kesisim(kutu, mk) > 0) continue;
      if (Math.max(0, w * h - kesisim(kutu, vp)) > 0.5) continue;
      const guvenliCak = kesisim(kutu, mkGuvenli);
      const ustCak = kesisim(kutu, ustBar);
      const metinCak = onemli.reduce((n, r) => n + kesisim(kutu, r), 0);
      const ceza = metinCak + ustCak * 3 + guvenliCak * 50;
      const uzak = Math.hypot(l + w / 2 - cx, t + h / 2 - cy);
      if (
        !secim ||
        ceza < secim.ceza - 1 ||
        (ceza <= secim.ceza + 1 && (uzak < secim.uzak - 4 || (Math.abs(uzak - secim.uzak) <= 4 && gi < secim.gi)))
      ) {
        secim = { g, w, h, gi, l, t, ceza, uzak };
      }
    }
  }

  if (secim && (!en.gecerli || secim.ceza < en.ceza - 1)) {
    balon.style.maxWidth = secim.g;
    balon.classList.remove("sola", "alta");
    balon.classList.add("serbest");
    balon.style.setProperty("--tx", "0px");
    balon.style.left = `${(secim.l - k.left).toFixed(1)}px`;
    balon.style.right = "auto";
    balon.style.top = `${(secim.t - k.top).toFixed(1)}px`;
    balon.style.bottom = "auto";
    if (olcuKayit) {
      olcuKayit.w = secim.w;
      olcuKayit.h = secim.h;
    }
    return;
  }

  balon.style.maxWidth = en.g;
  balon.classList.toggle("sola", en.sola);
  balon.classList.toggle("alta", en.alta);
  if (olcuKayit) {
    olcuKayit.w = en.w;
    olcuKayit.h = en.h;
  }
}

export function konusmayiKur(maskot, yedekSozler) {
  const balon = document.createElement("span");
  balon.className = "maskot-balon";
  balon.setAttribute("role", "status");
  maskot.append(balon);
  maskot.tabIndex = 0;
  maskot.title ||= "Tıkla, bir şey söylesin";
  let sira = 0;
  let sus = 0;
  let tazele = 0;
  let bekleyenKacis = 0;
  let kacisZaman = 0;
  let sonKacis = 0;
  let otomatikZaman = 0;
  let otomatikGozcu = null;

  const sonOlcu = { w: 0, h: 0 };

  const kacisiPlanla = () => {
    if (!maskot.classList.contains("konusuyor") || !maskot.isConnected) return;

    if (balon.classList.contains("takip")) return;
    if (bekleyenKacis) return;
    const calistir = () => {
      bekleyenKacis = requestAnimationFrame(() => {
        bekleyenKacis = 0;
        sonKacis = performance.now();
        if (maskot.classList.contains("konusuyor") && !balon.classList.contains("takip")) {
          balonuKacir(maskot, balon, sonOlcu);
        }
      });
    };
    const kalan = 110 - (performance.now() - sonKacis);
    if (kalan > 0) {
      clearTimeout(kacisZaman);
      kacisZaman = setTimeout(calistir, kalan);
      return;
    }
    calistir();
  };

  addEventListener("scroll", kacisiPlanla, { passive: true });
  addEventListener("resize", kacisiPlanla, { passive: true });

  const sozler = () => {
    try {
      if (maskot.dataset.sozler) return JSON.parse(maskot.dataset.sozler);
    } catch (hata) {
      console.warn("maskot: data-sozler okunamadı", hata);
    }
    return yedekSozler();
  };

  const balonuKapat = () => {
    clearTimeout(sus);
    clearTimeout(tazele);
    clearTimeout(kacisZaman);
    if (bekleyenKacis) {
      cancelAnimationFrame(bekleyenKacis);
      bekleyenKacis = 0;
    }
    balon.classList.remove("takip");
    maskot.classList.remove("konusuyor");
  };

  const temizle = () => {
    clearTimeout(otomatikZaman);
    balonuKapat();
    sira = 0;
  };
  maskot._konusmaTemizle = temizle;
  maskot.sustur = temizle;
  maskot.balonuKapat = balonuKapat;

  maskot.balonuYerlestir = () => {
    if (!maskot.classList.contains("konusuyor") || !maskot.isConnected) return;
    balonuKacir(maskot, balon, sonOlcu);
  };

  maskot.balonuTakipEt = (x, y, b) => {
    if (!maskot.classList.contains("konusuyor") || !sonOlcu.w || !sonOlcu.h) return;
    const w = sonOlcu.w;
    const h = sonOlcu.h;
    const kenar = 8;
    const pay = 14;
    const maxL = Math.max(kenar, innerWidth - w - kenar);
    const maxT = Math.max(kenar, innerHeight - h - kenar);
    let l = Math.max(kenar, Math.min(maxL, x + b / 2 - w / 2));
    let t;
    if (y - pay - h >= 64) {
      t = y - pay - h;
    } else if (y + b + pay + h <= innerHeight - kenar) {
      t = y + b + pay;
    } else if (y - pay - h >= kenar) {
      t = y - pay - h;
    } else {
      const sagL = x + b + pay;
      const solL = x - pay - w;
      l = sagL + w <= innerWidth - kenar ? sagL : Math.max(kenar, solL);
      t = Math.max(kenar, Math.min(maxT, y + b / 2 - h / 2));
    }
    balon.classList.remove("sola", "alta");
    balon.classList.add("serbest", "takip");
    balon.style.setProperty("--tx", "0px");
    balon.style.left = `${(l - x).toFixed(1)}px`;
    balon.style.right = "auto";
    balon.style.top = `${(t - y).toFixed(1)}px`;
    balon.style.bottom = "auto";
  };

  const soyle = (metin) => {
    if (!metin) return;
    balon.textContent = metin;
    const k = maskot.getBoundingClientRect();
    balon.classList.toggle("sola", k.left + k.width / 2 > innerWidth * 0.55);
    balon.classList.toggle("alta", k.top < 165);
    balonuKacir(maskot, balon, sonOlcu);
    maskot.classList.add("konusuyor");
    clearTimeout(sus);
    sus = setTimeout(() => {
      balon.classList.remove("takip");
      maskot.classList.remove("konusuyor");
    }, 5600);
    clearTimeout(tazele);
    tazele = setTimeout(() => {
      if (maskot.classList.contains("konusuyor")) kacisiPlanla();
    }, 1500);
  };

  maskot.soyle = soyle;
  maskot.ilkSozuSoyle = () => {
    const liste = sozler();
    if (!liste?.length) return;
    sira = 1;
    soyle(liste[0]);
  };

  const konus = () => {
    const liste = sozler();
    if (!liste?.length) return;
    const i = sira % liste.length;
    sira++;
    soyle(liste[i]);
    maskot.dispatchEvent(new CustomEvent("konustu", { detail: { sira: i } }));
  };

  const tusaBas = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      konus();
    }
  };

  maskot.addEventListener("click", konus);
  maskot.addEventListener("keydown", tusaBas);

  if (maskot.hasAttribute("kendiliginden")) {
    otomatikGozcu = new IntersectionObserver(
      ([g]) => {
        if (!g.isIntersecting) return;
        otomatikGozcu.disconnect();
        otomatikZaman = setTimeout(() => {
          if (sira === 0 && !maskot.classList.contains("konusuyor")) konus();
        }, 1600);
      },
      { threshold: 0.6 },
    );
    otomatikGozcu.observe(maskot);
  }

  maskot._konusmaYokEt = () => {
    temizle();
    otomatikGozcu?.disconnect();
    removeEventListener("scroll", kacisiPlanla);
    removeEventListener("resize", kacisiPlanla);
    maskot.removeEventListener("click", konus);
    maskot.removeEventListener("keydown", tusaBas);
  };
}

if (!azHareket() && matchMedia("(hover: hover) and (pointer: fine)").matches) {
  let bekleyen = null;
  addEventListener(
    "pointermove",
    (e) => {
      if (bekleyen) return;
      bekleyen = requestAnimationFrame(() => {
        bekleyen = null;
        for (const m of document.querySelectorAll(".maskot")) {
          const k = m.getBoundingClientRect();
          if (k.bottom < 0 || k.top > innerHeight || !k.width) continue;
          const dx = e.clientX - (k.left + k.width / 2);
          const dy = e.clientY - (k.top + k.height / 2);
          const u = Math.hypot(dx, dy) || 1;
          const g = Math.min(1, u / 260) * 3;
          m.style.setProperty("--bak-x", ((dx / u) * g).toFixed(2));
          m.style.setProperty("--bak-y", ((dy / u) * g * 0.7).toFixed(2));
        }
      });
    },
    { passive: true },
  );
}

customElements.define("ais-maskot", AisMaskot);
