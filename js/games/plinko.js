(()=>{const MX={8:[5.6,13,29,50],9:[5.6,18,43,100],10:[8.9,22,76,201],11:[8.4,24,120,324],12:[10,33,170,619],13:[8.1,43,260,1012],14:[7.1,58,420,2369],15:[15,88,620,5000],16:[16,110,1000,10000]};
// Edge slots keep the table's max multipliers as the SHAPE; the whole curve per rows/risk is then scaled so the exact return to player equals RTP_TARGET.
const PL={"8":[0.9,0.74,0.47,0.3],"9":[1.03,0.77,0.53,0.25],"10":[0.99,0.84,0.52,0.21000000000000002],"11":[1.02,0.97,0.57,0.29],"12":[1.1,0.97,0.62,0.25],"13":[1.18,1.04,0.68,0.32],"14":[1.2,1.05,0.66,0.24],"15":[1.2,1.08,0.76,0.21000000000000002],"16":[1.29,1.11,0.75,0.21000000000000002]},PE={"8":[1.2,1.6,2,2.6],"9":[1.2,1.6,2,2.6],"10":[1.2,1.6,2,2.65],"11":[1.2,1.6,2,2.6],"12":[1.2,1.6,2,2.6],"13":[1.2,1.6,2,2.6],"14":[1.2,1.6,2,2.6],"15":[1.2,1.6,2,2.74],"16":[1.2,1.6,2,2.88]},D0=[0.4,0.35,0.25,0.2];
/* v2.6: payouts raised (was ~92% after the v2.25 RTPF 0.98 trim). Drops now have NO cooldown and 2000 balls count as 1 rank round, so the return is ~99%.
   The ball is NOT a fair binomial: each row keeps the previous direction with chance KEEP (see drop()), so the real pocket odds come from walk(); the RTP calibration uses the same walk, i.e. displayed multipliers = rolled odds. */
const RTP_TARGET=.99,KEEP=.52;
const walk=r=>{let f=[{0:.5},{0:.5}];   // f[d][k]: d 0 = going left, 1 = going right; k = number of right steps so far
for(let i=0;i<r;i++){const g=[{},{}];for(let d=0;d<2;d++)for(const k in f[d]){const p=f[d][k];for(const nd of[d,1-d]){const w=p*(nd===d?KEEP:1-KEEP),nk=+k+nd;g[nd][nk]=(g[nd][nk]||0)+w}}f=g}
return Array.from({length:r+1},(_,k)=>(f[0][k]||0)+(f[1][k]||0))};
const rd=v=>v>=100?Math.round(v):v>=10?Math.round(v*10)/10:Math.round(v*100)/100;
const cache={};
const mults=(r,k)=>{const key=r+'/'+k;if(cache[key])return cache[key];const mx=MX[r][k],mn=[.5,.4,.2,.2][k],h=r/2,pl=PL[r][k],pe=PE[r][k],d0=D0[k];
const raw=Array.from({length:r+1},(_,i)=>{const d=Math.abs(i-h)/h,v=d<d0?mn+(pl-mn)*(d/d0):pl*Math.pow(mx/pl,Math.pow((d-d0)/(1-d0),pe));return Math.min(mx,v)});
const P=walk(r),f=RTP_TARGET/raw.reduce((a,v,i)=>a+v*P[i],0);return cache[key]=raw.map(v=>rd(v*f))};
const rtp=(r,k)=>{const P=walk(r);return mults(r,k).reduce((a,v,i)=>a+v*P[i],0)};
Games.plinko={title:'PLINKO',mults,rtp,walk,mount(el){
el.innerHTML=`<div class="play"><div class="side"><label>Bet</label>${App.betHTML()}<label>Risk</label><select id="rk"><option value="0">Easy</option><option value="1" selected>Medium</option><option value="2">Hard</option><option value="3">Expert</option></select><label>Rows: <span id="rv">12</span></label><input id="rw" type="range" min="8" max="16" value="12"><button class="btn" id="go">Drop coin</button><div class="hist">01O0 Plinko is played by dropping a ball into a pin pyramid, which then bounces into a multiplier pot. The centre pots offer the lowest payouts, with the higher wins sitting on the edge of the board. No drop cooldown: drop as fast as you can click (one real click or Space press per ball). Return to player about 99%. 2,000 balls count as 1 rank round.</div></div><div class="stage"><canvas width="640" height="520"></canvas></div></div>`;
el.querySelector('.bet').min=CFG.MIN_BET.PLINKO;const cv=el.querySelector('canvas'),c=cv.getContext('2d'),W=640,rk=el.querySelector('#rk'),rw=el.querySelector('#rw');
let R=12,K=1,balls=[],pops=[],raf=0,run=false,rb=0,rp=0;
const geo=()=>({sp:Math.min(46,(W-40)/(R+2)),dy:Math.min(34,380/(R+1)),top:40});
function coin(x,y,r){c.fillStyle='#fde047';c.beginPath();c.arc(x,y,r,0,7);c.fill();c.strokeStyle='#fb923c';c.lineWidth=r*.4;c.beginPath();c.arc(x,y,r*.5,0,7);c.stroke()}
function draw(){const{sp,dy,top}=geo(),m=mults(R,K);c.clearRect(0,0,W,520);c.fillStyle='#d4d4d4';
for(let i=0;i<R;i++)for(let j=0;j<i+3;j++){c.beginPath();c.arc(W/2+(j-(i+2)/2)*sp,top+i*dy,3,0,7);c.fill()}
c.font='bold 11px Montserrat,sans-serif';c.textAlign='center';
m.forEach((v,i)=>{const x=W/2+(i-R/2)*sp,y=top+R*dy+22;c.fillStyle=`hsl(${120-Math.min(1,Math.log10(v+1)/2.5)*120} 70% 45%)`;c.fillRect(x-sp/2+2,y,sp-4,28);
pops.forEach(p=>{if(p.i===i){c.fillStyle=`rgba(255,255,255,${.55*(1-p.a)})`;c.fillRect(x-sp/2+2,y,sp-4,28)}});c.fillStyle='#fff';c.fillText(v+'x',x,y+18)});
balls.forEach(b=>{const i=Math.min(Math.floor(b.t),R-1),f=b.t-i,x=W/2+(b.path[i]+(b.path[i+1]-b.path[i])*f)*sp,y=top+(i+f)*dy-Math.sin(f*Math.PI)*10-8;
b.tr.push([x,y]);if(b.tr.length>10)b.tr.shift();
b.tr.forEach(([tx,ty],k)=>{c.fillStyle=`rgba(253,224,71,${(k+1)/b.tr.length*.35})`;c.beginPath();c.arc(tx,ty,3+k*.6,0,7);c.fill()});coin(x,y,9)});
pops.forEach(p=>{c.globalAlpha=Math.min(1,2*(1-p.a));c.fillStyle='#facc15';c.font='900 30px Montserrat,sans-serif';c.fillText('$',p.x,p.y-p.a*45);c.fillStyle='#fff';c.font='bold 12px Montserrat,sans-serif';c.fillText(p.m+'x',p.x,p.y-p.a*45+16);c.globalAlpha=1})}
function frame(){balls.forEach(b=>b.t+=.14);balls=balls.filter(b=>{if(b.t<R)return true;land(b);return false});if(!balls.length&&rb>0){const n=Math.round((rp-rb)*100)/100;App.toast(n>0?`Round over: +$${App.f(n)} profit`:n<0?`Round over: lost $${App.f(-n)}`:'Round over: broke even');rb=rp=0}pops.forEach(p=>p.a+=.025);pops=pops.filter(p=>p.a<1);
rk.disabled=rw.disabled=balls.length>0;draw();if(balls.length||pops.length)raf=requestAnimationFrame(frame);else run=false}
function start(){if(!run){run=true;raf=requestAnimationFrame(frame)}}
function land(b){const{sp,dy,top}=geo(),w=b.bet*b.mult;pops.push({x:W/2+b.path[R]*sp,y:top+R*dy+14,a:0,m:b.mult,i:Math.round(b.path[R]+R/2)});App.settle('PLINKO',b.bet,w);rb+=b.bet;rp+=w}
rk.onchange=()=>{K=+rk.value;draw()};rw.oninput=()=>{R=+rw.value;el.querySelector('#rv').textContent=R;draw()};
el.querySelector('#go').onclick=()=>{const bet=App.bet(el,'PLINKO',1);if(!bet)return;let p=0,dir=Math.random()<.5?-1:1;const path=[0];for(let i=0;i<R;i++){if(Math.random()>KEEP)dir=-dir;p+=dir*.5;path.push(p)}
balls.push({path,bet,mult:mults(R,K)[Math.round(p+R/2)],t:0,tr:[]});rk.disabled=rw.disabled=true;start()};
draw();return()=>{cancelAnimationFrame(raf);balls.forEach(land)}}}})();
