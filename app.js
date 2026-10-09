const products=[
  {name:'Shade Comfort',byline:'by Flaxx · Polished bob',detail:'polished bob · natural black',price:'Price confirmed at release',tag:'Verification pending',worn:'assets/shade-comfort-gallery-01-v2.png',studio:'assets/mannequin-bob-front.png',gallery:['assets/shade-comfort-gallery-01-v2.png','assets/shade-comfort-gallery-02-v2.png','assets/shade-comfort-gallery-03-v2.png','assets/mannequin-bob-front.png','assets/mannequin-bob-back.png','assets/shade-comfort-gallery-06-street-v2.png'],texture:'Polished straight bob',colour:'Natural black',lede:'A clean, expressive bob with an easy fit and a finish made to look like the picture—exactly.',grade:'G3',gradeLabel:'Target — ships standard'},
  {name:'Maya Silk',byline:'by Flaxx · Sleek straight',detail:'sleek straight · natural black',price:'Price confirmed at release',tag:'Verification pending',worn:'assets/product-everyday-straight-worn-v3.png',studio:'assets/mannequin-straight-front.png',gallery:['assets/product-everyday-straight-worn-v3.png','assets/mannequin-straight-front.png'],texture:'Sleek straight',colour:'Natural black',lede:'A polished straight finish with movement that stays easy, clean and completely yours.',grade:'G3',gradeLabel:'Target — ships standard'},
  {name:'Amara Curl',byline:'by Flaxx · Soft curl',detail:'soft curl · natural black',price:'Price confirmed at release',tag:'Verification pending',worn:'assets/product-soft-curl-worn-v3.png',studio:'assets/mannequin-curl-front.png',gallery:['assets/product-soft-curl-worn-v3.png','assets/mannequin-curl-front.png'],texture:'Soft curl',colour:'Natural black',lede:'Full, touchable curls designed to frame the face and move without losing their character.',grade:'G3',gradeLabel:'Target — ships standard'},
  {name:'Elise Copper',byline:'by Flaxx · Copper wave',detail:'silky wave · warm copper',price:'Price confirmed at release',tag:'Verification pending',worn:'assets/product-copper-worn-v3.png',studio:'assets/mannequin-copper-front.png',gallery:['assets/product-copper-worn-v3.png','assets/mannequin-copper-front.png'],texture:'Silky body wave',colour:'Warm copper',lede:'A warm copper statement with a soft wave and a finish that still feels effortless.',grade:'G3',gradeLabel:'Target — ships standard'}
];
const state={cart:[],saved:[],size:null,length:null,density:null,part:'Center',colour:'Natural black',productIndex:0,galleryIndex:0};
const views=[...document.querySelectorAll('.view')];
const heroSlides=[...document.querySelectorAll('[data-hero-slide]')];
const heroDots=[...document.querySelectorAll('[data-hero-dot]')];
let heroIndex=0;
let heroTimer;

