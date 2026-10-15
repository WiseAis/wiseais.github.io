/* ==========================================================================
   <ais-maskot faz="ais|aisen|aisenit" boyut="96" konus kendiliginden aksesuar="tac">
   Sitenin maskotu. Üç faz, üç sinyal düzeyi; üçü de piksel.
   Fazlar "drizzle" mantığıyla incelir: kare biriktikçe aynı yüz daha ince
   bir ızgarada yeniden kurulur.
     ais     · tek ham kare, 4 px ızgara. Gürültülü, meraklı, emin değil.
     aisen   · istiflenmiş yıldız, 2 px ızgara. Netleşmiş, biraz havalı.
     aisenit · son işlenmiş yıldız, 1 px ızgara. Sakin, sabırlı, keskin.
   Üç fazın yüz iskeleti ortaktır (YUZ): göz kutuları, sağ gözün biraz yukarıda
   oluşu, ağız ve sıcak pikselin yeri değişmez. Aynı merak, farklı kare sayısı.
   Öznitelikler:
     faz           hangi faz çizilecek (varsayılan: ais)
     boyut         piksel cinsinden genişlik (varsayılan: 96)
     konus         tıklanınca konuşma balonu açar; data-sozler ile söz listesi verilir
     kendiliginden ekrana ilk girişinde bir kez kendi konuşur
     aksesuar      "tac": küçük piksel bir taç (AIS.002 için)
   ========================================================================== */

import { tohumlu, azHareket } from "../lib/rastgele.js";
import { el } from "../lib/svg.js";

let sayac = 0;

/* Ortak yüz iskeleti: Ais'in ilk yüzü referanstır, diğer fazlar ona uyar */
const YUZ = {
  sol: { x: -13, y: -6, g: 6, y2: 8 }, // sol göz kutusu
  sag: { x: 5, y: -7, g: 6, y2: 9 }, // sağ göz: biraz büyük, bir birim yukarıda
  sicak: { x: 14, y: 6, g: 4 }, // sıcak piksel
  agiz: "M-6 10h4v2h4v-2h4", // basamaklı piksel gülümseme
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
    "Emin değilsem ABSTAIN derim. Sessizlik de bir ölçümdür.",
  ],
};

/* ---- Piksel çizim yardımcıları ------------------------------------------ */

// 4×4 Bayer matrisi: düz renk geçişleri yerine piksel-sanatı dither'ı
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bayer = (ix, iy) => BAYER[(iy & 3) * 4 + (ix & 3)];
const sinirla = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

function ditherSec(tonlar, v, ix, iy) {
  const t = sinirla(v) * (tonlar.length - 1);
  let i = Math.floor(t);
  if (t - i > bayer(ix, iy)) i++;
  return tonlar[Math.min(tonlar.length - 1, i)];
}

/* Izgarayı tarar; her hücre için renk (ya da null) ister.
   Aynı satırda yan yana aynı renkteki hücreleri tek dikdörtgende birleştirip
   renk başına tek bir <path> üretir: binlerce hücre, bir avuç eleman. */
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

/* Yüz: üç fazda aynı kutular, aynı parıltı, aynı ağız.
   yuvarlak: göz köşeleri bir birim kırpılır (incelen ızgaranın yumuşaması) */
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

/* ---- Faz 1 · Ais: 4 px ızgara, canlı gürültü ---------------------------- */
function cizAis(svg) {
  const g = el("g", { class: "m-govde m-ais" }, svg);
  const pikseller = el("g", { class: "m-pikseller" }, g);
  const rnd = tohumlu(7);
  const H = 4;
  const hucreler = [];
  for (let y = -32; y < 32; y += H) {
    for (let x = -32; x < 32; x += H) {
      const cx = x + H / 2;
      const cy = y + H / 2;
      // hafif yamuk bir daire: tam yuvarlak olmak için henüz erken
      const r = Math.hypot(cx * 1.04, (cy - 2) * 0.96);
      const sinir = 29 + (rnd() - 0.5) * 6;
      if (r > sinir) continue;
      const temel = 1 - Math.pow(r / 31, 2.2);
      const rect = el("rect", { x, y, width: H, height: H, "shape-rendering": "crispEdges" }, pikseller);
      hucreler.push({ rect, temel, kenar: r > sinir - 4 });
    }
  }
  const boya = () => {
    for (const h of hucreler) {
      const gurultu = (Math.random() - 0.5) * 0.5;
      const v = Math.max(0.12, Math.min(1, 0.42 + h.temel * 0.55 + gurultu));
      const ton = Math.round(110 + v * 130);
      h.rect.setAttribute("fill", `rgb(${ton},${ton - 2},${ton - 6})`);
      h.rect.setAttribute("opacity", h.kenar && Math.random() < 0.35 ? 0.25 : 1);
    }
  };
  boya();

  const yuz = el("g", { class: "m-yuz" }, g);
  yuzCiz(yuz);
  sicakPiksel(yuz);
  return { boya };
}

