import importlib.util
import io
import json
from pathlib import Path
import tempfile
import subprocess
import sys
sys.dont_write_bytecode = True
from unittest.mock import patch
import unittest
import urllib.error
import urllib.request

spec = importlib.util.spec_from_file_location("scheduler", Path(__file__).with_name("independent_harnesses.py"))
scheduler = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scheduler)

class AccountMetadataRetryTest(unittest.TestCase):
    """Offline contract for the planned metadata-only retry helper."""
    def fetch(self, opener):
        helper = getattr(scheduler, 'read_account_metadata', None)
        self.assertIsNotNone(helper, 'Add the shared bounded account-metadata reader')
        request = urllib.request.Request('https://account.invalid/api/v1/credits')
        return helper(request)

    def response(self, body=b'{"data":{"total_usage":1}}'):
        return io.BytesIO(body)

    def http_error(self, status):
        return urllib.error.HTTPError('https://account.invalid/api/v1/credits', status, 'fixture', {}, None)

    def test_metadata_success_has_five_second_timeout_and_no_retry(self):
        response = self.response()
        with patch.object(scheduler.urllib.request, 'urlopen', return_value=response) as opener, patch.object(scheduler.time, 'sleep') as sleep:
            self.assertEqual(self.fetch(opener), {'total_usage': 1})
        self.assertEqual(opener.call_count, 1)
        self.assertEqual(opener.call_args.kwargs, {'timeout': 5})
        self.assertTrue(response.closed)
        sleep.assert_not_called()

    def test_transient_metadata_errors_retry_and_recover(self):
        for error in [urllib.error.URLError('temporary DNS'), TimeoutError('read timeout'), self.http_error(429), self.http_error(500), self.http_error(503), self.http_error(599)]:
            with self.subTest(error=repr(error)), patch.object(scheduler.urllib.request, 'urlopen', side_effect=[error, self.response()]) as opener, patch.object(scheduler.time, 'sleep') as sleep:
                self.assertEqual(self.fetch(opener), {'total_usage': 1})
                self.assertEqual(opener.call_count, 2)
                self.assertTrue(all(call.kwargs == {'timeout': 5} for call in opener.call_args_list))
                sleep.assert_called_once_with(0.25)

    def test_metadata_retry_exhaustion_stops_after_three_attempts(self):
        error = urllib.error.URLError('unavailable')
        with patch.object(scheduler.urllib.request, 'urlopen', side_effect=error) as opener, patch.object(scheduler.time, 'sleep') as sleep:
            with self.assertRaises(scheduler.BudgetStop):
                self.fetch(opener)
        self.assertEqual(opener.call_count, 3)
        self.assertEqual([call.args for call in sleep.call_args_list], [(0.25,), (0.25,)])

    def test_permanent_http_failures_never_retry(self):
        # HTTPError inherits URLError: classify HTTP status before URLError.
        for status in [400, 401, 402, 403, 404, 408, 422, 600]:
            with self.subTest(status=status), patch.object(scheduler.urllib.request, 'urlopen', side_effect=self.http_error(status)) as opener, patch.object(scheduler.time, 'sleep') as sleep:
                with self.assertRaises(scheduler.BudgetStop):
                    self.fetch(opener)
                self.assertEqual(opener.call_count, 1)
                sleep.assert_not_called()

    def test_malformed_metadata_never_retries(self):
        for body in [b'{broken', b'{}', b'[]', b'{"data":null}', b'{"data":[]}', b'\xff']:
            response = self.response(body)
            with self.subTest(body=body), patch.object(scheduler.urllib.request, 'urlopen', return_value=response) as opener, patch.object(scheduler.time, 'sleep') as sleep:
                with self.assertRaises(scheduler.BudgetStop):
                    self.fetch(opener)
                self.assertEqual(opener.call_count, 1)
                self.assertTrue(response.closed)
                sleep.assert_not_called()

    def test_response_read_timeout_retries_with_closed_previous_response(self):
        class ReadTimeout(io.BytesIO):
            def read(self, *args):
                raise TimeoutError('body read timeout')
        first = ReadTimeout()
        with patch.object(scheduler.urllib.request, 'urlopen', side_effect=[first, self.response()]) as opener, patch.object(scheduler.time, 'sleep') as sleep:
            self.assertEqual(self.fetch(opener), {'total_usage': 1})
        self.assertTrue(first.closed)
        self.assertEqual(opener.call_count, 2)
        sleep.assert_called_once_with(0.25)

    def test_permanent_error_after_transient_ends_retry_sequence(self):
        with patch.object(scheduler.urllib.request, 'urlopen', side_effect=[self.http_error(503), self.http_error(402), self.response()]) as opener, patch.object(scheduler.time, 'sleep') as sleep:
            with self.assertRaises(scheduler.BudgetStop):
                self.fetch(opener)
        self.assertEqual(opener.call_count, 2)
        sleep.assert_called_once_with(0.25)

    def test_interrupt_is_propagated_without_retry(self):
        with patch.object(scheduler.urllib.request, 'urlopen', side_effect=KeyboardInterrupt) as opener, patch.object(scheduler.time, 'sleep') as sleep:
            with self.assertRaises(KeyboardInterrupt):
                self.fetch(opener)
        self.assertEqual(opener.call_count, 1)
        sleep.assert_not_called()

    def test_metadata_reader_rejects_post_without_network(self):
        with patch.object(scheduler.urllib.request, 'urlopen') as opener:
            request = urllib.request.Request('https://account.invalid/credits', data=b'{}')
            with self.assertRaises(scheduler.ConfigurationError):
                scheduler.read_account_metadata(request)
        opener.assert_not_called()

    def test_scheduler_cli_routes_both_account_endpoints_through_shared_reader(self):
        config = {'root': '/unused', 'jobs': [], 'credit_ceiling_usd': 10}
        def read(path, *args, **kwargs):
            if str(path) == '.env':
                return 'OPENROUTER_API_KEY=offline-fixture'
            return json.dumps(config)
        seen = []
        def metadata(request):
            seen.append(request.full_url.rsplit('/', 1)[-1])
            return {'total_credits': 20, 'total_usage': 2} if seen[-1] == 'credits' else {'limit_remaining': 5}
        def admission(root, jobs, balance, run, **kwargs):
            self.assertEqual(balance(), 5)
        with patch.object(Path, 'read_text', read), patch.object(sys, 'argv', ['scheduler', 'config.json', '--run']), patch.dict(scheduler.os.environ, {}, clear=True), patch.object(scheduler.signal, 'signal'), patch.object(scheduler, 'read_account_metadata', side_effect=metadata), patch.object(scheduler, 'schedule', side_effect=admission) as schedule_call, patch.object(scheduler.urllib.request, 'urlopen') as opener:
            scheduler.main()
        schedule_call.assert_called_once()
        self.assertEqual(seen, ['credits', 'key', 'credits', 'key'])
        opener.assert_not_called()

