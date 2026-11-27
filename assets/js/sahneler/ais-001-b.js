import { el, svg, CIZGI, RENK } from "../lib/svg.js?v=20261127a";
import { tohumlu, azHareket } from "../lib/rastgele.js?v=20261127a";

const NGC_YOL = "/assets/img/gozlem/ngc7000-1000.jpg";
const GRAXPERT_VERI_YOL = "/assets/data/ais001-graxpert.json";

const sinirla = (v, a, b) => Math.max(a, Math.min(b, v));
const gaus = (x, m, s) => Math.exp(-((x - m) ** 2) / (2 * s * s));

export const yuzdeTr = (v, hane = 1) => `%${Number(v).toFixed(hane).replace(".", ",")}`;

let ngcSozu = null;
function ngcResimGetir() {
  if (!ngcSozu) {
    ngcSozu = new Promise((coz, red) => {
      const img = new Image();
      img.decoding = "async";
      img.src = NGC_YOL;
      const tamam = () => {
        if (img.naturalWidth > 0) coz(img);
        else red(new Error("NGC 7000 görseli boş döndü"));
      };
      if (img.complete && img.naturalWidth > 0) {
        coz(img);
      } else if (typeof img.decode === "function") {
        img.decode().then(tamam, () => {
          img.onload = tamam;
          img.onerror = () => red(new Error("NGC 7000 yüklenemedi"));
        });
      } else {
        img.onload = tamam;
        img.onerror = () => red(new Error("NGC 7000 yüklenemedi"));
      }
    });
  }
  return ngcSozu;
}

let graxpertSozu = null;
function graxpertVeriGetir() {
  if (!graxpertSozu) {
    graxpertSozu = fetch(GRAXPERT_VERI_YOL).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });
  }
  return graxpertSozu;
}

export function destekHesapla(tabanDuzey) {
  const p = sinirla(Number(tabanDuzey) || 0, 0, 0.34);
  const oran = sinirla(0.34 + p * 2.64, 0, 1);
  return { taban: p, oran, doydu: oran >= 0.995 };
}

export function rYanit(nm) {
  return 0.54 + 0.42 * gaus(nm, 657, 28);
}

export function kirmiziKarisimHesapla(niiDuzey, siiDuzey) {
  const nii = sinirla(Number(niiDuzey) || 0, 0, 1);
  const sii = sinirla(Number(siiDuzey) || 0, 0, 1);
  const haSabit = 0.88;
  const haKatki = haSabit * rYanit(CIZGI.ha.nm);

  const niiKatki = (0.33 * nii * rYanit(CIZGI.nii1.nm)) + (0.96 * nii * rYanit(CIZGI.nii2.nm));
  const siiKatki = (0.48 * sii * rYanit(CIZGI.sii1.nm)) + (0.36 * sii * rYanit(CIZGI.sii2.nm));
  const toplam = haKatki + niiKatki + siiKatki;
  const maksToplam = haSabit * rYanit(656.3) + 1.29 * rYanit(658.3) + 0.84 * rYanit(672.3);
  const cubukOran = sinirla(toplam / maksToplam, 0, 1);
  const haOran = sinirla(haKatki / maksToplam, 0, 1);
  const sizintiPayi = toplam > 0 ? (niiKatki + siiKatki) / toplam : 0;

  const abstain = nii >= 0.22 || sii >= 0.36 || sizintiPayi >= 0.20;
  return {
    nii,
    sii,
    haSabit,
    haKatki,
    niiKatki,
    siiKatki,
    toplam,
    cubukOran,
    haOran,
    sizintiPayi,
    abstain,
  };
}

const KOSUL_META = {
  "noise-low": { kisa: "G·D", aile: "G", aileAd: "Yalnız gürültü" },
  "noise-mid": { kisa: "G·O", aile: "G", aileAd: "Yalnız gürültü" },
  "noise-high": { kisa: "G·Y", aile: "G", aileAd: "Yalnız gürültü" },
  "continuum-low": { kisa: "C·D", aile: "C", aileAd: "Continuum" },
  "continuum-high": { kisa: "C·Y", aile: "C", aileAd: "Continuum" },
  "nii-low": { kisa: "N·D", aile: "N", aileAd: "[N II]" },
  "nii-high": { kisa: "N·Y", aile: "N", aileAd: "[N II]" },
  "sii-low": { kisa: "S·D", aile: "S", aileAd: "[S II]" },
  "sii-high": { kisa: "S·Y", aile: "S", aileAd: "[S II]" },
  "combined-low-noise": { kisa: "B·D", aile: "B", aileAd: "Birleşik" },
  "combined-mid-noise": { kisa: "B·O", aile: "B", aileAd: "Birleşik" },
  "combined-high-noise": { kisa: "B·Y", aile: "B", aileAd: "Birleşik" },
};

const SAHNE_SATIRLARI = [
  { satir: 0, morfoloji: "genis", morfolojiAd: "Geniş yapı", ornek: 1 },
  { satir: 1, morfoloji: "genis", morfolojiAd: "Geniş yapı", ornek: 2 },
  { satir: 2, morfoloji: "filament", morfolojiAd: "İnce filament", ornek: 1 },
  { satir: 3, morfoloji: "filament", morfolojiAd: "İnce filament", ornek: 2 },
];

export function kirkSekizMatrisKur(jsonVeri) {
  if (!jsonVeri || !Array.isArray(jsonVeri.kosullar) || jsonVeri.kosullar.length !== 12) {
    throw new Error("Beklenen 12 koşul dizisi bulunamadı");
  }
  const maksHa = Math.max(...jsonVeri.kosullar.map((k) => Number(k.Ha) || 0), 1);
  const kosullar = jsonVeri.kosullar.map((k, sutun) => {
    const meta = KOSUL_META[k.id] || { kisa: `K${sutun + 1}`, aile: "K", aileAd: k.ad };
    const ha = Number(k.Ha);
    const oiii = Number(k.OIII);
    const hb = Number(k.Hb);
    if (!Number.isFinite(ha) || !Number.isFinite(oiii) || !Number.isFinite(hb)) {
      throw new Error(`Geçersiz sayısal değer: ${k.id}`);
    }
    return {
      sutun,
      id: k.id,
      ad: k.ad,
      kisa: meta.kisa,
      aile: meta.aile,
      aileAd: meta.aileAd,
      Ha: ha,
      OIII: oiii,
      Hb: hb,
      haYogunluk: sinirla(ha / maksHa, 0, 1),
      aileBasi: sutun > 0 && meta.aile !== (KOSUL_META[jsonVeri.kosullar[sutun - 1].id]?.aile || ""),
    };
  });

  const karolar48 = [];
  for (const k of kosullar) {
    for (const sr of SAHNE_SATIRLARI) {
      karolar48.push({
        indeks: k.sutun * 4 + sr.satir,
        sutun: k.sutun,
        satir: sr.satir,
        kosulId: k.id,
        morfoloji: sr.morfoloji,
        morfolojiAd: sr.morfolojiAd,
        ornek: sr.ornek,
        Ha: k.Ha,
        OIII: k.OIII,
        Hb: k.Hb,
      });
    }
  }

  const bul = (id) => kosullar.find((k) => k.id === id) || null;
  const vurgular = [
    { kosul: bul("noise-low"), etiket: "yalnız gürültü", renk: RENK.ha },
    { kosul: bul("nii-high"), etiket: "yüksek [N II]", renk: RENK.toz },
    { kosul: bul("combined-low-noise"), etiket: "birleşik · düşük", renk: RENK.toz },
  ].filter((v) => v.kosul);

  return {
    kaynak: jsonVeri.kaynak || "",
    maksHa,
    kosullar,
    karolar48,
    vurgular,
  };
}

export function perdeVeKaroHesapla(nx, ny, perdeOran = 0.5, izgara = 10) {
  const p = sinirla(Number(perdeOran), 0.06, 0.94);
  const ux = sinirla(Number(nx), 0, 0.999999);
  const uy = sinirla(Number(ny), 0, 0.999999);
  const sutun = Math.floor(ux * izgara);
  const satir = Math.floor(uy * izgara);
  const karoNo = satir * izgara + sutun + 1;
  const merkezX = (sutun + 0.5) / izgara;
  const taraf = merkezX >= p ? "sonra" : "once";
  return { perdeOran: p, sutun, satir, karoNo, taraf };
}

export function yumusatBilateral(kaynak, genislik, yukseklik, renkSigma = 26) {
  const cikti = new Uint8ClampedArray(kaynak.length);
  const invIkiSigma2 = 1 / (2 * renkSigma * renkSigma);
  const ofsetler = [
    [-1, 0, 0.65], [1, 0, 0.65], [0, -1, 0.65], [0, 1, 0.65],
    [-1, -1, 0.4], [1, -1, 0.4], [-1, 1, 0.4], [1, 1, 0.4],
    [-2, 0, 0.28], [2, 0, 0.28], [0, -2, 0.28], [0, 2, 0.28],
  ];
  for (let y = 0; y < yukseklik; y++) {
    for (let x = 0; x < genislik; x++) {
      const idx = (y * genislik + x) * 4;
      const r0 = kaynak[idx];
      const g0 = kaynak[idx + 1];
      const b0 = kaynak[idx + 2];
      let sr = r0;
      let sg = g0;
      let sb = b0;
      let sw = 1;
      for (let k = 0; k < ofsetler.length; k++) {
        const nx = sinirla(x + ofsetler[k][0], 0, genislik - 1);
        const ny = sinirla(y + ofsetler[k][1], 0, yukseklik - 1);
        const ni = (ny * genislik + nx) * 4;
        const dr = kaynak[ni] - r0;
        const dg = kaynak[ni + 1] - g0;
        const db = kaynak[ni + 2] - b0;
        const fark2 = dr * dr * 0.35 + dg * dg * 0.45 + db * db * 0.2;
        const w = ofsetler[k][2] * Math.exp(-fark2 * invIkiSigma2);
        sr += kaynak[ni] * w;
        sg += kaynak[ni + 1] * w;
        sb += kaynak[ni + 2] * w;
        sw += w;
      }
      cikti[idx] = sr / sw;
      cikti[idx + 1] = sg / sw;
      cikti[idx + 2] = sb / sw;
      cikti[idx + 3] = 255;
    }
  }
  return cikti;
}

