import { tohumlu, azHareket } from "../lib/rastgele.js?v=20261127a";

const KOK_IMG = "/assets/img/krallik/";
const GALERI_IMG = "/assets/img/krallik/galeri/";
const SIZES_KARE = "(max-width: 900px) 96vw, 44rem";
const IKI_PI = Math.PI * 2;
const SICAK = "#ffd29a";
const TOZ = "#e0a26a";
const SOGUK = "#8aa2ff";
const KAR_RENK = "#e6efff";

const sinirla = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ara = (a, b, k) => a + (b - a) * k;
const yumusak = (x) => {
  const k = sinirla(x);
  return k * k * (3 - 2 * k);
};
const virgul = (v, b = 1) => v.toFixed(b).replace(".", ",");

export const ODUN_TABAN = 3;
export const VERIM_US = 0.8;

export function gorevHesapla(a, b = 4 - a) {
  const n1 = Math.max(0, Math.min(4, Math.round(a)));
  const n2 = Math.max(0, Math.min(4 - n1, Math.round(b)));
  const ciktiA = n1 > 0 ? ODUN_TABAN * Math.pow(n1, VERIM_US) : 0;
  const ciktiB = n2 > 0 ? ODUN_TABAN * Math.pow(n2, VERIM_US) : 0;
  const toplam = ciktiA + ciktiB;

  const temsili = n1 > 0 && n2 > 0 && n1 !== n2;
  const enVerimli = n1 === 2 && n2 === 2;
  return {
    a: n1,
    b: n2,
    ciktiA,
    ciktiB,
    toplam,
    metin: virgul(toplam, 1),
    temsili,
    enVerimli,
  };
}

export const KIS_SABIT = {
  ilkKisGun: 11,
  kisSure: 6,
  evKapasite: 4,
  catiAltiOdun: 0.5,
  aciktaOdun: 4.5,
  onarimTas: 10,
  onarimOdun: 6,
  temsiliKisi: 10,
  temsiliStok: 60,
};

export function kisOdunHesapla(onarilanEv, { kisi = KIS_SABIT.temsiliKisi, stok = KIS_SABIT.temsiliStok } = {}) {
  const ev = Math.max(0, Math.min(2, Math.round(onarilanEv)));
  const catiAlti = Math.min(kisi, ev * KIS_SABIT.evKapasite);
  const acikta = Math.max(0, kisi - catiAlti);
  const gunlukOdun = catiAlti * KIS_SABIT.catiAltiOdun + acikta * KIS_SABIT.aciktaOdun;
  const yeterGun = gunlukOdun > 0 ? stok / gunlukOdun : Infinity;
  return {
    ev,
    kisi,
    stok,
    catiAlti,
    acikta,
    gunlukOdun,
    gunlukMetin: virgul(gunlukOdun, 1),
    yeterGun,
    yeterMetin: Number.isFinite(yeterGun) ? virgul(yeterGun, 1) : "∞",
    kritik: yeterGun < 2.0,
  };
}

export const LIDER_KARTLAR = {
  hazel: {
    id: "hazel",
    ad: "Mother Hazel",
    topluluk: "Oduncular",
    kick: "Tanışma",
    baslik: "Ormanın Kıyısı",
    secenek: ["Kıyıdan kes, yerine fidan dik", "İç ormandan kes, odun bol olsun"],
    sonuc: "kıyıdaki kütüklerin yanına fidan dikiliyor",
  },
  tobin: {
    id: "tobin",
    ad: "Goodman Tobin",
    topluluk: "Çiftçiler",
    kick: "Tanışma",
    baslik: "Tarla Nereye?",
    secenek: ["Yamaçta aç", "Nehir kıyısında aç"],
    sonuc: "yamaçta tarla açılıyor",
  },
  dunstan: {
    id: "dunstan",
    ad: "Master Dunstan",
    topluluk: "Taşçılar",
    kick: "Tanışma",
    baslik: "Önce Hangi Duvar?",
    secenek: ["Kapı kulesi", "Ana salonun çatısı"],
    sonuc: "kapı kulesi yükseliyor",
  },
  hazel2: {
    id: "hazel2",
    ad: "Mother Hazel",
    topluluk: "Oduncular",
    kick: "Dilekçe",
    baslik: "Sönen Ocak",
    secenek: ["İki eve ocak yaptır, söz ver", "Avluda ortak bir ocak yak"],
    sonuc: "söz verildi · iki eve ocak taşı ayrılıyor",
    dogmus: true,
  },
};

export function hazelAtifOlustur(ilkSecimIndeks = 0) {
  const indeks = ilkSecimIndeks === 1 ? 1 : 0;
  const cumle = LIDER_KARTLAR.hazel.secenek[indeks];
  return ["Hazel'la ilk tanıştığınızda", `“${cumle}” demiştin.`];
}

export function kartSonucMetni(kart, secimIndeks) {
  if (!kart) return "";
  return secimIndeks === 0 ? kart.sonuc : kart.secenek[1] || kart.sonuc;
}

export const TAC_EVRELER = [
  {
    indeks: 0,
    faz: "ais",
    ad: "FENER",
    unvan: "Warden",
    sart: "ilk kıştan önce",
    durum: "UNVAN: WARDEN · AIS FENERDE DİNLENİYOR",
    tac: false,
    lamba: false,
  },
  {
    indeks: 1,
    faz: "aisen",
    ad: "AISEN",
    unvan: "Lord Protector",
    sart: "tanınma 50 · kale 3 · ham Aisenit 3",
    durum: "UNVAN: LORD PROTECTOR",
    tac: false,
    lamba: false,
  },
  {
    indeks: 2,
    faz: "aisenit",
    ad: "AISENIT",
    unvan: "King · Taç",
    sart: "tanınma 85 · kale 5 · Ais Aisen evresinde",
    durum: "TAÇ TÖRENİ · “MY PRINCE” → “MY KING”",
    tac: true,
    lamba: true,
  },
];

const mevsimDurum = {
  atesGorunur: false,
  atesYandi: false,
  kisGorunur: false,
};

function mevsimSenkron() {
  if (typeof document === "undefined" || !document.body) return;

  if (mevsimDurum.kisGorunur || (mevsimDurum.atesGorunur && !mevsimDurum.atesYandi)) {
    document.body.dataset.krallikMevsim = "kis";
  } else {
    delete document.body.dataset.krallikMevsim;
  }
}

