/* =========================================================
   NIMBRA | 인터랙션
   ascentask.com 모션 구조를 바닐라 GSAP + Lenis로 이식
   ========================================================= */
(() => {
  const body = document.body;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => window.innerWidth < 768;
  const byDevice = (m, t, d) => (window.innerWidth < 768 ? m : window.innerWidth <= 1024 ? t : d);

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  gsap.registerPlugin(ScrollTrigger, CustomEase);
  const climb = CustomEase.create('climb', 'M0,0 C0.127,0.027 0.187,0.065 0.272,0.141 0.374,0.232 0.466,0.362 0.498,0.502 0.518,0.592 0.552,0.77 0.615,0.864 0.69,0.975 0.704,1 1,1');

  /* ---------- Lenis ---------- */
  let lenis = null;
  if (!reduce) {
    lenis = new Lenis({ lerp: window.innerWidth <= 1024 ? 0.065 : 0.08, wheelMultiplier: 0.8, smoothTouch: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  /* ---------- Header: 스크롤 방향에 따라 숨김 ---------- */
  let lastY = 0;
  const onScroll = (y) => {
    const header = document.getElementById('header');
    const h = header.offsetHeight;
    if (Math.abs(y - lastY) < 6) return;
    body.classList.toggle('scroll-down', y > lastY && y > h);
    lastY = y;
  };
  if (lenis) lenis.on('scroll', (e) => onScroll(e.scroll));
  else ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => onScroll(s.scroll()) });

  /* ---------- Menu + 앵커 이동 ---------- */
  const menuBtn = document.querySelector('.menu-btn');
  const mnav = document.getElementById('mnav');
  const setNav = (open) => {
    body.classList.toggle('nav-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    mnav.setAttribute('aria-hidden', !open);
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  menuBtn.addEventListener('click', () => setNav(!body.classList.contains('nav-open')));
  window.addEventListener('resize', () => { if (window.innerWidth > 1024 && body.classList.contains('nav-open')) setNav(false); });

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? 0 : document.querySelector(id);
      if (target === null) return;
      e.preventDefault();
      if (body.classList.contains('nav-open')) setNav(false);
      if (lenis) lenis.scrollTo(target, { duration: 1.4 });
      else window.scrollTo({ top: target === 0 ? 0 : target.getBoundingClientRect().top + window.scrollY });
    });
  });

  /* 현재 섹션 GNB 표시 */
  document.querySelectorAll('.gnb__link').forEach((link) => {
    const sec = document.querySelector(link.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', toggleClass: { targets: link, className: 'is-current' } });
  });

  /* ---------- 공통: fade-up-toggle ---------- */
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    if (reduce) return;
    gsap.fromTo(el, { y: 40, autoAlpha: 0 }, {
      y: 0, autoAlpha: 1, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' },
    });
  });

  /* ---------- 카운트 업 (절반 값에서 시작) ---------- */
  const fmt = (v, sep) => { const s = Math.round(v).toString(); return sep ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : s; };
  gsap.utils.toArray('.js-count').forEach((el) => {
    const end = parseFloat(el.dataset.end); const sep = !!el.dataset.sep;
    if (reduce) { el.textContent = fmt(end, sep); return; }
    const o = { v: end * 0.5 };
    el.textContent = fmt(o.v, sep);
    gsap.to(o, {
      v: end, duration: 2, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none none' },
      onUpdate: () => { el.textContent = fmt(o.v, sep); },
    });
  });

  /* ---------- 01 Intro + Visual ---------- */
  const intro = document.querySelector('.intro');
  const visual = document.querySelector('.visual');
  const titleWrap = visual.querySelector('.visual__title-wrap');
  const title = visual.querySelector('.visual__title');
  const letters = title.querySelectorAll('span');
  const L1 = visual.querySelector('.layer--01');
  const L3 = visual.querySelector('.layer--03');
  const L4 = visual.querySelector('.layer--04');
  const travel01 = document.querySelector('.travel__text--01');

  const startScroll = () => { body.classList.remove('is-loading'); if (lenis) lenis.start(); };

  const buildVisualScroll = () => {
    gsap.timeline({
      scrollTrigger: { trigger: visual, start: 'top top', end: 'bottom center', scrub: 1, pin: titleWrap, pinSpacing: false },
    })
      .fromTo(title, { yPercent: 0 }, { yPercent: -60, ease: 'none' })
      .fromTo(L1, { yPercent: gsap.getProperty(L1, 'yPercent') }, { yPercent: -38, ease: 'none' }, '<')
      .fromTo(L3, { yPercent: gsap.getProperty(L3, 'yPercent') }, { yPercent: 6, ease: 'none' }, '<')
      .fromTo(L4, { yPercent: gsap.getProperty(L4, 'yPercent') }, { yPercent: 3, ease: 'none' }, '<');
  };

  if (reduce) {
    intro.remove();
    startScroll();
    buildVisualScroll();
  } else {
    const off = [110, 64, 24, -24, -64, -110];
    gsap.set(letters, { autoAlpha: 0, x: (i) => off[i] * (isMobile() ? 0.4 : 1) });
    gsap.set(L1, { yPercent: -24 });
    gsap.set(L3, { yPercent: -10 });
    gsap.set(L4, { yPercent: -12 });
    gsap.set(travel01, { y: 40, autoAlpha: 0 });

    gsap.fromTo(intro, { clipPath: 'inset(0% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 100% 0%)', duration: 2.2, ease: 'power4.inOut', delay: 0.2,
      onComplete: () => { intro.remove(); setTimeout(startScroll, 150); },
    });

    gsap.timeline({ delay: 0.2 })
      .to(L4, { yPercent: 0, duration: 3.2, ease: climb })
      .to(L3, { yPercent: byDevice(-2, -4, -2), duration: 3.2, ease: climb }, '<')
      .to(L1, { yPercent: byDevice(-4, -4, -4), duration: 3.2, ease: climb }, '<')
      .to(letters, { autoAlpha: 1, duration: 2.6, ease: 'power4.inOut' }, '-=2.3')
      .to(letters, { x: 0, duration: 2.6, ease: 'power4.inOut' }, '<')
      .to(travel01, { y: 0, autoAlpha: 1, duration: 0.8 }, '+=0.05')
      .call(buildVisualScroll);
  }

  /* ---------- Route line (SVG 드로잉) ---------- */
  const drawRoute = (sel) => {
    const path = document.querySelector(`${sel} path`);
    if (!path) return;
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: reduce ? 0 : len });
    if (reduce) return;
    return gsap.to(path, {
      strokeDashoffset: 0, ease: 'none',
      scrollTrigger: { trigger: sel, start: 'top 90%', end: 'bottom bottom', scrub: 1, invalidateOnRefresh: true },
    });
  };
  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => { drawRoute('.route__pc'); });
  mm.add('(max-width: 767px)', () => { drawRoute('.route__mo'); });

  /* ---------- 03 Journey ---------- */
  const journey = document.querySelector('.journey');
  if (!reduce) {
    gsap.timeline({ scrollTrigger: { trigger: journey.querySelector('.journey__img'), start: 'top center', end: 'bottom bottom', scrub: 1 } })
      .to(journey.querySelector('.journey__title'), { yPercent: 50, ease: 'none' })
      .to(journey.querySelector('.journey__layer'), { yPercent: -8, ease: 'none' }, '<');
  }

  /* ---------- 04 Tech panels: hover + 자동 순환 ---------- */
  const panels = gsap.utils.toArray('.panel');
  let activeIdx = 0; let hovering = false; let cycle = null;
  const activate = (i) => { panels.forEach((p, k) => p.classList.toggle('is-active', k === i)); activeIdx = i; };
  panels.forEach((p, i) => {
    p.addEventListener('mouseenter', () => { hovering = true; activate(i); });
    p.addEventListener('mouseleave', () => { hovering = false; });
    p.addEventListener('click', () => activate(i));
  });
  const runCycle = (on) => {
    clearInterval(cycle);
    if (on && !reduce) cycle = setInterval(() => { if (!hovering) activate((activeIdx + 1) % panels.length); }, 3400);
  };
  ScrollTrigger.create({ trigger: '.panels', start: 'top bottom', end: 'bottom top', onToggle: (s) => runCycle(s.isActive) });

  /* ---------- 05 Flagship ---------- */
  const flag = document.querySelector('.flagship');
  const hs = gsap.utils.toArray('.hs');
  // 모바일: 핫스팟 라벨을 목록으로 복제
  const list = document.createElement('ul');
  list.className = 'hs-list';
  hs.forEach((h) => { const li = document.createElement('li'); li.innerHTML = h.querySelector('.hs__label').innerHTML; list.appendChild(li); });
  flag.querySelector('.flagship__stage').after(list);

  if (!reduce) {
    gsap.timeline({ scrollTrigger: { trigger: flag, start: 'top bottom', end: 'bottom top', scrub: 1 } })
      .fromTo('.flagship__model', { xPercent: -38 }, { xPercent: -62, ease: 'none' })
      .fromTo('.flagship__drone', { yPercent: 14 }, { yPercent: -10, ease: 'none' }, '<');
    gsap.set('.hs__pt', { scale: 0 });
    gsap.set('.hs__label', { autoAlpha: 0, '--line': '0px' });
    gsap.timeline({ scrollTrigger: { trigger: '.flagship__stage', start: 'top 55%', toggleActions: 'play none none reverse' } })
      .to('.hs__pt', { scale: 1, duration: 0.5, ease: 'back.out(2)', stagger: 0.12 })
      .to('.hs__label', { autoAlpha: 1, '--line': '72px', duration: 0.7, ease: 'power3.out', stagger: 0.12 }, '-=0.4');
  }

  /* ---------- 06 Design: 클립 확장 + 핀 ---------- */
  const design = document.querySelector('.design');
  const d01 = design.querySelector('.design__01');
  const clip = design.querySelector('.design__clip');
  const d01Tit = design.querySelector('.design__tit01');
  if (!reduce) {
    const startClip = () => byDevice('inset(4% 2% round 16px)', 'inset(8% 10% round 20px)', 'inset(10% 15% round 24px)');
    gsap.set(d01Tit, { y: 40, autoAlpha: 0 });
    gsap.timeline({
      scrollTrigger: { trigger: d01, start: 'top top', end: '+=110%', pin: true, scrub: true, invalidateOnRefresh: true },
    })
      .fromTo(clip, { clipPath: startClip }, { clipPath: 'inset(0% 0% round 0px)', ease: 'none' })
      .fromTo(clip.querySelector('img'), { scale: 1.15 }, { scale: 1, ease: 'none' }, '<')
      .to(d01Tit, { y: 0, autoAlpha: 1, ease: 'none' }, '>');
    gsap.fromTo('.design__endbg img', { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.design__endbg', start: 'top bottom', end: 'bottom bottom', scrub: 1 } });
  }

  /* ---------- 07 Partners: 배경 패럴랙스 + 3D 구체 ---------- */
  const partners = document.querySelector('.partners');
  if (!reduce) {
    gsap.timeline({ scrollTrigger: { trigger: partners, start: 'top top', end: 'bottom center', scrub: 1.5, invalidateOnRefresh: true } })
      .to('.partners__bg', { yPercent: byDevice(-15, -15, -20), scale: 1.08, ease: 'none' })
      .to('.partners__inner', { yPercent: 10, ease: 'none' }, '<');
  }
  const cloud = partners.querySelector('.cloud');
  const items = gsap.utils.toArray('.cloud__item');
  const pts = items.map((el, i) => {
    const phi = Math.acos(-1 + (2 * i + 1) / items.length);
    const theta = Math.sqrt(items.length * Math.PI) * phi;
    return { el, x: Math.cos(theta) * Math.sin(phi), y: Math.sin(theta) * Math.sin(phi), z: Math.cos(phi) };
  });
  let rx = 0.3, ry = 0.2, dx = 0, dy = 0, px = null, py = null, cloudOn = false;
  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', (e) => {
      if (!cloudOn) return;
      if (px !== null) { dx = (e.clientX - px) * 0.003; dy = -(e.clientY - py) * 0.003; }
      px = e.clientX; py = e.clientY;
    });
  }
  const renderCloud = () => {
    const r = cloud.offsetWidth * 0.36;
    const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);
    pts.forEach((p) => {
      const y1 = p.y * cx - p.z * sx; const z1 = p.y * sx + p.z * cx;
      const x2 = p.x * cy + z1 * sy; const z2 = -p.x * sy + z1 * cy;
      const s = (z2 + 1.8) / 2.8;
      gsap.set(p.el, { x: x2 * r - p.el.offsetWidth / 2, y: y1 * r - p.el.offsetHeight / 2, scale: s, opacity: Math.max(0.18, (z2 + 1) / 2), zIndex: Math.round(s * 100) });
    });
  };
  renderCloud();
  window.addEventListener('resize', renderCloud);
  if (!reduce) {
    ScrollTrigger.create({ trigger: partners, start: 'top bottom', end: 'bottom top', onToggle: (s) => { cloudOn = s.isActive; } });
    gsap.ticker.add(() => {
      if (!cloudOn) return;
      ry += 0.004 + dx; rx += 0.003 + dy; dx *= 0.85; dy *= 0.85;
      renderCloud();
    });
  }

  /* ---------- 10 Rollings: 카드 블러 + 다음 카드 상승 ---------- */
  if (!reduce) {
    const area = document.querySelector('.rollings__area');
    gsap.set('.roll--02', { yPercent: 100 });
    gsap.set('.roll--02 .roll__img img', { scale: 1.2 });
    gsap.timeline({ scrollTrigger: { trigger: area, start: 'top top', end: () => '+=' + window.innerHeight, pin: true, pinSpacing: false, scrub: 1, invalidateOnRefresh: true } })
      .to('.roll--01', { scale: 0.82, filter: 'blur(10px)', ease: 'power2.inOut', duration: 1.25 })
      .to('.roll--02', { yPercent: 0, ease: 'power2.inOut', duration: 1.25 }, '<')
      .to('.roll--02 .roll__img img', { scale: 1, ease: 'power2.inOut', duration: 1.25 }, '<');
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
