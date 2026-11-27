import { azHareket } from "../lib/rastgele.js?v=20261127a";
import { oturum, oturumGuncelle } from "../lib/oturum.js?v=20261127a";

const ZORLAMA_SURE_MS = 4500;
const ZORLAMA_ARALIK_MS = 160;
const UZUN_BASIS_MS = 550;
const ORTUCU_YARI_MS = 130;
const TARAMA_MS = 680;

const SAHTE_PIKSELLER = [
  { x: 26, y: 24, b: 3, o: 0.42 },
  { x: 138, y: 34, b: 2, o: 0.36 },
  { x: 64, y: 58, b: 3, o: 0.48 },
  { x: 152, y: 86, b: 3, o: 0.34 },
  { x: 34, y: 112, b: 2, o: 0.45 },
  { x: 96, y: 138, b: 3, o: 0.38 },
  { x: 146, y: 154, b: 2, o: 0.44 },
];

const ANA_PIKSEL = { x: 108, y: 78 };

function fitsMetni(o) {
  const atisYorum =
    o.atis === 0
      ? "henüz atmadın, kibar."
      : o.atis >= 8
        ? "maskot şikâyetçi"
        : "maskotu fırlatma sayısı";

  const satir = (anahtar, deger, yorum) =>
    `${anahtar.padEnd(8)} = ${String(deger).padEnd(14)} / ${yorum}`;

  return [
    satir("OBJECT", "'AISENIT-V2'", "gürültüden ayıklananlar"),
    satir("EXPTIME", `'${o.sure}'`, "bu oturumdaki toplam pozlama"),
    satir("FRAMES", o.kare, "biriken 4 sn'lik kare"),
    satir("AIS_TOSS", o.atis, atisYorum),
    satir("MAX_BNC", o.maksSekme, "tek atışta en çok sekme"),
    satir("STARLINK", `${o.starlinkAtildi}/${o.starlinkGoruldu}`, "reddedilen uydu izi"),
    satir("HOTPIX", 1, "kalibre edilmeyen sıcak piksel"),
    satir("TRACKING", "'NONE'", "takipsiz tripod, yine de buradayız"),
    satir("WEATHER", "'BORTLE 8'", "İstanbul gökyüzü, inatla"),
    satir("STATUS", "'BULUNDUN'", "sonu zorlayan kesim"),
  ].join("\n");
}

