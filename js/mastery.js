/* v2.75 Mastery: 19 independent objectives x 10 levels (17 play objectives + Tag Collection + Gradient Collection). Progress lives in its own signed save key, so existing saves are untouched.
   MANUAL CLAIMS: reaching a level only COMPLETES it. The reward (coins + Gems + the level's cosmetic) is paid when the player presses CLAIM on the Mastery page. Three separate facts per level:
     completed (d.l = number of completed levels), claimed (d.k = bit mask, bit n-1 = level n claimed), claimable = completed and not claimed.
   Claiming never touches the counter d.c, so progress toward the next milestone keeps running (and keeps completing further levels) while rewards wait to be claimed.
   Old saves (no d.k): every level that was already completed was auto-paid by v2.7, so those levels migrate as claimed.
   Counting: games count when the round settles (Econ.settle is wrapped below). Blackjack split hands settle in one tick and count as ONE game. Cases are counted by the Cases game itself (Mastery.cases, every row counts).
   Aviamasters landings use the RAW gross/bet multiplier (before the 2X bonus) with bands [4,5) [5,6) [6,7) [7,inf). "Rank-Up Ready" rewards are counted by Perks (pirate.js).
   COLLECTIONS (tc = unique tags, gc = unique gradients): the counter is the number of DISTINCT cosmetic ids owned (duplicates never exist in the inventory), refreshed on every Store.save (wrapped below) so it moves the moment a cosmetic is obtained.
   The counter is a high-water mark (selling later never un-completes anything); both limited and normal cosmetics count. Collection Level 10 = every tag / gradient in the game except the reward itself (see tests/update275.test.js).
   Dev helpers (devComplete / devReset) refuse to run unless DEVENV() (localhost). */
