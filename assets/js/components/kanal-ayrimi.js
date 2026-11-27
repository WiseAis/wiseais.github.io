import { azHareket } from "../lib/rastgele.js?v=20261127a";
import { oturum, oturumGuncelle } from "../lib/oturum.js?v=20261127a";

const KATMANLAR = [
  { id: "hb", kanal: 2, renk: [138, 162, 255], ad: "Hβ", dalga: "486.1 nm", css: "#8aa2ff", soluk: "rgba(138, 162, 255, 0.18)", hale: "rgba(138, 162, 255, 0.24)" },
  { id: "oiii", kanal: 1, renk: [69, 214, 200], ad: "[O III]", dalga: "500.7 nm", css: "var(--oiii)", soluk: "rgba(69, 214, 200, 0.18)", hale: "rgba(69, 214, 200, 0.24)" },
  { id: "ha", kanal: 0, renk: [255, 79, 97], ad: "Hα", dalga: "656.3 nm", css: "var(--ha)", soluk: "rgba(255, 79, 97, 0.18)", hale: "rgba(255, 79, 97, 0.24)" },
];

const KANAL_ANLAM = {
  ha: "Hα · 656.3 nm · R kanalından geri çağrıldı · iyonize hidrojen, yayların geniş gövdesi",
  oiii: "[O III] · 500.7 nm · G kanalından geri çağrıldı · çift iyonize oksijen, şok cephesinin ince iplikleri",
  hb: "Hβ · 486.1 nm · B kanalından geri çağrıldı · hidrojenin daha sönük ikinci çizgisi",
};

const KANALLAR_USTTEN = [...KATMANLAR].reverse();
const KANAL_BILGI = Object.fromEntries(KATMANLAR.map((k) => [k.id, k]));

const MERKEZ_RX = 48;
const MERKEZ_RZ = -26;
const LERP = 0.08;
const ORNEK_BOY = 120;
const BOSLUK_AYIR = new RegExp("\\s+");

const KOSE_HTML = [0, 1, 2, 3]
  .map((k) => `<span class="ka-kose" data-kose="${k}" aria-hidden="true"></span>`)
  .join("");

function disbukeyZarf(noktalar) {
  const temiz = [];
  for (const p of noktalar) {
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) temiz.push({ x: p.x, y: p.y });
  }
  if (temiz.length < 3) return temiz;
  temiz.sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

  const tekil = [temiz[0]];
  for (let i = 1; i < temiz.length; i++) {
    const onceki = tekil[tekil.length - 1];
    if (Math.hypot(temiz[i].x - onceki.x, temiz[i].y - onceki.y) > 1e-4) {
      tekil.push(temiz[i]);
    }
  }
  if (tekil.length < 3) return tekil;

  const capraz = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const alt = [];
  for (const p of tekil) {
    while (alt.length >= 2 && capraz(alt[alt.length - 2], alt[alt.length - 1], p) <= 0) alt.pop();
    alt.push(p);
  }
  const ust = [];
  for (let i = tekil.length - 1; i >= 0; i--) {
    const p = tekil[i];
    while (ust.length >= 2 && capraz(ust[ust.length - 2], ust[ust.length - 1], p) <= 0) ust.pop();
    ust.push(p);
  }
  alt.pop();
  ust.pop();
  return alt.concat(ust);
}

export const TUR_ZAMAN = {
  ayrilma: 1600,
  baslangicGecikme: 600,
  adim: 1100,
  ipucuBitis: 2000,
  ipucuAzHareket: 4000,
  nefesAralik: 8000,
  nefesSure: 1350,
  nefesMaks: 2,
};

export const TUR_SIRASI = ["ha", "oiii", "hb"];
const TUR_DEPOLAMA_ANAHTAR = "aisenit-kanal-turu";

function turOynandiOku() {
  if (oturum.kanalTuruOynandi) return true;
  try {
    return sessionStorage.getItem(TUR_DEPOLAMA_ANAHTAR) === "1";
  } catch {
    return false;
  }
}

function turOynandiYaz() {
  oturumGuncelle({ kanalTuruOynandi: true });
  try {
    sessionStorage.setItem(TUR_DEPOLAMA_ANAHTAR, "1");
  } catch {

  }
}

