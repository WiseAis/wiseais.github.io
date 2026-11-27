import { azHareket } from "../lib/rastgele.js?v=20261127a";
import { gozlemGokKur } from "./gozlem-gok.js?v=20261127a";

const SVG_NS = "http://www.w3.org/2000/svg";
const MERCEK_CAP = 160;
const BAS_TUT_MS = 175;
const TIK_HAREKET_ESIK = 7;

export function tersGermeDeger(x, k) {
  const kk = Math.max(0, Math.min(1, Number(k) || 0));
  const xx = Math.max(0, Math.min(1, Number(x) || 0));
  if (kk >= 0.995) return xx;
  const us = 1 + Math.pow(1 - kk, 1.5) * 3.6;
  const kara = Math.pow(1 - kk, 2) * 0.05;
  return Math.pow(Math.max(0, xx - kara) / (1 - kara), us);
}

export function germeTablosuUret(k) {
  const tablo = new Uint8ClampedArray(256);
  const kk = Math.max(0, Math.min(1, Number(k) || 0));
  if (kk >= 0.995) {
    for (let i = 0; i < 256; i++) tablo[i] = i;
    return tablo;
  }
  const us = 1 + Math.pow(1 - kk, 1.5) * 3.6;
  const kara = Math.pow(1 - kk, 2) * 0.05;
  for (let i = 0; i < 256; i++) {
    tablo[i] = Math.pow(Math.max(0, i / 255 - kara) / (1 - kara), us) * 255;
  }
  return tablo;
}

export function egriYoluUret(k, genislik = 48, yukseklik = 24, pay = 2) {
  const kk = Math.max(0, Math.min(1, Number(k) || 0));
  const icG = genislik - pay * 2;
  const icY = yukseklik - pay * 2;
  const us = 1 + Math.pow(kk, 1.5) * 3.6;
  const adim = 20;
  let d = "";
  for (let i = 0; i <= adim; i++) {
    const t = i / adim;
    const yDeger = Math.pow(t, 1 / us);
    const px = pay + t * icG;
    const py = pay + (1 - yDeger) * icY;
    d += `${i === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)}`;
  }
  return d;
}

export function gorselAlaniHesapla(kutuG, kutuY, dogalG, dogalY) {
  if (!kutuG || !kutuY || !dogalG || !dogalY) {
    return { x: 0, y: 0, g: kutuG || 0, yk: kutuY || 0 };
  }
  const kutuOran = kutuG / kutuY;
  const fotoOran = dogalG / dogalY;
  if (fotoOran > kutuOran) {
    const g = kutuG;
    const yk = kutuG / fotoOran;
    return { x: 0, y: (kutuY - yk) * 0.5, g, yk };
  }
  const yk = kutuY;
  const g = kutuY * fotoOran;
  return { x: (kutuG - g) * 0.5, y: 0, g, yk };
}

export function mercekKaynakHesapla(kutu, alan, cx, cy, kaynakG, kaynakY, mercekCap = MERCEK_CAP, yakinlastirma = 2) {
  const yerelX = cx - kutu.left;
  const yerelY = cy - kutu.top;
  const g = Math.max(1, alan.g);
  const yk = Math.max(1, alan.yk);
  const u = Math.max(0, Math.min(1, (yerelX - alan.x) / g));
  const v = Math.max(0, Math.min(1, (yerelY - alan.y) / yk));
  const mx = alan.x + u * g;
  const my = alan.y + v * yk;

  const z = Math.max(1, Number(yakinlastirma) || 1);
  const cssToSrcX = kaynakG / g;
  const cssToSrcY = kaynakY / yk;
  const sw = Math.min(kaynakG, (mercekCap * cssToSrcX) / z);
  const sh = Math.min(kaynakY, (mercekCap * cssToSrcY) / z);
  const sx = Math.max(0, Math.min(kaynakG - sw, u * kaynakG - sw * 0.5));
  const sy = Math.max(0, Math.min(kaynakY - sh, v * kaynakY - sh * 0.5));
  return { mx, my, u, v, sx, sy, sw, sh };
}

const ornekler = new Set();
let klavyeBaglandi = false;
let acikTamEkran = null;

function etkinOrnekBul() {
  if (acikTamEkran) return acikTamEkran;
  const odak = document.activeElement;
  if (odak instanceof Element) {
    const ic = odak.closest("germe-foto");
    if (ic) return ic;
  }
  const aktifEkranId = document.body?.dataset?.ekran;
  if (aktifEkranId) {
    const bolum = document.getElementById(aktifEkranId);
    const gf = bolum?.querySelector("germe-foto");
    if (gf) return gf;
  }
  for (const gf of ornekler) {
    if (gf._gorunur) return gf;
  }
  return null;
}