// Existing prototype colour targets; commercial availability remains unconfirmed.
const conceptColours=[{name:'Natural black',hex:'#282629'},{name:'Warm brown',hex:'#53382d'},{name:'Copper',hex:'#a76242'},{name:'Deep brown',hex:'#382520'}];
products.forEach(p=>{p.colourOptions??=conceptColours;p.sale??=false;p.confirmedPrice??=null;p.confirmedComparisonPrice??=null;p.merchandisingState??='New'});
const hasConfirmedSale=p=>p.sale===true&&Number.isFinite(p.confirmedPrice)&&p.confirmedPrice>0&&Number.isFinite(p.confirmedComparisonPrice)&&p.confirmedComparisonPrice>p.confirmedPrice;
const cardColours=(p,i)=>`<div class="card-colours" role="group" aria-label="${p.name} concept colours; availability pending">${p.colourOptions.slice(0,3).map(c=>`<button type="button" class="card-swatch" style="--swatch:${c.hex}" data-card-colour="${c.name}" aria-label="Explore ${c.name} for ${p.name}; availability pending" title="${c.name} · availability pending"></button>`).join('')}${p.colourOptions.length>3?`<button type="button" class="card-more-colours" data-card-colour="all" aria-label="Explore ${p.colourOptions.length-3} more ${p.colourOptions.length-3===1?'colour':'colours'} for ${p.name}; availability pending">+${p.colourOptions.length-3}</button>`:''}<span>Colours pending</span></div>`;
const productCard=(p,i)=>`<article class="product-card" data-product-index="${i}"><div class="product-media" data-card-gallery="0"><img class="card-shot" src="${p.worn}" alt="${p.name} worn view"><button class="card-arrow card-prev" type="button" data-card-dir="-1" aria-label="Previous image of ${p.name}">←</button><button class="card-arrow card-next" type="button" data-card-dir="1" aria-label="Next image of ${p.name}">→</button><span class="card-count" aria-live="polite" aria-atomic="true">1 / ${p.gallery.length}</span></div><div class="product-copy"><div class="card-heading"><h3><button type="button" class="card-title" aria-label="View ${p.name}">${p.name}</button>${hasConfirmedSale(p)?'<span class="sale-stars" role="img" aria-label="On sale">✦✦</span>':''}</h3><span class="card-verification">${p.tag}</span></div>${cardColours(p,i)}<p>${p.detail}</p><div class="card-price"><strong>${hasConfirmedSale(p)?`$${p.confirmedPrice.toFixed(2)}`:p.price}</strong>${hasConfirmedSale(p)?` <s aria-label="Previous price">$${p.confirmedComparisonPrice.toFixed(2)}</s>`:''}${['New','Returning'].includes(p.merchandisingState)?`<span class="merchandising-tag">${p.merchandisingState}</span>`:''}${p.grade?`<span class="grade-chip">${p.grade}</span>`:''}</div><div class="quick-buy"><label><span>Length</span><select class="quick-length" aria-label="Choose length for ${p.name}"><option>18 in</option><option>20 in</option><option>22 in</option><option>24 in</option></select></label><button class="quick-heart icon-action" type="button" aria-label="Save ${p.name}" aria-pressed="false"><img src="assets/icons/heart-rounded.svg" alt=""></button><button class="quick-add icon-action" type="button" aria-label="Add ${p.name} to bag"><img src="assets/icons/shopping-bag-02.svg" alt=""></button></div></div></article>`;
function setCardImage(card,index){
  const p=products[Number(card.dataset.productIndex)],media=card.querySelector('.product-media'),shot=media.querySelector('.card-shot'),src=p.gallery[index];
  media.dataset.cardGallery=String(index);shot.src=src;shot.alt=src.includes('mannequin')?`${p.name} shown on the Flaxx mannequin`:`${p.name} worn view ${index+1}`;
  media.querySelector('.card-count').textContent=`${index+1} / ${p.gallery.length}`;
}
function startCardGallery(card){const p=products[Number(card.dataset.productIndex)];setCardImage(card,Math.max(0,p.gallery.indexOf(p.studio)))}
function stepCardGallery(card,direction){const p=products[Number(card.dataset.productIndex)],index=Number(card.querySelector('.product-media').dataset.cardGallery);setCardImage(card,(index+direction+p.gallery.length)%p.gallery.length)}
function wireCardGallery(card){
  let pointerInside=false;
  card.addEventListener('pointerenter',e=>{if(e.pointerType==='touch')return;pointerInside=true;if(!card.contains(document.activeElement))startCardGallery(card)});
  card.addEventListener('pointerleave',e=>{if(e.pointerType==='touch')return;pointerInside=false;setCardImage(card,0)});
  card.addEventListener('focusin',e=>{if(!pointerInside&&!card.contains(e.relatedTarget))startCardGallery(card)});
  card.addEventListener('focusout',e=>{if(!pointerInside&&!card.contains(e.relatedTarget))setCardImage(card,0)});
  card.addEventListener('keydown',e=>{if(e.target.matches('select'))return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();stepCardGallery(card,e.key==='ArrowLeft'?-1:1)}});
}

