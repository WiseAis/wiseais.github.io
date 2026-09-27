(() => {
  const intentKey = 'ais.depth-transition.intent.v1';
  const historyKey = 'ais.depth-transition.history.v1';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const routeDepth = url => {
    if (url.pathname.replace(/\/$/, '') === '/ais001/03') return 3;
    if (url.pathname === '/' && url.hash === '#proje/hahbolllayristirma') return 2;
    if (url.pathname === '/') return 1;
    return null;
  };
  const routeKey = url => `${url.pathname}${url.search}${url.hash}`;
  const currentUrl = new URL(location.href);
  const currentDepth = routeDepth(currentUrl);
  const now = Date.now();
  const safelyGet = key => { try { return sessionStorage.getItem(key); } catch (_) { return null; } };
  const safelyRemove = key => { try { sessionStorage.removeItem(key); } catch (_) {} };
  const safelySet = (key, value) => { try { sessionStorage.setItem(key, value); } catch (_) {} };
  const applyEntry = direction => {
    if (reducedMotion) return;
    document.documentElement.classList.add(`depth-enter-${direction}`);
    window.setTimeout(() => {
      document.documentElement.classList.remove('depth-enter-forward', 'depth-enter-reverse');
    }, 520);
  };

  let matchedIntent = false;
  try {
    const stored = safelyGet(intentKey);
    if (stored) {
      const intent = JSON.parse(stored);
      matchedIntent = intent.to === routeKey(currentUrl)
        && intent.expires >= now
        && (intent.direction === 'forward' || intent.direction === 'reverse');
      safelyRemove(intentKey);
      if (matchedIntent) applyEntry(intent.direction);
    }
  } catch (_) {
    safelyRemove(intentKey);
  }
  const navigationType = performance.getEntriesByType('navigation')[0]?.type;
  if (!matchedIntent && navigationType === 'back_forward') {
    try {
      const previous = JSON.parse(safelyGet(historyKey) || 'null');
      if (previous && previous.at + 30000 >= now && previous.depth && currentDepth && previous.depth !== currentDepth) {
        applyEntry(currentDepth > previous.depth ? 'forward' : 'reverse');
      }
    } catch (_) {}
  }
  safelyRemove(historyKey);

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    const link = target?.closest('a[href]');
    if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;

    const targetUrl = new URL(link.href, location.href);
    if (targetUrl.origin !== location.origin) return;
    const from = routeDepth(new URL(location.href));
    const to = routeDepth(targetUrl);
    if (!from || !to || from === to) return;

    const sameDocument = targetUrl.pathname === location.pathname && targetUrl.search === location.search;
    if (sameDocument && from === 2 && to === 1) {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('ais:close-to-depth', { detail:{ href:targetUrl.href } }));
      return;
    }
    if (sameDocument) return;

    if (!reducedMotion) {
      const value = JSON.stringify({
        to:routeKey(targetUrl),
        direction:to > from ? 'forward' : 'reverse',
        expires:Date.now() + 3500
      });
      safelySet(intentKey, value);
      window.setTimeout(() => {
        if (safelyGet(intentKey) === value) safelyRemove(intentKey);
      }, 3500);
    } else {
      safelyRemove(intentKey);
    }
  });

  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    safelyRemove(intentKey);
    safelyRemove(historyKey);
    document.documentElement.classList.remove('depth-enter-forward', 'depth-enter-reverse');
  });

  window.addEventListener('pagehide', () => {
    if (currentDepth) safelySet(historyKey, JSON.stringify({ depth:currentDepth, at:Date.now() }));
  });
})();
