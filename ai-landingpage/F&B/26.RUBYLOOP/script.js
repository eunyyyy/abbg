/* Rubyloop | interactions */
(() => {
  const doc = document.documentElement;
  doc.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.querySelector('.hero');
  const gnb = document.getElementById('gnb');

  /* hero load-in */
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('is-loaded')));

  /* GNB: solid once the hero leaves the top */
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:calc(100% - 72px);pointer-events:none;';
  hero.appendChild(sentinel);
  new IntersectionObserver(([e]) => gnb.classList.toggle('is-solid', !e.isIntersecting)).observe(sentinel);

  /* mobile drawer (sibling of gnb) */
  const toggle = document.querySelector('.gnb__toggle');
  const drawer = document.getElementById('drawer');
  const setDrawer = (open) => {
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    drawer.hidden = !open;
    gnb.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setDrawer(toggle.getAttribute('aria-expanded') !== 'true'));
  drawer.addEventListener('click', (e) => { if (e.target.closest('a')) setDrawer(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setDrawer(false); });
  matchMedia('(min-width:768px)').addEventListener('change', (m) => { if (m.matches) setDrawer(false); });

  /* reveal */
  const reveals = [...document.querySelectorAll('[data-reveal], .footer__word')];
  document.querySelectorAll('.footer__word span').forEach((s, i) => s.style.setProperty('--i', i));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  reveals.forEach((el) => io.observe(el));
  /* fallback sweep: covers instant jumps (anchor links, full-page capture) */
  const sweep = () => {
    const vh = innerHeight;
    reveals.forEach((el) => {
      if (el.classList.contains('is-in')) return;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.95 && r.bottom > 0) el.classList.add('is-in');
    });
  };

  /* count up */
  const counters = document.querySelectorAll('[data-count]');
  const fmt = (v, d) => d ? v.toFixed(d) : Math.round(v).toLocaleString('ko-KR');
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target, to = parseFloat(el.dataset.count), d = +el.dataset.dec || 0;
      cio.unobserve(el);
      if (reduce) { el.textContent = fmt(to, d); return; }
      const t0 = performance.now(), dur = 1600;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(to * k, d);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.4 });
  counters.forEach((c) => cio.observe(c));

  /* hero parallax (pointer + scroll) and "made" side donuts rotating with scroll */
  const layers = [...hero.querySelectorAll('[data-depth]')];
  const made = document.querySelector('.made');
  const sides = made ? [...made.querySelectorAll('.made__side')] : [];
  let px = 0, py = 0, cx = 0, cy = 0, heroOn = true, madeOn = false;
  new IntersectionObserver(([e]) => { heroOn = e.isIntersecting; }).observe(hero);
  if (made) new IntersectionObserver(([e]) => { madeOn = e.isIntersecting; }).observe(made);
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width - 0.5;
      py = (e.clientY - r.top) / r.height - 0.5;
    });
    hero.addEventListener('pointerleave', () => { px = 0; py = 0; });
  }
  const mobile = matchMedia('(max-width:767px)');
  const tick = (t) => {
    sweep();
    if (!reduce) {
      cx += (px - cx) * 0.08; cy += (py - cy) * 0.08;
      const sy = scrollY;
      if (heroOn) {
        layers.forEach((el, i) => {
          const d = parseFloat(el.dataset.depth);
          const bob = el.classList.contains('berry') ? Math.sin(t / 900 + i * 1.7) * 10 : 0;
          const rot = el.classList.contains('berry') ? Math.sin(t / 1400 + i) * 6 : cx * 6 * d;
          el.style.transform = `translate3d(${cx * -40 * d}px, ${cy * -30 * d + sy * 0.18 * d + bob}px, 0) rotate(${rot}deg)`;
        });
      }
      if (madeOn) {
        const r = made.getBoundingClientRect();
        const p = (innerHeight - r.top) / (innerHeight + r.height) - 0.5;
        const [l, rr] = sides;
        if (mobile.matches) {
          l.style.transform = `translate(-18%, 20%) rotate(${p * -40}deg)`;
          rr.style.transform = `translate(16%, 20%) rotate(${p * 40}deg)`;
        } else {
          l.style.transform = `translate(-32%, calc(-50% + ${p * -80}px)) rotate(${p * -50}deg)`;
          rr.style.transform = `translate(30%, calc(-50% + ${p * 80}px)) rotate(${p * 50}deg)`;
        }
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  /* drag to scroll strips (native scroll + snap, no arrows) */
  document.querySelectorAll('[data-drag]').forEach((el) => {
    let down = false, sx = 0, sl = 0, moved = 0;
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = 0; sx = e.clientX; sl = el.scrollLeft;
    });
    addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 4) { el.classList.add('is-dragging'); el.scrollLeft = sl - dx; }
    });
    addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (el.classList.contains('is-dragging')) {
        const cards = [...el.children];
        const base = el.getBoundingClientRect().left;
        const near = cards.reduce((a, c) => Math.abs(c.getBoundingClientRect().left - base) < Math.abs(a.getBoundingClientRect().left - base) ? c : a, cards[0]);
        el.scrollTo({ left: el.scrollLeft + near.getBoundingClientRect().left - base, behavior: reduce ? 'auto' : 'smooth' });
        setTimeout(() => el.classList.remove('is-dragging'), 420);
      }
    });
    el.addEventListener('click', (e) => { if (moved > 4) { e.preventDefault(); e.stopPropagation(); } }, true);
    el.addEventListener('dragstart', (e) => e.preventDefault());
  });

  /* subscribe form */
  const form = document.querySelector('.form');
  if (form) {
    const input = form.querySelector('input');
    const msg = form.querySelector('.form__msg');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      input.setAttribute('aria-invalid', !ok);
      msg.textContent = ok ? '구독이 완료됐어요. 첫 주문 쿠폰을 메일로 보내 드렸어요.' : '이메일 주소를 다시 확인해 주세요.';
      if (ok) form.reset();
    });
  }
})();