function egimBagla(kap, hedefEl, derece = 3.6) {
  let rx = 0;
  let ry = 0;
  let hedefRx = 0;
  let hedefRy = 0;
  let kutu = null;

  const giris = (e) => {
    if (e.pointerType === "touch" || azHareket()) return;
    kutu = kap.getBoundingClientRect();
  };
  const hareket = (e) => {
    if (e.pointerType === "touch" || azHareket()) return;
    if (!kutu) kutu = kap.getBoundingClientRect();
    if (!kutu.width || !kutu.height) return;
    const nx = sinirla(((e.clientX - kutu.left) / kutu.width) * 2 - 1, -1, 1);
    const ny = sinirla(((e.clientY - kutu.top) / kutu.height) * 2 - 1, -1, 1);
    hedefRy = nx * derece;
    hedefRx = -ny * (derece * 0.75);
  };
  const cikis = () => {
    hedefRx = 0;
    hedefRy = 0;
    kutu = null;
  };
  const kutuSifirla = () => {
    kutu = null;
  };

  kap.addEventListener("pointerenter", giris, { passive: true });
  kap.addEventListener("pointermove", hareket, { passive: true });
  kap.addEventListener("pointerleave", cikis, { passive: true });
  window.addEventListener("resize", kutuSifirla, { passive: true });

  return {
    guncelle() {
      if (azHareket()) return;
      rx += (hedefRx - rx) * 0.09;
      ry += (hedefRy - ry) * 0.09;
      if (Math.abs(rx) < 0.01 && Math.abs(hedefRx) < 0.01) rx = 0;
      if (Math.abs(ry) < 0.01 && Math.abs(hedefRy) < 0.01) ry = 0;
      hedefEl.style.setProperty("--egim-x", `${rx.toFixed(2)}deg`);
      hedefEl.style.setProperty("--egim-y", `${ry.toFixed(2)}deg`);
    },
    yokEt() {
      kap.removeEventListener("pointerenter", giris);
      kap.removeEventListener("pointermove", hareket);
      kap.removeEventListener("pointerleave", cikis);
      window.removeEventListener("resize", kutuSifirla);
    },
  };
}

