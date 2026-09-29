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
  if(visual&&!reduce&&matchMedia('(pointer:fine)').matches){visual.addEventListener('pointermove',function(e){if(e.pointerType!=='mouse')return;var r=visual.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;visual.style.transform='perspective(900px) rotateY('+(x*7)+'deg) rotateX('+(-y*7)+'deg)';});visual.addEventListener('pointerleave',function(){visual.style.transform='';});}
  if(!reduce&&matchMedia('(pointer:fine)').matches){document.querySelectorAll('[data-tilt]').forEach(function(card){card.addEventListener('pointermove',function(e){if(e.pointerType!=='mouse')return;var r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform='perspective(900px) rotateY('+(x*2.5)+'deg) rotateX('+(-y*2.5)+'deg) translateY(-4px)';});card.addEventListener('pointerleave',function(){card.style.transform='';});});}

  var spin=document.getElementById('vrSpin');
  if(visual&&spin){
    var keys=[].slice.call(spin.querySelectorAll('img')).map(function(el){return {el:el,a:Number(el.dataset.angle)};});
    var MIN=-30,MAX=30,BLEND=5,target=0,cur=0,raf=null,dragX=null;
    var smooth=function(t){return t*t*(3-2*t);};
    var render=function(){
      var mid=(keys[0].a+keys[1].a)/2,f=smooth(Math.min(Math.max((cur-(mid-BLEND))/(BLEND*2),0),1));
      keys.forEach(function(k,i){var op=i===0?1-f:f;k.el.style.opacity=op;k.el.style.transform='rotateY('+(-(cur-k.a)*.55)+'deg)';});
    };
    var settle=function(){var mid=(keys[0].a+keys[1].a)/2;if(Math.abs(target-mid)<BLEND)target=target<mid?mid-BLEND:mid+BLEND;};
    var tick=function(){var diff=target-cur,step=Math.min(Math.max(Math.abs(diff)*.05,.08),.9);cur+=Math.abs(diff)<=step?diff:(diff>0?step:-step);if(Math.abs(target-cur)<.6)settle();render();raf=target!==cur?requestAnimationFrame(tick):null;};
    var go=function(v){target=Math.min(Math.max(v,MIN),MAX);if(reduce){cur=target;settle();cur=target;render();return;}if(!raf)raf=requestAnimationFrame(tick);};
    cur=target=MIN*.6;render();
    visual.addEventListener('pointermove',function(e){
      var r=visual.getBoundingClientRect();
      if(e.pointerType==='mouse'){go(MIN+Math.min(Math.max((e.clientX-r.left)/r.width,0),1)*(MAX-MIN));}
      else if(dragX!==null){go(target+(e.clientX-dragX)*.25);dragX=e.clientX;}
    });
    visual.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse')dragX=e.clientX;});
    ['pointerup','pointercancel'].forEach(function(n){visual.addEventListener(n,function(){dragX=null;});});
    visual.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse')go(MIN*.6);});
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
