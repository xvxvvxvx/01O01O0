/* v2.75: extra Cases rows are PERMANENT (max 2, only a +1 row reward exists, +2 was removed => 13 rewards, 1/13 each) and "Instant Rank-Up" no longer ranks you up: it fulfils every CURRENT rank-up requirement
   (rank money + rounds) so you rank up through the normal Rank-Up page ("Rank-Up Ready"). At max rank, or when the requirements are already met, it becomes the $100,000 sale instead.
   v2.7 Pirate Token perks. A Pirate Token (Cases) rolls ONE of 13 rewards with equal probability. The reward is rolled and APPLIED in the same save that settles the round
   (Games.cases.settleRows), before any animation, so a refresh can never re-roll it. The chest + vertical reel afterwards is presentation only.
   State (signed key): r = PERMANENT extra Cases rows (cap 2; older saves with queued rows keep up to 2), c = Cases roll-speed upgrade, a = Aviamasters flight-speed upgrade. Effective speed = min(5, rank speed + upgrade).
   Selling: duplicate tag/gradient $45,000; extra row / speed upgrade $50,000; instant rank-up while already at max rank $100,000. Sales credit the wallet AND rank money (Rank.addMoney).
   (v2.75: the old instant rank-up that reset the wallet / rank progress is gone, see the top of this comment.) */
