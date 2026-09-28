(() => {
  const grid = document.querySelector('#gallery-grid');
  const viewer = document.querySelector('#gallery-viewer');
  const viewerImage = document.querySelector('#viewer-image');
  const viewerStage = viewer?.querySelector('.gallery-viewer__stage');
  const viewerStatus = document.querySelector('#viewer-status');
  const viewerTitle = document.querySelector('#viewer-title');
  const viewerDescription = document.querySelector('#viewer-description');
  const viewerMetadata = document.querySelector('#viewer-metadata');
  const closeButton = viewer?.querySelector('[data-viewer-close]');
  if (!grid || !viewer || !viewerImage || !viewerStatus || !viewerTitle || !viewerMetadata) return;

  const text = (tag, className, value) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = value ?? '';
    return element;
  };

  const imageUrl = (raw, isDemo) => {
    if (typeof raw !== 'string' || !raw.trim()) return null;
    try {
      const url = new URL(raw, document.baseURI);
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
      if (!isDemo && (url.protocol !== 'https:' || url.origin === location.origin)) return null;
      return url.href;
    } catch {
      return null;
    }
  };

  const metadataRows = item => [
    ['NESNE', item.object],
    ['TARİH', item.capturedAt],
    ['KONUM', item.location],
    ['EKİPMAN', item.instrument],
    ['POZ', item.exposure]
  ].filter(([, value]) => typeof value === 'string' && value.trim());

  const setMetadata = item => {
    viewerMetadata.replaceChildren();
    metadataRows(item).forEach(([label, value]) => {
      const wrapper = document.createElement('div');
      wrapper.append(text('dt', '', label), text('dd', '', value));
      viewerMetadata.append(wrapper);
    });
  };

  const showFullImage = item => {
    const fullUrl = imageUrl(item.fullUrl, item.temporaryDemo === true);
    if (!fullUrl) {
      viewerStatus.hidden = false;
      viewerStatus.textContent = 'Tam görsel için geçerli bir HTTPS adresi bulunamadı.';
      viewerStage.setAttribute('aria-busy', 'false');
      return;
    }

    viewerImage.hidden = true;
    viewerImage.removeAttribute('src');
    viewerImage.alt = item.alt || `${item.title} — tam çözünürlüklü JPEG`;
    viewerStatus.hidden = false;
    viewerStatus.textContent = 'Tam çözünürlüklü JPEG yükleniyor…';
    viewerStage.setAttribute('aria-busy', 'true');

    viewerImage.onload = () => {
      viewerImage.hidden = false;
      viewerStatus.hidden = true;
      viewerStatus.textContent = `${viewerImage.naturalWidth} × ${viewerImage.naturalHeight} piksel`;
      viewerStage.setAttribute('aria-busy', 'false');
    };
    viewerImage.onerror = () => {
      viewerStatus.hidden = false;
      viewerStatus.textContent = 'Görsel yüklenemedi. Bağlantıyı veya JPEG dosyasını kontrol et.';
      viewerStage.setAttribute('aria-busy', 'false');
    };

    // The full JPEG URL is assigned only after an explicit activation.
    viewerImage.src = fullUrl;
  };

  const openViewer = (item, trigger) => {
    viewerTitle.textContent = item.title || 'Gözlem kaydı';
    viewerDescription.textContent = item.description || '';
    setMetadata(item);
    viewerImage.hidden = true;
    viewerImage.removeAttribute('src');
    viewerStatus.hidden = false;
    viewerStatus.textContent = 'Tam çözünürlüklü JPEG yükleniyor…';
    viewerStage.setAttribute('aria-busy', 'true');

    viewer.showModal();
    closeButton?.focus();
    showFullImage(item);
    viewer.addEventListener('close', () => trigger.focus(), { once: true });
  };

  const makeCard = (item, index) => {
    const previewUrl = imageUrl(item.previewUrl, item.temporaryDemo === true);
    const fullUrl = imageUrl(item.fullUrl, item.temporaryDemo === true);
    if (!previewUrl || !fullUrl || typeof item.title !== 'string' || !item.title.trim()) return null;

    const article = document.createElement('article');
    article.className = 'gallery-card';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gallery-card__open';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-label', `Tam çözünürlüklü JPEG: ${item.title}`);

    const frame = text('span', 'gallery-card__image-frame', '');
    const image = document.createElement('img');
    image.className = 'gallery-card__image';
    image.src = previewUrl;
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    const indexLabel = text('span', 'gallery-card__index', String(index + 1).padStart(2, '0'));
    const zoom = text('span', 'gallery-card__zoom', '↗');
    zoom.setAttribute('aria-hidden', 'true');
    frame.append(image, indexLabel, zoom);
    button.append(frame);
    button.addEventListener('click', () => openViewer(item, button));

    const copy = text('div', 'gallery-card__copy', '');
    const eyebrow = text('span', 'gallery-card__eyebrow', item.object || 'GÖZLEM KAYDI');
    const title = text('span', 'gallery-card__title', item.title);
    const summaryParts = [item.capturedAt, item.exposure].filter(value => typeof value === 'string' && value.trim());
    const summary = text('span', 'gallery-card__summary', summaryParts.join('   /   '));
    copy.append(eyebrow, title);
    if (summaryParts.length) copy.append(summary);
    if (item.temporaryDemo === true) {
      copy.append(text('span', 'gallery-card__demo', 'geçici örnek · fotoğraf değil'));
    }
    article.append(button, copy);
    return article;
  };

  closeButton?.addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => {
    if (event.target === viewer) viewer.close();
  });
  viewer.addEventListener('close', () => {
    viewerImage.removeAttribute('src');
    viewerImage.hidden = true;
    viewerStage.setAttribute('aria-busy', 'false');
  });

  fetch('assets/gallery/gallery-data.json')
    .then(response => {
      if (!response.ok) throw new Error(`Gallery manifest returned ${response.status}`);
      return response.json();
    })
    .then(data => {
      const entries = Array.isArray(data.entries) ? data.entries : [];
      const cards = entries.map(makeCard).filter(Boolean);
      grid.replaceChildren();
      grid.setAttribute('aria-busy', 'false');
      if (!cards.length) {
        grid.append(text('p', 'gallery-status', 'Henüz görüntü eklenmedi. Yeni bir kayıt için galeri yönergesini izleyebilirsin.'));
        return;
      }
      grid.append(...cards);
    })
    .catch(() => {
      grid.replaceChildren(text('p', 'gallery-status', 'Görsel kayıtları yüklenemedi. Galeri veri dosyasını kontrol et.'));
      grid.setAttribute('aria-busy', 'false');
    });
})();
