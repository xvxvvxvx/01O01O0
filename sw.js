/* Gold offline cache (v2.6; v2.7 adds limited.js, v2.75 adds limfx.js, mastery.js, pirate.js to the pre-cache. dev.js is localhost-only and deliberately NOT cached).
   Problem: all art lives in img/ on the same host as the game. When that host (GitHub Pages) is down, every icon / card / rank badge vanished.
   Fix: this service worker pre-caches the whole site (code + every image) on the first visit and then serves images cache-first
   (refreshing them quietly in the background), and code network-first with a cache fallback. Works fully offline after one online visit.
   Each file is cached on its own, so one missing image (e.g. a placeholder not uploaded yet) never breaks the rest. */
const CACHE='gold-offline-v2.75.0';
const FILES=['./','game.html','index.html','css/style.css','css/update245.css','css/update25.css',
'js/toggle.js','js/loader.js','js/offline.js','js/calc.js','js/ptable.js',
'js/config.js','js/cosmetics.js','js/cosfx.js','js/limfx.js','js/limited.js','js/storage.js','js/stats.js','js/economy.js','js/main.js','js/guard.js','js/hardening.js','js/ui.js','js/pages.js','js/crates.js','js/mastery.js','js/pirate.js',
'js/games/plinko.js','js/games/mines.js','js/games/crash.js','js/games/chicken.js','js/games/flip.js','js/games/aviamasters.js','js/games/doubleornothing.js','js/games/blackjack.js','js/games/cases.js','js/games/guessthecup.js'];
const IMGS=['icon.png','plinko.png','mines.png','crash.png','chicken.png','flip.png','aviamasters.png','doubleornothing.png','blackjack.png','cases.png','guessthecup.png',
'case-common.png','case-uncommon.png','case-rare.png','case-legendary.png','case-mythic.png','case-secret.png','case-pirate.jpg','champion.jpg','radiant.jpg',
'insanedemon.png','extremedemon.png','impossibledemon.jpg','unreal.jpg','div5.jpg','div4.jpg','div3.jpg','div2.jpg','div1.jpg'].map(n=>'img/'+n);
const abs=p=>new URL(p,self.registration.scope).href;
self.addEventListener('install',e=>{e.waitUntil((async()=>{const c=await caches.open(CACHE);
await Promise.all([...FILES,...IMGS].map(async p=>{try{const r=await fetch(abs(p),{cache:'reload'});if(r&&r.ok)await c.put(abs(p),r)}catch(_){}}));
await self.skipWaiting()})())});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('gold-offline-')&&k!==CACHE)await caches.delete(k);await self.clients.claim()})())});
const isImg=(req,u)=>req.destination==='image'||/\.(png|jpe?g|gif|webp|svg|ico)$/i.test(u.pathname);
/* images + fonts: serve the cached copy at once, refresh it in the background */
function swr(e){const req=e.request;return caches.open(CACHE).then(async c=>{const hit=await c.match(req,{ignoreSearch:true});
const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque'))c.put(req,r.clone());return r}).catch(()=>null);
if(hit){e.waitUntil(net);return hit}const r=await net;return r||Response.error()})}   // uncached + offline: a clean network error, so CSS gradient fallbacks / alt text still show
/* code + pages: fresh when the host is up, cached copy when it is down, slow or returning errors */
function netFirst(e){const req=e.request;return caches.open(CACHE).then(async c=>{const hit=await c.match(req,{ignoreSearch:true});
try{const f=fetch(req),r=await(hit?Promise.race([f,new Promise((_,j)=>setTimeout(j,4000))]):f);if(r&&r.ok){c.put(req,r.clone());return r}return hit||r}
catch(_){return hit||(req.mode==='navigate'?await c.match(abs('game.html')):null)||Response.error()}})}
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);
const font=u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com';
if(u.origin!==self.location.origin&&!font)return;
if(font||isImg(req,u))e.respondWith(swr(e));else e.respondWith(netFirst(e))});
