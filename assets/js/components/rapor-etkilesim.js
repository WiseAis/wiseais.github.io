import { NS } from "../lib/svg.js?v=20261127a";
import { azHareket } from "../lib/rastgele.js?v=20261127a";

function svgEl(ad, oz = {}) {
  const d = document.createElementNS(NS, ad);
  for (const [k, v] of Object.entries(oz)) d.setAttribute(k, String(v));
  return d;
}

function hudKur(kap, ipucuMetin, onceEl = null) {
  const hud = document.createElement("div");
  hud.className = "kg-hud veri";
  hud.setAttribute("aria-live", "polite");
  const metin = document.createElement("div");
  metin.className = "kg-hud-metin";
  const ipucu = document.createElement("span");
  ipucu.className = "kg-ipucu";
  ipucu.textContent = ipucuMetin;
  hud.append(metin, ipucu);
  if (onceEl && onceEl.parentNode === kap) kap.insertBefore(hud, onceEl);
  else kap.appendChild(hud);
  return { hud, metin, ipucu };
}

function hudYaz(metinEl, baslik, detay = "", renk = "") {
  metinEl.textContent = "";
  const b = document.createElement("span");
  b.className = renk ? "kg-deger etkin" : "kg-bas";
  if (renk) b.style.setProperty("--c", renk);
  b.textContent = baslik;
  metinEl.appendChild(b);
  if (detay) {
    const ay = document.createElement("span");
    ay.className = "kg-ayrac";
    ay.textContent = "·";
    const d = document.createElement("span");
    d.className = "kg-parca";
    d.textContent = detay;
    metinEl.append(ay, d);
  }
}

const FITS_HARITA = {
  "ais-001-03": {
    OBJECT: "kapsam",
    INSTRUME: "girdi",
    ESTIMAND: "model",
    BUNIT: "kapsam",
    "DATE-RNG": "deney",
    STATUS: "acik",
  },
  "ais-002-03": {
    OBJECT: "roller",
    ORCHESTR: "roller",
    DESIGNER: "roller",
    WORKERS: "roller",
    VERIFIER: "uc-el",
    NCOMMIT: "gece",
    "DATE-RNG": "gece",
    NCHECK: "kapi",
    RECORDS: "kayit",
    STATUS: "acik",
  },
};

function fitsKur() {
  const pre = document.querySelector(".rapor-bas .fits");
  if (!pre) return;
  const sayfa = document.body.dataset.sayfa || "";
  const harita = FITS_HARITA[sayfa];
  if (!harita) return;

  const satirlar = [[]];
  for (const dugum of [...pre.childNodes]) {
    if (dugum.nodeType === Node.TEXT_NODE) {
      const parcalar = dugum.nodeValue.split("\n");
      parcalar.forEach((p, idx) => {
        if (idx > 0) satirlar.push([]);
        if (p) satirlar[satirlar.length - 1].push(document.createTextNode(p));
      });
    } else {
      satirlar[satirlar.length - 1].push(dugum);
    }
  }

  const parca = document.createDocumentFragment();
  satirlar.forEach((dugumler, idx) => {
    const satirSpan = document.createElement("span");
    satirSpan.className = "fits-satir";
    for (const d of dugumler) satirSpan.appendChild(d);

    const ilkMetin = satirSpan.textContent || "";
    const eslesme = ilkMetin.match(/^([A-Z0-9-]+)\s*=/);
    const anahtar = eslesme ? eslesme[1] : "";
    const hedefId = anahtar ? harita[anahtar] : null;
    const hedef = hedefId ? document.getElementById(hedefId) : null;

    if (hedef) {
      satirSpan.classList.add("fits-bag");
      satirSpan.setAttribute("role", "button");
      satirSpan.setAttribute("tabindex", "0");
      satirSpan.dataset.fitsHedef = `#${hedefId}`;
      const baslikMetin = hedef.querySelector("h2, h3")?.textContent?.trim() || hedefId;
      satirSpan.setAttribute("title", `Bölüme git: ${baslikMetin}`);

      const git = () => {
        hedef.scrollIntoView({ behavior: azHareket() ? "auto" : "smooth", block: "start" });
        const bolum = hedef.closest("section") || hedef;
        bolum.classList.remove("bolum-parla");
        if (!azHareket()) {
          void bolum.offsetWidth;
          bolum.classList.add("bolum-parla");
          clearTimeout(bolum._parlaZaman);
          bolum._parlaZaman = setTimeout(() => bolum.classList.remove("bolum-parla"), 1100);
        }
      };

      satirSpan.addEventListener("click", git);
      satirSpan.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          git();
        }
      });
    }

    parca.appendChild(satirSpan);
    if (idx < satirlar.length - 1) parca.appendChild(document.createTextNode("\n"));
  });

  pre.textContent = "";
  pre.appendChild(parca);
}

