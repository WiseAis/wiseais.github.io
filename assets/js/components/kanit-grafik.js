import { el, svg, RENK } from "../lib/svg.js?v=20261127a";
import { azHareket } from "../lib/rastgele.js?v=20261127a";

const CIZGILER = [
  { anahtar: "Ha", veriAnahtar: "Ha", ad: "Fiziksel Hα", kisa: "Hα", renk: RENK.ha },
  { anahtar: "OIII", veriAnahtar: "OIII_total", ad: "[O III] toplamı", kisa: "[O III]", renk: RENK.oiii },
  { anahtar: "Hb", veriAnahtar: "Hb", ad: "Hβ", kisa: "Hβ", renk: RENK.hb },
];

const yuzde = (v, h = 1) => `%${v.toLocaleString("tr-TR", { minimumFractionDigits: h, maximumFractionDigits: h })}`;
const sayi = (v, h = 3) => v.toLocaleString("tr-TR", { minimumFractionDigits: h, maximumFractionDigits: h });

const veriOnbellek = new Map();
const veriGetir = (yol) => {
  if (!veriOnbellek.has(yol)) veriOnbellek.set(yol, fetch(yol).then((r) => r.json()));
  return veriOnbellek.get(yol);
};

let filtreSayac = 0;
function parlamaFiltresiEkle(s) {
  const id = `kg-parla-${++filtreSayac}`;
  const defs = el("defs", {}, s);
  const f = el("filter", { id, x: "-45%", y: "-45%", width: "190%", height: "190%" }, defs);
  el("feGaussianBlur", { stdDeviation: "2.4", result: "bulanik" }, f);
  const birles = el("feMerge", {}, f);
  el("feMergeNode", { in: "bulanik" }, birles);
  el("feMergeNode", { in: "SourceGraphic" }, birles);
  return id;
}

function kabukKur(kok, ipucuMetin) {
  const kaydir = document.createElement("div");
  kaydir.className = "kg-kaydir";
  const hud = document.createElement("div");
  hud.className = "kg-hud veri";
  hud.setAttribute("aria-live", "polite");
  const hudMetin = document.createElement("div");
  hudMetin.className = "kg-hud-metin";
  const ipucu = document.createElement("span");
  ipucu.className = "kg-ipucu";
  ipucu.textContent = ipucuMetin;
  hud.append(hudMetin, ipucu);
  kok.append(kaydir, hud);
  return { kaydir, hud, hudMetin, ipucu };
}

function hudSatirKur(kap, parcalar) {
  kap.textContent = "";
  parcalar.forEach((p, i) => {
    if (i > 0) {
      const ayrac = document.createElement("span");
      ayrac.className = "kg-ayrac";
      ayrac.textContent = "·";
      kap.appendChild(ayrac);
    }
    const span = document.createElement("span");
    span.className = p.sinif || "kg-parca";
    if (p.renk) span.style.setProperty("--c", p.renk);
    if (p.etiket) {
      const b = document.createElement("b");
      b.textContent = p.etiket;
      span.append(b, " ", p.deger ?? "");
    } else {
      span.textContent = p.metin;
    }
    kap.appendChild(span);
  });
}

function lejantEkle(s, x, y, c, onHover, onSec, genislik = 132) {
  const g = el("g", { class: "kg-lejant", "data-kanal": c.anahtar, role: "button", tabindex: "0", "aria-pressed": "false" }, s);
  el("rect", { x: x - 8, y: y - 15, width: genislik, height: 28, fill: "transparent", class: "kg-hit" }, g);
  el("circle", { cx: x + 4, cy: y - 2, r: 5, fill: c.renk, class: "kg-lej-nokta" }, g);
  el("text", { x: x + 15, y: y + 2, metin: c.ad, class: "kg-lej-ad" }, g);
  g.addEventListener("pointerenter", () => onHover(c.anahtar));
  g.addEventListener("pointerleave", () => onHover(null));
  g.addEventListener("click", (e) => {
    e.stopPropagation();
    onSec(c.anahtar);
  });
  g.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      onSec(c.anahtar);
    }
  });
  return g;
}

