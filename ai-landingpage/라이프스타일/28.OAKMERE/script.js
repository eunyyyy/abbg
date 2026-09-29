(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  /* ---------- hero: 글자 단위 분리 ---------- */
  const title = $('[data-split]');
  if (title) {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          [...n.textContent].forEach(ch => {
            const s = document.createElement('span');
            if (ch === ' ') { s.className = 'sp'; s.innerHTML = '&nbsp;'; }
            else { s.className = 'ch'; s.textContent = ch; s.style.setProperty('--i', i++); }
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else walk(n);
      });
    };
    title.setAttribute('aria-label', title.textContent);
    walk(title);
    $$('span', title).forEach(s => s.setAttribute('aria-hidden', 'true'));
  }
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('is-ready')));

  /* hero 영상: 모션 줄이기 설정 시 정지 */
  const heroVideo = $('.hero__video');
  if (heroVideo && reduce) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }

  /* ---------- intro: 스크롤에 따라 밝아지는 문장 ---------- */
  const lit = $('[data-lightup]');
  let litChars = [];
  if (lit) {
    const words = lit.textContent.trim().split(/\s+/);
    lit.setAttribute('aria-label', lit.textContent.trim());
    lit.innerHTML = words.map(w =>
      `<span class="w" aria-hidden="true">${[...w].map(c => `<span class="c">${c}</span>`).join('')}</span>`
    ).join(' ');
    litChars = $$('.c', lit);
  }

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.25, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const t = id === '#top' ? document.body : $(id);
    if (!t) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(id === '#top' ? 0 : t, { duration: 1.6 });
    else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* ---------- reveal ---------- */
  const reveals = $$('.reveal, .fade-up');
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -12% 0px' });
  reveals.forEach(el => io.observe(el));

  /* ---------- 요소 참조 ---------- */
  const gnb = $('#gnb');
  const themed = $$('[data-theme]');
  const hero = $('.hero');
  const heroLayers = $$('[data-parallax]', hero);
  const para = $$('[data-parallax]').filter(el => !hero.contains(el));
  const intro = $('.intro');
  const collage = $('.collage');
  const grid = $('#collageGrid');
  const center = $('#collageCenter');
  const sides = $$('.tile:not(.t-center)', grid);
  const lands = $('.lands');
  const head = $('#landsHead');
  const ltitle = $('#landsTitle');
  const globe = $('#globe');
  const spin = $('#globeSpin');

  let vw = innerWidth, vh = innerHeight, zoomMax = 3;
  const measure = () => {
    vw = innerWidth; vh = innerHeight;
    const prev = grid.style.transform; grid.style.transform = 'none';
    const r = center.getBoundingClientRect();
    zoomMax = vw < 768 ? vw / r.width : Math.max(vw / r.width, vh / r.height) * 1.01;
    grid.style.transform = prev;
  };
  measure();
  addEventListener('resize', () => { measure(); update(); });

  const progress = el => {
    const r = el.getBoundingClientRect();
    return { r, p: clamp(-r.top / Math.max(1, r.height - vh)) };
  };

  function update() {
    const y = lenis ? lenis.scroll : scrollY;

    /* GNB 색상: 로고 위치 아래 섹션의 테마 */
    let dark = false;
    for (const s of themed) {
      const r = s.getBoundingClientRect();
      if (r.top <= 36 && r.bottom > 36) { dark = s.dataset.theme === 'dark'; }
    }
    if (collage) {
      const { r, p } = progress(collage);
      if (r.top <= 0 && r.bottom > 36 && p > .55) dark = false;
    }
    gnb.classList.toggle('is-dark', dark);

    if (reduce) { litChars.forEach(c => (c.style.opacity = 1)); return; }

    /* hero parallax */
    if (y < vh * 1.2) heroLayers.forEach(el => {
      el.style.transform = `translate3d(0, ${y * parseFloat(el.dataset.parallax)}px, 0)`;
    });

    /* intro light-up */
    if (intro && litChars.length) {
      const r = intro.getBoundingClientRect();
      const p = clamp((vh * .85 - r.top) / (r.height * .9));
      const n = litChars.length, head = p * (n + 10);
      litChars.forEach((c, i) => { c.style.opacity = (.2 + .8 * clamp((head - i) / 10)).toFixed(3); });
    }

    /* 일반 parallax */
    para.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const off = (r.top + r.height / 2) - vh / 2;
      el.style.transform = `translate3d(0, ${off * parseFloat(el.dataset.parallax)}px, 0)`;
    });

    /* collage: 가운데 이미지로 확대 */
    if (collage) {
      const { r, p } = progress(collage);
      if (r.bottom > 0 && r.top < vh) {
        const e = ease(clamp((p - .08) / .72));
        grid.style.transform = `scale(${1 + (zoomMax - 1) * e})`;
        const side = (1 - clamp((e - .55) / .4)).toFixed(3);
        sides.forEach(t => t.style.setProperty('--side', side));
      }
    }

    /* lands: 지구 상승 */
    if (lands) {
      const { r, p } = progress(lands);
      if (r.bottom > 0 && r.top < vh) {
        const e = easeOut(clamp(p / .7));
        globe.style.transform = `translate3d(0, ${(1 - e) * vh * .62}px, 0)`;
        const th = ltitle.offsetHeight + ltitle.offsetTop;
        head.style.transform = `translate3d(0, ${-e * (th + (vw < 768 ? 30 : vw / 1440 * 88))}px, 0)`;
        ltitle.style.opacity = (1 - clamp(p / .42)).toFixed(3);
        const deg = -10 + p * 16;
        spin.style.transform = `rotate(${deg}deg)`;
        spin.style.setProperty('--r', `${deg}deg`);
      }
    }

    /* IO 누락 대비 (즉시 캡처 등) */
    for (const el of reveals) {
      if (el.classList.contains('is-in')) continue;
      const r = el.getBoundingClientRect();
      if (r.top < vh * .92 && r.bottom > 0) el.classList.add('is-in');
    }
  }

  if (lenis) lenis.on('scroll', update);
  const loop = t => { if (lenis) lenis.raf(t); else update(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  update();

  /* ---------- 목적지 선택 ---------- */
  const dest = $('#dest'), btn = $('#destBtn'), list = $('#destList'), label = $('#destLabel');
  const pins = $$('.pin');
  pins.forEach((pin, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'option'); b.setAttribute('aria-selected', 'false');
    b.innerHTML = `<i class="dot ${pin.classList.contains('pin--rose') ? 'dot--rose' : 'dot--sage'}" aria-hidden="true"></i>${pin.textContent}`;
    b.addEventListener('click', () => select(i));
    li.appendChild(b); list.appendChild(li);
    pin.setAttribute('aria-label', pin.textContent);
    pin.addEventListener('click', () => select(i));
  });
  function select(i) {
    pins.forEach((p, k) => p.classList.toggle('is-on', k === i));
    $$('button', list).forEach((b, k) => b.setAttribute('aria-selected', String(k === i)));
    label.textContent = pins[i].textContent;
    toggle(false);
  }
  function toggle(open) {
    dest.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
  }
  btn.addEventListener('click', () => toggle(!dest.classList.contains('is-open')));
  document.addEventListener('click', e => { if (!dest.contains(e.target)) toggle(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
})();
