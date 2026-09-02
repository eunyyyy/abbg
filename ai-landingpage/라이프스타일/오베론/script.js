(() => {
  'use strict';

  /* ---------- Header solid/transparent state ---------- */
  const topBar = document.getElementById('topbar');
  function updateHeaderState(){
    if (window.scrollY > 10) topBar.classList.add('is-solid');
    else topBar.classList.remove('is-solid');
  }
  updateHeaderState();
  window.addEventListener('scroll', updateHeaderState, { passive: true });

  /* ---------- Mobile menu ---------- */
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  function closeMobileMenu(){
    mobileMenu.classList.remove('is-open');
    document.body.classList.remove('header-open');
  }
  burger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('is-open');
    document.body.classList.toggle('header-open', isOpen);
  });

  /* ---------- GNB anchor-scroll (offsets for the fixed header) ---------- */
  function headerOffset(){
    return topBar.getBoundingClientRect().height;
  }
  document.querySelectorAll('.js-anchor').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId.charAt(0) !== '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      closeMobileMenu();
      const top = target.getBoundingClientRect().top + window.scrollY - headerOffset() + 1;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ---------- Scroll reveal ---------- */
  const revealTargets = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealTargets.length){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealTargets.forEach(el => io.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Manifesto: scroll-scrubbed word fill (continuous, bidirectional) ----------
     Each word's fill threshold is its index/total compared against a continuous
     scroll-position-derived progress value, recomputed on every scroll tick — so scrolling
     back up un-fills the words that just filled, with no IntersectionObserver one-shot lock. */
  document.querySelectorAll('.js-scroll-fill').forEach(block => {
    const words = block.querySelectorAll('.word');
    if (!words.length) return;
    function update(){
      const rect = block.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (rect.height + vh)));
      const filledCount = Math.round(progress * words.length);
      words.forEach((word, i) => word.classList.toggle('is-filled', i < filledCount));
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  });

  /* ---------- Horizontal strips: mouse-drag scroll only (no tabs, no prev/next buttons —
     the CHEATSHEET hard rules forbid carousel/tabs/pagination/arrow-buttons, so navigation
     is native scroll/swipe/drag exclusively, same as the journal strip) ---------- */
  function enableDragScroll(el){
    let isDown = false, startX = 0, startScroll = 0, moved = false;
    el.addEventListener('pointerdown', (e) => {
      isDown = true; moved = false;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      el.scrollLeft = startScroll - dx;
    });
    function end(){ isDown = false; }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', end);
    el.addEventListener('click', (e) => { if (moved) e.preventDefault(); }, true);
  }
  document.querySelectorAll('.journal__track').forEach(enableDragScroll);

  /* ---------- Craft: scroll-driven story stage (no click navigation) ----------
     A tall runway supplies scroll distance; the pin (position:sticky) holds in place while
     scroll progress through that distance picks which .craft__item crossfades to .is-active.
     Progress formula matches the one already validated on this project's History/Vision
     sections: 0 at the runway's top hitting the viewport top, 1 as its bottom clears. */
  const craftRunway = document.querySelector('.js-craft-runway');
  const craftItems = document.querySelectorAll('.craft__item');
  const craftCounter = document.querySelector('.js-craft-counter');
  if (craftRunway && craftItems.length){
    function updateCraft(){
      const rect = craftRunway.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
      const index = Math.min(craftItems.length - 1, Math.floor(progress * craftItems.length));
      craftItems.forEach(item => item.classList.toggle('is-active', Number(item.dataset.index) === index));
      if (craftCounter) craftCounter.textContent = `${index + 1} / ${craftItems.length}`;
    }
    updateCraft();
    window.addEventListener('scroll', updateCraft, { passive: true });
    window.addEventListener('resize', updateCraft);
  }

  /* ---------- Hero product shelf: fold/unfold on hover (desktop) / tap (mobile) ----------
     Mirrors the reference's real hero-products.js: measure the collapsed width once, then on
     open grow the container to the content's full scrollWidth (revealing everything, since the
     content itself is pinned to the right edge via CSS position:absolute;right:0); on close,
     restore the measured collapsed width. Below 992px there's no hover, so a tap toggles it. */
  document.querySelectorAll('.js-hero-products').forEach(shelf => {
    const content = shelf.querySelector('.js-hero-products-content');
    if (!content) return;
    let collapsedWidth = null;
    function open(){
      if (collapsedWidth === null) collapsedWidth = shelf.getBoundingClientRect().width + 'px';
      shelf.classList.add('active');
      shelf.style.width = content.scrollWidth + 'px';
    }
    function close(){
      shelf.classList.remove('active');
      if (collapsedWidth !== null) shelf.style.width = collapsedWidth;
    }
    shelf.addEventListener('mouseenter', () => { if (window.innerWidth >= 992) open(); });
    shelf.addEventListener('mouseleave', () => { if (window.innerWidth >= 992) close(); });
    shelf.addEventListener('click', (e) => {
      if (window.innerWidth >= 992) return;
      // on mobile the first tap only unfolds the shelf; a tap on a thumbnail (open or not)
      // swaps the banner instead, handled by the delegated .js-hero-product-link listener below
      if (!shelf.classList.contains('active') && !e.target.closest('.js-hero-product-link')) {
        e.preventDefault();
        open();
      }
    });

    // clicking a look swaps the banner image above it to that look, instead of navigating
    // away — keeps the section's default/initial banner image untouched until a click happens
    const swapTargetSel = shelf.dataset.swapTarget;
    const swapTarget = swapTargetSel ? document.querySelector(swapTargetSel) : null;
    if (swapTarget){
      shelf.addEventListener('click', (e) => {
        const link = e.target.closest('.js-hero-product-link');
        if (!link) return;
        e.preventDefault();
        const src = link.querySelector('img')?.getAttribute('src');
        if (!src) return;
        swapTarget.setAttribute('src', src);
        shelf.querySelectorAll('.js-hero-product-link').forEach(a => a.classList.toggle('is-selected', a === link));
      });
    }
  });

  /* ---------- Signature tile: scroll-pin grow-to-fullscreen (desktop only) ----------
     The tall .signature__runway supplies scroll distance; .signature__pin sticks while a
     continuous progress value (same formula already validated on .craft__pin: 0 as the
     runway's top hits the viewport top, 1 as the pin naturally releases) grows .js-pin-grow
     from its resting centered size/position up to cover the full viewport, and shrinks it
     back on scroll-up since the transform is a pure function of scroll position, never a
     one-shot reveal. The resting position is computed analytically (viewport size minus the
     box's own intrinsic size, halved) rather than measured live off the sticky element's
     rect, which sidesteps the "rect isn't reliable until the pin is actually stuck" pitfall
     entirely — the flex-centered pin places the box at that exact analytical position
     whenever it's stuck, regardless of when the measurement happens. */
  (function(){
    const runway = document.querySelector('.js-signature-runway');
    const box = document.querySelector('.js-pin-grow');
    if (!runway || !box) return;
    const mq = window.matchMedia('(min-width:992px)');
    let rest = null;

    function measure(){
      const w = box.offsetWidth, h = box.offsetHeight;
      const vw = window.innerWidth, vh = window.innerHeight;
      rest = { width: w, height: h, top: (vh - h) / 2, left: (vw - w) / 2 };
    }
    function reset(){
      box.style.setProperty('--grow-scale', 1);
      box.style.setProperty('--grow-x', '0px');
      box.style.setProperty('--grow-y', '0px');
    }
    function update(){
      if (!mq.matches){ reset(); return; }
      if (!rest) measure();
      const rect = runway.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
      const vw = window.innerWidth, vh = window.innerHeight;
      const bigScale = Math.max(vw / rest.width, vh / rest.height);
      const scale = 1 + (bigScale - 1) * progress;
      const tx = -rest.left * progress;
      const ty = -rest.top * progress;
      box.style.setProperty('--grow-scale', scale.toFixed(3));
      box.style.setProperty('--grow-x', tx.toFixed(1) + 'px');
      box.style.setProperty('--grow-y', ty.toFixed(1) + 'px');
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', () => { rest = null; update(); });
    update();
  })();

  /* ---------- Journal: prev/next arrows for the drag-scroll strip ----------
     Buttons only become visible when there's actually more content on that side
     (track.scrollLeft > 0 for prev, < max for next), on top of the native drag/swipe that
     already works on the strip regardless — this doesn't replace it. */
  document.querySelectorAll('.journal__carousel').forEach(carousel => {
    const track = carousel.querySelector('.journal__track');
    const prev = carousel.querySelector('.journal__arrow--prev');
    const next = carousel.querySelector('.journal__arrow--next');
    if (!track || !prev || !next) return;
    function updateArrows(){
      const max = track.scrollWidth - track.clientWidth;
      prev.classList.toggle('is-visible', track.scrollLeft > 4);
      next.classList.toggle('is-visible', track.scrollLeft < max - 4);
    }
    function step(dir){
      const card = track.querySelector('.journal-card');
      const amount = card ? card.getBoundingClientRect().width + 16 : track.clientWidth * 0.8;
      track.scrollBy({ left: dir * amount, behavior: 'smooth' });
    }
    prev.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    track.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    updateArrows();
  });

  /* ---------- Marquees: pause on hover/focus (also gives touch users a way to inspect a frame) ---------- */
  document.querySelectorAll('.announcement, .social').forEach(marquee => {
    marquee.addEventListener('mouseenter', () => marquee.classList.add('is-paused'));
    marquee.addEventListener('mouseleave', () => marquee.classList.remove('is-paused'));
  });

})();
