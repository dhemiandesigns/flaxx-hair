const products=[
  {name:'The Body Wave',detail:'18 in · natural black',price:'Price coming soon',tag:'SOURCE VERIFIED',image:'assets/flaxx-body-wave.png',route:'product'},
  {name:'The Soft Curl',detail:'full curl · easy movement',price:'Price coming soon',tag:'FLAXX VERIFIED',image:'assets/flaxx-editorial-curls.png',route:'product'},
  {name:'The Everyday Straight',detail:'sleek · soft-touch finish',price:'Price coming soon',tag:'SOURCE VERIFIED',image:'assets/flaxx-hero-v2.png',route:'product'},
  {name:'The Care Set',detail:'made for longer good-hair days',price:'Coming soon',tag:'FLAXX PICK',image:'assets/flaxx-body-wave.png',route:'product'}
];
const state={cart:[],size:null};
const views=[...document.querySelectorAll('.view')];
const productCard=p=>`<article class="product-card" data-route="${p.route}" tabindex="0"><div class="product-media"><span class="verified-badge">${p.tag}</span><img src="${p.image}" alt="${p.name}"></div><div class="product-copy"><h3>${p.name}</h3><p>${p.detail}</p><strong>${p.price}</strong></div></article>`;
document.querySelector('#home-products').innerHTML=products.map(productCard).join('');
document.querySelector('#shop-products').innerHTML=products.map(productCard).join('');

function route(name){views.forEach(v=>v.classList.toggle('active',v.dataset.view===name));document.querySelector('#mobile-nav').hidden=true;window.scrollTo({top:0,behavior:'auto'});history.replaceState(null,'',`#${name}`);document.querySelector('#main').focus({preventScroll:true})}
document.addEventListener('click',e=>{const r=e.target.closest('[data-route]');if(r)route(r.dataset.route)});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('product-card'))route(e.target.dataset.route)});
document.querySelector('#mobile-menu').addEventListener('click',()=>{const n=document.querySelector('#mobile-nav');n.hidden=!n.hidden});
document.querySelector('#theme-toggle').addEventListener('click',()=>document.body.classList.toggle('dark'));

const overlay=document.querySelector('#overlay'),cart=document.querySelector('#cart-drawer'),search=document.querySelector('#search-drawer');
function openDrawer(d){overlay.hidden=false;d.classList.add('open');d.setAttribute('aria-hidden','false')}
function closeDrawers(){overlay.hidden=true;[cart,search].forEach(d=>{d.classList.remove('open');d.setAttribute('aria-hidden','true')})}
document.querySelector('#cart-open').addEventListener('click',()=>{renderCart();openDrawer(cart)});
document.querySelector('#search-open').addEventListener('click',()=>openDrawer(search));
document.querySelectorAll('.drawer-close').forEach(b=>b.addEventListener('click',closeDrawers));overlay.addEventListener('click',closeDrawers);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawers()});

document.querySelectorAll('[data-size]').forEach(b=>b.addEventListener('click',()=>{state.size=b.dataset.size;document.querySelectorAll('[data-size]').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelector('#size-label').textContent=state.size}));
document.querySelector('#add-to-bag').addEventListener('click',()=>{if(!state.size){document.querySelector('#size-label').textContent='choose a size';return}state.cart.push({...products[0],size:state.size});renderCart();openDrawer(cart)});
function renderCart(){document.querySelector('#cart-count').textContent=state.cart.length;document.querySelector('#cart-body').innerHTML=state.cart.length?state.cart.map((p,i)=>`<div class="cart-item"><img src="${p.image}" alt="${p.name}"><div><h3>${p.name}</h3><span>Size ${p.size}</span></div><button data-remove="${i}">×</button></div>`).join(''):'<div class="empty"><h3>Your bag is empty.</h3><p>Your next favourite is waiting.</p></div>'}
document.querySelector('#cart-body').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(b){state.cart.splice(Number(b.dataset.remove),1);renderCart()}});
document.querySelector('#search-input').addEventListener('input',e=>{const q=e.target.value.toLowerCase().trim(),found=q?products.filter(p=>(p.name+p.detail).toLowerCase().includes(q)):[];document.querySelector('#search-results').innerHTML=found.map(p=>`<button class="search-result" data-route="${p.route}">${p.name} →</button>`).join('')||(q?'<p>No match yet.</p>':'')});
document.querySelector('#interest-form').addEventListener('submit',e=>{e.preventDefault();document.querySelector('#form-message').textContent='Preview only—nothing was submitted.';e.target.reset()});
route(location.hash.replace('#','')&&views.some(v=>v.dataset.view===location.hash.slice(1))?location.hash.slice(1):'home');renderCart();
