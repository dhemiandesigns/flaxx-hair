const role=document.querySelector('#role');
const status=document.querySelector('#status');
let activeChannel=null;
let currentData=null;
let arranging=false;

const previewModules=[
  ['catalogue','Products & Catalogue','Manage products, options, product information, media and prices.'],
  ['source','Suppliers & Contracts','Keep supplier details, quotations, agreements and follow-ups together.'],
  ['quality','Quality & Verification','Review samples, record checks and approve batches before sale.'],
  ['inventory','Inventory & Fulfilment','Track stock, batches, packaging, shipments and returns.'],
  ['content','Website & Content','Manage pages, product content, images and approved wording.'],
  ['campaigns','Marketing & Demand','Plan campaigns, monitor spending and record what customers want.'],
  ['community','Community','Manage membership, participation, offers and member support.'],
  ['customers','Customers','Manage customer details, preferences, consent and requests.'],
  ['orders','Orders & Service','Follow orders, payments, delivery, questions and remedies.'],
  ['finance','Finance','Track payments, costs, reserves, budgets and allocations.'],
  ['people','Team & Access','Manage team records, responsibilities, access and handovers.'],
  ['chat','Messages','Share updates with the right people and keep decisions easy to find.'],
  ['decisions','Decisions & Reports','Record approvals, exceptions, risks and important results.'],
  ['systems','Systems & Recovery','Monitor integrations, security, backups and incidents.']
].map(([id,name,description])=>({id,name,description}));

const previewRoles={
  creator:['Creator',previewModules.map(item=>item.id)],
  'managing-steward':['First Operator',['catalogue','source','quality','inventory','orders','finance','customers','content','campaigns','community','people','chat','decisions']],
  'market-brand':['Market & Brand Operator',['campaigns','content','community','customers','catalogue','orders','inventory','chat','decisions']],
  'product-quality':['Product & Quality',['quality','catalogue','source','inventory','chat','decisions']],
  compliance:['Operations & Compliance',['orders','quality','source','inventory','customers','people','systems','content','chat','decisions']],
  finance:['Finance',['finance','orders','catalogue','chat','decisions']],
  'customer-operations':['Customer Operations',['orders','customers','inventory','catalogue','chat','decisions']],
  community:['Community Manager',['community','customers','content','campaigns','orders','catalogue','chat','decisions']],
  fulfilment:['Inventory & Fulfilment',['inventory','orders','quality','catalogue','chat','decisions']],
  systems:['Systems',['systems','people','chat','decisions']]
};

const workspaceDetails={
  catalogue:{tracked:['Products and collections','Colours, lengths and variants','Prices and availability','Product images and details'],actions:['Add or update a product','Review product information','Prepare a product for sale']},
  source:{tracked:['Supplier profiles','Quotes and samples','Contracts and obligations','Follow-up dates'],actions:['Add a supplier','Compare quotations','Record a supplier decision']},
  quality:{tracked:['Sample results','Batch inspections','Product claims','Release decisions'],actions:['Start an inspection','Record evidence','Approve or hold a batch']},
  inventory:{tracked:['Stock by product and batch','Storage location','Packaging status','Shipment and return movement'],actions:['Receive stock','Update available units','Prepare a fulfilment handoff']},
  content:{tracked:['Website pages','Product copy and media','Publishing status','Review dates'],actions:['Draft content','Submit content for review','Publish an approved update']},
  campaigns:{tracked:['Campaign plans','Audience and offer','Spending and acquisition cost','Demand signals'],actions:['Create a campaign','Record customer demand','Review performance']},
  community:{tracked:['Members and applications','Participation','Member offers','Support requests'],actions:['Review an application','Create a member offer','Respond to a request']},
  customers:{tracked:['Contact details','Preferences and consent','Purchase history','Open requests'],actions:['Find a customer','Update preferences','Record a customer request']},
  orders:{tracked:['Orders and payments','Delivery status','Customer questions','Returns and remedies'],actions:['Review an order','Update fulfilment status','Resolve a service issue']},
  finance:{tracked:['Income and costs','Payments due','Reserve and tithe','Budgets and allocations'],actions:['Record a transaction','Reconcile a payment','Review available budget']},
  people:{tracked:['Team members','Responsibilities','System access','Handovers'],actions:['Add a team member','Review access','Prepare a handover']},
  chat:{tracked:['Team channels','Updates and decisions','Open questions','Follow-ups'],actions:['Post an update','Find a decision','Start a follow-up']},
  decisions:{tracked:['Decisions and approvals','Risks and exceptions','Supporting information','Review dates'],actions:['Record a decision','Raise a risk','Prepare a report']},
  systems:{tracked:['Connected services','Access reviews','Backups','Incidents and recovery'],actions:['Review system health','Record an incident','Run an access review']}
};

