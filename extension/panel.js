'use strict';
const API_BASE = 'http://127.0.0.1:8787';
const $ = id => document.getElementById(id);
const state = { brief:null, sourceInput:'', tab:'brief', saved:[], token:'', loading:false };
const fields = ['person','role','company','website','seller-offer','objective'];
const isExtension = typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);

async function readStorage(keys) {
  if (isExtension) return chrome.storage.local.get(keys);
  const out={}; for (const k of keys) { try { out[k]=JSON.parse(localStorage.getItem('prospectiq_'+k)); } catch {} }
  return out;
}
async function writeStorage(values){
  if (isExtension) return chrome.storage.local.set(values);
  for(const [k,v] of Object.entries(values)) localStorage.setItem('prospectiq_'+k,JSON.stringify(v));
}
function toast(message){ const n=$('toast');n.textContent=message;n.classList.remove('hidden');setTimeout(()=>n.classList.add('hidden'),2500); }
function textNode(tag,text,className){const n=document.createElement(tag); if(className)n.className=className;n.textContent=String(text??'');return n;}
function append(parent,...children){for(const child of children) if(child)parent.appendChild(child);return parent;}
function card(title,icon='✦'){const n=textNode('section','','content-card');const h=textNode('h3',title);const mark=textNode('span',icon,'card-icon');h.prepend(mark);n.appendChild(h);return n;}
function safeLink(url,title='View source ↗'){
  try { const parsed=new URL(url); if(parsed.protocol!=='https:' && parsed.protocol!=='http:') return null;
    const a=textNode('a',title,'source');a.href=parsed.href;a.target='_blank';a.rel='noopener noreferrer';return a;
  } catch{return null;}
}
function evidenceChip(evidence){const key=['source','user','hypothesis','unverified'].includes(evidence)?evidence:'unverified';return textNode('span',{'source':'Source-linked','user':'Seller-provided','hypothesis':'Hypothesis','unverified':'Not verified'}[key],`evidence ${key}`);}
function paragraphs(c,items){for (const item of items)if(item) c.appendChild(textNode('p',item));}
function infoCard(title,body,icon){const c=card(title,icon);paragraphs(c,[body]);return c;}
function setView(view){
  $('view-research').classList.toggle('hidden',view!=='research');$('view-saved').classList.toggle('hidden',view!=='saved');
  $('results').classList.toggle('hidden',view!=='research'||!state.brief);
  document.querySelectorAll('.primary-tab').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
}
function showError(message){const n=$('error-alert');n.textContent=message;n.classList.remove('hidden');n.scrollIntoView({block:'nearest'});}
function hideError(){$('error-alert').classList.add('hidden');}
function setLoading(value){state.loading=value;$('loading').classList.toggle('hidden',!value);$('generate-button').disabled=value;$('generate-button').textContent=value?'Researching sources…':'✦  Generate intelligence brief   →';}
function renderBrief(){
  const b=state.brief; if(!b)return;
  $('results').classList.remove('hidden');$('result-company').textContent=b.meta.company||'Prospect brief';
  $('result-subtitle').textContent=[b.meta.person,b.meta.role].filter(Boolean).join(' • ') || 'Company-focused meeting research';
  $('result-tag').textContent=b.meta.mode==='demo'?'DEMO':'LIVE';
  $('save-brief').textContent=state.saved.some(x=>x.id===b._savedId)?'★ Saved':'☆ Save';
  document.querySelectorAll('.result-tab').forEach(n=>{const active=n.dataset.resultTab===state.tab;n.classList.toggle('active',active);n.setAttribute('aria-selected',String(active));});
  const target=$('result-content');target.replaceChildren();
  if(state.tab==='brief')renderSummary(target,b);
  else if(state.tab==='account')renderAccount(target,b);
  else renderPlaybook(target,b);
}
function renderSummary(target,b){
  const intro=card(b.overview.headline||'Executive summary','◎');append(intro,textNode('p',b.overview.summary||'No summary available.'));
  if(b.overview.whyNow){const d=textNode('div','','callout');d.style.marginTop='12px';append(d,textNode('strong','Why now? '),document.createTextNode(b.overview.whyNow));intro.appendChild(d);}target.appendChild(intro);
  const opp=card('Potential sales opportunities','✦');
  if(!b.opportunities?.length)opp.appendChild(textNode('p','No supported opportunity hypothesis could be generated.'));
  for(const [i,o] of (b.opportunities||[]).entries()){
    const line=textNode('div','','numbered');append(line,textNode('span',String(i+1).padStart(2,'0'),'num'));
    const body=textNode('div');append(body,textNode('strong',o.title),textNode('p',o.rationale));
    const angle=textNode('p','Seller angle: '+o.sellerAngle);angle.style.color='#3f6190';body.appendChild(angle);body.appendChild(evidenceChip(o.evidence));line.appendChild(body);opp.appendChild(line);
  }target.appendChild(opp);
  const q=card('Questions worth asking','?');for(const [i,item] of (b.questions||[]).entries()){
    const line=textNode('div','','numbered');append(line,textNode('span',String(i+1).padStart(2,'0'),'num'));
    append(line,append(textNode('div'),textNode('strong',item.question),textNode('p',item.why)));q.appendChild(line);
  }target.appendChild(q);
  target.appendChild(infoCard('Suggested opening',b.talkTrack?.opener||'No opener available.','❝'));
}
function renderAccount(target,b){
  const facts=card('Company and prospect intelligence','▤');
  if(!b.facts?.length)facts.appendChild(textNode('p','No attributable facts found.'));
  for(const f of b.facts||[]){const row=textNode('div','','fact');append(row,textNode('div',f.label,'fact-label'));
    const value=textNode('div',f.value,'fact-value');value.appendChild(evidenceChip(f.evidence));row.appendChild(value);
    const source=safeLink(f.sourceUrl);if(source)row.appendChild(source);facts.appendChild(row);
  }target.appendChild(facts);
  const signals=card('Recent triggers and signals','↗');
  if(!b.signals?.length)signals.appendChild(textNode('p','No source-backed recent event found. Do not invent a buying trigger.'));
  for(const s of b.signals||[]){const item=textNode('div','','signal');append(item,textNode('strong',s.headline));append(item,textNode('p',s.explanation));
    const note=textNode('p',[s.date,s.relevance].filter(Boolean).join(' • '));note.style.marginTop='4px';item.appendChild(note);
    const l=safeLink(s.sourceUrl);if(l)item.appendChild(l);signals.appendChild(item);
  }target.appendChild(signals);
  const sources=card(`Sources consulted (${b.sources?.length||0})`,'◉');sources.classList.add('source-list');
  if(!b.sources?.length)sources.appendChild(textNode('p','No live sources in this brief.'));
  for(const s of b.sources||[]){const l=safeLink(s.url,s.title||s.url);if(l)sources.appendChild(l);}target.appendChild(sources);
}
function renderPlaybook(target,b){
  const talk=card('Conversation playbook','❝');
  for(const [label,val] of [['Opening',b.talkTrack?.opener],['Positioning',b.talkTrack?.positioning],['Suggested close',b.talkTrack?.close]]){
    const row=textNode('div','','fact');append(row,textNode('div',label,'fact-label'),textNode('div',val||'Not generated','fact-value'));talk.appendChild(row);
  }target.appendChild(talk);
  const objections=card('Objection preparation','◇');for(const item of b.objections||[]){const row=textNode('div','','fact');append(row,textNode('div',item.objection,'fact-label'),textNode('div',item.response,'fact-value'));objections.appendChild(row);}target.appendChild(objections);
  const next=card('Recommended next actions','→');for(const [i,v] of (b.nextSteps||[]).entries()){
    const line=textNode('div','','numbered');append(line,textNode('span',String(i+1).padStart(2,'0'),'num'),textNode('strong',v));next.appendChild(line);
  }target.appendChild(next);
}
function briefMarkdown(b){
  const parts=[`# ProspectIQ intelligence brief — ${b.meta.company}`,`Prepared: ${b.meta.generatedAt||new Date().toISOString()}`,`Prospect: ${[b.meta.person,b.meta.role].filter(Boolean).join(', ')}`,`Mode: ${b.meta.mode||'live'}`,`\n## Summary\n${b.overview.headline}\n${b.overview.summary}\nWhy now: ${b.overview.whyNow}`];
  parts.push('\n## Company facts');for(const f of b.facts||[])parts.push(`- **${f.label}:** ${f.value} [${f.evidence}]${f.sourceUrl?' — '+f.sourceUrl:''}`);
  parts.push('\n## Recent signals');for(const s of b.signals||[])parts.push(`- **${s.headline}:** ${s.explanation} (${s.date}) — ${s.sourceUrl}`);
  parts.push('\n## Opportunities (hypotheses until confirmed)');for(const o of b.opportunities||[])parts.push(`- **${o.title}:** ${o.rationale}\n  - Seller angle: ${o.sellerAngle} [${o.evidence}]`);
  parts.push('\n## Discovery questions');for(const [i,q] of (b.questions||[]).entries())parts.push(`${i+1}. ${q.question} — ${q.why}`);
  parts.push('\n## Conversation playbook');for(const [k,v] of Object.entries(b.talkTrack||{}))parts.push(`- **${k}:** ${v}`);
  parts.push('\n## Objections');for(const v of b.objections||[])parts.push(`- **${v.objection}:** ${v.response}`);
  parts.push('\n## Next actions');for(const v of b.nextSteps||[])parts.push(`- ${v}`);
  parts.push('\n## Sources');for(const s of b.sources||[])parts.push(`- ${s.title}: ${s.url}`);
  parts.push('\n_Research is not certainty. Validate important claims before external use._');return parts.join('\n');
}
async function loadSaved(){const data=await readStorage(['savedBriefs']);state.saved=Array.isArray(data.savedBriefs)?data.savedBriefs:[];$('saved-count').textContent=String(state.saved.length);renderSaved();}
function renderSaved(){const list=$('saved-list');list.replaceChildren();if(!state.saved.length){const e=textNode('div','','empty');append(e,textNode('div','▤'),textNode('strong','No briefs saved yet'),textNode('p','Generate or preview a brief and select Save to keep it here.'));list.appendChild(e);return;}
  for(const entry of state.saved){const c=textNode('div','','saved-item');append(c,textNode('strong',entry.brief.meta.company),textNode('small',`${entry.brief.meta.role||'Company research'} • ${new Date(entry.savedAt).toLocaleDateString()}`));const actions=textNode('div','','saved-item-actions');
    const open=textNode('button','Open');open.addEventListener('click',()=>{state.brief={...entry.brief,_savedId:entry.id};state.tab='brief';setView('research');renderBrief();$('results').scrollIntoView({behavior:'smooth',block:'start'});});
    const del=textNode('button','Remove','danger-text');del.addEventListener('click',async()=>{state.saved=state.saved.filter(x=>x.id!==entry.id);await writeStorage({savedBriefs:state.saved});$('saved-count').textContent=String(state.saved.length);renderSaved();toast('Brief removed');});append(actions,open,del);c.appendChild(actions);list.appendChild(c);
  }
}
function normalizeWebsite(value){if(!value)return '';try{const u=new URL(value);return u.protocol==='https:'||u.protocol==='http:'?u.href:'';}catch{return '';}}
function researchPayload(){return {person:$('person').value.trim(),role:$('role').value.trim(),company:$('company').value.trim(),website:normalizeWebsite($('website').value.trim()),sellerOffer:$('seller-offer').value.trim(),objective:$('objective').value,pageContext:state.sourceInput.slice(0,4500)};}
async function generate(event){event.preventDefault();hideError();if(state.loading)return;const payload=researchPayload();if(!payload.company||!payload.sellerOffer){showError('Please enter both company name and your product/service offering.');return;}
  if(!state.token){showError('Set the client access token in ⚙ Settings. This must match backend/.env. Or choose “Try a demo” to explore offline.');return;}
  setLoading(true);const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),120000);
  try {const r=await fetch(`${API_BASE}/api/brief`,{method:'POST',headers:{'Content-Type':'application/json','X-ProspectIQ-Token':state.token},body:JSON.stringify(payload),signal:controller.signal});const result=await r.json().catch(()=>({}));if(!r.ok)throw new Error(result.error||`Backend error ${r.status}`);
    if(!result.brief)throw new Error('The backend returned no brief.');state.brief=result.brief;state.tab='brief';renderBrief();$('results').scrollIntoView({behavior:'smooth',block:'start'});toast('Live intelligence brief ready');
  }catch(error){showError(error.name==='AbortError'?'Research took too long. Try again or choose a smaller company.':`Research unavailable: ${error.message}. Ensure the backend is running and configured.`);}finally{clearTimeout(timer);setLoading(false);}
}
async function captureCurrentTab(){hideError();if(!isExtension||!chrome.tabs?.query||!chrome.scripting){showError('Use current tab works only when installed as a Chrome extension.');return;}
  try {const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!tab||!/^https?:\/\//.test(tab.url||''))throw new Error('Open a company website in the active tab.');
    const host=new URL(tab.url).hostname;if(/(^|\.)linkedin\.com$/.test(host))throw new Error('LinkedIn pages are intentionally excluded. Enter details manually or open the company website.');
    const values=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>{
      const m=k=>document.querySelector(`meta[name="${k}"],meta[property="${k}"]`)?.content||'';
      const bodyText=(document.querySelector('main')||document.body)?.innerText||'';
      return {title:document.title.slice(0,180),company:m('og:site_name').slice(0,150),description:(m('description')||m('og:description')).slice(0,450),excerpt:bodyText.slice(0,3500),url:location.origin};
    }});
    const page=values?.[0]?.result;if(!page)throw new Error('The page could not be read.');$('website').value=page.url;
    if(!$('company').value.trim())$('company').value=page.company || host.replace(/^www\./,'').split('.')[0];
    state.sourceInput=[page.title,page.description,page.excerpt].filter(Boolean).join('\n').slice(0,4500);
    $('capture-note').textContent=`✓ Captured selected text from ${host} (${state.sourceInput.length.toLocaleString()} characters). Review before submitting.`;toast('Page context captured');
  } catch(err){showError('Unable to capture current tab: '+err.message+' You can enter details manually.');}
}
async function init(){
  const initData=await readStorage(['clientToken','sellerOffer','savedBriefs']);state.token=initData.clientToken||'';$('access-token').value=state.token;
  $('seller-offer').value=initData.sellerOffer||'';await loadSaved();
  for(const tab of document.querySelectorAll('.primary-tab'))tab.addEventListener('click',()=>setView(tab.dataset.view));
  for(const tab of document.querySelectorAll('.result-tab'))tab.addEventListener('click',()=>{state.tab=tab.dataset.resultTab;renderBrief();});
  $('research-form').addEventListener('submit',generate);
  $('capture-tab').addEventListener('click',captureCurrentTab);
  $('demo-button').addEventListener('click',()=>{state.brief=structuredClone(window.PROSPECTIQ_DEMO_BRIEF);state.tab='brief';hideError();renderBrief();$('results').scrollIntoView({behavior:'smooth',block:'start'});});
  $('settings-toggle').addEventListener('click',()=>{$('settings-panel').classList.toggle('hidden');});
  $('settings-close').addEventListener('click',()=>{$('settings-panel').classList.add('hidden');});
  $('settings-save').addEventListener('click',async()=>{state.token=$('access-token').value.trim();await writeStorage({clientToken:state.token});$('settings-panel').classList.add('hidden');toast('Settings saved');await ping();});
  $('seller-offer').addEventListener('change',async()=>{await writeStorage({sellerOffer:$('seller-offer').value.trim()});});
  $('save-brief').addEventListener('click',async()=>{if(!state.brief)return;if(state.brief._savedId){toast('Already saved');return;}const id=crypto.randomUUID();const entry={id,savedAt:new Date().toISOString(),brief:{...state.brief}};state.saved=[entry,...state.saved].slice(0,30);state.brief._savedId=id;await writeStorage({savedBriefs:state.saved});$('saved-count').textContent=String(state.saved.length);renderSaved();renderBrief();toast('Saved locally in Chrome');});
  $('copy-brief').addEventListener('click',async()=>{if(!state.brief)return;try{await navigator.clipboard.writeText(briefMarkdown(state.brief));toast('Brief copied to clipboard');}catch{toast('Clipboard permission unavailable');}});
  $('export-brief').addEventListener('click',()=>{if(!state.brief)return;const blob=new Blob([briefMarkdown(state.brief)],{type:'text/markdown;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='prospectiq-'+(state.brief.meta.company||'brief').toLowerCase().replace(/[^a-z0-9]+/gi,'-').slice(0,45)+'.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('Markdown brief exported');});
  $('new-brief').addEventListener('click',()=>{state.brief=null;$('results').classList.add('hidden');$('company').focus();window.scrollTo({top:0,behavior:'smooth'});});
  await ping();
}
async function ping(){try{const ctl=new AbortController();const tm=setTimeout(()=>ctl.abort(),2200);const r=await fetch(API_BASE+'/api/health',{signal:ctl.signal});clearTimeout(tm);if(!r.ok)throw Error('offline');$('connection-status').innerHTML='<i></i> AI backend ready';$('connection-status').classList.add('online');}catch{$('connection-status').innerHTML='<i></i> Demo ready';$('connection-status').classList.remove('online');}}
init().catch(e=>{console.error(e);showError('UI initialization problem: '+e.message);});
