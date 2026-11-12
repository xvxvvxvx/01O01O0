Games.blackjack={title:'BLACKJACK',mount(el){
if(!document.getElementById('stk-bj')){const s=document.createElement('style');s.id='stk-bj';s.textContent=`
.bj{background:radial-gradient(ellipse at 50% 45%,#1f8a52 0%,#14633f 55%,#0b3b27 100%);box-shadow:inset 0 0 70px #000b,inset 0 0 0 6px #5b3a1e;border-radius:14px;min-height:0;display:flex;flex-direction:column;justify-content:space-between;align-items:center;padding:20px}
.row{display:flex;gap:30px;justify-content:center;align-items:flex-end;min-height:140px}.col{display:flex;flex-direction:column;align-items:center;gap:6px}
.hand{display:flex}.pc{width:64px;height:92px;background:#fff;border-radius:8px;color:#0a0a0a;display:flex;flex-direction:column;align-items:center;padding:4px;font-weight:800;font-size:22px;margin-left:-30px;box-shadow:0 2px 6px #0006}
.pc:first-child{margin-left:0}.pc.rd{color:#ef4144}.pc i{font-style:normal;font-size:15px}.pc span{font-size:28px;margin-top:4px}
.pc.back{background:repeating-linear-gradient(45deg,#2563eb 0 6px,#1d4ed8 6px 12px)}#dl .pc.dl{animation:dnd .55s ease-out}#pl .pc.dl{animation:dnp .55s ease-out}@keyframes dnd{from{transform:translate(-420px,150px) rotate(-25deg);opacity:0}30%{opacity:1}}@keyframes dnp{from{transform:translate(-420px,-150px) rotate(-25deg);opacity:0}30%{opacity:1}}
.tp{background:#2a2a2a;color:#fff;border-radius:999px;padding:2px 14px;font-size:13px;font-weight:700}.hg .tp{background:#16a34a}.hg .tp.bust,.tp.bust{background:#b91c1c}
.hg.act .pc{outline:3px solid #22c55e}.rib{background:#1a1a1a;color:#ffffff;padding:8px 46px;text-align:center;font-size:12px;font-weight:700;display:flex;flex-direction:column;gap:4px;border-radius:4px}
.bjb{display:grid;grid-template-columns:1fr 1fr;gap:8px}.bg{background:#15803d;color:#fff}.by{background:#a16207;color:#fff}`;document.head.appendChild(s)}
el.innerHTML=`<div class="play"><div class="side"><label>Bet Amount</label>${App.betHTML()}<div class="bjb"><button class="btn bg" id="hit" disabled>Hit</button><button class="btn by" id="stand" disabled>Stand</button><button class="btn dim" id="sp" disabled>Split</button><button class="btn dim" id="dbl" disabled>Double</button></div><button class="btn" id="go">Bet</button><div class="hist" id="bi">Blackjack pays 3 to 2. Dealer stands on all 17s.</div></div><div class="stage bj"><div class="row" id="dl"></div><div class="rib"><b>BLACKJACK PAYS 3 TO 2</b><span>DEALER STANDS ON ALL 17s</span></div><div class="row" id="pl"></div></div></div>`;
const q=s=>el.querySelector(s),RK=['A','2','3','4','5','6','7','8','9','10','J','Q','K'],SU=['♠','♥','♦','♣'],BUST={12:31,13:39,14:56,15:58,16:62,17:69,18:77,19:85,20:92,21:100};
let shoe=[],uid=0,seen=0,dealer=[],hands=[],cur=0,phase='idle',hole=true,split=false,tm=[];const T=(f,ms)=>tm.push(setTimeout(f,ms));
function draw(){if(shoe.length<52){shoe=[];for(let d=0;d<6;d++)for(const s of SU)for(const r of RK)shoe.push({r,s});for(let i=shoe.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[shoe[i],shoe[j]]=[shoe[j],shoe[i]]}}const c=shoe.pop();c.id=++uid;return c}
const val=c=>c.r==='A'?11:(c.r==='10'||'JQK'.includes(c.r))?10:+c.r;
function tot(cs){let v=0,a=0;cs.forEach(c=>{v+=val(c);if(c.r==='A')a++});while(v>21&&a){v-=10;a--}return{v,soft:a>0}}
const card=(c,hide)=>hide?'<div class="pc back"></div>':`<div class="pc ${'♥♦'.includes(c.s)?'rd':''} ${c.id>seen?'dl':''}"><b>${c.r}</b><i>${c.s}</i><span>${c.s}</span></div>`;
function render(){const dt=dealer.length?tot(hole?[dealer[0]]:dealer).v:'';
q('#dl').innerHTML=dealer.length?`<div class="col"><div class="tp ${dt>21?'bust':''}">${dt}</div><div class="hand">${dealer.map((c,i)=>card(c,hole&&i===1)).join('')}</div></div>`:'';
q('#pl').innerHTML=hands.map((h,i)=>{const t=tot(h.c).v;return `<div class="col hg ${phase==='play'&&i===cur?'act':''}"><div class="tp ${t>21?'bust':''}">${t}</div><div class="hand">${h.c.map(c=>card(c)).join('')}</div><small style="color:#ffffff">$${App.f(h.bet)}</small></div>`}).join('');seen=uid}
function ctl(){const p=phase==='play',h=hands[cur];q('#hit').disabled=q('#stand').disabled=!p;
q('#dbl').disabled=!(p&&h.c.length===2&&Store.d.balance>=h.bet-1e-9);q('#sp').disabled=!(p&&hands.length===1&&h.c.length===2&&val(h.c[0])===val(h.c[1])&&Store.d.balance>=h.bet-1e-9);
q('#go').disabled=!(phase==='idle'||phase==='over');
if(p){const t=tot(h.c);q('#bi').textContent=`Bust chance if you hit: ${t.soft||t.v<=11?0:BUST[t.v]||100}%`}else q('#bi').textContent='Blackjack pays 3 to 2. Dealer stands on all 17s.'}
function take(a){if(a>Store.d.balance+1e-9){App.toast('Not enough Steakcoin');return false}Store.d.balance=Math.round((Store.d.balance-a)*100)/100;if(App.live)App.live.bet+=a;Store.save();App.bal();return true}
function end(){phase='over';hole=false;App.live=null;const d=tot(dealer),dBJ=dealer.length===2&&d.v===21;let net=0;
hands.forEach((h,hi)=>{const t=tot(h.c),nat=!split&&h.c.length===2&&t.v===21;let pay=0;
if(t.v>21)pay=0;else if(nat)pay=dBJ?h.bet:h.bet*2.5;else if(dBJ)pay=0;else if(d.v>21||t.v>d.v)pay=h.bet*2;else if(t.v===d.v)pay=h.bet;
App.settle('BLACKJACK',h.bet,pay,hi>0?{noCount:true}:undefined);net+=pay-h.bet});
App.toast(net>0?`You won +$${App.f(net)}`:net<0?`Lost $${App.f(-net)}`:'Push: bet returned');render();ctl()}
function dealerPlay(){phase='dealer';hole=false;render();ctl();const step=()=>{if(hands.some(h=>tot(h.c).v<=21)&&tot(dealer).v<17){dealer.push(draw());render();T(step,650)}else T(end,500)};T(step,600)}
function next(){cur++;while(cur<hands.length&&(hands[cur].done||tot(hands[cur].c).v>=21))cur++;if(cur>=hands.length)dealerPlay();else{render();ctl()}}
q('#go').onclick=()=>{if(phase!=='idle'&&phase!=='over')return;const b=App.bet(el,'BLACKJACK');if(!b)return;dealer=[];hands=[{c:[],bet:b}];split=false;cur=0;hole=true;phase='dealing';ctl();render();
[()=>hands[0].c.push(draw()),()=>dealer.push(draw()),()=>hands[0].c.push(draw()),()=>dealer.push(draw())].forEach((fn,i)=>T(()=>{fn();render()},i*350+100));
T(()=>{if(tot(hands[0].c).v===21||tot(dealer).v===21){hole=false;phase='dealer';render();T(end,700)}else{phase='play';render();ctl()}},1600)};
q('#hit').onclick=()=>{const h=hands[cur];h.c.push(draw());render();if(tot(h.c).v>=21){h.done=true;phase='busy';ctl();T(()=>{phase='play';next()},500)}else ctl()};
q('#stand').onclick=()=>{hands[cur].done=true;next()};
q('#dbl').onclick=()=>{const h=hands[cur];if(!take(h.bet))return;h.bet*=2;h.c.push(draw());h.done=true;phase='busy';render();ctl();T(()=>{phase='play';next()},600)};
q('#sp').onclick=()=>{const h=hands[cur];if(!take(h.bet))return;split=true;const[a,b]=h.c;hands=[{c:[a,draw()],bet:h.bet},{c:[b,draw()],bet:h.bet}];cur=0;render();if(tot(hands[0].c).v>=21){phase='busy';T(()=>{phase='play';cur=-1;next()},500)}ctl()};
return()=>tm.forEach(clearTimeout)}};