const Mastery=(()=>{
const KEY='0-100_v2.7_mastery',LV=10,COSLV=[3,6,10];
const T=(id,name,unit,thr,cash,gems,col)=>({id,name,unit,thr,cash,gems,col:!!col});
const G=[20,50,100,250,500,1000,2500,5000,10000,25000],GC=[250,400,650,1000,1750,3000,5500,10000,18000,35000],
H=[25,75,200,500,1000,2500,5000,10000,25000,50000],R1=[1,3,6,12,25,50,90,150,250,400],R1C=[250,500,900,1500,2500,4500,8000,14000,24000,40000],
R2=[1,2,4,8,15,30,50,80,125,200],R2C=[400,800,1400,2400,4000,7000,12000,20000,32000,50000],R3=[1,2,3,5,8,12,20,30,45,70],R3C=[750,1500,2500,4000,6500,10000,16000,26000,42000,70000];
/* v2.75 Gem rewards per level, scaled by how hard the objective is (a Gem is worth 100 coins when converted, so Gems stay a small, steady slice of each level's value) */
const GE={easy:[1,1,2,2,3,4,5,6,8,10],mid:[1,2,2,3,4,5,7,9,12,15],hard:[2,2,3,4,6,8,10,13,16,20],elite:[2,3,4,6,8,11,14,18,23,30],tok:[3,4,6,8,10,14,18,24,32,45]};
/* collections: Level 10 = all tags / gradients except the reward itself (69 tags - 1, 39 gradients). Same coin / Gem structure for both. */
const TCT=[3,6,12,20,30,40,50,58,64,68],GCT=[2,4,7,11,17,23,28,33,36,39],CCASH=[500,1000,2000,3500,6000,10000,16000,25000,40000,70000],CGEM=[2,3,4,6,8,11,15,20,27,40];
const tracks=[
T('cases','Cases Opened','cases opened',G,GC,GE.easy),T('av','Aviamasters Flights Launched','flights launched',G,GC,GE.easy),T('bj','Blackjack Games Played','games played',G,GC,GE.easy),
T('pl','Plinko Balls Deployed','balls deployed',[100,300,750,2000,5000,10000,25000,50000,100000,250000],GC,GE.easy),T('mn','Mines Games Played','games played',G,GC,GE.easy),
T('fl','Flip Games Played','games played',H,GC,GE.easy),T('dn','Double or Nothing Games Played','games played',H,GC,GE.easy),T('ck','Chicken Games Played','games played',G,GC,GE.easy),
T('lg','Legendary Case Drops','Legendary drops',R1,R1C,GE.mid),T('my','Mythic Case Drops','Mythic drops',R2,R2C,GE.hard),T('sc','Secret Case Drops','Secret drops',R3,R3C,GE.elite),
T('pt','Pirate Tokens Obtained','Pirate Tokens',[1,2,3,4,5,7,10,15,20,30],[2500,5000,8000,12000,18000,28000,45000,70000,110000,180000],GE.tok),
T('a4','Aviamasters Landings at 4-5x','landings at 4-5x',R1,R1C,GE.mid),T('a5','Aviamasters Landings at 5-6x','landings at 5-6x',R2,R2C,GE.hard),T('a6','Aviamasters Landings at 6-7x','landings at 6-7x',R3,R3C,GE.elite),T('a7','Aviamasters Landings at 7x+','landings at 7x+',R3,R3C,GE.elite),
T('ir','Rank-Up Ready Rewards','rank-up ready rewards',[1,2,3,5,7,10,14,18,23,30],[2500,5000,9000,15000,25000,40000,65000,100000,150000,250000],GE.tok),
T('tc','Tag Collection','unique tags collected',TCT,CCASH,CGEM,1),T('gc','Gradient Collection','unique gradients collected',GCT,CCASH,CGEM,1)];
tracks.forEach(t=>{t.cos=COSLV.map(l=>'m_'+t.id+'_'+l)});
const by=Object.fromEntries(tracks.map(t=>[t.id,t])),MAP={PLINKO:'pl',MINES:'mn',FLIP:'fl','DOUBLE OR NOTHING':'dn',CHICKEN:'ck',BLACKJACK:'bj',AVIAMASTERS:'av'};
const blank=()=>({c:{},l:{},k:{}}),int=v=>Math.max(0,Math.floor(Store.num(v,0))),MASK=(1<<LV)-1,pop=m=>{let n=0;for(;m;m&=m-1)n++;return n};
function read(){const r=Store.readSigned(KEY),d=blank();let o=null;if(r.status!=='bad'&&r.raw!=null)try{o=JSON.parse(r.raw)}catch(e){}
const old=!(o&&o.k&&typeof o.k==='object');   // v2.7 save: completed levels were already paid -> claimed
tracks.forEach(t=>{const l=Math.min(LV,int(o&&o.l&&o.l[t.id])),full=(1<<l)-1;d.c[t.id]=int(o&&o.c&&o.c[t.id]);d.l[t.id]=l;d.k[t.id]=old?full:(int(o.k[t.id])&MASK&full)});return d}
const write=d=>Store.writeSigned(KEY,JSON.stringify(d));
/* levels that became complete for one objective (counter reached the threshold); NOTHING is paid here */
function advance(d,t,due){while(d.l[t.id]<LV&&d.c[t.id]>=t.thr[d.l[t.id]])due.push({t,lv:++d.l[t.id]})}
function addMany(o){const d=read(),due=[];let any=false;
for(const t of tracks){const n=Math.floor(+o[t.id]||0);if(n<=0||t.col)continue;any=true;d.c[t.id]+=n;advance(d,t,due)}
if(!any)return[];write(d);if(due.length)notify(due);return due}
/* collections: distinct owned cosmetic ids of each type (the inventory never holds duplicates; the Set guards against a corrupt save) */
function owned(){const o={tc:0,gc:0};if(!Store.d||!Array.isArray(Store.d.inv))return o;new Set(Store.d.inv).forEach(id=>{const c=Cos.by(id);if(c)o[c.type==='tag'?'tc':'gc']++});return o}
function syncCollection(){const o=owned(),d=read(),due=[];let ch=false;
for(const id of['tc','gc']){const t=by[id];if(o[id]>d.c[id]){d.c[id]=o[id];ch=true}advance(d,t,due)}
if(ch||due.length)write(d);if(due.length)notify(due);return due}
/* ---------- manual claims ---------- */
function pay(t,lv){const cash=t.cash[lv-1],gems=t.gems[lv-1];Econ.addCoins(cash);if(gems){Store.check();Store.d.gems+=gems;Store.sync()}
const c=Cos.by('m_'+t.id+'_'+lv);if(c&&!Store.d.inv.includes(c.id))Store.d.inv.push(c.id);Store.save();try{App.bal()}catch(e){}return{t,lv,cash,gems,cos:c||null}}
/* the claimed bit is saved BEFORE paying, so a crash or double click can never pay twice. The counter d.c is never touched: progress toward the next level continues. */
function claim(id,lv){const t=by[id];lv=Math.floor(lv);if(!t||!(lv>=1&&lv<=LV))return{ok:false,msg:'Unknown reward'};Store.load();syncCollection();const d=read();
if(lv>d.l[id])return{ok:false,msg:'Level not completed yet'};const bit=1<<(lv-1);if(d.k[id]&bit)return{ok:false,msg:'Already claimed'};
d.k[id]|=bit;write(d);return Object.assign({ok:true},pay(t,lv))}
const stats=(id,d=read())=>{const done=d.l[id],cl=pop(d.k[id]);return{completed:done,claimed:cl,claimable:done-cl}};
const claimable=(id,d=read())=>Array.from({length:d.l[id]},(_,i)=>i+1).filter(l=>!(d.k[id]&(1<<(l-1))));
const claimableCount=()=>{const d=read();return tracks.reduce((a,t)=>a+d.l[t.id]-pop(d.k[t.id]),0)};
function claimAll(id){const out=[];for(const t of tracks){if(id&&t.id!==id)continue;for(const lv of claimable(t.id)){const r=claim(t.id,lv);if(r.ok)out.push(r)}}
return{ok:out.length>0,n:out.length,cash:out.reduce((a,r)=>a+r.cash,0),gems:out.reduce((a,r)=>a+r.gems,0),cos:out.map(r=>r.cos).filter(Boolean),list:out}}
let bj=false;
function record(game,bet,gross){const id=MAP[game];if(!id)return;
if(id==='bj'){if(bj)return;bj=true;Promise.resolve().then(()=>{bj=false})}   // split hands settle in the same tick: one game
const o={[id]:1};if(id==='av'&&bet>0){const m=gross/bet+1e-9;const k=m>=7?'a7':m>=6?'a6':m>=5?'a5':m>=4?'a4':null;if(k)o[k]=1}
addMany(o)}
const CASEK={Legendary:'lg',Mythic:'my',Secret:'sc',Pirate:'pt'};
function cases(keys){const o={cases:keys.length};keys.forEach(k=>{if(CASEK[k])o[CASEK[k]]=(o[CASEK[k]]||0)+1});return addMany(o)}
/* dev: completes the level (sets the counter to its requirement); the reward still has to be claimed */
function devComplete(id,lv){if(!DEVENV())return false;const t=by[id];lv=Math.floor(lv);if(!t||!(lv>=1&&lv<=LV))return false;const d=read(),due=[];d.c[id]=Math.max(d.c[id],t.thr[lv-1]);advance(d,t,due);write(d);if(due.length)notify(due);return true}
function devReset(){if(!DEVENV())return false;write(blank());const d=Store.d;if(d){d.inv=d.inv.filter(id=>{const c=Cos.by(id);return!(c&&c.src==='mastery')});for(const k of['tag','grad']){const c=Cos.by(d.eq[k]);if(c&&c.src==='mastery')d.eq[k]=null}Store.save()}syncCollection();return true}
const total=()=>{const d=read();return tracks.reduce((a,t)=>a+d.l[t.id],0)};
/* ---------- notifications (banner queue; waits while a full-screen overlay is open) ---------- */
const Q=[];let showing=false;
const medal=sz=>`<svg viewBox="0 0 48 48" width="${sz}" height="${sz}" aria-hidden="true"><path d="M13 2h8l3 12-7 4zM35 2h-8l-3 12 7 4z" fill="#ef4444"/><circle cx="24" cy="30" r="14" fill="#ffd84d" stroke="#8a5a00" stroke-width="2.5"/><circle cx="24" cy="30" r="10" fill="none" stroke="#fff6c0" stroke-width="1.5"/><path d="M24 22l2.6 5.2 5.8.8-4.2 4 1 5.7-5.2-2.7-5.2 2.7 1-5.7-4.2-4 5.8-.8z" fill="#8a5a00"/></svg>`;
function notify(ev){if(typeof document==='undefined')return;if(ev.length>3)Q.push({sum:ev.length});else Q.push(...ev);try{if(typeof Shell!=='undefined')Shell.update()}catch(e){}pump()}
function pump(){if(showing||!Q.length)return;if(document.querySelector('.pt-ov,.pk-ov,.crov')){setTimeout(pump,900);return}
showing=true;const e=Q.shift(),b=document.createElement('div');b.className='msb';b.setAttribute('role','status');
b.innerHTML=e.sum?`<span class="msm">${medal(46)}</span><div><b>${e.sum} MASTERY REWARDS READY</b><span>Open the Mastery page to claim them</span></div>`
:`<span class="msm">${medal(46)}</span><div><b>MASTERY LEVEL ${e.lv} COMPLETE</b><span>${e.t.name}</span><em>Claim it on the Mastery page: $${Econ.fi(e.t.cash[e.lv-1])} + ${e.t.gems[e.lv-1]} Gems${Cos.by('m_'+e.t.id+'_'+e.lv)?' + cosmetic':''}</em></div>`;
document.body.appendChild(b);requestAnimationFrame(()=>b.classList.add('in'));try{FX.confetti(b,28)}catch(x){}
setTimeout(()=>{b.classList.remove('in');setTimeout(()=>{b.remove();showing=false;pump()},450)},3400)}
const api={tracks,by,LV,COSLV,read,addMany,add:(id,n=1)=>addMany({[id]:n}),cases,record,total,devComplete,devReset,medal,KEY,claim,claimAll,claimable,claimableCount,stats,syncCollection,owned,TCT,GCT};
/* every settled round feeds Mastery (wrapped once; Cases count themselves per row) */
{const s=Econ.settle;Econ.settle=function(g,b,gross,o){const pay=s.call(this,g,b,gross,o);try{if(!(o&&o.noCount)&&b>=CFG.ROUND_MIN_BET-1e-9)api.record(g,b,gross)}catch(e){console.error(e)}return pay}}
/* collections follow the inventory: every save that gained a cosmetic (shop, crates, Pirate rewards, mastery claims) refreshes them at once */
{const sv=Store.save;Store.save=function(){const r=sv.apply(this,arguments);try{syncCollection()}catch(e){console.error(e)}return r}}
/* limited cosmetics can never be sold */
{const s=Inv.sell;Inv.sell=id=>{const c=Cos.by(id);if(c&&c.lim)return{ok:false,msg:'Limited cosmetics cannot be sold'};return s.call(Inv,id)}}
try{syncCollection()}catch(e){}
return api})();
if(typeof Pages!=='undefined'&&typeof document!=='undefined'){
const st=document.createElement('style');st.id='stk-ms';st.textContent=`
.msb{position:fixed;left:50%;top:84px;z-index:120;display:flex;align-items:center;gap:14px;padding:10px 20px 10px 14px;background:#0a0a0a;border:2px solid #ffd84d;border-radius:20px;box-shadow:0 10px 36px #000c,0 0 28px #ffd84d55;transform:translate(-50%,-30px);opacity:0;transition:transform .45s cubic-bezier(.2,1.2,.3,1),opacity .3s;max-width:92vw}
.msb.in{transform:translate(-50%,0);opacity:1}.msb div{display:grid;gap:1px;text-align:left}.msb b{font:700 15px var(--serif);color:#ffd84d;letter-spacing:.5px}.msb span{font-size:13px;color:#e5e5e5}.msb em{font-style:normal;font-weight:800;font-size:14px}
.msm{display:grid;place-items:center;animation:msSpin 1.1s cubic-bezier(.3,1.4,.5,1)}@keyframes msSpin{from{transform:rotateY(540deg) scale(.2)}}
.msg{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:12px;margin-bottom:16px}
.msc{position:relative;display:grid;gap:6px;text-align:left;padding:12px 14px;border:3px solid var(--line);border-radius:22px;background:var(--panel);color:#fff;font:inherit;cursor:pointer;transition:background .25s,color .25s,transform .25s}
.msc:hover{transform:translateY(-2px);background:#ffffff1f}.msc.on{background:#fff;color:#000}.msc .msn{font-weight:800;font-size:14px;line-height:1.2}.msc .msl{font:700 12px Montserrat,sans-serif}.msc small{font-size:11px;opacity:.85}.msc .pb{margin:0}
.msc.max .msl{color:#ffd84d}.msc.on.max .msl{color:#8a5a00}.msc.on .pb{background:#d6d6d6;border-color:#000}.msc.on .pb span{color:#000}
.msc.rdy{border-color:#8fe88f}.mscn{position:absolute;right:10px;top:-10px;background:#8fe88f;color:#102;font:900 10px Montserrat,sans-serif;letter-spacing:.5px;padding:2px 9px;border-radius:999px;animation:msPop 1.2s ease-in-out infinite}@keyframes msPop{50%{transform:scale(1.1)}}
.mst{display:grid;gap:6px}.msr{display:grid;grid-template-columns:70px minmax(0,1.1fr) 118px minmax(0,1.5fr) 104px;gap:10px;align-items:center;padding:8px 12px;border:2px solid #ffffff55;border-radius:16px;background:#050505;transition:border-color .25s,background .25s}
.msr.cur{border-color:#fff;background:#141414}.msr.claimed{opacity:.62}.msr.ready{border-color:#8fe88f;background:#0c1a0c}.msr .msv{font:700 13px Montserrat,sans-serif;color:#ffd84d}.msr .msq{font-size:14px}.msr .msc2{font-weight:800;display:grid;gap:2px;line-height:1.2}.msr .msc2 span{display:flex;align-items:center;gap:4px;color:#e9c9ff}
.msr .mscos{display:grid;gap:2px;min-width:0}.msr .mscos small{color:#a3a3a3;font-size:11px;line-height:1.3}.msr .mscos .pv{min-height:30px;display:flex;align-items:center}
.msr .msk{justify-self:end;font:900 11px Montserrat,sans-serif;letter-spacing:.5px;color:#a3a3a3;text-align:center}.msr .msk.ok{color:#8fe88f}.msr .msclaim{padding:6px 12px;font-size:12px;animation:msPop 1.1s ease-in-out infinite}
.msh{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.msh svg{flex:none}.msh .msall{margin-left:auto;font-size:12px;padding:6px 14px}.mssm{font-size:12px;color:#e5e5e5;margin:-4px 0 10px}
.qp2{position:relative}.mscl{position:relative}.mscl::after{content:"";position:absolute;top:5px;right:5px;width:10px;height:10px;border-radius:50%;background:#ef4444;box-shadow:0 0 8px #ef4444;pointer-events:none}
@media(max-width:800px){.msr{grid-template-columns:54px minmax(0,1fr) 96px}.msr .msc2,.msr .mscos{grid-column:2/4}}
@media(prefers-reduced-motion:reduce){.msb,.msm,.mscn,.msr .msclaim{animation:none;transition:none}}`;document.head.appendChild(st);
Pages.mastery={mount(app){let sel=Mastery.tracks[0].id;
const fmt=n=>(+n).toLocaleString('en-US'),M=Mastery,cosOf=(t,l)=>{const i=M.COSLV.indexOf(l);return i<0?null:Cos.by(t.cos[i])};
const render=()=>{M.syncCollection();const D=M.read(),T=M.by[sel],S=M.stats(sel,D),all=M.claimableCount();
const card=t=>{const l=D.l[t.id],c=D.c[t.id],mx=l>=M.LV,nx=t.thr[l],cl=M.stats(t.id,D).claimable;
return `<button class="msc${t.id===sel?' on':''}${mx?' max':''}${cl?' rdy':''}" data-t="${t.id}" aria-pressed="${t.id===sel}">${cl?`<span class="mscn">${cl} TO CLAIM</span>`:''}<span class="msn">${t.name}</span><span class="msl">${mx?'COMPLETED':'LEVEL '+l+' / '+M.LV}</span>${mx?'':Dash.bar(`${fmt(c)} / ${fmt(nx)}`,Math.min(1,c/nx))}<small>${mx?fmt(c)+' '+t.unit:'Next: $'+Econ.fi(t.cash[l])+' + '+t.gems[l]+' Gems'+(cosOf(t,l+1)?' + cosmetic':'')}</small></button>`};
const row=l=>{const c=D.c[T.id],done=l<=D.l[T.id],claimed=!!(D.k[T.id]&(1<<(l-1))),cur=l===D.l[T.id]+1,cs=cosOf(T,l),pg=cur?Math.min(1,c/T.thr[l-1]):0;
return `<div class="msr${done?' done':''}${claimed?' claimed':''}${done&&!claimed?' ready':''}${cur?' cur':''}"><span class="msv">LEVEL ${l}</span><span class="msq">${fmt(T.thr[l-1])} ${T.unit}${cur?`<br><small>${fmt(Math.min(c,T.thr[l-1]))} / ${fmt(T.thr[l-1])} (${Math.floor(pg*100)}%)</small>`:''}</span><span class="msc2">$${Econ.fi(T.cash[l-1])}<span>${gemIcon(14)} ${T.gems[l-1]}</span></span>
<span class="mscos">${cs?`<span class="pv">${prevHtml(cs)}</span><small>${cs.name} &bull; ${rarTxt(cs)} &bull; unsellable<br>${cs.desc.replace(/^Mastery reward: [^.]*\. Limited and unsellable\. /,'')}</small>`:'<small>Coins and Gems only</small>'}</span>${claimed?'<span class="msk ok" aria-label="Claimed">&#10003; CLAIMED</span>':done?`<button class="btn msclaim" data-claim="${l}" type="button">CLAIM</button>`:'<span class="msk" aria-label="Locked">LOCKED</span>'}</div>`};
app.innerHTML=`<h2 class="sec">🥇 Mastery ›</h2>${gchip()}<div class="dp qp2"><p class="qhint">Every objective levels up on its own. Completed levels are claimed by hand, and claiming never resets your progress toward the next level. Levels completed: <b>${M.total()}</b> / ${M.tracks.length*M.LV}${all?` &bull; <b>${all}</b> ready to claim`:''}</p>${all?'<button class="btn msall" id="msall" type="button" style="margin-bottom:12px">CLAIM ALL ('+all+')</button>':''}
<div class="msg">${M.tracks.map(card).join('')}</div><h3 class="lined msh">${M.medal(26)} ${T.name}${S.claimable?`<button class="btn msall" id="mstall" type="button">CLAIM ${S.claimable} REWARD${S.claimable>1?'S':''}</button>`:''}</h3><p class="mssm">Completed <b>${S.completed}</b> &bull; Claimable <b>${S.claimable}</b> &bull; Claimed <b>${S.claimed}</b> (of ${M.LV})</p><div class="mst">${Array.from({length:M.LV},(_,i)=>row(i+1)).join('')}</div></div>`;
app.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{sel=b.dataset.t;render()});
const done=(r,msg)=>{if(!r.ok){App.toast(r.msg||'Nothing to claim');render();return}
const gm=r.gems,co=r.cash,cs=r.cos;App.toast(`${msg}: +$${Econ.fi(co)}${gm?`, +${gm} Gem${gm>1?'s':''}`:''}${(Array.isArray(cs)?cs.length:cs)?', new cosmetic':''}`);render();try{FX.confetti(app.querySelector('.qp2'),36)}catch(e){}};
app.querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>{if(b.dataset.busy)return;b.dataset.busy=1;const r=M.claim(sel,+b.dataset.claim);done(r&&r.ok?{ok:true,cash:r.cash,gems:r.gems,cos:r.cos}:r,'Claimed')});
const a=$('msall'),s=$('mstall');if(a)a.onclick=()=>{a.disabled=true;done(M.claimAll(),'Claimed all')};if(s)s.onclick=()=>{s.disabled=true;done(M.claimAll(sel),'Claimed')}};
render()}};
/* inventory: limited cosmetics show an unsellable badge instead of a SELL button */
const im=Pages.inventory&&Pages.inventory.mount;
if(im)Pages.inventory.mount=function(app){const cl=im.call(this,app),fix=()=>app.querySelectorAll('[data-sell]').forEach(b=>{const c=Cos.by(b.dataset.sell);if(c&&c.lim){const s=document.createElement('button');s.className='sellb';s.disabled=true;s.style.opacity='.6';s.textContent='LIMITED - UNSELLABLE';b.replaceWith(s)}}),mo=new MutationObserver(fix);mo.observe(app,{childList:true,subtree:true});fix();return()=>{mo.disconnect();if(cl)cl()}};
/* sidebar: a red dot on the Mastery icon while rewards wait to be claimed */
if(typeof Shell!=='undefined'){const u=Shell.update;Shell.update=function(){const r=u.apply(this,arguments);try{const a=document.querySelector('#sb a[href="#mastery"]');if(a)a.classList.toggle('mscl',Mastery.claimableCount()>0)}catch(e){}return r}}
}
