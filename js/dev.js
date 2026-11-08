/* v2.7 developer menu. Keyboard sequence: Up Up Down Down D E V.
   Only exists on localhost / 127.0.0.1 / [::1] / file: (DEVENV, js/limited.js). The loader does not even fetch this file elsewhere, and every entry point re-checks DEVENV(),
   so triggering the shortcut in production does nothing. Mastery.devComplete/devReset and Games.cases.dev (forced Pirate Token) also check DEVENV() themselves. */
(()=>{if(typeof document==='undefined'||typeof DEVENV!=='function'||!DEVENV())return;
const SEQ=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','KeyD','KeyE','KeyV'];let i=0;
addEventListener('keydown',e=>{if(!DEVENV()||e.repeat)return;const t=e.target,n=t&&t.tagName;if(n==='INPUT'||n==='TEXTAREA'||n==='SELECT'||(t&&t.isContentEditable))return;
if(e.code===SEQ[i]){if(++i===SEQ.length){i=0;open()}}else i=e.code===SEQ[0]?1:0},true);
const armed=()=>{const d=Games.cases&&Games.cases.dev;return!!(d&&d.rar==='Pirate'&&d.left>0)};
function open(){if(!DEVENV()||typeof Modal==='undefined'||document.querySelector('.devm'))return;
const m=Modal.open(`<div class="devm"><p class="rdisc">DEVELOPER MENU<br><small>localhost only</small></p>
<div class="dbx"><button class="btn" id="dv-pt" type="button">Guarantee Pirate Token</button><p id="dv-st" style="margin:8px 0 0;font-size:13px"></p></div>
<div class="dbx"><label for="dv-t">Complete mastery level (then claim it)</label><select id="dv-t">${Mastery.tracks.map(t=>`<option value="${t.id}">${t.name}</option>`).join('')}</select>
<select id="dv-l" aria-label="Level">${Array.from({length:Mastery.LV},(_,i)=>`<option value="${i+1}">Level ${i+1}</option>`).join('')}</select><button class="btn" id="dv-c" type="button" style="margin-top:8px">Complete level</button></div>
<div class="dbx"><button class="btn dim" id="dv-r" type="button">Reset mastery</button><p style="margin:8px 0 0;font-size:12px">Clears all mastery progress and claims, and removes mastery cosmetics from the inventory.</p></div>
<button class="btn dim" id="dv-x" type="button">Close</button></div>`,{label:'Developer menu',esc:()=>m.close()});
const $=id=>document.getElementById(id),st=()=>{$('dv-st').textContent=armed()?'Armed: the next Cases wager drops a Pirate Token.':'Not armed.'},refresh=()=>{try{App.bal()}catch(e){}if(location.hash==='#mastery')App.route()};
st();$('dv-x').onclick=()=>m.close();
$('dv-pt').onclick=()=>{if(!DEVENV())return;Games.cases.dev={rar:'Pirate',left:1};st();App.toast('Next Cases wager: Pirate Token')};
$('dv-c').onclick=()=>{if(Mastery.devComplete($('dv-t').value,+$('dv-l').value)){App.toast('Mastery level completed');refresh()}else App.toast('Dev action refused')};
let sure=false;$('dv-r').onclick=e=>{if(!sure){sure=true;e.target.textContent='Click again to confirm reset';return}sure=false;e.target.textContent='Reset mastery';if(Mastery.devReset()){App.toast('Mastery reset');refresh()}}}})();