function kareSahneKur(kok, {
  gorsel,
  gorsel2 = null,
  alt,
  mevsim = "sicak",
  bolumId = null,
  onGorunur = null,
  onDarbe = null,
  onBoyut = null,
}) {
  const az = azHareket();
  const sarmal = document.createElement("div");
  sarmal.className = "krl-sahne";
  sarmal.dataset.mevsim = mevsim;

  const ust = document.createElement("div");
  ust.className = "krl-ust veri";

  const cerceve = document.createElement("div");
  cerceve.className = "krl-cerceve";

  const goruntu = document.createElement("div");
  goruntu.className = "krl-goruntu";

  const foto1 = document.createElement("img");
  foto1.className = "krl-foto etkin";
  foto1.src = gorsel.src;
  foto1.srcset = gorsel.srcset;
  foto1.sizes = SIZES_KARE;
  foto1.width = gorsel.w || 1600;
  foto1.height = gorsel.h || 1000;
  foto1.alt = alt;
  foto1.decoding = "async";
  foto1.draggable = false;
  goruntu.append(foto1);

  let foto2 = null;
  if (gorsel2) {
    foto2 = document.createElement("img");
    foto2.className = "krl-foto krl-foto-ikinci";
    foto2.src = gorsel2.src;
    foto2.srcset = gorsel2.srcset;
    foto2.sizes = SIZES_KARE;
    foto2.width = gorsel2.w || 1600;
    foto2.height = gorsel2.h || 1000;
    foto2.alt = "";
    foto2.setAttribute("aria-hidden", "true");
    foto2.decoding = "async";
    foto2.draggable = false;
    goruntu.append(foto2);
  }

  const ton = document.createElement("span");
  ton.className = "krl-ton";
  ton.setAttribute("aria-hidden", "true");

  const isik = document.createElement("span");
  isik.className = "krl-isik";
  isik.setAttribute("aria-hidden", "true");

  const tuval = document.createElement("canvas");
  tuval.className = "krl-tuval";
  tuval.setAttribute("aria-hidden", "true");
  const ctx = tuval.getContext("2d");

  goruntu.append(ton, isik, tuval);

  const katman = document.createElement("div");
  katman.className = "krl-katman";

  cerceve.append(goruntu, katman);

  const altHud = document.createElement("div");
  altHud.className = "krl-alt veri";

  sarmal.append(ust, cerceve, altHud);
  kok.textContent = "";
  kok.append(sarmal);

  let g = 640;
  let y = 400;
  let kutu = null;
  let isikRaf = null;
  let bekleyen = null;
  let darbeZaman = null;
  let nefesYapildi = false;
  let nefesZaman = null;
  let gorunur = false;
  const dalgalar = [];
  const darbeKivilcim = [];
  const rng = tohumlu(271126 + (bolumId ? bolumId.length * 97 : 13));

  const boyutlandir = () => {
    const cg = Math.max(1, Math.round(cerceve.clientWidth));
    const cy = Math.max(1, Math.round(cerceve.clientHeight));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const tg = Math.round(cg * dpr);
    const ty = Math.round(cy * dpr);
    if (tuval.width !== tg || tuval.height !== ty) {
      tuval.width = tg;
      tuval.height = ty;
    }
    g = cg;
    y = cy;
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    kutu = null;
    onBoyut?.(g, y);
  };
  boyutlandir();

  let boyutZaman = null;
  const boyutPlanla = () => {
    if (boyutZaman) return;
    boyutZaman = setTimeout(() => {
      boyutZaman = null;
      boyutlandir();
    }, 140);
  };

  let boyutGozcu = null;
  if (typeof ResizeObserver === "function") {
    boyutGozcu = new ResizeObserver(boyutPlanla);
    boyutGozcu.observe(cerceve);
  } else {
    window.addEventListener("resize", boyutPlanla, { passive: true });
  }

  const kutuSifirla = () => {
    kutu = null;
  };
  window.addEventListener("scroll", kutuSifirla, { passive: true });

  const isikKonumla = (cx, cy) => {
    bekleyen = { cx, cy };
    if (isikRaf) return;
    isikRaf = requestAnimationFrame(() => {
      isikRaf = null;
      if (!bekleyen) return;
      if (!kutu) kutu = cerceve.getBoundingClientRect();
      if (!kutu.width || !kutu.height) return;
      const nx = sinirla((bekleyen.cx - kutu.left) / kutu.width, 0, 1);
      const ny = sinirla((bekleyen.cy - kutu.top) / kutu.height, 0, 1);
      sarmal.style.setProperty("--fx", `${(nx * 100).toFixed(2)}%`);
      sarmal.style.setProperty("--fy", `${(ny * 100).toFixed(2)}%`);
      if (!az) {
        sarmal.style.setProperty("--egim-y", `${((nx - 0.5) * 4.4).toFixed(2)}deg`);
        sarmal.style.setProperty("--egim-x", `${((0.5 - ny) * 3.4).toFixed(2)}deg`);
      }
    });
  };

  const onEnter = (e) => {
    if (e.pointerType === "touch") return;
    kutu = cerceve.getBoundingClientRect();
    sarmal.classList.add("isik-aktif");
    isikKonumla(e.clientX, e.clientY);
  };
  const onMove = (e) => {
    if (e.pointerType === "touch") return;
    isikKonumla(e.clientX, e.clientY);
  };
  const onLeave = () => {
    sarmal.classList.remove("isik-aktif");
    sarmal.style.setProperty("--egim-x", "0deg");
    sarmal.style.setProperty("--egim-y", "0deg");
    kutu = null;
  };
  cerceve.addEventListener("pointerenter", onEnter);
  cerceve.addEventListener("pointermove", onMove);
  cerceve.addEventListener("pointerleave", onLeave);

  const izlenen = (bolumId && document.getElementById(bolumId)) || kok.closest("section") || kok;
  let gorunurlukGozcu = null;
  if (typeof IntersectionObserver === "function") {
    gorunurlukGozcu = new IntersectionObserver(
      (girdiler) => {
        const girdi = girdiler[0];
        if (!girdi) return;
        const simdiGorunur = girdi.isIntersecting && girdi.intersectionRatio >= 0.25;
        if (simdiGorunur !== gorunur) {
          gorunur = simdiGorunur;
          onGorunur?.(gorunur);
          if (gorunur && !nefesYapildi && !az && !sarmal.classList.contains("etkilesildi")) {
            nefesYapildi = true;
            sarmal.classList.add("krl-nefes");
            nefesZaman = setTimeout(() => sarmal.classList.remove("krl-nefes"), 1450);
          }
        }
      },
      { threshold: [0, 0.25, 0.5] },
    );
    gorunurlukGozcu.observe(izlenen);
  }

  const darbe = (x, yNokta, nx = 0, ny = 0) => {
    const r = cerceve.getBoundingClientRect();
    const lx = r.width > 0 ? sinirla(x - r.left, 0, r.width) * (g / r.width) : g * 0.5;
    const ly = r.height > 0 ? sinirla(yNokta - r.top, 0, r.height) * (y / r.height) : y * 0.5;

    sarmal.classList.add("darbe-parla");
    clearTimeout(darbeZaman);
    darbeZaman = setTimeout(() => sarmal.classList.remove("darbe-parla"), 380);

    if (!az) {
      const kisMod = sarmal.dataset.mevsim === "kis";
      dalgalar.push({
        x: lx,
        y: ly,
        omur: 0,
        sure: 0.65,
        maksR: Math.min(g, y) * 0.34,
        renk: kisMod ? SOGUK : SICAK,
      });
      for (let i = 0; i < 10; i++) {
        const aci = Math.atan2(ny || 0, nx || 0) + (rng() - 0.5) * 2.4;
        const hiz = 38 + rng() * 88;
        darbeKivilcim.push({
          x: lx,
          y: ly,
          vx: Math.cos(aci) * hiz,
          vy: Math.sin(aci) * hiz - (kisMod ? 6 : 24),
          r: 1.1 + rng() * 1.6,
          omur: 0,
          sure: 0.42 + rng() * 0.36,
          renk: kisMod ? KAR_RENK : i % 2 ? SICAK : TOZ,
        });
      }
    }
    onDarbe?.(lx, ly, nx, ny);
  };

  const darbeCiz = (dt) => {
    if (!ctx || (!dalgalar.length && !darbeKivilcim.length)) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = dalgalar.length - 1; i >= 0; i--) {
      const d = dalgalar[i];
      d.omur += dt;
      if (d.omur >= d.sure) {
        dalgalar.splice(i, 1);
        continue;
      }
      const p = yumusak(d.omur / d.sure);
      const r = 10 + d.maksR * p;
      ctx.strokeStyle = d.renk;
      ctx.lineWidth = 2.2 * (1 - p) + 0.5;
      ctx.globalAlpha = (1 - p) * 0.65;
      ctx.beginPath();
      ctx.arc(d.x, d.y, r, 0, IKI_PI);
      ctx.stroke();
    }
    for (let i = darbeKivilcim.length - 1; i >= 0; i--) {
      const k = darbeKivilcim[i];
      k.omur += dt;
      if (k.omur >= k.sure) {
        darbeKivilcim.splice(i, 1);
        continue;
      }
      k.x += k.vx * dt;
      k.y += k.vy * dt;
      k.vx *= 0.94;
      k.vy *= 0.96;
      const oran = 1 - k.omur / k.sure;
      ctx.globalAlpha = oran * 0.92;
      ctx.fillStyle = k.renk;
      ctx.beginPath();
      ctx.arc(k.x, k.y, k.r * (0.4 + oran * 0.6), 0, IKI_PI);
      ctx.fill();
    }
    ctx.restore();
  };

  const etkilesimIsaretle = () => {
    sarmal.classList.add("etkilesildi");
    sarmal.classList.remove("krl-nefes");
  };

  const yokEt = () => {
    clearTimeout(boyutZaman);
    clearTimeout(darbeZaman);
    clearTimeout(nefesZaman);
    if (isikRaf) cancelAnimationFrame(isikRaf);
    cerceve.removeEventListener("pointerenter", onEnter);
    cerceve.removeEventListener("pointermove", onMove);
    cerceve.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("scroll", kutuSifirla);
    window.removeEventListener("resize", boyutPlanla);
    boyutGozcu?.disconnect();
    gorunurlukGozcu?.disconnect();
  };

  return {
    sarmal,
    ust,
    cerceve,
    goruntu,
    foto1,
    foto2,
    ton,
    tuval,
    ctx,
    katman,
    altHud,
    az,
    boyut: () => ({ g, y }),
    kutuAl: () => (kutu || (kutu = cerceve.getBoundingClientRect())),
    etkilesimIsaretle,
    darbe,
    darbeCiz,
    yokEt,
  };
}

function isikNoktasiCiz(ctx, x, y, r, renk = SICAK, opaklik = 1) {
  if (opaklik <= 0.01) return;
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 3.4);
  grad.addColorStop(0, renk);
  grad.addColorStop(0.35, renk);
  grad.addColorStop(1, "rgba(224, 162, 106, 0)");
  ctx.globalAlpha = opaklik * 0.72;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r * 3.4, 0, IKI_PI);
  ctx.fill();

  ctx.globalAlpha = opaklik;
  ctx.fillStyle = "#fff8eb";
  ctx.beginPath();
  ctx.arc(x, y, r * 0.78, 0, IKI_PI);
  ctx.fill();
}

