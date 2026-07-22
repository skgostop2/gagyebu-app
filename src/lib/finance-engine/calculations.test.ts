import { describe, expect, it } from "vitest";
import { calculateFinanceSummary } from "./calculations";
import type { Transaction } from "@/lib/types";

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: crypto.randomUUID(),
    household_id: "h1",
    created_by: "u1",
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    deleted_at: null,
    status: "active",
    type: "income",
    amount: 0,
    occurredAt: "2026-07-01",
    categoryId: null,
    actualUser: { type: "household" },
    isFixed: false,
    isEssential: false,
    isRecurringInstance: false,
    recurringTransactionId: null,
    linkedCardTransactionId: null,
    linkedSavingsAccountId: null,
    linkedLiabilityId: null,
    memo: null,
    ...overrides,
  };
}

describe("calculateFinanceSummary", () => {
  it("계좌 간 이동(transfer)은 수입·지출 합계에서 제외한다", () => {
    const result = calculateFinanceSummary({
      periodStart: "2026-07-01",
      periodEnd: "2026-07-31",
      scenarioId: null,
      transactions: [
        tx({ type: "income", amount: 3_000_000 }),
        tx({ type: "living_expense", amount: 1_000_000, isFixed: true, isEssential: true }),
        tx({ type: "transfer", amount: 500_000 }),
      ],
      projectedMonthlyIncome: null,
      totalAssetsCash: 5_000_000,
      totalAssets: 10_000_000,
      totalLiabilities: 0,
      budgetLimitTotal: 2_000_000,
      upcomingCardBilling: 0,
      savingsTargetTotal: 0,
      savingsCurrentTotal: 0,
      debtMonthlyPaymentTotal: 0,
    });

    expect(result.currentMonthlyIncome).toBe(3_000_000);
    expect(result.livingExpense).toBe(1_000_000);
    expect(result.monthlySurplus).toBe(2_000_000);
  });

  it("대출이자는 생활지출로, 원금상환은 부채감소로만 반영한다", () => {
    const result = calculateFinanceSummary({
      periodStart: "2026-07-01",
      periodEnd: "2026-07-31",
      scenarioId: null,
      transactions: [
        tx({ type: "income", amount: 4_000_000 }),
        tx({ type: "debt_interest", amount: 200_000, isEssential: true }),
        tx({ type: "debt_principal", amount: 500_000 }),
      ],
      projectedMonthlyIncome: null,
      totalAssetsCash: 5_000_000,
      totalAssets: 10_000_000,
      totalLiabilities: 3_000_000,
      budgetLimitTotal: 2_000_000,
      upcomingCardBilling: 0,
      savingsTargetTotal: 0,
      savingsCurrentTotal: 0,
      debtMonthlyPaymentTotal: 700_000,
    });

    expect(result.livingExpense).toBe(200_000);
    expect(result.debtRepaymentAmount).toBe(500_000);
    expect(result.debtBurdenRatio).toBeCloseTo((700_000 / 4_000_000) * 100);
  });

  it("미래수입 감소 시 부족금과 최소절감액을 계산한다", () => {
    const result = calculateFinanceSummary({
      periodStart: "2026-07-01",
      periodEnd: "2026-07-31",
      scenarioId: "s1",
      transactions: [
        tx({ type: "income", amount: 5_000_000 }),
        tx({ type: "living_expense", amount: 3_000_000, isFixed: true, isEssential: true }),
      ],
      projectedMonthlyIncome: 3_000_000,
      totalAssetsCash: 6_000_000,
      totalAssets: 10_000_000,
      totalLiabilities: 0,
      budgetLimitTotal: 3_500_000,
      upcomingCardBilling: 0,
      savingsTargetTotal: 0,
      savingsCurrentTotal: 0,
      debtMonthlyPaymentTotal: 0,
    });

    expect(result.incomeDecreaseAmount).toBe(2_000_000);
    expect(result.minimumRequiredCut).toBe(0);
    expect(result.cashRunwayMonths).toBeGreaterThan(0);
  });
});
