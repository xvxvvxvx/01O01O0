Games.cases=(()=>{
// v2.7: new top tier "Pirate Token" (0.2% rolled, 100-150x, animated gold). Rolled odds: X 31.3 / Common 20 / Uncommon 27 / Rare 13 / Legendary 5.2 / Mythic 2.6 / Secret 0.7 / Pirate 0.2 (total 100). The "Case Odds" list shows X 26 / Common 25 / Uncommon 27 / Rare 13 / Legendary 5 / Mythic 3 / Secret 0.8 / Pirate 0.2 (total 100).
// Pirate Token presentation: gold coin particles when the strip rolls past it and when it lands, then a full-screen chest cinematic (chest opens, coins explode and overflow, "PIRATE TOKEN / NEW RARITY ACHIEVED"). Presentation only: the result is rolled first and never changed by any animation.
// v2.6b economy: Secret pays 6-30x and the other tiers were raised for a higher payout: Common .3-.85x, Uncommon 1-1.25x, Rare 1.35-1.8x, Legendary 2.4-3.3x, Mythic 3.6-4.9x. The Pirate Token (avg 125x at 0.2%) adds about 25 points of return on top of that.
// v2.5: new 0x "X" outcome (red X tile).
// ---- Odds config: p = percent actually rolled (one decimal place max, must total 100); d = percent shown in the "Case Odds" list (display text only); fx = VFX colour; n = display name (defaults to the key); gold = Pirate Token presentation ----
const RAR = [
  { k: 'X',         c: '#ef4444', b: '#ef4444', min: 0, max: 0,          p: 31.3, d: 26, zero: 1 },
  { k: 'Common',    c: '#a3a3a3', ic: 'img/case-common.png',    min: .3,  max: .85, p: 20,  d: 25 },
  { k: 'Uncommon',  c: '#22c55e', ic: 'img/case-uncommon.png',  min: 1,   max: 1.25,p: 27,  d: 27 },
  { k: 'Rare',      c: '#4f6bff', ic: 'img/case-rare.png',      min: 1.35,max: 1.8, p: 13,  d: 13 },
  { k: 'Legendary', c: '#fbbf24', ic: 'img/case-legendary.png', min: 2.4, max: 3.3, p: 5.2, d: 5,  fx: '#fbbf24' },
  { k: 'Mythic',    c: '#ef4444', ic: 'img/case-mythic.png',    min: 3.6, max: 4.9, p: 2.6, d: 3,  fx: '#ef4444' },
  { k: 'Secret',    c: '#05070a', b: '#6b7280', ic: 'img/case-secret.png', min: 6, max: 30, p: .7, d: .8, fx: '#e5e7eb' },
  { k: 'Pirate',    n: 'Pirate Token', c: '#ffd84d', b: '#d4a017', ic: 'img/case-pirate.jpg', min: 100, max: 150, p: .2, d: .2, fx: '#ffd84d', gold: 1 }
];
const LIFE=['Legendary','Mythic','Secret','Pirate'],LOCK_BEAT=3000;
/* Presentation-only events. They are decided AFTER the real result is rolled and never change it, the payout, or the odds:
   TEASE_P (v2.3: 60%, was 80%) = chance a Legendary+ neighbour of a Common/Uncommon result triggers the near-miss rollback.
   For a Rare+ result: FAKE_P = chance it is shown as a "fake common" that flips to the real reward; else TIP_P = chance the strip overshoots onto a Common and rolls back to it. */
const TEASE_P=.6,FAKE_P=.12,TIP_P=.15,MIN_REAL=3,FLIP_MS=900,XDOWN_P=.06,XUP_P=.04;
/* v2.5 X flips (presentation only, rare): XDOWN_P = chance a real X is first shown as a Common/Uncommon/Rare tile that flips over to the X; XUP_P = chance a non-X result is first shown as an X that flips over to its real (better) rarity. */
const spinSpeed=rk=>{for(const[r,s]of CFG.SPIN_SPEED)if(rk>=r)return s;return 1};
RAR.forEach(r=>r.w=Math.round(r.p*10));const TOT=RAR.reduce((a,r)=>a+r.w,0);
const nm=o=>o.r.n||o.r.k;
const DUR=6500,TEASE=2400,TEASE_HOLD=.62,EA=.1,EC=.35,EL=1-EC,EV=1/(EA/2+(EC-EA)+EL/3);
function ease(p){if(p<=0)return 0;if(p>=1)return 1;if(p<EA)return .5*EV*p*p/EA;const d1=.5*EV*EA;if(p<EC)return d1+EV*(p-EA);const q=(p-EC)/EL;return d1+EV*(EC-EA)+EV*EL/3*(1-Math.pow(1-q,3))}
const easeIO=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
if(TOT!==1000||Math.abs(RAR.reduce((a,r)=>a+r.d,0)-100)>1e-9)console.error('Case odds must total 100');
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

/* ---------- Pirate Token chest cinematic: artwork ---------- */
const star=(n,ro,ri,rot=0)=>{const o=[];for(let k=0;k<n*2;k++){const r=k%2?ri:ro,t=Math.PI*k/n-Math.PI/2+rot;o.push((100+r*Math.cos(t)).toFixed(1)+','+(100+r*Math.sin(t)).toFixed(1))}return o.join(' ')};
const MEDAL=`<svg viewBox="0 0 200 200" aria-hidden="true"><defs><linearGradient id="ptmg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6c0"/><stop offset=".5" stop-color="#ffd84d"/><stop offset="1" stop-color="#a87000"/></linearGradient></defs><g class="ring"><polygon points="${star(4,98,30)}" fill="url(#ptmg)" stroke="#6b4600" stroke-width="3" stroke-linejoin="round"/><polygon points="${star(4,74,26,Math.PI/4)}" fill="url(#ptmg)" stroke="#6b4600" stroke-width="3" stroke-linejoin="round" opacity=".92"/></g><circle cx="100" cy="100" r="56" fill="url(#ptmg)" stroke="#6b4600" stroke-width="5"/><circle cx="100" cy="100" r="44" fill="#c58d0a" stroke="#fff2a8" stroke-width="3"/><text x="100" y="128" text-anchor="middle" font-size="84" font-weight="900" font-family="'Playfair Display',Georgia,serif" fill="#fff6c8" stroke="#7a4f00" stroke-width="3" paint-order="stroke">P</text></svg>`;
const coinEl=(x,y,d)=>`<ellipse cx="${x}" cy="${y}" rx="11" ry="4.2" fill="url(#ptg)" stroke="#7a4f00" stroke-width="1.4"${d!=null?` style="animation-delay:${d}s"`:''}/>`;
const PILE=[[44,80],[66,76],[88,73],[110,71],[132,73],[154,76],[176,80],[56,70],[78,66],[100,64],[122,64],[144,67],[166,71],[90,57],[110,55],[130,58]],
SPILL=[[26,96,2.3],[194,100,2.45],[34,116,2.6],[186,120,2.75],[24,136,2.9],[196,138,3.0]];
const CHEST=`<svg class="ptc" viewBox="0 0 220 170" aria-hidden="true"><defs><linearGradient id="ptw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a2b"/><stop offset="1" stop-color="#3b200c"/></linearGradient><linearGradient id="ptg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset=".5" stop-color="#ffd84d"/><stop offset="1" stop-color="#9a6a00"/></linearGradient><radialGradient id="ptgl"><stop offset="0" stop-color="#fffbe0"/><stop offset="1" stop-color="#ffd84d" stop-opacity="0"/></radialGradient></defs>
<ellipse class="glow" cx="110" cy="82" rx="92" ry="16" fill="url(#ptgl)"/>
<g class="body"><rect x="22" y="82" width="176" height="70" rx="7" fill="url(#ptw)" stroke="#1a0d04" stroke-width="4"/><path d="M22 106H198M22 130H198" stroke="#1a0d04" stroke-opacity=".5" stroke-width="2"/><rect x="22" y="82" width="176" height="8" fill="url(#ptg)" stroke="#6b4600" stroke-width="2"/><rect x="22" y="144" width="176" height="8" fill="url(#ptg)" stroke="#6b4600" stroke-width="2"/><rect x="50" y="82" width="12" height="70" fill="url(#ptg)" stroke="#6b4600" stroke-width="2"/><rect x="158" y="82" width="12" height="70" fill="url(#ptg)" stroke="#6b4600" stroke-width="2"/><rect x="96" y="96" width="28" height="30" rx="5" fill="url(#ptg)" stroke="#6b4600" stroke-width="3"/><circle cx="110" cy="107" r="4" fill="#2a1500"/><rect x="108.5" y="108" width="3" height="10" fill="#2a1500"/></g>
<g class="pile">${PILE.map(([x,y])=>coinEl(x,y)).join('')}</g>
<g class="spill">${SPILL.map(([x,y,d])=>coinEl(x,y,d)).join('')}</g>
<g class="lid"><path d="M22 84V60a28 28 0 0 1 28-28H170a28 28 0 0 1 28 28V84Z" fill="url(#ptw)" stroke="#1a0d04" stroke-width="4"/><rect x="50" y="32" width="12" height="52" fill="url(#ptg)" stroke="#6b4600" stroke-width="2"/><rect x="158" y="32" width="12" height="52" fill="url(#ptg)" stroke="#6b4600" stroke-width="2"/><rect x="22" y="76" width="176" height="8" fill="url(#ptg)" stroke="#6b4600" stroke-width="2"/><circle cx="110" cy="55" r="18" fill="url(#ptg)" stroke="#6b4600" stroke-width="3"/><circle cx="110" cy="53" r="12" fill="#f3e6c4" stroke="#3b200c" stroke-width="2"/><rect x="104" y="61" width="12" height="8" rx="2" fill="#f3e6c4" stroke="#3b200c" stroke-width="2"/><circle cx="105.5" cy="53" r="3" fill="#2a1500"/><circle cx="114.5" cy="53" r="3" fill="#2a1500"/><path d="M110 57l-2 3h4z" fill="#2a1500"/></g></svg>`;
/* one reusable coin sprite for the canvas particle show (built lazily: needs a DOM) */
let COIN=null;
function coinSprite(){if(COIN)return COIN;const s=document.createElement('canvas');s.width=s.height=48;const g=s.getContext('2d'),r=g.createRadialGradient(18,16,2,24,24,24);r.addColorStop(0,'#fff7c2');r.addColorStop(.5,'#ffd84d');r.addColorStop(1,'#b8860b');
g.fillStyle=r;g.beginPath();g.arc(24,24,22,0,7);g.fill();g.strokeStyle='#8a5a00';g.lineWidth=3;g.stroke();g.strokeStyle='#fff2a8';g.lineWidth=2;g.beginPath();g.arc(24,24,15,0,7);g.stroke();
g.fillStyle='#a87000';g.font='900 22px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('P',24,26);return COIN=s}
/* Coin explosion on a full-screen canvas. Timeline (seconds after the overlay opens): 1.75 big burst out of the chest, 1.9-3.4 overflow stream, 3.6+ gentle coin rain. Returns a stop() function. */
function coinShow(cv){const c=cv.getContext('2d'),DPR=Math.min(2,window.devicePixelRatio||1),spr=coinSprite();let W=0,H=0;
const size=()=>{W=window.innerWidth;H=window.innerHeight;cv.width=W*DPR;cv.height=H*DPR};size();window.addEventListener('resize',size);
const P=[],S=[],t0=performance.now();let last=t0,raf=0,burst=0,acc=0,acc2=0,acc3=0;
const mk=(x,y,vx,vy)=>{if(P.length<420)P.push({x,y,vx,vy,a:Math.random()*6.28,va:(Math.random()-.5)*10,s:Math.random()*6.28,vs:6+Math.random()*10,r:(8+Math.random()*8)*Math.max(.7,H/800)})};
function loop(now){const dt=Math.min(.05,(now-last)/1000),t=(now-t0)/1000,k=H/800,ox=W/2,oy=H*.56-4;last=now;
if(t>=1.75&&!burst){burst=1;for(let i=0;i<150;i++){const a=-Math.PI/2+(Math.random()-.5)*1.9,v=(520+Math.random()*700)*k;mk(ox+(Math.random()-.5)*60*k,oy,Math.cos(a)*v,Math.sin(a)*v)}}
if(t>1.9&&t<3.4){acc+=dt*190;while(acc>=1){acc--;const a=-Math.PI/2+(Math.random()-.5)*2.3,v=(220+Math.random()*520)*k;mk(ox+(Math.random()-.5)*120*k,oy,Math.cos(a)*v,Math.sin(a)*v)}}
if(t>3.6){acc2+=dt*10;while(acc2>=1){acc2--;mk(Math.random()*W,-20,(Math.random()-.5)*60,(80+Math.random()*200)*k)}}
if(t>1.8&&t<4.6){acc3+=dt*55;while(acc3>=1){acc3--;const ctr=t<3.2?[ox,oy-H*.12]:[W/2,H*.34];S.push({x:ctr[0]+(Math.random()-.5)*W*.5,y:ctr[1]+(Math.random()-.5)*H*.4,l:1,s:2+Math.random()*4})}}
c.setTransform(DPR,0,0,DPR,0,0);c.clearRect(0,0,W,H);
for(const p of P){p.vy+=1500*k*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.a+=p.va*dt;p.s+=p.vs*dt;c.save();c.translate(p.x,p.y);c.rotate(p.a);c.scale(Math.max(.12,Math.abs(Math.cos(p.s))),1);c.drawImage(spr,-p.r,-p.r,p.r*2,p.r*2);c.restore()}
for(let i=P.length-1;i>=0;i--)if(P[i].y>H+60)P.splice(i,1);
c.fillStyle='#fff6c0';for(const p of S){p.l-=dt*1.1;const r=p.s*(1+(1-p.l)*.5);c.globalAlpha=Math.max(0,p.l);c.beginPath();c.moveTo(p.x,p.y-r*2);c.lineTo(p.x+r*.5,p.y-r*.5);c.lineTo(p.x+r*2,p.y);c.lineTo(p.x+r*.5,p.y+r*.5);c.lineTo(p.x,p.y+r*2);c.lineTo(p.x-r*.5,p.y+r*.5);c.lineTo(p.x-r*2,p.y);c.lineTo(p.x-r*.5,p.y-r*.5);c.closePath();c.fill()}
c.globalAlpha=1;for(let i=S.length-1;i>=0;i--)if(S[i].l<=0)S.splice(i,1);
raf=requestAnimationFrame(loop)}
raf=requestAnimationFrame(loop);return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',size)}}

const api={title:'CASES',RAR,XDOWN_P,XUP_P,spinSpeed,teaseIdx,pos,present,WIN,STEP,FAKE_P,TIP_P,TEASE_P,mount(el){
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
/* v2.7 Pirate Token tile: animated gold gradient, gold coins rising out of the tile (kept above the .ct.fkflip rule so a fake-common flip still plays) */
.ct.r-Pirate{background:linear-gradient(115deg,#241700,#5c4000 38%,#a87a00 50%,#5c4000 62%,#241700);background-size:300% 100%;border-color:#ffd84d;animation:csGold 3s linear infinite,csGlow 1.6s ease-in-out infinite}
.ct.r-Pirate b{background:linear-gradient(90deg,#fff2a8,#ffd84d,#fff6c8,#d4a017,#fff2a8);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:csGold 2.2s linear infinite}
.ct.r-Pirate i{filter:drop-shadow(0 0 10px #ffd84d)}.ct.r-Pirate::before{opacity:.6;animation-duration:1.5s}
.ct.r-Pirate::after{height:90%;background:radial-gradient(circle at 16% 100%,#fff6b0 0 1.5px,#ffd84d 2.5px,#c8960c 4.5px,transparent 5.2px),radial-gradient(circle at 42% 100%,#fff6b0 0 1.5px,#ffd84d 2.5px,#c8960c 4.5px,transparent 5.2px),radial-gradient(circle at 66% 100%,#fff6b0 0 1.5px,#ffd84d 2.5px,#c8960c 4.5px,transparent 5.2px),radial-gradient(circle at 88% 100%,#fff6b0 0 1.5px,#ffd84d 2.5px,#c8960c 4.5px,transparent 5.2px);animation-duration:1.3s}
.ct.fkflip{animation:csFlip ${FLIP_MS}ms ease-in-out}@keyframes csFlip{0%,100%{transform:scale(1.05,1.05)}50%{transform:scale(0,1.05)}}
@keyframes csGlow{0%,100%{box-shadow:0 0 6px var(--fx),0 8px 14px #000a}50%{box-shadow:0 0 22px var(--fx),0 8px 14px #000a}}
@keyframes csWin{0%,100%{box-shadow:0 0 22px var(--fx),0 0 40px var(--fx)}50%{box-shadow:0 0 46px var(--fx),0 0 90px var(--fx)}}
@keyframes csSheen{from{left:-60%}to{left:130%}}@keyframes csRise{0%{opacity:0;transform:translateY(30%)}30%{opacity:.9}100%{opacity:0;transform:translateY(-60%)}}
@keyframes csFlick{0%,100%{opacity:1}46%{opacity:1}48%{opacity:.25}50%{opacity:1}52%{opacity:.4}54%{opacity:1}}
@keyframes csGold{to{background-position:300% 0}}
.cs-burst{position:absolute;left:50%;top:50%;width:0;height:0;pointer-events:none;z-index:5}
.cs-burst b{position:absolute;left:-4px;top:-4px;width:8px;height:8px;border-radius:50%;background:var(--fx);box-shadow:0 0 10px var(--fx);animation:csPart 1.2s ease-out forwards}
.cs-ring{position:absolute;left:-14px;top:-14px;width:28px;height:28px;border-radius:50%;border:4px solid var(--fx);box-shadow:0 0 18px var(--fx);animation:csRing 1s ease-out forwards}
.cs-flash{position:absolute;left:-400px;top:-120px;width:800px;height:240px;background:radial-gradient(ellipse,var(--fx),transparent 65%);opacity:0;animation:csFlash .9s ease-out forwards}
@keyframes csPart{to{transform:translate(var(--dx),var(--dy)) scale(.2);opacity:0}}@keyframes csRing{to{transform:scale(16);opacity:0;border-width:1px}}@keyframes csFlash{0%{opacity:.9}100%{opacity:0}}
.cs-wrap.glow{animation:csFrame 1.8s ease-out}@keyframes csFrame{0%,100%{box-shadow:0 0 0 var(--fx)}15%{box-shadow:0 0 40px var(--fx),inset 0 0 40px var(--fx)}}
.cs-wrap.tense{animation:csTense .55s ease-in-out infinite}.cs-wrap.tense .cs-sel{border-color:var(--fx);box-shadow:0 0 30px var(--fx)}
@keyframes csTense{0%,100%{box-shadow:0 0 8px var(--fx),inset 0 0 6px var(--fx)}50%{box-shadow:0 0 38px var(--fx),inset 0 0 34px var(--fx)}}
/* v2.7 Pirate Token: odds line, past-roll chip, gold coins sprayed over the strip */
.pg-tx{background:linear-gradient(90deg,#8a5a00,#d4a017,#fff2a8,#ffd84d,#b8860b,#8a5a00);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;font-weight:900;animation:csGold 4s linear infinite}
.cs-past b.pg{background:linear-gradient(90deg,#8a5a00,#d4a017,#fff2a8,#ffd84d,#b8860b,#8a5a00);background-size:300% 100%;color:#2a1a00;border-color:#ffd84d;animation:csGold 3s linear infinite}
.cs-coins{position:absolute;left:50%;top:50%;width:0;height:0;pointer-events:none;z-index:6}
.cs-coin{position:absolute;left:-7px;top:-7px;width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff7b8,#ffd84d 55%,#b8860b);box-shadow:inset 0 0 0 2px #8a5a00aa,0 0 8px #ffd84d;animation:csCoin 1.2s cubic-bezier(.2,.7,.3,1) forwards}
@keyframes csCoin{0%{transform:translate(0,0) rotateY(0) scale(.6);opacity:1}45%{transform:translate(calc(var(--dx)*.7),var(--dy)) rotateY(calc(var(--r)*.5)) scale(1)}100%{transform:translate(var(--dx),calc(var(--dy) + 170px)) rotateY(var(--r)) scale(.9);opacity:0}}
/* v2.7 Pirate Token cinematic overlay */
.pt-ov{position:fixed;inset:0;z-index:90;overflow:hidden;background:#000;animation:ptIn .35s both}@keyframes ptIn{from{opacity:0}}
.pt-ov>*{position:absolute}.pt-bg{inset:0;background:radial-gradient(circle at 50% 44%,#6b4600dd,#241600f2 60%,#080500)}
.pt-rays{left:50%;top:34%;width:240vmax;height:240vmax;margin:-120vmax 0 0 -120vmax;background:repeating-conic-gradient(from 0deg,#ffe58a66 0 5deg,transparent 5deg 14deg);-webkit-mask-image:radial-gradient(circle closest-side,#000 0,#000 8%,transparent 30%);mask-image:radial-gradient(circle closest-side,#000 0,#000 8%,transparent 30%);opacity:0;pointer-events:none;animation:ptRaysIn 1.2s 3.2s forwards,ptSpin 50s linear infinite}
@keyframes ptRaysIn{to{opacity:.9}}@keyframes ptSpin{to{transform:rotate(360deg)}}
.pt-chest{left:50%;top:56%;width:min(300px,60vw);opacity:0;transform:translate(-50%,-50%);animation:ptDrop .7s cubic-bezier(.2,1.2,.4,1) both,ptShake .9s .7s,ptOut .6s 3.3s forwards}
.pt-chest .ptc{display:block;width:100%;height:auto;overflow:visible}
@keyframes ptDrop{0%{transform:translate(-50%,-260%) scale(.8);opacity:0}60%{opacity:1}100%{transform:translate(-50%,-50%) scale(1);opacity:1}}
@keyframes ptShake{0%,100%{transform:translate(-50%,-50%)}12%{transform:translate(-52%,-50%) rotate(-2.5deg)}28%{transform:translate(-48%,-50%) rotate(2.5deg)}44%{transform:translate(-52%,-51%) rotate(-3deg)}60%{transform:translate(-48%,-50%) rotate(3deg)}78%{transform:translate(-51%,-50%) rotate(-1.5deg)}}
@keyframes ptOut{from{transform:translate(-50%,-50%);opacity:1}to{transform:translate(-50%,10%) scale(.6);opacity:0}}
.pt-chest .lid{transform-box:view-box;transform-origin:22px 84px;animation:ptLid .9s 1.6s cubic-bezier(.3,1.5,.5,1) forwards}@keyframes ptLid{to{transform:translate(-4px,-14px) rotate(-52deg)}}
.pt-chest .glow{opacity:0;animation:ptFade .5s 1.7s forwards}.pt-chest .pile{opacity:0;transform-box:view-box;transform-origin:110px 82px;transform:scale(1,.1);animation:ptPile .9s 1.9s cubic-bezier(.2,1.4,.4,1) forwards}
@keyframes ptPile{to{transform:scale(1,1);opacity:1}}@keyframes ptFade{to{opacity:1}}
.pt-chest .spill ellipse{opacity:0;animation:ptSlide .9s 2.3s ease-in forwards}@keyframes ptSlide{0%{opacity:0;transform:translateY(-8px)}15%{opacity:1}100%{opacity:1;transform:translateY(26px)}}
.pt-beam{left:50%;top:56%;width:min(340px,76vw);height:62vh;transform:translate(-50%,-100%) scaleY(0);transform-origin:50% 100%;background:linear-gradient(to top,#fff7c8e6,#ffd84d66 45%,transparent);clip-path:polygon(32% 100%,68% 100%,100% 0,0 0);opacity:0;pointer-events:none;animation:ptBeam 1.9s 1.7s ease-out forwards}
@keyframes ptBeam{0%{transform:translate(-50%,-100%) scaleY(0);opacity:0}20%{opacity:1}60%{transform:translate(-50%,-100%) scaleY(1);opacity:.9}100%{transform:translate(-50%,-100%) scaleY(1);opacity:0}}
.pt-cv{inset:0;width:100%;height:100%;pointer-events:none}
.pt-flash{inset:0;background:radial-gradient(circle at 50% 34%,#fffbe6,#ffd84d88 40%,transparent 70%);opacity:0;pointer-events:none;animation:ptFlash .9s 3.2s ease-out both}@keyframes ptFlash{0%{opacity:0}20%{opacity:1}100%{opacity:0}}
.pt-badge{left:50%;top:34%;width:min(220px,48vw);opacity:0;transform:translate(-50%,-50%) scale(0);filter:drop-shadow(0 0 24px #ffd84d) drop-shadow(0 6px 0 #4a3000);animation:ptBadge .9s 3.3s cubic-bezier(.2,1.5,.4,1) both}
.pt-badge svg{display:block;width:100%;height:auto;overflow:visible}.pt-badge .ring{transform-box:view-box;transform-origin:100px 100px;animation:ptSpin 18s linear infinite}
@keyframes ptBadge{0%{transform:translate(-50%,-50%) scale(0) rotate(-120deg);opacity:0}100%{transform:translate(-50%,-50%) scale(1) rotate(0);opacity:1}}
.pt-tx{left:0;right:0;top:52%;padding:0 12px;text-align:center;display:grid;gap:6px;justify-items:center}
.pt-l1{font:900 clamp(26px,5.2vw,58px)/1.05 var(--serif);color:#fff;letter-spacing:2px;text-shadow:0 3px 0 #0007,0 0 24px #ffd84d88;opacity:0;animation:ptUp .7s 3.7s cubic-bezier(.2,1,.3,1) both}
.pt-l2{font:900 clamp(30px,7.4vw,86px)/1.02 var(--serif);background:linear-gradient(90deg,#8a5a00,#d4a017,#fff2a8,#ffd84d,#b8860b,#8a5a00);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 4px 0 #5a3a00) drop-shadow(0 0 18px #ffd84d88);opacity:0;animation:ptUp .7s 4s cubic-bezier(.2,1,.3,1) both,csGold 3s linear infinite}
.pt-l3{font:700 clamp(15px,2vw,22px) Montserrat,system-ui,sans-serif;color:#ffe9a0;opacity:0;animation:ptUp .6s 4.5s both}.pt-l3 b{color:#fff}
@keyframes ptUp{from{opacity:0;transform:translateY(26px) scale(.96)}to{opacity:1;transform:none}}
.pt-ok{bottom:26px;left:0;right:0;margin:0 auto;width:max-content;min-width:130px;z-index:3}
@media(prefers-reduced-motion:reduce){.pt-chest,.pt-beam,.pt-cv,.pt-flash{display:none}.pt-badge{opacity:1;transform:translate(-50%,-50%)}.pt-rays{opacity:.6}.pt-l1,.pt-l2,.pt-l3{opacity:1;transform:none}}`;document.head.appendChild(s)}
el.innerHTML=`<div class="play"><div class="side"><label>Wager</label>${App.betHTML()}<button class="btn" id="go">Place Wager</button><div class="cs-hint">Press Space to place a wager</div><div class="cs-odds"><h3>Case Odds:</h3>${RAR.map(r=>r.gold?`<div class="pg-tx">${r.n}: ${r.d}%</div>`:`<div style="color:${r.k==='Secret'?'#0a0a0a;text-shadow:0 0 6px #fff,0 0 2px #888':r.c}">${r.k}: ${r.d}%</div>`).join('')}</div></div><div class="stage"><div class="cs-life" id="lf"></div><div style="text-align:left;color:#a3a3a3">Past Rolls:</div><div class="cs-past" id="pa"></div><div class="cs-wrap" id="wr"><div class="cs-strip" id="sr"></div><div class="cs-sel"></div><div class="cs-ptr"></div></div><div class="cs-res" id="rs">Place a wager to open a case.</div></div></div>`;
const q=s=>el.querySelector(s),go=q('#go'),wr=q('#wr'),sr=q('#sr'),rs=q('#rs'),br=q('.betrow'),bi=q('.bet');
let hb=0,arr=[],sel=REST,busy=false,rd=null,past=[],prev=null,tm=[],raf=0,mo=null,pov=null;
const rnd=()=>{try{return crypto.getRandomValues(new Uint32Array(1))[0]/4294967296}catch(e){return Math.random()}};
function roll(){let r=Math.floor(rnd()*TOT),i=0;for(;i<RAR.length-1;i++){if(r<RAR[i].w)break;r-=RAR[i].w}const z=RAR[i];return{r:z,m:Math.min(z.max,Math.max(z.min,Math.round((z.min+rnd()*(z.max-z.min))*100)/100))}}
const rollReal=()=>{let o;do{o=roll()}while(!isReal(o));return o};   // dev forcing only
const lookOf=k=>{const z=RAR.find(x=>x.k===k);return z.zero?{r:z,m:0}:{r:z,m:Math.round((z.min+rnd()*(z.max-z.min))*100)/100}},commonLook=()=>lookOf('Common');
const XSVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 4.5l15 15M19.5 4.5l-15 15" stroke="currentColor" stroke-width="4.6" stroke-linecap="round" fill="none"/></svg>',lbl=o=>o.r.zero?'X':o.m.toFixed(2)+'x';
const tile = (o, i) =>
  `<div class="ct${o.r.fx ? ' hi r-' + o.r.k : o.r.zero ? ' r-X' : ''}" data-i="${i}" tabindex="0"
       role="button" aria-label="${nm(o)} ${lbl(o)}"
       style="--c:${o.r.c};--b:${o.r.b || o.r.c};--fx:${o.r.fx || o.r.c}">
     <i>${o.r.zero ? XSVG : `<img src="${o.r.ic}" alt="" onerror="this.parentNode.classList.add('noimg');this.remove()">`}</i>
     <b>${lbl(o)}</b>
   </div>`;const pill=o=>`<b${o.r.gold?' class="pg"':''} style="--c:${o.r.c};--b:${o.r.b||o.r.c}">${lbl(o)}</b>`;
function center(i){return wr.clientWidth/2-(i*STEP+TW/2)}
/* gold coins popping up out of the selector window (Pirate Token rolling by / landing) */
function spray(n,big){const h=document.createElement('div');h.className='cs-coins';let s='';for(let i=0;i<n;i++){const a=-Math.PI/2+(Math.random()-.5)*2.2,v=(big?110:70)+Math.random()*(big?200:110);s+=`<b class="cs-coin" style="--dx:${Math.round(Math.cos(a)*v*1.5)}px;--dy:${Math.round(Math.sin(a)*v)}px;--r:${Math.round(Math.random()*720)}deg;animation-delay:${(Math.random()*.15).toFixed(2)}s"></b>`}h.innerHTML=s;wr.appendChild(h);tm.push(setTimeout(()=>h.remove(),1500))}
/* winner = what the strip shows at WIN (a fake common when rd.fake); after = optional tile forced right after WIN (the Common a tip-over overshoots onto) */
function build(winner,after){const a=Array.from({length:N},()=>roll());a[REST]=prev||a[REST];if(winner)a[WIN]=winner;if(after)a[WIN+1]=after;arr=a;sr.innerHTML=a.map((o,i)=>tile(o,i)).join('');sr.style.transition='none';sr.style.transform=`translate3d(${center(REST)}px,0,0)`;sel=-1;mark(REST);return a}
function mark(i){const o=sr.children[sel];if(o){o.classList.remove('sel');o.removeAttribute('aria-pressed')}sel=i;const n=sr.children[i];if(n){n.classList.add('sel');n.setAttribute('aria-pressed','true')}}
function choose(i){if(busy||!sr.children[i])return;mark(i);sr.style.transition='transform .35s ease';sr.style.transform=`translate3d(${center(i)}px,0,0)`}
function settleOnce(){if(!rd||rd.settled)return 0;rd.settled=true;Store.d.cs=(Store.d.cs||0)+1;if(LIFE.includes(rd.o.r.k))Store.d.cc[rd.o.r.k]=(Store.d.cc[rd.o.r.k]||0)+1;const pay=App.settle('CASES',rd.bet,Math.round(rd.bet*rd.o.m*100)/100);return pay}
/* Landing: the strip stops on WIN. A fake common first flips over to the REAL tile (rd.o, the same object that is settled), then the round concludes. */
function finish(){if(!busy||rd.finished||rd.landing)return;rd.landing=true;cancelAnimationFrame(raf);wr.classList.remove('tense');sr.style.transform=`translate3d(${mo.xT}px,0,0)`;mark(WIN);
if(rd.fake){const t0=sr.children[WIN];t0.classList.add('fkflip');tm.push(setTimeout(()=>{const h=document.createElement('div');h.innerHTML=tile(rd.o,WIN);const n=h.firstElementChild;t0.className=n.className+' sel fkflip';t0.setAttribute('style',n.getAttribute('style'));t0.setAttribute('aria-label',n.getAttribute('aria-label'));t0.innerHTML=n.innerHTML;arr[WIN]=rd.o;if(rd.o.r.gold)spray(16,1)},FLIP_MS/2));tm.push(setTimeout(conclude,FLIP_MS+500))}
else conclude()}
function conclude(){if(!busy||rd.finished)return;rd.finished=true;sr.children[WIN].classList.add('win');
const pay=settleOnce(),pr=Math.round((pay-rd.bet)*100)/100,o=rd.o;life();burst(o);prev=o;past.unshift(o);past=past.slice(0,7);q('#pa').innerHTML=past.map(pill).join('');
rs.innerHTML=`Wager: <b>$${App.f(rd.bet)}</b> • Multiplier: <b style="color:${o.r.k==='Secret'?'#fff':o.r.c}">${o.r.zero?'X (0x)':o.m.toFixed(2)+'x ('+nm(o)+')'}</b> • Payout: <b style="color:${pr>=0?'#22c55e':'#ef4444'}">$${App.f(pay)}</b>`;
App.toast(pr>=0?`${lbl(o)}: +$${App.f(pr)} profit`:`${lbl(o)}: lost $${App.f(-pr)}`);
unlock();
if(o.r.gold)tm.push(setTimeout(()=>pirate(o,pay),900));   // the round is already settled; the cinematic keeps the wager button locked until it is closed
else release()}
function release(){busy=false;go.disabled=false;goTxt();br.classList.remove('dis');bi.disabled=false}
function life(){q('#lf').innerHTML='<span>Lifetime spins:</span><span style="color:#e2e8f0">Total: <b>'+(Store.d.cs||0).toLocaleString('en-US')+'</b></span>'+LIFE.map(k=>{const r=RAR.find(x=>x.k===k);return `<span style="color:${r.fx}">${r.n||k}: <b>${Store.d.cc[k]||0}</b></span>`}).join('')}
function burst(o){if(!o.r.fx)return;const n={Legendary:18,Mythic:28,Secret:40,Pirate:60}[o.r.k],f=document.createElement('div');f.className='cs-burst';f.style.setProperty('--fx',o.r.fx);let h='<i class="cs-flash"></i><i class="cs-ring"></i>';
for(let i=0;i<n;i++){const a=Math.random()*6.283,d=70+Math.random()*(o.r.k==='Legendary'?90:150);h+=`<b style="--dx:${Math.cos(a)*d*1.6}px;--dy:${Math.sin(a)*d*.8}px;animation-delay:${Math.random()*.12}s"></b>`}
f.innerHTML=h;wr.appendChild(f);wr.style.setProperty('--fx',o.r.fx);wr.classList.remove('glow');void wr.offsetWidth;wr.classList.add('glow');tm.push(setTimeout(()=>f.remove(),1600));if(o.r.gold)spray(40,1)}
/* ---------- Pirate Token cinematic: chest drops, shakes, opens (light beam), coins explode and overflow, then "PIRATE TOKEN / NEW RARITY ACHIEVED". Presentation only (the round is already paid). ---------- */
function closePt(quiet){if(!pov)return;const v=pov;pov=null;clearTimeout(v.t1);if(v.stop)v.stop();document.removeEventListener('keydown',v.kd,true);v.d.remove();const a=document.getElementById('app');if(a)a.removeAttribute('aria-hidden');if(!quiet)release()}
function pirate(o,pay){if(pov)return;const RM=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches),d=document.createElement('div');
d.className='pt-ov';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-label','Pirate Token. New rarity achieved.');
d.innerHTML=`<div class="pt-bg"></div><div class="pt-rays"></div><div class="pt-beam"></div><div class="pt-chest">${CHEST}</div><canvas class="pt-cv"></canvas><div class="pt-flash"></div><div class="pt-badge">${MEDAL}</div><div class="pt-tx"><div class="pt-l1">PIRATE TOKEN</div><div class="pt-l2">NEW RARITY ACHIEVED</div><div class="pt-l3">${lbl(o)} &bull; Payout <b>$${App.f(pay)}</b></div></div><button class="btn pt-ok" id="ptok" type="button">Skip</button>`;
document.body.appendChild(d);document.getElementById('app').setAttribute('aria-hidden','true');
const ok=d.querySelector('#ptok'),stop=RM?null:coinShow(d.querySelector('.pt-cv')),t1=setTimeout(()=>{ok.textContent='Continue'},RM?0:4800);
const kd=e=>{if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();e.stopPropagation();closePt()}else if(e.code==='Space'){e.preventDefault();e.stopPropagation()}};
document.addEventListener('keydown',kd,true);ok.onclick=()=>closePt();pov={d,t1,stop,kd};ok.focus()}
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
const t0=performance.now();(function f(now){const t=now-t0,x=pos(t,mo);sr.style.transform=`translate3d(${x}px,0,0)`;if(hi>=0&&t>=dur)wr.classList.add('tense');const ti=Math.round((wr.clientWidth/2-TW/2-x)/STEP);if(ti!==sel&&ti>=0&&ti<N){mark(ti);if(arr[ti]&&arr[ti].r.gold)spray(10)}if(t<rd.total)raf=requestAnimationFrame(f)})(t0);
tm.push(setTimeout(finish,rd.total))}
go.onclick=()=>spin();
const rest=()=>{if(!busy)sr.style.transform=`translate3d(${center(sel)}px,0,0)`};sr.onclick=e=>{const t=e.target.closest('.ct');if(t)choose(+t.dataset.i)};
sr.onkeydown=e=>{const t=e.target.closest('.ct');if(!t)return;const i=+t.dataset.i;if(e.key==='Enter'){e.preventDefault();choose(i)}else if(e.key===' '&&!e.repeat){e.preventDefault();spin()}else if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const j=i+(e.key==='ArrowRight'?1:-1);if(sr.children[j]){choose(j);sr.children[j].focus({preventScroll:true})}}};addEventListener('resize',rest);
addEventListener('pagehide',leave);
el.addEventListener('click',e=>{const m=e.target.closest('.mini');if(m)m.blur()});
build();life();goTxt();
return()=>{removeEventListener('pagehide',leave);cancelAnimationFrame(raf);tm.forEach(clearTimeout);removeEventListener('resize',rest);closePt(true);if(busy)settleOnce();unlock()}}};
return api})();
