// Update 2.95 tests: k/m/b wagers, round qualification (anti-farm), Mines limits, Daily rank scaling, goal bars, wiring. Run: node tests/update295.test.js
const fs=require('fs'),vm=require('vm'),path=require('path'),J=f=>path.join(__dirname,'../js/'+f+'.js'),R=f=>path.join(__dirname,'..',f);
const store={};global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>{delete store[k]}};global.window=global;global.Games={};global.addEventListener=()=>{};
const toasts=[];global.App={toast:m=>toasts.push(m),bal(){}};
global.location={hostname:'example.github.io',protocol:'https:'};
for(const f of ['config','cosmetics','cosfx','limfx','limited','storage','stats','economy','mastery','progress'])vm.runInThisContext(fs.readFileSync(J(f),'utf8'),{filename:f});
Store.load=()=>Store.d;
let pass=0,fail=0;const t=(n,ok,x='')=>{ok?pass++:fail++;console.log((ok?'PASS ':'FAIL ')+n+(x?'  '+x:''))};
const fresh=()=>{for(const k in store)delete store[k];Store.d=Store.def();Store.d.user='t';Store.sync();toasts.length=0};
const src=f=>fs.readFileSync(R(f),'utf8');
// ---- k / m / b
const P=Econ.parseAmt;
t('parseAmt: plain numbers',P('1')===1&&P('12.5')===12.5&&P(' 7 ')===7&&P('.5')===.5&&P(3)===3);
t('parseAmt: 1.5k = 1500, 2m = 2,000,000, 1b = 1e9',P('1.5k')===1500&&P('2m')===2000000&&P('1b')===1e9);
t('parseAmt: upper-case, spaces and commas',P('1.5K')===1500&&P('2 M')===2e6&&P('1,250k')===1250000);
t('parseAmt: decimal-safe (0.07k = 70, 1.1m = 1,100,000, 0.001k = 1)',P('0.07k')===70&&P('1.1m')===1100000&&P('0.001k')===1);
t('parseAmt: junk is rejected (NaN)',['abc','1kk','k','0x10','1e3','1k2','--1','','1.2.3','5x'].every(x=>Number.isNaN(P(x))));
fresh();Store.d.balance=5e9;Store.sync();
const ck=(raw,g='MINES')=>Econ.checkBet(raw,g,Store.d.balance);
t('checkBet: 1.5k / 2m / 1b are valid wagers',ck('1.5k').v===1500&&ck('2m').v===2e6&&ck('1b').v===1e9);
t('checkBet: still rejects 0, negatives, >2 decimals and over-balance',!ck('0').ok&&!ck('-5k').ok&&!ck('0.001').ok&&ck('1.234k').ok&&!ck('6b').ok);
t('checkBet: Plinko minimum still $1 (0.5k ok, 0.0005k rejected)',Econ.checkBet('0.5k','PLINKO',1e6).ok&&!Econ.checkBet('0.0005k','PLINKO',1e6).ok);
const main=src('js/main.js');
t('wager input is a text input (accepts suffixes) and the 1/2 / 2x buttons parse it',/<input class="bet" type="text"/.test(main)&&/Econ\.parseAmt\(i\.value\)/.test(main));
// ---- round qualification
const rounds=(bet,gross,opts,g='MINES')=>{fresh();Store.d.balance=1000;Store.sync();const rq=Store.d.rq,b0=Store.d.balance;Store.d.balance=Econ.r2(Store.d.balance-bet);Store.sync();Econ.settle(g,bet,gross,opts);return{dq:Store.d.rq-rq,bal:Store.d.balance}};
t('round qualification: a $1 wager counts as a round',rounds(1,0).dq===1);
t('round qualification: a $0.01 wager does NOT count (but still settles)',rounds(.01,0).dq===0&&Math.abs(rounds(.01,.02).bal-1000.01)<1e-9);
t('round qualification: {noCount:true} does not count, stake still lost',(r=>r.dq===0&&r.bal===999)(rounds(1,0,{noCount:true})));
t('round qualification: profit still feeds rank money even when the round is not counted',(()=>{fresh();Store.d.balance=100;Store.sync();Econ.settle('MINES',.5,1.5);return Store.d.rc>0&&Store.d.rq===0})());
t('Blackjack split: only the first hand counts as a round',/hi>0\?\{noCount:true\}/.test(src('js/games/blackjack.js')));
t('abandoned live wagers settle with noCount',/this\.settle\(l\.game,l\.bet,0,\{noCount:true\}\)/.test(main));
t('every settle wrapper forwards the options argument (main, feedback, mastery, economy)',/settle\(game,bet,gross,opts\)\{const pay=Econ\.settle\(game,bet,gross,opts\)/.test(main)&&/function\(g,b,gross,o\)\{const pay=os\.call\(this,g,b,gross,o\)/.test(src('js/feedback.js'))&&/s\.call\(this,g,b,gross,o\)/.test(src('js/mastery.js'))&&/settle\(game,bet,gross,opts\)/.test(src('js/economy.js')));
t('Mastery ignores noCount rounds and sub-minimum wagers',/noCount\)&&b>=CFG\.ROUND_MIN_BET/.test(src('js/mastery.js')));
// ---- Mines
const mn=src('js/games/mines.js');
t('Mines: 24 mines (one diamond left) is not selectable (1-'+CFG.MINES.MAX_MINES+')',CFG.MINES.MAX_MINES===23&&/length:CFG\.MINES\.MAX_MINES/.test(mn)&&!/length:24/.test(mn));
t('Mines: the mine count is validated before the wager is taken',/Math\.floor\(\+el\.querySelector\('#mc'\)\.value\)/.test(mn)&&mn.indexOf('MAX_MINES){App.toast')>-1||mn.indexOf("m<=CFG.MINES.MAX_MINES")<mn.indexOf("App.bet(el,'MINES')"));
t('Mines: a loss with no safe tile does not count as a round',/App\.settle\('MINES',bet,0,\{noCount:rev\.size<1\}\)/.test(mn));
t('Mines / Chicken / Flip have a minimum gap between rounds',CFG.GAP_MS.MINES>=1000&&CFG.GAP_MS.CHICKEN>0&&CFG.GAP_MS.FLIP>0);
t('Econ.cool enforces the Mines gap',(()=>{fresh();const n=1e12;return Econ.cool('MINES',n)===0&&Econ.cool('MINES',n+100)>0&&Econ.cool('MINES',n+CFG.GAP_MS.MINES+1)===0})());
// ---- Daily Spin scaling
t('Daily: Unranked is x1 (250-750 cash, 1-4 gems)',Daily.scale(0)===1&&(()=>{let lo=1e9,hi=0,gl=9,gh=0;for(let i=0;i<4000;i++){const a=Daily.roll(Math.random,0);if(a.id==='low'){lo=Math.min(lo,a.amount);hi=Math.max(hi,a.amount)}if(a.id==='gem'){gl=Math.min(gl,a.amount);gh=Math.max(gh,a.amount)}}return lo>=250&&hi<=750&&gl>=1&&gh<=4})());
t('Daily: rewards scale up with rank (cash and gems)',(()=>{const mx=(rk,id)=>{let h=0,l=1e9;for(let i=0;i<4000;i++){const a=Daily.roll(Math.random,rk);if(a.id===id){h=Math.max(h,a.amount);l=Math.min(l,a.amount)}}return[l,h]};const[l10,h10]=mx(10,'low'),[g10l,g10h]=mx(10,'gem'),[l30,h30]=mx(30,'low');return Daily.scale(10)>Daily.scale(3)&&l10>=500&&h10<=1500&&g10h>4&&g10l>=2&&h30>h10})());
t('Daily: 2X bonus unchanged and the claim is stored once (no re-roll on credit)',(()=>{fresh();Store.d.rk=5;Store.sync();const r=Daily.claim(1e12);const again=Daily.claim(1e12);return r&&again===null&&Store.d.dr.amount===r.amount})());
// ---- goal bars
t('Goals: rankBars returns money and rounds separately',(()=>{fresh();Store.d.rc=100;Store.d.rq=7;Store.sync();const b=Goals.rankBars();return b&&b.c===100&&b.cr===CFG.RANKS[0].req.c&&b.r===7&&b.rr===CFG.RANKS[0].req.r})());
t('Goals: bars cap at the requirement and disappear at the top rank',(()=>{fresh();Store.d.rc=1e9;Store.d.rq=1e9;Store.sync();const b=Goals.rankBars();Store.d.rk=CFG.RANKS.length-1;Store.sync();return b.c===b.cr&&b.r===b.rr&&Goals.rankBars()===null})());
const pg=src('js/progress.js');
t('Goals: eye toggle, two bars, remembered choice',/data-geye/.test(pg)&&/gold_goal_hide/.test(pg)&&/bar2\('Money'/.test(pg)&&/bar2\('Rounds'/.test(pg)&&/aria-label=.*Hide objectives/.test(pg));
t('Goals: strip repaints when either bar or the eye changes',/hidden\(\),v\.bars/.test(pg));
// ---- release wiring
t('service worker cache bumped and game page shows Update 2.95',/gold-offline-v2\.95/.test(src('sw.js'))&&/Update 2\.95/.test(src('game.html')));
t('Exploit Audit file exists',fs.existsSync(R('EXPLOIT_AUDIT.md'))&&/Exploit Audit/.test(src('EXPLOIT_AUDIT.md')));
const av=src('js/games/aviamasters.js');
t('Aviamasters: landing-chances dropdown is animated (body wrapper + reduced-motion path)',/class="avp-body"/.test(av)&&/prefers-reduced-motion/.test(av)&&/avp-body/.test(src('css/update29.css')));
console.log(pass+' passed, '+fail+' failed');process.exit(fail?1:0);
