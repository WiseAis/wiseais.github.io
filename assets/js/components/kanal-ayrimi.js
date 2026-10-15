/* ==========================================================================
   <kanal-ayrimi src="..." kirp="x y g y" alt="...">
   Bir fotoğrafı üç ışık katmanına ayırıp patlatılmış bir yığın gibi açar.
   Katmanlar fotoğrafın R, G, B kanallarıdır; parlaklık saydamlığa dönüşür,
   böylece karanlık gökyüzü kaybolur ve yalnız ışık kalır.
   kirp: görselin kullanılacak bölgesi, 0–1 arası "x y genişlik yükseklik".
   Bu temsilîdir: gerçek ayrıştırma kamera–filtre karışım matrisiyle yapılır.
   ========================================================================== */

import { azHareket } from "../lib/rastgele.js";

// Yığının alttan üste sırası: Hβ, [O III], Hα
const KATMANLAR = [
  { kanal: 2, renk: [138, 162, 255], ad: "Hβ", dalga: "486.1 nm", css: "#8aa2ff" },
  { kanal: 1, renk: [69, 214, 200], ad: "[O III]", dalga: "500.7 nm", css: "var(--oiii)" },
  { kanal: 0, renk: [255, 79, 97], ad: "Hα", dalga: "656.3 nm", css: "var(--ha)" },
];

class KanalAyrimi extends HTMLElement {
  connectedCallback() {
    if (this._kuruldu) return;
    this._kuruldu = true;
    this.innerHTML = `
      <div class="ka-sahne">
        <div class="ka-yigin">
          ${KATMANLAR.map((_, i) => `<div class="ka-katman" style="--i:${i}"><canvas></canvas></div>`).join("")}
          <div class="ka-katman ka-asil" style="--i:0"><canvas></canvas></div>
        </div>
        <ol class="ka-lejant veri" aria-hidden="true">
          ${[...KATMANLAR].reverse().map((k) => `<li style="--c:${k.css}"><b>${k.ad}</b> ${k.dalga}</li>`).join("")}
        </ol>
      </div>
      <div class="ka-alt">
        <p class="ka-altyazi veri"><span data-ka-durum>Tek RGB kare</span> · temsilî</p>
        <button class="ka-dugme veri" type="button" aria-pressed="false">Ayır</button>
      </div>`;
    this.setAttribute("role", "img");
    this.setAttribute("aria-label", `${this.getAttribute("alt") || "Fotoğraf"}; üç ışık katmanına ayrılan temsilî kanal görünümü`);

    const img = new Image();
    img.decoding = "async";
    img.src = this.getAttribute("src");
    img.onload = () => this._katmanlariCiz(img);

    this._dugme = this.querySelector(".ka-dugme");
    this._durum = this.querySelector("[data-ka-durum]");
    this._dugme.addEventListener("click", () => {
      this._elle = true;
      clearInterval(this._dongu);
      this.ayrik(!this.classList.contains("ayrik"));
    });

    if (azHareket()) {
      this.ayrik(true);
    } else {
      // Ekrana girince kendi kendine nefes alır: birleşir, ayrılır
      new IntersectionObserver(([g]) => {
        clearInterval(this._dongu);
        if (!g.isIntersecting || this._elle) return;
        setTimeout(() => this.ayrik(true), 900);
        this._dongu = setInterval(() => this.ayrik(!this.classList.contains("ayrik")), 4600);
      }, { threshold: 0.4 }).observe(this);
    }
  }

  ayrik(acik) {
    this.classList.toggle("ayrik", acik);
    this._dugme.setAttribute("aria-pressed", String(acik));
    this._dugme.textContent = acik ? "Birleştir" : "Ayır";
    this._durum.textContent = acik ? "Üç ışık katmanı" : "Tek RGB kare";
  }

  _katmanlariCiz(img) {
    const [kx, ky, kg, kh] = (this.getAttribute("kirp") || "0 0 1 1").split(/\s+/).map(Number);
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

    const tuvaller = this.querySelectorAll(".ka-katman canvas");
    // Asıl kare: kırpılmış hâliyle
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
        // Kanal parlaklığı → saydamlık; sönük yapı da görünsün diye hafif gerdirme
        const v = veri[p + kanal] / 255;
        const a = Math.min(1, Math.pow(Math.max(0, v - 0.09) / 0.91, 0.95) * 3.4);
        d[p] = renk[0];
        d[p + 1] = renk[1];
        d[p + 2] = renk[2];
        d[p + 3] = a * 255;
      }
      c.putImageData(cikti, 0, 0);

      // Parıltı: aynı katmanın bulanık kopyası altına
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