function klavyeKur() {
  if (klavyeBaglandi || typeof document === "undefined") return;
  klavyeBaglandi = true;
  document.addEventListener("keydown", (e) => {
    if (e.key !== "l" && e.key !== "L") return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const hedef = e.target instanceof Element ? e.target : document.body;
    if (hedef.closest("input:not([type='range']), textarea, select, [contenteditable]")) return;
    const ornek = etkinOrnekBul();
    if (!ornek) return;
    e.preventDefault();
    ornek.modDegistir();
  });
}

function miniEgriSvgKur() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "gf-egri");
  svg.setAttribute("viewBox", "0 0 48 24");
  svg.setAttribute("width", "48");
  svg.setAttribute("height", "24");
  svg.setAttribute("aria-hidden", "true");

  const ref = document.createElementNS(SVG_NS, "line");
  ref.setAttribute("class", "gf-egri-ref");
  ref.setAttribute("x1", "2");
  ref.setAttribute("y1", "22");
  ref.setAttribute("x2", "46");
  ref.setAttribute("y2", "2");

  const hale = document.createElementNS(SVG_NS, "path");
  hale.setAttribute("class", "gf-egri-hale");
  hale.setAttribute("d", egriYoluUret(1));

  const hat = document.createElementNS(SVG_NS, "path");
  hat.setAttribute("class", "gf-egri-hat");
  hat.setAttribute("d", egriYoluUret(1));

  svg.append(ref, hale, hat);
  return { svg, hale, hat };
}

const TemelOge = typeof HTMLElement !== "undefined" ? HTMLElement : class {};

class GermeFoto extends TemelOge {
  connectedCallback() {
    if (this._kuruldu) return;
    this._kuruldu = true;
    ornekler.add(this);
    klavyeKur();
    gozlemGokKur();

    const alt = this.getAttribute("alt") || "";
    this._kucukUrl = this.getAttribute("src") || "";
    this._buyukUrl = this.getAttribute("buyuk") || this._kucukUrl;
    this._gorunur = false;
    this._etkilesimOldu = false;
    this._nefesYapildi = false;
    this._kutu = null;
    this._alan = null;
    this._sonKonum = null;
    this._mercekRaf = 0;
    this._bekleyen = null;
    this._buyukImg = null;
    this._buyukHazir = false;
    this._buyukYukleniyor = false;
    this._basTut = null;
    this._yakinlastirmaAktif = false;
    this._tam = null;

    const id = `germe-${Math.random().toString(36).slice(2, 8)}`;

    this.innerHTML = `
      <div class="gf-kare" tabindex="0" role="group" aria-label="Fotoğraf ışık inceleme yüzeyi: tıklayıp lineer geçişi yap, basılı tutup 2 kat büyüt">
        <div class="gf-gorsel-katman">
          <img src="${this._kucukUrl}" alt="${alt.replaceAll('"', "&quot;")}" loading="lazy" decoding="async" draggable="false">
          <canvas class="gf-lineer-tuval" aria-hidden="true"></canvas>
        </div>
        <div class="gf-mercek" aria-hidden="true">
          <canvas class="gf-mercek-tuval"></canvas>
          <span class="gf-nisangah"></span>
        </div>
        <span class="gf-darbe-katman" aria-hidden="true"></span>
      </div>
      <div class="gf-kontrol">
        <button type="button" class="gf-uc veri" data-gf-uc="0" aria-label="Lineer ham görünüm">Lineer</button>
        <div class="gf-surgu-sarici">
          <label class="gizli" for="${id}">Germe: lineerden gerilmişe</label>
          <input id="${id}" type="range" min="0" max="100" value="100" aria-label="Germe: lineerden gerilmişe">
          <span class="gf-egri-kap" aria-hidden="true"></span>
        </div>
        <button type="button" class="gf-uc veri etkin" data-gf-uc="100" aria-label="Gerilmiş görünüm">Gerilmiş</button>
        <button type="button" class="gf-tamekran veri" aria-label="Tam ekran ışık kutusu" title="Tam ekran">
          <span class="gf-tamekran-simge" aria-hidden="true">⛶</span><span class="gf-tamekran-yazi">Tam ekran</span>
        </button>
      </div>
      <div class="gf-hud veri" aria-live="polite">
        <span class="gf-durum">Germe %100 · temsilî</span>
        <span class="gf-ipucu">L · ham kare · basılı tut · 2×</span>
      </div>`;

    this._kareEl = this.querySelector(".gf-kare");
    this._img = this.querySelector(".gf-gorsel-katman img");
    this._tuval = this.querySelector(".gf-lineer-tuval");
    this._mercekEl = this.querySelector(".gf-mercek");
    this._mercekTuval = this.querySelector(".gf-mercek-tuval");
    this._darbeKatman = this.querySelector(".gf-darbe-katman");
    this._girdi = this.querySelector("input");
    this._durumEl = this.querySelector(".gf-durum");
    this._ipucuEl = this.querySelector(".gf-ipucu");
    this._ucDugmeler = [...this.querySelectorAll("[data-gf-uc]")];
    this._tamBtn = this.querySelector(".gf-tamekran");

    const egri = miniEgriSvgKur();
    this._egriHale = egri.hale;
    this._egriHat = egri.hat;
    this.querySelector(".gf-egri-kap").append(egri.svg);

    this._kareEl.aisDarbe = (x, y, nx, ny) => this.aisDarbe(x, y, nx, ny);

    this._girdi.style.setProperty("--oran", "1");
    this._mercekTuvalHazirla(this._mercekTuval);
    this._olaylariBagla();

    this._gozcu = new IntersectionObserver(
      ([g]) => {
        if (!g) return;
        this._gorunur = g.isIntersecting;
        if (this._gorunur && !this._nefesYapildi && !azHareket()) {
          this._nefesYapildi = true;
          this.classList.add("gf-nefes");
          setTimeout(() => this.classList.remove("gf-nefes"), 1400);
        }
        if (!this._gorunur) {
          this._mercekKapat();
        }
      },
      { threshold: 0.25 },
    );
    this._gozcu.observe(this);

    this._kutuSifirlaBagli = () => {
      this._kutu = null;
      this._alan = null;
      if (this._anaHedef) {
        this._anaHedef.kutu = null;
        this._anaHedef.alan = null;
      }
    };
    window.addEventListener("scroll", this._kutuSifirlaBagli, { passive: true, capture: true });
    window.addEventListener("resize", this._kutuSifirlaBagli, { passive: true });
  }

