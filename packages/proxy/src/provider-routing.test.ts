import { createServer } from 'node:http';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { startProxy } from './proxy.js';
import { validateC1Event } from '@aob/contracts';

it('merges runner exclusions across all three model protocols without changing model or prompt', async () => {
  const received: unknown[] = [];
  const receivedRaw: string[] = [];
  const upstream = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const raw = Buffer.concat(chunks).toString();
    receivedRaw.push(raw); received.push(JSON.parse(raw));
    res.setHeader('content-type', 'application/json');
    res.end('{}');
  });
  await new Promise<void>(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const address = upstream.address();
  if (!address || typeof address === 'string') throw new Error('No upstream address');
  const outPath = join(await mkdtemp(join(tmpdir(), 'aob-routing-')), 'events.jsonl');
  const proxy = await startProxy({run_id:'routing',upstream:`http://127.0.0.1:${address.port}`,outPath,ignoredProviders:['relace']});
  try {
    const body = {model:'z-ai/glm-5.3-flash',messages:[{role:'user',content:'Keep 😀 exactly.'}],provider:{ignore:['other'],sort:'latency'},max_tokens:256};
    for (const path of ['/v1/messages?beta=true','/v1/chat/completions','/v1/responses']) {
      const r = await fetch(proxy.baseUrl + path, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
      expect(r.status).toBe(200); await r.text();
    }
    expect(received).toEqual(Array.from({length:3}, () => ({...body,provider:{ignore:['other','relace'],sort:'latency'}})));
    await proxy.flush();
    const events = (await readFile(outPath,'utf8')).trim().split('\n').map(x=>validateC1Event(JSON.parse(x)));
    expect(events).toHaveLength(3);
    for (const e of events) {
      expect(e.model_requested).toBe(body.model);
      expect(e.t_req_start).toBeLessThanOrEqual(e.t_req_body_end);
      expect(e.t_req_body_end).toBeLessThanOrEqual(e.t_upstream_sent);
    }
    for (const invalid of ['[]','{',JSON.stringify({...body,provider:{ignore:'relace'}}),'{"provider":"first","provider":{}}','{"provider":{"ignore":[],"ignore":[]}}']) {
      const r = await fetch(proxy.baseUrl+'/v1/messages',{method:'POST',body:invalid});
      expect(r.status).toBe(400); await r.text();
    }
    const compressed = await fetch(proxy.baseUrl+'/v1/messages',{method:'POST',headers:{'content-encoding':'gzip'},body:'encoded'});
    expect(compressed.status).toBe(400); await compressed.text();
    const big = await fetch(proxy.baseUrl+'/v1/messages',{method:'POST',body:' '.repeat(16*1024*1024+1)});
    expect(big.status).toBe(413); await big.text();
    expect(received).toHaveLength(3);
    const exact = '{"model":"m","seed":9007199254740993,"large":1e400,"provider":{"weight":9007199254740993,"ignore":["other"]}}';
    const exactResponse = await fetch(proxy.baseUrl+'/v1/messages',{method:'POST',body:exact});
    expect(exactResponse.status).toBe(200); await exactResponse.text();
    expect(receivedRaw.at(-1)).toBe(exact.replace('["other"]','["other","relace"]'));
    const invalidUtf8 = Buffer.concat([Buffer.from('{"model":"m","prompt":"'),Buffer.from([255]),Buffer.from('"}')]);
    const invalidResponse = await fetch(proxy.baseUrl+'/v1/messages',{method:'POST',body:invalidUtf8});
    expect(invalidResponse.status).toBe(400); await invalidResponse.text();
    expect(received).toHaveLength(4);
  } finally {
    await proxy.close();
    upstream.closeAllConnections();
    await new Promise<void>(resolve=>upstream.close(()=>resolve()));
  }
});

it('enforces a single endpoint without fallbacks on every protocol and refuses exclusion conflicts', async () => {
  const received: string[] = [];
  const upstream = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    received.push(Buffer.concat(chunks).toString()); res.end('{}');
  });
  await new Promise<void>(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const address = upstream.address();
  if (!address || typeof address === 'string') throw new Error('No upstream address');
  const outPath = join(await mkdtemp(join(tmpdir(), 'aob-pin-')), 'events.jsonl');
  const proxy = await startProxy({run_id:'pin',upstream:`http://127.0.0.1:${address.port}`,outPath,onlyProvider:'z-ai/fp8'});
  try {
    for (const path of ['/v1/messages','/v1/chat/completions','/v1/responses']) {
      const body = '{"model":"m","seed":9007199254740993,"provider":{"only":["other"],"allow_fallbacks":true,"sort":"latency"}}';
      const r = await fetch(proxy.baseUrl+path,{method:'POST',body});
      expect(r.status).toBe(200); await r.text();
      expect(received.at(-1)).toBe('{"model":"m","seed":9007199254740993,"provider":{"only":["z-ai/fp8"],"allow_fallbacks":false,"sort":"latency"}}');
    }
    for (const body of ['{"provider":{"ignore":["z-ai"]}}','{"provider":{"ignore":["z-ai/fp8"]}}','{"provider":{"only":[],"only":[]}}','{"provider":{"allow_fallbacks":true,"allow_fallbacks":false}}']) {
      const r = await fetch(proxy.baseUrl+'/v1/messages',{method:'POST',body});
      expect(r.status).toBe(400); await r.text();
    }
    expect(received).toHaveLength(3);
  } finally {
    await proxy.close(); upstream.closeAllConnections();
    await new Promise<void>(resolve=>upstream.close(()=>resolve()));
  }
});
