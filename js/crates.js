/* v2.3 Gem-Shop crates. Replaces the old per-item shop page with two crates (TAGS / GRADIENTS) that cost CFG.CRATE.COST Gems per roll.
   Odds: every cosmetic has its OWN chance (CFG.CRATE). The roll, the odds lists on the page and the "View chances" menu all read the same Crate.table(),
   so displayed odds always equal rolled odds. The configured per-item weights currently sum to exactly 100; if a future edit makes them differ,
   the table is NORMALISED (p = weight / total x 100) and the page shows the normalised values.
   Gems are deducted and the item is granted in ONE save before any animation plays; the roulette is presentation only. */
CFG.CRATE={COST:3,
tag:{common:{each:9.7},rare:{each:6},epic:{each:2.5},legendary:{pot:6.5}},      // v2.5b: legendary tags share a 6.5% pot equally (was 5%; 12 tags -> 0.5417% each), commons trimmed to keep the total at 100
grad:{rare:{each:12},epic:{each:6},legendary:{each:1.25}}};
const Crate={
kinds:{tags:{type:'tag',key:'tag',title:'[TAGS] CRATE',noun:'TAG',label:'TAGS'},grads:{type:'grad',key:'grad',title:'GRADIENTS CRATE',noun:'GRADIENT',label:'GRADIENT'}},
RARS:['common','rare','epic','legendary'],
pend:null,     // duplicate awaiting a sell decision (in memory only; offer ends when the result window closes)
table(kind){const k=Crate.kinds[kind],spec=CFG.CRATE[k.key],rows=[];
for(const rar of Crate.RARS){const s=spec[rar];if(!s)continue;const items=COS.filter(c=>c.type===k.type&&c.rar===rar);if(!items.length)continue;
const each=s.each!=null?s.each:s.pot/items.length;items.forEach(c=>rows.push({c,w:each}))}
const tot=rows.reduce((a,r)=>a+r.w,0);rows.forEach(r=>r.p=r.w/tot*100);return rows},
totals(kind){const o={common:0,rare:0,epic:0,legendary:0};Crate.table(kind).forEach(r=>o[r.c.rar]+=r.p);return o},
pick(kind,rnd=Econ.rnd){const t=Crate.table(kind);let x=rnd()*100,r=t[t.length-1];for(const row of t){if(x<row.p){r=row;break}x-=row.p}return r.c},
/* Atomic: validate Gems -> roll -> deduct -> grant (or flag duplicate) -> one save. */
open(kind,rnd){Store.load();const d=Store.d,cost=CFG.CRATE.COST;if(!Crate.kinds[kind])return{ok:false,msg:'Unknown crate'};if(d.gems<cost)return{ok:false,msg:'Not enough Gems'};
const c=Crate.pick(kind,rnd),dup=Inv.owned(c.id);d.gems-=cost;if(!dup)d.inv.push(c.id);Store.sync();Store.save();Crate.pend=dup?c.id:null;return{ok:true,c,dup,cost}},
/* Duplicate resale uses the existing Gem->01O0coin rate (Gem value x CFG.GEM.TO_COIN). Not profit, not rank money, not quest progress. Once per roll. */
sellDup(id){if(!id||Crate.pend!==id)return{ok:false,msg:'Nothing to sell'};const c=Cos.by(id);Crate.pend=null;const amt=Cos.gems(c)*CFG.GEM.TO_COIN;Econ.addCoins(amt);return{ok:true,amt,c}},
/* Roulette strip contents (presentation only): winner fixed at winIdx, filler is a mix of real-odds picks and uniform picks so rarer items show up. */
strip(kind,n,winIdx,winner,rnd=Econ.rnd){const t=Crate.table(kind),out=[];for(let i=0;i<n;i++)out.push(i===winIdx?winner:rnd()<.45?t[Math.floor(rnd()*t.length)].c:Crate.pick(kind,rnd));return out}};
(()=>{if(typeof Pages==='undefined'||typeof document==='undefined')return;
const st=document.createElement('style');st.id='stk-crate';st.textContent=`
.mo{opacity:0;transition:opacity .22s}.mo.in{opacity:1}.mo .mb{transform:translateY(16px) scale(.96);transition:transform .26s cubic-bezier(.2,.8,.2,1)}.mo.in .mb{transform:none}
.crates{display:grid;grid-template-columns:1fr 3px 1fr;gap:18px}.crdiv{background:#fff;border-radius:2px}
@media(max-width:900px){.crates{grid-template-columns:1fr}.crdiv{display:none}}
.crt{position:relative;display:grid;gap:10px;padding:6px 10px 8px;isolation:isolate;align-content:start;min-height:300px}
.crh{font:700 clamp(24px,3vw,38px)/1.1 var(--serif);text-align:center;margin:0}
.crbg{position:absolute;inset:44px 0 70px;z-index:-1;display:flex;align-items:center;justify-content:center;opacity:.5;pointer-events:none}
.crbg svg{width:min(80%,340px);transition:transform .45s cubic-bezier(.2,.8,.2,1)}.crt:hover .crbg svg{transform:scale(1.07) rotate(-1.5deg)}.crt:hover .crbg .lid{transform:translateY(-6px) rotate(-3deg)}
.chest .lid{transform-box:view-box;transform-origin:20px 70px;transition:transform .9s cubic-bezier(.3,1.35,.5,1)}.chest.open .lid{transform:translateY(-26px) rotate(-26deg)}
.chest .glow{opacity:0;transition:opacity .6s .2s}.chest.open .glow{opacity:.95}
.crl{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;font-size:clamp(17px,1.9vw,24px)}
.crp{list-style:none;margin:0;padding:0;line-height:1.35;font-family:var(--serif)}.crp b{color:#fff;font-weight:400}.crn{font-size:11px;color:var(--mute);margin-top:4px;font-family:Montserrat,sans-serif}
.crv{text-align:center;max-width:210px;font:700 14px var(--serif)}.crv p{margin:0 0 6px}
.crvb{font:900 15px Montserrat,sans-serif;padding:6px 18px;width:100%;cursor:pointer;transition:transform .25s,box-shadow .25s,filter .25s}.crvb:hover{transform:translateY(-2px) scale(1.04);box-shadow:0 6px 20px #be0bb188;filter:brightness(1.15)}.crvb:active{transform:scale(.98)}
.crroll{justify-self:center;width:min(78%,420px);margin-top:auto;padding:8px 10px;border:2px solid #fff;border-radius:999px;background:linear-gradient(90deg,#1f7a4f,#8ae6a0 60%,#d6f77f);color:#fff;font:900 clamp(22px,2.4vw,30px)/1.05 var(--serif);text-shadow:0 2px 4px #0008;cursor:pointer;transition:transform .25s,box-shadow .25s,filter .25s}
.crroll small{display:block;font:800 15px Montserrat,sans-serif}.crroll:hover{transform:translateY(-3px) scale(1.03);box-shadow:0 8px 26px #8ae6a099;filter:brightness(1.1)}.crroll:active{transform:scale(.98)}
.crov{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.72);backdrop-filter:blur(12px) saturate(.8);-webkit-backdrop-filter:blur(12px) saturate(.8);animation:crIn .35s ease both;overflow:auto}@keyframes crIn{from{opacity:0}}
.crst{position:relative;width:min(960px,96vw);display:grid;gap:14px;justify-items:center;text-align:center;padding:16px}
.crch{width:min(300px,70vw);transition:opacity .45s,transform .45s}.crch.out{opacity:0;transform:scale(.7) translateY(-30px)}
.crrl{width:100%}.crvp{position:relative;overflow:hidden;height:210px;border-radius:14px;background:#050505;border:2px solid #fff}
.crsr{display:flex;gap:10px;position:absolute;left:0;top:14px;will-change:transform}
.crtile{flex:0 0 170px;height:178px;border:3px solid var(--b);border-radius:12px;background:linear-gradient(#1c1c1c,#0d0d0d);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:8px;box-shadow:0 8px 14px #000a;transition:transform .3s,box-shadow .3s}
.crtile .crpv{font-size:15px;font-weight:900;white-space:nowrap}.crtile .cos{font-size:14px}.crnm{font-size:12px;color:#d4d4d4;font-weight:700}.crrr{font-size:10px;font-weight:900;letter-spacing:1px}
.crtile.win{transform:scale(1.06);box-shadow:0 0 28px var(--b),0 0 60px var(--b)}
.crsel{position:absolute;left:50%;top:6px;bottom:6px;width:3px;margin-left:-1.5px;background:#fff;box-shadow:0 0 12px #fff;pointer-events:none;z-index:2}
.crst{padding-bottom:84px}.crsk{position:fixed;left:0;right:0;bottom:22px;margin:0 auto;width:max-content;min-width:120px;z-index:3}.crsk:disabled{cursor:default}.crres.lock{pointer-events:none}
.crtx{margin:0;font:700 20px var(--serif)}.crbig{font:700 clamp(24px,3.4vw,38px)/1.15 var(--serif);margin:0}.crpvb{font-size:34px;font-weight:900;margin:6px 0}.crdup{margin:0;color:#fbbf24;font-weight:700}
.crres{display:grid;gap:10px;justify-items:center}.crres .mbtns{flex-wrap:wrap}
.chnote{font-size:12px;color:var(--mute);margin:0}.mb.wide .chl{overflow:auto;min-height:0;flex:1;text-align:left;padding-right:4px}.chg h4{margin:10px 0 4px;letter-spacing:1px}.chg h4 small{color:var(--mute);font-weight:400;letter-spacing:0}
.chr{display:flex;align-items:center;gap:10px;padding:4px 8px;border-radius:10px;transition:background .2s,transform .2s}.chr:hover{background:#ffffff1a;transform:translateX(4px)}.chp{flex:1;min-width:0}.chp .cos{transition:transform .25s}.chr:hover .chp .cos{transform:scale(1.1)}.chn{flex:1;color:#d4d4d4;font-size:13px}.chr b{min-width:70px;text-align:right}
`;document.head.appendChild(st);
const fmtP=p=>(+p.toFixed(3))+'%',prevFor=c=>c.type==='grad'?Cos.user(esc(Store.d.user||'username'),c.id):Cos.html(c);
const chest=label=>`<svg class="chest" viewBox="0 0 200 150" aria-hidden="true"><g class="body"><path d="M20 70H180V135a6 6 0 0 1-6 6H26a6 6 0 0 1-6-6Z" fill="#111" stroke="#bbb" stroke-width="5"/><path d="M20 98H180" stroke="#bbb" stroke-width="4"/><ellipse class="glow" cx="100" cy="68" rx="72" ry="9" fill="#fff"/><rect x="86" y="64" width="28" height="30" rx="5" fill="#222" stroke="#bbb" stroke-width="4"/><circle cx="100" cy="78" r="4" fill="#bbb"/></g><g class="lid"><path d="M20 70V50a35 35 0 0 1 35-35H145a35 35 0 0 1 35 35V70Z" fill="#161616" stroke="#bbb" stroke-width="5"/><path d="M20 54H180" stroke="#bbb" stroke-width="3"/><text x="100" y="42" text-anchor="middle" font-size="17" font-weight="900" font-style="italic" fill="#bbb">${label}</text></g></svg>`;
function chances(kind){const k=Crate.kinds[kind],t=Crate.table(kind),tot=Crate.totals(kind);
const rows=Crate.RARS.map(r=>{const l=t.filter(x=>x.c.rar===r);return l.length?`<div class="chg"><h4 style="color:${CFG.RAR[r].color}">${CFG.RAR[r].n.toUpperCase()} <small>${fmtP(tot[r])} in total</small></h4>${l.map(x=>`<div class="chr"><span class="chp">${prevFor(x.c)}</span><span class="chn">${x.c.name}</span><b>${fmtP(x.p)}</b></div>`).join('')}</div>`:''}).join('');
const m=Modal.open(`<div class="chead"><span class="cht">${k.noun} CRATE CHANCES</span><button class="xbtn" id="chx" aria-label="Close chances">X</button></div><p class="chnote">Chance of rolling each individual cosmetic. One roll costs ${CFG.CRATE.COST} Gems.</p><div class="chl">${rows}</div>`,{label:'Crate chances',wide:true,esc:()=>m.close()});$('chx').onclick=()=>m.close()}
/* Crate opening: chest animation -> case-style roulette over a blurred/dimmed page -> result. Outcome is already saved when this runs. */
function roll(kind,done){if(App.human&&!App.human('CRATE'))return;const k=Crate.kinds[kind],r=Crate.open(kind);if(!r.ok){App.toast(r.msg);return}App.bal();
const c=r.c,TWd=170,STEP=180,N=56,WI=44,DUR=6000,tms=[],T=(f,ms)=>tms.push(setTimeout(f,ms)),items=Crate.strip(kind,N,WI,c);let phase=0;
const ov=document.createElement('div');ov.className='crov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Opening crate');
ov.innerHTML=`<div class="crst"><div class="crch">${chest(k.label)}</div><div class="crrl" hidden><div class="crvp"><div class="crsr">${items.map(x=>`<div class="crtile" style="--b:${CFG.RAR[x.rar].color}"><div class="crpv">${prevFor(x)}</div><div class="crnm">${x.name}</div><div class="crrr" style="color:${CFG.RAR[x.rar].color}">${CFG.RAR[x.rar].n.toUpperCase()}</div></div>`).join('')}</div><div class="crsel"></div></div></div><p class="crtx" aria-live="polite">Opening ${k.title.toLowerCase()}…</p><div class="crres" hidden></div></div><button class="btn dim crsk" id="crsk">Skip</button>`;
document.body.appendChild(ov);$('app').setAttribute('aria-hidden','true');
const q=s=>ov.querySelector(s),ch=q('.crch'),rl=q('.crrl'),sr=q('.crsr'),vp=q('.crvp'),tx=q('.crtx'),sk=q('#crsk'),res=q('.crres'),fin=()=>vp.clientWidth/2-(WI*STEP+TWd/2),jit=Math.round((Math.random()-.5)*TWd*.7);
const kd=e=>{if(e.key==='Escape'){e.preventDefault();phase<3?skip():close()}};document.addEventListener('keydown',kd);sk.focus();
function close(){tms.forEach(clearTimeout);document.removeEventListener('keydown',kd);ov.remove();$('app').removeAttribute('aria-hidden');Crate.pend=null;if(done)done()}
function result(){phase=3;rl.hidden=true;sk.style.visibility='hidden';sk.disabled=true;tx.hidden=true;res.hidden=false;res.classList.add('lock');setTimeout(()=>res.classList.remove('lock'),700);const owned=Store.d.eq[c.type]===c.id;
res.innerHTML=`<p class="crbig">You rolled: <b>${c.name}</b></p><div>${rarTxt(c)}</div><div class="crpvb">${prevFor(c)}</div>${r.dup?`<p class="crdup">Duplicate: you already own this. Sell it now for $${Econ.fi(Cos.gems(c)*CFG.GEM.TO_COIN)} 01O0coin (offer ends when you close this window).</p><button class="btn alt" id="crsd">Sell duplicate</button>`:''}<div class="mbtns"><button class="btn" id="creq" ${owned?'disabled':''}>${owned?'Equipped':'Equip'}</button><button class="btn dim" id="crinv">View in Inventory</button><button class="btn dim" id="crcl">Close</button></div>`;
FX.confetti(q('.crst'),70);
$('creq').onclick=e=>{const b=e.currentTarget;if(Inv.apply(c.type==='tag'?c.id:Store.d.eq.tag,c.type==='grad'?c.id:Store.d.eq.grad)){App.bal();App.toast('Cosmetic equipped and saved');b.textContent='Equipped';b.disabled=true}else App.toast('You do not own that cosmetic')};
const sd=$('crsd');if(sd)sd.onclick=()=>{const s=Crate.sellDup(c.id);if(!s.ok){App.toast(s.msg);return}App.bal();App.toast(`Sold duplicate: +$${Econ.fi(s.amt)} 01O0coin`);sd.disabled=true;sd.textContent='Sold'};
$('crinv').onclick=()=>{close();location.hash='#inventory'};$('crcl').onclick=close;$('creq').disabled?$('crcl').focus():$('creq').focus()}
function land(){if(phase>=2)return;phase=2;tms.forEach(clearTimeout);sr.style.transition='none';sr.style.transform=`translate3d(${fin()+jit}px,0,0)`;sr.children[WI].classList.add('win');tx.textContent=c.name;T(result,900)}
function skip(){if(phase>=2)return;if(phase===0){phase=1;ch.hidden=true;rl.hidden=false;sr.style.transform=`translate3d(${fin()+jit}px,0,0)`}land()}
sk.onclick=skip;
T(()=>ch.firstElementChild.classList.add('open'),150);T(()=>ch.classList.add('out'),1400);
T(()=>{if(phase)return;phase=1;ch.hidden=true;rl.hidden=false;tx.textContent='Rolling…';sr.style.transition='none';sr.style.transform=`translate3d(${vp.clientWidth/2-TWd/2}px,0,0)`;void sr.offsetWidth;
sr.style.transition=`transform ${DUR}ms cubic-bezier(.08,.55,.12,1)`;sr.style.transform=`translate3d(${fin()+jit}px,0,0)`;T(land,DUR+80)},1900)}
Pages.shop={mount(app){
const card=kind=>{const k=Crate.kinds[kind],tot=Crate.totals(kind);return `<section class="crt" aria-label="${k.title}"><h3 class="crh">${k.title}</h3><div class="crbg">${chest(k.label)}</div><div class="crl"><div><ul class="crp">${Crate.RARS.map(r=>`<li style="color:${CFG.RAR[r].color}">${CFG.RAR[r].n.toUpperCase()} <b>${fmtP(tot[r])}</b></li>`).join('')}</ul><div class="crn">Rarity totals. Each cosmetic has its own chance.</div></div><div class="crv"><p>VIEW CHANCES FOR EACH ${k.noun}:</p><button class="prevbtn crvb" data-ch="${kind}">VIEW CHANCES</button></div></div><button class="crroll" data-roll="${kind}">ROLL<small>${CFG.CRATE.COST} Gems</small></button></section>`};
const render=()=>{app.innerHTML=`<h2 class="sec">🛒 Gem-Shop ›</h2>${gchip()}<div class="dp shopp crates">${card('tags')}<div class="crdiv"></div>${card('grads')}</div>
<div class="shbot"><div class="dp conv"><p>Converting Gems into 01O0Coin:</p><div class="cvrow"><button class="mini" id="cm" aria-label="Fewer gems">−</button><input id="cn" type="number" min="1" step="1" value="1" aria-label="Gems to convert"><button class="mini" id="cp" aria-label="More gems">+</button></div><p class="cvt"><b id="cg">1 GEM</b> ${gemIcon(20)}</p><p>is equal to:</p><p class="cvt"><b id="cc">$${CFG.GEM.TO_COIN}</b></p><button class="sellg" id="sg">SELL GEMS (NO REFUND)</button></div>
<div class="dp rot"><p>Preview all tags and gradients:</p><button class="prevbtn" id="pv">PREVIEW</button></div></div>`;
document.querySelectorAll('[data-roll]').forEach(b=>b.onclick=()=>roll(b.dataset.roll,render));document.querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>chances(b.dataset.ch));$('pv').onclick=Catalog.open;
const cn=$('cn'),upd=()=>{let n=Math.max(1,Math.floor(+cn.value||1));cn.value=n;$('cg').textContent=n+(n>1?' GEMS':' GEM');$('cc').textContent='$'+Econ.fi(n*CFG.GEM.TO_COIN)};cn.oninput=upd;$('cm').onclick=()=>{cn.value=Math.max(1,(+cn.value||1)-1);upd()};$('cp').onclick=()=>{cn.value=(+cn.value||1)+1;upd()};
$('sg').onclick=()=>{const n=Math.max(1,Math.floor(+cn.value||1)),have=Store.d.gems;
const m=Modal.open(`<p class="rdisc">Are you sure?</p><div class="dbx">Spend <b>${n}</b> ${gemIcon(18)} Gem${n>1?'s':''} to receive <b>$${Econ.fi(n*CFG.GEM.TO_COIN)}</b> 01O0coin.${n>have?'<br><span class="red">Not enough Gems.</span>':''}<br><small>No refund. Conversions do not count as profit or rank progress.</small></div><div class="mbtns"><button class="btn" id="cyes" ${n>have?'disabled':''}>Convert</button><button class="btn dim" id="cno">Cancel</button></div>`,{label:'Confirm conversion',esc:()=>m.close()});
let used=false;$('cno').onclick=()=>m.close();$('cyes').onclick=()=>{if(used)return;used=true;const r=Gems.convert(n);m.close();if(!r.ok){App.toast(r.msg);return}App.bal();App.toast(`Converted ${r.gems} Gem${r.gems>1?'s':''} into $${Econ.fi(r.coins)} 01O0coin`);render()}};
Shell.tick()};
render();return()=>{Pages._tick=null}}};
})();
