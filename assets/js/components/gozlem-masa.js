import { azHareket } from "../lib/rastgele.js?v=20261126a";

const SVG_NS = "http://www.w3.org/2000/svg";
const VARSAYILAN_PARCALAR = ["TOPLAM", "6\u00A0HEDEF", "SABİT\u00A0TRİPOD", "5.160\u00A0KARE"];
const BOSLUK_REG = new RegExp("\\s+", "g");
const ILK_UYDU_MS = 11000;
const IKINCI_UYDU_MS = 24000;
const UYDU_CIZGI_MS = 2200;
const UYARI_MS = 3200;
const RET_GOSTER_MS = 1400;
const MAX_UYDU = 2;

const UYDU_ROTALARI = [
  { aci: "-23deg", y: "26%" },
  { aci: "18deg", y: "64%" },
];

export function mercekKoordinatHesapla(kutu, cx, cy) {
  const yerelW = kutu.yerelW > 0 ? kutu.yerelW : kutu.width;
  const yerelH = kutu.yerelH > 0 ? kutu.yerelH : kutu.height;
  const olcekX = kutu.width > 0 ? yerelW / kutu.width : 1;
  const olcekY = kutu.height > 0 ? yerelH / kutu.height : 1;
  const mx = Math.max(0, Math.min(yerelW, (cx - kutu.left) * olcekX));
  const my = Math.max(0, Math.min(yerelH, (cy - kutu.top) * olcekY));
  return { mx, my };
}

class GozlemMasa extends HTMLElement {
  constructor() {
    super();
    this._kuruldu = false;
    this._lineer = false;
    this._gorunur = false;
    this._uyduSayisi = 0;
    this._uyduAktif = false;
    this._uyduKarar = false;

    this._kartlar = [];
    this._etkinKart = null;
    this._kutuMap = new WeakMap();
    this._mercekRaf = null;
    this._bekleyenMercek = null;

    this._sonKonum = null;

    this._uyduPlanZamanlayici = null;
    this._uyduCizgiZamanlayici = null;
    this._uyariZamanlayici = null;
    this._retZamanlayici = null;
    this._varsayilanParcalar = VARSAYILAN_PARCALAR;

    this._tiklaBagli = (e) => this._modTikla(e);
    this._klavyeBagli = (e) => this._klavye(e);
    this._gorunurlukBagli = () => this._uyduDurumGuncelle();
    this._hareketDegistiBagli = () => this._uyduDurumGuncelle();
    this._kutuTemizleBagli = () => {
      this._kutuMap = new WeakMap();
    };
  }

  connectedCallback() {
    if (!this._kuruldu) {
      this._kuruldu = true;
      this._kur();
    }

    this._hareketMedya = matchMedia("(prefers-reduced-motion: reduce)");
    document.addEventListener("click", this._tiklaBagli);
    document.addEventListener("keydown", this._klavyeBagli);
    document.addEventListener("visibilitychange", this._gorunurlukBagli);

    window.addEventListener("scroll", this._kutuTemizleBagli, { passive: true, capture: true });
    window.addEventListener("resize", this._kutuTemizleBagli, { passive: true });
    this._hareketMedya.addEventListener?.("change", this._hareketDegistiBagli);

    const izlenen = this.closest("section, .ekran") || this;
    this._gozcu = new IntersectionObserver(
      (girdiler) => {
        const g = girdiler[0];
        if (!g) return;
        this._gorunur = g.isIntersecting;
        this._uyduDurumGuncelle();
      },
      { threshold: 0.2 },
    );
    this._gozcu.observe(izlenen);

    this._modDugmeleriniEsitle();
  }

  disconnectedCallback() {
    this._uyduZamanlayicilariTemizle();
    if (this._mercekRaf) cancelAnimationFrame(this._mercekRaf);

    document.removeEventListener("click", this._tiklaBagli);
    document.removeEventListener("keydown", this._klavyeBagli);
    document.removeEventListener("visibilitychange", this._gorunurlukBagli);
    window.removeEventListener("scroll", this._kutuTemizleBagli, { capture: true });
    window.removeEventListener("resize", this._kutuTemizleBagli);
    this._hareketMedya?.removeEventListener?.("change", this._hareketDegistiBagli);
    this._gozcu?.disconnect();
    this._gozcu = null;
  }

  get mod() {
    return this._lineer ? "lineer" : "gerilmis";
  }