function taban(kok) {
  const N = 128;
  const KESIT_Y_ORAN = 0.56;
  const FOTO_ORAN = 1000 / 580;
  const FOTO_KONUM_Y = 0.62;

  const profil = {
    ha: new Float32Array(N),
    oiii: new Float32Array(N),
    hb: new Float32Array(N),
  };
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);
    const kita = 0.72 * gaus(u, 0.21, 0.075) * (1 - 0.55 * gaus(u, 0.30, 0.028));
    const duvar = 0.84 * gaus(u, 0.35, 0.025);
    const bulut = 0.34 * gaus(u, 0.52, 0.045);
    profil.ha[i] = sinirla(kita + duvar + bulut, 0, 0.92);
    profil.oiii[i] = sinirla(kita * 0.46 + duvar * 0.34 + bulut * 0.22, 0, 0.65);
    profil.hb[i] = sinirla(kita * 0.58 + duvar * 0.42 + bulut * 0.24, 0, 0.72);
  }

  kok.innerHTML = `
    <div class="tbn-kap">
      <div class="tbn-duzlem">
        <div class="tbn-foto-alan" role="slider" tabindex="0" aria-label="Ortak taban düzeyi" aria-valuemin="0" aria-valuemax="34" aria-valuenow="28">
          <div class="tbn-foto-maske">
            <img class="tbn-foto" src="${NGC_YOL}" alt="NGC 7000 · Kuzey Amerika Bulutsusu" decoding="async" draggable="false">
            <span class="tbn-kesit-hat" aria-hidden="true"></span>
            <span class="tbn-imlec-dikey" aria-hidden="true"></span>
            <span class="tbn-perde" aria-hidden="true"></span>
          </div>
          <div class="tbn-perde-tutamac" aria-hidden="true">
            <span class="tbn-tutamac-cizgi"></span>
            <span class="tbn-tutamac-etiket veri">ORTAK TABAN <b data-tbn-etiket>+0.28</b></span>
          </div>
          <span class="tbn-foto-etiket veri" aria-hidden="true">NGC 7000 · 16 EYLÜL</span>
        </div>

        <div class="tbn-alt-izgara">
          <div class="tbn-profil-kap">
            <canvas class="tbn-tuval" aria-hidden="true"></canvas>
          </div>
          <div class="tbn-destek" aria-label="Bulutsu destek ölçeri">
            <span class="tbn-doydu veri" data-tbn-doydu>DOYDU</span>
            <div class="tbn-olcer-ray">
              <div class="tbn-olcer-dolgu" data-tbn-dolgu></div>
              <span class="tbn-olcer-isaret" aria-hidden="true"></span>
            </div>
            <span class="tbn-olcer-deger veri" data-tbn-oran>1.00</span>
            <span class="tbn-olcer-ad veri">destek</span>
          </div>
        </div>
      </div>

      <div class="tbn-hud veri">
        <span class="tbn-okuma" data-tbn-okuma>16 EYLÜL · GERÇEK KESİT · ORTAK TABAN +0.28 (TEMSİLÎ)</span>
        <span class="tbn-ipucu" data-tbn-ipucu>PERDEYİ DİKEY SÜRÜKLE</span>
      </div>
    </div>`;

  const kap = kok.querySelector(".tbn-kap");
  const duzlem = kok.querySelector(".tbn-duzlem");
  const fotoAlan = kok.querySelector(".tbn-foto-alan");
  const tutamac = kok.querySelector(".tbn-perde-tutamac");
  const perdeEl = kok.querySelector(".tbn-perde");
  const imlecDikey = kok.querySelector(".tbn-imlec-dikey");
  const etiketDeger = kok.querySelector("[data-tbn-etiket]");
  const doyduEl = kok.querySelector("[data-tbn-doydu]");
  const dolguEl = kok.querySelector("[data-tbn-dolgu]");
  const oranEl = kok.querySelector("[data-tbn-oran]");
  const okumaEl = kok.querySelector("[data-tbn-okuma]");
  const ipucuEl = kok.querySelector("[data-tbn-ipucu]");
  const destekAlan = kok.querySelector(".tbn-destek");
  const profilKap = kok.querySelector(".tbn-profil-kap");
  const tuval = kok.querySelector(".tbn-tuval");
  const ctx = tuval.getContext("2d");

  let anlikTaban = azHareket() ? 0.30 : 0.04;
  let hedefTaban = azHareket() ? 0.30 : 0.28;
  let elleDegisti = false;
  let surukleniyor = false;
  let kesitX = 0.35;
  let kesitAktif = false;
  let gercekOrneklendi = false;
  let sonDoydu = false;
  let darbeGuc = 0;
  let darbeX = 0.5;
  let sonCizilenT = 0;
  let tuvalG = 420;
  let tuvalY = 176;
  let kutuFoto = null;
  let kutuDestek = null;
  let yokEdildi = false;

  const egim = egimBagla(kap, duzlem, 3.2);

  const gercekKesitOrnekle = (img) => {
    const ow = 160;
    const oh = Math.max(40, Math.round((img.naturalHeight / img.naturalWidth) * ow));
    const ara = document.createElement("canvas");
    ara.width = ow;
    ara.height = oh;
    const ac = ara.getContext("2d", { willReadFrequently: true });
    ac.drawImage(img, 0, 0, ow, oh);
    const data = ac.getImageData(0, 0, ow, oh).data;

    const gorunenH = ow / FOTO_ORAN;
    const tasmaH = Math.max(0, oh - gorunenH);
    const ustY = tasmaH * FOTO_KONUM_Y;
    const merkezY = sinirla(Math.round(ustY + KESIT_Y_ORAN * gorunenH), 4, oh - 5);

    const hamR = new Float32Array(N);
    const hamG = new Float32Array(N);
    const hamB = new Float32Array(N);
    const havuzR = [];
    const havuzG = [];
    const havuzB = [];

    for (let i = 0; i < N; i++) {
      const px = sinirla(Math.round((i / (N - 1)) * (ow - 1)), 1, ow - 2);
      havuzR.length = 0;
      havuzG.length = 0;
      havuzB.length = 0;
      for (let dy = -4; dy <= 4; dy++) {
        const py = sinirla(merkezY + dy, 0, oh - 1);
        for (let dx = -1; dx <= 1; dx++) {
          const p = (py * ow + sinirla(px + dx, 0, ow - 1)) * 4;
          havuzR.push(data[p] / 255);
          havuzG.push(data[p + 1] / 255);
          havuzB.push(data[p + 2] / 255);
        }
      }
      havuzR.sort((a, b) => a - b);
      havuzG.sort((a, b) => a - b);
      havuzB.sort((a, b) => a - b);

      const k = Math.floor(havuzR.length * 0.35);
      hamR[i] = havuzR[k];
      hamG[i] = havuzG[k];
      hamB[i] = havuzB[k];
    }

    const tabanAl = (dizi) => {
      const sirali = Array.from(dizi).sort((a, b) => a - b);
      return sirali[Math.floor(sirali.length * 0.12)];
    };
    const tR = tabanAl(hamR);
    const tG = tabanAl(hamG);
    const tB = tabanAl(hamB);

    let maksR = 0.08;
    for (let i = 0; i < N; i++) maksR = Math.max(maksR, hamR[i] - tR);
    const olcek = 0.86 / maksR;

    for (let i = 0; i < N; i++) {

      const i0 = Math.max(0, i - 1);
      const i2 = Math.min(N - 1, i + 1);
      const r = ((hamR[i0] + hamR[i] * 2 + hamR[i2]) * 0.25 - tR) * olcek;
      const g = ((hamG[i0] + hamG[i] * 2 + hamG[i2]) * 0.25 - tG) * olcek;
      const b = ((hamB[i0] + hamB[i] * 2 + hamB[i2]) * 0.25 - tB) * olcek;
      profil.ha[i] = sinirla(r, 0, 0.92);
      profil.oiii[i] = sinirla(g, 0, 0.82);
      profil.hb[i] = sinirla(b, 0, 0.85);
    }
    gercekOrneklendi = true;
    ciz(sonCizilenT);
  };

  ngcResimGetir()
    .then((img) => {
      if (!yokEdildi) gercekKesitOrnekle(img);
    })
    .catch(() => {});

  const boyutlandir = () => {
    const g = Math.max(180, Math.round(profilKap.clientWidth || 420));
    const y = Math.max(150, Math.round(profilKap.clientHeight || 176));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (tuval.width !== Math.round(g * dpr) || tuval.height !== Math.round(y * dpr)) {
      tuval.width = Math.round(g * dpr);
      tuval.height = Math.round(y * dpr);
    }
    tuvalG = g;
    tuvalY = y;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ciz(sonCizilenT);
  };

  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(boyutlandir) : null;
  ro?.observe(profilKap);

  const kanallar = [
    { anahtar: "ha", ad: "Hα", renk: "#ff4f61", hale: "rgba(255, 79, 97, 0.34)" },
    { anahtar: "oiii", ad: "[O III]", renk: "#45d6c8", hale: "rgba(69, 214, 200, 0.30)" },
    { anahtar: "hb", ad: "Hβ", renk: "#8aa2ff", hale: "rgba(138, 162, 255, 0.30)" },
  ];

  function ciz(t = 0) {
    sonCizilenT = t;
    const { taban: p, oran, doydu } = destekHesapla(anlikTaban);

    const perdeYuzde = (p / 0.34) * 58;
    perdeEl.style.setProperty("--taban-y", `${perdeYuzde.toFixed(2)}%`);
    perdeEl.style.setProperty("--taban-op", (0.12 + (p / 0.34) * 0.56).toFixed(3));
    tutamac.style.setProperty("--taban-y", `${perdeYuzde.toFixed(2)}%`);
    etiketDeger.textContent = `+${p.toFixed(2)}`;
    fotoAlan.setAttribute("aria-valuenow", String(Math.round(p * 100)));

    imlecDikey.style.setProperty("--kx", `${(kesitX * 100).toFixed(2)}%`);
    fotoAlan.classList.toggle("kesit-aktif", kesitAktif);

    dolguEl.style.setProperty("--dolgu", oran.toFixed(4));
    oranEl.textContent = oran.toFixed(2);
    kok.classList.toggle("doydu", doydu);
    doyduEl.classList.toggle("gorunur", doydu);
    if (doydu && !sonDoydu) {
      sonDoydu = true;
    } else if (!doydu) {
      sonDoydu = false;
    }

    const kaynakTag = gercekOrneklendi ? "GERÇEK KESİT" : "KESİT";
    okumaEl.textContent = p > 0.03
      ? `16 EYLÜL · ${kaynakTag} · ORTAK TABAN +${p.toFixed(2)} (TEMSİLÎ)`
      : `16 EYLÜL · ${kaynakTag} · TABAN TEMİZ (+0.00) · YAPI AYRILDI`;

    const g = tuvalG;
    const y = tuvalY;
    ctx.clearRect(0, 0, g, y);

    const padSol = 4;
    const padSag = 6;
    const cizG = g - padSol - padSag;
    const seritH = y / 3;

    const imlecPx = padSol + kesitX * cizG;
    ctx.save();
    ctx.strokeStyle = kesitAktif ? "rgba(236, 232, 225, 0.28)" : "rgba(236, 232, 225, 0.1)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(imlecPx, 4);
    ctx.lineTo(imlecPx, y - 4);
    ctx.stroke();
    ctx.restore();

    for (let k = 0; k < 3; k++) {
      const kn = kanallar[k];
      const dizi = profil[kn.anahtar];
      const altY = Math.round((k + 1) * seritH - 8);
      const genlik = seritH - 18;
      const tabanPx = p * genlik * 1.12;

      ctx.strokeStyle = "rgba(236, 232, 225, 0.11)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padSol, altY + 0.5);
      ctx.lineTo(padSol + cizG, altY + 0.5);
      ctx.stroke();

      if (tabanPx > 0.5) {
        const tGrad = ctx.createLinearGradient(0, altY - tabanPx, 0, altY);
        tGrad.addColorStop(0, "rgba(224, 162, 106, 0.34)");
        tGrad.addColorStop(1, "rgba(224, 162, 106, 0.08)");
        ctx.fillStyle = tGrad;
        ctx.fillRect(padSol, altY - tabanPx, cizG, tabanPx);

        ctx.strokeStyle = "rgba(224, 162, 106, 0.52)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padSol, altY - tabanPx);
        ctx.lineTo(padSol + cizG, altY - tabanPx);
        ctx.stroke();
      }

      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const u = i / (N - 1);
        const px = padSol + u * cizG;
        const dalga = darbeGuc > 0.01
          ? Math.sin((u - darbeX) * 28 - t * 18) * Math.exp(-Math.abs(u - darbeX) * 5) * darbeGuc * 0.09
          : 0;
        const v = sinirla(dizi[i] + p * 1.12 + dalga, 0, 1.15);
        const py = altY - v * genlik;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }

      ctx.save();
      ctx.lineTo(padSol + cizG, altY);
      ctx.lineTo(padSol, altY);
      ctx.closePath();
      const alanGrad = ctx.createLinearGradient(0, altY - genlik, 0, altY);
      alanGrad.addColorStop(0, kn.hale);
      alanGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = alanGrad;
      ctx.fill();
      ctx.restore();

      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = kn.hale;
      ctx.lineWidth = 4.2;
      ctx.lineJoin = "round";
      ctx.stroke();

      ctx.strokeStyle = kn.renk;
      ctx.lineWidth = 1.45;
      ctx.stroke();

      const idx = sinirla(Math.round(kesitX * (N - 1)), 0, N - 1);
      const noktaV = sinirla(dizi[idx] + p * 1.12, 0, 1.15);
      const noktaY = altY - noktaV * genlik;
      ctx.fillStyle = kn.renk;
      ctx.beginPath();
      ctx.arc(imlecPx, noktaY, kesitAktif ? 3.2 : 2.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.font = '500 10px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillStyle = kn.renk;
      ctx.fillText(kn.ad, padSol + 2, altY - genlik + 10);
    }
  }

  const etkilesimIsaretle = () => {
    if (elleDegisti) return;
    elleDegisti = true;
    kok.classList.add("etkilesildi");
    ipucuEl.classList.add("soluk");
  };

  const tabanGuncelle = (clientY, kaynakKutu, tamYukseklik = false) => {
    if (!kaynakKutu || !kaynakKutu.height) return;
    const alttanOran = (kaynakKutu.bottom - clientY) / kaynakKutu.height;
    const olcekli = tamYukseklik ? alttanOran : alttanOran / 0.56;
    hedefTaban = sinirla(olcekli, 0, 1) * 0.34;
    if (azHareket()) {
      anlikTaban = hedefTaban;
      ciz(sonCizilenT);
    }
  };

  const fotoBas = (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    kutuFoto = fotoAlan.getBoundingClientRect();
    const tutamacTik = Boolean(e.target instanceof Element && e.target.closest(".tbn-perde-tutamac"));

    if (e.pointerType === "touch" && !tutamacTik) {
      kesitX = sinirla((e.clientX - kutuFoto.left) / kutuFoto.width, 0.02, 0.98);
      kesitAktif = true;
      etkilesimIsaretle();
      ciz(sonCizilenT);
      return;
    }
    e.preventDefault();
    surukleniyor = true;
    etkilesimIsaretle();
    kok.classList.add("surukleniyor");
    fotoAlan.setPointerCapture?.(e.pointerId);
    kesitX = sinirla((e.clientX - kutuFoto.left) / kutuFoto.width, 0.02, 0.98);
    kesitAktif = true;
    tabanGuncelle(e.clientY, kutuFoto, false);
  };

  const fotoHareket = (e) => {
    if (!kutuFoto) kutuFoto = fotoAlan.getBoundingClientRect();
    if (!kutuFoto.width) return;
    if (e.pointerType !== "touch" || surukleniyor) {
      kesitX = sinirla((e.clientX - kutuFoto.left) / kutuFoto.width, 0.02, 0.98);
      kesitAktif = true;
    }
    if (surukleniyor) {
      tabanGuncelle(e.clientY, kutuFoto, false);
    } else if (azHareket()) {
      ciz(sonCizilenT);
    }
  };

  const fotoBitir = (e) => {
    if (!surukleniyor) return;
    surukleniyor = false;
    kok.classList.remove("surukleniyor");
    if (e?.pointerId != null) fotoAlan.releasePointerCapture?.(e.pointerId);
  };

  const fotoCik = () => {
    if (!surukleniyor) {
      kesitAktif = false;
      kutuFoto = null;
      if (azHareket()) ciz(sonCizilenT);
    }
  };

  let destekSuruk = false;
  const destekBas = (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    kutuDestek = destekAlan.getBoundingClientRect();
    destekSuruk = true;
    etkilesimIsaretle();
    kok.classList.add("surukleniyor");
    destekAlan.setPointerCapture?.(e.pointerId);
    tabanGuncelle(e.clientY, kutuDestek, true);
  };
  const destekHareket = (e) => {
    if (!destekSuruk) return;
    tabanGuncelle(e.clientY, kutuDestek, true);
  };
  const destekBitir = (e) => {
    if (!destekSuruk) return;
    destekSuruk = false;
    kok.classList.remove("surukleniyor");
    if (e?.pointerId != null) destekAlan.releasePointerCapture?.(e.pointerId);
  };

  const klavye = (e) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    etkilesimIsaretle();
    hedefTaban = sinirla(hedefTaban + (e.key === "ArrowUp" ? 0.04 : -0.04), 0, 0.34);
    if (azHareket()) {
      anlikTaban = hedefTaban;
      ciz(sonCizilenT);
    }
  };

  fotoAlan.addEventListener("pointerdown", fotoBas);
  fotoAlan.addEventListener("pointermove", fotoHareket);
  fotoAlan.addEventListener("pointerup", fotoBitir);
  fotoAlan.addEventListener("pointercancel", fotoBitir);
  fotoAlan.addEventListener("pointerleave", fotoCik);
  fotoAlan.addEventListener("keydown", klavye);

  destekAlan.addEventListener("pointerdown", destekBas);
  destekAlan.addEventListener("pointermove", destekHareket);
  destekAlan.addEventListener("pointerup", destekBitir);
  destekAlan.addEventListener("pointercancel", destekBitir);

  boyutlandir();

  return {
    adim(t) {
      egim.guncelle();
      if (!elleDegisti && !azHareket()) {

        const acilis = sinirla(t / 1.85, 0, 1);
        const yumusak = 1 - Math.pow(1 - acilis, 3);
        hedefTaban = 0.04 + yumusak * 0.24;
        if (t > 0.8 && t < 3.4) kok.classList.add("nefes");
        else kok.classList.remove("nefes");
      } else {
        kok.classList.remove("nefes");
      }

      if (azHareket()) {
        anlikTaban = hedefTaban;
      } else {
        anlikTaban += (hedefTaban - anlikTaban) * 0.14;
      }
      if (darbeGuc > 0.005) darbeGuc *= 0.91;
      else darbeGuc = 0;
      ciz(t);
    },
    darbe(x, _y, _nx, ny) {
      if (azHareket()) return;
      const r = kok.getBoundingClientRect();
      darbeX = r.width ? sinirla((x - r.left) / r.width, 0.05, 0.95) : 0.5;
      darbeGuc = 1;
      if (!surukleniyor && !destekSuruk) {
        anlikTaban = sinirla(anlikTaban + (ny < 0 ? 0.03 : -0.025), 0, 0.34);
      }
      kok.classList.remove("darbe-parla");
      void kok.offsetWidth;
      kok.classList.add("darbe-parla");
    },
    yokEt() {
      yokEdildi = true;
      ro?.disconnect();
      egim.yokEt();
      fotoAlan.removeEventListener("pointerdown", fotoBas);
      fotoAlan.removeEventListener("pointermove", fotoHareket);
      fotoAlan.removeEventListener("pointerup", fotoBitir);
      fotoAlan.removeEventListener("pointercancel", fotoBitir);
      fotoAlan.removeEventListener("pointerleave", fotoCik);
      fotoAlan.removeEventListener("keydown", klavye);
      destekAlan.removeEventListener("pointerdown", destekBas);
      destekAlan.removeEventListener("pointermove", destekHareket);
      destekAlan.removeEventListener("pointerup", destekBitir);
      destekAlan.removeEventListener("pointercancel", destekBitir);
    },
  };
}

