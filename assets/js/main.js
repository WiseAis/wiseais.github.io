import "./components/ais-maskot.js?v=20261126a";
import { azHareket } from "./lib/rastgele.js?v=20261126a";
import { oturum, oturumGuncelle, konsolSelami } from "./lib/oturum.js?v=20261126a";
import { karanlikKareKur } from "./components/karanlik-kare.js?v=20261126a";

document.documentElement.classList.add("js");

const TEMBEL = {
  "gok-atmosfer": () => import("./components/gok-atmosfer.js?v=20261126a"),
  "istif-tuvali": () => import("./components/istif-tuvali.js?v=20261126a"),
  "germe-foto": () => import("./components/germe-foto.js?v=20261126a"),
  "sahne-cizim": () => import("./components/sahne-cizim.js?v=20261126a"),
  "kanit-grafik": () => import("./components/kanit-grafik.js?v=20261126a"),
  "kanal-ayrimi": () => import("./components/kanal-ayrimi.js?v=20261126a"),
  "krallik-sahne": () => import("./components/krallik-sahne.js?v=20261126a"),
  "gozlem-masa": () => import("./components/gozlem-masa.js?v=20261126a"),
  "maskot-evrim": () => import("./components/maskot-evrim.js?v=20261126a"),
};
for (const [etiket, yukle] of Object.entries(TEMBEL)) {
  if (document.querySelector(etiket)) yukle();
}

let aisApi = null;
const yolcu = document.querySelector("[data-yol-arkadasi]");
if (yolcu) {
  import("./components/yol-arkadasi.js?v=20261126a").then((m) => {
    aisApi = m.yolArkadasi(yolcu);
  });
}

const kk = document.querySelector("footer.alt") ? karanlikKareKur() : null;

konsolSelami({
  kalibreEt: () => kk?.kalibreEt(),
  karanlikKare: () => (kk ? (kk.acikMi() ? kk.kapa() : kk.ac()) : undefined),
  evrim: (n) => aisApi?.evrimle(n),
  durum: () => ({ ...oturum }),
});

let belirGozcu = null;
const ekraniBelirle = (kapsayici) => {
  if (!kapsayici) return;
  kapsayici.querySelectorAll("[data-belir]:not(.gorundu)").forEach((el) => {
    el.classList.add("gorundu");
    belirGozcu?.unobserve(el);
  });
};

document.querySelectorAll(".giris [data-belir], .kapak [data-belir], .gozlem-kapak [data-belir]").forEach((e) => {
  requestAnimationFrame(() => e.classList.add("gorundu"));
});
const belirler = document.querySelectorAll("[data-belir]:not(.gorundu)");
if (belirler.length && !azHareket()) {
  belirGozcu = new IntersectionObserver(
    (girdiler) => {
      for (const g of girdiler) {
        if (g.isIntersecting) {
          g.target.classList.add("gorundu");
          belirGozcu.unobserve(g.target);
        }
      }
    },
    { rootMargin: "0px 0px -2% 0px", threshold: 0.03 },
  );
  belirler.forEach((b) => belirGozcu.observe(b));
} else {
  belirler.forEach((b) => b.classList.add("gorundu"));
}

const hashBelirle = () => {
  const id = location.hash.slice(1);
  if (!id) return;
  const hedef = document.getElementById(id);
  if (hedef) ekraniBelirle(hedef);
};
hashBelirle();
addEventListener("hashchange", hashBelirle);