function sinyalOlceriKur() {
  const ic = document.querySelector(".icindekiler");
  const liste = ic?.querySelector("ol");
  const baslik = ic?.querySelector(":scope > .veri");
  if (!ic || !liste) return;

  let maksKaydir = 1;
  let rafId = 0;

  const oraniYaz = () => {
    rafId = 0;
    const oran = Math.max(0, Math.min(1, window.scrollY / maksKaydir));
    liste.style.setProperty("--okuma-oran", oran.toFixed(4));
    if (baslik) baslik.dataset.sinyal = `%${Math.round(oran * 100)}`;
  };

  const olcuGuncelle = () => {
    const h = document.documentElement;
    maksKaydir = Math.max(1, h.scrollHeight - h.clientHeight);
    oraniYaz();
  };

  const kaydirDinle = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(oraniYaz);
  };

  olcuGuncelle();
  addEventListener("scroll", kaydirDinle, { passive: true });
  addEventListener("resize", () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(olcuGuncelle);
  }, { passive: true });

  document.querySelectorAll("details").forEach((d) => {
    d.addEventListener("toggle", () => requestAnimationFrame(olcuGuncelle));
  });
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => requestAnimationFrame(olcuGuncelle));
    ro.observe(document.body);
  }
}

function kanitDarbeleriKur() {
  document.querySelectorAll(".kanit").forEach((fig) => {
    if (typeof fig.aisDarbe === "function") return;
    fig.aisDarbe = (_x, _y, nx = 0, ny = 0) => {
      if (azHareket()) return;
      fig.style.setProperty("--darbe-x", `${(-nx * 4).toFixed(1)}px`);
      fig.style.setProperty("--darbe-y", `${(-ny * 3).toFixed(1)}px`);
      fig.classList.remove("kanit-darbe");
      void fig.offsetWidth;
      fig.classList.add("kanit-darbe");
      clearTimeout(fig._darbeZaman);
      fig._darbeZaman = setTimeout(() => fig.classList.remove("kanit-darbe"), 380);
    };
  });
}

