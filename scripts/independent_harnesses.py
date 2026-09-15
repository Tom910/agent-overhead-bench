#!/usr/bin/env python3
"""Durable operational scheduling around unchanged C1-C4 single-cell runs."""
import argparse
import datetime
from concurrent.futures import Future
import fcntl
import hashlib
import json
import math
import os
from pathlib import Path
import platform
import re
import signal
import subprocess
import time
import threading
import urllib.error
import urllib.request


GUARD_CHECK_TIMEOUT_S = 45


class ConfigurationError(Exception):
    pass


class CellFailure(Exception):
    pass


class BudgetStop(Exception):
    pass


def utc():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def atomic(path, value):
    temporary = path.with_suffix('.tmp')
    with temporary.open('w') as stream:
        json.dump(value, stream, indent=2)
        stream.write('\n')
        stream.flush()
        os.fsync(stream.fileno())
    temporary.replace(path)


def digest(path):
    with Path(path).open('rb') as stream:
        if hasattr(hashlib, 'file_digest'):
            digest_hex = hashlib.file_digest(stream, 'sha256').hexdigest()
        else:
            hasher = hashlib.sha256()
            for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                hasher.update(chunk)
            digest_hex = hasher.hexdigest()
        return 'sha256:' + digest_hex


def checked_balance(balance):
    try:
        remaining = balance()
        if not math.isfinite(remaining) or remaining <= 0.10:
            raise BudgetStop('Available credit reached the $0.10 stop margin')
        return remaining
    except BudgetStop:
        raise
    except Exception as error:
        raise BudgetStop('Provider balance unavailable: ' + type(error).__name__) from error


def read_account_metadata(request: urllib.request.Request) -> dict:
    """Retry transient metadata GET failures within the outer guard deadline."""
    if request.get_method() != 'GET':
        raise ConfigurationError('Account metadata reader requires GET')
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=5) as response:
                envelope = json.load(response)
            if not isinstance(envelope, dict) or not isinstance(envelope.get('data'), dict):
                raise BudgetStop('Malformed account metadata envelope')
            return envelope['data']
        except urllib.error.HTTPError as error:
            try:
                error.close()
            except Exception:
                pass
            if error.code != 429 and not 500 <= error.code < 600:
                raise BudgetStop('Account metadata HTTP ' + str(error.code)) from error
            if attempt == 2:
                raise BudgetStop('Account metadata unavailable after three attempts') from error
        except (urllib.error.URLError, TimeoutError) as error:
            if attempt == 2:
                raise BudgetStop('Account metadata unavailable after three attempts') from error
        except (ValueError, UnicodeError) as error:
            raise BudgetStop('Malformed account metadata JSON') from error
        time.sleep(0.25)
    raise AssertionError('Account metadata retry loop exhausted without a result')


class CreditMonitor:
    """Read only newly completed C1 lines; never scrape CLI text for credit errors."""
    def __init__(self, job):
        self.root = Path(job['out']) / 'results'
        self.expected_model = job.get('expected_model')
        if self.expected_model is not None and (not isinstance(self.expected_model, str) or not self.expected_model.strip() or self.expected_model == 'unknown'):
            raise ConfigurationError('Invalid expected model for response supervision')
        self.offsets = {}

    def check(self, final=False):
        try:
            for path in self.root.glob('*/*/*/rep-*/events.jsonl'):
                offset = self.offsets.get(path, 0)
                if path.stat().st_size < offset:
                    raise BudgetStop('C1 credit-monitor evidence was truncated')
                with path.open('rb') as stream:
                    stream.seek(offset)
                    while True:
                        line = stream.readline(1024 * 1024 + 1)
                        if not line:
                            break
                        if len(line) > 1024 * 1024:
                            raise BudgetStop('C1 credit-monitor line exceeds size bound')
                        if not line.endswith(b'\n'):
                            if final:
                                raise BudgetStop('Incomplete final C1 credit-monitor evidence')
                            break
                        event = json.loads(line)
                        if not isinstance(event, dict):
                            raise BudgetStop('Malformed C1 credit-monitor evidence')
                        self.offsets[path] = stream.tell()
                        if event.get('status') == 402 and event.get('method') == 'POST' and event.get('protocol') in ('openai_chat', 'openai_responses', 'anthropic_messages'):
                            raise BudgetStop('Provider HTTP 402: credit unavailable for model request')
                        if self.expected_model is not None and event.get('method') == 'POST' and event.get('protocol') in ('openai_chat', 'openai_responses', 'anthropic_messages') and isinstance(event.get('status'), int) and 200 <= event['status'] < 300:
                            if event.get('model_requested') != self.expected_model or event.get('model_served') != self.expected_model:
                                raise BudgetStop('Successful response model identity missing or different; stopping before further spending')
        except (OSError, ValueError) as error:
            raise BudgetStop('C1 credit-monitor evidence unavailable: ' + type(error).__name__) from error