export function turMakinesiOlustur({
  azHareketMi = false,
  zamanla = setTimeout,
  iptalEt = clearTimeout,
  onAdim = () => {},
  onIpucu = () => {},
  onTurBasladi = () => {},
  onBitti = () => {},
  onNefes = () => {},
} = {}) {
  let evresi = "bekliyor";
  let adimIndeks = -1;
  let gorunur = false;
  let etkilesimOldu = false;
  let nefesSayi = 0;
  let ipucuAcik = false;
  let nefesAcik = false;

  let planZaman = 0;
  let adimZaman = 0;
  let ipucuZaman = 0;
  let nefesBekleZaman = 0;
  let nefesBitisZaman = 0;

  const zamanlayiciTemizle = (id) => {
    if (id) iptalEt(id);
    return 0;
  };

  const ipucuAyarla = (acik) => {
    ipucuZaman = zamanlayiciTemizle(ipucuZaman);
    if (ipucuAcik === acik) return;
    ipucuAcik = acik;
    onIpucu(acik);
  };

  const nefesAyarla = (acik) => {
    if (nefesAcik === acik) return;
    nefesAcik = acik;
    onNefes(acik);
  };

  const nefesDurdur = () => {
    nefesBekleZaman = zamanlayiciTemizle(nefesBekleZaman);
    nefesBitisZaman = zamanlayiciTemizle(nefesBitisZaman);
    nefesAyarla(false);
  };

  const nefesPlanla = () => {
    if (azHareketMi || etkilesimOldu || !gorunur) return;
    if (nefesSayi >= TUR_ZAMAN.nefesMaks || nefesBekleZaman || nefesAcik) return;
    nefesBekleZaman = zamanla(() => {
      nefesBekleZaman = 0;
      if (azHareketMi || etkilesimOldu || !gorunur || nefesSayi >= TUR_ZAMAN.nefesMaks) return;
      nefesSayi += 1;
      nefesAyarla(true);
      nefesBitisZaman = zamanla(() => {
        nefesBitisZaman = 0;
        nefesAyarla(false);
        if (nefesSayi < TUR_ZAMAN.nefesMaks) nefesPlanla();
      }, TUR_ZAMAN.nefesSure);
    }, TUR_ZAMAN.nefesAralik);
  };

  const adimCalistir = (indeks) => {
    if (evresi !== "oynuyor") return;
    if (indeks >= TUR_SIRASI.length) {
      adimZaman = 0;
      evresi = "bitti";
      adimIndeks = -1;
      onAdim(null);
      onBitti({ kesildi: false });
      if (gorunur) {
        ipucuZaman = zamanla(() => {
          ipucuZaman = 0;
          ipucuAyarla(false);
        }, TUR_ZAMAN.ipucuBitis);
        nefesPlanla();
      } else {
        ipucuAyarla(false);
      }
      return;
    }
    adimIndeks = indeks;
    onAdim(TUR_SIRASI[indeks]);
    adimZaman = zamanla(() => {
      adimZaman = 0;
      adimCalistir(indeks + 1);
    }, TUR_ZAMAN.adim);
  };

  const turuBaslat = () => {
    planZaman = 0;
    if (azHareketMi || !gorunur || etkilesimOldu) return;
    if (evresi === "oynuyor" || evresi === "bitti" || evresi === "kesildi") return;
    evresi = "oynuyor";
    onTurBasladi();
    ipucuAyarla(true);
    adimCalistir(0);
  };

  const durdur = ({ temizle = true, kanalDokunuldu = false } = {}) => {
    if (kanalDokunuldu) {
      etkilesimOldu = true;
      nefesDurdur();
    }
    if (evresi === "oynuyor") {
      adimZaman = zamanlayiciTemizle(adimZaman);
      evresi = "kesildi";
      adimIndeks = -1;
      ipucuAyarla(false);
      if (temizle) onAdim(null);
      onBitti({ kesildi: true });
      if (!etkilesimOldu && gorunur) nefesPlanla();
      return true;
    }
    if (evresi === "planlandi") {
      planZaman = zamanlayiciTemizle(planZaman);
      if (kanalDokunuldu) {
        evresi = "kesildi";
        onTurBasladi();
      }
      return true;
    }
    if (kanalDokunuldu && ipucuAcik) {
      ipucuAyarla(false);
    }
    return false;
  };

  return {
    ayrilmaBasladi({ gecikme = TUR_ZAMAN.ayrilma + TUR_ZAMAN.baslangicGecikme, zatenOynandi = false } = {}) {
      if (azHareketMi || etkilesimOldu) return;
      if (zatenOynandi) {
        evresi = "bitti";
        if (gorunur) nefesPlanla();
        return;
      }
      if (evresi !== "bekliyor") return;
      evresi = "planlandi";
      if (gorunur) {
        planZaman = zamanla(turuBaslat, gecikme);
      }
    },

    gorunurlukDegis(yeniGorunur, { zatenOynandi = false } = {}) {
      gorunur = Boolean(yeniGorunur);
      if (!gorunur) {
        planZaman = zamanlayiciTemizle(planZaman);
        nefesDurdur();
        if (evresi === "oynuyor") {
          durdur({ temizle: true, kanalDokunuldu: false });
        } else if (ipucuAcik) {
          ipucuAyarla(false);
        }
        return;
      }
      if (azHareketMi) {
        if (evresi === "bekliyor" && !zatenOynandi && !etkilesimOldu) {
          evresi = "bitti";
          onTurBasladi();
          ipucuAyarla(true);
          ipucuZaman = zamanla(() => {
            ipucuZaman = 0;
            ipucuAyarla(false);
          }, TUR_ZAMAN.ipucuAzHareket);
        }
        return;
      }
      if (evresi === "planlandi" && !planZaman && !etkilesimOldu) {
        planZaman = zamanla(turuBaslat, TUR_ZAMAN.baslangicGecikme);
      } else if ((evresi === "bitti" || evresi === "kesildi") && !etkilesimOldu) {
        nefesPlanla();
      }
    },

    durdur,

    ayrikKapatildi() {
      planZaman = zamanlayiciTemizle(planZaman);
      nefesDurdur();
      if (evresi === "oynuyor") {
        durdur({ temizle: false, kanalDokunuldu: false });
      } else {

        if (evresi === "planlandi") evresi = "bekliyor";
        if (ipucuAcik) ipucuAyarla(false);
      }
    },

    temizle() {
      planZaman = zamanlayiciTemizle(planZaman);
      adimZaman = zamanlayiciTemizle(adimZaman);
      ipucuZaman = zamanlayiciTemizle(ipucuZaman);
      nefesDurdur();
    },

    durum() {
      return {
        evresi,
        adimIndeks,
        aktifKanal: adimIndeks >= 0 ? TUR_SIRASI[adimIndeks] : null,
        gorunur,
        etkilesimOldu,
        ipucuAcik,
        nefesAcik,
        nefesSayi,
      };
    },
  };
}

