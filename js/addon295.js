/* v2.95 add-on runtime layer (loaded last). NOTE: the game has no server, so "authoritative" here means: enforced in the only code path that can
   grant / settle (Crate.open, Econ.cool, App.settle), stored under the existing signed-save mechanism, and synchronous (no await between roll and save).
   1) Pirate Ship discovery overlay (used by js/games/aviamasters.js)  2) Gem-Shop Epic+ pity  3) Chicken round-farming limits
   4) Cases Pirate-reward previews  5) crate odds + Mastery collection thresholds for the new cosmetics. */
const PirateShip295=(()=>{
let cur=null;
function rain(cv){const c=cv.getContext('2d'),D=Math.min(2,window.devicePixelRatio||1),spr=Games.cases.coinSprite();let W=0,H=0,raf=0,acc=0,acc2=0,burst=0;const P=[],S=[],size=()=>{W=innerWidth;H=innerHeight;cv.width=W*D;cv.height=H*D};size();addEventListener('resize',size);
const t0=performance.now();let last=t0;
const mk=(x,y,vx,vy)=>{if(P.length<420)P.push({x,y,vx,vy,a:Math.random()*6.28,va:(Math.random()-.5)*10,s:Math.random()*6.28,vs:6+Math.random()*10,r:(8+Math.random()*8)*Math.max(.7,H/800)})};
(function loop(now){const dt=Math.min(.05,(now-last)/1000),t=(now-t0)/1000,k=H/800,ox=W/2,oy=H*.56-4;last=now;
if(t>=1.7&&!burst){burst=1;for(let i=0;i<130;i++){const a=-Math.PI/2+(Math.random()-.5)*1.9,v=(520+Math.random()*700)*k;mk(ox+(Math.random()-.5)*60*k,oy,Math.cos(a)*v,Math.sin(a)*v)}}
if(t>1.8&&t<3.2){acc+=dt*170;while(acc>=1){acc--;const a=-Math.PI/2+(Math.random()-.5)*2.3,v=(220+Math.random()*520)*k;mk(ox+(Math.random()-.5)*120*k,oy,Math.cos(a)*v,Math.sin(a)*v)}}
if(t>2.9){acc2+=dt*14;while(acc2>=1){acc2--;mk(Math.random()*W,-20,(Math.random()-.5)*60,(80+Math.random()*200)*k)}}
if(t>1.8&&t<6&&Math.random()<.6)S.push({x:Math.random()*W,y:H*.15+Math.random()*H*.6,l:1,s:2+Math.random()*4});
c.setTransform(D,0,0,D,0,0);c.clearRect(0,0,W,H);
for(const p of P){p.vy+=1500*k*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.a+=p.va*dt;p.s+=p.vs*dt;c.save();c.translate(p.x,p.y);c.rotate(p.a);c.scale(Math.max(.12,Math.abs(Math.cos(p.s))),1);c.drawImage(spr,-p.r,-p.r,p.r*2,p.r*2);c.restore()}
for(let i=P.length-1;i>=0;i--)if(P[i].y>H+60)P.splice(i,1);
c.fillStyle='#fff6c0';for(const p of S){p.l-=dt*1.1;const r=p.s*(1+(1-p.l)*.5);c.globalAlpha=Math.max(0,p.l);c.shadowColor='#ffd84d';c.shadowBlur=10;c.beginPath();c.moveTo(p.x,p.y-r*2);c.lineTo(p.x+r*.5,p.y-r*.5);c.lineTo(p.x+r*2,p.y);c.lineTo(p.x+r*.5,p.y+r*.5);c.lineTo(p.x,p.y+r*2);c.lineTo(p.x-r*.5,p.y+r*.5);c.lineTo(p.x-r*2,p.y);c.lineTo(p.x-r*.5,p.y-r*.5);c.closePath();c.fill()}
c.globalAlpha=1;c.shadowBlur=0;for(let i=S.length-1;i>=0;i--)if(S[i].l<=0)S.splice(i,1);
raf=requestAnimationFrame(loop)})(t0);return()=>{cancelAnimationFrame(raf);removeEventListener('resize',size)}}
/* o = {m: jackpot multiplier, profit, perk: already-granted Perks.grant() result}; done() runs after the Pirate reward reel is closed */
function run(o,done){if(cur)return;const RM=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches),ov=document.createElement('div');
const after=()=>{if(typeof Perks!=='undefined'&&Perks.show)Perks.show([o.perk],done);else done()};
const pf=o.profit;
ov.className='crov ps-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Pirate Ship found');
ov.innerHTML=`<div class="ps-bg"></div><div class="ps-rays"></div><canvas class="ps-cv"></canvas><div class="ps-chest">${Games.cases.CHEST}</div><div class="ps-fl"></div>
<div class="ps-h">PIRATE SHIP FOUND</div><i class="ps-ar l"></i><i class="ps-ar l2"></i><i class="ps-ar r"></i><i class="ps-ar r2"></i><div class="ps-md">${Games.cases.MEDAL}</div>
<div class="ps-you">YOU LANDED ON A PIRATE SHIP!</div><div class="ps-bn">PIRATE TOKEN + ${(+o.m).toFixed(2)}x</div><div class="ps-pf">${pf>=0?'Profit: +':'Result: -'}$${App.f(Math.abs(pf))}</div>
<button class="btn ps-sk" type="button">Skip</button>`;
document.body.appendChild(ov);const app=document.getElementById('app');if(app)app.setAttribute('aria-hidden','true');
const sk=ov.querySelector('.ps-sk'),stop=RM?null:rain(ov.querySelector('.ps-cv')),t1=setTimeout(()=>{sk.textContent='Continue'},RM?0:4600);
const kd=e=>{if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();e.stopPropagation();close()}else if(e.code==='Space'){e.preventDefault();e.stopPropagation()}};
document.addEventListener('keydown',kd,true);
function close(){if(!cur)return;cur=null;clearTimeout(t1);if(stop)stop();document.removeEventListener('keydown',kd,true);ov.remove();if(app)app.removeAttribute('aria-hidden');after()}
sk.onclick=close;cur=ov;sk.focus()}
return{run}})();
(()=>{
if(typeof document!=='undefined'&&!document.getElementById('stk-ps295')){const s=document.createElement('style');s.id='stk-ps295';s.textContent=`
.ps-ov{z-index:90;display:block!important;background:#000;overflow:hidden;backdrop-filter:none}.ps-ov>*{position:absolute}
.ps-bg{inset:0;background:radial-gradient(ellipse at 50% 45%,#7a4a00dd,#2a1800f2 58%,#0a0600)}
.ps-bg::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 118px,#ffd84d12 118px 120px)}
.ps-rays{left:50%;top:44%;width:240vmax;height:240vmax;margin:-120vmax 0 0 -120vmax;background:repeating-conic-gradient(from 0deg,#ffe58a55 0 5deg,transparent 5deg 14deg);-webkit-mask-image:radial-gradient(circle closest-side,#000 0,#000 8%,transparent 30%);mask-image:radial-gradient(circle closest-side,#000 0,#000 8%,transparent 30%);opacity:0;pointer-events:none;animation:psRays 1.2s 2.8s forwards,psSpin 50s linear infinite}
@keyframes psRays{to{opacity:.9}}@keyframes psSpin{to{transform:rotate(360deg)}}
.ps-cv{inset:0;width:100%;height:100%;pointer-events:none}
.ps-chest{left:50%;top:56%;width:min(300px,60vw);opacity:0;transform:translate(-50%,-50%);animation:psDrop .7s cubic-bezier(.2,1.2,.4,1) both,psShake .9s .7s,psOut .6s 2.8s forwards}
.ps-chest .ptc{display:block;width:100%;height:auto;overflow:visible}
@keyframes psDrop{0%{transform:translate(-50%,-260%) scale(.8);opacity:0}60%{opacity:1}100%{transform:translate(-50%,-50%) scale(1);opacity:1}}
@keyframes psShake{0%,100%{transform:translate(-50%,-50%)}15%{transform:translate(-52%,-50%) rotate(-2.5deg)}35%{transform:translate(-48%,-50%) rotate(2.5deg)}55%{transform:translate(-52%,-51%) rotate(-3deg)}75%{transform:translate(-48%,-50%) rotate(3deg)}}
@keyframes psOut{from{transform:translate(-50%,-50%);opacity:1}to{transform:translate(-50%,10%) scale(.6);opacity:0}}
.ps-chest .lid{transform-box:view-box;transform-origin:22px 84px;animation:psLid .9s 1.4s cubic-bezier(.3,1.5,.5,1) forwards}@keyframes psLid{to{transform:translate(-4px,-14px) rotate(-52deg)}}
.ps-chest .glow{opacity:0;animation:psFade .5s 1.5s forwards}@keyframes psFade{to{opacity:1}}
.ps-chest .pile{opacity:0;transform-box:view-box;transform-origin:110px 82px;transform:scale(1,.1);animation:psPile .9s 1.7s cubic-bezier(.2,1.4,.4,1) forwards}@keyframes psPile{to{transform:none;opacity:1}}
.ps-chest .spill ellipse{opacity:0;animation:psSlide .9s 2s ease-in forwards}@keyframes psSlide{0%{opacity:0;transform:translateY(-8px)}15%{opacity:1}100%{opacity:1;transform:translateY(26px)}}
.ps-fl{inset:0;background:radial-gradient(circle at 50% 44%,#fffbe6,#ffd84d88 40%,transparent 70%);opacity:0;pointer-events:none;animation:psFlash .9s 2.8s ease-out both}@keyframes psFlash{0%{opacity:0}20%{opacity:1}100%{opacity:0}}
.ps-h{left:0;right:0;top:9%;text-align:center;font:900 clamp(38px,9.5vw,128px)/1 var(--serif);letter-spacing:2px;background:linear-gradient(180deg,#fff7c2 0%,#ffd84d 38%,#b8860b 52%,#ffe27a 70%,#8a5a00 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 6px 0 #4a3000) drop-shadow(0 0 28px #ffd84d88);opacity:0;animation:psUp .8s 2.9s both}
.ps-md{left:50%;top:44%;width:min(150px,32vw);transform:translate(-50%,-50%);opacity:0;filter:drop-shadow(0 0 24px #ffd84d) drop-shadow(0 6px 0 #4a3000);animation:psPop .9s 3s cubic-bezier(.2,1.5,.4,1) both}.ps-md svg{display:block;width:100%;height:auto;overflow:visible}
@keyframes psPop{0%{transform:translate(-50%,-50%) scale(0) rotate(-120deg);opacity:0}100%{transform:translate(-50%,-50%) scale(1) rotate(0);opacity:1}}
.ps-ar{top:44%;width:clamp(44px,8vw,100px);height:clamp(90px,16vw,190px);margin-top:calc(clamp(90px,16vw,190px)/-2);background:linear-gradient(#fff2a8,#d4a017 50%,#8a5a00);clip-path:polygon(100% 0,30% 50%,100% 100%,78% 100%,0 50%,78% 0);opacity:0;filter:drop-shadow(0 0 10px #ffd84d);animation:psUp .7s 3.1s both}
.ps-ar.l{left:calc(50% - min(38vw,400px))}.ps-ar.l2{left:calc(50% - min(38vw,400px) + clamp(30px,5vw,60px));transform:scale(.7);opacity:.7;animation-delay:3.2s}
.ps-ar.r{right:calc(50% - min(38vw,400px));transform:scaleX(-1)}.ps-ar.r2{right:calc(50% - min(38vw,400px) + clamp(30px,5vw,60px));transform:scaleX(-.7) scaleY(.7);animation-delay:3.2s}
.ps-you{left:0;right:0;top:60%;text-align:center;color:#fff;font:700 clamp(14px,2.2vw,26px) var(--serif);letter-spacing:4px;text-shadow:0 2px 8px #000,0 0 14px #ffd84d66;opacity:0;animation:psUp .6s 3.4s both}
.ps-bn{left:0;right:0;top:67%;margin:0 auto;width:max-content;max-width:94vw;padding:8px 40px;border:3px solid #ffe27a;border-radius:6px;background:linear-gradient(90deg,#3a2500,#7a5000cc,#3a2500);color:#fff3b0;font:900 clamp(20px,3.8vw,46px)/1.1 var(--serif);letter-spacing:2px;text-shadow:0 0 14px #ffd84d;box-shadow:0 0 40px #ffd84d99,inset 0 0 20px #ffd84d55;opacity:0;animation:psUp .7s 3.7s both,psGlow 1.8s 4.4s ease-in-out infinite}
@keyframes psGlow{50%{box-shadow:0 0 70px #ffd84dcc,inset 0 0 30px #ffd84d88}}
.ps-pf{left:0;right:0;top:80%;text-align:center;font:700 clamp(15px,2.2vw,26px) var(--serif);color:#86efac;text-shadow:0 2px 6px #000;opacity:0;animation:psUp .6s 4.1s both}
@keyframes psUp{from{opacity:0;transform:translateY(26px) scale(.96)}to{opacity:1}}
.ps-sk{bottom:26px;left:0;right:0;margin:0 auto;width:max-content;min-width:130px;z-index:3}
@media(prefers-reduced-motion:reduce){.ps-chest,.ps-cv,.ps-fl{display:none}.ps-rays{opacity:.6}}`;document.head.appendChild(s)}
/* ---- 5) odds for the new cosmetics: keep every rarity's TOTAL chance exactly as before (Crate.table normalises per-item shares) ---- */
if(typeof CFG!=='undefined'&&CFG.CRATE){CFG.CRATE.tag.epic={pot:15};CFG.CRATE.grad.epic={pot:30};CFG.CRATE.grad.legendary={pot:10}}
/* collections: Level 10 stays "everything except the reward itself" */
try{if(typeof Mastery!=='undefined'){const all=[...COS,...Cos.lim];Mastery.by.tc.thr[9]=all.filter(c=>c.type==='tag').length-1;Mastery.by.gc.thr[9]=all.filter(c=>c.type==='grad').length}}catch(e){console.error(e)}
/* ---- 2) Epic+ pity (own signed key; one counter per crate kind) ---- */
const PK='0-100_v2.95_pity',LIM=10,pity={
get(){const r=Store.readSigned(PK),o={tags:0,grads:0};if(r.status==='ok'&&r.raw!=null)try{const j=JSON.parse(r.raw);for(const k in o)o[k]=Math.max(0,Math.min(LIM,Math.floor(Store.num(j&&j[k],0))))}catch(e){}return o},
put(o){Store.writeSigned(PK,JSON.stringify(o))}};
if(typeof Crate!=='undefined'){
let busy=false,force=false;const op=Crate.pick,oo=Crate.open;
Crate.pick=function(kind,rnd=Econ.rnd){if(!force)return op.call(this,kind,rnd);
const t=Crate.table(kind).filter(r=>r.c.rar==='epic'||r.c.rar==='legendary'),tot=t.reduce((a,r)=>a+r.p,0);let x=rnd()*tot,r=t[t.length-1];for(const row of t){if(x<row.p){r=row;break}x-=row.p}return r.c};
/* the counter is updated in the same synchronous call that deducts the Gems and saves the item, so a refresh / interrupted animation can never lose or repeat it */
Crate.open=function(kind,rnd){if(!Crate.kinds[kind])return oo.call(this,kind,rnd);if(busy)return{ok:false,msg:'Please wait'};busy=true;
try{const p=pity.get();force=p[kind]>=LIM;const r=oo.call(this,kind,rnd);force=false;
if(r&&r.ok){const hit=r.c.rar==='epic'||r.c.rar==='legendary';p[kind]=hit?0:Math.min(LIM,p[kind]+1);pity.put(p)}return r}finally{force=false;busy=false}};
Crate.pity=pity;Crate.PITY_LIMIT=LIM}
if(typeof Pages!=='undefined'&&typeof document!=='undefined'&&Pages.shop){
const bm=Pages.shop.mount;
const ui=app=>{const p=pity.get();app.querySelectorAll('.crt').forEach(sec=>{const rb=sec.querySelector('[data-roll]'),cv=sec.querySelector('.crv');if(!rb||!cv)return;const k=rb.dataset.roll,n=p[k]||0;let el=cv.querySelector('.pity');
if(!el){el=document.createElement('div');el.className='pity';cv.appendChild(el)}
const v=k+n;if(el.dataset.v===v)return;el.dataset.v=v;
el.innerHTML=`<div class="pity-t">EPIC+ PITY <b>${n}/${LIM}</b></div><div class="pity-b" role="img" aria-label="${n} of ${LIM} spins without an Epic or better">${Array.from({length:LIM},(_,i)=>`<i${i<n?' class="on"':''}></i>`).join('')}</div><div class="pity-n">${n>=LIM?'Next spin: guaranteed Epic or Legendary!':`Guaranteed Epic+ on spin ${LIM+1}`}</div>`})};
Pages.shop.mount=function(app){const c=bm.call(this,app);ui(app);const mo=new MutationObserver(()=>ui(app));mo.observe(app,{childList:true});return()=>{mo.disconnect();if(c)c()}};
if(!document.getElementById('stk-pity')){const s=document.createElement('style');s.id='stk-pity';s.textContent=`.pity{margin-top:8px;display:grid;gap:3px;font:700 11px Fredoka,sans-serif}.pity-t{letter-spacing:1px;color:#e9c9ff}.pity-t b{color:#fff}
.pity-b{display:flex;gap:3px;justify-content:center}.pity-b i{flex:1;max-width:16px;height:8px;border-radius:3px;background:#262626;border:1px solid #ffffff55}.pity-b i.on{background:linear-gradient(#f0abfc,#be0bb1);border-color:#f0abfc}
.pity-n{font-weight:400;color:#a3a3a3;font-size:10px}`;document.head.appendChild(s)}}
/* ---- 3) Chicken: longer gap, rolling rate limit, minimum round duration, no round credit for trivial cash-outs ---- */
if(typeof CFG!=='undefined'){CFG.GAP_MS.CHICKEN=4000}
if(typeof Econ!=='undefined'&&typeof App!=='undefined'){
const RL='steak_rl_CHICKEN',WIN=60000,MAX=12,MIN_ROUND_MS=3000,MIN_MULT=1.15,oc=Econ.cool,stamp={};
Econ.cool=function(game,now=Date.now()){if(game!=='CHICKEN')return oc.call(this,game,now);
let a=[];try{a=JSON.parse(localStorage.getItem(RL)||'[]').filter(t=>Number.isFinite(t)&&t<=now&&now-t<WIN)}catch(e){}
if(a.length>=MAX)return Math.max(1,a[0]+WIN-now);
const w=oc.call(this,game,now);if(w)return w;a.push(now);if(a.length>MAX)a.shift();try{localStorage.setItem(RL,JSON.stringify(a))}catch(e){}return 0};
const ob=App.bet;App.bet=function(el,game,keep){const r=ob.apply(this,arguments);if(r&&game==='CHICKEN')stamp.c=performance.now();return r};
const os=App.settle;App.settle=function(g,b,gross,o){
if(g==='CHICKEN'&&!(o&&o.noCount)){const quick=stamp.c!=null&&performance.now()-stamp.c<MIN_ROUND_MS,tiny=gross>0&&b>0&&gross/b<MIN_MULT;if(quick||tiny)o=Object.assign({},o,{noCount:true})}
return os.call(this,g,b,gross,o)}}
/* ---- 4) Cases: Pirate Token reward list shows real animated previews ---- */
if(typeof Games!=='undefined'&&Games.cases&&typeof Pv295!=='undefined'){const m=Games.cases.mount;
Games.cases.mount=function(el){const c=m.call(this,el);try{const d=el.querySelector('.cs-pk div');if(d)d.innerHTML=Pv295.list()}catch(e){console.error(e)}return c}}
})();
