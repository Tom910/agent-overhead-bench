import sys
sys.dont_write_bytecode = True
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from independent_harnesses import BudgetStop
import recovery_budget

class RecoveryBudgetTest(unittest.TestCase):
    def test_lower_reading_at_baseline_does_not_restore_or_stop_credit(self):
        self.assertAlmostEqual(recovery_budget.availability(64, 58.90, 63.63381808, None, 58.904, 1.5), 1.5)

    def test_high_water_preserves_spend_across_out_of_order_reads(self):
        tracker = recovery_budget.AccountUsageHighWater()
        self.assertEqual(tracker.observe(58), 58)
        self.assertEqual(tracker.observe(58.2), 58.2)
        observed = tracker.observe(58.1)
        self.assertEqual(observed, 58.2)
        self.assertAlmostEqual(recovery_budget.availability(64, observed, 63.63, None, 58, 1.5), 1.3)

    def test_high_water_is_thread_safe(self):
        tracker = recovery_budget.AccountUsageHighWater()
        with ThreadPoolExecutor(max_workers=8) as pool:
            list(pool.map(tracker.observe, [1, 8, 2, 5, 100, 3] * 50))
        self.assertEqual(tracker.observe(0), 100)

    def test_limits_remain_binding(self):
        self.assertAlmostEqual(recovery_budget.availability(64, 63.6, 63.63, None, 63.6, 1.5), .03)
        self.assertAlmostEqual(recovery_budget.availability(64, 58, 63.63, .02, 58, 1.5), .02)
        self.assertAlmostEqual(recovery_budget.availability(58.01, 58, 63.63, None, 58, 1.5), .01)
        self.assertLess(recovery_budget.availability(64, 60, 63.63, None, 58, 1.5), 0)

    def test_bad_values_fail_closed(self):
        for bad in [True, False, None, float('nan'), float('inf'), -1, '58']:
            with self.subTest(bad=bad):
                with self.assertRaises(BudgetStop):
                    recovery_budget.AccountUsageHighWater().observe(bad)
                with self.assertRaises(BudgetStop):
                    recovery_budget.availability(64, bad, 63.63, None)
                with self.assertRaises(BudgetStop):
                    recovery_budget.availability(64, 58, 63.63, None, 58, bad)
        for bad in [True, float('nan'), -1, '58']:
            with self.assertRaises(BudgetStop):
                recovery_budget.availability(64, 58, 63.63, None, bad, 1.5)

if __name__ == '__main__': unittest.main()