function ates(kok) {
  const OCAK_X = 0.515;
  const OCAK_Y = 0.43;
  const DOLUM_SN = 1.2;
  const az = azHareket();

  let yandi = az;
  let dolum = az ? 1 : 0;
  let basili = false;
  let yanisAn = az ? -10 : -1;
  let sonT = 0;
  let uyariZaman = null;
  let ciz = null;

  mevsimDurum.atesYandi = yandi;

  const sahne = kareSahneKur(kok, {
    gorsel: {
      src: `${KOK_IMG}gercek-01-2000.jpg`,
      srcset: `${KOK_IMG}gercek-01-1000.jpg 1000w, ${KOK_IMG}gercek-01-2000.jpg 2000w`,
      w: 2000,
      h: 1250,
    },
    alt: "Gece, ormanla çevrili tepede dört kuleli taş kale ve avlunun ortasında ocak.",
    mevsim: yandi ? "sicak" : "kis",
    bolumId: "ates",
    onGorunur(g) {
      mevsimDurum.atesGorunur = g;
      mevsimSenkron();
    },
    onBoyut() {
      ciz?.(sonT, 0);
    },
  });

  const hedefEl = document.createElement("span");
  hedefEl.className = "krl-hedef";
  const saatEl = document.createElement("span");
  saatEl.className = "krl-saat";
  sahne.ust.append(hedefEl, saatEl);

  const durumEl = document.createElement("span");
  durumEl.className = "krl-durum";
  const ipucuEl = document.createElement("span");
  ipucuEl.className = "krl-ipucu";
  sahne.altHud.append(durumEl, ipucuEl);

  const sonukPerde = document.createElement("span");
  sonukPerde.className = "krl-ates-sonuk";
  sonukPerde.setAttribute("aria-hidden", "true");
  sahne.goruntu.insertBefore(sonukPerde, sahne.tuval);

  const sozEl = document.createElement("p");
  sozEl.className = "krl-ates-soz veri";
  sozEl.textContent = "“Işığınızı tepe yolundan gördük.”";
  sahne.katman.append(sozEl);

  const ocakBtn = document.createElement("button");
  ocakBtn.type = "button";
  ocakBtn.className = "krl-ocak-hedef";
  ocakBtn.style.left = `${OCAK_X * 100}%`;
  ocakBtn.style.top = `${OCAK_Y * 100}%`;
  ocakBtn.setAttribute("aria-label", "Yıkık ocağa basılı tut ve ateşi yak");

  const CEVRE = 2 * Math.PI * 24;
  ocakBtn.innerHTML = `
    <svg class="krl-ocak-halka" viewBox="0 0 56 56" aria-hidden="true">
      <circle class="krl-halka-iz" cx="28" cy="28" r="24"></circle>
      <circle class="krl-halka-dolum" cx="28" cy="28" r="24" stroke-dasharray="${CEVRE.toFixed(2)}" stroke-dashoffset="${CEVRE.toFixed(2)}"></circle>
    </svg>
    <span class="krl-ocak-cekirdek" aria-hidden="true"></span>
    <span class="krl-etiket-pul veri">YIKIK OCAK</span>`;
  sahne.katman.append(ocakBtn);

  const dolumCember = ocakBtn.querySelector(".krl-halka-dolum");
  const ocakPul = ocakBtn.querySelector(".krl-etiket-pul");

  const rng = tohumlu(20261);
  const sisler = Array.from({ length: 10 }, (_, i) => ({
    x: 0.08 + (i / 9) * 0.84 + (rng() - 0.5) * 0.06,
    y: 0.28 + rng() * 0.44,
    rx: 0.14 + rng() * 0.12,
    ry: 0.05 + rng() * 0.04,
    faz: rng() * IKI_PI,
  }));

  const kivilcimlar = Array.from({ length: 24 }, () => ({
    x: 0,
    y: 0,
    vx: (rng() - 0.5) * 26,
    vy: -(18 + rng() * 44),
    omur: rng(),
    sure: 0.7 + rng() * 0.9,
    r: 0.9 + rng() * 1.5,
  }));

  const GELENLER = [
    { bas: [0.08, 0.70], ara: [0.24, 0.58], son: [0.43, 0.50], gecikme: 0.25 },
    { bas: [0.42, 0.90], ara: [0.46, 0.72], son: [0.51, 0.53], gecikme: 0.55 },
    { bas: [0.89, 0.41], ara: [0.76, 0.46], son: [0.64, 0.48], gecikme: 0.85 },
    { bas: [0.86, 0.18], ara: [0.73, 0.29], son: [0.60, 0.39], gecikme: 1.15 },
    { bas: [0.12, 0.44], ara: [0.25, 0.45], son: [0.39, 0.45], gecikme: 1.45 },
    { bas: [0.68, 0.88], ara: [0.61, 0.69], son: [0.56, 0.54], gecikme: 1.75 },
  ];

  const kivilcimSifirla = (k, g, y) => {
    k.x = g * OCAK_X + (rng() - 0.5) * 14;
    k.y = y * OCAK_Y + (rng() - 0.5) * 8;
    k.vx = (rng() - 0.5) * 24;
    k.vy = -(22 + rng() * 46);
    k.omur = 0;
    k.sure = 0.65 + rng() * 0.95;
  };

  const durumuYansit = (t) => {
    const gecen = yandi ? (az ? 10 : Math.max(0, t - yanisAn)) : 0;
    const sabah = yandi ? (az ? 1 : yumusak((gecen - 2.6) / 1.4)) : 0;

    sahne.sarmal.dataset.mevsim = yandi ? "sicak" : "kis";
    sahne.sarmal.classList.toggle("ates-yandi", yandi);
    sahne.sarmal.classList.toggle("ates-sabah", sabah > 0.55);
    sahne.sarmal.classList.toggle("ates-basili", basili && !yandi);
    sahne.sarmal.style.setProperty("--ates-dolum", dolum.toFixed(3));
    sahne.sarmal.style.setProperty("--ates-sabah", sabah.toFixed(3));
    dolumCember.style.strokeDashoffset = (CEVRE * (1 - dolum)).toFixed(2);

    if (!yandi) {
      hedefEl.textContent = "HEDEF · GECE GELMEDEN ATEŞ YAK";
      hedefEl.classList.remove("vurgulu");
      saatEl.textContent = "YAZ 3 · AKŞAMÜSTÜ";
      ocakPul.textContent = basili ? "TUTUŞUYOR..." : "YIKIK OCAK";
      ocakBtn.setAttribute("aria-label", "Yıkık ocağa basılı tut ve ateşi yak");
      durumEl.textContent = basili ? "kıvılcım tutuyor · bırakma" : "akşamüstü · soğuk mavi sis";
      if (!uyariZaman) ipucuEl.textContent = "OCAĞA BASILI TUT";
    } else if (sabah < 0.7) {
      hedefEl.textContent = "HEDEF · GECE GELMEDEN ATEŞ YAK ✓";
      hedefEl.classList.add("vurgulu");
      saatEl.textContent = "YAZ 3 · GECE";
      ocakPul.textContent = "OCAK YANIYOR";
      ocakBtn.setAttribute("aria-label", "Ocağı söndür ve yeniden dene");
      durumEl.textContent = gecen < 1.2 ? "ateş tuttu · sis geri çekiliyor" : "ışığı görenler tepeye tırmanıyor";
      ipucuEl.textContent = "SÖNDÜRMEK İÇİN OCAĞA DOKUN";
    } else {
      hedefEl.textContent = "HEDEF · KIŞ GELMEDEN HAZIRLAN";
      hedefEl.classList.add("vurgulu");
      saatEl.textContent = "YAZ 4 · SABAH";
      ocakPul.textContent = "OCAK YANIYOR";
      ocakBtn.setAttribute("aria-label", "Ocağı söndür ve yeniden dene");
      durumEl.textContent = "sabah · hedef değişti";
      ipucuEl.textContent = "SÖNDÜRMEK İÇİN OCAĞA DOKUN";
    }

    const sozGorunur = yandi && (az || (gecen > 1.7 && gecen < 5.2));
    sozEl.classList.toggle("gorunur", sozGorunur);
  };

  const yak = (t) => {
    yandi = true;
    basili = false;
    dolum = 1;
    yanisAn = t;
    mevsimDurum.atesYandi = true;
    mevsimSenkron();
    sahne.etkilesimIsaretle();
    durumuYansit(t);
  };

  const sondur = () => {
    yandi = false;
    basili = false;
    dolum = 0;
    yanisAn = -1;
    mevsimDurum.atesYandi = false;
    mevsimSenkron();
    sahne.etkilesimIsaretle();
    durumuYansit(sonT);
    ciz(sonT, 0);
  };

  const kisaUyari = () => {
    ipucuEl.textContent = "BASILI TUT (~1,2 SN)";
    clearTimeout(uyariZaman);
    uyariZaman = setTimeout(() => {
      uyariZaman = null;
      durumuYansit(sonT);
    }, 1500);
  };

  let aktifPointer = null;
  let sonPointerAn = 0;
  const tutBasla = (e) => {
    if (e.button && e.button !== 0) return;
    e.preventDefault();
    sonPointerAn = performance.now();
    sahne.etkilesimIsaretle();
    if (yandi) {
      sondur();
      return;
    }
    if (az) {
      yak(sonT);
      ciz(sonT, 0);
      return;
    }
    basili = true;
    aktifPointer = e.pointerId;
    try {
      ocakBtn.setPointerCapture(e.pointerId);
    } catch {

    }
    durumuYansit(sonT);
  };

  const onClickYedek = () => {
    if (performance.now() - sonPointerAn < 400) return;
    sahne.etkilesimIsaretle();
    if (yandi) sondur();
    else if (az) {
      yak(sonT);
      ciz(sonT, 0);
    }
  };

  const tutBitir = (e) => {
    if (!basili) return;
    if (e && typeof e.pointerId === "number" && aktifPointer !== null && e.pointerId !== aktifPointer) return;
    basili = false;
    aktifPointer = null;
    if (!yandi && dolum > 0.04 && dolum < 1) kisaUyari();
    durumuYansit(sonT);
  };

  const onKeyDown = (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    sahne.etkilesimIsaretle();
    if (yandi) {
      sondur();
      return;
    }
    if (az) {
      yak(sonT);
      ciz(sonT, 0);
      return;
    }
    basili = true;
    durumuYansit(sonT);
  };

  const onKeyUp = (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    if (basili) {
      basili = false;
      if (!yandi && dolum < 1) kisaUyari();
      durumuYansit(sonT);
    }
  };

  ocakBtn.addEventListener("pointerdown", tutBasla);
  ocakBtn.addEventListener("pointerup", tutBitir);
  ocakBtn.addEventListener("pointercancel", tutBitir);
  ocakBtn.addEventListener("lostpointercapture", tutBitir);
  ocakBtn.addEventListener("click", onClickYedek);
  ocakBtn.addEventListener("keydown", onKeyDown);
  ocakBtn.addEventListener("keyup", onKeyUp);
  ocakBtn.addEventListener("contextmenu", (e) => e.preventDefault());

  ciz = (t, dt) => {
    const ctx = sahne.ctx;
    const { g, y } = sahne.boyut();
    if (!ctx || !g || !y) return;
    ctx.clearRect(0, 0, g, y);

    const ox = g * OCAK_X;
    const oy = y * OCAK_Y;
    const gecen = yandi ? (az ? 10 : Math.max(0, t - yanisAn)) : 0;
    const isikGuc = yandi ? (az ? 1 : yumusak(gecen / 1.1)) : dolum * 0.45;
    const sabah = yandi ? (az ? 1 : yumusak((gecen - 2.6) / 1.4)) : 0;

    const sisOp = (1 - isikGuc * 0.92) * (1 - sabah * 0.8);
    if (sisOp > 0.02) {
      for (let i = 0; i < sisler.length; i++) {
        const s = sisler[i];
        const yon = Math.sign(s.x - OCAK_X) || 1;
        const itme = yon * 0.16 * isikGuc;
        const sx = (s.x + itme + (az ? 0 : Math.sin(t * 0.25 + s.faz) * 0.018)) * g;
        const sy = s.y * y;
        const rx = s.rx * g;
        const ry = s.ry * y;
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, rx);
        grad.addColorStop(0, "rgba(130, 168, 232, 0.26)");
        grad.addColorStop(0.55, "rgba(92, 128, 198, 0.12)");
        grad.addColorStop(1, "rgba(92, 128, 198, 0)");
        ctx.save();
        ctx.globalAlpha = sisOp;
        ctx.translate(sx, sy);
        ctx.scale(1, ry / Math.max(1, rx));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, rx, 0, IKI_PI);
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    if (isikGuc > 0.03) {
      const titre = az ? 1 : 0.92 + 0.08 * Math.sin(t * 10.5);
      const rHavuz = Math.min(g, y) * (0.12 + 0.34 * isikGuc) * titre;
      const havuz = ctx.createRadialGradient(ox, oy, 0, ox, oy, rHavuz);
      havuz.addColorStop(0, "rgba(255, 226, 174, 0.62)");
      havuz.addColorStop(0.32, "rgba(224, 162, 106, 0.26)");
      havuz.addColorStop(1, "rgba(224, 162, 106, 0)");
      ctx.globalAlpha = isikGuc * (1 - sabah * 0.25);
      ctx.fillStyle = havuz;
      ctx.beginPath();
      ctx.arc(ox, oy, rHavuz, 0, IKI_PI);
      ctx.fill();

      if (!az) {
        for (let i = 0; i < kivilcimlar.length; i++) {
          const k = kivilcimlar[i];
          k.omur += dt;
          if (k.omur >= k.sure || k.x === 0) kivilcimSifirla(k, g, y);
          k.x += (k.vx + Math.sin(t * 4 + i) * 10) * dt;
          k.y += k.vy * dt;
          const oran = 1 - k.omur / k.sure;
          ctx.globalAlpha = oran * isikGuc * 0.9;
          ctx.fillStyle = i % 3 === 0 ? "#fff4e2" : SICAK;
          ctx.beginPath();
          ctx.arc(k.x, k.y, k.r * (0.4 + 0.6 * oran), 0, IKI_PI);
          ctx.fill();
        }
      }
    }

    if (yandi) {
      for (let i = 0; i < GELENLER.length; i++) {
        const p = GELENLER[i];
        const ilerle = az ? 1 : yumusak((gecen - p.gecikme) / 2.4);
        if (ilerle <= 0.01) continue;

        const u = 1 - ilerle;
        const gx = (u * u * p.bas[0] + 2 * u * ilerle * p.ara[0] + ilerle * ilerle * p.son[0]) * g;
        const sek = !az && ilerle < 1 ? Math.abs(Math.sin(t * 9 + i * 1.4)) * 2.5 : 0;
        const gy = (u * u * p.bas[1] + 2 * u * ilerle * p.ara[1] + ilerle * ilerle * p.son[1]) * y - sek;
        const gorun = az ? 1 : sinirla((gecen - p.gecikme) / 0.45);
        isikNoktasiCiz(ctx, gx, gy, 3.2, SICAK, gorun * 0.95);
      }
    }

    ctx.restore();
    sahne.darbeCiz(dt);
  };

  durumuYansit(0);

  return {
    adim(t) {
      const dt = sonT > 0 ? sinirla(t - sonT, 0, 0.06) : 0.016;
      sonT = t;
      if (!az && !yandi) {
        if (basili) {
          dolum = sinirla(dolum + dt / DOLUM_SN, 0, 1);
          if (dolum >= 1) yak(t);
        } else if (dolum > 0) {
          dolum = Math.max(0, dolum - dt * 1.4);
        }
      }
      durumuYansit(t);
      ciz(t, dt);
    },
    darbe(x, y, nx, ny) {
      sahne.darbe(x, y, nx, ny);
    },
    yokEt() {
      clearTimeout(uyariZaman);
      mevsimDurum.atesGorunur = false;
      mevsimSenkron();
      ocakBtn.removeEventListener("pointerdown", tutBasla);
      ocakBtn.removeEventListener("pointerup", tutBitir);
      ocakBtn.removeEventListener("pointercancel", tutBitir);
      ocakBtn.removeEventListener("lostpointercapture", tutBitir);
      ocakBtn.removeEventListener("click", onClickYedek);
      ocakBtn.removeEventListener("keydown", onKeyDown);
      ocakBtn.removeEventListener("keyup", onKeyUp);
      sahne.yokEt();
    },
  };
}

