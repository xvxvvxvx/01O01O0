// Update 2.9 tests: Cases rebalance, Aviamasters jackpot ladder + displayed chances, Daily Wheel curve. Run: node tests/update29.test.js
const fs=require('fs'),vm=require('vm'),path=require('path'),R=p=>path.join(__dirname,'..',p);
let pass=0,fail=0;const t=(n,ok,x='')=>{console.log((ok?'PASS ':'FAIL ')+n+(x?'  '+x:''));ok?pass++:fail++};
// ---- Cases
const src=fs.readFileSync(R('js/games/cases.js'),'utf8');
const rows=[...src.matchAll(/k: '(\w+)'.*?min: ([\d.]+),\s*max: ([\d.]+),\s*p: ([\d.]+),\s*px: ([\d.]+)/g)].map(m=>({k:m[1],lo:+m[2],hi:+m[3],p:+m[4],px:+m[5]}));
const ev=f=>rows.reduce((a,r)=>a+r[f]/100*(r.lo+r.hi)/2,0),g=k=>rows.find(r=>r.k===k),avg=k=>(g(k).lo+g(k).hi)/2;
t('Cases: 8 tiers, ranges ascend without overlap',rows.length===8&&rows.slice(2).every((r,i)=>r.lo>=rows[i+1].hi));
t('Cases: Legendary and Mythic multipliers are higher than before (avg 2.7 -> '+avg('Legendary')+', 4.0 -> '+avg('Mythic')+')',avg('Legendary')>=3.5&&avg('Mythic')>=5.5);
t('Cases: main-row return stays ~101.4% ('+(ev('p')*100).toFixed(2)+'%)',Math.abs(ev('p')-1.01385)<.001);
t('Cases: extra-row return stays ~34% ('+(ev('px')*100).toFixed(2)+'%)',Math.abs(ev('px')-.341)<.002);
t('Cases: rolled odds untouched (X32.21/19/27/13.2/5.3/2.5/.75/.04)',rows.map(r=>r.p).join()==='32.21,19,27,13.2,5.3,2.5,0.75,0.04');
t('Cases: 48.79% of rounds are in profit (every tier at 1x or more)',Math.abs(rows.filter(r=>r.lo>=1).reduce((a,r)=>a+r.p,0)-48.79)<1e-9);
// ---- Aviamasters
const sb={console,Math,Date,Games:{},CFG:{AVI_SPEED:[[34,2.75],[30,2.5],[7,2],[3,1.5]]},document:{}};vm.createContext(sb);
vm.runInContext(fs.readFileSync(R('js/games/aviamasters.js'),'utf8'),sb);const A=sb.Games.aviamasters,N=1500000;
t('Aviamasters: 250x is the top jackpot and the rarest tier',A.JP[0][0]===250&&A.JP.every(([x,p],i)=>x<=250&&(i===0||p>A.JP[0][1])));
let s=0,land=0,pf=0,mx=0,crash=0,fall=0,u1=0,b12=0,b2=0;const jc={};
for(let i=0;i<N;i++){const p=A.plan();if(p.crash){crash++;continue}if(p.fall){fall++;continue}land++;s+=p.m;mx=Math.max(mx,p.m);if(p.m>1)pf++;if(p.jp)jc[p.jp]=(jc[p.jp]||0)+1;else if(p.m<1)u1++;else if(p.m<2)b12++;else b2++}
t('Aviamasters: no outcome above 250x (max seen '+mx.toFixed(2)+')',mx<=250);
t('Aviamasters: return ~101% ('+(s/N*100).toFixed(1)+'%), profit '+(pf/N*100).toFixed(1)+'%, lands '+(land/N*100).toFixed(0)+'%',Math.abs(s/N-1.0096)<.02&&pf/N>.40&&pf/N<.46&&land/N>.88);
const C=Object.fromEntries(A.CHANCES.map(([n,p])=>[n,p])),sum=A.CHANCES.reduce((a,r)=>a+r[1],0);
t('Aviamasters: displayed chances total 100% ('+sum.toFixed(3)+')',Math.abs(sum-100)<.05);
const emp={'Crashed into the sea':crash/N,'Slid off the runway':fall/N,'Landed under 1x (loss)':u1/N,'Landed 1x to 2x':b12/N,'Landed 2x to 2.5x':b2/N};
t('Aviamasters: displayed physics chances match simulation within 0.4 points',Object.entries(emp).every(([k,v])=>Math.abs(C[k]-v*100)<.4),Object.entries(emp).map(([k,v])=>k+' '+(v*100).toFixed(2)).join(' | '));
t('Aviamasters: 10x / 25x jackpot rows match simulation within 25%',[10,25].every(x=>Math.abs((jc[x]||0)/N*100/C['Jackpot '+x+'x']-1)<.25));
const mn=A.CHANCES.reduce((a,r)=>r[1]<a[1]?r:a);t('Aviamasters: the rarest displayed result is the 250x jackpot ('+mn[0]+')',mn[0]==='Jackpot 250x');
t('Aviamasters: chance panel renders every row',(h=>A.CHANCES.every(r=>h.includes(r[0])))(A.chancesHtml()));
// ---- Daily Wheel curve
global.window=global;vm.runInThisContext(fs.readFileSync(R('js/update29.js'),'utf8'));const e=Update29.ease;let mono=true,pv=-1;for(let i=0;i<=2000;i++){const v=e(i/2000);if(v<pv-1e-12)mono=false;pv=v}
t('Wheel: ease is monotonic, 0 -> 1, starts gently and ends with zero speed',mono&&e(0)===0&&e(1)===1&&(e(1e-4)-e(0))/1e-4<.01&&(e(1)-e(1-1e-4))/1e-4<1e-6);
const h=1e-6;t('Wheel: speed is continuous at the accel/decel join (no jolt)',Math.abs((e(.14+h)-e(.14))/h-(e(.14)-e(.14-h))/h)<1e-3);
console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
