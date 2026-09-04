// NOM Burger & Wings — interactions
(() => {
  'use strict';

  /* ---------- header scroll state ---------- */
  const header = document.getElementById('header');
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile nav toggle ---------- */
  const navToggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');
  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    navToggle.classList.toggle('is-open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      navToggle.classList.remove('is-open');
      document.body.style.overflow = '';
    });
  });

  /* ---------- reveal on scroll ---------- */
  const revealTargets = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    revealTargets.forEach((el) => revealObserver.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- SNS 섹션 캐릭터 3종 팝업 (스크롤 내리면 튀어오르고, 올리면 다시 사라짐) ---------- */
  const snsPop = document.getElementById('snsPop');
  if (snsPop && 'IntersectionObserver' in window) {
    const popObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          snsPop.classList.toggle('is-popped', entry.isIntersecting);
        });
      },
      { threshold: 0.35 }
    );
    popObserver.observe(snsPop);
  }

  /* ---------- 재료 레이어 생성 (개별 SVG가 3D로 흩어졌다가 조립됨) ----------
     레이어 순서/오프셋을 바꾸려면 이 배열만 수정하면 됩니다. */
  const INGREDIENT_LAYERS = [
    { file: '빵-위.svg', alt: '번 상단' },
    { file: '양상추.svg', alt: '양상추' },
    { file: '토마토.svg', alt: '토마토' },
    { file: '치즈1.svg', alt: '치즈' },
    { file: '고기.svg', alt: '패티' },
    { file: '베이컨.svg', alt: '베이컨' },
    { file: '치즈2.svg', alt: '치즈' },
    { file: '소세지.svg', alt: '소세지' },
    { file: '오이.svg', alt: '오이' },
    { file: '양파.svg', alt: '어니언' },
    { file: '피클.svg', alt: '피클' },
    { file: '햄.svg', alt: '햄' },
    { file: '후라이.svg', alt: '에그' },
    { file: '해시브라운.svg', alt: '해시브라운' },
    { file: '고추.svg', alt: '할라피뇨' },
    { file: '버섯.svg', alt: '버섯' },
    { file: '소스1.svg', alt: '소스' },
    { file: '소스2.svg', alt: '소스' },
    { file: '소스3.svg', alt: '소스' },
    { file: '소스4.svg', alt: '소스' },
    { file: '빵-아래.svg', alt: '번 하단' },
  ];

  const ingredientsAssembly = document.getElementById('ingredientsAssembly');
  if (ingredientsAssembly) {
    const n = INGREDIENT_LAYERS.length;
    const mid = (n - 1) / 2;
    // 컨테이너 실제 크기에 비례해서 흩어지는 범위를 정함 — 모바일 등 작은 뷰포트에서도
    // 화면 비율에 맞춰 자동으로 축소됨
    const rect = ingredientsAssembly.getBoundingClientRect();
    const assemblyW = rect.width || 400;
    const assemblyH = rect.height || 600;
    // 세로로 길게 흩어지지 않고, 가로로 넓게 사방에 패턴처럼 흩어지도록
    // 가로 범위는 넉넉하게, 세로 범위는 좁게 제한
    const SPREAD_X = assemblyW * 0.46;
    const SPREAD_Y = Math.min(220, assemblyH * 0.32);
    const MERGE_RANGE = Math.min(140, assemblyH * 0.2); // 100%: 하나의 버거로 조립됐을 때의 총 범위(px)
    const spacingMerge = MERGE_RANGE / (n - 1);

    // 매번 로드할 때마다 다른 배치가 되도록 순수 랜덤(시드 없음) — 재료마다
    // 랜덤한 위치·크기·회전으로 중구난방하게 흩어져 있다가 스크롤로 조립됨
    INGREDIENT_LAYERS.forEach((layer, i) => {
      const d = i - mid; // 조립 시(100%) 정렬되는 상/하 순서는 유지 — 뭉쳤을 때 버거 모양이 되도록
      const rnd = Math.random();
      const rnd2 = Math.random();
      const ox = (Math.random() * 2 - 1) * SPREAD_X;
      const oy = (Math.random() * 2 - 1) * SPREAD_Y;
      const my = d * spacingMerge;
      const s0 = 0.45 + rnd * 1.35;               // 랜덤 크기 (0.45~1.8배)
      const o0 = 0.6 + rnd2 * 0.4;                // 랜덤 불투명도 (0.6~1)
      const r0 = (Math.random() * 2 - 1) * 55;    // 랜덤 회전 (-55~55deg), 중구난방하게

      const img = document.createElement('img');
      img.className = 'ing-layer';
      img.src = 'svg/' + layer.file;
      img.alt = layer.alt;
      img.style.setProperty('--ox', ox.toFixed(1) + 'px');
      img.style.setProperty('--oy', oy.toFixed(1) + 'px');
      img.style.setProperty('--my', my.toFixed(1) + 'px');
      img.style.setProperty('--s0', s0.toFixed(3));
      img.style.setProperty('--o0', o0.toFixed(3));
      img.style.setProperty('--r0', r0.toFixed(1) + 'deg');
      // 조립됐을 때(100%) 실제 버거처럼 올바른 상/하 레이어 순서로 겹치도록 고정 z-index 사용
      // (흩어진 상태의 무작위 배치와 무관하게, 합쳐진 결과물의 앞뒤 순서는 항상 일정해야 함)
      img.style.zIndex = String(n - i);
      ingredientsAssembly.appendChild(img);
    });
  }

  /* ---------- 브랜드 통계 숫자 카운팅 ---------- */
  const statNums = document.querySelectorAll('.stat__num');
  if (statNums.length && 'IntersectionObserver' in window) {
    const countUp = (el) => {
      const target = parseFloat(el.dataset.countTo || '0');
      const useComma = el.dataset.format === 'comma';
      const duration = 1400;
      const start = performance.now();
      const tick = (now) => {
        const t = clamp((now - start) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const value = Math.round(target * eased);
        el.textContent = useComma ? value.toLocaleString('ko-KR') : String(value);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            countUp(entry.target);
            statObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    statNums.forEach((el) => statObserver.observe(el));
  }

  /* ---------- scroll-progress pins (hero fullscreen reveal + ingredients/signature) ---------- */
  const heroPin = document.getElementById('heroPin');
  const hero = document.getElementById('hero');
  const ingredientsSection = document.querySelector('.ingredients');
  const ingredientsPin = document.getElementById('ingredientsPin');
  const signaturePinWrap = document.getElementById('signaturePinWrap');
  const signaturePin = document.getElementById('signature');

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const pinProgress = (pinEl) => {
    const rect = pinEl.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    if (scrollable <= 0) return 1;
    return clamp(-rect.top / scrollable, 0, 1);
  };

  let ticking = false;
  const updatePins = () => {
    ticking = false;
    if (heroPin && hero) {
      hero.style.setProperty('--p', pinProgress(heroPin).toFixed(4));
    }
    if (ingredientsSection && ingredientsPin) {
      ingredientsPin.style.setProperty('--ip', pinProgress(ingredientsSection).toFixed(4));
    }
    if (signaturePinWrap && signaturePin) {
      signaturePin.style.setProperty('--sp', pinProgress(signaturePinWrap).toFixed(4));
    }
  };
  const requestPinUpdate = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updatePins);
    }
  };
  updatePins();
  window.addEventListener('scroll', requestPinUpdate, { passive: true });
  window.addEventListener('resize', requestPinUpdate);

  /* ---------- menu tabs ---------- */
  const menuTabs = document.querySelectorAll('.menu-tab');
  const menuPanels = document.querySelectorAll('.menu-panel');
  menuTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      menuTabs.forEach((t) => {
        t.classList.toggle('is-active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });
      menuPanels.forEach((panel) => {
        panel.classList.toggle('is-active', panel.dataset.panel === target);
      });
    });
  });

  /* ---------- carousel drag-to-scroll (mouse) ---------- */
  document.querySelectorAll('.menu-carousel').forEach((carousel) => {
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;
    carousel.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX;
      scrollStart = carousel.scrollLeft;
    });
    window.addEventListener('mouseup', () => { isDown = false; });
    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      carousel.scrollLeft = scrollStart - (e.pageX - startX);
    });
  });
})();