function fillProductGrids(){
  document.querySelector('#home-products').innerHTML=products.map(productCard).join('');
  document.querySelector('#shop-products').innerHTML=products.map(productCard).join('');
  document.querySelector('#recommended-products').innerHTML=products.filter((_,i)=>i!==state.productIndex).slice(0,3).map(p=>productCard(p,products.indexOf(p))).join('');
  document.querySelectorAll('.product-card').forEach(wireCardGallery);updateHeartButtons();
}
function resetProductChoices(){
  Object.assign(state,{size:null,length:null,density:null,part:'Center',colour:products[state.productIndex].colour,galleryIndex:0});
  ['size-label','length-label','density-label'].forEach(id=>document.querySelector(`#${id}`).textContent='Select');
  document.querySelector('#part-label').textContent='Center';
  document.querySelector('#colour-label').textContent=state.colour;
  document.querySelectorAll('[data-size],[data-length],[data-density]').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('[data-part]').forEach(b=>b.classList.toggle('active',b.dataset.part==='Center'));
  document.querySelectorAll('[data-colour]').forEach(b=>b.classList.toggle('active',b.dataset.colour===state.colour));
}
function renderProduct(){
  const p=products[state.productIndex];
  document.querySelector('#product-name').textContent=p.name;
  document.querySelector('.swatches').innerHTML=p.colourOptions.map(c=>`<button type="button" class="${c.name===state.colour?'active':''}" style="background:${c.hex}" data-colour="${c.name}" aria-label="${c.name}; availability pending"></button>`).join('');
  document.querySelector('.product-byline').textContent=p.byline;
  document.querySelector('#product-price').textContent=p.price;
  document.querySelector('#product-lede').textContent=p.lede;
  const _vr=document.querySelector('#verification-record');if(_vr&&p.grade){_vr.innerHTML=`<p class='grade-row'><span class='grade-chip grade-chip--lg'>${p.grade}</span><span>${p.gradeLabel}</span></p><p><strong>Product and batch record:</strong> No commercial batch has been released. Source, material, length, density, colour, lace, cap construction, treatment and pre-finished claims will appear here only when supported by the released batch record.</p><ul><li>Source and chain of custody — pending</li><li>Material and treatment — pending</li><li>Construction and measurements — pending</li><li>Appearance against approved sample — pending</li><li>Release authority — pending</li></ul><button data-route='verify'>See how Flaxx verifies →</button>`}
document.querySelector('#product-specs').innerHTML=`<div><dt>Hair material</dt><dd>Pending verification</dd></div><div><dt>Texture</dt><dd>Concept target — ${p.texture}</dd></div><div><dt>Colour</dt><dd>Concept target — ${p.colour}</dd></div><div><dt>Lace</dt><dd>Pending verification</dd></div><div><dt>Wear method</dt><dd>Pending verification</dd></div><div><dt>Pre-finished</dt><dd>Pre-cut, pre-plucked and pre-bleached status pending verification</dd></div>`;
  document.querySelector('#product-thumbs').innerHTML=p.gallery.map((src,i)=>`<button type="button" data-product-thumb="${i}" class="${i===0?'active':''}" aria-label="Show image ${i+1}"><img src="${src}" alt=""></button>`).join('');
  updateProductGallery();fillProductGrids();
}
function updateProductGallery(){
  const p=products[state.productIndex],src=p.gallery[state.galleryIndex],main=document.querySelector('#product-main-image');
  main.src=src;main.classList.toggle('product-object',src.includes('mannequin'));main.alt=src.includes('mannequin')?`${p.name} shown on the Flaxx mannequin`:`${p.name} product view ${state.galleryIndex+1}`;
  document.querySelectorAll('[data-product-thumb]').forEach((b,i)=>b.classList.toggle('active',i===state.galleryIndex));
}
function route(name,index,historyMode='push'){
  if(name==='product'){if(Number.isInteger(index))state.productIndex=index;resetProductChoices();renderProduct()}
  views.forEach(v=>v.classList.toggle('active',v.dataset.view===name));document.querySelector('#mobile-nav').hidden=true;window.scrollTo({top:0,behavior:'auto'});const historyState={route:name,productIndex:state.productIndex};if(historyMode==='replace')history.replaceState(historyState,'',`#${name}`);else if(historyMode==='push')history.pushState(historyState,'',`#${name}`);document.querySelector('#main').focus({preventScroll:true});
}

fillProductGrids();
document.addEventListener('click',e=>{const arrow=e.target.closest('[data-card-dir]');if(!arrow)return;e.stopPropagation();stepCardGallery(arrow.closest('.product-card'),Number(arrow.dataset.cardDir))});
document.addEventListener('click',e=>{
  const colour=e.target.closest('[data-card-colour]');
  if(colour){e.stopPropagation();const choice=colour.dataset.cardColour;route('product',Number(colour.closest('.product-card').dataset.productIndex));if(choice!=='all'){state.colour=choice;document.querySelector('#colour-label').textContent=choice;document.querySelectorAll('[data-colour]').forEach(b=>b.classList.toggle('active',b.dataset.colour===choice))}document.querySelector('#colour-label').closest('.choice-block').scrollIntoView({block:'center'});document.querySelector(choice==='all'?'[data-colour]':`[data-colour="${choice}"]`).focus({preventScroll:true});return}
  if(e.target.closest('.quick-buy,[data-card-dir]'))return;
  const card=e.target.closest('.product-card');if(card){route('product',Number(card.dataset.productIndex));return}
  const r=e.target.closest('[data-route]');if(r)route(r.dataset.route);
});
document.querySelector('#mobile-menu').addEventListener('click',()=>{const n=document.querySelector('#mobile-nav');n.hidden=!n.hidden});
document.querySelector('#theme-toggle').addEventListener('click',()=>document.body.classList.toggle('dark'));

