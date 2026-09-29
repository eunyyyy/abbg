(function(){
  'use strict';
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header=document.getElementById('siteHeader');
  var menuButton=document.getElementById('menuButton');
  var mobileMenu=document.getElementById('mobileMenu');
  var lastY=0;
  function closeMenu(){if(!mobileMenu)return;mobileMenu.classList.remove('is-open');mobileMenu.setAttribute('aria-hidden','true');menuButton.classList.remove('is-open');menuButton.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open');document.documentElement.classList.remove('menu-open');}
  if(menuButton){menuButton.addEventListener('click',function(){var open=!mobileMenu.classList.contains('is-open');mobileMenu.classList.toggle('is-open',open);mobileMenu.setAttribute('aria-hidden',String(!open));menuButton.classList.toggle('is-open',open);menuButton.setAttribute('aria-expanded',String(open));document.body.classList.toggle('menu-open',open);document.documentElement.classList.toggle('menu-open',open);});}
  var mobileQuery=window.matchMedia('(max-width: 720px)');
  if(mobileQuery.addEventListener){mobileQuery.addEventListener('change',function(e){if(!e.matches)closeMenu();});}
  document.querySelectorAll('a[href^="#"]').forEach(function(link){link.addEventListener('click',function(e){var target=document.querySelector(link.getAttribute('href'));if(!target)return;e.preventDefault();closeMenu();target.scrollIntoView({behavior:reduce?'auto':'smooth'});});});
  window.addEventListener('scroll',function(){var y=window.scrollY;header.classList.toggle('is-scrolled',y>24);lastY=y;},{passive:true});
  var reveals=document.querySelectorAll('.reveal');
  var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});},{threshold:.14,rootMargin:'0px 0px -6%'});
  reveals.forEach(function(el,i){el.style.transitionDelay=(i%4)*70+'ms';observer.observe(el);});
  document.querySelectorAll('[data-count]').forEach(function(el){var started=false;var countObserver=new IntersectionObserver(function(entries){if(!entries[0].isIntersecting||started)return;started=true;var end=Number(el.dataset.count),start=performance.now(),duration=reduce?1:1200;function frame(now){var p=Math.min((now-start)/duration,1);el.textContent=Math.round(end*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(frame);}requestAnimationFrame(frame);countObserver.disconnect();},{threshold:.7});countObserver.observe(el);});
  var visual=document.getElementById('heroVisual');
  if(visual&&!reduce&&matchMedia('(pointer:fine)').matches){visual.addEventListener('pointermove',function(e){if(e.pointerType!=='mouse')return;var r=visual.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;visual.style.transform='perspective(900px) rotateY('+(x*7)+'deg) rotateX('+(-y*7)+'deg)';visual.querySelector('.vr-spin').style.translate=(x*18)+'px '+(y*18)+'px';});visual.addEventListener('pointerleave',function(){visual.style.transform='';visual.querySelector('.vr-spin').style.translate='';});}
  if(!reduce&&matchMedia('(pointer:fine)').matches){document.querySelectorAll('[data-tilt]').forEach(function(card){card.addEventListener('pointermove',function(e){if(e.pointerType!=='mouse')return;var r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform='perspective(900px) rotateY('+(x*2.5)+'deg) rotateX('+(-y*2.5)+'deg) translateY(-4px)';});card.addEventListener('pointerleave',function(){card.style.transform='';});});}

  var spin=document.getElementById('vrSpin');
  if(visual&&spin){
    var frames=spin.querySelectorAll('img'),idx=0,timer=null;
    var show=function(i){frames[idx].classList.remove('is-active');idx=(i+frames.length)%frames.length;frames[idx].classList.add('is-active');};
    var start=function(){if(timer||reduce)return;visual.classList.add('is-spinning');timer=setInterval(function(){show(idx+1);},160);};
    var stop=function(){clearInterval(timer);timer=null;visual.classList.remove('is-spinning');show(0);};
    visual.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse')start();});
    visual.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse')stop();});
    visual.addEventListener('click',function(){if(!matchMedia('(hover:hover)').matches){timer?stop():start();}});
  }

  var mascot=document.getElementById('mascot');
  if(mascot&&!reduce&&matchMedia('(pointer:fine)').matches){
    var pupils=mascot.querySelectorAll('.mascot-pupil');
    document.addEventListener('mousemove',function(e){
      pupils.forEach(function(p){
        var eye=p.parentElement,r=eye.getBoundingClientRect();
        var cx=r.left+r.width/2,cy=r.top+r.height/2;
        var dx=e.clientX-cx,dy=e.clientY-cy;
        var ang=Math.atan2(dy,dx),dist=Math.min(Math.hypot(dx,dy),r.width*1.6);
        var maxOffset=r.width*0.16,offset=(dist/(r.width*1.6))*maxOffset;
        p.style.transform='translate('+(Math.cos(ang)*offset)+'px,'+(Math.sin(ang)*offset)+'px)';
      });
    },{passive:true});
  }
})();