class KanalAyrimi extends HTMLElement {
  connectedCallback() {
    if (this._kuruldu) return;
    this._kuruldu = true;

    this._solo = null;
    this._hover = null;
    this._sonOlay = { aktif: null, solo: false, soloKanal: null };

    this._gorunur = false;
    this._rx = MERKEZ_RX;
    this._rz = MERKEZ_RZ;
    this._hedefRx = MERKEZ_RX;
    this._hedefRz = MERKEZ_RZ;
    this._imlecSahne = false;
    this._egimRaf = 0;
    this._ornekRaf = 0;
    this._sonImlec = null;
    this._turDinleyiciTemizle = null;

    this.innerHTML = `
      <div class="ka-sahne">
        <div class="ka-yigin" style="--rx:${MERKEZ_RX}deg;--rz:${MERKEZ_RZ}deg">
          ${KATMANLAR.map((k, i) => `<div class="ka-katman" data-kanal="${k.id}" style="--i:${i}"><canvas></canvas>${KOSE_HTML}</div>`).join("")}
          <div class="ka-katman ka-asil" style="--i:0"><canvas></canvas>${KOSE_HTML}</div>
        </div>
        <div class="ka-lejant-sarici">
          <ol class="ka-lejant veri" aria-label="Emisyon kanalları">
            ${KANALLAR_USTTEN.map(
              (k, i) =>
                `<li><button type="button" class="ka-kanal" data-kanal="${k.id}" aria-pressed="false" style="--c:${k.css};--c-soluk:${k.soluk};--c-hale:${k.hale};--sira:${i}"><b>${k.ad}</b> <span>${k.dalga}</span></button></li>`,
            ).join("")}
          </ol>
          <span class="ka-ipucu veri" aria-hidden="true">kanallara dokun</span>
        </div>
      </div>
      <p class="ka-anlam veri" aria-live="polite" aria-hidden="true"></p>
      <div class="ka-ornek veri" aria-live="off">
        <span class="ka-ornek-ipucu">İmleci katmanların üstünde gezdir · canlı piksel tayfı</span>
        <span class="ka-ornek-deger" aria-hidden="true">
          ${KANALLAR_USTTEN.map(
            (k) =>
              `<span class="ka-ornek-kanal" data-ornek-kanal="${k.id}" style="--c:${k.css}"><b>${k.ad}</b><span class="ka-ornek-bar"><i data-ornek-bar="${k.id}"></i></span><span class="ka-ornek-yuzde" data-ornek-yuzde="${k.id}">00%</span></span>`,
          ).join("")}
        </span>
      </div>
      <div class="ka-alt">
        <p class="ka-altyazi veri"><span data-ka-durum>Tek RGB kare</span> · temsilî</p>
        <button class="ka-dugme veri" type="button" aria-pressed="false">Ayır</button>
      </div>`;

    this.setAttribute("role", "region");
    this.setAttribute("aria-label", `${this.getAttribute("alt") || "Fotoğraf"}; üç ışık katmanına ayrılan temsilî kanal görünümü`);

    this._sahne = this.querySelector(".ka-sahne");
    this._yigin = this.querySelector(".ka-yigin");
    this._katmanEl = [...this.querySelectorAll(".ka-katman[data-kanal]")];

    this._koseAyrik = [...this.querySelectorAll(".ka-katman[data-kanal] .ka-kose")];
    this._koseAsil = [...this.querySelectorAll(".ka-katman.ka-asil .ka-kose")];
    this._kanalDugmeleri = [...this.querySelectorAll(".ka-kanal")];
    this._ipucuEl = this.querySelector(".ka-ipucu");
    this._anlamEl = this.querySelector(".ka-anlam");
    this._ornekEl = this.querySelector(".ka-ornek");
    this._ornekBarlar = Object.fromEntries(KANALLAR_USTTEN.map((k) => [k.id, this.querySelector(`[data-ornek-bar="${k.id}"]`)]));
    this._ornekYuzdeler = Object.fromEntries(KANALLAR_USTTEN.map((k) => [k.id, this.querySelector(`[data-ornek-yuzde="${k.id}"]`)]));
    this._dugme = this.querySelector(".ka-dugme");
    this._durum = this.querySelector("[data-ka-durum]");

    const img = new Image();
    img.decoding = "async";
    img.src = this.getAttribute("src");
    img.onload = () => this._katmanlariCiz(img);

    this._dugme.addEventListener("click", () => {
      clearTimeout(this._acilisZaman);
      this._acilisZaman = 0;
      this._ilkAcildi = true;
      this.ayrik(!this.classList.contains("ayrik"));
    });

    this._turuKur();
    this._lejantiKur();
    this._sahneEtkilesimiKur();

    if (azHareket()) {
      this._ilkAcildi = true;
      this.ayrik(true);
    }

    this._gozcu = new IntersectionObserver(
      ([g]) => {
        this._gorunur = g.isIntersecting;
        if (!this._gorunur) {
          this._egimDurdur();
          if (this._acilisZaman) {
            clearTimeout(this._acilisZaman);
            this._acilisZaman = 0;
            if (!this.classList.contains("ayrik")) this._ilkAcildi = false;
          }
          this._tur?.gorunurlukDegis(false);
          return;
        }
        this._tur?.gorunurlukDegis(true, { zatenOynandi: turOynandiOku() });
        if (!azHareket() && !this._ilkAcildi) {
          this._ilkAcildi = true;
          this._acilisZaman = setTimeout(() => {
            this._acilisZaman = 0;
            if (this._gorunur) {
              this.ayrik(true);
              this._tur?.ayrilmaBasladi({ zatenOynandi: turOynandiOku() });
            }
          }, 720);
        }
      },
      { threshold: 0.35 },
    );
    this._gozcu.observe(this);
  }

