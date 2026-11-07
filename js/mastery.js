/* v2.7 Mastery: 17 independent objectives x 10 levels. Progress lives in its own signed save key (like playtime), so existing saves are untouched.
   Rewards (Steakcoin + limited cosmetics) are paid automatically the moment a level's requirement is met. Cash is a wallet credit via Econ.addCoins:
   not game profit, not rank money, not quest progress. Counting:
   - Games: counted when the round settles (Econ.settle is wrapped below). Blackjack split hands settle in one tick and count as ONE game. Cases are counted by the Cases game itself (Mastery.cases).
   - Aviamasters landings use the RAW gross/bet multiplier (before the 2X bonus) with bands [4,5) [5,6) [6,7) [7,inf). Instant rank-ups are counted by Perks (pirate.js).
   Dev helpers (devComplete / devReset) refuse to run unless DEVENV() (localhost). */
const Mastery=(()=>{
const KEY='0-100_v2.7_mastery',LV=10,COSLV=[3,6,10];
const T=(id,name,unit,thr,cash)=>({id,name,unit,thr,cash});
const G=[20,50,100,250,500,1000,2500,5000,10000,25000],GC=[250,400,650,1000,1750,3000,5500,10000,18000,35000],
H=[25,75,200,500,1000,2500,5000,10000,25000,50000],R1=[1,3,6,12,25,50,90,150,250,400],R1C=[250,500,900,1500,2500,4500,8000,14000,24000,40000],
R2=[1,2,4,8,15,30,50,80,125,200],R2C=[400,800,1400,2400,4000,7000,12000,20000,32000,50000],R3=[1,2,3,5,8,12,20,30,45,70],R3C=[750,1500,2500,4000,6500,10000,16000,26000,42000,70000];
const tracks=[
T('cases','Cases Opened','cases opened',G,GC),T('av','Aviamasters Flights Launched','flights launched',G,GC),T('bj','Blackjack Games Played','games played',G,GC),
T('pl','Plinko Balls Deployed','balls deployed',[100,300,750,2000,5000,10000,25000,50000,100000,250000],GC),T('mn','Mines Games Played','games played',G,GC),
T('fl','Flip Games Played','games played',H,GC),T('dn','Double or Nothing Games Played','games played',H,GC),T('ck','Chicken Games Played','games played',G,GC),
T('lg','Legendary Case Drops','Legendary drops',R1,R1C),T('my','Mythic Case Drops','Mythic drops',R2,R2C),T('sc','Secret Case Drops','Secret drops',R3,R3C),
T('pt','Pirate Tokens Obtained','Pirate Tokens',[1,2,3,4,5,7,10,15,20,30],[2500,5000,8000,12000,18000,28000,45000,70000,110000,180000]),
T('a4','Aviamasters Landings at 4-5x','landings at 4-5x',R1,R1C),T('a5','Aviamasters Landings at 5-6x','landings at 5-6x',R2,R2C),T('a6','Aviamasters Landings at 6-7x','landings at 6-7x',R3,R3C),T('a7','Aviamasters Landings at 7x+','landings at 7x+',R3,R3C),
T('ir','Instant Rank-Ups','instant rank-ups',[1,2,3,5,7,10,14,18,23,30],[2500,5000,9000,15000,25000,40000,65000,100000,150000,250000])];
tracks.forEach(t=>{t.cos=COSLV.map(l=>'m_'+t.id+'_'+l)});
const by=Object.fromEntries(tracks.map(t=>[t.id,t])),MAP={PLINKO:'pl',MINES:'mn',FLIP:'fl','DOUBLE OR NOTHING':'dn',CHICKEN:'ck',BLACKJACK:'bj',AVIAMASTERS:'av'};
const blank=()=>({c:{},l:{}}),int=v=>Math.max(0,Math.floor(Store.num(v,0)));
function read(){const r=Store.readSigned(KEY),d=blank();let o=null;if(r.status!=='bad'&&r.raw!=null)try{o=JSON.parse(r.raw)}catch(e){}
tracks.forEach(t=>{d.c[t.id]=int(o&&o.c&&o.c[t.id]);d.l[t.id]=Math.min(LV,int(o&&o.l&&o.l[t.id]))});return d}
const write=d=>Store.writeSigned(KEY,JSON.stringify(d));
/* Counts progress for one or several objectives in one save; pays every level that became due. Level state is saved BEFORE the rewards are paid, so a crash can never pay twice. */
function addMany(o){const d=read(),due=[];let any=false;
for(const t of tracks){const n=Math.floor(+o[t.id]||0);if(n<=0)continue;any=true;d.c[t.id]+=n;while(d.l[t.id]<LV&&d.c[t.id]>=t.thr[d.l[t.id]])due.push([t,++d.l[t.id]])}
if(!any)return[];write(d);const ev=due.map(([t,lv])=>pay(t,lv));if(ev.length)notify(ev);return ev}
function pay(t,lv){const cash=t.cash[lv-1];Econ.addCoins(cash);const c=Cos.by('m_'+t.id+'_'+lv);
if(c&&Store.d){if(!Store.d.inv.includes(c.id))Store.d.inv.push(c.id);Store.save()}
try{App.bal()}catch(e){}return{t,lv,cash,cos:c||null}}
let bj=false;
function record(game,bet,gross){const id=MAP[game];if(!id)return;
if(id==='bj'){if(bj)return;bj=true;Promise.resolve().then(()=>{bj=false})}   // split hands settle in the same tick: one game
const o={[id]:1};if(id==='av'&&bet>0){const m=gross/bet+1e-9;const k=m>=7?'a7':m>=6?'a6':m>=5?'a5':m>=4?'a4':null;if(k)o[k]=1}
addMany(o)}
const CASEK={Legendary:'lg',Mythic:'my',Secret:'sc',Pirate:'pt'};
function cases(keys){const o={cases:keys.length};keys.forEach(k=>{if(CASEK[k])o[CASEK[k]]=(o[CASEK[k]]||0)+1});return addMany(o)}
function devComplete(id,lv){if(!DEVENV())return false;const t=by[id];lv=Math.floor(lv);if(!t||!(lv>=1&&lv<=LV))return false;const d=read(),need=t.thr[lv-1];addMany({[id]:Math.max(0,need-d.c[id])});return true}
function devReset(){if(!DEVENV())return false;write(blank());const d=Store.d;if(d){d.inv=d.inv.filter(id=>{const c=Cos.by(id);return!(c&&c.src==='mastery')});for(const k of['tag','grad']){const c=Cos.by(d.eq[k]);if(c&&c.src==='mastery')d.eq[k]=null}Store.save()}return true}
const total=()=>{const d=read();return tracks.reduce((a,t)=>a+d.l[t.id],0)};
/* ---------- notifications (banner queue; waits while a full-screen overlay is open) ---------- */
const Q=[];let showing=false;
const medal=sz=>`<svg viewBox="0 0 48 48" width="${sz}" height="${sz}" aria-hidden="true"><path d="M13 2h8l3 12-7 4zM35 2h-8l-3 12 7 4z" fill="#ef4444"/><circle cx="24" cy="30" r="14" fill="#ffd84d" stroke="#8a5a00" stroke-width="2.5"/><circle cx="24" cy="30" r="10" fill="none" stroke="#fff6c0" stroke-width="1.5"/><path d="M24 22l2.6 5.2 5.8.8-4.2 4 1 5.7-5.2-2.7-5.2 2.7 1-5.7-4.2-4 5.8-.8z" fill="#8a5a00"/></svg>`;
function notify(ev){if(typeof document==='undefined')return;Q.push(...ev);pump()}
function pump(){if(showing||!Q.length)return;if(document.querySelector('.pt-ov,.pk-ov,.crov')){setTimeout(pump,900);return}
showing=true;const e=Q.shift(),b=document.createElement('div');b.className='msb';b.setAttribute('role','status');
b.innerHTML=`<span class="msm">${medal(46)}</span><div><b>MASTERY LEVEL ${e.lv} COMPLETE</b><span>${e.t.name}</span><em>+$${Econ.fi(e.cash)}${e.cos?' &nbsp;'+Cos.html(e.cos):''}</em></div>`;
document.body.appendChild(b);requestAnimationFrame(()=>b.classList.add('in'));try{FX.confetti(b,28)}catch(x){}
setTimeout(()=>{b.classList.remove('in');setTimeout(()=>{b.remove();showing=false;pump()},450)},3400)}
const api={tracks,by,LV,COSLV,read,addMany,add:(id,n=1)=>addMany({[id]:n}),cases,record,total,devComplete,devReset,medal,KEY};
/* every settled round feeds Mastery (wrapped once; Cases count themselves per row) */
{const s=Econ.settle;Econ.settle=function(g,b,gross){const pay=s.call(this,g,b,gross);try{api.record(g,b,gross)}catch(e){console.error(e)}return pay}}
/* limited cosmetics can never be sold */
{const s=Inv.sell;Inv.sell=id=>{const c=Cos.by(id);if(c&&c.lim)return{ok:false,msg:'Limited cosmetics cannot be sold'};return s.call(Inv,id)}}
return api})();
if(typeof Pages!=='undefined'&&typeof document!=='undefined'){
const st=document.createElement('style');st.id='stk-ms';st.textContent=`
.msb{position:fixed;left:50%;top:84px;z-index:120;display:flex;align-items:center;gap:14px;padding:10px 20px 10px 14px;background:#0a0a0a;border:2px solid #ffd84d;border-radius:20px;box-shadow:0 10px 36px #000c,0 0 28px #ffd84d55;transform:translate(-50%,-30px);opacity:0;transition:transform .45s cubic-bezier(.2,1.2,.3,1),opacity .3s;max-width:92vw}
.msb.in{transform:translate(-50%,0);opacity:1}.msb div{display:grid;gap:1px;text-align:left}.msb b{font:700 15px var(--serif);color:#ffd84d;letter-spacing:.5px}.msb span{font-size:13px;color:#e5e5e5}.msb em{font-style:normal;font-weight:800;font-size:14px}
.msm{display:grid;place-items:center;animation:msSpin 1.1s cubic-bezier(.3,1.4,.5,1)}@keyframes msSpin{from{transform:rotateY(540deg) scale(.2)}}
.msg{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:12px;margin-bottom:16px}
.msc{display:grid;gap:6px;text-align:left;padding:12px 14px;border:3px solid var(--line);border-radius:22px;background:var(--panel);color:#fff;font:inherit;cursor:pointer;transition:background .25s,color .25s,transform .25s}
.msc:hover{transform:translateY(-2px);background:#ffffff1f}.msc.on{background:#fff;color:#000}.msc .msn{font-weight:800;font-size:14px;line-height:1.2}.msc .msl{font:700 12px Montserrat,sans-serif}.msc small{font-size:11px;opacity:.85}.msc .pb{margin:0}
.msc.max .msl{color:#ffd84d}.msc.on.max .msl{color:#8a5a00}.msc.on .pb{background:#d6d6d6;border-color:#000}.msc.on .pb span{color:#000}
.mst{display:grid;gap:6px}.msr{display:grid;grid-template-columns:70px minmax(0,1.2fr) 110px minmax(0,1.6fr) 34px;gap:10px;align-items:center;padding:8px 12px;border:2px solid #ffffff55;border-radius:16px;background:#050505;transition:border-color .25s,background .25s}
.msr.cur{border-color:#fff;background:#141414}.msr.done{opacity:.62}.msr .msv{font:700 13px Montserrat,sans-serif;color:#ffd84d}.msr .msq{font-size:14px}.msr .msc2{font-weight:800}
.msr .mscos{display:grid;gap:2px;min-width:0}.msr .mscos small{color:#a3a3a3;font-size:11px;line-height:1.3}.msr .mscos .pv{min-height:30px;display:flex;align-items:center}
.msr .msk{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-weight:900;border:2px solid #ffffff66;color:#000;background:transparent}.msr.done .msk{background:#8fe88f;border-color:#8fe88f}
.msh{display:flex;align-items:center;gap:10px}.msh svg{flex:none}
@media(max-width:800px){.msr{grid-template-columns:54px minmax(0,1fr) 34px}.msr .msc2,.msr .mscos{grid-column:2/4}}
@media(prefers-reduced-motion:reduce){.msb,.msm{animation:none;transition:none}}`;document.head.appendChild(st);
Pages.mastery={mount(app){let sel=Mastery.tracks[0].id;
const fmt=n=>(+n).toLocaleString('en-US'),M=Mastery,cosOf=(t,l)=>{const i=M.COSLV.indexOf(l);return i<0?null:Cos.by(t.cos[i])};
const render=()=>{const D=M.read(),T=M.by[sel];
const card=t=>{const l=D.l[t.id],c=D.c[t.id],mx=l>=M.LV,nx=t.thr[l],nc=mx?null:M.COSLV.find(v=>v>l);
return `<button class="msc${t.id===sel?' on':''}${mx?' max':''}" data-t="${t.id}" aria-pressed="${t.id===sel}"><span class="msn">${t.name}</span><span class="msl">${mx?'MASTERED':'LEVEL '+l+' / '+M.LV}</span>${mx?'':Dash.bar(`${fmt(c)} / ${fmt(nx)}`,Math.min(1,c/nx))}<small>${mx?fmt(c)+' '+t.unit:'Next: $'+Econ.fi(t.cash[l])+(cosOf(t,l+1)?' + limited cosmetic':'')}</small></button>`};
const row=l=>{const c=D.c[T.id],l0=D.l[T.id],done=l<=l0,cur=l===l0+1,cs=cosOf(T,l),pg=cur?Math.min(1,c/T.thr[l-1]):0;
return `<div class="msr${done?' done':''}${cur?' cur':''}"><span class="msv">LEVEL ${l}</span><span class="msq">${fmt(T.thr[l-1])} ${T.unit}${cur?`<br><small>${fmt(Math.min(c,T.thr[l-1]))} / ${fmt(T.thr[l-1])} (${Math.floor(pg*100)}%)</small>`:''}</span><span class="msc2">$${Econ.fi(T.cash[l-1])}</span>
<span class="mscos">${cs?`<span class="pv">${prevHtml(cs)}</span><small>${cs.name} &bull; ${rarTxt(cs)} &bull; unsellable<br>${cs.desc.replace(/^Mastery reward: [^.]*\. Limited and unsellable\. /,'')}</small>`:'<small>Cash reward only</small>'}</span><span class="msk" aria-label="${done?'Completed':'Not completed'}">${done?'&#10003;':''}</span></div>`};
app.innerHTML=`<h2 class="sec">🥇 Mastery ›</h2>${gchip()}<div class="dp qp2"><p class="qhint">Every objective levels up on its own. Rewards are paid automatically when a level is reached. Total levels: <b>${M.total()}</b> / ${M.tracks.length*M.LV}</p>
<div class="msg">${M.tracks.map(card).join('')}</div><h3 class="lined msh">${M.medal(26)} ${T.name}</h3><div class="mst">${Array.from({length:M.LV},(_,i)=>row(i+1)).join('')}</div></div>`;
app.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{sel=b.dataset.t;render()})};
render()}};
/* inventory: limited cosmetics show an unsellable badge instead of a SELL button */
const im=Pages.inventory&&Pages.inventory.mount;
if(im)Pages.inventory.mount=function(app){const cl=im.call(this,app),fix=()=>app.querySelectorAll('[data-sell]').forEach(b=>{const c=Cos.by(b.dataset.sell);if(c&&c.lim){const s=document.createElement('button');s.className='sellb';s.disabled=true;s.style.opacity='.6';s.textContent='LIMITED - UNSELLABLE';b.replaceWith(s)}}),mo=new MutationObserver(fix);mo.observe(app,{childList:true,subtree:true});fix();return()=>{mo.disconnect();if(cl)cl()}};
}
