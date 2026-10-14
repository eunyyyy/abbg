(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => 1 - Math.pow(1 - t, 3);

  /* ---------- intro ---------- */
  body.classList.add('is-loading');
  const start = () => requestAnimationFrame(() => body.classList.remove('is-loading'));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else window.addEventListener('load', start);
  setTimeout(start, 1600);

  /* ---------- scroll driven values (one rAF loop, no scroll listener) ---------- */
  const hero = document.querySelector('[data-hero]');
  const places = document.querySelector('.places');
  const about = document.querySelector('.about');
  const reveals = [...document.querySelectorAll('[data-reveal]')];
  let lastY = -1, lastH = -1;

  function frame() {
    const y = window.scrollY, vh = window.innerHeight;
    if (y !== lastY || vh !== lastH) {
      lastY = y; lastH = vh;

      if (hero) {
        const r = hero.getBoundingClientRect();
        const t = reduce ? 1 : clamp(-r.top / (hero.offsetHeight - vh));
        const a = ease(clamp(t / 0.28));
        const b = ease(clamp((t - 0.28) / 0.52));
        hero.style.setProperty('--a', a.toFixed(4));
        hero.style.setProperty('--b', b.toFixed(4));
        body.classList.toggle('past-hero', r.bottom < vh * 0.6);
        body.classList.toggle('on-dark', b > 0.45 && r.bottom > vh * 0.6);
      }
      if (places) {
        const r = places.getBoundingClientRect();
        places.style.setProperty('--p', (reduce ? 1 : clamp((vh - r.top) / (r.height * 0.9))).toFixed(4));
      }
      if (about) {
        const r = about.getBoundingClientRect();
        about.style.setProperty('--p', (reduce ? 1 : ease(clamp((vh - r.top) / (vh * 1.05)))).toFixed(4));
      }
      // reveal sweep (fallback for instant jumps where IntersectionObserver never gets a frame)
      for (const el of reveals) {
        if (el.classList.contains('is-in')) continue;
        const rr = el.getBoundingClientRect();
        if (rr.top < vh * 0.9 && rr.bottom > 0) el.classList.add('is-in');
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    reveals.forEach(el => io.observe(el));
  }

  /* ---------- news filter + search ---------- */
  const cards = [...document.querySelectorAll('[data-grid] .card')];
  const empty = document.querySelector('.grid__empty');
  const filterBtns = [...document.querySelectorAll('[data-filter]')];
  let site = 'all', query = '';

  function applyFilter() {
    let shown = 0;
    cards.forEach(c => {
      const okSite = site === 'all' || c.dataset.site === site;
      const okQuery = !query || c.textContent.replace(/\s+/g, '').includes(query);
      const ok = okSite && okQuery;
      c.classList.toggle('is-hidden', !ok);
      if (ok) { shown++; c.classList.add('is-in'); }
    });
    empty.hidden = shown > 0;
  }
  filterBtns.forEach(btn => btn.addEventListener('click', () => {
    site = btn.dataset.filter; query = '';
    filterBtns.forEach(b => { const on = b === btn; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
    applyFilter();
  }));

  /* ---------- overlays ---------- */
  let lastFocus = null;
  const open = id => {
    const ov = document.getElementById(id);
    if (!ov) return;
    lastFocus = document.activeElement;
    ov.classList.add('is-open'); ov.setAttribute('aria-hidden', 'false');
    body.style.overflow = 'hidden';
    const f = ov.querySelector('input, a, button:not(.overlay__close)');
    setTimeout(() => f && f.focus(), 60);
  };
  const close = () => {
    document.querySelectorAll('.overlay.is-open').forEach(ov => { ov.classList.remove('is-open'); ov.setAttribute('aria-hidden', 'true'); });
    body.style.overflow = '';
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
  };
  document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => open(b.dataset.open)));
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  const form = document.querySelector('.search');
  form.addEventListener('submit', e => {
    e.preventDefault();
    query = form.q.value.replace(/\s+/g, '');
    applyFilter();
    close();
    document.getElementById('news').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ---------- places swap ---------- */
  const swap = document.querySelector('[data-swap]');
  swap && swap.addEventListener('click', () => places.classList.toggle('is-b'));
})();
