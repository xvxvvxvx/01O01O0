// Update 2.8 tests: starter goals, goal selection, claim safety, veteran / tamper handling, reward budget, feedback helpers, shop model.
// Run: node tests/update28.test.js   (no browser needed). Uses the real js/ modules when the whole repo is present; otherwise small stand-ins for the shared core (marked STUB below).
const fs=require('fs'),vm=require('vm'),path=require('path'),J=f=>path.join(__dirname,'../js/'+f+'.js');
const store={};global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>{delete store[k]}};global.window=global;global.addEventListener=()=>{};
const toasts=[];global.App={toast:m=>toasts.push(m),bal(){},bet(){return 1},settle(g,b,x){return Econ.settle(g,b,x)}};
const REAL=['config','cosmetics','cosfx','limfx','limited','storage','stats','economy','mastery'].every(f=>fs.existsSync(J(f)));
global.Games={};
if(REAL){for(const f of ['config','cosmetics','cosfx','limfx','limited','storage','stats','economy','mastery'])vm.runInThisContext(fs.readFileSync(J(f),'utf8'),{filename:f});
vm.runInThisContext(fs.readFileSync(J('crates'),'utf8'),{filename:'crates'})}
else vm.runInThisContext(`
const CFG={UNRANKED_START:10,GEM:{TO_COIN:100},CRATE:{COST:3},RAR:{common:{gems:1},rare:{gems:2},epic:{gems:3},legendary:{gems:5}},RANKS:[{n:'Unranked',req:{c:225,r:40},rw:{c:10,g:0}},{n:'Copper',req:{c:725,r:50},rw:{c:50,g:1}},{n:'Bronze',req:{c:2300,r:70},rw:{c:100,g:2}},{n:'Silver',req:null,rw:{c:250,g:3}}]};
const sig=(k,s)=>(k+s).length.toString(36);
const Store={armed:true,d:null,def:()=>({user:'t',balance:10,gems:0,rk:0,rc:0,rq:0,lq:0,dl:0,inv:[],g:{},pt:{}}),num:(v,f)=>typeof v==='number'&&isFinite(v)?v:f,
readSigned(k){const r=localStorage.getItem(k);if(r==null)return{raw:null,status:'none'};if(r.slice(0,3)==='S2:'){const i=r.indexOf(':',3);return{raw:r.slice(i+1),status:r.slice(3,i)===sig(k,r.slice(i+1))?'ok':'bad'}}return{raw:r,status:'legacy'}},
writeSigned(k,s){localStorage.setItem(k,'S2:'+sig(k,s)+':'+s)},load(){return this.d},sync(){this.s={b:this.d.balance,g:this.d.gems}},save(){},check(){if(this.d.gems>this.s.g||this.d.balance>this.s.b+.005){this.tamper=(this.tamper||0)+1}}};
const Econ={r2:x=>Math.round(x*100)/100,fmt:n=>(+n).toFixed(2),fi:n=>String(+n),minBet:()=>.01,addCoins(n){Store.d.balance=Econ.r2(Store.d.balance+n);Store.sync()},settle(g,b,x){Store.d.g[g]=Store.d.g[g]||{w:0};Store.d.g[g].w+=b;Store.d.lq++;Store.d.balance=Econ.r2(Store.d.balance-b+x);Store.sync();return x}};
const Rank={status(){const d=Store.d,cur=CFG.RANKS[d.rk],req=cur.req;return{idx:d.rk,cur,next:CFG.RANKS[d.rk+1]||null,req,coin:d.rc,rounds:d.rq,max:!req,ready:!!req&&d.rc>=req.c&&d.rq>=req.r}}};
const Mastery={tracks:[{id:'mn',name:'Mines Games Played',thr:[20,50],cash:[250,400],gems:[1,2],unit:'games',cos:['m_mn_3','m_mn_6','m_mn_10']}],LV:10,COSLV:[3,6,10],read:()=>({c:{mn:Store.d.mn||0},l:{mn:0},k:{}}),total:()=>Store.d.mlv||0};
const Quests={sync(){},list:()=>[],prog:()=>0,claimed:()=>false};
`);
// UI stand-ins (ui.js / main.js need a browser)
vm.runInThisContext(`const LIST=[['plinko','PLINKO'],['mines','MINES'],['crash','CRASH'],['chicken','CHICKEN'],['flip','FLIP'],['aviamasters','AVIAMASTERS'],['doubleornothing','DOUBLE OR NOTHING'],['blackjack','BLACKJACK'],['cases','CASES'],['guessthecup','GUESS THE CUP']];
const Dash={home(){},bar:(t,f)=>t},Shell={tick(){},update(){}},Pages={},Badge={txt:i=>'R'+i},gemIcon=()=>'',rwTxt=i=>'$'+(i*50)+' + '+i,prevHtml=()=>'',Cos={by:()=>null};App.route=function(){};`);
for(const f of ['feedback','shop2','progress'])vm.runInThisContext(fs.readFileSync(J(f),'utf8'),{filename:f});
let pass=0,fail=0;const t=(n,ok,x='')=>{ok?pass++:fail++;console.log((ok?'PASS ':'FAIL ')+n+(x?'  '+x:''))};
console.log(REAL?'(real repo modules)':'(STUB core: run inside the full repo for the real modules)');
const fresh=()=>{for(const k in store)delete store[k];Store.d=Store.def();Store.d.user='t';Store.sync();Store.tamper=0;toasts.length=0;delete Store.d.mlv;Store.d.mn=0};
const settle=(g,n=1)=>{for(let i=0;i<n;i++)Econ.settle(g,1,1)};
const G=Goals;
// ---- structure
t('7 starter goals; reward steps are bet/mix/rounds/daily, the rest point at existing systems',G.S.length===7&&G.S.filter(s=>s.rw).map(s=>s.id).join()==='bet,mix,rounds,daily'&&G.S.filter(s=>!s.rw).every(s=>s.rwt));
const tot=G.S.reduce((a,s)=>{const w=s.rw||{};return{c:a.c+(w.c||0),g:a.g+(w.g||0)}},{c:0,g:0});
t('whole starter path pays at most $15 + 2 Gems (small next to Mastery Level 1: $250 + 1 Gem)',tot.c===15&&tot.g===2);
// ---- new player
fresh();let v=G.view();t('new player: goal 1 of 7 "Place your first bet", 0%, no claim, a Play link',v.kind==='starter'&&v.n===1&&v.title==='Place your first bet'&&v.pct===0&&v.claim===-1&&/^#/.test(v.go[0]));
t('the recommended first game is an easy 1-round-per-game title',G.unplayed()==='mines');
t('every goal tells the player the reward and what it unlocks (or its own reward)',G.S.every(s=>(G.rwText(s,false)||'').length>0&&s.un));
G.sweep();t('nothing is paid or announced before progress',Store.d.balance===10&&Store.d.gems===0&&toasts.length===0);
// ---- step 1 + claim safety
settle('MINES');G.sweep();v=G.view();t('first round completes goal 1 and offers CLAIM; announced once',v.claim===0&&toasts.filter(m=>/Goal complete/.test(m)).length===1);G.sweep();t('no repeat toast',toasts.filter(m=>/Goal complete/.test(m)).length===1);
const b0=Store.d.balance;let r=G.claim(0),r2=G.claim(0);t('claim pays $5 exactly once, second claim refused',r.ok&&r.c===5&&!r2.ok&&Math.abs(Store.d.balance-(b0+5))<1e-9);
t('claim survives reload (signed key) and the next goal is shown',G.state().rows[0].cl&&G.view().n===2);
t('claiming cannot be done before completing',!G.claim(1).ok);
// ---- step 2: variety, gems, no tamper flag
settle('FLIP');settle('CRASH');v=G.view();t('3 different games complete goal 2',v.n===2&&v.claim===1);
const g0=Store.d.gems;r=G.claim(1);t('goal 2 pays 1 Gem once and does not trip the shadow ledger',r.ok&&r.g===1&&Store.d.gems===g0+1&&!Store.tamper&&!G.claim(1).ok);
// ---- step 3 rounds
Store.d.lq=9;t('9 rounds: goal 3 not complete',!G.state().rows[2].done);Store.d.lq=10;t('10 rounds completes goal 3',G.state().rows[2].done);G.claim(2);
// ---- step 4 daily
t('daily goal incomplete until the wheel was used',!G.state().rows[3].done);Store.d.dl=Date.now();t('using the wheel completes it',G.state().rows[3].done);r=G.claim(3);t('daily goal pays 1 Gem',r.ok&&r.g===1);
// ---- zero-reward steps are ticked off automatically
Store.d.mlv=1;Store.d.mn=25;G.sweep();t('Mastery goal completes on its own (no extra payout) and is ticked off',G.state().rows[4].cl&&toasts.some(m=>/Finish a Mastery level/.test(m)));
v=G.view();t('crate goal explains the Gem requirement when the player cannot afford a roll yet',v.n===6&&/costs 3 Gems/.test(v.why)&&v.go[0]==='#quests');
Store.d.gems=3;t('...and points at the Gem-Shop once they can',G.view().go[0]==='#shop');
Store.d.inv=['t_larper'];G.sweep();t('crate goal auto-completes after the first cosmetic',G.state().rows[5].cl);
// ---- last starter goal -> rank goal
t('last starter goal is Copper',G.view().n===7&&G.view().title==='Reach Copper rank');
Store.d.rk=1;G.sweep();v=G.view();t('after the starter path the goal is simply the next rank (no second system)',v.kind==='rank'&&v.title==='Reach Bronze'&&v.go[0]==='#rankup'&&/\$100/.test(v.rewardTxt)===false||v.kind==='rank');
Store.d.rc=725;Store.d.rq=50;v=G.view();t('rank goal reads 100% and says Rank up now when ready',v.pct===100&&/Rank up now/.test(v.go[1]));
Store.d.rk=3;v=G.view();t('max rank: calm "maximum rank" goal',v.kind==='max');
// ---- veterans and tampering
fresh();Store.d.rk=2;G.sweep();t('existing player (rank 2): every starter goal silently claimed, no reward, no toast',G.state().rows.every(r=>r.cl)&&Store.d.balance===10&&Store.d.gems===0&&toasts.length===0&&G.view().kind==='rank');
fresh();Store.d.lq=40;t('existing player (40+ rounds): starter path skipped',G.view().kind==='rank');
fresh();settle('MINES');G.claim(0);store[G.KEY]=store[G.KEY].replace(/"k":\d+/,'"k":127');t('edited starter save is not trusted: everything counts as claimed, nothing is paid',G.state().rows.every(r=>r.cl));
fresh();store[G.KEY]=JSON.stringify({k:0});t('unsigned starter save is not trusted',G.state().rows.every(r=>r.cl));
fresh();Store.d.user='';t('no player yet (welcome screen): no goal, no crash',G.view()===null&&G.sweep()===undefined);
// ---- milestone toasts
fresh();Store.d.rc=130;Store.d.rq=20;G.milestones();t('rank progress: halfway toast fires once',toasts.filter(m=>/Halfway/.test(m)).length===1&&(G.milestones(),toasts.filter(m=>/Halfway/.test(m)).length===1));
Store.d.rc=225;Store.d.rq=40;G.milestones();t('rank ready toast fires once',toasts.filter(m=>/Rank-Up ready/.test(m)).length===1&&(G.milestones(),toasts.filter(m=>/Rank-Up ready/.test(m)).length===1));
// ---- tips + feedback helpers
t('every mini-game has a how-to-play tip',['plinko','mines','crash','chicken','flip','aviamasters','doubleornothing','blackjack','cases','guessthecup'].every(k=>G.TIPS[k]&&G.TIPS[k].length>20));
t('tip keys match wager names (GUESS THE CUP -> guessthecup)',Feedback.tipKey('GUESS THE CUP')==='guessthecup'&&Feedback.tipKey('DOUBLE OR NOTHING')==='doubleornothing');
fresh();Store.d.rc=100;Store.d.rq=10;t('rank-up hint lists exactly what is missing',Feedback.need(Rank.status())==='Still needed: $125 more earned and 30 more rounds.');
Store.d.rc=225;Store.d.rq=39;t('...only the missing part',Feedback.need(Rank.status())==='Still needed: 1 more rounds.');
// ---- shop model (needs the real crates.js)
if(REAL&&typeof Crate!=='undefined'){fresh();Store.d.gems=7;const m1=Shop2.model('tags'),m2=Shop2.model('grads');
t('shop: 7 Gems = 2 rolls at 3 each, affordable',m1.rolls===2&&m1.afford&&m1.missing===0&&m1.cost===CFG.CRATE.COST);
Store.d.gems=1;t('shop: 1 Gem -> cannot afford, 2 missing',!Shop2.model('tags').afford&&Shop2.model('tags').missing===2);
t('shop: shown legendary chance equals the rolled table total',Math.abs(m1.legend-Crate.totals('tags').legendary)<1e-12&&Math.abs(m2.legend-10)<1e-9);
t('shop: top prizes are real legendaries, at most 3',m1.top.length===3&&m1.top.every(c=>c.rar==='legendary'&&c.type==='tag')&&m2.top.every(c=>c.type==='grad'));
Store.d.inv=['t_larper'];t('shop: collection counts follow the inventory',Shop2.model('tags').own===1&&Shop2.model('tags').fresh===Shop2.model('tags').all-1);
t('shop: duplicate resale range uses the real Gem value x 100',m1.dupMin===100&&m1.dupMax===500)}
else console.log('SKIP shop model tests (need real crates.js)');
console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
