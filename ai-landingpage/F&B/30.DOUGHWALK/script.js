(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* GNB: solid once the hero leaves the viewport */
  const gnb = $('.gnb');
  const sentinel = $('.hero__sentinel');
  new IntersectionObserver(([e]) => gnb.classList.toggle('is-solid', !e.isIntersecting && e.boundingClientRect.top < 0))
    .observe(sentinel);

  /* mobile nav */
  const burger = $('.gnb__burger'), mnav = $('#mnav');
  const setNav = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    mnav.hidden = !open;
    gnb.classList.toggle('is-open', open);
    if (open) gnb.classList.add('is-solid');
  };
  burger.addEventListener('click', () => setNav(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', mnav).forEach(a => a.addEventListener('click', () => setNav(false)));

  /* reveal on enter + rAF fallback sweep for instant jumps / captures */
  const reveals = $$('.reveal');
  const io = new IntersectionObserver((es) => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  reveals.forEach(el => io.observe(el));
  const sweep = () => {
    const vh = innerHeight;
    reveals.forEach(el => {
      if (el.classList.contains('is-in')) return;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.95 && r.bottom > 0) el.classList.add('is-in');
    });
    requestAnimationFrame(sweep);
  };
  requestAnimationFrame(sweep);

  /* hero stickers: pointer parallax after they pop in */
  const heroStk = $$('.hero__stk');
  if (!reduce && fine) {
    let tx = 0, ty = 0, raf = 0;
    heroStk.forEach(s => s.addEventListener('animationend', () => s.classList.add('is-live'), { once: true }));
    $('.hero').addEventListener('pointermove', (e) => {
      tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(() => {
        heroStk.forEach((s, i) => {
          const depth = 14 + (i % 4) * 9;
          s.style.setProperty('--px', `${(-tx * depth).toFixed(1)}px`);
          s.style.setProperty('--py', `${(-ty * depth).toFixed(1)}px`);
        });
        raf = 0;
      });
    });
  }

  /* story: draggable sticker board */
  const board = $('.play');
  const layout = [
    { x: .02, y: .04, w: 200, r: -8 }, { x: .36, y: .00, w: 250, r: 6 }, { x: .70, y: .08, w: 190, r: 10 },
    { x: .05, y: .50, w: 250, r: 5 }, { x: .44, y: .44, w: 170, r: -12 }, { x: .70, y: .52, w: 180, r: 8 },
    { x: .30, y: .72, w: 150, r: -4 },
  ];
  const stks = $$('.play__stk', board);
  let z = 10;
  const place = () => {
    const bw = board.clientWidth, bh = board.clientHeight;
    const k = bw < 600 ? 0.62 : 1;
    stks.forEach((s, i) => {
      if (s.dataset.moved) return;
      const L = layout[i % layout.length];
      s.style.setProperty('--w', `${L.w}px`);
      s.style.setProperty('--r', `${L.r}deg`);
      const w = L.w * k;
      s.style.setProperty('--x', `${Math.min(L.x * bw, bw - w)}px`);
      s.style.setProperty('--y', `${Math.min(L.y * bh, bh - w * 1.1)}px`);
    });
  };
  place();
  addEventListener('resize', place);
  stks.forEach(s => {
    s.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      s.setPointerCapture(e.pointerId);
      s.classList.add('is-drag');
      s.style.zIndex = ++z;
      const bx = board.getBoundingClientRect();
      const sx = parseFloat(s.style.getPropertyValue('--x')), sy = parseFloat(s.style.getPropertyValue('--y'));
      const ox = e.clientX, oy = e.clientY;
      const move = (ev) => {
        const nx = Math.max(-20, Math.min(bx.width - s.offsetWidth + 20, sx + ev.clientX - ox));
        const ny = Math.max(-20, Math.min(bx.height - s.offsetHeight + 20, sy + ev.clientY - oy));
        s.style.setProperty('--x', `${nx}px`); s.style.setProperty('--y', `${ny}px`);
        s.style.setProperty('--r', `${Math.max(-14, Math.min(14, (ev.clientX - ox) * 0.08))}deg`);
      };
      const up = () => {
        s.classList.remove('is-drag'); s.dataset.moved = '1';
        s.removeEventListener('pointermove', move); s.removeEventListener('pointerup', up); s.removeEventListener('pointercancel', up);
      };
      s.addEventListener('pointermove', move); s.addEventListener('pointerup', up); s.addEventListener('pointercancel', up);
    });
  });

  /* bake: active step swaps the sticky photo */
  const shots = $$('.bake__shot'), steps = $$('.bake__step');
  const stepIO = new IntersectionObserver((es) => es.forEach(e => {
    if (!e.isIntersecting) return;
    const i = +e.target.dataset.step;
    steps.forEach((s, j) => s.classList.toggle('is-on', j === i));
    shots.forEach((s, j) => s.classList.toggle('is-on', j === i));
  }), { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach(s => stepIO.observe(s));
  steps[0].classList.add('is-on');

  /* sticker pack: draw one at random, or tap one to pick it */
  const pick = $('.pack__pick'), label = $('.pack__label strong'), btns = $$('.pack__btn');
  let last = -1;
  const choose = (i) => {
    const b = btns[i], img = $('img', b);
    pick.classList.remove('is-spin'); void pick.offsetWidth;
    pick.src = img.src; pick.width = img.width; pick.height = img.height; pick.alt = b.dataset.name;
    label.textContent = b.dataset.name;
    pick.classList.add('is-spin');
    btns.forEach(x => x.classList.remove('is-hit'));
    void b.offsetWidth; b.classList.add('is-hit');
    last = i;
  };
  $('#drawBtn').addEventListener('click', () => {
    let i; do { i = Math.floor(Math.random() * btns.length); } while (i === last && btns.length > 1);
    choose(i);
  });
  btns.forEach((b, i) => b.addEventListener('click', () => choose(i)));

  /* visit: photo follows the cursor over store rows */
  const float = $('.visit__float');
  if (fine && float) {
    const fimg = $('img', float);
    let fx = 0, fy = 0, raf = 0;
    $$('.visit__row').forEach(row => {
      row.addEventListener('pointerenter', () => { fimg.src = row.dataset.img; float.classList.add('is-on'); });
      row.addEventListener('pointerleave', () => float.classList.remove('is-on'));
      row.addEventListener('pointermove', (e) => {
        fx = e.clientX + 24; fy = e.clientY - 120;
        if (!raf) raf = requestAnimationFrame(() => {
          float.style.setProperty('--fx', `${fx}px`); float.style.setProperty('--fy', `${fy}px`); raf = 0;
        });
      });
    });
  }

  /* magnetic buttons */
  if (fine && !reduce) {
    $$('.mag').forEach(b => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }
})();
