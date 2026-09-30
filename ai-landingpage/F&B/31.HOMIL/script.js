(() => {
  const d = document, root = d.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none)').matches;

  // hero bread rises once the page has painted
  addEventListener('load', () => requestAnimationFrame(() => root.classList.add('is-loaded')));
  setTimeout(() => root.classList.add('is-loaded'), 1800);

  // GNB solid state + active section link
  const gnb = d.getElementById('gnb');
  const sentinel = d.querySelector('.hero');
  new IntersectionObserver(([e]) => gnb.classList.toggle('is-solid', !e.isIntersecting || e.intersectionRatio < .9),
    { threshold: [0, .9, 1] }).observe(sentinel);
  const links = [...d.querySelectorAll('.gnb__nav a')];
  const secIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => a.classList.toggle('is-on', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['story', 'lineup', 'season', 'visit'].forEach(id => { const el = d.getElementById(id); if (el) secIO.observe(el); });

  // mobile drawer (sibling of .gnb so fixed positioning is not trapped)
  const burger = d.querySelector('.gnb__burger'), drawer = d.getElementById('drawer');
  const setDrawer = open => { burger.setAttribute('aria-expanded', open); drawer.hidden = !open; gnb.classList.toggle('is-open', open); };
  burger.addEventListener('click', () => setDrawer(drawer.hidden));
  drawer.addEventListener('click', e => { if (e.target.closest('a')) setDrawer(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setDrawer(false); });

  // reveal on scroll, with a rAF sweep fallback for instant jumps
  const rvs = [...d.querySelectorAll('.rv')];
  if (reduce) rvs.forEach(el => el.classList.add('is-in'));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: .01 });
    rvs.forEach(el => io.observe(el));
    const sweep = () => {
      const h = innerHeight;
      rvs.forEach(el => { if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < h * .96) el.classList.add('is-in'); });
      if (rvs.some(el => !el.classList.contains('is-in'))) setTimeout(() => requestAnimationFrame(sweep), 400);
    };
    requestAnimationFrame(sweep);
  }

  // touch: bag in the middle band of the viewport lifts its bread
  if (touch) {
    const bags = [...d.querySelectorAll('.bread .bag, .bag--hero')];
    const bio = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('is-up', e.isIntersecting)),
      { rootMargin: '-38% 0px -38% 0px' });
    bags.forEach(b => bio.observe(b));
  }

  // hero mosaic: shapes drift with the pointer
  const art = d.querySelector('.hero__art');
  if (art && !reduce && !touch) {
    const mos = [...art.querySelectorAll('.mo img')];
    art.addEventListener('pointermove', e => {
      const r = art.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      mos.forEach((img, i) => {
        const k = (i % 3 + 1) * 6;
        img.style.setProperty('--mx', `${x * k}px`); img.style.setProperty('--my', `${y * k}px`);
      });
    });
  }

  // bake strips: hover (desktop) or tap opens one strip
  const strips = [...d.querySelectorAll('.strip')];
  const open = s => strips.forEach(x => x.classList.toggle('is-open', x === s));
  strips.forEach(s => {
    s.addEventListener('click', () => open(s));
    if (!touch) s.addEventListener('pointerenter', () => open(s));
  });
})();