class PowerGuardTest(unittest.TestCase):
    def guard(self):
        guard = getattr(scheduler, "checked_power", None)
        self.assertIsNotNone(guard, "The scheduler needs a shared platform-aware power guard")
        return guard

    def supply(self, root, name, **attributes):
        directory = root / name
        directory.mkdir()
        for attribute, value in attributes.items():
            (directory / attribute).write_text(value + "\n")
        return directory

    def test_linux_batteryless_server_allows_readable_empty_sysfs(self):
        with tempfile.TemporaryDirectory() as d:
            with patch.object(scheduler.subprocess, "check_output") as command:
                self.guard()(system="Linux", power_supply_root=Path(d))
            command.assert_not_called()

    def test_linux_present_battery_allows_online_external_power(self):
        for kind, online in (("Mains", "1"), ("USB", "1"), ("USB_PD", "2")):
            with self.subTest(kind=kind), tempfile.TemporaryDirectory() as d:
                root = Path(d)
                self.supply(root, "BAT0", type="Battery", present="1", scope="System")
                self.supply(root, "AC", type=kind, online=online)
                self.guard()(system="Linux", power_supply_root=root)

    def test_linux_battery_rejects_offline_or_missing_external_power(self):
        for external in (True, False):
            with self.subTest(external=external), tempfile.TemporaryDirectory() as d:
                root = Path(d)
                # Missing 'present' must conservatively mean present.
                self.supply(root, "BAT0", type="Battery")
                if external:
                    self.supply(root, "AC", type="Mains", online="0")
                with self.assertRaisesRegex(scheduler.BudgetStop, "External power"):
                    self.guard()(system="Linux", power_supply_root=root)

    def test_linux_absent_battery_and_peripheral_battery_are_not_system_batteries(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            self.supply(root, "BAT0", type="Battery", present="0")
            self.supply(root, "mouse", type="Battery", scope="Device", present="1")
            self.guard()(system="Linux", power_supply_root=root)

    def test_linux_peripheral_power_cannot_admit_system_battery(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            self.supply(root, "BAT0", type="Battery", present="1")
            self.supply(root, "mouse", type="USB", scope="Device", online="1")
            with self.assertRaisesRegex(scheduler.BudgetStop, "External power"):
                self.guard()(system="Linux", power_supply_root=root)

    def test_linux_missing_or_unreadable_sysfs_stops(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            unreadable = root / "not-a-directory"
            unreadable.write_text("cannot enumerate a regular file")
            for path in (root / "missing", unreadable):
                with self.subTest(path=path), self.assertRaises(scheduler.BudgetStop):
                    self.guard()(system="Linux", power_supply_root=path)

    def test_linux_unreadable_attribute_stops_even_with_an_online_supply(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            self.supply(root, "BAT0", type="Battery", present="1")
            self.supply(root, "AC", type="Mains", online="1")
            broken = self.supply(root, "AC2", type="Mains")
            # A directory cannot be read as an attribute even when CI runs as root.
            (broken / "online").mkdir()
            with self.assertRaises(scheduler.BudgetStop):
                self.guard()(system="Linux", power_supply_root=root)

    def test_linux_permission_denied_is_a_typed_stop(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            self.supply(root, "BAT0", type="Battery", present="1")
            with patch.object(Path, "read_text", side_effect=PermissionError("denied")):
                with self.assertRaises(scheduler.BudgetStop):
                    self.guard()(system="Linux", power_supply_root=root)

    def test_linux_malformed_attributes_stop_even_with_an_online_supply(self):
        cases = (
            {"type": ""}, {"type": "unknown-driver"},
            {"type": "Battery", "present": "2"},
            {"type": "Battery", "scope": "invalid"},
            {"type": "Mains", "online": "yes"},
            {"type": "Mains", "online": "3"},
            {"type": "Mains"}, {},
        )
        for attributes in cases:
            with self.subTest(attributes=attributes), tempfile.TemporaryDirectory() as d:
                root = Path(d)
                self.supply(root, "AC", type="Mains", online="1")
                self.supply(root, "bad", **attributes)
                with self.assertRaises(scheduler.BudgetStop):
                    self.guard()(system="Linux", power_supply_root=root)

    def test_darwin_preserves_ac_requirement_and_timeout(self):
        with patch.object(scheduler.subprocess, "check_output", return_value="Now drawing from 'AC Power'") as command:
            self.guard()(system="Darwin")
        command.assert_called_once_with(["pmset", "-g", "batt"], text=True, timeout=10)
        for output in ("Now drawing from 'Battery Power'", ""):
            with self.subTest(output=output), patch.object(scheduler.subprocess, "check_output", return_value=output):
                with self.assertRaisesRegex(scheduler.BudgetStop, "AC power disconnected"):
                    self.guard()(system="Darwin")

    def test_darwin_unavailable_power_is_a_typed_stop(self):
        for error in (FileNotFoundError(), subprocess.TimeoutExpired("pmset", 10), subprocess.CalledProcessError(1, "pmset")):
            with self.subTest(error=type(error).__name__), patch.object(scheduler.subprocess, "check_output", side_effect=error):
                with self.assertRaises(scheduler.BudgetStop):
                    self.guard()(system="Darwin")

    def test_unsupported_platform_rejects_before_power_io(self):
        with patch.object(scheduler.subprocess, "check_output") as command:
            with self.assertRaisesRegex(scheduler.ConfigurationError, "Unsupported"):
                self.guard()(system="UnsupportedOS")
        command.assert_not_called()

    def test_run_child_rejects_linux_battery_before_launch(self):
        guard = self.guard()
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            supplies = root / "supplies"
            supplies.mkdir()
            self.supply(supplies, "BAT0", type="Battery")
            job = {"out": str(root / "attempt"), "argv": [sys.executable, "-c", "pass"]}
            with patch.object(scheduler, "checked_power", side_effect=lambda: guard(system="Linux", power_supply_root=supplies)):
                with patch.object(scheduler.subprocess, "Popen") as launch:
                    with self.assertRaises(scheduler.BudgetStop):
                        scheduler.run_child(job, dict(scheduler.os.environ), lambda: 10)
            launch.assert_not_called()

    def test_live_linux_power_loss_stops_and_reaps_local_child(self):
        guard = self.guard()
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            supplies = root / "supplies"
            supplies.mkdir()
            self.supply(supplies, "BAT0", type="Battery")
            ac = self.supply(supplies, "AC", type="Mains", online="1")
            out = root / "attempt"
            job = {"out": str(out), "argv": [sys.executable, "-c", "import time; time.sleep(30)"]}
            checks = 0
            def balance():
                nonlocal checks
                checks += 1
                if checks == 2:
                    (ac / "online").write_text("0\n")
                return 10
            with patch.object(scheduler, "checked_power", side_effect=lambda: guard(system="Linux", power_supply_root=supplies)):
                with self.assertRaisesRegex(scheduler.BudgetStop, "External power"):
                    scheduler.run_child(job, dict(scheduler.os.environ), balance)
            pid = json.loads((out / "process.json").read_text())["pid"]
            with self.assertRaises(ProcessLookupError):
                scheduler.os.killpg(pid, 0)

class SchedulerTest(unittest.TestCase):
    def test_two_infrastructure_failures_pause_and_require_acknowledgement(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            jobs = [{"id": str(i), "harness": "a", "out": str(root / str(i))} for i in range(3)]
            visited = []
            def fail(job):
                visited.append(job["id"])
                return {"status": "failed", "outcome": "adapter_error", "evidence": []}
            with self.assertRaisesRegex(scheduler.BudgetStop, "infrastructure"):
                scheduler.schedule(root, jobs, lambda: 10, fail)
            self.assertEqual(visited, ["0", "1"])
            state = json.loads((root / "index.json").read_text())
            self.assertEqual(state["jobs"]["2"]["status"], "pending")
            with self.assertRaisesRegex(scheduler.BudgetStop, "acknowledge"):
                scheduler.schedule(root, jobs, lambda: 10, fail)
            self.assertEqual(visited, ["0", "1"])
            scheduler.schedule(root, jobs, lambda: 10, fail, acknowledge_stop=True)
            self.assertEqual(visited, ["0", "1", "2"])
            self.assertTrue((root / "stop-history.jsonl").exists())

    def test_infrastructure_streak_survives_restart_and_append(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            jobs = [{"id": "a", "harness": "a", "out": str(root / "a")}]
            fail = lambda job: {"status": "failed", "outcome": "adapter_error", "evidence": []}
            scheduler.schedule(root, jobs, lambda: 10, fail)
            jobs += [{"id": x, "harness": "a", "out": str(root / x)} for x in ["b", "c"]]
            with self.assertRaisesRegex(scheduler.BudgetStop, "infrastructure"):
                scheduler.schedule(root, jobs, lambda: 10, fail)
            self.assertEqual(json.loads((root / "index.json").read_text())["jobs"]["c"]["status"], "pending")

    def test_credit_monitor_rejects_malformed_and_truncated_evidence(self):
        for contents in ['{broken}\n', '[]\n', '{"status":']:
            with self.subTest(contents=contents), tempfile.TemporaryDirectory() as d:
                out = Path(d); f = out / "results/pinned/a/t/rep-0/events.jsonl"
                f.parent.mkdir(parents=True); f.write_text(contents)
                with self.assertRaises(scheduler.BudgetStop): scheduler.CreditMonitor({"out": str(out)}).check(final=True)
        with tempfile.TemporaryDirectory() as d:
            out = Path(d); f = out / "results/pinned/a/t/rep-0/events.jsonl"
            f.parent.mkdir(parents=True); f.write_text('{"status":200}\n')
            monitor = scheduler.CreditMonitor({"out": str(out)}); monitor.check()
            f.write_text('')
            with self.assertRaisesRegex(scheduler.BudgetStop, "truncated"): monitor.check()

    def test_credit_stop_intent_survives_crash_before_stop_file(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); jobs = [{"id": x, "harness": "a", "out": str(root / x)} for x in ['a', 'b']]
            def fail(job): raise scheduler.BudgetStop('Provider HTTP 402')
            with patch.object(scheduler, 'record_stop', side_effect=KeyboardInterrupt):
                with self.assertRaises(KeyboardInterrupt): scheduler.schedule(root, jobs, lambda: 10, fail)
            visited = []
            with self.assertRaisesRegex(scheduler.BudgetStop, 'acknowledge'):
                scheduler.schedule(root, jobs, lambda: 10, lambda j: visited.append(j))
            self.assertEqual(visited, [])

    def test_crashed_running_job_credit_evidence_blocks_next_job(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); jobs = [{"id": x, "harness": "a", "out": str(root / x)} for x in ['a', 'b']]
            f = root / 'a/results/pinned/a/t/rep-0/events.jsonl'; f.parent.mkdir(parents=True)
            f.write_text('{"status":402,"method":"POST","protocol":"openai_chat"}\n')
            (root / 'index.json').write_text(json.dumps({'version':1,'jobs':{'a':{'definition':jobs[0],'status':'running'}}}))
            with self.assertRaisesRegex(scheduler.BudgetStop, 'acknowledge'):
                scheduler.schedule(root, jobs, lambda:10, lambda j: self.fail('must not launch'))

    def test_credit_stop_is_not_blocked_by_slow_account_query(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); out = root / 'attempt'
            f = out / 'results/pinned/a/t/rep-0/events.jsonl'
            code = "import pathlib,sys,time; time.sleep(.2); p=pathlib.Path(sys.argv[1]); p.parent.mkdir(parents=True); p.write_text(sys.argv[2]); time.sleep(30)"
            job = {'id':'a','harness':'a','out':str(out),'argv':[sys.executable,'-c',code,str(f),'{"status":402,"method":"POST","protocol":"openai_chat"}\n']}
            import threading
            release = threading.Event(); calls = 0
            def balance():
                nonlocal calls
                calls += 1
                if calls > 1: release.wait(6)
                return 10
            start = scheduler.time.monotonic()
            try:
                with patch.object(scheduler, 'checked_power'):
                    with self.assertRaisesRegex(scheduler.BudgetStop, '402'):
                        scheduler.run_child(job, dict(scheduler.os.environ), balance)
                self.assertLess(scheduler.time.monotonic()-start, 3)
            finally: release.set()

    def test_recovered_infrastructure_failure_contributes_to_streak(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); jobs = [{'id':x,'harness':'a','task':'t','rep':0,'out':str(root/x)} for x in ['a','b','c']]
            f=root/'b/results/pinned/a/t/rep-0/run.json'; f.parent.mkdir(parents=True)
            f.write_text(json.dumps({'tool':'a','task_id':'t','rep':0,'outcome':'adapter_error','spend_usd_estimate':0,'events_file':'events.jsonl'}))
            f.with_name('events.jsonl').write_text('')
            (root/'index.json').write_text(json.dumps({'version':1,'infrastructure_failure_streak':1,'jobs':{'a':{'definition':jobs[0],'status':'terminal','result':{'status':'failed','outcome':'adapter_error','evidence':[]}},'b':{'definition':jobs[1],'status':'running'}}}))
            with self.assertRaisesRegex(scheduler.BudgetStop, 'acknowledge'):
                scheduler.schedule(root,jobs,lambda:10,lambda j:self.fail('third job must remain pending'))

    def test_guard_check_has_total_deadline(self):
        with tempfile.TemporaryDirectory() as d:
            import threading
            release=threading.Event(); calls=0; out=Path(d)/'attempt'
            job={'out':str(out),'argv':[sys.executable,'-c','import time; time.sleep(30)']}
            def balance():
                nonlocal calls
                calls+=1
                if calls>1:release.wait(6)
                return 10
            try:
                with patch.object(scheduler,'checked_power'), patch.object(scheduler,'GUARD_CHECK_TIMEOUT_S',.01):
                    with self.assertRaisesRegex(scheduler.BudgetStop,'supervision deadline'):
                        scheduler.run_child(job,dict(scheduler.os.environ),balance)
            finally:release.set()

    def test_signal_interruption_preserves_credit_stop(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d); jobs=[{'id':x,'harness':'a','out':str(root/x)} for x in ['a','b']]
            def interrupted(job):
                f=Path(job['out'])/'results/pinned/a/t/rep-0/events.jsonl';f.parent.mkdir(parents=True)
                f.write_text('{"status":402,"protocol":"openai_chat","method":"POST"}\n')
                raise KeyboardInterrupt()
            with self.assertRaises(KeyboardInterrupt): scheduler.schedule(root,jobs,lambda:10,interrupted)
            with self.assertRaisesRegex(scheduler.BudgetStop,'acknowledge'):
                scheduler.schedule(root,jobs,lambda:10,lambda j:self.fail('must remain paused'))

    def test_native_failure_resets_infrastructure_streak(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            jobs = [{"id": str(i), "harness": "a", "out": str(root / str(i))} for i in range(4)]
            statuses = iter(["failed", "task_failed", "failed", "completed"])
            visited = []
            def run(job):
                visited.append(job["id"])
                return {"status": next(statuses), "evidence": []}
            scheduler.schedule(root, jobs, lambda: 10, run)
            self.assertEqual(visited, ["0", "1", "2", "3"])

    def test_live_credit_rejection_stops_child_and_next_job_above_cash_margin(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); out = root / "a"
            event = {"seq": 0, "status": 402, "protocol": "openai_chat", "method": "POST"}
            child = "import pathlib,sys,time; p=pathlib.Path(sys.argv[1]); p.parent.mkdir(parents=True); p.write_text(sys.argv[2]); time.sleep(30)"
            jobs = [{"id": "a", "harness": "a", "out": str(out), "argv": [sys.executable, "-c", child, str(out / "results/pinned/a/t/rep-0/events.jsonl"), json.dumps(event) + "\n"]},
                    {"id": "b", "harness": "a", "out": str(root / "b")}]
            started = scheduler.time.monotonic()
            with patch.object(scheduler, "checked_power"):
                with self.assertRaisesRegex(scheduler.BudgetStop, "402"):
                    scheduler.schedule(root, jobs, lambda: 10, lambda j: scheduler.run_child(j, dict(scheduler.os.environ), lambda: 10))
            self.assertLess(scheduler.time.monotonic() - started, 5)
            state = json.loads((root / "index.json").read_text())
            self.assertEqual(state["jobs"]["a"]["status"], "terminal")
            self.assertEqual(state["jobs"]["b"]["status"], "pending")
            self.assertTrue((root / "stop.json").exists())
            pid = json.loads((out / "process.json").read_text())["pid"]
            with self.assertRaises(ProcessLookupError): scheduler.os.killpg(pid, 0)

    def test_optional_model_identity_monitor(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); f = root / 'results/pinned/a/t/rep-0/events.jsonl'; f.parent.mkdir(parents=True)
            base = {'status': 200, 'method': 'POST', 'protocol': 'anthropic_messages', 'model_requested': 'model', 'model_served': 'model'}
            for observed in (None, 'unknown', 'other-model'):
                f.write_text(json.dumps({**base, 'model_served': observed}) + '\n')
                with self.assertRaisesRegex(scheduler.BudgetStop, 'model identity'):
                    scheduler.CreditMonitor({'out': str(root), 'expected_model': 'model'}).check()
            f.write_text(json.dumps({**base, 'model_requested': None}) + '\n')
            with self.assertRaisesRegex(scheduler.BudgetStop, 'model identity'):
                scheduler.CreditMonitor({'out': str(root), 'expected_model': 'model'}).check()
            for event in (base, {**base, 'status': 400, 'model_served': None}, {**base, 'method': 'GET', 'model_served': None}):
                f.write_text(json.dumps(event) + '\n')
                scheduler.CreditMonitor({'out': str(root), 'expected_model': 'model'}).check()
            f.write_text(json.dumps({**base, 'model_served': None}) + '\n')
            scheduler.CreditMonitor({'out': str(root)}).check()

    def test_live_identity_failure_stops_child_and_next_job(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); out = root / 'a'
            event = {'status': 200, 'method': 'POST', 'protocol': 'anthropic_messages', 'model_requested': 'model', 'model_served': 'unknown'}
            child = "import pathlib,sys,time; p=pathlib.Path(sys.argv[1]); p.parent.mkdir(parents=True); p.write_text(sys.argv[2]); time.sleep(30)"
            jobs = [{'id': 'a', 'harness': 'a', 'out': str(out), 'expected_model': 'model', 'argv': [sys.executable, '-c', child, str(out / 'results/pinned/a/t/rep-0/events.jsonl'), json.dumps(event)+'\n']}, {'id': 'b', 'harness': 'a', 'out': str(root/'b')}]
            started = scheduler.time.monotonic()
            with patch.object(scheduler, 'checked_power'):
                with self.assertRaisesRegex(scheduler.BudgetStop, 'model identity'):
                    scheduler.schedule(root, jobs, lambda: 10, lambda j: scheduler.run_child(j, dict(scheduler.os.environ), lambda: 10))
            self.assertLess(scheduler.time.monotonic() - started, 5)
            state = json.loads((root/'index.json').read_text())
            self.assertEqual(state['jobs']['b']['status'], 'pending')
            self.assertIn('model identity', json.loads((root/'stop.json').read_text())['reason'])

    def test_credit_monitor_waits_for_complete_line_and_ignores_metadata(self):
        with tempfile.TemporaryDirectory() as d:
            out = Path(d); f = out / "results/pinned/a/t/rep-0/events.jsonl"
            f.parent.mkdir(parents=True)
            monitor = scheduler.CreditMonitor({"out": str(out)})
            f.write_text(json.dumps({"status": 402, "protocol": "unknown", "method": "HEAD"}) + "\n" + '{"status":402,')
            monitor.check()
            with f.open("a") as stream: stream.write('"protocol":"anthropic_messages","method":"POST"}\n')
            with self.assertRaisesRegex(scheduler.BudgetStop, "402"): monitor.check()

    def test_resume_failure_isolation_and_append(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            jobs = [{"id": x, "harness": h, "out": str(root / x)} for x,h in [("a1","a"),("a2","a"),("b1","b")]]
            visited = []
            def run(job):
                visited.append(job["id"])
                if job["id"] == "a1":
                    raise scheduler.CellFailure("child failed")
                return {"status": "completed", "evidence": []}
            scheduler.schedule(root, jobs, lambda: 10, run)
            self.assertEqual(visited, ["a1", "a2", "b1"])
            jobs.append({"id":"c1","harness":"c","out":str(root/"c1")})
            scheduler.schedule(root, jobs, lambda: 10, run)
            self.assertEqual(visited, ["a1", "a2", "b1", "c1"])
            state=json.loads((root/"index.json").read_text())
            self.assertEqual(state["jobs"]["a1"]["result"]["status"],"failed")
            changed=[dict(j) for j in jobs];changed[1]["harness"]="other"
            with self.assertRaises(scheduler.ConfigurationError):
                scheduler.schedule(root, changed, lambda: 10, run)

    def test_interrupted_job_is_retained_and_not_repeated(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);job={"id":"a1","harness":"a","out":str(root/"a1")}
            def interrupt(job): raise KeyboardInterrupt()
            with self.assertRaises(KeyboardInterrupt): scheduler.schedule(root,[job],lambda:10,interrupt)
            visited=[]
            scheduler.schedule(root,[job],lambda:10,lambda j:visited.append(j))
            self.assertEqual(visited,[])
            state=json.loads((root/"index.json").read_text())
            self.assertEqual(state["jobs"]["a1"]["result"]["status"],"interrupted")

    def test_budget_unavailable_or_depleted_stops_before_execution(self):
        for balance in (lambda:0, lambda:float("nan"), lambda: (_ for _ in ()).throw(OSError("offline"))):
            with tempfile.TemporaryDirectory() as d:
                root=Path(d);visited=[]
                with self.assertRaises(scheduler.BudgetStop):
                    scheduler.schedule(root,[{"id":"a","harness":"a","out":str(root/"a")}],balance,lambda j:visited.append(j))
                self.assertEqual(visited,[])

    def test_grouping_and_pending_identity_survive_budget_stop(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            jobs=[{"id":i,"harness":h,"out":str(root/i)} for i,h in [("a1","a"),("b1","b"),("a2","a")]]
            visited=[]
            def run(j): visited.append(j["id"]);return {"status":"task_failed","evidence":[]}
            scheduler.schedule(root,jobs,lambda:10,run)
            self.assertEqual(visited,["a1","a2","b1"])

    def test_real_children_keep_success_and_failure_artifacts(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            for exit_code in (0,1):
                out=root/str(exit_code)
                code="from pathlib import Path; import sys; Path(sys.argv[1]).write_text('retained'); raise SystemExit(int(sys.argv[2]))"
                job={"id":"a"+str(exit_code),"harness":"a","out":str(out),"argv":[sys.executable,"-c",code,str(out/"result.txt"),str(exit_code)]}
                with patch.object(scheduler,"checked_power"):
                    result=scheduler.run_child(job,dict(scheduler.os.environ),lambda:10)
                self.assertEqual(result["status"],"failed")  # no fabricated C4
                self.assertEqual((out/"result.txt").read_text(),"retained")

    def test_changed_evidence_prevents_reuse(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);artifact=root/"run.json";artifact.write_text("original")
            job={"id":"a","harness":"a","out":str(root/"a")}
            result={"status":"completed","evidence":[{"path":str(artifact),"sha256":scheduler.digest(artifact)}]}
            scheduler.schedule(root,[job],lambda:10,lambda j:result)
            artifact.write_text("changed")
            with self.assertRaises(scheduler.ConfigurationError): scheduler.schedule(root,[job],lambda:10,lambda j:result)

    def test_malformed_cell_is_isolated_and_raw_bytes_are_bound(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);out=root/"a";run=out/"results/pinned/a/t/rep-0/run.json"
            run.parent.mkdir(parents=True);run.write_text("{broken")
            result=scheduler.capture({"out":str(out),"harness":"a","task":"t","rep":0},1)
            self.assertEqual(result["status"],"failed")
            self.assertEqual(result["evidence"][0]["sha256"],scheduler.digest(run))

    def test_resume_refuses_a_still_running_child(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);out=root/"a";out.mkdir()
            job={"id":"a","harness":"a","out":str(out)}
            child=subprocess.Popen([sys.executable,"-c","import time;time.sleep(30)",str(out)])
            try:
                (out/"process.json").write_text(json.dumps({"pid":child.pid}))
                (root/"index.json").write_text(json.dumps({"version":1,"jobs":{"a":{"definition":job,"status":"running"}}}))
                with self.assertRaises(scheduler.ConfigurationError): scheduler.schedule(root,[job],lambda:10,lambda j:None)
            finally:
                child.terminate();child.wait()

    def test_unavailable_docker_cleanup_cannot_advance(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            (root/"state.json").write_text(json.dumps({"cells":[{"containerName":"aob-123-456"}]}))
            from unittest.mock import Mock
            process=Mock(pid=123)
            with patch.object(scheduler.os,"killpg"), patch.object(scheduler.subprocess,"run",return_value=subprocess.CompletedProcess([],1)):
                with self.assertRaises(scheduler.BudgetStop): scheduler.terminate_owned(process,root)
            process.wait.assert_called()

    def test_sleep_is_detected_when_monotonic_clock_pauses(self):
        self.assertTrue(scheduler.supervision_gap(100,100,400,101))
        self.assertFalse(scheduler.supervision_gap(100,100,101,101))

    def test_terminal_interruption_checks_docker_resources(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);out=root/"a";out.mkdir()
            job={"id":"a","harness":"a","out":str(out)}
            (out/"process.json").write_text(json.dumps({"pid":987654}))
            (root/"index.json").write_text(json.dumps({"version":1,"jobs":{"a":{"definition":job,"status":"terminal","result":{"status":"interrupted","evidence":[]}}}}))
            def command(args,**kwargs):
                return subprocess.CompletedProcess(args,0, "aob-987654-12\n" if args[0]=="docker" else "", "")
            with patch.object(scheduler.os,"killpg",side_effect=ProcessLookupError), patch.object(scheduler.subprocess,"run",side_effect=command):
                with self.assertRaises(scheduler.ConfigurationError): scheduler.schedule(root,[job],lambda:10,lambda j:None)

if __name__ == "__main__": unittest.main()