def record_stop(root, job, reason):
    atomic(Path(root) / 'stop.json', {'at': utc(), 'job': job['id'], 'reason': reason})


def checked_power(system=None, power_supply_root=Path('/sys/class/power_supply')):
    system = platform.system() if system is None else system
    if system not in ('Darwin', 'Linux'):
        raise ConfigurationError('Unsupported power-check platform: ' + system)
    try:
        if system == 'Darwin':
            if 'AC Power' not in subprocess.check_output(['pmset', '-g', 'batt'], text=True, timeout=10):
                raise BudgetStop('AC power disconnected')
            return

        def attribute(supply, name, default=None):
            try:
                return (supply / name).read_text(encoding='ascii').strip()
            except FileNotFoundError:
                if default is None:
                    raise
                return default

        external_types = ('Mains', 'UPS', 'Wireless', 'USB', 'USB_DCP', 'USB_CDP',
                          'USB_ACA', 'USB_C', 'USB_PD', 'USB_PD_DRP', 'BrickID')
        battery_present = False
        external_online = False
        # Enumerating, rather than globbing, makes missing/unreadable sysfs fatal.
        for supply in sorted(Path(power_supply_root).iterdir()):
            scope = attribute(supply, 'scope', 'Unknown')
            if scope not in ('Unknown', 'System', 'Device'):
                raise BudgetStop('Malformed power supply scope')
            if scope == 'Device':
                continue
            kind = attribute(supply, 'type')
            if kind == 'Battery':
                present = attribute(supply, 'present', '1')
                if present not in ('0', '1'):
                    raise BudgetStop('Malformed battery presence')
                battery_present = battery_present or present == '1'
            elif kind in external_types:
                online = attribute(supply, 'online')
                if online not in ('0', '1', '2'):
                    raise BudgetStop('Malformed external power state')
                external_online = external_online or online in ('1', '2')
            else:
                raise BudgetStop('Unsupported or malformed power supply type')
        if battery_present and not external_online:
            raise BudgetStop('External power disconnected with a system battery present')
    except (OSError, UnicodeError, subprocess.SubprocessError) as error:
        raise BudgetStop('Power status unavailable: ' + type(error).__name__) from error


def confirm_quiescent(job):
    process_path = Path(job['out']) / 'process.json'
    if not process_path.exists():
        if 'argv' in job and Path(job['out']).exists():
            raise ConfigurationError('Interrupted launch lacks process identity; reconcile before resuming')
        return
    pid = json.loads(process_path.read_text())['pid']
    if not isinstance(pid, int) or pid <= 1:
        raise ConfigurationError('Invalid retained child PID')
    command = subprocess.run(['ps', '-p', str(pid), '-o', 'command='], capture_output=True, text=True, timeout=10).stdout
    if str(job['out']) in command:
        raise ConfigurationError('Previous paid child still running; reconcile before resuming')
    try:
        os.killpg(pid, 0)
    except ProcessLookupError:
        pass
    else:
        raise ConfigurationError('Previous process group still exists; reconcile before resuming')
    prefix = re.compile(r'aob-(?:relay-|net-)?' + str(pid) + r'-[0-9]+$')
    for command in (['docker', 'ps', '-a', '--format', '{{.Names}}'], ['docker', 'network', 'ls', '--format', '{{.Name}}']):
        result = subprocess.run(command, capture_output=True, text=True, timeout=20)
        if result.returncode != 0:
            raise ConfigurationError('Docker resource status unavailable; cannot resume')
        if any(prefix.fullmatch(name.strip()) for name in result.stdout.splitlines()):
            raise ConfigurationError('Owned Docker resource remains; reconcile before resuming')


