/* Applies tools/update29.patch.txt to the repo. Run from the repo root:  node tools/apply-update29.js [--dry]
   Every anchor must occur EXACTLY once in its file, otherwise that file is left untouched and the script exits 1. */
const fs=require('fs'),path=require('path'),root=process.cwd(),dry=process.argv.includes('--dry');
const txt=fs.readFileSync(path.join(__dirname,'update29.patch.txt'),'utf8').replace(/\r\n/g,'\n');
let bad=0;
for(const chunk of txt.split(/^@@@ /m).slice(1)){const nl=chunk.indexOf('\n'),file=chunk.slice(0,nl).trim(),body=chunk.slice(nl+1),p=path.join(root,file);
if(!fs.existsSync(p)){console.log('MISSING  '+file);bad++;continue}
let src=fs.readFileSync(p,'utf8'),eol=src.includes('\r\n')?'\r\n':'\n';src=src.replace(/\r\n/g,'\n');let n=0,fail=false;
for(const m of body.matchAll(/<<<<\n([\s\S]*?)\n====\n([\s\S]*?)\n>>>>/g)){const[,a,b]=m,c=src.split(a).length-1;
if(c!==1){console.log(`ANCHOR   ${file}: found ${c}x -> ${a.slice(0,70)}`);fail=true;bad++;continue}src=src.replace(a,()=>b);n++}
if(fail){console.log('SKIPPED  '+file+' (no changes written)');continue}
if(!dry)fs.writeFileSync(p,src.replace(/\n/g,eol));console.log((dry?'ok (dry) ':'patched  ')+file+' ('+n+' edits)')}
process.exit(bad?1:0);
