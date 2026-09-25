(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  requestAnimationFrame(() => document.documentElement.classList.add('is-loaded'));

  /* mobile menu (sibling of header) */
  const burger = $('#burger');
  const mnav = $('#mnav');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    mnav.classList.toggle('is-open', open);
    mnav.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', mnav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* reveal on enter */
  const revealEls = $$('.reveal, .contact');
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
  revealEls.forEach(el => io.observe(el));

  /* active nav */
  const navLinks = $$('.gnb__nav a');
  const navIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['titles', 'about', 'work', 'news', 'contact'].forEach(id => { const s = document.getElementById(id); if (s) navIO.observe(s); });

  const gnb = $('#gnb');
  const heroRunway = $('#heroRunway');
  const heroFrame = $('#heroFrame');
  const slides = $$('.hero__slide');
  const caps = $$('.hero__cap');
  const aboutRunway = $('#aboutRunway');
  const aboutSticky = $('.about__sticky');
  let lastY = window.scrollY;
  let lastSlide = 0;

  const progress = (el) => {
    const r = el.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    return span > 0 ? clamp(-r.top / span) : 0;
  };

  const tick = () => {
    const y = window.scrollY;

    /* GNB: hide on scroll down, show on scroll up */
    if (!mnav.classList.contains('is-open')) {
      if (y > lastY + 4 && y > 200) gnb.classList.add('is-hidden');
      else if (y < lastY - 4 || y < 200) gnb.classList.remove('is-hidden');
    }
    lastY = y;

    /* reveal fallback sweep: IO can miss frames on instant jumps */
    for (const el of revealEls) {
      if (el.classList.contains('is-in')) continue;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.95 && r.bottom > 0) el.classList.add('is-in');
    }

    /* hero: frame grows to full bleed, slides crossfade by progress */
    const hp = progress(heroRunway);
    const grow = clamp(hp / 0.3);
    const startScale = window.innerWidth < 768 ? 1 - 30 / window.innerWidth : 1 - 80 / window.innerWidth;
    heroFrame.style.setProperty('--s', reduce ? 1 : (startScale + (1 - startScale) * grow).toFixed(4));
    heroFrame.style.setProperty('--r', (1 - grow).toFixed(3));
    const idx = Math.min(slides.length - 1, Math.floor(hp * slides.length * 0.999));
    if (idx !== lastSlide) {
      slides.forEach((s, i) => s.classList.toggle('is-on', i === idx));
      caps.forEach((c, i) => c.classList.toggle('is-on', i === idx));
      lastSlide = idx;
    }

    /* about: lead fades, wordmark scales up, copy rises */
    const ap = progress(aboutRunway);
    const lead = 1 - clamp((ap - 0.05) / 0.2);
    const w = clamp((ap - 0.15) / 0.4);
    const co = clamp((ap - 0.55) / 0.25);
    aboutSticky.style.setProperty('--lead', lead.toFixed(3));
    aboutSticky.style.setProperty('--ws', reduce ? 1 : (0.2 + 0.8 * w).toFixed(4));
    aboutSticky.style.setProperty('--wo', reduce ? 1 : clamp(w * 2).toFixed(3));
    aboutSticky.style.setProperty('--co', reduce ? 1 : co.toFixed(3));

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
