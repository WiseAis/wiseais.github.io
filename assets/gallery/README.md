# Galeriye JPEG ekleme

Galeri statik çalışır. Görsel yüklemek için bir web arayüzü veya depolama anahtarı içermez; fotoğrafları R2, Cloudinary veya kullandığın başka bir görsel sağlayıcısına koyup adreslerini manifest dosyasına eklersin.

1. Her fotoğrafın küçük JPEG önizlemesini ve tam çözünürlüklü JPEG sürümünü görsel sağlayıcısına yükle.
2. `gallery-data.json` içindeki `entries` listesine bir kayıt ekle. `previewUrl` önizlemeye, `fullUrl` büyük JPEG'e giden **HTTPS ve bu sitenin alan adından farklı** adres olmalı.
3. Başlık, nesne adı, tarih, konum, ekipman, poz ve erişilebilir `alt` açıklamasını doldur. Kullanmadığın alanları boş bırakabilirsin.
4. Deneme görseli kaldırılınca `synthetic-sky-demo` kaydını ve `synthetic-sky-preview.jpg` / `synthetic-sky-full.jpg` dosyalarını sil.

Örnek kayıt biçimi:

```json
{
  "id": "m42-2026-10-15",
  "title": "Orion Bulutsusu",
  "object": "M42 / Orion",
  "capturedAt": "15 Ekim 2026",
  "location": "Ankara",
  "instrument": "teleskop / kamera",
  "exposure": "24 × 120 sn",
  "alt": "Orion Bulutsusu'nun merkezindeki parlak gaz yapısı",
  "description": "İsteğe bağlı kısa not.",
  "previewUrl": "https://images.example.net/astro/m42-preview.jpg",
  "fullUrl": "https://images.example.net/astro/m42.jpg",
  "temporaryDemo": false
}
```

Önizleme sayfa açılırken yüklenebilir ve `loading="lazy"` ile görünür alana yaklaşınca istenir. Tam JPEG adresi manifestten okunur fakat büyük dosya, ziyaretçi kartı açana kadar bir `<img>` kaynağına atanmaz. Gerçek kayıtlar için iki adres de GitHub Pages deposu dışında kalmalı; bu, sayfanın depolama ve trafik kotasını fotoğraflarla doldurmaz.
