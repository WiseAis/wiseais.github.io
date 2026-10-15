/* ==========================================================================
   <germe-foto src="...-1000.jpg" buyuk="...-2400.jpg" alt="...">
   Astrofotoğrafın gerdirilmiş hâlinden lineer hâline giden kaydırıcı.
   Lineer veri neredeyse siyahtır; gördüğümüz fotoğraf, o verinin
   güçlü bir eğriyle gerilmiş hâlidir. Bu bileşen eğriyi geri sarar.
   Temsilîdir: gerçek lineer veri değil, işlenmiş JPEG'e ters bir eğri uygulanır.
   ========================================================================== */

class GermeFoto extends HTMLElement {
  connectedCallback() {
    if (this._kuruldu) return;
    this._kuruldu = true;
    const alt = this.getAttribute("alt") || "";
    const kucuk = this.getAttribute("src");
    const buyuk = this.getAttribute("buyuk") || kucuk;
    const id = `germe-${Math.random().toString(36).slice(2, 8)}`;
    this.innerHTML = `
      <div class="gf-kare">
        <img src="${kucuk}" srcset="${kucuk} 1000w, ${buyuk} 2400w" sizes="(max-width: 900px) 100vw, 64vw" alt="${alt}" loading="lazy" decoding="async">
        <canvas aria-hidden="true"></canvas>
        <span class="gf-durum veri" aria-hidden="true"></span>
      </div>
      <div class="gf-kontrol">
        <label class="veri" for="${id}">Lineer</label>
        <input id="${id}" type="range" min="0" max="100" value="100" aria-label="Germe: lineerden gerilmişe">
        <span class="veri">Gerilmiş</span>
      </div>`;
    this._img = this.querySelector("img");
    this._tuval = this.querySelector("canvas");
    this._durum = this.querySelector(".gf-durum");
    this._girdi = this.querySelector("input");
    this._girdi.addEventListener("input", () => this._planla());
    // Görsel tembel yüklenir; kullanıcı erken kaydırdıysa yüklenince yeniden çiz
    this._img.addEventListener("load", () => {
      this._kaynak = null;
      if (this._girdi.value < 100) this._planla();
    });
  }

  _planla() {
    if (this._bekliyor) return;
    this._bekliyor = true;
    requestAnimationFrame(() => {
      this._bekliyor = false;
      this._ciz();
    });
  }

  _kaynakHazirla() {
    const img = this._img;
    if (!img.complete || !img.naturalWidth) return false;
    const kutu = this.querySelector(".gf-kare").getBoundingClientRect();
    const G = Math.min(1800, Math.round(kutu.width * Math.min(2, devicePixelRatio || 1)));
    const Y = Math.round((img.naturalHeight / img.naturalWidth) * G);
    this._tuval.width = G;
    this._tuval.height = Y;
    this._ctx = this._tuval.getContext("2d", { willReadFrequently: true });
    this._ctx.drawImage(img, 0, 0, G, Y);
    this._kaynak = this._ctx.getImageData(0, 0, G, Y);
    this._cikti = this._ctx.createImageData(G, Y);
    return true;
  }

  _ciz() {
    const k = this._girdi.value / 100;
    if (k >= 0.995) {
      this.classList.remove("lineer");
      this._durum.textContent = "";
      return;
    }
    if (!this._kaynak && !this._kaynakHazirla()) {
      this._img.loading = "eager";
      return;
    }
    this.classList.add("lineer");
    // Ters germe: k=1 gördüğümüz, k=0 kameranın kaydettiğine yakın
    const us = 1 + Math.pow(1 - k, 1.5) * 3.6;
    const kara = Math.pow(1 - k, 2) * 0.05;
    const tablo = new Uint8ClampedArray(256);
    for (let i = 0; i < 256; i++) tablo[i] = Math.pow(Math.max(0, i / 255 - kara) / (1 - kara), us) * 255;
    const a = this._kaynak.data;
    const b = this._cikti.data;
    for (let i = 0; i < a.length; i += 4) {
      b[i] = tablo[a[i]];
      b[i + 1] = tablo[a[i + 1]];
      b[i + 2] = tablo[a[i + 2]];
      b[i + 3] = 255;
    }
    this._ctx.putImageData(this._cikti, 0, 0);
    this._durum.textContent = k < 0.15 ? "Kameranın kaydettiğine yakın: neredeyse yalnız yıldızlar" : `Germe %${Math.round(k * 100)}`;
  }
}

customElements.define("germe-foto", GermeFoto);