function rollerKur() {
  const bolum = document.getElementById("roller");
  const fig = bolum?.querySelector("figure.kanit");
  const s = fig?.querySelector("svg.ekip-svg");
  if (!fig || !s) return;

  s.setAttribute("tabindex", "0");
  const { metin, ipucu } = hudKur(fig, "adıma dokun · kayıt izi ve döngü", fig.querySelector("figcaption"));

  const kutular = [...s.querySelectorAll("rect.e-kutu")];
  const tumMetinler = [...s.querySelectorAll("text")];
  const tumCizgiler = [...s.querySelectorAll("line")];
  const geriYol = s.querySelector("path.e-ok.geri");
  const geriMetinler = [...s.querySelectorAll("text.e-sorun")];
  const donguYol = s.querySelector("path.e-ok.dongu");
  const donguMetin = s.querySelector("text.e-abrek[transform]");

  const adimlar = kutular.map((kutu, i) => {
    const y = Number(kutu.getAttribute("y"));
    const h = Number(kutu.getAttribute("height"));
    const yOrta = y + h / 2;
    const baslik = tumMetinler.find((t) => Number(t.getAttribute("x")) === 162 && Math.abs(Number(t.getAttribute("y")) - (y + 15)) < 4);
    const not = tumMetinler.find((t) => t.classList.contains("e-not") && Math.abs(Number(t.getAttribute("y")) - (y + 31)) < 4);
    const bag = tumCizgiler.find((l) => l.classList.contains("e-bag") && Math.abs(Number(l.getAttribute("y1")) - yOrta) < 3);
    const iz = tumMetinler.find((t) => t.classList.contains("e-iz") && Math.abs(Number(t.getAttribute("y")) - (yOrta + 3.5)) < 4);
    const gidenOk = tumCizgiler.find((l) => l.classList.contains("e-ok") && Math.abs(Number(l.getAttribute("y1")) - (y + h)) < 3);
    const gelenOk = tumCizgiler.find((l) => l.classList.contains("e-ok") && Math.abs(Number(l.getAttribute("y2")) - y) < 4);

    const ogeler = [kutu, baslik, not, bag, iz].filter(Boolean);
    const adMetin = baslik?.textContent?.trim() || `Adım ${i + 1}`;
    const izMetin = iz?.textContent?.trim() || "";
    const geriDahil = i === 5 || i === 6 || i === 7;
    const donguDahil = i === 0 || i === 9;

    return { i, y, h, kutu, ogeler, gidenOk, gelenOk, adMetin, izMetin, geriDahil, donguDahil };
  });

  const tumAdimOgeleri = new Set(adimlar.flatMap((a) => [...a.ogeler, a.gidenOk, a.gelenOk].filter(Boolean)));
  const geriOgeler = [geriYol, ...geriMetinler].filter(Boolean);
  const donguOgeler = [donguYol, donguMetin].filter(Boolean);

  let aktif = null;
  let sabit = null;

  const guncelle = () => {
    const secili = aktif ?? sabit;
    s.classList.toggle("rk-etkilesim", secili !== null);

    for (const o of tumAdimOgeleri) o.classList.remove("rk-etkin", "rk-soluk");
    for (const o of geriOgeler) o.classList.remove("rk-etkin", "rk-soluk");
    for (const o of donguOgeler) o.classList.remove("rk-etkin", "rk-soluk");

    if (secili === null) {
      hudYaz(metin, "10 ADIM · ABREK (2) · CLAUDE (5) · GEMINI (3)", "kapı veya doğrulayıcı reddi → uygulamaya geri");
      return;
    }

    const a = adimlar[secili];
    for (const o of tumAdimOgeleri) o.classList.add("rk-soluk");
    for (const o of geriOgeler) o.classList.add("rk-soluk");
    for (const o of donguOgeler) o.classList.add("rk-soluk");

    for (const o of a.ogeler) {
      o.classList.remove("rk-soluk");
      o.classList.add("rk-etkin");
    }
    if (a.gidenOk) {
      a.gidenOk.classList.remove("rk-soluk");
      a.gidenOk.classList.add("rk-etkin");
    }
    if (a.gelenOk) {
      a.gelenOk.classList.remove("rk-soluk");
      a.gelenOk.classList.add("rk-etkin");
    }

    if (a.geriDahil) {
      for (const o of geriOgeler) {
        o.classList.remove("rk-soluk");
        o.classList.add("rk-etkin");
      }
    }
    if (a.donguDahil) {
      for (const o of donguOgeler) {
        o.classList.remove("rk-soluk");
        o.classList.add("rk-etkin");
      }
    }

    const ek = a.geriDahil ? `kayıt: ${a.izMetin} · kırmızı/onaysız: geri` : `kayıt: ${a.izMetin}`;
    const renk = a.geriDahil ? "var(--ha)" : a.donguDahil ? "var(--toz)" : "var(--oiii)";
    hudYaz(metin, a.adMetin, ek, renk);
  };

  adimlar.forEach((a) => {
    const hit = svgEl("rect", {
      x: 146,
      y: a.y - 2,
      width: 490,
      height: a.h + 4,
      fill: "transparent",
      class: "rk-hit",
    });
    hit.addEventListener("pointerenter", () => {
      aktif = a.i;
      ipucu.classList.add("sakin");
      guncelle();
    });
    hit.addEventListener("click", () => {
      sabit = sabit === a.i ? null : a.i;
      aktif = sabit;
      ipucu.classList.add("sakin");
      guncelle();
    });
    s.appendChild(hit);
  });

  s.addEventListener("pointerleave", () => {
    aktif = null;
    guncelle();
  });

  s.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const yon = e.key === "ArrowDown" ? 1 : -1;
      const mevcut = sabit === null ? (yon > 0 ? -1 : 0) : sabit;
      sabit = (mevcut + yon + adimlar.length) % adimlar.length;
      aktif = sabit;
      ipucu.classList.add("sakin");
      guncelle();
    } else if (e.key === "Escape") {
      sabit = null;
      aktif = null;
      guncelle();
    }
  });

  guncelle();
}

