/* v2.5 economy: rank curve, return-to-player of Cases / Aviamasters. node tests/update25.test.js */
const fs=require('fs'),vm=require('vm'),path=require('path');let pass=0,fail=0;const t=(n,ok)=>{console.log((ok?'PASS ':'FAIL ')+n);ok?pass++:fail++};
const sb={console,Math,Date,localStorage:{getItem(){return null},setItem(){},removeItem(){}}};vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/config.js'),'utf8')+';this.CFG=CFG',sb);const R=sb.CFG.RANKS;
const reqs=R.filter(r=>r.req).map(r=>r.req.c);
t('34 rank-ups, requirements strictly increasing',reqs.length===34&&reqs.every((c,i)=>i===0||c>reqs[i-1]));
t('highest requirement is at most 1,000,000 (was 7,000,000)',Math.max(...reqs)<=1000000);
t('rank round requirements cut ~20% (Unranked 40 .. Division 2 2400, was 50 .. 3000)',JSON.stringify(R.filter(r=>r.req).map(r=>r.req.r))==='[40,50,70,80,160,240,320,480,600,800,800,800,800,1000,1000,1200,1200,1200,1400,1600,1600,1200,1200,1400,1400,1400,1600,1600,1600,2000,2000,2400,2400,2400]');
// grind model: Aviamasters-style bet of 20% of the starting cash earns ~0.09 x cash per round of rank money; money gate should be <= ~2.5x the round gate
const ok=R.every((r,i)=>{if(!r.req)return true;const S=i===0?10:r.rw.c;return r.req.c/(r.req.r*.09*S)<=(i===0?7:4)});   // Unranked starts with only $10, so its first gate is a little looser
t('every rank money gate is reachable by grinding (<= 4x the round gate at 20% bets)',ok);
// RTP of Cases from source
const src=fs.readFileSync(path.join(__dirname,'../js/games/cases.js'),'utf8');
const rows=[...src.matchAll(/min: ([\d.]+),\s*max: ([\d.]+),\s*p: ([\d.]+)/g)].map(m=>[+m[1],+m[2],+m[3]]);
const rtp=rows.reduce((a,[lo,hi,p])=>a+p/100*(lo+hi)/2,0);
t('Cases return is about 125.8% incl. the Pirate Token ('+(rtp*100).toFixed(1)+'%)',Math.abs(rtp-1.258)<.005);
console.log(pass+' passed, '+fail+' failed');process.exit(fail?1:0);