function gorev(kok) {
  const az = azHareket();

  const atama = az ? [0, 0, 1, 1] : [0, 0, 0, 0];
  let gecis = az ? 1 : 0;
  let gosterilenCikti = gorevHesapla(az ? 2 : 4, az ? 2 : 0).toplam;
  let sonT = 0;

  const KONUM_1 = { depo: [0.24, 0.31], kapi: [0.51, 0.48], ormanA: [0.72, 0.78], ormanB: [0.78, 0.22] };
  const KONUM_2 = { depo: [0.14, 0.30], kapi: [0.60, 0.49], ormanA: [0.82, 0.79], ormanB: [0.85, 0.22] };
  const noktaAl = (ad, k) => [ara(KONUM_1[ad][0], KONUM_2[ad][0], k), ara(KONUM_1[ad][1], KONUM_2[ad][1], k)];
  let ciz = null;

  const sahne = kareSahneKur(kok, {
    gorsel: {
      src: `${GALERI_IMG}gorev-1-1600.jpg`,
      srcset: `${GALERI_IMG}gorev-1-800.jpg 800w, ${GALERI_IMG}gorev-1-1600.jpg 1600w`,
    },
    gorsel2: {
      src: `${GALERI_IMG}gorev-2-1600.jpg`,
      srcset: `${GALERI_IMG}gorev-2-800.jpg 800w, ${GALERI_IMG}gorev-2-1600.jpg 1600w`,
    },
    alt: "Kale surunun dışında yürüyen işçiler; arkada odun deposu ve iki orman alanı.",
    mevsim: "sicak",
    bolumId: "gorev",
    onBoyut() {
      ciz?.(sonT, 0);
    },
  });

  const dagilimEl = document.createElement("span");
  dagilimEl.className = "krl-hedef";
  const formulEl = document.createElement("span");
  formulEl.className = "krl-saat";
  formulEl.textContent = "ÇIKTI/GÜN = 3 × n^0,8";
  sahne.ust.append(dagilimEl, formulEl);

  const ciktiEl = document.createElement("span");
  ciktiEl.className = "krl-durum";
  const ipucuEl = document.createElement("span");
  ipucuEl.className = "krl-ipucu";
  ipucuEl.textContent = "İŞÇİYİ SÜRÜKLE VEYA ORMANA DOKUN";
  sahne.altHud.append(ciktiEl, ipucuEl);

  const depoEtiket = document.createElement("span");
  depoEtiket.className = "krl-depo-pul veri";
  depoEtiket.textContent = "AVLU DEPOSU";
  sahne.katman.append(depoEtiket);

  const ormanDugmeleri = [0, 1].map((idx) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "krl-orman-hedef";
    b.dataset.orman = String(idx);
    b.setAttribute("aria-label", idx === 0 ? "Ön ormana işçi aktar" : "Uzak ormana işçi aktar");
    b.innerHTML = `
      <span class="krl-orman-halka" aria-hidden="true"></span>
      <span class="krl-orman-sayi veri">0</span>
      <span class="krl-etiket-pul veri">${idx === 0 ? "ÖN ORMAN" : "UZAK ORMAN"}</span>`;
    sahne.katman.append(b);
    return b;
  });

  const isciTutamac = [0, 1, 2, 3].map((idx) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "krl-isci-tut";
    b.dataset.isci = String(idx);
    b.setAttribute("aria-label", `İşçi ${idx + 1}: diğer ormana sürükle veya dokun`);
    b.innerHTML = `<span class="krl-isci-nokta" aria-hidden="true"></span>`;
    sahne.katman.append(b);
    return b;
  });

  const sayim = () => {
    const a = atama.filter((v) => v === 0).length;
    return { a, b: 4 - a };
  };

  let surukleme = null;

  const konumGuncelle = (k) => {
    const d = noktaAl("depo", k);
    const oA = noktaAl("ormanA", k);
    const oB = noktaAl("ormanB", k);
    depoEtiket.style.left = `${(d[0] * 100).toFixed(2)}%`;
    depoEtiket.style.top = `${(d[1] * 100).toFixed(2)}%`;
    ormanDugmeleri[0].style.left = `${(oA[0] * 100).toFixed(2)}%`;
    ormanDugmeleri[0].style.top = `${(oA[1] * 100).toFixed(2)}%`;
    ormanDugmeleri[1].style.left = `${(oB[0] * 100).toFixed(2)}%`;
    ormanDugmeleri[1].style.top = `${(oB[1] * 100).toFixed(2)}%`;

    const sayac = [0, 0];
    const toplam = [atama.filter((v) => v === 0).length, atama.filter((v) => v === 1).length];
    for (let i = 0; i < 4; i++) {
      const hedefOrman = atama[i];
      const sira = sayac[hedefOrman]++;
      const n = toplam[hedefOrman];
      const b = isciTutamac[i];
      if (surukleme && surukleme.idx === i && surukleme.tasindi) {
        b.style.left = `${(surukleme.x * 100).toFixed(2)}%`;
        b.style.top = `${(surukleme.y * 100).toFixed(2)}%`;
        continue;
      }
      const merkez = hedefOrman === 0 ? oA : oB;

      const aci = hedefOrman === 0
        ? 2.35 + (n > 1 ? (sira / (n - 1)) * 1.15 : 0.55)
        : 2.55 + (n > 1 ? (sira / (n - 1)) * 1.15 : 0.55);
      const rx = 0.145;
      const ry = 0.175;
      const px = sinirla(merkez[0] + Math.cos(aci) * rx, 0.14, 0.90);
      const py = sinirla(merkez[1] + Math.sin(aci) * ry, 0.14, 0.86);
      b.style.left = `${(px * 100).toFixed(2)}%`;
      b.style.top = `${(py * 100).toFixed(2)}%`;
    }
  };

  const arayuzGuncelle = (anlik = false) => {
    const { a, b } = sayim();
    const sonuc = gorevHesapla(a, b);
    if (anlik || az) gosterilenCikti = sonuc.toplam;

    ormanDugmeleri[0].querySelector(".krl-orman-sayi").textContent = String(a);
    ormanDugmeleri[1].querySelector(".krl-orman-sayi").textContent = String(b);
    ormanDugmeleri[0].classList.toggle("etkin", a > 0);
    ormanDugmeleri[1].classList.toggle("etkin", b > 0);
    ormanDugmeleri[1].classList.toggle("davet", b === 0);

    const ikinciAktif = b > 0;
    sahne.foto2?.classList.toggle("etkin", ikinciAktif);
    if (az) gecis = ikinciAktif ? 1 : 0;

    dagilimEl.textContent = `DAĞILIM · ${a}+${b}${sonuc.enVerimli ? " · EN VERİMLİ" : ""}`;
    dagilimEl.classList.toggle("vurgulu", sonuc.enVerimli);
    const sayiMetin = virgul(gosterilenCikti, 1);
    const etiketEk = sonuc.temsili ? " · TEMSİLÎ" : "";
    ciktiEl.textContent = `${sayiMetin} ODUN/GÜN${etiketEk} · yürüyüş hariç`;
    sahne.sarmal.classList.toggle("gorev-verimli", sonuc.enVerimli);
    konumGuncelle(gecis);
  };

  const ormanaCek = (hedefIdx) => {
    sahne.etkilesimIsaretle();
    const kaynakIdx = 1 - hedefIdx;
    const aday = atama.findIndex((v) => v === kaynakIdx);
    if (aday === -1) return;
    atama[aday] = hedefIdx;
    arayuzGuncelle(az);
    if (az) ciz(sonT, 0);
  };

  ormanDugmeleri.forEach((btn, idx) => {
    btn.addEventListener("click", () => ormanaCek(idx));
  });

  const ekranNoktasindanOran = (cx, cy) => {
    const r = sahne.kutuAl();
    return {
      x: sinirla((cx - r.left) / Math.max(1, r.width), 0.04, 0.96),
      y: sinirla((cy - r.top) / Math.max(1, r.height), 0.06, 0.94),
    };
  };

  const enYakinOrman = (nx, ny) => {
    const oA = noktaAl("ormanA", gecis);
    const oB = noktaAl("ormanB", gecis);
    const dA = Math.hypot(nx - oA[0], ny - oA[1]);
    const dB = Math.hypot(nx - oB[0], ny - oB[1]);
    return dB < dA ? 1 : 0;
  };

  isciTutamac.forEach((btn, idx) => {
    btn.addEventListener("pointerdown", (e) => {
      if (e.button && e.button !== 0) return;
      e.preventDefault();
      sahne.etkilesimIsaretle();
      const p = ekranNoktasindanOran(e.clientX, e.clientY);
      surukleme = { idx, pointerId: e.pointerId, basX: e.clientX, basY: e.clientY, x: p.x, y: p.y, tasindi: false };
      btn.classList.add("tutuluyor");
      try {
        btn.setPointerCapture(e.pointerId);
      } catch {

      }
    });

    btn.addEventListener("pointermove", (e) => {
      if (!surukleme || surukleme.idx !== idx || surukleme.pointerId !== e.pointerId) return;
      if (!surukleme.tasindi && Math.hypot(e.clientX - surukleme.basX, e.clientY - surukleme.basY) > 7) {
        surukleme.tasindi = true;
      }
      if (!surukleme.tasindi) return;
      const p = ekranNoktasindanOran(e.clientX, e.clientY);
      surukleme.x = p.x;
      surukleme.y = p.y;
      const yakin = enYakinOrman(p.x, p.y);
      ormanDugmeleri[0].classList.toggle("hedef-vurgulu", yakin === 0);
      ormanDugmeleri[1].classList.toggle("hedef-vurgulu", yakin === 1);
      konumGuncelle(gecis);
    });

    const surukleBitir = (e) => {
      if (!surukleme || surukleme.idx !== idx) return;
      if (e && typeof e.pointerId === "number" && e.pointerId !== surukleme.pointerId) return;
      const s = surukleme;
      surukleme = null;
      btn.classList.remove("tutuluyor");
      ormanDugmeleri[0].classList.remove("hedef-vurgulu");
      ormanDugmeleri[1].classList.remove("hedef-vurgulu");

      if (s.tasindi) {
        atama[idx] = enYakinOrman(s.x, s.y);
      } else {

        atama[idx] = 1 - atama[idx];
      }
      arayuzGuncelle(az);
      if (az) ciz(sonT, 0);
    };

    btn.addEventListener("pointerup", surukleBitir);
    btn.addEventListener("pointercancel", surukleBitir);
    btn.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      sahne.etkilesimIsaretle();
      atama[idx] = 1 - atama[idx];
      arayuzGuncelle(az);
      if (az) ciz(sonT, 0);
    });
  });

  ciz = (t, dt) => {
    const ctx = sahne.ctx;
    const { g, y } = sahne.boyut();
    if (!ctx || !g || !y) return;
    ctx.clearRect(0, 0, g, y);

    const d = noktaAl("depo", gecis);
    const kp = noktaAl("kapi", gecis);
    const oA = noktaAl("ormanA", gecis);
    const oB = noktaAl("ormanB", gecis);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    const rotaCiz = (hedef, aktifSayi) => {
      if (aktifSayi <= 0) return;
      ctx.save();
      ctx.strokeStyle = SICAK;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 6]);
      ctx.lineDashOffset = az ? 0 : -t * 14;
      ctx.globalAlpha = 0.24 + aktifSayi * 0.08;
      ctx.beginPath();
      ctx.moveTo(d[0] * g, d[1] * y);
      ctx.quadraticCurveTo(kp[0] * g, kp[1] * y, hedef[0] * g, hedef[1] * y);
      ctx.stroke();
      ctx.restore();
    };
    const { a, b } = sayim();
    rotaCiz(oA, a);
    rotaCiz(oB, b);

    isikNoktasiCiz(ctx, d[0] * g, d[1] * y, 5.5, TOZ, 0.55);

    for (let i = 0; i < 4; i++) {
      if (surukleme && surukleme.idx === i && surukleme.tasindi) {
        const hedef = enYakinOrman(surukleme.x, surukleme.y) === 0 ? oA : oB;
        ctx.save();
        ctx.strokeStyle = SICAK;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([3, 4]);
        ctx.globalAlpha = 0.72;
        ctx.beginPath();
        ctx.moveTo(surukleme.x * g, surukleme.y * y);
        ctx.lineTo(hedef[0] * g, hedef[1] * y);
        ctx.stroke();
        ctx.restore();
        isikNoktasiCiz(ctx, surukleme.x * g, surukleme.y * y, 5.2, SICAK, 1);
        continue;
      }
      const hedef = atama[i] === 0 ? oA : oB;
      const faz = az ? 0.22 + i * 0.19 : ((t * 0.2 + i * 0.24) % 1);

      let u = 0;
      let yuklu = false;
      if (faz < 0.4) u = yumusak(faz / 0.4);
      else if (faz < 0.55) u = 1;
      else if (faz < 0.92) {
        u = 1 - yumusak((faz - 0.55) / 0.37);
        yuklu = true;
      } else u = 0;

      const k = 1 - u;
      const px = (k * k * d[0] + 2 * k * u * kp[0] + u * u * hedef[0]) * g;
      const sek = !az && u > 0.02 && u < 0.98 ? Math.abs(Math.sin(t * 10 + i * 2)) * 2.2 : 0;
      const py = (k * k * d[1] + 2 * k * u * kp[1] + u * u * hedef[1]) * y - sek;
      isikNoktasiCiz(ctx, px, py, yuklu ? 3.8 : 3.1, yuklu ? "#ffbe76" : SICAK, 0.94);
    }

    ctx.restore();
    sahne.darbeCiz(dt);
  };

  arayuzGuncelle(true);

  return {
    adim(t) {
      const dt = sonT > 0 ? sinirla(t - sonT, 0, 0.06) : 0.016;
      sonT = t;
      const { a, b } = sayim();
      const hedefGecis = b > 0 ? 1 : 0;
      if (!az && Math.abs(gecis - hedefGecis) > 0.002) {
        gecis += (hedefGecis - gecis) * Math.min(1, dt * 6);
        konumGuncelle(gecis);
      }
      const hedefCikti = gorevHesapla(a, b).toplam;
      if (!az && Math.abs(gosterilenCikti - hedefCikti) > 0.005) {
        gosterilenCikti += (hedefCikti - gosterilenCikti) * Math.min(1, dt * 10);
        const sonuc = gorevHesapla(a, b);
        ciktiEl.textContent = `${virgul(gosterilenCikti, 1)} ODUN/GÜN${sonuc.temsili ? " · TEMSİLÎ" : ""} · yürüyüş hariç`;
      }
      ciz(t, dt);
    },
    darbe(x, y, nx, ny) {
      sahne.darbe(x, y, nx, ny);
    },
    yokEt() {
      sahne.yokEt();
    },
  };
}

