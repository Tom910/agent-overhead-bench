import json,subprocess,pathlib,hashlib,os,time,argparse,uuid
sha=lambda b:'sha256:'+hashlib.sha256(b).hexdigest()
def command(args,**kw):
 return subprocess.run(args,check=True,capture_output=True,**kw).stdout
SHELL='''set -eu
cp /opt/aob-verifier-config.json /tmp/aob-verifier-config.json
mkdir -p /tmp/logs/artifacts /tmp/logs/verifier
git clone --quiet --no-hardlinks /app /work/workspace
if [ -d /app/node_modules ]; then ln -s /app/node_modules /work/workspace/node_modules; fi
export PYTHONPATH=/work/workspace/src:/work/workspace/tests/tests_helpers:/work/workspace/tests
python3 -c "import json,subprocess; p='/tmp/aob-verifier-config.json'; d=json.load(open(p)); d['base_commit']=subprocess.check_output(['git','-C','/work/workspace','rev-parse','HEAD'],text=True).strip(); json.dump(d,open(p,'w'))"
cp /input/model.patch /tmp/logs/artifacts/model.patch
set +e
bash /tests/test.sh
rc=$?
set -e
cp -a /tmp/logs/verifier/. /output/
exit "$rc"
'''
def run(image,patch,dest,amended_patch=None):
 dest=pathlib.Path(dest).resolve();dest.mkdir(parents=True,exist_ok=False)
 name='aob-audit-'+uuid.uuid4().hex
 (dest/'model.patch').write_bytes(patch)
 logs=dest/'logs';logs.mkdir(); workspace=dest/'workspace';workspace.mkdir()
 # Clone destination must not exist: mount its parent, not the leaf.
 args=['docker','run','--name',name,'--rm','--pull=never','--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--cpus','2','--memory','4g','--pids-limit','512','--tmpfs','/tmp:rw,noexec,nosuid,nodev,size=256m','--user',f'{os.getuid()}:{os.getgid()}', '-v',f'{workspace}:/work','-v',f'{logs}:/output','-v',f'{dest}/model.patch:/input/model.patch:ro']
 if amended_patch:args+=['-v',f'{pathlib.Path(amended_patch).resolve()}:/tests/test.patch:ro']
 args+=['--entrypoint','sh',image,'-c',SHELL]
 started=time.monotonic()
 try:
  r=subprocess.run(args,capture_output=True,timeout=240)
  (dest/'stdout.log').write_bytes(r.stdout);(dest/'stderr.log').write_bytes(r.stderr)
  grade=json.loads((logs/'reward.json').read_text()) if (logs/'reward.json').exists() else None
  result={'image':image,'amended_test_patch_sha256':sha(pathlib.Path(amended_patch).read_bytes()) if amended_patch else None,'exit_code':r.returncode,'seconds':time.monotonic()-started,'patch_sha256':sha(patch),'stdout_sha256':sha(r.stdout),'stderr_sha256':sha(r.stderr),'grade':grade}
 except subprocess.TimeoutExpired:
  subprocess.run(['docker','rm','-f',name],capture_output=True,timeout=15)
  result={'image':image,'amended_test_patch_sha256':sha(pathlib.Path(amended_patch).read_bytes()) if amended_patch else None,'error':'timeout'}
 (dest/'result.json').write_text(json.dumps(result,indent=2));print(json.dumps(result),flush=True)
 return result
if __name__=='__main__':
 parser=argparse.ArgumentParser(description='Offline verification only; never starts an agent or model client.')
 parser.add_argument('--image',required=True)
 parser.add_argument('--patch',required=True)
 parser.add_argument('--output',required=True)
 parser.add_argument('--amended-test-patch')
 args=parser.parse_args()
 if not (args.image.startswith('sha256:') and len(args.image)==71 and all(c in '0123456789abcdef' for c in args.image[7:])):
  parser.error('an immutable local sha256 image ID is required')
 result=run(args.image,pathlib.Path(args.patch).read_bytes(),args.output,args.amended_test_patch)
 if result.get('grade') is None or result.get('exit_code')!=0:raise SystemExit(2)
