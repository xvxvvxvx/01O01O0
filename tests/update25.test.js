/* v2.5 economy: rank curve, return-to-player of Cases / Aviamasters. node tests/update25.test.js */
const fs=require('fs'),vm=require('vm'),path=require('path');let pass=0,fail=0;const t=(n,ok)=>{console.log((ok?'PASS ':'FAIL ')+n);ok?pass++:fail++};
const sb={console,Math,Date,localStorage:{getItem(){return null},setItem(){},removeItem(){}}};vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/config.js'),'utf8')+';this.CFG=CFG',sb);const R=sb.CFG.RANKS;
const reqs=R.filter(r=>r.req).map(r=>r.req.c);
t('34 rank-ups, requirements strictly increasing',reqs.length===34&&reqs.every((c,i)=>i===0||c>reqs[i-1]));
t('highest requirement is at most 1,100,000 (was 7,000,000)',Math.max(...reqs)<=1100000);
t('round requirements untouched (Unranked 50 .. Division 2 3000)',R[0].req.r===50&&R[33].req.r===3000);
// grind model: Aviamasters-style bet of 20% of the starting cash earns ~0.09 x cash per round of rank money; money gate should be <= ~2.5x the round gate
const ok=R.every((r,i)=>{if(!r.req)return true;const S=i===0?10:r.rw.c;return r.req.c/(r.req.r*.09*S)<=(i===0?6:3.5)});   // Unranked starts with only $10, so its first gate is a little looser
t('every rank money gate is reachable by grinding (<= 3.5x the round gate at 20% bets)',ok);
// RTP of Cases from source
const src=fs.readFileSync(path.join(__dirname,'../js/games/cases.js'),'utf8');
const rows=[...src.matchAll(/min: ([\d.]+),\s*max: ([\d.]+),\s*p: ([\d.]+)/g)].map(m=>[+m[1],+m[2],+m[3]]);
const rtp=rows.reduce((a,[lo,hi,p])=>a+p/100*(lo+hi)/2,0);
t('Cases return is about 95% ('+(rtp*100).toFixed(1)+'%)',Math.abs(rtp-.95)<.02);
console.log(pass+' passed, '+fail+' failed');process.exit(fail?1:0);