if (document.querySelector("[data-sure]")) {
  const KARE_SN = 4;
  const KARE_MS = KARE_SN * 1000;
  const basla = performance.now();
  let gizliSure = 0;
  let gizlendi = 0;
  let sonSn = -1;
  let sonKare = 0;
  let nabizZaman = 0;

  const entDugme = document.querySelector("[data-entegrasyon]");
  const entSerit = entDugme?.querySelector(".ent-serit > i");
  const entFis = document.querySelector("[data-ent-fis]");
  const entFisBas = document.querySelector("[data-ent-fis-bas]");
  const entFisDurum = document.querySelector("[data-ent-fis-durum]");
  const sureOgeleri = [...document.querySelectorAll("[data-sure]")];
  const kareOgeleri = [...document.querySelectorAll("[data-kare]")];

  const durumMetni = (kare) => {
    if (kare <= 4) return "Henüz tek kare sayılırsın. Gürültü yüksek.";
    if (kare <= 14) return "Yıldızlar ayrışmaya başladı. Kalabilirsin.";
    if (kare <= 39) return "İyi pozlama. Takipsiz tripodla bu kadar durmak zor.";
    return "40 kare oldu. Teknik olarak Aisen fazındasın.";
  };

  const fisiGuncelle = (kare) => {
    if (!entFisBas || !entFisDurum) return;
    const snr = Math.sqrt(Math.max(1, kare)).toFixed(1);
    entFisBas.textContent = `OTURUM · ${kare} KARE · √N = ${snr}`;
    entFisDurum.textContent = durumMetni(kare);
  };

  const fisKapat = () => {
    if (!entFis || entFis.hidden) return;
    entFis.hidden = true;
    entDugme?.setAttribute("aria-expanded", "false");
  };

  if (entDugme && entFis) {
    entDugme.addEventListener("click", (e) => {
      e.stopPropagation();
      const acilacak = entFis.hidden;
      entFis.hidden = !acilacak;
      entDugme.setAttribute("aria-expanded", String(acilacak));
      if (acilacak) fisiGuncelle(sonKare);
    });

    document.addEventListener("click", (e) => {
      if (entFis.hidden) return;
      const t = e.target;
      if (t instanceof Node && (entFis.contains(t) || entDugme.contains(t))) return;
      fisKapat();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !entFis.hidden) {
        fisKapat();
        entDugme.focus?.();
      }
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) gizlendi = performance.now();
    else if (gizlendi) {
      gizliSure += performance.now() - gizlendi;
      gizlendi = 0;
    }
  });

  const iki = (n) => String(n).padStart(2, "0");
  const guncelle = () => {
    if (document.hidden) return;
    const ms = Math.max(0, performance.now() - basla - gizliSure);
    if (entSerit) {
      const oran = azHareket() ? ((Math.floor(ms / 1000) % KARE_SN) + 1) / KARE_SN : (ms % KARE_MS) / KARE_MS;
      entSerit.style.setProperty("--ent-dolum", oran.toFixed(3));
    }

    const sn = Math.floor(ms / 1000);
    if (sn === sonSn) return;
    sonSn = sn;

    const sure = `${iki(Math.floor(sn / 3600))}:${iki(Math.floor(sn / 60) % 60)}:${iki(sn % 60)}`;
    const kare = Math.floor(sn / KARE_SN);
    for (const e of sureOgeleri) e.textContent = sure;
    for (const e of kareOgeleri) e.textContent = String(kare);

    if (kare > sonKare && entDugme) {
      entDugme.classList.add("ent-nabiz");
      clearTimeout(nabizZaman);
      nabizZaman = setTimeout(() => entDugme.classList.remove("ent-nabiz"), 250);
    }
    sonKare = kare;
    fisiGuncelle(kare);
    oturumGuncelle({ sure, kare });
  };

  guncelle();
  setInterval(guncelle, 100);
}

const ekranlar = [...document.querySelectorAll("main > .ekran")];
const raylar = document.querySelectorAll("[data-ray] a[href^='#']");
const altBilgi = document.querySelector("footer.alt");
let sonEkranId = ekranlar[0]?.id || "giris";
let footerEtkin = false;