export function karanlikKareKur() {
  let acik = false;
  let gecis = false;
  let zorlama = 0;
  let sonZorlama = 0;
  let zorlamaZamanlayici = null;
  let esneZamanlayici = null;
  let oncekiOdak = null;

  let gerilimEl = null;
  let ibareEl = null;
  let ortucuEl = null;
  let odaEl = null;
  let fitsEl = null;
  let sensorEl = null;
  let anaPikselEl = null;
  let sahteEls = [];
  let kalibreBtn = null;
  let durumEl = null;
  let tepkiEl = null;

  let kalibreAdim = 0;
  let taraniyor = false;
  const taramaZamanlayicilar = [];

  function taramaZamanlayicilariTemizle() {
    while (taramaZamanlayicilar.length) clearTimeout(taramaZamanlayicilar.pop());
  }

  function gerilimKur() {
    if (gerilimEl) return;
    gerilimEl = document.createElement("div");
    gerilimEl.className = "kk-gerilim";
    gerilimEl.setAttribute("aria-hidden", "true");

    ibareEl = document.createElement("p");
    ibareEl.className = "kk-ibare veri";
    ibareEl.setAttribute("role", "status");
    ibareEl.setAttribute("aria-live", "polite");

    document.body.append(gerilimEl, ibareEl);
  }

  function gerilimSifirla() {
    zorlama = 0;
    clearTimeout(zorlamaZamanlayici);
    zorlamaZamanlayici = null;
    if (gerilimEl) {
      gerilimEl.classList.remove("etkin");
      gerilimEl.removeAttribute("data-adim");
      gerilimEl.style.removeProperty("--oran");
    }
    if (ibareEl) {
      ibareEl.classList.remove("etkin");
      ibareEl.textContent = "";
    }
  }

  function footerEsnet() {
    if (azHareket()) return;
    const alt = document.querySelector("footer.alt");
    if (!alt) return;
    alt.classList.remove("kk-esne");
    void alt.offsetWidth;
    alt.classList.add("kk-esne");
    clearTimeout(esneZamanlayici);
    esneZamanlayici = setTimeout(() => alt.classList.remove("kk-esne"), 420);
  }

  function ortucuKur() {
    if (ortucuEl) return;
    ortucuEl = document.createElement("div");
    ortucuEl.className = "kk-ortucu";
    ortucuEl.setAttribute("aria-hidden", "true");

    const ust = document.createElement("span");
    ust.className = "kk-perde kk-perde-ust";
    const alt = document.createElement("span");
    alt.className = "kk-perde kk-perde-alt";
    ortucuEl.append(ust, alt);
    document.body.append(ortucuEl);
  }

  function ortucuCek(ortaIs, bitince) {
    if (azHareket()) {
      ortaIs();
      bitince?.();
      return;
    }
    ortucuKur();
    gecis = true;
    ortucuEl.classList.remove("aciliyor");
    ortucuEl.classList.add("etkin", "kapaniyor");

    setTimeout(() => {
      ortaIs();
      ortucuEl.classList.remove("kapaniyor");
      ortucuEl.classList.add("aciliyor");
      setTimeout(() => {
        ortucuEl.classList.remove("etkin", "aciliyor");
        gecis = false;
        bitince?.();
      }, ORTUCU_YARI_MS);
    }, ORTUCU_YARI_MS);
  }

  function odaKur() {
    if (odaEl) return;

    odaEl = document.createElement("section");
    odaEl.className = "kk-oda";
    odaEl.setAttribute("role", "dialog");
    odaEl.setAttribute("aria-modal", "true");
    odaEl.setAttribute("aria-labelledby", "kk-baslik");
    odaEl.tabIndex = -1;

    const ic = document.createElement("div");
    ic.className = "kk-ic";

    const ust = document.createElement("header");
    ust.className = "kk-ust";

    const etiket = document.createElement("p");
    etiket.className = "kk-etiket veri";
    etiket.id = "kk-baslik";
    etiket.textContent = "DARK FRAME · 00-ALT · ÖRTÜCÜ KAPALI";

    const kapatBtn = document.createElement("button");
    kapatBtn.type = "button";
    kapatBtn.className = "kk-kapat veri";
    kapatBtn.dataset.kkKapat = "";
    kapatBtn.textContent = "↑ Yüzeye çık (ESC)";
    kapatBtn.addEventListener("click", () => kapa());

    ust.append(etiket, kapatBtn);

    const giris = document.createElement("p");
    giris.className = "kk-giris";
    giris.textContent = "Buraya kadar zorladığına göre karanlıkta ne kaldığına bakıyorsun.";

    const izgara = document.createElement("div");
    izgara.className = "kk-izgara";

    const sol = document.createElement("div");
    sol.className = "kk-sol";

    const fitsBaslik = document.createElement("p");
    fitsBaslik.className = "kk-bolum-ad veri";
    fitsBaslik.textContent = "FITS HEADER · CANLI OTURUM";

    fitsEl = document.createElement("pre");
    fitsEl.className = "kk-fits veri";
    fitsEl.dataset.kkFits = "";
    fitsEl.textContent = fitsMetni(oturum);

    sol.append(fitsBaslik, fitsEl);

    const sag = document.createElement("div");
    sag.className = "kk-sag";

    const tezgahBaslik = document.createElement("p");
    tezgahBaslik.className = "kk-bolum-ad veri";
    tezgahBaslik.textContent = "DARK SUBTRACT · SENSÖR (180×180)";

    sensorEl = document.createElement("div");
    sensorEl.className = "kk-sensor";
    sensorEl.setAttribute("aria-label", "180 çarpı 180 piksellik karanlık kare sensör görüntüsü");

    const taramaEl = document.createElement("span");
    taramaEl.className = "kk-tarama";
    taramaEl.setAttribute("aria-hidden", "true");
    sensorEl.append(taramaEl);

    sahteEls = SAHTE_PIKSELLER.map((p) => {
      const s = document.createElement("i");
      s.className = "kk-sahte-piksel";
      s.style.left = `${p.x}px`;
      s.style.top = `${p.y}px`;
      s.style.width = `${p.b}px`;
      s.style.height = `${p.b}px`;
      s.style.opacity = String(p.o);
      s.dataset.y = String(p.y);
      sensorEl.append(s);
      return s;
    });

    anaPikselEl = document.createElement("span");
    anaPikselEl.className = "kk-ana-piksel";
    anaPikselEl.style.left = `${ANA_PIKSEL.x}px`;
    anaPikselEl.style.top = `${ANA_PIKSEL.y}px`;
    anaPikselEl.setAttribute("aria-hidden", "true");

    const gozSol = document.createElement("i");
    gozSol.className = "kk-piksel-goz kk-piksel-goz-sol";
    const gozSag = document.createElement("i");
    gozSag.className = "kk-piksel-goz kk-piksel-goz-sag";
    anaPikselEl.append(gozSol, gozSag);
    sensorEl.append(anaPikselEl);

    kalibreBtn = document.createElement("button");
    kalibreBtn.type = "button";
    kalibreBtn.className = "kk-kalibre veri";
    kalibreBtn.textContent = "Kalibre et (Dark Subtract)";
    kalibreBtn.addEventListener("click", () => kalibreAdimiCalistir());

    durumEl = document.createElement("p");
    durumEl.className = "kk-durum veri";
    durumEl.setAttribute("role", "status");
    durumEl.textContent = "SENSÖR: 8 sıcak piksel algılandı.";

    tepkiEl = document.createElement("p");
    tepkiEl.className = "kk-tepki";
    tepkiEl.setAttribute("aria-live", "polite");

    sag.append(tezgahBaslik, sensorEl, kalibreBtn, durumEl, tepkiEl);
    izgara.append(sol, sag);

    const alt = document.createElement("footer");
    alt.className = "kk-alt";
    alt.textContent = "Bu oda menüde yok. İyi karelerin yarısı zaten karanlıkta çıkar.";

    ic.append(ust, giris, izgara, alt);
    odaEl.append(ic);
    document.body.append(odaEl);
  }

  function kalibreAdimiCalistir() {
    if (!odaEl) odaKur();
    if (taraniyor || kalibreAdim >= 3) return;

    kalibreAdim += 1;
    oturumGuncelle({ kalibreDeneme: oturum.kalibreDeneme + 1 });

    if (kalibreAdim === 3) {
      kalibreBtn.disabled = true;
      kalibreBtn.textContent = "Tamam, kalsın";
      durumEl.textContent = "DURUM: KALİBRASYON İPTAL · İMZA KORUNDU.";
      tepkiEl.textContent = "“Anlaştık. Şimdi örtücüyü açabilirsin.”";
      return;
    }

    const azalt = azHareket();
    if (azalt) {
      if (kalibreAdim === 1) {
        sahteEls.forEach((s) => s.classList.add("silindi"));
        anaPikselEl.style.setProperty("--kx", "14px");
        anaPikselEl.classList.add("kacti");
        durumEl.textContent = "KALİBRASYON: 7 piksel temizlendi. 1 piksel reddetti.";
        tepkiEl.textContent = "“O benim yanağımdaki. Dokunma.”";
      } else if (kalibreAdim === 2) {
        durumEl.textContent = "UYARI: Sıcak piksel (14, 6) ısrarla yerinde.";
        tepkiEl.textContent = "“Bazı kusurlar silinmez. İmzaya dönüşür.”";
      }
      return;
    }

    taraniyor = true;
    kalibreBtn.disabled = true;
    durumEl.textContent = "TARANIYOR · DARK SUBTRACT...";
    sensorEl.classList.remove("taraniyor");
    void sensorEl.offsetWidth;
    sensorEl.classList.add("taraniyor");

    if (kalibreAdim === 1) {
      sahteEls.forEach((s) => {
        const y = Number(s.dataset.y) || 0;
        const gecikme = Math.round((y / 180) * TARAMA_MS);
        taramaZamanlayicilar.push(setTimeout(() => s.classList.add("silindi"), gecikme));
      });

      const kacisMs = Math.max(80, Math.round(((ANA_PIKSEL.y - 16) / 180) * TARAMA_MS));
      taramaZamanlayicilar.push(
        setTimeout(() => {
          anaPikselEl.style.setProperty("--kx", "14px");
          anaPikselEl.classList.add("kacti");
        }, kacisMs),
      );

      taramaZamanlayicilar.push(
        setTimeout(() => {
          sensorEl.classList.remove("taraniyor");
          taraniyor = false;
          kalibreBtn.disabled = false;
          durumEl.textContent = "KALİBRASYON: 7 piksel temizlendi. 1 piksel reddetti.";
          tepkiEl.textContent = "“O benim yanağımdaki. Dokunma.”";
        }, TARAMA_MS + 40),
      );
    } else if (kalibreAdim === 2) {

      const gozMs = Math.round((ANA_PIKSEL.y / 180) * TARAMA_MS);
      taramaZamanlayicilar.push(
        setTimeout(() => {
          anaPikselEl.classList.add("goz-kirp");
          taramaZamanlayicilar.push(
            setTimeout(() => anaPikselEl.classList.remove("goz-kirp"), 460),
          );
        }, gozMs),
      );

      taramaZamanlayicilar.push(
        setTimeout(() => {
          sensorEl.classList.remove("taraniyor");
          taraniyor = false;
          kalibreBtn.disabled = false;
          durumEl.textContent = "UYARI: Sıcak piksel (14, 6) ısrarla yerinde.";
          tepkiEl.textContent = "“Bazı kusurlar silinmez. İmzaya dönüşür.”";
        }, TARAMA_MS + 80),
      );
    }
  }

  const oturumDinle = (e) => {
    if (!acik || !fitsEl) return;
    fitsEl.textContent = fitsMetni(e.detail || oturum);
  };

  const klavyeDinle = (e) => {
    if (!acik) return;
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      kapa();
      return;
    }
    if (e.key === "ArrowUp" || e.key === "PageUp") {
      if (!odaEl || odaEl.scrollTop <= 2) {
        e.preventDefault();
        e.stopPropagation();
        kapa();
      } else {
        e.stopPropagation();
      }
      return;
    }
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
      e.stopPropagation();
    }
  };

  const tekerlekDinle = (e) => {
    if (!acik) return;
    const tepede = !odaEl || odaEl.scrollTop <= 2;
    if (e.deltaY < -25 && tepede) {
      e.preventDefault();
      e.stopPropagation();
      kapa();
      return;
    }
    const icKayar = odaEl && odaEl.scrollHeight > odaEl.clientHeight + 2;
    if (!icKayar) e.preventDefault();
    e.stopPropagation();
  };

  function ac() {
    if (acik || gecis) return;
    gerilimSifirla();
    odaKur();
    oncekiOdak = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    ortucuCek(
      () => {
        acik = true;
        oturumGuncelle({ karanlikAcildi: oturum.karanlikAcildi + 1 });
        if (fitsEl) fitsEl.textContent = fitsMetni(oturum);
        odaEl.scrollTop = 0;
        odaEl.classList.add("acik");
        document.documentElement.classList.add("kk-acik");
        document.addEventListener("aisenit-oturum", oturumDinle);
        addEventListener("keydown", klavyeDinle, { capture: true });
        addEventListener("wheel", tekerlekDinle, { capture: true, passive: false });
      },
      () => {
        odaEl?.focus({ preventScroll: true });
      },
    );
  }

  function kapa() {
    if (!acik || gecis) return;
    taramaZamanlayicilariTemizle();
    if (sensorEl) sensorEl.classList.remove("taraniyor");
    if (taraniyor) {
      taraniyor = false;
      if (kalibreBtn && kalibreAdim < 3) kalibreBtn.disabled = false;
    }

    ortucuCek(
      () => {
        acik = false;
        odaEl?.classList.remove("acik");
        document.documentElement.classList.remove("kk-acik");
        document.removeEventListener("aisenit-oturum", oturumDinle);
        removeEventListener("keydown", klavyeDinle, { capture: true });
        removeEventListener("wheel", tekerlekDinle, { capture: true });
      },
      () => {
        oncekiOdak?.focus?.({ preventScroll: true });
        oncekiOdak = null;
      },
    );
  }

  function zorla() {
    if (acik || gecis) return;
    const simdi = performance.now();
    if (simdi - sonZorlama < ZORLAMA_ARALIK_MS) return;
    sonZorlama = simdi;

    zorlama += 1;
    clearTimeout(zorlamaZamanlayici);

    if (zorlama >= 3) {
      ac();
      return;
    }

    gerilimKur();
    gerilimEl.classList.add("etkin");
    gerilimEl.dataset.adim = String(zorlama);
    ibareEl.classList.add("etkin");

    if (zorlama === 1) {
      gerilimEl.style.setProperty("--oran", "0.33");
      ibareEl.textContent = "ÖRTÜCÜ KAPALI · 1/3";
    } else if (zorlama === 2) {
      gerilimEl.style.setProperty("--oran", "0.72");
      ibareEl.textContent = "KARANLIK KARE AÇILIYOR · 2/3";
      footerEsnet();
    }

    zorlamaZamanlayici = setTimeout(gerilimSifirla, ZORLAMA_SURE_MS);
  }

  function kalibreEt() {
    if (!acik) {
      ac();
      setTimeout(() => kalibreAdimiCalistir(), azHareket() ? 30 : 320);
      return;
    }
    kalibreAdimiCalistir();
  }

  let uzunBasma = null;
  let uzunTamam = false;
  let baslangic = null;

  document.addEventListener("pointerdown", (e) => {
    const tetik = e.target instanceof Element ? e.target.closest("[data-kk-tetik]") : null;
    if (!tetik || acik || gecis) return;
    uzunTamam = false;
    baslangic = { x: e.clientX, y: e.clientY };
    clearTimeout(uzunBasma);
    uzunBasma = setTimeout(() => {
      uzunTamam = true;
      ac();
    }, UZUN_BASIS_MS);
  });

  document.addEventListener(
    "pointermove",
    (e) => {
      if (!uzunBasma || !baslangic) return;
      if (Math.hypot(e.clientX - baslangic.x, e.clientY - baslangic.y) > 12) {
        clearTimeout(uzunBasma);
        uzunBasma = null;
      }
    },
    { passive: true },
  );

  const uzunIptal = () => {
    clearTimeout(uzunBasma);
    uzunBasma = null;
    baslangic = null;
  };
  document.addEventListener("pointerup", uzunIptal);
  document.addEventListener("pointercancel", uzunIptal);

  document.addEventListener("click", (e) => {
    const tetik = e.target instanceof Element ? e.target.closest("[data-kk-tetik]") : null;
    if (!tetik) return;
    e.preventDefault();
    if (uzunTamam) {
      uzunTamam = false;
      return;
    }
    zorla();
  });

  return {
    zorla,
    ac,
    kapa,
    acikMi: () => acik,
    kalibreEt,
  };
}
