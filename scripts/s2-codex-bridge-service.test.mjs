import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
register('./ts-source-loader.mjs', import.meta.url);
const { startBridgeService, observeRequest, responseTransport } = await import('./s2-codex-bridge-service.mjs');
const payload = () => ({model:'gpt-6-luna',reasoning:{effort:'low',summary:'auto'},store:false,input:[{type:'function_call_output',call_id:'fake-call',output:'harmless-marker'}]});

test('effective-condition guard refuses drift and only observes actual tool output', () => {
  assert.equal(observeRequest(payload(),'harmless-marker').accepted,true);
  for (const edit of [p=>p.model='wrong',p=>p.reasoning.effort='high',p=>delete p.reasoning.summary,p=>p.store=true,p=>p.previous_response_id=null,p=>p.conversation={},p=>p.input.push({type:'reasoning'}),p=>p.input='text']) {
    const p=payload(); edit(p); assert.equal(observeRequest(p,'harmless-marker').accepted,false);
  }
  assert.equal(observeRequest({...payload(),input:[{role:'user',content:'harmless-marker'}]},'harmless-marker').tool_result_observed,false);
});

async function mock(t, handler) {
  const server=createServer(handler); await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
  return `http://127.0.0.1:${server.address().port}`;
}
async function fixture(t, upstreamStatus = 200) {
  const dir=await mkdtemp(join(tmpdir(),'aob-service-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  const seen=[];
  const upstream=await mock(t,async(req,res)=>{
    const chunks=[];for await(const chunk of req)chunks.push(chunk);
    seen.push({body:Buffer.concat(chunks).toString(),headers:req.headers,path:req.url});
    res.statusCode=upstreamStatus;res.setHeader('content-type','application/json');
    res.end(JSON.stringify({id:'fake-response',object:'response',status:'completed',model:'gpt-6-luna',output:[],usage:{input_tokens:100,output_tokens:30,total_tokens:130,input_tokens_details:{cached_tokens:40},output_tokens_details:{reasoning_tokens:10}}}));
  });
  const frontSeen=[];
  const bridge=await mock(t,async(req,res)=>{let body='';for await(const c of req)body+=c;frontSeen.push({path:req.url,body,authorization:req.headers.authorization});res.end('{}');});
  const spec={upstream:`${upstream}/backend`,outPath:join(dir,'c1.jsonl'),observationsPath:join(dir,'observations.json'),meterKey:'m'.repeat(48),bridgeKey:'b'.repeat(48),marker:'harmless-marker',runId:'synthetic-service'};
  const service=await startBridgeService(spec,{frontPort:0,gatePort:0,meterPort:0,bridge});
  t.after(()=>service.close());
  return {spec,service,seen,frontSeen};
}
const post=(url,body,headers={})=>fetch(url,{method:'POST',headers:{'content-type':'application/json',...headers},body});

test('gate preserves request bytes and OAuth through C1, strips capability, caps actual attempts', async t=>{
 const {spec,service,seen}=await fixture(t);
 const body=JSON.stringify(payload(),null,2);
 for(let i=0;i<2;i++)assert.equal((await post(`${service.gateUrl}/responses`,body,{'x-aob-proxy-token':spec.meterKey,authorization:'Bearer synthetic-oauth','chatgpt-account-id':'synthetic-account'})).status,200);
 assert.equal((await post(`${service.gateUrl}/responses`,body,{'x-aob-proxy-token':spec.meterKey})).status,429);
 assert.equal(seen.length,2);assert.equal(seen[0].body,body);assert.equal(seen[0].headers.authorization,'Bearer synthetic-oauth');assert.equal(seen[0].headers['chatgpt-account-id'],'synthetic-account');assert.equal(seen[0].headers['x-aob-proxy-token'],undefined);assert.equal(seen[0].headers['accept-encoding'],'identity');assert.equal(seen[0].path,'/backend/responses');
 await service.close();
 const obs=JSON.parse(await readFile(spec.observationsPath,'utf8'));assert.equal(obs.requests.length,3);assert.equal(obs.requests[0].tool_result_observed,true);assert.equal(obs.requests[0].response_content_type,'application/json');assert.equal(obs.requests[0].response_content_encoding,'absent');
 const events=(await readFile(spec.outPath,'utf8')).trim().split('\n').map(JSON.parse);assert.equal(events.length,3);assert.equal(events[0].model_served,'gpt-6-luna');
 for(const path of [spec.outPath,spec.observationsPath])assert.equal((await stat(path)).mode&0o777,0o600);
 const saved=JSON.stringify(obs);assert.ok(!saved.includes(spec.meterKey));assert.ok(!saved.includes('synthetic-oauth'));assert.ok(!saved.includes('harmless-marker'));
});

test('condition failures, invalid JSON, unauthorized access and disallowed paths never reach provider',async t=>{
 const {spec,service,seen}=await fixture(t);
 assert.equal((await post(`${service.gateUrl}/responses`,JSON.stringify({...payload(),store:true}),{'x-aob-proxy-token':spec.meterKey})).status,400);
 assert.equal((await post(`${service.gateUrl}/responses`,'{bad',{'x-aob-proxy-token':spec.meterKey})).status,400);
 assert.equal((await post(`${service.gateUrl}/responses`,JSON.stringify(payload()))).status,401);
 assert.equal((await post(`${service.gateUrl}/other`,JSON.stringify(payload()),{'x-aob-proxy-token':spec.meterKey})).status,404);
 assert.equal((await post(`${service.gateUrl}/responses`,'x'.repeat(16*1024*1024+1),{'x-aob-proxy-token':spec.meterKey})).status,413);
 assert.equal(seen.length,0);
});

test('front requires its capability and refuses non-native endpoints without forwarding',async t=>{
 const {spec,service,frontSeen}=await fixture(t);
 assert.equal((await fetch(`${service.frontUrl}/v1/models`)).status,401);
 assert.equal((await fetch(`${service.frontUrl}/v0/management`,{headers:{authorization:`Bearer ${spec.bridgeKey}`}})).status,404);
 assert.equal((await fetch(`${service.frontUrl}/v1/models`,{headers:{authorization:`Bearer ${spec.bridgeKey}`}})).status,200);
 assert.equal((await post(`${service.frontUrl}/v1/responses`,' { "model": "gpt-6-luna" } ',{authorization:`Bearer ${spec.bridgeKey}`})).status,200);
 assert.equal(frontSeen.length,2);assert.equal(frontSeen[1].body,' { "model": "gpt-6-luna" } ');assert.equal(frontSeen[1].authorization,`Bearer ${spec.bridgeKey}`);
});

test('invalid destination and existing output are rejected without overwriting',async t=>{
 const {spec,service}=await fixture(t);await service.close();
 const before=await readFile(spec.observationsPath,'utf8');
 await assert.rejects(startBridgeService(spec,{frontPort:0,gatePort:0,meterPort:0}),{name:'BridgeServiceError'});
 await assert.rejects(startBridgeService({...spec,upstream:'https://example.com/stolen'}),{name:'BridgeServiceError'});
 assert.equal(await readFile(spec.observationsPath,'utf8'),before);
});


test('preexisting C1 sidecar is never truncated',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'aob-service-collision-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const outPath=join(dir,'c1.jsonl'); await writeFile(`${outPath}.upstream.jsonl`,'preserved-private-evidence',{mode:0o600});
 const spec={upstream:'http://127.0.0.1:9000/backend',outPath,observationsPath:join(dir,'obs.json'),meterKey:'m'.repeat(48),bridgeKey:'b'.repeat(48),marker:'marker',runId:'synthetic-collision'};
 await assert.rejects(startBridgeService(spec,{frontPort:0,gatePort:0,meterPort:0}),{name:'BridgeServiceError'});
 assert.equal(await readFile(`${outPath}.upstream.jsonl`,'utf8'),'preserved-private-evidence');
});

test('CLI SIGTERM flushes private observations and exits without secrets',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'aob-service-cli-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const spec={upstream:'http://127.0.0.1:9000/backend',outPath:join(dir,'c1.jsonl'),observationsPath:join(dir,'obs.json'),meterKey:'m'.repeat(48),bridgeKey:'b'.repeat(48),marker:'marker',runId:'synthetic-cli'};
 const path=join(dir,'spec.json');await writeFile(path,JSON.stringify(spec),{mode:0o600});
 const child=spawn(process.execPath,['--experimental-strip-types','--no-warnings','--experimental-loader',new URL('./ts-source-loader.mjs',import.meta.url).pathname,new URL('./s2-codex-bridge-service.mjs',import.meta.url).pathname,path],{stdio:['ignore','pipe','pipe']});
 t.after(()=>child.kill('SIGKILL')); let logs='';child.stdout.on('data',c=>logs+=c);child.stderr.on('data',c=>logs+=c);
 const exit=new Promise(resolve=>child.once('exit',(code,signal)=>resolve({code,signal})));
 let ready=false;for(let i=0;i<100;i++){try { const r=await fetch('http://127.0.0.1:3210/v1/models');if(r.status===401){ready=true;break;} }catch{} await new Promise(resolve=>setTimeout(resolve,20));}
 assert.equal(ready,true);child.kill('SIGTERM');assert.deepEqual(await exit,{code:0,signal:null});
 const observations=JSON.parse(await readFile(spec.observationsPath,'utf8'));assert.equal(observations.front_refused,1);assert.deepEqual(observations.requests,[]);assert.equal(logs,'');
});


