/* Tohumlu, tekrarlanabilir rastgele sayı üreteci (mulberry32).
   Aynı tohum her yüklemede aynı yıldız alanını, aynı maskot gürültüsünü verir. */
export function tohumlu(tohum) {
  let s = tohum >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const azHareket = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
