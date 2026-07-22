/**
 * 규칙기반 재정계산 엔진 (요구사항 31)
 *
 * 원칙: DB·네트워크·AI에 의존하지 않는 순수함수만 둔다.
 * 입력은 이미 조회된 구조화 데이터, 출력은 계산결과 객체.
 * 이렇게 분리해야 "AI가 계산금액을 임의로 생성·변경하지 않는다"(원칙 16)를
 * 구조적으로 보장할 수 있고, 단위테스트로 계산 정확성을 검증할 수 있다.
 */

import type { FinanceCalculationResult, Transaction } from "@/lib/types";

export interface FinanceEngineInput {
  periodStart: string;
  periodEnd: string;
  scenarioId: string | null;
  transactions: Transaction[];
  projectedMonthlyIncome: number | null; // 시나리오 미선택 시 null
  totalAssetsCash: number;
  totalAssets: number;
  totalLiabilities: number;
  budgetLimitTotal: number;
  upcomingCardBilling: number;
  savingsTargetTotal: number;
  savingsCurrentTotal: number;
  debtMonthlyPaymentTotal: number;
}

function sumByType(transactions: Transaction[], type: Transaction["type"]): number {
  return transactions
    .filter((t) => t.type === type && t.status === "active")
    .reduce((acc, t) => acc + t.amount, 0);
}

/**
 * 핵심 계산 함수. 요구사항 17의 처리원칙을 그대로 반영한다:
 * - 저축·투자는 소비지출이 아니다
 * - 계좌 간 이동(transfer)은 수입·지출 합계에서 제외
 * - 대출이자는 생활지출로 집계, 원금상환은 부채 감소로만 반영
 * - 카드대금 정산(card_settlement)은 카드 사용내역과 별개로 취급해 이중계산하지 않는다
 */
export function calculateFinanceSummary(input: FinanceEngineInput): FinanceCalculationResult {
  const {
    transactions,
    periodStart,
    periodEnd,
    scenarioId,
    projectedMonthlyIncome,
    totalAssetsCash,
    totalAssets,
    totalLiabilities,
    budgetLimitTotal,
    upcomingCardBilling,
    savingsTargetTotal,
    savingsCurrentTotal,
    debtMonthlyPaymentTotal,
  } = input;

  const currentMonthlyIncome = sumByType(transactions, "income");
  const livingExpense = sumByType(transactions, "living_expense") + sumByType(transactions, "debt_interest");
  const savingsAmount = sumByType(transactions, "saving");
  const investmentAmount = sumByType(transactions, "investment");
  const debtRepaymentAmount = sumByType(transactions, "debt_principal");

  const fixedExpense = transactions
    .filter((t) => t.type === "living_expense" && t.isFixed && t.status === "active")
    .reduce((acc, t) => acc + t.amount, 0);
  const variableExpense = livingExpense - fixedExpense;

  const essentialExpense = transactions
    .filter((t) => t.type === "living_expense" && t.isEssential && t.status === "active")
    .reduce((acc, t) => acc + t.amount, 0);
  const discretionaryExpense = livingExpense - essentialExpense;

  const projectedIncome = projectedMonthlyIncome ?? currentMonthlyIncome;
  const incomeDecreaseAmount = Math.max(0, currentMonthlyIncome - projectedIncome);
  const incomeDecreaseRate =
    currentMonthlyIncome > 0 ? (incomeDecreaseAmount / currentMonthlyIncome) * 100 : 0;

  const totalOutgo = livingExpense + savingsAmount + investmentAmount + debtRepaymentAmount;
  const monthlySurplus = Math.max(0, currentMonthlyIncome - totalOutgo);
  const monthlyShortfall = Math.max(0, totalOutgo - currentMonthlyIncome);

  const projectedOutgo = totalOutgo;
  const projectedShortfall = Math.max(0, projectedOutgo - projectedIncome);
  const minimumRequiredCut = projectedShortfall;

  const weeklyAvailable = Math.max(0, currentMonthlyIncome - totalOutgo) / 4.345;
  const dailyAvailable = weeklyAvailable / 7;

  const cashRunwayMonths =
    projectedShortfall > 0 ? totalAssetsCash / projectedShortfall : Infinity;

  const budgetExceededAmount = Math.max(0, livingExpense - budgetLimitTotal);

  const savingsGoalAchievementRate =
    savingsTargetTotal > 0 ? (savingsCurrentTotal / savingsTargetTotal) * 100 : 0;

  const debtBurdenRatio =
    currentMonthlyIncome > 0 ? (debtMonthlyPaymentTotal / currentMonthlyIncome) * 100 : 0;

  const netWorth = totalAssets - totalLiabilities;

  return {
    calculationBasis: {
      periodStart,
      periodEnd,
      scenarioId,
      generatedAt: new Date().toISOString(),
    },
    currentMonthlyIncome,
    projectedMonthlyIncome: projectedIncome,
    incomeDecreaseAmount,
    incomeDecreaseRate,
    livingExpense,
    fixedExpense,
    variableExpense,
    essentialExpense,
    discretionaryExpense,
    savingsAmount,
    investmentAmount,
    debtRepaymentAmount,
    monthlySurplus,
    monthlyShortfall: Math.max(monthlyShortfall, projectedShortfall),
    minimumRequiredCut,
    weeklyAvailable,
    dailyAvailable,
    cashRunwayMonths: Number.isFinite(cashRunwayMonths) ? cashRunwayMonths : 999,
    budgetExceededAmount,
    upcomingCardBilling,
    savingsGoalAchievementRate,
    debtBurdenRatio,
    netWorth,
  };
}
