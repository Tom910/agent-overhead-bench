import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, cpSync, rmSync, symlinkSync, readlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { register } from 'node:module';
register('./ts-source-loader.mjs',import.meta.url);
const {prepareCandidateBaseline,releaseCandidateBaseline,captureCandidate,bindCandidateToRun}=await import('../packages/runner/src/candidate-evidence.ts');
const {createNoSolutionProof,validateNoSolutionProof,NoSolutionProofError}=await import('./s7-luna-no-solution.mjs');
const helper='sha256:0e765789f08663ae455e14cf8a2db1186969310e59d5d55650b762e3d8789ddf';
function fixture(t){
 const root=mkdtempSync(join(tmpdir(),'aob-empty-proof-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const taskDir=join(root,'task'),cellDir=join(root,'cell'),workspace=join(taskDir,'workspace');mkdirSync(workspace,{recursive:true});mkdirSync(cellDir);
 writeFileSync(join(workspace,'source.txt'),'original\n');writeFileSync(join(workspace,'.gitignore'),'node_modules/\n');
 const base='a'.repeat(40),agent='sha256:'+'b'.repeat(64),image='sha256:'+'c'.repeat(64),revision='d'.repeat(40);
 writeFileSync(join(taskDir,'task.yaml'),`id: ink-grid-box-layout\nsource:\n  kind: public-task-pack\n  repository: https://github.com/datacurve-ai/deep-swe.git\n  revision: ${revision}\n  task_id: ink-grid-box-layout\n  license_notes: fixture\n  base_revision: ${base}\nlanguage: typescript\nsize: small\nshape: feature\ntimeout_s: 10800\nexpected_minutes: [16, 180]\ndescription: fixture\n`);
 const verifier={kind:'docker-command',image:'fixture-verifier:pin',image_digest:image,command:['sh','-c','test -s /tmp/logs/artifacts/model.patch'],workdir:'.',network:'none'};
 for(const dir of[taskDir,cellDir])writeFileSync(join(dir,'verifier.json'),JSON.stringify(verifier));
 writeFileSync(join(taskDir,'environment.json'),JSON.stringify({agent_images:{codex:{image:'fixture-agent:pin',image_digest:agent}}}));
 const candidate=join(root,'candidate');cpSync(workspace,candidate,{recursive:true});mkdirSync(join(candidate,'node_modules'));symlinkSync('/app/node_modules/example',join(candidate,'node_modules/example'));
 const baseline=prepareCandidateBaseline(workspace);assert.equal(baseline.status,'ready');
 const evidence=captureCandidate({dir:cellDir,workspace:candidate,baseline,runId:'fixture-run',taskId:'ink-grid-box-layout',baseRevision:base,taskRevision:revision,agentImage:agent,verifierImage:image});releaseCandidateBaseline(baseline);
 const run={run_id:'fixture-run',task_id:'ink-grid-box-layout',tool:'codex',model:'gpt-6-luna',task_revision:revision,task_base_revision:base,outcome:'verify_error',adapter_result:{exitCode:0},verification:{exit:1},task_environment:{agent_image_digest:agent},container:{verifier_image_digest:image}};
 const runBytes=Buffer.from(JSON.stringify(run));writeFileSync(join(cellDir,'run.json'),runBytes);writeFileSync(join(cellDir,'verify.log'),'');bindCandidateToRun(cellDir,evidence,runBytes);
 let calls=0;const runtime={capture:async({image:actual,workspace:restored,outputDir})=>{calls++;assert.equal(actual,image);assert.equal(readFileSync(join(restored,'source.txt'),'utf8'),'original\n');assert.equal(readlinkSync(join(restored,'node_modules/example')),'/app/node_modules/example');writeFileSync(join(outputDir,'model.patch'),'');return{exitCode:0,helperSha256:helper,baseRevision:base};}};
 return{root,cellDir,taskDir,workspace,run,runtime,calls:()=>calls};
}

test('reconstructs retained ignored links against exact prepared projection without changing originals',async t=>{
 const f=fixture(t),before=['run.json','candidate.patch','candidate-evidence.json','verify.log'].map(n=>readFileSync(join(f.cellDir,n)));
 const proof=await createNoSolutionProof(f,f.runtime);assert.equal(f.calls(),1);assert.equal(proof.kind,'verifier-empty-patch-proof');assert.equal(proof.model_patch_bytes,0);assert(proof.candidate_patch_bytes>0);assert.equal(proof.capture_exit,0);assert.equal(proof.network,'none');assert.equal(validateNoSolutionProof({...f,proof}),proof);
 for(const[i,n]of['run.json','candidate.patch','candidate-evidence.json','verify.log'].entries())assert.deepEqual(readFileSync(join(f.cellDir,n)),before[i]);
});
test('nonempty capture, failed helper, wrong helper and wrong immutable base cannot prove no solution',async t=>{
 for(const change of['nonempty','exit','helper','base']){const f=fixture(t);await assert.rejects(createNoSolutionProof(f,{capture:async input=>{const result=await f.runtime.capture(input);if(change==='nonempty')writeFileSync(join(input.outputDir,'model.patch'),'actual source diff');if(change==='exit')result.exitCode=1;if(change==='helper')result.helperSha256='sha256:'+'e'.repeat(64);if(change==='base')result.baseRevision='f'.repeat(40);return result;}}),NoSolutionProofError);}
});
test('changed prepared baseline or exclusion list refuses before executing capture',async t=>{
 for(const change of['tree','exclusions']){const f=fixture(t);if(change==='tree')writeFileSync(join(f.workspace,'source.txt'),'changed\n');else{const path=join(f.cellDir,'candidate-evidence.json'),e=JSON.parse(readFileSync(path));e.excluded_root_paths=[];writeFileSync(path,JSON.stringify(e));}await assert.rejects(createNoSolutionProof(f,f.runtime),NoSolutionProofError);assert.equal(f.calls(),0);}
});
test('missing log gate, changed patch, unavailable evidence and image drift fail closed',async t=>{
 for(const change of['log','patch','unavailable','image']){const f=fixture(t);if(change==='log')writeFileSync(join(f.cellDir,'verify.log'),'unexplained failure');if(change==='patch')writeFileSync(join(f.cellDir,'candidate.patch'),'forged');if(change==='unavailable'){const p=join(f.cellDir,'candidate-evidence.json'),e=JSON.parse(readFileSync(p));e.status='unavailable';writeFileSync(p,JSON.stringify(e));}if(change==='image'){const p=join(f.taskDir,'verifier.json'),e=JSON.parse(readFileSync(p));e.image_digest='sha256:'+'e'.repeat(64);writeFileSync(p,JSON.stringify(e));}await assert.rejects(createNoSolutionProof(f,f.runtime),NoSolutionProofError);assert.equal(f.calls(),0);}
});
test('receipt validation binds exact artifacts and forbids changed capture claims',async t=>{
 const f=fixture(t),proof=await createNoSolutionProof(f,f.runtime);
 for(const change of[{capture_exit:1},{model_patch_bytes:1},{network:'bridge'},{run_id:'other'},{capture_helper_sha256:'sha256:'+'e'.repeat(64)}])assert.throws(()=>validateNoSolutionProof({...f,proof:{...proof,...change}}),NoSolutionProofError);
 writeFileSync(join(f.cellDir,'candidate.patch'),'changed after proof');assert.throws(()=>validateNoSolutionProof({...f,proof}),NoSolutionProofError);
});
