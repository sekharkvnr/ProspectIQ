import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanInput, extractCitations, extractOutputText, normalizeBrief, createBrief} from '../backend/brief.mjs';
import {createServer} from '../backend/server.mjs';

const valid={company:'Example Logistics Pvt Ltd',role:'VP Operations',person:'Example Person',sellerOffer:'Supply chain process automation software',objective:'discovery',website:'https://example.com'};
test('validates company, seller offering, and website',()=>{
  assert.equal(cleanInput(valid).company,valid.company);
  assert.equal(cleanInput({...valid,objective:'wrong'}).objective,'discovery');
  assert.throws(()=>cleanInput({...valid,company:''}),/company name/i);
  assert.throws(()=>cleanInput({...valid,sellerOffer:'small'}),/Describe the solution/i);
  assert.throws(()=>cleanInput({...valid,website:'javascript:alert(1)'}),/Only HTTP/i);
});

test('extracts source annotations and output text',()=>{
  const r={output:[{type:'message',content:[{type:'output_text',text:'A brief with citations.',annotations:[{type:'url_citation',url:'https://example.com/about',title:'Company About'},{type:'url_citation',url:'https://example.com/about',title:'Repeat'},{type:'url_citation',url:'javascript:alert(1)',title:'bad'}]}]}]};
  assert.equal(extractOutputText(r),'A brief with citations.');
  assert.deepEqual(extractCitations(r),[{url:'https://example.com/about',title:'Company About'}]);
});

const rawBrief={
  overview:{headline:'Sample',summary:'Summary',whyNow:'No verified recent trigger'},
  facts:[{label:'Industry',value:'Logistics',sourceUrl:'https://example.com/about',evidence:'source'},{label:'Turnover',value:'₹100 crore',sourceUrl:'https://unsourced.test',evidence:'source'}],
  signals:[{headline:'Unverified expansion',explanation:'Unknown',date:'today',relevance:'maybe',sourceUrl:''}],
  opportunities:[{title:'Visibility',rationale:'Potential problem',sellerAngle:'Ask about SLAs',evidence:'source'}],
  questions:[{question:'What are your KPIs?',why:'Understand priorities'}],
  objections:[{objection:'We have a system',response:'Clarify gaps'}],
  talkTrack:{opener:'Hi',positioning:'We help',close:'Follow up?'},nextSteps:['Ask questions']
};

test('normalizes brief and rejects unsourced financial claims as verified',()=>{
  const x=normalizeBrief(rawBrief,cleanInput(valid),[{url:'https://example.com/about',title:'Company About'}]);
  assert.equal(x.facts[0].evidence,'source');
  assert.equal(x.facts[1].evidence,'unverified');
  assert.equal(x.facts[1].sourceUrl,'');
  assert.equal(x.signals.length,0);
  assert.equal(x.opportunities[0].evidence,'hypothesis');
});

test('two-pass research calls web search then structured output',async()=>{
  const calls=[];
  const fakeFetch=async(url,options)=>{
    const req=JSON.parse(options.body);calls.push(req);
    const body=calls.length===1 ? {output:[{type:'message',content:[{type:'output_text',text:'Example Logistics publishes a company profile.',annotations:[{type:'url_citation',url:'https://example.com/about',title:'Company About'}]}]}]} : {output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(rawBrief)}]}]};
    return {ok:true,json:async()=>body};
  };
  const r=await createBrief(valid,{apiKey:'test-api-key',fetchImpl:fakeFetch,researchModel:'test-research',writerModel:'test-writer'});
  assert.equal(calls.length,2);
  assert.deepEqual(calls[0].tools,[{type:'web_search',search_context_size:'medium'}]);
  assert.equal(calls[1].text.format.type,'json_schema');
  assert.equal(r.brief.sources.length,1);
  assert.equal(r.brief.facts[0].sourceUrl,'https://example.com/about');
});

async function withServer(run){
  const s=createServer({token:'test-secret',createBrief:async p=>({brief:{meta:{company:p.company}}})});
  await new Promise(resolve=>s.listen(0,'127.0.0.1',resolve));
  try{return await run(`http://127.0.0.1:${s.address().port}`);}finally{await new Promise(resolve=>s.close(resolve));}
}

test('local server health and auth protections',async()=>{
  await withServer(async base=>{
    const health=await fetch(base+'/api/health');assert.equal(health.status,200);
    const denied=await fetch(base+'/api/brief',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(valid)});assert.equal(denied.status,401);
    const forbidden=await fetch(base+'/api/brief',{method:'POST',headers:{Origin:'https://malicious.example','Content-Type':'application/json','X-ProspectIQ-Token':'test-secret'},body:JSON.stringify(valid)});assert.equal(forbidden.status,403);
    const good=await fetch(base+'/api/brief',{method:'POST',headers:{'Content-Type':'application/json','X-ProspectIQ-Token':'test-secret'},body:JSON.stringify(valid)});assert.equal(good.status,200);assert.equal((await good.json()).brief.meta.company,valid.company);
  });
});
