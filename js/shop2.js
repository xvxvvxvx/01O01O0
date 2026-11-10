/* v2.8 Gem-Shop redesign. Wraps Pages.shop.mount (crates.js) and decorates the page it renders, so crate logic, prices (CFG.CRATE.COST), odds (Crate.table) and
   the inventory / duplicate handling are untouched; the original roll / chances / convert / preview buttons keep their own handlers.
   Every crate now answers: what do I get, what is special, what does it cost, can I afford it (and how many rolls), what do I already own.
   Everything shown is read from Crate.table / Crate.totals / CFG, so the displayed numbers are the rolled numbers. */
const Shop2=(()=>{
const KIND={tags:{badge:'PLAYER TAG',get:'1 random player tag, shown in [BRACKETS] beside your name.',cls:'sx-tag',noun:'tags'},
grads:{badge:'NAME GRADIENT',get:'1 random animated colour gradient for your username.',cls:'sx-grad',noun:'gradients'}};
const pct=p=>(+p.toFixed(2))+'%';
/* pure data model (also used by the tests) */
function model(kind){const K=KIND[kind],d=Store.d,cost=CFG.CRATE.COST,tb=Crate.table(kind),tot=Crate.totals(kind),owned=new Set(d.inv),own=tb.filter(r=>owned.has(r.c.id)).length,
tiers=Crate.RARS.filter(r=>tb.some(x=>x.c.rar===r)),vals=tiers.map(r=>CFG.RAR[r].gems*CFG.GEM.TO_COIN);
return{kind,K,cost,gems:d.gems,rolls:Math.floor(d.gems/cost),afford:d.gems>=cost,missing:Math.max(0,cost-d.gems),own,all:tb.length,fresh:tb.length-own,
legend:tot.legendary,legendOne:tot.legendary?Math.round(100/tot.legendary):0,
top:tb.filter(r=>r.c.rar==='legendary').sort((a,b)=>a.p-b.p).slice(0,3).map(r=>r.c),dupMin:Math.min(...vals),dupMax:Math.max(...vals)}}
const api={model,KIND,pct};
if(typeof Pages==='undefined'||typeof document==='undefined'||!Pages.shop)return api;
const RM=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}};
const prev=c=>c.type==='grad'?Cos.user(esc(Store.d.user||'username'),c.id):Cos.html(c);
const plural=(n,w)=>n+' '+w+(n===1?'':'s');
const bar=t=>{const rs=Crate.RARS.filter(r=>t[r]>0);return `<div class="sx-bar" role="img" aria-label="Rarity odds: ${rs.map(r=>CFG.RAR[r].n+' '+pct(t[r])).join(', ')}">${rs.map(r=>`<i style="flex:${t[r]};background:${CFG.RAR[r].color}"></i>`).join('')}</div><div class="sx-bl">${rs.map(r=>`<span><i style="background:${CFG.RAR[r].color}"></i>${CFG.RAR[r].n} ${pct(t[r])}</span>`).join('')}</div>`};
function paint(app){const root=app.querySelector('.crates');if(!root)return;
const g=Store.d.gems,cost=CFG.CRATE.COST,rl=Math.floor(g/cost);root.dataset.g=g;
const r=app.querySelector('.sx-rolls');if(r)r.textContent=rl?`= ${plural(rl,'crate roll')} available`:`Next roll in ${cost-g} more Gem${cost-g>1?'s':''}`;
root.querySelectorAll('.crt').forEach(sec=>{const rb=sec.querySelector('[data-roll]');if(!rb)return;const ok=g>=cost;
const a=sec.querySelector('.sx-aff');if(a){a.className='sx-aff '+(ok?'ok':'no');a.textContent=ok?`✔ You can afford ${plural(rl,'roll')}`:`✖ Need ${plural(cost-g,'more Gem')} (you have ${g})`}
rb.classList.toggle('poor',!ok);rb.setAttribute('aria-disabled',String(!ok));
rb.innerHTML=`ROLL <span class="sx-pr">${gemIcon(20)} ${cost}</span><small>${ok?'Tap to open':'Not enough Gems yet'}</small>`})}
function enhance(app){const root=app.querySelector('.crates');if(!root||root.dataset.sx)return;root.dataset.sx='1';
const hd=document.createElement('div');hd.className='sx-head';
hd.innerHTML=`<div class="sx-bal">${gemIcon(30)}<b class="gembal">${Store.d.gems}</b><span>Your Gems</span></div><div class="sx-mid"><b class="sx-rolls"></b><small>Earn Gems from ranking up, quests, Mastery and the Daily Wheel.</small></div><nav class="sx-nav" aria-label="Shop sections"><button type="button" data-go=".crates">Crates</button><button type="button" data-go=".conv">Convert Gems</button><button type="button" data-go="#pv">Preview all</button></nav>`;
root.parentNode.insertBefore(hd,root);
hd.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const t=app.querySelector(b.dataset.go);if(t)t.scrollIntoView({behavior:RM()?'auto':'smooth',block:'center'})});
root.querySelectorAll('.crt').forEach(sec=>{const rb=sec.querySelector('[data-roll]');if(!rb)return;const m=model(rb.dataset.roll),K=m.K,tt=Crate.totals(rb.dataset.roll);sec.classList.add(K.cls);
const v=document.createElement('div');v.className='sx-val';
v.innerHTML=`<span class="sx-badge">${K.badge} CRATE</span><p class="sx-get"><b>You get:</b> ${K.get}</p>${bar(tt)}
<div class="sx-prev" aria-label="Rarest prizes in this crate"><small>Rarest prizes</small>${m.top.map(c=>`<span class="sx-pi">${prev(c)}</span>`).join('')}</div>
<ul class="sx-facts"><li>Legendary: <b style="color:${CFG.RAR.legendary.color}">${pct(m.legend)} per roll</b>${m.legendOne?` (about 1 in ${m.legendOne})`:''}</li><li>Your collection: <b>${m.own}/${m.all}</b> ${K.noun} owned${m.fresh?` &bull; ${m.fresh} still to find`:' &bull; complete!'}</li><li>Duplicates sell for <b>$${Econ.fi(m.dupMin)}${m.dupMax>m.dupMin?' to $'+Econ.fi(m.dupMax):''}</b> coin</li><li>Every roll costs <b>${m.cost}</b> ${gemIcon(14)} Gems</li></ul><div class="sx-aff" role="status"></div>`;
const h=sec.querySelector('.crh');if(h)h.insertAdjacentElement('afterend',v)});
paint(app)}
const base=Pages.shop.mount;
Pages.shop.mount=function(app){const c=base.call(this,app);enhance(app);const mo=new MutationObserver(()=>enhance(app));mo.observe(app,{childList:true});
let lg=Store.d.gems;Pages._tick=()=>{if(Store.d.gems!==lg){lg=Store.d.gems;paint(app)}};
return()=>{mo.disconnect();if(Pages._tick)Pages._tick=null;if(c)c()}};
return api})();
