(() => {
  const fill = document.querySelector('.flow-fill');
  const mascot = document.querySelector('.mascot-zone');
  const links = [...document.querySelectorAll('.nav a')];
  const sections = [...document.querySelectorAll('[data-section]')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const detail = document.querySelector('#project-hahbolllayristirma');
  const openButtons = [...document.querySelectorAll('[data-open-project="hahbolllayristirma"]')];
  const closeButton = document.querySelector('[data-close-project]');
  const storySections = [...document.querySelectorAll('.story-section')];
  const sectionArts = [...document.querySelectorAll('.section-art')];
  const signalCanvas = document.querySelector('.signal-canvas');
  const signalContext = signalCanvas.getContext('2d');
  const atmosphereCanvas = document.querySelector('.detail-atmosphere-canvas');
  const atmosphereContext = atmosphereCanvas.getContext('2d');
  const welcomePanel = document.querySelector('.float-card');
  const welcomeClose = document.querySelector('.welcome-close');
  const welcomeStorageKey = 'ais.portfolio.welcome.dismissed';
  const returnStorageKey = 'ais.portfolio.hahbolllayristirma.return';
  let savedScroll = 0;
  let returnHash = '#signal-separation';
  let signalWidth = 0;
  let signalHeight = 0;
  let lastSignalFrame = 0;
  let signalFrameId = 0;
  let atmosphereWidth = 0;
  let atmosphereHeight = 0;
  let lastAtmosphereFrame = 0;
  let atmosphereFrameId = 0;
  let detailScrollTimer = 0;
  let scrollFrameId = 0;
  const detailPointer = { x:.5,y:.5 };

  const updateScroll = () => {
    if (scrollFrameId) return;
    scrollFrameId = requestAnimationFrame(() => {
      scrollFrameId = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      const progress = max > 0 ? scrollY / max : 0;
      fill.style.height = `${Math.min(100, Math.max(0, progress * 100))}%`;
      if (!reduceMotion && mascot) {
        mascot.style.transform = `translateY(${Math.min(28, progress * 90)}px) rotate(${progress * 1.5}deg)`;
      }
    });
  };

  const observer = new IntersectionObserver((entries) => {
    const visible = entries.find(entry => entry.isIntersecting);
    if (!visible) return;
    links.forEach(link => link.removeAttribute('aria-current'));
    const projectLink = links.find(link => link.getAttribute('href') === '#projects');
    if (projectLink && visible.target.id !== 'archive') projectLink.setAttribute('aria-current', 'true');
    const indexLink = links.find(link => link.getAttribute('href') === '#archive');
    if (indexLink && visible.target.id === 'archive') indexLink.setAttribute('aria-current', 'true');
  }, { threshold:.45 });

  sections.forEach(section => observer.observe(section));
  addEventListener('scroll', updateScroll, { passive:true });

  if (reduceMotion) storySections.forEach(section => section.classList.add('is-visible'));
  else {
    const storyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      });
    }, { root:detail,threshold:.18,rootMargin:'0px 0px -8% 0px' });
    storySections.forEach(section => storyObserver.observe(section));
    sectionArts.forEach(art => {
      let pointerFrameId = 0;
      let pointerX = 0;
      let pointerY = 0;
      const applyPointer = () => {
        pointerFrameId = 0;
        const rect = art.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = ((pointerX - rect.left) / rect.width - .5) * 14;
        const y = ((pointerY - rect.top) / rect.height - .5) * 11;
        art.style.setProperty('--px',`${x}px`);
        art.style.setProperty('--py',`${y}px`);
      };
      art.addEventListener('pointermove', event => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        if (!pointerFrameId) pointerFrameId = requestAnimationFrame(applyPointer);
      }, { passive:true });
      art.addEventListener('pointerleave', () => {
        if (pointerFrameId) cancelAnimationFrame(pointerFrameId);
        pointerFrameId = 0;
        art.style.setProperty('--px','0px');
        art.style.setProperty('--py','0px');
      });
    });
  }

  const resizeSignal = () => {
    const rect = signalCanvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    signalWidth = Math.max(1, rect.width);
    signalHeight = Math.max(1, rect.height);
    signalCanvas.width = Math.round(signalWidth * dpr);
    signalCanvas.height = Math.round(signalHeight * dpr);
    signalContext.setTransform(dpr,0,0,dpr,0,0);
  };

  const gaussian = (x,y,cx,cy,sx,sy) => {
    const dx = (x - cx) / sx;
    const dy = (y - cy) / sy;
    return Math.exp(-(dx * dx + dy * dy) * .5);
  };

  const drawSignal = (time = 0) => {
    signalFrameId = 0;
    if (!signalWidth || !signalHeight) resizeSignal();
    const signalFrameGap = detail.classList.contains('is-scrolling') ? 95 : 55;
    if (!reduceMotion && time - lastSignalFrame < signalFrameGap) {
      signalFrameId = requestAnimationFrame(drawSignal);
      return;
    }
    lastSignalFrame = time;
    if (!detail.classList.contains('is-open')) return;
    const signalRect = signalCanvas.getBoundingClientRect();
    if (signalRect.bottom <= 0 || signalRect.top >= innerHeight) return;
    signalContext.clearRect(0,0,signalWidth,signalHeight);

    const moving = reduceMotion ? 0 : time * .000035;
    const step = 8;

    for (let y = 0;y < signalHeight;y += step) {
      const ny = y / signalHeight;
      for (let x = 0;x < signalWidth;x += step) {
        const nx = x / signalWidth;
        const driftX = Math.sin(moving * 1.7 + ny * 7) * .026;
        const driftY = Math.cos(moving * 1.25 + nx * 6) * .022;
        const ha = gaussian(nx,ny,.78 + driftX,.64 + driftY,.31,.25);
        const oiii = gaussian(nx,ny,.69 - driftX * .7,.32 - driftY,.27,.22);
        const hb = gaussian(nx,ny,.91 - driftX,.18 + driftY * .6,.18,.2);
        const grain = .56 + .26 * Math.sin(nx * 39 + moving * 9) * Math.cos(ny * 31 - moving * 7)
          + .18 * Math.sin((nx + ny) * 67);
        const field = Math.max(0,(ha * .92 + oiii * .78 + hb * .58) * grain);
        const threshold = .105;
        if (field < threshold) continue;

        let color = [216,221,227];
        if (ha > oiii && ha > hb) color = [151,63,78];
        else if (oiii > hb) color = [70,151,168];
        else color = [113,143,174];
        const alpha = Math.min(.48,Math.max(.045,(field - threshold) * .62));
        const radius = .55 + Math.min(1.65,field * 1.8);
        signalContext.beginPath();
        signalContext.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
        signalContext.arc(x,y,radius,0,Math.PI * 2);
        signalContext.fill();
      }
    }

    if (!reduceMotion) signalFrameId = requestAnimationFrame(drawSignal);
  };

  new ResizeObserver(resizeSignal).observe(signalCanvas);
  resizeSignal();
  drawSignal();

  const resizeAtmosphere = () => {
    const rect = atmosphereCanvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    atmosphereWidth = Math.max(1,rect.width);
    atmosphereHeight = Math.max(1,rect.height);
    atmosphereCanvas.width = Math.round(atmosphereWidth * dpr);
    atmosphereCanvas.height = Math.round(atmosphereHeight * dpr);
    atmosphereContext.setTransform(dpr,0,0,dpr,0,0);
  };

  const drawAtmosphere = (time = 0) => {
    atmosphereFrameId = 0;
    if (!atmosphereWidth || !atmosphereHeight) resizeAtmosphere();
    const atmosphereFrameGap = detail.classList.contains('is-scrolling') ? 105 : 65;
    if (!reduceMotion && time - lastAtmosphereFrame < atmosphereFrameGap) {
      atmosphereFrameId = requestAnimationFrame(drawAtmosphere);
      return;
    }
    lastAtmosphereFrame = time;
    if (!detail.classList.contains('is-open')) return;
    atmosphereContext.clearRect(0,0,atmosphereWidth,atmosphereHeight);
    const moving = reduceMotion ? 0 : time * .000018;
    const scrollMax = Math.max(1,detail.scrollHeight - detail.clientHeight);
    const progress = detail.scrollTop / scrollMax;
    const step = 8;
    const pointerX = (detailPointer.x - .5) * .06;
    const pointerY = (detailPointer.y - .5) * .05;

    for (let y = 0;y < atmosphereHeight;y += step) {
      const ny = y / atmosphereHeight;
      for (let x = 0;x < atmosphereWidth;x += step) {
        const nx = x / atmosphereWidth;
        const left = gaussian(nx,ny,.04 + pointerX,.25 + progress * .2 + pointerY,.34,.32);
        const right = gaussian(nx,ny,.98 + pointerX,.72 - progress * .22 + pointerY,.38,.36);
        const diagonalY = .9 - nx * .72 + Math.sin(moving * 5 + nx * 5) * .035;
        const diagonal = Math.exp(-Math.pow((ny - diagonalY) / .13,2));
        const breathingRoom = 1 - gaussian(nx,ny,.63,.46,.28,.31) * .82;
        const grain = .55 + .25 * Math.sin(nx * 43 + moving * 17)
          * Math.cos(ny * 37 - moving * 13) + .2 * Math.sin((nx + ny) * 71);
        const field = Math.max(0,(left * .86 + right * .78 + diagonal * .34) * grain * breathingRoom);
        const threshold = .075;
        if (field < threshold) continue;
        let color = [28,50,90];
        if (progress > .58 && nx < .45) color = [151,63,78];
        else if (nx > .68 || progress > .28) color = [70,151,168];
        const alpha = Math.min(.2,Math.max(.018,(field - threshold) * .3));
        const radius = .55 + Math.min(1.25,field * 1.45);
        atmosphereContext.beginPath();
        atmosphereContext.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
        atmosphereContext.arc(x,y,radius,0,Math.PI * 2);
        atmosphereContext.fill();
      }
    }
    if (!reduceMotion) atmosphereFrameId = requestAnimationFrame(drawAtmosphere);
  };

  const startCanvasLoops = () => {
    if (reduceMotion) {
      drawSignal();
      drawAtmosphere();
      return;
    }
    const signalRect = signalCanvas.getBoundingClientRect();
    if (signalRect.bottom > 0 && signalRect.top < innerHeight && !signalFrameId) {
      signalFrameId = requestAnimationFrame(drawSignal);
    }
    if (!atmosphereFrameId) atmosphereFrameId = requestAnimationFrame(drawAtmosphere);
  };

  const stopCanvasLoops = () => {
    if (signalFrameId) cancelAnimationFrame(signalFrameId);
    if (atmosphereFrameId) cancelAnimationFrame(atmosphereFrameId);
    signalFrameId = 0;
    atmosphereFrameId = 0;
  };

  const handleDetailScroll = () => {
    detail.classList.add('is-scrolling');
    if (!reduceMotion) startCanvasLoops();
    clearTimeout(detailScrollTimer);
    detailScrollTimer = setTimeout(() => {
      detail.classList.remove('is-scrolling');
      if (document.body.classList.contains('detail-open')) startCanvasLoops();
    }, 160);
  };

  detail.addEventListener('scroll', handleDetailScroll, { passive:true });

  detail.addEventListener('pointermove', event => {
    detailPointer.x = event.clientX / Math.max(1,innerWidth);
    detailPointer.y = event.clientY / Math.max(1,innerHeight);
  }, { passive:true });
  new ResizeObserver(resizeAtmosphere).observe(atmosphereCanvas);
  resizeAtmosphere();
  drawAtmosphere();

  if (sessionStorage.getItem(welcomeStorageKey) === '1') welcomePanel.classList.add('is-dismissed');
  welcomeClose.addEventListener('click', () => {
    welcomePanel.classList.add('is-dismissed');
    sessionStorage.setItem(welcomeStorageKey,'1');
  });

  const openDetail = ({ updateHistory = true } = {}) => {
    if (document.body.classList.contains('detail-open')) return;
    const storedReturn = sessionStorage.getItem(returnStorageKey);
    if (updateHistory) {
      savedScroll = scrollY;
      returnHash = '#signal-separation';
      sessionStorage.setItem(returnStorageKey,JSON.stringify({ scroll:savedScroll,hash:returnHash }));
    } else if (storedReturn) {
      try {
        const parsed = JSON.parse(storedReturn);
        savedScroll = Number(parsed.scroll) || 0;
        returnHash = parsed.hash || '#signal-separation';
      } catch (_) {
        savedScroll = 0;
        returnHash = '#signal-separation';
      }
    } else {
      savedScroll = document.querySelector('#signal-separation')?.offsetTop || 0;
      returnHash = '#signal-separation';
    }
    document.body.classList.add('detail-open');
    document.body.style.top = `-${savedScroll}px`;
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    detail.classList.add('is-open');
    detail.setAttribute('aria-hidden', 'false');
    detail.scrollTop = 0;
    startCanvasLoops();
    if (updateHistory) history.pushState({ project:'hahbolllayristirma' }, '', '#proje/hahbolllayristirma');
    closeButton.focus({ preventScroll:true });
  };

  const closeDetail = () => {
    if (!document.body.classList.contains('detail-open')) return;
    clearTimeout(detailScrollTimer);
    detailScrollTimer = 0;
    stopCanvasLoops();
    detail.classList.remove('is-scrolling');
    detail.classList.remove('is-open');
    detail.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('detail-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    if (location.hash !== returnHash) history.replaceState({},'',returnHash);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const target = document.querySelector('#signal-separation');
      const restoreTop = savedScroll > 40 ? savedScroll : (target?.offsetTop || 0);
      scrollTo({ top:restoreTop,behavior:'auto' });
      openButtons[0]?.focus({ preventScroll:true });
    }));
  };

  const requestClose = () => {
    if (history.state?.project === 'hahbolllayristirma') history.back();
    else {
      history.replaceState({}, '', returnHash);
      closeDetail();
    }
  };

  openButtons.forEach(button => button.addEventListener('click', () => openDetail()));
  closeButton.addEventListener('click', requestClose);
  addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.classList.contains('detail-open')) requestClose();
  });
  addEventListener('popstate', () => {
    if (location.hash === '#proje/hahbolllayristirma') openDetail({ updateHistory:false });
    else closeDetail();
  });

  if (location.hash === '#proje/hahbolllayristirma') openDetail({ updateHistory:false });
  updateScroll();
})();