function kis(kok) {
  const az = azHareket();
  const OCAK = [0.48, 0.46];

  const EVLER = [
    { x: 0.31, y: 0.54, ad: "HARABE EV 1" },
    { x: 0.61, y: 0.41, ad: "HARABE EV 2" },
  ];
  const onarik = [az, az];
  const evIlerleme = [az ? 1 : 0, az ? 1 : 0];
  let gosterilenOdun = kisOdunHesapla(az ? 2 : 0).gunlukOdun;
  let gosterilenGun = kisOdunHesapla(az ? 2 : 0).yeterGun;
  let sonT = 0;
  let ciz = null;

  const sahne = kareSahneKur(kok, {
    gorsel: {
      src: `${GALERI_IMG}kis-1-1600.jpg`,
      srcset: `${GALERI_IMG}kis-1-800.jpg 800w, ${GALERI_IMG}kis-1-1600.jpg 1600w`,
    },
    alt: "Karla kaplı kış manzarası: surları ve kuleleri olan kale, ocak ve çevresinde onarılacak yapılar.",
    mevsim: "kis",
    bolumId: "kis",
    onGorunur(g) {
      mevsimDurum.kisGorunur = g;
      mevsimSenkron();
    },
    onBoyut() {
      ciz?.(sonT, 0);
    },
  });

  const kisTarihEl = document.createElement("span");
  kisTarihEl.className = "krl-hedef";
  kisTarihEl.textContent = "İLK KIŞ · GÜN 11 · KIŞ: 6 GÜN";
  const barinmaEl = document.createElement("span");
  barinmaEl.className = "krl-saat";
  sahne.ust.append(kisTarihEl, barinmaEl);

  sahne.altHud.classList.add("krl-alt-kis");
  const hesapSatir = document.createElement("div");
  hesapSatir.className = "krl-kis-hesap";
  const odunDegerEl = document.createElement("span");
  odunDegerEl.className = "krl-durum";
  const gunBar = document.createElement("span");
  gunBar.className = "krl-kis-bar";
  gunBar.setAttribute("aria-hidden", "true");
  gunBar.innerHTML = `<i class="krl-kis-dolu"></i><i class="krl-kis-esik"></i>`;
  const gunDolu = gunBar.querySelector(".krl-kis-dolu");
  const temsiliEtiket = document.createElement("span");
  temsiliEtiket.className = "krl-ipucu";
  temsiliEtiket.textContent = "TEMSİLÎ STOK (10 KİŞİ, 60 ODUN)";
  hesapSatir.append(odunDegerEl, gunBar, temsiliEtiket);

  const sabitSatir = document.createElement("div");
  sabitSatir.className = "krl-kis-sabit";
  sabitSatir.textContent = "çatı altı 0,5 · açıkta 4,5 odun/kişi/gün · 4 kişi/ev · onarım: 10 taş + 6 odun";
  sahne.altHud.append(hesapSatir, sabitSatir);

  const evDugmeleri = EVLER.map((ev, idx) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "krl-ev-hedef";
    b.style.left = `${ev.x * 100}%`;
    b.style.top = `${ev.y * 100}%`;
    b.setAttribute("aria-pressed", String(onarik[idx]));
    b.innerHTML = `
      <span class="krl-ev-pencere" aria-hidden="true"><i></i><i></i></span>
      <span class="krl-etiket-pul veri">${ev.ad}</span>`;
    b.addEventListener("click", () => {
      sahne.etkilesimIsaretle();
      onarik[idx] = !onarik[idx];
      if (az) evIlerleme[idx] = onarik[idx] ? 1 : 0;
      arayuzGuncelle(az);
      if (az) ciz(sonT, 0);
    });
    sahne.katman.append(b);
    return b;
  });

  const rk = tohumlu(8811);
  const karlar = Array.from({ length: 36 }, () => {
    const derin = 0.55 + rk() * 0.9;
    return {
      x: rk(),
      y: rk(),
      vx: (0.018 + rk() * 0.022) * derin,
      vy: (0.048 + rk() * 0.052) * derin,
      faz: rk() * IKI_PI,
      r: 0.85 + derin * 0.9,
      op: 0.22 + derin * 0.34,
    };
  });

  const KISI_ACILAR = Array.from({ length: 10 }, (_, i) => (i / 10) * IKI_PI + 0.3);

  const arayuzGuncelle = (anlik = false) => {
    const evSayi = (onarik[0] ? 1 : 0) + (onarik[1] ? 1 : 0);
    const hesap = kisOdunHesapla(evSayi);
    if (anlik || az) {
      gosterilenOdun = hesap.gunlukOdun;
      gosterilenGun = hesap.yeterGun;
    }

    barinmaEl.textContent = `ÇATI ALTI ${hesap.catiAlti} · AÇIKTA ${hesap.acikta}`;
    barinmaEl.classList.toggle("vurgulu", evSayi === 2);

    odunDegerEl.textContent = `${virgul(gosterilenOdun, 1)} ODUN/GÜN · ${virgul(gosterilenGun, 1)} GÜN YETER`;
    odunDegerEl.classList.toggle("kritik", hesap.kritik);
    gunDolu.style.transform = `scaleX(${sinirla(gosterilenGun / 6, 0.04, 1).toFixed(3)})`;
    gunBar.classList.toggle("kritik", hesap.kritik);

    evDugmeleri.forEach((b, idx) => {
      const acik = onarik[idx];
      b.classList.toggle("onarik", acik);
      b.setAttribute("aria-pressed", String(acik));
      b.setAttribute("aria-label", acik ? `Ev ${idx + 1} onarıldı (4 kişi çatı altında), geri almak için dokun` : `Harabe ev ${idx + 1}: onarmak için dokun (10 taş + 6 odun)`);
      b.querySelector(".krl-etiket-pul").textContent = acik ? "ONARIK · 4 KİŞİ" : "HARABE · ONAR";
    });
  };

  ciz = (t, dt) => {
    const ctx = sahne.ctx;
    const { g, y } = sahne.boyut();
    if (!ctx || !g || !y) return;
    ctx.clearRect(0, 0, g, y);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    const ox = OCAK[0] * g;
    const oy = OCAK[1] * y;
    const ocakR = Math.min(g, y) * 0.14 * (az ? 1 : 0.94 + 0.06 * Math.sin(t * 7.5));
    const ocakGrad = ctx.createRadialGradient(ox, oy, 0, ox, oy, ocakR);
    ocakGrad.addColorStop(0, "rgba(255, 214, 158, 0.42)");
    ocakGrad.addColorStop(0.5, "rgba(224, 162, 106, 0.14)");
    ocakGrad.addColorStop(1, "rgba(224, 162, 106, 0)");
    ctx.fillStyle = ocakGrad;
    ctx.beginPath();
    ctx.arc(ox, oy, ocakR, 0, IKI_PI);
    ctx.fill();

    EVLER.forEach((ev, idx) => {
      const k = evIlerleme[idx];
      if (k <= 0.02) return;
      const ex = ev.x * g;
      const ey = ev.y * y;
      const r = Math.min(g, y) * (0.09 + 0.05 * k);
      const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, r);
      grad.addColorStop(0, "rgba(255, 220, 164, 0.65)");
      grad.addColorStop(0.42, "rgba(224, 162, 106, 0.22)");
      grad.addColorStop(1, "rgba(224, 162, 106, 0)");
      ctx.globalAlpha = k * (az ? 1 : 0.92 + 0.08 * Math.sin(t * 4.5 + idx));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ex, ey, r, 0, IKI_PI);
      ctx.fill();
    });

    for (let i = 0; i < 10; i++) {
      const evIdx = i < 4 ? 0 : i < 8 ? 1 : -1;
      const aci = KISI_ACILAR[i];
      const basX = OCAK[0] + Math.cos(aci) * 0.055;
      const basY = OCAK[1] + Math.sin(aci) * 0.055;
      let px = basX;
      let py = basY;
      let op = 0.88;
      let renk = evIdx === -1 && !onarik[0] && !onarik[1] ? SOGUK : SICAK;
      if (evIdx >= 0) {
        const k = yumusak(evIlerleme[evIdx]);
        px = ara(basX, EVLER[evIdx].x, k);
        py = ara(basY, EVLER[evIdx].y, k);
        op = (1 - k) * 0.9;
        if (!onarik[evIdx]) renk = i % 3 === 0 ? SOGUK : SICAK;
      } else {
        renk = i === 9 ? SOGUK : SICAK;
      }
      if (op > 0.03) {
        const titre = az ? 0 : Math.sin(t * 2.4 + i) * 1.1;
        isikNoktasiCiz(ctx, px * g, py * y + titre, 2.3, renk, op);
      }
    }
    ctx.restore();

    for (let i = 0; i < karlar.length; i++) {
      const k = karlar[i];
      if (!az) {
        k.x = (k.x + (k.vx + Math.sin(t * 0.9 + k.faz) * 0.008) * dt + 1) % 1;
        k.y = (k.y + k.vy * dt) % 1;
      }
      const kx = k.x * g;
      const ky = k.y * y;
      const kenar = Math.min(1, k.y / 0.12, (1 - k.y) / 0.14);
      ctx.globalAlpha = Math.max(0, k.op * kenar);
      ctx.fillStyle = KAR_RENK;
      ctx.beginPath();
      ctx.arc(kx, ky, k.r, 0, IKI_PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    sahne.darbeCiz(dt);
  };

  arayuzGuncelle(true);

  return {
    adim(t) {
      const dt = sonT > 0 ? sinirla(t - sonT, 0, 0.06) : 0.016;
      sonT = t;
      for (let i = 0; i < 2; i++) {
        const hedef = onarik[i] ? 1 : 0;
        if (!az) evIlerleme[i] += (hedef - evIlerleme[i]) * Math.min(1, dt * 4.5);
        else evIlerleme[i] = hedef;
      }
      const evSayi = (onarik[0] ? 1 : 0) + (onarik[1] ? 1 : 0);
      const hesap = kisOdunHesapla(evSayi);
      if (!az && (Math.abs(gosterilenOdun - hesap.gunlukOdun) > 0.05 || Math.abs(gosterilenGun - hesap.yeterGun) > 0.02)) {
        gosterilenOdun += (hesap.gunlukOdun - gosterilenOdun) * Math.min(1, dt * 9);
        gosterilenGun += (hesap.yeterGun - gosterilenGun) * Math.min(1, dt * 9);
        odunDegerEl.textContent = `${virgul(gosterilenOdun, 1)} ODUN/GÜN · ${virgul(gosterilenGun, 1)} GÜN YETER`;
        gunDolu.style.transform = `scaleX(${sinirla(gosterilenGun / 6, 0.04, 1).toFixed(3)})`;
      }
      ciz(t, dt);
    },
    darbe(x, y, nx, ny) {
      sahne.darbe(x, y, nx, ny);
    },
    yokEt() {
      mevsimDurum.kisGorunur = false;
      mevsimSenkron();
      sahne.yokEt();
    },
  };
}