/* Perçem: tepedeki çivinin kendine yaptığı kıvrım; Aisen ve Aisenit'te aynı */
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

/* ---- Faz 2 · Aisen: 2 px ızgara, istiflenmiş yıldız --------------------- */
const AISEN_TON = ["#c97f4a", "#eea566", "#ffc98a", "#ffe0b4", "#fff1da", "#fffbf3"];

function cizAisen(svg) {
  const g = el("g", { class: "m-govde m-aisen" }, svg);
  const R = 27;

  // Hale: gövdenin çevresinde seyrekleşen sıcak pikseller
  rasterCiz(el("g", { class: "m-hale" }, g), 2, (x, y, ix, iy) => {
    const r = Math.hypot(x, y);
    if (r <= R || r > 38) return null;
    return bayer(ix, iy) < (1 - (r - R) / 11) * 0.42 ? "#ffe2b866" : null;
  });

  // Diyafram çivileri: eksenler boyunca incelen piksel çizgiler
  rasterCiz(el("g", { class: "m-civiler" }, g), 2, (x, y, ix, iy) => {
    const yatay = y > -2 && y < 0;
    const dikey = x > -2 && x < 0;
    if (!yatay && !dikey) return null;
    const d = yatay ? Math.abs(x) : Math.abs(y);
    if (d <= R || d > 56) return null;
    return bayer(ix, iy) < 1 - (d - R) / 29 ? "#fff4e2" : null;
  });

  // Perçem: çivinin kendine yaptığı kıvrım
  const percem = percemNoktalari();
  rasterCiz(el("g", { class: "m-percem" }, g), 2, (x, y) => (percem.some(([px, py]) => Math.abs(px - x) < 1.2 && Math.abs(py - y) < 1.2) ? "#fff4e2" : null));

  // Gövde: yukarı-soldan ışık alan, dither'lı yıldız
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

  // Çevresinde istiflenmeyi bekleyen küçük yıldızlar
  const kivilcim = el("g", { class: "m-kivilcim" }, g);
  for (const [x, y] of [[-40, -28], [36, -36], [40, 22], [-36, 32]]) {
    el("rect", { x, y, width: 2, height: 2, fill: "#fff4e2", "shape-rendering": "crispEdges" }, kivilcim);
  }
  return {};
}

/* ---- Faz 3 · Aisenit: 1 px ızgara, son işlenmiş yıldız ------------------
   Aisen'in devamı: aynı yuvarlak gövde, aynı perçem, aynı sıcak tonlar.
   Fark kare sayısında: ızgara 1 px, ton geçişleri yumuşak, çiviler ince ve
   uzun, köşegenlerde ikincil kırınım. Yanında ayrılmış iki ışık: Hα ve [O III]. */
const AISENIT_TON = ["#b9683a", "#d9864f", "#f0a565", "#ffc387", "#ffdcb0", "#ffeed6", "#fff8ec", "#fffdf8"];

function cizAisenit(svg) {
  const g = el("g", { class: "m-govde m-aisenit" }, svg);
  const R = 29;

  // Hale: Aisen'inkinin ince ızgaralı hâli; dış kenarı ayrılmış ışıkla renklenir,
  // sol altta Hα, sağ üstte [O III]
  rasterCiz(el("g", { class: "m-hale" }, g), 1, (x, y, ix, iy) => {
    const r = Math.hypot(x, y);
    if (r <= R || r > 44) return null;
    if (bayer(ix, iy) >= (1 - (r - R) / 15) * 0.4) return null;
    if (r < R + 5) return "#ffe2b866";
    const yon = (x - y) / r; // +1 sağ üst, -1 sol alt
    if (yon < -0.55) return "#ff7a8a59";
    if (yon > 0.55) return "#6fe3d659";
    return "#ffe2b84d";
  });

  // Kırınım çivileri: dört ana çivi bir piksel inceliğinde, köşegenlerde kısa ikinciler
  rasterCiz(el("g", { class: "m-civiler" }, g), 1, (x, y, ix, iy) => {
    const ana = Math.abs(y) < 1 || Math.abs(x) < 1;
    const kose = Math.abs(Math.abs(x) - Math.abs(y)) < 1;
    if (!ana && !kose) return null;
    const d = ana ? Math.max(Math.abs(x), Math.abs(y)) : Math.hypot(x, y);
    const boy = ana ? 30 : 14;
    if (d <= R || d > R + boy) return null;
    return bayer(ix, iy) < 1 - (d - R) / boy ? (ana ? "#fff4e2" : "#ffe2b8") : null;
  });

  // Perçem: Aisen'deki kıvrımın aynısı, daha ince çizgiyle
  const percem = percemNoktalari();
  rasterCiz(el("g", { class: "m-percem" }, g), 1, (x, y) => (percem.some(([px, py]) => Math.abs(px - x) < 1 && Math.abs(py - y) < 1) ? "#fff4e2" : null));

  // Gövde: Aisen'in ışığı, daha çok tonla ve daha ince dither'la
  rasterCiz(g, 1, (x, y, ix, iy) => {
    const r = Math.hypot(x, y);
    if (r > R) return null;
    if (allik(x, y)) return "#ff9aa6";
    const isik = 1 - Math.pow(r / R, 1.8);
    const yon = ((-x * 0.6 - y * 0.8) / R) * 0.28;
    return ditherSec(AISENIT_TON, isik * 0.84 + 0.1 + yon, ix, iy);
  });
  // Sol üstte ışık lekesi: netleşen yüzeyin parıltısı
  el("path", { d: "M-17 -14h3v1h1v3h-1v1h-3v-1h-1v-3h1z", fill: "#ffffff", opacity: 0.85, "shape-rendering": "crispEdges" }, g);

  const yuz = el("g", { class: "m-yuz" }, g);
  yuzCiz(yuz, { yuvarlak: true, ikinciParilti: true });
  sicakPiksel(yuz);

  // Ayrılmış ışıklar: Hα kırmızısı ve [O III] turkuazı, istiflenmeyi bitirmiş kıvılcımlar
  const kivilcim = el("g", { class: "m-kivilcim" }, g);
  for (const [x, y, fill] of [[-42, -26, "#ff7a8a"], [38, -34, "#fff4e2"], [41, 24, "#6fe3d6"], [-37, 33, "#fff4e2"]]) {
    el("path", { d: `M${x} ${y - 1}h1v1h1v1h-1v1h-1v-1h-1v-1h1z`, fill, "shape-rendering": "crispEdges" }, kivilcim);
  }

  // Piksel parıltı
  el("path", { d: "M36 -45h1v9h-1z M32 -41h9v1h-9z", fill: "#fff4e2", class: "m-parilti", "shape-rendering": "crispEdges" }, g);
  return {};
}

