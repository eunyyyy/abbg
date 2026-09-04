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
    // 컨테이너 실제 높이에 비례해서 흩어지는 범위를 정함 — 모바일 등 작은 뷰포트에서
    // 캡션 문구와 겹치지 않도록 반응형으로 축소됨
    const assemblyH = ingredientsAssembly.getBoundingClientRect().height || 600;
    const SPREAD_RANGE = Math.min(700, assemblyH * 0.92); // 0%: 층층이 멀리 흩어지는 총 범위(px)
    const MERGE_RANGE = Math.min(140, assemblyH * 0.2);   // 100%: 하나의 버거로 압축 결합됐을 때의 총 범위(px)
    const spacingSpread = SPREAD_RANGE / (n - 1);
    const spacingMerge = MERGE_RANGE / (n - 1);
    INGREDIENT_LAYERS.forEach((layer, i) => {
      const d = i - mid;
      const sign = i % 2 === 0 ? -1 : 1;
      // 레이어마다 수렴 속도가 다르게 느껴지도록 개별 비율(rate)을 살짝 흔들어줌 (0.82~1.18)
      const rate = 1 + ((i % 5) - 2) * 0.045;
      const ox = sign * (50 + Math.abs(d) * 10) * rate;
      const oy = d * spacingSpread * rate;
      const my = d * spacingMerge;
      const s0 = Math.max(0.72, 1 - Math.abs(d) * 0.022);
      const o0 = Math.max(0.5, 1 - Math.abs(d) * 0.03);
      const r0 = sign * (7 + Math.abs(d) * 0.9);

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
      img.style.zIndex = String(n - i);
      ingredientsAssembly.appendChild(img);
    });
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
