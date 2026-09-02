(function(){
  'use strict';

  /* ------------------------------------------------------------ loader --- */
  var loader = document.getElementById('loader');
  var loaderPie = document.getElementById('loaderPie');
  var progress = 0;
  var loaderRaf;

  function tickLoader(){
    progress += (100 - progress) * 0.06 + 0.6;
    if (progress >= 100){
      progress = 100;
      loaderPie.style.setProperty('--angle', '360deg');
      finishLoad();
      return;
    }
    loaderPie.style.setProperty('--angle', (progress * 3.6) + 'deg');
    loaderRaf = requestAnimationFrame(tickLoader);
  }

  function finishLoad(){
    cancelAnimationFrame(loaderRaf);
    loader.classList.add('is-hidden');
    document.body.classList.add('is-loaded');
    revealHero();
  }

  requestAnimationFrame(tickLoader);
  window.addEventListener('load', function(){
    // let the animated pie reach 100% naturally; if assets finish first, wait for it.
  });

  /* --------------------------------------------------------- hero reveal - */
  function revealHero(){
    var hero = document.getElementById('hero');
    setTimeout(function(){ hero.classList.add('is-visible'); }, 150);
  }

  /* -------------------------------------------------------- line splitting */
  function wrapLines(el){
    var html = el.innerHTML;
    var segments = html.split(/<br\s*\/?>/i);
    el.innerHTML = segments.map(function(seg){
      return '<span class="line-wrap"><span class="line">' + seg.trim() + '</span></span>';
    }).join('');
  }

  function wrapChars(el){
    var text = el.textContent;
    var frag = '';
    for (var i = 0; i < text.length; i++){
      var ch = text[i];
      frag += ch === ' '
        ? ' '
        : '<span class="char-wrap"><span class="char">' + ch + '</span></span>';
    }
    el.innerHTML = frag;
  }

  function wrapWords(el){
    var words = el.textContent.split(' ');
    el.innerHTML = words.map(function(w){
      return '<span class="word">' + w + '</span>';
    }).join(' ');
  }

  document.querySelectorAll('.split-lines').forEach(wrapLines);
  document.querySelectorAll('.split-chars').forEach(wrapChars);
  document.querySelectorAll('.scroll-fill').forEach(wrapWords);

  /* ------------------------------------------------------ scroll reveals - */
  var revealTargets = document.querySelectorAll(
    '.split-lines, .split-chars, .reveal-up, .reveal-clip'
  );
  var revealObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting){
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

  revealTargets.forEach(function(el){ revealObserver.observe(el); });

  // stagger project items and service rows within their row
  document.querySelectorAll('.grid-row').forEach(function(row){
    var items = row.querySelectorAll('.project-item, .services__item');
    items.forEach(function(item, i){
      item.style.transitionDelay = (i * 90) + 'ms';
    });
  });

  /* -------------------------------------------------------------- header -- */
  var header = document.getElementById('header');
  var heroEl = document.getElementById('hero');

  function updateHeader(){
    var threshold = heroEl ? heroEl.offsetHeight - 80 : 80;
    header.classList.toggle('is-scrolled', window.scrollY > threshold);
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  /* ------------------------------------------------------------- gnb nav -- */
  var mobileNav = document.getElementById('mobileNav');
  var burger = document.getElementById('burger');

  function closeMobileNav(){
    mobileNav.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }

  burger.addEventListener('click', function(){
    var isOpen = mobileNav.classList.toggle('is-open');
    burger.classList.toggle('is-open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
  });

  document.querySelectorAll('a[href^="#"]').forEach(function(link){
    link.addEventListener('click', function(e){
      var id = link.getAttribute('href').slice(1);
      var target = id ? document.getElementById(id) : null;
      if (!target) return;
      e.preventDefault();
      closeMobileNav();
      var headerH = header.offsetHeight;
      var top = target.getBoundingClientRect().top + window.pageYOffset - headerH + 1;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* -------------------------------------------------------- back to top -- */
  var toTop = document.getElementById('toTop');
  if (toTop){
    toTop.addEventListener('click', function(){
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* --------------------------------------------------------- scrollbar --- */
  var scrollbar = document.getElementById('scrollbar');
  var thumb = document.getElementById('scrollbarThumb');
  var dragging = false;
  var dragStartY = 0;
  var dragStartScroll = 0;

  function docHeight(){
    return document.documentElement.scrollHeight - window.innerHeight;
  }

  function updateThumb(){
    if (dragging) return;
    var rail = scrollbar.clientHeight;
    var dh = docHeight();
    var ratio = window.innerHeight / document.documentElement.scrollHeight;
    var thumbH = Math.max(rail * ratio, 50);
    var progressY = dh > 0 ? window.scrollY / dh : 0;
    thumb.style.height = thumbH + 'px';
    thumb.style.top = (progressY * (rail - thumbH)) + 'px';
  }

  window.addEventListener('scroll', updateThumb, { passive: true });
  window.addEventListener('resize', updateThumb);
  updateThumb();

  thumb.addEventListener('pointerdown', function(e){
    dragging = true;
    dragStartY = e.clientY;
    dragStartScroll = window.scrollY;
    thumb.setPointerCapture(e.pointerId);
  });
  thumb.addEventListener('pointermove', function(e){
    if (!dragging) return;
    var rail = scrollbar.clientHeight;
    var thumbH = thumb.offsetHeight;
    var dh = docHeight();
    var deltaY = e.clientY - dragStartY;
    var scrollDelta = (deltaY / (rail - thumbH)) * dh;
    window.scrollTo(0, dragStartScroll + scrollDelta);
  });
  thumb.addEventListener('pointerup', function(){ dragging = false; });
  thumb.addEventListener('pointercancel', function(){ dragging = false; });

  /* ---------------------------------------------- scroll-scrubbed text fill */
  // Words dim -> bright as the paragraph scrolls through a fixed viewport
  // band; purely a function of current scroll position, so scrolling back
  // up naturally un-fills it too (no one-shot IntersectionObserver here).
  var fillTargets = Array.prototype.map.call(
    document.querySelectorAll('.scroll-fill'),
    function(el){ return { el: el, words: el.querySelectorAll('.word') }; }
  );

  function updateScrollFill(){
    if (!fillTargets.length) return;
    var vh = window.innerHeight;
    var triggerY = vh * 0.82;
    fillTargets.forEach(function(t){
      var rect = t.el.getBoundingClientRect();
      var span = rect.height * 0.9 + vh * 0.15;
      var progress = (triggerY - rect.top) / span;
      progress = Math.max(0, Math.min(1, progress));
      var filledCount = Math.round(progress * t.words.length);
      t.words.forEach(function(word, i){
        word.classList.toggle('is-filled', i < filledCount);
      });
    });
  }

  var fillTicking = false;
  window.addEventListener('scroll', function(){
    if (fillTicking) return;
    fillTicking = true;
    requestAnimationFrame(function(){ updateScrollFill(); fillTicking = false; });
  }, { passive: true });
  window.addEventListener('resize', updateScrollFill);
  updateScrollFill();

  /* ------------------------------------------------ services hover preview */
  var servicePreview = document.getElementById('servicePreview');
  var servicePreviewImg = document.getElementById('servicePreviewImg');
  var serviceItems = document.querySelectorAll('.services__item[data-preview]');

  if (servicePreview && serviceItems.length){
    var previewMouseX = 0, previewMouseY = 0;
    var previewX = 0, previewY = 0;
    var previewActive = false;
    var previewRafRunning = false;

    function tickPreview(){
      // lerp toward the cursor for a soft, trailing follow rather than a snap.
      previewX += (previewMouseX - previewX) * 0.18;
      previewY += (previewMouseY - previewY) * 0.18;
      servicePreview.style.transform =
        'translate3d(' + (previewX + 28) + 'px,' + (previewY - 75) + 'px, 0)';
      if (previewActive || Math.abs(previewMouseX - previewX) > 0.5 || Math.abs(previewMouseY - previewY) > 0.5){
        requestAnimationFrame(tickPreview);
      } else {
        previewRafRunning = false;
      }
    }

    function ensurePreviewRaf(){
      if (!previewRafRunning){
        previewRafRunning = true;
        requestAnimationFrame(tickPreview);
      }
    }

    window.addEventListener('mousemove', function(e){
      previewMouseX = e.clientX;
      previewMouseY = e.clientY;
      if (previewActive) ensurePreviewRaf();
    }, { passive: true });

    serviceItems.forEach(function(item){
      item.addEventListener('mouseenter', function(){
        servicePreviewImg.src = item.dataset.preview;
        servicePreview.classList.add('is-visible');
        previewActive = true;
        ensurePreviewRaf();
      });
      item.addEventListener('mouseleave', function(){
        servicePreview.classList.remove('is-visible');
        previewActive = false;
      });
    });
  }

})();
