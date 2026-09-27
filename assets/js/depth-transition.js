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
  const isProject02Target = routeDepth(currentUrl) === 2;
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
  const prepareProjectModal = direction => {
    const html = document.documentElement;
    html.classList.add('depth-modal-prepaint');
    if (direction === 'reverse') html.classList.add('depth-modal-reverse');
    else html.classList.remove('depth-modal-reverse');
    const modal = document.querySelector('.project-detail');
    if (modal) getComputedStyle(modal).transform;
  };
  const consumeClickIntent = url => {
    try {
      const stored = safelyGet(intentKey);
      safelyRemove(intentKey);
      if (!stored) return null;
      const intent = JSON.parse(stored);
      if (intent.to !== routeKey(url) || intent.expires < Date.now()) return null;
      return intent.direction === 'forward' || intent.direction === 'reverse' ? intent.direction : null;
    } catch (_) {
      safelyRemove(intentKey);
      return null;
    }
  };
  const consumeHistoryDirection = url => {
    try {
      const previous = JSON.parse(safelyGet(historyKey) || 'null');
      const destinationDepth = routeDepth(url);
      if (previous && previous.at + 30000 >= Date.now() && previous.depth && destinationDepth && previous.depth !== destinationDepth) {
        return destinationDepth > previous.depth ? 'forward' : 'reverse';
      }
    } catch (_) {}
    return null;
  };

  const clickDirection = consumeClickIntent(currentUrl);
  let entryDirection = clickDirection;
  const navigationType = performance.getEntriesByType('navigation')[0]?.type;
  if (!clickDirection && navigationType === 'back_forward') {
    entryDirection = consumeHistoryDirection(currentUrl);
  }
  if (entryDirection) applyEntry(entryDirection);
  safelyRemove(historyKey);
  if (isProject02Target) {
    prepareProjectModal(entryDirection);
    const prepareModalStart = () => {
      if (document.readyState !== 'interactive') return;
      prepareProjectModal(entryDirection);
      document.removeEventListener('readystatechange', prepareModalStart);
    };
    document.addEventListener('readystatechange', prepareModalStart);
  }

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
    document.documentElement.classList.remove('depth-enter-forward', 'depth-enter-reverse');
    const restoredUrl = new URL(location.href);
    const clickDirection = consumeClickIntent(restoredUrl);
    const historyDirection = clickDirection ? null : consumeHistoryDirection(restoredUrl);
    const direction = clickDirection || historyDirection;
    const needsProject02Open = routeDepth(restoredUrl) === 2
      && !document.body.classList.contains('detail-open');
    if (needsProject02Open) prepareProjectModal(direction);
    if (direction) applyEntry(direction);
    if (needsProject02Open) window.dispatchEvent(new Event('ais:restore-detail'));
    safelyRemove(intentKey);
    safelyRemove(historyKey);
  });

  window.addEventListener('hashchange', () => {
    if (routeDepth(new URL(location.href)) !== 2 || document.body.classList.contains('detail-open')) return;
    prepareProjectModal(null);
  });

  window.addEventListener('ais:detail-opened', () => {
    if (!document.documentElement.classList.contains('depth-modal-prepaint')) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.documentElement.classList.remove('depth-modal-prepaint', 'depth-modal-reverse');
    }));
  });

  window.addEventListener('pagehide', () => {
    const departedDepth = routeDepth(new URL(location.href));
    if (departedDepth) safelySet(historyKey, JSON.stringify({ depth:departedDepth, at:Date.now() }));
  });
})();
