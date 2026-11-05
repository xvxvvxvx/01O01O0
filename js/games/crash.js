/* v2.6 Crash: simple Stake-style presentation (one clean multiplier graph, big multiplier number, nothing else) and better payouts.
   Crash point = max(1, EDGE/(1-u)) with EDGE 1.01 (was .99): P(crash point >= x) = 1.01/x, so every cash-out target returns ~101% (was ~99%) and there is no more instant 1.00x crash.
   The graph is drawn from the round state only; none of it feeds back into the crash logic. */
Games.crash={title:'CRASH',mount(el){
el.innerHTML=`<div class="play"><div class="side"><label>Bet</label>${App.betHTML()}<label>Auto cashout (x, optional)</label><input id="au" type="number" min="1.01" step="0.01" placeholder="e.g. 2.00"><button class="btn" id="go">Place bet</button><div class="hist">Cash out before the multiplier crashes. Return to player about 101%.</div><div class="hist" id="hs"></div></div><div class="stage"><div class="mult" id="mu">Next round…</div><canvas width="640" height="340"></canvas></div></div>`;
const cv=el.querySelector('canvas'),c=cv.getContext('2d'),mu=el.querySelector('#mu'),go=el.querySelector('#go'),hs=el.querySelector('#hs');
const W=640,H=340,DPR=Math.min(2,window.devicePixelRatio||1),GR=.15,EDGE=1.01,MAXM=1000;cv.width=W*DPR;cv.height=H*DPR;
let ph='bet',t0=performance.now(),m=1,pt=1,placed=0,cashed=false,pts=[],hist=[],raf=0;
const newPt=()=>Math.min(MAXM,Math.max(1,EDGE/(1-Math.random())));
const nice=v=>{const p=Math.pow(10,Math.floor(Math.log10(v))),f=v/p;return(f<=1?1:f<=2?2:f<=5?5:10)*p};
function btn(){go.textContent=ph==='bet'?(placed?'Bet placed':'Place bet'):ph==='run'&&placed&&!cashed?'Cash out':'Wait…';go.disabled=ph==='bet'?!!placed:!(ph==='run'&&placed&&!cashed)}
/* a manual cash-out re-reads the real clock (a hidden/throttled tab could otherwise cash out at a stale, pre-crash multiplier); auto-cashout only fires BELOW the crash point. */
function cash(auto){if(!placed||cashed||ph!=='run')return;if(!auto){const mm=Math.exp(GR*(performance.now()-t0)/1000);if(mm>=pt)return;m=mm}cashed=true;App.settle('CRASH',placed,placed*m);App.toast(`Cashed out at ${m.toFixed(2)}x: +$${App.f(placed*m-placed)}`);btn()}
/* simple graph: faint grid + axis labels, one line (green while running, red after the crash), a dot at the tip */
function draw(){const L=48,R=14,T=14,B=26,pw=W-L-R,phh=H-T-B;c.setTransform(DPR,0,0,DPR,0,0);c.fillStyle='#050505';c.fillRect(0,0,W,H);
const last=pts.length?pts[pts.length-1]:[0,1],xMax=Math.max(6,last[0]*1.1),yMax=Math.max(2,last[1]*1.15),ys=nice((yMax-1)/4),xs=nice(xMax/5);
const X=s=>L+s/xMax*pw,Y=v=>H-B-(v-1)/(yMax-1)*phh;c.font='11px Montserrat,sans-serif';c.lineWidth=1;
c.textAlign='right';for(let v=1;v<=yMax+1e-9;v+=ys){const y=Y(v);c.strokeStyle='#ffffff1a';c.beginPath();c.moveTo(L,y);c.lineTo(W-R,y);c.stroke();c.fillStyle='#a3a3a3';c.fillText(v.toFixed(v<10?2:0)+'x',L-6,y+4)}
c.textAlign='center';for(let s=0;s<=xMax+1e-9;s+=xs){c.fillStyle='#a3a3a3';c.fillText(s+'s',X(s),H-8)}
if(pts.length<2)return;const col=ph==='crash'?'#ef4444':'#22c55e',st=Math.ceil(pts.length/500);
c.beginPath();for(let i=0;i<pts.length;i+=st)i?c.lineTo(X(pts[i][0]),Y(pts[i][1])):c.moveTo(X(pts[i][0]),Y(pts[i][1]));c.lineTo(X(last[0]),Y(last[1]));
c.strokeStyle=col;c.lineWidth=3;c.lineJoin='round';c.stroke();
c.lineTo(X(last[0]),H-B);c.lineTo(X(0),H-B);c.closePath();c.globalAlpha=.1;c.fillStyle=col;c.fill();c.globalAlpha=1;
c.fillStyle=col;c.beginPath();c.arc(X(last[0]),Y(last[1]),5,0,7);c.fill()}
function tick(now){const s=(now-t0)/1000;
if(ph==='bet'){const cd=5-s;mu.textContent=`Next round in ${Math.max(0,cd).toFixed(1)}s`;mu.style.color='#e2e8f0';if(cd<=0){ph='run';t0=now;pt=newPt();pts=[];cashed=false;m=1;btn()}}
else if(ph==='run'){m=Math.exp(GR*s);pts.push([s,m]);mu.textContent=m.toFixed(2)+'x';mu.style.color='#22c55e';const a=parseFloat(el.querySelector('#au').value);if(placed&&!cashed&&a>=1.01&&a<pt&&m>=a){m=a;cash(true)}
if(m>=pt){m=pt;ph='crash';pts.push([Math.log(pt)/GR,pt]);mu.textContent='Crashed @ '+pt.toFixed(2)+'x';mu.style.color='#ef4444';hist.unshift(pt.toFixed(2)+'x');hs.textContent=hist.slice(0,8).join('  ');if(placed&&!cashed){App.settle('CRASH',placed,0)}t0=now;btn()}}
else if(s>2.5){ph='bet';t0=now;placed=0;pts=[];btn()}
draw();raf=requestAnimationFrame(tick)}
go.onclick=()=>{if(ph==='bet'&&!placed){const b=App.bet(el,'CRASH');if(b)placed=b}else cash();btn()};
btn();raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf)}};