if (ekranlar.length) {
  document.body.dataset.ekran = sonEkranId;
  const ekranGozcu = new IntersectionObserver(
    (girdiler) => {
      for (const g of girdiler) {
        if (!g.isIntersecting) continue;
        sonEkranId = g.target.id;
        ekraniBelirle(g.target);
        if (!footerEtkin) document.body.dataset.ekran = sonEkranId;
        raylar.forEach((a) => a.toggleAttribute("aria-current", a.getAttribute("href") === `#${g.target.id}`));
        const no = document.querySelector("[data-bolum-no]");
        if (no && g.target.dataset.no) no.textContent = g.target.dataset.no;
      }
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  ekranlar.forEach((h) => ekranGozcu.observe(h));
}

if (altBilgi) {
  const footerDurumGuncelle = (etkin) => {
    if (footerEtkin === etkin) return;
    footerEtkin = etkin;
    document.body.classList.toggle("footer-etkin", etkin);
    document.body.dataset.ekran = etkin ? "alt" : sonEkranId;
  };

  const footerGozcu = new IntersectionObserver(
    (girdiler) => {
      const g = girdiler[0];
      if (!g) return;
      footerDurumGuncelle(g.isIntersecting && g.intersectionRatio >= 0.25);
    },
    { threshold: [0, 0.12, 0.25, 0.5] },
  );
  footerGozcu.observe(altBilgi);
}

const cetvelCentikler = [...document.querySelectorAll(".emisyon-cetvel [data-cetvel]")];
if (cetvelCentikler.length) {

  let aktifCetvelVurgu = null;
  const kanalBileseni = () => document.querySelector("kanal-ayrimi");

  for (const c of cetvelCentikler) {
    const id = c.dataset.cetvel;
    c.setAttribute("role", "button");
    c.setAttribute("tabindex", "0");
    c.setAttribute("aria-pressed", "false");

    const sec = () => {
      const ka = kanalBileseni();
      if (!ka?.kanalSec) return;
      const secili = c.getAttribute("aria-pressed") === "true";
      ka.kanalSec(secili ? null : id);
    };

    const vurgula = () => {
      aktifCetvelVurgu = id;
      kanalBileseni()?.kanalVurgula?.(id);
    };

    const vurguBirak = () => {
      if (aktifCetvelVurgu !== id) return;
      aktifCetvelVurgu = null;
      kanalBileseni()?.kanalVurgula?.(null);
    };

    c.addEventListener("click", sec);
    c.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        sec();
      }
    });
    c.addEventListener("pointerenter", vurgula);
    c.addEventListener("pointerleave", vurguBirak);
    c.addEventListener("focus", vurgula);
    c.addEventListener("blur", vurguBirak);
  }

  document.addEventListener("kanal-degis", (e) => {
    const aktif = e.detail?.aktif || null;

    const soloKanal = e.detail?.soloKanal !== undefined ? e.detail.soloKanal : (e.detail?.solo ? aktif : null);
    for (const c of cetvelCentikler) {
      const id = c.dataset.cetvel;
      const secili = soloKanal === id;
      c.classList.toggle("etkin", aktif === id);
      c.classList.toggle("secili", secili);
      c.classList.toggle("soluk", Boolean(aktif && aktif !== id));
      c.setAttribute("aria-pressed", String(secili));
    }
  });
}

const donguAdimlar = [...document.querySelectorAll(".krallik-dongu [data-dongu]")];
if (donguAdimlar.length) {
  document.addEventListener("krallik-mevsim", (e) => {
    const mevsim = e.detail?.mevsim;
    for (const d of donguAdimlar) {
      const etkin = d.dataset.dongu === mevsim;
      d.classList.toggle("etkin", etkin);
      d.setAttribute("aria-pressed", String(etkin));
    }
  });

  for (const d of donguAdimlar) {
    d.addEventListener("click", () => {
      const i = Number(d.dataset.sahneIndeks);
      if (!Number.isNaN(i)) document.querySelector("krallik-sahne")?.git?.(i, true);
    });
  }
}

document.addEventListener("starlink-gecis", (e) => {
  const tip = e.detail?.tip;
  if (tip === "atildi") {
    oturumGuncelle({
      starlinkGoruldu: oturum.starlinkGoruldu + 1,
      starlinkAtildi: oturum.starlinkAtildi + 1,
    });
  } else if (tip === "gecti") {
    oturumGuncelle({
      starlinkGoruldu: oturum.starlinkGoruldu + 1,
    });
  }
});

const ilerleme = document.querySelector("[data-ilerleme]");
if (ilerleme) {
  const guncelle = () => {
    const h = document.documentElement;
    const oran = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
    ilerleme.style.setProperty("--oran", oran.toFixed(4));
  };
  addEventListener("scroll", guncelle, { passive: true });
  guncelle();
}

