const products=[
  {id:'body-wave',name:'Body-Wave Closure Unit',subtitle:'18 in · Natural black · Working specification',price:'Expected price pending',tag:'WINTER PILOT',image:'assets/flaxx-body-wave.png',route:'product'},
  {id:'fit-kit',name:'Fit & Proof Kit',subtitle:'Measurement · Lace · Representative swatch',price:'$19 validation hypothesis',tag:'ENTRY PROVISION',image:'assets/flaxx-editorial-curls.png',route:'fit'},
  {id:'curl-study',name:'Curl Behaviour Study',subtitle:'Concept record · Not an available product',price:'Evidence in formation',tag:'RESEARCH',image:'assets/flaxx-editorial-curls.png',route:'verify'},
  {id:'care-record',name:'Product-Linked Care',subtitle:'Guidance tied to released construction',price:'Included with provision',tag:'CARE',image:'assets/flaxx-body-wave.png',route:'verify'}
];

const state={cart:[],size:null};
const views=[...document.querySelectorAll('.view')];

function productCard(p){return `<article class="product-card" data-route="${p.route}" tabindex="0"><div class="product-media"><img src="${p.image}" alt="${p.name} concept"><span class="product-tag">${p.tag}</span><button class="save" aria-label="Save ${p.name}">♡</button></div><div class="product-copy"><h3>${p.name}</h3><p>${p.subtitle}</p><strong>${p.price}</strong></div></article>`}
document.querySelector('#home-products').innerHTML=products.slice(0,4).map(productCard).join('');
document.querySelector('#shop-products').innerHTML=products.map(productCard).join('');

function route(name){
  views.forEach(v=>v.classList.toggle('active',v.dataset.view===name));
  window.scrollTo({top:0,behavior:'instant'});
  document.querySelector('#mobile-nav').hidden=true;
  document.querySelector('#main').focus({preventScroll:true});
  history.replaceState(null,'',`#${name}`);
}
document.addEventListener('click',e=>{const target=e.target.closest('[data-route]');if(target)route(target.dataset.route)});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('product-card'))route(e.target.dataset.route)});

document.querySelector('#mobile-menu').addEventListener('click',()=>{const nav=document.querySelector('#mobile-nav');nav.hidden=!nav.hidden});
document.querySelector('#theme-toggle').addEventListener('click',()=>document.body.classList.toggle('dark'));

const overlay=document.querySelector('#overlay');
const cartDrawer=document.querySelector('#cart-drawer');
const searchDrawer=document.querySelector('#search-drawer');
function openDrawer(drawer){overlay.hidden=false;drawer.classList.add('open');drawer.setAttribute('aria-hidden','false');drawer.querySelector('.drawer-close').focus()}
function closeDrawers(){overlay.hidden=true;[cartDrawer,searchDrawer].forEach(d=>{d.classList.remove('open');d.setAttribute('aria-hidden','true')})}
document.querySelector('#cart-open').addEventListener('click',()=>{renderCart();openDrawer(cartDrawer)});
document.querySelector('#search-open').addEventListener('click',()=>openDrawer(searchDrawer));
document.querySelectorAll('.drawer-close').forEach(b=>b.addEventListener('click',closeDrawers));
overlay.addEventListener('click',closeDrawers);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawers()});

document.querySelectorAll('[data-size]').forEach(button=>button.addEventListener('click',()=>{state.size=button.dataset.size;document.querySelectorAll('[data-size]').forEach(b=>b.classList.remove('active'));button.classList.add('active');document.querySelector('#size-label').textContent=state.size}));
document.querySelector('#add-to-bag').addEventListener('click',()=>{if(!state.size){document.querySelector('#size-label').textContent='Select a size first';return}state.cart.push({...products[0],size:state.size,amount:0});renderCart();openDrawer(cartDrawer)});
function renderCart(){
  document.querySelector('#cart-count').textContent=state.cart.length;
  const body=document.querySelector('#cart-body');
  if(!state.cart.length){body.innerHTML='<div class="empty-state"><h3>Your bag is empty.</h3><p>Explore the Formation concepts. No product is currently released.</p><button class="btn outline" data-route="shop">View concepts</button></div>';document.querySelector('#cart-total').textContent='$0 CAD';return}
  body.innerHTML=state.cart.map((p,i)=>`<div class="cart-item"><img src="${p.image}" alt="${p.name}"><div><h3>${p.name}</h3><p>Cap: ${p.size}</p><small>Prototype item · no charge</small></div><button class="remove" data-remove="${i}" aria-label="Remove ${p.name}">×</button></div>`).join('');
  document.querySelector('#cart-total').textContent='$0 prototype';
}
document.querySelector('#cart-body').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(b){state.cart.splice(Number(b.dataset.remove),1);renderCart()}});
document.querySelector('#checkout-button').addEventListener('click',()=>alert('Prototype checkout reached. Payment remains disabled until the F4 release, legal, evidence, and resource gates pass.'));

const searchInput=document.querySelector('#search-input');
searchInput.addEventListener('input',()=>{const q=searchInput.value.toLowerCase().trim();const results=q?products.filter(p=>(p.name+' '+p.subtitle+' '+p.tag).toLowerCase().includes(q)):[];document.querySelector('#search-results').innerHTML=results.map(p=>`<button class="search-result" data-route="${p.route}"><span>${p.name}</span><span>→</span></button>`).join('')||(q?'<p>No concept matches yet.</p>':'<p>Try “fit,” “body wave,” or “evidence.”</p>')});

document.querySelector('#interest-form').addEventListener('submit',e=>{e.preventDefault();document.querySelector('#form-message').textContent='Prototype response recorded only in this browser. No personal data was sent or stored.';e.target.reset()});

const initial=location.hash.replace('#','');route(views.some(v=>v.dataset.view===initial)?initial:'home');renderCart();