  disconnectedCallback() {
    clearTimeout(this._acilisZaman);
    clearTimeout(this._sarsZaman);
    this._turDinleyicileriKapat();
    this._tur?.temizle();
    this._egimDurdur();
    if (this._ornekRaf) {
      cancelAnimationFrame(this._ornekRaf);
      this._ornekRaf = 0;
    }
    this._gozcu?.disconnect();
  }

  ayrik(acik) {
    this.classList.toggle("ayrik", acik);
    this._dugme.setAttribute("aria-pressed", String(acik));
    this._dugme.textContent = acik ? "Birleştir" : "Ayır";
    if (!acik) {
      this._turDinleyicileriKapat();
      this._tur?.ayrikKapatildi();
      this._egimDurdur();
      this._rx = MERKEZ_RX;
      this._rz = MERKEZ_RZ;
      this._hedefRx = MERKEZ_RX;
      this._hedefRz = MERKEZ_RZ;
      this._yigin.style.setProperty("--rx", `${MERKEZ_RX}deg`);
      this._yigin.style.setProperty("--rz", `${MERKEZ_RZ}deg`);
      if (this._solo || this._hover) {
        this._solo = null;
        this._hover = null;
        this._kanalDurumuGuncelle();
      }
    }
    this._durumGuncelle();
  }

