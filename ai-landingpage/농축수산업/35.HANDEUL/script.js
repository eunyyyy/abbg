(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 토스트 ---------- */
  const toast = $('#toast');
  let toastT;
  const say = (msg) => {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove('is-on'), 2400);
  };

  /* ---------- GNB / 모바일 메뉴 ---------- */
  const gnb = $('#gnb'), burger = $('#burger'), drawer = $('#drawer');
  const setDrawer = (open) => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    drawer.hidden = !open;
    gnb.classList.toggle('is-solid', open || scrolled);
  };
  burger.addEventListener('click', () => setDrawer(drawer.hidden));
  $$('a', drawer).forEach(a => a.addEventListener('click', () => setDrawer(false)));

  /* ---------- 히어로 관찰: GNB 배경, 맨 위로 버튼 ---------- */
  let scrolled = false;
  const toTop = $('#toTop');
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:60vh;pointer-events:none';
  $('#top').appendChild(sentinel);
  new IntersectionObserver(([e]) => {
    scrolled = !e.isIntersecting;
    gnb.classList.toggle('is-solid', scrolled || !drawer.hidden);
    toTop.classList.toggle('is-on', scrolled);
  }).observe(sentinel);
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  /* ---------- 리빌 + 히어로 패럴랙스 (rAF 한 루프) ---------- */
  const hero = $('#top');
  let pending = $$('.rv');
  $$('.goods .good').forEach((g, i) => g.style.setProperty('--i', i % 4));
  const tick = () => {
    const vh = innerHeight;
    if (pending.length) {
      pending = pending.filter(el => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.9 && r.bottom > 0) {
          el.classList.add('is-in');
          if (el.classList.contains('coupon__stage')) el.classList.add('is-in');
          return false;
        }
        return true;
      });
    }
    if (!reduce) {
      const r = hero.getBoundingClientRect();
      const p = Math.min(Math.max(-r.top / r.height, 0), 1);
      hero.style.setProperty('--hp', p.toFixed(4));
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  /* ---------- 쿠폰 ---------- */
  const ticket = $('#ticket'), ticketBtn = $('#ticketBtn');
  ticketBtn.addEventListener('click', () => {
    if (ticket.classList.contains('is-got')) { say('이미 받은 쿠폰이에요. 주문할 때 자동으로 적용돼요.'); return; }
    ticket.classList.add('is-got');
    $('.ticket__stubTxt', ticket).textContent = '발급 완료';
    $('i', ticketBtn).className = 'ph-bold ph-check-circle';
    say('쿠폰이 발급됐어요. 14일 안에 사용해 주세요.');
  });

  /* ---------- 패키지 캐러셀 ---------- */
  const rail = $('#rail'), prev = $('#prev'), next = $('#next');
  const step = () => {
    const c = $('.pk', rail);
    return c.getBoundingClientRect().width + parseFloat(getComputedStyle($('.rail__track')).columnGap || 26);
  };
  const syncArrows = () => {
    const max = rail.scrollWidth - rail.clientWidth - 4;
    prev.disabled = rail.scrollLeft <= 4;
    next.disabled = rail.scrollLeft >= max;
  };
  prev.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }));
  next.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }));
  rail.addEventListener('scroll', syncArrows, { passive: true });
  addEventListener('resize', syncArrows);
  rail.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev.click(); }
  });
  // 마우스 드래그
  let drag = null;
  rail.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, s: rail.scrollLeft, moved: false };
  });
  addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; rail.classList.add('is-drag'); }
    if (drag.moved) rail.scrollLeft = drag.s - dx;
  });
  addEventListener('pointerup', () => {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    if (moved) {
      rail.classList.remove('is-drag');
      const w = step();
      rail.scrollTo({ left: Math.round(rail.scrollLeft / w) * w, behavior: reduce ? 'auto' : 'smooth' });
    }
  });
  syncArrows();

  const showPack = (id) => {
    const card = document.getElementById(id);
    if (!card) return;
    $('#lineup').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    const left = card.offsetLeft - parseFloat(getComputedStyle($('.rail__track')).paddingLeft);
    setTimeout(() => {
      rail.scrollTo({ left, behavior: reduce ? 'auto' : 'smooth' });
      card.classList.remove('is-flash'); void card.offsetWidth; card.classList.add('is-flash');
    }, reduce ? 0 : 450);
  };

  /* ---------- 부위 가이드 ---------- */
  const CUTS = {
    beef: {
      label: '한우', chart: 'img/illust/chart-beef.webp', w: 1400, h: 825, alt: '한우 부위 지도', first: 'deungsim',
      list: [
        { id: 'moksim', name: '목심', x: 39, y: 21.9, desc: '운동량이 많아 쫄깃하고, 지방이 고르게 박혀 구이와 불고기에 두루 좋아요.', dish: ['구이', '불고기', '샤브샤브'] },
        { id: 'deungsim', name: '등심', x: 63, y: 19.2, desc: '마블링이 촘촘해 굽기만 해도 고소한 육즙이 가득해요.', dish: ['스테이크', '구이'], pack: 'pk-ribeye' },
        { id: 'ansim', name: '안심', x: 73.4, y: 21, desc: '가장 연한 부위예요. 지방이 적어 담백하고 부드러워요.', dish: ['스테이크', '안심 구이'] },
        { id: 'chaekkeut', name: '채끝', x: 62.5, y: 35.6, desc: '등심과 안심 사이 부위로, 결이 곱고 육향이 진해요.', dish: ['스테이크', '구이'], pack: 'pk-striploin' },
        { id: 'galbi', name: '갈비', x: 51.6, y: 30.4, desc: '뼈 주변 살이 달큰하고 진해서 찜과 구이 모두 잘 어울려요.', dish: ['갈비찜', 'LA갈비', '갈비탕'], pack: 'pk-galbi' },
        { id: 'udun', name: '우둔', x: 85.2, y: 29.5, desc: '지방이 적고 살결이 고와 육회와 장조림에 알맞아요.', dish: ['육회', '장조림', '불고기'], pack: 'pk-udun' },
        { id: 'seoldo', name: '설도', x: 74.3, y: 43.8, desc: '살코기 위주라 담백하고, 산적과 육포에 잘 어울려요.', dish: ['산적', '육포', '불고기'] },
        { id: 'yangji', name: '양지', x: 53, y: 53.4, desc: '오래 끓일수록 국물 맛이 깊어지는 부위예요.', dish: ['국거리', '수육', '육개장'] },
        { id: 'satae', name: '사태', x: 38.8, y: 63.4, desc: '힘줄이 많아 오래 삶으면 쫀득하게 풀어져요.', dish: ['수육', '찜', '장조림'] }
      ]
    },
    pork: {
      label: '한돈', chart: 'img/illust/chart-pork.webp', w: 1400, h: 766, alt: '한돈 부위 지도', first: 'samgyeop',
      list: [
        { id: 'moksim', name: '목심', x: 45.2, y: 18.8, desc: '기름과 살코기가 고루 섞여 두툼하게 구우면 촉촉해요.', dish: ['구이', '수육', '보쌈'], pack: 'pk-moksal' },
        { id: 'deungsim', name: '등심', x: 63.2, y: 18.8, desc: '지방이 적고 결이 고와 돈가스와 탕수육에 좋아요.', dish: ['돈가스', '탕수육', '잡채'] },
        { id: 'galbi', name: '갈비', x: 55.2, y: 40.4, desc: '뼈 사이 살이 쫄깃해 양념구이와 찜에 잘 맞아요.', dish: ['양념갈비', '갈비찜'] },
        { id: 'ansim', name: '안심', x: 67.2, y: 40.4, desc: '돼지고기 가운데 가장 연하고 담백한 부위예요.', dish: ['안심까스', '장조림'] },
        { id: 'dwitdari', name: '뒷다리살', x: 84.2, y: 39, desc: '살코기가 많아 찌개와 불고기용으로 알뜰해요.', dish: ['제육볶음', '찌개', '장조림'] },
        { id: 'gaseum', name: '가슴살', x: 44.2, y: 53.2, desc: '앞다리 아래쪽 부위로, 쫄깃해서 수육과 찌개에 좋아요.', dish: ['수육', '김치찌개'] },
        { id: 'samgyeop', name: '삼겹살', x: 62.4, y: 63.2, desc: '살과 지방이 세 겹으로 겹친 대표 구이 부위예요.', dish: ['구이', '수육', '보쌈'], pack: 'pk-samgyeop' }
      ]
    }
  };
  const chart = $('#chart'), chartImg = $('#chartImg'), spots = $('#spots'), pieces = $('#pieces');
  const card = $('#cutcard'), cutImg = $('#cutImg'), cutKind = $('#cutKind'), cutName = $('#cutName'), cutDesc = $('#cutDesc'), cutDish = $('#cutDish'), cutLink = $('#cutLink');
  let kind = 'beef', cur = null;
  // 미리 불러오기
  Object.entries(CUTS).forEach(([k, v]) => { new Image().src = v.chart; v.list.forEach(c => { new Image().src = `img/cut/${k}-${c.id}.webp`; }); });

  const select = (id, instant) => {
    const data = CUTS[kind], c = data.list.find(x => x.id === id);
    if (!c || cur === id) return;
    cur = id;
    $$('.spot', spots).forEach(s => s.classList.toggle('is-on', s.dataset.id === id));
    $$('.piece', pieces).forEach(p => { const on = p.dataset.id === id; p.classList.toggle('is-on', on); p.setAttribute('aria-pressed', on); });
    const apply = () => {
      cutImg.src = `img/cut/${kind}-${c.id}.webp`;
      cutImg.alt = `${data.label} ${c.name} 일러스트`;
      cutKind.textContent = data.label;
      cutName.textContent = c.name;
      cutDesc.textContent = c.desc;
      cutDish.innerHTML = c.dish.map(d => `<li>${d}</li>`).join('');
      if (c.pack) { cutLink.innerHTML = '패키지에서 보기 <i class="ph-bold ph-arrow-right"></i>'; cutLink.dataset.pack = c.pack; cutLink.href = '#lineup'; }
      else { cutLink.innerHTML = '오늘의 정육 보기 <i class="ph-bold ph-arrow-right"></i>'; delete cutLink.dataset.pack; cutLink.href = '#today'; }
      card.classList.remove('is-swap');
    };
    if (instant || reduce) apply();
    else { card.classList.add('is-swap'); setTimeout(apply, 220); }
  };

  const build = (k, instant) => {
    kind = k; cur = null;
    const data = CUTS[k];
    const draw = () => {
      chart.dataset.kind = k;
      chartImg.src = data.chart; chartImg.alt = data.alt; chartImg.width = data.w; chartImg.height = data.h;
      spots.innerHTML = data.list.map(c => {
        const wide = c.name.length >= 3 ? 'style="--w:15%;' : 'style="--w:11%;';
        const hh = k === 'pork' ? '--hh:10%;' : '--hh:9%;';
        return `<button class="spot" type="button" data-id="${c.id}" ${wide}${hh}left:${c.x}%;top:${c.y}%"><span>${c.name}</span></button>`;
      }).join('');
      pieces.innerHTML = data.list.map(c => `<li><button class="piece" type="button" data-id="${c.id}" aria-pressed="false"><img src="img/cut/${k}-${c.id}.webp" alt="" loading="lazy">${c.name}</button></li>`).join('');
      select(data.first, true);
      chart.classList.remove('is-swap');
    };
    if (instant || reduce) draw();
    else { chart.classList.add('is-swap'); setTimeout(draw, 300); }
  };
  spots.addEventListener('click', e => { const b = e.target.closest('.spot'); if (b) select(b.dataset.id); });
  pieces.addEventListener('click', e => { const b = e.target.closest('.piece'); if (b) select(b.dataset.id); });
  $$('.tab').forEach(t => t.addEventListener('click', () => {
    if (t.dataset.kind === kind) return;
    $$('.tab').forEach(x => { const on = x === t; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', on); });
    build(t.dataset.kind);
  }));
  cutLink.addEventListener('click', e => {
    if (cutLink.dataset.pack) { e.preventDefault(); showPack(cutLink.dataset.pack); }
  });
  build('beef', true);

  /* ---------- 오늘의 정육 필터 ---------- */
  const goods = $$('.good');
  $$('.filter').forEach(f => f.addEventListener('click', () => {
    $$('.filter').forEach(x => { const on = x === f; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
    const v = f.dataset.f;
    goods.forEach(g => g.classList.add('is-out'));
    setTimeout(() => {
      goods.forEach(g => {
        const show = v === 'all' || g.dataset.c === v;
        g.hidden = !show;
        g.classList.add('is-in');
      });
      requestAnimationFrame(() => requestAnimationFrame(() => goods.forEach(g => g.classList.remove('is-out'))));
    }, reduce ? 0 : 260);
  }));
})();