def supervision_gap(previous_wall, previous_mono, wall, mono):
    return wall - previous_wall > 60 or mono - previous_mono > 60 or wall < previous_wall - 5


def infrastructure_failure(result):
    return result['status'] == 'failed' and result.get('outcome') not in ('completed', 'verify_error', 'timeout')


def schedule(root, jobs, balance, run_job, *, acknowledge_stop=False):
    root = Path(root)
    root.mkdir(parents=True, exist_ok=True)
    with (root / 'scheduler.lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as error:
            raise ConfigurationError('Another scheduler owns this index') from error
        stop_path = root / 'stop.json'
        stopped = stop_path.exists()
        if stopped and not acknowledge_stop:
            raise BudgetStop('Scheduler paused; review stop.json and explicitly acknowledge the stop')
        path = root / 'index.json'
        state = json.loads(path.read_text()) if path.exists() else {'version': 1, 'jobs': {}}
        if state.get('version') != 1 or not isinstance(state.get('jobs'), dict):
            raise ConfigurationError('Unsupported scheduling index')
        ids = set()
        outputs = set()
        for job in jobs:
            identity = job.get('id', '')
            if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]{0,159}', identity) or identity in ids:
                raise ConfigurationError('Invalid or duplicate job identity')
            ids.add(identity)
            output = str(Path(job['out']).resolve())
            if output in outputs:
                raise ConfigurationError('Jobs cannot share an output root')
            outputs.add(output)
            old = state['jobs'].get(identity)
            if old is not None and old['definition'] != job:
                raise ConfigurationError('Retained job definition changed: ' + identity)
        if not set(state['jobs']).issubset(ids):
            raise ConfigurationError('Retained jobs cannot be removed; append new jobs instead')
        for job in jobs:
            state['jobs'].setdefault(job['id'], {'definition': job, 'status': 'pending'})
        failures = state.get('infrastructure_failure_streak', 0)
        if not isinstance(failures, int) or isinstance(failures, bool) or failures < 0:
            raise ConfigurationError('Invalid infrastructure failure streak')
        # A process crash is not permission to repeat a paid attempt.
        for entry in state['jobs'].values():
            if entry['status'] == 'running' or entry.get('result', {}).get('status') == 'interrupted':
                confirm_quiescent(entry['definition'])
            if entry['status'] == 'running':
                job = entry['definition']
                recovered = capture(job, None)
                failures = failures + 1 if infrastructure_failure(recovered) else 0
                state['infrastructure_failure_streak'] = failures
                recovered.update(status='interrupted', reason='Previous scheduler did not record completion')
                entry.update(status='terminal', ended_at=utc(), result=recovered)
                try:
                    CreditMonitor(job).check(final=True)
                except BudgetStop as error:
                    state['pending_stop'] = {'at': utc(), 'job': job['id'], 'reason': str(error)}
            for evidence in entry.get('result', {}).get('evidence', []):
                if digest(evidence['path']) != evidence['sha256']:
                    raise ConfigurationError('Retained evidence changed: ' + evidence['path'])
        if state.get('pending_stop') is not None:
            atomic(path, state)
            atomic(stop_path, state['pending_stop'])
            stopped = True
        if failures >= 2 and not stopped:
            last = max((entry for entry in state['jobs'].values() if entry['status'] == 'terminal'), key=lambda entry: entry.get('ended_at', ''), default=None)
            record_stop(root, last['definition'] if last else {'id': 'index'}, 'Repeated infrastructure failures recovered from durable index')
            stopped = True
        if stopped and not acknowledge_stop:
            raise BudgetStop('Scheduler paused; review stop.json and explicitly acknowledge the stop')
        if stopped:
            stop = json.loads(stop_path.read_text())
            with (root / 'stop-history.jsonl').open('a') as history:
                history.write(json.dumps({'acknowledged_at': utc(), 'stop': stop}) + '\n')
                history.flush()
                os.fsync(history.fileno())
            failures = 0
            state['infrastructure_failure_streak'] = 0
            state.pop('pending_stop', None)
            atomic(path, state)
            stop_path.unlink()
        if failures >= 2:
            raise BudgetStop('Repeated infrastructure failures; review and acknowledge the retained stop')
        atomic(path, state)
        order = list(dict.fromkeys(job['harness'] for job in jobs))
        for harness in order:
            for job in (item for item in jobs if item['harness'] == harness):
                entry = state['jobs'][job['id']]
                if entry['status'] != 'pending':
                    continue
                if 'retained_run' not in job:
                    entry['remaining_before_usd'] = checked_balance(balance)
                entry.update(status='running', started_at=utc())
                atomic(path, state)
                try:
                    result = run_job(job)
                    if not isinstance(result, dict) or result.get('status') not in ('completed', 'task_failed', 'failed', 'interrupted'):
                        raise ConfigurationError('Invalid cell completion result')
                    entry['result'] = result
                except CellFailure as error:
                    entry['result'] = {'status': 'failed', 'reason': str(error), 'evidence': []}
                except BaseException as error:
                    recovered = capture(job, None)
                    failures = failures + 1 if infrastructure_failure(recovered) else 0
                    state['infrastructure_failure_streak'] = failures
                    stop_reason = str(error) if isinstance(error, BudgetStop) else None
                    try:
                        CreditMonitor(job).check(final=True)
                    except BudgetStop as credit_error:
                        stop_reason = str(credit_error)
                    if failures >= 2 and stop_reason is None:
                        stop_reason = 'Two consecutive infrastructure failures; inspect evidence before continuation'
                    recovered.update(status='interrupted', reason=type(error).__name__)
                    entry.update(status='terminal', ended_at=utc(), result=recovered)
                    if stop_reason is not None:
                        state['pending_stop'] = {'at': utc(), 'job': job['id'], 'reason': stop_reason}
                    atomic(path, state)
                    if stop_reason is not None:
                        record_stop(root, job, stop_reason)
                    raise
                entry.update(status='terminal', ended_at=utc())
                failures = failures + 1 if infrastructure_failure(entry['result']) else 0
                state['infrastructure_failure_streak'] = failures
                atomic(path, state)
                print(json.dumps({'at': utc(), 'job': job['id'], **entry['result']}), flush=True)
                if failures >= 2:
                    reason = 'Two consecutive infrastructure failures; inspect evidence before continuation'
                    record_stop(root, job, reason)
                    raise BudgetStop(reason)


