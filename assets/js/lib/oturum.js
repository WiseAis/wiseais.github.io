export const OTURUM_ANAHTAR = "aisenit-oturum-v1";

export const VARSAYILAN_OTURUM = Object.freeze({
  birikmisMs: 0,
  kare: 0,
  sure: "00:00:00",
  atis: 0,
  maksSekme: 0,
  carpisma: 0,
  starlinkGoruldu: 0,
  starlinkAtildi: 0,
  yenidenPozla: 0,
  kalibreDeneme: 0,
  karanlikAcildi: 0,
  evrildi40: false,

  kanalTuruOynandi: false,
});

const SAKLANAN_ALANLAR = Object.keys(VARSAYILAN_OTURUM);

function varsayilanDepo() {
  try {
    return typeof sessionStorage !== "undefined" ? sessionStorage : null;
  } catch {
    return null;
  }
}

export function oturumOku(depo = varsayilanDepo()) {
  const temel = { ...VARSAYILAN_OTURUM };
  if (!depo) return temel;
  try {
    const ham = depo.getItem(OTURUM_ANAHTAR);
    if (!ham) return temel;
    const veri = JSON.parse(ham);
    if (!veri || typeof veri !== "object") return temel;
    for (const k of SAKLANAN_ALANLAR) {
      const ornek = VARSAYILAN_OTURUM[k];
      const v = veri[k];
      if (typeof ornek === "number") {
        if (typeof v === "number" && Number.isFinite(v) && v >= 0) temel[k] = v;
      } else if (typeof ornek === "boolean") {
        if (typeof v === "boolean") temel[k] = v;
      } else if (typeof ornek === "string") {
        if (typeof v === "string" && v.length) temel[k] = v;
      }
    }
  } catch {

  }
  return temel;
}

export function oturumYaz(durum, depo = varsayilanDepo()) {
  if (!depo || !durum) return false;
  try {
    const paket = {};
    for (const k of SAKLANAN_ALANLAR) paket[k] = durum[k];
    depo.setItem(OTURUM_ANAHTAR, JSON.stringify(paket));
    return true;
  } catch {
    return false;
  }
}

export function pozlamaHesapla(birikmisMs, kareSn = 4) {
  const ms = Number.isFinite(birikmisMs) && birikmisMs > 0 ? birikmisMs : 0;
  const sn = Math.floor(ms / 1000);
  const iki = (n) => String(n).padStart(2, "0");
  const sure = `${iki(Math.floor(sn / 3600))}:${iki(Math.floor(sn / 60) % 60)}:${iki(sn % 60)}`;
  const kare = Math.floor(sn / kareSn);
  return { ms, sn, kare, sure };
}

export function pozlamaSayaciKur({ baslangicMs = 0, simdi = () => performance.now(), kareSn = 4 } = {}) {
  const temelMs = Number.isFinite(baslangicMs) && baslangicMs > 0 ? baslangicMs : 0;
  const sayfaBas = simdi();
  let gizliToplam = 0;
  let gizlendi = null;

  const gizle = () => {
    if (gizlendi === null) gizlendi = simdi();
  };

  const goster = () => {
    if (gizlendi !== null) {
      gizliToplam += Math.max(0, simdi() - gizlendi);
      gizlendi = null;
    }
  };

  const toplamMs = () => {
    const an = gizlendi !== null ? gizlendi : simdi();
    return Math.max(0, temelMs + Math.max(0, an - sayfaBas - gizliToplam));
  };

  const durum = () => pozlamaHesapla(toplamMs(), kareSn);

  return { gizle, goster, toplamMs, durum };
}

const baslangicOturum = oturumOku();

export const oturum = {
  baslangic: typeof performance !== "undefined" ? performance.now() : 0,
  ...baslangicOturum,
};

export function oturumGuncelle(parca, depo = varsayilanDepo()) {
  if (!parca || typeof parca !== "object") return oturum;
  Object.assign(oturum, parca);
  oturumYaz(oturum, depo);
  if (typeof document !== "undefined") {
    document.dispatchEvent(new CustomEvent("aisenit-oturum", { detail: { ...oturum } }));
  }
  return oturum;
}

export function konsolSelami(api = {}) {
  const kamusal = {
    kalibreEt: typeof api.kalibreEt === "function" ? api.kalibreEt : () => undefined,
    karanlikKare: typeof api.karanlikKare === "function" ? api.karanlikKare : () => undefined,
    evrim: typeof api.evrim === "function" ? api.evrim : () => undefined,
    durum: typeof api.durum === "function" ? api.durum : () => ({ ...oturum }),
  };

  window.aisenit = kamusal;

  const satirlar = [
    "SIMPLE = T            / saf html, css, es modülleri",
    "DEPS   = 0            / kütüphane yok, paketleyici yok",
    "HOTPIX = (14, 6)      / kalibre edilmedi",
    "HINT   = 'FOOTER + ↓' / sonu üç kez zorlarsan ne olur?",
    "CMDS   = aisenit.kalibreEt(), .karanlikKare(), .evrim(40|1000)",
  ].join("\n");

  console.log(
    "%cFITS/0.2 · AISENIT-V2\n%c" + satirlar,
    "color:#ff4f61;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:600;letter-spacing:0.08em;",
    "color:#ece8e1;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;line-height:1.65;",
  );

  return kamusal;
}
