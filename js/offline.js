/* v2.6 offline support: registers sw.js (see that file). Only on https / localhost, silently does nothing elsewhere (file://, old browsers). */
(()=>{if(!('serviceWorker' in navigator))return;
if(!(location.protocol==='https:'||['localhost','127.0.0.1','[::1]'].includes(location.hostname)))return;
const reg=()=>navigator.serviceWorker.register('sw.js').catch(()=>{});
document.readyState==='complete'?reg():addEventListener('load',reg)})();
