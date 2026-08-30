
const ITEMS=window.ATLAS_ITEMS;
let db, filter='all', deferredPrompt=null;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

function hexRgb(hex){hex=hex.replace('#',''); if(hex.length===3)hex=hex.split('').map(c=>c+c).join(''); const n=parseInt(hex,16); return `${(n>>16)&255},${(n>>8)&255},${n&255}`}
function lum(hex){const a=hex.replace('#','').match(/.{2}/g).map(x=>parseInt(x,16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2]}
function theme(accent,bg){
 document.documentElement.style.setProperty('--accent',accent);
 document.documentElement.style.setProperty('--accent-rgb',hexRgb(accent));
 document.documentElement.style.setProperty('--bg',bg);
 const dark=lum(bg)<.30;
 document.documentElement.style.setProperty('--panel',dark?'#171717':'#fffdf9');
 document.documentElement.style.setProperty('--panel2',dark?'#202020':'#f7f2ea');
 document.documentElement.style.setProperty('--ink',dark?'#f5f1eb':'#23211e');
 document.documentElement.style.setProperty('--muted',dark?'#bdb6ae':'#716b63');
 document.documentElement.style.setProperty('--line',dark?'#343434':'#ddd4c8');
 try{localStorage.setItem('atlasTheme',JSON.stringify({accent,bg}))}catch(e){}
}
try{const t=JSON.parse(localStorage.getItem('atlasTheme')||'null');if(t)theme(t.accent,t.bg)}catch(e){}
$('#paletteBtn').addEventListener('click',()=>$('#palette').hidden=!$('#palette').hidden);
$('#accent').addEventListener('input',e=>theme(e.target.value,getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()));
$('#background').addEventListener('input',e=>theme(getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),e.target.value));
$$('[data-preset]').forEach(b=>b.addEventListener('click',()=>{const p=b.dataset.preset;if(p==='paper')theme('#8a5b3d','#f2eee7');if(p==='light')theme('#5f6573','#f6f7f8');if(p==='dark')theme('#c08a5c','#101010')}));
$('#printBtn').addEventListener('click',()=>window.print());

function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open('atlas-torax',1);r.onupgradeneeded=e=>{const d=e.target.result;if(!d.objectStoreNames.contains('photos')){const s=d.createObjectStore('photos',{keyPath:'id'});s.createIndex('item','item',{unique:false})}};r.onsuccess=e=>{db=e.target.result;res()};r.onerror=()=>rej(r.error)})}
function photos(item){return new Promise((res,rej)=>{const r=db.transaction('photos').objectStore('photos').index('item').getAll(item);r.onsuccess=()=>res(r.result.sort((a,b)=>a.time-b.time));r.onerror=()=>rej(r.error)})}
function savePhoto(item,file){return new Promise((res,rej)=>{const id=`${item}-${file.name}-${file.size}-${file.lastModified}`;const r=db.transaction('photos','readwrite').objectStore('photos').put({id,item,blob:file,name:file.name,time:Date.now()});r.onsuccess=res;r.onerror=()=>rej(r.error)})}
function removePhoto(id){return new Promise((res,rej)=>{const r=db.transaction('photos','readwrite').objectStore('photos').delete(id);r.onsuccess=res;r.onerror=()=>rej(r.error)})}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function slug(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}

