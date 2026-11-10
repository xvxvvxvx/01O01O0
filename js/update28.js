/* v2.8 runtime layer (loaded last by loader.js). Pure additions, no save-data or gameplay changes:
   1) toast replay fix  2) modal backdrop-close  3) Coin/Gold wording (01O0 / Steakcoin never shown)  4) Fredoka for canvas text
   5) shorter Aviamasters / Plinko / Double-or-Nothing side text, live data first  6) Limited rarity colour token (styled in css/update28.css) */
(()=>{
const RX=[[/https?:\/\/xvxvvxvx\.github\.io\/01O01O0\/?/gi,'Gold'],[/01O0\s?[Cc]oin|01O0oin/g,'Coin'],[/Steakcoin/gi,'Coin'],[/01O0/g,'Gold']],TEST=/01O0|Steakcoin/i;
const norm=s=>RX.reduce((a,[r,t])=>a.replace(r,t),String(s));
const FONT=/Montserrat|Playfair Display|Times New Roman|Georgia/g;
const fontFix=v=>String(v).replace(FONT,'Fredoka');
const api={norm,fontFix};if(typeof window!=='undefined')window.Update28=api;
if(typeof document==='undefined')return;
/* 6) Limited rarity token: near-white marker colour picked up by the .rar[style*="#f5f5f5"] rule */
try{if(typeof CFG!=='undefined'&&CFG.RAR&&CFG.RAR.limited)CFG.RAR.limited.color='#f5f5f5'}catch(e){}
/* 4) canvas text: every ctx.font assignment uses Fredoka */
try{const P=CanvasRenderingContext2D.prototype,d=Object.getOwnPropertyDescriptor(P,'font');if(d&&d.set)Object.defineProperty(P,'font',{get:d.get,set(v){d.set.call(this,fontFix(v))},configurable:true})}catch(e){}
/* 1) toast replay: the toast keeps its "show" class after its animation, so hiding/showing the game view (Right Shift) replayed the last message */
const clr=e=>{const t=e.target;if(t&&t.id==='stk-toast')t.className=''};
document.addEventListener('animationend',clr,true);document.addEventListener('animationcancel',clr,true);
try{new ResizeObserver(en=>{if(en[0]&&en[0].contentRect.width===0){const t=document.getElementById('stk-toast');if(t)t.className=''}}).observe(document.documentElement)}catch(e){}
addEventListener('pagehide',()=>{const t=document.getElementById('stk-toast');if(t)t.className=''});
/* 2) modals that have an X (chance guides, catalogue preview) also close when the dark backdrop is clicked */
document.addEventListener('click',e=>{const o=e.target;if(o&&o.classList&&o.classList.contains('mo')){const x=o.querySelector('.xbtn');if(x)x.click()}});
/* 3) wording */
if(typeof App!=='undefined'&&App.toast){const t=App.toast;App.toast=function(m){return t.call(this,norm(m))}}
const ATTR=['title','aria-label','placeholder','alt'];
function fix(n){if(n.nodeType===3){const v=n.nodeValue;if(TEST.test(v)){const w=norm(v);if(w!==v)n.nodeValue=w}}
else if(n.nodeType===1&&n.getAttribute)for(const a of ATTR){const v=n.getAttribute(a);if(v&&TEST.test(v))n.setAttribute(a,norm(v))}}
function walk(r){fix(r);for(let c=r.firstChild;c;c=c.nextSibling)walk(c)}
walk(document.documentElement);document.title=norm(document.title);
new MutationObserver(ms=>{for(const m of ms){if(m.type==='childList')m.addedNodes.forEach(walk);else fix(m.target)}}).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTR});
/* 5) compact side panels */
const SHORT={
plinko:'Drop a ball through the pegs into a multiplier pot; the edges pay most. No cooldown (one click or Space per ball). RTP about 99%. 2,000 balls = 1 rank round.',
aviamasters:'Collect +n and ×1.3–×1.7 items, dodge rockets, land on the carrier (max 250x). Below 1x is a loss. RTP about 101%. Rare jackpots pay 10x to 250x (chances listed below). Turbo only changes animation speed. Space relaunches.'};
function tidy(k,el){const s=el.querySelector('.side');if(!s)return;const h=[...s.querySelectorAll('.hist')];if(h[0]&&SHORT[k])h[0].textContent=SHORT[k];
if(k==='aviamasters'){s.classList.add('avi-side');if(h[0])h[0].classList.add('avi-desc');const rf=h.find(x=>/Recent flights/.test(x.textContent));if(rf)rf.classList.add('avi-rf')}
if(k==='doubleornothing'){const p=s.querySelector('p');if(p)p.textContent='Double your bet or lose it all: a 50% chance to double.'}}
if(typeof Games!=='undefined')['plinko','aviamasters','doubleornothing'].forEach(k=>{const g=Games[k];if(!g||!g.mount)return;const m0=g.mount;g.mount=function(el){const c=m0.call(this,el);try{tidy(k,el)}catch(e){}return c}});
})();
