(()=>{
/* Aviamasters. plan() odds are unchanged from v2.95 (about 101% return). History (condensed): v2.6 faster + Turbo; v2.6b/v2.5 item/soft-cap economy; v2.9 jackpot ladder; v2.95 jackpot ranges + smooth landing-chances dropdown.
   Landings BELOW 1x are not profit (red, counted as a loss). Rank speed (CFG.AVI_SPEED) only scales the animation clock; plan() is rolled before any animation and never sees the speed.
   Everything the player SEES is drawn from the plan produced by plan(); none of it feeds back into the outcome.
   v2.95 add-on: the 250-300x jackpot is now the PIRATE SHIP event: the plane lands on a pirate ship, the Pirate Token discovery overlay (js/addon295.js) plays, and the player gets ONE roll
   from the exact Pirate Token reward pool (Perks.roll / Perks.grant, js/pirate.js). A "Pirate Ship Rewards" dropdown lists that pool with live previews. */
const N=8,DS=110,START=49,DRIFT=3,RDROP=8,BOOST=3,FUEL=5,PR=.3,M0=1,D=(N+1)*DS,RTP_NOTE='about 101%';
const TURBO=[1,2,3],CLK=[.63,.88,1.26],MAXCLK=9,FLIGHT_CLK_S=8.83;
const SOFT=2,SOFTK=.01,disp=x=>x<=SOFT?x:SOFT+(x-SOFT)*SOFTK;
const SLIDE=[.03,.05,.07,.1];
const V=[['+',.34,35],['+',.52,6],['+',.85,.8],['+',1.3,.15],['×',1.25,2.5],['×',1.35,1],['×',1.45,.3],['f',0,42]],TOT=V.reduce((a,b)=>a+b[2],0);
/* JP = [min x, max x, chance per landed flight]; the payout is drawn uniformly inside the range (2 decimals). A jackpot never slides off the runway. 250-300x = PIRATE SHIP (the rarest result and the hard maximum). */
const JP=[[250,300,.0002],[100,250,.00022],[50,100,.0003],[25,50,.0008],[10,25,.002]],MAXX=300,CRASH_P=.0579,LAND=1-CRASH_P,SHIPX=250;
const jackpot=()=>{let r=Math.random();for(const[lo,hi,p]of JP){if(r<p)return Math.round((lo+Math.random()*(hi-lo))*100)/100;r-=p}return 0};
const nameOf=(lo,hi)=>(lo>=SHIPX?'Pirate Ship ':'Jackpot ')+lo+'–'+hi+'x';
const CHANCES=[['Crashed into the sea',5.79,'l'],['Slid off the runway',2.83,'l'],['Landed under 1x (loss)',55.04,'l'],['Landed 1x to 2x',27.36,'w'],['Landed 2x or more',8.63,'w']].concat(JP.slice().reverse().map(([lo,hi,p])=>[nameOf(lo,hi),p*LAND*100,'j']));
const oneIn=p=>'1 in '+(+(100/p).toPrecision(2)).toLocaleString('en-US'),fp=v=>(v>=1?v.toFixed(1):v>=.1?v.toFixed(2):v.toFixed(4))+'%';
const chancesHtml=()=>'<table>'+CHANCES.map(([n,p,c],i)=>`<tr class="${c}${c==='j'&&i===CHANCES.length-1?' top':''}"><td>${n}${c==='j'?' ('+oneIn(p)+')':''}</td><td>${fp(p)}</td></tr>`).join('')+'</table><small>Measured over 8 million simulated flights (jackpot rows are exact; each jackpot pays a random multiplier inside its range). Only a flight that reaches the carrier can roll a jackpot, and it never slides off. The Pirate Ship 250–300x is the rarest result and the maximum.</small>';
const aviSpeed=rk=>{for(const[r,s]of CFG.AVI_SPEED)if(rk>=r)return s;return 1};
const pick=()=>{let r=Math.random()*TOT;for(const v of V)if((r-=v[2])<0)return v;return V[0]};
/* developer-only: guarantees the NEXT flight is a Pirate Ship landing. Refused (and ignored) unless DEVENV() is true on every call. */
let devShip=0;const devOK=()=>{try{return typeof DEVENV==='function'&&DEVENV()}catch(e){return false}};
function plan(){
if(devShip&&devOK()){devShip=0;const jp=Math.round((SHIPX+Math.random()*(MAXX-SHIPX))*100)/100;return{ev:[],pts:[[0,2],[45,START],[D,40]],crash:false,m:jp,jp,fall:false}}
let alt=START,m=M0,pts=[[0,2],[45,START]],ev=[];
for(let i=1;i<=N;i++){const d=i*DS,ab=alt-DRIFT;
if(ab<=0){const p=pts[pts.length-1],dc=p[0]+p[1]/(p[1]-ab)*(d-p[0]);pts.push([dc,0]);return{ev,pts,crash:true,dc,m}}
pts.push([d,ab]);const e={d,altB:ab};
if(Math.random()<PR){e.k='r';m/=2;alt=ab-RDROP}else{const v=pick();if(v[0]==='f'){e.k='f';alt=ab+FUEL}else{e.k='m';e.op=v[0];e.v=v[1];m=v[0]==='+'?m+v[1]:m*v[1];alt=ab+BOOST}}
e.m=disp(m);ev.push(e);if(alt<=0){pts.push([d+20,0]);return{ev,pts,crash:true,dc:d+20,m}}pts.push([d+20,alt])}
alt-=DRIFT;if(alt<=0){pts.push([D,0]);return{ev,pts,crash:true,dc:D,m}}const mm0=Math.min(disp(m),MAXX),jp=jackpot(),mm=jp||mm0;pts.push([D,alt]);return{ev,pts,crash:false,m:mm,jp,fall:!jp&&Math.random()<(mm0<2.5?SLIDE[0]:mm0<5?SLIDE[1]:mm0<7?SLIDE[2]:SLIDE[3])}}
const altAt=(pts,x)=>{for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];if(x<b[0])return a[1]+(b[1]-a[1])*Math.max(0,(x-a[0])/(b[0]-a[0]))}return pts[pts.length-1][1]};
Games.aviamasters={title:'AVIAMASTERS',plan,PR,SLIDE,JP,CHANCES,chancesHtml,aviSpeed,TURBO,CLK,FLIGHT_CLK_S,armShip(){if(!devOK())return false;devShip=1;return true},mount(el){
if(!document.getElementById('stk-avi')){const s=document.createElement('style');s.id='stk-avi';s.textContent=`.avh{display:flex;flex-wrap:wrap;gap:6px}.avc{font-size:12px;font-weight:900;padding:2px 10px;border-radius:999px;border:2px solid}.avc.w{color:#4ade80;border-color:#22c55e}.avc.l{color:#f87171;border-color:#ef4444}#go .spd{display:inline-block;margin-left:8px;padding:1px 8px;border-radius:999px;border:2px solid currentColor;font-size:12px;font-weight:900;vertical-align:1px}`;document.head.appendChild(s)}
const rewards=()=>{try{return typeof Pv295!=='undefined'&&typeof Perks!=='undefined'?Pv295.list():''}catch(e){return ''}};
el.innerHTML=`<div class="play"><div class="side"><label>Wager</label>${App.betHTML()}<button class="btn" id="go">Launch plane</button><button class="btn dim" id="tb" title="Sets the animation speed (visual only: odds never change)">Turbo: 1x</button><div class="hist">Grab +n and ×1.25–×1.45 items to grow the multiplier (growth slows above 2x); fuel cans lift the plane without adding any. Rockets halve it and knock the plane down. Land on the carrier to win (max 300x), but the plane can still slide off the runway. Hit the sea and you lose your wager. Landing below 1x is a loss (shown in red). Roughly 36% of flights finish in profit. Return to player: ${RTP_NOTE}. Turbo only changes the animation speed (a flight takes about 14 s on 1x, 10 s on 2x, 7 s on 3x before rank speed); Space or the Launch button starts the next flight straight after a result.</div><div class="hist" id="lw">Last win: $0.00</div><div class="hist">Recent flights:</div><div class="avh" id="ah"></div><div class="hist" id="as">Session: 0 flights</div><details class="avp" open><summary>Landing chances (per flight)</summary><div class="avp-body">${chancesHtml()}</div></details><details class="avp"><summary>Pirate Ship Rewards</summary><div class="avp-body"><p class="pvn">A Pirate Ship landing (250–300x) gives one Pirate Token reward, rolled from exactly the same pool as Pirate Tokens in Cases.</p>${rewards()}</div></details></div><div class="stage"><canvas width="800" height="420"></canvas></div></div>`;
/* clean open/close animation for the dropdowns (height + fade; instant under prefers-reduced-motion; safe against rapid clicks) */
el.querySelectorAll('.avp').forEach(dt=>{const bd=dt.querySelector('.avp-body'),sm=dt.querySelector('summary');
if(dt&&bd&&sm){let busy=null;const RMo=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}};
bd.style.height='auto';
const done=open=>{if(busy){clearTimeout(busy);busy=null}if(!open)dt.removeAttribute('open');bd.style.height=open?'auto':'0px'};
sm.addEventListener('click',e=>{e.preventDefault();const open=dt.hasAttribute('open')&&!dt.classList.contains('avp-closing');
if(RMo()){if(open)dt.removeAttribute('open');else{dt.setAttribute('open','');bd.style.height='auto'}return}
if(busy){clearTimeout(busy);busy=null}
if(open){dt.classList.add('avp-closing');bd.style.height=bd.scrollHeight+'px';void bd.offsetHeight;bd.style.height='0px';bd.style.opacity='0';busy=setTimeout(()=>{dt.classList.remove('avp-closing');bd.style.opacity='';done(false)},300)}
else{dt.classList.remove('avp-closing');dt.setAttribute('open','');bd.style.opacity='';bd.style.height='0px';void bd.offsetHeight;bd.style.height=bd.scrollHeight+'px';busy=setTimeout(()=>done(true),300)}})}});
const cv=el.querySelector('canvas'),c=cv.getContext('2d'),go=el.querySelector('#go'),tbb=el.querySelector('#tb'),lw=el.querySelector('#lw'),W=800,H=420,SEA=345,PX=3,PXX=230,f=a=>SEA-10-a*5.2,DECK=f(2);
let px=PXX,vy=0,tl=0,st='idle',dist=0,P=null,bet=0,idx=0,mHud=1,pops=[],parts=[],puffs=[],trail=[],amb=[],shake=0,py=DECK,gy=0,gv=0,gt=0,pyv=DECK,prevV=DECK,angS=0,hold=0,raf=0,last=performance.now(),hist=[],fl=0,net=0,best=0,streak=0,tb=0,sp=aviSpeed(Store.d.rk),shipBusy=false;
const goTxt=()=>{go.innerHTML='Launch plane <span class="spd" title="Animation speed for your rank">'+sp+'x</span>'},tbTxt=()=>{tbb.textContent='Turbo: '+TURBO[tb]+'x'};
tbb.onclick=()=>{tb=(tb+1)%TURBO.length;tbTxt()};
const stars=Array.from({length:70},()=>[Math.random()*W,Math.random()*250,Math.random()*1.4+.4]);
const spr=document.createElement('canvas');spr.width=spr.height=64;{const g=spr.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.45,'rgba(255,255,255,.4)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64)}
function cloud(w,h,seed){const cv2=document.createElement('canvas');cv2.width=w;cv2.height=h;const g=cv2.getContext('2d');let s=seed;const r=()=>{s=(s*16807)%2147483647;return s/2147483647};
const L=Array.from({length:8+Math.floor(r()*5)},()=>({x:w*.14+r()*w*.72,y:h*.5+(r()-.5)*h*.26,rx:w*(.1+r()*.12),ry:h*(.2+r()*.2)}));
g.fillStyle='rgba(70,100,165,.55)';L.forEach(l=>{g.beginPath();g.ellipse(l.x,l.y+h*.1,l.rx,l.ry*.9,0,0,7);g.fill()});
L.forEach(l=>{const gr=g.createRadialGradient(l.x-l.rx*.25,l.y-l.ry*.55,2,l.x,l.y,Math.max(l.rx,l.ry)*1.1);gr.addColorStop(0,'rgba(255,255,255,.96)');gr.addColorStop(.55,'rgba(205,224,252,.82)');gr.addColorStop(1,'rgba(150,180,228,0)');g.fillStyle=gr;g.beginPath();g.ellipse(l.x,l.y,l.rx,l.ry,0,0,7);g.fill()});
g.globalCompositeOperation='destination-out';const fade=g.createLinearGradient(0,h*.78,0,h);fade.addColorStop(0,'rgba(0,0,0,0)');fade.addColorStop(1,'rgba(0,0,0,.9)');g.fillStyle=fade;g.fillRect(0,h*.78,w,h*.22);return cv2}
const sprites=[1,2,3,4,5].map(i=>cloud(260,110,i*7919+13)),LAY=[{sp:.1,sc:.55,a:.28},{sp:.28,sc:1,a:.5},{sp:.55,sc:1.5,a:.75}];
const clouds=LAY.flatMap((L,li)=>Array.from({length:li===0?9:li===1?7:4},()=>({li,s:Math.floor(Math.random()*5),x:Math.random()*1300,y:(li===2?150:25)+Math.random()*(li===2?150:200)})));
const burst=(x,y,col,n)=>{for(let i=0;i<n;i++){const a=Math.random()*6.28,v=40+Math.random()*160;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,l:1,c:col})}};
const chips=()=>{el.querySelector('#ah').innerHTML=hist.slice(0,8).map(h=>h.w?`<span class="avc w">${h.m.toFixed(2)}x</span>`:h.landed?`<span class="avc l" title="Landed below 1x: a loss">${h.m.toFixed(2)}x</span>`:`<span class="avc l">Lost</span>`).join('');el.querySelector('#as').textContent=`Session: ${hist.length} flight${hist.length===1?'':'s'} • net ${net>=0?'+':'-'}$${App.f(Math.abs(net))} • best ${best?best.toFixed(2)+'x':'none yet'} • streak ${streak}`};
/* Pirate Ship: ONE roll from the Pirate Token reward pool, applied immediately (same tick as the payout, before any animation), then the discovery overlay + the Pirate Token reward reel play */
function pirateShip(pr,m){let perk=null;try{perk=Perks.grant(Perks.roll());if(typeof Mastery!=='undefined')Mastery.add('pt',1)}catch(e){console.error(e)}
if(!perk||typeof PirateShip295==='undefined')return;shipBusy=true;go.disabled=true;PirateShip295.run({m,profit:pr,perk},()=>{shipBusy=false;go.disabled=false})}
function finish(win){const pay=win?bet*P.m:0,pr=pay-bet;App.settle('AVIAMASTERS',bet,pay);lw.textContent='Last win: $'+App.f(pay);hist.unshift({w:win&&P.m>=1,landed:win,m:P.m});net+=pr;if(win&&P.m>=1&&P.m>best)best=P.m;streak=win&&P.m>=1?streak+1:0;chips();
if(win&&P.m>=1){FX.confetti(cv.parentNode,P.jp?150:40);App.toast(pr>=0?`Landed! +$${App.f(pr)} profit at ${P.m.toFixed(2)}x`:`Landed at ${P.m.toFixed(2)}x: lost $${App.f(-pr)}`)}else if(win){App.toast(`Landed at ${P.m.toFixed(2)}x: lost $${App.f(-pr)}`)}
else App.toast(P.fall?'Fell off the runway! Lost $'+App.f(bet):'Crashed into the sea! Lost $'+App.f(bet));
pops.push(win?{t:(P.jp>=SHIPX?'PIRATE SHIP ×':P.jp?'JACKPOT ×':'LANDED ×')+P.m.toFixed(2),x:W/2,y:170,a:0,c:P.jp?'#fde047':P.m>=1?'#4ade80':'#f87171',s:P.jp?54:40}:{t:P.fall?'SLID OFF!':'CRASHED!',x:W/2,y:170,a:0,c:'#f87171',s:40});
st='end';hold=0;go.disabled=false;
if(win&&P.jp>=SHIPX)pirateShip(pr,P.m)}
function update(dt){
if(Math.random()<.035)amb.push({x:W+30,y:40+Math.random()*270,v:90+Math.random()*130});amb.forEach(a=>a.x-=a.v*dt);amb=amb.filter(a=>a.x>-120);
if(st==='fly'){dist+=130*dt;py=f(altAt(P.pts,dist));
gt-=dt;if(gt<=0){gv+=(Math.random()-.5)*170;gt=.45+Math.random()*1.3}gv+=(-gy*30-gv*5)*dt;gy=Math.max(-10,Math.min(10,gy+gv*dt));
while(idx<P.ev.length&&P.ev[idx].d<=dist){const e=P.ev[idx++];mHud=e.m;if(e.k==='r'){shake=14;burst(PXX,py,'#fb923c',26);pops.push({t:'÷2',x:PXX,y:py-24,a:0,c:'#f87171'})}else pops.push({t:e.k==='f'?'FUEL':e.op+e.v,x:PXX,y:py-24,a:0,c:e.k==='f'?'#fbbf24':'#4ade80'})}
if(P.crash&&dist>=P.dc)st='crashing';else if(!P.crash&&dist>=D-30){st='landing';hold=0;tl=0;if(P.jp){mHud=P.m;shake=12;burst(PXX,py,'#fde047',44)}}}
else if(st==='crashing'){dist+=80*dt;py+=360*dt;gy*=.9;if(py>=SEA-6){burst(PXX,SEA-4,'#7dd3fc',30);shake=10;finish(false)}}
else if(st==='landing'){gy*=.85;tl+=dt;const q=Math.min(1,tl/1.1),e2=1-(1-q)*(1-q);px=PXX+(P.fall?232:150)*e2;py+=(DECK-py)*Math.min(1,dt*7);if(q>=1){if(P.fall){st='falling';vy=0}else{hold+=dt;if(hold>.35)finish(true)}}}
else if(st==='falling'){vy+=800*dt;py+=vy*dt;px+=70*dt;if(py>=SEA-6){burst(px,SEA-4,'#fb923c',44);burst(px,SEA-4,'#fde047',26);burst(px,SEA-4,'#7dd3fc',20);shake=18;finish(false)}}
else if(st==='end'){hold+=dt;if(hold>1.4){st='idle';dist=0;P=null;px=PXX;py=DECK;gy=gv=0;puffs=[];trail=[];mHud=1;go.disabled=shipBusy}}
pyv=py+gy;const tv=Math.max(-.5,Math.min(.5,(pyv-prevV)/Math.max(dt,.001)/420));prevV=pyv;angS+=(tv-angS)*Math.min(1,dt*8);
if(st==='fly'){trail.push({d:dist,y:pyv});if(trail.length>80)trail.shift();puffs.push({d:dist-10,y:pyv+3,a:1,r:5+Math.random()*4,k:0})}
else if(st==='crashing'||st==='falling'){puffs.push({d:dist,y:pyv,a:1,r:6+Math.random()*6,k:1,x:px})}
fl+=dt;parts.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=500*dt;p.l-=dt*1.1});parts=parts.filter(p=>p.l>0);
pops.forEach(p=>{p.a+=dt*1.1;p.y-=30*dt});pops=pops.filter(p=>p.a<1);puffs.forEach(p=>p.a-=dt*.75);puffs=puffs.filter(p=>p.a>0)}
function missile(x,y,t,s=1,al=1,sd=0){c.save();
for(let j=15;j>=1;j--){const u=j/15,sx=x+18*s+j*10*s,sy=y+Math.sin(t*4+j*.8+sd)*j*.55*s,r=(3+u*12)*s;c.globalAlpha=al*.4*(1-u)*(1-u*.25);c.drawImage(spr,sx-r,sy-r,r*2,r*2)}
c.globalAlpha=al;c.translate(x,y);c.scale(s,s);const fk=.75+Math.sin(t*38+sd*3)*.25+Math.random()*.15;
c.globalCompositeOperation='lighter';const eg=c.createRadialGradient(20,0,0,20,0,18);eg.addColorStop(0,'rgba(255,200,90,.8)');eg.addColorStop(1,'rgba(255,90,20,0)');c.fillStyle=eg;c.beginPath();c.arc(20,0,18,0,7);c.fill();c.globalCompositeOperation='source-over';
c.fillStyle='#fb923c';c.beginPath();c.moveTo(16,-4);c.quadraticCurveTo(16+26*fk,0,16,4);c.fill();c.fillStyle='#fef08a';c.beginPath();c.moveTo(16,-2.2);c.quadraticCurveTo(16+14*fk,0,16,2.2);c.fill();
c.fillStyle='#b91c1c';c.beginPath();c.moveTo(8,-5);c.lineTo(19,-12);c.lineTo(17,-4);c.moveTo(8,5);c.lineTo(19,12);c.lineTo(17,4);c.fill();
const bg=c.createLinearGradient(0,-6,0,6);bg.addColorStop(0,'#ff6b6b');bg.addColorStop(.5,'#ef4444');bg.addColorStop(1,'#991b1b');c.fillStyle=bg;c.beginPath();c.moveTo(-14,-5);c.lineTo(16,-5);c.lineTo(16,5);c.lineTo(-14,5);c.closePath();c.fill();
c.fillStyle='#f1f5f9';c.fillRect(-2,-5,5,10);c.fillRect(8,-5,2,10);c.beginPath();c.moveTo(-14,-5);c.lineTo(-27,0);c.lineTo(-14,5);c.closePath();c.fill();c.fillStyle='#fde047';c.beginPath();c.arc(-8,0,1.8,0,7);c.fill();c.restore()}
function plane(x,y,a,t){c.save();c.translate(x,y);c.rotate(a);
c.fillStyle='#8f0e19';c.beginPath();c.moveTo(-26,-2);c.lineTo(-42,-22);c.lineTo(-33,-22);c.lineTo(-20,-6);c.closePath();c.fill();c.fillStyle='#b4121f';c.beginPath();c.moveTo(-34,0);c.lineTo(-46,4);c.lineTo(-30,5);c.closePath();c.fill();
c.fillStyle='#fbbf24';c.beginPath();c.moveTo(-38,-16);c.lineTo(-34,-16);c.lineTo(-31,-12);c.lineTo(-36,-12);c.closePath();c.fill();
c.fillStyle='#9ca3af';c.fillRect(1,7,2,8);c.fillStyle='#111';c.beginPath();c.arc(2,16,3.4,0,7);c.fill();c.fillStyle='#374151';c.beginPath();c.arc(2,16,1.2,0,7);c.fill();
c.fillStyle='#9d0f1e';c.beginPath();c.moveTo(-2,3);c.lineTo(-18,13);c.lineTo(-8,14);c.lineTo(14,4);c.closePath();c.fill();
const fg=c.createLinearGradient(0,-12,0,11);fg.addColorStop(0,'#ff5d6c');fg.addColorStop(.45,'#e11d2f');fg.addColorStop(1,'#7f0d19');c.fillStyle=fg;c.beginPath();c.moveTo(-36,-2);c.bezierCurveTo(-28,-12,10,-14,27,-6);c.bezierCurveTo(33,-3,33,3,27,6);c.bezierCurveTo(10,12,-28,9,-36,3);c.closePath();c.fill();
c.strokeStyle='#fbbf24';c.lineWidth=2;c.beginPath();c.moveTo(-30,2);c.bezierCurveTo(-10,6.5,12,6.5,27,2);c.stroke();c.strokeStyle='#00000033';c.lineWidth=.8;c.beginPath();c.moveTo(-14,-9);c.lineTo(-14,7);c.moveTo(14,-9);c.lineTo(14,6);c.stroke();
const cg=c.createLinearGradient(0,-13,0,-4);cg.addColorStop(0,'#bfe3ff');cg.addColorStop(1,'#1e3a5f');c.fillStyle=cg;c.beginPath();c.moveTo(-2,-8);c.quadraticCurveTo(6,-17,16,-7);c.lineTo(-2,-7);c.closePath();c.fill();c.fillStyle='#ffffff99';c.beginPath();c.ellipse(5,-11,4,1.6,-.4,0,7);c.fill();
c.fillStyle='#c4142a';c.beginPath();c.moveTo(-1,-1);c.lineTo(-16,-12);c.lineTo(-8,-12);c.lineTo(12,-2);c.closePath();c.fill();
c.fillStyle='#4b5563';c.beginPath();c.ellipse(29,0,4,6.5,0,0,7);c.fill();c.fillStyle='#d1d5db';c.beginPath();c.arc(32,0,2.2,0,7);c.fill();
c.fillStyle='rgba(226,232,240,.35)';const pr=Math.sin(t*60)*3;c.beginPath();c.ellipse(33,0,2.4,14+pr,0,0,7);c.fill();c.fillStyle='rgba(15,23,42,.55)';c.fillRect(32.2,-13,1.6,26);
c.fillStyle=Math.sin(t*5)>0?'#fb7185':'#7f1d1d';c.beginPath();c.arc(-44,3.6,1.5,0,7);c.fill();c.restore()}
function carrier(x){c.fillStyle='#16213a';c.fillRect(x-110,SEA-6,250,28);c.fillStyle='#2f3f5e';c.fillRect(x-110,SEA-12,250,8);c.fillStyle='#94a3b8';for(let i=0;i<9;i++)c.fillRect(x-100+i*27,SEA-9,14,2);c.fillStyle='#1f2d4a';c.fillRect(x+90,SEA-34,26,22);c.fillStyle='#fde047';c.fillRect(x+98,SEA-28,10,4)}
/* v2.95 add-on: pirate ship that replaces the carrier on a Pirate Ship (250-300x) landing. Deck is at the same height as the carrier's, so the existing landing physics are unchanged. */
function ship(x){const t=performance.now()/1000,w=Math.sin(t*2)*4;
c.fillStyle='#24140a';c.beginPath();c.moveTo(x-125,SEA-12);c.lineTo(x+150,SEA-12);c.quadraticCurveTo(x+140,SEA+22,x+95,SEA+22);c.lineTo(x-90,SEA+22);c.quadraticCurveTo(x-130,SEA+10,x-125,SEA-12);c.fill();
c.fillStyle='#5a3416';c.fillRect(x-125,SEA-14,275,5);c.strokeStyle='#00000066';c.lineWidth=1;for(let i=0;i<9;i++){c.beginPath();c.moveTo(x-110+i*30,SEA-9);c.lineTo(x-110+i*30,SEA+20);c.stroke()}
c.fillStyle='#d4a017';for(let i=0;i<4;i++){c.beginPath();c.arc(x-80+i*50,SEA+6,3.2,0,7);c.fill()}
c.fillStyle='#3b200c';c.fillRect(x+100,SEA-150,5,140);c.fillRect(x-70,SEA-100,4,90);
c.fillStyle='#efe4c8';c.beginPath();c.moveTo(x+100,SEA-140);c.quadraticCurveTo(x+142+w,SEA-105,x+100,SEA-70);c.closePath();c.fill();
c.beginPath();c.moveTo(x-70,SEA-92);c.quadraticCurveTo(x-102+w,SEA-65,x-70,SEA-38);c.closePath();c.fill();
c.fillStyle='#111';c.beginPath();c.moveTo(x+105,SEA-150);c.lineTo(x+135,SEA-146+w*.5);c.lineTo(x+105,SEA-132);c.closePath();c.fill();c.fillStyle='#fff';c.beginPath();c.arc(x+114,SEA-143,2.6,0,7);c.fill();
c.save();c.shadowColor='#fde047';c.shadowBlur=18;c.fillStyle='#ffd84d';c.fillRect(x+118,SEA-22,16,9);c.fillStyle='#8a5a00';c.fillRect(x+118,SEA-18,16,2);c.restore()}
function draw(t){c.save();if(shake>0){c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake--}
let g=c.createLinearGradient(0,0,0,SEA);g.addColorStop(0,'#030818');g.addColorStop(.55,'#0d2352');g.addColorStop(1,'#35609f');c.fillStyle=g;c.fillRect(-20,-20,W+40,H+40);
stars.forEach((s,i)=>{c.fillStyle=`rgba(255,255,255,${.35+.45*Math.abs(Math.sin(t*s[2]+i))})`;c.fillRect(s[0],s[1],s[2],s[2])});
const mg=c.createRadialGradient(690,80,4,690,80,80);mg.addColorStop(0,'#fff8dc');mg.addColorStop(.2,'#f5e9b8');mg.addColorStop(.21,'rgba(245,233,184,.22)');mg.addColorStop(1,'rgba(245,233,184,0)');c.fillStyle=mg;c.beginPath();c.arc(690,80,80,0,7);c.fill();
c.fillStyle='#ffffff14';c.font='900 40px Montserrat,sans-serif';c.textAlign='center';c.fillText('AVIAMASTERS',W/2,60);
clouds.forEach(k=>{const L=LAY[k.li],w=260*L.sc,x=((k.x-(dist*PX+t*10)*L.sp)%1400+1400)%1400-200;c.globalAlpha=L.a;c.drawImage(sprites[k.s],x,k.y,w,110*L.sc)});c.globalAlpha=1;
if(st==='fly'){const L=30+sp*TURBO[tb]*8;c.strokeStyle='rgba(190,220,255,.16)';c.lineWidth=1.2;c.beginPath();for(let i=0;i<14;i++){const x=(((i*211+37)-dist*PX*2.2)%(W+60)+(W+60))%(W+60)-30,y=30+((i*97)%260);c.moveTo(x,y);c.lineTo(x+L,y)}c.stroke()}
c.fillStyle='#10294f';const o2=(dist*PX*.1)%700;for(let k=-1;k<3;k++){const x=k*700-o2;c.beginPath();c.moveTo(x,SEA);c.lineTo(x+180,SEA-90);c.lineTo(x+330,SEA-40);c.lineTo(x+470,SEA-110);c.lineTo(x+620,SEA);c.fill()}
c.fillStyle='#0b1c3d';const o=(dist*PX*.25)%520;for(let k=-1;k<3;k++){const x=k*520-o+120;c.beginPath();c.moveTo(x,SEA);c.quadraticCurveTo(x+90,SEA-70,x+200,SEA);c.fill();c.fillRect(x+90,SEA-80,3,18)}
g=c.createLinearGradient(0,SEA,0,H);g.addColorStop(0,'#0e2c58');g.addColorStop(1,'#050f24');c.fillStyle=g;c.fillRect(-20,SEA,W+40,H-SEA+20);
c.fillStyle='rgba(245,233,184,.13)';for(let r=0;r<7;r++)c.fillRect(690-22+r*2+Math.sin(t*2+r)*7,SEA+5+r*9,44-r*5,3);
c.strokeStyle='#3b82f655';c.lineWidth=2;for(let r=0;r<3;r++){c.beginPath();for(let x=0;x<=W;x+=20)c.lineTo(x,SEA+8+r*14+Math.sin(x*.03+t*2+r)*3);c.stroke()}
[0,250,500,750].forEach(d=>carrier(PXX+(d-dist)*PX));amb.forEach((a,i)=>missile(a.x,a.y,t,.8,.55,i));if(P){const fx=PXX+(D-dist)*PX;(P.jp>=SHIPX?ship:carrier)(fx)}
if(P)P.dec.forEach((e,i)=>{const x=PXX+(e.d-dist)*PX;if(x>-60&&x<W+60)missile(x,f(e.alt)+Math.sin(t*4+i*2)*2,t,.55,.38,i+3)});
if(P)P.ev.forEach((e,i)=>{if(i<idx)return;const sx=PXX+(e.d-dist)*PX;const x=e.k==='r'?PXX+(e.d-dist)*PX*1.35:sx;if(x<-60||x>W+80)return;const y=f(e.altB)+Math.sin(t*4+i)*2;
if(e.k==='r')missile(x,y,t,1,1,i);else if(e.k==='f'){c.save();c.shadowColor='#fbbf24';c.shadowBlur=14;c.fillStyle='#ef4444';c.fillRect(x-11,y-12,22,26);c.fillStyle='#b91c1c';c.fillRect(x-8,y-18,10,6);c.fillStyle='#fde047';c.fillRect(x-6,y-3,12,9);c.restore()}else{c.save();c.shadowColor='#3b82f6';c.shadowBlur=16;c.fillStyle='#fff';c.font='900 30px Montserrat,sans-serif';c.textAlign='center';c.fillText(e.op+e.v,x,y+10);c.restore()}});
for(let i=1;i<trail.length;i++){const a=trail[i-1],b=trail[i],u=i/trail.length;c.strokeStyle=`rgba(190,220,255,${u*.5})`;c.lineWidth=1+u*5;c.lineCap='round';c.beginPath();c.moveTo(PXX+(a.d-dist)*PX-36,a.y+3);c.lineTo(PXX+(b.d-dist)*PX-36,b.y+3);c.stroke()}
puffs.forEach(p=>{const x=p.k?(p.x||PXX)-(dist-p.d)*PX:PXX+(p.d-dist)*PX,r=p.r+(1-p.a)*10;if(p.k){c.fillStyle=`rgba(25,25,30,${p.a*.55})`;c.beginPath();c.arc(x,p.y,r,0,7);c.fill()}else{c.globalAlpha=p.a*.5;c.drawImage(spr,x-r,p.y-r,r*2,r*2);c.globalAlpha=1}});
const ang=st==='crashing'||st==='falling'?1.1:angS;if(!(st==='end'&&P&&(P.crash||P.fall)))plane(px,pyv,ang,t);
parts.forEach(p=>{c.fillStyle=p.c;c.globalAlpha=Math.max(0,p.l);c.beginPath();c.arc(p.x,p.y,3,0,7);c.fill()});c.globalAlpha=1;
pops.forEach(p=>{c.globalAlpha=1-p.a;c.fillStyle=p.c;c.font=`900 ${p.s||24}px Montserrat,sans-serif`;c.textAlign='center';c.fillText(p.t,p.x,p.y);c.globalAlpha=1});
if(P&&st!=='idle'){c.textAlign='center';c.fillStyle='#7dd3fc';c.font='bold 12px Montserrat,sans-serif';c.fillText('$'+App.f(bet*Math.min(mHud,MAXX)),PXX,pyv-26)}
c.fillStyle='#0b1a33cc';c.beginPath();c.roundRect?c.roundRect(20,356,380,50,12):c.rect(20,356,380,50);c.fill();
const alt=P&&st==='fly'?altAt(P.pts,dist):0,bad=st==='end'&&P&&(P.crash||P.fall||P.m<1);c.textAlign='left';
[['ALTITUDE',alt.toFixed(1)+'m',40],['DISTANCE',Math.min(dist,D).toFixed(1)+'m',160],['MULTIPLIER','×'+Math.min(mHud,MAXX).toFixed(1),285]].forEach(([l,v,x],i)=>{c.fillStyle='#94a3b8';c.font='bold 11px Montserrat,sans-serif';c.fillText(l,x,375);c.fillStyle=i===2?(bad||mHud<1?'#f87171':'#4ade80'):'#fff';c.font='bold 18px Montserrat,sans-serif';c.fillText(v,x,396)});
c.textAlign='center';if(st==='idle'){c.fillStyle='#e2e8f0';c.font='500 18px Montserrat,sans-serif';c.fillText('Set your wager and launch the plane',W/2,200)}
c.restore()}
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;const sd=dt*Math.min(MAXCLK,sp*CLK[tb]),n=Math.max(1,Math.ceil(sd/.035));for(let i=0;i<n;i++)update(sd/n);draw(now/1000);raf=requestAnimationFrame(loop)}
go.onclick=()=>{if(shipBusy)return;if(st!=='idle'&&st!=='end')return;bet=App.bet(el,'AVIAMASTERS');if(!bet)return;sp=aviSpeed(Store.d.rk);goTxt();P=plan();P.dec=Array.from({length:6},()=>{const d=70+Math.random()*(D-130),a=altAt(P.pts,d),up=a<30||(a<55&&Math.random()<.5);return{d,alt:up?a+11+Math.random()*9:a-11-Math.random()*9}});idx=0;dist=0;mHud=M0;trail=[];puffs=[];gy=gv=0;px=PXX;py=DECK;shake=0;go.disabled=true;st='fly'};
goTxt();tbTxt();chips();raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf)}};})();