function kosullar(kok, veri) {
  const { kaydir, hudMetin, ipucu } = kabukKur(kok, "satırda gezdir · kanala dokun");

  const genislik = 680;
  const satir = 30;
  const sol = 204;
  const sag = 640;
  const ust = 56;
  const sonY = ust + (veri.kosullar.length - 1) * satir;
  const eksenAlt = sonY + 18;
  const Y = eksenAlt + 56;
  const s = svg(genislik, Y, kaydir);
  const parlaId = parlamaFiltresiEkle(s);
  const X = (v) => sol + (v / 60) * (sag - sol);

  for (let v = 0; v <= 60; v += 10) {
    el("line", { x1: X(v), x2: X(v), y1: ust - 14, y2: eksenAlt, stroke: v ? RENK.cizgi : RENK.isik4 }, s);
    el("text", { x: X(v), y: eksenAlt + 18, "text-anchor": "middle", metin: `%${v}` }, s);
  }
  el("text", {
    x: sag,
    y: eksenAlt + 40,
    "text-anchor": "end",
    class: "zayif",
    metin: "RMSE azalması · 100 × (1 − sonra / önce)",
  }, s);

  const varsayilanIndeks = Math.max(0, veri.kosullar.findIndex((k) => k.id === "nii-high"));
  let aktifSatir = null;
  let sabitSatir = null;
  let hoverKanal = null;
  let soloKanal = null;

  const lejantlar = new Map();
  const satirGruplar = [];

  const guncelle = () => {
    const gosterSatir = aktifSatir ?? sabitSatir;
    const etkinKanal = hoverKanal ?? soloKanal;
    s.classList.toggle("kg-satir-secili", gosterSatir !== null);
    s.classList.toggle("kg-kanal-secili", Boolean(etkinKanal));

    for (const [anahtar, g] of lejantlar) {
      const secili = soloKanal === anahtar;
      const vurgulu = etkinKanal === anahtar;
      g.classList.toggle("etkin", vurgulu);
      g.classList.toggle("soluk", Boolean(etkinKanal && !vurgulu));
      g.setAttribute("aria-pressed", String(secili));
    }

    satirGruplar.forEach((sg, i) => {
      const satirEtkin = gosterSatir === i;
      sg.g.classList.toggle("etkin", satirEtkin);
      sg.g.classList.toggle("soluk", gosterSatir !== null && !satirEtkin);
      for (const [anahtar, nokta] of sg.noktalar) {
        const kanalEtkin = !etkinKanal || etkinKanal === anahtar;
        nokta.classList.toggle("kanal-etkin", Boolean(etkinKanal && kanalEtkin));
        nokta.classList.toggle("kanal-soluk", Boolean(etkinKanal && !kanalEtkin));
        if ((satirEtkin && kanalEtkin) || (etkinKanal === anahtar && gosterSatir === null)) {
          nokta.setAttribute("filter", `url(#${parlaId})`);
        } else {
          nokta.removeAttribute("filter");
        }
      }
      sg.haEtiket.classList.toggle("kanal-soluk", Boolean(etkinKanal && etkinKanal !== "Ha"));
    });

    const k = veri.kosullar[gosterSatir ?? varsayilanIndeks];
    const parcalar = [{ metin: k.ad, sinif: "kg-bas" }];
    for (const c of CIZGILER) {
      const vurgulu = !etkinKanal || etkinKanal === c.anahtar;
      parcalar.push({
        etiket: c.kisa,
        deger: yuzde(k[c.anahtar]),
        renk: c.renk,
        sinif: vurgulu ? "kg-deger etkin" : "kg-deger soluk",
      });
    }
    hudSatirKur(hudMetin, parcalar);
  };

  CIZGILER.forEach((c, i) => {
    const x = sol + i * 146;
    const g = lejantEkle(
      s,
      x,
      20,
      c,
      (k) => {
        hoverKanal = k;
        guncelle();
      },
      (k) => {
        soloKanal = soloKanal === k ? null : k;
        ipucu.classList.add("sakin");
        guncelle();
      },
      i === 1 ? 142 : 124,
    );
    lejantlar.set(c.anahtar, g);
  });

  veri.kosullar.forEach((k, i) => {
    const y = ust + i * satir;

    const grupBasi = ["continuum-low", "nii-low", "sii-low", "combined-low-noise"].includes(k.id);
    if (grupBasi) {
      el("line", { x1: 8, x2: sag, y1: y - satir / 2, y2: y - satir / 2, stroke: RENK.isik4, "stroke-dasharray": "2 4" }, s);
    }

    const g = el("g", { class: "kg-satir", "data-kosul": k.id }, s);
    el("rect", { x: 4, y: y - satir / 2 + 1, width: genislik - 8, height: satir - 2, rx: 2, class: "kg-satir-zemin" }, g);
    el("text", {
      x: sol - 14,
      y: y + 4,
      "text-anchor": "end",
      class: k.id === "nii-high" || k.id.startsWith("combined") ? "vurgu" : "",
      metin: k.ad,
    }, g);

    const degerler = CIZGILER.map((c) => k[c.anahtar]);
    el("line", { x1: X(Math.min(...degerler)), x2: X(Math.max(...degerler)), y1: y, y2: y, stroke: RENK.isik4, "stroke-width": 2, class: "kg-bag" }, g);

    const noktalar = new Map();
    CIZGILER.forEach((c) => {
      const n = el("circle", { cx: X(k[c.anahtar]), cy: y, r: c.anahtar === "Ha" ? 6 : 4.5, fill: c.renk, class: "nokta" }, g);
      el("title", { metin: `${k.ad} · ${c.ad}: ${yuzde(k[c.anahtar])}` }, n);
      noktalar.set(c.anahtar, n);
    });

    const haEtiket = el("text", {
      x: X(k.Ha) + (k.Ha < 10 ? 11 : -11),
      y: y - 9,
      "text-anchor": k.Ha < 10 ? "start" : "end",
      fill: RENK.ha,
      class: "kucuk",
      metin: yuzde(k.Ha),
    }, g);

    const hit = el("rect", { x: 4, y: y - satir / 2, width: genislik - 8, height: satir, fill: "transparent", class: "kg-hit" }, g);
    hit.addEventListener("pointerenter", () => {
      aktifSatir = i;
      ipucu.classList.add("sakin");
      guncelle();
    });
    hit.addEventListener("click", () => {
      sabitSatir = sabitSatir === i ? null : i;
      aktifSatir = sabitSatir;
      ipucu.classList.add("sakin");
      guncelle();
    });

    satirGruplar.push({ g, noktalar, haEtiket });
  });

  s.addEventListener("pointerleave", () => {
    aktifSatir = null;
    hoverKanal = null;
    guncelle();
  });

  kok.addEventListener("keydown", (e) => {
    if (e.target !== kok) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const yon = e.key === "ArrowDown" ? 1 : -1;
      const mevcut = sabitSatir ?? varsayilanIndeks;
      sabitSatir = (mevcut + yon + veri.kosullar.length) % veri.kosullar.length;
      aktifSatir = sabitSatir;
      ipucu.classList.add("sakin");
      guncelle();
    } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const sira = [null, ...CIZGILER.map((c) => c.anahtar)];
      const idx = sira.indexOf(soloKanal);
      const yon = e.key === "ArrowRight" ? 1 : -1;
      soloKanal = sira[(idx + yon + sira.length) % sira.length];
      ipucu.classList.add("sakin");
      guncelle();
    } else if (e.key === "Escape") {
      sabitSatir = null;
      aktifSatir = null;
      soloKanal = null;
      guncelle();
    }
  });

  guncelle();
}

