(() => {
  document.querySelectorAll('[data-section-rail]').forEach(rail => {
    const items = [...rail.querySelectorAll('.section-rail__item')];
    const sections = items.map(item => {
      const id = item.dataset.detailScroll || item.getAttribute('href')?.slice(1);
      return { item, section:id ? document.getElementById(id) : null };
    }).filter(entry => entry.section);
    const root = rail.dataset.scrollRoot ? document.querySelector(rail.dataset.scrollRoot) : null;
    if (!sections.length) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const bounds = root ? root.getBoundingClientRect() : { top:0,bottom:innerHeight };
      const anchor = bounds.top + (bounds.bottom - bounds.top) * .5;
      let current = null;
      let nearestDistance = Infinity;

      for (const entry of sections) {
        const rect = entry.section.getBoundingClientRect();
        if (rect.bottom <= bounds.top || rect.top >= bounds.bottom) continue;
        const distance = anchor < rect.top ? rect.top - anchor : anchor > rect.bottom ? anchor - rect.bottom : 0;
        if (distance < nearestDistance) {
          current = entry;
          nearestDistance = distance;
        }
      }

      for (const entry of sections) {
        if (entry === current) entry.item.setAttribute('aria-current','location');
        else entry.item.removeAttribute('aria-current');
      }
    };
    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    (root || window).addEventListener('scroll',scheduleUpdate,{ passive:true });
    window.addEventListener('resize',scheduleUpdate,{ passive:true });
    window.addEventListener('load',scheduleUpdate,{ once:true });

    update();
  });
})();