  modAyarla(hedef) {
    const lineerOlsun = hedef === "lineer";
    if (lineerOlsun === this._lineer && this.dataset.mod === hedef) return;
    this._lineer = lineerOlsun;
    this.classList.toggle("lineer", this._lineer);
    this.dataset.mod = this._lineer ? "lineer" : "gerilmis";
    if (!this._lineer) {
      this._mercekleriKapat();
    } else if (this._etkinKart && this._sonKonum) {

      this._kutuOlc(this._etkinKart);
      this._mercekAc(this._etkinKart, this._sonKonum.cx, this._sonKonum.cy);
    }
    this._modDugmeleriniEsitle();
    this.dispatchEvent(
      new CustomEvent("gozlem-mod", {
        bubbles: true,
        detail: { mod: this.dataset.mod },
      }),
    );
  }

  modDegistir() {
    this.modAyarla(this._lineer ? "gerilmis" : "lineer");
  }

  _kur() {
    this.dataset.mod = "gerilmis";
    this._svgFiltreEkle();
    this._uyduKatmanlariEkle();

    const telemetri = this._telemetriEl();
    if (telemetri) {
      const mevcut = telemetri.textContent.trim();
      if (mevcut) {
        const parcalar = mevcut
          .split("·")
          .map((s) => s.trim())
          .filter(Boolean);
        if (parcalar.length) this._varsayilanParcalar = parcalar;
      }
      this._telemetriYaz(telemetri, this._varsayilanParcalar);
    }

    const kartlariBagla = () => {
      const bulunan = [...this.querySelectorAll("a.kare")];
      if (!bulunan.length) return false;
      this._kartlar = bulunan;
      bulunan.forEach((kart) => this._kartHazirla(kart));
      return true;
    };

    if (!kartlariBagla()) {
      requestAnimationFrame(() => kartlariBagla());
    }
  }

  _svgFiltreEkle() {
    if (document.getElementById("gm-lineer")) return;
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "gm-filtre");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");

    const defs = document.createElementNS(SVG_NS, "defs");
    const filtre = document.createElementNS(SVG_NS, "filter");
    filtre.setAttribute("id", "gm-lineer");
    filtre.setAttribute("color-interpolation-filters", "sRGB");

    const transfer = document.createElementNS(SVG_NS, "feComponentTransfer");
    for (const kanal of ["feFuncR", "feFuncG", "feFuncB"]) {
      const f = document.createElementNS(SVG_NS, kanal);
      f.setAttribute("type", "gamma");
      f.setAttribute("amplitude", "0.92");
      f.setAttribute("exponent", "2.8");
      f.setAttribute("offset", "-0.015");
      transfer.append(f);
    }