test('provider denial is retained once without retrying',async t=>{
 const {spec,service,seen}=await fixture(t,401);
 const response=await post(`${service.gateUrl}/responses`,JSON.stringify(payload()),{'x-aob-proxy-token':spec.meterKey,authorization:'Bearer synthetic-denied'});
 assert.equal(response.status,401);await response.text();await service.close();assert.equal(seen.length,1);
 const events=(await readFile(spec.outPath,'utf8')).trim().split('\n').map(JSON.parse);assert.equal(events.length,1);assert.equal(events[0].error.kind,'upstream_http');
});


test('native tool content-array text proves marker output without accepting IDs or unrelated fields',()=>{
 const p=payload();p.input=[{type:'function_call_output',call_id:'native-call',output:[{type:'input_text',text:'Command: printf harmless-marker\nOutput: harmless-marker\nExit code: 0'}]}];
 assert.equal(observeRequest(p,'harmless-marker').tool_result_observed,true);
 p.input[0].output=[{type:'text',text:'harmless-marker'}];assert.equal(observeRequest(p,'harmless-marker').tool_result_observed,true);
 p.input[0].output=[{type:'input_text',text:'ordinary output',id:'harmless-marker'}];assert.equal(observeRequest(p,'harmless-marker').tool_result_observed,false);
 p.input[0].output=[{type:'image',text:'harmless-marker'}];assert.equal(observeRequest(p,'harmless-marker').tool_result_observed,false);
 p.input[0].output={text:'harmless-marker'};assert.equal(observeRequest(p,'harmless-marker').tool_result_observed,false);
});

test('transport observations retain only known MIME and encoding classes',()=>{
 assert.deepEqual(responseTransport({'content-type':'Text/Event-Stream; charset=utf-8','content-encoding':'gzip'}),{response_content_type:'text/event-stream',response_content_encoding:'gzip'});
 assert.deepEqual(responseTransport({'content-type':'secret-value','content-encoding':'private-value'}),{response_content_type:'other',response_content_encoding:'other'});
});
