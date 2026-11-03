// Logic tests. Run: node tests/economy.test.js   (no browser needed)
const fs=require('fs'),vm=require('vm'),path=require('path');
const store={};global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>{delete store[k]}};global.window=global;global.Games={};global.addEventListener=()=>{};
const toasts=[];global.App={toast:m=>toasts.push(m),bal(){}};
for(const f of ['config','cosmetics','storage','stats','economy'])vm.runInThisContext(fs.readFileSync(path.join(__dirname,'../js/'+f+'.js'),'utf8'),{filename:f});
vm.runInThisContext(fs.readFileSync(path.join(__dirname,'../js/games/guessthecup.js'),'utf8'));
const realLoad=Store.load.bind(Store);Store.load=()=>Store.d;   // tests keep state in memory; the real reload path is exercised via realLoad()
let pass=0,fail=0;const t=(n,ok,x='')=>{ok?pass++:fail++;console.log((ok?'PASS ':'FAIL ')+n+(x?'  '+x:''))};const near=(a,b)=>Math.abs(a-b)<1e-9;
const fresh=()=>{Store.d=Store.def();Store.d.user='t';toasts.length=0};const R=CFG.RANKS;
// ---- ranks
const reqs=[[250,50],[800,60],[2500,90],[5000,100],[9000,200],[14000,300],[20000,400],[30000,600],[50000,750],[70000,1000]],rw=[[50,1],[100,2],[250,3],[250,4],[250,5],[250,6],[250,7],[500,8],[500,10],[750,12]];
t('rank order Unranked..Extreme Demon',R.map(r=>r.n).join()==='Unranked,Copper,Bronze,Silver,Iron,Ruby,Emerald,Amethyst,Diamond,Ascended,Verifier I,Verifier II,Verifier III,Champion I,Champion II,Champion III,Radiant I,Radiant II,Radiant III,Insane Demon I,Insane Demon II,Extreme Demon'&&R[21].req===null&&R.slice(0,21).every(r=>r.req));
const exp=[[80000,1000],[90000,1000],[100000,1000],[130000,1250],[145000,1250],[170000,1500],[190000,1500],[210000,1500],[240000,1750],[280000,2000],[300000,2000]],exr=[[750,12],[750,12],[750,12],[1250,14],[1250,14],[1250,14],[1500,16],[1500,16],[1500,16],[1750,18],[1750,18],[2000,20]];
t('expansion requirements + rewards match the reference',exp.every(([c,r],i)=>R[10+i].req.c===c&&R[10+i].req.r===r)&&exr.every(([c,g],i)=>R[10+i].rw.c===c&&R[10+i].rw.g===g));
t('rank-up requirements match the table',reqs.every(([c,r],i)=>R[i].req.c===c&&R[i].req.r===r));
t('rank-up rewards (starting Steakcoin + Gems) match the table',rw.every(([c,g],i)=>R[i+1].rw.c===c&&R[i+1].rw.g===g));
t('no rank multiplier fields remain in config',R.every(r=>!('m' in r)));
fresh();t('new player: Unranked, default test balance, 0 gems',Store.d.rk===0&&Store.d.balance===CFG.UNRANKED_START&&Store.d.gems===0);
// ---- payouts: ranks never multiply winnings
for(let r=0;r<=10;r++){fresh();Store.d.rk=r;if(Econ.payout(100,150)!==150||Econ.payout(100,0)!==0)fail++}
t('payout identical at every rank (no rank multiplier)',(()=>{for(let r=0;r<=10;r++){fresh();Store.d.rk=r;if(Econ.payout(100,150)!==150)return false}return true})());
fresh();Store.d.bx=Date.now()+60000;t('2X bonus doubles PROFIT only (bet 100, gross 150 -> 200)',Econ.payout(100,150)===200&&Econ.payout(100,0)===0&&Econ.payout(100,60)===60);
t('2X bonus no longer described as stacking with a rank multiplier',!/rank/i.test(Econ.summary()));
// ---- mini-game conversion + rank money
fresh();for(let i=0;i<999;i++)Econ.settle('PLINKO',1,1);t('999 Plinko balls = 0 rounds',Store.d.rq===0);Econ.settle('PLINKO',1,1);t('1000 Plinko balls = 1 round',Store.d.rq===1);
fresh();for(let i=0;i<5;i++){Econ.settle('FLIP',1,1);Econ.settle('DOUBLE OR NOTHING',1,1)}t('5 Flip + 5 DoN = 2 rounds',Store.d.rq===2);fresh();Econ.settle('MINES',1,1);Econ.settle('CASES',1,1);t('other games 1:1 (Cases is 3:1)',Store.d.rq===1);fresh();for(let i=0;i<3;i++)Econ.settle('CASES',1,1);t('3 Cases games = 1 round',Store.d.rq===1);
fresh();Econ.settle('MINES',100,150);t('rank money = net profit (50)',Store.d.rc===50);Econ.settle('MINES',100,0);t('losses do not reduce earned rank money',Store.d.rc===50);
// ---- Daily Spin counts toward rank money (regression)
fresh();Store.d.dr={id:'low',amount:400};Store.d.dc=false;Store.d.dl=1;const bal=Store.d.balance;Daily.credit();Daily.credit();
t('REGRESSION: Daily Spin Steakcoin reward advances rank money, exactly once',Store.d.rc===400&&near(Store.d.balance,bal+400));
fresh();Store.d.dr={id:'gem',amount:3};Store.d.dc=false;Daily.credit();Daily.credit();t('Gem reward -> Gems only (not Steakcoin, not rank money), once',Store.d.gems===3&&Store.d.rc===0&&Store.d.balance===CFG.UNRANKED_START);
fresh();Store.d.dr={id:'x2',amount:0};Store.d.dc=false;const n0=Date.now();Daily.credit(n0);Daily.credit(n0+5000);t('2X bonus = 15 min, no stacking',Store.d.bx===n0+900000);
t('daily reward table: 60/20/20 and total 100',CFG.DAILY.REWARDS.map(r=>r.p).join()==='60,20,20');t('gem reward range is 1-4 (not 1,000-4,000)',CFG.DAILY.REWARDS[1].min===1&&CFG.DAILY.REWARDS[1].max===4&&CFG.DAILY.REWARDS[1].id==='gem');
let c={low:0,gem:0,x2:0},ok=true,N=200000;for(let i=0;i<N;i++){const r=Daily.roll();c[r.id]++;if(r.id==='gem'&&(r.amount<1||r.amount>4))ok=false;if(r.id==='low'&&(r.amount<250||r.amount>750))ok=false}
t('daily odds ~60/20/20 over 200k rolls; amounts in range',ok&&Math.abs(c.low/N-.6)<.01&&Math.abs(c.gem/N-.2)<.01&&Math.abs(c.x2/N-.2)<.01);
fresh();const T0=1e12;t('claim once, second refused, allowed after 24h',!!Daily.claim(T0)&&Daily.claim(T0+9)===null&&Daily.claim(T0+86399000)===null&&!!Daily.claim(T0+86400000));
// ---- rank-up
fresh();Store.d.rk=0;Store.d.rc=2500;Store.d.rq=50;Store.d.balance=9999;Store.d.lq=40;Store.d.gems=5;Store.d.inv=['t_larper'];const r1=Rank.rankUp(),r2=Rank.rankUp();
t('rank-up: Copper, balance=$50, +1 Gem, once only',r1&&!r2&&Store.d.rk===1&&Store.d.balance===50&&Store.d.gems===6);t('rank-up keeps lifetime stats + cosmetics, clears rank progress',Store.d.lq===40&&Store.d.inv.length===1&&Store.d.rc===0&&Store.d.rq===0);
let allr=true;for(let i=0;i<10;i++){fresh();Store.d.rk=i;Store.d.rc=R[i].req.c;Store.d.rq=R[i].req.r;Store.d.gems=0;const o=Rank.rankUp();if(!o||Store.d.balance!==R[i+1].rw.c||Store.d.gems!==R[i+1].rw.g)allr=false}t('every rank-up grants its exact cash + gems',allr);
fresh();Store.d.rc=249.99;Store.d.rq=50;t('not eligible at $249.99',!Rank.status().ready);Store.d.rc=250;Store.d.rq=49;t('not eligible at 49 rounds',!Rank.status().ready);
fresh();Store.d.rk=21;Store.d.rc=1e9;Store.d.rq=1e9;t('Extreme Demon cannot rank up',Rank.rankUp()===null);
fresh();Store.d.rk=3;Econ.resetBalance();t('Reset Balance uses the rank starting cash (Silver $250)',Store.d.balance===250&&Store.d.gems===0);fresh();Econ.resetBalance();t('Reset Balance Unranked = configurable default, no gems',Store.d.balance===CFG.UNRANKED_START&&Store.d.gems===0);
fresh();Store.d.rk=2;Store.d.balance=5;Econ.resetBalance();t('reset does not change rank/progress or count as earnings',Store.d.rk===2&&Store.d.rc===0);
// ---- gems conversion
t('1 Gem = 50 Steakcoin; reference value 1 Gem = $500 is separate',CFG.GEM.TO_COIN===50&&CFG.GEM.REF_USD===500);
fresh();Store.d.gems=5;const g1=Gems.convert(3);t('convert 3 gems -> +150 Steakcoin, atomic',g1.ok&&Store.d.gems===2&&Store.d.balance===CFG.UNRANKED_START+150);t('conversion is not rank money / profit / quest progress',Store.d.rc===0&&Store.d.q.d.p.profit===0&&Store.d.pw===0);
t('cannot convert more gems than owned / zero / negative',!Gems.convert(3).ok&&!Gems.convert(0).ok&&!Gems.convert(-1).ok&&Store.d.gems===2);
// ---- cosmetics catalog + prices
t('catalog: 23 tags + 14 gradients, unique ids',COS.filter(c=>c.type==='tag').length===23&&COS.filter(c=>c.type==='grad').length===14&&new Set(COS.map(c=>c.id)).size===37);
t('no Common gradients',!COS.some(c=>c.type==='grad'&&c.rar==='common'));
const cnt=(ty,r)=>COS.filter(c=>c.type===ty&&c.rar===r).length;t('rarity counts: tags 5/5/5/8, gradients 0/5/4/5',[cnt('tag','common'),cnt('tag','rare'),cnt('tag','epic'),cnt('tag','legendary'),cnt('grad','common'),cnt('grad','rare'),cnt('grad','epic'),cnt('grad','legendary')].join()==='5,5,5,8,0,5,4,5');
t('normal prices 1/2/3/5, deal prices 1/1/2/3',['common','rare','epic','legendary'].map(r=>CFG.RAR[r].gems).join()==='1,2,3,5'&&['common','rare','epic','legendary'].map(r=>CFG.RAR[r].deal).join()==='1,1,2,3');
t('Flame gradient is 0deg #490e24,#f35e61,#ffe385',Cos.by('g_flame').bg==='linear-gradient(0deg,#490e24,#f35e61,#ffe385)');t('Grief tag animated 180deg #731919->#e52b2b; Big Spender static #ffde59',/180deg,#731919,#e52b2b/.test(Cos.by('t_grief').bg)&&Cos.by('t_grief').anim&&!Cos.by('t_bigspender').anim&&/#ffde59/.test(Cos.by('t_bigspender').bg));
t('Gem gradient #f093ff->#be0bb1',Cos.by('g_gem').bg==='linear-gradient(90deg,#f093ff,#be0bb1)');
// ---- shop rotation
let bad=0,leg=0,W=20000,rc={common:0,rare:0,epic:0,legendary:0};for(let id=1e6;id<1e6+W;id++){const s=Shop.gen(id,0),cs=s.offers.map(o=>Cos.by(o.id));if(cs.length!==7||new Set(s.offers.map(o=>o.id)).size!==7||cs.filter(c=>c.type==='grad').length!==4||cs.filter(c=>c.type==='tag').length!==3||s.offers.filter(o=>o.deal).length!==4)bad++;if(cs.some(c=>c.rar==='legendary'))leg++;cs.forEach(c=>rc[c.rar]++)}
t('20k rotations: always 7 distinct offers = 4 gradients + 3 tags (4 deals + 3 featured)',bad===0);t('every rotation has >=1 Legendary',leg===W);
const tot=Object.values(rc).reduce((a,b)=>a+b);t('appearance favours Common/Rare over Epic/Legendary',rc.common+rc.rare>rc.epic+rc.legendary,Object.entries(rc).map(([k,v])=>k+' '+(v/tot*100).toFixed(1)+'%').join(' '));
let l1=0;for(let id=1;id<=3000;id++){if(Shop.gen(id,0).offers.filter(o=>Cos.by(o.id).rar==='legendary').length>1)l1++}t('guaranteed Legendary does not flood shops with several',l1/3000<.35,(l1/3000*100).toFixed(0)+'% have 2+');
fresh();const now=Math.floor(1.7e12/CFG.SHOP.ROTATION_MS)*CFG.SHOP.ROTATION_MS+1000,sA=Shop.current(now),sB=Shop.current(now+11*3600e3);t('shop stable inside a 12h window (refresh/tabs)',JSON.stringify(sA)===JSON.stringify(sB));const sC=Shop.current(now+13*3600e3);t('new rotation after expiry',sC.id!==sA.id);
t('rotation expires on 12h boundary',Shop.expires(now)%CFG.SHOP.ROTATION_MS===0&&Shop.expires(now)>now&&Shop.expires(now)-now<=CFG.SHOP.ROTATION_MS);
// ---- buy / sell
fresh();const sh=Shop.current(),off=sh.offers[0],oc=Cos.by(off.id),price=Shop.price(oc,off.deal);Store.d.gems=0;t('buy fails without enough gems, nothing granted',!Inv.buy(off.id).ok&&Store.d.inv.length===0);
Store.d.gems=price+1;const b1=Inv.buy(off.id),b2=Inv.buy(off.id);t('buy deducts price exactly once and adds item once',b1.ok&&!b2.ok&&Store.d.gems===1&&Store.d.inv.filter(x=>x===off.id).length===1);
t('item not in the current shop cannot be bought',!Inv.buy(COS.find(c=>!sh.offers.some(o=>o.id===c.id)).id).ok);
fresh();Store.d.inv=['t_larper','g_gem','t_grief'];t('equip requires ownership',!Inv.apply('t_beast',null)&&Inv.apply('t_larper','g_gem')&&Store.d.eq.tag==='t_larper'&&Store.d.eq.grad==='g_gem');
const before=Store.d.balance,s1=Inv.sell('t_grief'),s2=Inv.sell('t_grief');t('sell Legendary (5 gems) = $250, once; no gems; no rank money/profit',s1.ok&&s1.amt===250&&!s2.ok&&Store.d.balance===before+250&&Store.d.gems===0&&Store.d.rc===0&&Store.d.q.d.p.profit===0);
Inv.sell('g_gem');t('selling an equipped item unequips it',Store.d.eq.grad===null&&Store.d.eq.tag==='t_larper');t('sale values = gem value x 50 (1:50, 2:100, 3:150, 5:250)',[1,2,3,5].every((g,i)=>Cos.sellValue({rar:['common','rare','epic','legendary'][i]})===g*50));
// ---- quests
const D=CFG.QUEST.daily,WQ=CFG.QUEST.weekly;fresh();for(let i=0;i<499;i++)Econ.settle('MINES',1,1);t('499 rounds: daily rounds quest not complete',!Quests.done('d',D[0])&&!toasts.length);Econ.settle('MINES',1,1);
t('500th round completes quest + sends the exact notification',Quests.done('d',D[0])&&toasts.includes('Quest completed! Claim reward at Quests page.'));
const gb=Store.d.gems,c1=Quests.claim('d','d_r500'),c2=Quests.claim('d','d_r500');t('claim awards 2 Gems once; second claim refused',c1===2&&c2===null&&Store.d.gems===gb+2);
fresh();Econ.settle('MINES',100,150);Econ.settle('MINES',100,0);t('profit quest uses net profit only (50), not gross payouts',Quests.prog('d',D[1])===50);
fresh();Econ.settle('MINES',10000,20000);t('10,000 profit completes the daily profit quest (3 Gems)',Quests.done('d',D[1])&&Quests.claim('d','d_p10k')===3);
fresh();Store.d.gems=9;Gems.convert(1);Store.d.inv=['t_larper'];Inv.sell('t_larper');t('conversions/sales never advance quests',Store.d.q.d.p.profit===0&&Store.d.q.w.p.profit===0);
fresh();for(let i=0;i<5;i++){Store.d.rc=R[Store.d.rk].req.c;Store.d.rq=R[Store.d.rk].req.r;Rank.rankUp()}t('weekly "Rank up 5 times" completes only after 5 real rank-ups',Quests.done('w',WQ[2])&&Quests.prog('w',WQ[2])===5);const g0=Store.d.gems;Quests.claim('w','w_rk5');t('weekly rank quest pays 2 Gems',Store.d.gems===g0+2);
fresh();Store.d.rc=2500;Store.d.rq=50;Rank.rankUp();t('one rank-up does not complete the 5x quest',!Quests.done('w',WQ[2])&&Quests.prog('w',WQ[2])===1);
// playtime quests: fed once per counted second by the shared playtime counter
fresh();Store.d.user='t';Store.qt=0;localStorage.setItem(Store.tpKey,JSON.stringify({t:0,l:1000}));let tn=1000;for(let i=0;i<1440;i++){tn+=2500;Store.tickPlaytime(tn)}Store.questTime(0,true);
t('~1h of ticks completes the daily playtime quest but not the weekly 5h one',Quests.prog('d',D[2])===D[2].target&&Quests.done('d',D[2])&&Quests.prog('w',WQ[3])===Quests.prog('d',D[2]));
{const b=Quests.prog('w',WQ[3]);Store.tickPlaytime(tn+100);Store.questTime(0,true);t('a tick <0.9 s after the last one adds no quest time (no double count)',Quests.prog('w',WQ[3])===b)}
fresh();Quests.claim('d','d_t1h');t('unfinished playtime quest cannot be claimed',Quests.claim('d','d_t1h')===null);
fresh();Econ.settle('MINES',1,1);const base=Date.now();Quests.sync(base+25*3600e3);t('daily quests reset after 24h; weekly persist',Store.d.q.d.p.rounds===0&&Store.d.q.w.p.rounds===1);Quests.sync(base+8*86400e3);t('weekly quests reset after 7 days',Store.d.q.w.p.rounds===0);
t('quest definitions match spec (v2.4)',CFG.QUEST.daily.map(x=>x.kind+':'+x.target+':'+x.gems).join()==='rounds:500:2,profit:2500:3,time:3600000:2'&&CFG.QUEST.weekly.map(x=>x.kind+':'+x.target+':'+x.gems).join()==='rounds:4000:3,profit:20000:2,rank:5:2,time:18000000:2');
// ---- Guess the Cup
const cu={0:0,1:0,2:0};for(let i=0;i<300000;i++)cu[Games.guessthecup.pick()]++;t('each cup has a 1-in-3 chance',[0,1,2].every(i=>Math.abs(cu[i]/300000-1/3)<.006));
fresh();Store.d.balance-=10;const cp=Econ.settle('GUESS THE CUP',10,10*CUP_WIN_MULT);t('correct guess pays 2.5x TOTAL (stake included): bet 10 -> 25',CUP_WIN_MULT===2.5&&cp===25);t('theoretical return = 83.33%',Math.abs(CUP_WIN_MULT/3-.8333)<.001);
t('shuffle is much faster: 3.5-5 s window, 80-130 ms swaps',CUP_SHUFFLE_MS[0]===3500&&CUP_SHUFFLE_MS[1]===5000&&CUP_SWAP_MS[0]===80&&CUP_SWAP_MS[1]===130);
// ---- Update 2.0
t('Daily Spin Steakcoin range is 250-750',CFG.DAILY.REWARDS[0].min===250&&CFG.DAILY.REWARDS[0].max===750);
t('Auto-Spin is gone from config',CFG.AUTOSPIN_RANK===undefined);
t('D1 gradient/tag no longer use the Gilded gold palette',Cos.by('g_d1').bg!==Cos.by('g_gilded').bg&&!/#c99700|#b8860b|#ffe08a|#fff07a/i.test(Cos.by('g_d1').bg)&&Cos.by('t_div1').bg===Cos.by('g_d1').bg);
fresh();t('lifetime Legendary/Mythic/Secret counters default to 0 and persist',Object.values(Store.d.cc).every(v=>v===0));Store.d.cc.Mythic=3;Store.save();realLoad();t('case counters survive reload',Store.d.cc.Mythic===3&&Store.d.cc.Secret===0);
t('playtime accumulates once per second, capped, and ignores a second tab inside the same second',(()=>{localStorage.setItem(Store.tpKey,JSON.stringify({t:0,l:1000}));const a=Store.tickPlaytime(2000);const b=Store.tickPlaytime(2300);const c=Store.tickPlaytime(10000);return a===1000&&b===1000&&c===3500})());
// ---- bet validation + persistence
const cb=(v,g='PLINKO')=>Econ.checkBet(v,g,1000);t('Plinko min bet $1 (rejects 0.1/0.99)',!cb('0.1').ok&&!cb('0.99').ok&&cb('1').ok);
// v2.25 Plinko drop delay + cross-tab bet lock
const t0=1e12;t('Plinko drops need a delay',Econ.cool('PLINKO',t0)===0&&Econ.cool('PLINKO',t0+100)>0&&Econ.cool('PLINKO',t0+CFG.GAP_MS.PLINKO)===0&&Econ.cool('MINES',t0)===0);
t('bet lock: first tab owns it, others blocked, owner can re-beat, release frees it',(()=>{localStorage.removeItem('steak_lock_CASES');const me=Lock.id;if(!Lock.acquire('CASES',t0))return false;localStorage.setItem('steak_lock_CASES',JSON.stringify({id:'other',t:t0}));const blocked=!Lock.acquire('CASES',t0+1000)&&Lock.heldByOther('CASES',t0+1000);const stale=!Lock.heldByOther('CASES',t0+CFG.LOCK_TTL_MS+1);const take=Lock.acquire('CASES',t0+CFG.LOCK_TTL_MS+1)&&Lock.mine('CASES')&&Lock.beat('CASES',t0+CFG.LOCK_TTL_MS+2);Lock.release('CASES');return blocked&&stale&&take&&!Lock.read('CASES')&&me===Lock.id})());
fresh();Store.d.gems=7;Store.d.inv=['t_larper','g_flame'];Store.d.eq={tag:'t_larper',grad:'g_flame'};Store.d.q.d.p.rounds=12;Store.save();realLoad();t('gems, inventory, equipment, quest progress persist through reload',Store.d.gems===7&&Store.d.inv.length===2&&Store.d.eq.tag==='t_larper'&&Store.d.q.d.p.rounds===12);
localStorage.setItem(Store.key,JSON.stringify({gems:-5,inv:['nope','t_larper'],eq:{tag:'g_gem'},balance:'x'}));realLoad();t('corrupt storage is sanitised (no negative gems, unknown/unowned cosmetics dropped)',Store.d.gems===0&&Store.d.inv.join()==='t_larper'&&Store.d.eq.tag===null&&Number.isFinite(Store.d.balance));
console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
