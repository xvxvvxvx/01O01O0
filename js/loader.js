(()=>{
try{if(window.top!==window.self&&window.top.location.href!=='about:blank'){document.documentElement.innerHTML='';return}}catch(e){document.documentElement.innerHTML='';return}   // anti-clickjacking (v2.4: our own same-origin about:blank tab may host the game; a foreign embedder throws here and is blocked)
const LOCAL=location.protocol==='file:'||['localhost','127.0.0.1','[::1]',''].includes(location.hostname),DEV=LOCAL&&/[?&]dev=1(&|$)/.test(location.search);
/* v2.7: limfx.js + limited.js (before storage.js), mastery.js (after pages/crates), pirate.js (after the games it extends); dev.js is only ever fetched on localhost (and checks DEVENV() itself). v2.8: update28.js last (wording, toast fix, compact side panels). */
const F=['config','cosmetics','cosfx','limfx','limited','storage','stats','economy','main','guard','hardening','ui','pages','crates','mastery','games/plinko','games/mines','games/crash','games/chicken','games/flip','games/aviamasters','games/doubleornothing','games/blackjack','games/cases','games/guessthecup','pirate','update28'].concat(LOCAL?['dev']:[]).map(n=>'js/'+n+'.js');
const fallback=()=>{let i=0;const next=()=>{if(i>=F.length){Shell.init();App.init();return}const s=document.createElement('script');s.src=F[i++];s.onload=next;s.onerror=next;document.body.appendChild(s)};next()};
Promise.all(F.map(f=>fetch(f,{credentials:'same-origin'}).then(r=>{if(!r.ok)throw new Error(f);return r.text()}))).then(a=>{
try{run=new Function(a.join('\n;\n')+'\n;Shell.init();App.init();')}catch(e){console.error(e);return fallback()}
run()},fallback)})();