  disconnectedCallback() {
    ornekler.delete(this);
    this._gozcu?.disconnect();
    this._anaHedef?.temizle?.();
    this._tamEkranKapa(false);
    if (this._mercekRaf) cancelAnimationFrame(this._mercekRaf);
    clearTimeout(this._basTutZaman);
    window.removeEventListener("scroll", this._kutuSifirlaBagli, { capture: true });
    window.removeEventListener("resize", this._kutuSifirlaBagli);
  }

  get germe() {
    return Number(this._girdi?.value ?? 100);
  }

  germeAyarla(deger) {
    const v = Math.max(0, Math.min(100, Math.round(Number(deger) || 0)));
    if (this._girdi) this._girdi.value = String(v);
    if (this._tam?.girdi) this._tam.girdi.value = String(v);
    this._etkilesimIsaretle();
    this._planla();
  }

  modDegistir() {
    this.germeAyarla(this.germe > 50 ? 0 : 100);
  }

  aisDarbe(ekranX, ekranY) {
    if (azHareket() || !this._kareEl || !this._darbeKatman) return;
    const r = this._kareEl.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const x = Math.max(0, Math.min(r.width, ekranX - r.left));
    const y = Math.max(0, Math.min(r.height, ekranY - r.top));
    const halka = document.createElement("span");
    halka.className = "gf-darbe-halka";
    halka.style.left = `${x.toFixed(1)}px`;
    halka.style.top = `${y.toFixed(1)}px`;
    this._darbeKatman.append(halka);
    const sil = () => halka.remove();
    halka.addEventListener("animationend", sil, { once: true });
    setTimeout(sil, 620);

    this._kareEl.classList.remove("gf-optik-nabiz");
    void this._kareEl.offsetWidth;
    this._kareEl.classList.add("gf-optik-nabiz");
    clearTimeout(this._darbeNabizZaman);
    this._darbeNabizZaman = setTimeout(() => this._kareEl?.classList.remove("gf-optik-nabiz"), 460);
  }

