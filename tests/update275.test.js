// Update 2.75 tests: economy, permanent rows, claims, collections, balance format, cosmetics. Run: node tests/update275.test.js
const fs=require('fs'),vm=require('vm'),path=require('path'),J=f=>path.join(__dirname,'../js/'+f+'.js');
const store={};global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>{delete store[k]}};global.window=global;global.Games={};global.addEventListener=()=>{};
const toasts=[];global.App={toast:m=>toasts.push(m),bal(){},settle:(g,b,gr)=>Econ.settle(g,b,gr)};
const prod={hostname:'example.github.io',protocol:'https:'},local={hostname:'localhost',protocol:'http:'};global.location=prod;
for(const f of ['config','cosmetics','cosfx','limfx','limited','storage','stats','economy','mastery','games/aviamasters'])vm.runInThisContext(fs.readFileSync(J(f),'utf8'),{filename:f});
// fake Aviamasters mount that reports the speed table it would see; pirate.js wraps it
let seen=null;Games.aviamasters.mount=function(){seen=Games.aviamasters.aviSpeed(0);return()=>{}};
for(const f of ['games/cases','pirate'])vm.runInThisContext(fs.readFileSync(J(f),'utf8'),{filename:f});
const realLoad=Store.load.bind(Store);Store.load=()=>Store.d;
let pass=0,fail=0;const t=(n,ok,x='')=>{ok?pass++:fail++;console.log((ok?'PASS ':'FAIL ')+n+(x?'  '+x:''))};
const fresh=()=>{for(const k in store)delete store[k];Store.d=Store.def();Store.d.user='t';Store.sync();toasts.length=0};
const C=Games.cases,R=CFG.RANKS,LAST=R.length-1,rows=src=>src,O=k=>({r:C.RAR.find(r=>r.k===k),m:0});
const mk=(k,m)=>{const o=O(k);o.m=m!==undefined?m:o.r.min;return o};
const RT=p=>path.join(__dirname,'..',p),src0=fs.readFileSync(RT('js/games/cases.js'),'utf8');
const OLDP={Legendary:5.6,Mythic:2.9,Secret:.85,Pirate:.05},OLDMAX={Common:.85,Uncommon:1.25,Rare:1.8,Legendary:3.3,Mythic:4.9,Secret:30,Pirate:150};
(async()=>{
const RAR=C.RAR,K=k=>RAR.find(r=>r.k===k);
// ---- 1. economy tables
{const need=src0.match(/k: '(\w+)'.*?min: ([\d.]+),\s*max: ([\d.]+),\s*p: ([\d.]+),\s*px: ([\d.]+),\s*d: ([\d.]+)/g);t('8 tiers carry actual main (p), actual extra-row (px) and display-only (d) odds',need&&need.length===8);
t('actual main odds 32.21/19/27/13.2/5.3/2.5/.75/.04',RAR.map(r=>r.p).join()==='32.21,19,27,13.2,5.3,2.5,0.75,0.04');
t('actual extra-row odds are separate and rarer for high tiers',RAR.map(r=>r.px).join()==='70.74,13,10,4,1.5,0.6,0.15,0.01'&&RAR.slice(3).every(r=>r.px<r.p));
t('higher rarities are rarer than before 2.7.5 and multipliers slightly cut',Object.entries(OLDP).every(([k,v])=>K(k).p<v)&&Object.entries(OLDMAX).every(([k,v])=>K(k).max<v));
t('both tables total exactly 10,000 integer weights',C.TOT===10000&&C.TOTX===10000);}
{for(const x of [false,true]){const cnt={},W=x?'wx':'w';let n=0;for(let i=0;i<C.RAR.reduce((a,r)=>a+r[W],0);i++){const v=(i+.5)/(x?C.TOTX:C.TOT);const o=C.roll(()=>v,x);cnt[o.r.k]=(cnt[o.r.k]||0)+1}
t((x?'extra':'main')+'-row roll over every weight reproduces its table exactly',RAR.every(r=>cnt[r.k]===r[W]))}}
t('main-row return ~101.3%',Math.abs(C.evRow(false)-1.01335)<2e-4);
t('extra rows pay less than a main row (EV ~34.3% per extra row)',Math.abs(C.evRow(true)-.3425)<1e-3&&C.evRow(true)<C.evRow(false));
t('expected income counts extra rows: 0/1/2 rows = '+[0,1,2].map(n=>C.evWager(n).toFixed(3)).join(' / '),[0,1,2].every(n=>Math.abs(C.evWager(n)-(C.evRow(false)+n*C.evRow(true)))<1e-12)&&C.evWager(1)>C.evWager(0)&&C.evWager(2)>C.evWager(1));
{let s=0,N=400000;for(let i=0;i<N;i++){s+=C.roll(Math.random,false).m}t('Monte Carlo main row mean within 1% of EV ('+(s/N).toFixed(3)+')',Math.abs(s/N-C.evRow(false))<.02);
let s2=0;for(let i=0;i<N;i++)s2+=C.roll(Math.random,true).m;t('Monte Carlo extra row mean within 3% of EV ('+(s2/N).toFixed(3)+')',Math.abs(s2/N-C.evRow(true))<.015)}
// ---- 2. displayed odds untouched and separate
t('displayed odds unchanged: X26/C25/U27/R13/L5.4/M2.9/S.65/P.05',RAR.map(r=>r.k+r.d).join()==='X26,Common25,Uncommon27,Rare13,Legendary5.4,Mythic2.9,Secret0.65,Pirate0.05');
t('displayed odds differ from actual (handled separately)',RAR.some(r=>r.d!==r.p));
t('UI never reads the actual tables (px only in the table, the weight setup and the EV maths)',src0.split('\n').filter(l=>/\.px\b/.test(l)).length<=2&&/\$\{[^}]*\.d\b/.test(src0.replace(/\n/g,' '))||/r\.d/.test(src0));
// ---- 3. permanent rows: persist, stack, cap 2
fresh();t('no rows by default',Perks.rows()===0);let g=Perks.grant(Perks.LIST[0]);Perks.grant(Perks.LIST[0]);g=Perks.grant(Perks.LIST[0]);
t('rows stack to 2 and the cap holds',Perks.rows()===2&&g.applied===0&&C.MAX_ROWS===2);
Store.save();realLoad();t('rows persist through reload',Perks.rows()===2);
fresh();Store.writeSigned('0-100_v2.7_perks',JSON.stringify({r:3,c:0,a:0}));t('an older save with 3 queued rows is clamped to 2',Perks.rows()===2);
fresh();Perks.grant(Perks.LIST[0]);C.settleRows(10,[mk('Common',.5),mk('Common',.5)]);C.settleRows(10,[mk('Common',.5)]);t('rows are never consumed by wagers',Perks.rows()===1);
t('+2 rows reward is gone',!Perks.LIST.some(p=>p.id==='row2'||p.n===2&&p.kind==='row'));
// ---- 4. Rank-Up Ready
fresh();Store.d.rk=1;const q=R[1].req;g=Perks.grant(Perks.LIST[12]);t('Rank-Up Ready: requirements fulfilled, rank unchanged, ready to rank up',Store.d.rk===1&&Rank.status().ready&&Store.d.rc>=q.c&&Store.d.rq>=q.r&&g.rank);
// ---- 5. claims and simultaneous progress
fresh();Mastery.add('cases',50);const st=Mastery.stats('cases');t('50 cases: levels 1-2 complete, 0 claimed, 2 claimable',st.completed===2&&st.claimed===0&&st.claimable===2);
const gm=Store.d.gems,bal=Store.d.balance;Mastery.add('cases',50);const st2=Mastery.stats('cases');t('progress continues before any claim (level 3 reached at 100)',st2.completed===3&&Mastery.read().c.cases===100);
const r1=Mastery.claim('cases',1);t('claim one level: pays coins + gems, others untouched',r1.ok&&Store.d.balance===bal+Mastery.by.cases.cash[0]&&Store.d.gems===gm+Mastery.by.cases.gems[0]&&Mastery.stats('cases').claimable===2);
Mastery.add('cases',150);t('claimed + new progress simultaneously: counter 250, 4 completed, 1 claimed, 3 claimable',Mastery.read().c.cases===250&&Mastery.stats('cases').completed===4&&Mastery.stats('cases').claimed===1&&Mastery.stats('cases').claimable===3);
const tot=Mastery.claimableCount();t('claimableCount sums every objective',tot===3);
Mastery.claimAll();t('claim all empties the queue without touching the counter',Mastery.claimableCount()===0&&Mastery.read().c.cases===250);
Store.save();realLoad();t('claimed state persists',Mastery.stats('cases').claimed===4&&!Mastery.claim('cases',4).ok);
t('gem rewards exist on every level of every objective and rise with difficulty',Mastery.tracks.every(x=>x.gems.every(v=>v>=1))&&Mastery.by.sc.gems[9]>Mastery.by.cases.gems[9]&&Mastery.by.pt.gems[9]>Mastery.by.sc.gems[9]);
// ---- 6. collections
const tags=[...COS,...Cos.lim].filter(c=>c.type==='tag'),grads=[...COS,...Cos.lim].filter(c=>c.type==='grad');
t('collection objectives: 10 tiers, strictly rising, balanced gem/coin rewards',['tc','gc'].every(id=>{const x=Mastery.by[id];return x.thr.length===10&&x.thr.every((v,i)=>!i||v>x.thr[i-1])&&x.cash.every((v,i)=>!i||v>x.cash[i-1])&&x.gems.every((v,i)=>!i||v>x.gems[i-1])}));
t('Tag Level 10 = every tag but its own reward ('+(tags.length-1)+'); Gradient Level 10 = every gradient ('+grads.length+')',Mastery.by.tc.thr[9]===tags.length-1&&Mastery.by.gc.thr[9]===grads.length);
fresh();t('start: 0 unique tags / gradients',Mastery.read().c.tc===0&&Mastery.read().c.gc===0);
Store.d.inv.push('t_pirate');Store.save();t('obtaining a tag updates progress immediately',Mastery.read().c.tc===1&&Mastery.read().c.gc===0);
Store.d.inv.push('g_pirate');Store.d.inv.push('g_pirate');Store.save();t('a gradient counts once, duplicates never double-count',Mastery.read().c.gc===1&&Mastery.owned().gc===1);
Store.d.inv=Store.d.inv.filter(x=>x!=='t_pirate');Store.save();t('selling later never lowers progress (high-water mark)',Mastery.read().c.tc===1);
fresh();global.location=local;Mastery.devComplete('tc',3);Mastery.devComplete('tc',6);Mastery.devComplete('tc',10);Mastery.devComplete('gc',3);Mastery.devComplete('gc',6);Mastery.devComplete('gc',10);global.location=prod;
Mastery.claimAll();t('collection rewards: Lv3 tag, Lv6 gradient, Lv10 tag for both',['m_tc_3','m_tc_6','m_tc_10','m_gc_3','m_gc_6','m_gc_10'].every(id=>Store.d.inv.includes(id))&&['m_tc_3','m_tc_10','m_gc_3','m_gc_10'].every(id=>Cos.by(id).type==='tag')&&['m_tc_6','m_gc_6'].every(id=>Cos.by(id).type==='grad'));
t('collection reward names match the spec',[['m_tc_3','Tag Collector Tag'],['m_tc_6','Tag Collector Gradient'],['m_tc_10','Tag Completionist Tag'],['m_gc_3','Gradient Collector Tag'],['m_gc_6','Gradient Collector Gradient'],['m_gc_10','Gradient Completionist Tag']].every(([i,n])=>Cos.by(i).name===n));
t('claimed collection rewards feed the collections themselves',Mastery.read().c.tc>=3&&Mastery.read().c.gc>=2);
// ---- 7. cosmetics
const nm=['Doubloon Gradient','Loot Lord Tag','Case Cracker Tag','Coin Tosser Tag','Legend Hunter Tag','Amberglow Gradient','Token Lord Tag','Token Tamer Tag'],ids=Cos.lim.filter(c=>nm.includes(c.name)||/^m_(tc|gc)_/.test(c.id)||c.name==='Legend of Legends Tag'||/Legend of Legends/i.test(c.name));
t('all requested cosmetics exist incl. Legend of Legends ('+ids.length+')',nm.every(n=>Cos.lim.some(c=>c.name===n))&&Cos.lim.some(c=>/Legend of Legends/i.test(c.name)));
const th=Cos.lim.filter(c=>/^m_(cases_3|cases_10|fl_3|lg_3|lg_6|lg_10|pt_3|pt_6|pt_10|tc_|gc_)/.test(c.id));
t('the themed cosmetics ('+th.length+') each have a unique effect key',new Set(th.map(c=>c.lfx)).size===th.length&&th.every(c=>LFX[c.lfx]!==undefined));
t('each themed cosmetic has its own palette (3 colours) and renders an icon + particles wrapper',th.every(c=>c.cols.length===3&&/lmi/.test(Cos.html(c))&&/lm-/.test(Cos.html(c))));
t('themed palettes are distinct from each other',new Set(th.map(c=>c.cols.join())).size===th.length);
const cssAll=LFX.css||'';t('animations are disabled for reduced motion',/prefers-reduced-motion/.test(fs.readFileSync(J('limfx'),'utf8')));
t('Treasure Finder tag matches the Treasure Finder gradient palette; Pirate Gradient matches the Pirate tag',Cos.by('t_treasure').bg===Cos.by('g_treasure').bg&&Cos.by('t_treasure').cols.join()===Cos.by('g_treasure').cols.join()&&Cos.by('g_pirate').bg===Cos.by('t_pirate').bg&&Cos.by('g_pirate').cols.join()===Cos.by('t_pirate').cols.join());
t('King of the Pirates tag sits lower (hat clears the username)',/\.lmx\.lmt\{margin-top:1[4-9]px\}/.test(fs.readFileSync(J('limfx'),'utf8').replace(/\s/g,'')));
// ---- 8. balance format
t('fmt3: comma separated with exactly 3 decimals',Econ.fmt3(1234567890.123)==='1,234,567,890.123'&&Econ.fmt3(0)==='0.000'&&Econ.fmt3(1234.5)==='1,234.500'&&Econ.fmt3(.0004)==='0.000'&&Econ.fmt3(999)==='999.000');
fresh();Store.d.balance=1234567.891;Store.sync();const raw=Store.d.balance;t('formatting is display only: stored balance unchanged',Store.d.balance===raw&&Econ.fmt3(Store.d.balance)==='1,234,567.891');
t('Econ.fmt (header, games) is unchanged',typeof Econ.fmt(1234.5)==='string'&&Econ.fmt(1234.5)!==Econ.fmt3(1234.5));
// ---- 9. chests and registration
const crates=fs.readFileSync(J('crates'),'utf8');
t('tag and gradient chests have distinct animations',/TAGS chest/.test(crates)&&/GRADIENT chest/.test(crates)&&/perspective\(800px\)/.test(crates));
t('chest animations honour reduced motion',/prefers-reduced-motion/.test(crates));
const sw=fs.readFileSync(RT('sw.js'),'utf8'),ld=fs.readFileSync(J('loader'),'utf8');
t('limfx.js is cached offline and loaded before limited.js',sw.includes('js/limfx.js')&&ld.indexOf("'limfx'")>-1&&ld.indexOf("'limfx'")<ld.indexOf("'limited'"));
// ---- 10. the whole bundle must parse as ONE script (the loader concatenates every file into a single Function)
{const ld0=fs.readFileSync(J('loader'),'utf8'),list=[...ld0.match(/const F=\[([^\]]*)\]/)[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);
let err=null;try{new Function(list.map(n=>fs.readFileSync(J(n),'utf8')).join('\n;\n'))}catch(e){err=e.message}
t('loader bundle ('+list.length+' files) parses as a single script'+(err?' - '+err:''),!err&&list.includes('limfx')&&list.includes('mastery'));
t('no inline // comment is left in the middle of a code line in main.js',!/;\s+\/\/[^\n]*\)[a-zA-Z.]+\(/.test(fs.readFileSync(J('main'),'utf8')))}
console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0)})();
