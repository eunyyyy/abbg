(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => innerWidth < 768;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* inline svg loader (strokes need to be in the DOM to animate and recolor) */
  const svgCache = {};
  const loadSvg = url => (svgCache[url] ||= fetch(url).then(r => r.text()));
  const inlineAll = () => Promise.all($$('[data-svg]').map(el =>
    loadSvg(el.dataset.svg).then(t => { el.innerHTML = t; })));

  /* GNB: hide on scroll down, solid after hero, mobile drawer */
  const gnb = $('#gnb'), burger = $('#burger'), mnav = $('#mnav');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    mnav.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', mnav).forEach(a => a.addEventListener('click', () => setMenu(false)));

  if (hasGsap) {
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: self => {
        const y = self.scroll();
        gnb.classList.toggle('is-solid', y > innerHeight * .6);
        gnb.classList.toggle('is-hidden', self.direction === 1 && y > innerHeight && !mnav.classList.contains('is-open'));
      }
    });
    const links = $$('.gnb__nav a');
    links.forEach(a => {
      const sec = $(a.getAttribute('href'));
      if (!sec) return;
      ScrollTrigger.create({
        trigger: sec, start: 'top 50%', end: 'bottom 50%',
        onToggle: s => a.classList.toggle('is-on', s.isActive)
      });
    });
  }

  /* reveal: IntersectionObserver + rAF sweep fallback for instant jumps */
  const reveals = $$('[data-reveal]');
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  reveals.forEach(el => io.observe(el));
  const sweep = () => {
    reveals.forEach(el => {
      if (el.classList.contains('is-in')) return;
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * .95 && r.bottom > 0) el.classList.add('is-in');
    });
    requestAnimationFrame(sweep);
  };
  requestAnimationFrame(sweep);

  /* HERO human hand: dot halftone from a luminance map */
  function halftone(canvas) {
    const ctx = canvas.getContext('2d');
    const img = new Image();
    let pts = [], W = 0, H = 0, t0 = performance.now(), mx = -1e4, my = -1e4;
    const build = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const step = isMobile() ? 5 : 7;
      const cols = Math.floor(W / step), rows = Math.floor(H / step);
      const off = document.createElement('canvas');
      off.width = cols; off.height = rows;
      const o = off.getContext('2d');
      o.drawImage(img, 0, 0, cols, rows);
      const d = o.getImageData(0, 0, cols, rows).data;
      pts = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const v = d[(y * cols + x) * 4] / 255;
        if (v > .08) pts.push({ x: x * step + step / 2, y: y * step + step / 2, v, s: step, k: Math.random() });
      }
    };
    const draw = now => {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        const appear = reduce ? 1 : Math.min(1, Math.max(0, (t - .4 - (1 - p.x / W) * 1.2 - p.k * .3) / .5));
        if (!appear) continue;
        const dx = p.x - mx, dy = p.y - my, dist = Math.hypot(dx, dy);
        const push = dist < 90 ? (1 - dist / 90) * 1.8 : 0;
        const r = (p.s * .5) * Math.sqrt(p.v) * appear * (1 + push * .4);
        const hot = Math.max(0, 1 - p.x / (W * .25)) * .6;
        ctx.fillStyle = `rgba(${226 + 29 * hot | 0},${211 - 80 * hot | 0},${191 - 140 * hot | 0},${.35 + p.v * .65})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    img.onload = () => { build(); requestAnimationFrame(draw); };
    img.src = canvas.dataset.map;
    addEventListener('resize', () => img.complete && build());
    addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top;
    }, { passive: true });
  }
  halftone($('#heroHuman'));

  /* HERO robot: wireframe draws on, hands close the gap while scrolling */
  inlineAll().then(() => {
    const robot = $('#heroRobot');
    if (reduce) { robot.style.setProperty('--draw', 0); return; }
    const o = { v: 1 };
    if (hasGsap) gsap.to(o, { v: 0, duration: 2.6, ease: 'power2.inOut', delay: .2, onUpdate: () => robot.style.setProperty('--draw', o.v) });
    else robot.style.setProperty('--draw', 0);
    techSetup();
  });

  if (hasGsap && !reduce) {
    const stage = $('.hero__stage');
    ScrollTrigger.create({
      trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: s => stage.style.setProperty('--close', s.progress.toFixed(3))
    });
    gsap.to('.hero__copy', { yPercent: -18, opacity: .15, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: true } });
    gsap.from('.hero__title .line, .hero__sub, .hero__ctas', { y: 30, opacity: 0, duration: 1.2, stagger: .12, ease: 'expo.out', delay: .15, clearProps: 'transform' });
  }

  /* ABOUT statement: words light up with scroll (rayraylab) */
  const st = $('#statement');
  st.innerHTML = st.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  const words = $$('.w', st);
  if (hasGsap && !reduce) {
    ScrollTrigger.create({
      trigger: st, start: 'top 80%', end: 'bottom 40%', scrub: true,
      onUpdate: s => { const n = Math.round(s.progress * words.length); words.forEach((w, i) => w.classList.toggle('is-lit', i < n)); }
    });
    const stack = $('.about__stack'), photo = $('.about__photo');
    ScrollTrigger.create({
      trigger: '.about__grid', start: 'top 85%', end: 'bottom 30%', scrub: true,
      onUpdate: s => {
        const p = s.progress;
        stack.style.setProperty('--sx', (Math.sin(p * Math.PI) * 6).toFixed(2));
        photo.style.setProperty('--blur', `${Math.max(0, 14 - p * 26).toFixed(1)}px`);
        photo.style.setProperty('--cap', Math.max(0, 1 - Math.max(0, p - .45) * 4).toFixed(2));
      }
    });
  } else words.forEach(w => w.classList.add('is-lit'));

  /* HIGHLIGHT: inset video expands to full bleed (apple) */
  const frame = $('#hlFrame'), video = $('video', frame);
  new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? video.play().catch(() => {}) : video.pause()), { threshold: .2 }).observe(frame);
  if (hasGsap && !reduce) {
    ScrollTrigger.create({
      trigger: '.hl__track', start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: s => {
        const p = Math.min(1, s.progress / .7);
        const e = 1 - Math.pow(1 - p, 3);
        const ix = isMobile() ? 6 : 22, iy = isMobile() ? 28 : 13;
        frame.style.setProperty('--ix', `${(ix * (1 - e)).toFixed(2)}%`);
        frame.style.setProperty('--iy', `${(iy * (1 - e)).toFixed(2)}%`);
        frame.style.setProperty('--r', `${(24 * (1 - e)).toFixed(1)}px`);
        frame.style.setProperty('--capo', Math.max(0, (s.progress - .6) / .3).toFixed(2));
      }
    });
  }

  /* counters */
  const fmt = (v, el) => {
    const dec = +el.dataset.dec || 0;
    let s = v.toFixed(dec);
    if (el.dataset.sep) s = Math.round(v).toLocaleString('ko-KR');
    return s;
  };
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, to = parseFloat(el.dataset.count);
    cio.unobserve(el);
    if (reduce || !hasGsap) return;
    const o = { v: 0 };
    gsap.to(o, { v: to, duration: 1.6, ease: 'expo.out', onUpdate: () => { el.textContent = fmt(o.v, el); } });
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* HUMANOID: sticky steps drive HUD callouts */
  const steps = $$('#humSteps li'), hg = $$('.hum__lines g'), tags = $$('.tag');
  const setStep = i => {
    steps.forEach((li, k) => li.classList.toggle('is-on', k === i));
    hg.forEach(g => g.classList.toggle('is-on', +g.dataset.i <= i));
    tags.forEach(t => t.classList.toggle('is-on', +t.dataset.i <= i));
  };
  if (hasGsap && !reduce) {
    setStep(0);
    ScrollTrigger.create({
      trigger: '.hum', start: 'top top', end: 'bottom bottom',
      onUpdate: s => setStep(Math.min(steps.length - 1, Math.floor(s.progress * steps.length)))
    });
  } else setStep(steps.length - 1);

  /* VISION: boxes on enter, confidence jitter, aim follows pointer, keypoints */
  const view = $('#visionView'), aim = $('#visionAim');
  new IntersectionObserver(es => es.forEach(e => e.isIntersecting && view.classList.add('is-in')), { threshold: .3 }).observe(view);
  view.addEventListener('pointermove', e => {
    const r = view.getBoundingClientRect();
    aim.style.transform = `translate(${e.clientX - r.left}px,${e.clientY - r.top}px)`;
  });
  if (!reduce) setInterval(() => {
    if (!view.classList.contains('is-in')) return;
    $$('[data-conf]', view).forEach(i => {
      const b = parseFloat(i.dataset.conf);
      i.textContent = Math.min(.99, b + (Math.random() - .5) * .04).toFixed(2);
    });
  }, 900);
  (function keypoints() {
    const c = $('#visionPts'), ctx = c.getContext('2d');
    // joints per detected person, in % of the photo (head, shoulders, hands, knees, feet)
    const people = [
      [[20,66],[18,71],[24,71],[17,82],[25,80],[19,92],[23,93]],
      [[33.6,58],[32,62],[36,62],[31.5,72],[36.3,70],[33,86],[35,95]],
      [[39.5,55],[37.5,59],[42,59],[37,70],[43,71],[38.5,84],[40.5,92]],
      [[46.5,39],[45,43],[49,43],[44.5,52],[50,52],[45.5,62],[48.5,66]]
    ];
    const floor = Array.from({ length: 70 }, () => [Math.random() * 100, 70 + Math.random() * 30, Math.random()]);
    let on = false;
    new IntersectionObserver(es => { on = es[0].isIntersecting; }).observe(c);
    const draw = now => {
      requestAnimationFrame(draw);
      if (!on) return;
      const r = c.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      if (c.width !== Math.round(r.width * dpr)) { c.width = r.width * dpr; c.height = r.height * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, r.width, r.height);
      const t = now / 1000;
      ctx.fillStyle = '#FF7A47';
      people.forEach((pp, i) => pp.forEach(([x, y], k) => {
        const a = .55 + .45 * Math.sin(t * 2.4 + i + k);
        ctx.globalAlpha = a;
        ctx.fillRect(x / 100 * r.width - 2.5, y / 100 * r.height - 2.5, 5, 5);
      }));
      floor.forEach(([x, y, k]) => {
        ctx.globalAlpha = .25 + .5 * Math.abs(Math.sin(t * 1.3 + k * 9));
        ctx.fillRect(x / 100 * r.width, y / 100 * r.height, 3, 3);
      });
      ctx.globalAlpha = 1;
    };
    requestAnimationFrame(draw);
  })();

  /* TECH: orange highlight climbs the blueprint (colosseum ref) */
  function techSetup() {
    const hi = $('.tech__svg--hi');
    if (!hasGsap || reduce) return;
    ScrollTrigger.create({
      trigger: '#techDraw', start: 'top 70%', end: 'bottom 70%', scrub: .4,
      onUpdate: s => hi.style.setProperty('--hi-t', `${(100 - s.progress * 100).toFixed(1)}%`)
    });
    ScrollTrigger.refresh();
  }

  /* INDUSTRY: horizontal pan (pinned) with dot-screen release on the centered card */
  const track = $('#indTrack'), cards = $$('.icard', track);
  const markCenter = () => {
    const cx = innerWidth / 2;
    let best = null, bd = 1e9;
    cards.forEach(c => { const r = c.getBoundingClientRect(); const d = Math.abs(r.left + r.width / 2 - cx); if (d < bd) { bd = d; best = c; } });
    cards.forEach(c => c.classList.toggle('is-on', c === best));
  };
  if (hasGsap && !reduce) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 768px)', () => {
      const dist = () => track.scrollWidth - innerWidth;
      gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '.ind__pin', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 1, invalidateOnRefresh: true, onUpdate: markCenter }
      });
    });
    mm.add('(max-width: 767px)', () => {
      const f = () => markCenter();
      track.addEventListener('scroll', f, { passive: true });
      return () => track.removeEventListener('scroll', f);
    });
  }

  /* CERT: receipt prints out of the slot (rayraylab) */
  if (hasGsap && !reduce) {
    const rc = $('#receipt');
    ScrollTrigger.create({
      trigger: '#certClip', start: 'top 85%', end: 'bottom 55%', scrub: true,
      onUpdate: s => {
        const p = s.progress;
        rc.style.setProperty('--ry', `${(-100 + p * 100).toFixed(2)}%`);
        rc.style.setProperty('--rr', `${(Math.sin(p * Math.PI * 3) * (1 - p) * 1.6).toFixed(2)}deg`);
      }
    });
  }

  /* CONTACT: handshake particles that drift back into shape, repelled by the pointer */
  (function particles() {
    const c = $('#shake'), ctx = c.getContext('2d'), img = new Image();
    let P = [], W, H, mx = -1e4, my = -1e4, on = false;
    const build = () => {
      const r = c.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height; c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sc = Math.min(W * (isMobile() ? 1.25 : .82) / img.width, H * .95 / img.height);
      const iw = img.width * sc, ih = img.height * sc, ox = (W - iw) / 2 + (isMobile() ? 0 : W * .08), oy = (H - ih) * .35;
      const step = isMobile() ? 3 : 2;
      const off = document.createElement('canvas'); off.width = img.width; off.height = img.height;
      const o = off.getContext('2d'); o.drawImage(img, 0, 0);
      const d = o.getImageData(0, 0, img.width, img.height).data;
      P = [];
      for (let y = 0; y < img.height; y += step) for (let x = 0; x < img.width; x += step) {
        const v = d[(y * img.width + x) * 4] / 255;
        if (v > .06 && Math.random() < Math.min(1, v * 1.6) * (isMobile() ? .6 : .85)) {
          const tx = ox + x * sc, ty = oy + y * sc;
          P.push({ tx, ty, x: tx + (Math.random() - .5) * 300, y: ty + (Math.random() - .5) * 300, vx: 0, vy: 0, v, ph: Math.random() * 6.28 });
        }
      }
    };
    const draw = now => {
      requestAnimationFrame(draw);
      if (!on || !P.length) return;
      const t = now / 1000;
      ctx.clearRect(0, 0, W, H);
      for (const p of P) {
        const hx = p.tx + Math.sin(t * .8 + p.ph) * 1.6, hy = p.ty + Math.cos(t * .7 + p.ph) * 1.6;
        p.vx += (hx - p.x) * .02; p.vy += (hy - p.y) * .02;
        const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < 9000) { const f = (9000 - d2) / 9000 * 2.2; const d = Math.sqrt(d2) || 1; p.vx += dx / d * f; p.vy += dy / d * f; }
        p.vx *= .86; p.vy *= .86; p.x += p.vx; p.y += p.vy;
        ctx.fillStyle = `rgba(242,240,236,${(.45 + p.v * .55).toFixed(2)})`;
        ctx.fillRect(p.x, p.y, 1.8, 1.8);
      }
    };
    img.onload = () => { build(); requestAnimationFrame(draw); };
    img.src = c.dataset.map;
    new IntersectionObserver(es => { on = es[0].isIntersecting; }).observe(c);
    addEventListener('resize', () => img.complete && build());
    c.parentElement.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    c.parentElement.addEventListener('pointerleave', () => { mx = my = -1e4; });
  })();

  /* form: inline validation, no backend */
  const form = $('#form'), msg = $('#formMsg');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('.field', form).forEach(f => { f.classList.remove('is-err'); f.querySelector('.err')?.remove(); });
    $$('[required]', form).forEach(inp => {
      const bad = !inp.value.trim() || (inp.type === 'email' && !/^\S+@\S+\.\S+$/.test(inp.value));
      if (bad) {
        ok = false;
        const f = inp.closest('.field'); f.classList.add('is-err');
        const p = document.createElement('p'); p.className = 'err';
        p.textContent = inp.type === 'email' && inp.value ? '이메일 형식을 확인해 주세요.' : '필수 입력 항목입니다.';
        f.appendChild(p);
      }
    });
    msg.classList.toggle('is-ok', ok);
    msg.textContent = ok ? '문의가 접수되었습니다. 담당 엔지니어가 곧 연락드리겠습니다.' : '표시된 항목을 확인해 주세요.';
    if (ok) form.reset();
  });

  addEventListener('load', () => hasGsap && ScrollTrigger.refresh());
})();