function botlarKur() {
  const bolum = document.getElementById("botlar");
  const fig = bolum?.querySelector("figure.kanit");
  const s = fig?.querySelector("svg.ekip-svg");
  if (!fig || !s) return;

  s.setAttribute("tabindex", "0");
  const { metin, ipucu } = hudKur(fig, "satırda gezdir · son satıra dokun (%38 ↔ %0)", fig.querySelector("figcaption"));

  const botMetinleri = [...s.querySelectorAll("text.e-bot")];
  const tumCocuklar = [...s.children];

  const satirlar = botMetinleri.map((bm, i) => {
    const y = Number(bm.getAttribute("y"));
    const yMin = y - 20;
    const yMax = i === botMetinleri.length - 1 ? y + 32 : y + 24;
    const ogeler = tumCocuklar.filter((el) => {
      if (el.classList.contains("e-izgara") || el.classList.contains("e-ayrac")) return false;
      const ey = Number(el.getAttribute("y") ?? el.getAttribute("y1") ?? el.getAttribute("cy"));
      if (!Number.isFinite(ey)) return false;
      return ey >= yMin && ey <= yMax;
    });

    const ad = bm.textContent.trim();
    const altNot = ogeler.find((el) => el.tagName === "text" && el !== bm && Number(el.getAttribute("x")) === 10)?.textContent?.trim() || "";
    const basliklar = ogeler.map((el) => el.querySelector("title")?.textContent?.trim()).filter(Boolean);
    const sorunMetin = ogeler.find((el) => el.tagName === "text" && el.classList.contains("e-sorun")) || null;
    const duzeltmeMetin = ogeler.find((el) => el.tagName === "text" && el.classList.contains("e-iz") && /%0/.test(el.textContent || "")) || null;

    const gecisVar = Boolean(
      ad.includes("ev yapmayan") &&
      sorunMetin && /%38/.test(sorunMetin.textContent || "") &&
      duzeltmeMetin && /%0/.test(duzeltmeMetin.textContent || ""),
    );
    const anaDalOgeler = gecisVar
      ? ogeler.filter((el) => el.classList.contains("e-aralik") || el.classList.contains("e-ortanca") || el.classList.contains("e-deger") || el === sorunMetin)
      : [];

    return { i, y, ad, altNot, basliklar, ogeler, gecisVar, anaDalOgeler, duzeltmeMetin };
  });

  let sifirIsaret = null;
  const sonSatir = satirlar.find((r) => r.gecisVar);
  if (sonSatir) {
    sifirIsaret = svgEl("circle", { cx: 200, cy: 237, r: 5, class: "rk-sifir-isaret" });
    s.appendChild(sifirIsaret);
  }

  let aktif = null;
  let sabit = null;
  let duzeltmeKipi = false;
  const tumOgeler = new Set(satirlar.flatMap((r) => r.ogeler));

  const guncelle = () => {
    const secili = aktif ?? sabit;
    s.classList.toggle("rk-etkilesim", secili !== null);
    s.classList.toggle("rk-duzeltme-acik", duzeltmeKipi);

    for (const o of tumOgeler) o.classList.remove("rk-etkin", "rk-soluk", "rk-hayalet", "rk-duzeltme-etkin");
    if (sifirIsaret) sifirIsaret.classList.toggle("gorunur", duzeltmeKipi);

    if (sonSatir && duzeltmeKipi) {
      for (const o of sonSatir.anaDalOgeler) o.classList.add("rk-hayalet");
      sonSatir.duzeltmeMetin?.classList.add("rk-duzeltme-etkin");
    }

    if (secili !== null) {
      const r = satirlar[secili];
      for (const o of tumOgeler) o.classList.add("rk-soluk");
      for (const o of r.ogeler) {
        o.classList.remove("rk-soluk");
        o.classList.add("rk-etkin");
      }
      if (r.gecisVar) {
        if (duzeltmeKipi) {
          hudYaz(metin, `${r.ad} · düzeltme dalı: zafer %0`, "dal ana dala girmedi · dokun: ana dal (%38)", "var(--oiii)");
        } else {
          hudYaz(metin, `${r.ad} · ${r.altNot}`, `${r.basliklar.join(" · ")} · dokun: düzeltme dalı (%0)`, "var(--ha)");
        }
      } else {
        const detay = [r.altNot, ...r.basliklar].filter(Boolean).join(" · ");
        hudYaz(metin, r.ad, detay, r.i >= 2 ? "var(--ha)" : "var(--toz)");
      }
      return;
    }

    if (sonSatir) {
      if (duzeltmeKipi) {
        hudYaz(metin, "ev yapmayan dengeli · düzeltme dalı: zafer %0", "ana dalda %38 idi · dokun: ana dal", "var(--oiii)");
      } else {
        hudYaz(metin, `ev yapmayan dengeli · ${sonSatir.altNot}`, "ortanca 85 · düzeltme dalında %0", "var(--ha)");
      }
    }
  };

  satirlar.forEach((r) => {
    const hit = svgEl("rect", {
      x: 4,
      y: r.y - 20,
      width: 660,
      height: r.gecisVar ? 46 : 42,
      fill: "transparent",
      class: r.gecisVar ? "rk-hit rk-hit-gecis" : "rk-hit",
    });
    hit.addEventListener("pointerenter", () => {
      aktif = r.i;
      ipucu.classList.add("sakin");
      guncelle();
    });
    hit.addEventListener("click", () => {
      if (r.gecisVar) {
        duzeltmeKipi = !duzeltmeKipi;
        sabit = r.i;
        aktif = r.i;
      } else {
        sabit = sabit === r.i ? null : r.i;
        aktif = sabit;
      }
      ipucu.classList.add("sakin");
      guncelle();
    });
    s.appendChild(hit);
  });

  s.addEventListener("pointerleave", () => {
    aktif = null;
    guncelle();
  });

  s.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const yon = e.key === "ArrowDown" ? 1 : -1;
      const mevcut = sabit === null ? (yon > 0 ? -1 : 0) : sabit;
      sabit = (mevcut + yon + satirlar.length) % satirlar.length;
      aktif = sabit;
      ipucu.classList.add("sakin");
      guncelle();
    } else if ((e.key === "Enter" || e.key === " ") && sonSatir && (sabit === sonSatir.i || sabit === null)) {
      e.preventDefault();
      sabit = sonSatir.i;
      aktif = sonSatir.i;
      duzeltmeKipi = !duzeltmeKipi;
      ipucu.classList.add("sakin");
      guncelle();
    } else if (e.key === "Escape") {
      sabit = null;
      aktif = null;
      duzeltmeKipi = false;
      guncelle();
    }
  });

  guncelle();
}

