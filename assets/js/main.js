import "./components/ais-maskot.js";
import { azHareket } from "./lib/rastgele.js";

document.documentElement.classList.add("js");

const TEMBEL = {
  "istif-tuvali": () => import("./components/istif-tuvali.js"),
  "germe-foto": () => import("./components/germe-foto.js"),
  "sahne-cizim": () => import("./components/sahne-cizim.js"),
  "kanit-grafik": () => import("./components/kanit-grafik.js"),
  "kale-gecesi": () => import("./components/kale-gecesi.js"),
  "kanal-ayrimi": () => import("./components/kanal-ayrimi.js"),
  "maskot-evrim": () => import("./components/maskot-evrim.js"),
  "limon-maskot": () => import("./components/limon-maskot.js"),
};
for (const [etiket, yukle] of Object.entries(TEMBEL)) {
  if (document.querySelector(etiket)) yukle();
}

document.querySelectorAll(".giris [data-belir], .kapak [data-belir], .gozlem-kapak [data-belir]").forEach((e) => {
  requestAnimationFrame(() => e.classList.add("gorundu"));
});
const belirler = document.querySelectorAll("[data-belir]:not(.gorundu)");
if (belirler.length && !azHareket()) {
  const gozcu = new IntersectionObserver(
    (girdiler) => {
      for (const g of girdiler) {
        if (g.isIntersecting) {
          g.target.classList.add("gorundu");
          gozcu.unobserve(g.target);
        }
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
  );
  belirler.forEach((b) => gozcu.observe(b));
} else {
  belirler.forEach((b) => b.classList.add("gorundu"));
}

if (document.querySelector("[data-sure]")) {
  const KARE_SN = 4;
  const basla = performance.now();
  let gizliSure = 0;
  let gizlendi = 0;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) gizlendi = performance.now();
    else if (gizlendi) gizliSure += performance.now() - gizlendi;
  });
  const iki = (n) => String(n).padStart(2, "0");
  const guncelle = () => {
    if (document.hidden) return;
    const sn = Math.floor((performance.now() - basla - gizliSure) / 1000);
    const sure = `${iki(Math.floor(sn / 3600))}:${iki(Math.floor(sn / 60) % 60)}:${iki(sn % 60)}`;
    document.querySelectorAll("[data-sure]").forEach((e) => (e.textContent = sure));
    document.querySelectorAll("[data-kare]").forEach((e) => (e.textContent = Math.floor(sn / KARE_SN)));
  };
  guncelle();
  setInterval(guncelle, 1000);
}

const raylar = document.querySelectorAll("[data-ray] a[href^='#']");
if (raylar.length) {
  const hedefler = [...raylar].map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  const gozcu = new IntersectionObserver(
    (girdiler) => {
      for (const g of girdiler) {
        if (!g.isIntersecting) continue;
        raylar.forEach((a) => a.toggleAttribute("aria-current", a.getAttribute("href") === `#${g.target.id}`));
        const no = document.querySelector("[data-bolum-no]");
        if (no && g.target.dataset.no) no.textContent = g.target.dataset.no;
      }
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  hedefler.forEach((h) => gozcu.observe(h));
}

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
  istif.addEventListener("istif", (e) => {
    kare.textContent = String(e.detail.kare).padStart(3, "0");
    snr.textContent = e.detail.snr.toFixed(1);
  });
  document.querySelector("[data-yeniden]")?.addEventListener("click", () => istif.basla());
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
      return { ust, alt };
    });

    if (max - liste.at(-1).alt > PAY) liste.push({ ust: max, alt: max });
    return liste;
  };

  let animasyon = null;
  let kilit = false;
  let sonOlay = 0;
  let sonYon = 0;
  let sonDelta = 0;

  const kaydir = (hedef) => {
    cancelAnimationFrame(animasyon);
    if (azHareket()) {
      scrollTo({ top: hedef, behavior: "instant" });
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
      animasyon = k < 1 ? requestAnimationFrame(adim) : null;
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
    const y = scrollY;
    const uzun = (s) => s.alt - s.ust > PAY;

    for (const s of d) {
      if (!uzun(s)) continue;
      if (y > s.ust + PAY && y < s.alt - PAY) return "yerel";
      if (yon > 0 && Math.abs(y - s.ust) <= PAY) return "yerel";
      if (yon < 0 && Math.abs(y - s.alt) <= PAY) return "yerel";
    }
    let hedef;
    if (yon > 0) {
      hedef = d.find((s) => s.ust > y + PAY)?.ust;
    } else {
      const onceki = [...d].reverse().find((s) => s.ust < y - PAY);

      if (onceki) hedef = uzun(onceki) && onceki.alt < y - PAY ? onceki.alt : onceki.ust;
    }
    if (hedef === undefined) return "dur";
    kilit = true;
    sonYon = yon;
    kaydir(hedef);
    return "gec";
  };

  let birikim = 0;
  let birikimSifir;
  addEventListener(
    "wheel",
    (e) => {
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
      }
    },
    { passive: false },
  );

  addEventListener("keydown", (e) => {
    const hedef = e.target instanceof Element ? e.target : document.body;
    if (e.altKey || e.ctrlKey || e.metaKey || hedef.closest("input, textarea, select, [contenteditable]")) return;
    const ileri = ["ArrowDown", "PageDown"].includes(e.key) || (e.key === " " && !e.shiftKey && !hedef.closest("button, summary, a"));
    const geri = ["ArrowUp", "PageUp"].includes(e.key) || (e.key === " " && e.shiftKey);
    if (!ileri && !geri) return;
    if (kilit) {
      e.preventDefault();
      return;
    }
    const sonuc = git(ileri ? 1 : -1);
    if (sonuc === "yerel") return;
    e.preventDefault();
    if (sonuc === "gec") kilidiDene(false);
  });
}
