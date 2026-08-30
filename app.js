
const I=window.ATLAS_ITEMS,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let db,current=null,scale=1,tx=0,ty=0,drag=false,sx=0,sy=0;
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function slug(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-')}
$('#theme').onclick=()=>$('#themebox').hidden=!$('#themebox').hidden;
$('#accent').oninput=e=>document.documentElement.style.setProperty('--a',e.target.value);
$('#bg').oninput=e=>document.documentElement.style.setProperty('--bg',e.target.value);
function openDB(){return new Promise((res,rej)=>{let r=indexedDB.open('atlas-torax',1);r.onupgradeneeded=e=>{let d=e.target.result;if(!d.objectStoreNames.contains('photos')){let s=d.createObjectStore('photos',{keyPath:'id'});s.createIndex('item','item')}};r.onsuccess=e=>{db=e.target.result;res()};r.onerror=()=>rej(r.error)})}
function photos(id){return new Promise((res,rej)=>{let r=db.transaction('photos').objectStore('photos').index('item').getAll(id);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function save(id,f){return new Promise((res,rej)=>{let r=db.transaction('photos','readwrite').objectStore('photos').put({id:id+'-'+f.name+'-'+f.size+'-'+f.lastModified,item:id,blob:f});r.onsuccess=res;r.onerror=()=>rej(r.error)})}
function candidates(x){let n=x.global;return [`images/${n}.png`,`images/${n}.PNG`,`images/${n}.jpg`,`images/${n}.JPG`,`images/${n}.jpeg`,`images/${n}.JPEG`,`images/${n}.webp`,`images/${n}.WEBP`]}
function tryImg(img,arr){return new Promise(res=>{let i=0;const next=()=>{if(i>=arr.length){img.removeAttribute('src');res(false);return}img.onload=()=>res(true);img.onerror=()=>next();img.src=arr[i++]};next()})}
async function build(){let secs=[...new Set(I.map(x=>x.section))];$('#nav').innerHTML=secs.map(s=>`<a href="#${slug(s)}">${esc(s)}</a>`).join('');let host=$('#sections');for(let s of secs){let sec=document.createElement('section');sec.className='section';sec.id=slug(s);sec.innerHTML=`<h2>${esc(s)}</h2><div class="grid"></div>`;host.appendChild(sec);for(let x of I.filter(y=>y.section===s)){let b=document.createElement('button');b.className='name';b.dataset.name=(x.name+' '+x.section).toLowerCase();b.innerHTML=`<span class="g">${x.global}</span><span><strong>${esc(x.name)}</strong><small>Roteiro: ${esc(x.original||'—')} · ${x.image}</small></span>`;b.onclick=()=>openDetail(x);sec.querySelector('.grid').appendChild(b)}}$('#coverage').innerHTML='<b>94</b> nomes disponíveis';}
$('#search').oninput=e=>{$$('.name').forEach(b=>b.style.display=b.dataset.name.includes(e.target.value.toLowerCase())?'':'none')};
async function openDetail(x){current=x;$('#num').textContent=x.global;$('#sec').textContent=x.section;$('#title').textContent=x.name;$('#orig').textContent='Roteiro: '+(x.original||'—');$('#loc').textContent=x.location;$('#file').textContent=x.image;$('#expected').textContent=x.image;$('#modal').hidden=false;document.body.style.overflow='hidden';scale=1;tx=ty=0;apply();await loadImg()}
async function loadImg(){let img=$('#img'),ph=$('#ph');img.hidden=true;ph.hidden=false;let ok=await tryImg(img,candidates(current));let ps=await photos(current.id);if(!ok&&ps.length){img.src=URL.createObjectURL(ps[0].blob);ok=true}if(ok){img.hidden=false;ph.hidden=true}let g=$('#gallery');g.innerHTML='';ps.forEach(p=>{let u=URL.createObjectURL(p.blob),t=new Image();t.src=u;t.onclick=()=>{img.src=u;img.hidden=false;ph.hidden=true};g.appendChild(t)})}
function close(){document.body.style.overflow='';$('#modal').hidden=true;current=null}
$('#close').onclick=close;$('#modal').onclick=e=>{if(e.target===$('#modal'))close()};window.onkeydown=e=>{if(e.key==='Escape'&&!$('#modal').hidden)close()};
async function input(el){for(let f of [...el.files])if(f.type.startsWith('image/'))await save(current.id,f);el.value='';await loadImg()}
$('#attach').onchange=e=>input(e.target);$('#camera').onchange=e=>input(e.target);
function apply(){$('#img').style.transform=`translate(${tx}px,${ty}px) scale(${scale})`;$('#reset').textContent=Math.round(scale*100)+'%'}
$('#plus').onclick=()=>{scale=Math.min(6,scale+.25);apply()};$('#minus').onclick=()=>{scale=Math.max(.25,scale-.25);apply()};$('#reset').onclick=()=>{scale=1;tx=ty=0;apply()};
let st=$('#stage');st.onpointerdown=e=>{drag=true;sx=e.clientX-tx;sy=e.clientY-ty;st.setPointerCapture(e.pointerId)};st.onpointermove=e=>{if(drag){tx=e.clientX-sx;ty=e.clientY-sy;apply()}};st.onpointerup=()=>drag=false;st.onwheel=e=>{e.preventDefault();scale=Math.max(.25,Math.min(6,scale+(e.deltaY<0?.15:-.15)));apply()};
if('serviceWorker'in navigator&&location.protocol!=='file:')addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
(async()=>{await openDB();await build()})();
