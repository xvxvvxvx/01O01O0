(()=>{
if(typeof document==='undefined')return;
const LOCAL=location.protocol==='file:'||['localhost','127.0.0.1','[::1]',''].includes(location.hostname);
if(!LOCAL)return;
const SEQ=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','KeyD','KeyE','KeyV'],S={win:false,mult:2};
const g=id=>document.getElementById(id),toast=m=>App.toast('DEV: '+m);
const _settle=Econ.settle;
Econ.settle=function(game,bet,gross){if(S.win&&gross<bet*S.mult)gross=Math.round(bet*S.mult*100)/100;return _settle.call(Econ,game,bet,gross)};
const need=()=>{if(!Store.d||!Store.d.user){toast('create a username first');return false}Store.load();return true};
const done=(msg,reroute)=>{Store.sync();Store.save();App.bal();if(reroute&&!Games[location.hash.slice(1)])App.route();toast(msg)};   // never re-route mid-game: that would forfeit a live wager
const ids=t=>COS.filter(c=>c.type===t).map(c=>c.id);
const grant=l=>{const d=Store.d;l.forEach(id=>{if(!d.inv.includes(id))d.inv.push(id)})};
const remove=l=>{const d=Store.d;d.inv=d.inv.filter(x=>!l.includes(x));l.forEach(id=>{if(d.paid)delete d.paid[id]});for(const k of['tag','grad'])if(l.includes(d.eq[k]))d.eq[k]=null};
const opt=(v,t)=>`<option value="${v}">${t}</option>`;
const cosOpts=type=>['common','rare','epic','legendary'].map(r=>{const l=COS.filter(c=>c.type===type&&c.rar===r);return l.length?`<optgroup label="${CFG.RAR[r].n}">${l.map(c=>opt(c.id,c.name+(c.type==='tag'?' '+c.label:''))).join('')}</optgroup>`:''}).join('');
const A={
rank(){if(!need())return;const i=+g('sudt-rk').value,d=Store.d;d.rk=i;d.rc=0;d.rq=0;d.pt={};if(g('sudt-rkb').checked)d.balance=Econ.startBalance(i);done('rank set to '+CFG.RANKS[i].n,true)},
bal(){const v=Math.round(Number(g('sudt-bal').value)*100)/100;if(!Number.isFinite(v)||v<0){toast('enter a balance of 0 or more');return}if(!need())return;Store.d.balance=v;done('balance set to $'+Econ.fi(v),true)},
gems(){const v=Math.floor(Number(g('sudt-gm').value));if(!Number.isFinite(v)||v<0){toast('enter Gems of 0 or more');return}if(!need())return;Store.d.gems=v;done('Gems set to '+v,true)},
daily(){if(!need())return;Store.d.dl=0;done('daily wheel ready',true)},
gAllTags(){if(!need())return;grant(ids('tag'));done('granted every tag',true)},
rAllTags(){if(!need())return;remove(ids('tag'));done('removed every tag',true)},
gAllGrads(){if(!need())return;grant(ids('grad'));done('granted every gradient',true)},
rAllGrads(){if(!need())return;remove(ids('grad'));done('removed every gradient',true)},
gTag(){if(!need())return;grant([g('sudt-t1').value]);done('granted '+Cos.by(g('sudt-t1').value).name,true)},
rTag(){if(!need())return;remove([g('sudt-t2').value]);done('removed '+Cos.by(g('sudt-t2').value).name,true)},
gGrad(){if(!need())return;grant([g('sudt-g1').value]);done('granted '+Cos.by(g('sudt-g1').value).name,true)},
rGrad(){if(!need())return;remove([g('sudt-g2').value]);done('removed '+Cos.by(g('sudt-g2').value).name,true)},
cases(){const n=Math.floor(Number(g('sudt-cn').value));if(!(n>=1)){toast('rolls must be 1 or more');return}const C=Games.cases;C.dev=C.dev||{fake:0,tip:0};C.dev.rar=g('sudt-cr').value;C.dev.left=n;stat();toast(`next ${n} Cases spin${n>1?'s':''} = ${C.dev.rar}`)},
casesOff(){const C=Games.cases;if(C.dev){C.dev.rar=null;C.dev.left=0}stat();toast('Cases forcing cleared')},
qreset(){if(!need())return;Quests.sync();Store.d.q.d=Store.scope(null);Store.d.q.w=Store.scope(null);done('all quest progress reset',true)},
qfill(){if(!need())return;Quests.sync();const q=Store.d.q;for(const sc of['d','w']){const s=q[sc];for(const qs of Quests.list(sc)){const b=(s.b&&s.b[qs.kind])||0;s.p[qs.kind]=Math.max(s.p[qs.kind]||0,b+qs.target);s.n[qs.id]=1}}done('all current quests fulfilled (claim them on the Quests page)',true)}};
/* ---- UI ---- */
let root=null,mini=false;
const css=`#sudt{position:fixed;z-index:9998;width:340px;max-width:calc(100vw - 16px);max-height:calc(100vh - 16px);display:flex;flex-direction:column;background:#0a0a0a;color:#fff;border:2px solid #fff;border-radius:14px;box-shadow:0 10px 40px #000c;font:600 13px Montserrat,system-ui,sans-serif}
#sudt .h{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border-bottom:1px solid #ffffff55;cursor:grab;touch-action:none;user-select:none}#sudt .h.drag{cursor:grabbing}
#sudt .t{font-weight:900;font-size:13px;line-height:1.15;background-image:linear-gradient(90deg,#f00,#f90,#fe0,#3f0,#0cf,#60f,#f0c,#f00);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:sudtRb 3s linear infinite}
@keyframes sudtRb{to{background-position:300% 0}}
#sudt .b{display:flex;gap:6px;flex:none}#sudt .b button{width:26px;height:26px;padding:0;border:2px solid #fff;border-radius:8px;background:transparent;color:#fff;font:900 15px/1 Montserrat,sans-serif;cursor:pointer}#sudt .b button:hover{background:#fff;color:#000}
#sudt .bd{overflow:auto;padding:8px 10px 10px;display:grid;gap:8px}
#sudt fieldset{margin:0;padding:6px 8px 8px;border:1px solid #ffffff66;border-radius:10px;display:grid;gap:6px;min-width:0}#sudt legend{padding:0 6px;color:#a3a3a3;font-size:11px;letter-spacing:1px}
#sudt .r{display:flex;gap:6px;align-items:center;min-width:0}#sudt .r>*{min-width:0}#sudt select,#sudt input[type=number]{flex:1;width:100%;padding:5px 6px;border:1px solid #ffffffaa;border-radius:6px;background:#000;color:#fff;font:600 12px Montserrat,sans-serif}
#sudt button.a{flex:none;padding:5px 10px;border:2px solid #fff;border-radius:8px;background:#fff;color:#000;font:800 12px Montserrat,sans-serif;cursor:pointer}#sudt button.a:hover{background:#000;color:#fff}#sudt button.a.d{background:transparent;color:#fff}#sudt button.a.d:hover{background:#ef4444;border-color:#ef4444}
#sudt button.w{flex:1}#sudt label.c{display:flex;gap:6px;align-items:center;font-size:12px;color:#d4d4d4}#sudt .s{font-size:11px;color:#a3a3a3}
@media(prefers-reduced-motion:reduce){#sudt .t{animation:sudtRb 3s linear infinite!important}}`;
function build(){
if(!g('sudt-css')){const s=document.createElement('style');s.id='sudt-css';s.textContent=css;document.head.appendChild(s)}
const R=CFG.RANKS.map((r,i)=>opt(i,`${i}. ${r.n}`)).join(''),CR=Games.cases.RAR.map(r=>opt(r.k,r.k)).join('');
const row=(sel,btn)=>`<div class="r">${sel}${btn}</div>`,B=(a,t,c='')=>`<button type="button" class="a ${c}" data-a="${a}">${t}</button>`;
root=document.createElement('div');root.id='sudt';root.setAttribute('role','dialog');root.setAttribute('aria-label','Super Ultimate Developer Test Menu+++');
root.style.left=Math.max(8,innerWidth-356)+'px';root.style.top='78px';
root.innerHTML=`<div class="h" id="sudt-h"><span class="t">Super Ultimate Developer Test Menu+++</span><span class="b"><button type="button" id="sudt-min" title="Minimise" aria-label="Minimise">–</button><button type="button" id="sudt-x" title="Close (or press ↑↑↓↓DEV)" aria-label="Close">×</button></span></div>
<div class="bd" id="sudt-bd">
<fieldset><legend>ECONOMY</legend>
${row(`<select id="sudt-rk" aria-label="Rank">${R}</select>`,B('rank','Set rank'))}<label class="c"><input type="checkbox" id="sudt-rkb"> also set balance to that rank's starting cash</label>
${row('<input type="number" id="sudt-bal" min="0" step="0.01" value="1000" aria-label="Balance">',B('bal','Set balance'))}
${row('<input type="number" id="sudt-gm" min="0" step="1" value="100" aria-label="Gems">',B('gems','Set Gems'))}
<label class="c"><input type="checkbox" id="sudt-win"> Win every wager (pays at least</label><div class="r"><input type="number" id="sudt-wm" min="1.01" step="0.01" value="2" aria-label="Forced win multiplier"><span class="s">x the bet; game visuals may still show a loss)</span></div>
${row('<span class="s" style="flex:1">Daily wheel spin timer</span>',B('daily','Reset timer'))}</fieldset>
<fieldset><legend>COSMETICS</legend>
<div class="r">${B('gAllTags','Grant all tags','w')}${B('rAllTags','Remove all tags','w d')}</div><div class="r">${B('gAllGrads','Grant all gradients','w')}${B('rAllGrads','Remove all gradients','w d')}</div>
${row(`<select id="sudt-t1" aria-label="Tag to grant">${cosOpts('tag')}</select>`,B('gTag','Grant tag'))}${row(`<select id="sudt-t2" aria-label="Tag to remove">${cosOpts('tag')}</select>`,B('rTag','Remove tag','d'))}
${row(`<select id="sudt-g1" aria-label="Gradient to grant">${cosOpts('grad')}</select>`,B('gGrad','Grant gradient'))}${row(`<select id="sudt-g2" aria-label="Gradient to remove">${cosOpts('grad')}</select>`,B('rGrad','Remove gradient','d'))}</fieldset>
<fieldset><legend>CASES</legend>
<div class="r"><select id="sudt-cr" aria-label="Guaranteed rarity">${CR}</select><input type="number" id="sudt-cn" min="1" step="1" value="1" aria-label="Rolls in a row" style="max-width:70px"></div>
<div class="r">${B('cases','Guarantee rarity','w')}${B('casesOff','Clear','d')}</div><div class="s" id="sudt-cs"></div></fieldset>
<fieldset><legend>QUESTS</legend><div class="r">${B('qreset','Reset all progress','w d')}${B('qfill','Fulfil all quests','w')}</div></fieldset></div>`;
document.body.appendChild(root);
root.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&A[b.dataset.a])A[b.dataset.a]()});
g('sudt-win').onchange=e=>{S.win=e.target.checked;toast('win every wager '+(S.win?'ON':'OFF'))};
g('sudt-wm').oninput=e=>{const v=Number(e.target.value);if(v>1)S.mult=v};
g('sudt-x').onclick=()=>{root.hidden=true};
g('sudt-min').onclick=()=>{mini=!mini;g('sudt-bd').hidden=mini;g('sudt-min').textContent=mini?'+':'–'};
const h=g('sudt-h');let ox=0,oy=0,on=false;
h.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const r=root.getBoundingClientRect();ox=e.clientX-r.left;oy=e.clientY-r.top;on=true;h.classList.add('drag');h.setPointerCapture(e.pointerId)});
h.addEventListener('pointermove',e=>{if(!on)return;root.style.left=Math.min(Math.max(0,e.clientX-ox),Math.max(0,innerWidth-root.offsetWidth))+'px';root.style.top=Math.min(Math.max(0,e.clientY-oy),Math.max(0,innerHeight-h.offsetHeight))+'px'});
const up=()=>{on=false;h.classList.remove('drag')};h.addEventListener('pointerup',up);h.addEventListener('pointercancel',up);
setInterval(()=>{if(!root.hidden)stat()},500);stat()}
function stat(){const e=g('sudt-cs');if(!e)return;const d=Games.cases.dev;e.textContent=d&&d.rar&&d.left>0?`Cases forced: ${d.rar}, ${d.left} spin${d.left>1?'s':''} left`:'Cases forcing: off (normal odds)'}
function toggle(){if(!root)build();else root.hidden=!root.hidden}
let pos=0,tmr=0;
document.addEventListener('keydown',e=>{const t=e.target,n=t&&t.tagName;if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||n==='INPUT'||n==='TEXTAREA'||n==='SELECT'||(t&&t.isContentEditable))return;
pos=e.code===SEQ[pos]?pos+1:(e.code===SEQ[0]?1:0);clearTimeout(tmr);tmr=setTimeout(()=>{pos=0},2000);
if(pos===SEQ.length){pos=0;toggle()}},true);
})();
