Games.cases=(()=>{
// v2.6c: base spin is faster: DUR 6500 -> 5000 ms (1.5 s quicker before rank speed). Odds, payouts and tease/tip/flip logic are unchanged.
// v2.6b economy: Secret pays 6-30x and the other tiers were raised for a higher payout: Common .3-.85x, Uncommon 1-1.25x, Rare 1.35-1.8x, Legendary 2.4-3.3x, Mythic 3.6-4.9x. Return ~100.8% (was 99.2%) with the odds unchanged and 48.5% of rounds in profit; the edge is thin, so money still comes from long grinding (rank money counts only positive round profits).
// v2.5: new 0x "X" outcome. Real odds (p): X 31.5 / Common 20 / Uncommon 27 / Rare 13 / Legendary 5.2 / Mythic 2.6 / Secret 0.7. The "Case Odds" list shows d: X 26 / Common 25 / Uncommon 27 / Rare 13 / Legendary 5 / Mythic 3 / Secret 1.
// ---- Odds config: p = percent actually rolled (one decimal place max, must total 100); d = percent shown in the "Case Odds" list (display text only); fx = VFX colour ----
const RAR = [
  { k: 'X',         c: '#ef4444', b: '#ef4444', min: 0, max: 0,          p: 31.5,d: 26, zero: 1 },
  { k: 'Common',    c: '#a3a3a3', ic: 'img/case-common.png',    min: .3,  max: .85, p: 20,  d: 25 },
  { k: 'Uncommon',  c: '#22c55e', ic: 'img/case-uncommon.png',  min: 1,   max: 1.25,p: 27,  d: 27 },
  { k: 'Rare',      c: '#4f6bff', ic: 'img/case-rare.png',      min: 1.35,max: 1.8, p: 13,  d: 13 },
  { k: 'Legendary', c: '#fbbf24', ic: 'img/case-legendary.png', min: 2.4, max: 3.3, p: 5.2, d: 5,  fx: '#fbbf24' },
  { k: 'Mythic',    c: '#ef4444', ic: 'img/case-mythic.png',    min: 3.6, max: 4.9, p: 2.6, d: 3,  fx: '#ef4444' },
  { k: 'Secret',    c: '#05070a', b: '#6b7280', ic: 'img/case-secret.png', min: 6, max: 30, p: .7, d: 1, fx: '#e5e7eb' }
];const LIFE=['Legendary','Mythic','Secret'],LOCK_BEAT=3000;
/* Presentation-only events. They are decided AFTER the real result is rolled and never change it, the payout, or the odds:
   TEASE_P (v2.3: 60%, was 80%) = chance a Legendary+ neighbour of a Common/Uncommon result triggers the near-miss rollback.
   For a Rare+ result: FAKE_P = chance it is shown as a "fake common" that flips to the real reward; else TIP_P = chance the strip overshoots onto a Common and rolls back to it. */
const TEASE_P=.6,FAKE_P=.12,TIP_P=.15,MIN_REAL=3,FLIP_MS=900,XDOWN_P=.06,XUP_P=.04;
/* v2.5 X flips (presentation only, rare): XDOWN_P = chance a real X is first shown as a Common/Uncommon/Rare tile that flips over to the X; XUP_P = chance a non-X result is first shown as an X that flips over to its real (better) rarity. */
const spinSpeed=rk=>{for(const[r,s]of CFG.SPIN_SPEED)if(rk>=r)return s;return 1};
RAR.forEach(r=>r.w=Math.round(r.p*10));const TOT=RAR.reduce((a,r)=>a+r.w,0);
const DUR=5000,TEASE=2400,TEASE_HOLD=.62,EA=.1,EC=.35,EL=1-EC,EV=1/(EA/2+(EC-EA)+EL/3);
function ease(p){if(p<=0)return 0;if(p>=1)return 1;if(p<EA)return .5*EV*p*p/EA;const d1=.5*EV*EA;if(p<EC)return d1+EV*(p-EA);const q=(p-EC)/EL;return d1+EV*(EC-EA)+EV*EL/3*(1-Math.pow(1-q,3))}
const easeIO=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
if(TOT!==1000||RAR.reduce((a,r)=>a+r.d,0)!==100)console.error('Case odds must total 100');
const TW=104,STEP=114,N=60,WIN=48,REST=4;
/* Dramatic near-miss: the result is a Common/Uncommon but a Legendary+ tile sits right next to it. Returns that neighbour's index (highest rarity wins), else -1. */
function teaseIdx(arr,win,winner){if(winner.r.k!=='X'&&winner.r.k!=='Common'&&winner.r.k!=='Uncommon')return -1;
const c=[win-1,win+1].filter(i=>arr[i]&&arr[i].r.fx);if(!c.length)return -1;const rk=i=>RAR.findIndex(x=>x.k===arr[i].r.k);return c.sort((a,b)=>rk(b)-rk(a)||a-b)[0]}
/* Strip position at time t (ms). Normal spin: eased move x0->xT. Tease / tip-over: eased move to xA (a Legendary+ tile, or the Common the strip overshoots onto), a slow crawl while sitting there,
   then a last-moment slide onto the real result (xT). xT may be left OR right of xA (rollback). */
function pos(t,m){if(t<=0)return m.x0;if(t<m.dur)return m.x0+(m.xA-m.x0)*ease(t/m.dur);if(!m.tease||t>=m.dur+m.tease)return m.xT;
const p=(t-m.dur)/m.tease,dir=Math.sign(m.xT-m.xA)||1,hd=m.hold||TEASE_HOLD,cr=Math.min(m.cap||10,Math.abs(m.xT-m.xA)*.09);
if(p<hd)return m.xA+dir*cr*(p/hd);const q=(p-hd)/(1-hd);return m.xA+dir*cr+(m.xT-m.xA-dir*cr)*easeIO(q)}
const isReal=o=>RAR.findIndex(x=>x.k===o.r.k)>=MIN_REAL;
/* Decide the presentation of an already-rolled result. dev (dev builds only) can force one event; production never passes it. */
function present(o,rnd,dev){if(o.r.k==='X'){if(rnd()<XDOWN_P){const L=['Common','Uncommon','Rare'];return{fake:true,tip:false,look:L[Math.floor(rnd()*3)]}}return{fake:false,tip:false}}
if(rnd()<XUP_P)return{fake:true,tip:false,look:'X'};
if(!isReal(o))return{fake:false,tip:false};
if(dev&&dev.fake)return{fake:true,tip:false};if(dev&&dev.tip)return{fake:false,tip:true};
if(rnd()<FAKE_P)return{fake:true,tip:false};return{fake:false,tip:rnd()<TIP_P}}
const api={title:'CASES',RAR,XDOWN_P,XUP_P,spinSpeed,teaseIdx,pos,present,WIN,STEP,FAKE_P,TIP_P,TEASE_P,DUR,mount(el){
if(!document.getElementById('stk-cs')){const s=document.createElement('style');s.id='stk-cs';s.textContent=`
.cs-odds{font-size:20px;line-height:1.5;text-align:center}.cs-odds h3{margin:6px 0;font-weight:400;font-size:26px;color:#a3a3a3}
.cs-past{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 14px;min-height:30px;justify-content:flex-start}.cs-past b{font-size:13px;padding:4px 14px;border-radius:999px;background:var(--c);color:#fff;border:2px solid var(--b)}
.cs-wrap{position:relative;overflow:hidden;height:215px;background:#050505;border-radius:12px}.cs-strip{display:flex;gap:10px;padding-top:8px;will-change:transform}
.ct{flex:0 0 ${TW}px;height:150px;border-radius:12px;border:3px solid var(--b);background:linear-gradient(#1f1f1f,#111111);display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:12px 6px 8px;color:var(--b);cursor:pointer;opacity:.55;filter:saturate(.35) brightness(.75);box-shadow:0 8px 14px #000a;transition:opacity .2s,filter .2s,transform .2s,box-shadow .2s}.ct.sel{opacity:1;filter:none;transform:scale(1.05);box-shadow:0 0 26px var(--b)}.ct:focus-visible{outline:3px solid #fff}
.ct i{font-style:normal;line-height:1;display:flex;align-items:center;justify-content:center;width:72px;height:72px;filter:drop-shadow(0 0 8px var(--b))}
.ct i img{width:100%;height:100%;object-fit:contain;pointer-events:none}.ct.win{outline:3px solid #fff;box-shadow:0 0 32px var(--b);transform:scale(1.07);opacity:1;filter:none}
.ct i.noimg{border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffffffaa,var(--b) 62%)}   /* v2.6: art file unavailable (offline and never cached): a rarity-coloured orb instead of a broken image */
.cs-sel{position:absolute;left:50%;top:4px;width:${TW+10}px;height:160px;transform:translateX(-50%);border:3px solid #fff;border-radius:14px;box-shadow:0 0 18px #fff6;pointer-events:none;transition:border-color .3s,box-shadow .3s}
.cs-ptr{position:absolute;left:50%;top:166px;width:3px;height:34px;margin-left:-1px;background:#fff;pointer-events:none}.cs-ptr::after{content:"";position:absolute;left:-8px;bottom:-14px;width:16px;height:16px;border:3px solid #fff;border-radius:50%;background:#050505}
.cs-res{margin-top:14px;font-size:17px;min-height:50px}
.cs-life{display:flex;gap:16px;flex-wrap:wrap;justify-content:flex-start;margin:0 0 8px;font-size:14px;font-weight:700}.cs-life b{font-weight:900}.cs-life span:first-child{color:#a3a3a3;font-weight:400}
#go .spd{display:inline-block;margin-left:8px;padding:1px 8px;border-radius:999px;border:2px solid currentColor;font-size:12px;font-weight:900;vertical-align:1px}.cs-hint{font-size:12px;color:#a3a3a3;text-align:center}
.ct.hi{position:relative;overflow:hidden;opacity:.9;filter:saturate(.9) brightness(.95);animation:csGlow 2s ease-in-out infinite}
.ct.hi::before{content:"";position:absolute;top:-10%;bottom:-10%;left:-60%;width:50%;background:linear-gradient(100deg,transparent,var(--fx),transparent);opacity:.4;transform:skewX(-18deg);animation:csSheen 2.4s linear infinite;pointer-events:none}
.ct.hi::after{content:"";position:absolute;left:0;right:0;bottom:0;height:70%;background:radial-gradient(circle at 20% 100%,var(--fx) 0 2px,transparent 3px),radial-gradient(circle at 55% 100%,var(--fx) 0 2px,transparent 3px),radial-gradient(circle at 85% 100%,var(--fx) 0 1.5px,transparent 2.5px);opacity:0;pointer-events:none;animation:csRise 2.2s ease-in infinite}
.ct.r-Mythic{animation-duration:1.1s}.ct.r-Mythic::before{animation-duration:1.6s}.ct.r-Mythic::after{animation-duration:1.4s}
.ct.r-Secret{animation-duration:1.5s}.ct.r-Secret i{animation:csFlick 1.8s steps(1) infinite}.ct.r-Secret::before{opacity:.55}
.ct.hi.sel,.ct.hi.win{opacity:1;filter:none}.ct.hi.win{animation:csWin .7s ease-in-out infinite}
.ct.fkflip{animation:csFlip ${FLIP_MS}ms ease-in-out}@keyframes csFlip{0%,100%{transform:scale(1.05,1.05)}50%{transform:scale(0,1.05)}}
@keyframes csGlow{0%,100%{box-shadow:0 0 6px var(--fx),0 8px 14px #000a}50%{box-shadow:0 0 22px var(--fx),0 8px 14px #000a}}
@keyframes csWin{0%,100%{box-shadow:0 0 22px var(--fx),0 0 40px var(--fx)}50%{box-shadow:0 0 46px var(--fx),0 0 90px var(--fx)}}
@keyframes csSheen{from{left:-60%}to{left:130%}}@keyframes csRise{0%{opacity:0;transform:translateY(30%)}30%{opacity:.9}100%{opacity:0;transform:translateY(-60%)}}
@keyframes csFlick{0%,100%{opacity:1}46%{opacity:1}48%{opacity:.25}50%{opacity:1}52%{opacity:.4}54%{opacity:1}}
.cs-burst{position:absolute;left:50%;top:50%;width:0;height:0;pointer-events:none;z-index:5}
.cs-burst b{position:absolute;left:-4px;top:-4px;width:8px;height:8px;border-radius:50%;background:var(--fx);box-shadow:0 0 10px var(--fx);animation:csPart 1.2s ease-out forwards}
.cs-ring{position:absolute;left:-14px;top:-14px;width:28px;height:28px;border-radius:50%;border:4px solid var(--fx);box-shadow:0 0 18px var(--fx);animation:csRing 1s ease-out forwards}
.cs-flash{position:absolute;left:-400px;top:-120px;width:800px;height:240px;background:radial-gradient(ellipse,var(--fx),transparent 65%);opacity:0;animation:csFlash .9s ease-out forwards}
@keyframes csPart{to{transform:translate(var(--dx),var(--dy)) scale(.2);opacity:0}}@keyframes csRing{to{transform:scale(16);opacity:0;border-width:1px}}@keyframes csFlash{0%{opacity:.9}100%{opacity:0}}
.cs-wrap.glow{animation:csFrame 1.8s ease-out}@keyframes csFrame{0%,100%{box-shadow:0 0 0 var(--fx)}15%{box-shadow:0 0 40px var(--fx),inset 0 0 40px var(--fx)}}
.cs-wrap.tense{animation:csTense .55s ease-in-out infinite}.cs-wrap.tense .cs-sel{border-color:var(--fx);box-shadow:0 0 30px var(--fx)}
@keyframes csTense{0%,100%{box-shadow:0 0 8px var(--fx),inset 0 0 6px var(--fx)}50%{box-shadow:0 0 38px var(--fx),inset 0 0 34px var(--fx)}}`;document.head.appendChild(s)}
el.innerHTML=`<div class="play"><div class="side"><label>Wager</label>${App.betHTML()}<button class="btn" id="go">Place Wager</button><div class="cs-hint">Press Space to place a wager</div><div class="cs-odds"><h3>Case Odds:</h3>${RAR.map(r=>`<div style="color:${r.k==='Secret'?'#0a0a0a;text-shadow:0 0 6px #fff,0 0 2px #888':r.c}">${r.k}: ${r.d}%</div>`).join('')}</div></div><div class="stage"><div class="cs-life" id="lf"></div><div style="text-align:left;color:#a3a3a3">Past Rolls:</div><div class="cs-past" id="pa"></div><div class="cs-wrap" id="wr"><div class="cs-strip" id="sr"></div><div class="cs-sel"></div><div class="cs-ptr"></div></div><div class="cs-res" id="rs">Place a wager to open a case.</div></div></div>`;
const q=s=>el.querySelector(s),go=q('#go'),wr=q('#wr'),sr=q('#sr'),rs=q('#rs'),br=q('.betrow'),bi=q('.bet');
let hb=0,arr=[],sel=REST,busy=false,rd=null,past=[],prev=null,tm=[],raf=0,mo=null;
const rnd=()=>{try{return crypto.getRandomValues(new Uint32Array(1))[0]/4294967296}catch(e){return Math.random()}};
function roll(){let r=Math.floor(rnd()*TOT),i=0;for(;i<RAR.length-1;i++){if(r<RAR[i].w)break;r-=RAR[i].w}const z=RAR[i];return{r:z,m:Math.min(z.max,Math.max(z.min,Math.round((z.min+rnd()*(z.max-z.min))*100)/100))}}
const rollReal=()=>{let o;do{o=roll()}while(!isReal(o));return o};   // dev forcing only
const lookOf=k=>{const z=RAR.find(x=>x.k===k);return z.zero?{r:z,m:0}:{r:z,m:Math.round((z.min+rnd()*(z.max-z.min))*100)/100}},commonLook=()=>lookOf('Common');
const XSVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 4.5l15 15M19.5 4.5l-15 15" stroke="currentColor" stroke-width="4.6" stroke-linecap="round" fill="none"/></svg>',lbl=o=>o.r.zero?'X':o.m.toFixed(2)+'x';
const tile = (o, i) =>
  `<div class="ct${o.r.fx ? ' hi r-' + o.r.k : o.r.zero ? ' r-X' : ''}" data-i="${i}" tabindex="0"
       role="button" aria-label="${o.r.k} ${lbl(o)}"
       style="--c:${o.r.c};--b:${o.r.b || o.r.c};--fx:${o.r.fx || o.r.c}">
     <i>${o.r.zero ? XSVG : `<img src="${o.r.ic}" alt="" onerror="this.parentNode.classList.add('noimg');this.remove()">`}</i>
     <b>${lbl(o)}</b>
   </div>`;const pill=o=>`<b style="--c:${o.r.c};--b:${o.r.b||o.r.c}">${lbl(o)}</b>`;
function center(i){return wr.clientWidth/2-(i*STEP+TW/2)}
/* winner = what the strip shows at WIN (a fake common when rd.fake); after = optional tile forced right after WIN (the Common a tip-over overshoots onto) */
function build(winner,after){const a=Array.from({length:N},()=>roll());a[REST]=prev||a[REST];if(winner)a[WIN]=winner;if(after)a[WIN+1]=after;arr=a;sr.innerHTML=a.map((o,i)=>tile(o,i)).join('');sr.style.transition='none';sr.style.transform=`translate3d(${center(REST)}px,0,0)`;sel=-1;mark(REST);return a}
function mark(i){const o=sr.children[sel];if(o){o.classList.remove('sel');o.removeAttribute('aria-pressed')}sel=i;const n=sr.children[i];if(n){n.classList.add('sel');n.setAttribute('aria-pressed','true')}}
function choose(i){if(busy||!sr.children[i])return;mark(i);sr.style.transition='transform .35s ease';sr.style.transform=`translate3d(${center(i)}px,0,0)`}
function settleOnce(){if(!rd||rd.settled)return 0;rd.settled=true;Store.d.cs=(Store.d.cs||0)+1;if(LIFE.includes(rd.o.r.k))Store.d.cc[rd.o.r.k]=(Store.d.cc[rd.o.r.k]||0)+1;const pay=App.settle('CASES',rd.bet,Math.round(rd.bet*rd.o.m*100)/100);return pay}
/* Landing: the strip stops on WIN. A fake common first flips over to the REAL tile (rd.o, the same object that is settled), then the round concludes. */
function finish(){if(!busy||rd.finished||rd.landing)return;rd.landing=true;cancelAnimationFrame(raf);wr.classList.remove('tense');sr.style.transform=`translate3d(${mo.xT}px,0,0)`;mark(WIN);
if(rd.fake){const t0=sr.children[WIN];t0.classList.add('fkflip');tm.push(setTimeout(()=>{const h=document.createElement('div');h.innerHTML=tile(rd.o,WIN);const n=h.firstElementChild;t0.className=n.className+' sel fkflip';t0.setAttribute('style',n.getAttribute('style'));t0.setAttribute('aria-label',n.getAttribute('aria-label'));t0.innerHTML=n.innerHTML;arr[WIN]=rd.o},FLIP_MS/2));tm.push(setTimeout(conclude,FLIP_MS+500))}
else conclude()}
function conclude(){if(!busy||rd.finished)return;rd.finished=true;sr.children[WIN].classList.add('win');
const pay=settleOnce(),pr=Math.round((pay-rd.bet)*100)/100,o=rd.o;life();burst(o);prev=o;past.unshift(o);past=past.slice(0,7);q('#pa').innerHTML=past.map(pill).join('');
rs.innerHTML=`Wager: <b>$${App.f(rd.bet)}</b> • Multiplier: <b style="color:${o.r.k==='Secret'?'#fff':o.r.c}">${o.r.zero?'X (0x)':o.m.toFixed(2)+'x ('+o.r.k+')'}</b> • Payout: <b style="color:${pr>=0?'#22c55e':'#ef4444'}">$${App.f(pay)}</b>`;
App.toast(pr>=0?`${lbl(o)}: +$${App.f(pr)} profit`:`${lbl(o)}: lost $${App.f(-pr)}`);
busy=false;unlock();go.disabled=false;goTxt();br.classList.remove('dis');bi.disabled=false}
function life(){q('#lf').innerHTML='<span>Lifetime spins:</span><span style="color:#e2e8f0">Total: <b>'+(Store.d.cs||0).toLocaleString('en-US')+'</b></span>'+LIFE.map(k=>{const r=RAR.find(x=>x.k===k);return `<span style="color:${r.fx}">${k}: <b>${Store.d.cc[k]||0}</b></span>`}).join('')}
function burst(o){if(!o.r.fx)return;const n={Legendary:18,Mythic:28,Secret:40}[o.r.k],f=document.createElement('div');f.className='cs-burst';f.style.setProperty('--fx',o.r.fx);let h='<i class="cs-flash"></i><i class="cs-ring"></i>';
for(let i=0;i<n;i++){const a=Math.random()*6.283,d=70+Math.random()*(o.r.k==='Legendary'?90:150);h+=`<b style="--dx:${Math.cos(a)*d*1.6}px;--dy:${Math.sin(a)*d*.8}px;animation-delay:${Math.random()*.12}s"></b>`}
f.innerHTML=h;wr.appendChild(f);wr.style.setProperty('--fx',o.r.fx);wr.classList.remove('glow');void wr.offsetWidth;wr.classList.add('glow');tm.push(setTimeout(()=>f.remove(),1600))}
const goTxt=()=>{go.innerHTML='Place Wager <span class="spd" title="Spin animation speed for your rank">'+spinSpeed(Store.d.rk)+'x</span>'};
const unlock=()=>{clearInterval(hb);Lock.release('CASES')},leave=()=>Lock.release('CASES');
function spin(){if(busy)return;
if(!Lock.acquire('CASES')){App.toast('Another tab is wagering on Cases. Wait for it to finish.');return}
const bet=App.bet(el,'CASES',1);if(!bet){Lock.release('CASES');return}
busy=true;clearInterval(hb);hb=setInterval(()=>{if(!Lock.beat('CASES'))Lock.acquire('CASES')},LOCK_BEAT);
/* 1) the real result is rolled first (unchanged RNG). 2) only then is its presentation chosen. */
const dev=api.dev;let o=roll(),pr,frc=false;if(dev&&dev.rar&&dev.left>0){o=lookOf(dev.rar);frc=true;if(--dev.left<=0){dev.rar=null;dev.left=0}}if(!frc&&dev&&(dev.fake||dev.tip)){o=rollReal();pr=present(o,rnd,dev);if(pr.fake)dev.fake=0;else dev.tip=0}else pr=present(o,rnd);
rd={bet,o,settled:false,finished:false,fake:pr.fake,tip:pr.tip};go.disabled=true;go.textContent='Opening…';br.classList.add('dis');bi.disabled=true;
rs.innerHTML=`Wager placed: <b>$${App.f(bet)}</b>. Opening case…`;prev=arr[sel]||prev;build(rd.fake?lookOf(pr.look||'Common'):rd.o,rd.tip?commonLook():null);
const spd=spinSpeed(Store.d.rk);let hi=rd.fake||rd.tip?-1:teaseIdx(arr,WIN,rd.o);if(hi>=0&&rnd()>=TEASE_P)hi=-1;
const xT=center(WIN),dur=DUR/spd,tz=rd.tip?TEASE*(.8+rnd()*.5)/spd:hi<0?0:TEASE*(.7+rnd()*.7)/spd;   // tease length, hold point and crawl distance vary every spin
mo={x0:center(REST),xA:rd.tip?center(WIN+1):hi<0?xT:center(hi),xT,dur,tease:tz,hold:.35+rnd()*.5,cap:4+rnd()*14};rd.total=dur+tz;if(hi>=0)wr.style.setProperty('--fx',arr[hi].r.fx);
const t0=performance.now();(function f(now){const t=now-t0,x=pos(t,mo);sr.style.transform=`translate3d(${x}px,0,0)`;if(hi>=0&&t>=dur)wr.classList.add('tense');const ti=Math.round((wr.clientWidth/2-TW/2-x)/STEP);if(ti!==sel&&ti>=0&&ti<N)mark(ti);if(t<rd.total)raf=requestAnimationFrame(f)})(t0);
tm.push(setTimeout(finish,rd.total))}
go.onclick=()=>spin();
const rest=()=>{if(!busy)sr.style.transform=`translate3d(${center(sel)}px,0,0)`};sr.onclick=e=>{const t=e.target.closest('.ct');if(t)choose(+t.dataset.i)};
sr.onkeydown=e=>{const t=e.target.closest('.ct');if(!t)return;const i=+t.dataset.i;if(e.key==='Enter'){e.preventDefault();choose(i)}else if(e.key===' '&&!e.repeat){e.preventDefault();spin()}else if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const j=i+(e.key==='ArrowRight'?1:-1);if(sr.children[j]){choose(j);sr.children[j].focus({preventScroll:true})}}};addEventListener('resize',rest);
addEventListener('pagehide',leave);
el.addEventListener('click',e=>{const m=e.target.closest('.mini');if(m)m.blur()});
build();life();goTxt();
return()=>{removeEventListener('pagehide',leave);cancelAnimationFrame(raf);tm.forEach(clearTimeout);removeEventListener('resize',rest);if(busy)settleOnce();unlock()}}};
return api})();
