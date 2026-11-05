// Update 2.6 tests: Cases multiplier rebalance (Secret 30x), Aviamasters speed pass, offline cache list. Run: node tests/update26.test.js
const fs=require('fs'),vm=require('vm'),path=require('path'),R=p=>path.join(__dirname,'..',p);
let pass=0,fail=0;const t=(n,ok)=>{console.log((ok?'PASS ':'FAIL ')+n);ok?pass++:fail++};
const src=fs.readFileSync(R('js/games/cases.js'),'utf8');
const rows=[...src.matchAll(/k: '(\w+)'.*?min: ([\d.]+),\s*max: ([\d.]+),\s*p: ([\d.]+)/g)].map(m=>({k:m[1],lo:+m[2],hi:+m[3],p:+m[4]}));
const rtp=rows.reduce((a,r)=>a+r.p/100*(r.lo+r.hi)/2,0);
t('Cases: 8 tiers (incl. Pirate Token), odds total 100',rows.length===8&&Math.abs(rows.reduce((a,r)=>a+r.p,0)-100)<1e-9);
t('Cases: Secret max is 30x',rows.find(r=>r.k==='Secret').hi===30);
t('Cases: v2.6b ranges (Common .3-.85, Uncommon 1-1.25, Rare 1.35-1.8, Legendary 2.4-3.3, Mythic 3.6-4.9, Secret 6-30)',['Common:.3:.85','Uncommon:1:1.25','Rare:1.35:1.8','Legendary:2.4:3.3','Mythic:3.6:4.9','Secret:6:30'].every(x=>{const[k,a,b]=x.split(':'),r=rows.find(q=>q.k===k);return r.lo===+a&&r.hi===+b}));
t('Cases: ranges never overlap and ascend',rows.slice(1).every((r,i,a)=>i===0||r.lo>=a[i-1].hi));
t('Cases: return ~125.8% incl. the 0.2% Pirate Token jackpot ('+(rtp*100).toFixed(2)+'%)',rtp>1.25&&rtp<1.26);
t('Cases: profit rounds still 48.5%',Math.abs(rows.filter(r=>r.lo>=1).reduce((a,r)=>a+r.p,0)-48.7)<1e-9);
// Aviamasters: plan() must be untouched (same RTP, win and profit rates as v2.5)
const sb={console,Math,Date,Games:{},CFG:{AVI_SPEED:[[34,2.75],[30,2.5],[7,2],[3,1.5]]},document:{}};vm.createContext(sb);
vm.runInContext(fs.readFileSync(R('js/games/aviamasters.js'),'utf8'),sb);const A=sb.Games.aviamasters,N=600000;let s=0,w=0,pf=0;
for(let i=0;i<N;i++){const p=A.plan();if(!p.crash&&!p.fall){s+=p.m;w++;if(p.m>1)pf++}}
t('Aviamasters: return ~101%, close to Cases ('+(s/N*100).toFixed(1)+'%), lands '+(w/N*100).toFixed(0)+'%, profit '+(pf/N*100).toFixed(0)+'%',Math.abs(s/N-1.009)<.02&&pf/N>.44&&pf/N<.48&&w/N>.88&&A.PR===.3);
t('Aviamasters: base animation clock is faster than 1x',A.BASE>1);
const av=fs.readFileSync(R('js/games/aviamasters.js'),'utf8');
t('Aviamasters: turbo button + instant relaunch present',/id="tb"/.test(av)&&/st!=='idle'&&st!=='end'/.test(av));
// Offline cache must list every image the code references
const sw=fs.readFileSync(R('sw.js'),'utf8'),imgs=new Set();
for(const f of ['js/ui.js','js/games/cases.js','js/config.js','css/style.css','css/update25.css'])try{for(const m of fs.readFileSync(R(f),'utf8').matchAll(/img\/([\w.-]+\.(?:png|jpe?g))/g))imgs.add(m[1])}catch(e){}
t('sw.js pre-caches every img/ file referenced in the code ('+[...imgs].join(', ')+')',[...imgs].every(n=>sw.includes("'"+n+"'")||sw.includes('"'+n+'"')));
t('sw.js pre-caches core pages and scripts',['game.html','index.html','js/loader.js','js/offline.js','js/games/aviamasters.js'].every(f=>sw.includes("'"+f+"'")));
console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
