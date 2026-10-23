const UST = 2597;
const ESIKLER = [
  [1000, "aisenit"],
  [40, "aisen"],
  [0, "ais"],
];

class MaskotEvrim extends HTMLElement {
  connectedCallback() {
    const girdi = this.querySelector("[data-evrim-girdi]");
    const maskot = this.querySelector("[data-evrim-maskot]");
    const nYaz = this.querySelector("[data-evrim-n]");
    const snrYaz = this.querySelector("[data-evrim-snr]");
    const kartlar = document.querySelectorAll("[data-faz-kart]");
    if (!girdi || !maskot) return;

    const guncelle = () => {
      const oran = girdi.value / girdi.max;
      const n = Math.max(1, Math.round(Math.exp(oran * Math.log(UST))));
      const faz = ESIKLER.find(([e]) => n >= e)[1];
      nYaz.textContent = n.toLocaleString("tr-TR");
      snrYaz.textContent = Math.sqrt(n).toFixed(1);
      girdi.setAttribute("aria-valuetext", `${n} kare, faz ${faz}`);
      if (maskot.getAttribute("faz") !== faz) {
        maskot.setAttribute("faz", faz);
        maskot.classList.remove("evrildi");
        void maskot.offsetWidth;
        maskot.classList.add("evrildi");
      }
      kartlar.forEach((k) => k.classList.toggle("etkin", k.dataset.fazKart === faz));
    };
    girdi.addEventListener("input", guncelle);
    guncelle();
  }
}

customElements.define("maskot-evrim", MaskotEvrim);
