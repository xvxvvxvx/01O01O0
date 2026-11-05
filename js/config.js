/* PlaySteak v2.0 - the only place ranks, rewards, odds, prices, shop and quest rules are defined.
   NOTE: rank multipliers were removed. Ranks give starting Steakcoin + Gems on rank-up instead. */
const CFG={
UNRANKED_START:10,                          // configurable default test balance for Unranked players
GEM:{TO_COIN:100,REF_USD:500},              // v2.6: 1 Gem converts to 100 Steakcoin (was 50). REF_USD (1 Gem = $500) is a SEPARATE reference value for rank valuation only.
// v2.5 economy: req.c re-curved (was 2,500 .. 7,000,000; now 250 .. 1,100,000). Games return ~98% now, so progress comes from grinding (rank money = positive round profits), not compounding; round counts (r) are unchanged.
// v2.5b: rank rounds cut ~20% and rank money ~10% (about 20% less time per rank-up; the money gate is trimmed less so it is not the bottleneck).
// RANKS[i].req = requirement to go from rank i to i+1;  RANKS[i].rw = starting Steakcoin (c) + Gems (g) granted on reaching rank i.
RANKS:[
{n:'Unranked',g:['#9ca3af','#6b7280'],req:{c:225,r:40},   rw:{c:10,g:0}},
{n:'Copper',  g:['#e8b27a','#a0612f'],req:{c:725,r:50},  rw:{c:50,g:1}},
{n:'Bronze',  g:['#c58a5c','#7a4526'],req:{c:2300,r:70},  rw:{c:100,g:2}},
{n:'Silver',  g:['#f8fafc','#aab4c0'],req:{c:4500,r:80},  rw:{c:250,g:3}},
{n:'Iron',    g:['#b4b9c4','#4b5563'],req:{c:8100,r:160}, rw:{c:250,g:4}},
{n:'Ruby',    g:['#f87171','#8f1818'],req:{c:13000,r:240}, rw:{c:250,g:5}},
{n:'Emerald', g:['#4ade80','#14532d'],req:{c:18000,r:320},rw:{c:250,g:6}},
{n:'Amethyst',g:['#d8b4fe','#6d28d9'],req:{c:27000,r:480},rw:{c:250,g:7}},
{n:'Diamond', g:['#93c5fd','#1e3a8a'],req:{c:45000,r:600},rw:{c:500,g:8}},
{n:'Ascended',g:['#ffffff','#7dd3fc'],req:{c:63000,r:800},rw:{c:500,g:10}},
{n:'Verifier I',  g:['#fde68a','#d97706'],req:{c:72000,r:800}, rw:{c:750,g:12}},
// v2.25 Rank Expansion I. ic = badge icon: check | champion | radiant | demon | xdemon (image icons live in img/, see BIMG in js/ui.js)
// v2.6: Champion I-III use img/champion.jpg and Radiant I-III use img/radiant.jpg. Until you drop those files in, a blank white box is shown.
{n:'Verifier II', g:['#fde68a','#d97706'],req:{c:81000,r:800}, rw:{c:750,g:12},ic:'check'},
{n:'Verifier III',g:['#fde68a','#d97706'],req:{c:90000,r:800}, rw:{c:750,g:12},ic:'check'},
{n:'Champion I',  g:['#9f1d2e','#f5b08a'],req:{c:115000,r:1000}, rw:{c:1250,g:14},ic:'champion'},
{n:'Champion II', g:['#9f1d2e','#f5b08a'],req:{c:130000,r:1000}, rw:{c:1250,g:14},ic:'champion'},
{n:'Champion III',g:['#9f1d2e','#f5b08a'],req:{c:155000,r:1200}, rw:{c:1250,g:14},ic:'champion'},
{n:'Radiant I',   g:['#ffd84d','#d9c9a3'],req:{c:170000,r:1200}, rw:{c:1500,g:16},ic:'radiant'},
{n:'Radiant II',  g:['#ffd84d','#d9c9a3'],req:{c:190000,r:1200}, rw:{c:1500,g:16},ic:'radiant'},
{n:'Radiant III', g:['#ffd84d','#d9c9a3'],req:{c:215000,r:1400}, rw:{c:1500,g:16},ic:'radiant'},
{n:'Insane Demon I', g:['#ff7a45','#c2221a'],req:{c:250000,r:1600}, rw:{c:1750,g:18},ic:'demon'},
{n:'Insane Demon II',g:['#ff7a45','#c2221a'],req:{c:270000,r:1600}, rw:{c:1750,g:18},ic:'demon'},
// v2.45 Rank Expansion 2. Icons: img/<file> (white placeholders until real art is dropped in with the same filename).
{n:'Extreme Demon I',   g:['#ff3b2e','#d11a12'],req:{c:295000,r:1200}, rw:{c:2000,g:20},ic:'xdemon'},
{n:'Extreme Demon II',  g:['#c0261c','#7a0f0a'],req:{c:315000,r:1200}, rw:{c:1500,g:20},ic:'xdemon'},
{n:'Extreme Demon III', g:['#9c1a14','#d11a12'],req:{c:350000,r:1400}, rw:{c:1500,g:20},ic:'xdemon'},
{n:'Impossible Demon I',  g:['#8e24aa','#e53935'],req:{c:380000,r:1400}, rw:{c:2000,g:22},ic:'impdemon'},
{n:'Impossible Demon II', g:['#8e24aa','#e53935'],req:{c:405000,r:1400}, rw:{c:2000,g:22},ic:'impdemon'},
{n:'Impossible Demon III',g:['#8e24aa','#e53935'],req:{c:440000,r:1600}, rw:{c:2000,g:22},ic:'impdemon'},
{n:'Unreal I',   g:['#ffffff','#e9b8d8'],req:{c:485000,r:1600}, rw:{c:2500,g:24},ic:'unreal'},
{n:'Unreal II',  g:['#ffffff','#e9b8d8'],req:{c:540000,r:1600}, rw:{c:2500,g:24},ic:'unreal'},
{n:'Unreal III', g:['#ffffff','#e9b8d8'],req:{c:610000,r:2000}, rw:{c:2500,g:24},ic:'unreal'},
{n:'Division 5', g:['#b8962e','#555555'],req:{c:685000,r:2000}, rw:{c:3000,g:26},ic:'div5'},
{n:'Division 4', g:['#b8962e','#4a4a4a'],req:{c:765000,r:2400}, rw:{c:3500,g:28},ic:'div4'},
{n:'Division 3', g:['#b8860b','#3a3a3a'],req:{c:855000,r:2400}, rw:{c:4000,g:30},ic:'div3'},
{n:'Division 2', g:['#c8860b','#b01010'],req:{c:990000,r:2400}, rw:{c:4500,g:32},ic:'div2'},
{n:'Division 1', g:['#e69a1a','#a01010'],req:null,               rw:{c:5000,g:34},ic:'div1'}],
// Animation speed by rank index. Highest matching tier wins; each [rankIndex,speed] is also what the Rank-Up page displays.
// Animation only: never payouts or odds. Cases: Silver=3, Amethyst=7, Impossible Demon I=24. Aviamasters: Silver=3, Amethyst=7, Division 5=30, Division 1=34.
SPIN_SPEED:[[24,2.5],[7,2],[3,1.5]],
AVI_SPEED:[[34,2.75],[30,2.5],[7,2],[3,1.5]],
CONV:{PLINKO:2000,CASES:3,FLIP:5,'DOUBLE OR NOTHING':5},   // raw rounds per 1 qualified mini-game round (others 1). v2.6: Plinko 1000 -> 2000
GAP_MS:{},                                  // minimum delay between wagers per game (enforced in Econ.cool, shared across tabs). v2.6: Plinko's 400 ms drop cooldown was removed
LOCK_TTL_MS:15000,                          // a cross-tab bet lock with no heartbeat for this long is stale and can be taken over
MIN_BET:{PLINKO:1},DEFAULT_MIN:0.01,
// Rarity: gems = normal price, deal = special-deal price, w = shop appearance weight (configurable; favours Common/Rare).
RAR:{common:{n:'Common',gems:1,deal:1,w:50,color:'#f1f5f9'},rare:{n:'Rare',gems:2,deal:1,w:30,color:'#4f7cff'},epic:{n:'Epic',gems:3,deal:2,w:15,color:'#d066e8'},legendary:{n:'Legendary',gems:5,deal:3,w:5,color:'#ffd84d'}},
SHOP:{ROTATION_MS:12*3600*1000,GRADS:4,TAGS:3,DEALS:4},   // 3 featured + 4 special deals = 7 offers
QUEST:{DAILY_MS:24*3600*1000,WEEKLY_MS:7*24*3600*1000,WEEK_OFFSET_MS:4*24*3600*1000, // weeks start Monday 00:00 UTC
/* v2.5b: Gem rewards buffed (daily 2/3/2 -> 3/4/3, weekly 3/2/2/2 -> 5/4/4/4). WEEKLY quests now level up: claiming one immediately replaces it with a harder one that pays more Gems.
   up[i] = [target, gems] for level i+1 (level 0 is the base quest). Levels reset every week. */
daily:[{id:'d_r500',kind:'rounds',target:500,gems:3,name:'Play 500 minigame rounds'},{id:'d_p10k',kind:'profit',target:2500,gems:4,name:'Earn 2,500 01O0coin profit from minigames'},{id:'d_t1h',kind:'time',target:3600000,gems:3,name:'Play for 1 hour'}],
weekly:[{id:'w_r4k',kind:'rounds',target:4000,gems:5,name:'Play 4,000 minigame rounds',up:[[7000,7],[11000,10],[16000,14],[22000,18],[30000,24]]},
{id:'w_p100k',kind:'profit',target:20000,gems:4,name:'Earn 20,000 01O0coin profit from minigames',up:[[40000,6],[75000,9],[125000,12],[200000,16],[320000,22]]},
{id:'w_rk5',kind:'rank',target:5,gems:4,name:'Rank up 5 times',up:[[8,6],[12,9],[16,12],[20,16],[25,22]]},
{id:'w_t5h',kind:'time',target:18000000,gems:4,name:'Play for 5 hours',up:[[8*3600000,6],[12*3600000,8],[17*3600000,11],[23*3600000,15],[30*3600000,20]]}]},   // time targets are in ms (fed by Store.tickPlaytime)
DAILY:{COOLDOWN_MS:24*3600*1000,BONUS_MS:15*60*1000,BONUS_MULT:2,SPIN_MS:6500,   // 2X bonus multiplies winning PROFIT while active
REWARDS:[{id:'low',p:60,min:250,max:750},{id:'gem',p:20,min:1,max:4},{id:'x2',p:20}]}};  // p sums to 100; gem reward is 1-4 Gems