function kirmizi(kok) {
  const NM_A = 640;
  const NM_B = 680;
  const X0 = 34;
  const X1 = 374;
  const TABAN_Y = 240;
  const MAX_H = 166;
  const X = (nm) => X0 + ((nm - NM_A) / (NM_B - NM_A)) * (X1 - X0);

  const kap = document.createElement("div");
  kap.className = "krm-kap";
  const duzlem = document.createElement("div");
  duzlem.className = "krm-duzlem";
  kap.append(duzlem);

  const s = svg(560, 392, duzlem);
  s.classList.add("krm-svg");
  s.setAttribute("aria-hidden", "false");
  s.setAttribute("role", "img");
  s.setAttribute("aria-label", "640-680 nm R kanalı penceresinde Hα, [N II] ve [S II] etkileşimli tayf çizimi");

  const defs = el("defs", {}, s);
  const filtreYap = (id, sapma) => {
    const f = el("filter", { id, x: "-40%", y: "-40%", width: "180%", height: "180%" }, defs);
    el("feGaussianBlur", { stdDeviation: sapma, result: "b" }, f);
    const m = el("feMerge", {}, f);
    el("feMergeNode", { in: "b" }, m);
    el("feMergeNode", { in: "SourceGraphic" }, m);
  };
  filtreYap("krm-glow-ha", 3.6);
  filtreYap("krm-glow-toz", 3.2);
  filtreYap("krm-glow-sii", 3.2);

  const pGrad = el("linearGradient", { id: "krm-pencere-grad", x1: "0", y1: "0", x2: "0", y2: "1" }, defs);
  el("stop", { offset: "0%", "stop-color": "#ff4f61", "stop-opacity": "0.14" }, pGrad);
  el("stop", { offset: "72%", "stop-color": "#ff4f61", "stop-opacity": "0.035" }, pGrad);
  el("stop", { offset: "100%", "stop-color": "#ff4f61", "stop-opacity": "0" }, pGrad);

  const cGrad = el("linearGradient", { id: "krm-cubuk-grad", x1: "0", y1: "0", x2: "0", y2: "1" }, defs);
  el("stop", { offset: "0%", "stop-color": "#ff7381", "stop-opacity": "0.95" }, cGrad);
  el("stop", { offset: "55%", "stop-color": "#ff4f61", "stop-opacity": "0.78" }, cGrad);
  el("stop", { offset: "100%", "stop-color": "#ff4f61", "stop-opacity": "0.28" }, cGrad);

  for (let nm = 640; nm <= 680; nm += 5) {
    const x = X(nm);
    el("line", { x1: x, x2: x, y1: 58, y2: TABAN_Y, stroke: "rgba(236, 232, 225, 0.045)", "stroke-width": 1 }, s);
  }
  for (let nm = 645; nm <= 675; nm += 10) {
    const x = X(nm);
    el("line", { x1: x, x2: x, y1: TABAN_Y, y2: TABAN_Y + 5, stroke: RENK.isik4 }, s);
    el("text", { x, y: TABAN_Y + 22, "text-anchor": "middle", class: "zayif", metin: String(nm) }, s);
  }
  el("text", { x: X1, y: TABAN_Y + 22, "text-anchor": "end", class: "zayif", metin: "nm" }, s);

  let rEgrisi = "";
  let rAlan = `M${X0} ${TABAN_Y}`;
  for (let nm = NM_A; nm <= NM_B; nm += 0.5) {
    const px = X(nm).toFixed(1);
    const py = (TABAN_Y - rYanit(nm) * 156).toFixed(1);
    rEgrisi += `${nm === NM_A ? "M" : "L"}${px} ${py}`;
    rAlan += `L${px} ${py}`;
  }
  rAlan += `L${X1} ${TABAN_Y}Z`;
  el("path", { d: rAlan, fill: "url(#krm-pencere-grad)" }, s);
  const rYolEl = el("path", {
    d: rEgrisi,
    fill: "none",
    stroke: "rgba(255, 79, 97, 0.44)",
    "stroke-dasharray": "3 4",
    "stroke-width": 1.2,
  }, s);
  el("text", { x: X(641.2), y: 74, class: "zayif", metin: "R kanalı" }, s);
  el("text", { x: X(641.2), y: 86, class: "krm-mikro", fill: RENK.isik3, metin: "temsilî eğri" }, s);

  el("line", { x1: X0, x2: X1, y1: TABAN_Y, y2: TABAN_Y, stroke: "rgba(236, 232, 225, 0.24)", "stroke-width": 1 }, s);

  const akisGrup = el("g", { class: "krm-akis" }, s);
  const akisHa = el("path", { fill: "none", stroke: RENK.ha, "stroke-width": 1, opacity: 0.34 }, akisGrup);
  const akisNii = el("path", { fill: "none", stroke: RENK.toz, "stroke-width": 1, opacity: 0.45 }, akisGrup);
  const akisSii = el("path", { fill: "none", stroke: "#c98bd8", "stroke-width": 1, opacity: 0.38 }, akisGrup);

  const yarikYap = (nm, renk, filtreId) => {
    const x = X(nm);
    const g = el("g", {}, s);
    const hale = el("line", {
      x1: x, x2: x, y1: TABAN_Y, y2: TABAN_Y,
      stroke: renk, "stroke-width": 5.5, opacity: 0.28, filter: `url(#${filtreId})`,
    }, g);
    const cekirdek = el("line", {
      x1: x, x2: x, y1: TABAN_Y, y2: TABAN_Y,
      stroke: renk, "stroke-width": 2.2, "stroke-linecap": "round",
    }, g);
    const tabanNokta = el("circle", { cx: x, cy: TABAN_Y, r: 2, fill: renk, opacity: 0.7 }, g);
    return { x, hale, cekirdek, tabanNokta };
  };

  const haYarik = yarikYap(CIZGI.ha.nm, RENK.ha, "krm-glow-ha");
  const nii1Yarik = yarikYap(CIZGI.nii1.nm, RENK.toz, "krm-glow-toz");
  const nii2Yarik = yarikYap(CIZGI.nii2.nm, RENK.toz, "krm-glow-toz");
  const sii1Yarik = yarikYap(CIZGI.sii1.nm, "#c98bd8", "krm-glow-sii");
  const sii2Yarik = yarikYap(CIZGI.sii2.nm, "#c98bd8", "krm-glow-sii");

  const haY2 = TABAN_Y - 0.88 * MAX_H;
  haYarik.hale.setAttribute("y2", haY2.toFixed(1));
  haYarik.cekirdek.setAttribute("y2", haY2.toFixed(1));
  el("circle", { cx: haYarik.x, cy: haY2, r: 3.2, fill: RENK.ha, filter: "url(#krm-glow-ha)" }, s);
  el("line", { x1: haYarik.x, x2: haYarik.x, y1: 54, y2: haY2 - 6, stroke: "rgba(255, 79, 97, 0.32)", "stroke-dasharray": "2 2" }, s);
  el("text", { x: haYarik.x, y: 46, "text-anchor": "end", fill: RENK.ha, class: "koyu", metin: "Hα 656.3" }, s);

  const tutamacYap = (ad, x, renk, aciklama) => {
    const g = el("g", {
      class: "krm-tutamac",
      tabindex: "0",
      role: "slider",
      "aria-label": aciklama,
      "aria-valuemin": "0",
      "aria-valuemax": "100",
      "aria-valuenow": "78",
    }, s);
    el("circle", { cx: x, cy: 0, r: 36, fill: "transparent", class: "krm-vurus" }, g);
    const dis = el("circle", { cx: x, cy: 0, r: 10, fill: "rgba(7, 8, 11, 0.76)", stroke: renk, "stroke-width": 1.35, class: "krm-halka" }, g);
    el("circle", { cx: x, cy: 0, r: 3.1, fill: renk }, g);

    el("path", { d: `M${x - 2.8} -13 L${x} -16.5 L${x + 2.8} -13 M${x - 2.8} 13 L${x} 16.5 L${x + 2.8} 13`, fill: "none", stroke: renk, "stroke-width": 1.1, opacity: 0.85, class: "krm-oklar" }, g);
    const etiket = el("text", {
      x: ad === "[N II]" ? x + 15 : x,
      y: ad === "[N II]" ? 4 : -22,
      "text-anchor": ad === "[N II]" ? "start" : "middle",
      fill: renk,
      class: "koyu",
      metin: ad,
    }, g);
    return { g, dis, etiket, x };
  };

  const niiTutamac = tutamacYap("[N II]", X(CIZGI.nii2.nm) + 4, RENK.toz, "[N II] çizgi katkısını yukarı veya aşağı çek");
  const siiTutamac = tutamacYap("[S II]", (X(CIZGI.sii1.nm) + X(CIZGI.sii2.nm)) / 2, "#c98bd8", "[S II] çizgi katkısını yukarı veya aşağı çek");

  const colX = 446;
  const colW = 56;
  const colY = 66;
  const colH = TABAN_Y - colY;
  el("rect", { x: colX, y: colY, width: colW, height: colH, fill: "rgba(12, 14, 19, 0.34)", stroke: "rgba(236, 232, 225, 0.22)", "stroke-width": 1 }, s);

  for (let i = 1; i <= 4; i++) {
    const ty = TABAN_Y - (i / 5) * colH;
    el("line", { x1: colX + colW + 2, x2: colX + colW + 7, y1: ty, y2: ty, stroke: "rgba(236, 232, 225, 0.2)" }, s);
  }
  const cubukHale = el("rect", { x: colX + 2, width: colW - 4, fill: RENK.ha, opacity: 0.26, filter: "url(#krm-glow-ha)" }, s);
  const cubukAna = el("rect", { x: colX + 2, width: colW - 4, fill: "url(#krm-cubuk-grad)" }, s);
  const cubukUst = el("line", { x1: colX + 2, x2: colX + colW - 2, stroke: "#ff9da7", "stroke-width": 1.6 }, s);

  const haRefY = TABAN_Y - kirmiziKarisimHesapla(0, 0).haOran * (colH - 6);
  el("line", { x1: colX - 5, x2: colX + colW + 5, y1: haRefY, y2: haRefY, stroke: "rgba(236, 232, 225, 0.42)", "stroke-dasharray": "2 2", "stroke-width": 1 }, s);
  el("text", { x: colX - 8, y: haRefY + 3, "text-anchor": "end", fill: RENK.isik3, class: "krm-mikro", metin: "sabit Hα" }, s);
  const sizintiNot = el("text", { x: colX + colW / 2, y: colY - 10, "text-anchor": "middle", fill: RENK.toz, class: "krm-mikro", metin: "" }, s);

  el("text", { x: colX + colW / 2, y: TABAN_Y + 22, "text-anchor": "middle", fill: RENK.isik, metin: "çıktı" }, s);
  el("text", { x: colX + colW / 2, y: TABAN_Y + 36, "text-anchor": "middle", class: "zayif", metin: "Hα eşdeğeri" }, s);
  el("text", { x: colX + colW / 2, y: TABAN_Y + 49, "text-anchor": "middle", class: "krm-mikro", fill: RENK.isik3, metin: "temsilî" }, s);

  el("text", { x: X0, y: 304, class: "formul", fill: RENK.isik2, metin: "q = M⁻¹ · v" }, s);
  el("text", { x: X0, y: 319, class: "krm-mikro", fill: RENK.isik3, metin: "sızıntı yönü · prior yok" }, s);

  const damgaKonum = el("g", { transform: "translate(328 320)" }, s);
  const damga = el("g", { class: "krm-damga" }, damgaKonum);
  el("rect", { x: -86, y: -22, width: 172, height: 40, fill: "rgba(7, 8, 11, 0.86)", stroke: RENK.toz, "stroke-width": 1.6, rx: 1.5 }, damga);

  el("path", { d: "M-80 -16 L-74 -16 M-80 -16 L-80 -10 M80 -16 L74 -16 M80 -16 L80 -10 M-80 12 L-74 12 M-80 12 L-80 6 M80 12 L74 12 M80 12 L80 6", stroke: RENK.toz, "stroke-width": 1, opacity: 0.7 }, damga);
  el("text", { x: 0, y: 4, "text-anchor": "middle", fill: RENK.toz, class: "damga", metin: "ABSTAIN" }, damga);

  const durumYazi = el("text", { x: X0, y: 376, class: "zayif", metin: "" }, s);

  const hud = document.createElement("div");
  hud.className = "krm-hud veri";
  hud.innerHTML = `<span data-krm-bilgi>R PENCERESİ 640–680 NM · KARIŞIM TEMSİLÎ</span><span class="krm-ipucu" data-krm-ipucu>[N II] / [S II] TEPESİNİ ÇEK</span>`;
  kap.append(hud);
  kok.append(kap);

  const ipucuEl = hud.querySelector("[data-krm-ipucu]");
  const bilgiEl = hud.querySelector("[data-krm-bilgi]");

  let anlikNii = 0.82;
  let hedefNii = 0.82;
  let anlikSii = 0.34;
  let hedefSii = 0.34;
  let aktifTutamac = null;
  let elleDegisti = false;
  let darbeGuc = 0;
  let svgKutu = null;

  const egim = egimBagla(kap, duzlem, 3.0);

  function ciz(t = 0) {
    const titreme = darbeGuc > 0.01 ? Math.sin(t * 32) * darbeGuc * 0.06 : 0;
    const nii = sinirla(anlikNii + titreme, 0, 1);
    const sii = sinirla(anlikSii - titreme * 0.7, 0, 1);
    const hesap = kirmiziKarisimHesapla(nii, sii);

    const ayarYarik = (yrk, yukseklik) => {
      const y2 = TABAN_Y - yukseklik * MAX_H;
      yrk.hale.setAttribute("y2", y2.toFixed(1));
      yrk.cekirdek.setAttribute("y2", y2.toFixed(1));
      yrk.hale.setAttribute("opacity", (0.06 + yukseklik * 0.32).toFixed(2));
      return y2;
    };

    ayarYarik(nii1Yarik, 0.33 * nii);
    const niiY2 = ayarYarik(nii2Yarik, 0.96 * nii);
    const siiY2 = ayarYarik(sii1Yarik, 0.48 * sii);
    ayarYarik(sii2Yarik, 0.36 * sii);

    niiTutamac.g.setAttribute("transform", `translate(0 ${Math.min(TABAN_Y - 7, niiY2).toFixed(1)})`);
    siiTutamac.g.setAttribute("transform", `translate(0 ${Math.min(TABAN_Y - 7, siiY2).toFixed(1)})`);
    niiTutamac.g.setAttribute("aria-valuenow", String(Math.round(nii * 100)));
    siiTutamac.g.setAttribute("aria-valuenow", String(Math.round(sii * 100)));

    const boy = Math.max(8, hesap.cubukOran * (colH - 6));
    const cubukY = TABAN_Y - boy;
    cubukAna.setAttribute("y", cubukY.toFixed(1));
    cubukAna.setAttribute("height", boy.toFixed(1));
    cubukHale.setAttribute("y", cubukY.toFixed(1));
    cubukHale.setAttribute("height", boy.toFixed(1));
    cubukUst.setAttribute("y1", cubukY.toFixed(1));
    cubukUst.setAttribute("y2", cubukY.toFixed(1));

    const fazla = Math.max(0, Math.round(hesap.sizintiPayi * 100));
    sizintiNot.textContent = fazla >= 4 ? `SIZINTI` : "YALNIZ Hα?";

    const hedefOrtaY = cubukY + boy * 0.35;
    akisHa.setAttribute("d", `M${haYarik.x} ${haY2.toFixed(1)} C320 ${haY2.toFixed(1)}, 385 ${hedefOrtaY.toFixed(1)}, ${colX - 2} ${hedefOrtaY.toFixed(1)}`);
    akisNii.setAttribute("d", `M${nii2Yarik.x} ${niiY2.toFixed(1)} C330 ${niiY2.toFixed(1)}, 390 ${(hedefOrtaY + 8).toFixed(1)}, ${colX - 2} ${(hedefOrtaY + 8).toFixed(1)}`);
    akisNii.setAttribute("opacity", (0.08 + nii * 0.52).toFixed(2));
    akisSii.setAttribute("d", `M${sii1Yarik.x} ${siiY2.toFixed(1)} C360 ${siiY2.toFixed(1)}, 405 ${(hedefOrtaY + 16).toFixed(1)}, ${colX - 2} ${(hedefOrtaY + 16).toFixed(1)}`);
    akisSii.setAttribute("opacity", (0.06 + sii * 0.44).toFixed(2));

    rYolEl.setAttribute("stroke", darbeGuc > 0.05 ? "rgba(255, 130, 144, 0.85)" : "rgba(255, 79, 97, 0.42)");

    kok.classList.toggle("abstain-aktif", hesap.abstain);
    durumYazi.textContent = hesap.abstain
      ? "[N II] için güvenilir aralık yok → temiz Hα sayısı verilmez"
      : "ek çizgiler zayıfken bile kırmızı çıktı bir karışımdır";
    bilgiEl.textContent = hesap.abstain
      ? "PRIOR YOK → ABSTAIN · KARIŞIM TEMSİLÎ"
      : "EK ÇİZGİLER DÜŞÜK · ÇIKTI YİNE DE KARIŞIM (TEMSİLÎ)";
  }

  const etkilesimIsaretle = () => {
    if (elleDegisti) return;
    elleDegisti = true;
    kok.classList.add("etkilesildi");
    ipucuEl.classList.add("soluk");
  };

  const clientYdenDuzey = (clientY, maksCarpan) => {
    if (!svgKutu || !svgKutu.height) svgKutu = s.getBoundingClientRect();
    const svgY = ((clientY - svgKutu.top) / svgKutu.height) * 392;
    const h = (TABAN_Y - svgY) / (MAX_H * maksCarpan);
    return sinirla(h, 0, 1);
  };

  const tutamacBasla = (tip) => (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    e.stopPropagation();
    svgKutu = s.getBoundingClientRect();
    aktifTutamac = tip;
    etkilesimIsaretle();
    kok.classList.add("surukleniyor");
    (tip === "nii" ? niiTutamac.g : siiTutamac.g).setPointerCapture?.(e.pointerId);
    const yeni = clientYdenDuzey(e.clientY, tip === "nii" ? 0.96 : 0.48);
    if (tip === "nii") hedefNii = yeni;
    else hedefSii = yeni;
    if (azHareket()) {
      anlikNii = hedefNii;
      anlikSii = hedefSii;
      ciz(0);
    }
  };

  const svgBas = (e) => {
    if (e.pointerType === "touch" || (e.button !== 0 && e.pointerType === "mouse")) return;
    svgKutu = s.getBoundingClientRect();
    if (!svgKutu.width) return;
    const svgX = ((e.clientX - svgKutu.left) / svgKutu.width) * 560;
    if (svgX >= 145 && svgX <= 245) tutamacBasla("nii")(e);
    else if (svgX >= 265 && svgX <= 365) tutamacBasla("sii")(e);
  };

  const surukle = (e) => {
    if (!aktifTutamac) return;
    const yeni = clientYdenDuzey(e.clientY, aktifTutamac === "nii" ? 0.96 : 0.48);
    if (aktifTutamac === "nii") hedefNii = yeni;
    else hedefSii = yeni;
    if (azHareket()) {
      anlikNii = hedefNii;
      anlikSii = hedefSii;
      ciz(0);
    }
  };

  const bitir = (e) => {
    if (!aktifTutamac) return;
    const hedef = aktifTutamac === "nii" ? niiTutamac.g : siiTutamac.g;
    if (e?.pointerId != null) hedef.releasePointerCapture?.(e.pointerId);
    aktifTutamac = null;
    kok.classList.remove("surukleniyor");
  };

  const tutamacKlavye = (tip) => (e) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    etkilesimIsaretle();
    const delta = e.key === "ArrowUp" ? 0.1 : -0.1;
    if (tip === "nii") hedefNii = sinirla(hedefNii + delta, 0, 1);
    else hedefSii = sinirla(hedefSii + delta, 0, 1);
    if (azHareket()) {
      anlikNii = hedefNii;
      anlikSii = hedefSii;
      ciz(0);
    }
  };

  const niiBas = tutamacBasla("nii");
  const siiBas = tutamacBasla("sii");
  const niiTus = tutamacKlavye("nii");
  const siiTus = tutamacKlavye("sii");

  niiTutamac.g.addEventListener("pointerdown", niiBas);
  siiTutamac.g.addEventListener("pointerdown", siiBas);
  niiTutamac.g.addEventListener("keydown", niiTus);
  siiTutamac.g.addEventListener("keydown", siiTus);
  s.addEventListener("pointerdown", svgBas);
  window.addEventListener("pointermove", surukle);
  window.addEventListener("pointerup", bitir);
  window.addEventListener("pointercancel", bitir);

  ciz(0);

  return {
    adim(t) {
      egim.guncelle();
      if (!elleDegisti && !azHareket()) {

        const acilis = sinirla(t / 1.4, 0, 1);
        const yumusak = 1 - Math.pow(1 - acilis, 3);
        hedefNii = 0.25 + yumusak * 0.57;
        hedefSii = 0.14 + yumusak * 0.20;
        if (t > 1.2 && t < 3.6) kok.classList.add("nefes");
        else kok.classList.remove("nefes");
      } else {
        kok.classList.remove("nefes");
      }

      if (azHareket()) {
        anlikNii = hedefNii;
        anlikSii = hedefSii;
      } else {
        anlikNii += (hedefNii - anlikNii) * 0.16;
        anlikSii += (hedefSii - anlikSii) * 0.16;
      }
      if (darbeGuc > 0.005) darbeGuc *= 0.89;
      else darbeGuc = 0;
      ciz(t);
    },
    darbe() {
      if (azHareket()) return;
      darbeGuc = 1;
      kok.classList.remove("darbe-parla");
      void kok.offsetWidth;
      kok.classList.add("darbe-parla");
    },
    yokEt() {
      egim.yokEt();
      niiTutamac.g.removeEventListener("pointerdown", niiBas);
      siiTutamac.g.removeEventListener("pointerdown", siiBas);
      niiTutamac.g.removeEventListener("keydown", niiTus);
      siiTutamac.g.removeEventListener("keydown", siiTus);
      s.removeEventListener("pointerdown", svgBas);
      window.removeEventListener("pointermove", surukle);
      window.removeEventListener("pointerup", bitir);
      window.removeEventListener("pointercancel", bitir);
    },
  };
}

