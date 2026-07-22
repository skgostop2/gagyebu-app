import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { startOfMonth, endOfMonth } from "date-fns";
import { calculateFinanceSummary } from "./calculations";
import type { Database } from "@/lib/supabase/database.types";
import type { Tables } from "@/lib/supabase/database.types";
import type { TransactionType, FinanceCalculationResult } from "@/lib/types";
import { currentYearMonth, isDueInMonth, monthlyDueAmount } from "@/lib/card-labels";

type TxRow = Tables<"transactions">;

function toFinanceEngineTx(row: TxRow) {
  return {
    id: row.id,
    household_id: row.household_id,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
    status: "active" as const,
    type: row.type as TransactionType,
    amount: row.amount,
    occurredAt: row.occurred_at,
    categoryId: row.category_id,
    actualUser: { type: "household" as const },
    isFixed: row.is_fixed,
    isEssential: row.is_essential,
    isRecurringInstance: !!row.recurring_transaction_id,
    recurringTransactionId: row.recurring_transaction_id,
    linkedCardTransactionId: null,
    linkedSavingsAccountId: null,
    linkedLiabilityId: null,
    memo: row.memo,
  };
}

/**
 * 이번 달 거래를 조회해 규칙기반 계산 결과를 만든다.
 * 자산·부채·예산·카드 관련 입력은 해당 기능이 연결되는 단계 전까지 0으로 둔다.
 */
export async function loadCurrentMonthSummary(
  supabase: SupabaseClient<Database>,
  householdId: string
): Promise<FinanceCalculationResult> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const currentMonth = currentYearMonth();
  const todayStr = now.toISOString().slice(0, 10);

  const [
    { data },
    { data: cardTx },
    { data: budgets },
    { data: assetRows },
    { data: savingsRows },
    { data: investmentRows },
    { data: liabilityRows },
    { data: activeScenario },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .eq("household_id", householdId)
      .is("deleted_at", null)
      .gte("occurred_at", monthStart.toISOString())
      .lte("occurred_at", monthEnd.toISOString()),
    supabase
      .from("card_transactions")
      .select("amount, installment_months, monthly_fee, billing_month")
      .eq("household_id", householdId)
      .is("deleted_at", null)
      .lte("billing_month", currentMonth),
    supabase
      .from("budgets")
      .select("limit_amount")
      .eq("household_id", householdId)
      .eq("scope", "household_monthly")
      .is("deleted_at", null)
      .lte("period_start", todayStr)
      .gte("period_end", todayStr),
    supabase.from("assets").select("category, current_valuation").eq("household_id", householdId).is("deleted_at", null),
    supabase
      .from("savings_accounts")
      .select("current_balance, target_amount")
      .eq("household_id", householdId)
      .is("deleted_at", null),
    supabase.from("investments").select("current_valuation").eq("household_id", householdId).is("deleted_at", null),
    supabase
      .from("liabilities")
      .select("current_balance, monthly_payment")
      .eq("household_id", householdId)
      .is("deleted_at", null),
    supabase
      .from("income_scenarios")
      .select("id, projected_monthly_income")
      .eq("household_id", householdId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .maybeSingle(),
  ]);

  const upcomingCardBilling = (cardTx ?? [])
    .filter((t) => isDueInMonth(t.billing_month, t.installment_months, currentMonth))
    .reduce((acc, t) => acc + monthlyDueAmount(t.amount, t.installment_months, t.monthly_fee), 0);

  const budgetLimitTotal = (budgets ?? []).reduce((acc, b) => acc + b.limit_amount, 0);

  const assetsCashFromAssets = (assetRows ?? [])
    .filter((a) => a.category === "cash_equivalent")
    .reduce((acc, a) => acc + a.current_valuation, 0);
  const assetsTotal = (assetRows ?? []).reduce((acc, a) => acc + a.current_valuation, 0);
  const savingsCurrentTotal = (savingsRows ?? []).reduce((acc, s) => acc + s.current_balance, 0);
  const savingsTargetTotal = (savingsRows ?? []).reduce((acc, s) => acc + (s.target_amount ?? 0), 0);
  const investmentsTotal = (investmentRows ?? []).reduce((acc, i) => acc + i.current_valuation, 0);
  const totalLiabilities = (liabilityRows ?? []).reduce((acc, l) => acc + l.current_balance, 0);
  const debtMonthlyPaymentTotal = (liabilityRows ?? []).reduce((acc, l) => acc + l.monthly_payment, 0);

  const totalAssets = assetsTotal + savingsCurrentTotal + investmentsTotal;
  const totalAssetsCash = assetsCashFromAssets + savingsCurrentTotal;

  return calculateFinanceSummary({
    periodStart: monthStart.toISOString(),
    periodEnd: monthEnd.toISOString(),
    scenarioId: activeScenario?.id ?? null,
    transactions: (data ?? []).map(toFinanceEngineTx),
    projectedMonthlyIncome: activeScenario?.projected_monthly_income ?? null,
    totalAssetsCash,
    totalAssets,
    totalLiabilities,
    budgetLimitTotal,
    upcomingCardBilling,
    savingsTargetTotal,
    savingsCurrentTotal,
    debtMonthlyPaymentTotal,
  });
}