const guides={
  creator:{purpose:'See the whole business clearly, confirm the decisions reserved for the creator and protect the direction of Flaxx.',daily:['Review launch readiness, major risks and decisions awaiting confirmation.','Check whether the business remains true to its established principles.','Respond only where creator confirmation is required.'],handoff:'The First Operator owns day-to-day execution. Step in for reserved decisions, unresolved disagreement or a proposed change to the established direction.'},
  'managing-steward':{purpose:'Turn Flaxx commitments into reliable products, operations and customer outcomes.',daily:['Review assigned work, orders, stock, quality issues and cash position.','Clear operational blockers and follow up with the person responsible.','Approve offers or remedies only when the economics support them.'],handoff:'Market & Brand brings demand and customer insight. You confirm what the business can deliver, close the sale and make sure the promise is fulfilled.'},
  'market-brand':{purpose:'Bring qualified demand to Flaxx and shape how customers understand and experience the brand.',daily:['Review campaign performance, enquiries, community activity and market demand.','Prioritize the clearest opportunity and move it toward a purchase.','Pass product demand and customer insight to the First Operator.'],handoff:'You communicate offers within the allowance approved by the First Operator. You do not promise price, stock, quality or delivery that operations has not confirmed.'},
  'product-quality':{purpose:'Make sure every product sold by Flaxx matches the information and evidence attached to it.',daily:['Review samples, inspections, open quality questions and batches awaiting a decision.','Record evidence clearly and hold anything that does not meet the standard.','Confirm what can be truthfully stated about each product.'],handoff:'Send approved product facts to Catalogue and Content. Escalate uncertainty, failed evidence or repeated supplier problems to the First Operator.'},
  compliance:{purpose:'Keep operations, records and customer commitments complete, lawful and traceable.',daily:['Review exceptions, overdue records, customer requests and operational risks.','Confirm required records exist before a sensitive action proceeds.','Coordinate corrective action and document the result.'],handoff:'Escalate material legal, privacy, safety or contractual risk to the First Operator and creator where required.'},
  finance:{purpose:'Keep the financial position accurate and make sure spending follows approved priorities.',daily:['Reconcile payments, costs and refunds.','Review available budget, reserves and upcoming obligations.','Flag spending that exceeds its approved limit.'],handoff:'Provide the First Operator with a clear financial view before pricing, discount, purchasing or hiring decisions.'},
  'customer-operations':{purpose:'Help customers complete purchases and receive the outcome Flaxx promised.',daily:['Review new orders, delivery questions, returns and unresolved requests.','Respond with accurate product and order information.','Follow each issue through to a recorded resolution.'],handoff:'Escalate quality patterns to Product & Quality and commercial remedies outside approved limits to the First Operator.'},
  community:{purpose:'Nurture the Flaxx community and turn participation into mutual value, insight and advocacy.',daily:['Review applications, member activity, offers and support requests.','Make members feel known and keep commitments practical.','Share recurring needs and opportunities with Market & Brand.'],handoff:'Coordinate paid offers with Finance and customer-facing claims with Product & Quality before release.'},
  fulfilment:{purpose:'Move the correct product from approved stock to the customer with complete traceability.',daily:['Review stock, orders to pack, shipments due and returns.','Confirm product, batch, packaging and address before dispatch.','Record every movement and exception.'],handoff:'Hold unapproved or mismatched stock and alert Product & Quality and the First Operator.'},
  systems:{purpose:'Keep Core and connected services secure, available and recoverable.',daily:['Review system health, access changes, failed connections and backup status.','Resolve incidents in priority order and preserve an audit trail.','Remove access promptly when responsibilities change.'],handoff:'Escalate security, data loss or service continuity risks immediately to the First Operator.'}
};

const readinessLabels={
  'gate-commerce':['Store launch',['Business registration','Bank and payouts','Approved products','Available stock','Customer policies','Payments, tax and delivery','Customer support','Security and accessibility','Successful test order']],
  'gate-f4':['Core setup',['Customer website','Team workspace','Product catalogue','Offer structure','Operating records','Full workflow test']]
};

const roleMetrics={
  creator:[['0%','Launch readiness'],['0','Decisions awaiting review'],['0','Open risks'],['0','Products ready']],
  'managing-steward':[['0','Products ready'],['0','Open orders'],['0','Available units'],['0','Customer requests']],
  'market-brand':[['0','Active campaigns'],['0','Qualified leads'],['0','Community members'],['0','Demand signals']],
  'product-quality':[['0','Batches awaiting review'],['0','Open inspections'],['0','Products ready'],['0','Quality issues']],
  compliance:[['0','Open exceptions'],['0','Records due'],['0','Customer requests'],['0','Access reviews']],
  finance:[['$0','Revenue'],['0','Payments to reconcile'],['0','Refunds open'],['$0','Available budget']],
  'customer-operations':[['0','Open orders'],['0','Customer requests'],['0','Returns open'],['—','Average response']],
  community:[['0','Members'],['0','Applications'],['0','Active offers'],['0','Member requests']],
  fulfilment:[['0','Available units'],['0','Orders to pack'],['0','Shipments due'],['0','Returns pending']],
  systems:[['0','Open incidents'],['0','Services connected'],['Not connected','Backup status'],['0','Access reviews']]
};