const istif = document.querySelector("[data-istif]");
if (istif) {
  const kare = document.querySelector("[data-istif-kare]");
  const snr = document.querySelector("[data-istif-snr]");
  const clipNot = document.querySelector("[data-istif-clip]");
  const uyari = document.querySelector("[data-istif-uyari]");
  const uyariMetin = document.querySelector("[data-istif-uyari-metin]");
  const atBtn = document.querySelector("[data-istif-at]");
  let clipGizle = null;
  let uyariGizle = null;

  const bildirimGizle = (el, zamanlayici, temizle) => {
    if (!el) return null;
    clearTimeout(zamanlayici);
    el.classList.remove("gorunur");
    if (azHareket()) {
      temizle?.();
      el.hidden = true;
      return null;
    }
    return setTimeout(() => {
      temizle?.();
      el.hidden = true;
    }, 240);
  };

  istif.addEventListener("istif", (e) => {
    if (kare) kare.textContent = String(e.detail.kare).padStart(3, "0");
    if (snr) snr.textContent = e.detail.snr.toFixed(1);
  });

  istif.addEventListener("istif-uydu", (e) => {
    if (!clipNot) return;
    if (e.detail?.aktif) {
      clearTimeout(clipGizle);
      clipGizle = null;
      clipNot.hidden = false;
      requestAnimationFrame(() => clipNot.classList.add("gorunur"));
    } else {
      clipGizle = bildirimGizle(clipNot, clipGizle);
    }
  });

  istif.addEventListener("starlink-uyari", (e) => {
    if (!uyari || !uyariMetin || !atBtn) return;
    const durum = e.detail?.durum;
    if (durum === "aktif") {
      clearTimeout(uyariGizle);
      uyariGizle = null;
      uyari.classList.remove("reddedildi");
      uyariMetin.textContent = "1 kare kirli ·";
      atBtn.hidden = false;
      uyari.hidden = false;
      requestAnimationFrame(() => uyari.classList.add("gorunur"));
    } else if (durum === "reddedildi") {
      clearTimeout(uyariGizle);
      uyariGizle = null;
      atBtn.hidden = true;
      uyariMetin.textContent = "REJECTED: 1";
      uyari.classList.add("reddedildi", "gorunur");
      uyari.hidden = false;
    } else {
      uyariGizle = bildirimGizle(uyari, uyariGizle, () => uyari.classList.remove("reddedildi"));
    }
  });

  atBtn?.addEventListener("click", () => istif.uyduyuAt?.());

  document.querySelector("[data-yeniden]")?.addEventListener("click", () => {
    clipGizle = bildirimGizle(clipNot, clipGizle);
    uyariGizle = bildirimGizle(uyari, uyariGizle, () => uyari?.classList.remove("reddedildi"));
    istif.basla();
    const yeniSayi = oturum.yenidenPozla + 1;
    oturumGuncelle({ yenidenPozla: yeniSayi });
    if (yeniSayi === 3) {
      aisApi?.konus("Bırak istiflensin. Her seferinde baştan başlıyoruz.", 4500);
    } else if (yeniSayi === 5) {
      aisApi?.konus("Sabır bir optik malzeme değil ama yine de lazım.", 4500);
    }
  });
}

