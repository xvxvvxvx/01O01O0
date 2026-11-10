// Update 2.8 tests. Run: node tests/update28.test.js   (no browser needed)
const fs=require('fs'),vm=require('vm'),path=require('path'),R=p=>path.join(__dirname,'..',p);
let pass=0,fail=0;const t=(n,ok)=>{console.log((ok?'PASS ':'FAIL ')+n);ok?pass++:fail++};
global.window=global;vm.runInThisContext(fs.readFileSync(R('js/update28.js'),'utf8'));const U=Update28;
t('01O0coin / 01O0Coin / 01O0 coin / 01O0oin -> Coin',['Not enough 01O0coin','into 01O0Coin:','Earn 5 01O0 coin profit','sold for 5 01O0oin.'].map(U.norm).join('|')==='Not enough Coin|into Coin:|Earn 5 Coin profit|sold for 5 Coin.');
t('site URL and bare 01O0 -> Gold; Steakcoin -> Coin',U.norm('on https://xvxvvxvx.github.io/01O01O0/ are')==='on Gold are'&&U.norm('01O0 Plinko')==='Gold Plinko'&&U.norm('0.01 Steakcoin')==='0.01 Coin');
t('no 01O0 survives any input mix',!/01O0/.test(U.norm('01O0coin 01O0 01O01O0 01O0Coin 01O0oin')));
t('internal save keys are never touched by the loader/CSS (only display strings are normalised)',!/01O0|0-100/.test(fs.readFileSync(R('css/update28.css'),'utf8')));
t('canvas font fix maps Montserrat/Playfair/Times to Fredoka',U.fontFix("900 40px Montserrat,sans-serif")==='900 40px Fredoka,sans-serif'&&U.fontFix("700 20px 'Times New Roman'")==="700 20px 'Fredoka'");
const css=fs.readFileSync(R('css/update28.css'),'utf8'),ld=fs.readFileSync(R('js/loader.js'),'utf8'),gh=fs.readFileSync(R('game.html'),'utf8'),sw=fs.readFileSync(R('sw.js'),'utf8');
t('Fredoka loaded (Google Fonts) and applied with fallbacks; Playfair/Montserrat links removed',/family=Fredoka/.test(gh)&&!/Playfair|Montserrat/.test(gh)&&/'Fredoka','Trebuchet MS',system-ui,sans-serif!important/.test(css)&&/--serif:'Fredoka'/.test(css));
t('game.html has no 01O0 text and loads update28.css',!/01O0/.test(gh)&&/css\/update28\.css/.test(gh));
t('loader keeps dev.js localhost-only and loads update28 last of the prod files',/LOCAL\?\['dev'\]:\[\]/.test(ld)&&/'progress','update28','update29'\]/.test(ld));
t('update28.js and loader.js parse as script text',(()=>{try{new Function(fs.readFileSync(R('js/update28.js'),'utf8')+'\n;\n'+fs.readFileSync(R('js/loader.js'),'utf8'));return true}catch(e){console.log(e.message);return false}})());
t('service worker caches update28 files with a bumped cache name',sw.includes("'css/update28.css'")&&sw.includes("'js/update28.js'")&&/gold-offline-v2\.9\.0/.test(sw));
t('Limited rarity: animated black, white outline, reduced-motion respected, not gold',/#f5f5f5/.test(css)&&/border:2px solid #fff/.test(css)&&/lmBlk/.test(css)&&/prefers-reduced-motion/.test(css));
t('gem chip no longer absolutely positioned (no overlap)',/\.gemchip\{position:static/.test(css));
console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