function guvenKur() {
  const bolum = document.getElementById("guven");
  const kap = bolum?.querySelector(".tablo-kap");
  const tablo = kap?.querySelector("table.karne");
  if (!kap || !tablo) return;

  const satirlar = [...tablo.querySelectorAll("tbody tr")].map((tr) => {
    const modelHucre = tr.querySelector("td:first-child");
    const rozet = tr.querySelector(".basamak");
    return {
      tr,
      modelHucre,
      rozet,
      model: modelHucre?.textContent?.trim() || "",
      basamak: rozet?.textContent?.trim() || "",
    };
  });
  if (!satirlar.length) return;

  const { metin, ipucu } = hudKur(kap, "model adına veya basamak rozetine dokun");

  const d1Sayi = satirlar.filter((r) => r.basamak === "D1").length;
  const d0Sayi = satirlar.filter((r) => r.basamak === "D0").length;

  const d2Sayi = satirlar.filter((r) => r.basamak === "D2").length;
  let filtre = null;

  const guncelle = () => {
    let eslesen = 0;
    satirlar.forEach((r) => {
      const tuttu = !filtre || (filtre.tur === "model" ? r.model === filtre.deger : r.basamak === filtre.deger);
      if (tuttu) eslesen += 1;
      r.tr.classList.toggle("karne-etkin", Boolean(filtre && tuttu));
      r.tr.classList.toggle("karne-soluk", Boolean(filtre && !tuttu));
      r.modelHucre?.setAttribute("aria-pressed", String(Boolean(filtre && filtre.tur === "model" && filtre.deger === r.model)));
      r.rozet?.setAttribute("aria-pressed", String(Boolean(filtre && filtre.tur === "basamak" && filtre.deger === r.basamak)));
    });

    if (!filtre) {
      hudYaz(metin, `${satirlar.length} kayıt · ${d2Sayi ? `${d2Sayi} D2 · ` : ""}${d1Sayi} D1 · ${d0Sayi} D0`, "basamak doğrulama derinliğini belirler");
    } else {
      const renk = filtre.deger === "D0" ? "var(--ha)" : filtre.deger === "D1" ? "var(--toz)" : "var(--oiii)";
      hudYaz(metin, `${filtre.deger} · ${eslesen}/${satirlar.length} satır`, "kaldırmak için tekrar dokun", renk);
    }
  };

  const tetikBagla = (el, tur, deger) => {
    if (!el) return;
    el.classList.add("karne-tetik");
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.setAttribute("aria-pressed", "false");
    const degistir = () => {
      filtre = filtre && filtre.tur === tur && filtre.deger === deger ? null : { tur, deger };
      ipucu.classList.add("sakin");
      guncelle();
    };
    el.addEventListener("click", degistir);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        degistir();
      } else if (e.key === "Escape" && filtre) {
        filtre = null;
        guncelle();
      }
    });
  };

  satirlar.forEach((r) => {
    tetikBagla(r.modelHucre, "model", r.model);
    tetikBagla(r.rozet, "basamak", r.basamak);
  });

  guncelle();
}

