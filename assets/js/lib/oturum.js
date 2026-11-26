export const oturum = {
  baslangic: performance.now(),
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
};

export function oturumGuncelle(parca) {
  if (!parca || typeof parca !== "object") return oturum;
  Object.assign(oturum, parca);
  document.dispatchEvent(new CustomEvent("aisenit-oturum", { detail: { ...oturum } }));
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
