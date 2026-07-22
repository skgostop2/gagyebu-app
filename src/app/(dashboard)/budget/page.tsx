import { Card } from "@/components/ui/Card";
import { BudgetForm } from "@/components/budget/BudgetForm";
import { DeleteBudgetButton } from "@/components/budget/DeleteBudgetButton";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/supabase/current-household";
import {
  BUDGET_SCOPE_LABEL,
  BUDGET_HEALTH_LABEL,
  BUDGET_HEALTH_COLOR,
  computeBudgetUsage,
  computeBudgetHealth,
} from "@/lib/budget-labels";
import { formatKRW, formatPercent } from "@/lib/utils";

const HEALTH_ICON: Record<string, string> = {
  stable: "●",
  needs_attention: "◐",
  caution: "▲",
  danger: "■",
  exceeded: "■",
};

/** 예산 등록 + 사용률·알림임계치 표시 (요구사항 23) */
export default async function BudgetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const membership = user ? await getCurrentMembership(supabase, user.id) : null;
  if (!membership) {
    return <p className="text-sm text-text-secondary">소속된 가정이 없습니다.</p>;
  }

  const [{ data: budgets }, { data: members }, { data: categories }] = await Promise.all([
    supabase
      .from("budgets")
      .select("*, target_member:household_members(display_name), target_category:categories(name)")
      .eq("household_id", membership.householdId)
      .is("deleted_at", null)
      .order("period_start", { ascending: false })
      .limit(30),
    supabase.from("household_members").select("*").eq("household_id", membership.householdId).eq("status", "active"),
    supabase
      .from("categories")
      .select("*")
      .eq("household_id", membership.householdId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
  ]);

  const list = budgets ?? [];
  const canManageAll = membership.role === "owner" || membership.role === "admin";

  // 목록에 걸친 전체 기간의 거래를 한 번에 조회해 예산별로 재사용한다.
  let usageByBudget = new Map<string, { usage: number; ratio: number; health: string }>();
  if (list.length > 0) {
    const earliestStart = list.reduce((min, b) => (b.period_start < min ? b.period_start : min), list[0]!.period_start);
    const latestEnd = list.reduce((max, b) => (b.period_end > max ? b.period_end : max), list[0]!.period_end);

    const { data: rangeTx } = await supabase
      .from("transactions")
      .select("type, amount, is_fixed, category_id, actual_user_member_id, occurred_at")
      .eq("household_id", membership.householdId)
      .is("deleted_at", null)
      .gte("occurred_at", `${earliestStart}T00:00:00`)
      .lte("occurred_at", `${latestEnd}T23:59:59`);

    usageByBudget = new Map(
      list.map((b) => {
        const inPeriod = (rangeTx ?? []).filter(
          (t) => t.occurred_at >= `${b.period_start}T00:00:00` && t.occurred_at <= `${b.period_end}T23:59:59`
        );
        const usage = computeBudgetUsage(b.scope, inPeriod, b.target_member_id, b.target_category_id);
        const { ratio, health } = computeBudgetHealth(usage, b.limit_amount, b.alert_thresholds);
        return [b.id, { usage, ratio, health }];
      })
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">예산</h1>
        <p className="mt-1 text-sm text-text-secondary">범위별로 예산을 등록하고 사용률·알림 임계치를 확인합니다.</p>
      </div>

      <Card className="p-0">
        {list.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-secondary">등록된 예산이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border">
            {list.map((b) => {
              const stat = usageByBudget.get(b.id) ?? { usage: 0, ratio: 0, health: "stable" };
              const canEdit = canManageAll || b.created_by === user!.id;
              const target =
                b.scope === "member"
                  ? b.target_member?.display_name
                  : b.scope === "category"
                    ? b.target_category?.name
                    : null;
              return (
                <li key={b.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm text-text-primary">
                        {BUDGET_SCOPE_LABEL[b.scope]}
                        {target ? ` · ${target}` : ""}
                      </div>
                      <div className="mt-0.5 text-xs text-text-muted">
                        {b.period_start} ~ {b.period_end}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold " +
                          BUDGET_HEALTH_COLOR[stat.health as keyof typeof BUDGET_HEALTH_COLOR]
                        }
                      >
                        <span aria-hidden>{HEALTH_ICON[stat.health]}</span>
                        {BUDGET_HEALTH_LABEL[stat.health as keyof typeof BUDGET_HEALTH_LABEL]}
                      </span>
                      {canEdit && <DeleteBudgetButton budgetId={b.id} />}
                    </div>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-elevated">
                    <div
                      className={
                        "h-full rounded-full " +
                        (stat.ratio >= 100
                          ? "bg-status-danger"
                          : stat.ratio >= 70
                            ? "bg-status-caution"
                            : "bg-status-stable")
                      }
                      style={{ width: `${Math.min(100, stat.ratio)}%` }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-text-muted">
                    <span>
                      {formatKRW(stat.usage)} / {formatKRW(b.limit_amount)}
                    </span>
                    <span>{formatPercent(stat.ratio, 0)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-medium text-text-primary">예산 등록</h2>
        <BudgetForm householdId={membership.householdId} members={members ?? []} categories={categories ?? []} />
      </Card>
    </div>
  );
}
