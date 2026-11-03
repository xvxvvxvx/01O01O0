/* Shared economy. EVERY game settles through App.settle -> Econ.settle (once). Rank multipliers no longer exist.
   Separate buckets (never mixed): game profit/rank money/quests (Econ.settle) | Gems | cosmetic buy/sell | wallet reset | Daily Spin.
   v2.25: every mutator calls Store.check() BEFORE and Store.sync() AFTER touching balance/Gems (shadow ledger, see storage.js). */
const Econ={
r2:x=>Math.round(x*100)/100,
fmt:n=>(+n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),
fi:n=>Econ.fmt(n).replace(/\.00$/,''),
rnd(){try{return crypto.getRandomValues(new Uint32Array(1))[0]/4294967296}catch(e){return Math.random()}},
/* v2.25 anti-farming: minimum delay between wagers (shared by every tab via localStorage). Returns ms left to wait, or 0 and stamps the wager. */
cool(game,now=Date.now()){const gap=CFG.GAP_MS[game];if(!gap)return 0;const k='steak_gap_'+game;let last=0;try{last=+localStorage.getItem(k)||0}catch(e){}
if(last>now)last=0;const left=last+gap-now;if(left>0)return left;try{localStorage.setItem(k,String(now))}catch(e){}return 0},
minBet:g=>CFG.MIN_BET[g]||CFG.DEFAULT_MIN,
checkBet(raw,game,balance){Store.check();if(Store.armed&&Store.d)balance=Math.min(balance,Store.d.balance);   // never trust a caller-supplied balance
const v=Number(String(raw).trim());
if(!Number.isFinite(v)||v<=0)return{ok:false,msg:'Enter a bet above 0'};
if(Math.abs(v*100-Math.round(v*100))>1e-6)return{ok:false,msg:'Bets can have at most 2 decimal places'};
const min=Econ.minBet(game);if(v<min-1e-9)return{ok:false,msg:`Minimum ${game[0]+game.slice(1).toLowerCase()} bet is ${min.toFixed(2)} Steakcoin`};
if(v>balance+1e-9)return{ok:false,msg:'Not enough 01O0coin'};return{ok:true,v:Econ.r2(v)}},
startBalance:(rk=Store.d.rk)=>rk===0?CFG.UNRANKED_START:CFG.RANKS[rk].rw.c,   // used by every "reset balance" action
bonusActive:(now=Date.now())=>now<Store.d.bx,
effMult:(now)=>Econ.bonusActive(now)?CFG.DAILY.BONUS_MULT:1,                  // only the Daily Spin 2X bonus can multiply profit
summary:()=>Econ.bonusActive()?`2X 01O0coin bonus active (profit x${CFG.DAILY.BONUS_MULT})`:'No active profit bonus',
/* gross = total returned INCLUDING stake. Only positive net profit is multiplied (by the 2X bonus, if active). */
payout(bet,gross,now){const net=Econ.r2(gross-bet);return net>0?Econ.r2(bet+net*Econ.effMult(now)):Econ.r2(gross)},
settle(game,bet,gross){Store.check();const pay=Econ.payout(bet,gross),d=Store.d,net=Econ.r2(pay-bet);d.balance=Econ.r2(d.balance+pay);Store.sync();Stats.record(game,bet,pay);Rank.onRound(game,net);Store.save();return pay},
/* Wallet credit that is NOT game profit: no stats, no rank money, no quest progress (cosmetic sales, Gem conversion, resets). */
addCoins(n){Store.check();Store.d.balance=Econ.r2(Store.d.balance+n);Store.sync();Store.save()},
resetBalance(){Store.check();Store.d.balance=Econ.startBalance();Store.sync();Store.save()}};
/* v2.25 cross-tab bet lock: the first tab to start a bet on a game owns it until it releases (resolved/cancelled). Stored in localStorage (the shared state);
   the owner refreshes t via beat(), so a lock whose owner crashed/closed goes stale after CFG.LOCK_TTL_MS and no longer blocks play. */