def evidence_for(run_path):
    run_path = Path(run_path).resolve()
    raw = json.loads(run_path.read_text())
    paths = [run_path]
    event_path = (run_path.parent / raw['events_file']).resolve()
    if not event_path.is_relative_to(run_path.parent):
        raise ConfigurationError('Events path escapes the retained run')
    paths.append(event_path)
    return [{'path': str(p), 'sha256': digest(p)} for p in paths]


def capture_valid(job, returncode):
    if 'retained_run' in job:
        runs = [Path(job['retained_run'])]
    else:
        runs = list((Path(job['out']) / 'results').glob('*/*/*/rep-*/run.json'))
    if len(runs) != 1:
        return {'status': 'failed', 'returncode': returncode, 'reason': 'Expected one C4; all output files retained', 'evidence': available_evidence(job)}
    raw = json.loads(runs[0].read_text())
    if raw.get('tool') != job['harness'] or raw.get('task_id') != job['task'] or raw.get('rep') != job['rep']:
        raise ConfigurationError('C4 does not match job identity')
    status = 'completed' if raw['outcome'] == 'completed' and returncode == 0 else 'failed'
    state_path = Path(job.get('retained_state', str(Path(job['out']) / 'state.json')))
    if state_path.exists():
        cells = json.loads(state_path.read_text())['cells']
        matching = [c for c in cells if c['tool'] == job['harness'] and c['task_id'] == job['task'] and c['rep'] == job['rep']]
        if len(matching) == 1 and matching[0]['status'] == 'task_failed':
            status = 'task_failed'
    evidence = evidence_for(runs[0])
    # Bind classification inputs and native verification output as well as C4/C1.
    if state_path.exists():
        evidence.append({'path': str(state_path.resolve()), 'sha256': digest(state_path)})
    for artifact in sorted(runs[0].parent.iterdir()):
        if artifact.is_file() and artifact.name not in ('run.json', raw['events_file']):
            evidence.append({'path': str(artifact.resolve()), 'sha256': digest(artifact)})
    return {'status': status, 'returncode': returncode, 'outcome': raw['outcome'], 'recorded_spend_usd': raw['spend_usd_estimate'], 'evidence': evidence}


