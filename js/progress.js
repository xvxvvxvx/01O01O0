/* v2.8 guidance layer: always-visible next goal, first-session onboarding, future-reward preview, small early wins.
   It reuses the existing systems instead of adding a new economy:
   - STARTER GOALS (7 steps, shown first): small one-time rewards, tracked in their own signed key `0-100_v2.8_starter` (same pattern as Mastery / Perks).
     Total payout is deliberately tiny: $15 coin + 2 Gems across the whole path (Mastery Level 1 alone pays $250 + 1 Gem). Steps 5-7 point at Mastery, the Gem-Shop and Rank-Up and pay nothing extra.
   - After the starter path the goal is simply the next Rank-Up (Rank.status), so there is no second progression system.
   - Existing players (rank >= Copper or >= 40 rounds) get every starter goal silently marked claimed: no reward flood, no clutter. A tampered / unsigned starter key does the same.
   - Home: goal card + "Coming up" (next ranks, closest Mastery levels, next Mastery cosmetic, closest daily quest). Other pages: a slim dismissible goal strip.
   - Games: a one-time "How to play" tip per game and a glow on the main button until the first bet. Nothing secret (Pirate rewards, hidden cosmetics) is ever listed. */
const Goals=(()=>{
const KEY='0-100_v2.8_starter',HK='gold_hint_';
const gp=k=>{try{return localStorage.getItem(k)}catch(e){return null}},sp=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const keys=d=>Object.keys(d.g||{}).length,fmt=n=>(+n).toLocaleString('en-US'),cost=()=>(typeof CFG!=='undefined'&&CFG.CRATE&&CFG.CRATE.COST)||3;
const REC=['mines','crash','chicken','blackjack','flip','plinko','aviamasters','doubleornothing','cases','guessthecup'];
const NM=Object.fromEntries(typeof LIST!=='undefined'?LIST:[]);
const unplayed=()=>{const g=Store.d.g||{};return REC.find(k=>NM[k]&&!g[NM[k]])||'mines'};
const gname=k=>NM[k]?NM[k][0]+NM[k].slice(1).toLowerCase():k;
const playGo=()=>{const k=unplayed();return['#'+k,'Play '+gname(k)]};
const TIPS={plinko:'Drop a ball into the pins; it lands in a multiplier pocket. Edge pockets pay the most. Try Medium risk and 12 rows.',
mines:'Click tiles to reveal gems. Every gem raises your multiplier. Press Cash out before you hit a mine.',
crash:'The multiplier climbs until it crashes. Press Cash out before that. You can also set an auto cash-out.',
chicken:'Press Go to hop one lane. Every safe lane raises the payout. Cash out before a car hits you.',
flip:'Pick Heads or Tails. Every correct call doubles your multiplier, and you can cash out any time.',
aviamasters:'Launch the plane. Collect + and × items, dodge rockets and land on the carrier to win.',
doubleornothing:'One press: double your bet or lose it.',
blackjack:'Beat the dealer without going over 21. Blackjack pays 3 to 2 and the dealer stands on all 17s.',
cases:'Place a wager to open a case. The multiplier you land on is your payout; an X pays nothing.',
guessthecup:'Watch the ball, follow its cup, then pick a cup. A correct guess pays 2.5x.'};
const rwTxt2=i=>typeof rwTxt==='function'?rwTxt(i)+' Gems':'';
/* ---------- the starter path ---------- */
const S=[
{id:'bet',t:'Place your first bet',why:d=>`You start with $${Econ.fmt(d.balance)} of fictional 01O0coin. Pick a mini-game, keep the bet small and play one round.`,rw:{c:5},un:'Your rank, quest and Mastery progress start counting.',
p:d=>[Math.min(1,keys(d)),1,keys(d)?'First round played':'No rounds played yet'],go:playGo},
{id:'mix',t:'Try 3 different mini-games',why:'Every game pays differently. Try a few to find the ones you like.',rw:{g:1},un:'Each game also gets its own Mastery track.',
p:d=>[Math.min(3,keys(d)),3,Math.min(3,keys(d))+'/3 games tried'],go:playGo},
{id:'rounds',t:'Complete 10 mini-game rounds',why:'Rounds and profit fill your Rank-Up bars. Mines, Crash, Chicken and Blackjack count 1 round per game (Flip and Double or Nothing 5, Cases 3, Plinko 2,000 balls).',rw:{c:10},un:'That is a quarter of the rounds needed for Copper rank.',
p:d=>[Math.min(10,d.lq),10,Math.min(10,d.lq)+'/10 rounds'],go:()=>['#mines','Play Mines']},
{id:'daily',t:'Spin the Daily Wheel',why:'One free spin every 24 hours: coins, Gems or a 2X profit potion.',rw:{g:1},un:'Come back daily for another free spin.',
p:d=>[d.dl>0?1:0,1,d.dl>0?'Spun':'Ready to spin'],go:()=>['#dailyspin','Open the Daily Wheel']},
{id:'mastery',t:'Finish a Mastery level',why:'Every game has a Mastery track. Complete a level, then claim it on the Mastery page.',rwt:()=>'Coins and Gems from the Mastery page',un:'Levels 3, 6 and 10 of each track unlock exclusive cosmetics.',
p:d=>{if(Mastery.total()>=1)return[1,1,'Level complete'];const D=Mastery.read();let b=null;Mastery.tracks.forEach(t=>{if(t.col)return;const f=Math.min(1,D.c[t.id]/t.thr[0]);if(!b||f>b.f)b={f,t,c:D.c[t.id]}});return b?[Math.floor(b.f*100),100,`${b.t.name}: ${b.c}/${b.t.thr[0]}`]:[0,100,'']},go:()=>['#mastery','Open Mastery']},
{id:'crate',t:'Open your first crate',why:d=>d.gems>=cost()?`You have ${d.gems} Gems. One roll costs ${cost()} and gives a random cosmetic for your name.`:`A roll costs ${cost()} Gems (you have ${d.gems}). Earn Gems from quests, Mastery, the Daily Wheel and ranking up.`,rwt:()=>'A new cosmetic for your name',un:'Equip it in your Inventory.',
p:d=>[d.inv.length>0?1:0,1,d.inv.length?'Cosmetic owned':'No cosmetics yet'],go:d=>d.gems>=cost()?['#shop','Open the Gem-Shop']:['#quests','See your Quests']},
{id:'rank',t:'Reach Copper rank',why:'Ranking up gives fresh starting cash and Gems, and opens the next rank.',rwt:()=>rwTxt2(1),un:'The Rank-Up page shows every rank ahead.',
p:d=>{if(d.rk>=1)return[100,100,'Copper reached'];const s=Rank.status(),f=Math.min(s.coin/s.req.c,s.rounds/s.req.r,1);return[Math.floor(f*100),100,`$${Econ.fi(Math.min(s.coin,s.req.c))}/$${Econ.fi(s.req.c)} earned • ${Math.min(s.rounds,s.req.r)}/${s.req.r} rounds`]},go:()=>['#rankup','Go to Rank-Up']}];
const MASK=(1<<S.length)-1;
const wr=o=>Store.writeSigned(KEY,JSON.stringify(o));
function rd(){const r=Store.readSigned(KEY);if(r.status==='bad'||r.status==='legacy')return{k:MASK};if(r.raw==null)return null;try{return{k:Math.floor(Store.num(JSON.parse(r.raw).k,0))&MASK}}catch(e){return{k:MASK}}}
function state(){const d=Store.d;if(!d||!d.user)return null;let o=rd();if(!o){o={k:(d.lq>=40||d.rk>0)?MASK:0};wr(o)}
return{o,rows:S.map((s,i)=>{const[c,m,l]=s.p(d);return{s,i,c,m,l,done:c>=m,cl:!!(o.k&(1<<i))}})}}
const rwText=(s,html)=>{if(s.rw){const a=[];if(s.rw.c)a.push('$'+s.rw.c);if(s.rw.g)a.push((html?gemIcon(14)+' ':'')+s.rw.g+' Gem'+(s.rw.g>1?'s':''));return a.join(' + ')}return s.rwt?s.rwt():''};
/* the claimed bit is saved BEFORE paying, so a double click or crash can never pay twice */
function claim(i){Store.load();const x=state();if(!x)return{ok:false,msg:'No player'};const r=x.rows[i];if(!r)return{ok:false,msg:'Unknown goal'};if(!r.done)return{ok:false,msg:'Goal not complete yet'};if(r.cl)return{ok:false,msg:'Already claimed'};
x.o.k|=1<<i;wr(x.o);const w=r.s.rw||{};if(w.c)Econ.addCoins(w.c);if(w.g){Store.check();Store.d.gems+=w.g;Store.sync();Store.save()}try{App.bal()}catch(e){}return{ok:true,s:r.s,c:w.c||0,g:w.g||0}}
let seen=null;
/* completed goals: no-reward steps are marked off at once; reward steps toast once and wait for CLAIM */
function sweep(){const x=state();if(!x)return;if(seen===null)seen=new Set(x.rows.filter(r=>r.done&&!r.cl).map(r=>r.i));
x.rows.forEach(r=>{if(!r.done||r.cl)return;const fresh=!seen.has(r.i);
if(!r.s.rw){claim(r.i);if(fresh){seen.add(r.i);try{App.toast('Goal complete: '+r.s.t)}catch(e){}}}
else if(fresh){seen.add(r.i);try{App.toast(`Goal complete: ${r.s.t}! Claim your reward`)}catch(e){}}})}
/* the one goal shown right now */
function view(){const x=state();if(!x)return null;const cur=x.rows.find(r=>!r.cl),d=Store.d;
if(cur){const s=cur.s,go=s.go?s.go(d):null;return{kind:'starter',n:cur.i+1,total:S.length,title:s.t,why:typeof s.why==='function'?s.why(d):s.why,pct:cur.m?Math.min(100,Math.floor(cur.c/cur.m*100)):0,label:cur.l,reward:rwText(s,true),rewardTxt:rwText(s,false),unlock:s.un,go,claim:cur.done?cur.i:-1,rows:x.rows}}
const r=Rank.status();if(r.max)return{kind:'max',title:'Maximum rank reached',why:'Keep climbing Mastery levels and collecting cosmetics.',pct:100,label:'',reward:'',rewardTxt:'',unlock:'',go:['#mastery','Open Mastery'],claim:-1,rows:x.rows};
return{kind:'rank',title:'Reach '+r.next.n,why:'Earn profit and play rounds to fill both bars, then rank up for starting cash and Gems.',pct:Math.floor(Math.min(r.coin/r.req.c,r.rounds/r.req.r,1)*100),label:`$${Econ.fi(Math.min(r.coin,r.req.c))}/$${Econ.fi(r.req.c)} earned • ${Math.min(r.rounds,r.req.r)}/${r.req.r} rounds`,
reward:rwTxt2(r.idx+1).replace(/ Gems$/,' '+(typeof gemIcon==='function'?gemIcon(14):'')+' Gems'),rewardTxt:rwTxt2(r.idx+1),unlock:CFG.RANKS[r.idx+2]?'Then: '+CFG.RANKS[r.idx+2].n:'Then: the top ranks',go:['#rankup',r.ready?'Rank up now':'Open Rank-Up'],claim:-1,rows:x.rows}}
/* small wins between big ones: halfway + ready toasts, once per rank */
function milestones(){const d=Store.d;if(!d||!d.user)return;const s=Rank.status();if(s.max)return;const key='gold_ms_'+s.idx,v=+gp(key)||0,f=Math.min(s.coin/s.req.c,s.rounds/s.req.r);
if(s.ready&&v<2){sp(key,'2');App.toast(`Rank-Up ready! Open the Rank-Up page to become ${s.next.n}.`)}else if(!s.ready&&f>=.5&&v<1){sp(key,'1');App.toast(`Halfway to ${s.next.n}. Keep going!`)}}
const api={S,KEY,state,claim,sweep,view,rwText,milestones,TIPS,unplayed};
if(typeof document==='undefined'||typeof Dash==='undefined')return api;
/* ---------- rendering ---------- */
const stepList=v=>`<ul class="gl-list">${v.rows.map((r,i)=>`<li class="${r.cl?'d':v.kind==='starter'&&r.i+1===v.n?'c':''}"><span class="gl-ck">${r.cl?'✔':v.kind==='starter'&&r.i+1===v.n?'▶':'🔒'}</span><span>${r.s.t}</span><small>${rwText(r.s,true)}</small></li>`).join('')}</ul>`;
const how=()=>keys(Store.d)===0&&!gp('gold_how')?`<div class="gl-how"><b>How Gold works</b><ol><li><b>Play</b> mini-games with fictional 01O0coin.</li><li><b>Profit and rounds</b> fill your Rank-Up bars.</li><li><b>Rank up</b> for starting cash and ${gemIcon(14)} Gems, then spend Gems on tags and gradients.</li></ol><button type="button" class="btn dim" data-howx>Got it</button></div>`:'';
const act=v=>v.claim>=0?`<button type="button" class="btn gl-claim" data-gclaim="${v.claim}">CLAIM REWARD</button>`:v.go?`<a class="btn gl-go" href="${v.go[0]}">${v.go[1]} ›</a>`:'';
function homeHtml(v){return `<h3>🎯 Your Goal ›</h3>${how()}<div class="gl-top"><span class="gl-step">${v.kind==='starter'?`GETTING STARTED ${v.n}/${v.total}`:v.kind==='rank'?'NEXT RANK':'TOP RANK'}</span><b class="gl-name">${v.title}</b></div><p class="gl-why">${v.why}</p>${v.kind==='max'?'':Dash.bar(v.label||v.pct+'%',v.pct/100)}${v.reward?`<div class="gl-rw"><span>🎁 Reward: <b>${v.reward}</b></span>${v.unlock?`<span>${v.unlock}</span>`:''}</div>`:''}<div class="gl-act">${act(v)}</div>${v.kind==='starter'?stepList(v):''}`}
function comingUp(){const s=Rank.status(),R=CFG.RANKS;let h='<h3>🔭 Coming Up ›</h3><div class="up-cols"><div><h4>Next ranks</h4>';
if(s.max)h+='<p class="none">You are at the top rank!</p>';else for(let k=1;k<=3&&R[s.idx+k];k++){const i=s.idx+k,q=R[i-1].req;h+=`<div class="up-r${k>1?' lock':''}"><span>${k>1?'🔒 ':''}${Badge.txt(i)}</span><small>${q?`$${Econ.fi(q.c)} earned + ${q.r} rounds`:''}</small><small>Reward: ${rwTxt2(i).replace(/ Gems$/,' '+gemIcon(13)+' Gems')}</small></div>`}
h+='</div><div><h4>Closest Mastery levels</h4>';
const D=Mastery.read(),cand=Mastery.tracks.filter(t=>D.l[t.id]<Mastery.LV).map(t=>{const l=D.l[t.id],c=D.c[t.id],nx=t.thr[l];return{t,l,c,nx,f:Math.min(1,c/nx)}}).sort((a,b)=>b.f-a.f).slice(0,3);
h+=cand.length?cand.map(x=>`<div class="up-m"><small>${x.t.name} &rsaquo; Level ${x.l+1}</small>${Dash.bar(`${fmt(x.c)}/${fmt(x.nx)}`,x.f)}<small>$${Econ.fi(x.t.cash[x.l])} + ${x.t.gems[x.l]} ${gemIcon(12)}${Mastery.COSLV.includes(x.l+1)?' + cosmetic':''}</small></div>`).join(''):'<p class="none">Every Mastery level is complete!</p>';
let nc=null;Mastery.tracks.forEach(t=>Mastery.COSLV.forEach((L,ci)=>{if(L<=D.l[t.id])return;const c=Cos.by(t.cos[ci]);if(!c)return;const f=Math.min(1,D.c[t.id]/t.thr[L-1]);if(!nc||f>nc.f)nc={f,t,L,c,left:Math.max(0,t.thr[L-1]-D.c[t.id])}}));
h+='</div><div><h4>Next cosmetic reward</h4>';
h+=nc?`<div class="up-c"><div class="sprev">${prevHtml(nc.c)}</div><small>${nc.t.name}, Level ${nc.L}: ${fmt(nc.left)} ${nc.t.unit} to go. Limited and unsellable.</small></div>`:'<p class="none">Every Mastery cosmetic is unlocked!</p>';
Quests.sync();const dq=Quests.list('d').filter(q=>!Quests.claimed('d',q)).map(q=>({q,f:Quests.prog('d',q)/q.target})).sort((a,b)=>b.f-a.f)[0];
if(dq)h+=`<h4>Closest daily quest</h4><div class="up-m"><small>${dq.q.name}</small>${Dash.bar(`${Math.floor(dq.f*100)}%`,dq.f)}<small>Reward: ${dq.q.gems} ${gemIcon(12)} Gems</small></div>`;
return h+'</div></div>'}
const stripHtml=v=>`<span class="gb-i" aria-hidden="true">🎯</span><div class="gb-m"><b>${v.title}</b><span class="gb-p">${v.label}</span><i class="gb-bar"><i style="width:${v.pct}%"></i></i></div>${v.reward?`<span class="gb-r">${v.reward}</span>`:''}${v.claim>=0?`<button type="button" class="btn gb-a" data-gclaim="${v.claim}">CLAIM</button>`:v.go?`<a class="btn gb-a" href="${v.go[0]}">${v.go[1]}</a>`:''}<button type="button" class="gb-x" aria-label="Hide goal" data-gbx>×</button>`;
let gbx='',lastSig='',tickN=0;
const onHome=()=>{const k=location.hash.slice(1);return!(Games[k]||Pages[k])};
const sigOf=v=>v?[v.title,v.pct,v.claim,v.label,v.why].join('|'):'';
function strip(){const v=Store.d&&Store.d.user?view():null;let el=document.getElementById('goalbar');
if(!v||onHome()||v.kind==='max'||gbx===v.title){if(el)el.remove();document.body.classList.remove('has-gb');return}
if(!el){el=document.createElement('div');el.id='goalbar';el.setAttribute('role','status');const a=document.getElementById('app');a.parentNode.insertBefore(el,a)}
el.innerHTML=stripHtml(v);document.body.classList.add('has-gb')}
function paintHome(){const b=document.getElementById('gl-home');if(!b)return;const v=view();if(v)b.innerHTML=homeHtml(v)}
function refresh(force){const v=Store.d&&Store.d.user?view():null,s=sigOf(v)+'|'+location.hash;if(!force&&s===lastSig){if(++tickN%10===0&&document.getElementById('up-home'))document.getElementById('up-home').innerHTML=comingUp();return}
lastSig=s;strip();paintHome();const u=document.getElementById('up-home');if(u)u.innerHTML=comingUp()}
/* ---------- home ---------- */
const hm=Dash.home;
Dash.home=function(app){const c=hm.call(this,app);try{const cards=app.querySelector('.cards'),dash=app.querySelector('.dash');
if(cards&&Store.d.user){const g=document.createElement('section');g.className='dp gl';g.id='gl-home';g.setAttribute('aria-label','Your goal');cards.parentNode.insertBefore(g,cards);
if(dash){const u=document.createElement('section');u.className='dp upn';u.id='up-home';u.setAttribute('aria-label','Coming up');dash.insertAdjacentElement('afterend',u)}
if(keys(Store.d)===0){const k=app.querySelector('.c-'+unplayed());if(k){k.classList.add('rec');k.insertAdjacentHTML('afterbegin','<i class="badge rec-b">START HERE</i>')}}
lastSig='';refresh(true)}}catch(e){console.error(e)}return c};
/* ---------- games: one-time tip + glow on the main button ---------- */
function gameHints(){const k=location.hash.slice(1);if(!Games[k]||!Store.d.user)return;const side=document.querySelector('#gm .side');if(!side||side.querySelector('.fb-hint'))return;
const first=keys(Store.d)===0;if(!gp(HK+k)&&TIPS[k]){const h=document.createElement('div');h.className='fb-hint';
h.innerHTML=`<b>How to play</b><span>${TIPS[k]}${first?` You have $${Econ.fmt(Store.d.balance)}: start with a small bet.`:''}</span><button type="button" aria-label="Dismiss tip">×</button>`;
h.querySelector('button').onclick=()=>{sp(HK+k,'1');h.remove()};side.insertBefore(h,side.firstChild)}
const pb=first&&side.querySelector('#go,#pl,#h');if(pb)pb.classList.add('fb-glow')}
const rt=App.route;
App.route=function(){const r=rt.apply(this,arguments);try{sweep();gameHints();lastSig='';refresh(true)}catch(e){console.error(e)}return r};
const tk=Shell.tick;
Shell.tick=function(){const r=tk.apply(this,arguments);try{if(Store.d&&Store.d.user){sweep();milestones();refresh(false)}}catch(e){}return r};
/* ---------- clicks ---------- */
document.addEventListener('click',e=>{const t=e.target;if(!t||!t.closest)return;
const c=t.closest('[data-gclaim]');if(c){if(c.disabled)return;c.disabled=true;const r=claim(+c.dataset.gclaim);
if(r.ok){const p=[];if(r.c)p.push('+$'+r.c);if(r.g)p.push('+'+r.g+' Gem'+(r.g>1?'s':''));App.toast('Goal reward claimed: '+p.join(', '));try{FX.confetti(c.closest('.gl,#goalbar')||document.body,30)}catch(x){}}else App.toast(r.msg);
sweep();refresh(true);return}
if(t.closest('[data-howx]')){sp('gold_how','1');paintHome();return}
if(t.closest('[data-gbx]')){const v=view();if(v)gbx=v.title;strip()}});
return api})();