function lider(kok) {
  const az = azHareket();

  const LIDERLER = [
    { anahtar: "hazel", x: 0.56, y: 0.29 },
    { anahtar: "tobin", x: 0.31, y: 0.56 },
    { anahtar: "dunstan", x: 0.25, y: 0.35 },
  ];

  let acikKartId = az ? "hazel2" : null;
  let hazelIlkSecim = 0;
  const secimler = az ? { hazel: 0 } : {};
  let sonT = 0;
  let ciz = null;

  const sahne = kareSahneKur(kok, {
    gorsel: {
      src: `${GALERI_IMG}lider-1-1600.jpg`,
      srcset: `${GALERI_IMG}lider-1-800.jpg 800w, ${GALERI_IMG}lider-1-1600.jpg 1600w`,
    },
    gorsel2: {
      src: `${GALERI_IMG}lider-2-1600.jpg`,
      srcset: `${GALERI_IMG}lider-2-800.jpg 800w, ${GALERI_IMG}lider-2-1600.jpg 1600w`,
    },
    alt: "Kale avlusunda ateşin çevresinde toplanan liderler, odun yığınları ve taş iskele.",
    mevsim: "sicak",
    bolumId: "liderler",
    onBoyut() {
      ciz?.(sonT, 0);
    },
  });

  const esikEl = document.createElement("span");
  esikEl.className = "krl-hedef";
  esikEl.textContent = "3 KİŞİ · 2 İŞ-GÜNÜ";
  const guvenEl = document.createElement("span");
  guvenEl.className = "krl-saat";
  sahne.ust.append(esikEl, guvenEl);

  const durumEl = document.createElement("span");
  durumEl.className = "krl-durum";
  const ipucuEl = document.createElement("span");
  ipucuEl.className = "krl-ipucu";
  ipucuEl.textContent = "LİDER IŞIĞINA DOKUN";
  sahne.altHud.append(durumEl, ipucuEl);

  const liderDugmeleri = {};
  LIDERLER.forEach(({ anahtar, x, y }) => {
    const k = LIDER_KARTLAR[anahtar];
    const b = document.createElement("button");
    b.type = "button";
    b.className = "krl-lider-isik";
    b.style.left = `${x * 100}%`;
    b.style.top = `${y * 100}%`;
    b.dataset.lider = anahtar;
    b.setAttribute("aria-label", `${k.ad} · ${k.topluluk}: dilekçeyi aç`);
    b.innerHTML = `
      <span class="krl-lider-hale" aria-hidden="true"></span>
      <span class="krl-lider-nokta" aria-hidden="true"></span>
      <span class="krl-etiket-pul veri">${k.ad}</span>`;
    b.addEventListener("click", () => {
      sahne.etkilesimIsaretle();
      if (anahtar === "hazel") {

        if (acikKartId === "hazel" && secimler.hazel !== undefined) acikKartId = "hazel2";
        else if (acikKartId === "hazel2") acikKartId = "hazel";
        else acikKartId = secimler.hazel !== undefined ? "hazel2" : "hazel";
      } else {
        acikKartId = acikKartId === anahtar ? null : anahtar;
      }
      balonGuncelle();
      if (az) ciz(sonT, 0);
    });
    sahne.katman.append(b);
    liderDugmeleri[anahtar] = b;
  });

  const balon = document.createElement("div");
  balon.className = "krl-balon";
  balon.setAttribute("role", "dialog");
  balon.setAttribute("aria-label", "Lider dilekçesi");
  balon.hidden = true;
  balon.innerHTML = `
    <div class="krl-balon-ust veri">
      <span class="krl-balon-kick"></span>
      <button type="button" class="krl-balon-kapat veri" aria-label="Dilekçeyi kapat">×</button>
    </div>
    <p class="krl-balon-atif" hidden></p>
    <h3 class="krl-balon-baslik"></h3>
    <div class="krl-balon-secenekler">
      <button type="button" class="krl-secenek" data-i="0"></button>
      <button type="button" class="krl-secenek" data-i="1"></button>
    </div>
    <div class="krl-balon-alt veri">
      <span class="krl-balon-sonuc"></span>
      <button type="button" class="krl-balon-gec veri" hidden></button>
    </div>`;
  sahne.sarmal.append(balon);

  const kickEl = balon.querySelector(".krl-balon-kick");
  const kapatBtn = balon.querySelector(".krl-balon-kapat");
  const atifEl = balon.querySelector(".krl-balon-atif");
  const baslikEl = balon.querySelector(".krl-balon-baslik");
  const secenekBtnler = [...balon.querySelectorAll(".krl-secenek")];
  const sonucEl = balon.querySelector(".krl-balon-sonuc");
  const gecBtn = balon.querySelector(".krl-balon-gec");

  kapatBtn.addEventListener("click", () => {
    acikKartId = null;
    balonGuncelle();
    if (az) ciz(sonT, 0);
  });

  secenekBtnler.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!acikKartId) return;
      sahne.etkilesimIsaretle();
      const idx = Number(btn.dataset.i);
      secimler[acikKartId] = idx;
      if (acikKartId === "hazel") hazelIlkSecim = idx;
      balonGuncelle();
      if (az) ciz(sonT, 0);
    });
  });

  gecBtn.addEventListener("click", () => {
    sahne.etkilesimIsaretle();
    if (acikKartId === "hazel") acikKartId = "hazel2";
    else if (acikKartId === "hazel2") acikKartId = "hazel";
    balonGuncelle();
    if (az) ciz(sonT, 0);
  });

  const balonGuncelle = () => {
    const yanitSayisi = Object.keys(secimler).length;
    const guven = Math.min(5, yanitSayisi);
    guvenEl.textContent = `GÜVEN ${guven} / 5`;

    const ikinciKare = acikKartId === "hazel2";
    sahne.foto2?.classList.toggle("etkin", ikinciKare);

    Object.entries(liderDugmeleri).forEach(([anahtar, btn]) => {
      const etkin = acikKartId === anahtar || (anahtar === "hazel" && acikKartId === "hazel2");
      const hazirIkinci = anahtar === "hazel" && secimler.hazel !== undefined && secimler.hazel2 === undefined;
      btn.classList.toggle("etkin", etkin);
      btn.classList.toggle("yeni-dilekce", hazirIkinci);
    });

    if (!acikKartId) {
      balon.hidden = true;
      balon.classList.remove("acik");
      durumEl.textContent = "Mother Hazel · Goodman Tobin · Master Dunstan";
      return;
    }

    const kart = LIDER_KARTLAR[acikKartId];
    const secilen = secimler[acikKartId];
    balon.hidden = false;
    balon.classList.add("acik");
    kickEl.textContent = `${kart.dogmus ? "DİLEKÇE" : `DİLEKÇE · ${kart.kick.toLocaleUpperCase("tr")}`} · ${kart.ad.toLocaleUpperCase("tr")}`;
    baslikEl.textContent = kart.baslik;

    if (acikKartId === "hazel2") {
      const [s1, s2] = hazelAtifOlustur(hazelIlkSecim);
      atifEl.hidden = false;
      atifEl.textContent = `${s1} ${s2}`;
    } else {
      atifEl.hidden = true;
      atifEl.textContent = "";
    }

    secenekBtnler.forEach((btn, i) => {
      btn.textContent = kart.secenek[i];
      const bu = secilen === i;
      btn.classList.toggle("secili", bu);
      btn.setAttribute("aria-pressed", String(bu));
    });

    if (secilen !== undefined) {
      const metin = kartSonucMetni(kart, secilen);
      sonucEl.textContent = metin;
      durumEl.textContent = `${kart.ad}: ${metin}`;
    } else {
      sonucEl.textContent = "";
      durumEl.textContent = `${kart.ad} · ${kart.topluluk}`;
    }

    if (acikKartId === "hazel" && secimler.hazel !== undefined) {
      gecBtn.hidden = false;
      gecBtn.textContent = "Sönen Ocak →";
    } else if (acikKartId === "hazel2") {
      gecBtn.hidden = false;
      gecBtn.textContent = "← Ormanın Kıyısı";
    } else {
      gecBtn.hidden = true;
    }
  };

  const rng = tohumlu(4510);
  const kivilcim = Array.from({ length: 14 }, () => ({
    x: 0.46 + (rng() - 0.5) * 0.06,
    y: 0.47,
    vy: -(0.04 + rng() * 0.07),
    omur: rng(),
    sure: 0.9 + rng() * 0.9,
    r: 0.8 + rng() * 1.2,
  }));

  ciz = (t, dt) => {
    const ctx = sahne.ctx;
    const { g, y } = sahne.boyut();
    if (!ctx || !g || !y) return;
    ctx.clearRect(0, 0, g, y);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    const fx = 0.46 * g;
    const fy = 0.47 * y;
    const r = Math.min(g, y) * 0.16 * (az ? 1 : 0.93 + 0.07 * Math.sin(t * 8.4));
    const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, r);
    grad.addColorStop(0, "rgba(255, 224, 170, 0.36)");
    grad.addColorStop(0.5, "rgba(224, 162, 106, 0.12)");
    grad.addColorStop(1, "rgba(224, 162, 106, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, IKI_PI);
    ctx.fill();

    LIDERLER.forEach(({ anahtar, x, y: ly }, i) => {
      const etkin = acikKartId === anahtar || (anahtar === "hazel" && acikKartId === "hazel2");
      const nefes = az ? 1 : 0.85 + 0.15 * Math.sin(t * 2.6 + i * 2);
      isikNoktasiCiz(ctx, x * g, ly * y, etkin ? 6.2 : 4.1, SICAK, (etkin ? 0.92 : 0.6) * nefes);
    });

    if (!az) {
      for (let i = 0; i < kivilcim.length; i++) {
        const k = kivilcim[i];
        k.omur += dt;
        if (k.omur >= k.sure) {
          k.omur = 0;
          k.x = 0.46 + (rng() - 0.5) * 0.05;
          k.y = 0.47;
        }
        k.y += k.vy * dt;
        const oran = 1 - k.omur / k.sure;
        ctx.globalAlpha = oran * 0.65;
        ctx.fillStyle = SICAK;
        ctx.beginPath();
        ctx.arc((k.x + Math.sin(t * 3 + i) * 0.008) * g, k.y * y, k.r, 0, IKI_PI);
        ctx.fill();
      }
    }

    ctx.restore();
    sahne.darbeCiz(dt);
  };

  balonGuncelle();

  return {
    adim(t) {
      const dt = sonT > 0 ? sinirla(t - sonT, 0, 0.06) : 0.016;
      sonT = t;
      ciz(t, dt);
    },
    darbe(x, y, nx, ny) {
      sahne.darbe(x, y, nx, ny);
    },
    yokEt() {
      sahne.yokEt();
    },
  };
}