const Perks=(()=>{
const KEY='0-100_v2.7_perks',MAXR=2,MAXS=5,AVI0=CFG.AVI_SPEED,SELL={dup:45000,boost:50000,rank:100000};
const LIST=[
{id:'row1',kind:'row',n:1,name:'+1 Case Row',desc:'Permanent extra Cases row (max 2)'},
{id:'gem200',kind:'gem',n:200,name:'200 Gems',desc:'200 Gems'},{id:'gem250',kind:'gem',n:250,name:'250 Gems',desc:'250 Gems'},
{id:'cs2',kind:'cs',n:2,name:'Case Speed +2x',desc:'Cases roll speed +2x'},{id:'as2',kind:'as',n:2,name:'Flight Speed +2x',desc:'Aviamasters flight speed +2x'},
{id:'cs3',kind:'cs',n:3,name:'Case Speed +3x',desc:'Cases roll speed +3x'},{id:'as3',kind:'as',n:3,name:'Flight Speed +3x',desc:'Aviamasters flight speed +3x'},
{id:'t_pirate',kind:'cos',cos:'t_pirate',name:'[THE PIRATE]',desc:'Limited tag'},{id:'g_treasure',kind:'cos',cos:'g_treasure',name:'Treasure Finder Gradient',desc:'Limited gradient'},
{id:'t_treasure',kind:'cos',cos:'t_treasure',name:'[TREASURE FINDER]',desc:'Limited tag'},{id:'g_pirate',kind:'cos',cos:'g_pirate',name:'The Pirate Gradient',desc:'Limited gradient'},
{id:'t_pking',kind:'cos',cos:'t_pking',name:'[KING OF THE PIRATES]',desc:'Limited tag'},{id:'rank',kind:'rank',name:'Rank-Up Ready',desc:'Fulfils every current rank-up requirement'}];
const cl=(v,b)=>Math.max(0,Math.min(b,Math.floor(Number.isFinite(+v)?+v:0))),blank=()=>({r:0,c:0,a:0});
function get(){const r=Store.readSigned(KEY);if(r.status==='bad'||r.raw==null)return blank();try{const o=JSON.parse(r.raw);return{r:cl(o.r,MAXR),c:cl(o.c,MAXS),a:cl(o.a,MAXS)}}catch(e){return blank()}}
const put=s=>Store.writeSigned(KEY,JSON.stringify(s));
const baseCase=rk=>{for(const[r,s]of CFG.SPIN_SPEED)if(rk>=r)return s;return 1},baseAvi=rk=>{for(const[r,s]of AVI0)if(rk>=r)return s;return 1};
const roll=(rnd=Econ.rnd)=>LIST[Math.min(LIST.length-1,Math.floor(rnd()*LIST.length))];
const rows=()=>get().r;   // permanent extra rows (never consumed by a wager)
/* v2.75: raises rank money and rounds to the current requirement (never lowers them). No rank-up happens, no wallet / Gem / quest change. Returns null at max rank or when everything is already met. */
function fulfilRankUp(){Store.load();const d=Store.d,s=Rank.status();if(s.max||s.ready)return null;const from={c:s.coin,r:s.rounds};d.rc=Math.max(d.rc,s.req.c);d.rq=Math.max(d.rq,s.req.r);Store.sync();Store.save();if(typeof Mastery!=='undefined')Mastery.add('ir',1);return{from,req:s.req,to:Rank.status().next}}
/* apply a rolled reward; returns {p, applied, offer:{amt,undo?}|null, rank?, owned?, capped?} */
function grant(p){const r={p,applied:0,offer:null},s=get();
if(p.kind==='row'){r.applied=Math.max(0,Math.min(p.n,MAXR-s.r));s.r+=r.applied;put(s);r.capped=r.applied<p.n;r.total=s.r;r.offer={amt:SELL.boost,undo:{r:r.applied}}}
else if(p.kind==='cs'||p.kind==='as'){const k=p.kind==='cs'?'c':'a',base=(k==='c'?baseCase:baseAvi)(Store.d.rk);r.applied=Math.max(0,Math.min(p.n,MAXS-(base+s[k])));s[k]+=r.applied;put(s);r.capped=r.applied<p.n;r.total=Math.min(MAXS,base+s[k]);r.offer={amt:SELL.boost,undo:{[k]:r.applied}}}
else if(p.kind==='gem'){Store.check();Store.d.gems+=p.n;Store.sync();Store.save();r.applied=p.n}
else if(p.kind==='cos'){if(Store.d.inv.includes(p.cos)){r.dup=true;r.offer={amt:SELL.dup}}else{Store.d.inv.push(p.cos);Store.save();r.fresh=true}}
else if(p.kind==='rank'){const x=fulfilRankUp();if(x)r.rank=x;else{r.maxed=true;r.ready=!Rank.status().max;r.offer={amt:SELL.rank}}}
return r}
function sell(r){const o=r&&r.offer;if(!o||o.sold)return{ok:false};o.sold=true;if(o.undo){const s=get();s.r=Math.max(0,s.r-(o.undo.r||0));s.c=Math.max(0,s.c-(o.undo.c||0));s.a=Math.max(0,s.a-(o.undo.a||0));put(s)}
Econ.addCoins(o.amt);Rank.addMoney(o.amt);Store.save();return{ok:true,amt:o.amt}}
const summary=r=>{const p=r.p;return p.kind==='rank'?(r.rank?'Rank-up requirements fulfilled':'Rank-up reward (sell offer)'):p.name};
const api={LIST,MAXR,MAXS,SELL,get,roll,grant,sell,rows,fulfilRankUp,caseBonus:()=>get().c,aviBonus:()=>get().a,summary,baseCase,baseAvi,show:()=>{}};
/* Aviamasters: the rank speed table is boosted only while the Aviamasters page is mounted (the rank pages read the pristine table). */
if(typeof Games!=='undefined'&&Games.aviamasters){const A=Games.aviamasters,m0=A.mount;
A.mount=function(el){const b=api.aviBonus();if(b>0)CFG.AVI_SPEED=AVI0.map(([r,s])=>[r,Math.min(MAXS,s+b)]).concat([[0,Math.min(MAXS,1+b)]]);const c=m0.call(this,el);return()=>{CFG.AVI_SPEED=AVI0;if(c)c()}}}
return api})();
if(typeof document!=='undefined'){
const st=document.createElement('style');st.id='stk-pk';st.textContent=`
.pk-ov{position:fixed;inset:0;z-index:95;overflow:auto;background:radial-gradient(circle at 50% 44%,#6b4600dd,#241600f2 60%,#080500);animation:pkIn .4s both;display:flex;align-items:center;justify-content:center}@keyframes pkIn{from{opacity:0}}
.pk-cv{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1}
.pk-beam{position:fixed;left:50%;top:60%;width:min(360px,80vw);height:62vh;transform:translate(-50%,-100%) scaleY(0);transform-origin:50% 100%;background:linear-gradient(to top,#fff7c8e6,#ffd84d66 45%,transparent);clip-path:polygon(32% 100%,68% 100%,100% 0,0 0);opacity:0;pointer-events:none}
.pk-beam.on{animation:pkBeam 1.8s ease-out forwards}@keyframes pkBeam{0%{transform:translate(-50%,-100%) scaleY(0);opacity:0}25%{opacity:1}60%{transform:translate(-50%,-100%) scaleY(1);opacity:.9}100%{transform:translate(-50%,-100%) scaleY(1);opacity:0}}
.pk-stage{position:relative;z-index:2;width:min(560px,96vw);min-height:540px;display:grid;justify-items:center;align-content:center;padding:16px 16px 90px}
.pk-chest{width:min(300px,64vw);animation:pkDrop .7s cubic-bezier(.2,1.2,.4,1) backwards;transition:transform .7s,opacity .5s}.pk-chest .ptc{display:block;width:100%;height:auto;overflow:visible}
@keyframes pkDrop{0%{transform:translateY(-120vh) scale(.8);opacity:0}60%{opacity:1}100%{transform:none;opacity:1}}
.pk-chest .lid{transform-box:view-box;transform-origin:22px 84px;transition:transform .9s cubic-bezier(.3,1.5,.5,1)}.pk-chest.open .lid{transform:translate(-4px,-14px) rotate(-52deg)}
.pk-chest .glow{opacity:0;transition:opacity .5s}.pk-chest.open .glow{opacity:1}
.pk-chest .pile{opacity:0;transform-box:view-box;transform-origin:110px 82px;transform:scale(1,.1);transition:transform .8s cubic-bezier(.2,1.4,.4,1) .2s,opacity .3s .2s}.pk-chest.open .pile{opacity:1;transform:none}
.pk-chest.shake{animation:pkDrop .7s cubic-bezier(.2,1.2,.4,1) backwards,pkShake .7s .7s}@keyframes pkShake{20%{transform:translateX(-5px) rotate(-2deg)}40%{transform:translateX(5px) rotate(2deg)}60%{transform:translateX(-4px) rotate(-1.5deg)}80%{transform:translateX(3px)}}
.pk-chest.back{transform:translateY(60px) scale(.82);opacity:.75}
.pk-reel{position:absolute;left:50%;top:22px;width:230px;margin-left:-115px;opacity:0;transform:translateY(120px) scale(.7);transition:opacity .5s,transform .7s cubic-bezier(.2,1,.3,1);pointer-events:none}.pk-reel.show{opacity:1;transform:none}
.pk-vp{position:relative;height:252px;overflow:hidden;border-radius:14px;background:#050505;border:2px solid #fff;box-shadow:0 0 40px #ffd84d66;-webkit-mask-image:linear-gradient(transparent,#000 14%,#000 86%,transparent);mask-image:linear-gradient(transparent,#000 14%,#000 86%,transparent)}
.pk-strip{position:absolute;left:0;right:0;top:0;will-change:transform}
.pk-t{height:84px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-bottom:1px solid #ffffff22;color:#e5e5e5;font:700 12px Montserrat,sans-serif;text-align:center;padding:4px 8px;transition:transform .3s,box-shadow .3s,background .3s}
.pk-t.win{background:#ffd84d22;box-shadow:inset 0 0 28px #ffd84d88;transform:scale(1.08)}
.pk-sel{position:absolute;left:0;right:0;top:50%;height:84px;margin-top:-42px;border:2px solid #fff;border-radius:6px;box-shadow:0 0 16px #fff8,inset 0 0 14px #fff3;pointer-events:none}
.pk-ar{position:absolute;top:50%;margin-top:-13px;width:0;height:0;border-top:13px solid transparent;border-bottom:13px solid transparent;filter:drop-shadow(0 0 8px #ffd84d)}
.pk-ar.l{left:-30px;border-left:22px solid #ffd84d}.pk-ar.r{right:-30px;border-right:22px solid #ffd84d}
.pk-i{display:grid;justify-items:center;align-items:center;gap:0;line-height:1}.pk-i small{font-size:10px;letter-spacing:1px;color:#ffe9a0}.pk-n{font:900 15px Montserrat,sans-serif;color:#fff}.pk-i .cos{font-size:13px}
.pk-gt{font:900 26px var(--serif);background:linear-gradient(90deg,#8a5a00,#d4a017,#fff2a8,#ffd84d,#b8860b,#8a5a00);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:pkGold 3s linear infinite}@keyframes pkGold{to{background-position:300% 0}}
.pk-big .pk-gt{font-size:54px}.pk-big .pk-n{font-size:30px}.pk-big .pk-i .cos{font-size:22px}.pk-big .pk-i small{font-size:13px}
.pk-up{display:block;width:34px;height:40px;background:linear-gradient(90deg,#8a5a00,#d4a017,#fff2a8,#ffd84d,#b8860b,#8a5a00);background-size:300% 100%;clip-path:polygon(50% 0,100% 48%,66% 48%,66% 100%,34% 100%,34% 48%,0 48%);animation:pkGold 3s linear infinite,pkBob 1.4s ease-in-out infinite}@keyframes pkBob{50%{transform:translateY(-4px)}}
.pk-big .pk-up{width:70px;height:84px}.pk-big .pk-bolt,.pk-big .pk-plane{width:84px;height:84px}
.pk-bolt,.pk-plane{width:40px;height:40px;overflow:visible}.pk-bolt polygon{fill:#ffe14d;stroke:#7a5a00;stroke-width:1.5;stroke-linejoin:round;animation:pkFl 1.2s steps(1) infinite;transform-origin:center}
.pk-bolt path{fill:none;stroke:#7fe0ff;stroke-width:2;stroke-linecap:round;animation:pkFl 1.2s steps(1) infinite .3s}
@keyframes pkFl{0%,100%{opacity:1;filter:drop-shadow(0 0 6px #ffe14d)}30%{opacity:.55;filter:none}34%{opacity:1;filter:drop-shadow(0 0 12px #7fe0ff)}60%{opacity:.8}}
.pk-plane path.b{fill:#eaf6ff;stroke:#3b82f6;stroke-width:1.6;stroke-linejoin:round}.pk-plane .w path{fill:none;stroke:#bfe9ff;stroke-width:2;stroke-linecap:round;animation:pkWind 1s linear infinite}.pk-plane .w path:nth-child(2){animation-delay:-.4s}.pk-plane .w path:nth-child(3){animation-delay:-.7s}
@keyframes pkWind{0%{transform:translateX(10px);opacity:0}30%{opacity:1}100%{transform:translateX(-14px);opacity:0}}
.pk-res{position:relative;z-index:3;display:grid;gap:10px;justify-items:center;text-align:center;max-width:460px;animation:pkIn .5s both}
.pk-res .pk-big{padding:18px 30px;border:3px solid #ffd84d;border-radius:26px;background:#0a0a0acc;box-shadow:0 0 50px #ffd84d66}.pk-res h3{margin:0;font:700 clamp(22px,4vw,32px) var(--serif)}.pk-res p{margin:0;font-size:15px;color:#e5e5e5}.pk-res .dn{color:#fbbf24;font-weight:700}
.pk-res .mbtns{flex-wrap:wrap}.pk-skip{position:fixed;left:0;right:0;bottom:22px;margin:0 auto;width:max-content;min-width:130px;z-index:4}
.cs-pk{font-size:12px;color:#a3a3a3;text-align:center}.cs-pk summary{cursor:pointer}.cs-pk div{margin-top:4px;line-height:1.5}
@media(prefers-reduced-motion:reduce){.pk-chest,.pk-res,.pk-ov{animation:none}.pk-beam{display:none}.pk-reel{transition:none}}`;document.head.appendChild(st);
const gold=t=>`<span class="pk-gt">${t}</span>`;
const icon=p=>{switch(p.kind){
case'row':return `<div class="pk-i">${gold('+'+p.n)}<small>ROW</small></div>`;
case'gem':return `<div class="pk-i">${gemIcon(40)}<b class="pk-n">${p.n}</b></div>`;
case'cs':return `<div class="pk-i"><svg class="pk-bolt" viewBox="0 0 48 48" aria-hidden="true"><polygon points="27,2 8,27 21,27 17,46 40,19 26,19"/><path d="M3 9l5 4-4 3 5 4M45 30l-5-4 4-3-5-4"/></svg><b class="pk-n">+${p.n}x</b></div>`;
case'as':return `<div class="pk-i"><svg class="pk-plane" viewBox="0 0 48 48" aria-hidden="true"><g class="w"><path d="M0 12H14"/><path d="M2 38H18"/><path d="M6 45H22"/></g><path class="b" d="M10 26L26 22 33 6 38 6 35 22 46 20 47 24 35 28 38 42 33 42 26 28 10 26Z"/></svg><b class="pk-n">+${p.n}x</b></div>`;
case'cos':{const c=Cos.by(p.cos);return `<div class="pk-i">${c.type==='grad'?Cos.user(esc(Store.d.user||'username'),c.id):Cos.html(c)}</div>`}
default:return `<div class="pk-i"><i class="pk-up"></i>${gold('RANK READY')}</div>`}};
const tint=p=>p.kind==='gem'?'#d58cff':p.kind==='cs'?'#ffe14d':p.kind==='as'?'#7ec8ff':'#ffd84d';
function rain(cv,len){const c=cv.getContext('2d'),DPR=Math.min(2,window.devicePixelRatio||1),spr=Games.cases.coinSprite();let W=0,H=0,raf=0,acc=0;const P=[],size=()=>{W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR};size();addEventListener('resize',size);const t0=performance.now();let last=t0;
(function loop(now){const dt=Math.min(.05,(now-last)/1000),t=(now-t0)/1000,k=H/800;last=now;if(t<len){acc+=dt*(t<.6?260:110);while(acc>=1){acc--;if(P.length<380)P.push({x:Math.random()*W,y:-20,vx:(Math.random()-.5)*70,vy:(120+Math.random()*260)*k,a:Math.random()*6.28,va:(Math.random()-.5)*10,s:Math.random()*6.28,vs:6+Math.random()*10,r:(8+Math.random()*8)*Math.max(.7,k)})}}
c.setTransform(DPR,0,0,DPR,0,0);c.clearRect(0,0,W,H);for(const p of P){p.vy+=900*k*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.a+=p.va*dt;p.s+=p.vs*dt;c.save();c.translate(p.x,p.y);c.rotate(p.a);c.scale(Math.max(.12,Math.abs(Math.cos(p.s))),1);c.drawImage(spr,-p.r,-p.r,p.r*2,p.r*2);c.restore()}
for(let i=P.length-1;i>=0;i--)if(P[i].y>H+40)P.splice(i,1);if(t<len||P.length)raf=requestAnimationFrame(loop)})(t0);return()=>{cancelAnimationFrame(raf);removeEventListener('resize',size)}}
function info(r){const p=r.p,s=Perks.get(),o=[];
if(p.kind==='row')o.push(r.applied?`+1 permanent extra Cases row. Every wager now spins ${s.r} extra row${s.r>1?'s':''} (${s.r}/${Perks.MAXR}).`:`You already have the maximum of ${Perks.MAXR} permanent extra rows. Nothing was added.`);
else if(p.kind==='cs'||p.kind==='as'){const w=p.kind==='cs'?'Cases roll speed':'Aviamasters flight speed';o.push(r.applied?`${w} +${r.applied}x. Total now ${+r.total.toFixed(2)}x (max ${Perks.MAXS}x).${r.capped?' Capped at '+Perks.MAXS+'x.':''}`:`${w} is already at the ${Perks.MAXS}x maximum. Nothing was added.`)}
else if(p.kind==='gem')o.push(`${p.n} Gems added.`);
else if(p.kind==='cos')o.push(r.dup?'Duplicate: you already own this limited cosmetic.':'Added to your Inventory. Limited and unsellable.');
else if(r.rank)o.push(`Every current rank-up requirement is now fulfilled ($${Econ.fi(r.rank.req.c)} earned and ${r.rank.req.r} rounds). Open the Rank-Up page and rank up as usual.`);
else o.push(r.ready?'You already meet every rank-up requirement, so this can be sold instead.':'You are already at the maximum rank, so the rank-up can be sold instead.');
return o.join('<br>')}
function one(r,done){const p=r.p,RM=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches),ov=document.createElement('div'),tms=[],T=(f,ms)=>tms.push(setTimeout(f,ms));
const N=48,WI=36,TH=84,VH=252,DUR=5200,items=Array.from({length:N},(_,i)=>i===WI?p:Perks.LIST[Math.floor(Econ.rnd()*Perks.LIST.length)]),jit=Math.round((Econ.rnd()-.5)*TH*.5);
ov.className='pk-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Pirate Token reward');
ov.innerHTML=`<canvas class="pk-cv"></canvas><div class="pk-beam"></div><div class="pk-stage"><div class="pk-chest shake">${Games.cases.CHEST}</div><div class="pk-reel"><i class="pk-ar l"></i><i class="pk-ar r"></i><div class="pk-vp"><div class="pk-strip">${items.map(x=>`<div class="pk-t" style="--b:${tint(x)}">${icon(x)}<span>${x.name}</span></div>`).join('')}</div><div class="pk-sel"></div></div></div><div class="pk-res" hidden></div></div><button class="btn dim pk-skip" type="button">Skip</button>`;
document.body.appendChild(ov);const app=document.getElementById('app');if(app)app.setAttribute('aria-hidden','true');
const q=s=>ov.querySelector(s),ch=q('.pk-chest'),rl=q('.pk-reel'),st=q('.pk-strip'),res=q('.pk-res'),sk=q('.pk-skip'),beam=q('.pk-beam'),fin=jit+VH/2-(WI*TH+TH/2);let phase=0,stop=null;
const kd=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();phase<3?skip():close()}else if(e.code==='Space')e.preventDefault()};document.addEventListener('keydown',kd,true);sk.focus();
function close(){tms.forEach(clearTimeout);if(stop)stop();document.removeEventListener('keydown',kd,true);ov.remove();if(app)app.removeAttribute('aria-hidden');try{App.bal()}catch(e){}done()}
function result(){phase=3;rl.classList.remove('show');ch.hidden=true;sk.style.visibility='hidden';res.hidden=false;try{App.bal()}catch(e){}
const sellTxt=r.offer?`Sell for $${Econ.fi(r.offer.amt)}`:'',c=p.kind==='cos'?Cos.by(p.cos):null,eq=c&&r.fresh;
res.innerHTML=`<h3>You won: ${p.name}</h3><div class="pk-big">${icon(p)}</div><p>${info(r)}</p>${r.offer?`<p class="dn">${r.dup?'Duplicate':'Optional'}: sell it for $${Econ.fi(r.offer.amt)} (counts toward your rank-up profit requirement).</p>`:''}<div class="mbtns">${r.offer?`<button class="btn alt" id="pksl">${sellTxt}</button>`:''}${eq?'<button class="btn" id="pkeq">Equip</button>':''}${r.rank?'<button class="btn" id="pkru">Go to Rank-Up</button>':''}<button class="btn dim" id="pkcl">Close</button></div>`;
const ru=res.querySelector('#pkru');if(ru)ru.onclick=()=>{close();location.hash='#rankup'};
try{FX.confetti(q('.pk-stage'),70)}catch(e){}
const sl=res.querySelector('#pksl');if(sl)sl.onclick=()=>{const s=Perks.sell(r);if(!s.ok)return;sl.disabled=true;sl.textContent='Sold';try{App.bal();App.toast(`Sold for $${Econ.fi(s.amt)}`)}catch(e){}};
const eb=res.querySelector('#pkeq');if(eb)eb.onclick=()=>{if(Inv.apply(c.type==='tag'?c.id:Store.d.eq.tag,c.type==='grad'?c.id:Store.d.eq.grad)){App.bal();App.toast('Cosmetic equipped and saved');eb.textContent='Equipped';eb.disabled=true}};
res.querySelector('#pkcl').onclick=close;res.querySelector('#pkcl').focus()}
function land(){if(phase>=2)return;phase=2;tms.forEach(clearTimeout);st.style.transition='none';st.style.transform=`translate3d(0,${fin}px,0)`;st.children[WI].classList.add('win');T(result,RM?200:1000)}
function skip(){if(phase>=2)return;if(phase===0){phase=1;ch.classList.add('open','back');rl.classList.add('show')}land()}
sk.onclick=skip;st.style.transform=`translate3d(0,${VH/2-TH/2}px,0)`;
if(RM){skip();return}
T(()=>{ch.classList.add('open');beam.classList.add('on');stop=rain(q('.pk-cv'),2.8)},1000);
T(()=>{if(phase)return;ch.classList.add('back');rl.classList.add('show')},2300);
T(()=>{if(phase)return;phase=1;st.style.transition=`transform ${DUR}ms cubic-bezier(.08,.55,.12,1)`;st.style.transform=`translate3d(0,${fin}px,0)`;T(land,DUR+80)},3000)}
Perks.show=(results,done)=>{const q=[...results],next=()=>{if(!q.length){if(done)done();return}one(q.shift(),next)};next()};
}