  kanalSec(id) {
    const gecerli = id && KANAL_BILGI[id] ? id : null;
    this._tur?.durdur({ temizle: false, kanalDokunuldu: true });
    if (gecerli && !this.classList.contains("ayrik")) {
      clearTimeout(this._acilisZaman);
      this._acilisZaman = 0;
      this._ilkAcildi = true;
      this.ayrik(true);
    }
    this._solo = gecerli;
    this._kanalDurumuGuncelle();
  }

  kanalVurgula(id) {
    const gecerli = id && KANAL_BILGI[id] ? id : null;
    if (gecerli) {
      this._tur?.durdur({ temizle: true, kanalDokunuldu: false });
    }
    if (this._hover === gecerli) return;
    this._hover = gecerli;
    this._kanalDurumuGuncelle();
  }

  sars() {
    if (azHareket()) return;
    this.classList.remove("ka-sars");
    void this.offsetWidth;
    this.classList.add("ka-sars");
    clearTimeout(this._sarsZaman);
    this._sarsZaman = setTimeout(() => this.classList.remove("ka-sars"), 360);
  }

  carpismaKabugu() {
    const kaynak = this.classList.contains("ayrik") ? this._koseAyrik : this._koseAsil;
    if (!kaynak || !kaynak.length) return null;
    const noktalar = [];
    for (const kose of kaynak) {
      const r = kose.getBoundingClientRect();
      if (!Number.isFinite(r.left) || !Number.isFinite(r.top)) continue;
      noktalar.push({ x: r.left, y: r.top });
    }
    const zarf = disbukeyZarf(noktalar);
    if (zarf.length < 3) return null;
    let alan2 = 0;
    for (let i = 0; i < zarf.length; i++) {
      const a = zarf[i];
      const b = zarf[(i + 1) % zarf.length];
      alan2 += a.x * b.y - b.x * a.y;
    }
    if (Math.abs(alan2) < 16) return null;
    return zarf;
  }

  _turuKur() {
    this._tur = turMakinesiOlustur({
      azHareketMi: azHareket(),
      onAdim: (kanalId) => {
        if (kanalId && !this.classList.contains("ayrik")) return;
        this._solo = kanalId;
        this._kanalDurumuGuncelle();
      },
      onIpucu: (acik) => {
        this._ipucuEl?.classList.toggle("gorunur", acik);
      },
      onTurBasladi: () => {
        turOynandiYaz();
        if (!azHareket()) this._turDinleyicileriAc();
      },
      onBitti: () => {
        this._turDinleyicileriKapat();
      },
      onNefes: (etkin) => {
        if (!this.classList.contains("ayrik") && etkin) return;
        this.classList.toggle("ka-nefes", etkin);
      },
    });
  }