function nii(kok, veri) {
  const { kaydir, hudMetin, ipucu } = kabukKur(kok, "çizgiye dokun · karşılaştır");

  const genislik = 680;
  const yukseklik = 324;
  const s = svg(genislik, yukseklik, kaydir);
  const parlaId = parlamaFiltresiEkle(s);
  const sol = 136;
  const sag = 410;
  const ust = 54;
  const alt = 274;
  const Y = (v) => alt - (v / 7) * (alt - ust);

  for (let v = 0; v <= 7; v++) {
    el("line", { x1: sol - 30, x2: sag + 24, y1: Y(v), y2: Y(v), stroke: v ? RENK.cizgi : RENK.isik4 }, s);
    el("text", { x: sol - 40, y: Y(v) + 4, "text-anchor": "end", metin: v }, s);
  }
  el("text", { x: 18, y: 24, "text-anchor": "start", class: "zayif", metin: "RMSE · ×10⁻⁵ model birimi" }, s);
  el("text", { x: sol, y: alt + 28, "text-anchor": "middle", metin: "GraXpert öncesi" }, s);
  el("text", { x: sag, y: alt + 28, "text-anchor": "middle", metin: "sonrası" }, s);

  const hedefler = [
    { id: "Ha", v: veri.yuksekNII.Ha, renk: RENK.ha, ad: "Fiziksel Hα" },
    { id: "ha_equiv_line", v: veri.yuksekNII.ha_equiv_line, renk: RENK.toz, ad: "HaEq_line · tanısal" },
  ];

  let aktifHedef = null;
  let sabitHedef = null;
  const gruplar = [];

  const guncelle = () => {
    const secili = aktifHedef ?? sabitHedef;
    gruplar.forEach((gr, i) => {
      const etkin = secili === i;
      gr.g.classList.toggle("etkin", etkin);
      gr.g.classList.toggle("soluk", secili !== null && !etkin);
      if (etkin) gr.cizgi.setAttribute("filter", `url(#${parlaId})`);
      else gr.cizgi.removeAttribute("filter");
    });

    if (secili !== null) {
      const h = hedefler[secili];
      hudSatirKur(hudMetin, [
        { etiket: h.v.ad || h.ad, deger: "", renk: h.renk, sinif: "kg-deger etkin" },
        { metin: `önce ${sayi(h.v.once)} → sonra ${sayi(h.v.sonra)} ×10⁻⁵`, sinif: "kg-bas" },
        { etiket: "azalma", deger: `−${yuzde(h.v.azalma)}`, renk: h.renk, sinif: "kg-deger etkin" },
      ]);
    } else {
      const ha = veri.yuksekNII.Ha;
      const eq = veri.yuksekNII.ha_equiv_line;
      hudSatirKur(hudMetin, [
        { etiket: "Fiziksel Hα", deger: `${sayi(ha.once)} → ${sayi(ha.sonra)} (−${yuzde(ha.azalma)})`, renk: RENK.ha, sinif: "kg-deger etkin" },
        { etiket: "HaEq_line", deger: `${sayi(eq.once)} → ${sayi(eq.sonra)} (−${yuzde(eq.azalma)})`, renk: RENK.toz, sinif: "kg-deger etkin" },
      ]);
    }
  };

  hedefler.forEach((h, i) => {
    const g = el("g", { class: "kg-egim", "data-hedef": h.id }, s);

    el("line", { x1: sol - 12, x2: sag + 220, y1: Y(h.v.once), y2: Y(h.v.sonra), stroke: "transparent", "stroke-width": 36, class: "kg-hit" }, g);
    const cizgi = el("line", { x1: sol, x2: sag, y1: Y(h.v.once), y2: Y(h.v.sonra), stroke: h.renk, "stroke-width": 2.5, class: "kg-egim-cizgi" }, g);
    for (const [x, d] of [[sol, h.v.once], [sag, h.v.sonra]]) {
      const n = el("circle", { cx: x, cy: Y(d), r: 6, fill: h.renk, class: "nokta" }, g);
      el("title", { metin: `${h.ad}: ${d.toLocaleString("tr-TR")} ×10⁻⁵` }, n);
    }
    el("text", { x: sol - 12, y: Y(h.v.once) - 10, "text-anchor": "end", fill: h.renk, metin: h.v.once.toLocaleString("tr-TR") }, g);
    el("text", { x: sag + 18, y: Y(h.v.sonra) + 4, fill: h.renk, metin: `${h.v.sonra.toLocaleString("tr-TR")}  ·  ${h.ad}` }, g);
    el("text", { x: sag + 18, y: Y(h.v.sonra) + 26, fill: h.renk, class: "buyuk-sayi", metin: `−${yuzde(h.v.azalma)}` }, g);

    g.addEventListener("pointerenter", () => {
      aktifHedef = i;
      ipucu.classList.add("sakin");
      guncelle();
    });
    g.addEventListener("pointerleave", () => {
      aktifHedef = null;
      guncelle();
    });
    g.addEventListener("click", () => {
      sabitHedef = sabitHedef === i ? null : i;
      aktifHedef = sabitHedef;
      ipucu.classList.add("sakin");
      guncelle();
    });

    gruplar.push({ g, cizgi });
  });

  kok.addEventListener("keydown", (e) => {
    if (e.target !== kok) return;
    if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      sabitHedef = sabitHedef === null ? 0 : (sabitHedef + 1) % hedefler.length;
      aktifHedef = sabitHedef;
      ipucu.classList.add("sakin");
      guncelle();
    } else if (e.key === "Escape") {
      sabitHedef = null;
      aktifHedef = null;
      guncelle();
    }
  });

  guncelle();
}

