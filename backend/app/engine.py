"""
Debt-freedom payoff engine.

Pure, dependency-free calculation logic. Given a starting financial position
and a monthly strategy, it simulates the full month-by-month journey:

  * Phase 1 — attack the credit card (largest aggressive payment)
  * Phase 2 — when the CC clears, redirect the freed money to the DMP the SAME
              month (no leak), boosting the DMP payment
  * Phase 3 — once debt free, every available pound flows into savings

The guiding rule is "deploy the full monthly budget every month": whenever a
debt needs less than its allotted slot (the transition months), the leftover
cascades straight to the next target so nothing ever sits idle.

This module has no framework imports so it can be unit-tested in isolation and
reused anywhere.
"""
from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Optional


# --------------------------------------------------------------------------- #
# Inputs
# --------------------------------------------------------------------------- #
@dataclass
class Plan:
    """Everything needed to simulate a debt-freedom journey."""

    # Opening balances
    credit_card: float = 15_700.0
    dmp_balance: float = 26_955.99
    equity: float = 21_800.0
    savings: float = 0.0

    # The total amount committed every month (kept flat — no lifestyle creep)
    monthly_budget: float = 2_092.0

    # Phase 1 allocations (while the credit card is still alive)
    p1_cc_payment: float = 1_300.0
    p1_dmp_payment: float = 492.0
    p1_savings: float = 300.0

    # Phase 2 target DMP payment (once the CC is gone)
    p2_dmp_payment: float = 1_492.0
    p2_savings: float = 600.0

    # Monthly equity growth (mortgage + Oplo reduction, conservatively flat)
    equity_growth: float = 200.0

    # Property context (carried through for display, not used in the maths)
    property_value: float = 330_000.0
    ownership_share_pct: float = 70.0
    mortgage: float = 186_707.0
    oplo: float = 22_460.0

    # Safety valve
    max_months: int = 600

    def validate(self) -> None:
        if self.monthly_budget <= 0:
            raise ValueError("monthly_budget must be positive")
        if self.credit_card < 0 or self.dmp_balance < 0:
            raise ValueError("opening balances cannot be negative")
        floor = self.p1_cc_payment + self.p1_dmp_payment + self.p1_savings
        if floor - 1e-6 > self.monthly_budget:
            raise ValueError(
                "Phase 1 allocations "
                f"(£{floor:,.0f}) exceed the monthly budget "
                f"(£{self.monthly_budget:,.0f})."
            )


# --------------------------------------------------------------------------- #
# Outputs
# --------------------------------------------------------------------------- #
@dataclass
class MonthRow:
    month: int
    phase: int
    cc_payment: float
    cc_left: float
    dmp_payment: float
    dmp_left: float
    savings_added: float
    total_saved: float
    equity: float
    total_position: float
    milestone: Optional[str] = None  # "cc_cleared" | "dmp_cleared" | "target_hit"


@dataclass
class Summary:
    cc_cleared_month: Optional[int] = None
    dmp_cleared_month: Optional[int] = None
    debt_free_month: Optional[int] = None
    target_hit_month: Optional[int] = None
    final_month: int = 0
    final_total_position: float = 0.0
    total_saved: float = 0.0
    final_equity: float = 0.0


@dataclass
class Projection:
    rows: list[MonthRow] = field(default_factory=list)
    summary: Summary = field(default_factory=Summary)

    def to_dict(self) -> dict:
        return {
            "rows": [asdict(r) for r in self.rows],
            "summary": asdict(self.summary),
        }


# --------------------------------------------------------------------------- #
# The engine
# --------------------------------------------------------------------------- #
def _round(x: float) -> float:
    """Round to whole pounds for clean display; keep tiny negatives at zero."""
    r = round(x)
    return 0.0 if r == 0 else float(r)


def project(plan: Plan, savings_target: float = 60_000.0) -> Projection:
    """Run the full month-by-month simulation until debts clear AND the savings
    target (measured as total position = savings + equity) is reached."""
    plan.validate()

    cc = plan.credit_card
    dmp = plan.dmp_balance
    equity = plan.equity
    savings = plan.savings

    rows: list[MonthRow] = []
    summary = Summary()

    month = 0
    while month < plan.max_months:
        month += 1
        budget = plan.monthly_budget
        cc_pay = dmp_pay = save = 0.0
        milestone: Optional[str] = None

        if cc > 0:
            # ---- Phase 1: the credit card is the priority target ----------
            phase = 1
            cc_pay = min(plan.p1_cc_payment, cc, budget)
            cc -= cc_pay
            budget -= cc_pay

            if cc <= 0:
                # The CC cleared this month. Don't waste the rest of the slot —
                # immediately ramp the DMP and pour the remainder into savings.
                cc = 0.0
                summary.cc_cleared_month = month
                milestone = "cc_cleared"
                dmp_pay = min(plan.p2_dmp_payment, dmp, budget)
                dmp -= dmp_pay
                budget -= dmp_pay
                save = budget
            else:
                # Normal Phase 1 month: DMP gets its minimum, savings its floor.
                dmp_pay = min(plan.p1_dmp_payment, dmp)
                dmp -= dmp_pay
                save = plan.p1_savings

        elif dmp > 0:
            # ---- Phase 2: credit card gone, hammer the DMP -----------------
            phase = 2
            dmp_pay = min(plan.p2_dmp_payment, dmp, budget)
            dmp -= dmp_pay
            budget -= dmp_pay
            if dmp <= 0:
                # DMP cleared this month — the leftover all becomes savings.
                dmp = 0.0
                summary.dmp_cleared_month = month
                summary.debt_free_month = month
                milestone = "dmp_cleared"
                save = budget
            else:
                save = budget  # remainder of the flat budget after the DMP slot

        else:
            # ---- Phase 3: debt free, everything compounds the savings ------
            phase = 3
            save = budget

        savings += save
        equity += plan.equity_growth
        total_position = savings + equity

        if (
            summary.target_hit_month is None
            and total_position >= savings_target
        ):
            summary.target_hit_month = month
            if milestone is None:
                milestone = "target_hit"

        rows.append(
            MonthRow(
                month=month,
                phase=phase,
                cc_payment=_round(cc_pay),
                cc_left=_round(cc),
                dmp_payment=_round(dmp_pay),
                dmp_left=_round(dmp),
                savings_added=_round(save),
                total_saved=_round(savings),
                equity=_round(equity),
                total_position=_round(total_position),
                milestone=milestone,
            )
        )

        # Stop once debts are gone and the target is reached.
        if cc <= 0 and dmp <= 0 and summary.target_hit_month is not None:
            break

    summary.final_month = month
    summary.final_total_position = _round(savings + equity)
    summary.total_saved = _round(savings)
    summary.final_equity = _round(equity)
    return Projection(rows=rows, summary=summary)