  _turDinleyicileriAc() {
    this._turDinleyicileriKapat();
    const baslangicY = window.scrollY;
    const kanalHedefiMi = (el) => Boolean(el?.closest?.(".ka-kanal, .emisyon-cetvel [data-cetvel]"));

    const tiklama = (e) => {
      this._tur?.durdur({ temizle: true, kanalDokunuldu: kanalHedefiMi(e.target) });
    };
    const tus = (e) => {
      const secimTusu = (e.key === "Enter" || e.key === " ") && kanalHedefiMi(e.target);
      this._tur?.durdur({ temizle: true, kanalDokunuldu: secimTusu });
    };
    const kaydir = () => {
      if (Math.abs(window.scrollY - baslangicY) > 2) {
        this._tur?.durdur({ temizle: true, kanalDokunuldu: false });
      }
    };
    const teker = () => {
      this._tur?.durdur({ temizle: true, kanalDokunuldu: false });
    };
    const sahneImlec = (e) => {
      if (e.pointerType === "touch") return;
      this._tur?.durdur({ temizle: true, kanalDokunuldu: false });
    };

    document.addEventListener("pointerdown", tiklama, { capture: true, passive: true });
    window.addEventListener("keydown", tus, { capture: true, passive: true });
    window.addEventListener("scroll", kaydir, { passive: true });
    window.addEventListener("wheel", teker, { passive: true });
    window.addEventListener("touchmove", teker, { passive: true });
    this._sahne?.addEventListener("pointerenter", sahneImlec, { passive: true });
    this._sahne?.addEventListener("pointermove", sahneImlec, { passive: true });

    this._turDinleyiciTemizle = () => {
      document.removeEventListener("pointerdown", tiklama, { capture: true });
      window.removeEventListener("keydown", tus, { capture: true });
      window.removeEventListener("scroll", kaydir);
      window.removeEventListener("wheel", teker);
      window.removeEventListener("touchmove", teker);
      this._sahne?.removeEventListener("pointerenter", sahneImlec);
      this._sahne?.removeEventListener("pointermove", sahneImlec);
    };
  }

  _turDinleyicileriKapat() {
    if (this._turDinleyiciTemizle) {
      this._turDinleyiciTemizle();
      this._turDinleyiciTemizle = null;
    }
  }

  _durumGuncelle() {
    if (!this.classList.contains("ayrik")) {
      this._durum.textContent = "Tek RGB kare";
      return;
    }
    if (this._solo && KANAL_BILGI[this._solo]) {
      const b = KANAL_BILGI[this._solo];
      this._durum.textContent = "";
      const sembol = document.createElement("span");
      sembol.className = "kucuk-harf";
      sembol.textContent = `${b.ad} · ${b.dalga}`;
      this._durum.append("Yalnız ", sembol);
      return;
    }
    this._durum.textContent = "Üç ışık katmanı";
  }

  _lejantiKur() {
    for (const dugme of this._kanalDugmeleri) {
      const id = dugme.dataset.kanal;
      const gir = () => {
        this.kanalVurgula(id);
      };
      const cik = () => {
        if (this._hover === id) {
          this.kanalVurgula(null);
        }
      };
      dugme.addEventListener("pointerenter", gir);
      dugme.addEventListener("pointerleave", cik);
      dugme.addEventListener("focus", gir);
      dugme.addEventListener("blur", cik);
      dugme.addEventListener("click", () => {
        const yeni = this._solo === id ? null : id;
        this.kanalSec(yeni);
      });
    }
  }

  _kanalDurumuGuncelle() {
    const aktif = this._hover || this._solo || null;
    const solo = Boolean(this._solo && (!this._hover || this._hover === this._solo));

    for (const k of KATMANLAR) {
      this.classList.toggle(`solo-${k.id}`, this._solo === k.id);
      this.classList.toggle(`hover-${k.id}`, this._hover === k.id);
    }
    if (aktif) this.dataset.kanalAktif = aktif;
    else delete this.dataset.kanalAktif;

    for (const katman of this._katmanEl) {
      const kid = katman.dataset.kanal;
      katman.classList.toggle("one", aktif === kid);
      katman.classList.toggle("soluk", Boolean(aktif && aktif !== kid));
    }

    for (const dugme of this._kanalDugmeleri) {
      const kid = dugme.dataset.kanal;
      const secili = this._solo === kid;
      const vurgulu = this._hover === kid;
      dugme.setAttribute("aria-pressed", String(secili));
      dugme.classList.toggle("etkin", secili);

      dugme.classList.toggle("vurgulu", vurgulu);
    }

    if (this._anlamEl) {
      const anlam = this._solo ? KANAL_ANLAM[this._solo] : null;
      if (anlam) {
        this._anlamEl.textContent = anlam;
        this._anlamEl.style.setProperty("--c", KANAL_BILGI[this._solo].css);
        this._anlamEl.classList.add("gorunur");
        this._anlamEl.setAttribute("aria-hidden", "false");
      } else {
        this._anlamEl.classList.remove("gorunur");
        this._anlamEl.setAttribute("aria-hidden", "true");
      }
    }

    this._durumGuncelle();

    if (this._sonOlay.aktif !== aktif || this._sonOlay.solo !== solo || this._sonOlay.soloKanal !== this._solo) {
      this._sonOlay = { aktif, solo, soloKanal: this._solo };
      document.dispatchEvent(new CustomEvent("kanal-degis", { detail: { aktif, solo, soloKanal: this._solo } }));
    }
  }

