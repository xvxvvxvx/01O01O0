/* v2.95 add-on: 4 new Gem-Shop gradients + 4 new tags, their icons / particle effects, and the shared Pirate-reward preview helper (Pv295).
   Loaded after cosfx.js and BEFORE limfx / limited / storage, because Store.load() validates saved cosmetic ids with Cos.by().
   All cosmetics here are purely cosmetic: no luck, odds or gameplay bonus of any kind. */
(()=>{
const RB='linear-gradient(90deg,#ff0000,#ff9900,#ffee00,#33ff00,#00ccff,#6600ff,#ff00cc,#ff0000)',
SILVER='linear-gradient(90deg,#8b929c,#f3f4f6,#6b7280,#ffffff,#9ca3af,#8b929c)',
LUCKY='linear-gradient(90deg,#15803d,#4ade80,#fde047,#ca8a04,#4ade80,#15803d)',
STEAK='linear-gradient(90deg,#4a2209,#8b4513,#d2a679,#b5733a,#4a2209)';
const mk=(id,type,name,label,rar,bg,fx,ic)=>({id,type,name,label,rar,bg,anim:'x',fx:fx||'',ic295:ic||''});
COS.push(
mk('g_almost','grad','Almost Almost Gradient','Almost Almost Gradient','epic',SILVER),
mk('t_almost','tag','Almost Almost Tag','[ALMOST ALMOST]','epic',SILVER),
mk('g_ultraluck','grad','Ultra Secret Luck Booster Gradient','Ultra Secret Luck Booster Gradient','legendary',RB,'clover'),
mk('t_ultraluck','tag','Ultra Secret Luck Booster Tag','[ULTRA SECRET LUCK BOOSTER+++]','legendary',RB,'clover','clover'),
mk('g_lucky','grad','The Lucky One Gradient','The Lucky One Gradient','legendary',LUCKY,'lucky'),
mk('t_lucky','tag','The Lucky One Tag','[THE LUCKY ONE]','legendary',LUCKY,'lucky','lucky'),
mk('g_steak','grad','The Steak Gradient','The Steak Gradient','legendary',STEAK,'steak'),
mk('t_steak','tag','The Steak Tag','[THE STEAK]','legendary',STEAK,'steak','steak'));
/* tags get an animated icon in front of the text (the icon is a sibling of .cos, so the gradient text keeps its own animation + particles) */
const prev=Cos.html;
Cos.html=(c,txt)=>{const h=prev(c,txt);return c&&c.ic295?`<span class="ci295 ci-${c.ic295}"><i class="cii" aria-hidden="true"></i>${h}</span>`:h};
if(typeof document==='undefined'||document.getElementById('stk-cos295'))return;
const U=s=>'url("data:image/svg+xml,'+encodeURIComponent(s)+'")';
const leaf=(f,s,r)=>`<path transform='rotate(${r} 12 12)' d='M12 12C9 9.5 7.6 6.2 9.6 4.8C11 3.9 12 5.2 12 6.4C12 5.2 13 3.9 14.4 4.8C16.4 6.2 15 9.5 12 12Z' fill='${f}' stroke='${s}' stroke-width='.7' stroke-linejoin='round'/>`;
const clover=(cols,s)=>`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>${cols.map((f,i)=>leaf(f,s,i*90)).join('')}<path d='M12 12Q12.5 18 16.5 21' stroke='${s}' stroke-width='1.4' fill='none' stroke-linecap='round'/></svg>`;
const tiles=cols=>cols.map(c=>U(clover([c,c,c,c],'#ffffff'))).join(',');
const dot=(c,r)=>`radial-gradient(circle,${c} 0 ${r}px,transparent ${r+.9}px)`,dots=(cs,r)=>cs.map(c=>dot(c,r)).join(',');
const P1='background-position:6% 80%,26% 90%,50% 70%,74% 92%,94% 76%',P2='background-position:16% 60%,38% 84%,62% 62%,84% 88%,100% 66%';
const STEAKSVG=`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M3.5 11C3.5 6 9 3.5 14.5 4.2C20 5 22 9 20.5 14C19 19 12 21 7.5 18.5C4.5 17 3.5 14 3.5 11Z' fill='#7a3b12' stroke='#3b1d0a' stroke-width='1.2'/><path d='M6 11C6 8 10 6.2 14.2 6.8C18 7.4 19 10 18 13C17 16.500 12 18 9 16.500C7 15.500 6 13.500 6 11Z' fill='#c68642'/><circle cx='15.500' cy='11.500' r='2.200' fill='#f5e6c8' stroke='#3b1d0a' stroke-width='.8'/><path d='M8 8.500L11 14M11 7.500L14 13.500' stroke='#4a2209' stroke-width='1.100' stroke-linecap='round'/></svg>`;
const s=document.createElement('style');s.id='stk-cos295';s.textContent=`
.ci295{display:inline-flex;align-items:center;gap:.28em;vertical-align:middle;white-space:nowrap}
.ci295 .cii{position:relative;flex:none;width:1.3em;height:1.3em;background:center/contain no-repeat}
.ci295.ci-clover .cos{font-size:.8em}
.ci-clover .cii{background-image:${U(clover(['#ff4d4d','#ffd84d','#4dff88','#4dd2ff'],'#2a2a5a'))};animation:ciSpin 4s linear infinite,ciHue 3s linear infinite}
.ci-lucky .cii{background-image:${U(clover(['#22c55e','#4ade80','#22c55e','#16a34a'],'#facc15'))};animation:ciSway 2.4s ease-in-out infinite;filter:drop-shadow(0 0 3px #facc15)}
.ci-steak .cii{background-image:${U(STEAKSVG)};animation:ciBob 1.8s ease-in-out infinite}
.ci-steak .cii::before,.ci-steak .cii::after{content:"";position:absolute;top:-8%;width:.3em;height:.3em;border-radius:50%;background:#ffffffb0;opacity:0;animation:ciSteam 2s ease-out infinite}
.ci-steak .cii::before{left:18%}.ci-steak .cii::after{left:55%;animation-delay:.9s}
@keyframes ciSpin{to{transform:rotate(360deg)}}@keyframes ciHue{to{filter:hue-rotate(360deg)}}
@keyframes ciSway{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(12deg)}}
@keyframes ciBob{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-2px) rotate(4deg)}}
@keyframes ciSteam{0%{opacity:0;transform:translateY(4px) scale(.5)}30%{opacity:.8}100%{opacity:0;transform:translateY(-9px) scale(1.2)}}
/* themed particles (same two pseudo-element layers cosfx.js uses; hover-only previews are handled by cosfx's own rules) */
.cos.fxl.cx-clover::before{background-image:${tiles(['#ff4d4d','#ffd84d','#4dff88','#4dd2ff','#b44dff'])};background-size:9px 9px;${P1}}
.cos.fxl.cx-clover::after{background-image:${tiles(['#4dd2ff','#ff2bd6','#ffee00','#33ff00','#ff4d4d'])};background-size:8px 8px;${P2};animation-name:cfxTw;animation-duration:1.8s}
.cos.fxl.cx-lucky::before{background-image:${tiles(['#22c55e','#facc15','#4ade80','#fde047','#16a34a'])};background-size:9px 9px;${P1}}
.cos.fxl.cx-lucky::after{background-image:${tiles(['#facc15','#22c55e','#fde047','#4ade80','#ca8a04'])};background-size:8px 8px;${P2};animation-name:cfxTw;animation-duration:2s}
.cos.fxl.cx-steak::before{background-image:${dots(['#ffb066','#c68642','#fff1d6','#ff8a3d','#8b4513'],1.8)};background-size:8px 8px;${P1};animation-duration:1.9s}
.cos.fxl.cx-steak::after{background-image:${dots(['#fff1d6','#ff8a3d','#c68642','#ffb066','#fff1d6'],1.3)};background-size:7px 7px;${P2}}
@media(prefers-reduced-motion:reduce){.ci295 .cii,.ci295 .cii::before,.ci295 .cii::after{animation:none!important}}
/* Pirate reward preview list (Cases side panel + Aviamasters "Pirate Ship Rewards") */
.pvn{margin:4px 0;font-size:12px}.pvl{list-style:none;margin:6px 0 0;padding:0;display:grid;gap:6px;text-align:left}
.pvl li{display:flex;align-items:center;gap:10px;padding:5px 8px;border:2px solid #ffffff44;border-radius:12px;transition:transform .2s,border-color .2s,background .2s}
.pvl li:hover{transform:translateX(3px);border-color:#ffd84d;background:#ffffff0f}
.pvp{flex:none;min-width:70px;display:flex;align-items:center;justify-content:center;font-weight:900}.pvd{min-width:0;font-size:13px}.pvd small{color:#a3a3a3;font-size:11px}`;
document.head.appendChild(s)})();
/* Pirate Token reward previews. Every row is read from Perks.LIST, i.e. the exact pool Pirate Tokens (Cases) and the Pirate Ship roll from. */
const Pv295={
item(p){if(p.kind==='cos'){const c=Cos.by(p.cos);return c.type==='grad'?Cos.user(esc(Store.d.user||'username'),c.id):Cos.html(c)}
if(p.kind==='gem')return `${gemIcon(22)}&nbsp;${p.n}`;if(p.kind==='row')return '+'+p.n+' ROW';if(p.kind==='cs'||p.kind==='as')return '+'+p.n+'x';return 'RANK READY'},
list(){const n=Perks.LIST.length;return `<p class="pvn">One of ${n} rewards, each equally likely (1 in ${n}). Hover to preview.</p><ul class="pvl">`+Perks.LIST.map(p=>`<li><span class="pvp">${Pv295.item(p)}</span><span class="pvd"><b>${esc(p.name)}</b><br><small>${esc(p.desc)}</small></span></li>`).join('')+'</ul>'}};
