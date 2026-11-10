/* v2.9 runtime layer (loaded last by loader.js). Presentation only: no odds, payouts or save data are touched.
   1) Daily Wheel: crisp (2x canvas), velocity-continuous spin curve, idle speed eases in/out, pointer ticks per segment, winner highlight fades in.
   2) Duplicate toasts within 800 ms are dropped (less clutter).  3) Every .btn / pill / mini button gets a short press pulse. */
(()=>{
/* C1-continuous spin curve: quadratic start (no jolt), quartic ease-out finish. Position 0..1 for progress 0..1. */
const ease=p=>{const A=.14,L=1-A,V=1/(A/2+L/4);if(p<=0)return 0;if(p>=1)return 1;if(p<A)return .5*V*p*p/A;const q=(p-A)/L;return .5*V*A+V*L/4*(1-Math.pow(1-q,4))};
const api={ease};if(typeof window!=='undefined')window.Update29=api;
if(typeof document==='undefined'||typeof Wheel==='undefined')return;
/* ---------- 1) Daily Wheel ---------- */
Wheel.ease=ease;
Wheel.draw=function(cv){const c=cv.getContext('2d'),k=cv.width/360,S=360,C=S/2,R=C-14,P=Math.PI/4;c.setTransform(k,0,0,k,0,0);c.clearRect(0,0,S,S);
c.fillStyle='#8a8f98';c.beginPath();c.arc(C,C,R+12,0,7);c.fill();c.fillStyle='#656a73';c.beginPath();c.arc(C,C,R+4,0,7);c.fill();
const seg=i=>{const a=-Math.PI/2+i*P;c.beginPath();c.moveTo(C,C);c.arc(C,C,R,a,a+P);c.closePath();return a};
Wheel.SEG.forEach((t,i)=>{const a=seg(i);c.fillStyle=t==='X'?'#f2c94c':t==='B'?'#3a4452':(i%4===0?'#f1f3f5':'#c9ced4');c.fill();c.strokeStyle='rgba(0,0,0,.18)';c.lineWidth=1.5;c.stroke();
const am=a+P/2;c.save();c.translate(C+Math.cos(am)*R*.64,C+Math.sin(am)*R*.64);c.rotate(am+Math.PI/2);c.textAlign='center';c.textBaseline='middle';
if(t==='B'){const s=R*.22;c.fillStyle='#d58cff';c.strokeStyle='#8b3dd6';c.lineWidth=3;c.beginPath();c.moveTo(0,-s);c.lineTo(s*.95,-s*.3);c.lineTo(0,s);c.lineTo(-s*.95,-s*.3);c.closePath();c.fill();c.stroke();c.strokeStyle='#f3d6ff';c.beginPath();c.moveTo(-s*.95,-s*.3);c.lineTo(s*.95,-s*.3);c.moveTo(-s*.4,-s*.3);c.lineTo(0,-s);c.lineTo(s*.4,-s*.3);c.stroke()}
else{c.font=`900 ${t==='X'?R*.2:R*.3}px Fredoka,sans-serif`;c.fillStyle=t==='X'?'#7a5b00':'#000000';c.fillText(t==='X'?'2X':'$',0,0)}c.restore()});
c.fillStyle='#8a8f98';c.beginPath();c.arc(C,C,R*.1,0,7);c.fill()};
/* winner highlight lives on its own transparent canvas so it can fade in instead of popping */
Wheel.mark=function(cv,win){const c=cv.getContext('2d'),k=cv.width/360,C=180,R=166,P=Math.PI/4;c.setTransform(k,0,0,k,0,0);c.clearRect(0,0,360,360);if(win<0)return;
const seg=i=>{const a=-Math.PI/2+i*P;c.beginPath();c.moveTo(C,C);c.arc(C,C,R,a,a+P);c.closePath()};
Wheel.SEG.forEach((t,i)=>{if(i!==win){seg(i);c.fillStyle='rgba(8,16,24,.72)';c.fill()}});seg(win);c.save();c.shadowColor='#fde047';c.shadowBlur=26*k;c.strokeStyle='#fde047';c.lineWidth=5;c.stroke();c.restore()};
Wheel.create=function(host,{onDone}={}){host.innerHTML='<div class="wh"><div class="wsp"><canvas class="wcv" width="720" height="720"></canvas><canvas class="wov" width="720" height="720"></canvas></div><i class="wp"></i></div>';
const wh=host.firstChild,cv=host.querySelector('.wcv'),ov=host.querySelector('.wov'),ent=host.querySelector('.wsp'),ptr=host.querySelector('.wp'),RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
Wheel.draw(cv);Wheel.mark(ov,-1);
let ang=Math.random()*360,spin=null,reveal=0,raf=0,last=performance.now(),win=-1,idle=0,seg=-1;
const under=a=>Math.floor((((-a)%360)+360)%360/45);
const done=()=>{ang=spin.a1;const rw=spin.rw;spin=null;Wheel.busy=false;Daily.credit();Wheel.mark(ov,win);ov.classList.add('on');reveal=Date.now()+6000;App.bal();FX.confetti(wh,34);App.toast('Daily reward: '+Wheel.text(rw));if(onDone)onDone(rw)};
const loop=now=>{const dt=Math.min(.05,(now-last)/1000);last=now;const rdy=Daily.ready(),show=rdy||spin||Date.now()<reveal;wh.classList.toggle('ready',rdy&&!spin);wh.classList.toggle('locked',!show);
if(!show&&ov.classList.contains('on'))ov.classList.remove('on');
if(spin){const p=Math.min(1,(now-spin.t0)/CFG.DAILY.SPIN_MS);ang=spin.a0+(spin.a1-spin.a0)*ease(p);const s=under(ang);if(s!==seg){seg=s;if(!RM){ptr.classList.remove('tick');void ptr.offsetWidth;ptr.classList.add('tick')}}if(p>=1)done()}
else{idle+=((rdy&&!RM?10:0)-idle)*Math.min(1,dt*3);ang+=idle*dt}
ent.style.transform=`rotate(${ang.toFixed(3)}deg)`;raf=requestAnimationFrame(loop)};
raf=requestAnimationFrame(loop);
return{spin(){if(spin||Wheel.busy)return false;const rw=Daily.claim();if(!rw){App.toast('Daily spin not ready yet');return false}
const ty=rw.id==='low'?'A':rw.id==='gem'?'B':'X',ix=Wheel.SEG.map((t,k)=>t===ty?k:-1).filter(k=>k>=0),k=ix[Math.floor(Econ.rnd()*ix.length)],ctr=k*45+22.5,off=(Econ.rnd()-.5)*30,base=ang+5*360;
Wheel.busy=true;win=k;ov.classList.remove('on');spin={t0:performance.now(),a0:ang,a1:base+((((360-ctr-off)-base)%360)+360)%360,rw};seg=under(ang);Shell.tick();return true},destroy(){cancelAnimationFrame(raf);Wheel.busy=false}}};
/* ---------- 2) toast de-dupe ---------- */
if(typeof App!=='undefined'&&App.toast){const t=App.toast;let lm='',lt=0;App.toast=function(m){const n=Date.now();if(m===lm&&n-lt<800)return;lm=m;lt=n;return t.call(this,m)}}
/* ---------- 3) press pulse (visual only; never blocks a click) ---------- */
document.addEventListener('click',e=>{const t=e.target,b=t&&t.closest&&t.closest('.btn,.pillbtn,.mini,.rpb,.prevbtn,.eqb,.xbtn,.qb');
if(b&&!b.disabled){b.classList.remove('fb-press');void b.offsetWidth;b.classList.add('fb-press');setTimeout(()=>b.classList.remove('fb-press'),200)}},true);
})();
