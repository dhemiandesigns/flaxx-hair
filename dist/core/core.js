const role=document.querySelector('#role');
const status=document.querySelector('#status');
let activeChannel=null;

const previewModules=[
  ['catalogue','Products & catalogue','Products, variants, specifications, media, care, prices and lifecycle.'],
  ['source','Source & relationships','Suppliers, rights, contracts, obligations, conflicts and exit.'],
  ['quality','Evidence & release','Samples, claims, batches, inspections, quarantine and governed release.'],
  ['inventory','Inventory & fulfilment','Custody, units, batch traceability, branded packout, shipment and returns.'],
  ['content','Garden content','Pages, navigation, product media, approved wording and content expiry.'],
  ['campaigns','Market & demand','Campaigns, approved offers, acquisition limits and actual-demand signals.'],
  ['community','Flaxx Garden community','Waitlist, membership, participation, community offers and relevant payment status.'],
  ['customers','Customers & consent','Purpose-limited identity, consent, preferences, access and deletion.'],
  ['orders','Orders & service','Cart, order, payment status, fulfilment, questions, mismatch and remedy.'],
  ['finance','Finance & River','Accounts, obligations, reserves, economics and four-head allocation.'],
  ['people','People & access','Person-forms, appointments, departments, permissions, handover and exit.'],
  ['work','Work & follow-up','Tasks, ownership, dependencies, updates, notifications and review.'],
  ['chat','Team communication','Department and cross-functional channels with retained accountability.'],
  ['decisions','Decisions & signals','Authority, stops, thresholds, exceptions and response.'],
  ['systems','Systems & recovery','Integrations, access, audit, backups, incidents and recovery evidence.']
].map(([id,name,description])=>({id,name,description}));
const previewRoles={
  creator:['Creator',['Creator & Leadership'],previewModules.map(item=>item.id)],
  'managing-steward':['First Operator',['Creator & Leadership','Operations'],['catalogue','source','quality','inventory','content','campaigns','community','customers','orders','finance','people','work','chat','decisions']],
  'market-brand':['Market & Brand Operator',['Market & Brand'],['catalogue','content','campaigns','community','customers','orders','work','chat','decisions']],
  'product-quality':['Product & Quality',['Product & Quality'],['catalogue','source','quality','inventory','work','chat','decisions']],
  compliance:['Operations & Compliance',['Compliance'],['source','quality','inventory','content','customers','orders','people','work','chat','decisions','systems']],
  finance:['Finance',['Finance'],['catalogue','orders','finance','work','chat','decisions']],
  'customer-operations':['Customer Operations',['Customer Care'],['catalogue','inventory','customers','orders','work','chat','decisions']],
  community:['Community Manager',['Flaxx Garden Community'],['catalogue','content','campaigns','community','customers','orders','work','chat','decisions']],
  fulfilment:['Inventory & Fulfilment',['Inventory & Fulfilment'],['catalogue','quality','inventory','orders','work','chat','decisions']],
  systems:['Systems',['Systems'],['people','work','chat','decisions','systems']]
};

function previewDashboard(){
  const [name,departments,moduleIds]=previewRoles[role.value]||previewRoles.systems;
  return {
    preview:true,
    roles:[{id:role.value,name}],
    departments:departments.map((department,index)=>({id:`preview-${index}`,name:department})),
    modules:previewModules.filter(module=>moduleIds.includes(module.id)),
    entity:{commerceEnabled:false,reasonCommerceBlocked:'Live UI preview only. Production identity, database and operating integrations are not connected.'},
    gates:[
      {id:'gate-commerce',name:'Controlled commerce pilot',state:'blocked',requirements:['legalEntity','bankAndPayoutTest','releasedSku','sellableInventory','approvedTerms','paymentTaxShipping','supportRemedy','securityPrivacyAccessibility','endToEndTest']},
      {id:'gate-f4',name:'F4 whole-Garden completion',state:'open',requirements:['publicGarden','operatorOffice','workplace','threeLayers','operatingRoot','wholeGardenTest']}
    ],
    metrics:[{id:'preview',label:'Live operational records',value:0},{id:'commerce',label:'Commerce state',value:'Blocked'}],
    tasks:[],channels:[]
  };
}

