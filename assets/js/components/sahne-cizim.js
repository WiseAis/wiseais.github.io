import { azHareket } from "../lib/rastgele.js?v=20261127a";

const KAYIT = {
  "ais-001": () => import("../sahneler/ais-001.js?v=20261127a"),
  "ais-002": () => import("../sahneler/ais-002.js?v=20261127a"),

  "ais-001-a": () => import("../sahneler/ais-001-a.js?v=20261127a"),
  "ais-001-b": () => import("../sahneler/ais-001-b.js?v=20261127a"),
  "ais-002-v2": () => import("../sahneler/ais-002-v2.js?v=20261127a"),
};

class SahneCizim extends HTMLElement {
  async connectedCallback() {
    if (this._kuruldu) return;
    this._kuruldu = true;
    this._gorunur = false;
    this._raf = null;
    this._baslangic = null;
    this._duraklamaBas = null;
    const yukle = KAYIT[this.getAttribute("proje")];
    if (!yukle) return;
    const sahneler = (await yukle()).default;
    if (!this.isConnected) return;
    const kur = sahneler[this.getAttribute("tur")];
    if (!kur) return;
    this.classList.add("sahne", `sahne-${this.getAttribute("tur")}`);
    this._sahne = kur(this);
    if (!this._sahne?.adim) return;
    if (azHareket()) {
      this._sahne.adim(Number(this.getAttribute("dur")) || 6);
      return;
    }
    this._sahne.adim(0);

    this._tik = (zaman) => {
      if (!this._gorunur || document.hidden || !this.isConnected) {
        this._raf = null;
        return;
      }
      if (this._baslangic === null) this._baslangic = zaman;
      if (this._duraklamaBas !== null) {
        this._baslangic += zaman - this._duraklamaBas;
        this._duraklamaBas = null;
      }
      this._sahne?.adim((zaman - this._baslangic) / 1000);
      this._raf = requestAnimationFrame(this._tik);
    };
    this._durumEslestir = () => {
      const etkin = this.isConnected && this._gorunur && !document.hidden && !azHareket();
      if (etkin && !this._raf) {
        this._raf = requestAnimationFrame(this._tik);
      } else if (!etkin && this._raf) {
        cancelAnimationFrame(this._raf);
        this._raf = null;
        if (this._baslangic !== null && this._duraklamaBas === null) {
          this._duraklamaBas = performance.now();
        }
      }
    };
    this._gozcu = new IntersectionObserver(([g]) => {
      this._gorunur = g.isIntersecting;
      this._durumEslestir();
    });
    this._gozcu.observe(this);
    document.addEventListener("visibilitychange", this._durumEslestir);
  }

  aisDarbe(x, y, nx, ny) {
    this._sahne?.darbe?.(x, y, nx, ny);
  }

  disconnectedCallback() {
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
    this._gozcu?.disconnect();
    this._gozcu = null;
    if (this._durumEslestir) {
      document.removeEventListener("visibilitychange", this._durumEslestir);
      this._durumEslestir = null;
    }
    this._sahne?.yokEt?.();
    this._sahne = null;
    this._kuruldu = false;
  }
}

customElements.define("sahne-cizim", SahneCizim);
