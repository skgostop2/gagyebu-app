import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from "date-fns";
import type { BudgetHealth } from "@/lib/types";
import type { Tables } from "@/lib/supabase/database.types";

export const BUDGET_SCOPE_LABEL: Record<string, string> = {
  household_monthly: "가정 전체 (월간)",
  member: "구성원별",
  category: "카테고리별",
  fixed_expense: "고정지출",
  variable_expense: "변동지출",
  weekly: "주간",
  daily: "일간",
};

export const BUDGET_SCOPES = [
  "household_monthly",
  "member",
  "category",
  "fixed_expense",
  "variable_expense",
  "weekly",
  "daily",
] as const;

export type BudgetScope = (typeof BUDGET_SCOPES)[number];

export const BUDGET_HEALTH_LABEL: Record<BudgetHealth, string> = {
  stable: "정상",
  needs_attention: "확인 필요",
  caution: "주의",
  danger: "위험",
  exceeded: "초과",
};

export const BUDGET_HEALTH_COLOR: Record<BudgetHealth, string> = {
  stable: "text-status-stable",
  needs_attention: "text-status-caution",
  caution: "text-status-caution",
  danger: "text-status-danger",
  exceeded: "text-status-danger",
};

/** scope에 맞는 기본 기간(YYYY-MM-DD)을 오늘 기준으로 계산한다 */
export function defaultPeriodForScope(scope: BudgetScope): { start: string; end: string } {
  const now = new Date();
  if (scope === "weekly") {
    return {
      start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      end: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    };
  }
  if (scope === "daily") {
    const d = format(now, "yyyy-MM-dd");
    return { start: d, end: d };
  }
  return {
    start: format(startOfMonth(now), "yyyy-MM-dd"),
    end: format(endOfMonth(now), "yyyy-MM-dd"),
  };
}

type TxRow = Pick<Tables<"transactions">, "type" | "amount" | "is_fixed" | "category_id" | "actual_user_member_id">;

/** 예산 범위에 해당하는 거래만 골라 사용액을 계산한다 (요구사항 17: 저축·투자·이동은 소비지출이 아님) */
export function computeBudgetUsage(
  scope: string,
  transactions: TxRow[],
  targetMemberId: string | null,
  targetCategoryId: string | null
): number {
  let rows =
    scope === "household_monthly"
      ? transactions.filter((t) => t.type === "living_expense" || t.type === "debt_interest")
      : transactions.filter((t) => t.type === "living_expense");

  if (scope === "member" && targetMemberId) rows = rows.filter((t) => t.actual_user_member_id === targetMemberId);
  if (scope === "category" && targetCategoryId) rows = rows.filter((t) => t.category_id === targetCategoryId);
  if (scope === "fixed_expense") rows = rows.filter((t) => t.is_fixed);
  if (scope === "variable_expense") rows = rows.filter((t) => !t.is_fixed);

  return rows.reduce((acc, t) => acc + t.amount, 0);
}

/** 사용률(%)과 알림 임계치로 예산 상태를 판정한다 */
export function computeBudgetHealth(
  usedAmount: number,
  limitAmount: number,
  alertThresholds: number[]
): { ratio: number; health: BudgetHealth } {
  const ratio = limitAmount > 0 ? (usedAmount / limitAmount) * 100 : 0;
  const [t1, t2, t3] = [...alertThresholds].sort((a, b) => a - b);

  let health: BudgetHealth = "stable";
  if (t3 !== undefined && ratio >= t3) health = "exceeded";
  else if (t2 !== undefined && ratio >= t2) health = "danger";
  else if (t1 !== undefined && ratio >= t1) health = "caution";

  return { ratio, health };
}
