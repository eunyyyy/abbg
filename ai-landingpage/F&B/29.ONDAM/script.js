/* ONDAM 온담양조 · interactions */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const body = document.body;

  /* ---------- 줄 단위 마스크 텍스트 ---------- */
  $$('[data-lines]').forEach(el => {
    [...el.children].forEach(ch => {
      const inner = document.createElement('span');
      inner.innerHTML = ch.innerHTML;
      ch.innerHTML = '';
      ch.classList.add('ln');
      ch.appendChild(inner);
    });
  });

  /* ---------- 스무스 스크롤 ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.stop();
  }
  const scrollToId = id => {
    const t = id === '#top' ? 0 : $(id);
    if (t === null) return;
    if (lenis) lenis.scrollTo(t, { offset: 0, duration: 1.4 });
    else window.scrollTo({ top: t === 0 ? 0 : t.getBoundingClientRect().top + scrollY, behavior: reduce ? 'auto' : 'smooth' });
  };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2) { e.preventDefault(); return; }
    e.preventDefault();
    closeDrawer();
    scrollToId(id);
  }));

  /* ---------- 모바일 메뉴 ---------- */
  const gnb = $('#gnb'), menuBtn = $('.gnb__menu'), drawer = $('#drawer');
  function closeDrawer() {
    drawer.classList.remove('is-open'); gnb.classList.remove('is-menu');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.innerHTML = '<i class="ph-light ph-list"></i>';
    if (lenis && !body.classList.contains('is-gated')) lenis.start();
  }
  menuBtn.addEventListener('click', () => {
    const open = !drawer.classList.contains('is-open');
    if (!open) return closeDrawer();
    drawer.classList.add('is-open'); gnb.classList.add('is-menu');
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.innerHTML = '<i class="ph-light ph-x"></i>';
    if (lenis) lenis.stop();
  });

  /* ---------- 연령 확인 ---------- */
  const gate = $('#gate');
  let passed = false;
  try { passed = sessionStorage.getItem('ondam-adult') === '1'; } catch (e) {}
  const enter = instant => {
    try { sessionStorage.setItem('ondam-adult', '1'); } catch (e) {}
    gate.classList.remove('is-denied');
    gate.classList.add('is-out');
    setTimeout(() => {
      body.classList.remove('is-gated');
      $('.hero__line').classList.add('is-in');
      if (lenis) lenis.start();
      startHero();
    }, instant ? 0 : 420);
    setTimeout(() => gate.classList.add('is-gone'), instant ? 0 : 1300);
  };
  $('[data-gate="yes"]').addEventListener('click', () => enter(false));
  $('[data-gate="no"]').addEventListener('click', () => gate.classList.add('is-denied'));
  if (passed) { gate.style.transition = 'none'; enter(true); }

  /* ---------- 히어로 컬렉션 슬라이드 ---------- */
  const imgs = $$('.hero__img'), names = $$('.hero__name'), hslides = $$('.hcard__slide'), hdots = $$('.hero__dots .dots__btn');
  let hi = 0, htimer = null;
  const HERO_MS = 6000;
  function goHero(n) {
    if (n === hi) return;
    const prev = hi; hi = (n + imgs.length) % imgs.length;
    names[prev].classList.remove('is-active'); names[prev].classList.add('is-leaving');
    setTimeout(() => names[prev].classList.remove('is-leaving'), 800);
    [imgs, hslides, hdots].forEach(g => { g[prev].classList.remove('is-active'); g[hi].classList.add('is-active'); });
    names[hi].classList.add('is-active');
    restartHero();
  }
  function restartHero() { clearInterval(htimer); if (!reduce) htimer = setInterval(() => goHero(hi + 1), HERO_MS); }
  function startHero() { restartHero(); }
  hdots.forEach((d, i) => d.addEventListener('click', () => goHero(i)));

  /* ---------- 드래그 레일 (무한 루프) ---------- */
  const rails = $$('[data-rail]').map(view => {
    const track = $('.rail__track', view);
    const originals = [...track.children];
    originals.forEach((c, i) => c.style.setProperty('--i', i));
    [0, 1].forEach(() => originals.forEach(c => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); k.querySelectorAll('a').forEach(a => a.tabIndex = -1); track.appendChild(k); }));
    const bar = $('.rail__bar i', view.parentElement);
    const st = { view, track, bar, x: 0, target: 0, v: 0, drag: false, setW: 0, moved: 0 };
    const measure = () => { st.setW = originals.reduce((w, c) => w + c.getBoundingClientRect().width, 0) + 12 * originals.length; };
    measure(); addEventListener('resize', measure);
    let sx = 0, lx = 0, lt = 0;
    view.addEventListener('pointerdown', e => {
      st.drag = true; st.moved = 0; sx = lx = e.clientX; lt = performance.now(); st.v = 0;
      view.classList.add('is-drag');
    });
    addEventListener('pointermove', e => {
      if (!st.drag) return;
      const dx = e.clientX - lx, now = performance.now();
      st.target += dx; st.v = dx / Math.max(1, now - lt) * 16; lx = e.clientX; lt = now;
      st.moved = Math.max(st.moved, Math.abs(e.clientX - sx));
    });
    const up = () => { if (!st.drag) return; st.drag = false; view.classList.remove('is-drag'); st.target += st.v * 14; };
    addEventListener('pointerup', up); addEventListener('pointercancel', up);
    view.addEventListener('click', e => { if (st.moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    view.addEventListener('dragstart', e => e.preventDefault());
    view.addEventListener('wheel', e => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); st.target -= e.deltaX; }
    }, { passive: false });
    return st;
  });

  /* ---------- 이야기 슬라이드 ---------- */
  const feat = $('[data-feat]');
  const fitems = $$('.feat__item', feat), fdots = $$('.dots__btn', feat);
  let fi = 0, ftimer = null;
  function goFeat(n) {
    const prev = fi; fi = (n + fitems.length) % fitems.length;
    if (prev === fi) return;
    fitems[prev].classList.remove('is-active'); fitems[prev].classList.add('is-leaving');
    setTimeout(() => fitems[prev].classList.remove('is-leaving'), 700);
    fitems[fi].classList.add('is-active');
    fdots[prev].classList.remove('is-active'); fdots[fi].classList.add('is-active');
    restartFeat();
  }
  function restartFeat() { clearInterval(ftimer); if (!reduce) ftimer = setInterval(() => goFeat(fi + 1), 4500); }
  fdots.forEach((d, i) => d.addEventListener('click', () => goFeat(i)));
  let fsx = null;
  feat.addEventListener('pointerdown', e => { fsx = e.clientX; });
  addEventListener('pointerup', e => {
    if (fsx === null) return;
    const dx = e.clientX - fsx; fsx = null;
    if (Math.abs(dx) > 50) goFeat(fi + (dx < 0 ? 1 : -1));
  });
  restartFeat();

  /* ---------- 호버 리스트 ---------- */
  $$('[data-hover-list]').forEach(list => {
    $$('a, .store__tab', list).forEach(a => {
      a.addEventListener('mouseenter', () => list.classList.add('is-hovering'));
      a.addEventListener('mouseleave', () => list.classList.remove('is-hovering'));
    });
  });
  $$('.slash').forEach(s => $$('.slash__row', s).forEach((r, i) => r.style.setProperty('--i', i)));

  /* ---------- 매장 지도 ---------- */
  const tabs = $$('.store__tab'), mapEl = $('#storeMap'), info = $('.store__info');
  let map = null, pin = null;
  const initMap = () => {
    if (map || !window.L) return;
    const t = tabs.find(b => b.classList.contains('is-active')) || tabs[0];
    const ll = [+t.dataset.lat, +t.dataset.lng];
    map = L.map(mapEl, { scrollWheelZoom: false, zoomControl: true, attributionControl: true }).setView(ll, 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    pin = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="pin"></div>', iconSize: [22, 22], iconAnchor: [11, 11] }), keyboard: false }).addTo(map);
  };
  const mio = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { initMap(); mio.disconnect(); } }, { rootMargin: '400px 0px' });
  mio.observe(mapEl);
  tabs.forEach(btn => btn.addEventListener('click', () => {
    if (btn.classList.contains('is-active')) return;
    tabs.forEach(b => { const on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on); });
    $('#storeName').textContent = btn.dataset.name;
    $('#storeAddr').textContent = btn.dataset.addr;
    const tel = $('#storeTel'); tel.textContent = btn.dataset.tel; tel.href = 'tel:' + btn.dataset.tel.replace(/-/g, '');
    info.classList.remove('is-swap'); void info.offsetWidth; info.classList.add('is-swap');
    initMap();
    const ll = [+btn.dataset.lat, +btn.dataset.lng];
    pin.setLatLng(ll);
    if (reduce) map.setView(ll, 15); else map.flyTo(ll, 15, { duration: 1.6 });
  }));
  tabs.forEach((b, i) => b.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    n.focus(); n.click();
  }));

  /* ---------- 등장 ---------- */
  const revealTargets = [...$$('.rail'), ...$$('.slash'), ...$$('[data-reveal]'), ...$$('[data-lines]').filter(el => !el.closest('.hero'))];
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: 0.18 });
  revealTargets.forEach(el => io.observe(el));

  /* ---------- 커서 ---------- */
  const cur = $('.cursor');
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  let mx = -100, my = -100, cx = -100, cy = -100;
  if (fine && !reduce) {
    addEventListener('pointermove', e => {
      mx = e.clientX; my = e.clientY; cur.classList.add('is-on');
      const t = e.target;
      cur.classList.toggle('is-drag', !!t.closest('[data-cursor="drag"]') && !t.closest('a,button'));
      cur.classList.toggle('is-link', !!t.closest('a,button'));
    });
    document.addEventListener('mouseleave', () => cur.classList.remove('is-on'));
  }

  /* ---------- 프레임 루프 ---------- */
  const hero = $('.hero'), title = $('.hero__title'), media = $('.hero__media'), hcard = $('.hcard'), catalog = $('.hero__catalog'), dotsEl = $('.hero__dots');
  const brew = $('.brew'), brewBg = $('.brew__bg img'), inset = $('.brew__inset'), brewTitle = $('.brew__title');
  const navLinks = $$('.gnb__nav a');
  const sections = navLinks.map(a => $(a.getAttribute('href') === '#top' ? '#collection' : a.getAttribute('href')));

  function frame(t) {
    if (lenis) lenis.raf(t);
    const vh = innerHeight;

    if (!reduce) {
      /* 히어로: 스테이지 고정 동안 요소별 속도차 */
      const hr = hero.getBoundingClientRect();
      const span = Math.max(1, hr.height - vh);
      const p = clamp(-hr.top / span);
      title.style.transform = `translate3d(0,${-p * vh * 0.55}px,0)`;
      title.style.opacity = clamp(1 - p * 3.6);
      media.style.translate = `0 ${-p * vh * 1.05}px`;
      hcard.style.translate = `0 ${-p * vh * 0.66}px`;
      catalog.style.opacity = dotsEl.style.opacity = body.classList.contains('is-gated') ? '' : clamp(1 - p * 4);

      /* 양조장: 배경은 느리게, 인셋은 뒤처지게 */
      const br = brew.getBoundingClientRect();
      if (br.top < vh && br.bottom > 0) {
        const q = (vh - br.top) / (vh + br.height); // 0 → 1
        brewBg.style.transform = `translate3d(0,${(q - 0.5) * br.height * 0.18}px,0) scale(1.12)`;
        inset.style.transform = `translate3d(0,${(q - 0.35) * br.height * 0.55}px,0)`;
        brewTitle.style.transform = `translate3d(0,${(q - 0.3) * br.height * 0.32}px,0)`;
      }
    }

    /* 헤더 색 반전 */
    const b = brew.getBoundingClientRect();
    const onDark = b.top < 40 && b.bottom > 40;
    gnb.classList.toggle('is-dark', onDark);
    if (fine) {
      const cr = cy;
      cur.classList.toggle('is-dark', b.top < cr && b.bottom > cr);
    }

    /* 현재 섹션 */
    let cur_i = -1;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < vh * 0.45) cur_i = i; });
    navLinks.forEach((a, i) => a.classList.toggle('is-current', i === cur_i && cur_i > 0));

    /* 레일 */
    rails.forEach(st => {
      if (!st.drag) st.target += 0; // 관성은 target 보간으로 처리
      st.x += (st.target - st.x) * (reduce ? 1 : 0.12);
      if (st.setW) {
        let w = st.x % st.setW; if (w > 0) w -= st.setW;
        st.track.style.transform = `translate3d(${w}px,0,0)`;
        if (st.bar) st.bar.style.transform = `translateX(${(-w / st.setW) * (100 / 14) * 86}%)`;
      }
    });

    /* 커서 */
    if (fine && !reduce) {
      cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
      cur.style.transform = `translate3d(${cx}px,${cy}px,0)`;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