  _sahneEtkilesimiKur() {
    const hareket = (e) => {
      if (e.pointerType === "touch") return;
      const s = this._sahne.getBoundingClientRect();
      if (!s.width || !s.height) return;
      this._imlecSahne = true;

      if (!azHareket() && this.classList.contains("ayrik")) {
        const nx = Math.max(-1, Math.min(1, ((e.clientX - s.left) / s.width) * 2 - 1));
        const ny = Math.max(-1, Math.min(1, ((e.clientY - s.top) / s.height) * 2 - 1));
        this._hedefRx = MERKEZ_RX - ny * 10;
        this._hedefRz = MERKEZ_RZ + nx * 11;
        this._egimBaslat();
      }

      if (this._ornekTampon) {
        this._sonImlec = { x: e.clientX, y: e.clientY };
        if (!this._ornekRaf) {
          this._ornekRaf = requestAnimationFrame(() => {
            this._ornekRaf = 0;
            this._ornekGuncelle();
          });
        }
      }
    };

    const cikis = () => {
      this._imlecSahne = false;
      this._sonImlec = null;
      this._hedefRx = MERKEZ_RX;
      this._hedefRz = MERKEZ_RZ;
      if (!azHareket() && this.classList.contains("ayrik")) {
        this._egimBaslat();
      }
      this._ornekSifirla();
    };

    this._sahne.addEventListener("pointermove", hareket, { passive: true });
    this._sahne.addEventListener("pointerleave", cikis, { passive: true });
  }

  _egimBaslat() {
    if (this._egimRaf || azHareket() || !this._gorunur) return;
    this._yigin.classList.add("egiliyor");
    const adim = () => {
      if (!this._gorunur || !this.classList.contains("ayrik") || azHareket()) {
        this._egimDurdur();
        return;
      }
      this._rx += (this._hedefRx - this._rx) * LERP;
      this._rz += (this._hedefRz - this._rz) * LERP;
      this._yigin.style.setProperty("--rx", `${this._rx.toFixed(2)}deg`);
      this._yigin.style.setProperty("--rz", `${this._rz.toFixed(2)}deg`);

      const yakin = Math.abs(this._rx - this._hedefRx) < 0.03 && Math.abs(this._rz - this._hedefRz) < 0.03;
      if (!this._imlecSahne && yakin) {
        this._rx = MERKEZ_RX;
        this._rz = MERKEZ_RZ;
        this._yigin.style.setProperty("--rx", `${MERKEZ_RX}deg`);
        this._yigin.style.setProperty("--rz", `${MERKEZ_RZ}deg`);
        this._egimDurdur();
        return;
      }
      this._egimRaf = requestAnimationFrame(adim);
    };
    this._egimRaf = requestAnimationFrame(adim);
  }

  _egimDurdur() {
    if (this._egimRaf) {
      cancelAnimationFrame(this._egimRaf);
      this._egimRaf = 0;
    }
    this._yigin?.classList.remove("egiliyor");
  }