function geceKur() {
  const bolum = document.getElementById("gece");
  const fig = bolum?.querySelector("figure.kanit");
  const s = fig?.querySelector("svg.ekip-svg");
  if (!fig || !s) return;

  s.setAttribute("tabindex", "0");
  const cap = fig.querySelector("figcaption");
  const { metin, ipucu } = hudKur(fig, "gün çubuklarında gezdir · Fable dönemine dokun", cap);

  const donumNotlari = new Map();
  if (cap) {
    const ham = cap.textContent || "";
    const parca = ham.split("girdiği günler:")[1] || "";
    parca.split("·").forEach((s) => {
      const m = s.trim().match(/^(\d+)\s+(.+)$/);
      if (m) donumNotlari.set(m[1], m[2].replace(/\.$/, "").trim());
    });
  }

  const isaretler = [...s.querySelectorAll("circle.e-isaret")].map((daire) => {
    const cx = Number(daire.getAttribute("cx"));
    const noEl = [...s.querySelectorAll("text.e-isaret-no")].find((t) => Math.abs(Number(t.getAttribute("x")) - cx) < 1);
    const no = noEl?.textContent?.trim() || "";
    return { cx, daire, noEl, no, not: donumNotlari.get(no) || "" };
  });

  const cubuklar = [...s.querySelectorAll("rect.e-cubuk")].map((rect, i) => {
    const x = Number(rect.getAttribute("x"));
    const w = Number(rect.getAttribute("width"));
    const cx = x + w / 2;
    const baslik = rect.querySelector("title")?.textContent?.trim() || "";
    const isaret = isaretler.find((is) => Math.abs(is.cx - cx) < 3) || null;
    const fableIcinde = cx >= 511 && cx <= 564;
    return { i, rect, cx, baslik, isaret, fableIcinde };
  });

  const fableCizgi = s.querySelector("line.e-fable");
  const fableMetin = [...s.querySelectorAll("text.e-iz")].find((t) => /Fable/i.test(t.textContent || "")) || null;

  let aktif = null;
  let sabit = null;
  let fableFiltre = false;

  const guncelle = () => {
    const secili = aktif ?? sabit;
    s.classList.toggle("rk-etkilesim", secili !== null || fableFiltre);

    cubuklar.forEach((c) => {
      c.rect.classList.remove("rk-etkin", "rk-soluk");
      c.isaret?.daire.classList.remove("rk-etkin", "rk-soluk");
      c.isaret?.noEl?.classList.remove("rk-etkin", "rk-soluk");
    });
    fableCizgi?.classList.toggle("rk-etkin", fableFiltre);
    fableMetin?.classList.toggle("rk-etkin", fableFiltre);

    if (secili !== null) {
      const c = cubuklar[secili];
      cubuklar.forEach((d, idx) => {
        const etkin = idx === secili;
        d.rect.classList.add(etkin ? "rk-etkin" : "rk-soluk");
        if (d.isaret) {
          d.isaret.daire.classList.add(etkin ? "rk-etkin" : "rk-soluk");
          d.isaret.noEl?.classList.add(etkin ? "rk-etkin" : "rk-soluk");
        }
      });
      const detay = c.isaret ? `${c.isaret.no}: ${c.isaret.not}` : c.fableIcinde ? "orkestratör Fable 5.2 dönemi" : "ana dal · git log";
      hudYaz(metin, c.baslik, detay, c.isaret ? "var(--oiii)" : "var(--toz)");
      return;
    }

    if (fableFiltre) {
      let toplam = 0;
      cubuklar.forEach((d) => {
        const etkin = d.fableIcinde;
        d.rect.classList.add(etkin ? "rk-etkin" : "rk-soluk");
        if (d.isaret) {
          d.isaret.daire.classList.add(etkin ? "rk-etkin" : "rk-soluk");
          d.isaret.noEl?.classList.add(etkin ? "rk-etkin" : "rk-soluk");
        }
        if (etkin) {
          const m = d.baslik.match(/(\d+)\s+commit/);
          if (m) toplam += Number(m[1]);
        }
      });
      hudYaz(metin, "orkestratör Fable 5.2 · 12–14 Kasım", `${toplam} commit · sonra Opus'a dönüldü`, "var(--oiii)");
      return;
    }

    hudYaz(metin, "645 commit · 27 aktif gün", "en yüksek 5 Kasım: 63 commit · 189 gece (%29)");
  };

  cubuklar.forEach((c) => {
    const x = Number(c.rect.getAttribute("x"));
    const hit = svgEl("rect", {
      x: x - 3,
      y: 26,
      width: 17,
      height: 152,
      fill: "transparent",
      class: "rk-hit",
    });
    hit.addEventListener("pointerenter", () => {
      aktif = c.i;
      ipucu.classList.add("sakin");
      guncelle();
    });
    hit.addEventListener("click", () => {
      fableFiltre = false;
      sabit = sabit === c.i ? null : c.i;
      aktif = sabit;
      ipucu.classList.add("sakin");
      guncelle();
    });
    s.appendChild(hit);
  });

  if (fableCizgi && fableMetin) {
    const fHit = svgEl("rect", { x: 350, y: 194, width: 222, height: 22, fill: "transparent", class: "rk-hit" });
    fHit.addEventListener("click", () => {
      sabit = null;
      aktif = null;
      fableFiltre = !fableFiltre;
      ipucu.classList.add("sakin");
      guncelle();
    });
    s.appendChild(fHit);
  }

  s.addEventListener("pointerleave", () => {
    aktif = null;
    guncelle();
  });

  s.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      fableFiltre = false;
      const yon = e.key === "ArrowRight" ? 1 : -1;
      const mevcut = sabit === null ? (yon > 0 ? -1 : 0) : sabit;
      sabit = (mevcut + yon + cubuklar.length) % cubuklar.length;
      aktif = sabit;
      ipucu.classList.add("sakin");
      guncelle();
    } else if (e.key === "Escape") {
      sabit = null;
      aktif = null;
      fableFiltre = false;
      guncelle();
    }
  });

  guncelle();
}