const dashboardSummaries={
  catalogue:['4','products · 3 pending review'],
  source:['0','contracts · supplier quotes due'],
  quality:['3','products awaiting verification'],
  inventory:['0','sellable units'],
  content:['6','pages · 4 products · 35 media files'],
  campaigns:['0','active campaigns'],
  community:['0','members · setup in progress'],
  customers:['0','open requests'],
  orders:['0','open orders'],
  finance:['$0','available operating balance'],
  people:['0','active appointments'],
  chat:['0','unread updates'],
  decisions:['0','awaiting review'],
  systems:['0','connected services']
};
const previewWork={
  'managing-steward':[
    {id:'preview-entity',title:'Complete business registration',state:'blocked',priority:'high',blockedBy:['name approval and incorporation']},
    {id:'preview-suppliers',title:'Follow up supplier quotations',state:'in-progress',priority:'high',blockedBy:[]},
    {id:'preview-content',title:'Review website content and product drafts',state:'in-progress',priority:'normal',blockedBy:[]}
  ],
  'market-brand':[
    {id:'preview-content',title:'Review website content and product drafts',state:'in-progress',priority:'high',blockedBy:[]},
    {id:'preview-fit',title:'Complete the Find your fit page',state:'not-started',priority:'normal',blockedBy:[]},
    {id:'preview-launch',title:'Prepare the first launch campaign',state:'blocked',priority:'normal',blockedBy:['approved products and launch date']}
  ],
  'product-quality':[
    {id:'preview-verify',title:'Complete verification for three product drafts',state:'not-started',priority:'high',blockedBy:['samples and supplier evidence']}
  ]
};

const sitePages=[
  {name:'Home',path:'#home',sections:5,status:'Live preview',updated:'10 Oct 2026'},
  {name:'Shop',path:'#shop',sections:2,status:'Live preview',updated:'10 Oct 2026'},
  {name:'Product detail',path:'#product',sections:7,status:'Live preview',updated:'10 Oct 2026'},
  {name:'Find your fit',path:'#fit',sections:1,status:'Draft',updated:'8 Oct 2026'},
  {name:'Verification',path:'#verify',sections:1,status:'Draft',updated:'8 Oct 2026'},
  {name:'Flaxx Garden',path:'#garden',sections:1,status:'Draft',updated:'8 Oct 2026'}
];
const siteHeroes=[
  {id:'hero-1',title:'Good hair. No second-guessing.',copy:'Beautiful, wearable styles made for movement, confidence, and getting on with your day.',cta:'Shop best sellers',image:'/assets/flaxx-hero-v2.png'},
  {id:'hero-2',title:'Ready when you are.',copy:'Natural-looking hair that makes getting ready feel easy—from first fit to final look.',cta:'Explore styles',image:'/assets/flaxx-hero-braids.png'},
  {id:'hero-3',title:'Your look. Only easier.',copy:'Find the texture, length, and finish that fits the way you want to live.',cta:'Find your fit',image:'/assets/flaxx-hero-blonde-landscape.png'}
];
try{
  const savedHeroes=JSON.parse(localStorage.getItem('flaxx-core-homepage')||'null');
  if(Array.isArray(savedHeroes))savedHeroes.forEach((saved,index)=>{if(siteHeroes[index])Object.assign(siteHeroes[index],saved);});
}catch{}
const baseProducts=[
  {id:'shade-comfort',name:'Shade Comfort',type:'Polished bob',colour:'Natural black',status:'Batch released',image:'/assets/shade-comfort-gallery-01-v2.png',updated:'10 Oct 2026'},
  {id:'maya-silk',name:'Maya Silk',type:'Sleek straight',colour:'Natural black',status:'Verification pending',image:'/assets/product-everyday-straight-worn-v3.png',updated:'10 Oct 2026'},
  {id:'amara-curl',name:'Amara Curl',type:'Soft curl',colour:'Natural black',status:'Verification pending',image:'/assets/product-soft-curl-worn-v3.png',updated:'10 Oct 2026'},
  {id:'elise-copper',name:'Elise Copper',type:'Silky body wave',colour:'Warm copper',status:'Verification pending',image:'/assets/product-copper-worn-v3.png',updated:'10 Oct 2026'}
];
const siteMedia=[
  'flaxx-hero-v2.png','flaxx-hero-braids.png','flaxx-hero-blonde-landscape.png','shade-comfort-gallery-01-v2.png','shade-comfort-gallery-02-v2.png',
  'shade-comfort-gallery-03-v2.png','shade-comfort-gallery-06-street-v2.png','mannequin-bob-front.png','mannequin-bob-back.png','product-everyday-straight-worn-v3.png',
  'product-soft-curl-worn-v3.png','product-copper-worn-v3.png','mannequin-straight-front.png','mannequin-curl-front.png','mannequin-copper-front.png'
];
let activeContentTab='overview';

function contentProducts(){
  const stored=localStorage.getItem('flaxx-core-content-products');
  if(!stored)return baseProducts;
  try{return JSON.parse(stored);}catch{return baseProducts;}
}
function saveContentProducts(products){localStorage.setItem('flaxx-core-content-products',JSON.stringify(products));}