def available_evidence(job):
    if 'retained_run' in job:
        directories = [Path(job['retained_run']).parent]
    else:
        directories = list((Path(job['out']) / 'results').glob('*/*/*/rep-*'))
    paths = sorted({p for directory in directories for p in directory.iterdir() if p.is_file()})
    return [{'path': str(p.resolve()), 'sha256': digest(p)} for p in paths]


def capture(job, returncode):
    try:
        return capture_valid(job, returncode)
    except (ValueError, OSError, KeyError, TypeError, ConfigurationError) as error:
        evidence = available_evidence(job)
        return {'status': 'failed', 'returncode': returncode, 'reason': 'Invalid cell evidence: ' + type(error).__name__, 'evidence': evidence}


def terminate_owned(process, out):
    # Process-group escalation cannot be skipped by broken state or Docker cleanup.
    try:
        os.killpg(process.pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        pass
    finally:
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        process.wait(timeout=10)
    state_path = Path(out) / 'state.json'
    try:
        cells = json.loads(state_path.read_text()).get('cells', []) if state_path.exists() else []
        for cell in cells:
            for field, kind in (('containerName', 'container'), ('relayName', 'container'), ('networkName', 'network')):
                name = cell.get(field)
                if name and re.fullmatch(r'aob-(?:relay-|net-)?[0-9]+-[0-9]+', name):
                    command = ['docker', 'rm', '-f', name] if kind == 'container' else ['docker', 'network', 'rm', name]
                    result = subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=20)
                    if result.returncode != 0:
                        listing = ['docker', 'ps', '-a', '--format', '{{.Names}}'] if kind == 'container' else ['docker', 'network', 'ls', '--format', '{{.Name}}']
                        remaining = subprocess.run(listing, capture_output=True, text=True, timeout=20)
                        if remaining.returncode != 0:
                            raise BudgetStop('Docker resource status unavailable after cleanup')
                        if name in remaining.stdout.splitlines():
                            raise BudgetStop('Owned Docker resource survived cleanup')
    except (OSError, ValueError, KeyError, subprocess.TimeoutExpired) as error:
        raise BudgetStop('Cannot confirm owned Docker cleanup: ' + type(error).__name__) from error


def start_guard_check(balance):
    # Account and power I/O must not block the one-second C1 supervisor.
    result = Future()
    def check():
        try:
            remaining = checked_balance(balance)
            checked_power()
            result.set_result(remaining)
        except BaseException as error:
            result.set_exception(error)
    threading.Thread(target=check, daemon=True).start()
    return result


