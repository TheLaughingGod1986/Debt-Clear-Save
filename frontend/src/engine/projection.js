// projection.js — dynamic debt-payoff + savings projection engine.
//
// Direct port of the design package's engine.js. Replaces the Python /projection
// endpoint for the new UI (the FastAPI engine is hard-coded to the legacy
// 3-phase CC + DMP plan and is preserved untouched for milestone verification).
//
// Each simulated month:
//   1. Interest accrues on every outstanding debt.
//   2. While any debt remains, a protected slice goes to savings; the rest
//      attacks debt.
//   3. Minimums are paid on every debt, then leftover snowballs onto the
//      priority debt (avalanche = highest APR, snowball = smallest balance).
//   4. Once debt-free, the whole budget pours into savings.
//   5. Savings fill named goals in priority order.

export const uid = () => Math.random().toString(36).slice(2, 9);

// Realistic default household with 4 debts of differing APR + size so
// avalanche and snowball produce visibly different orders.
export const DEFAULT_PLAN = {
  name: 'My Debt Freedom Plan',
  strategy: 'avalanche',
  monthlyBudget: 2092,
  allowanceYou: 0,
  allowancePartner: 0,
  saveWhileInDebt: 150,
  extraPerMonth: 0,
  income: [
    { id: 'inc1', name: 'Your take-home', amount: 2100 },
    { id: 'inc2', name: "Partner's take-home", amount: 1900 },
  ],
  expenses: [
    { id: 'ex1', name: 'Rent / mortgage', amount: 950 },
    { id: 'ex2', name: 'Council tax', amount: 160 },
    { id: 'ex3', name: 'Groceries', amount: 400 },
    { id: 'ex4', name: 'Energy & water', amount: 180 },
    { id: 'ex5', name: 'Transport', amount: 120 },
    { id: 'ex6', name: 'Phone & broadband', amount: 58 },
    { id: 'ex7', name: 'Subscriptions', amount: 40 },
  ],
  overpayments: {},
  debts: [
    { id: 'd1', name: 'Overdraft',   balance: 2100,  original: 3000,  apr: 39.9, minPayment: 50 },
    { id: 'd2', name: 'Credit card', balance: 8400,  original: 21000, apr: 24.9, minPayment: 210 },
    { id: 'd3', name: 'Car loan',    balance: 6200,  original: 9000,  apr: 9.9,  minPayment: 180 },
    { id: 'd4', name: 'DMP (Oplo)',  balance: 12000, original: 18000, apr: 0,    minPayment: 150 },
  ],
  goals: [
    { id: 'g1', name: 'Emergency fund', target: 5000 },
    { id: 'g2', name: 'House deposit',  target: 20000 },
    { id: 'g3', name: 'Family holiday', target: 3000 },
  ],
};

const EPS = 0.005;
const MAX_MONTHS = 600;

function priorityOrder(debts, strategy) {
  const active = debts.filter((d) => d.balance > EPS);
  if (strategy === 'snowball') {
    return active.sort((a, b) => a.balance - b.balance || b.apr - a.apr);
  }
  return active.sort((a, b) => b.apr - a.apr || a.balance - b.balance);
}

// Counterfactual: pay only a realistic monthly minimum.
function minimumsOnly(plan) {
  const debts = (plan.debts || [])
    .map((d) => ({
      balance: Math.max(0, Number(d.balance) || 0),
      apr: Math.max(0, Number(d.apr) || 0),
      min: Math.max(0, Number(d.minPayment) || 0),
    }))
    .filter((d) => d.balance > EPS);
  let interest = 0;
  let m = 0;
  const has = () => debts.some((d) => d.balance > EPS);
  while (m < MAX_MONTHS && has()) {
    m++;
    for (const d of debts) {
      if (d.balance <= EPS) continue;
      const i = d.balance * (d.apr / 1200);
      d.balance += i;
      interest += i;
      const realisticMin = Math.max(d.min, 25, i + d.balance * 0.01);
      const pay = Math.min(d.balance, realisticMin);
      d.balance -= pay;
    }
  }
  return { clears: !has(), months: has() ? null : m, interest: Math.round(interest) };
}