const titleCase=value=>String(value||'').replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[-_]/g,' ').replace(/\b\w/g,letter=>letter.toUpperCase());
const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const request=async(path,options={})=>{const response=await fetch(path,{...options,headers:{'Content-Type':'application/json','X-Flaxx-Role':role.value,...(options.headers||{})}});const payload=await response.json();if(!response.ok)throw new Error(payload.message||'Core is unavailable.');return payload;};

function previewDashboard(){
  const [name,moduleIds]=previewRoles[role.value]||previewRoles.systems;
  const tasks=previewWork[role.value]||[];
  return {preview:true,roles:[{id:role.value,name}],modules:previewModules.filter(module=>moduleIds.includes(module.id)),entity:{commerceEnabled:false,reasonCommerceBlocked:'Complete the launch checklist before the store begins taking payments.'},gates:[{id:'gate-commerce',state:'not-ready'},{id:'gate-f4',state:'in-progress'}],metrics:(roleMetrics[role.value]||roleMetrics.systems).map(([value,label],index)=>({id:`metric-${index}`,value,label})),tasks,channels:[]};
}

function savedOrder(modules){const saved=JSON.parse(localStorage.getItem(`flaxx-core-order-${role.value}`)||'[]');return [...modules].sort((a,b)=>(saved.indexOf(a.id)<0?999:saved.indexOf(a.id))-(saved.indexOf(b.id)<0?999:saved.indexOf(b.id)));}
function saveOrder(modules){localStorage.setItem(`flaxx-core-order-${role.value}`,JSON.stringify(modules.map(item=>item.id)));}
function normalizeModules(modules){return modules.filter(module=>module.id!=='work').map(module=>previewModules.find(item=>item.id===module.id)||module);}

function renderNav(data){
  const items=normalizeModules(data.modules);
  document.querySelector('#primary-nav').innerHTML=`<a href="#dashboard" data-route="dashboard">Dashboard</a><a href="#guide" data-route="guide">My guide</a><span class="nav-label">Workspaces</span>${items.map(module=>`<a href="#workspace-${module.id}" data-route="workspace-${module.id}">${escapeHtml(module.name)}</a>`).join('')}`;
}

function renderDashboard(data){
  const roleName=data.roles.map(item=>item.name).join(' · ');
  document.querySelector('#current-role').textContent=roleName;document.querySelector('#dashboard-role').textContent=roleName;
  status.textContent=data.preview?'Preview data · Business records are not connected yet.':(data.entity.commerceEnabled?'Store is ready to take payments.':data.entity.reasonCommerceBlocked);
  document.querySelector('#metrics').innerHTML=data.metrics.map(item=>`<article class="metric"><strong>${escapeHtml(item.value)}</strong><span>${escapeHtml(item.label)}</span></article>`).join('');
  const workPanel=document.querySelector('#work-panel');workPanel.hidden=!data.tasks.length;document.querySelector('#work-count').textContent=`${data.tasks.length} open`;
  document.querySelector('#tasks').innerHTML=data.tasks.map(task=>`<article class="task"><div><h3>${escapeHtml(task.title)}</h3><p><span class="priority ${escapeHtml(task.priority||'')}">${escapeHtml(task.priority||'normal')}</span>${task.blockedBy?.length?`Waiting on ${escapeHtml(task.blockedBy.join(', '))}`:'Ready for action'}</p></div><select data-task="${escapeHtml(task.id)}" aria-label="State for ${escapeHtml(task.title)}">${['not-started','in-progress','blocked','review','done'].map(stateName=>`<option value="${stateName}" ${stateName===task.state?'selected':''}>${titleCase(stateName)}</option>`).join('')}</select></article>`).join('');
  const modules=savedOrder(normalizeModules(data.modules));
  document.querySelector('#modules').innerHTML=modules.map((module,index)=>{const summary=[...(dashboardSummaries[module.id]||['0','open items'])];if(['content','catalogue'].includes(module.id)){summary[0]=String(contentProducts().length);summary[1]=module.id==='content'?'products · 6 pages · 35 media files':'products · 3 pending review';}const quickAction=module.id==='content'?'<button data-add-product>Add product</button>':module.id==='source'?'<button data-supplier-followup>Draft follow-up</button>':'';return `<article class="module" data-module="${module.id}"><div class="module-order" ${arranging?'':'hidden'}><button data-move="up" aria-label="Move ${escapeHtml(module.name)} up" ${index===0?'disabled':''}>↑</button><button data-move="down" aria-label="Move ${escapeHtml(module.name)} down" ${index===modules.length-1?'disabled':''}>↓</button></div><h3>${escapeHtml(module.name)}</h3><p>${escapeHtml(module.description)}</p><div class="module-summary"><strong>${escapeHtml(summary[0])}</strong><span>${escapeHtml(summary[1])}</span></div><div class="module-actions"><a href="#workspace-${module.id}">View details →</a>${quickAction}</div></article>`;}).join('');
  document.querySelector('#gates').innerHTML=data.gates.map(gate=>{const [name,requirements]=readinessLabels[gate.id]||[gate.name,(gate.requirements||[]).map(titleCase)];const state=gate.state==='blocked'?'not-ready':(gate.id==='gate-f4'&&gate.state==='open'?'in-progress':gate.state);return `<article class="gate"><header><h3>${escapeHtml(name)}</h3><span class="state ${escapeHtml(state)}">${escapeHtml(titleCase(state))}</span></header><ul>${requirements.map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul></article>`;}).join('');
  const channelsPanel=document.querySelector('#channels-panel');channelsPanel.hidden=!data.channels.length;document.querySelector('#channels').innerHTML=data.channels.map(channel=>`<button class="channel" data-channel="${escapeHtml(channel.id)}">${escapeHtml(channel.name)}</button>`).join('');
}