function merdiven(kok) {
  const az = azHareket();

  const FENER_X = 0.505;
  const FENER_Y = 0.44;
  const LAMBA_X = 0.705;
  const LAMBA_Y = 0.33;

  const IZLER = [
    [0.14, 0.24],
    [0.33, 0.14],
    [0.86, 0.22],
    [0.16, 0.68],
    [0.32, 0.76],
    [0.86, 0.58],
    [0.58, 0.72],
  ];

  let evre = az ? 2 : 0;
  let gorunenEvre = evre;
  let sonT = 0;
  let ciz = null;

  const sahne = kareSahneKur(kok, {
    gorsel: {
      src: `${GALERI_IMG}tac-1-1600.jpg`,
      srcset: `${GALERI_IMG}tac-1-800.jpg 800w, ${GALERI_IMG}tac-1-1600.jpg 1600w`,
    },
    alt: "Onarılmış kale: köşe kulelerinde sarı çatılar, avlunun ortasında parlak ışık ve kule lambası.",
    mevsim: "sicak",
    bolumId: "tac",
    onBoyut() {
      ciz?.(sonT, 0);
    },
  });

  const unvanEl = document.createElement("span");
  unvanEl.className = "krl-hedef";
  const evreEl = document.createElement("span");
  evreEl.className = "krl-saat";
  sahne.ust.append(unvanEl, evreEl);

  sahne.altHud.classList.add("krl-alt-tac");
  const sartEl = document.createElement("span");
  sartEl.className = "krl-durum";
  const ipucuEl = document.createElement("span");
  ipucuEl.className = "krl-ipucu";
  ipucuEl.textContent = "BASAMAKLARA DOKUN VEYA YUKARI SÜRÜKLE";
  sahne.altHud.append(sartEl, ipucuEl);

  const fenerBtn = document.createElement("button");
  fenerBtn.type = "button";
  fenerBtn.className = "krl-fener-halka";
  fenerBtn.style.left = `${FENER_X * 100}%`;
  fenerBtn.style.top = `${FENER_Y * 100}%`;
  fenerBtn.setAttribute("aria-label", "Ais feneri: sonraki evreye tırman");

  const maskot = document.createElement("span");
  maskot.className = "krl-fener-isik";
  maskot.setAttribute("aria-hidden", "true");
  maskot.dataset.faz = az ? "aisenit" : "ais";
  fenerBtn.append(maskot);
  sahne.katman.append(fenerBtn);

  const lambaEl = document.createElement("span");
  lambaEl.className = "krl-kule-lamba";
  lambaEl.style.left = `${LAMBA_X * 100}%`;
  lambaEl.style.top = `${LAMBA_Y * 100}%`;
  lambaEl.setAttribute("aria-hidden", "true");
  sahne.katman.append(lambaEl);

  const ray = document.createElement("div");
  ray.className = "krl-merdiven-ray";
  ray.setAttribute("role", "group");
  ray.setAttribute("aria-label", "Ais evre basamakları");

  const rayHat = document.createElement("span");
  rayHat.className = "krl-ray-hat";
  rayHat.setAttribute("aria-hidden", "true");
  const rayIsaret = document.createElement("span");
  rayIsaret.className = "krl-ray-isaret";
  rayIsaret.setAttribute("aria-hidden", "true");
  ray.append(rayHat, rayIsaret);

  const basamakDugmeleri = [2, 1, 0].map((idx) => {
    const e = TAC_EVRELER[idx];
    const b = document.createElement("button");
    b.type = "button";
    b.className = "krl-basamak";
    b.dataset.evre = String(idx);
    b.setAttribute("aria-pressed", String(idx === evre));
    b.innerHTML = `<span class="krl-basamak-nokta" aria-hidden="true"></span><span class="krl-basamak-yazi veri"><b>${e.ad}</b><span class="krl-basamak-unvan">${e.unvan}</span></span>`;
    b.addEventListener("click", () => {
      if (raySuruklendi) return;
      sahne.etkilesimIsaretle();
      evreAyarla(idx);
    });
    ray.append(b);
    return b;
  });
  sahne.katman.append(ray);

  let sonFaz = az ? "aisenit" : "ais";
  const evreAyarla = (yeni) => {
    const hedef = Math.max(0, Math.min(2, Math.round(yeni)));
    evre = hedef;
    if (az) gorunenEvre = hedef;
    const bilgi = TAC_EVRELER[hedef];

    if (bilgi.faz !== sonFaz) {
      sonFaz = bilgi.faz;
      maskot.dataset.faz = bilgi.faz;
    }

    sahne.sarmal.dataset.evre = String(hedef);
    sahne.sarmal.classList.toggle("tac-yandi", bilgi.lamba);
    lambaEl.classList.toggle("yanik", bilgi.lamba);

    unvanEl.textContent = bilgi.durum;
    unvanEl.classList.toggle("vurgulu", bilgi.lamba);
    evreEl.textContent = `${bilgi.ad} · ${hedef + 1}/3`;
    sartEl.textContent = `${bilgi.ad} (${bilgi.unvan}) · ${bilgi.sart}`;

    basamakDugmeleri.forEach((b) => {
      const i = Number(b.dataset.evre);
      b.classList.toggle("etkin", i === hedef);
      b.classList.toggle("gecildi", i <= hedef);
      b.setAttribute("aria-pressed", String(i === hedef));
    });
    rayIsaret.style.setProperty("--evre-oran", String(1 - hedef / 2));
    if (az) ciz(sonT, 0);
  };

  let fenerSuruk = null;
  fenerBtn.addEventListener("pointerdown", (e) => {
    if (e.button && e.button !== 0) return;
    sahne.etkilesimIsaretle();
    fenerSuruk = { id: e.pointerId, y0: e.clientY, basEvre: evre, tasindi: false };
  });
  fenerBtn.addEventListener("pointermove", (e) => {
    if (!fenerSuruk || fenerSuruk.id !== e.pointerId) return;
    const dy = fenerSuruk.y0 - e.clientY;
    if (Math.abs(dy) > 16) {
      fenerSuruk.tasindi = true;
      const adim = Math.round(dy / 44);
      evreAyarla(fenerSuruk.basEvre + adim);
    }
  });
  const fenerBitir = (e) => {
    if (!fenerSuruk) return;
    if (e && typeof e.pointerId === "number" && e.pointerId !== fenerSuruk.id) return;
    const s = fenerSuruk;
    fenerSuruk = null;
    if (!s.tasindi) evreAyarla((evre + 1) % 3);
  };
  fenerBtn.addEventListener("pointerup", fenerBitir);
  fenerBtn.addEventListener("pointercancel", () => (fenerSuruk = null));
  fenerBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      sahne.etkilesimIsaretle();
      evreAyarla((evre + 1) % 3);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      sahne.etkilesimIsaretle();
      evreAyarla(evre + 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      sahne.etkilesimIsaretle();
      evreAyarla(evre - 1);
    }
  });

  let rayTut = null;
  let raySuruklendi = false;
  const raydanEvre = (clientY) => {
    const r = ray.getBoundingClientRect();
    const oran = sinirla((clientY - r.top) / Math.max(1, r.height), 0, 1);
    return Math.round((1 - oran) * 2);
  };
  ray.addEventListener("pointerdown", (e) => {
    if (e.button && e.button !== 0) return;
    rayTut = { id: e.pointerId, y0: e.clientY };
    raySuruklendi = false;
  });
  ray.addEventListener("pointermove", (e) => {
    if (!rayTut || rayTut.id !== e.pointerId) return;
    if (!raySuruklendi && Math.abs(e.clientY - rayTut.y0) > 10) {
      raySuruklendi = true;
      sahne.etkilesimIsaretle();
      try {
        ray.setPointerCapture(e.pointerId);
      } catch {

      }
    }
    if (raySuruklendi) evreAyarla(raydanEvre(e.clientY));
  });
  const rayBitir = () => {
    rayTut = null;
    if (raySuruklendi) {
      setTimeout(() => (raySuruklendi = false), 50);
    }
  };
  ray.addEventListener("pointerup", rayBitir);
  ray.addEventListener("pointercancel", rayBitir);

  ciz = (t, dt) => {
    const ctx = sahne.ctx;
    const { g, y } = sahne.boyut();
    if (!ctx || !g || !y) return;
    ctx.clearRect(0, 0, g, y);

    const fx = FENER_X * g;
    const fy = FENER_Y * y;
    const lx = LAMBA_X * g;
    const ly = LAMBA_Y * y;
    const e = gorunenEvre;
    const aisenOran = sinirla(e, 0, 1);
    const tacOran = sinirla(e - 1, 0, 1);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    const rHale = Math.min(g, y) * (0.14 + 0.14 * e) * (az ? 1 : 0.94 + 0.06 * Math.sin(t * 3.2));
    const hale = ctx.createRadialGradient(fx, fy, 0, fx, fy, rHale);
    hale.addColorStop(0, "rgba(255, 232, 186, 0.45)");
    hale.addColorStop(0.45, "rgba(224, 162, 106, 0.16)");
    hale.addColorStop(1, "rgba(224, 162, 106, 0)");
    ctx.globalAlpha = 0.45 + 0.25 * e;
    ctx.fillStyle = hale;
    ctx.beginPath();
    ctx.arc(fx, fy, rHale, 0, IKI_PI);
    ctx.fill();

    if (aisenOran > 0.05) {
      for (let i = 0; i < 3; i++) {
        const aci = (az ? 0 : t * 0.55) + (i * IKI_PI) / 3 - Math.PI / 2;
        const rYorunge = Math.min(g, y) * (0.15 - 0.04 * tacOran);
        const px = fx + Math.cos(aci) * rYorunge;
        const py = fy + Math.sin(aci) * rYorunge * 0.85;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.PI / 4);
        ctx.globalAlpha = aisenOran * (0.85 - 0.25 * tacOran);
        ctx.fillStyle = SICAK;
        ctx.fillRect(-3, -3, 6, 6);
        ctx.restore();
      }
    }

    IZLER.forEach(([ix, iy], i) => {
      const px = ix * g;
      const py = iy * y;
      const parlak = az ? 0.65 : 0.35 + 0.3 * Math.sin(t * 1.9 + i);
      isikNoktasiCiz(ctx, px, py, 1.8, SICAK, parlak * (0.4 + 0.5 * aisenOran));
      if (tacOran > 0.05) {
        ctx.strokeStyle = SICAK;
        ctx.lineWidth = 1.1;
        ctx.globalAlpha = tacOran * 0.46;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(ara(px, fx, tacOran), ara(py, fy, tacOran));
        ctx.stroke();
      }
    });

    if (tacOran > 0.04) {

      const titre = az ? 1 : 0.9 + 0.1 * Math.sin(t * 6.5);
      const rLamba = Math.min(g, y) * 0.15 * tacOran * titre;
      const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, rLamba);
      lg.addColorStop(0, "rgba(255, 248, 226, 0.95)");
      lg.addColorStop(0.28, "rgba(255, 210, 154, 0.52)");
      lg.addColorStop(1, "rgba(224, 162, 106, 0)");
      ctx.globalAlpha = tacOran;
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.arc(lx, ly, rLamba, 0, IKI_PI);
      ctx.fill();

      const civi = 18 * tacOran * titre;
      ctx.strokeStyle = "#fff8eb";
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = tacOran * 0.82;
      ctx.beginPath();
      ctx.moveTo(lx - civi, ly);
      ctx.lineTo(lx + civi, ly);
      ctx.moveTo(lx, ly - civi * 0.85);
      ctx.lineTo(lx, ly + civi * 0.85);
      ctx.stroke();
    }

    ctx.restore();
    sahne.darbeCiz(dt);
  };

  evreAyarla(evre);

  return {
    adim(t) {
      const dt = sonT > 0 ? sinirla(t - sonT, 0, 0.06) : 0.016;
      sonT = t;
      if (!az) gorunenEvre += (evre - gorunenEvre) * Math.min(1, dt * 6.5);
      else gorunenEvre = evre;
      ciz(t, dt);
    },
    darbe(x, y, nx, ny) {
      sahne.darbe(x, y, nx, ny);
    },
    yokEt() {
      sahne.yokEt();
    },
  };
}

const tiklanabilirsiz = (kur, seciciler) => (kok) => {
  const sahne = kur(kok);
  kok.querySelectorAll(seciciler).forEach((el) => el.remove());
  kok.classList.add("krl-etkilesimsiz");
  return sahne;
};

export default {
  ates,
  gorev: tiklanabilirsiz(gorev, ".krl-orman-hedef, .krl-isci-tut, .krl-alt .krl-ipucu"),
  kis: tiklanabilirsiz(kis, ".krl-ev-hedef"),
  lider: tiklanabilirsiz(lider, ".krl-lider-isik, .krl-balon, .krl-alt .krl-ipucu"),
  merdiven,
};
