/* v2.8 feedback layer. Loaded after pirate.js (everything it wraps already exists). Pure additions, no gameplay or odds are touched.
   - Injects css/update28.css (so game.html needs no edit; the service worker pre-caches it).
   - Every wager that is refused (not enough coin, bad amount, anti-macro) shakes the bet row; running out of coin explains how to reset (at most once per 30 s).
   - Every settled round flashes the game stage green / red / neutral; balance and Gem pills flash up / down and Gem gains float up.
   - Transaction buttons (buy, claim, sell, convert, crate roll, rank-up, spin) ignore a second click within 700 ms (per button), so a double click can never repeat a purchase.
   - A crate roll without enough Gems is stopped BEFORE it starts and says exactly how many Gems are missing.
   - The disabled Rank-Up button says what is still missing.
   Reduced motion: css/style.css already zeroes animation durations; floaters are skipped in JS too. */
const Feedback=(()=>{
const RM=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}};
const HK='gold_hint_',gp=k=>{try{return localStorage.getItem(k)}catch(e){return null}},sp=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const pulse=(el,cls,ms=700)=>{if(!el||!el.classList)return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),ms)};
const need=s=>{const p=[];if(s.coin<s.req.c)p.push('$'+Econ.fi(Econ.r2(s.req.c-s.coin))+' more earned');if(s.rounds<s.req.r)p.push((s.req.r-s.rounds)+' more rounds');return p.length?'Still needed: '+p.join(' and ')+'.':''};
const tipKey=g=>String(g).toLowerCase().replace(/\s+/g,'');
function float(el,text){if(RM()||!el||!el.getBoundingClientRect)return;const r=el.getBoundingClientRect(),f=document.createElement('span');f.className='fb-float';f.textContent=text;f.style.left=(r.left+r.width/2)+'px';f.style.top=(r.bottom+2)+'px';document.body.appendChild(f);setTimeout(()=>f.remove(),1200)}
const api={need,pulse,tipKey,HK};
if(typeof document==='undefined'||typeof App==='undefined')return api;
if(!document.getElementById('stk-28css')){const l=document.createElement('link');l.id='stk-28css';l.rel='stylesheet';l.href='css/update28.css';document.head.appendChild(l)}
/* ---- wagers: refused -> shake; accepted -> clear first-time hints ---- */
let lowT=0;const ob=App.bet;
App.bet=function(el,game,keep){const r=ob.call(this,el,game,keep),d=Store.d;
if(!r){if(d&&d.user){pulse(el&&el.querySelector&&el.querySelector('.betrow'),'fb-shake',450);
if(d.balance<Econ.minBet(game)-1e-9&&Date.now()-lowT>30000){lowT=Date.now();App.toast('Out of 01O0coin! Reset your balance on the Home page to keep playing.')}}}
else if(el&&el.querySelectorAll){el.querySelectorAll('.fb-hint').forEach(x=>x.remove());el.querySelectorAll('.fb-glow').forEach(x=>x.classList.remove('fb-glow'));sp(HK+tipKey(game),'1')}
return r};
/* ---- rounds: stage flash ---- */
const os=App.settle;
App.settle=function(g,b,gross){const pay=os.call(this,g,b,gross);try{const st=document.querySelector('#gm .stage'),net=pay-b;if(st)pulse(st,net>.004?'fb-win':net<-.004?'fb-loss':'fb-even',800)}catch(e){}return pay};
/* ---- balance / Gem pills ---- */
let pb=null,pg=null;const su=Shell.update;
Shell.update=function(){const r=su.apply(this,arguments);try{const d=Store.d;if(d){
if(pb!==null&&Math.abs(d.balance-pb)>.004)pulse($('hb-bal'),d.balance>pb?'fb-up':'fb-down',900);
if(pg!==null&&d.gems!==pg){const e=$('hb-gems');pulse(e,d.gems>pg?'fb-up':'fb-down',900);if(d.gems>pg)float(e,'+'+(d.gems-pg)+' Gem'+(d.gems-pg>1?'s':''))}
pb=d.balance;pg=d.gems}}catch(e){}return r};
/* ---- click guard + crate affordability (capture phase: runs before any page handler) ---- */
const TX='.buy,.qb.claim,.msclaim,.msall,.sellg,#cyes,#byes,#syes,#ryes,.crroll,.sellb,.rubtn,.spinbtn,.savb',LAST=new WeakMap();
document.addEventListener('click',e=>{const t=e.target;if(!t||!t.closest)return;
const b=t.closest(TX);
if(b){const n=performance.now(),l=LAST.get(b)||-1e9;if(n-l<700){e.stopImmediatePropagation();e.preventDefault();return}LAST.set(b,n);pulse(b,'fb-press',180)}
const r=t.closest('[data-roll]'),cost=(CFG.CRATE&&CFG.CRATE.COST)||3;
if(r&&Store.d&&Store.d.gems<cost){e.stopImmediatePropagation();e.preventDefault();pulse(r,'fb-shake',500);App.toast(`Not enough Gems: you need ${cost-Store.d.gems} more (each roll costs ${cost})`)}},true);
/* ---- Rank-Up page: say what is missing ---- */
if(typeof Pages!=='undefined'&&Pages.rankup){const m=Pages.rankup.mount;
Pages.rankup.mount=function(app){const c=m.call(this,app);try{const s=Rank.status(),b=$('rub');if(b&&b.disabled&&!s.max){const p=document.createElement('p');p.className='fb-why';p.textContent=need(s);b.insertAdjacentElement('afterend',p)}}catch(e){}return c}}
return api})();