function renderWorkspace(id){
  const module=normalizeModules(currentData.modules).find(item=>item.id===id);if(!module){location.hash='#dashboard';return;}
  if(id==='content'){renderContentWorkspace();return;}
  const details=workspaceDetails[id]||{tracked:['Current records','Open work','Recent updates'],actions:['Add a record','Review open work','View recent updates']};const roleName=currentData.roles.map(item=>item.name).join(' · ');
  document.querySelector('#workspace-view').innerHTML=`<a class="back-link" href="#dashboard">← Back to dashboard</a><section class="welcome workspace-heading"><div><p class="eyebrow">Workspace</p><h2>${escapeHtml(module.name)}</h2></div><div class="welcome-side"><strong>${escapeHtml(roleName)}</strong></div></section><p class="workspace-intro">${escapeHtml(module.description)}</p><section class="workspace-grid"><article class="workspace-card"><p class="eyebrow">Start here</p><h3>Common actions</h3>${details.actions.map(action=>`<button class="action-row" disabled>${escapeHtml(action)}<span>→</span></button>`).join('')}<small>Actions will become available as each workspace is connected.</small></article><article class="workspace-card"><p class="eyebrow">Information</p><h3>What you can manage</h3><ul>${details.tracked.map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul></article><article class="workspace-card wide"><p class="eyebrow">Overview</p><h3>No records yet</h3><p>This workspace is ready for its operating screens and data connection. The structure can grow without changing how your team finds its work.</p></article></section>`;
}

function renderContentWorkspace(){
  const roleName=currentData.roles.map(item=>item.name).join(' · ');
  document.querySelector('#workspace-view').innerHTML=`<section class="content-shell">
    <a class="back-link" href="#dashboard">← Back to dashboard</a>
    <div class="content-topline"><div><p class="eyebrow">Workspace</p><h2>Website & Content</h2><p class="status">Manage what customers see across the Flaxx website.</p></div><div class="content-actions"><a class="secondary-button" href="/#home" target="_blank">View website</a><button class="primary-button" data-add-product>Add product</button></div></div>
    <nav class="content-tabs" aria-label="Website and content sections">
      ${[['overview','Overview'],['pages','Pages'],['homepage','Homepage'],['products','Products'],['media','Media']].map(([id,label])=>`<button data-content-tab="${id}" class="${activeContentTab===id?'active':''}">${label}</button>`).join('')}
    </nav>
    <div id="content-panel"></div>
    <div class="welcome-side content-role"><strong>${escapeHtml(roleName)}</strong></div>
  </section>`;
  renderContentTab();
}

function renderContentTab(){
  const panel=document.querySelector('#content-panel');if(!panel)return;
  document.querySelectorAll('[data-content-tab]').forEach(button=>button.classList.toggle('active',button.dataset.contentTab===activeContentTab));
  const products=contentProducts();
  if(activeContentTab==='overview'){
    panel.innerHTML=`<section class="content-stat-grid"><article class="content-stat"><strong>6</strong><span>Website pages</span></article><article class="content-stat"><strong>3</strong><span>Homepage slides</span></article><article class="content-stat"><strong>${products.length}</strong><span>Products</span></article><article class="content-stat"><strong>35</strong><span>Media files</span></article></section>
    <section class="content-grid"><article class="data-panel"><header><h3>Website pages</h3><button data-content-tab="pages">View all →</button></header>${sitePages.slice(0,4).map(page=>pageRow(page)).join('')}</article><article class="data-panel"><header><h3>Needs attention</h3><span>3 items</span></header><ul class="notice-list"><li><strong>Three products are awaiting verification</strong>Product wording can remain in draft until quality evidence is complete.</li><li><strong>Fit page needs content</strong>The customer-facing fit experience is still a placeholder.</li><li><strong>Publishing is not connected</strong>Core changes remain drafts until the production content service is connected.</li></ul></article><article class="data-panel wide"><header><h3>Products</h3><button data-content-tab="products">Manage products →</button></header>${products.slice(0,4).map(product=>productDataRow(product)).join('')}</article></section>`;
  }else if(activeContentTab==='pages'){
    panel.innerHTML=`<article class="data-panel"><header><h3>Pages</h3><span>${sitePages.length} total</span></header>${sitePages.map(page=>pageRow(page)).join('')}</article>`;
  }else if(activeContentTab==='homepage'){
    panel.innerHTML=`<div class="hero-manage-grid">${siteHeroes.map((hero,index)=>`<article class="manage-card"><img src="${hero.image}" alt=""><div class="manage-card-body"><p class="eyebrow">Slide ${index+1}</p><h3>${escapeHtml(hero.title)}</h3><p>${escapeHtml(hero.copy)}</p><div class="manage-card-meta"><span class="status-chip live">Visible</span><button class="secondary-button" data-edit-hero="${hero.id}">Edit</button></div></div></article>`).join('')}</div>`;
  }else if(activeContentTab==='products'){
    panel.innerHTML=`<div class="content-topline"><div><h3>Products</h3><p class="status">${products.length} products in this browser preview</p></div><button class="primary-button" data-add-product>Add product</button></div><div class="product-manage-grid">${products.length?products.map(product=>productManageRow(product)).join(''):'<div class="empty-state">No products yet. Add the first product to begin.</div>'}</div>`;
  }else if(activeContentTab==='media'){
    panel.innerHTML=`<div class="content-topline"><div><h3>Media library</h3><p class="status">Existing Flaxx website assets</p></div><button class="secondary-button" data-upload-media>Upload media</button></div><div class="media-grid">${siteMedia.map(name=>`<article class="media-item"><img src="/assets/${name}" alt=""><p title="${name}">${name}</p></article>`).join('')}</div>`;
  }
}

