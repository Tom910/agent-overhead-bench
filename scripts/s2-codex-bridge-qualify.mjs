#!/usr/bin/env node
// Bounded S2 transport qualification, not a benchmark campaign runner.
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, realpathSync, openSync, closeSync, lstatSync, readdirSync } from 'node:fs';
import { dirname, join, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { register } from 'node:module';
import { prepareContinuation } from './s2-codex-bridge-continuation.mjs';
import { prepareCodexBridge, LUNA_MODEL, CONTROLLED_POLICY } from './s2-codex-bridge-prepare.mjs';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const GO_IMAGE='golang@sha256:2a0ba12e116687098780d3ce700f9ce3cb340783779646aafbabed748fa6677c';
const NODE_IMAGE='sha256:c21217fe4f133f281d910ec02385445ef5dd65f0650fd629d0e7fd666faea430';
export class QualificationError extends Error { constructor(message){super(message);this.name='QualificationError';} }
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const json=path=>JSON.parse(readFileSync(path,'utf8'));
const save=(path,value)=>writeFileSync(path,`${JSON.stringify(value,null,2)}\n`,{mode:0o600});
export function mayStartSlot(state,tool){return !state.halted && state.slots[tool]===undefined;}
export function summarizeQualification({events,exit,markerMatches,observations}){
 const modelEvents=events.filter(e=>e.method==='POST');
 const sent=modelEvents.filter(e=>e.error?.kind!=='proxy_refused');
 const keys=['input','cached_input','output','reasoning_output'];
 const usageComplete=sent.length>0&&sent.every(e=>e.usage&&keys.every(k=>Number.isSafeInteger(e.usage[k])&&e.usage[k]>=0));
 const tokens=usageComplete?Object.fromEntries(keys.map(k=>[k,sent.reduce((n,e)=>n+e.usage[k],0)])):null;
 const observed=observations?.requests??[];
 const toolResult=observed.some(r=>r.accepted&&r.tool_result_observed);
 const passed=exit===0&&markerMatches&&toolResult&&sent.length===2&&modelEvents.length===2&&observed.length===2&&observed.every(r=>r.accepted)&&sent.every(e=>e.protocol==='openai_responses'&&e.status===200&&e.error===null&&e.model_requested===LUNA_MODEL&&e.model_served===LUNA_MODEL)&&usageComplete;
 return {passed,provider_requests:sent.length,meter_events:modelEvents.length,tokens,usage_complete:usageComplete,subscription_cost_usd:null,exit,marker_matches:markerMatches,tool_result_observed:toolResult,statuses:sent.map(e=>e.status),served_models:sent.map(e=>e.model_served),halt:sent.some(e=>[400,401,403,404,429].includes(e.status))};
}
export function verifyMockEvidence(proof,binaryHash,implementationHash){
 if(proof.mode!=='mock'||proof.all_five_passed!==true||proof.bridge_binary_sha256!==binaryHash||proof.implementation_sha256!==implementationHash||proof.policy!==CONTROLLED_POLICY)throw new QualificationError('Live mode requires successful all-five mock evidence for this exact binary and implementation.');
}
export function parseOptions(args){
 const opts={mode:'mock'}; const map={'--mode':'mode','--output':'output','--bridge':'bridge','--auth-file':'authFile','--mock-evidence':'mockEvidence','--continue-evidence':'continueEvidence'}; const seen=new Set();
 for(let i=0;i<args.length;i++){const key=map[args[i]];if(!key||seen.has(key)||!args[i+1]||args[i+1].startsWith('--'))throw new QualificationError('Use --mode mock|live --output PRIVATE_DIRECTORY --bridge BINARY [--auth-file SNAPSHOT].');seen.add(key);opts[key]=args[++i];}
 if(!['mock','live'].includes(opts.mode)||!opts.output||!opts.bridge||(opts.mode==='live')!==Boolean(opts.authFile)||(opts.mode==='live')!==Boolean(opts.mockEvidence)||(opts.continueEvidence&&opts.mode!=='live'))throw new QualificationError('Live mode requires an explicit snapshot and passed mock evidence; mock mode forbids credentials.');
 return opts;
}
function command(args,{check=true,timeout=30000,...rest}={}){
 const r=spawnSync(args[0],args.slice(1),{encoding:'utf8',timeout,maxBuffer:8*1024*1024,...rest});
 if(check&&(r.error||r.status!==0))throw new QualificationError(`Local command failed (${args[0]}); private diagnostics retained where available.`);
 return r;
}
const docker=(...args)=>command(['docker',...args]).stdout.trim();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function readEvents(path){return existsSync(path)?readFileSync(path,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse):[];}
function privateRoot(path){
 const output=resolve(path);const parent=realpathSync(dirname(output));const destination=join(parent,output.split('/').at(-1));
 const rel=relative(ROOT,destination);if(!rel||(rel!=='..'&&!rel.startsWith('../')&&!isAbsolute(rel)))throw new QualificationError('Private qualification output must be outside the checkout.');
 if(!existsSync(destination))mkdirSync(destination,{mode:0o700});
 const stat=lstatSync(destination);if(!stat.isDirectory()||stat.isSymbolicLink()||(stat.mode&0o077)!==0)throw new QualificationError('Output must be a private regular directory.');
 return destination;
}
async function main(opts){
 if(process.platform!=='linux')throw new QualificationError('Native qualification must run on the designated Linux host.');
 process.umask(0o077);
 register('./ts-source-loader.mjs',import.meta.url);
 const {getAdapter}=await import('@aob/adapters');
 const output=privateRoot(opts.output);const lock=join(output,'runner.lock');let lockFd;
 const statePath=join(output,'state.json');const binary=realpathSync(opts.bridge);const binaryHash=hash(binary);
 const sourceFiles=['scripts/s2-codex-bridge-qualify.mjs','scripts/s2-codex-bridge-continuation.mjs','scripts/s2-codex-bridge-service.mjs','scripts/s2-codex-bridge-prepare.mjs','scripts/ts-source-loader.mjs','package-lock.json','plans/s2-evidence/codex-bridge/native-smoke/sanitized-summary.json','plans/s2-evidence/codex-bridge/native-smoke/fake.py',...['proxy','adapters','contracts'].flatMap(pkg=>readdirSync(join(ROOT,'packages',pkg,'src'),{recursive:true}).filter(p=>p.endsWith('.ts')).map(p=>`packages/${pkg}/src/${p}`))].sort();
 const implementationHash=createHash('sha256').update(sourceFiles.map(name=>`${name}:${hash(join(ROOT,name))}`).join('\n')).digest('hex');
 if(opts.mode==='live'){
  const proof=json(opts.mockEvidence);
  verifyMockEvidence(proof,binaryHash,implementationHash);
 }
 const clients=json(join(ROOT,'plans/s2-evidence/codex-bridge/native-smoke/sanitized-summary.json')).clients;
 if(clients.length!==5||new Set(clients.map(c=>c.harness)).size!==5||clients.some(c=>!['codex','pi','qwen','hermes','cline'].includes(c.harness)||!/^sha256:[a-f0-9]{64}$/.test(c.image_id)))throw new QualificationError('Expected exactly five pinned native images.');
 try{lockFd=openSync(lock,'wx',0o600);}catch{throw new QualificationError('Qualification already started or has a retained lock; inspect before resuming.');}
 const id=`aob-luna-${randomBytes(5).toString('hex')}`;const network=`${id}-private`;const containers=[];let networkCreated=false;
 try{
 let state=existsSync(statePath)?json(statePath):{schema_version:1,mode:opts.mode,model:LUNA_MODEL,policy:CONTROLLED_POLICY,host:'linux',started_at:new Date().toISOString(),bridge_binary_sha256:binaryHash,implementation_sha256:implementationHash,max_requests_per_client:2,max_total_requests:10,slots:{},halted:false};
 if(state.mode!==opts.mode||state.bridge_binary_sha256!==binaryHash||state.implementation_sha256!==implementationHash)throw new QualificationError('Cannot resume with changed mode or binary.');
  if(!existsSync(statePath)&&opts.continueEvidence){
   const carried=prepareContinuation({priorStatePath:opts.continueEvidence,output,binaryHash,implementationHash,mockEvidencePath:opts.mockEvidence});
   state.slots.codex=carried.codexSlot;state.continuation=carried.receipt;
  }
  state.response_encoding_requested='identity';
  save(statePath,state);docker('network','create','--internal',network);networkCreated=true;
  let authFile=opts.authFile&&resolve(opts.authFile);
  if(opts.mode==='mock'){
   const jwt=body=>`${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from(JSON.stringify(body)).toString('base64url')}.synthetic`;
   authFile=join(output,'synthetic-auth.json');save(authFile,{auth_mode:'chatgpt',tokens:{id_token:jwt({}),access_token:jwt({exp:Math.floor(Date.now()/1000)+3600}),account_id:'aob-synthetic'}});
  }
  for(const client of clients){
   const tool=client.harness;if(!mayStartSlot(state,tool))continue;
   // Persist before any launch: resuming never resets a live allowance cap.
   state.slots[tool]={status:'started',image_id:client.image_id,version:client.version};save(statePath,state);
   const dir=join(output,tool);mkdirSync(dir,{mode:0o700});const workspace=join(dir,'workspace');mkdirSync(workspace,{mode:0o700});
   const bundle=join(dir,'bundle');prepareCodexBridge({authFile,output:bundle,accessTokenSnapshot:true,meterUrl:'http://127.0.0.1:3211'});
   const marker=`aob-native-${tool}-ok`;const key=readFileSync(join(bundle,'bridge-key'),'utf8').trim();
   const service=`${id}-${tool}-meter`,bridge=`${id}-${tool}-bridge`,native=`${id}-${tool}-client`;
   const eventsPath=join(dir,'events.jsonl');const observationsPath=join(dir,'observations.json');
   save(join(dir,'service.json'),{upstream:opts.mode==='live'?'https://chatgpt.com/backend-api/codex':'http://aob-fake:9000/backend',outPath:eventsPath,observationsPath,meterKey:readFileSync(join(bundle,'meter-key'),'utf8').trim(),bridgeKey:key,marker,runId:`s2-luna-${tool}`});
   const promptFile=join(dir,'prompt.txt');writeFileSync(promptFile,`Use exactly one shell tool call to run: printf '%s\\n' '${marker}' > bridge-smoke.txt && cat bridge-smoke.txt. After it returns, respond DONE only. Do not inspect other files or use other tools.\n`,{mode:0o600});
   const inv=getAdapter(tool).containerInvocation({workspaceDir:workspace,promptFile,model:LUNA_MODEL,proxyUrl:`http://${service}:3210`,condition:'pinned',timeoutS:120,env:{OPENROUTER_API_KEY:key}});
   for(const f of inv.setupFiles??[]){const rel=relative(workspace,f.path);if(rel==='..'||rel.startsWith('../')||isAbsolute(rel))throw new QualificationError('Adapter setup escaped workspace.');mkdirSync(dirname(f.path),{recursive:true,mode:0o700});writeFileSync(f.path,f.contents,{mode:0o600});}
   const local=[];let result={status:null};
   try{
    if(opts.mode==='mock'){
     const fixture=join(dir,'fixture');mkdirSync(fixture,{mode:0o700});writeFileSync(join(fixture,'current'),tool);
     const fake=`${id}-${tool}-fake`;containers.push(fake);local.push(fake);
     docker('run','-d','--pull=never','--name',fake,'--network',network,'--network-alias','aob-fake','-v',`${fixture}:/fixture`,'-v',`${ROOT}/plans/s2-evidence/codex-bridge/native-smoke/fake.py:/fake.py:ro`,clients.find(c=>c.harness==='hermes').image_id,'python','/fake.py');
    }
    containers.push(service);local.push(service);
    docker('run','-d','--pull=never','--name',service,'--user',`${process.getuid()}:${process.getgid()}`,'--network',network,'-v',`${ROOT}:${ROOT}:ro`,'-v',`${dir}:${dir}`,'-w',ROOT,NODE_IMAGE,'node','--experimental-strip-types','--no-warnings','--experimental-loader',join(ROOT,'scripts/ts-source-loader.mjs'),join(ROOT,'scripts/s2-codex-bridge-service.mjs'),join(dir,'service.json'));
    if(opts.mode==='live')docker('network','connect','bridge',service);
    containers.push(bridge);local.push(bridge);
    docker('run','-d','--pull=never','--name',bridge,'--network',`container:${service}`,'-v',`${binary}:/bridge:ro`,'-v',`${bundle}:${bundle}:ro`,GO_IMAGE,'/bridge','-config',join(bundle,'config.json'));
    let ready=false;
    const probe="const fs=require('node:fs');const s=JSON.parse(fs.readFileSync(process.argv[1]));fetch('http://127.0.0.1:3210/v1/models',{headers:{Authorization:'Bearer '+s.bridgeKey},signal:AbortSignal.timeout(1000)}).then(r=>r.json()).then(v=>{if(!v.data?.some(x=>x.id==='gpt-6-luna'))process.exitCode=1}).catch(()=>process.exitCode=1)";
    for(let n=0;n<40;n++){if(command(['docker','exec',service,'node','-e',probe,join(dir,'service.json')],{check:false,timeout:3000}).status===0){ready=true;break;}await sleep(250);}
    if(!ready)throw new QualificationError('Bridge readiness failed before native invocation.');
    const envPath=join(dir,'native.env');writeFileSync(envPath,Object.entries(inv.env).map(([k,v])=>`${k}=${v.replaceAll(workspace,'/work/workspace')}`).join('\n'),{mode:0o600});
    containers.push(native);local.push(native);
    const args=['docker','run','--pull=never','--name',native,'--network',network,'--cpus','2','--memory','8g','--pids-limit','512','--env-file',envPath,'-v',`${workspace}:/work/workspace`,'-w','/work/workspace',...(inv.user?['--user',inv.user]:[]),client.image_id,...inv.argv];
    result=command(args,{check:false,timeout:120000});
    writeFileSync(join(dir,'stdout.log'),result.stdout??'',{mode:0o600});writeFileSync(join(dir,'stderr.log'),result.stderr??'',{mode:0o600});
   }catch(error){state.slots[tool].local_error=error instanceof QualificationError?error.message:'Local qualification failed; inspect private artifacts.';}
   finally{
    command(['docker','rm','-f',native],{check:false});
    command(['docker','stop','--time','5',bridge],{check:false});
    command(['docker','stop','--time','15',service],{check:false});
    for(const name of local){const log=command(['docker','logs',name],{check:false});writeFileSync(join(dir,`${name}.log`),(log.stdout??'')+(log.stderr??''),{mode:0o600});command(['docker','rm','-f',name],{check:false});}
    // Snapshot credentials are deliberately non-renewable and short lived.
    state.slots[tool].config_sha256=hash(join(bundle,'config.json'));rmSync(bundle,{recursive:true,force:true});rmSync(join(dir,'service.json'),{force:true});
   }
   const events=readEvents(eventsPath);const observations=existsSync(observationsPath)?json(observationsPath):null;
   const markerPath=join(workspace,'bridge-smoke.txt');const markerMatches=existsSync(markerPath)&&lstatSync(markerPath).isFile()&&!lstatSync(markerPath).isSymbolicLink()&&readFileSync(markerPath,'utf8').trim()===marker;
   const summary=summarizeQualification({events,exit:result.status??124,markerMatches,observations});
   Object.assign(state.slots[tool],summary,{status:summary.passed?'passed':'failed',c1_sha256:existsSync(eventsPath)?hash(eventsPath):null,condition_evidence_sha256:existsSync(observationsPath)?hash(observationsPath):null});
   // Any unsuccessful live slot requires investigation, never an automatic replacement.
   if(!summary.passed)state.halted=true;
   save(statePath,state);process.stdout.write(`${tool}: ${summary.passed?'passed':'failed'}; provider requests ${summary.provider_requests}\n`);
   if(state.halted)break;
  }
  state.completed_at=new Date().toISOString();state.all_five_passed=clients.every(c=>state.slots[c.harness]?.status==='passed');state.all_five_native_loops_completed=clients.every(c=>{const slot=state.slots[c.harness];return slot?.exit===0&&slot.marker_matches&&slot.tool_result_observed&&slot.provider_requests===2&&slot.statuses?.length===2&&slot.statuses.every(status=>status===200)&&slot.served_models.every(model=>model===LUNA_MODEL||model===null);});save(statePath,state);
  if(!state.all_five_passed)process.exitCode=1;
 }finally{
  for(const name of containers)command(['docker','rm','-f',name],{check:false});
  if(networkCreated)command(['docker','network','rm',network],{check:false});
  closeSync(lockFd);rmSync(lock,{force:true});
 }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main(parseOptions(process.argv.slice(2))).catch(error=>{process.stderr.write(`${error instanceof QualificationError?error.message:'Qualification failed; inspect private output.'}\n`);process.exitCode=1;});
