Games.mines={title:'MINES',mount(el){
el.innerHTML=`<div class="play"><div class="side"><label>Bet</label>${App.betHTML()}<label>Mines</label><select id="mc">${Array.from({length:CFG.MINES.MAX_MINES},(_,i)=>`<option ${i==2?'selected':''}>${i+1}</option>`).join('')}</select><button class="btn" id="go">Bet</button><button class="btn alt" id="co" disabled>Cash out</button><div id="info"></div></div><div class="stage"><div class="grid5" id="gr"></div></div></div>`;
let on=false,mines=new Set,rev=new Set,bet=0,M=3,tiles=[],tm=[];
const gr=el.querySelector('#gr'),go=el.querySelector('#go'),co=el.querySelector('#co'),info=el.querySelector('#info');
const mul=d=>{let m=.97;for(let i=0;i<d;i++)m*=(25-i)/(25-M-i);return m};
function build(){gr.innerHTML='';tiles=[];for(let i=0;i<25;i++){const t=document.createElement('div');t.className='tl';t.innerHTML='<div class="fi"><div class="ff"></div><div class="fb"></div></div>';t.onclick=()=>pick(i);gr.appendChild(t);tiles.push(t)}}
function face(i){const b=tiles[i].querySelector('.fb'),m=mines.has(i);b.textContent=m?'💣':'💎';b.className='fb'+(m?' bomb':'')}
function upd(){const d=rev.size;info.innerHTML=on?`Multiplier: <b>${mul(d).toFixed(2)}x</b><br>Next: ${mul(d+1).toFixed(2)}x<br>Cash out: $${App.f(bet*mul(d))}`:''}
function revealRest(){let k=0;tiles.forEach((t,j)=>{if(t.classList.contains('flip'))return;face(j);tm.push(setTimeout(()=>t.classList.add('flip','ghost'),k++*25))})}
function finish(){on=false;go.disabled=false;co.disabled=true;upd()}
function pick(i){if(!on||tiles[i].classList.contains('flip'))return;face(i);tiles[i].classList.add('flip');
if(mines.has(i)){App.settle('MINES',bet,0,{noCount:rev.size<1});App.toast('Boom! Lost $'+App.f(bet));finish();
tm.push(setTimeout(()=>{const t=tiles[i];FX.boom(gr,t.offsetLeft+t.offsetWidth/2,t.offsetTop+t.offsetHeight/2,true);gr.classList.remove('shake');void gr.offsetWidth;gr.classList.add('shake');revealRest()},280));return}
rev.add(i);co.disabled=false;if(rev.size===25-M)cash();else upd()}
function cash(){if(!on||!rev.size)return;const w=bet*mul(rev.size);App.settle('MINES',bet,w);App.toast(`Cashed out ${mul(rev.size).toFixed(2)}x: +$${App.f(w-bet)}`);finish();revealRest()}
go.onclick=()=>{const m=Math.floor(+el.querySelector('#mc').value);if(!(m>=CFG.MINES.MIN_MINES&&m<=CFG.MINES.MAX_MINES)){App.toast('Choose 1 to '+CFG.MINES.MAX_MINES+' mines');return}bet=App.bet(el,'MINES');if(!bet)return;M=m;mines=new Set;while(mines.size<M)mines.add(Math.floor(Math.random()*25));rev=new Set;tm.forEach(clearTimeout);tm=[];build();on=true;go.disabled=true;co.disabled=true;upd()};
co.onclick=cash;build();
return()=>tm.forEach(clearTimeout)}};
