(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mqMobile = matchMedia('(max-width: 767px)');
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- GNB ---------- */
  const gnb = document.getElementById('gnb');
  const hero = document.querySelector('.hero');
  const burger = document.getElementById('burger');
  const drawer = document.getElementById('drawer');
  const setSolid = on => gnb.classList.toggle('is-solid', on || !drawer.hidden);
  if (hasGsap) {
    ScrollTrigger.create({ trigger: hero, start: 'bottom top+=80', onEnter: () => setSolid(true), onLeaveBack: () => setSolid(false) });
  } else {
    new IntersectionObserver(([e]) => setSolid(!e.isIntersecting), { rootMargin: '-80px 0px 0px 0px' }).observe(hero);
  }
  const closeDrawer = () => {
    drawer.hidden = true; burger.setAttribute('aria-expanded', 'false');
    burger.innerHTML = '<i class="ph ph-list"></i>'; document.body.style.overflow = '';
    setSolid(hero.getBoundingClientRect().bottom < 80);
  };
  burger.addEventListener('click', () => {
    if (drawer.hidden) {
      drawer.hidden = false; burger.setAttribute('aria-expanded', 'true');
      burger.innerHTML = '<i class="ph ph-x"></i>'; document.body.style.overflow = 'hidden'; setSolid(true);
    } else closeDrawer();
  });
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !drawer.hidden) closeDrawer(); });

  /* ---------- HERO ---------- */
  const card = document.querySelector('.hero__card');
  const syncCardH = () => hero.style.setProperty('--card-h', card.offsetHeight + 'px');
  syncCardH(); addEventListener('resize', syncCardH);

  if (hasGsap && !reduce) {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.hero__word-in', { yPercent: 105, duration: 1.3, ease: 'power4.out' })
      .from('.hero__drop', { yPercent: -70, duration: 1.6, ease: 'elastic.out(1, 0.55)', clearProps: 'transform' }, 0.15)
      .from('[data-hero-in]', { y: 30, opacity: 0, duration: 1, stagger: 0.12 }, 0.6);

    // 컨테이너는 떨어진 위치를 유지하고, 뒤쪽 워드마크만 천천히 내려감
    gsap.to('.hero__word', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------- FIELD VIDEO : fullscreen ---------- */
  const player = document.getElementById('filmPlayer');
  const fv = document.getElementById('filmVideo');
  const filmBtn = document.getElementById('filmBtn');
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  let opened = false;
  const closeFilm = () => {
    if (!opened) return; opened = false;
    fv.pause(); fv.currentTime = 0; player.hidden = true;
    document.body.style.overflow = ''; filmBtn.focus({ preventScroll: true });
  };
  const openFilm = async () => {
    opened = true; player.hidden = false; document.body.style.overflow = 'hidden';
    fv.muted = false; fv.play().catch(() => { fv.muted = true; fv.play().catch(() => {}); });
    try {
      if (player.requestFullscreen) await player.requestFullscreen();
      else if (player.webkitRequestFullscreen) player.webkitRequestFullscreen();
      else if (fv.webkitEnterFullscreen) fv.webkitEnterFullscreen();   // iPhone Safari
    } catch (e) { /* 전체화면이 막힌 환경에서는 고정 오버레이로 재생 */ }
  };
  filmBtn.addEventListener('click', openFilm);
  // 전체화면을 빠져나오거나 최소화하면 영상이 사라짐
  ['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, () => { if (!fsEl()) closeFilm(); }));
  fv.addEventListener('webkitendfullscreen', closeFilm);
  fv.addEventListener('ended', () => { if (fsEl()) document.exitFullscreen?.(); closeFilm(); });
  document.getElementById('filmClose').addEventListener('click', () => { if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document); else closeFilm(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && opened && !fsEl()) closeFilm(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && opened) { if (fsEl()) document.exitFullscreen?.(); closeFilm(); } });

  /* ---------- REVEAL ---------- */
  const revealEls = [...document.querySelectorAll('[data-reveal]')];
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  revealEls.forEach(el => io.observe(el));
  // 빠른 스크롤이나 즉시 캡처 때 IO가 프레임을 놓치는 경우를 위한 보정
  const sweep = () => {
    const vh = innerHeight;
    revealEls.forEach(el => { if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < vh * 0.95) el.classList.add('is-in'); });
    requestAnimationFrame(sweep);
  };
  requestAnimationFrame(sweep);

  /* ---------- STATEMENT FILL ---------- */
  const st = document.getElementById('statement');
  st.innerHTML = st.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  const words = [...st.querySelectorAll('.w')];
  if (hasGsap && !reduce) {
    ScrollTrigger.create({
      trigger: st, start: 'top 80%', end: 'bottom 45%', scrub: true,
      onUpdate: self => { const n = Math.round(self.progress * words.length); words.forEach((w, i) => w.classList.toggle('is-lit', i < n)); }
    });
  } else words.forEach(w => w.classList.add('is-lit'));

  /* ---------- COUNT UP ---------- */
  const fmt = (v, d) => d ? v.toFixed(d) : Math.round(v).toLocaleString('ko-KR');
  const cio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, to = parseFloat(el.dataset.count), d = +el.dataset.dec;
      cio.unobserve(el);
      if (reduce) { el.textContent = fmt(to, d); return; }
      const t0 = performance.now(), dur = 1600;
      const step = t => { const k = Math.min(1, (t - t0) / dur), e2 = 1 - Math.pow(1 - k, 4); el.textContent = fmt(to * e2, d); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(el => cio.observe(el));

  /* ---------- SERVICE highlight follows hover ---------- */
  const svcs = [...document.querySelectorAll('.svc')];
  const defaultSvc = svcs.find(s => s.classList.contains('is-on'));
  svcs.forEach(s => s.addEventListener('mouseenter', () => { svcs.forEach(x => x.classList.toggle('is-on', x === s)); }));
  document.querySelector('.service__grid').addEventListener('mouseleave', () => svcs.forEach(x => x.classList.toggle('is-on', x === defaultSvc)));

  /* ---------- HUB : scroll-pinned scenes ---------- */
  const scenes = [...document.querySelectorAll('.hub__stage .scene')];
  const steps = [...document.querySelectorAll('.hub__steps li')];
  const cards = [...document.querySelectorAll('.hub__cards .hub-card')];
  let cur = -1;
  const setHub = i => {
    if (i === cur) return; cur = i;
    [scenes, steps, cards].forEach(list => list.forEach((el, k) => el.classList.toggle('is-on', k === i)));
  };
  setHub(0);
  if (hasGsap) {
    ScrollTrigger.create({
      trigger: '.hub__runway', start: 'top top', end: 'bottom bottom',
      onUpdate: self => setHub(Math.min(scenes.length - 1, Math.floor(self.progress * scenes.length * 0.999)))
    });
  }
  // 모바일 : 장면과 카드를 세로로 나열
  const side = document.querySelector('.hub__side');
  const mWrap = document.createElement('div'); mWrap.className = 'hub-m';
  scenes.forEach((sc, k) => {
    const item = document.createElement('div'); item.className = 'hub-m__item'; item.setAttribute('data-reveal', '');
    const s2 = sc.cloneNode(true); s2.querySelector('img').loading = 'lazy';
    item.append(s2, cards[k].cloneNode(true)); mWrap.append(item);
    revealEls.push(item); io.observe(item);
  });
  side.append(mWrap);

  /* ---------- TRACK form ---------- */
  const tf = document.getElementById('trackForm');
  const tNo = document.getElementById('trackNo'), tErr = document.getElementById('trackErr'), tRes = document.getElementById('trackResult');
  const routes = {
    '해상 운송': [['평택항 출항', '10월 14일 09:20', 'done'], ['싱가포르항 환적', '10월 19일 16:05', 'done'], ['인도양 운항 중', '현재 위치', 'now'], ['로테르담항 도착 예정', '11월 2일', '']],
    '항공 운송': [['인천 항공화물센터 반입', '10월 20일 13:40', 'done'], ['프랑크푸르트행 탑재', '10월 20일 23:10', 'done'], ['현지 통관 진행 중', '현재 단계', 'now'], ['수하인 인도 예정', '10월 22일', '']],
    '철도 운송': [['의왕 철도기지 출발', '10월 9일 06:30', 'done'], ['롄윈강 철도 환적', '10월 12일 11:15', 'done'], ['카자흐스탄 구간 운행 중', '현재 위치', 'now'], ['알마티역 도착 예정', '10월 25일', '']],
    '육상 운송': [['평택 보세창고 출고', '10월 21일 07:50', 'done'], ['경부고속도로 이동 중', '현재 위치', 'now'], ['구미 공장 도착 예정', '10월 21일 13:00', '']]
  };
  tNo.addEventListener('input', () => { tf.querySelector('.field').classList.remove('is-err'); tErr.textContent = ''; });
  tf.addEventListener('submit', e => {
    e.preventDefault();
    const v = tNo.value.trim();
    if (v.length < 6) {
      tf.querySelector('.field').classList.add('is-err');
      tErr.textContent = v ? '번호를 6자 이상 입력해 주세요.' : 'B/L 또는 컨테이너 번호를 입력해 주세요.';
      tRes.innerHTML = ''; tNo.focus(); return;
    }
    tRes.innerHTML = '<div class="sk"></div><div class="sk"></div><div class="sk"></div>';
    setTimeout(() => {
      const r = routes[document.getElementById('trackMode').value];
      tRes.innerHTML = '<ol class="tl">' + r.map(([a, b, c]) => `<li class="${c}"><strong>${a}</strong><span>${b}</span></li>`).join('') + '</ol>';
    }, 700);
  });

  /* ---------- CONTACT form ---------- */
  const cf = document.getElementById('contactForm'), cMsg = document.getElementById('contactMsg');
  cf.addEventListener('submit', e => {
    e.preventDefault();
    const n = cf.cName.value.trim(), who = cf.cPerson.value.trim(), t = cf.cTel.value.replace(/\D/g, ''), m = cf.cMail.value.trim(), body = cf.cMsg.value.trim();
    cMsg.classList.remove('is-err');
    const err = !n ? '회사명을 입력해 주세요.' : !who ? '담당자명을 입력해 주세요.' : t.length < 9 ? '연락처를 정확히 입력해 주세요.'
      : (m && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m)) ? '이메일 형식을 확인해 주세요.' : !body ? '문의 내용을 입력해 주세요.' : '';
    if (err) { cMsg.classList.add('is-err'); cMsg.textContent = err; return; }
    cMsg.textContent = `${who}님, ${n}의 견적 문의가 접수되었습니다. 영업일 기준 4시간 안에 연락드리겠습니다.`;
    cf.reset();
  });

  addEventListener('load', () => hasGsap && ScrollTrigger.refresh());
})();
