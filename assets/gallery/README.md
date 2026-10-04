# Galeri görseli ekleme

Galeri statik çalışır; sayfada yükleme arayüzü veya bağlı bir görsel depolama hesabı yoktur. Manifest `previewUrl` ve `fullUrl` alanlarını kullanır. Dış barındırmaya geçirildiğinde bu alanlar sağlayıcının **HTTPS** adreslerini alır.

Mevcut dört kayıt `localReview: true` ile işaretlidir. Bunlar yalnız yerel inceleme için `assets/gallery/` altındaki JPEG türevlerini kullanır; harici barındırma veya sağlayıcı bağlantısı kurulmuş değildir. Dış barındırmaya geçirirken görselleri sağlayıcıya yükle, manifestte URL'leri sağlayıcının HTTPS adresleriyle değiştir ve `localReview` değerini `false` yap.

`metadataIsPlaceholder: true` galerideki çekim değerlerinin düzenlenebilir örnek olduğunu belirtir. Gerçek çekim bilgileriyle değiştirirken bu işareti `false` yap. Çekim tarihi yoksa `capturedAt` alanını boş bırak. Poz sayısı ve süresi `exposure`, konum `location`, Bortle sınıfı `bortle`, ekipman `instrument`, kamera `camera`; kalibrasyon kare sayıları `frameCounts.dark`, `.flat` ve `.bias` alanlarında tutulur.

Aşağıdaki kayıt biçim örneğidir; değerler örnektir:

```json
{
  "id": "m42-2026-10-15",
  "title": "Orion Bulutsusu",
  "object": "M42 / Orion",
  "capturedAt": "15 Ekim 2026",
  "location": "Ankara",
  "bortle": 4,
  "instrument": "teleskop",
  "camera": "kamera gövdesi",
  "exposure": "24 × 120 sn",
  "frameCounts": { "dark": 24, "flat": 30, "bias": 50 },
  "metadataIsPlaceholder": true,
  "alt": "Orion Bulutsusu'nun merkezindeki parlak gaz yapısı",
  "description": "İsteğe bağlı kısa not.",
  "previewUrl": "https://images.example.net/astro/m42-preview.jpg",
  "fullUrl": "https://images.example.net/astro/m42.jpg",
  "localReview": false
}
```

Önizleme sayfa yüklenirken `loading="lazy"` ile istenir. Tam JPEG adresi manifestte bulunur ancak büyük dosya, ziyaretçi kartı açana kadar görsel kaynağına atanmaz.

Dört JPEG türevi dışarıda tutulan kaynak fotoğrafların kırpılmamış, metadata içermeyen kopyalarıdır. Kaynaklar değiştirilmez. Önizlemeler 1400 piksel uzun kenar ve yaklaşık 100–250 KB boyutundadır; tam görseller kaynak piksel boyutlarını korur.
