import { azHareket } from "../lib/rastgele.js?v=20261121g";

const UYKU_MS = 28000;
const UCUS_MS = 1250;
const IZ_ARALIK = 34;
const IZ_RENK = ["var(--toz)", "var(--isik)", "var(--isik)", "var(--ha)"];
const SURTUNME = 0.0024;
const SEKME = 0.55;
const SURUKLE_ESIK = 6;
const ATIS_SOZLERI = [
  "Uçuyorum! Pek isteyerek değil.",
  "Güzel atış. Ben beğenmedim.",
  "Bir daha yaparsan fenere kapanırım.",
  "Yıldızlar böyle mi düşüyordu? Şimdi anladım.",
];

export function yolArkadasi(ais) {
  const ekranlar = [...document.querySelectorAll("main > .ekran[data-ais-hedef]")];
  if (!ais || !ekranlar.length) return;

  const boyut = () => ais.offsetWidth || 84;
  const dar = () => matchMedia("(max-width: 760px)").matches;
  const soylendi = new Set();
  let simdiki = null;
  let konum = { x: 0, y: 0 };
  let egim = 0;
  let ucus = null;
  let fizik = null;
  let evde = false;

  const yerlestir = (p, r = egim) => {
    konum = p;
    egim = r;
    ais.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
    ais.style.setProperty("--egim", r.toFixed(1));
  };

  const sinirla = (p) => {
    const b = boyut();
    return {
      x: Math.max(12, Math.min(innerWidth - b - 12, p.x)),
      y: Math.max(64, Math.min(innerHeight - b - 12, p.y)),
    };
  };

  const tunek = (ekran) => {
    const b = boyut();
    if (dar()) return { x: innerWidth - b - 16, y: innerHeight - b - 20 };
    const hedef = ekran.matches(ekran.dataset.aisHedef) ? ekran : ekran.querySelector(ekran.dataset.aisHedef);
    const e = ekran.getBoundingClientRect();
    const h = (hedef || ekran).getBoundingClientRect();
    const [fx, fy, dx = 0, dy = 0] = (ekran.dataset.aisKonum || "1 1 -48 -48").split(" ").map(Number);
    return sinirla({ x: h.left + fx * h.width - b / 2 + dx, y: h.top - e.top + fy * h.height - b / 2 + dy });
  };

  const iz = () => {
    const k = ais.getBoundingClientRect();
    const n = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.className = "ais-iz";
      const kenar = Math.random() < 0.7 ? 3 : 5;
      p.style.cssText = `left:${k.left + k.width / 2 + (Math.random() - 0.5) * k.width * 0.5}px;top:${k.top + k.height / 2 + (Math.random() - 0.5) * k.height * 0.5}px;width:${kenar}px;height:${kenar}px;background:${IZ_RENK[Math.floor(Math.random() * IZ_RENK.length)]};--dy:${8 + Math.random() * 18}px`;
      p.addEventListener("animationend", () => p.remove());
      document.body.append(p);
    }
  };

  const ucur = (hedef, bitince) => {
    ucus?.cancel();
    durdur();

    ais.classList.remove("tasindi", "konusuyor");
    const bas = { ...konum };
    const yukari = Math.min(140, 40 + Math.hypot(hedef.x - bas.x, hedef.y - bas.y) * 0.18);
    const orta = { x: (bas.x + hedef.x) / 2, y: Math.min(bas.y, hedef.y) - yukari };
    const yatik = Math.sign(hedef.x - bas.x) * 8;
    ais.classList.add("ucuyor");
    ucus = ais.animate(
      [
        { transform: `translate(${bas.x}px, ${bas.y}px)` },
        { transform: `translate(${orta.x}px, ${orta.y}px)`, offset: 0.45 },
        { transform: `translate(${hedef.x}px, ${hedef.y}px)` },
      ],
      { duration: UCUS_MS, easing: "cubic-bezier(0.45, 0, 0.2, 1)" },
    );
    const izci = setInterval(iz, IZ_ARALIK);
    const bitir = () => {
      clearInterval(izci);
      ais.classList.remove("ucuyor");
    };
    ucus.onfinish = () => {
      bitir();
      ucus = null;
      bitince?.();
    };
    ucus.oncancel = bitir;
    yerlestir(hedef, yatik);
    setTimeout(() => ucus && yerlestir(hedef, 0), UCUS_MS * 0.55);
  };

  const tac = (takili) => {
    const simdi = ais.getAttribute("aksesuar") === "tac";
    if (simdi === takili) return;
    if (takili) ais.setAttribute("aksesuar", "tac");
    else ais.removeAttribute("aksesuar");
    ais._ciz?.();
  };

  const sozler = (ekran) => {
    try {
      return JSON.parse(ekran.dataset.aisSozler || "[]");
    } catch {
      return [];
    }
  };

  const sozleriKur = (ekran) => {
    const liste = sozler(ekran);
    const tikla = liste.length < 2 ? liste : ekran === ekranlar[0] ? liste.slice(1) : [...liste.slice(1), liste[0]];
    if (tikla.length) ais.dataset.sozler = JSON.stringify(tikla);
  };

  const ilkSoz = (ekran) => {
    if (soylendi.has(ekran.id)) return;
    const ilk = sozler(ekran)[0];
    if (!ilk) return;
    soylendi.add(ekran.id);
    setTimeout(() => simdiki === ekran && !evde && ais.soyle?.(ilk), ekran === ekranlar[0] ? 1600 : 0);
  };

  const vardi = (ekran) => {
    if (ekran === simdiki) return;
    simdiki = ekran;
    const fener = ekran.hasAttribute("data-ais-fener");
    const ev = ekran.hasAttribute("data-ais-ev");
    ais.classList.toggle("fener", fener);
    tac(fener);
    sozleriKur(ekran);

    if (ev) {
      evde = true;
      ucur(tunek(ekran), () => simdiki === ekran && ais.classList.add("evde"));
      return;
    }
    evde = false;
    ais.classList.remove("evde");
    ucur(tunek(ekran), () => simdiki === ekran && ilkSoz(ekran));
  };

  ais.classList.add("yol-arkadasi");
  simdiki = ekranlar[0];
  sozleriKur(simdiki);
  yerlestir(tunek(simdiki), 0);

  if (azHareket()) {
    ilkSoz(simdiki);
    return;
  }
  ilkSoz(simdiki);

  const gozcu = new IntersectionObserver(
    (girdiler) => {
      for (const g of girdiler) if (g.isIntersecting) vardi(g.target);
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  ekranlar.forEach((e) => gozcu.observe(e));

  addEventListener("resize", () => {
    if (!ucus && !fizik && simdiki && !ais.classList.contains("tasindi")) yerlestir(tunek(simdiki), 0);
  });

  let tutus = null;
  let sonAtis = 0;

  const simdikiKonum = () => {
    const k = ais.getBoundingClientRect();
    const b = boyut();
    return { x: k.left + (k.width - b) / 2, y: k.top + (k.height - b) / 2 };
  };

  ais.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || evde) return;
    if (ucus) {
      const p = simdikiKonum();
      ucus.cancel();
      ucus = null;
      yerlestir(p, egim);
    }
    durdur();
    tutus = { id: e.pointerId, dx: e.clientX - konum.x, dy: e.clientY - konum.y, x0: e.clientX, y0: e.clientY, surukleniyor: false, izler: [] };
    try {
      ais.setPointerCapture(e.pointerId);
    } catch {

    }
  });

  ais.addEventListener("pointermove", (e) => {
    if (!tutus || e.pointerId !== tutus.id) return;
    if (!tutus.surukleniyor && Math.hypot(e.clientX - tutus.x0, e.clientY - tutus.y0) < SURUKLE_ESIK) return;
    if (!tutus.surukleniyor) {
      tutus.surukleniyor = true;
      ais.classList.add("tutuluyor");
      ais.classList.remove("konusuyor");
    }
    const t = performance.now();
    tutus.izler.push({ x: e.clientX, y: e.clientY, t });
    while (tutus.izler.length > 2 && t - tutus.izler[0].t > 90) tutus.izler.shift();
    const p = { x: e.clientX - tutus.dx, y: e.clientY - tutus.dy };
    yerlestir(p, Math.max(-20, Math.min(20, (p.x - konum.x) * 1.2)));
  });

  const birak = (e) => {
    if (!tutus || e.pointerId !== tutus.id) return;
    const t = tutus;
    tutus = null;
    ais.classList.remove("tutuluyor");
    if (!t.surukleniyor) return;

    ais.addEventListener("click", (c) => c.stopImmediatePropagation(), { capture: true, once: true });
    ais.classList.add("tasindi");
    const ilk = t.izler[0];
    const son = t.izler.at(-1);
    const sure = son && ilk ? Math.max(16, son.t - ilk.t) : 16;
    const v = son && ilk ? { x: (son.x - ilk.x) / sure, y: (son.y - ilk.y) / sure } : { x: 0, y: 0 };
    firlat(v);
  };
  ais.addEventListener("pointerup", birak);
  ais.addEventListener("pointercancel", birak);

  function durdur() {
    if (fizik) cancelAnimationFrame(fizik);
    fizik = null;
  }

  function firlat(v) {
    const hiz = Math.hypot(v.x, v.y);
    if (hiz > 1.4 && performance.now() - sonAtis > 6000) {
      sonAtis = performance.now();
      ais.soyle?.(ATIS_SOZLERI[Math.floor(Math.random() * ATIS_SOZLERI.length)]);
    }
    let son = performance.now();
    let sonIz = 0;
    const adim = (t) => {
      const dt = Math.min(40, t - son);
      son = t;
      const b = boyut();
      let { x, y } = konum;
      x += v.x * dt;
      y += v.y * dt;
      const sag = innerWidth - b - 8;
      const alt = innerHeight - b - 8;
      if (x < 8) { x = 8; v.x = Math.abs(v.x) * SEKME; }
      if (x > sag) { x = sag; v.x = -Math.abs(v.x) * SEKME; }
      if (y < 56) { y = 56; v.y = Math.abs(v.y) * SEKME; }
      if (y > alt) { y = alt; v.y = -Math.abs(v.y) * SEKME; }
      const azal = Math.exp(-SURTUNME * dt);
      v.x *= azal;
      v.y *= azal;
      const h = Math.hypot(v.x, v.y);
      yerlestir({ x, y }, egim * 0.9 + v.x * 6 * 0.1);
      if (h > 0.25 && t - sonIz > IZ_ARALIK) {
        sonIz = t;
        iz();
      }
      if (h < 0.02) {
        fizik = null;
        yerlestir(konum, 0);
        return;
      }
      fizik = requestAnimationFrame(adim);
    };
    fizik = requestAnimationFrame(adim);
  }

  let uykuSayac;
  let ilkUyanis = true;
  const uyan = () => {
    if (ais.classList.contains("uyuyor")) {
      ais.classList.remove("uyuyor");
      if (ilkUyanis && !evde) {
        ilkUyanis = false;
        ais.soyle?.("Uyumuyordum. Uzun pozlamadaydım.");
      }
    }
    clearTimeout(uykuSayac);
    uykuSayac = setTimeout(() => ais.classList.add("uyuyor"), UYKU_MS);
  };
  for (const olay of ["pointermove", "wheel", "keydown", "touchstart", "scroll"]) addEventListener(olay, uyan, { passive: true });
  uyan();
}
