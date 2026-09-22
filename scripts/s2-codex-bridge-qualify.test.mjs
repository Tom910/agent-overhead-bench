import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeQualification, mayStartSlot, parseOptions, verifyMockEvidence, qualificationPrompt } from './s2-codex-bridge-qualify.mjs';
const event = { method:'POST', protocol:'openai_responses', t_upstream_sent:1, status:200, error:null, model_requested:'gpt-6-luna', model_served:'gpt-6-luna', usage:{input:100,cached_input:40,output:30,reasoning_output:10} };
const summarize = (events=[event,event], extra={}) => summarizeQualification({ events, exit:0, markerMatches:true, observations:{requests:[{accepted:true,tool_result_observed:false},{accepted:true,tool_result_observed:true}]}, ...extra });
test('strict qualification totals canonical usage once and leaves subscription cost unknown',()=>{
 const result=summarize(); assert.equal(result.passed,true); assert.equal(result.provider_requests,2); assert.deepEqual(result.tokens,{input:200,cached_input:80,output:60,reasoning_output:20}); assert.equal(result.subscription_cost_usd,null);
});
test('missing served identity or usage keeps actual requests and refuses qualification',()=>{
 for(const change of [{model_served:null},{model_served:'other'},{usage:null},{status:401},{error:{kind:'network'}}]) { const r=summarize([event,{...event,...change}]); assert.equal(r.passed,false); assert.equal(r.provider_requests,2); }
 assert.equal(summarize([event,{...event,usage:null}]).tokens,null);
});
test('native side effect, returned tool output and successful exit are all required',()=>{
 for(const extra of [{exit:1},{markerMatches:false},{observations:{requests:[{accepted:true,tool_result_observed:false}]}}]) assert.equal(summarize(undefined,extra).passed,false);
});
test('pre-forward refusal cannot be reported as provider consumption or success',()=>{
 const r=summarize([event,{...event,t_upstream_sent:0,status:429,error:{kind:'proxy_refused'}}]); assert.equal(r.provider_requests,1); assert.equal(r.passed,false);
});
test('started or completed slots never get restarted and halted campaign stays halted',()=>{
 assert.equal(mayStartSlot({slots:{}},'pi'),true);
 for(const status of ['started','passed','failed']) assert.equal(mayStartSlot({slots:{pi:{status}}},'pi'),false);
 assert.equal(mayStartSlot({halted:true,slots:{}},'pi'),false);
});
test('live is explicit and does not allow an arbitrary provider URL or missing auth',()=>{
 assert.throws(()=>parseOptions(['--mode','live','--output','/tmp/q','--bridge','/tmp/b']));
 assert.throws(()=>parseOptions(['--upstream','https://example.com']));
 assert.throws(()=>parseOptions(['--mode','mock','--auth-file','/tmp/auth','--output','/tmp/q','--bridge','/tmp/b']));
 assert.equal(parseOptions(['--output','/tmp/q','--bridge','/tmp/b']).mode,'mock');
});

test('live admission binds successful mock evidence to binary, implementation and policy',()=>{
 const proof={mode:'mock',all_five_passed:true,bridge_binary_sha256:'binary',implementation_sha256:'source',policy:'luna-low-reasoning-replay-disabled'};
 assert.doesNotThrow(()=>verifyMockEvidence(proof,'binary','source'));
 for(const change of [{mode:'live'},{all_five_passed:false},{bridge_binary_sha256:'other'},{implementation_sha256:'other'},{policy:'native'}]) assert.throws(()=>verifyMockEvidence({...proof,...change},'binary','source'));
});

test('unexpected protocol requests stay counted and fail qualification',()=>{
 const r=summarize([event,event,{...event,protocol:'openai_chat'}]);assert.equal(r.passed,false);assert.equal(r.provider_requests,3);assert.equal(r.tokens.input,300);
});

test('native qualification uses an absolute marker path regardless of shell default directory',()=>{
 const prompt=qualificationPrompt('aob-native-hermes-ok');
 assert.ok(prompt.includes("> /work/workspace/bridge-smoke.txt && cat /work/workspace/bridge-smoke.txt"));
 assert.ok(prompt.includes("'aob-native-hermes-ok'"));
 assert.throws(()=>qualificationPrompt("bad' marker"));
});
