// Update 2.3 tests (crates, new cosmetics, Cases presentation events, anti-autoclicker guard, Aviamasters RTP). Run: node tests/update23.test.js   (no browser needed)
const fs=require('fs'),vm=require('vm'),path=require('path'),J=f=>path.join(__dirname,'../js/'+f+'.js');
const store={};global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>{delete store[k]}};global.window=global;global.Games={};global.addEventListener=()=>{};
const toasts=[];global.App={toast:m=>toasts.push(m),bal(){},bet(){return 1}};
const real=fs.existsSync(J('economy'));
if(real){for(const f of ['config','cosmetics','cosfx','storage','stats','economy'])vm.runInThisContext(fs.readFileSync(J(f),'utf8'),{filename:f})}
else{   // standalone mode (only the 2.3 files present): minimal stand-ins for the shared modules
vm.runInThisContext(`const CFG={RAR:{common:{n:'Common',gems:1,deal:1,w:50,color:'#f1f5f9'},rare:{n:'Rare',gems:2,deal:1,w:30,color:'#4f7cff'},epic:{n:'Epic',gems:3,deal:2,w:15,color:'#d066e8'},legendary:{n:'Legendary',gems:5,deal:3,w:5,color:'#ffd84d'}},GEM:{TO_COIN:50},SPIN_SPEED:[[16,2.5],[7,2],[3,1.5]]};`);
vm.runInThisContext(fs.readFileSync(J('cosmetics'),'utf8'));vm.runInThisContext(fs.readFileSync(J('cosfx'),'utf8'));
vm.runInThisContext(`const Store={d:{gems:0,inv:[],eq:{},balance:10},load(){return this.d},sync(){},save(){},writeSigned(){}};const Econ={rnd:Math.random,addCoins(n){Store.d.balance+=n},fi:n=>n};const Inv={owned:id=>Store.d.inv.includes(id)};`)}
for(const f of ['games/cases','crates','guard','games/aviamasters'])vm.runInThisContext(fs.readFileSync(J(f),'utf8'),{filename:f});
let pass=0,fail=0;const t=(n,ok,x='')=>{ok?pass++:fail++;console.log((ok?'PASS ':'FAIL ')+n+(x?'  '+x:''))};const near=(a,b,e=1e-9)=>Math.abs(a-b)<e;
const fresh=(g=10)=>{Store.d.gems=g;Store.d.inv=[];Store.d.eq={tag:null,grad:null};Store.d.balance=10;Crate.pend=null;toasts.length=0};
// ---- catalog
const cnt=(ty,r)=>COS.filter(c=>c.type===ty&&c.rar===r).length;
t('catalog: 28 tags + 18 gradients, unique ids',COS.filter(c=>c.type==='tag').length===28&&COS.filter(c=>c.type==='grad').length===18&&new Set(COS.map(c=>c.id)).size===46);
t('rarity counts: tags 5/5/6/12, gradients 0/5/5/8',[cnt('tag','common'),cnt('tag','rare'),cnt('tag','epic'),cnt('tag','legendary'),cnt('grad','common'),cnt('grad','rare'),cnt('grad','epic'),cnt('grad','legendary')].join()==='5,5,6,12,0,5,5,8');
const want={t_light:'legendary',t_orbit:'legendary',t_andromeda:'legendary',t_slaughter:'legendary',t_manip:'epic',g_light:'legendary',g_orbit:'legendary',g_andromeda:'legendary',g_manip:'epic'};
t('new cosmetics exist with the requested rarity',Object.entries(want).every(([id,r])=>Cos.by(id)&&Cos.by(id).rar===r)&&Cos.by('t_slaughter').type==='tag'&&Cos.by('g_manip').type==='grad');
t('new legendaries carry a themed effect class; epic/legendary keep the shared particle classes',['t_light','t_orbit','t_andromeda','t_slaughter','g_light','g_orbit','g_andromeda'].every(id=>new RegExp(' cx-'+Cos.by(id).fx+' fxl"').test(Cos.html(Cos.by(id))))&&/ fxe"/.test(Cos.html(Cos.by('t_manip')))&&!/cx-/.test(Cos.html(Cos.by('t_manip'))));
t('every Epic/Legendary still gets VFX colours; others none',COS.every(c=>{const h=Cos.html(c);return(c.rar==='epic'?/ fxe"/.test(h):c.rar==='legendary'?/ fxl"/.test(h):!/fx[el]"/.test(h))&&((c.rar==='epic'||c.rar==='legendary')?/--p1:#[0-9a-f]{6};--p2:#[0-9a-f]{6};--p3:#[0-9a-f]{6}/.test(h):true)}));
// ---- crate odds
for(const [k,exp] of [['tags',{common:9.7,rare:6,epic:2.5,legendary:6.5/12}],['grads',{rare:12,epic:6,legendary:1.25}]]){const tb=Crate.table(k);
t(k+': per-item chances match the spec',tb.every(r=>near(r.p,exp[r.c.rar],1e-9)));t(k+': chances total exactly 100%',near(tb.reduce((a,r)=>a+r.p,0),100,1e-9))}
t('rarity totals shown on the page: tags 48.5/30/15/6.5, gradients 0/60/30/10',(()=>{const a=Crate.totals('tags'),b=Crate.totals('grads');return[a.common,a.rare,a.epic,a.legendary,b.common,b.rare,b.epic,b.legendary].map(x=>Math.round(x*1e6)/1e6).join()==='48.5,30,15,6.5,0,60,30,10'})());
{const N=300000;for(const [k,exp] of [['tags',[48.5,30,15,6.5]],['grads',[0,60,30,10]]]){const c={common:0,rare:0,epic:0,legendary:0};for(let i=0;i<N;i++)c[Crate.pick(k).rar]++;
t(k+': rolled rarity rates match displayed odds ('+Object.values(c).map(v=>(v/N*100).toFixed(1)).join('/')+')',Crate.RARS.every((r,i)=>Math.abs(c[r]/N*100-exp[i])<.5))}}
{const C0=CFG.CRATE.tag.common.each;CFG.CRATE.tag.common.each=20;const tb=Crate.table('tags');t('if weights are edited the table is normalised and still totals 100',near(tb.reduce((a,r)=>a+r.p,0),100,1e-9));CFG.CRATE.tag.common.each=C0}
// ---- opening, duplicates, resale
fresh(7);const r1=Crate.open('tags');t('open: costs 3 Gems, grants the item once',r1.ok&&Store.d.gems===4&&Store.d.inv.length===1&&!r1.dup&&Store.d.inv[0]===r1.c.id);
fresh(2);t('open: refused without enough Gems (nothing changes)',!Crate.open('tags').ok&&Store.d.gems===2&&Store.d.inv.length===0);t('open: unknown crate refused',!Crate.open('nope').ok);
fresh(9);const tbl=Crate.table('tags');let cum=0,target=null;for(const r of tbl){cum+=r.p;if(r.c.id==='t_green'){target=(cum-r.p/2)/100;break}}
Store.d.inv=['t_green'];const d1=Crate.open('tags',()=>target);t('duplicate: Gems spent, inventory not duplicated, resale offered',d1.ok&&d1.dup&&d1.c.id==='t_green'&&Store.d.gems===6&&Store.d.inv.length===1&&Crate.pend==='t_green');
const b0=Store.d.balance,s1=Crate.sellDup('t_green'),s2=Crate.sellDup('t_green');t('duplicate resale = Gem value x 50, once',s1.ok&&s1.amt===50&&Store.d.balance===b0+50&&!s2.ok);
t('cannot sell a duplicate that was never rolled',!Crate.sellDup('t_beast').ok);
{let ev=0,N=60000;for(const k of ['tags','grads']){const tb=Crate.table(k);ev=tb.reduce((a,r)=>a+r.p/100*CFG.RAR[r.c.rar].gems,0);t(k+': expected resale value per roll ('+ev.toFixed(2)+' Gems) is below the 3-Gem price (no resale arbitrage)',ev<CFG.CRATE.COST)}}
{const s=Crate.strip('grads',56,44,Cos.by('g_gem'));t('roulette strip: winner at the fixed slot, only gradients',s.length===56&&s[44].id==='g_gem'&&s.every(c=>c.type==='grad'))}
// ---- Cases presentation events
const C=Games.cases,mk=k=>({r:{k},m:1}),det=()=>.5;
t('tip-over tease chance is 60% (was 80%)',C.TEASE_P===.6);
t('Common/Uncommon results never get tip-overs; their only fake is the rare X-look flip',['Common','Uncommon'].every(k=>{for(let i=0;i<20000;i++){const p=C.present(mk(k),Math.random);if(p.tip||(p.fake&&p.look!=='X'))return false}return true}));
{const N=200000;let f=0,ti=0,both=0;for(let i=0;i<N;i++){const p=C.present(mk('Rare'),Math.random);f+=p.fake;ti+=p.tip;both+=p.fake&&p.tip}
const fe=C.XUP_P+(1-C.XUP_P)*C.FAKE_P,te=(1-C.XUP_P)*(1-C.FAKE_P)*C.TIP_P;t(`Rare+ results: fake ~${(fe*100).toFixed(1)}%, tip ~${(te*100).toFixed(1)}%, never both (${(f/N*100).toFixed(1)}% / ${(ti/N*100).toFixed(1)}%)`,Math.abs(f/N-fe)<.005&&Math.abs(ti/N-te)<.005&&both===0);
t('events stay rare overall (<3% of all spins)',(f+ti)/N*.08<.03)}
t('dev force: fake / tip are deterministic and exclusive',C.present(mk('Mythic'),det,{fake:1}).fake&&!C.present(mk('Mythic'),det,{fake:1}).tip&&C.present(mk('Rare'),det,{tip:1}).tip&&!C.present(mk('Rare'),det,{tip:1}).fake&&!C.present(mk('Common'),det,{fake:1}).fake);
{const m={x0:0,xA:-5114-114,xT:-5114,dur:6500,tease:2400};let ok=C.pos(6500,m)===m.xA&&C.pos(8900,m)===m.xT&&C.pos(9999,m)===m.xT,pv=C.pos(6500,m),mono=true;for(let ms=6500;ms<=8900;ms+=20){const x=C.pos(ms,m);if(x<pv-1e-9)mono=false;pv=x}
t('tip-over: strip overshoots onto the Common then rolls BACK onto the real tile, never past it',ok&&mono&&Math.max(...Array.from({length:200},(_,i)=>C.pos(6500+i*12,m)))<=m.xT+1e-9)}
const m2={x0:0,xA:-5114,xT:-5114,dur:6500,tease:0};t('normal spin unchanged',C.pos(6499,m2)>-5114&&C.pos(6500,m2)===-5114);
// ---- anti-autoclicker
{const H=Guard.H;Object.assign(H,{t:0,n:0,u:0,rep:-1e9,lock:0,g:{}});let now=1000;
Guard.mark(false,false,now);t('synthetic (untrusted) input never authorises a wager',!Guard.take('X',now).ok);
Guard.mark(true,false,now);t('a fresh trusted click authorises exactly one wager',Guard.take('X',now+10).ok&&!Guard.take('X',now+20).ok);
Guard.mark(true,false,now+100);t('a stale click (>1.5 s) is rejected',!Guard.take('X',now+100+1600).ok);
Guard.mark(true,false,5000);Guard.mark(true,true,5001);t('held-key auto-repeat blocks wagers',!Guard.take('X',5100).ok&&(Guard.mark(true,false,5600),Guard.take('X',5610).ok));
Object.assign(H,{g:{},lock:0});let x=20000,ok=true;for(let i=0;i<12;i++){x+=300;Guard.mark(true,false,x);ok=ok&&Guard.take('M',x).ok}t('fast but human-irregular clicking is accepted',ok);
Object.assign(H,{g:{},lock:0});x=40000;let flagged=false;for(let i=0;i<20;i++){x+=250;Guard.mark(true,false,x);const r=Guard.take('M',x);if(!r.ok&&/regular/.test(r.msg)){flagged=true;break}}t('13 perfectly regular wagers trigger the macro cool-down',flagged&&!Guard.take('M',x+500).ok&&H.flags>=1);
Object.assign(H,{g:{},lock:0});x=60000;const gaps=[310,420,275,560,390,330,480,260,610,350,440,295,505,380];ok=true;for(const gp of gaps){x+=gp;Guard.mark(true,false,x);ok=ok&&Guard.take('H',x).ok}t('a varied human rhythm is never flagged',ok);
Object.assign(H,{g:{},lock:0});Guard.mark(true,false,90000);Guard.take('D',90000);Guard.mark(true,false,90030);t('two wagers < 60 ms apart: the second is dropped (double-fire)',!Guard.take('D',90030).ok)}
// ---- Aviamasters tuning
{const P=Games.aviamasters.plan,N=800000;let s=0,w=0;for(let i=0;i<N;i++){const p=P();if(!p.crash&&!p.fall){s+=p.m;w++}}const rtp=s/N;
{let pf=0;for(let i=0;i<N;i++){const p=P();if(!p.crash&&!p.fall&&p.m>1)pf++}t(`v2.5 Aviamasters economy: RTP ~99% (${(rtp*100).toFixed(1)}%), lands ${(w/N*100).toFixed(0)}%, profit ${(pf/N*100).toFixed(0)}%`,Math.abs(rtp-.99)<.04&&pf/N>.41&&pf/N<.48&&w/N>.88&&Games.aviamasters.PR===.3)}}
// ---- v2.5 Cases X outcome
{const RA=C.RAR,sp=RA.reduce((a,r)=>a+r.p,0),sd=RA.reduce((a,r)=>a+r.d,0),g=k=>RA.find(r=>r.k===k);
t('v2.5 Cases rolled odds: X31.5/C20/U27/R13/L5.2/M2.6/S0.7',RA.map(r=>r.k+r.p).join()==='X31.5,Common20,Uncommon27,Rare13,Legendary5.2,Mythic2.6,Secret0.7'&&Math.abs(sp-100)<1e-9);
t('v2.5 Cases DISPLAYED odds: X26/C25/U27/R13/L5/M3/S1 (total 100)',RA.map(r=>r.k+r.d).join()==='X26,Common25,Uncommon27,Rare13,Legendary5,Mythic3,Secret1'&&sd===100);
t('X is a red 0x outcome',g('X').zero===1&&g('X').min===0&&g('X').max===0&&g('X').c==='#ef4444');
{const rtp=RA.reduce((x,r)=>x+r.p/100*(r.min+r.max)/2,0),pr=RA.filter(r=>r.min>=1).reduce((x,r)=>x+r.p,0);t('v2.5 Cases economy: RTP ~99% ('+(rtp*100).toFixed(0)+'%), 48.5% of rounds in profit',Math.abs(rtp-.99)<.02&&Math.abs(pr-48.5)<1e-9)}
t('X flips are rare (<=6%)',C.XDOWN_P<=.06&&C.XUP_P<=.06);
const XP=k=>{let f=0,n=100000;for(let i=0;i<n;i++){const p=C.present(mk(k),Math.random);if(p.fake)f++}return f/n};
t('X is shown as Common/Uncommon/Rare then flips (~'+C.XDOWN_P*100+'%)',Math.abs(XP('X')-C.XDOWN_P)<.006);
{const L={};for(let i=0;i<20000;i++){const p=C.present(mk('X'),()=>Math.random());if(p.fake)L[p.look]=1}t('X flip looks are only Common/Uncommon/Rare',Object.keys(L).every(k=>['Common','Uncommon','Rare'].includes(k))&&Object.keys(L).length===3)}
t('non-X results are sometimes shown as X first (~'+C.XUP_P*100+'%), look=X',(()=>{let f=0,n=100000,okl=true;for(let i=0;i<n;i++){const p=C.present(mk('Common'),Math.random);if(p.fake){f++;if(p.look!=='X')okl=false}}return okl&&Math.abs(f/n-C.XUP_P)<.006})())}
console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
