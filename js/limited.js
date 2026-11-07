/* v2.7 limited cosmetics: 51 Mastery milestone cosmetics (3 per objective: tag @ Lv 3, gradient @ Lv 6, tag @ Lv 10) + 5 Pirate Token cosmetics.
   They are NOT in COS (so never in the Gem-Shop, crates or the preview catalogue); Cos.by() resolves them, so inventory / equip / save / load work unchanged.
   Rarity "limited": unsellable (Cos.sellValue = 0 and Inv.sell refuses, see mastery.js). Loaded after cosfx.js and BEFORE storage.js (Store.load validates cosmetic ids with Cos.by).
   DEVENV(): true only on localhost / 127.0.0.1 / [::1] / file:. Everything developer-only (js/dev.js, Mastery.devComplete/devReset, Games.cases.dev) checks it on EVERY call. */
const DEVENV=()=>{try{if(typeof location==='undefined')return false;const h=location.hostname;return location.protocol==='file:'||h==='localhost'||h==='127.0.0.1'||h==='[::1]'}catch(e){return false}};
CFG.RAR.limited={n:'Limited',gems:0,deal:0,w:0,color:'#ffd84d'};
const LIM=(()=>{
const cap=s=>s.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()),grad=(a,b,c)=>`linear-gradient(90deg,${a},${b},${c},${a})`;
const FXD={spark:'rising sparkles',ember:'drifting embers',bubble:'floating bubbles',snow:'falling flakes',wind:'wind streaks',glitch:'a glitch flicker',pulse:'a pulsing glow',bolt:'lightning flashes',shine:'a sweeping shine'};
/* [track id, objective name, [tag @3, gradient @6, tag @10]]; each entry = [name/label, colour1, colour2, colour3, effect] */
const MSC=[
['cases','Cases Opened',[['[CASE CRACKER]','#ffb347','#fff0c2','#d97706','spark'],['Unboxing Gradient','#ff9a3c','#ffe1a8','#c13584','shine'],['[LOOT LORD]','#ffd700','#fff3b0','#d97706','ember']]],
['av','Aviamasters Flights Launched',[['[FLIGHT TAKER]','#7ec8ff','#ffffff','#3b82f6','wind'],['Skyborne Gradient','#4aa8ff','#eaf6ff','#7fb5ff','wind'],['[ACE OF THE AIR]','#bfe9ff','#ffffff','#38bdf8','shine']]],
['bj','Blackjack Games Played',[['[CARD SHARK]','#ff5c7a','#ffffff','#e11d48','pulse'],['Felt Table Gradient','#34d399','#d8f5e3','#10b981','shine'],['[THE HOUSE]','#facc15','#ffffff','#22c55e','spark']]],
['pl','Plinko Balls Deployed',[['[PEG BOUNCER]','#c084fc','#e9d5ff','#6366f1','bubble'],['Cascade Gradient','#22d3ee','#c4b5fd','#f472b6','bubble'],['[PLINKO PHANTOM]','#e9d5ff','#a855f7','#f0abfc','glitch']]],
['mn','Mines Games Played',[['[MINE SWEEPER]','#cbd5e1','#f59e0b','#94a3b8','spark'],['Vein Gradient','#34d399','#7dd3fc','#fbbf24','shine'],['[DEEP DELVER]','#7dd3fc','#e0f2fe','#3b82f6','pulse']]],
['fl','Flip Games Played',[['[COIN TOSSER]','#fde047','#fff7c2','#f59e0b','shine'],['Heads Or Tails Gradient','#fde047','#f1f5f9','#f59e0b','pulse'],['[LADY LUCK]','#fbcfe8','#ffffff','#f472b6','spark']]],
['dn','Double or Nothing Games Played',[['[ALL IN]','#f87171','#4ade80','#ffffff','pulse'],['Double Edge Gradient','#4ade80','#fecaca','#f87171','shine'],['[DOUBLE DEMON]','#ff7a85','#ffc371','#ef4444','ember']]],
['ck','Chicken Games Played',[['[ROAD RUNNER]','#facc15','#ffffff','#fb923c','wind'],['Feather Dash Gradient','#fde68a','#fff7ed','#f97316','wind'],['[CHICKEN KING]','#fff7ed','#fbbf24','#ef4444','ember']]],
['lg','Legendary Case Drops',[['[LEGEND HUNTER]','#fbbf24','#fff3b0','#f59e0b','spark'],['Amberglow Gradient','#fbbf24','#fffbeb','#f59e0b','shine'],['[LEGEND OF LEGENDS]','#fff7cc','#fbbf24','#fde68a','pulse']]],
['my','Mythic Case Drops',[['[MYTH CHASER]','#f87171','#fb923c','#fef3c7','ember'],['Crimson Myth Gradient','#f87171','#fda4af','#ef4444','ember'],['[MYTHBREAKER]','#fecaca','#f87171','#fff1f2','bolt']]],
['sc','Secret Case Drops',[['[SECRET KEEPER]','#e5e7eb','#9ca3af','#f9fafb','glitch'],['Shadowveil Gradient','#9ca3af','#f3f4f6','#6b7280','snow'],['[THE UNKNOWN]','#ffffff','#a78bfa','#9ca3af','glitch']]],
['pt','Pirate Tokens Obtained',[['[TOKEN TAMER]','#ffd84d','#fff2a8','#ca8a04','spark'],['Doubloon Gradient','#facc15','#fef08a','#ca8a04','shine'],['[TOKEN LORD]','#fff6c0','#f59e0b','#fcd34d','pulse']]],
['a4','Aviamasters Landings at 4-5x',[['[SKY CLIMBER]','#86efac','#dcfce7','#22c55e','wind'],['Greenline Gradient','#34d399','#a7f3d0','#6ee7b7','wind'],['[ALTITUDE ACE]','#bbf7d0','#34d399','#ecfdf5','bolt']]],
['a5','Aviamasters Landings at 5-6x',[['[CLOUD PIERCER]','#93c5fd','#eff6ff','#3b82f6','wind'],['Stratus Gradient','#bfdbfe','#60a5fa','#e0f2fe','snow'],['[STRATO ACE]','#e0f2fe','#38bdf8','#93c5fd','shine']]],
['a6','Aviamasters Landings at 6-7x',[['[JET STREAM]','#c4b5fd','#f5f3ff','#8b5cf6','wind'],['Ultraviolet Gradient','#c4b5fd','#ede9fe','#a78bfa','bolt'],['[MACH MASTER]','#ddd6fe','#a78bfa','#f5f3ff','pulse']]],
['a7','Aviamasters Landings at 7x+',[['[SKY SOVEREIGN]','#fca5a5','#fff1f2','#ef4444','ember'],['Stormfront Gradient','#fca5a5','#fef2f2','#f87171','bolt'],['[THE STRATOSPHERE]','#ffffff','#f87171','#fecaca','bolt']]],
['ir','Instant Rank-Ups',[['[RANK RUSHER]','#bef264','#ecfccb','#84cc16','pulse'],['Ascension Gradient','#facc15','#fef9c3','#a3e635','shine'],['[SPEED OF LIGHT]','#ffffff','#fde047','#38bdf8','bolt']]]];
const out=[];
MSC.forEach(([id,nm,es])=>[[3,es[0],'tag'],[6,es[1],'grad'],[10,es[2],'tag']].forEach(([lv,e,ty])=>{const[n,a,b,c,fx]=e;
out.push({id:`m_${id}_${lv}`,type:ty,name:ty==='tag'?cap(n.slice(1,-1))+' Tag':n,label:n,rar:'limited',bg:grad(a,b,c),anim:fx==='shine'?'':'x',fx:'',lim:1,src:'mastery',mx:id,lv,lfx:fx,cols:[a,b,c],
desc:`Mastery reward: ${nm}, Level ${lv}. Limited and unsellable. ${FXD[fx][0].toUpperCase()+FXD[fx].slice(1)} over an animated gradient.`})}));
const gold='linear-gradient(90deg,#b8860b,#ffe08a,#fff6c0,#d4a017,#b8860b)';
const P=(id,type,name,label,bg,lfx,cols,desc)=>out.push({id,type,name,label,rar:'limited',bg,anim:'x',fx:'',lim:1,src:'pirate',lfx,cols,desc:'Pirate Token reward. Limited and unsellable. '+desc});
P('t_pirate','tag','The Pirate Tag','[THE PIRATE]','linear-gradient(90deg,#000000,#ffffff,#8a8f98,#ffffff,#000000)','flag',['#ffffff','#9ca3af','#ffffff'],'A pirate flag waves above an animated black-and-white gradient.');
P('g_treasure','grad','Treasure Finder Gradient','Treasure Finder Gradient','linear-gradient(90deg,#ffe27a,#f5a623,#13b5a9,#fff3b0,#ffe27a)','spark',['#ffe27a','#13b5a9','#ffffff'],'Gold and sea-glass colours with glinting sparkles.');
P('t_treasure','tag','Treasure Finder Tag','[TREASURE FINDER]',gold,'coinU',['#ffd84d','#fff6c0','#d4a017'],'An animated gold gradient with gold coins floating up.');
P('g_pirate','grad','The Pirate Gradient','The Pirate Gradient','linear-gradient(90deg,#a8730a,#d4a017,#fff2a8,#ffd84d,#a8730a)','coinD',['#ffd84d','#fff2a8','#d4a017'],'An animated gold gradient with gold coins raining down.');
P('t_pking','tag','King Of The Pirates Tag','[KING OF THE PIRATES]','linear-gradient(90deg,#ffffff,#ef4444,#ffffff,#f87171,#ffffff)','hat',['#ffffff','#ef4444','#fff1f2'],'A straw hat bobs above an animated white-and-red gradient.');
return out})();
const LIMBY=Object.fromEntries(LIM.map(c=>[c.id,c]));
Cos.lim=LIM;
{const by=Cos.by,sv=Cos.sellValue,gm=Cos.gems,html=Cos.html,hs=s=>{let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h};
Cos.by=id=>by(id)||LIMBY[id]||null;
Cos.sellValue=c=>c&&c.lim?0:sv(c);
Cos.gems=c=>c&&c.lim?0:gm(c);
/* limited markup: <span.lmx.lm-FX (particles / flag / hat live on this wrapper)><span.cos (animated gradient text)></span></span>. The wrapper is not .cos, so the hover-only preview rule of cosfx never hides it. */
Cos.html=(c,txt)=>{if(!c||!c.lim)return html(c,txt);const[a,b,d]=c.cols,sh=c.lfx==='shine',t=txt==null?c.label:txt,
bg=sh?`linear-gradient(100deg,transparent 35%,rgba(255,255,255,.95) 50%,transparent 65%),${c.bg}`:c.bg;
return `<span class="lmx lm-${c.lfx}" style="--p1:${a};--p2:${b};--p3:${d};--dl:${-(hs(c.id)%30)/10}s"><span class="cos${sh?' lmshine':c.anim?' an'+c.anim:''}" style="background-image:${bg}">${t}</span></span>`}}
if(typeof document!=='undefined'&&!document.getElementById('stk-lim')){
const dot=(c,r)=>`radial-gradient(circle,${c} 0 ${r}px,transparent ${r+.9}px)`,L=(cs,r)=>cs.map(c=>dot(c,r)).join(','),ring=c=>`radial-gradient(circle,transparent 0 2px,${c} 2.3px 3.2px,transparent 3.6px)`,
coin='radial-gradient(circle at 35% 30%,#fff7b8 0 1px,#ffd84d 2px,#b8860b 3.6px,transparent 4.3px)',R=(f,n)=>Array(n).fill(f).join(','),
uri=s=>'url("data:image/svg+xml,'+encodeURIComponent(s)+'")',
FLAG=uri("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><rect x='1.5' y='1' width='1.4' height='18' fill='#ddd'/><path d='M3 2Q9 0 12 2.5T20 2.5V11Q16 13.5 12 11T3 11Z' fill='#111' stroke='#fff' stroke-width='.8'/><circle cx='11.5' cy='6.2' r='2.4' fill='#fff'/><circle cx='10.5' cy='5.9' r='.7' fill='#111'/><circle cx='12.6' cy='5.9' r='.7' fill='#111'/><path d='M9 9L14 3.8M14 9L9 3.8' stroke='#fff' stroke-width='.8'/></svg>"),
HAT=uri("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 22'><ellipse cx='20' cy='15' rx='19' ry='5' fill='#f2c14e' stroke='#b8860b'/><path d='M9 14Q9 2 20 2Q31 2 31 14Q20 17 9 14Z' fill='#f7d77a' stroke='#b8860b'/><path d='M9.5 12Q20 15.5 30.5 12L31 14.5Q20 18 9 14.5Z' fill='#d12a2a'/></svg>");
const sel=(ks,pe)=>ks.map(k=>`.lm-${k}${pe}`).join(','),DOT=['spark','ember','bubble','snow','coinU','coinD'],POS1='background-position:6% 80%,26% 90%,50% 70%,74% 92%,94% 76%',POS2='background-position:16% 60%,38% 84%,62% 62%,84% 88%,100% 66%';
const s=document.createElement('style');s.id='stk-lim';s.textContent=`
.lmx{position:relative;display:inline-block}
.lmx::before,.lmx::after{content:"";position:absolute;pointer-events:none;opacity:0;background-repeat:no-repeat;animation-iteration-count:infinite;animation-timing-function:ease-out;animation-delay:var(--dl,0s)}
${sel(DOT,'::before')},${sel(DOT,'::after')}{left:-8px;right:-8px;top:-10px;bottom:-10px}
.lm-spark::before{background-image:${L(['var(--p1)','var(--p2)','var(--p3)','var(--p1)','var(--p2)'],1.5)};background-size:7px 7px;${POS1};animation-name:lmUp;animation-duration:2.2s}
.lm-spark::after{background-image:${L(['var(--p2)','var(--p3)','var(--p1)','var(--p3)','var(--p2)'],1.2)};background-size:6px 6px;${POS2};animation-name:lmTw;animation-duration:1.6s;animation-delay:calc(var(--dl,0s) - .7s)}
.lm-ember{filter:drop-shadow(0 0 3px var(--p1))}
.lm-ember::before{background-image:${L(['var(--p1)','var(--p2)','var(--p3)','var(--p1)','var(--p2)'],2)};background-size:8px 8px;${POS1};animation-name:lmEm;animation-duration:1.6s}
.lm-ember::after{background-image:${L(['var(--p3)','var(--p1)','var(--p2)','var(--p3)','var(--p1)'],1.4)};background-size:7px 7px;${POS2};animation-name:lmEm;animation-duration:2.1s;animation-delay:calc(var(--dl,0s) - 1s)}
.lm-bubble::before{background-image:${R(ring('var(--p1)'),5)};background-size:10px 10px;${POS1};animation-name:lmBub;animation-duration:3s}
.lm-bubble::after{background-image:${R(ring('var(--p2)'),5)};background-size:8px 8px;${POS2};animation-name:lmBub;animation-duration:3.7s;animation-delay:calc(var(--dl,0s) - 1.6s)}
.lm-snow::before{background-image:${L(['var(--p1)','var(--p2)','var(--p3)','var(--p1)','var(--p2)'],1.5)};background-size:7px 7px;background-position:6% 8%,26% 0,50% 12%,74% 4%,94% 10%;animation-name:lmDn;animation-duration:2.8s}
.lm-snow::after{background-image:${L(['var(--p2)','var(--p1)','var(--p3)','var(--p2)','var(--p1)'],1.1)};background-size:6px 6px;background-position:16% 0,38% 10%,62% 2%,84% 12%,100% 6%;animation-name:lmDn;animation-duration:3.4s;animation-delay:calc(var(--dl,0s) - 1.3s)}
.lm-coinU::before{background-image:${R(coin,5)};background-size:10px 10px;${POS1};animation-name:lmUp;animation-duration:2.1s}
.lm-coinU::after{background-image:${R(coin,5)};background-size:8px 8px;${POS2};animation-name:lmUp;animation-duration:2.7s;animation-delay:calc(var(--dl,0s) - 1.2s)}
.lm-coinD::before{background-image:${R(coin,5)};background-size:10px 10px;background-position:6% 8%,26% 0,50% 12%,74% 4%,94% 10%;animation-name:lmDn;animation-duration:2.3s}
.lm-coinD::after{background-image:${R(coin,5)};background-size:8px 8px;background-position:16% 0,38% 10%,62% 2%,84% 12%,100% 6%;animation-name:lmDn;animation-duration:3s;animation-delay:calc(var(--dl,0s) - 1.4s)}
.lm-wind::before,.lm-wind::after{left:-16px;right:-16px;top:-2px;bottom:-2px;background-image:linear-gradient(90deg,transparent,var(--p2),transparent),linear-gradient(90deg,transparent,var(--p1),transparent),linear-gradient(90deg,transparent,var(--p3),transparent);background-size:45% 1.5px,60% 1.5px,35% 1.5px;animation-timing-function:linear}
.lm-wind::before{background-position:-60% 20%,-80% 55%,-40% 88%;animation-name:lmWind;animation-duration:1.6s}
.lm-wind::after{background-position:-60% 36%,-80% 72%,-40% 6%;animation-name:lmWind2;animation-duration:2.1s;animation-delay:calc(var(--dl,0s) - .8s)}
.lm-glitch{animation:lmGl 3s steps(1) infinite;animation-delay:var(--dl,0s)}
.lm-pulse{animation:lmPu 2.4s ease-in-out infinite;animation-delay:var(--dl,0s)}
.lm-bolt{animation:lmBg 3.2s linear infinite;animation-delay:var(--dl,0s)}
.lm-bolt::before,.lm-bolt::after{top:-70%;bottom:-70%;width:9px;background:var(--p1);clip-path:polygon(60% 0,0 55%,40% 55%,10% 100%,100% 40%,55% 40%);animation-name:lmBolt;animation-duration:3.2s;animation-timing-function:linear}
.lm-bolt::before{left:14%}.lm-bolt::after{left:72%;background:var(--p3);animation-delay:calc(var(--dl,0s) - 1.6s)}
.cos.lmshine{background-size:250% 100%,100% 100%;background-repeat:no-repeat;animation:lmSh 3s linear infinite}
.lm-flag::before{left:-6px;top:-16px;width:18px;height:18px;opacity:1;background-image:${FLAG};background-size:contain;transform-origin:2px 17px;animation:lmWave 1.8s ease-in-out infinite;animation-delay:0s}
.lm-hat::before{left:50%;top:-13px;width:32px;height:18px;margin-left:-16px;opacity:1;background-image:${HAT};background-size:contain;transform-origin:50% 100%;animation:lmHat 2.4s ease-in-out infinite;animation-delay:0s}
.sprev .lmx.lm-flag,.sprev .lmx.lm-hat,.ic .lmx.lm-flag,.ic .lmx.lm-hat{margin-top:16px}
@keyframes lmUp{0%{opacity:0;transform:translateY(6px) scale(.6)}20%{opacity:1}70%{opacity:.9}100%{opacity:0;transform:translateY(-13px) scale(1.15)}}
@keyframes lmTw{0%,100%{opacity:0;transform:scale(.5)}35%{opacity:1;transform:scale(1.25) translateY(-3px)}60%{opacity:.2;transform:scale(.9) translateY(-6px)}80%{opacity:.9;transform:scale(1.1) translateY(-8px)}}
@keyframes lmEm{0%{opacity:0;transform:translate(0,6px) scale(1.1)}20%{opacity:1}100%{opacity:0;transform:translate(-4px,-16px) scale(.3)}}
@keyframes lmBub{0%{opacity:0;transform:translate(0,8px) scale(.6)}25%{opacity:.95}60%{transform:translate(3px,-6px) scale(1)}100%{opacity:0;transform:translate(-2px,-17px) scale(1.25)}}
@keyframes lmDn{0%{opacity:0;transform:translateY(-14px)}20%{opacity:1}100%{opacity:0;transform:translateY(15px)}}
@keyframes lmWind{0%{opacity:0;background-position:-60% 20%,-80% 55%,-40% 88%}15%,85%{opacity:1}100%{opacity:0;background-position:170% 20%,150% 55%,170% 88%}}
@keyframes lmWind2{0%{opacity:0;background-position:-60% 36%,-80% 72%,-40% 6%}15%,85%{opacity:1}100%{opacity:0;background-position:170% 36%,150% 72%,170% 6%}}
@keyframes lmGl{0%,90%,100%{filter:none;transform:none}91%{filter:drop-shadow(2px 0 var(--p1)) drop-shadow(-2px 0 var(--p3));transform:translateX(1px)}93%{filter:drop-shadow(-2px 0 var(--p1)) drop-shadow(2px 0 var(--p3));transform:translateX(-1px) skewX(-6deg)}95%{filter:none;transform:none}97%{filter:drop-shadow(1px 0 var(--p3));transform:translateX(1px)}}
@keyframes lmPu{0%,100%{filter:drop-shadow(0 0 2px var(--p1))}50%{filter:drop-shadow(0 0 9px var(--p1)) drop-shadow(0 0 3px var(--p2))}}
@keyframes lmBolt{0%,100%{opacity:0}2%{opacity:1}4%{opacity:.1}6%{opacity:.9}9%{opacity:0}}
@keyframes lmBg{0%,100%{filter:none}2%,6%{filter:drop-shadow(0 0 6px var(--p1)) brightness(1.5)}4%{filter:none}9%{filter:none}}
@keyframes lmSh{from{background-position:150% 0,0 0}to{background-position:-50% 0,0 0}}
@keyframes lmWave{0%,100%{transform:rotate(-5deg) skewX(0)}50%{transform:rotate(5deg) skewX(-8deg)}}
@keyframes lmHat{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-3px) rotate(4deg)}}
@media(prefers-reduced-motion:reduce){.lmx,.lmx .cos{animation:none!important}.lmx::before,.lmx::after{animation:none!important}${sel(DOT.concat(['wind','bolt']),'::before')},${sel(DOT.concat(['wind','bolt']),'::after')}{display:none}}`;document.head.appendChild(s)}
