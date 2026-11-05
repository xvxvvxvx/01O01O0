// Update 2.7 tests: Pirate Token rarity (odds, multiplier, icon, offline cache, presentation hooks). Run: node tests/update27.test.js
const fs=require('fs'),path=require('path'),R=p=>path.join(__dirname,'..',p);
let pass=0,fail=0;const t=(n,ok)=>{console.log((ok?'PASS ':'FAIL ')+n);ok?pass++:fail++};
const src=fs.readFileSync(R('js/games/cases.js'),'utf8');
const rows=[...src.matchAll(/k: '(\w+)'.*?min: ([\d.]+),\s*max: ([\d.]+),\s*p: ([\d.]+),\s*d: ([\d.]+)/g)].map(m=>({k:m[1],lo:+m[2],hi:+m[3],p:+m[4],d:+m[5]}));
const pr=rows.find(r=>r.k==='Pirate');
t('Pirate Token is the 8th and rarest tier',rows.length===8&&rows[7].k==='Pirate'&&rows.every(r=>r.p>=pr.p));
t('Pirate Token: rolled 0.2%, shown 0.2%, pays 100-150x',pr&&pr.p===.2&&pr.d===.2&&pr.lo===100&&pr.hi===150);
t('rolled odds total exactly 100 and map to 1000 integer weights',Math.abs(rows.reduce((a,r)=>a+r.p,0)-100)<1e-9&&rows.reduce((a,r)=>a+Math.round(r.p*10),0)===1000);
t('displayed odds total exactly 100',Math.abs(rows.reduce((a,r)=>a+r.d,0)-100)<1e-9);
t('icon is img/case-pirate.jpg and the file is a real JPEG',/ic: 'img\/case-pirate\.jpg'/.test(src)&&fs.existsSync(R('img/case-pirate.jpg'))&&fs.readFileSync(R('img/case-pirate.jpg')).slice(0,2).toString('hex')==='ffd8');
t('cinematic text is "PIRATE TOKEN" / "NEW RARITY ACHIEVED"',src.includes('>PIRATE TOKEN<')&&src.includes('>NEW RARITY ACHIEVED<'));
t('chest opens, coin explosion + coin spray hooks exist',/class="lid"/.test(src)&&/function coinShow/.test(src)&&/function spray/.test(src)&&/function pirate/.test(src));
t('animated gold gradient styles exist (tile, odds line, past chip, title)',['.ct.r-Pirate','.pg-tx','.cs-past b.pg','.pt-l2'].every(s=>src.includes(s)));
t('lifetime Pirate counter is persisted (storage.js)',/cc:\{Legendary:0,Mythic:0,Secret:0,Pirate:0\}/.test(fs.readFileSync(R('js/storage.js'),'utf8')));
const sw=fs.readFileSync(R('sw.js'),'utf8');
t('sw.js pre-caches case-pirate.jpg, champion.jpg and radiant.jpg',['case-pirate.jpg','champion.jpg','radiant.jpg'].every(n=>sw.includes("'"+n+"'")||sw.includes('"'+n+'"')));
console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
