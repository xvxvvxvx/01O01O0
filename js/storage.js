const Store={key:'0-100_v2.4',tpKey:'0-100_v2.4_playtime',d:null,
armed:typeof document!=='undefined',          // integrity checks on in the browser (off in the node unit tests unless a test arms them)
LEGACY_MIGRATION:true,                        // accept ONE unsigned 2.0 save (clamped). Set to false in a later update once players have migrated.
tamper:0,notice:'',sh:{o:null,b:0,g:0},
def(){return{user:'',balance:CFG.UNRANKED_START,pw:0,pl:0,g:{},rk:0,rc:0,rq:0,lq:0,pt:{},bw:null,bl:null,dl:0,dr:null,dc:true,bx:0,ndp:false,cc:{Legendary:0,Mythic:0,Secret:0,Pirate:0},cs:0,gems:0,inv:[],paid:{},eq:{tag:null,grad:null},shop:null,shopSalt:0,q:{dw:-1,ww:-1,d:Store.scope(null),w:Store.scope(null)}}},
num(v,fb){return typeof v==='number'&&isFinite(v)?v:fb},
int(v,fb=0){return Math.max(0,Math.floor(this.num(v,fb)))},
best(o){return o&&typeof o==='object'&&this.num(o.v,0)>0&&typeof o.g==='string'?{v:o.v,g:o.g}:null},
scope(o){const s={p:{rounds:0,profit:0,rank:0,time:0},c:{},n:{},l:{},b:{}};if(o&&typeof o==='object'){for(const k in s.p){s.p[k]=Math.max(0,this.num(o.p&&o.p[k],0));s.l[k]=Math.max(0,Math.min(9,Math.floor(this.num(o.l&&o.l[k],0))));s.b[k]=Math.min(s.p[k],Math.max(0,this.num(o.b&&o.b[k],0)))}   // v2.5b: l = weekly quest level per kind, b = progress baseline when that level began
for(const k of['c','n'])if(o[k]&&typeof o[k]==='object')for(const id in o[k])if(o[k][id])s[k][id]=1}return s},
/* ---- integrity ---- */
hash(s){let h1=0xdeadbeef,h2=0x41c6ce57;const t='01O0|2.25|'+s;for(let i=0;i<t.length;i++){const c=t.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677)}
h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return(h2>>>0).toString(36)+'-'+(h1>>>0).toString(36)},
readSigned(k){let raw=null;try{raw=localStorage.getItem(k)}catch(e){}
if(raw==null)return{raw:null,status:'none'};
if(raw.slice(0,3)==='S2:'){const i=raw.indexOf(':',3),sg=raw.slice(3,i),body=raw.slice(i+1);return{raw:body,status:this.hash(k+body)===sg?'ok':'bad'}}
return{raw,status:this.armed?'legacy':'ok'}},
writeSigned(k,s){try{localStorage.setItem(k,this.armed?'S2:'+this.hash(k+s)+':'+s:s)}catch(e){}},
/* Shadow ledger: balance/gems may only ever be RAISED by Econ/Rank/Daily/Gems/Quests/Inv (they call Store.sync() right after). Any other increase = tampering -> clamped. */
sync(){const d=this.d;this.sh={o:d,b:d?d.balance:0,g:d?d.gems:0}},
check(){const d=this.d,s=this.sh;if(!this.armed||!d)return false;if(s.o!==d){this.sync();return false}let hit=false;
if(!Number.isFinite(d.balance)||d.balance>s.b+.005){d.balance=s.b;hit=true}else s.b=d.balance;
if(!Number.isFinite(d.gems)||d.gems>s.g){d.gems=s.g;hit=true}else s.g=d.gems;
if(hit){this.tamper++;this.notice='Tampering detected: balance/Gems restored.';try{App.toast(this.notice);App.bal()}catch(e){}}return hit},
clampLegacy(d){const rs=d.rk===0?CFG.UNRANKED_START:CFG.RANKS[d.rk].rw.c;d.balance=Math.round(Math.min(d.balance,rs+d.rc+25000)*100)/100;d.gems=Math.min(d.gems,300)},
load(){const r=this.readSigned(this.key);let o=null;const bad=r.status==='bad'||(r.status==='legacy'&&!this.LEGACY_MIGRATION);
if(!bad&&r.raw!=null){try{o=JSON.parse(r.raw)}catch(e){}}
const d=this.def();
if(bad){this.tamper++;this.notice='Save data failed its integrity check and was reset.';try{const u=JSON.parse(r.raw);if(u&&typeof u.user==='string')d.user=u.user.slice(0,16)}catch(e){}}
else if(o&&typeof o==='object'){d.user=typeof o.user==='string'?o.user.slice(0,16):'';d.balance=Math.round(this.num(o.balance,d.balance)*100)/100;d.pw=this.num(o.pw,0);d.pl=this.num(o.pl,0);
d.rk=Math.min(CFG.RANKS.length-1,this.int(o.rk));d.rc=Math.max(0,this.num(o.rc,0));d.rq=this.int(o.rq);d.lq=this.int(o.lq);d.cs=this.int(o.cs);d.gems=this.int(o.gems);
if(o.pt&&typeof o.pt==='object')for(const k in o.pt)d.pt[k]=this.int(o.pt[k]);
d.bw=this.best(o.bw);d.bl=this.best(o.bl);d.dl=this.num(o.dl,0);d.dc=o.dc!==false;d.bx=this.num(o.bx,0);d.ndp=o.ndp===true;if(o.cc&&typeof o.cc==='object')for(const k in d.cc)d.cc[k]=this.int(o.cc[k]);
if(o.dr&&typeof o.dr==='object'&&['low','gem','x2'].includes(o.dr.id))d.dr={id:o.dr.id,amount:this.int(o.dr.amount)};
if(Array.isArray(o.inv))d.inv=[...new Set(o.inv.filter(id=>Cos.by(id)))];
if(o.paid&&typeof o.paid==='object')for(const id in o.paid)if(Cos.by(id)&&d.inv.includes(id))d.paid[id]=this.int(o.paid[id]);
if(o.eq&&typeof o.eq==='object')for(const k of['tag','grad']){const c=Cos.by(o.eq[k]);if(c&&c.type===k&&d.inv.includes(c.id))d.eq[k]=c.id}
if(o.shop&&typeof o.shop==='object'&&Array.isArray(o.shop.offers)&&o.shop.offers.every(x=>Cos.by(x.id)))d.shop={id:this.num(o.shop.id,-1),salt:this.int(o.shop.salt),offers:o.shop.offers.map(x=>({id:x.id,deal:!!x.deal}))};
d.shopSalt=this.int(o.shopSalt);
if(o.q&&typeof o.q==='object'){d.q.dw=this.num(o.q.dw,-1);d.q.ww=this.num(o.q.ww,-1);d.q.d=this.scope(o.q.d);d.q.w=this.scope(o.q.w)}
if(o.g&&typeof o.g==='object')for(const k in o.g){const s=o.g[k]||{};d.g[k]={w:this.num(s.w,0),l:this.num(s.l,0),x:this.num(s.x,0)}}
if(r.status==='legacy')this.clampLegacy(d)}
if(!d.q.d.p)d.q.d=this.scope(null);if(!d.q.w.p)d.q.w=this.scope(null);
this.d=d;this.sync();if(bad||r.status==='legacy')this.save();return d},
save(){this.check();this.writeSigned(this.key,JSON.stringify(this.d))},
/* Total playtime (ms): kept under its own (signed) key so several open tabs never overwrite each other. Only visible tabs count, and a tab only adds time
   if no other tab has already counted the last second, so playtime ~= wall-clock time with the game open. */