/* Piksel taç: AIS.002'de çiviye takılmış, biraz yamuk */
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
  static observedAttributes = ["faz"];

  connectedCallback() {
    if (this._hazir) return;
    this._hazir = true;
    this.classList.add("maskot");
    this.setAttribute("role", "img");
    this._ciz();
    if (this.hasAttribute("konus")) this._konusmayiKur();
    this._dongu();
  }

  disconnectedCallback() {
    cancelAnimationFrame(this._raf);
    clearInterval(this._gurultu);
    this._hazir = false;
  }

  attributeChangedCallback(ad, eski, yeni) {
    if (this._hazir && eski !== yeni) this._ciz();
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

    this.querySelector(":scope > svg")?.remove();
    const svg = el("svg", { viewBox: "-60 -60 120 120", width: boyut, height: boyut, "aria-hidden": "true" });
    this.prepend(svg);
    this._cizim = CIZIMLER[this.faz](svg, id);
    if (this.getAttribute("aksesuar") === "tac") tacCiz(svg, this.faz);

    clearInterval(this._gurultu);
    if (this._cizim.boya && !azHareket()) {
      this._gurultu = setInterval(() => this._cizim.boya(), 260);
    }
  }

  _dongu() {
    if (azHareket()) return;
    let son = performance.now();
    const tik = (t) => {
      this._cizim?.adim?.(t - son);
      son = t;
      this._raf = requestAnimationFrame(tik);
    };
    this._raf = requestAnimationFrame(tik);
  }

  _konusmayiKur() {
    const balon = document.createElement("span");
    balon.className = "maskot-balon";
    balon.setAttribute("role", "status");
    this.append(balon);
    this.tabIndex = 0;
    this.title = "Tıkla, bir şey söylesin";
    let sira = 0;
    // Bozuk bir söz listesi maskotu susturmasın: fazın kendi sözlerine düş
    let liste = SOZLER[this.faz];
    try {
      if (this.dataset.sozler) liste = JSON.parse(this.dataset.sozler);
    } catch (hata) {
      console.warn("ais-maskot: data-sozler okunamadı", hata);
    }
    const konus = () => {
      balon.textContent = liste[sira % liste.length];
      sira++;
      // Balon ekranın dışına taşmasın: maskotun konumuna göre yön seç
      const k = this.getBoundingClientRect();
      balon.classList.toggle("sola", k.left + k.width / 2 > innerWidth * 0.55);
      balon.classList.toggle("alta", k.top < 150);
      this.classList.add("konusuyor");
      clearTimeout(this._sus);
      this._sus = setTimeout(() => this.classList.remove("konusuyor"), 5600);
    };
    this.addEventListener("click", konus);
    this.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        konus();
      }
    });

    // Sayfadaki ana maskot, ilk görünüşünde bir kez kendiliğinden konuşur
    if (this.hasAttribute("kendiliginden")) {
      const gozcu = new IntersectionObserver(([g]) => {
        if (!g.isIntersecting) return;
        gozcu.disconnect();
        setTimeout(konus, 1600);
      }, { threshold: 0.6 });
      gozcu.observe(this);
    }
  }
}

customElements.define("ais-maskot", AisMaskot);
