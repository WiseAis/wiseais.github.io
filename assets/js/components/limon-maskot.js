import { konusmayiKur } from "./ais-maskot.js";

class LimonMaskot extends HTMLElement {
  connectedCallback() {
    if (this._hazir) return;
    this._hazir = true;
    this.classList.add("maskot");
    konusmayiKur(this, () => ["..."]);

    this.addEventListener("konustu", () => {
      if (this._cevaplandi) return;
      this._cevaplandi = true;
      const muhatap = document.querySelector(this.getAttribute("muhatap"));
      const cevap = this.dataset.karsilik;
      if (!muhatap?.soyle || !cevap) return;
      setTimeout(() => {
        muhatap.soyle(cevap);

        const b1 = this.querySelector(".maskot-balon").getBoundingClientRect();
        const b2 = muhatap.querySelector(".maskot-balon").getBoundingClientRect();
        const ust = b1.left < b2.right && b2.left < b1.right && b1.top < b2.bottom && b2.top < b1.bottom;
        if (ust) this.classList.remove("konusuyor");
      }, 2400);
    }, { once: true });
  }
}

customElements.define("limon-maskot", LimonMaskot);