  _ornekGuncelle() {
    if (!this._sonImlec || !this._ornekTampon) return;
    const k = this._yigin.getBoundingClientRect();
    if (!k.width || !k.height) return;
    const u = (this._sonImlec.x - k.left) / k.width;
    const v = (this._sonImlec.y - k.top) / k.height;
    if (u < 0 || u > 1 || v < 0 || v > 1) {
      this._ornekSifirla();
      return;
    }

    const ix = Math.max(0, Math.min(ORNEK_BOY - 1, Math.floor(u * ORNEK_BOY)));
    const iy = Math.max(0, Math.min(ORNEK_BOY - 1, Math.floor(v * ORNEK_BOY)));
    const p = (iy * ORNEK_BOY + ix) * 4;
    const r = this._ornekTampon[p];
    const g = this._ornekTampon[p + 1];
    const b = this._ornekTampon[p + 2];

    const r0 = Math.max(0, r - 12);
    const g0 = Math.max(0, g - 12);
    const b0 = Math.max(0, b - 12);
    const t0 = r0 + g0 + b0;
    const vr = t0 > 4 ? r0 : r;
    const vg = t0 > 4 ? g0 : g;
    const vb = t0 > 4 ? b0 : b;
    const toplam = vr + vg + vb;

    const ha = toplam ? Math.round((vr / toplam) * 100) : 0;
    const oiii = toplam ? Math.round((vg / toplam) * 100) : 0;
    const hb = toplam ? Math.max(0, 100 - ha - oiii) : 0;
    const degerler = { ha, oiii, hb };

    this._ornekEl.classList.add("ornek-aktif");
    for (const [id, yuzde] of Object.entries(degerler)) {
      const bar = this._ornekBarlar[id];
      const yazi = this._ornekYuzdeler[id];
      if (bar) {
        const oran = (yuzde / 100).toFixed(3);
        bar.style.setProperty("--oran", oran);
        bar.style.transform = `scaleX(${oran})`;
      }
      if (yazi) yazi.textContent = `${String(yuzde).padStart(2, "0")}%`;
    }
  }

  _ornekSifirla() {
    this._ornekEl?.classList.remove("ornek-aktif");
  }

  _katmanlariCiz(img) {
    const [kx, ky, kg, kh] = (this.getAttribute("kirp") || "0 0 1 1").trim().split(BOSLUK_AYIR).map(Number);
    const sx = kx * img.naturalWidth;
    const sy = ky * img.naturalHeight;
    const sg = kg * img.naturalWidth;
    const sh = kh * img.naturalHeight;
    const G = 1100;
    const Y = Math.round((sh / sg) * G);
    this.style.setProperty("--oran", `${G} / ${Y}`);

    const kaynak = document.createElement("canvas");
    kaynak.width = G;
    kaynak.height = Y;
    const kc = kaynak.getContext("2d", { willReadFrequently: true });
    kc.drawImage(img, sx, sy, sg, sh, 0, 0, G, Y);
    const veri = kc.getImageData(0, 0, G, Y).data;

    const ornekTuval = document.createElement("canvas");
    ornekTuval.width = ORNEK_BOY;
    ornekTuval.height = ORNEK_BOY;
    const oc = ornekTuval.getContext("2d", { willReadFrequently: true });
    oc.drawImage(kaynak, 0, 0, ORNEK_BOY, ORNEK_BOY);
    this._ornekTampon = oc.getImageData(0, 0, ORNEK_BOY, ORNEK_BOY).data;

    const tuvaller = this.querySelectorAll(".ka-katman canvas");

    const asil = tuvaller[KATMANLAR.length];
    asil.width = G;
    asil.height = Y;
    asil.getContext("2d").drawImage(kaynak, 0, 0);

    KATMANLAR.forEach(({ kanal, renk }, i) => {
      const katman = document.createElement("canvas");
      katman.width = G;
      katman.height = Y;
      const c = katman.getContext("2d");
      const cikti = c.createImageData(G, Y);
      const d = cikti.data;
      for (let p = 0; p < veri.length; p += 4) {
        const v = veri[p + kanal] / 255;
        const a = Math.min(1, Math.pow(Math.max(0, v - 0.09) / 0.91, 0.95) * 3.4);
        d[p] = renk[0];
        d[p + 1] = renk[1];
        d[p + 2] = renk[2];
        d[p + 3] = a * 255;
      }
      c.putImageData(cikti, 0, 0);

      const hedef = tuvaller[i];
      hedef.width = G;
      hedef.height = Y;
      const h = hedef.getContext("2d");
      h.filter = "blur(6px)";
      h.globalAlpha = 0.9;
      h.drawImage(katman, 0, 0);
      h.filter = "none";
      h.globalAlpha = 1;
      h.globalCompositeOperation = "lighter";
      h.drawImage(katman, 0, 0);
    });
    this.classList.add("hazir");
  }
}

customElements.define("kanal-ayrimi", KanalAyrimi);
