/**
 * 기본 자동권고 (요구사항 32) — AI 없이 규칙만으로 생성.
 * 우선순위: 1 기본생활유지 → 2 연체방지 → 3 필수의료/보험 유지 →
 * 4 선택지출 조정 → 5 월적자 해소 → 6 비상금 확보 → 7 저축유지 검토 → 8 투자납입 조정 검토
 */

import type { FinanceCalculationResult, RuleBasedRecommendation } from "@/lib/types";

export function generateRuleBasedRecommendations(
  result: FinanceCalculationResult,
  options?: { emergencyFundMonths?: number; emergencyFundTarget?: number }
): RuleBasedRecommendation[] {
  const recs: RuleBasedRecommendation[] = [];
  const emergencyTarget = options?.emergencyFundTarget ?? result.livingExpense * 3;

  if (result.monthlyShortfall > 0) {
    recs.push({
      id: "monthly-deficit",
      code: "monthly_deficit",
      severity: "danger",
      title: "이번 달 적자가 예상됩니다",
      description: `현재 수입 대비 ${formatAmount(result.monthlyShortfall)} 부족합니다. 선택지출부터 조정해 기본생활을 우선 유지하세요.`,
      relatedAmount: result.monthlyShortfall,
      priority: 5,
    });
  }

  if (result.incomeDecreaseAmount > 0 && result.minimumRequiredCut > 0) {
    recs.push({
      id: "future-income-shortfall",
      code: "future_income_shortfall",
      severity: "warning",
      title: "미래수입 감소에 대비한 지출 조정이 필요합니다",
      description: `예상 수입이 ${formatAmount(result.incomeDecreaseAmount)}(${result.incomeDecreaseRate.toFixed(1)}%) 감소합니다. 최소 ${formatAmount(result.minimumRequiredCut)} 절감이 필요합니다.`,
      relatedAmount: result.minimumRequiredCut,
      priority: 1,
    });
  }

  if (result.budgetExceededAmount > 0) {
    recs.push({
      id: "budget-exceeded",
      code: "budget_exceeded",
      severity: "warning",
      title: "예산을 초과했습니다",
      description: `생활지출이 예산보다 ${formatAmount(result.budgetExceededAmount)} 많습니다. 선택지출 항목을 확인해 보세요.`,
      relatedAmount: result.budgetExceededAmount,
      priority: 4,
    });
  }

  if (result.cashRunwayMonths < 3) {
    recs.push({
      id: "emergency-fund-low",
      code: "emergency_fund_low",
      severity: "danger",
      title: "비상금이 부족합니다",
      description: `현재 현금성 자산으로 약 ${result.cashRunwayMonths.toFixed(1)}개월만 유지 가능합니다. 목표 비상금은 ${formatAmount(emergencyTarget)} 수준입니다.`,
      relatedAmount: emergencyTarget,
      priority: 6,
    });
  }

  if (result.debtBurdenRatio > 40) {
    recs.push({
      id: "debt-burden-high",
      code: "debt_burden_high",
      severity: "warning",
      title: "부채상환 부담이 높습니다",
      description: `월수입 대비 부채상환 비율이 ${result.debtBurdenRatio.toFixed(1)}%입니다. 연체 방지를 최우선으로 상환계획을 점검하세요.`,
      relatedAmount: null,
      priority: 2,
    });
  }

  if (
    result.monthlyShortfall > 0 &&
    (result.savingsAmount > 0 || result.investmentAmount > 0)
  ) {
    recs.push({
      id: "savings-investment-review",
      code: "savings_investment_overcommit",
      severity: "caution",
      title: "저축·투자 납입 조정을 검토해 보세요",
      description: "적자가 발생한 상태에서 저축·투자 납입을 유지하고 있습니다. 기본생활과 연체 방지를 먼저 확보한 뒤 조정 여부를 검토하세요.",
      relatedAmount: null,
      priority: 8,
    });
  }

  return recs.sort((a, b) => a.priority - b.priority);
}

function formatAmount(n: number): string {
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(n);
}