function pageRow(page){
  return `<div class="data-row"><div><strong>${escapeHtml(page.name)}</strong><small>${escapeHtml(page.path)}</small></div><span>${page.sections} sections</span><span class="status-chip ${page.status==='Live preview'?'live':'pending'}">${escapeHtml(page.status)}</span><div class="row-actions"><a class="icon-button" href="/${page.path}" target="_blank" aria-label="Open ${escapeHtml(page.name)}">↗</a><button class="icon-button" data-page-details="${escapeHtml(page.name)}" aria-label="Manage ${escapeHtml(page.name)}">•••</button></div></div>`;
}
function productDataRow(product){
  return `<div class="data-row"><div><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.type)} · ${escapeHtml(product.colour)}</small></div><span>${escapeHtml(product.updated||'Today')}</span><span class="status-chip ${product.status==='Batch released'?'live':'pending'}">${escapeHtml(product.status)}</span><div class="row-actions"><button class="icon-button" data-product-details="${product.id}" aria-label="Manage ${escapeHtml(product.name)}">•••</button></div></div>`;
}
function productManageRow(product){
  return `<article class="product-row"><img src="${escapeHtml(product.image)}" alt=""><div><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.type)}</small></div><span>${escapeHtml(product.colour)}</span><span class="status-chip ${product.status==='Batch released'?'live':'pending'}">${escapeHtml(product.status)}</span><span>${escapeHtml(product.updated||'Today')}</span><div class="row-actions"><button class="icon-button" data-product-details="${product.id}" aria-label="Edit ${escapeHtml(product.name)}">✎</button><button class="icon-button" data-delete-product="${product.id}" aria-label="Delete ${escapeHtml(product.name)}">×</button></div></article>`;
}

function openCoreDialog(title,body,footer=''){
  document.querySelector('.core-dialog')?.remove();
  const dialog=document.createElement('dialog');dialog.className='core-dialog';dialog.innerHTML=`<div class="dialog-head"><h2>${escapeHtml(title)}</h2><button class="dialog-close" data-dialog-close aria-label="Close">×</button></div><div class="dialog-body">${body}</div>${footer?`<div class="dialog-foot">${footer}</div>`:''}`;document.body.append(dialog);dialog.showModal();return dialog;
}
function showToast(message){document.querySelector('.toast')?.remove();const toast=document.createElement('div');toast.className='toast';toast.textContent=message;document.body.append(toast);setTimeout(()=>toast.remove(),2600);}

function openProductDialog(product=null){
  const editing=Boolean(product);
  const dialog=openCoreDialog(editing?'Edit product':'Add product',`<form id="product-form" class="form-grid">
    <label>Product name<input name="name" required value="${escapeHtml(product?.name||'')}"></label>
    <label>Product type<input name="type" required value="${escapeHtml(product?.type||'')}"></label>
    <label>Colour<input name="colour" required value="${escapeHtml(product?.colour||'Natural black')}"></label>
    <label>Status<select name="status"><option ${product?.status==='Verification pending'?'selected':''}>Verification pending</option><option ${product?.status==='Draft'?'selected':''}>Draft</option><option ${product?.status==='Batch released'?'selected':''}>Batch released</option></select></label>
    <label class="full upload-drop">Product image<input name="image" type="file" accept="image/png,image/jpeg,image/webp"></label>
  </form>`,`<button class="secondary-button" data-dialog-close>Cancel</button><button class="primary-button" data-save-product>Save product</button>`);
  dialog.querySelector('[data-save-product]').addEventListener('click',async()=>{const form=dialog.querySelector('#product-form');if(!form.reportValidity())return;const formData=new FormData(form);let image=product?.image||'/assets/mannequin-straight-front.png';const file=formData.get('image');if(file?.size){if(file.size>1400000){showToast('Choose an image smaller than 1.4 MB for this preview.');return;}image=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(file);});}
    const products=contentProducts();const record={id:product?.id||`product-${Date.now()}`,name:String(formData.get('name')).trim(),type:String(formData.get('type')).trim(),colour:String(formData.get('colour')).trim(),status:String(formData.get('status')),image,updated:'Today'};const index=products.findIndex(item=>item.id===record.id);if(index>=0)products[index]=record;else products.unshift(record);try{saveContentProducts(products);}catch{showToast('This image is too large to save in the browser preview.');return;}dialog.close();dialog.remove();renderContentTab();showToast(editing?'Product updated.':'Product added to the preview.');});
}

