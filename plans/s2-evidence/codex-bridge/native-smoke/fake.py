import json,time,pathlib,threading
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
root=pathlib.Path('/fixture')
counts={}
class Handler(BaseHTTPRequestHandler):
 def log_message(self,*args): pass
 def do_GET(self):
  data=json.dumps({'object':'list','data':[{'id':'gpt-6-luna','object':'model','created':0,'owned_by':'fixture'}]}).encode();self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(data)
 def do_POST(self):
  n=int(self.headers.get('Content-Length','0')); body=json.loads(self.rfile.read(n));tool=(root/'current').read_text().strip();counts[tool]=counts.get(tool,0)+1;idx=counts[tool]
  log=root/tool;log.mkdir(exist_ok=True)
  (log/f'request-{idx}.json').write_text(json.dumps({'path':self.path,'body':body},indent=2))
  if idx>5:self.send_error(429,'fixture request bound');return
  inputs=body.get('input',[]);results=[x for x in inputs if isinstance(x,dict) and x.get('type') in ('function_call_output','custom_tool_call_output')]
  marker=f'aob-native-{tool}-ok'; command=f'printf {marker} > /work/workspace/bridge-smoke.txt; cat /work/workspace/bridge-smoke.txt'
  tools=body.get('tools',[]); names={x.get('name'):x for x in tools}
  if not results:
   selected=next((x for x in ['exec_command','execute_command','terminal','bash','run_shell_command','shell_command','shell','run_commands'] if x in names),None)
   if not selected:
    (log/'fixture-error.txt').write_text('No recognized shell tool. '+repr(list(names)));self.send_error(422,'no known native tool');return
   props=names[selected].get('parameters',{}).get('properties',{})
   args={'commands':[command]} if selected=='run_commands' else {'cmd':command} if 'cmd' in props else {'command':["sh","-c",command]} if selected=='shell' else {'command':command}
   if 'requires_approval' in props:args['requires_approval']=False
   if 'is_background' in props:args['is_background']=False
   if 'description' in props:args['description']='Offline bridge native tool probe'
   if 'timeout_ms' in props:args['timeout_ms']=1000
   if 'workdir' in props:args['workdir']='/work/workspace'
   if 'yield_time_ms' in props:args['yield_time_ms']=1000
   output={'id':'fc_fixture_'+tool,'type':'function_call','status':'completed','call_id':'call_fixture_'+tool,'name':selected,'arguments':json.dumps(args)}
  else:
   ok=any(marker in json.dumps(x) for x in results)
   (log/'tool-result.json').write_text(json.dumps({'observed':ok,'results':results},indent=2))
   text='Offline native bridge tool probe complete.' if ok else 'Native tool output did not contain expected marker.'
   output={'id':'msg_fixture_'+tool,'type':'message','status':'completed','role':'assistant','content':[{'type':'output_text','text':text,'annotations':[]}]}
  response={'id':'resp_fixture_'+tool+'_'+str(idx),'object':'response','created_at':int(time.time()),'status':'in_progress','model':'gpt-6-luna','output':[]}
  self.send_response(200);self.send_header('Content-Type','text/event-stream');self.send_header('Cache-Control','no-cache');self.end_headers()
  def emit(kind,**kwargs):
   data={'type':kind,**kwargs};self.wfile.write(('event: '+kind+'\ndata: '+json.dumps(data)+'\n\n').encode());self.wfile.flush()
  emit('response.created',response=response);emit('response.in_progress',response=response)
  added={**output,'status':'in_progress'}
  if output['type']=='function_call':added['arguments']=''
  else:added['content']=[]
  emit('response.output_item.added',output_index=0,item=added)
  if output['type']=='function_call':
   a=output['arguments'];mid=len(a)//2
   for part in [a[:mid],a[mid:]]:emit('response.function_call_arguments.delta',item_id=output['id'],output_index=0,delta=part)
   emit('response.function_call_arguments.done',item_id=output['id'],output_index=0,arguments=a)
  else:
   part=output['content'][0];emit('response.content_part.added',item_id=output['id'],output_index=0,content_index=0,part={**part,'text':''});emit('response.output_text.delta',item_id=output['id'],output_index=0,content_index=0,delta=part['text']);emit('response.output_text.done',item_id=output['id'],output_index=0,content_index=0,text=part['text']);emit('response.content_part.done',item_id=output['id'],output_index=0,content_index=0,part=part)
  emit('response.output_item.done',output_index=0,item=output)
  response.update(status='completed',output=[output],usage={'input_tokens':100,'output_tokens':30,'total_tokens':130,'input_tokens_details':{'cached_tokens':40},'output_tokens_details':{'reasoning_tokens':10}})
  emit('response.completed',response=response)
ThreadingHTTPServer(('0.0.0.0',9000),Handler).serve_forever()
