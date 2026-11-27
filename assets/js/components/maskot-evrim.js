import { azHareket } from "../lib/rastgele.js?v=20261127a";
import { SOZLER } from "./ais-maskot.js?v=20261127a";

const UST = 2597;
const ESIKLER = [
  [1000, "aisenit"],
  [40, "aisen"],
  [0, "ais"],
];
const IZGARA = { ais: "16", aisen: "8", aisenit: "4" };
const HEDEFLER = { ais: 0, aisen: 560, aisenit: 1000 };
const KAYMA_MS = 650;
const SOZ_GECIKME_MS = 320;

const kubik = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

class MaskotEvrim extends HTMLElement {
  connectedCallback() {
    if (this._kuruldu) return;
    this._kuruldu = true;

    const girdi = this.querySelector("[data-evrim-girdi]");
    const maskot = this.querySelector("[data-evrim-maskot]");
    const sahne = this.querySelector(".evrim-sahne");
    const nYaz = this.querySelector("[data-evrim-n]");
    const snrYaz = this.querySelector("[data-evrim-snr]");
    const kartlar = [...document.querySelectorAll("[data-faz-kart]")];
    if (!girdi || !maskot) return;

    let oncekiFaz = null;
    this._animRaf = 0;
    this._sozZaman = 0;

    const animDurdur = () => {
      if (this._animRaf) {
        cancelAnimationFrame(this._animRaf);
        this._animRaf = 0;
      }
    };

    const guncelle = () => {
      const maks = Number(girdi.max) || 1000;
      const oran = Math.max(0, Math.min(1, Number(girdi.value) / maks));
      const n = Math.max(1, Math.round(Math.exp(oran * Math.log(UST))));
      const faz = ESIKLER.find(([e]) => n >= e)[1];

      if (nYaz) nYaz.textContent = n.toLocaleString("tr-TR");
      if (snrYaz) snrYaz.textContent = Math.sqrt(n).toFixed(1);
      girdi.setAttribute("aria-valuetext", `${n} kare, faz ${faz}`);

      maskot.setAttribute("kare", String(n));
      if (sahne) {
        sahne.dataset.izgara = IZGARA[faz];
        sahne.style.setProperty("--evrim-t", oran.toFixed(4));
      }

      const fazDegisti = oncekiFaz !== null && oncekiFaz !== faz;
      oncekiFaz = faz;

      if (maskot.getAttribute("faz") !== faz) {
        maskot.setAttribute("faz", faz);
        maskot.classList.remove("evrildi");
        void maskot.offsetWidth;
        maskot.classList.add("evrildi");
      }

      if (fazDegisti) {
        clearTimeout(this._sozZaman);
        this._sozZaman = setTimeout(() => {
          if (!this.isConnected || maskot.getAttribute("faz") !== faz) return;
          if (typeof maskot.ilkSozuSoyle === "function") {
            maskot.ilkSozuSoyle();
          } else {
            const ilk = SOZLER[faz]?.[0];
            if (ilk) maskot.soyle?.(ilk);
          }
        }, SOZ_GECIKME_MS);
      }

      for (const k of kartlar) {
        const etkin = k.dataset.fazKart === faz;
        k.classList.toggle("etkin", etkin);
        k.setAttribute("aria-pressed", String(etkin));
      }
    };

    const hedefeKay = (hedefFaz) => {
      const hedef = HEDEFLER[hedefFaz];
      if (hedef === undefined) return;
      animDurdur();
      const bas = Number(girdi.value);
      if (azHareket() || Math.abs(hedef - bas) < 0.5) {
        girdi.value = String(hedef);
        guncelle();
        return;
      }
      const t0 = performance.now();
      const adim = (t) => {
        const p = Math.min(1, (t - t0) / KAYMA_MS);
        const deger = Math.round(bas + (hedef - bas) * kubik(p));
        if (Number(girdi.value) !== deger) {
          girdi.value = String(deger);
          guncelle();
        }
        if (p < 1) {
          this._animRaf = requestAnimationFrame(adim);
        } else {
          this._animRaf = 0;
          girdi.value = String(hedef);
          guncelle();
        }
      };
      this._animRaf = requestAnimationFrame(adim);
    };

    const elIle = () => {
      animDurdur();
      guncelle();
    };
    girdi.addEventListener("pointerdown", animDurdur, { passive: true });
    girdi.addEventListener("input", elIle);

    this._kartSok = [];
    for (const kart of kartlar) {
      const hedefFaz = kart.dataset.fazKart;
      if (!(hedefFaz in HEDEFLER)) continue;
      kart.setAttribute("role", "button");
      kart.setAttribute("tabindex", "0");
      const tik = () => hedefeKay(hedefFaz);
      const tus = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          hedefeKay(hedefFaz);
        }
      };
      kart.addEventListener("click", tik);
      kart.addEventListener("keydown", tus);
      this._kartSok.push(() => {
        kart.removeEventListener("click", tik);
        kart.removeEventListener("keydown", tus);
      });
    }

    this._girdiSok = () => {
      girdi.removeEventListener("pointerdown", animDurdur);
      girdi.removeEventListener("input", elIle);
    };

    guncelle();
  }

  disconnectedCallback() {
    if (this._animRaf) {
      cancelAnimationFrame(this._animRaf);
      this._animRaf = 0;
    }
    clearTimeout(this._sozZaman);
    this._girdiSok?.();
    if (this._kartSok) {
      for (const sok of this._kartSok) sok();
      this._kartSok = [];
    }
    this._kuruldu = false;
  }
}

customElements.define("maskot-evrim", MaskotEvrim);
