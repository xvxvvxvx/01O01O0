(()=>{const h=location.hostname,LOCAL=location.protocol==='file:'||['localhost','127.0.0.1','[::1]',''].includes(h);
if(!LOCAL||!/[?&]dev=1(&|$)/.test(location.search))return;
const C=Games.cases,force=(location.search.match(/[?&]force=(fake|tip)/)||[])[1];C.dev={fake:force==='fake'?1:0,tip:force==='tip'?1:0};
const box=document.createElement('div');box.id='stk-dev';box.style.cssText='position:fixed;left:8px;bottom:8px;z-index:9998;background:#000;border:2px solid #f59e0b;border-radius:10px;padding:8px;font:700 12px Montserrat,sans-serif;color:#f59e0b;display:grid;gap:6px;max-width:210px';
const st=()=>box.querySelector('i').textContent=`armed: ${C.dev.fake?'FAKE COMMON':C.dev.tip?'TIP-OVER':'none'}`;
box.innerHTML='DEV MODE<button data-a="gems">+999 Gems</button><button data-a="fake">Arm fake common</button><button data-a="tip">Arm tip-over</button><i></i>';
box.querySelectorAll('button').forEach(b=>{b.style.cssText='background:#f59e0b;color:#000;border:0;border-radius:6px;padding:5px;font:800 12px Montserrat,sans-serif;cursor:pointer';
b.onclick=()=>{const a=b.dataset.a;if(a==='gems'){Store.load();Store.d.gems+=999;Store.sync();Store.save();App.bal();App.toast('DEV: +999 Gems')}
else{C.dev.fake=a==='fake'?1:0;C.dev.tip=a==='tip'?1:0;st();App.toast('DEV: '+(a==='fake'?'fake common':'tip-over')+' armed for the next Cases spin')}}});
document.body.appendChild(box);st()})();
