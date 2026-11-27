const kok = document.querySelector("[data-galeri]");
if (kok) {
  const pencere = kok.querySelector(".galeri-pencere");
  const oklar = [...kok.querySelectorAll(".galeri-ok")];
  const kareler = [...kok.querySelectorAll(".galeri-kare")];
  const kutu = document.querySelector(".galeri-buyuk");
  const azHareket = matchMedia("(prefers-reduced-motion: reduce)").matches;

  kareler.forEach((kare) => {
    const img = kare.querySelector("img");
    if (!img || kare.querySelector(".galeri-kare-kap")) return;
    const kap = document.createElement("span");
    kap.className = "galeri-kare-kap";
    const fener = document.createElement("span");
    fener.className = "galeri-fener";
    fener.setAttribute("aria-hidden", "true");
    img.replaceWith(kap);
    kap.append(img, fener);
  });

  let etkinIndeks = 0;
  let imlecAktif = -1;
  const etkinAyarla = (indeks) => {
    etkinIndeks = Math.max(0, Math.min(kareler.length - 1, indeks));
    kareler.forEach((k, i) => k.classList.toggle("etkin", i === etkinIndeks));
  };

  const kutuOnbellek = new WeakMap();
  const onbellekTemizle = () => {
    kareler.forEach((k) => kutuOnbellek.delete(k));
  };

  kareler.forEach((kare, i) => {
    kare.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "touch") return;
      imlecAktif = i;
      etkinAyarla(i);
      const kap = kare.querySelector(".galeri-kare-kap") || kare;
      kutuOnbellek.set(kare, kap.getBoundingClientRect());
    });
    kare.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      const kap = kare.querySelector(".galeri-kare-kap") || kare;
      const r = kutuOnbellek.get(kare) || kap.getBoundingClientRect();
      kutuOnbellek.set(kare, r);
      if (!r.width || !r.height) return;
      const gx = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
      const gy = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
      kare.style.setProperty("--gx", `${gx.toFixed(1)}%`);
      kare.style.setProperty("--gy", `${gy.toFixed(1)}%`);
    });
    kare.addEventListener("pointerleave", () => {
      if (imlecAktif === i) imlecAktif = -1;
      kutuOnbellek.delete(kare);
    });
    kare.addEventListener("focus", () => etkinAyarla(i));
  });

  let adimOlcu = 0;
  const adimHesapla = () => {
    const ilk = kareler[0]?.closest(".galeri-oge");
    adimOlcu = ilk ? ilk.offsetWidth + parseFloat(getComputedStyle(pencere.firstElementChild).columnGap || 0) : pencere.clientWidth * 0.8;
    return adimOlcu;
  };
  const adim = () => adimOlcu || adimHesapla();

  const git = (yon) => pencere.scrollBy({ left: yon * adim() * (innerWidth < 760 ? 1 : 2), behavior: azHareket ? "auto" : "smooth" });

  const durum = () => {
    onbellekTemizle();
    const son = pencere.scrollWidth - pencere.clientWidth - 2;
    kok.classList.toggle("basta", pencere.scrollLeft <= 2);
    kok.classList.toggle("sonda", pencere.scrollLeft >= son);
    oklar[0].disabled = pencere.scrollLeft <= 2;
    oklar[1].disabled = pencere.scrollLeft >= son;
    if (pencere.scrollLeft > 24) kok.classList.add("kaydirildi");
    if (imlecAktif === -1) {
      const a = Math.max(1, adim());
      etkinAyarla(Math.round(pencere.scrollLeft / a));
    }
  };
  pencere.addEventListener("scroll", durum, { passive: true });
  addEventListener("resize", () => {
    adimHesapla();
    durum();
  });
  adimHesapla();
  durum();

  oklar.forEach((o) => o.addEventListener("click", () => git(Number(o.dataset.yon))));

  pencere.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (e.target === pencere) git(0.5);
      else {
        const i = kareler.indexOf(e.target);
        if (i >= 0 && i < kareler.length - 1) kareler[i + 1].focus();
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (e.target === pencere) git(-0.5);
      else {
        const i = kareler.indexOf(e.target);
        if (i > 0) kareler[i - 1].focus();
      }
    } else if (e.key === "Home") {
      e.preventDefault();
      pencere.scrollTo({ left: 0, behavior: azHareket ? "auto" : "smooth" });
      if (e.target !== pencere) kareler[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      pencere.scrollTo({ left: pencere.scrollWidth, behavior: azHareket ? "auto" : "smooth" });
      if (e.target !== pencere) kareler[kareler.length - 1]?.focus();
    }
  });

  let tut = null;
  let surukledi = false;
  pencere.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    tut = { x: e.clientX, sol: pencere.scrollLeft, id: e.pointerId };
    surukledi = false;
  });
  pencere.addEventListener("pointermove", (e) => {
    if (!tut || e.pointerId !== tut.id) return;
    const dx = e.clientX - tut.x;
    if (!surukledi && Math.abs(dx) > 5) {
      surukledi = true;
      pencere.setPointerCapture(e.pointerId);
      pencere.classList.add("suruklenyor");
    }
    if (surukledi) pencere.scrollLeft = tut.sol - dx;
  });
  const birak = () => {
    if (!tut) return;
    tut = null;
    pencere.classList.remove("suruklenyor");
    if (surukledi) {

      const hedef = Math.round(pencere.scrollLeft / adim()) * adim();
      pencere.scrollTo({ left: hedef, behavior: azHareket ? "auto" : "smooth" });
    }
  };
  pencere.addEventListener("pointerup", birak);
  pencere.addEventListener("pointercancel", birak);

  pencere.addEventListener(
    "click",
    (e) => {
      if (surukledi) {
        e.stopPropagation();
        e.preventDefault();
        surukledi = false;
      }
    },
    true,
  );

  if (kutu && typeof kutu.showModal === "function") {
    const resim = kutu.querySelector("img");
    const yazi = kutu.querySelector("figcaption");
    let sira = 0;
    let istek = 0;

    const sahne = document.createElement("div");
    sahne.className = "galeri-sahne";
    resim.replaceWith(sahne);
    sahne.append(resim);
    const gezin = [-1, 1].map((yon) => {
      const d = document.createElement("button");
      d.type = "button";
      d.className = `galeri-gezin ${yon < 0 ? "onceki" : "sonraki"}`;
      d.setAttribute("aria-label", yon < 0 ? "Önceki kare" : "Sonraki kare");
      d.textContent = yon < 0 ? "←" : "→";
      d.addEventListener("click", (e) => {
        e.stopPropagation();
        goster(sira + yon);
      });
      return d;
    });
    sahne.prepend(gezin[0]);
    sahne.append(gezin[1]);

    const onYukle = (i) => {
      const k = kareler[(i + kareler.length) % kareler.length];
      if (k) new Image().src = k.dataset.buyuk;
    };
    const goster = (i) => {
      sira = (i + kareler.length) % kareler.length;
      const k = kareler[sira];
      const bu = ++istek;
      etkinAyarla(sira);
      yazi.textContent = `${k.dataset.ad} · ${sira + 1}/${kareler.length}`;
      resim.alt = k.querySelector("img").alt;

      const yeni = new Image();
      const koy = () => {
        if (bu === istek) resim.src = k.dataset.buyuk;
      };
      yeni.onload = koy;
      yeni.onerror = koy;
      yeni.src = k.dataset.buyuk;
      if (yeni.complete) koy();
      onYukle(sira + 1);
      onYukle(sira - 1);
    };
    kareler.forEach((k, i) =>
      k.addEventListener("click", () => {
        resim.removeAttribute("src");
        goster(i);
        kutu.showModal();
      }),
    );

    let dokun = null;
    sahne.addEventListener("touchstart", (e) => {
      const t = e.touches[0];
      dokun = e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null;
    }, { passive: true });
    sahne.addEventListener("touchend", (e) => {
      if (!dokun) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - dokun.x;
      const dy = t.clientY - dokun.y;
      dokun = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) goster(sira + (dx < 0 ? 1 : -1));
    }, { passive: true });
    kutu.querySelector(".galeri-kapat").addEventListener("click", () => kutu.close());
    kutu.addEventListener("click", (e) => {
      if (e.target === kutu) kutu.close();
    });

    kutu.addEventListener("wheel", (e) => {
      e.stopPropagation();
      e.preventDefault();
    }, { passive: false });
    kutu.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "ArrowRight") goster(sira + 1);
      else if (e.key === "ArrowLeft") goster(sira - 1);
      else if (["ArrowUp", "ArrowDown", "PageUp", "PageDown"].includes(e.key)) e.preventDefault();
    });
    kutu.addEventListener("close", () => {
      kareler[sira]?.focus({ preventScroll: false });
      resim.removeAttribute("src");
    });
  }
}