function kirkSekiz(kok) {
  kok.innerHTML = `
    <div class="ks48-kap">
      <div class="ks48-ust veri">
        <span>12 KOŞUL × 2 MORFOLOJİ × 2 ÖRNEK = 48 SAHNE</span>
        <span class="ks48-ipucu" data-ks48-ipucu>KOŞULLARDA GEZDİR · 3 KANAL</span>
      </div>

      <div class="ks48-duzlem">
        <div class="ks48-govde">
          <div class="ks48-satir-etiket veri" aria-hidden="true">
            <span>GENİŞ</span>
            <span>FİLAMENT</span>
          </div>
          <div class="ks48-mozaik-sarici">
            <canvas class="ks48-doku" aria-hidden="true"></canvas>
            <div class="ks48-izgara" role="group" aria-label="48 sahnelik GraXpert deney koşulları"></div>
          </div>
        </div>
        <div class="ks48-capalar veri" data-ks48-capalar aria-label="Öne çıkan gerçek Hα azalmaları"></div>
      </div>

      <div class="ks48-hud veri" aria-live="polite">
        <div class="ks48-hud-ust">
          <b class="ks48-kosul-ad" data-ks48-ad>48 SAHNE · VERİ YÜKLENİYOR</b>
          <span class="ks48-kosul-alt" data-ks48-alt>4 SAHNE HAVUZLU · GRAXPERT 3.0.2 (0,65)</span>
        </div>
        <div class="ks48-kanallar">
          <span class="ks48-kanal" style="--c:var(--ha)"><b>Hα</b><span class="ks48-bar"><i data-ks48-bar="Ha"></i></span><span class="ks48-deger" data-ks48-val="Ha">—</span></span>
          <span class="ks48-kanal" style="--c:var(--oiii)"><b>[O III]</b><span class="ks48-bar"><i data-ks48-bar="OIII"></i></span><span class="ks48-deger" data-ks48-val="OIII">—</span></span>
          <span class="ks48-kanal" style="--c:#8aa2ff"><b>Hβ</b><span class="ks48-bar"><i data-ks48-bar="Hb"></i></span><span class="ks48-deger" data-ks48-val="Hb">—</span></span>
        </div>
      </div>

      <p class="ks48-lejant veri">G gürültü · C continuum · N [N II] · S [S II] · B birleşik · RMSE azalması (%)</p>
    </div>`;

  const kap = kok.querySelector(".ks48-kap");
  const duzlem = kok.querySelector(".ks48-duzlem");
  const izgara = kok.querySelector(".ks48-izgara");
  const sarici = kok.querySelector(".ks48-mozaik-sarici");
  const dokuTuval = kok.querySelector(".ks48-doku");
  const dokuCtx = dokuTuval.getContext("2d");
  const capalarEl = kok.querySelector("[data-ks48-capalar]");
  const ipucuEl = kok.querySelector("[data-ks48-ipucu]");
  const adEl = kok.querySelector("[data-ks48-ad]");
  const altEl = kok.querySelector("[data-ks48-alt]");
  const barlar = {
    Ha: kok.querySelector('[data-ks48-bar="Ha"]'),
    OIII: kok.querySelector('[data-ks48-bar="OIII"]'),
    Hb: kok.querySelector('[data-ks48-bar="Hb"]'),
  };
  const degerler = {
    Ha: kok.querySelector('[data-ks48-val="Ha"]'),
    OIII: kok.querySelector('[data-ks48-val="OIII"]'),
    Hb: kok.querySelector('[data-ks48-val="Hb"]'),
  };

  let matris = null;
  let sutunOgeleri = [];
  let capaDugmeleri = [];
  let aktifSutun = -1;
  let sabitSutun = -1;
  let gosterilenSutun = 0;
  let elleDegisti = false;
  let anlikBar = { Ha: 0, OIII: 0, Hb: 0 };
  let hedefBar = { Ha: 0, OIII: 0, Hb: 0 };
  let acilisIlerleme = azHareket() ? 1 : 0;
  let darbe = { guc: 0, sx: 6, sy: 2, t0: 0 };
  let sonT = 0;
  let yokEdildi = false;
  let mozaikKutu = null;
  let dokuG = 520;
  let dokuY = 172;
  let karoKutular = [];

  const egim = egimBagla(kap, duzlem, 3.5);

  const rnd = tohumlu(48029);
  const sahneIzleri = Array.from({ length: 48 }, (_, idx) => {
    const satir = idx % 4;
    const genis = satir < 2;
    return {
      genis,
      cx: 0.25 + rnd() * 0.5,
      cy: 0.25 + rnd() * 0.5,
      r: genis ? 0.32 + rnd() * 0.22 : 0.42 + rnd() * 0.2,
      aci: rnd() * Math.PI,
      egri: (rnd() - 0.5) * 0.6,
      faz: rnd() * Math.PI * 2,
    };
  });

  function sadeMozaikKur() {
    izgara.textContent = "";
    sutunOgeleri = [];
    for (let j = 0; j < 12; j++) {
      const sutun = document.createElement("div");
      sutun.className = "ks48-sutun";
      sutun.dataset.sutun = String(j);
      for (let i = 0; i < 4; i++) {
        const karo = document.createElement("span");
        karo.className = "ks48-karo";
        sutun.append(karo);
      }
      const etiket = document.createElement("span");
      etiket.className = "ks48-sutun-ad veri";
      etiket.textContent = String(j + 1).padStart(2, "0");
      sutun.append(etiket);
      izgara.append(sutun);
      sutunOgeleri.push(sutun);
    }
  }
  sadeMozaikKur();

  function hudGuncelle(sutunIdx, aninda = false) {
    if (!matris) return;
    const k = matris.kosullar[sinirla(sutunIdx, 0, matris.kosullar.length - 1)];
    if (!k) return;
    gosterilenSutun = k.sutun;
    adEl.textContent = `${k.ad}`;
    const seciliMi = aktifSutun === k.sutun || sabitSutun === k.sutun;
    altEl.textContent = seciliMi
      ? "4 SAHNE HAVUZLU · 2 MORFOLOJİ × 2 ÖRNEK"
      : "ÖRNEK KOŞUL · GEZDİREREK 12 KOŞULU OKU";
    hedefBar = { Ha: k.Ha, OIII: k.OIII, Hb: k.Hb };
    if (aninda || azHareket()) {
      anlikBar = { ...hedefBar };
      barlariYaz();
    }
  }

  function barlariYaz() {
    for (const anahtar of ["Ha", "OIII", "Hb"]) {
      const v = anlikBar[anahtar];
      const oran = sinirla(v / 60, 0, 1);
      barlar[anahtar].style.transform = `scaleX(${oran.toFixed(4)})`;
      degerler[anahtar].textContent = yuzdeTr(v, 1);
    }
  }

  function vurguGuncelle() {
    const hedef = aktifSutun >= 0 ? aktifSutun : sabitSutun;
    kok.classList.toggle("secim-var", hedef >= 0);
    sutunOgeleri.forEach((sEl, j) => {
      sEl.classList.toggle("etkin", j === hedef);
      sEl.setAttribute("aria-pressed", String(j === sabitSutun));
    });
    capaDugmeleri.forEach((b) => {
      b.classList.toggle("etkin", Number(b.dataset.sutun) === hedef);
    });
    if (hedef >= 0) hudGuncelle(hedef, false);
    else hudGuncelle(0, false);
    if (azHareket()) dokuCiz(sonT);
  }

  function veriyleMozaikKur(m) {
    matris = m;
    izgara.textContent = "";
    sutunOgeleri = [];

    m.kosullar.forEach((k, j) => {
      const sutun = document.createElement("button");
      sutun.type = "button";
      sutun.className = `ks48-sutun${k.aileBasi ? " aile-basi" : ""}`;
      sutun.dataset.sutun = String(j);
      sutun.dataset.dusuk = k.Ha < 10 ? "1" : "0";
      sutun.setAttribute("aria-pressed", "false");
      sutun.setAttribute("aria-label", `${k.ad}: Hα ${yuzdeTr(k.Ha)}, [O III] ${yuzdeTr(k.OIII)}, Hβ ${yuzdeTr(k.Hb)} RMSE azalması`);
      sutun.style.setProperty("--ha-yogun", k.haYogunluk.toFixed(3));
      sutun.style.setProperty("--oiii-yogun", sinirla(k.OIII / 55, 0, 1).toFixed(3));
      sutun.style.setProperty("--hb-yogun", sinirla(k.Hb / 55, 0, 1).toFixed(3));

      for (let i = 0; i < 4; i++) {
        const karo = document.createElement("span");
        karo.className = `ks48-karo${i === 2 ? " morfo-ayrac" : ""}`;

        karo.innerHTML = `<span class="ks48-uclu" aria-hidden="true"><i class="u-ha"></i><i class="u-oiii"></i><i class="u-hb"></i></span>`;
        sutun.append(karo);
      }

      const etiket = document.createElement("span");
      etiket.className = "ks48-sutun-ad veri";
      etiket.textContent = k.kisa;
      if (k.id === "noise-low" || k.id === "nii-high" || k.id === "combined-low-noise") {
        sutun.dataset.capa = k.id === "noise-low" ? "ha" : "toz";
      }
      sutun.append(etiket);

      sutun.addEventListener("pointerenter", (e) => {
        if (e.pointerType === "touch") return;
        elleDegisti = true;
        ipucuEl.classList.add("soluk");
        aktifSutun = j;
        vurguGuncelle();
      });
      sutun.addEventListener("focus", () => {
        aktifSutun = j;
        vurguGuncelle();
      });
      sutun.addEventListener("blur", () => {
        if (aktifSutun === j) {
          aktifSutun = -1;
          vurguGuncelle();
        }
      });
      sutun.addEventListener("click", () => {
        elleDegisti = true;
        ipucuEl.classList.add("soluk");
        sabitSutun = sabitSutun === j ? -1 : j;
        aktifSutun = sabitSutun;
        vurguGuncelle();
      });

      izgara.append(sutun);
      sutunOgeleri.push(sutun);
    });

    capalarEl.textContent = "";
    capaDugmeleri = m.vurgular.map((v, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `ks48-capa ks48-capa-${idx}`;
      btn.dataset.sutun = String(v.kosul.sutun);
      btn.style.setProperty("--pos", `${(((v.kosul.sutun + 0.5) / 12) * 100).toFixed(2)}%`);
      btn.style.setProperty("--c", v.renk);
      btn.innerHTML = `<span class="ks48-capa-hat" aria-hidden="true"></span><b class="ks48-capa-sayi">${yuzdeTr(v.kosul.Ha, 1)}</b><span class="ks48-capa-etiket">${v.etiket}</span>`;
      btn.addEventListener("pointerenter", (e) => {
        if (e.pointerType === "touch") return;
        elleDegisti = true;
        ipucuEl.classList.add("soluk");
        aktifSutun = v.kosul.sutun;
        vurguGuncelle();
      });
      btn.addEventListener("pointerleave", () => {
        aktifSutun = -1;
        vurguGuncelle();
      });
      btn.addEventListener("click", () => {
        elleDegisti = true;
        ipucuEl.classList.add("soluk");
        sabitSutun = sabitSutun === v.kosul.sutun ? -1 : v.kosul.sutun;
        aktifSutun = sabitSutun;
        vurguGuncelle();
      });
      capalarEl.append(btn);
      return btn;
    });

    kok.classList.add("veri-hazir");
    hudGuncelle(0, true);
    dokuCiz(sonT);
  }

  let dokunTarama = false;
  const izgaraCik = () => {
    aktifSutun = -1;
    vurguGuncelle();
  };
  const izgaraBas = (e) => {
    if (e.pointerType !== "touch" || !matris) return;
    mozaikKutu = izgara.getBoundingClientRect();
    dokunTarama = true;
  };
  const izgaraHareket = (e) => {
    if (!dokunTarama || e.pointerType !== "touch" || !matris || !mozaikKutu?.width) return;
    const j = sinirla(Math.floor(((e.clientX - mozaikKutu.left) / mozaikKutu.width) * 12), 0, 11);
    if (j !== sabitSutun) {
      elleDegisti = true;
      ipucuEl.classList.add("soluk");
      sabitSutun = j;
      aktifSutun = j;
      vurguGuncelle();
    }
  };
  const izgaraBitir = () => {
    dokunTarama = false;
    mozaikKutu = null;
  };

  izgara.addEventListener("pointerleave", izgaraCik);
  izgara.addEventListener("pointerdown", izgaraBas, { passive: true });
  izgara.addEventListener("pointermove", izgaraHareket, { passive: true });
  izgara.addEventListener("pointerup", izgaraBitir, { passive: true });
  izgara.addEventListener("pointercancel", izgaraBitir, { passive: true });

  const dokuBoyutlandir = () => {
    const g = Math.max(200, Math.round(sarici.clientWidth || 520));
    const y = Math.max(120, Math.round(sarici.clientHeight || 172));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (dokuTuval.width !== Math.round(g * dpr) || dokuTuval.height !== Math.round(y * dpr)) {
      dokuTuval.width = Math.round(g * dpr);
      dokuTuval.height = Math.round(y * dpr);
    }
    dokuG = g;
    dokuY = y;
    dokuCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const sr = sarici.getBoundingClientRect();
    const tumKarolar = izgara.querySelectorAll(".ks48-karo");
    karoKutular = [];
    if (sr.width && tumKarolar.length === 48) {
      tumKarolar.forEach((karoEl) => {
        const kr = karoEl.getBoundingClientRect();
        karoKutular.push({
          x: kr.left - sr.left,
          y: kr.top - sr.top,
          w: kr.width,
          h: kr.height,
        });
      });
    }
    dokuCiz(sonT);
  };

  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(dokuBoyutlandir) : null;
  ro?.observe(sarici);

  function dokuCiz(t = 0) {
    sonT = t;
    const g = dokuG;
    const y = dokuY;
    dokuCtx.clearRect(0, 0, g, y);

    const alanY = Math.max(80, y - 22);
    const hucreG = g / 12;
    const hucreY = alanY / 4;
    const secili = aktifSutun >= 0 ? aktifSutun : sabitSutun;

    dokuCtx.save();
    dokuCtx.globalCompositeOperation = "lighter";

    for (let j = 0; j < 12; j++) {
      const k = matris?.kosullar[j];
      const haOran = k ? k.haYogunluk : 0.28;
      const oiiiOran = k ? sinirla(k.OIII / 55, 0, 1) : 0.25;
      const sutunAcik = azHareket() ? 1 : sinirla((acilisIlerleme * 13.5 - j) * 0.9, 0, 1);
      const sutunCarpan = secili >= 0 ? (secili === j ? 1.45 : 0.36) : 1;

      for (let i = 0; i < 4; i++) {
        const idx = j * 4 + i;
        const iz = sahneIzleri[idx];
        const kutu = karoKutular[idx];
        const x0 = kutu ? kutu.x + 1 : j * hucreG + 2;
        const y0 = kutu ? kutu.y + 1 : i * hucreY + 2;
        const w = Math.max(4, kutu ? kutu.w - 2 : hucreG - 4);
        const h = Math.max(4, kutu ? kutu.h - 4 : hucreY - 4);

        let dalga = 0;
        if (darbe.guc > 0.01) {
          const mesafe = Math.hypot(j + 0.5 - darbe.sx, (i + 0.5) * 1.4 - darbe.sy * 1.4);
          const dalgaFaz = mesafe - (t - darbe.t0) * 14;
          dalga = Math.exp(-dalgaFaz * dalgaFaz * 0.45) * darbe.guc;
        }

        const parlak = sutunAcik * sutunCarpan * (0.86 + 0.14 * Math.sin(t * 1.3 + iz.faz));
        const cx = x0 + iz.cx * w;
        const cy = y0 + iz.cy * h;

        if (iz.genis) {

          const r = Math.min(w, h) * (0.45 + iz.r * 0.42);
          const grad = dokuCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
          const haAlpha = sinirla((0.06 + haOran * 0.58) * parlak + dalga * 0.4, 0, 0.9);
          grad.addColorStop(0, `rgba(255, 79, 97, ${haAlpha.toFixed(3)})`);
          grad.addColorStop(0.6, `rgba(255, 79, 97, ${(haAlpha * 0.3).toFixed(3)})`);
          grad.addColorStop(1, "rgba(0, 0, 0, 0)");
          dokuCtx.fillStyle = grad;
          dokuCtx.fillRect(x0, y0, w, h);

          const oGrad = dokuCtx.createRadialGradient(x0 + (1 - iz.cx) * w, y0 + (1 - iz.cy) * h, 0, x0 + (1 - iz.cx) * w, y0 + (1 - iz.cy) * h, r * 0.72);
          const oAlpha = sinirla((0.04 + oiiiOran * 0.24) * parlak + dalga * 0.25, 0, 0.65);
          oGrad.addColorStop(0, `rgba(69, 214, 200, ${oAlpha.toFixed(3)})`);
          oGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          dokuCtx.fillStyle = oGrad;
          dokuCtx.fillRect(x0, y0, w, h);
        } else {

          const dx = Math.cos(iz.aci) * w * 0.36;
          const dy = Math.sin(iz.aci) * h * 0.34;
          const haAlpha = sinirla((0.08 + haOran * 0.72) * parlak + dalga * 0.45, 0, 0.95);
          dokuCtx.strokeStyle = `rgba(255, 79, 97, ${haAlpha.toFixed(3)})`;
          dokuCtx.lineWidth = Math.max(1.2, w * 0.06);
          dokuCtx.lineCap = "round";
          dokuCtx.beginPath();
          dokuCtx.moveTo(cx - dx, cy - dy);
          dokuCtx.quadraticCurveTo(cx + iz.egri * w * 0.4, cy - iz.egri * h * 0.4, cx + dx, cy + dy);
          dokuCtx.stroke();

          const oAlpha = sinirla((0.06 + oiiiOran * 0.32) * parlak + dalga * 0.25, 0, 0.72);
          dokuCtx.strokeStyle = `rgba(69, 214, 200, ${oAlpha.toFixed(3)})`;
          dokuCtx.lineWidth = 1;
          dokuCtx.beginPath();
          dokuCtx.moveTo(cx - dx * 0.8 + 2, cy - dy * 0.8 + 2);
          dokuCtx.quadraticCurveTo(cx + iz.egri * w * 0.35 + 2, cy - iz.egri * h * 0.35 + 2, cx + dx * 0.8 + 2, cy + dy * 0.8 + 2);
          dokuCtx.stroke();
        }
      }
    }
    dokuCtx.restore();
  }

  graxpertVeriGetir()
    .then((json) => {
      if (yokEdildi) return;
      veriyleMozaikKur(kirkSekizMatrisKur(json));
      dokuBoyutlandir();
    })
    .catch((hata) => {
      if (yokEdildi) return;
      console.warn("[AIS.001 · 48 sahne] GraXpert verisi yüklenemedi:", hata?.message || hata);
      adEl.textContent = "48 SAHNE · 12 KOŞUL × 4";
      altEl.textContent = "VERİ KAYNAĞINA ERİŞİLEMEDİ";
    });

  dokuBoyutlandir();

  return {
    adim(t) {
      egim.guncelle();
      if (!azHareket()) {
        acilisIlerleme = sinirla(t / 1.45, 0, 1);
        if (!elleDegisti && t > 1.5 && t < 3.8) kok.classList.add("nefes");
        else kok.classList.remove("nefes");
      }
      if (matris) {
        let degisti = false;
        for (const anahtar of ["Ha", "OIII", "Hb"]) {
          const fark = hedefBar[anahtar] - anlikBar[anahtar];
          if (Math.abs(fark) > 0.02) {
            anlikBar[anahtar] += fark * 0.18;
            degisti = true;
          } else if (anlikBar[anahtar] !== hedefBar[anahtar]) {
            anlikBar[anahtar] = hedefBar[anahtar];
            degisti = true;
          }
        }
        if (degisti) barlariYaz();
      }
      if (darbe.guc > 0.006) darbe.guc *= 0.93;
      else darbe.guc = 0;
      dokuCiz(t);
    },
    darbe(x, y) {
      if (azHareket()) return;
      const r = sarici.getBoundingClientRect();
      darbe = {
        guc: 1,
        sx: r.width ? sinirla(((x - r.left) / r.width) * 12, 0, 12) : 6,
        sy: r.height ? sinirla(((y - r.top) / r.height) * 4, 0, 4) : 2,
        t0: sonT,
      };
      kok.classList.remove("darbe-parla");
      void kok.offsetWidth;
      kok.classList.add("darbe-parla");
    },
    yokEt() {
      yokEdildi = true;
      ro?.disconnect();
      egim.yokEt();
      izgara.removeEventListener("pointerleave", izgaraCik);
      izgara.removeEventListener("pointerdown", izgaraBas);
      izgara.removeEventListener("pointermove", izgaraHareket);
      izgara.removeEventListener("pointerup", izgaraBitir);
      izgara.removeEventListener("pointercancel", izgaraBitir);
    },
  };
}

