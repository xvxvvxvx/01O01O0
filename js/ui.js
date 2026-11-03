/* Shared UI: rank badges, gem icon, account bar + sidebar (Shell), modals, daily wheel, homepage dashboard, Rank-Up and Daily Spin pages. */
let _bid=0;const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const gemIcon=(sz=18)=>`<svg class="gic" viewBox="0 0 24 24" width="${sz}" height="${sz}" aria-hidden="true"><polygon points="12,2 21,9 12,22 3,9" fill="#d58cff" stroke="#8b3dd6" stroke-width="1.5" stroke-linejoin="round"/><path d="M3 9h18M8 9l4-7 4 7-4 13z" fill="none" stroke="#f3d6ff" stroke-width="1" opacity=".8"/></svg>`;
/* rank icon id (CFG.RANKS[i].ic) -> image file in img/. v2.45 art (jpg) ships as white placeholders: replace the files, keep the names. */
const BIMG={demon:'insanedemon.png',xdemon:'extremedemon.png',impdemon:'impossibledemon.jpg',unreal:'unreal.jpg',div5:'div5.jpg',div4:'div4.jpg',div3:'div3.jpg',div2:'div2.jpg',div1:'div1.jpg'};
const Badge={
grad:i=>`linear-gradient(135deg,${CFG.RANKS[i].g[0]},${CFG.RANKS[i].g[1]})`,
txt:(i,st='')=>`<b class="rk" style="background-image:${Badge.grad(i)};${st}">${CFG.RANKS[i].n.toUpperCase()}</b>`,
svg(i,sz=56){const id='bd'+(++_bid),[a,b]=CFG.RANKS[i].g,P=p=>`<polygon points="${p}" fill="url(#${id})" stroke="${b}" stroke-width="3" stroke-linejoin="round"/>`;
const star=(n,ro,ri)=>{const o=[];for(let k=0;k<n*2;k++){const r=k%2?ri:ro,t=Math.PI*k/n-Math.PI/2;o.push((50+r*Math.cos(t)).toFixed(1)+','+(50+r*Math.sin(t)).toFixed(1))}return o.join(' ')};
const S=[`<circle cx="50" cy="50" r="38" fill="none" stroke="url(#${id})" stroke-width="10"/>`,P('8,14 92,14 50,90'),P('50,5 90,27 90,73 50,95 10,73 10,27'),`<rect x="14" y="14" width="72" height="72" rx="12" fill="url(#${id})" stroke="${b}" stroke-width="3"/>`,P(star(4,46,14)),P('50,6 94,38 77,90 23,90 6,38'),P('30,6 70,6 94,30 94,70 70,94 30,94 6,70 6,30'),`<circle cx="50" cy="50" r="42" fill="url(#${id})" stroke="${b}" stroke-width="4"/>`,P('25,12 75,12 96,38 50,92 4,38'),P(star(12,48,36)),`<polyline points="14,54 40,80 88,22" fill="none" stroke="url(#${id})" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>`];
const ic=CFG.RANKS[i].ic;
if(BIMG[ic])return `<img class="bdg" src="img/${BIMG[ic]}" width="${sz}" height="${sz}" alt="" aria-hidden="true">`;
const X={crown:P('8,78 14,28 34,50 50,18 66,50 86,28 92,78'),feather:`<path d="M80,8C42,10 18,38 20,78L12,94 28,86C62,84 86,52 80,8Z" fill="url(#${id})" stroke="${b}" stroke-width="3" stroke-linejoin="round"/><path d="M80,8 22,84" stroke="${b}" stroke-width="3" fill="none"/>`};
return `<svg class="bdg" viewBox="0 0 100 100" width="${sz}" height="${sz}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>${ic==='check'?S[10]:X[ic]||S[i]}</svg>`}};
const hms=ms=>{const s=Math.ceil(ms/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60);return [h,m,s%60].map(x=>String(x).padStart(2,'0')).join(':')};
const dhms=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return `${Math.floor(s/86400)}d, ${Math.floor(s%86400/3600)}h, ${Math.floor(s%3600/60)}m, ${s%60}s`};   // weekly quest reset format
const hmsr=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return `${Math.floor(s/3600)}h, ${Math.floor(s%3600/60)}m, ${s%60}s`};   // daily quest reset format (weekly adds days)
const fdur=ms=>{const s=Math.floor(ms/1000),p=[[Math.floor(s/3600),'h'],[Math.floor(s%3600/60),'m'],[s%60,'s']].filter(x=>x[0]);return p.length?p.map(x=>x[0]+x[1]).join(' '):'0s'};   // quest playtime progress, e.g. 12m 5s / 1h
const plural=(n,w)=>`${n} ${w}${n===1?'':'s'}`;
const playtimeTxt=ms=>{let s=Math.floor(ms/1000);const w=Math.floor(s/604800);s%=604800;const d=Math.floor(s/86400);s%=86400;const h=Math.floor(s/3600);s%=3600;const m=Math.floor(s/60);
return `${plural(w,'Week')}, ${plural(d,'Day')}, ${plural(h,'Hour')}, ${plural(m,'Minute')} and ${plural(s%60,'Second')}`};
const Shell={
show(v){$('acct').hidden=!v;$('sb').hidden=!v},
update(){if(!$('hb-bal'))return;const s=Rank.status(),d=Store.d;$('hb-bal').textContent='$'+Econ.fmt(d.balance);$('hb-gems').innerHTML=gemIcon(15)+' '+d.gems;
$('hb-un').innerHTML=Cos.user(esc(d.user||''),d.eq.grad);$('hb-tag').innerHTML=d.eq.tag?Cos.html(Cos.by(d.eq.tag)):'<span class="notag">[NO TAG]</span>';
$('hb-rank').innerHTML=Badge.txt(s.idx)+(s.ready?'<em>RANK-UP READY</em>':'');$('hb-next').innerHTML=s.next?Badge.txt(s.idx+1):`<b class="rk" style="background-image:${Badge.grad(CFG.RANKS.length-1)}">MAX</b>`},
tick(){const now=Date.now(),rdy=Daily.ready(now),ms=Daily.readyIn(now);if(Store.d.user){const pt=Store.tickPlaytime(now),pe=$('hb-pt');if(pe)pe.textContent=playtimeTxt(pt)}
document.querySelectorAll('[data-cd]').forEach(e=>e.textContent=rdy?'READY':hms(ms));
document.querySelectorAll('[data-spin]').forEach(b=>{const txt=rdy?(b.dataset.spin==='link'?'SPIN ON DAILY REWARD PAGE':'SPIN'):'NEXT SPIN IN '+hms(ms);if(b.textContent!==txt)b.textContent=txt;b.classList.toggle('off',!rdy);if(b.tagName==='BUTTON')b.disabled=!rdy||Wheel.busy});
const bx=Math.max(0,Store.d.bx-now);const bxe=$('hb-bx');if(bxe){const sec=Math.ceil(bx/1000);bxe.hidden=!bx;if(bx){const t=Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0'),te=$('hb-bxt');if(te.textContent!==t)te.textContent=t;bxe.classList.toggle('low',sec<=60)}}   // v2.5b: 2X potion timer beside the name/tag/rank
document.querySelectorAll('[data-bx]').forEach(e=>e.textContent=bx?`2X bonus active: ${hms(bx).slice(3)} left`:'No active bonus');
document.querySelectorAll('[data-shop]').forEach(e=>e.textContent=hms(Shop.expires(now)-now));
document.querySelectorAll('[data-qreset]').forEach(e=>{const l=Quests.nextReset(e.dataset.qreset,now)-now;e.textContent='Resets in '+(e.dataset.qreset==='w'?dhms(l):hmsr(l))});
if(typeof Pages!=='undefined'&&Pages._tick)Pages._tick(now)},
init(){const sb=$('sb'),t=$('sbt'),set=o=>{sb.classList.toggle('open',o);t.setAttribute('aria-expanded',o)};
t.onclick=e=>{e.stopPropagation();set(!sb.classList.contains('open'))};
sb.addEventListener('click',e=>{if(e.target.closest('a'))set(false)});document.addEventListener('click',e=>{if(!sb.contains(e.target))set(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sb.classList.contains('open')){set(false);t.focus()}});
$('hb-user').onclick=()=>{
  const m=Modal.open(`
    <p class="rdisc">Account settings</p>
    <label for="nun">Game username</label>
    <input id="nun" maxlength="16"
      value="${esc(Store.d.user)}" aria-label="Username">
    <div class="mbtns">
      <button class="btn" id="nys">Save username</button>
      <button class="btn dim" id="nno">Cancel</button>
    </div>
  `,{label:'Account settings',esc:()=>m.close()});

  $('nno').onclick=()=>m.close();

  $('nys').onclick=()=>{
    if(App.setUser($('nun').value)){
      m.close();
      Shell.update();
      App.toast('Username saved');
    }else{
      App.toast('Type a username first');
    }
  };
};
setInterval(Shell.tick,1000);Shell.tick()}};
const Modal={seen:false,
open(html,{label='Dialog',esc:onEsc,wide}={}){const o=document.createElement('div');o.className='mo';o.innerHTML=`<div class="mb${wide?' wide':''}" role="dialog" aria-modal="true" aria-label="${label}">${html}</div>`;document.body.appendChild(o);$('app').setAttribute('aria-hidden','true');requestAnimationFrame(()=>o.classList.add('in'));
const kd=e=>{if(e.key==='Tab'){const b=[...o.querySelectorAll('button,a,input,select')].filter(x=>!x.disabled);if(!b.length)return;e.preventDefault();b[(b.indexOf(document.activeElement)+(e.shiftKey?-1:1)+b.length)%b.length].focus()}else if(e.key==='Escape'&&onEsc)onEsc()};
document.addEventListener('keydown',kd);const f=o.querySelector('button');if(f)f.focus();
return{el:o,close(){o.classList.remove('in');setTimeout(()=>o.remove(),200);$('app').removeAttribute('aria-hidden');document.removeEventListener('keydown',kd)}}},
disclaimer(){if(Modal.seen||Store.d.ndp)return;Modal.seen=true;
const m=Modal.open(`<div class="dt">Very Important Disclaimer for all users:</div><div class="dbx"><u>ALL</u> minigames and currency on https://xvxvvxvx.github.io/01O01O0/ are all <u>FICTIONAL</u>, holding no real value in real life. <u>ALL</u> minigames on 01O0 are all for entertainment purposes and are meant to show the risks of gambling and the importance of spending money responsibly in real life. Please play responsibly. -Night.</div><div class="dbx">To learn more about responsible spending habits, visit:<br><a href="https://www.westpac.com.au/bank-accounts/savings-accounts/financial-tips" target="_blank" rel="noopener">https://www.westpac.com.au/bank-accounts/savings-accounts/financial-tips</a><br>or<br><a href="https://www.commbank.com.au/articles/youth-student-banking/how-to-teach-kids-responsible-spending-habits.html" target="_blank" rel="noopener">https://www.commbank.com.au/articles/youth-student-banking/how-to-teach-kids-responsible-spending-habits.html</a><br>for more information.</div><button class="dgo" id="dgo">I understand, continue to homepage</button><button class="dnv" id="dnv">Continue to homepage and don't show again</button>`,{label:'Disclaimer',esc:()=>m.close()});
$('dgo').onclick=()=>m.close();$('dnv').onclick=()=>{Store.d.ndp=true;Store.save();m.close()}},
rankUp(){const s=Rank.status();if(!s.ready){App.toast('Requirements not met yet');return}
const m=Modal.open(`<p class="rdisc">DISCLAIMER: Ranking up resets ALL money made, are you sure?</p><div class="mbtns"><button class="btn" id="ryes">Yes, rank up</button><button class="btn dim" id="rno">Cancel</button></div>`,{label:'Confirm rank up',esc:()=>m.close()});
let used=false;$('rno').onclick=()=>m.close();
$('ryes').onclick=()=>{if(used)return;used=true;const from=Store.d.rk,rw=Rank.rankUp();m.close();if(!rw){App.toast('Requirements not met yet');return}App.bal();Modal.rankAnim(from,Store.d.rk,rw);App.route()}},
rankAnim(from,to,rw){const g=CFG.RANKS[to].g,o=document.createElement('div');o.className='ru';
o.innerHTML=`<div class="rubg" style="background:radial-gradient(circle,${g[0]}cc,${g[1]}55 55%,#000000 90%)"></div><div class="rucont"><div class="rub old">${Badge.svg(from,110)}</div><div class="rub new">${Badge.svg(to,170)}</div><h2>Rank Up!</h2><div>${Badge.txt(to,'font-size:56px')}</div><p>Starting : <b>$${Econ.fi(rw.c)}</b> &nbsp;+&nbsp; <b>${rw.g}</b> ${gemIcon(18)} Gems</p><button class="btn" id="ruc">Continue</button></div>`;
document.body.appendChild(o);FX.confetti(o,70);requestAnimationFrame(()=>o.classList.add('go'));const close=()=>o.remove();$('ruc').onclick=close;setTimeout(close,6500)}};
/* ---------- Daily wheel ---------- */
const Wheel={busy:false,SEG:['A','X','A','B','A','X','A','B'],   // A =  ($), B = Gems (gem icon), X = 2X bonus
ease(p){const A=.1,C=.35,L=1-C,V=1/(A/2+(C-A)+L/3);if(p<=0)return 0;if(p>=1)return 1;if(p<A)return .5*V*p*p/A;const d1=.5*V*A;if(p<C)return d1+V*(p-A);const q=(p-C)/L;return d1+V*(C-A)+V*L/3*(1-Math.pow(1-q,3))},
draw(cv,win){const c=cv.getContext('2d'),S=cv.width,C=S/2,R=C-14,P=Math.PI/4;c.clearRect(0,0,S,S);c.fillStyle='#8a8f98';c.beginPath();c.arc(C,C,R+12,0,7);c.fill();c.fillStyle='#656a73';c.beginPath();c.arc(C,C,R+4,0,7);c.fill();
const seg=k=>{const a=-Math.PI/2+k*P;c.beginPath();c.moveTo(C,C);c.arc(C,C,R,a,a+P);c.closePath();return a};
Wheel.SEG.forEach((t,k)=>{const a=seg(k);c.fillStyle=t==='X'?'#f2c94c':t==='B'?'#3a4452':(k%4===0?'#f1f3f5':'#c9ced4');c.fill();const am=a+P/2;c.save();c.translate(C+Math.cos(am)*R*.64,C+Math.sin(am)*R*.64);c.rotate(am+Math.PI/2);c.textAlign='center';c.textBaseline='middle';
if(t==='B'){const s=R*.22;c.fillStyle='#d58cff';c.strokeStyle='#8b3dd6';c.lineWidth=3;c.beginPath();c.moveTo(0,-s);c.lineTo(s*.95,-s*.3);c.lineTo(0,s);c.lineTo(-s*.95,-s*.3);c.closePath();c.fill();c.stroke();c.strokeStyle='#f3d6ff';c.beginPath();c.moveTo(-s*.95,-s*.3);c.lineTo(s*.95,-s*.3);c.moveTo(-s*.4,-s*.3);c.lineTo(0,-s);c.lineTo(s*.4,-s*.3);c.stroke()}
else{c.font=`900 ${t==='X'?R*.2:R*.3}px Montserrat,sans-serif`;c.fillStyle=t==='X'?'#7a5b00':'#000000';c.fillText(t==='X'?'2X':'$',0,0)}c.restore()});
if(win>=0){Wheel.SEG.forEach((t,k)=>{if(k!==win){seg(k);c.fillStyle='rgba(8,16,24,.72)';c.fill()}});seg(win);c.save();c.shadowColor='#fde047';c.shadowBlur=26;c.strokeStyle='#fde047';c.lineWidth=5;c.stroke();c.restore()}
c.fillStyle='#8a8f98';c.beginPath();c.arc(C,C,R*.1,0,7);c.fill()},
text:rw=>rw.id==='x2'?'2X  bonus for 15 minutes!':rw.id==='gem'?`+${rw.amount} Gem${rw.amount>1?'s':''}`:`+$${rw.amount} `,
create(host,{onDone}={}){host.innerHTML='<div class="wh"><div class="wsp"><canvas class="wcv" width="360" height="360"></canvas></div><i class="wp"></i></div>';
const wh=host.firstChild,cv=host.querySelector('canvas'),ent=host.querySelector('.wsp'),RM=matchMedia('(prefers-reduced-motion: reduce)').matches;Wheel.draw(cv,-1);
let ang=Math.random()*360,spin=null,reveal=0,raf=0,last=performance.now(),win=-1;
const done=()=>{ang=spin.a1;const rw=spin.rw;spin=null;Wheel.busy=false;Daily.credit();Wheel.draw(cv,win);reveal=Date.now()+6000;App.bal();FX.confetti(wh,34);
App.toast('Daily reward: '+Wheel.text(rw));if(onDone)onDone(rw)};
const loop=now=>{const dt=Math.min(.05,(now-last)/1000);last=now;const rdy=Daily.ready(),show=rdy||spin||Date.now()<reveal;wh.classList.toggle('ready',rdy&&!spin);wh.classList.toggle('locked',!show);
if(spin){const p=Math.min(1,(now-spin.t0)/CFG.DAILY.SPIN_MS);ang=spin.a0+(spin.a1-spin.a0)*Wheel.ease(p);if(p>=1)done()}else if(rdy&&!RM)ang+=dt*10;
ent.style.transform=`rotate(${ang}deg)`;raf=requestAnimationFrame(loop)};
raf=requestAnimationFrame(loop);
return{spin(){if(spin||Wheel.busy)return false;const rw=Daily.claim();if(!rw){App.toast('Daily spin not ready yet');return false}
const ty=rw.id==='low'?'A':rw.id==='gem'?'B':'X',ix=Wheel.SEG.map((t,k)=>t===ty?k:-1).filter(k=>k>=0),k=ix[Math.floor(Econ.rnd()*ix.length)],ctr=k*45+22.5,off=(Econ.rnd()-.5)*30,base=ang+5*360;
Wheel.busy=true;win=k;spin={t0:performance.now(),a0:ang,a1:base+((((360-ctr-off)-base)%360)+360)%360,rw};Wheel.draw(cv,-1);Shell.tick();return true},destroy(){cancelAnimationFrame(raf);Wheel.busy=false}}}};
/* ---------- Pages ---------- */
const Dash={
bar:(t,f)=>`<div class="pb"><i style="width:${Math.min(100,Math.max(0,f*100))}%"></i><span>${t}</span></div>`,
rankBars(s){return s.max?'':Dash.bar(`$${Econ.fi(s.coin)}/${Econ.fi(s.req.c)} earned`,s.coin/s.req.c)+Dash.bar(`${s.rounds}/${s.req.r} mini-game rounds played`,s.rounds/s.req.r)},
questBars(sc){Quests.sync();return Quests.list(sc).map(q=>{const p=Quests.prog(sc,q),cl=Quests.claimed(sc,q);return `<div class="qm"><small>${q.name}${q.lv?` <b class="qtl">TIER ${q.lv+1}</b>`:''}${cl?' (claimed)':''}</small>${Dash.bar(q.kind==='profit'?`$${Econ.fi(p)}/$${Econ.fi(q.target)}`:q.kind==='time'?`${fdur(p)}/${fdur(q.target)}`:`${p}/${q.target}`,p/q.target)}</div>`}).join('')},
home(app){const s=Rank.status();Quests.sync();
app.innerHTML=`<h2 class="sec">🤖 <span class="gold">Gold</span> Mini-games ›</h2><div class="cards">${LIST.map(([k,n])=>`<a class="card c-${k}" href="#${k}" aria-label="${n}" title="${n}"></a>`).join('')}</div>
<div class="dash"><section class="dp" aria-label="Your Balance"><h3>💲 Your Balance ›</h3><div class="inner"><div class="wtop"><span class="wi">👛</span><div><small>Current Balance:</small><div class="big2">$<span class="bal"></span> </div><div class="gmrow">${gemIcon(20)} <b class="gembal"></b> Gems</div></div></div>
<div class="who">${Cos.user(esc(Store.d.user),Store.d.eq.grad)} ${Store.d.eq.tag?Cos.html(Cos.by(Store.d.eq.tag)):'<span class="notag">[NO TAG]</span>'}</div>
<div id="rsw"><button class="pillbtn sm" id="rs">Click to reset back to $${Econ.fi(Econ.startBalance())}</button></div><div class="stats">${Stats.html()}</div></div></section>
<section class="dp rkp" aria-label="Rank Status"><h3>🎖️ Rank Status ›</h3><div class="inner"><div class="rrow"><div><small>Current Rank:</small><div>${Badge.txt(s.idx)}</div></div>${Badge.svg(s.idx,52)}</div>
${s.max?'<p class="rq">Maximum rank reached!</p>':`<p class="rq">RANK-UP REQUIREMENTS:<br>$${Econ.fi(s.req.c)} and ${s.req.r} minigames played.</p>${Dash.rankBars(s)}<div class="rrow"><div><small>Next Rank:</small><div>${Badge.txt(s.idx+1)}</div></div>${Badge.svg(s.idx+1,52)}</div>`}
<a class="rubtn" href="#rankup">Go to Rank-Up Page</a><p class="mline" data-bx></p></div></section>
<section class="dp" aria-label="Daily Reward"><h3>🎲 Daily Reward ›</h3><div class="inner"><div id="hw" class="hw"></div><a class="spinlink" href="#dailyspin" data-spin="link">SPIN ON DAILY REWARD PAGE</a></div></section></div>
<section class="dp ptp" aria-label="User Playtime"><h3>🕑 User Playtime ›</h3><div class="inner"><div class="ptv" id="hb-pt">${playtimeTxt(Store.playtime().t)}</div></div></section>
<div class="dash2"><section class="dp"><h3>📅 Daily Quests › <small class="rs"><span data-qreset="d"></span></small></h3><div class="inner" id="qd-in">${Dash.questBars('d')}</div></section>
<section class="dp"><h3>🗓️ Weekly Quests › <small class="rs"><span data-qreset="w"></span></small></h3><div class="inner"><div id="qw-in">${Dash.questBars('w')}</div><a class="spinlink" href="#quests">Open Quests page</a></div></section></div>`;
const w=Wheel.create($('hw')),rsw=$('rsw'),lbl=()=>`Click to reset back to $${Econ.fi(Econ.startBalance())}`,ask=()=>{rsw.innerHTML='<button class="pillbtn sm" id="ry" style="border-color:#ef4444;color:#fca5a5">Are you sure?</button> <button class="pillbtn sm" id="rn">Cancel</button>';
$('ry').onclick=()=>{Econ.resetBalance();App.route();App.toast('Balance reset to $'+Econ.fi(Econ.startBalance()))};$('rn').onclick=()=>{rsw.innerHTML=`<button class="pillbtn sm" id="rs">${lbl()}</button>`;$('rs').onclick=ask}};
$('rs').onclick=ask;
const qsig=()=>['d','w'].map(sc=>Quests.list(sc).map(q=>Quests.prog(sc,q)+':'+Quests.claimed(sc,q)).join()).join('|');let sg=qsig();
Pages._tick=()=>{Quests.sync();const n=qsig();if(n!==sg){sg=n;const a=$('qd-in'),b=$('qw-in');if(a)a.innerHTML=Dash.questBars('d');if(b)b.innerHTML=Dash.questBars('w')}};   // live quest progress (playtime quests move while you sit on the homepage)
Shell.tick();Modal.disclaimer();return()=>{Pages._tick=null;w.destroy()}}};
/* v2.45: reward text is built from the same data that grants it: starting cash + any speed tier that STARTS at this rank (CFG.SPIN_SPEED / CFG.AVI_SPEED) + Gems. */
const rwTxt=i=>{const r=CFG.RANKS[i].rw,sp=[['Cases',CFG.SPIN_SPEED],['Aviamasters',CFG.AVI_SPEED]].map(([n,t])=>{const x=t.find(a=>a[0]===i);return x?` + ${x[1]}x ${n} Speed`:''}).join('');return `$${Econ.fi(r.c)}${sp} + ${r.g}`};
Pages.rankup={mount(app){const s=Rank.status(),R=CFG.RANKS;
const reqs=(a,b)=>R.slice(a,b).map((r,k)=>`<div class="rqr"><span class="rqn">${Badge.txt(a+k)} → ${Badge.txt(a+k+1)}</span><span class="rqv">$${Econ.fi(r.req.c)} and ${r.req.r} minigames played</span></div>`).join('');
const allr=(a,b)=>R.slice(a,b).map((r,k)=>{const i=a+k,t=rwTxt(i);return `<div class="ar${i===s.idx?' cur':''}">${Badge.txt(i,`--f:${22+Math.min(i,10)*3}px`)}${Badge.svg(i,26+Math.min(i,10)*2)}<span${t.length>26?' class="sm"':''}>${t}</span>${gemIcon(22)}</div>`}).join('');
/* pages 2 and 3 share one layout: All Ranks (rank a..b-1) + Rank-Up Requirements (rank ra..rb-1 -> next) */
const side=(a,b,ra,rb,foot,n)=>`<section class="rpp" aria-label="Ranks, page ${n}" inert aria-hidden="true"><div class="rpg"><div><h2 class="sec">🎖️ All Ranks ›</h2><div class="dp allr"><p>Rewards and starting cash for each rank:</p>${allr(a,b)}${foot}</div></div><div><h2 class="sec">🎖️ Rank-Up Requirements ›</h2><div class="dp reqs">${reqs(ra,rb)}</div></div></div></section>`;
app.innerHTML=`<div class="rpn" role="tablist" aria-label="Rank pages"><button class="rpb on" role="tab" aria-selected="true" data-p="0">Page 1</button><button class="rpb" role="tab" aria-selected="false" data-p="1">Page 2</button><button class="rpb" role="tab" aria-selected="false" data-p="2">Page 3</button></div><div class="rpv"><div class="rpt"><section class="rpp" aria-label="Ranks, page 1"><div class="rpg"><div><h2 class="sec">🎖️ Rank Status ›</h2><div class="dp bigp"><div class="rtop"><div><small>Current Rank:</small><div>${Badge.txt(s.idx)}</div></div>${Badge.svg(s.idx,64)}${s.next?`<span class="arw">➜</span>${Badge.svg(s.idx+1,64)}`:''}<div class="tr"><small>Next Rank:</small><div>${s.next?Badge.txt(s.idx+1):'<b class="rk" style="background-image:'+Badge.grad(CFG.RANKS.length-1)+'">MAX RANK</b>'}</div></div></div>
${s.max?`<p class="rq">You reached the maximum rank: ${R[R.length-1].n}.</p>`:`<p class="rq">RANK-UP REQUIREMENTS:<br>$${Econ.fi(s.req.c)} and ${s.req.r} minigames played.</p>${Dash.rankBars(s)}<p class="mline">Reward for ${R[s.idx+1].n}: <b>${rwTxt(s.idx+1)}</b> ${gemIcon(14)} Gems</p>`}
<button class="rubtn big" id="rub" ${s.ready?'':'disabled'}>${s.max?'MAX RANK':'RANK-UP'}</button>
<p class="warn">Warning: Ranking up <u>resets</u> <span class="red">all</span> of your coins (to the new rank's starting cash) and your rank progress. Lifetime stats and owned cosmetics are kept.</p></div>
<h2 class="sec">🎖️ Rank-up Requirements ›</h2><div class="dp reqs">${reqs(0,10)}</div></div>
<div><h2 class="sec">🎖️ All Ranks ›</h2><div class="dp allr"><p>Rewards and starting cash for each rank:</p>${allr(1,11)}<p class="spendg">Spend your gems ${gemIcon(20)} on player tags and name gradients:</p><a class="gembtn" href="#shop">VISIT GEMSHOP</a></div></div></div></section>${side(11,22,10,21,'',2)}${side(22,R.length,21,R.length-1,'<p class="spendg">More ranks soon in Rank Expansion 3.</p>',3)}</div></div>`;
const pg=[...app.querySelectorAll('.rpp')],bt=[...app.querySelectorAll('.rpb')],tr=app.querySelector('.rpt');
bt.forEach(b=>b.onclick=()=>{const n=+b.dataset.p;tr.style.transform=`translateX(${-100*n}%)`;bt.forEach((x,i)=>{x.classList.toggle('on',i===n);x.setAttribute('aria-selected',String(i===n))});pg.forEach((x,i)=>{x.toggleAttribute('inert',i!==n);x.setAttribute('aria-hidden',String(i!==n))})});
$('rub').onclick=Modal.rankUp;Shell.tick()}};
Pages.dailyspin={mount(app){const RW=CFG.DAILY.REWARDS;
app.innerHTML=`<h2 class="sec">🎲 Daily Wheel Spin ›</h2><div class="dpg dp"><div class="dleft"><p>Test your luck on the wheel!</p><p class="mline" id="lr"></p><p class="mline" data-bx></p></div><div class="dcen"><div id="wh2"></div><button class="spinbtn" id="sp" data-spin="page">SPIN</button></div><div class="dright"><p>Chances for each reward:</p><p>$${RW[0].min}-$${RW[0].max}  ${RW[0].p}%</p><p>${RW[1].min}-${RW[1].max} Gems ${gemIcon(18)} ${RW[1].p}%</p><p>2X  Potion ${RW[2].p}% lasts for ${CFG.DAILY.BONUS_MS/60000}min.</p></div></div>`;
const last=()=>{const r=Store.d.dr;$('lr').textContent=r?'Last reward: '+Wheel.text(r).replace('+',''):''},w=Wheel.create($('wh2'),{onDone:last});last();$('sp').onclick=()=>w.spin();Shell.tick();return()=>w.destroy()}};