function kesintiKur() {
  const bolum = document.getElementById("kesinti");
  const fig = bolum?.querySelector("figure.kanit");
  const s = fig?.querySelector("svg.ekip-svg");
  if (!fig || !s) return;

  s.setAttribute("tabindex", "0");
  const { metin, ipucu } = hudKur(fig, "bloklarda gezdir · alttaki göstergeye dokun", fig.querySelector("figcaption"));

  const TURLER = [
    { sinif: "e-gecti", ad: "geçti", renk: "var(--oiii)" },
    { sinif: "e-yuk", ad: "kırmızı: yük altında süre", renk: "var(--ha)" },
    { sinif: "e-kirmizi", ad: "kırmızı: gerçek", renk: "var(--ha)" },
    { sinif: "e-olcum", ad: "Gemini ölçümü", renk: "var(--isik-2)" },
    { sinif: "e-birlesme", ad: "ana dala birleşme", renk: "var(--toz)" },
  ];

  const etiketler = [...s.querySelectorAll("text.e-etiket")];

  const bloklar = [...s.querySelectorAll("rect, path")]
    .filter((el) => {
      if (!el.querySelector("title")) return false;
      if (el.tagName === "rect") return Number(el.getAttribute("y")) < 130;
      const d = el.getAttribute("d") || "";
      const m = d.match(/M[\d.]+\s+([\d.]+)/);
      return m ? Number(m[1]) < 130 : false;
    })
    .map((el, i) => {
      const baslik = el.querySelector("title")?.textContent?.trim() || "";
      const tur = TURLER.find((t) => el.classList.contains(t.sinif)) || TURLER[0];
      let cx = 0;
      if (el.tagName === "rect") {
        cx = Number(el.getAttribute("x")) + Number(el.getAttribute("width")) / 2;
      } else {
        const m = (el.getAttribute("d") || "").match(/M([\d.]+)/);
        cx = m ? Number(m[1]) : 0;
      }
      const etiket = etiketler.find((et) => Math.abs(Number(et.getAttribute("x")) - cx) < 6) || null;
      return { i, el, cx, baslik, tur, etiket };
    })
    .sort((a, b) => a.cx - b.cx);

  const gostergeler = TURLER.map((t) => {
    const sembol = [...s.querySelectorAll(`.${t.sinif}`)].find((el) => {
      if (el.tagName === "rect") return Number(el.getAttribute("y")) >= 135;
      const m = (el.getAttribute("d") || "").match(/M[\d.]+\s+([\d.]+)/);
      return m ? Number(m[1]) >= 135 : false;
    });
    const yazi = sembol?.nextElementSibling?.tagName === "text" ? sembol.nextElementSibling : null;
    return { tur: t, sembol, yazi };
  }).filter((g) => g.sembol && g.yazi);

  let aktifBlok = null;
  let sabitBlok = null;
  let filtreTur = null;

  const guncelle = () => {
    const secili = aktifBlok ?? sabitBlok;
    const etkin = secili !== null || Boolean(filtreTur);
    s.classList.toggle("rk-etkilesim", etkin);

    bloklar.forEach((b) => {
      b.el.classList.remove("rk-etkin", "rk-soluk");
      b.etiket?.classList.remove("rk-etkin", "rk-soluk");
    });
    gostergeler.forEach((g) => {
      const gEtkin = filtreTur === g.tur.sinif;
      g.sembol.classList.toggle("rk-etkin", gEtkin);
      g.yazi.classList.toggle("rk-etkin", gEtkin);
      g.sembol.classList.toggle("rk-soluk", Boolean(filtreTur && !gEtkin));
      g.yazi.classList.toggle("rk-soluk", Boolean(filtreTur && !gEtkin));
    });

    if (secili !== null) {
      const b = bloklar[secili];
      bloklar.forEach((d, idx) => {
        const tut = idx === secili;
        d.el.classList.add(tut ? "rk-etkin" : "rk-soluk");
        d.etiket?.classList.add(tut ? "rk-etkin" : "rk-soluk");
      });
      hudYaz(metin, b.baslik, b.tur.ad, b.tur.renk);
      return;
    }

    if (filtreTur) {
      const t = TURLER.find((x) => x.sinif === filtreTur);
      let adet = 0;
      bloklar.forEach((d) => {
        const tut = d.tur.sinif === filtreTur;
        if (tut) adet += 1;
        d.el.classList.add(tut ? "rk-etkin" : "rk-soluk");
        d.etiket?.classList.add(tut ? "rk-etkin" : "rk-soluk");
      });
      const ek = filtreTur === "e-yuk"
        ? "en yavaş adım 1309, 180 ve 150 ms (eşik < 150 ms)"
        : "kaldırmak için göstergeye tekrar dokun";
      hudYaz(metin, `${t?.ad || ""} · ${adet} kayıt`, ek, t?.renk || "");
      return;
    }

    hudYaz(metin, "11 tam kapı · 7 geçti · 3 yük kırmızısı · 1 gerçek kırmızı", "2 ana dala birleşme · 1309 / 180 / 150 ms");
  };

  bloklar.forEach((b, idx) => {
    b.el.classList.add("rk-etkilesimli");
    b.el.addEventListener("pointerenter", () => {
      aktifBlok = idx;
      ipucu.classList.add("sakin");
      guncelle();
    });
    b.el.addEventListener("click", () => {
      filtreTur = null;
      sabitBlok = sabitBlok === idx ? null : idx;
      aktifBlok = sabitBlok;
      ipucu.classList.add("sakin");
      guncelle();
    });
  });

  const lejantGenislik = [58, 178, 118, 110, 88];
  gostergeler.forEach((g, idx) => {
    let sx = 16;
    if (g.sembol.tagName === "rect") {
      sx = Number(g.sembol.getAttribute("x")) - 4;
    } else {
      const m = (g.sembol.getAttribute("d") || "").match(/M([\d.]+)/);
      sx = m ? Number(m[1]) - 10 : 482;
    }
    const hit = svgEl("rect", {
      x: sx,
      y: 132,
      width: lejantGenislik[idx] || 110,
      height: 28,
      fill: "transparent",
      class: "rk-hit",
    });
    hit.addEventListener("click", () => {
      sabitBlok = null;
      aktifBlok = null;
      filtreTur = filtreTur === g.tur.sinif ? null : g.tur.sinif;
      ipucu.classList.add("sakin");
      guncelle();
    });
    s.appendChild(hit);
  });

  s.addEventListener("pointerleave", () => {
    aktifBlok = null;
    guncelle();
  });

  s.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      filtreTur = null;
      const yon = e.key === "ArrowRight" ? 1 : -1;
      const mevcut = sabitBlok === null ? (yon > 0 ? -1 : 0) : sabitBlok;
      sabitBlok = (mevcut + yon + bloklar.length) % bloklar.length;
      aktifBlok = sabitBlok;
      ipucu.classList.add("sakin");
      guncelle();
    } else if (e.key === "Escape") {
      sabitBlok = null;
      aktifBlok = null;
      filtreTur = null;
      guncelle();
    }
  });

  guncelle();
}

fitsKur();
sinyalOlceriKur();
kanitDarbeleriKur();

if (document.body.dataset.sayfa === "ais-002-03") {
  rollerKur();
  botlarKur();
  guvenKur();
  geceKur();
  kesintiKur();
}

export {};
