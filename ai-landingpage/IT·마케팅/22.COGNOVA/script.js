(function(){
  'use strict';
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header=document.getElementById('siteHeader');
  var menuButton=document.getElementById('menuButton');
  var mobileMenu=document.getElementById('mobileMenu');
  var lastY=0;
  function closeMenu(){if(!mobileMenu)return;mobileMenu.classList.remove('is-open');mobileMenu.setAttribute('aria-hidden','true');menuButton.classList.remove('is-open');menuButton.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open');}
  if(menuButton){menuButton.addEventListener('click',function(){var open=!mobileMenu.classList.contains('is-open');mobileMenu.classList.toggle('is-open',open);mobileMenu.setAttribute('aria-hidden',String(!open));menuButton.classList.toggle('is-open',open);menuButton.setAttribute('aria-expanded',String(open));document.body.classList.toggle('menu-open',open);});}
  var mobileQuery=window.matchMedia('(max-width: 720px)');
  if(mobileQuery.addEventListener){mobileQuery.addEventListener('change',function(e){if(!e.matches)closeMenu();});}
  document.querySelectorAll('a[href^="#"]').forEach(function(link){link.addEventListener('click',function(e){var target=document.querySelector(link.getAttribute('href'));if(!target)return;e.preventDefault();closeMenu();target.scrollIntoView({behavior:reduce?'auto':'smooth'});});});
  window.addEventListener('scroll',function(){var y=window.scrollY;header.classList.toggle('is-scrolled',y>24);lastY=y;},{passive:true});
  var reveals=document.querySelectorAll('.reveal');
  var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});},{threshold:.14,rootMargin:'0px 0px -6%'});
  reveals.forEach(function(el,i){el.style.transitionDelay=(i%4)*70+'ms';observer.observe(el);});
  document.querySelectorAll('[data-count]').forEach(function(el){var started=false;var countObserver=new IntersectionObserver(function(entries){if(!entries[0].isIntersecting||started)return;started=true;var end=Number(el.dataset.count),start=performance.now(),duration=reduce?1:1200;function frame(now){var p=Math.min((now-start)/duration,1);el.textContent=Math.round(end*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(frame);}requestAnimationFrame(frame);countObserver.disconnect();},{threshold:.7});countObserver.observe(el);});
  var visual=document.getElementById('heroVisual');
  if(visual&&!reduce&&matchMedia('(pointer:fine)').matches){visual.addEventListener('pointermove',function(e){var r=visual.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;visual.style.transform='perspective(900px) rotateY('+(x*7)+'deg) rotateX('+(-y*7)+'deg)';visual.querySelector('.nova-core').style.translate=(x*18)+'px '+(y*18)+'px';});visual.addEventListener('pointerleave',function(){visual.style.transform='';visual.querySelector('.nova-core').style.translate='';});}
  if(!reduce&&matchMedia('(pointer:fine)').matches){document.querySelectorAll('[data-tilt]').forEach(function(card){card.addEventListener('pointermove',function(e){var r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform='perspective(900px) rotateY('+(x*2.5)+'deg) rotateX('+(-y*2.5)+'deg) translateY(-4px)';});card.addEventListener('pointerleave',function(){card.style.transform='';});});}
})();