  _olaylariBagla() {
    this._girdi.addEventListener("input", () => {
      this._etkilesimIsaretle();
      if (this._tam?.girdi) this._tam.girdi.value = this._girdi.value;
      this._planla();
    });

    for (const btn of this._ucDugmeler) {
      btn.addEventListener("click", () => this.germeAyarla(Number(btn.dataset.gfUc)));
    }

    this._tamBtn.addEventListener("click", () => this._tamEkranAc());

    this._img.addEventListener("load", () => {
      this._kaynak = null;
      this._kutuSifirlaBagli?.();
      if (this.germe < 100) this._planla();
    });

    this._anaHedef = this._yuzeyOlaylariBagla(this._kareEl, this._mercekEl, this._mercekTuval, () => this._img, false);

    this._kareEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.modDegistir();
      }
    });
  }

  _etkilesimIsaretle() {
    if (this._etkilesimOldu) return;
    this._etkilesimOldu = true;
    this.classList.add("gf-kullanildi");
  }

  _mercekTuvalHazirla(tuval) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const p = Math.round(MERCEK_CAP * dpr);
    tuval.width = p;
    tuval.height = p;
  }

  _buyukYukle(hazirOlunca) {
    if (this._buyukHazir && this._buyukImg) {
      hazirOlunca?.(this._buyukImg);
      return;
    }
    if (!this._buyukUrl || this._buyukUrl === this._kucukUrl) {
      hazirOlunca?.(this._img);
      return;
    }
    if (hazirOlunca) {
      this._buyukBekleyen ||= [];
      this._buyukBekleyen.push(hazirOlunca);
    }
    if (this._buyukYukleniyor) return;
    this._buyukYukleniyor = true;
    const img = new Image();
    img.decoding = "async";
    const bitir = () => {
      this._buyukYukleniyor = false;
      this._buyukImg = img;
      this._buyukHazir = Boolean(img.naturalWidth);
      const kuyruk = this._buyukBekleyen || [];
      this._buyukBekleyen = [];
      for (const fn of kuyruk) fn(this._buyukHazir ? img : this._img);
      if (this._tam && this._buyukHazir) {
        this._tam.img.src = this._buyukUrl;
        this._tam.kaynak = null;
        if (this.germe < 100) this._tamCiz();
      }
      if (this._yakinlastirmaAktif && this._sonKonum) {
        this._mercekCizPlanla(this._sonKonum.hedef, this._sonKonum.cx, this._sonKonum.cy);
      }
      this._durumGuncelle();
    };
    img.onload = () => {
      if (typeof img.decode === "function") img.decode().then(bitir, bitir);
      else bitir();
    };
    img.onerror = () => {
      this._buyukYukleniyor = false;
      this._buyukBekleyen = [];
    };
    img.src = this._buyukUrl;
  }

  _yuzeyOlaylariBagla(yuzey, mercekEl, mercekTuval, gorselAl, tamEkranMi) {
    const hedef = { yuzey, mercekEl, mercekTuval, gorselAl, tamEkranMi, kutu: null, alan: null };

    const olc = () => {
      const r = yuzey.getBoundingClientRect();
      const img = gorselAl();
      const dogalG = img?.naturalWidth || 1000;
      const dogalY = img?.naturalHeight || 700;
      hedef.kutu = { left: r.left, top: r.top, width: r.width, height: r.height };
      hedef.alan = gorselAlaniHesapla(r.width, r.height, dogalG, dogalY);
      if (!tamEkranMi) {
        this._kutu = hedef.kutu;
        this._alan = hedef.alan;
      }
    };

    const basTutIptal = () => {
      clearTimeout(this._basTutZaman);
      this._basTutZaman = 0;
      if (this._yakinlastirmaAktif) {
        this._yakinlastirmaAktif = false;
        yuzey.classList.remove("gf-yakin", "gf-mercek-kilit");
        this._durumGuncelle();
        if (this._basTut?.dokunmatik) {
          this._mercekKapatHedef(hedef);
        } else if (this._sonKonum?.hedef === hedef) {
          this._mercekCizPlanla(hedef, this._sonKonum.cx, this._sonKonum.cy);
        }
      }
    };

    yuzey.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "touch") return;
      olc();
      this._sonKonum = { hedef, cx: e.clientX, cy: e.clientY };
      this._mercekCizPlanla(hedef, e.clientX, e.clientY);
    });

    yuzey.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") {
        if (!this._basTut || this._basTut.id !== e.pointerId) return;
        const mesafe = Math.hypot(e.clientX - this._basTut.x0, e.clientY - this._basTut.y0);
        if (!this._yakinlastirmaAktif) {

          if (mesafe > TIK_HAREKET_ESIK) {
            this._basTut.iptal = true;
            clearTimeout(this._basTutZaman);
            this._basTutZaman = 0;
          }
          return;
        }
        e.preventDefault();
        this._sonKonum = { hedef, cx: e.clientX, cy: e.clientY };
        this._mercekCizPlanla(hedef, e.clientX, e.clientY);
        return;
      }

      if (this._basTut && this._basTut.id === e.pointerId) {
        if (Math.hypot(e.clientX - this._basTut.x0, e.clientY - this._basTut.y0) > TIK_HAREKET_ESIK) {
          this._basTut.suruklendi = true;
        }
      }
      this._sonKonum = { hedef, cx: e.clientX, cy: e.clientY };
      this._mercekCizPlanla(hedef, e.clientX, e.clientY);
    });

    yuzey.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      olc();
      const dokunmatik = e.pointerType === "touch";
      if (!dokunmatik) e.preventDefault();
      this._basTut = {
        id: e.pointerId,
        x0: e.clientX,
        y0: e.clientY,
        bas: performance.now(),
        dokunmatik,
        suruklendi: false,
        iptal: false,
        hedef,
      };
      this._sonKonum = { hedef, cx: e.clientX, cy: e.clientY };

      clearTimeout(this._basTutZaman);
      this._basTutZaman = setTimeout(() => {
        this._basTutZaman = 0;
        if (!this._basTut || this._basTut.iptal || this._basTut.hedef !== hedef) return;
        this._etkilesimIsaretle();
        this._yakinlastirmaAktif = true;
        yuzey.classList.add("gf-yakin");
        if (dokunmatik) yuzey.classList.add("gf-mercek-kilit");
        this._buyukYukle();
        this._durumGuncelle();
        const p = this._sonKonum || { cx: e.clientX, cy: e.clientY };
        this._mercekCizPlanla(hedef, p.cx, p.cy);
      }, BAS_TUT_MS);
    });

    const bitir = (e) => {
      if (!this._basTut || (e && this._basTut.id !== e.pointerId)) return;
      const kayit = this._basTut;
      this._basTut = null;
      const kisaTik =
        e?.type === "pointerup" &&
        !kayit.iptal &&
        !kayit.suruklendi &&
        !this._yakinlastirmaAktif &&
        performance.now() - kayit.bas < BAS_TUT_MS + 40;
      basTutIptal();
      if (kisaTik) {
        this.modDegistir();
        if (!kayit.dokunmatik && this._sonKonum?.hedef === hedef) {
          this._mercekCizPlanla(hedef, this._sonKonum.cx, this._sonKonum.cy);
        }
      }
    };

    yuzey.addEventListener("pointerup", bitir);

    window.addEventListener("pointerup", bitir, { passive: true });
    yuzey.addEventListener("pointercancel", () => {
      this._basTut = null;
      basTutIptal();
      this._mercekKapatHedef(hedef);
    });
    hedef.temizle = () => window.removeEventListener("pointerup", bitir);
    yuzey.addEventListener("pointerleave", () => {
      if (this._basTut && !this._basTut.dokunmatik) {
        this._basTut = null;
        basTutIptal();
      }
      if (this._sonKonum?.hedef === hedef) this._sonKonum = null;
      this._mercekKapatHedef(hedef);
    });

    yuzey.addEventListener("focus", () => {
      if (this.germe >= 99.5) return;
      olc();
      if (!hedef.kutu) return;
      this._mercekCizPlanla(hedef, hedef.kutu.left + hedef.kutu.width * 0.5, hedef.kutu.top + hedef.kutu.height * 0.5);
    });
    yuzey.addEventListener("blur", () => {
      this._mercekKapatHedef(hedef);
    });

    return hedef;
  }

  _mercekCizPlanla(hedef, cx, cy) {
    this._bekleyen = { hedef, cx, cy };
    if (this._mercekRaf) return;
    this._mercekRaf = requestAnimationFrame(() => {
      this._mercekRaf = 0;
      const p = this._bekleyen;
      this._bekleyen = null;
      if (!p) return;
      this._mercekCiz(p.hedef, p.cx, p.cy);
    });
  }

  _mercekCiz(hedef, cx, cy) {
    const img = hedef.gorselAl();
    if (!img || !img.complete || !img.naturalWidth) return;
    if (!hedef.kutu || !hedef.alan) {
      const r = hedef.yuzey.getBoundingClientRect();
      hedef.kutu = { left: r.left, top: r.top, width: r.width, height: r.height };
      hedef.alan = gorselAlaniHesapla(r.width, r.height, img.naturalWidth, img.naturalHeight);
    }

    const lineerMi = this.germe < 99.5;
    const yakinMi = this._yakinlastirmaAktif;
    const kaynakImg = yakinMi && this._buyukHazir && this._buyukImg ? this._buyukImg : img;
    const kaynakG = kaynakImg.naturalWidth || img.naturalWidth;
    const kaynakY = kaynakImg.naturalHeight || img.naturalHeight;
    const z = yakinMi ? 2 : 1;

    const k = mercekKaynakHesapla(hedef.kutu, hedef.alan, cx, cy, kaynakG, kaynakY, MERCEK_CAP, z);
    hedef.mercekEl.style.transform = `translate3d(${k.mx.toFixed(1)}px, ${k.my.toFixed(1)}px, 0)`;
    hedef.mercekEl.classList.add("acik");
    hedef.mercekEl.classList.toggle("optik-aktif", lineerMi || yakinMi);
    hedef.mercekEl.classList.toggle("yakin", yakinMi);

    if (lineerMi || yakinMi) {
      const ctx = hedef.mercekTuval.getContext("2d");
      if (ctx) {
        const w = hedef.mercekTuval.width;
        const h = hedef.mercekTuval.height;
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(kaynakImg, k.sx, k.sy, k.sw, k.sh, 0, 0, w, h);
      }
    }
  }

  _mercekKapatHedef(hedef) {
    if (this._bekleyen?.hedef === hedef) this._bekleyen = null;
    hedef.mercekEl?.classList.remove("acik", "optik-aktif", "yakin");
  }

  _mercekKapat() {
    this._bekleyen = null;
    this._yakinlastirmaAktif = false;
    this._kareEl?.classList.remove("gf-yakin", "gf-mercek-kilit");
    this._mercekEl?.classList.remove("acik", "optik-aktif", "yakin");
  }

  _planla() {
    if (this._bekliyor) return;
    this._bekliyor = true;
    requestAnimationFrame(() => {
      this._bekliyor = false;
      this._ciz();
    });
  }

  _kaynakHazirla(img, tuval, kapsayici) {
    if (!img.complete || !img.naturalWidth) return null;
    const kutu = kapsayici.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const G = Math.min(1800, Math.max(320, Math.round((kutu.width || 900) * dpr)));
    const Y = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * G));
    tuval.width = G;
    tuval.height = Y;
    const ctx = tuval.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, G, Y);
    return {
      ctx,
      kaynak: ctx.getImageData(0, 0, G, Y),
      cikti: ctx.createImageData(G, Y),
    };
  }

  _tuvaleTersGermeYaz(tampon, k) {
    const tablo = germeTablosuUret(k);
    const a = tampon.kaynak.data;
    const b = tampon.cikti.data;
    for (let i = 0; i < a.length; i += 4) {
      b[i] = tablo[a[i]];
      b[i + 1] = tablo[a[i + 1]];
      b[i + 2] = tablo[a[i + 2]];
      b[i + 3] = 255;
    }
    tampon.ctx.putImageData(tampon.cikti, 0, 0);
  }

  _ciz() {
    const k = this.germe / 100;
    this._girdi.style.setProperty("--oran", k.toFixed(3));
    const yol = egriYoluUret(k);
    this._egriHat?.setAttribute("d", yol);
    this._egriHale?.setAttribute("d", yol);
    if (this._tam) {
      this._tam.girdi.style.setProperty("--oran", k.toFixed(3));
      this._tam.egriHat.setAttribute("d", yol);
      this._tam.egriHale.setAttribute("d", yol);
    }

    const lineerMi = k < 0.995;
    for (const btn of this._ucDugmeler) {
      const uc = Number(btn.dataset.gfUc);
      btn.classList.toggle("etkin", uc === 0 ? lineerMi : !lineerMi);
    }
    if (this._tam) {
      for (const btn of this._tam.ucDugmeler) {
        const uc = Number(btn.dataset.gfUc);
        btn.classList.toggle("etkin", uc === 0 ? lineerMi : !lineerMi);
      }
    }

    if (!lineerMi) {
      this.classList.remove("lineer");
      this._tam?.kap.classList.remove("lineer");
    } else {
      if (!this._kaynak) {
        this._kaynak = this._kaynakHazirla(this._img, this._tuval, this._kareEl);
        if (!this._kaynak) {
          this._img.loading = "eager";
          this._durumGuncelle();
          return;
        }
      }
      this.classList.add("lineer");
      this._tuvaleTersGermeYaz(this._kaynak, k);
      if (this._tam) this._tamCiz();
    }

    if (this._sonKonum) {
      this._mercekCizPlanla(this._sonKonum.hedef, this._sonKonum.cx, this._sonKonum.cy);
    }
    this._durumGuncelle();
  }

  _tamCiz() {
    if (!this._tam) return;
    const k = this.germe / 100;
    if (k >= 0.995) {
      this._tam.kap.classList.remove("lineer");
      return;
    }
    if (!this._tam.kaynak) {
      this._tam.kaynak = this._kaynakHazirla(this._tam.img, this._tam.tuval, this._tam.yuzey);
      if (!this._tam.kaynak) return;
    }
    this._tam.kap.classList.add("lineer");
    this._tuvaleTersGermeYaz(this._tam.kaynak, k);
  }

  _durumGuncelle() {
    const k = this.germe / 100;
    let metin;
    if (this._yakinlastirmaAktif) {
      const w = this._buyukHazir && this._buyukImg?.naturalWidth ? this._buyukImg.naturalWidth : this._img?.naturalWidth || 1000;
      metin = `2× mercek · ${w} px`;
    } else if (k >= 0.995) {
      metin = "Germe %100 · temsilî";
    } else if (k < 0.15) {
      metin = "Lineer (ham) · merceği gezdir · temsilî";
    } else {
      metin = `Germe %${Math.round(k * 100)} · temsilî`;
    }
    if (this._durumEl) this._durumEl.textContent = metin;
    if (this._tam?.durumEl) this._tam.durumEl.textContent = metin;
  }

  _baslikMetni() {
    const bolum = this.closest("section");
    const kod = bolum?.dataset?.no || "";
    const h2 = bolum?.querySelector(".kayit-kunye h2");
    const anaBaslik = h2?.childNodes[0]?.textContent?.trim() || this.getAttribute("alt") || "Gözlem";
    return kod ? `${kod} · ${anaBaslik}` : anaBaslik;
  }

  _tamEkranAc() {
    if (this._tam) return;
    if (acikTamEkran && acikTamEkran !== this) acikTamEkran._tamEkranKapa(false);

    this._etkilesimIsaretle();
    const baslik = this._baslikMetni();
    const alt = this.getAttribute("alt") || "";
    const k = this.germe / 100;

    const kap = document.createElement("div");
    kap.className = `gf-tam${k < 0.995 ? " lineer" : ""}`;
    kap.setAttribute("role", "dialog");
    kap.setAttribute("aria-modal", "true");
    kap.setAttribute("aria-label", `${baslik} · tam ekran ışık kutusu`);
    kap.innerHTML = `
      <div class="gf-tam-ust">
        <span class="gf-tam-baslik veri">${baslik}</span>
        <button type="button" class="gf-tam-kapat veri" aria-label="Tam ekrandan çık">Esc · Kapat</button>
      </div>
      <div class="gf-tam-sahne" tabindex="0">
        <div class="gf-gorsel-katman">
          <img src="${this._buyukHazir ? this._buyukUrl : this._kucukUrl}" alt="${alt.replaceAll('"', "&quot;")}" decoding="async" draggable="false">
          <canvas class="gf-lineer-tuval" aria-hidden="true"></canvas>
        </div>
        <div class="gf-mercek" aria-hidden="true">
          <canvas class="gf-mercek-tuval"></canvas>
          <span class="gf-nisangah"></span>
        </div>
      </div>
      <div class="gf-tam-alt">
        <div class="gf-kontrol">
          <button type="button" class="gf-uc veri${k < 0.995 ? " etkin" : ""}" data-gf-uc="0">Lineer</button>
          <div class="gf-surgu-sarici">
            <input type="range" min="0" max="100" value="${this.germe}" aria-label="Tam ekran germe: lineerden gerilmişe">
            <span class="gf-egri-kap" aria-hidden="true"></span>
          </div>
          <button type="button" class="gf-uc veri${k >= 0.995 ? " etkin" : ""}" data-gf-uc="100">Gerilmiş</button>
        </div>
        <div class="gf-hud veri">
          <span class="gf-durum"></span>
          <span class="gf-ipucu">L · ham kare · basılı tut · 2×</span>
        </div>
      </div>`;

    document.body.append(kap);
    document.documentElement.classList.add("gf-tam-acik");

    const img = kap.querySelector(".gf-gorsel-katman img");
    const tuval = kap.querySelector(".gf-lineer-tuval");
    const yuzey = kap.querySelector(".gf-tam-sahne");
    const mercekEl = kap.querySelector(".gf-mercek");
    const mercekTuval = kap.querySelector(".gf-mercek-tuval");
    const girdi = kap.querySelector("input");
    const kapatBtn = kap.querySelector(".gf-tam-kapat");
    const durumEl = kap.querySelector(".gf-durum");
    const ucDugmeler = [...kap.querySelectorAll("[data-gf-uc]")];

    const egri = miniEgriSvgKur();
    const yol = egriYoluUret(k);
    egri.hat.setAttribute("d", yol);
    egri.hale.setAttribute("d", yol);
    kap.querySelector(".gf-egri-kap").append(egri.svg);
    girdi.style.setProperty("--oran", k.toFixed(3));
    this._mercekTuvalHazirla(mercekTuval);

    const hedef = this._yuzeyOlaylariBagla(yuzey, mercekEl, mercekTuval, () => img, true);

    girdi.addEventListener("input", () => this.germeAyarla(girdi.value));
    for (const btn of ucDugmeler) {
      btn.addEventListener("click", () => this.germeAyarla(Number(btn.dataset.gfUc)));
    }
    kapatBtn.addEventListener("click", () => this._tamEkranKapa(true));

    kap.addEventListener("click", (e) => {
      if (e.target === kap) this._tamEkranKapa(true);
    });

    const tekerlekEngel = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const klavyeYonet = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        this._tamEkranKapa(true);
        return;
      }
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", " "].includes(e.key)) {
        const h = e.target instanceof Element ? e.target : null;
        if (!h?.closest("input, button")) {
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }
      if (e.key === "Tab") {
        const odaklar = [...kap.querySelectorAll("button, input, [tabindex='0']")].filter((el) => !el.disabled);
        if (!odaklar.length) return;
        const ilk = odaklar[0];
        const son = odaklar[odaklar.length - 1];
        if (e.shiftKey && document.activeElement === ilk) {
          e.preventDefault();
          son.focus();
        } else if (!e.shiftKey && document.activeElement === son) {
          e.preventDefault();
          ilk.focus();
        }
      }
    };
    const boyutTemizle = () => {
      hedef.kutu = null;
      hedef.alan = null;
      if (this._tam) this._tam.kaynak = null;
      if (this.germe < 100) this._tamCiz();
    };

    kap.addEventListener("wheel", tekerlekEngel, { passive: false });
    document.addEventListener("keydown", klavyeYonet, true);
    window.addEventListener("resize", boyutTemizle, { passive: true });

    img.addEventListener("load", () => {
      hedef.kutu = null;
      hedef.alan = null;
      if (this._tam) this._tam.kaynak = null;
      if (this.germe < 100) this._tamCiz();
    });

    this._tam = {
      kap,
      img,
      tuval,
      yuzey,
      girdi,
      durumEl,
      ucDugmeler,
      egriHat: egri.hat,
      egriHale: egri.hale,
      kaynak: null,
      temizle: () => {
        hedef.temizle?.();
        kap.removeEventListener("wheel", tekerlekEngel);
        document.removeEventListener("keydown", klavyeYonet, true);
        window.removeEventListener("resize", boyutTemizle);
      },
    };
    acikTamEkran = this;

    this._buyukYukle();
    this._durumGuncelle();
    if (k < 0.995) requestAnimationFrame(() => this._tamCiz());
    requestAnimationFrame(() => {
      kap.classList.add("acik");
      kapatBtn.focus();
    });
  }

  _tamEkranKapa(odakGeri = true) {
    if (!this._tam) return;
    const t = this._tam;
    this._tam = null;
    if (acikTamEkran === this) acikTamEkran = null;
    this._yakinlastirmaAktif = false;
    this._basTut = null;
    clearTimeout(this._basTutZaman);
    t.temizle();
    t.kap.remove();
    document.documentElement.classList.remove("gf-tam-acik");
    this._durumGuncelle();
    if (odakGeri) this._tamBtn?.focus();
  }
}

if (typeof customElements !== "undefined" && !customElements.get("germe-foto")) {
  customElements.define("germe-foto", GermeFoto);
}