    filtre.append(transfer);
    defs.append(filtre);
    svg.append(defs);
    this.prepend(svg);
  }

  _uyduKatmanlariEkle() {
    const uydu = document.createElement("div");
    uydu.className = "gm-uydu";
    uydu.setAttribute("aria-hidden", "true");

    const uyari = document.createElement("div");
    uyari.className = "gm-uyari veri";
    uyari.setAttribute("role", "status");
    uyari.setAttribute("aria-live", "polite");

    const metin = document.createElement("span");
    metin.className = "gm-uyari-metin";
    metin.textContent = "1 kare kirli ·";

    const atBtn = document.createElement("button");
    atBtn.className = "gm-at";
    atBtn.type = "button";
    atBtn.textContent = "[At]";
    atBtn.addEventListener("click", () => this._uyduyuAt());

    uyari.append(metin, " ", atBtn);
    this.append(uydu, uyari);

    this._uyduEl = uydu;
    this._uyariEl = uyari;
    this._uyariMetinEl = metin;
    this._atBtn = atBtn;
  }

  _kartHazirla(kart) {
    if (kart.dataset.gmHazir) return;
    kart.dataset.gmHazir = "1";

    const asilImg = kart.querySelector("img:not(.kare-mercek)");
    if (asilImg && !kart.querySelector(".kare-mercek-kabuk")) {

      const kabuk = document.createElement("span");
      kabuk.className = "kare-mercek-kabuk";
      kabuk.setAttribute("aria-hidden", "true");

      const mercek = document.createElement("img");
      mercek.className = "kare-mercek";
      mercek.alt = "";
      mercek.setAttribute("aria-hidden", "true");
      mercek.draggable = false;
      mercek.decoding = "async";
      mercek.loading = "lazy";
      if (asilImg.getAttribute("src")) mercek.setAttribute("src", asilImg.getAttribute("src"));
      if (asilImg.getAttribute("srcset")) mercek.setAttribute("srcset", asilImg.getAttribute("srcset"));
      if (asilImg.getAttribute("sizes")) mercek.setAttribute("sizes", asilImg.getAttribute("sizes"));

      kabuk.append(mercek);
      asilImg.insertAdjacentElement("afterend", kabuk);
    }

    if (!kart.querySelector(".gm-nisangah")) {
      const nisangah = document.createElement("span");
      nisangah.className = "gm-nisangah";
      nisangah.setAttribute("aria-hidden", "true");
      kart.append(nisangah);
    }

    kart.addEventListener("pointerenter", (e) => {
      this._etkinKart = kart;
      this._telemetriGuncelle(kart);
      if (e.pointerType === "touch") return;
      this._sonKonum = { cx: e.clientX, cy: e.clientY };
      if (!this._lineer) return;
      this._kutuOlc(kart);
      this._mercekAc(kart, e.clientX, e.clientY);
    });

    kart.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      this._sonKonum = { cx: e.clientX, cy: e.clientY };
      if (!this._lineer) return;
      this._mercekAc(kart, e.clientX, e.clientY);
    });

    kart.addEventListener("pointerleave", () => {

      if (this._bekleyenMercek?.kart === kart) this._bekleyenMercek = null;
      kart.classList.remove("mercek-acik");
      if (this._etkinKart === kart) {
        this._etkinKart = null;
        this._sonKonum = null;
        this._telemetriSifirla();
      }
    });

    kart.addEventListener("focus", () => {
      this._etkinKart = kart;
      this._telemetriGuncelle(kart);
      if (this._lineer) {
        kart.style.setProperty("--mx", "50%");
        kart.style.setProperty("--my", "50%");
        kart.classList.add("mercek-acik");
      }
    });

    kart.addEventListener("blur", () => {
      if (this._bekleyenMercek?.kart === kart) this._bekleyenMercek = null;
      kart.classList.remove("mercek-acik");
      if (this._etkinKart === kart) {
        this._etkinKart = null;
        this._sonKonum = null;
        this._telemetriSifirla();
      }
    });
  }

  _kutuOlc(kart) {
    const r = kart.getBoundingClientRect();
    const kutu = {
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
      yerelW: kart.offsetWidth || r.width,
      yerelH: kart.offsetHeight || r.height,
    };
    this._kutuMap.set(kart, kutu);
    return kutu;
  }

  _mercekAc(kart, cx, cy) {
    this._bekleyenMercek = { kart, cx, cy };
    if (this._mercekRaf) return;
    this._mercekRaf = requestAnimationFrame(() => {
      this._mercekRaf = null;
      const p = this._bekleyenMercek;
      this._bekleyenMercek = null;
      if (!p || !this._lineer) return;
      const k = this._kutuMap.get(p.kart) || this._kutuOlc(p.kart);
      const { mx, my } = mercekKoordinatHesapla(k, p.cx, p.cy);
      p.kart.style.setProperty("--mx", `${mx.toFixed(2)}px`);
      p.kart.style.setProperty("--my", `${my.toFixed(2)}px`);

      this._kartlar.forEach((diger) => {
        if (diger !== p.kart) diger.classList.remove("mercek-acik");
      });
      p.kart.classList.add("mercek-acik");
    });
  }

  _mercekleriKapat() {
    this._bekleyenMercek = null;
    if (this._mercekRaf) {
      cancelAnimationFrame(this._mercekRaf);
      this._mercekRaf = null;
    }
    this._kartlar.forEach((k) => k.classList.remove("mercek-acik"));
  }

  _modTikla(e) {
    const btn = e.target instanceof Element ? e.target.closest("[data-gozlem-mod]") : null;
    if (!btn) return;
    const hedef = (btn.dataset.gozlemMod || "").trim().toLowerCase();
    if (hedef === "lineer" || hedef === "gerilmis") {
      this.modAyarla(hedef);
    } else {
      this.modDegistir();
    }
  }

  _modDugmeleriniEsitle() {
    const dugmeler = document.querySelectorAll("[data-gozlem-mod]");
    dugmeler.forEach((btn) => {
      const hedef = (btn.dataset.gozlemMod || "").trim().toLowerCase();
      let etkin;
      if (hedef === "lineer") etkin = this._lineer;
      else if (hedef === "gerilmis") etkin = !this._lineer;
      else etkin = this._lineer;
      btn.classList.toggle("etkin", etkin);
      btn.setAttribute("aria-pressed", String(etkin));
    });
  }

  _klavye(e) {
    if (e.key !== "l" && e.key !== "L") return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const hedef = e.target instanceof Element ? e.target : document.body;
    if (hedef.closest("input, textarea, select, [contenteditable]")) return;

    const odakta = this.contains(document.activeElement);
    const bolumAktif = this._gorunur || document.body.dataset.ekran === "gozlem";
    if (!odakta && !bolumAktif) return;

    e.preventDefault();
    this.modDegistir();
  }

  _telemetriEl() {
    return this.querySelector("[data-gozlem-telemetri]") || document.querySelector("[data-gozlem-telemetri]");
  }

  _telemetriYaz(el, parcalar) {
    el.textContent = "";
    parcalar.forEach((metin, i) => {
      if (i > 0) el.append(" · ");
      const span = document.createElement("span");
      span.className = "gm-parca";
      span.textContent = metin.replace(BOSLUK_REG, "\u00A0");
      el.append(span);
    });
  }

  _telemetriGuncelle(kart) {
    const el = this._telemetriEl();
    if (!el) return;
    const parcalar = [
      kart.dataset.kod,
      kart.dataset.hedef,
      kart.dataset.takimyildiz,
      kart.dataset.yer,
      kart.dataset.optik,
      kart.dataset.poz,
    ]
      .map((s) => (s || "").trim())
      .filter(Boolean);

    if (!parcalar.length) return;
    this._telemetriYaz(el, parcalar);
    el.classList.add("aktif");
  }

  _telemetriSifirla() {
    const el = this._telemetriEl();
    if (!el) return;
    this._telemetriYaz(el, this._varsayilanParcalar);
    el.classList.remove("aktif");
  }

  _uyduDurumGuncelle() {
    if (!this.isConnected || !this._gorunur || document.hidden || azHareket()) {
      clearTimeout(this._uyduPlanZamanlayici);
      this._uyduPlanZamanlayici = null;
      return;
    }
    if (this._uyduAktif || this._uyduSayisi >= MAX_UYDU || this._uyduPlanZamanlayici) return;
    const bekle = this._uyduSayisi === 0 ? ILK_UYDU_MS : IKINCI_UYDU_MS;
    this._uyduPlanZamanlayici = setTimeout(() => {
      this._uyduPlanZamanlayici = null;
      this._uyduBaslat();
    }, bekle);
  }

  _uyduBaslat() {
    if (!this._gorunur || document.hidden || azHareket() || this._uyduAktif || this._uyduSayisi >= MAX_UYDU) return;

    const rota = UYDU_ROTALARI[this._uyduSayisi % UYDU_ROTALARI.length];
    this._uyduSayisi += 1;
    this._uyduAktif = true;
    this._uyduKarar = false;

    this._uyduEl.style.setProperty("--uydu-aci", rota.aci);
    this._uyduEl.style.setProperty("--uydu-y", rota.y);
    this._uyduEl.classList.remove("geciyor");

    void this._uyduEl.offsetWidth;
    this._uyduEl.classList.add("geciyor");

    this._uyariEl.classList.remove("reddedildi");
    this._uyariMetinEl.textContent = "1 kare kirli ·";
    this._atBtn.hidden = false;
    this._uyariEl.classList.add("gorunur");

    clearTimeout(this._uyduCizgiZamanlayici);
    this._uyduCizgiZamanlayici = setTimeout(() => {
      this._uyduCizgiZamanlayici = null;
      this._uyduEl?.classList.remove("geciyor");
    }, UYDU_CIZGI_MS);

    clearTimeout(this._uyariZamanlayici);
    this._uyariZamanlayici = setTimeout(() => {
      this._uyariZamanlayici = null;
      if (this._uyduKarar) return;
      this._uyduKarar = true;
      this._uyariEl?.classList.remove("gorunur");
      this._uyduAktif = false;
      document.dispatchEvent(new CustomEvent("starlink-gecis", { detail: { tip: "gecti" } }));
      this._uyduDurumGuncelle();
    }, UYARI_MS);
  }

  _uyduyuAt() {
    if (!this._uyduAktif || this._uyduKarar) return;
    this._uyduKarar = true;

    clearTimeout(this._uyariZamanlayici);
    this._uyariZamanlayici = null;
    clearTimeout(this._uyduCizgiZamanlayici);
    this._uyduCizgiZamanlayici = null;

    this._uyduEl.classList.remove("geciyor");
    this._atBtn.hidden = true;
    this._uyariMetinEl.textContent = "REJECTED: 1";
    this._uyariEl.classList.add("reddedildi");

    document.dispatchEvent(new CustomEvent("starlink-gecis", { detail: { tip: "atildi" } }));

    clearTimeout(this._retZamanlayici);
    this._retZamanlayici = setTimeout(() => {
      this._retZamanlayici = null;
      this._uyariEl?.classList.remove("gorunur", "reddedildi");
      this._uyduAktif = false;
      this._uyduDurumGuncelle();
    }, RET_GOSTER_MS);
  }

  _uyduZamanlayicilariTemizle() {
    clearTimeout(this._uyduPlanZamanlayici);
    clearTimeout(this._uyduCizgiZamanlayici);
    clearTimeout(this._uyariZamanlayici);
    clearTimeout(this._retZamanlayici);
    this._uyduPlanZamanlayici = null;
    this._uyduCizgiZamanlayici = null;
    this._uyariZamanlayici = null;
    this._retZamanlayici = null;
    this._uyduAktif = false;
  }
}

customElements.define("gozlem-masa", GozlemMasa);
