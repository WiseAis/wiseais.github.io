/* ==========================================================================
   <sahne-cizim proje="ais-001" tur="spektrum" dur="6">
   02 sayfalarındaki hareketli çizimlerin ortak kabı. Sahnelerin kendisi
   proje başına sahneler/<proje>.js dosyalarında yaşar.
   Yeni proje: sahneler/ais-00x.js oluştur, KAYIT'a bir satır ekle.
     dur  hareket istemeyen kullanıcıya gösterilecek anın saniyesi
   ========================================================================== */

import { azHareket } from "../lib/rastgele.js";

const KAYIT = {
  "ais-001": () => import("../sahneler/ais-001.js"),
  "ais-002": () => import("../sahneler/ais-002.js"),
};

class SahneCizim extends HTMLElement {
  async connectedCallback() {
    if (this._kuruldu) return;
    this._kuruldu = true;
    const yukle = KAYIT[this.getAttribute("proje")];
    if (!yukle) return;
    const sahneler = (await yukle()).default;
    const kur = sahneler[this.getAttribute("tur")];
    if (!kur) return;
    this.classList.add("sahne", `sahne-${this.getAttribute("tur")}`);
    this._sahne = kur(this);
    if (!this._sahne.adim) return;
    if (azHareket()) {
      this._sahne.adim(Number(this.getAttribute("dur")) || 6);
      return;
    }
    this._sahne.adim(0);
    let baslangic;
    const tik = (zaman) => {
      baslangic ??= zaman;
      if (this._gorunur) this._sahne.adim((zaman - baslangic) / 1000);
      this._raf = requestAnimationFrame(tik);
    };
    new IntersectionObserver(([g]) => {
      this._gorunur = g.isIntersecting;
      if (g.isIntersecting && !this._raf) this._raf = requestAnimationFrame(tik);
      if (!g.isIntersecting && this._raf) {
        cancelAnimationFrame(this._raf);
        this._raf = null;
      }
    }).observe(this);
  }
}

customElements.define("sahne-cizim", SahneCizim);