function kalan(kok, veri) {
  const { kaydir, hudMetin, ipucu } = kabukKur(kok, "SNR gruplarında gezdir · kanala dokun");

  const genislik = 720;
  const yukseklik = 360;
  const s = svg(genislik, yukseklik, kaydir);
  const parlaId = parlamaFiltresiEkle(s);
  const panel = [
    { anahtar: "noise", ad: "Yalnız gürültü", x0: 54 },
    { anahtar: "combined", ad: "Birleşik kirletici", x0: 386 },
  ];
  const pg = 230;
  const ust = 62;
  const alt = 294;
  const lg = (v) => Math.log10(v);
  const Y = (v) => alt - ((lg(v) - lg(1)) / (lg(300) - lg(1))) * (alt - ust);
  const gruplar = veri.snrGruplari;

  let aktifSnr = gruplar.length - 1;
  let sabitSnr = gruplar.length - 1;
  let hoverKanal = null;
  let soloKanal = null;

  const lejantlar = new Map();
  const taramaKillari = [];
  const xEtiketleri = [];
  const kanalOgeleri = new Map(CIZGILER.map((c) => [c.anahtar, []]));
  const snrNoktalari = gruplar.map(() => []);

  const guncelle = () => {
    const gIdx = aktifSnr;
    const etkinKanal = hoverKanal ?? soloKanal;
    s.classList.toggle("kg-kanal-secili", Boolean(etkinKanal));

    for (const [anahtar, g] of lejantlar) {
      const secili = soloKanal === anahtar;
      const vurgulu = etkinKanal === anahtar;
      g.classList.toggle("etkin", vurgulu);
      g.classList.toggle("soluk", Boolean(etkinKanal && !vurgulu));
      g.setAttribute("aria-pressed", String(secili));
    }

    taramaKillari.forEach((tk) => {
      const x = tk.X(gIdx);
      tk.cizgi.setAttribute("x1", x.toFixed(1));
      tk.cizgi.setAttribute("x2", x.toFixed(1));
    });

    xEtiketleri.forEach((et) => {
      et.el.classList.toggle("kg-x-etkin", et.i === gIdx);
    });

    for (const c of CIZGILER) {
      const kanalEtkin = !etkinKanal || etkinKanal === c.anahtar;
      for (const oge of kanalOgeleri.get(c.anahtar)) {
        oge.classList.toggle("kanal-soluk", Boolean(etkinKanal && !kanalEtkin));
        oge.classList.toggle("kanal-etkin", Boolean(etkinKanal && kanalEtkin));
      }
    }

    snrNoktalari.forEach((liste, i) => {
      const aktif = i === gIdx;
      for (const n of liste) {
        n.el.classList.toggle("snr-etkin", aktif);
        const kanalEtkin = !etkinKanal || etkinKanal === n.kanal;
        if (aktif && kanalEtkin) n.el.setAttribute("filter", `url(#${parlaId})`);
        else n.el.removeAttribute("filter");
      }
    });

    hudMetin.textContent = "";
    const bas = document.createElement("div");
    bas.className = "kg-hud-satir";
    const gAd = gruplar[gIdx];
    const kanallar = etkinKanal ? CIZGILER.filter((c) => c.anahtar === etkinKanal) : CIZGILER;

    panel.forEach((p, pi) => {
      const satirEl = pi === 0 ? bas : document.createElement("div");
      satirEl.className = "kg-hud-satir";
      const parcalar = [{ metin: pi === 0 ? `SNR ${gAd} · ${p.ad}` : p.ad, sinif: "kg-bas" }];
      for (const c of kanallar) {
        const d = veri.kalanHata[p.anahtar][c.veriAnahtar];
        parcalar.push({
          etiket: c.kisa,
          deger: `${yuzde(d.once[gIdx], 2)} → ${yuzde(d.sonra[gIdx], 2)}`,
          renk: c.renk,
          sinif: "kg-deger etkin",
        });
      }
      hudSatirKur(satirEl, parcalar);
      hudMetin.appendChild(satirEl);
    });
  };

  const lejantX = [54, 194, 360];
  CIZGILER.forEach((c, i) => {
    const g = lejantEkle(
      s,
      lejantX[i],
      20,
      c,
      (k) => {
        hoverKanal = k;
        guncelle();
      },
      (k) => {
        soloKanal = soloKanal === k ? null : k;
        ipucu.classList.add("sakin");
        guncelle();
      },
      i === 1 ? 148 : 118,
    );
    lejantlar.set(c.anahtar, g);
  });

  el("line", { x1: 484, x2: 508, y1: 18, y2: 18, stroke: RENK.isik2, "stroke-dasharray": "3 3", "stroke-width": 1.5 }, s);
  el("text", { x: 514, y: 22, metin: "önce" }, s);
  el("line", { x1: 576, x2: 600, y1: 18, y2: 18, stroke: RENK.isik2, "stroke-width": 2 }, s);
  el("text", { x: 606, y: 22, metin: "sonra" }, s);

  for (const p of panel) {
    const X = (i) => p.x0 + (i / (gruplar.length - 1)) * pg;
    el("text", { x: p.x0, y: ust - 16, class: "baslik", metin: p.ad }, s);
    for (const v of [1, 3, 10, 30, 100, 300]) {
      el("line", { x1: p.x0, x2: p.x0 + pg, y1: Y(v), y2: Y(v), stroke: RENK.cizgi }, s);
      if (p.x0 === panel[0].x0) el("text", { x: p.x0 - 10, y: Y(v) + 4, "text-anchor": "end", metin: `%${v}` }, s);
    }

    const kil = el("line", { x1: X(aktifSnr), x2: X(aktifSnr), y1: ust - 4, y2: alt + 4, class: "kg-kil" }, s);
    taramaKillari.push({ cizgi: kil, X });

    gruplar.forEach((g, i) => {
      const tx = el("text", { x: X(i), y: alt + 20, "text-anchor": "middle", metin: g }, s);
      xEtiketleri.push({ el: tx, i });
    });
    el("text", { x: p.x0 + pg / 2, y: alt + 42, "text-anchor": "middle", class: "zayif", metin: "başlangıç SNR grubu" }, s);

    for (const c of CIZGILER) {
      const d = veri.kalanHata[p.anahtar][c.veriAnahtar];
      const yol = (dizi) => dizi.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join("");
      const pOnce = el("path", { d: yol(d.once), fill: "none", stroke: c.renk, "stroke-width": 1.5, "stroke-dasharray": "3 3", opacity: 0.65, class: "kg-yol-once" }, s);
      const pSonra = el("path", { d: yol(d.sonra), fill: "none", stroke: c.renk, "stroke-width": c.anahtar === "Ha" ? 2.6 : 1.8, class: "kg-yol-sonra" }, s);
      kanalOgeleri.get(c.anahtar).push(pOnce, pSonra);

      d.once.forEach((v, i) => {
        const no = el("circle", { cx: X(i), cy: Y(v), r: 2.6, fill: "var(--gok-0)", stroke: c.renk, "stroke-width": 1.3, class: "kg-nokta-once" }, s);
        kanalOgeleri.get(c.anahtar).push(no);
        snrNoktalari[i].push({ el: no, kanal: c.anahtar });
      });

      d.sonra.forEach((v, i) => {
        const n = el("circle", { cx: X(i), cy: Y(v), r: 3.4, fill: c.renk, class: "nokta" }, s);
        el("title", { metin: `${p.ad} · ${c.ad} · SNR ${gruplar[i]}: önce ${yuzde(d.once[i], 2)}, sonra ${yuzde(d.sonra[i], 2)}` }, n);
        kanalOgeleri.get(c.anahtar).push(n);
        snrNoktalari[i].push({ el: n, kanal: c.anahtar });
      });
    }

    const son = veri.kalanHata[p.anahtar].Ha.sonra.at(-1);
    const sonEtiket = el("text", { x: X(4) + 10, y: Y(son) + 6, fill: RENK.ha, class: "buyuk-sayi", metin: yuzde(son, 2) }, s);
    kanalOgeleri.get("Ha").push(sonEtiket);

    const adim = pg / (gruplar.length - 1);
    gruplar.forEach((_, i) => {
      const sx = i === 0 ? p.x0 - 14 : X(i) - adim / 2;
      const sg = i === 0 || i === gruplar.length - 1 ? adim / 2 + 14 : adim;
      const alan = el("rect", { x: sx, y: ust - 6, width: sg, height: alt - ust + 26, fill: "transparent", class: "kg-snr-alan" }, s);
      alan.addEventListener("pointerenter", () => {
        aktifSnr = i;
        ipucu.classList.add("sakin");
        guncelle();
      });
      alan.addEventListener("click", () => {
        sabitSnr = i;
        aktifSnr = i;
        ipucu.classList.add("sakin");
        guncelle();
      });
    });
  }

  s.addEventListener("pointerleave", () => {
    aktifSnr = sabitSnr;
    hoverKanal = null;
    guncelle();
  });

  kok.addEventListener("keydown", (e) => {
    if (e.target !== kok) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const yon = e.key === "ArrowRight" ? 1 : -1;
      sabitSnr = (sabitSnr + yon + gruplar.length) % gruplar.length;
      aktifSnr = sabitSnr;
      ipucu.classList.add("sakin");
      guncelle();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const sira = [null, ...CIZGILER.map((c) => c.anahtar)];
      const idx = sira.indexOf(soloKanal);
      const yon = e.key === "ArrowDown" ? 1 : -1;
      soloKanal = sira[(idx + yon + sira.length) % sira.length];
      ipucu.classList.add("sakin");
      guncelle();
    } else if (e.key === "Escape") {
      sabitSnr = gruplar.length - 1;
      aktifSnr = sabitSnr;
      soloKanal = null;
      guncelle();
    }
  });

  guncelle();
}

const TURLER = { kosullar, nii, kalan };

class KanitGrafik extends HTMLElement {
  async connectedCallback() {
    if (this._kuruldu) return;
    this._kuruldu = true;
    const tur = TURLER[this.getAttribute("tur")];
    if (!tur) return;
    this.classList.add("grafik");

    if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
    try {
      const veri = await veriGetir(this.getAttribute("veri"));
      tur(this, veri);
    } catch {
      this.textContent = "Grafik verisi yüklenemedi. Sayfayı bir yerel sunucu üzerinden aç.";
    }
  }

  aisDarbe(_x, _y, nx = 0, ny = 0) {
    if (azHareket()) return;
    const kap = this.closest(".kanit") || this;
    kap.style.setProperty("--darbe-x", `${(-nx * 4).toFixed(1)}px`);
    kap.style.setProperty("--darbe-y", `${(-ny * 3).toFixed(1)}px`);
    kap.classList.remove("kanit-darbe");
    void kap.offsetWidth;
    kap.classList.add("kanit-darbe");
    clearTimeout(this._darbeZaman);
    this._darbeZaman = setTimeout(() => kap.classList.remove("kanit-darbe"), 380);
  }
}

customElements.define("kanit-grafik", KanitGrafik);