def run_child(job, env, balance):
    if 'retained_run' in job:
        return capture(job, job.get('retained_exit', 0))
    out = Path(job['out'])
    if out.exists():
        raise ConfigurationError('New job output already exists; refusing to overwrite ' + str(out))
    out.mkdir(parents=True)
    checked_power()
    checked_balance(balance)
    process = None
    credit_monitor = CreditMonitor(job)
    try:
        with (out / 'runner.log').open('a') as log:
            process = subprocess.Popen(job['argv'], env=env, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
            atomic(out / 'process.json', {'pid': process.pid, 'argv': job['argv'], 'started_at': utc()})
            previous = time.monotonic()
            previous_wall = time.time()
            next_balance = previous
            guard_check = None
            guard_started = previous
            while True:
                now = time.monotonic()
                wall = time.time()
                if supervision_gap(previous_wall, previous, wall, now):
                    raise BudgetStop('Host suspension or supervision gap during measured activity')
                previous, previous_wall = now, wall
                credit_monitor.check()
                if guard_check is not None and not guard_check.done() and now - guard_started > GUARD_CHECK_TIMEOUT_S:
                    raise BudgetStop('Account/power check exceeded supervision deadline')
                if guard_check is not None and guard_check.done():
                    remaining = guard_check.result()
                    with (out / 'balance.jsonl').open('a') as stream:
                        stream.write(json.dumps({'at': utc(), 'remaining_usd': remaining}) + '\n')
                    guard_check = None
                    next_balance = time.monotonic() + 10
                if process.poll() is not None:
                    credit_monitor.check(final=True)
                    break
                if now >= next_balance and guard_check is None:
                    guard_started = time.monotonic()
                    guard_check = start_guard_check(balance)
                time.sleep(1)
            return capture(job, process.returncode)
    finally:
        if process is not None:
            terminate_owned(process, out)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('config', type=Path)
    parser.add_argument('--run', action='store_true', help='Authorize execution of pending jobs; spends provider credits')
    parser.add_argument('--acknowledge-stop', action='store_true', help='Acknowledge a reviewed stop; terminal jobs are still never retried')
    args = parser.parse_args()
    if args.acknowledge_stop and not args.run:
        parser.error('--acknowledge-stop requires --run')
    config = json.loads(args.config.read_text())
    if not args.run:
        index = Path(config['root']) / 'index.json'
        print(index.read_text() if index.exists() else json.dumps({'pending_jobs': len(config['jobs'])}))
        return
    env = os.environ.copy()
    for name in list(env):
        if name.startswith('AOB_'):
            del env[name]
    env.update(config.get('env', {}))
    for line in Path('.env').read_text().splitlines():
        name, sep, value = line.partition('=')
        if sep and name.strip() == 'OPENROUTER_API_KEY':
            env['OPENROUTER_API_KEY'] = value.strip().strip('\"').strip("'")
    def endpoint(name):
        request = urllib.request.Request('https://openrouter.ai/api/v1/' + name, headers={'Authorization': 'Bearer ' + env['OPENROUTER_API_KEY']})
        return read_account_metadata(request)
    def balance():
        credits, key = endpoint('credits'), endpoint('key')
        available = min(float(credits['total_credits']), float(config['credit_ceiling_usd'])) - float(credits['total_usage'])
        if key.get('limit_remaining') is not None:
            available = min(available, float(key['limit_remaining']))
        return available
    def interrupt(signum, frame):
        raise KeyboardInterrupt('Scheduler interrupted')
    for sig in (signal.SIGINT, signal.SIGTERM, signal.SIGHUP):
        signal.signal(sig, interrupt)
    checked_balance(balance)
    if config.get('preflight'):
        subprocess.run(config['preflight'], env=env, check=True)
    schedule(config['root'], config['jobs'], balance, lambda job: run_child(job, env, balance), acknowledge_stop=args.acknowledge_stop)


if __name__ == '__main__':
    main()