function openHeroDialog(hero){
  const dialog=openCoreDialog('Edit homepage slide',`<form id="hero-form" class="form-grid"><label class="full">Headline<input name="title" value="${escapeHtml(hero.title)}"></label><label class="full">Supporting copy<textarea name="copy">${escapeHtml(hero.copy)}</textarea></label><label>Button label<input name="cta" value="${escapeHtml(hero.cta)}"></label><label>Image path<input name="image" value="${escapeHtml(hero.image)}"></label></form>`,`<button class="secondary-button" data-dialog-close>Cancel</button><button class="primary-button" data-save-hero>Save draft</button>`);
  dialog.querySelector('[data-save-hero]').addEventListener('click',()=>{const data=new FormData(dialog.querySelector('#hero-form'));hero.title=String(data.get('title'));hero.copy=String(data.get('copy'));hero.cta=String(data.get('cta'));hero.image=String(data.get('image'));localStorage.setItem('flaxx-core-homepage',JSON.stringify(siteHeroes));dialog.close();dialog.remove();renderContentTab();showToast('Homepage draft updated.');});
}

function renderGuide(){
  const guide=guides[role.value]||guides.systems;const roleName=currentData.roles.map(item=>item.name).join(' · ');
  document.querySelector('#guide-view').innerHTML=`<a class="back-link" href="#dashboard">← Back to dashboard</a><section class="welcome workspace-heading"><div><p class="eyebrow">My guide</p><h2>${escapeHtml(roleName)}</h2></div></section><p class="workspace-intro">${escapeHtml(guide.purpose)}</p><section class="guide-grid"><article class="workspace-card"><p class="eyebrow">Daily start</p><h3>What to review</h3><ol>${guide.daily.map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ol></article><article class="workspace-card"><p class="eyebrow">Working together</p><h3>Handoffs and escalation</h3><p>${escapeHtml(guide.handoff)}</p></article><article class="workspace-card wide"><p class="eyebrow">Using Core</p><h3>Keep the record useful</h3><p>Start with the dashboard, complete the next action, and record the result in the relevant workspace. Use Messages for coordination; use Decisions & Reports when an approval, exception or important business choice must remain easy to find.</p></article></section>`;
}

function route(){
  if(!currentData)return;const hash=(location.hash||'#dashboard').slice(1);['dashboard-view','workspace-view','guide-view'].forEach(id=>document.querySelector(`#${id}`).hidden=true);
  if(hash==='guide'){renderGuide();document.querySelector('#guide-view').hidden=false;document.querySelector('#page-label').textContent='My guide';}
  else if(hash.startsWith('workspace-')){const id=hash.replace('workspace-','');renderWorkspace(id);document.querySelector('#workspace-view').hidden=false;document.querySelector('#page-label').textContent=previewModules.find(item=>item.id===id)?.name||'Workspace';}
  else{document.querySelector('#dashboard-view').hidden=false;document.querySelector('#page-label').textContent='Dashboard';}
  document.querySelectorAll('[data-route]').forEach(link=>link.classList.toggle('active',link.dataset.route===hash));document.querySelector('#app').focus({preventScroll:true});
}

async function load(){status.textContent='Loading your dashboard…';activeChannel=null;document.querySelector('#conversation').hidden=true;try{currentData=await request('/api/core/dashboard');currentData.modules=normalizeModules(currentData.modules);}catch(error){currentData=previewDashboard();}renderNav(currentData);renderDashboard(currentData);route();}

async function openChannel(id){try{activeChannel=id;document.querySelectorAll('[data-channel]').forEach(button=>button.classList.toggle('active',button.dataset.channel===id));const data=await request(`/api/core/channels/${id}/messages`);document.querySelector('#conversation').hidden=false;document.querySelector('#messages').innerHTML=data.messages.length?data.messages.map(message=>`<article class="message">${escapeHtml(message.text)}<small>${escapeHtml(message.createdBy)} · ${new Date(message.createdAt).toLocaleString()}</small></article>`).join(''):'<p class="empty">No messages yet.</p>';}catch(error){status.textContent=error.message;}}