const Lock={id:Math.random().toString(36).slice(2)+Date.now().toString(36),key:g=>'steak_lock_'+g,
read(g){try{const o=JSON.parse(localStorage.getItem(Lock.key(g)));return o&&typeof o.id==='string'&&Number.isFinite(o.t)?o:null}catch(e){return null}},
mine(g){const o=Lock.read(g);return !!o&&o.id===Lock.id},
heldByOther(g,now=Date.now()){const o=Lock.read(g);return !!o&&o.id!==Lock.id&&Math.abs(now-o.t)<CFG.LOCK_TTL_MS},
acquire(g,now=Date.now()){if(Lock.heldByOther(g,now))return false;try{localStorage.setItem(Lock.key(g),JSON.stringify({id:Lock.id,t:now}))}catch(e){return true}return Lock.mine(g)},
beat(g,now=Date.now()){if(!Lock.mine(g))return false;try{localStorage.setItem(Lock.key(g),JSON.stringify({id:Lock.id,t:now}))}catch(e){}return true},
release(g){if(Lock.mine(g))try{localStorage.removeItem(Lock.key(g))}catch(e){}}};
const Rank={
status(){const d=Store.d,cur=CFG.RANKS[d.rk],next=CFG.RANKS[d.rk+1]||null,req=cur.req,coin=Math.max(0,Econ.r2(d.rc)),rounds=d.rq;
return{idx:d.rk,cur,next,req,coin,rounds,max:!req,ready:!!req&&coin>=req.c&&rounds>=req.r}},
/* Once per settled round: qualified-round conversion + eligible money (positive net profit) + quest progress. */
onRound(game,net){const d=Store.d,n=CFG.CONV[game]||1;d.pt[game]=(d.pt[game]||0)+1;if(d.pt[game]>=n){d.pt[game]-=n;d.rq++;d.lq++;Quests.add('rounds',1)}
if(net>0){d.rc=Econ.r2(d.rc+net);Quests.add('profit',net)}},
addMoney(n){Store.d.rc=Econ.r2(Store.d.rc+n)},      // Daily Spin Steakcoin rewards count toward rank money
/* Single reviewable rank-up: validates again; wallet reset to the NEW rank's starting cash; Gems granted; rank counters reset; lifetime stats/cosmetics kept. */
rankUp(){Store.load();const s=Rank.status();if(!s.ready)return null;const d=Store.d;d.rk++;const rw=CFG.RANKS[d.rk].rw;d.rc=0;d.rq=0;d.pt={};d.balance=rw.c;d.gems+=rw.g;Store.sync();Quests.add('rank',1);Store.save();return rw}};
const Daily={
readyIn:(now=Date.now())=>Math.max(0,Store.d.dl+CFG.DAILY.COOLDOWN_MS-now),
ready:(now)=>Daily.readyIn(now)===0,
roll(rnd=Econ.rnd){const R=CFG.DAILY.REWARDS,t=R.reduce((a,r)=>a+r.p,0);let x=rnd()*t,r=R[R.length-1];for(const c of R){if(x<c.p){r=c;break}x-=c.p}
return r.id==='x2'?{id:'x2',amount:0}:{id:r.id,amount:r.min+Math.floor(rnd()*(r.max-r.min+1))}},
claim(now=Date.now()){Store.load();Daily.credit(now);if(!Daily.ready(now))return null;const rw=Daily.roll(),d=Store.d;d.dl=now;d.dr=rw;d.dc=false;Store.save();return rw},
/* Idempotent payout. Steakcoin reward -> balance AND rank money (once). Gem reward -> Gems only. 2X -> 15 min bonus (no stacking). */
credit(now=Date.now()){Store.check();const d=Store.d;if(!d.dr||d.dc)return false;d.dc=true;
if(d.dr.id==='x2')d.bx=now+CFG.DAILY.BONUS_MS;else if(d.dr.id==='gem')d.gems+=d.dr.amount;else{d.balance=Econ.r2(d.balance+d.dr.amount);Rank.addMoney(d.dr.amount)}
Store.sync();Store.save();return true}};
const Gems={
/* 1 Gem = 50 Steakcoin (CFG.GEM.TO_COIN). Atomic; never counts as profit/rank money/quest progress. */
convert(n){Store.load();n=Math.floor(Number(n));if(!(n>=1)||n>Store.d.gems)return{ok:false,msg:'Not enough Gems'};Store.d.gems-=n;Store.d.balance=Econ.r2(Store.d.balance+n*CFG.GEM.TO_COIN);Store.sync();Store.save();return{ok:true,gems:n,coins:n*CFG.GEM.TO_COIN}}};
const Quests={
win(now=Date.now()){return{d:Math.floor(now/CFG.QUEST.DAILY_MS),w:Math.floor((now-CFG.QUEST.WEEK_OFFSET_MS)/CFG.QUEST.WEEKLY_MS)}},
nextReset(scope,now=Date.now()){const w=Quests.win(now);return scope==='d'?(w.d+1)*CFG.QUEST.DAILY_MS:(w.w+1)*CFG.QUEST.WEEKLY_MS+CFG.QUEST.WEEK_OFFSET_MS},
sync(now=Date.now()){const q=Store.d.q,w=Quests.win(now);let ch=false;if(q.dw!==w.d){q.dw=w.d;q.d=Store.scope(null);ch=true}if(q.ww!==w.w){q.ww=w.w;q.w=Store.scope(null);ch=true}if(ch)Store.save()},
/* v2.5b: weekly quests level up. lvOf = current level of a base quest; at() = that level's quest (same id, harder target, more Gems, lv>0). */
nameOf(kind,t){return kind==='rounds'?`Play ${Econ.fi(t)} minigame rounds`:kind==='profit'?`Earn ${Econ.fi(t)} 01O0coin profit from minigames`:kind==='time'?`Play for ${+(t/3600000).toFixed(1)} hours`:`Rank up ${t} times`},
lvOf(b){const l=(Store.d.q.w.l&&Store.d.q.w.l[b.kind])|0;return Math.min(l,b.up?b.up.length:0)},
at(b,lv){if(!lv)return b;const u=b.up[lv-1];return{id:b.id,kind:b.kind,target:u[0],gems:u[1],lv,name:Quests.nameOf(b.kind,u[0])}},
list(scope){return scope==='d'?CFG.QUEST.daily:CFG.QUEST.weekly.map(b=>Quests.at(b,Quests.lvOf(b)))},
prog(scope,qs){const s=Store.d.q[scope],p=Math.max(0,(s.p[qs.kind]||0)-((s.b&&s.b[qs.kind])||0));return Math.min(qs.target,qs.kind==='profit'?Econ.r2(p):Math.floor(p))},
done:(scope,qs)=>Quests.prog(scope,qs)>=qs.target,
claimed:(scope,qs)=>!!Store.d.q[scope].c[qs.id],
add(kind,n){Quests.sync();for(const sc of['d','w']){const s=Store.d.q[sc];s.p[kind]=(s.p[kind]||0)+n;for(const qs of Quests.list(sc))if(qs.kind===kind&&!s.n[qs.id]&&Quests.done(sc,qs)){s.n[qs.id]=1;if(typeof App!=='undefined'&&App.toast)App.toast('Quest completed! Claim reward at Quests page.')}}},
claim(scope,id){Store.load();Quests.sync();const qs=Quests.list(scope).find(x=>x.id===id);if(!qs||!Quests.done(scope,qs)||Quests.claimed(scope,qs))return null;
const s=Store.d.q[scope],base=scope==='w'?CFG.QUEST.weekly.find(b=>b.id===id):null;
if(base&&base.up&&Quests.lvOf(base)<base.up.length){s.l[base.kind]=Quests.lvOf(base)+1;s.b[base.kind]=s.p[base.kind]||0;delete s.n[id]}   // weekly: a harder quest replaces it at once, progress restarts from 0
else s.c[id]=1;
Store.d.gems+=qs.gems;Store.sync();Store.save();return qs.gems}};
const Shop={
rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}},
win:(now=Date.now())=>Math.floor(now/CFG.SHOP.ROTATION_MS),
expires:(now=Date.now())=>(Shop.win(now)+1)*CFG.SHOP.ROTATION_MS,
pickW(pool,n,r){const p=pool.slice(),out=[];while(out.length<n&&p.length){const t=p.reduce((a,c)=>a+CFG.RAR[c.rar].w,0);let x=r()*t,i=0;for(;i<p.length-1;i++){x-=CFG.RAR[p[i].rar].w;if(x<0)break}out.push(p.splice(i,1)[0])}return out},
/* Deterministic per 12h window (+ salt), so every tab/refresh sees the same shop. Guarantees >=1 Legendary by replacing a random slot only when none appeared naturally. */
gen(id,salt){const r=Shop.rng((id*2654435761+salt*40503+12345)>>>0),gr=COS.filter(c=>c.type==='grad'),tg=COS.filter(c=>c.type==='tag');
const o=[...Shop.pickW(gr,CFG.SHOP.GRADS,r),...Shop.pickW(tg,CFG.SHOP.TAGS,r)];
if(!o.some(c=>c.rar==='legendary')){const i=Math.floor(r()*o.length),pool=COS.filter(c=>c.type===o[i].type&&c.rar==='legendary'&&!o.includes(c));o[i]=pool[Math.floor(r()*pool.length)]}
const idx=o.map((_,i)=>i);for(let i=idx.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[idx[i],idx[j]]=[idx[j],idx[i]]}const deals=new Set(idx.slice(0,CFG.SHOP.DEALS));
return{id,salt,offers:o.map((c,i)=>({id:c.id,deal:deals.has(i)}))}},
current(now=Date.now()){const id=Shop.win(now);let s=Store.d.shop;if(s&&s.id===id&&s.salt===Store.d.shopSalt)return s;Store.load();s=Store.d.shop;if(s&&s.id===id&&s.salt===Store.d.shopSalt)return s;s=Shop.gen(id,Store.d.shopSalt);Store.d.shop=s;Store.save();return s},
price:(c,deal)=>deal?CFG.RAR[c.rar].deal:CFG.RAR[c.rar].gems};
const Inv={
owned:id=>Store.d.inv.includes(id),
/* Purchase is idempotent: re-validated against the live shop, ownership and Gem balance; one save. The price paid is remembered (d.paid) so an item can never be resold for more than it cost. */
buy(id,now){Store.load();const s=Shop.current(now),off=s.offers.find(o=>o.id===id),c=Cos.by(id);if(!off||!c)return{ok:false,msg:'Not in the shop'};if(Inv.owned(id))return{ok:false,msg:'Already owned'};
const p=Shop.price(c,off.deal);if(Store.d.gems<p)return{ok:false,msg:'Not enough Gems'};Store.d.gems-=p;Store.d.inv.push(id);(Store.d.paid=Store.d.paid||{})[id]=p;Store.sync();Store.save();return{ok:true,price:p,c}},
apply(tag,grad){Store.load();const d=Store.d,ok=(id,t)=>id==null||(Cos.by(id)&&Cos.by(id).type===t&&d.inv.includes(id));if(!ok(tag,'tag')||!ok(grad,'grad'))return false;d.eq={tag:tag||null,grad:grad||null};Store.save();return true},
sell(id){Store.load();const c=Cos.by(id),d=Store.d;if(!c||!Inv.owned(id))return{ok:false,msg:'Not owned'};const amt=Cos.sellValue(c);d.inv=d.inv.filter(x=>x!==id);if(d.paid)delete d.paid[id];if(d.eq.tag===id)d.eq.tag=null;if(d.eq.grad===id)d.eq.grad=null;
d.balance=Econ.r2(d.balance+amt);Store.sync();Store.save();return{ok:true,amt,c}}};   // no Gems, no rank money, no profit
/* v2.25 anti-arbitrage: resale value = min(normal Gem value x 50, Gems actually PAID x 50). Buying a Special Deal can no longer be flipped for more Steakcoin than converting those Gems directly. */
(()=>{const base=Cos.sellValue;Cos.sellValue=c=>{const p=Store.d&&Store.d.paid&&c&&Store.d.paid[c.id];return p!=null?Math.min(base(c),p*CFG.GEM.TO_COIN):base(c)}})();