export function buildProjection(plan = DEFAULT_PLAN, doneMonths = new Set()) {
  const incomeTotal = (plan.income || []).reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const expenseTotal = (plan.expenses || []).reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const hasIncome = Array.isArray(plan.income) && plan.income.length > 0;
  const personalAllowance = Math.max(
    0,
    (Number(plan.allowanceYou) || 0) + (Number(plan.allowancePartner) || 0)
  );
  const grossFree = hasIncome ? incomeTotal - expenseTotal : Number(plan.monthlyBudget) || 0;
  const deployableRaw = grossFree - personalAllowance;
  const available = Math.max(0, deployableRaw);
  const budget = available + Math.max(0, Number(plan.extraPerMonth) || 0);
  const overpayments = plan.overpayments || {};
  const protectedSave = Math.max(0, Number(plan.saveWhileInDebt) || 0);
  const strategy = plan.strategy === 'snowball' ? 'snowball' : 'avalanche';

  const debts = (plan.debts || []).map((d) => {
    const start = Math.max(0, Number(d.balance) || 0);
    const original = Math.max(start, Number(d.original) || start);
    return {
      id: d.id,
      name: d.name,
      start,
      original,
      balance: start,
      apr: Math.max(0, Number(d.apr) || 0),
      minPayment: Math.max(0, Number(d.minPayment) || 0),
      clearedMonth: null,
      totalInterest: 0,
    };
  });
  const goals = (plan.goals || []).map((g) => ({
    id: g.id,
    name: g.name,
    target: Math.max(0, Number(g.target) || 0),
    saved: 0,
    metMonth: null,
    fundingStart: null,
  }));

  const startDebt = debts.reduce((s, d) => s + d.start, 0);
  const goalTotal = goals.reduce((s, g) => s + g.target, 0);

  const rows = [];
  let savingsTotal = 0;
  let debtFreeMonth = null;
  let allGoalsMetMonth = null;
  let netPositiveMonth = null;
  let totalInterest = 0;
  let stalled = false;

  const hasDebt = () => debts.some((d) => d.balance > EPS);
  const goalsMet = () => goals.every((g) => g.saved >= g.target - EPS);

  let m = 0;
  while (m < MAX_MONTHS) {
    m++;
    const anyDebtStart = hasDebt();

    // Interest accrues
    let monthInterest = 0;
    for (const d of debts) {
      if (d.balance > EPS && d.apr > 0) {
        const i = d.balance * (d.apr / 1200);
        d.balance += i;
        d.totalInterest += i;
        monthInterest += i;
      }
    }
    totalInterest += monthInterest;

    // Split budget
    let saveThisMonth = anyDebtStart ? Math.min(protectedSave, budget) : budget;
    let debtPool = budget - saveThisMonth;

    const over = Math.max(0, Number(overpayments[m]) || 0);
    if (over > 0) {
      if (anyDebtStart) debtPool += over;
      else saveThisMonth += over;
    }

    if (anyDebtStart && debtPool <= monthInterest + EPS) stalled = true;

    // Pay minimums then snowball priority
    const perDebtPaid = {};
    for (const d of debts) {
      if (d.balance <= EPS || debtPool <= 0) continue;
      const pay = Math.min(d.balance, d.minPayment, debtPool);
      d.balance -= pay;
      debtPool -= pay;
      perDebtPaid[d.id] = (perDebtPaid[d.id] || 0) + pay;
      if (d.balance <= EPS && d.clearedMonth === null) d.clearedMonth = m;
    }
    for (const d of priorityOrder(debts, strategy)) {
      if (debtPool <= 0) break;
      const pay = Math.min(d.balance, debtPool);
      d.balance -= pay;
      debtPool -= pay;
      perDebtPaid[d.id] = (perDebtPaid[d.id] || 0) + pay;
      if (d.balance <= EPS && d.clearedMonth === null) d.clearedMonth = m;
    }
    if (debtPool > EPS) {
      saveThisMonth += debtPool;
      debtPool = 0;
    }

    const totalDebtPaidThisMonth = Object.values(perDebtPaid).reduce((s, v) => s + v, 0);

    // Fill goals
    savingsTotal += saveThisMonth;
    let savePool = saveThisMonth;
    const perGoalAdded = {};
    for (const g of goals) {
      if (savePool <= 0) break;
      if (g.saved >= g.target - EPS) continue;
      const add = Math.min(savePool, g.target - g.saved);
      g.saved += add;
      savePool -= add;
      perGoalAdded[g.id] = add;
      if (add > 0 && g.fundingStart === null) g.fundingStart = m;
      if (g.saved >= g.target - EPS && g.metMonth === null) g.metMonth = m;
    }

    const debtLeft = debts.reduce((s, d) => s + Math.max(0, d.balance), 0);
    const debtNowZero = debtLeft <= EPS;
    if (debtNowZero && debtFreeMonth === null && startDebt > EPS) debtFreeMonth = m;
    if (goalsMet() && allGoalsMetMonth === null && goalTotal > EPS) allGoalsMetMonth = m;
    if (netPositiveMonth === null && savingsTotal - debtLeft >= 0 && startDebt > EPS) {
      netPositiveMonth = m;
    }

    let milestone = null;
    const clearedThis = debts.find((d) => d.clearedMonth === m);
    const goalMetThis = goals.find((g) => g.metMonth === m);
    if (m === debtFreeMonth) milestone = { kind: 'debt_free', label: 'DEBT FREE ✓' };
    else if (clearedThis)
      milestone = {
        kind: 'debt_cleared',
        label: `${clearedThis.name.toUpperCase()} CLEARED ✓`,
        debtId: clearedThis.id,
      };
    if (m === allGoalsMetMonth) milestone = { kind: 'all_goals', label: 'ALL GOALS ✓' };
    else if (!milestone && goalMetThis)
      milestone = { kind: 'goal_met', label: `${goalMetThis.name.toUpperCase()} ✓`, goalId: goalMetThis.id };
    else if (!milestone && m === netPositiveMonth)
      milestone = { kind: 'net_positive', label: 'NET WORTH POSITIVE ✓' };

    rows.push({
      month: m,
      phase: anyDebtStart ? 1 : 2,
      focus: anyDebtStart
        ? priorityOrder(debts, strategy)[0]?.name ||
          debts.find((d) => perDebtPaid[d.id])?.name ||
          null
        : null,
      interest: monthInterest,
      debtPaid: totalDebtPaidThisMonth,
      perDebtPaid,
      debtLeft,
      save: saveThisMonth,
      savingsTotal,
      perGoalAdded,
      goalsSnapshot: goals.map((g) => ({ id: g.id, name: g.name, saved: g.saved, target: g.target })),
      debtBalances: Object.fromEntries(debts.map((d) => [d.id, Math.max(0, d.balance)])),
      milestone,
      done: doneMonths.has(m),
    });

    if (debtNowZero && goalsMet()) break;
    if (stalled && m > 12) break;
  }

  const finalMonth = rows.length;
  const monthsDone = rows.filter((r) => r.done).length;
  const everythingDone =
    (debtFreeMonth !== null || startDebt <= EPS) &&
    (allGoalsMetMonth !== null || goalTotal <= EPS);

  const trackedRow = monthsDone > 0 ? rows[Math.min(monthsDone, rows.length) - 1] : null;
  const curBal = (id) =>
    trackedRow ? trackedRow.debtBalances[id] ?? 0 : debts.find((d) => d.id === id)?.start ?? 0;

  const without = minimumsOnly(plan);
  const moneyFreedTotal = debts.reduce((s, d) => s + d.minPayment, 0);

  const repRow = rows[Math.min(monthsDone, Math.max(0, rows.length - 1))] || rows[0] || null;
  const monthly = {
    income: Math.round(incomeTotal),
    expenses: Math.round(expenseTotal),
    debt: repRow ? Math.round(repRow.debtPaid) : 0,
    savings: repRow ? Math.round(repRow.save) : 0,
  };

  return {
    plan,
    rows,
    debts: debts.map((d) => {
      const current = Math.max(0, curBal(d.id));
      const paidOffPct =
        d.original > 0 ? Math.min(1, Math.max(0, (d.original - current) / d.original)) : 0;
      return {
        id: d.id,
        name: d.name,
        start: d.start,
        original: d.original,
        current,
        apr: d.apr,
        minPayment: d.minPayment,
        clearedMonth: d.clearedMonth,
        monthsToClear: d.clearedMonth ? Math.max(0, d.clearedMonth - monthsDone) : null,
        moneyFreed: d.minPayment,
        paidOffPct,
        totalInterest: d.totalInterest,
      };
    }),
    goals: goals.map((g) => ({
      id: g.id,
      name: g.name,
      target: g.target,
      saved: g.saved,
      metMonth: g.metMonth,
      fundingStart: g.fundingStart,
    })),
    summary: {
      strategy,
      budget,
      income_total: Math.round(incomeTotal),
      expense_total: Math.round(expenseTotal),
      personal_allowance: Math.round(personalAllowance),
      deployable: Math.round(deployableRaw),
      available: Math.round(available),
      overpay_total: Math.round(
        Object.values(overpayments).reduce((s, v) => s + (Number(v) || 0), 0)
      ),
      start_debt: startDebt,
      goal_total: goalTotal,
      final_month: finalMonth,
      months_done: monthsDone,
      pct_complete: finalMonth ? Math.round((monthsDone / finalMonth) * 100) : 0,
      next_action_month: rows.find((r) => !r.done)?.month || null,
      debt_free_month: debtFreeMonth,
      all_goals_met_month: allGoalsMetMonth,
      net_positive_month: netPositiveMonth,
      total_interest: Math.round(totalInterest),
      interest_without_plan: without.interest,
      without_clears: without.clears,
      without_months: without.months,
      interest_saved: without.clears ? Math.max(0, without.interest - Math.round(totalInterest)) : null,
      money_freed_total: Math.round(moneyFreedTotal),
      final_savings: Math.round(savingsTotal),
      current_net: Math.round(-startDebt),
      total_improvement: Math.round(savingsTotal + startDebt),
      monthly,
      stalled,
      everything_done: everythingDone,
    },
  };
}