document.addEventListener('change',async event=>{if(event.target===role){arranging=false;await load();return;}if(event.target.matches('[data-task]')){if(currentData.preview){const task=currentData.tasks.find(item=>item.id===event.target.dataset.task);if(task)task.state=event.target.value;renderDashboard(currentData);return;}try{await request(`/api/core/tasks/${event.target.dataset.task}/state`,{method:'POST',body:JSON.stringify({state:event.target.value})});await load();}catch(error){status.textContent=error.message;}}});
document.addEventListener('click',event=>{
  const close=event.target.closest('[data-dialog-close]');if(close){const dialog=close.closest('dialog');dialog?.close();dialog?.remove();return;}
  const tabButton=event.target.closest('[data-content-tab]');if(tabButton){activeContentTab=tabButton.dataset.contentTab;renderContentTab();return;}
  if(event.target.closest('[data-add-product]')){openProductDialog();return;}
  if(event.target.closest('[data-supplier-followup]')){const dialog=openCoreDialog('Supplier follow-up',`<form class="form-grid"><label class="full">Supplier email<input type="email" placeholder="supplier@example.com"></label><label class="full">Subject<input value="Following up on our quotation request"></label><label class="full">Message<textarea>Hi, I’m following up on the quotation and product details we requested. Please let me know if you need anything else from us. Thank you.</textarea></label></form>`,`<button class="secondary-button" data-dialog-close>Cancel</button><button class="primary-button" data-save-email-draft>Save draft</button>`);dialog.querySelector('[data-save-email-draft]').addEventListener('click',()=>{dialog.close();dialog.remove();showToast('Follow-up saved as a draft. Email sending will activate when the business mailbox is connected.');});return;}
  const productButton=event.target.closest('[data-product-details]');if(productButton){const product=contentProducts().find(item=>item.id===productButton.dataset.productDetails);if(product)openProductDialog(product);return;}
  const deleteButton=event.target.closest('[data-delete-product]');if(deleteButton){const products=contentProducts();const product=products.find(item=>item.id===deleteButton.dataset.deleteProduct);if(!product)return;const dialog=openCoreDialog('Delete product',`<p>This removes <strong>${escapeHtml(product.name)}</strong> from this browser preview. It does not publish a website change.</p>`,`<button class="secondary-button" data-dialog-close>Cancel</button><button class="danger-button" data-confirm-delete>Delete product</button>`);dialog.querySelector('[data-confirm-delete]').addEventListener('click',()=>{saveContentProducts(products.filter(item=>item.id!==product.id));dialog.close();dialog.remove();renderContentTab();showToast('Product removed from the preview.');});return;}
  const heroButton=event.target.closest('[data-edit-hero]');if(heroButton){const hero=siteHeroes.find(item=>item.id===heroButton.dataset.editHero);if(hero)openHeroDialog(hero);return;}
  const pageButton=event.target.closest('[data-page-details]');if(pageButton){const page=sitePages.find(item=>item.name===pageButton.dataset.pageDetails);if(page)openCoreDialog(page.name,`<div class="form-grid"><label>Website path<input readonly value="${escapeHtml(page.path)}"></label><label>Status<input readonly value="${escapeHtml(page.status)}"></label><label>Sections<input readonly value="${page.sections}"></label><label>Last updated<input readonly value="${escapeHtml(page.updated)}"></label></div>`,`<button class="secondary-button" data-dialog-close>Close</button><a class="primary-button" href="/${page.path}" target="_blank">Open page</a>`);return;}
  if(event.target.closest('[data-upload-media]')){openCoreDialog('Upload media',`<div class="upload-drop"><p>Select an image for the Flaxx media library.</p><input type="file" accept="image/png,image/jpeg,image/webp"></div><p class="status">File storage will be connected before production. Product images can already be attached through Add product in this browser preview.</p>`,`<button class="secondary-button" data-dialog-close>Close</button>`);return;}
  const channel=event.target.closest('[data-channel]');if(channel)openChannel(channel.dataset.channel);
  const move=event.target.closest('[data-move]');if(move){const cards=[...document.querySelectorAll('[data-module]')];const card=move.closest('[data-module]');const index=cards.indexOf(card);if(move.dataset.move==='up'&&index>0)card.parentNode.insertBefore(card,cards[index-1]);if(move.dataset.move==='down'&&index<cards.length-1)card.parentNode.insertBefore(cards[index+1],card);const ordered=[...document.querySelectorAll('[data-module]')].map(card=>currentData.modules.find(item=>item.id===card.dataset.module));saveOrder(ordered);renderDashboard(currentData);}
});
document.querySelector('#arrange').addEventListener('click',()=>{arranging=!arranging;document.querySelector('#arrange').textContent=arranging?'Done':'Arrange';document.querySelector('#arrange-note').hidden=!arranging;renderDashboard(currentData);});
document.querySelector('#message-form').addEventListener('submit',async event=>{event.preventDefault();const input=document.querySelector('#message-input');if(!activeChannel||!input.value.trim())return;try{await request(`/api/core/channels/${activeChannel}/messages`,{method:'POST',body:JSON.stringify({text:input.value})});input.value='';await openChannel(activeChannel);}catch(error){status.textContent=error.message;}});
document.querySelector('#refresh').addEventListener('click',load);window.addEventListener('hashchange',route);if(!location.hash)location.hash='#dashboard';load();
