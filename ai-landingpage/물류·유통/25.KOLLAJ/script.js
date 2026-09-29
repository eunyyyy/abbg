/* KOLLAJ interactions
   - IntersectionObserver reveals (word, block, stagger)
   - one rAF loop that only computes scrubbed sections currently near the viewport
   - no scroll event listeners */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => innerWidth < 768;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- split words ---------- */
  function splitWords(root, cls, counter) {
    [...root.childNodes].forEach(node => {
      if (node.nodeType === 3) {
        const parts = node.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span');
          s.className = cls; s.textContent = p; s.style.setProperty('--i', counter.n++);
          frag.appendChild(s);
        });
        node.replaceWith(frag);
      } else if (node.nodeType === 1 && node.tagName === 'I') {
        node.classList.add(cls); node.style.setProperty('--i', counter.n++);
      } else if (node.nodeType === 1 && node.tagName !== 'BR') {
        splitWords(node, cls, counter);
      }
    });
  }
  $$('[data-words]').forEach(el => splitWords(el, 'w', { n: 0 }));
  const stText = $('#statementText');
  if (stText) splitWords(stText, 'sw', { n: 0 });
  const stWords = stText ? $$('.sw', stText) : [];

  $$('.reveal-stagger').forEach(g => [...g.children].forEach((c, i) => c.style.setProperty('--i', i)));
  $$('.cascade__card').forEach((c, i) => c.style.setProperty('--i', i));

  /* ---------- community cloud ---------- */
  const avatars = Array.from({ length: 20 }, (_, i) => `img/ava_${String(i + 1).padStart(2, '0')}.jpg`);
  const extra = ['img/look_01.jpg', 'img/look_03.jpg', 'img/look_06.jpg', 'img/hero_02.jpg', 'img/show_05.jpg', 'img/story_03.jpg'];
  const pool = avatars.concat(extra);
  function fillRow(row, offset) {
    if (!row) return;
    const n = isMobile() ? 9 : 16;
    for (let i = 0; i < n; i++) {
      const li = document.createElement('li');
      const seed = Math.sin((i + 1) * (offset + 3.7)) * 10000;
      const r = seed - Math.floor(seed);
      const size = isMobile() ? 46 + Math.round(r * 22) : 62 + Math.round(r * 30);
      li.style.setProperty('--s', size + 'px');
      li.style.setProperty('--x', (i / n * 100 + r * 3) + '%');
      li.style.setProperty('--y', Math.round(r * 62) + '%');
      li.style.setProperty('--dl', Math.round(r * 500) + 'ms');
      const img = document.createElement('img');
      img.src = pool[(i * 3 + offset * 7) % pool.length]; img.alt = ''; img.loading = 'lazy';
      li.appendChild(img); row.appendChild(li);
    }
  }
  fillRow($('.cloud__row--top'), 1);
  fillRow($('.cloud__row--bottom'), 2);


  /* ---------- reveal observer ---------- */
  const revealSel = '[data-words],.reveal,.reveal-stagger,.cascade,.cloud';
  const revealEls = $$(revealSel);
  const show = el => el.classList.add('is-in');
  if (reduce) revealEls.forEach(show);
  else {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
    }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(el => io.observe(el));
    // safety sweep for instant jumps (anchor links, restored scroll) where IO skipped a frame
    setInterval(() => revealEls.forEach(el => {
      if (el.classList.contains('is-in')) return;
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * .95 && r.bottom > 0) show(el);
    }), 600);
  }

  /* ---------- GNB: drawer + active link ---------- */
  const burger = $('.gnb__burger'), drawer = $('#drawer');
  burger?.addEventListener('click', () => {
    const open = drawer.hidden;
    drawer.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.innerHTML = open ? '<i class="ph ph-x"></i>' : '<i class="ph ph-list"></i>';
  });
  $$('#drawer a').forEach(a => a.addEventListener('click', () => {
    drawer.hidden = true; burger.setAttribute('aria-expanded', 'false'); burger.innerHTML = '<i class="ph ph-list"></i>';
  }));
  const navLinks = $$('.gnb__nav a');
  const navIO = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach(a => { const t = $(a.getAttribute('href')); if (t) navIO.observe(t); });

  /* ---------- drag strip ---------- */
  const strip = $('#strip'), bar = $('#stripBar');
  if (strip) {
    let down = false, moved = false, sx = 0, sl = 0;
    strip.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; sx = e.clientX; sl = strip.scrollLeft;
    });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 5) { moved = true; strip.classList.add('is-drag'); }
      if (moved) strip.scrollLeft = sl - dx;
    });
    addEventListener('pointerup', () => { down = false; strip.classList.remove('is-drag'); });
    strip.addEventListener('dragstart', e => e.preventDefault());
    strip.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    strip.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') strip.scrollBy({ left: 300, behavior: 'smooth' });
      if (e.key === 'ArrowLeft') strip.scrollBy({ left: -300, behavior: 'smooth' });
    });
  }

  if (reduce) return;

  /* ---------- scrub registry ---------- */
  const active = new Set();
  const scrubIO = new IntersectionObserver(entries => entries.forEach(e => {
    e.isIntersecting ? active.add(e.target) : active.delete(e.target);
  }), { rootMargin: '25% 0px 25% 0px' });
  $$('[data-scrub]').forEach(el => scrubIO.observe(el));

  /* hero fan */
  const hero = $('.hero'), fanCards = $$('.fan__card'), fanTags = $$('.fan__tag');
  const t0 = performance.now();
  let tagsShown = false;
  function heroFrame(now) {
    const t = (now - t0) / 1000;
    const vh = innerHeight;
    const collapse = clamp(scrollY / (vh * .7));
    const w = fanCards[0]?.offsetWidth || 180;
    const gap = isMobile() ? w * .36 : w * .64;
    const fan = ease(clamp((t - 1.05) / .9)) * (1 - collapse);
    fanCards.forEach((c, i) => {
      const k = i - 3;
      const arrive = ease(clamp((t - .15 - Math.abs(k) * .07) / .75));
      const flyY = (1 - arrive) * vh * .7, flyR = (1 - arrive) * (k % 2 ? 24 : -30);
      const x = k * gap * fan;
      const y = Math.abs(k) * 10 * fan + flyY + collapse * 60;
      const r = (k * 4.5) * fan + (k ? (k % 2 ? 3 : -4) : 0) * (1 - fan) + flyR;
      const s = 1 - collapse * .22;
      c.style.transform = `translate3d(${x}px,${y}px,0) rotate(${r}deg) scale(${s})`;
      c.style.zIndex = 10 - Math.abs(k);
      c.style.opacity = clamp(arrive * 3);
    });
    if (!tagsShown && t > 1.8) { tagsShown = true; fanTags.forEach((g, i) => { g.style.animationDelay = i * 160 + 'ms'; g.classList.add('pop'); }); }
    fanTags.forEach(g => { g.style.translate = `0 ${collapse * 40}px`; g.style.opacity = tagsShown ? 1 - collapse * 1.4 : 0; });
  }

  /* statement */
  const statement = $('#statement');
  const sCards = $$('.sstack__card');
  const stackEl = $('.statement__stack');
  const diagAll = [$('.diag__note'), ...$$('.diag__card')].filter(Boolean);
  const slots = [
    { x: 0, y: 0, r: -3, s: 1 },
    { x: 10, y: -10, r: 5, s: .95 },
    { x: -12, y: -16, r: -9, s: .9 }
  ];
  function statementFrame() {
    const r = statement.getBoundingClientRect();
    const vh = innerHeight;
    const p = clamp(-r.top / (r.height - vh));
    // word fill
    const on = Math.round(clamp(p / .42) * stWords.length);
    stWords.forEach((w, i) => w.classList.toggle('on', i < on));
    // stack shuffle
    const step = Math.floor(clamp(p / .48) * 5) % 3;
    sCards.forEach((c, i) => {
      const pos = (i - step + 3) % 3, sl = slots[pos];
      c.style.transform = `translate(${sl.x}px,${sl.y}px) rotate(${sl.r}deg) scale(${sl.s})`;
      c.style.zIndex = 3 - pos;
    });
    // phase 2: text leaves, cards cascade diagonally
    const q = clamp((p - .5) / .34);
    stText.style.setProperty('--to', 1 - ease(clamp(q * 1.6)));
    stText.style.setProperty('--ty', (-70 * ease(clamp(q * 1.6))) + 'px');
    stackEl.style.setProperty('--so', 1 - clamp(q * 2.2));
    stackEl.style.setProperty('--sy', (-40 * q) + 'px');
    const mob = isMobile();
    const x0 = mob ? -.3 : -.34, x1 = mob ? .3 : .32, y0 = mob ? -.3 : -.3, y1 = mob ? .3 : .27;
    const diagEls = diagAll.filter(el => el.offsetParent !== null || getComputedStyle(el).display !== 'none');
    const n = diagEls.length - 1;
    diagEls.forEach((el, j) => {
      const u = j / n;
      const k = ease(clamp(q * 1.35 - j * .05));
      const tx = lerp(0, lerp(x0, x1, u) * innerWidth, k);
      const ty = lerp(vh * .62, lerp(y0, y1, u) * vh, k);
      const rot = lerp(12 - j * 4, 0, k);
      el.style.transform = `translate(-50%,-50%) translate(${tx}px,${ty}px) rotate(${rot}deg)`;
      el.style.opacity = clamp(q * 4 - .6 - j * .2);
      el.style.zIndex = j;
    });
  }

  /* gateway */
  const gwMedia = $('.gateway__media'), gwImg = gwMedia?.querySelector('img');
  function gatewayFrame() {
    const r = gwMedia.getBoundingClientRect(), vh = innerHeight;
    const p = clamp((vh - r.top) / (vh * .85));
    gwMedia.style.setProperty('--gx', (6 * (1 - ease(p))).toFixed(2) + '%');
    const par = clamp((vh - r.top) / (vh + r.height));
    gwImg.style.setProperty('--gy', (-12 + par * 12).toFixed(2) + '%');
  }

  /* cloud rows */
  const cloud = $('.cloud'), rowTop = $('.cloud__row--top'), rowBot = $('.cloud__row--bottom');
  function cloudFrame() {
    const r = cloud.getBoundingClientRect(), vh = innerHeight;
    const p = clamp((vh - r.top) / (vh + r.height));
    rowTop.style.setProperty('--cx', ((.5 - p) * 14) + 'vw');
    rowBot.style.setProperty('--cx', ((p - .5) * 14) + 'vw');
  }

  /* bento offset column */
  const bentoCol = $('.bento__col--offset');
  function bentoFrame() {
    if (isMobile()) { bentoCol.style.setProperty('--by', '0px'); return; }
    const r = bentoCol.getBoundingClientRect(), vh = innerHeight;
    const p = clamp((vh - r.top) / (vh + r.height));
    bentoCol.style.setProperty('--by', ((.5 - p) * 90).toFixed(1) + 'px');
  }

  /* focus grid */
  const focus = $('.focus'), fCard = $('.focus__card');
  const fItems = $$('.focus__grid > li');
  function focusFrame() {
    const r = focus.getBoundingClientRect(), vh = innerHeight;
    const p = clamp(-r.top / (r.height - vh));
    const mob = isMobile();
    const cols = mob ? 3 : 5;
    const visible = fItems.filter(li => li.offsetParent !== null);
    const ci = visible.findIndex(li => li.classList.contains('focus__main'));
    const cr = Math.floor(ci / cols), cc = ci % cols;
    fCard.style.setProperty('--fs', lerp(mob ? 2.1 : 2.6, 1.22, ease(clamp(p / .55))).toFixed(3));
    visible.forEach((li, i) => {
      if (i === ci) return;
      const d = Math.hypot(Math.floor(i / cols) - cr, (i % cols) - cc);
      li.style.setProperty('--go', ease(clamp((p - .18 - d * .07) / .26)).toFixed(3));
    });
  }


  function stripFrame() {
    if (!strip || !bar) return;
    const max = strip.scrollWidth - strip.clientWidth;
    const ratio = max > 0 ? strip.scrollLeft / max : 0;
    bar.style.setProperty('--sp', (ratio * 180 * .7) + 'px');
  }

  const map = new Map([
    [statement, statementFrame], [gwMedia, gatewayFrame], [cloud, cloudFrame],
    [bentoCol, bentoFrame], [focus, focusFrame]
  ]);

  function loop(now) {
    if (scrollY < innerHeight * 1.2) heroFrame(now);
    active.forEach(el => map.get(el)?.());
    stripFrame();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
