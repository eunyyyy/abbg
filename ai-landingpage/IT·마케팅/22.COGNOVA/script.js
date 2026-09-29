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
    var layers=[].slice.call(spin.querySelectorAll('img'));
    var keys=layers.map(function(el){return {el:el,a:Number(el.dataset.angle),m:el.hasAttribute('data-mirror')};});
    keys.push({el:layers[0],a:360,m:false});
    var target=0,cur=0,raf=null,dragX=null;
    var smooth=function(t){return t*t*(3-2*t);};
    var render=function(){
      var a=((cur%360)+360)%360,k=0;
      while(k<keys.length-2&&a>=keys[k+1].a)k++;
      var A=keys[k],B=keys[k+1],t=(a-A.a)/(B.a-A.a);
      var fade=smooth(Math.min(Math.max((t-.4)/.2,0),1));
      var turn=(t-.5)*-24;
      layers.forEach(function(el){el.style.opacity=0;});
      var paint=function(K,op,rot){K.el.style.opacity=op;K.el.style.transform='rotateY('+rot+'deg)'+(K.m?' scaleX(-1)':'');};
      if(A.el===B.el){paint(A,1,turn);}else{paint(A,1-fade,turn);paint(B,fade,turn+24);if(fade<.02)paint(A,1,turn);}
    };
    var seg=function(a){a=((a%360)+360)%360;var k=0;while(k<keys.length-2&&a>=keys[k+1].a)k++;return [keys[k].a,keys[k+1].a];};
    var settle=function(){var off=cur-(((cur%360)+360)%360),g=seg(cur),t=(cur-off-g[0])/(g[1]-g[0]);if(t>.4&&t<.6)target=off+g[0]+(g[1]-g[0])*(t<.5?.4:.6);};
    var tick=function(){var diff=target-cur,step=Math.min(Math.max(Math.abs(diff)*.045,.35),3);cur+=Math.abs(diff)<=step?diff:(diff>0?step:-step);if(Math.abs(target-cur)<1.5)settle();if(Math.abs(target-cur)<.05)cur=target;render();raf=Math.abs(target-cur)>0?requestAnimationFrame(tick):null;};
    var go=function(v,wrap){if(wrap){if(cur-v>180)cur-=360;else if(v-cur>180)cur+=360;}target=v;if(!raf&&!reduce)raf=requestAnimationFrame(tick);if(reduce){cur=target;render();}};
    layers.forEach(function(el){el.classList.remove('is-active');});
    render();
    visual.addEventListener('pointermove',function(e){
      var r=visual.getBoundingClientRect();
      if(e.pointerType==='mouse'){go(Math.min(Math.max((e.clientX-r.left)/r.width,0),1)*360,true);}
      else if(dragX!==null){go(target+(e.clientX-dragX)*1.2);dragX=e.clientX;}
    });
    visual.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse')dragX=e.clientX;});
    ['pointerup','pointercancel'].forEach(function(n){visual.addEventListener(n,function(){dragX=null;});});
    visual.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse'){var a=((cur%360)+360)%360;cur=a;go(a>180?360:0);}});
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