function tryImageCandidates(img, candidates){
 return new Promise(resolve=>{
   let i=0;
   const next=()=>{
     if(i>=candidates.length){
       img.removeAttribute('src');
       resolve(false);
       return;
     }
     const src=candidates[i++];
     img.onload=()=>{
       img.onload=null;
       img.onerror=null;
       resolve(true);
     };
     img.onerror=()=>{
       img.onload=null;
       img.onerror=null;
       next();
     };
     img.src=src;
   };
   next();
 });
}
async function hydrate(item,card){
 const img=card.querySelector('.main'), placeholder=card.querySelector('.placeholder'), status=card.querySelector('.status'), gal=card.querySelector('.gallery');
 let has=false;
 const n=item.global;
 const candidates=[
   `images/${n}.png`,
   `images/${n}.PNG`,
   `images/${n}.jpg`,
   `images/${n}.JPG`,
   `images/${n}.jpeg`,
   `images/${n}.JPEG`,
   `images/${n}.webp`,
   `images/${n}.WEBP`
 ];
 if(await tryImageCandidates(img,candidates)){img.hidden=false;placeholder.hidden=true;has=true}
 const ps=await photos(item.id);
 if(!has && ps.length){img.src=URL.createObjectURL(ps[0].blob);img.hidden=false;placeholder.hidden=true;has=true}
 status.textContent=has?'COM IMAGEM':'SEM IMAGEM';status.className='status'+(has?' ok':'');card.dataset.has=has?'1':'0';
 gal.innerHTML='';
 ps.forEach(p=>{const u=URL.createObjectURL(p.blob);const t=document.createElement('img');t.src=u;t.className='thumb';t.alt=p.name;t.title='Clique para ampliar. Clique com botão direito para excluir.';t.addEventListener('click',()=>openViewer(u,item.name));t.addEventListener('contextmenu',async e=>{e.preventDefault();if(confirm('Deseja realmente excluir esta fotografia?')){await removePhoto(p.id);await hydrate(item,card);coverage();apply()}});gal.appendChild(t)});
 img.addEventListener('click',()=>{if(!img.hidden)openViewer(img.src,item.name)},{once:false});
 card.querySelector('.zoom').addEventListener('click',()=>{if(!img.hidden)openViewer(img.src,item.name)});
 card.querySelectorAll('input[type=file]').forEach(inp=>inp.addEventListener('change',async e=>{for(const f of [...e.target.files])if(f.type.startsWith('image/'))await savePhoto(item.id,f);inp.value='';await hydrate(item,card);coverage();apply()}));
}
async function build(){
 const sections=[...new Set(ITEMS.map(i=>i.section))];
 $('#nav').innerHTML=sections.map(s=>`<a href="#${slug(s)}">${esc(s)}</a>`).join('');
 const out=$('#content');out.innerHTML='';
 for(const sec of sections){
   const h=document.createElement('h2');h.className='section-title';h.id=slug(sec);h.textContent=sec;out.appendChild(h);
   const grid=document.createElement('div');grid.className='cards';out.appendChild(grid);
   for(const item of ITEMS.filter(x=>x.section===sec)){
    const a=document.createElement('article');a.className=`card level${item.level}`;a.id=item.id;a.dataset.name=(item.name+' '+item.section).toLowerCase();
    a.innerHTML=`<div class="card-head"><div class="gnum">${item.global}</div><div class="card-title"><h3>${esc(item.name)}</h3><span class="original">Roteiro: ${esc(item.original||'—')} • arquivo ${item.image}</span></div><span class="status">SEM IMAGEM</span></div>
    <div class="figure"><div class="placeholder"><div class="icon">🖼️</div><strong>${item.image}</strong><small>Coloque esta imagem na pasta <b>images</b>.<br>Ela aparecerá aqui inteira, sem corte.</small></div><img class="main" hidden alt="${esc(item.name)}"></div>
    <div class="gallery"></div>
    <div class="location"><div class="label">Localização anatômica</div><p>${esc(item.location)}</p></div>
    <div class="card-actions"><button class="primary zoom">🔍 Ampliar / Zoom</button><label class="fileLabel">📎 Anexar fotos<input type="file" accept="image/*" multiple></label><label class="fileLabel">📷 Tirar foto<input type="file" accept="image/*" capture="environment"></label></div>`;
    grid.appendChild(a); await hydrate(item,a);
   }
 }
 coverage();apply();
}
function coverage(){const c=$$('.card'),h=c.filter(x=>x.dataset.has==='1').length;$('#coverage').innerHTML=`<b>${h}</b> com imagem · <b>${94-h}</b> sem imagem · <b>94</b> total`}
function apply(){const q=$('#search').value.toLowerCase().trim();$$('.card').forEach(c=>{const qok=c.dataset.name.includes(q),fok=filter==='all'||(filter==='has'&&c.dataset.has==='1')||(filter==='missing'&&c.dataset.has==='0');c.style.display=qok&&fok?'':'none'});$$('.cards').forEach(g=>g.previousElementSibling.style.display=[...g.children].some(c=>c.style.display!=='none')?'':'none')}
$('#search').addEventListener('input',apply);$$('.filter').forEach(b=>b.addEventListener('click',()=>{$$('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.filter;apply()}));

let scale=1,tx=0,ty=0,drag=false,sx=0,sy=0;const V=$('#viewer'),VI=$('#viewerImage'),ST=$('#stage');
function transform(){VI.style.transform=`translate(${tx}px,${ty}px) scale(${scale})`;$('#reset').textContent=Math.round(scale*100)+'%'}
function openViewer(src,title){VI.src=src;$('#viewerTitle').textContent=title;V.hidden=false;scale=1;tx=0;ty=0;transform()}
$('#close').addEventListener('click',()=>V.hidden=true);$('#plus').addEventListener('click',()=>{scale=Math.min(6,scale+.25);transform()});$('#minus').addEventListener('click',()=>{scale=Math.max(.25,scale-.25);transform()});$('#reset').addEventListener('click',()=>{scale=1;tx=ty=0;transform()});
ST.addEventListener('pointerdown',e=>{drag=true;sx=e.clientX-tx;sy=e.clientY-ty;ST.setPointerCapture(e.pointerId)});ST.addEventListener('pointermove',e=>{if(drag){tx=e.clientX-sx;ty=e.clientY-sy;transform()}});ST.addEventListener('pointerup',()=>drag=false);ST.addEventListener('wheel',e=>{e.preventDefault();scale=Math.max(.25,Math.min(6,scale+(e.deltaY<0?.15:-.15)));transform()},{passive:false});
window.addEventListener('keydown',e=>{if(!V.hidden&&e.key==='Escape')V.hidden=true});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#installBtn').hidden=false;$('#installBtn').onclick=async()=>{await deferredPrompt.prompt();$('#installBtn').hidden=true}});
if('serviceWorker' in navigator && location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
(async()=>{await openDB();await build()})();
