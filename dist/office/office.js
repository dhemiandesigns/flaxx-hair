const role=document.querySelector('#role');
const status=document.querySelector('#status');
const modules=[
  ['Products & SKUs','Specifications, variants, costs, claims, care, packaging and lifecycle.'],
  ['Source & relationships','Supplier qualification, rights, contracts, obligations, conflicts and exit.'],
  ['Samples, batches & release','Reference samples, chain of custody, inspection, quarantine and governed release.'],
  ['Inventory & fulfilment','Custody, quantity, state, branded packout, shipment, returns and reconciliation.'],
  ['Claims & content','Evidence-linked wording, asset truth class, approvals, expiry and withdrawal.'],
  ['Customers & consent','Purpose-limited identity, consent, fit records, preferences, access and deletion.'],
  ['Orders & payments','Released inventory only, Stripe boundary, tax, refunds and payout reconciliation.'],
  ['Cases & remedies','Question, mismatch, safety, containment, investigation, remedy and learning.'],
  ['Finance & River','Account entries, obligations, reserves, Trade, Store, Cultivation and Future.'],
  ['People & access','Person-form, evidence, appointment, mandate, permissions, handover and exit.'],
  ['Decisions & signals','Authority, reserved matters, thresholds, review cadence and response.'],
  ['Audit & recovery','Immutable events, versions, exports, retention, backup and recovery evidence.']
];
document.querySelector('#modules').innerHTML=modules.map(([name,description])=>`<article class="module"><h3>${name}</h3><p>${description}</p></article>`).join('');

async function load(){
  status.textContent='Reading the governed core…';
  try{
    const response=await fetch('/api/office/summary',{headers:{'X-Flaxx-Role':role.value}});
    const data=await response.json();
    if(!response.ok)throw new Error(data.message||'Office unavailable');
    status.textContent=data.entity.commerceEnabled?'Commerce gate is active.':'Commerce remains blocked: '+data.entity.reasonCommerceBlocked;
    const labels={products:'Products',skus:'SKUs',batches:'Batches',evidence:'Evidence records',openStops:'Open stops',openCases:'Open cases',quarantined:'Quarantined units'};
    document.querySelector('#metrics').innerHTML=Object.entries(data.counts).map(([key,value])=>`<article class="metric"><strong>${value}</strong><span>${labels[key]||key}</span></article>`).join('');
    document.querySelector('#gates').innerHTML=data.gates.map(gate=>`<article class="gate"><header><h3>${gate.name}</h3><span class="state ${gate.state}">${gate.state}</span></header><ul>${gate.requirements.map(item=>`<li>${item.replace(/([A-Z])/g,' $1').toLowerCase()}</li>`).join('')}</ul></article>`).join('');
    document.querySelector('#principles').innerHTML=data.currentPrinciples.map(item=>`<article class="principle"><strong>${item.id}</strong><strong>${item.name}</strong><p>${item.rule}</p></article>`).join('');
  }catch(error){status.textContent=error.message;document.querySelector('#metrics').innerHTML='';}
}
role.addEventListener('change',load);document.querySelector('#refresh').addEventListener('click',load);load();