function gercek(kok) {
  const TUVAL_G = 720;
  const TUVAL_Y = 523;

  kok.innerHTML = `
    <div class="grc-kap">
      <div class="grc-duzlem">
        <div class="grc-sahne" role="slider" tabindex="0" aria-label="Önce ve GraXpert sonrası karşılaştırma perdesi" aria-valuemin="6" aria-valuemax="94" aria-valuenow="50">
          <div class="grc-maske">
            <img class="grc-yedek" src="${NGC_YOL}" alt="NGC 7000 · 100 bölgede gerçek veri karşılaştırması" decoding="async" draggable="false">
            <canvas class="grc-tuval grc-once" width="${TUVAL_G}" height="${TUVAL_Y}" aria-hidden="true"></canvas>
            <canvas class="grc-tuval grc-sonra" width="${TUVAL_G}" height="${TUVAL_Y}" aria-hidden="true"></canvas>
            <div class="grc-izgara" aria-hidden="true"></div>
            <span class="grc-aktif-karo" data-grc-karo aria-hidden="true"></span>
            <span class="grc-darbe-halka" data-grc-darbe aria-hidden="true"></span>
          </div>

          <span class="grc-yan-etiket grc-etiket-sol veri" data-grc-sol>ÖNCE</span>
          <span class="grc-yan-etiket grc-etiket-sag veri" data-grc-sag>GRAXPERT SONRASI</span>

          <div class="grc-perde" data-grc-perde aria-hidden="true">
            <span class="grc-perde-hat"></span>
            <span class="grc-tutamac"><i>‹</i><i>›</i></span>
          </div>
        </div>
      </div>

      <div class="grc-hud veri">
        <div class="grc-hud-ust">
          <span class="grc-olcum" data-grc-olcum>100 KARO · MAD <b>×0,40</b> <span class="grc-karo-etiket" data-grc-karo-ad></span></span>
          <span class="grc-dogruluk">DOĞRULUK: <b class="toz">?</b></span>
        </div>
        <div class="grc-hud-alt">
          <span class="grc-not">görünüm temsilî; 0,40 ve 100 karo gerçek kayıttan</span>
          <span class="grc-ipucu" data-grc-ipucu>PERDEYİ YATAY SÜRÜKLE</span>
        </div>
      </div>
    </div>`;

  const kap = kok.querySelector(".grc-kap");
  const duzlem = kok.querySelector(".grc-duzlem");
  const sahne = kok.querySelector(".grc-sahne");
  const onceTuval = kok.querySelector(".grc-once");
  const sonraTuval = kok.querySelector(".grc-sonra");
  const karoKutu = kok.querySelector("[data-grc-karo]");
  const darbeHalka = kok.querySelector("[data-grc-darbe]");
  const solEtiket = kok.querySelector("[data-grc-sol]");
  const sagEtiket = kok.querySelector("[data-grc-sag]");
  const karoAdEl = kok.querySelector("[data-grc-karo-ad]");
  const ipucuEl = kok.querySelector("[data-grc-ipucu]");

  let anlikPerde = 0.5;
  let hedefPerde = 0.5;
  let surukleniyor = false;
  let elleDegisti = false;
  let aktifKaro = null;
  let sahneKutu = null;
  let yokEdildi = false;

  const egim = egimBagla(kap, duzlem, 3.0);

  const katmanlariHazirla = (img) => {
    const oc = onceTuval.getContext("2d", { willReadFrequently: true });
    const sc = sonraTuval.getContext("2d");
    oc.drawImage(img, 0, 0, TUVAL_G, TUVAL_Y);
    const ham = oc.getImageData(0, 0, TUVAL_G, TUVAL_Y);
    const yumusak = yumusatBilateral(ham.data, TUVAL_G, TUVAL_Y, 28);

    const rnd = tohumlu(70004);
    const onceVeri = new Uint8ClampedArray(ham.data.length);
    const sonraVeri = new Uint8ClampedArray(ham.data.length);

    for (let i = 0; i < ham.data.length; i += 4) {

      const r = ham.data[i];
      const g = ham.data[i + 1];
      const b = ham.data[i + 2];
      const parlaklik = (r + g + b) / 765;
      const agirlik = 1 - sinirla((parlaklik - 0.55) * 2.2, 0, 1);
      const n1 = (rnd() + rnd() - 1) * 26 * agirlik;
      const n2 = (rnd() + rnd() - 1) * 18 * agirlik;
      const n3 = (rnd() + rnd() - 1) * 20 * agirlik;

      onceVeri[i] = sinirla(r + n1, 0, 255);
      onceVeri[i + 1] = sinirla(g + n2, 0, 255);
      onceVeri[i + 2] = sinirla(b + n3, 0, 255);
      onceVeri[i + 3] = 255;

      sonraVeri[i] = sinirla(yumusak[i] + n1 * 0.22, 0, 255);
      sonraVeri[i + 1] = sinirla(yumusak[i + 1] + n2 * 0.22, 0, 255);
      sonraVeri[i + 2] = sinirla(yumusak[i + 2] + n3 * 0.22, 0, 255);
      sonraVeri[i + 3] = 255;
    }

    oc.putImageData(new ImageData(onceVeri, TUVAL_G, TUVAL_Y), 0, 0);
    sc.putImageData(new ImageData(sonraVeri, TUVAL_G, TUVAL_Y), 0, 0);
    kok.classList.add("tuval-hazir");
  };

  ngcResimGetir()
    .then((img) => {
      if (!yokEdildi) katmanlariHazirla(img);
    })
    .catch(() => {});

  function guncelle() {
    const yuzde = (anlikPerde * 100).toFixed(2);
    sahne.style.setProperty("--perde", `${yuzde}%`);
    sahne.setAttribute("aria-valuenow", String(Math.round(anlikPerde * 100)));

    solEtiket.classList.toggle("gizle", anlikPerde < 0.16);
    sagEtiket.classList.toggle("gizle", anlikPerde > 0.84);

    if (aktifKaro) {
      const k = perdeVeKaroHesapla((aktifKaro.sutun + 0.5) / 10, (aktifKaro.satir + 0.5) / 10, anlikPerde, 10);
      karoKutu.style.setProperty("--kx", `${k.sutun * 10}%`);
      karoKutu.style.setProperty("--ky", `${k.satir * 10}%`);
      karoKutu.dataset.taraf = k.taraf;
      karoKutu.classList.add("gorunur");
      karoAdEl.textContent = `· KARO ${String(k.karoNo).padStart(3, "0")}/100`;
    } else {
      karoKutu.classList.remove("gorunur");
      karoAdEl.textContent = "";
    }
  }

  const etkilesimIsaretle = () => {
    if (elleDegisti) return;
    elleDegisti = true;
    kok.classList.add("etkilesildi");
    ipucuEl.classList.add("soluk");
  };

  const konumOku = (clientX, clientY) => {
    if (!sahneKutu || !sahneKutu.width) sahneKutu = sahne.getBoundingClientRect();
    const nx = sinirla((clientX - sahneKutu.left) / sahneKutu.width, 0, 0.9999);
    const ny = sinirla((clientY - sahneKutu.top) / sahneKutu.height, 0, 0.9999);
    return perdeVeKaroHesapla(nx, ny, sinirla(nx, 0.06, 0.94), 10);
  };

  let dokunBas = null;

  const bas = (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    sahneKutu = sahne.getBoundingClientRect();
    const k = konumOku(e.clientX, e.clientY);
    if (e.pointerType === "touch") {
      const perdePx = sahneKutu.left + anlikPerde * sahneKutu.width;
      const tutamacta = Math.abs(e.clientX - perdePx) <= 28;
      dokunBas = { x: e.clientX, y: e.clientY, id: e.pointerId, tutamacta };
      if (!tutamacta) return;
    }
    surukleniyor = true;
    etkilesimIsaretle();
    kok.classList.add("surukleniyor", "etkin-izgara");
    sahne.setPointerCapture?.(e.pointerId);
    hedefPerde = k.perdeOran;
    aktifKaro = k;
    if (azHareket()) {
      anlikPerde = hedefPerde;
      guncelle();
    }
  };

  const hareket = (e) => {
    if (e.pointerType === "touch" && !surukleniyor) {
      if (!dokunBas) return;
      const dx = Math.abs(e.clientX - dokunBas.x);
      const dy = Math.abs(e.clientY - dokunBas.y);
      if (dx > 7 && dx > dy * 1.15) {
        surukleniyor = true;
        etkilesimIsaretle();
        kok.classList.add("surukleniyor", "etkin-izgara");
        sahne.setPointerCapture?.(e.pointerId);
      } else {
        return;
      }
    }
    const k = konumOku(e.clientX, e.clientY);
    aktifKaro = k;
    kok.classList.add("etkin-izgara");
    if (surukleniyor) {
      hedefPerde = k.perdeOran;
      if (azHareket()) anlikPerde = hedefPerde;
    }
    if (azHareket()) guncelle();
  };

  const bitir = (e) => {
    if (e?.pointerType === "touch" && dokunBas && !surukleniyor && e.type === "pointerup") {
      const dx = Math.abs(e.clientX - dokunBas.x);
      const dy = Math.abs(e.clientY - dokunBas.y);
      if (dx < 8 && dy < 8) {
        const k = konumOku(e.clientX, e.clientY);
        etkilesimIsaretle();
        hedefPerde = k.perdeOran;
        aktifKaro = k;
        kok.classList.add("etkin-izgara");
        if (azHareket()) {
          anlikPerde = hedefPerde;
          guncelle();
        }
      }
    }
    dokunBas = null;
    if (!surukleniyor) return;
    surukleniyor = false;
    kok.classList.remove("surukleniyor");
    if (e?.pointerId != null) sahne.releasePointerCapture?.(e.pointerId);
  };

  const cik = () => {
    if (surukleniyor) return;
    aktifKaro = null;
    sahneKutu = null;
    kok.classList.remove("etkin-izgara");
    if (azHareket()) guncelle();
  };

  const klavye = (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    etkilesimIsaretle();
    hedefPerde = sinirla(hedefPerde + (e.key === "ArrowRight" ? 0.06 : -0.06), 0.06, 0.94);
    if (azHareket()) {
      anlikPerde = hedefPerde;
      guncelle();
    }
  };

  sahne.addEventListener("pointerdown", bas);
  sahne.addEventListener("pointermove", hareket);
  sahne.addEventListener("pointerup", bitir);
  sahne.addEventListener("pointercancel", bitir);
  sahne.addEventListener("pointerleave", cik);
  sahne.addEventListener("keydown", klavye);

  guncelle();

  return {
    adim(t) {
      egim.guncelle();
      if (!elleDegisti && !azHareket()) {

        if (t < 2.2) {
          hedefPerde = 0.5 + Math.sin(t * Math.PI) * 0.075 * (1 - t / 2.2);
          kok.classList.add("nefes");
        } else {
          hedefPerde = 0.5;
          kok.classList.remove("nefes");
        }
      } else {
        kok.classList.remove("nefes");
      }

      if (azHareket()) {
        anlikPerde = hedefPerde;
      } else {
        anlikPerde += (hedefPerde - anlikPerde) * 0.2;
      }
      guncelle();
    },
    darbe(x, y, nx) {
      if (azHareket()) return;
      const r = sahne.getBoundingClientRect();
      const ux = r.width ? sinirla((x - r.left) / r.width, 0.05, 0.95) : 0.5;
      const uy = r.height ? sinirla((y - r.top) / r.height, 0.05, 0.95) : 0.5;
      darbeHalka.style.setProperty("--dx", `${(ux * 100).toFixed(1)}%`);
      darbeHalka.style.setProperty("--dy", `${(uy * 100).toFixed(1)}%`);
      if (!surukleniyor) {
        anlikPerde = sinirla(anlikPerde + (nx || 0.3) * 0.035, 0.08, 0.92);
      }
      kok.classList.remove("darbe-parla");
      void kok.offsetWidth;
      kok.classList.add("darbe-parla");
    },
    yokEt() {
      yokEdildi = true;
      egim.yokEt();
      sahne.removeEventListener("pointerdown", bas);
      sahne.removeEventListener("pointermove", hareket);
      sahne.removeEventListener("pointerup", bitir);
      sahne.removeEventListener("pointercancel", bitir);
      sahne.removeEventListener("pointerleave", cik);
      sahne.removeEventListener("keydown", klavye);
    },
  };
}

export default {
  taban,
  kirmizi,
  "kirk-sekiz": kirkSekiz,
  gercek,
};