const overlay=document.querySelector('#overlay'),cart=document.querySelector('#cart-drawer'),search=document.querySelector('#search-drawer'),savedDrawer=document.querySelector('#saved-drawer');
function openDrawer(d){overlay.hidden=false;d.classList.add('open');d.setAttribute('aria-hidden','false')}
function closeDrawers(){overlay.hidden=true;[cart,search,savedDrawer].forEach(d=>{d.classList.remove('open');d.setAttribute('aria-hidden','true')})}
document.querySelector('#cart-open').addEventListener('click',()=>{renderCart();openDrawer(cart)});document.querySelector('#search-open').addEventListener('click',()=>openDrawer(search));document.querySelectorAll('.drawer-close').forEach(b=>b.addEventListener('click',closeDrawers));overlay.addEventListener('click',closeDrawers);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawers()});
document.querySelector('#saved-open').addEventListener('click',()=>{renderSaved();openDrawer(savedDrawer)});document.querySelector('#saved-body').addEventListener('click',e=>{const b=e.target.closest('[data-unsave]');if(b)toggleSaved(Number(b.dataset.unsave))});

function selectOption(selector,key,labelId){document.querySelectorAll(selector).forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll(selector).forEach(x=>x.classList.remove('active'));b.classList.add('active');state[key]=b.dataset[key];document.querySelector(`#${labelId}`).textContent=state[key]}))}
selectOption('[data-size]','size','size-label');selectOption('[data-length]','length','length-label');selectOption('[data-density]','density','density-label');selectOption('[data-part]','part','part-label');document.querySelector('.swatches').addEventListener('click',e=>{const b=e.target.closest('[data-colour]');if(!b)return;state.colour=b.dataset.colour;document.querySelector('#colour-label').textContent=state.colour;document.querySelectorAll('[data-colour]').forEach(x=>x.classList.toggle('active',x===b))});
document.querySelector('#add-to-bag').addEventListener('click',()=>{if(!state.size||!state.length||!state.density){document.querySelector('#size-label').textContent=state.size||'Choose';document.querySelector('#length-label').textContent=state.length||'Choose';document.querySelector('#density-label').textContent=state.density||'Choose';return}state.cart.push({...products[state.productIndex],size:state.size,length:state.length,density:state.density,part:state.part,colour:state.colour});renderCart();openDrawer(cart)});
document.addEventListener('click',e=>{const add=e.target.closest('.quick-add');if(!add)return;e.stopPropagation();const card=add.closest('.product-card'),product=products[Number(card.dataset.productIndex)],length=card.querySelector('.quick-length').value;state.cart.push({...product,size:length,length});renderCart();openDrawer(cart)});
function toggleSaved(i){const idx=state.saved.indexOf(i);if(idx===-1)state.saved.push(i);else state.saved.splice(idx,1);renderSaved();updateHeartButtons()}
function updateHeartButtons(){document.querySelectorAll('.quick-heart').forEach(btn=>{const card=btn.closest('.product-card');if(!card)return;const i=Number(card.dataset.productIndex),s=state.saved.includes(i);btn.setAttribute('aria-pressed',String(s));btn.classList.toggle('saved',s)});const sp=document.querySelector('.save-product');if(sp){const s=state.saved.includes(state.productIndex);sp.setAttribute('aria-pressed',String(s));sp.classList.toggle('saved',s)}}
function renderSaved(){const body=document.querySelector('#saved-body');if(!body)return;body.innerHTML=state.saved.length?state.saved.map(i=>{const p=products[i];return`<div class="cart-item"><div class="cart-thumb" style="background-image:url('${p.studio}')" role="img" aria-label="${p.name}"></div><div><div class="card-heading"><h3>${p.name}</h3><span class="card-verification">${p.tag}</span></div><p>${p.detail}</p></div><button data-unsave="${i}">×</button></div>`}).join(''):'<div class="empty"><h3>Nothing saved yet.</h3><p>Tap the heart on any style to save it here.</p></div>'}
document.addEventListener('click',e=>{const save=e.target.closest('.quick-heart');if(!save)return;e.stopPropagation();const card=save.closest('.product-card');if(!card)return;toggleSaved(Number(card.dataset.productIndex))});document.addEventListener('click',e=>{if(e.target.closest('.quick-buy'))e.stopPropagation()});
function renderCart(){const _badge=document.querySelector('#cart-count');_badge.textContent=state.cart.length||'';document.querySelector('#cart-body').innerHTML=state.cart.length?state.cart.map((p,i)=>`<div class="cart-item"><div class="cart-thumb" style="background-image:url('${p.studio}')" role="img" aria-label="${p.name}"></div><div><div class="card-heading"><h3>${p.name}${hasConfirmedSale(p)?'<span class="sale-stars" role="img" aria-label="On sale">✦✦</span>':''}</h3><span class="card-verification">${p.tag}</span></div><span>${[p.length,p.density,p.part].filter(Boolean).join(' · ')}</span></div><button data-remove="${i}">×</button></div>`).join(''):'<div class="empty"><h3>Your bag is empty.</h3><p>Your next favourite is waiting.</p></div>'}
document.querySelector('#cart-body').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(b){state.cart.splice(Number(b.dataset.remove),1);renderCart()}});
document.querySelector('#search-input').addEventListener('input',e=>{const q=e.target.value.toLowerCase().trim(),found=q?products.filter(p=>(p.name+p.detail+p.texture).toLowerCase().includes(q)):[];document.querySelector('#search-results').innerHTML=found.map(p=>`<button class="search-result" data-search-index="${products.indexOf(p)}">${p.name} →</button>`).join('')||(q?'<p>No match yet.</p>':'')});
document.querySelector('#search-results').addEventListener('click',e=>{const b=e.target.closest('[data-search-index]');if(b){closeDrawers();route('product',Number(b.dataset.searchIndex))}});document.querySelector('#interest-form').addEventListener('submit',e=>{e.preventDefault();document.querySelector('#form-message').textContent='Preview only—nothing was submitted.';e.target.reset()});
document.querySelector('.gallery-prev').addEventListener('click',()=>{const p=products[state.productIndex];state.galleryIndex=(state.galleryIndex-1+p.gallery.length)%p.gallery.length;updateProductGallery()});document.querySelector('.gallery-next').addEventListener('click',()=>{const p=products[state.productIndex];state.galleryIndex=(state.galleryIndex+1)%p.gallery.length;updateProductGallery()});document.querySelector('#product-thumbs').addEventListener('click',e=>{const b=e.target.closest('[data-product-thumb]');if(!b)return;state.galleryIndex=Number(b.dataset.productThumb);updateProductGallery()});
function wireDialog(selector,id){document.querySelectorAll(selector).forEach(b=>b.addEventListener('click',()=>document.querySelector(id).showModal()))}
wireDialog('[data-cap-open]','#cap-dialog');wireDialog('[data-care-open]','#care-dialog');wireDialog('[data-review-open]','#review-dialog');document.querySelectorAll('.info-dialog .dialog-close').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));document.querySelectorAll('.info-dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close()}));document.querySelector('#review-form').addEventListener('submit',e=>{e.preventDefault();document.querySelector('#review-message').textContent='Preview only—this review was not submitted.'});document.querySelector('[data-scroll-reviews]').addEventListener('click',()=>document.querySelector('#reviews-section').scrollIntoView({behavior:'smooth'}));document.querySelector('#delivery-check-button').addEventListener('click',()=>{document.querySelector('#delivery-message').textContent='Delivery timing will appear after inventory and fulfilment routes are released.'});
document.querySelector('[data-back-to-shop]').addEventListener('click',()=>route('shop'));
document.querySelector('.save-product').addEventListener('click',()=>toggleSaved(state.productIndex));
window.addEventListener('popstate',e=>{const name=e.state?.route||location.hash.slice(1)||'home';route(name,e.state?.productIndex,'none')});
function showHero(index){heroIndex=index;heroSlides.forEach((slide,i)=>{const active=i===index;slide.classList.toggle('active',active);slide.setAttribute('aria-hidden',String(!active))});heroDots.forEach((dot,i)=>dot.classList.toggle('active',i===index))}
heroDots.forEach(dot=>dot.addEventListener('click',()=>{clearInterval(heroTimer);showHero(Number(dot.dataset.heroDot))}));if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)heroTimer=setInterval(()=>showHero((heroIndex+1)%heroSlides.length),6500);
const initial=location.hash.slice(1);route(views.some(v=>v.dataset.view===initial)?initial:'home',0,'replace');renderCart();