const titleCase=value=>String(value||'').replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[-_]/g,' ').replace(/\b\w/g,letter=>letter.toUpperCase());
const request=async(path,options={})=>{
  const response=await fetch(path,{...options,headers:{'Content-Type':'application/json','X-Flaxx-Role':role.value,...(options.headers||{})}});
  const payload=await response.json();
  if(!response.ok)throw new Error(payload.message||'Core is unavailable.');
  return payload;
};

function renderDashboard(data){
  const roleName=data.roles.map(item=>item.name).join(' · ');
  const departments=data.departments.map(item=>item.name).join(' · ');
  document.querySelector('#department-label').textContent=departments||'Scoped workspace';
  document.querySelector('#welcome-title').textContent=roleName;
  status.textContent=data.entity.commerceEnabled?'Commerce gate is active.':`Commerce remains blocked: ${data.entity.reasonCommerceBlocked}`;
  document.querySelector('#metrics').innerHTML=data.metrics.map(item=>`<article class="metric"><strong>${item.value}</strong><span>${item.label}</span></article>`).join('');
  document.querySelector('#work-count').textContent=`${data.tasks.length} open`;
  document.querySelector('#tasks').innerHTML=data.tasks.length?data.tasks.map(task=>`<article class="task"><div><h3>${task.title}</h3><p><span class="priority ${task.priority||''}">${task.priority||'normal'}</span>${task.formationStage||'Operating work'}${task.blockedBy?.length?` · Waiting on ${task.blockedBy.join(', ')}`:''}</p></div><select data-task="${task.id}" aria-label="State for ${task.title}">${['not-started','in-progress','blocked','review','done'].map(state=>`<option value="${state}" ${state===task.state?'selected':''}>${titleCase(state)}</option>`).join('')}</select></article>`).join(''):'<p class="empty">No open work is assigned to this role.</p>';
  document.querySelector('#channels').innerHTML=data.channels.length?data.channels.map(channel=>`<button class="channel" data-channel="${channel.id}">${channel.name}</button>`).join(''):'<p class="empty">No channel is available to this role.</p>';
  document.querySelector('#modules').innerHTML=data.modules.map(module=>`<article class="module" id="module-${module.id}"><h3>${module.name}</h3><p>${module.description}</p></article>`).join('');
  document.querySelector('#module-nav').innerHTML=data.modules.map(module=>`<a href="#module-${module.id}">${module.name}</a>`).join('');
  document.querySelector('#gates').innerHTML=data.gates.map(gate=>`<article class="gate"><header><h3>${gate.name}</h3><span class="state ${gate.state}">${gate.state}</span></header><ul>${gate.requirements.map(item=>`<li>${titleCase(item)}</li>`).join('')}</ul></article>`).join('');
}

async function load(){
  status.textContent='Reading the governed Core…';
  activeChannel=null;
  document.querySelector('#conversation').hidden=true;
  try{renderDashboard(await request('/api/core/dashboard'));}
  catch(error){
    const data=previewDashboard();
    renderDashboard(data);
    status.textContent='Live UI preview. No customer, employee, payment or operational data is connected.';
  }
}

async function openChannel(id){
  try{
    activeChannel=id;
    document.querySelectorAll('[data-channel]').forEach(button=>button.classList.toggle('active',button.dataset.channel===id));
    const data=await request(`/api/core/channels/${id}/messages`);
    document.querySelector('#conversation').hidden=false;
    document.querySelector('#messages').innerHTML=data.messages.length?data.messages.map(message=>`<article class="message">${message.text}<small>${message.createdBy} · ${new Date(message.createdAt).toLocaleString()}</small></article>`).join(''):'<p class="empty">No messages yet. Start with a useful update.</p>';
  }catch(error){status.textContent=error.message;}
}

document.addEventListener('change',async event=>{
  if(event.target===role)return load();
  if(event.target.matches('[data-task]')){
    try{await request(`/api/core/tasks/${event.target.dataset.task}/state`,{method:'POST',body:JSON.stringify({state:event.target.value})});await load();}
    catch(error){status.textContent=error.message;}
  }
});
document.addEventListener('click',event=>{const button=event.target.closest('[data-channel]');if(button)openChannel(button.dataset.channel);});
document.querySelector('#message-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const input=document.querySelector('#message-input');
  if(!activeChannel||!input.value.trim())return;
  try{await request(`/api/core/channels/${activeChannel}/messages`,{method:'POST',body:JSON.stringify({text:input.value})});input.value='';await openChannel(activeChannel);}
  catch(error){status.textContent=error.message;}
});
document.querySelector('#refresh').addEventListener('click',load);
load();
