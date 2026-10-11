const role=document.querySelector('#role');
const status=document.querySelector('#status');
let activeChannel=null;

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
  catch(error){status.textContent=error.message;document.querySelector('#metrics').innerHTML='';}
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
