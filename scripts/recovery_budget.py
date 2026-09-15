"""Conservative operational recovery budgets; not measurement accounting."""
from __future__ import annotations
import math
from threading import Lock
from independent_harnesses import BudgetStop


def _amount(value: object) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) and value >= 0


class AccountUsageHighWater:
    def __init__(self) -> None:
        self._usage = 0.0
        self._lock = Lock()

    def observe(self, usage: float) -> float:
        if not _amount(usage):
            raise BudgetStop('Invalid account usage metadata')
        with self._lock:
            self._usage = max(self._usage, usage)
            return self._usage


def availability(total_credits: float, usage: float, ceiling: float,
                 key_remaining: float | None, baseline: float | None = None,
                 cell_cap: float | None = None) -> float:
    values = [total_credits, usage, ceiling] + ([] if key_remaining is None else [key_remaining])
    if not all(_amount(value) for value in values):
        raise BudgetStop('Invalid account budget metadata')
    if baseline is not None:
        if not _amount(baseline):
            raise BudgetStop('Invalid per-cell budget baseline')
        if not _amount(cell_cap) or cell_cap <= 0:
            raise BudgetStop('Invalid per-cell budget metadata')
        # A stale lower reading must neither stop the cell nor create credit.
        usage = max(usage, baseline)
    available = min(total_credits, ceiling) - usage
    if key_remaining is not None:
        available = min(available, key_remaining)
    if baseline is not None:
        available = min(available, cell_cap - (usage - baseline))
    return available
