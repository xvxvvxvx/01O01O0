// Update 2.7 tests: Pirate odds, Mastery, Pirate Token perks, extra rows, caps, selling, instant rank-up, limited cosmetics, dev gating. Run: node tests/update27.test.js
const fs=require('fs'),vm=require('vm'),path=require('path'),J=f=>path.join(__dirname,'../js/'+f+'.js');
const store={};global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>{delete store[k]}};global.window=global;global.Games={};global.addEventListener=()=>{};
const toasts=[];global.App={toast:m=>toasts.push(m),bal(){},settle:(g,b,gr)=>Econ.settle(g,b,gr)};
const prod={hostname:'example.github.io',protocol:'https:'},local={hostname:'localhost',protocol:'http:'};global.location=prod;
for(const f of ['config','cosmetics','cosfx','limited','storage','stats','economy','mastery','games/aviamasters'])vm.runInThisContext(fs.readFileSync(J(f),'utf8'),{filename:f});
// fake Aviamasters mount that reports the speed table it would see; pirate.js wraps it
let seen=null;Games.aviamasters.mount=function(){seen=Games.aviamasters.aviSpeed(0);return()=>{}};
for(const f of ['games/cases','pirate'])vm.runInThisContext(fs.readFileSync(J(f),'utf8'),{filename:f});
const realLoad=Store.load.bind(Store);Store.load=()=>Store.d;
let pass=0,fail=0;const t=(n,ok,x='')=>{ok?pass++:fail++;console.log((ok?'PASS ':'FAIL ')+n+(x?'  '+x:''))};
const fresh=()=>{for(const k in store)delete store[k];Store.d=Store.def();Store.d.user='t';Store.sync();toasts.length=0};
const C=Games.cases,R=CFG.RANKS,LAST=R.length-1,rows=src=>src,O=k=>({r:C.RAR.find(r=>r.k===k),m:0});
const mk=(k,m)=>{const o=O(k);o.m=m!==undefined?m:o.r.min;return o};
const RT=p=>path.join(__dirname,'..',p),src0=fs.readFileSync(RT('js/games/cases.js'),'utf8');
(async()=>{
// ---- 0. carried over from the original 2.7 test (Pirate Token presentation, persistence, offline cache), updated for 0.05%
{const rowsx=[...src0.matchAll(/k: '(\w+)'.*?min: ([\d.]+),\s*max: ([\d.]+),\s*p: ([\d.]+),\s*d: ([\d.]+)/g)].map(m=>({k:m[1],lo:+m[2],hi:+m[3],p:+m[4],d:+m[5]})),pp=rowsx.find(r=>r.k==='Pirate');
t('source: Pirate Token is the 8th and rarest tier, rolled 0.05%, shown 0.05%, pays 100-150x',rowsx.length===8&&rowsx[7].k==='Pirate'&&rowsx.every(r=>r.p>=pp.p)&&pp.p===.05&&pp.d===.05&&pp.lo===100&&pp.hi===150);
t('source: rolled odds total 100 and map to 10,000 integer weights; displayed odds total 100',Math.abs(rowsx.reduce((a,r)=>a+r.p,0)-100)<1e-9&&rowsx.reduce((a,r)=>a+Math.round(r.p*100),0)===10000&&Math.abs(rowsx.reduce((a,r)=>a+r.d,0)-100)<1e-9);
t('icon is img/case-pirate.jpg and the file is a real JPEG',/ic: 'img\/case-pirate\.jpg'/.test(src0)&&fs.existsSync(RT('img/case-pirate.jpg'))&&fs.readFileSync(RT('img/case-pirate.jpg')).slice(0,2).toString('hex')==='ffd8');
t('cinematic text is "PIRATE TOKEN" / "NEW RARITY ACHIEVED" and is still in the source',src0.includes('>PIRATE TOKEN<')&&src0.includes('>NEW RARITY ACHIEVED<'));
t('chest opens, coin explosion + coin spray hooks exist',/class="lid"/.test(src0)&&/function coinShow/.test(src0)&&/function spray/.test(src0)&&/function pirate/.test(src0));
t('animated gold gradient styles exist (tile, odds line, past chip, title)',['.ct.r-Pirate','.pg-tx','.cs-past b.pg','.pt-l2'].every(s=>src0.includes(s)));
t('lifetime Pirate counter is persisted (storage.js)',/cc:\{Legendary:0,Mythic:0,Secret:0,Pirate:0\}/.test(fs.readFileSync(RT('js/storage.js'),'utf8')));
const sw=fs.readFileSync(RT('sw.js'),'utf8'),has=n=>sw.includes("'"+n+"'")||sw.includes('"'+n+'"');
t('sw.js pre-caches case-pirate.jpg, champion.jpg and radiant.jpg',['case-pirate.jpg','champion.jpg','radiant.jpg'].every(has));
t('sw.js pre-caches the 2.7 scripts (limited, mastery, pirate) and never dev.js',['js/limited.js','js/mastery.js','js/pirate.js'].every(has)&&!has('js/dev.js'));
t('loader.js loads limited before storage, mastery after crates, pirate after the games',(()=>{const l=fs.readFileSync(J('loader'),'utf8'),i=n=>l.indexOf("'"+n+"'");return i('limited')<i('storage')&&i('mastery')>i('crates')&&i('pirate')>i('games/guessthecup')})())}
// ---- 1. Cases odds
const src=fs.readFileSync(J('games/cases'),'utf8'),pr=C.RAR.find(r=>r.k==='Pirate');
t('Pirate Token rolled exactly 0.05%, pays 100-150x',pr.p===.05&&pr.d===.05&&pr.min===100&&pr.max===150&&pr.w===5&&C.TOT===10000);
t('rolled odds total 100 and displayed odds total 100',Math.abs(C.RAR.reduce((a,r)=>a+r.p,0)-100)<1e-9&&Math.abs(C.RAR.reduce((a,r)=>a+r.d,0)-100)<1e-9);
t('rare tiers slightly more common (L 5.6, M 2.9, S 0.85; was 5.2 / 2.6 / 0.7) without inflation (<+25%)',[['Legendary',5.2,5.6],['Mythic',2.6,2.9],['Secret',.7,.85]].every(([k,o,n])=>{const r=C.RAR.find(x=>x.k===k);return r.p===n&&n>o&&n/o<1.25}));
{const cnt={};let i=0,N=C.TOT;for(let s=0;s<N;s++){let first=true;const r=()=>{if(first){first=false;return (s+.5)/N}return .5};const o=C.roll(r);cnt[o.r.k]=(cnt[o.r.k]||0)+1}
t('exhaustive roll over all 10,000 weights reproduces every probability exactly (Pirate = 5 / 10,000)',C.RAR.every(r=>cnt[r.k]===r.w)&&cnt.Pirate===5)}
const rtp=C.RAR.reduce((a,r)=>a+r.p/100*(r.min+r.max)/2,0);t('Cases return is about 112.2% ('+(rtp*100).toFixed(2)+'%)',Math.abs(rtp-1.12185)<1e-6);
// ---- 2. Pirate reward table
t('14 rewards, unique ids, exact spec list',Perks.LIST.length===14&&new Set(Perks.LIST.map(p=>p.id)).size===14&&Perks.LIST.map(p=>p.name).join('|')==='+1 Case Row|+2 Case Rows|200 Gems|250 Gems|Case Speed +2x|Flight Speed +2x|Case Speed +3x|Flight Speed +3x|[THE PIRATE]|Treasure Finder Gradient|[TREASURE FINDER]|The Pirate Gradient|[KING OF THE PIRATES]|Instant Rank-Up');
{const c={};for(let i=0;i<14;i++)c[Perks.roll(()=>(i+.5)/14).id]=1;t('every reward is selected by exactly one slice of the roll (equal 1/14)',Object.keys(c).length===14);
const N=280000,h={};for(let i=0;i<N;i++){const p=Perks.roll(Math.random);h[p.id]=(h[p.id]||0)+1}t('280k random rolls: every reward within 0.3 points of 7.14%',Perks.LIST.every(p=>Math.abs(h[p.id]/N-1/14)<.003))}
// ---- 3. extra rows: cap 3, consumed by one wager
fresh();let g=Perks.grant(Perks.LIST[1]);t('+2 rows queued',g.applied===2&&Perks.get().r===2&&g.offer.amt===50000);
g=Perks.grant(Perks.LIST[1]);t('second +2 is capped at 3 rows total (applied 1)',g.applied===1&&g.capped&&Perks.get().r===3);
g=Perks.grant(Perks.LIST[0]);t('at the cap nothing more is added',g.applied===0&&Perks.get().r===3);
t('takeRows consumes all queued rows (one wager) and resets',Perks.takeRows()===3&&Perks.get().r===0&&Perks.takeRows()===0);
// ---- 4. combined multiplier, one round
t('row multipliers are added (1.5 + X + 2.4 + 0.3 = 4.2)',C.sumMult([mk('Rare',1.5),mk('X'),mk('Uncommon',2.4),mk('Common',.3)])===4.2);
fresh();Store.d.balance=1000;let b0=Store.d.balance;const rs=C.settleRows(10,[mk('Rare',1.5),mk('X'),mk('Uncommon',2.4),mk('Common',.3)]);
t('4-row wager pays bet x summed multiplier (10 x 4.2 = 42, net +32 after the 10 stake)',rs.M===4.2&&rs.pay===42&&Math.abs(Store.d.balance-(b0+42))<1e-9);
fresh();for(let i=0;i<2;i++)C.settleRows(1,[mk('Common',.5),mk('Common',.5),mk('Common',.5),mk('Common',.5)]);t('two 4-row wagers = 2 of the 3 Cases games needed for a round (rq 0, pt 2)',Store.d.rq===0&&Store.d.pt.CASES===2);
C.settleRows(1,[mk('Common',.5),mk('Common',.5),mk('Common',.5),mk('Common',.5)]);t('third wager completes exactly ONE round regardless of rows',Store.d.rq===1&&Store.d.cs===3);
fresh();C.settleRows(1,[mk('Legendary'),mk('Legendary'),mk('Mythic'),mk('X')]);t('drop counters count every row',Store.d.cc.Legendary===2&&Store.d.cc.Mythic===1&&Mastery.read().c.cases===4&&Mastery.read().c.lg===2&&Mastery.read().c.my===1);
fresh();const pk=C.settleRows(1,[mk('Pirate',100),mk('Pirate',100),mk('X')]);t('each Pirate Token row grants one Pirate reward',pk.perks.length===2&&Mastery.read().c.pt===2);
// ---- 5. speed upgrades: stack, cap 5x
fresh();Store.d.rk=0;g=Perks.grant(Perks.LIST[6]);t('Cases +3x at rank speed 1x -> 4x total',g.applied===3&&C.perkSpeed(0)===4);
g=Perks.grant(Perks.LIST[4]);t('+2x only adds 1 (capped at 5x)',g.applied===1&&g.capped&&C.perkSpeed(0)===5);
g=Perks.grant(Perks.LIST[6]);t('already at 5x: nothing added, speed stays 5x',g.applied===0&&C.perkSpeed(0)===5&&C.perkSpeed(24)===5);
fresh();Store.d.rk=7;Perks.grant(Perks.LIST[6]);g=Perks.grant(Perks.LIST[6]);t('rank speed counts toward the cap (Amethyst 2x + 3x + capped 0 = 5x)',Perks.get().c===3&&C.perkSpeed(7)===5&&g.applied===0);
fresh();Perks.grant(Perks.LIST[7]);g=Perks.grant(Perks.LIST[5]);t('Aviamasters +3x then +2x caps at 5x (base 1x)',g.applied===1&&Perks.aviBonus()===4);
{const orig=CFG.AVI_SPEED;Games.aviamasters.mount({});t('Aviamasters page sees boosted speed (5x) while mounted...',seen===5);
const cl=Games.aviamasters.mount({});cl();t('...and the rank table is restored on leaving',CFG.AVI_SPEED===orig&&Games.aviamasters.aviSpeed(34)===2.75)}
fresh();Perks.grant(Perks.LIST[7]);const m=Games.aviamasters.mount({});t('upgrade never exceeds 5x even with a 2.75x rank (rank 34)',(()=>{Store.d.rk=8;const v=Games.aviamasters.aviSpeed(34);m();return v===5})());
// ---- 6. selling
fresh();Store.d.balance=100;Perks.grant(Perks.LIST[1]);g=Perks.grant(Perks.LIST[1]);let rc0=Store.d.rc;let s1=Perks.sell(g),s2=Perks.sell(g);
t('row reward sells for $50,000 once, credits wallet AND rank money, removes the granted rows',s1.ok&&!s2.ok&&Store.d.balance===50100&&Store.d.rc===rc0+50000&&Perks.get().r===2);
fresh();g=Perks.grant(Perks.LIST[4]);Perks.sell(g);t('speed reward sells for $50,000 and reverts the upgrade',Store.d.balance===CFG.UNRANKED_START+50000&&Perks.get().c===0&&Store.d.rc===50000);
fresh();Store.d.inv.push('t_pirate');g=Perks.grant(Perks.LIST[8]);t('duplicate tag offers $45,000 and is not added twice',g.dup&&g.offer.amt===45000&&Store.d.inv.filter(x=>x==='t_pirate').length===1);
s1=Perks.sell(g);t('duplicate sale pays $45,000 once + rank money; owned copy kept',s1.ok&&Store.d.balance===CFG.UNRANKED_START+45000&&Store.d.rc===45000&&Store.d.inv.includes('t_pirate')&&!Perks.sell(g).ok);
fresh();g=Perks.grant(Perks.LIST[9]);t('new gradient goes to the inventory, no sale offered',g.fresh&&!g.offer&&Store.d.inv.includes('g_treasure'));
fresh();Perks.grant(Perks.LIST[2]);Perks.grant(Perks.LIST[3]);t('Gems rewards add 200 / 250',Store.d.gems===450);
// ---- 7. instant rank-up
fresh();Store.d.rk=2;Store.d.balance=1000;Store.d.rc=500;Store.d.rq=33;Store.d.pt={X:2};const gm=Store.d.gems,qn=Quests.n;g=Perks.grant(Perks.LIST[13]);
t('instant rank-up: next rank, wallet = new starting cash + 15% of old wallet, progress reset, rank Gems, rank quest counted',g.rank&&Store.d.rk===3&&Store.d.balance===R[3].rw.c+150+Mastery.by.ir.cash[0]&&Store.d.rc===0&&Store.d.rq===0&&Object.keys(Store.d.pt).length===0&&Store.d.gems===gm+R[3].rw.g&&Quests.n===qn+1&&Mastery.read().c.ir===1);
fresh();Store.d.rk=2;Store.d.balance=10;C.settleRows(100,[mk('Mythic',4)]);const before=Store.d.balance;g=Perks.grant(Perks.LIST[13]);t('15% is taken from the wallet AFTER the round payout ('+before+' kept 15%)',before>400&&Store.d.balance===R[3].rw.c+Econ.r2(before*.15)+Mastery.by.ir.cash[0]);
fresh();Store.d.rk=LAST;Store.d.balance=777;g=Perks.grant(Perks.LIST[13]);t('max rank: reward becomes a $100,000 sale instead',g.maxed&&!g.rank&&g.offer.amt===100000&&Store.d.rk===LAST&&Store.d.balance===777);
s1=Perks.sell(g);t('max-rank sale pays $100,000 and counts as rank money',s1.ok&&Store.d.balance===100777&&Store.d.rc===100000);
// ---- 8. Mastery
t('17 tracks x 10 levels, strictly rising requirements and cash',Mastery.tracks.length===17&&Mastery.tracks.every(x=>x.thr.length===10&&x.cash.length===10&&x.thr.every((v,i)=>i===0||v>x.thr[i-1])&&x.cash.every((v,i)=>i===0||v>x.cash[i-1])));
t('example milestone: 20 games played = $250',Mastery.by.mn.thr[0]===20&&Mastery.by.mn.cash[0]===250);
fresh();b0=Store.d.balance;let ev=Mastery.add('mn',19);t('19 Mines games: no level yet',ev.length===0&&Store.d.balance===b0);
ev=Mastery.add('mn',1);t('20th game: level 1, $250 paid automatically',ev.length===1&&ev[0].lv===1&&Store.d.balance===b0+250&&Mastery.read().l.mn===1);
t('tracks are independent',Mastery.read().l.cases===0&&Mastery.read().c.cases===0);
ev=Mastery.add('mn',80);t('reaching 100 pays level 2 (50) and level 3 (100) and grants the Level 3 tag',ev.map(e=>e.lv).join()==='2,3'&&Store.d.inv.includes('m_mn_3')&&Store.d.balance===b0+250+400+650);
ev=Mastery.add('mn',1e6);t('large jumps pay every level once; level 10 grants the premium tag; stops at 10',Mastery.read().l.mn===10&&Store.d.inv.includes('m_mn_6')&&Store.d.inv.includes('m_mn_10')&&Mastery.add('mn',5).length===0);
fresh();Econ.settle('MINES',1,0);Econ.settle('PLINKO',1,0);Econ.settle('FLIP',1,2);Econ.settle('DOUBLE OR NOTHING',1,0);Econ.settle('CHICKEN',1,0);Econ.settle('AVIAMASTERS',1,0);Econ.settle('CRASH',1,0);Econ.settle('CASES',1,0);
{const c=Mastery.read().c;t('every game counts on settle (CRASH / CASES-by-settle do not)',c.mn===1&&c.pl===1&&c.fl===1&&c.dn===1&&c.ck===1&&c.av===1&&!c.cases&&!c.bj)}
fresh();Econ.settle('BLACKJACK',10,0);Econ.settle('BLACKJACK',10,20);t('blackjack split hands settled in one tick = ONE game',Mastery.read().c.bj===1);await Promise.resolve();await Promise.resolve();Econ.settle('BLACKJACK',10,0);t('next blackjack game counts again',Mastery.read().c.bj===2);
fresh();Econ.settle('AVIAMASTERS',10,39.9);Econ.settle('AVIAMASTERS',10,45);Econ.settle('AVIAMASTERS',10,55);Econ.settle('AVIAMASTERS',10,65);Econ.settle('AVIAMASTERS',10,70);Econ.settle('AVIAMASTERS',10,2500);
{const c=Mastery.read().c;t('Aviamasters landing bands [4,5) [5,6) [6,7) 7+ (3.99x counts nowhere)',c.a4===1&&c.a5===1&&c.a6===1&&c.a7===2&&c.av===6)}
fresh();Store.d.bx=Date.now()+1e6;Econ.settle('AVIAMASTERS',10,45);t('2X profit bonus does not distort the landing band (4.5x stays 4-5x)',Mastery.read().c.a4===1&&Mastery.read().c.a5===0);
fresh();Econ.settle('AVIAMASTERS',10,45);const sig=store['0-100_v2.7_mastery'];t('mastery persists in its own key',!!sig&&Mastery.read().c.a4===1);
// ---- 9. limited cosmetics
t('56 limited cosmetics: 51 mastery (3 per objective: tag 3 / gradient 6 / tag 10) + 5 Pirate',Cos.lim.length===56&&Cos.lim.filter(c=>c.src==='mastery').length===51&&Mastery.tracks.every(x=>['tag','grad','tag'].join()===x.cos.map(id=>Cos.by(id).type).join())&&new Set(Cos.lim.map(c=>c.id)).size===56);
t('every limited cosmetic has name, description, effect, 3 colours, "limited" rarity; none are in the shop/crate catalogue',Cos.lim.every(c=>c.name&&c.desc&&c.lfx&&c.cols.length===3&&c.rar==='limited'&&c.lim&&!COS.includes(c)&&Cos.by(c.id)===c));
t('Flight Taker is the Aviamasters Level 3 tag with wind effects',Cos.by('m_av_3').label==='[FLIGHT TAKER]'&&Cos.by('m_av_3').lfx==='wind'&&/ lm-wind/.test(Cos.html(Cos.by('m_av_3'))));
t('Pirate cosmetics: flag / spark / coins up / coins down / hat',['t_pirate:flag','g_treasure:spark','t_treasure:coinU','g_pirate:coinD','t_pking:hat'].every(x=>{const[i,f]=x.split(':');return Cos.by(i).lfx===f&&Cos.by(i).src==='pirate'}));
t('[THE PIRATE] black-and-white, [KING OF THE PIRATES] white-and-red',/#000000/.test(Cos.by('t_pirate').bg)&&/#ffffff/.test(Cos.by('t_pirate').bg)&&/#ef4444/.test(Cos.by('t_pking').bg)&&/#ffffff/.test(Cos.by('t_pking').bg));
t('limited cosmetics render with the player name for gradients',Cos.user('Bob','g_pirate').includes('Bob')&&Cos.user('Bob','g_pirate').includes('lm-coinD'));
t('unsellable: sell value 0 and Inv.sell refuses (and keeps the item)',(()=>{fresh();Store.d.inv=['t_pirate','m_av_3'];const a=Inv.sell('t_pirate'),b=Inv.sell('m_av_3');return !a.ok&&!b.ok&&Cos.sellValue(Cos.by('t_pirate'))===0&&Store.d.inv.length===2})());
fresh();Store.d.inv=['t_pirate','g_pirate','m_av_3'];t('equip works through the existing system',Inv.apply('t_pirate','g_pirate')&&Store.d.eq.tag==='t_pirate'&&Store.d.eq.grad==='g_pirate'&&!Inv.apply('t_pking',null));
Store.save();realLoad();t('limited inventory + equipment persist through save/load',Store.d.inv.includes('m_av_3')&&Store.d.eq.tag==='t_pirate'&&Store.d.eq.grad==='g_pirate');
// ---- 10. developer gating
global.location=prod;t('DEVENV is false in production',DEVENV()===false);
fresh();Mastery.add('mn',5);t('devComplete refused in production (no change)',Mastery.devComplete('mn',3)===false&&Mastery.read().c.mn===5&&Mastery.devReset()===false&&Mastery.read().c.mn===5);
global.location={hostname:'evil.com',protocol:'https:'};t('lookalike hosts are not dev',DEVENV()===false);global.location={hostname:'localhost.evil.com',protocol:'https:'};t('localhost.evil.com is not dev',DEVENV()===false);
global.location=local;t('DEVENV true on localhost',DEVENV()===true);
fresh();b0=Store.d.balance;t('devComplete: Mines level 3 fulfils the requirement (100 games) and pays levels 1-3',Mastery.devComplete('mn',3)&&Mastery.read().c.mn===100&&Mastery.read().l.mn===3&&Store.d.inv.includes('m_mn_3')&&Store.d.balance===b0+250+400+650);
t('devComplete rejects bad input',!Mastery.devComplete('nope',3)&&!Mastery.devComplete('mn',0)&&!Mastery.devComplete('mn',11));
Store.d.inv.push('t_pirate');t('devReset clears progress + mastery cosmetics but keeps Pirate cosmetics',Mastery.devReset()&&Mastery.read().c.mn===0&&!Store.d.inv.includes('m_mn_3')&&Store.d.inv.includes('t_pirate'));
global.location=prod;
t('dev.js is inert when loaded in production (no listeners, no menu)',(()=>{let n=0;global.document={};global.addEventListener=()=>{n++};vm.runInThisContext(fs.readFileSync(J('dev'),'utf8'),{filename:'dev'});delete global.document;global.addEventListener=()=>{};return n===0})());
t('loader only fetches dev.js on localhost',/LOCAL\?\['dev'\]:\[\]/.test(fs.readFileSync(J('loader'),'utf8')));
t('Cases forced-Pirate hook honours DEVENV (ignored in production)',/const dev=isDev\(\)\?api\.dev:null/.test(src));
console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0)})();