playtime(){const r=this.readSigned(this.tpKey);if(r.status==='bad'||r.raw==null)return{t:0,l:0};try{const o=JSON.parse(r.raw);return{t:Math.max(0,this.num(o&&o.t,0)),l:this.num(o&&o.l,0)}}catch(e){return{t:0,l:0}}},
tickPlaytime(now=Date.now()){const p=this.playtime();if(typeof document!=='undefined'&&document.visibilityState==='hidden')return p.t;
const dt=now-p.l;if(dt>=900){const add=Math.min(dt,2500);p.t+=add;p.l=now;this.writeSigned(this.tpKey,JSON.stringify(p));this.questTime(add)}return p.t},
/* v2.4 playtime quests: fed ONLY from the shared playtime counter above (one tab counts each second, hidden tabs add nothing), batched to one save per ~5 s. */
qt:0,
questTime(ms,force){if(typeof Quests==='undefined'||!this.d||!this.d.user)return;if(ms>0)this.qt+=ms;if(!this.qt||(!force&&this.qt<5000))return;const a=this.qt;this.qt=0;this.load();Quests.add('time',a);this.save()}};
Store.load();
if(typeof addEventListener==='function')addEventListener('pagehide',()=>Store.questTime(0,true));   // flush pending quest playtime
if(typeof addEventListener==='function')addEventListener('storage',e=>{if(e.key===Store.key){Store.load();try{App.bal()}catch(x){}}}); // keep other tabs in sync
if(typeof document!=='undefined'&&typeof setInterval==='function')setInterval(()=>Store.check(),1000);   // clamp out-of-band edits within 1 s
