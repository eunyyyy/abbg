(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(hover: none)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* GNB: solid background once the hero top leaves the viewport */
  const gnb = $('#gnb');
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;height:80px;width:1px;pointer-events:none';
  document.body.prepend(sentinel);
  new IntersectionObserver(([e]) => gnb.classList.toggle('is-solid', !e.isIntersecting)).observe(sentinel);

  /* mobile drawer */
  const burger = $('.gnb__burger'), drawer = $('#drawer');
  const setDrawer = open => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    drawer.hidden = !open;
    gnb.classList.toggle('is-solid', open || scrollY > 80);
  };
  burger.addEventListener('click', () => setDrawer(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', drawer).forEach(a => a.addEventListener('click', () => setDrawer(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setDrawer(false); });
  matchMedia('(min-width: 768px)').addEventListener('change', e => e.matches && setDrawer(false));

  /* active nav item */
  const links = $$('.gnb__nav a');
  const navIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('is-on', a.hash === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('section[id]').forEach(s => navIO.observe(s));

  /* reveal */
  const rvs = $$('.rv');
  const rvIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); rvIO.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  rvs.forEach(el => rvIO.observe(el));
  // safety sweep: anything already above the fold bottom (fast jumps, anchor clicks) gets revealed
  const sweep = () => {
    const h = innerHeight;
    rvs.forEach(el => { if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < h) el.classList.add('is-in'); });
  };
  addEventListener('hashchange', () => requestAnimationFrame(sweep));
  setTimeout(sweep, 1500);

  /* story lead: words light up as the paragraph moves through the viewport */
  const lead = $('#storyLead');
  const words = lead.textContent.trim().split(/\s+/);
  lead.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
  const ws = $$('.w', lead);
  if (reduce) ws.forEach(w => w.classList.add('is-lit'));

  /* store photo parallax */
  const visitImg = $('.visit__photo img');

  // one rAF loop, only running while one of its targets is on screen
  const live = new Set();
  let raf = 0;
  const tick = () => {
    raf = 0;
    const h = innerHeight;
    if (live.has(lead)) {
      const r = lead.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (h * 0.85 - r.top) / (r.height + h * 0.35)));
      const n = Math.round(p * ws.length);
      ws.forEach((w, i) => w.classList.toggle('is-lit', i < n));
    }
    if (live.has(visitImg)) {
      const r = visitImg.parentElement.getBoundingClientRect();
      const p = (r.top + r.height / 2 - h / 2) / (h + r.height);
      visitImg.style.setProperty('--par', (p * -12).toFixed(2) + '%');
    }
    if (live.size) raf = requestAnimationFrame(tick);
  };
  if (!reduce) {
    const loopIO = new IntersectionObserver(es => {
      es.forEach(e => (e.isIntersecting ? live.add(e.target) : live.delete(e.target)));
      if (live.size && !raf) raf = requestAnimationFrame(tick);
    });
    loopIO.observe(lead);
    loopIO.observe(visitImg);
  }

  /* hero: line icons drift away from the pointer */
  const art = $('#heroArt');
  const floats = $$('.float', art);
  if (!reduce && !coarse) {
    art.addEventListener('pointermove', e => {
      const r = art.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      floats.forEach(f => {
        const d = +f.dataset.depth;
        f.style.setProperty('--px', (-x * d).toFixed(1) + 'px');
        f.style.setProperty('--py', (-y * d).toFixed(1) + 'px');
      });
    });
    art.addEventListener('pointerleave', () => floats.forEach(f => { f.style.setProperty('--px', '0px'); f.style.setProperty('--py', '0px'); }));
  }

  /* touch devices: bread rises when its card crosses the middle of the screen */
  if (coarse) {
    const upIO = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('is-up', e.isIntersecting)),
      { rootMargin: '-38% 0px -38% 0px' });
    $$('.bread').forEach(b => upIO.observe(b));
    const heroBread = $('.hero__bread');
    setTimeout(() => heroBread.style.transform = 'translate(-50%,-26%)', 2600);
  }
})();