if (document.documentElement.classList.contains("kilitli") && matchMedia("(hover: hover) and (pointer: fine)").matches) {
  document.documentElement.classList.add("js-kaydirma");
  const PAY = 6;
  const SESSIZLIK = 320;

  const duraklar = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const liste = [...document.querySelectorAll("main > .ekran")].map((e) => {
      const ust = Math.min(e.offsetTop, max);
      const alt = Math.min(Math.max(ust, e.offsetTop + e.offsetHeight - innerHeight), max);
      return { ust, alt, el: e };
    });
    if (liste.length && max - liste.at(-1).alt > PAY) liste.push({ ust: max, alt: max, el: altBilgi });
    return liste;
  };

  let animasyon = null;
  let kilit = false;
  let sonOlay = 0;
  let sonYon = 0;
  let sonDelta = 0;

  const kaydir = (hedef, hedefEl = null) => {
    cancelAnimationFrame(animasyon);
    if (azHareket()) {
      scrollTo({ top: hedef, behavior: "instant" });
      ekraniBelirle(hedefEl);
      return;
    }
    const bas = scrollY;
    const fark = hedef - bas;
    const sure = Math.min(1100, 700 + Math.abs(fark) * 0.15);
    const t0 = performance.now();
    const adim = (t) => {
      const k = Math.min(1, (t - t0) / sure);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      scrollTo({ top: bas + fark * e, behavior: "instant" });
      if (k < 1) {
        animasyon = requestAnimationFrame(adim);
      } else {
        animasyon = null;
        ekraniBelirle(hedefEl);
      }
    };
    animasyon = requestAnimationFrame(adim);
  };

  const kilidiDene = (tekerlekBekle) => {
    if (animasyon) return setTimeout(() => kilidiDene(tekerlekBekle), 60);
    const kalan = tekerlekBekle ? SESSIZLIK - (performance.now() - sonOlay) : 0;
    if (kalan > 0) return setTimeout(() => kilidiDene(tekerlekBekle), kalan);
    kilit = false;
  };

  const git = (yon) => {
    const d = duraklar();
    if (!d.length) return "dur";
    const y = scrollY;
    const uzun = (s) => s.alt - s.ust > PAY;
    for (const s of d) {
      if (!uzun(s)) continue;
      if (y > s.ust + PAY && y < s.alt - PAY) return "yerel";
      if (yon > 0 && Math.abs(y - s.ust) <= PAY) return "yerel";
      if (yon < 0 && Math.abs(y - s.alt) <= PAY) return "yerel";
    }
    let hedef;
    let hedefEl = null;
    if (yon > 0) {
      const sonraki = d.find((s) => s.ust > y + PAY);
      if (sonraki) {
        hedef = sonraki.ust;
        hedefEl = sonraki.el;
      }
    } else {
      const onceki = [...d].reverse().find((s) => s.ust < y - PAY);
      if (onceki) {
        hedef = uzun(onceki) && onceki.alt < y - PAY ? onceki.alt : onceki.ust;
        hedefEl = onceki.el;
      }
    }
    if (hedef === undefined) return "dur";
    kilit = true;
    sonYon = yon;
    ekraniBelirle(hedefEl);
    kaydir(hedef, hedefEl);
    return "gec";
  };

  let birikim = 0;
  let birikimSifir;
  addEventListener(
    "wheel",
    (e) => {
      if (kk?.acikMi()) return;
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.target instanceof Element && e.target.closest("input, textarea, select")) return;
      sonOlay = performance.now();
      const yon = Math.sign(e.deltaY);
      const buyukluk = Math.abs(e.deltaY);
      const buyuyor = buyukluk > sonDelta * 1.6 && buyukluk > 8;
      sonDelta = buyukluk;
      if (kilit) {
        if (!animasyon && yon && (yon !== sonYon || buyuyor)) {
          kilit = false;
          birikim = 0;
        } else {
          e.preventDefault();
          return;
        }
      }
      if (!yon) return;
      birikim += e.deltaY;
      clearTimeout(birikimSifir);
      birikimSifir = setTimeout(() => (birikim = 0), 200);
      const sonuc = Math.abs(birikim) < 30 ? null : git(yon);
      if (sonuc === "yerel") return;
      e.preventDefault();
      if (sonuc) {
        birikim = 0;
        if (sonuc === "gec") kilidiDene(true);
        else if (sonuc === "dur" && yon > 0) kk?.zorla();
      }
    },
    { passive: false },
  );

  addEventListener("keydown", (e) => {
    if (kk?.acikMi()) return;
    const hedef = e.target instanceof Element ? e.target : document.body;
    if (e.altKey || e.ctrlKey || e.metaKey || hedef.closest("input, textarea, select, [contenteditable]")) return;
    const ileri = ["ArrowDown", "PageDown"].includes(e.key) || (e.key === " " && !e.shiftKey && !hedef.closest("button, summary, a"));
    const geri = ["ArrowUp", "PageUp"].includes(e.key) || (e.key === " " && e.shiftKey);
    if (!ileri && !geri) return;
    if (kilit) {
      e.preventDefault();
      return;
    }
    const yon = ileri ? 1 : -1;
    const sonuc = git(yon);
    if (sonuc === "yerel") return;
    e.preventDefault();
    if (sonuc === "gec") kilidiDene(false);
    else if (sonuc === "dur" && yon > 0) kk?.zorla();
  });
}
