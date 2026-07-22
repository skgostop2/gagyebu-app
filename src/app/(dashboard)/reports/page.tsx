import dynamic from "next/dynamic";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ko } from "date-fns/locale";
import { Card } from "@/components/ui/Card";
import { CloseMonthButton } from "@/components/reports/CloseMonthButton";
import { ReportActions } from "@/components/reports/ReportActions";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/supabase/current-household";
import { computeBudgetUsage, computeBudgetHealth, BUDGET_SCOPE_LABEL } from "@/lib/budget-labels";
import { formatKRW, formatDateShortKo } from "@/lib/utils";

/**
 * 상세그래프 화면 (8단계, 요구사항 37) — 대시보드 홈은 그래프 1개만 유지하고,
 * 나머지 상세 그래프는 이 화면에서 next/dynamic 지연로딩으로 불러온다.
 * 12단계에서 이 화면 내용을 PDF로 내보내는 기능이 추가될 예정이다.
 */
const CategoryBreakdownChart = dynamic(
  () => import("@/components/reports/CategoryBreakdownChart").then((m) => m.CategoryBreakdownChart),
  { loading: () => <ChartSkeleton /> }
);
const NetWorthTrendChart = dynamic(
  () => import("@/components/reports/NetWorthTrendChart").then((m) => m.NetWorthTrendChart),
  { loading: () => <ChartSkeleton /> }
);
const BudgetUsageBarChart = dynamic(
  () => import("@/components/reports/BudgetUsageBarChart").then((m) => m.BudgetUsageBarChart),
  { loading: () => <ChartSkeleton /> }
);
const TrendChart = dynamic(() => import("@/components/dashboard/TrendChart").then((m) => m.TrendChart), {
  loading: () => <ChartSkeleton />,
});

function ChartSkeleton() {
  return <div className="h-64 w-full animate-pulse rounded-xl bg-bg-elevated" />;
}

const CATEGORY_PALETTE = ["#22d3ee", "#a855f7", "#3b82f6", "#34d399", "#fbbf24", "#f87171", "#f472b6", "#94a3b8"];

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const membership = user ? await getCurrentMembership(supabase, user.id) : null;
  if (!membership) {
    return <p className="text-sm text-text-secondary">소속된 가정이 없습니다.</p>;
  }

  const householdId = membership.householdId;
  const { data: household } = await supabase.from("households").select("name").eq("id", householdId).single();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const twelveMonthsAgo = startOfMonth(subMonths(now, 11));
  const todayStr = now.toISOString().slice(0, 10);

  const [{ data: yearTx }, { data: monthTx }, { data: categories }, { data: snapshots }, { data: budgets }, { data: closings }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("occurred_at, type, amount")
        .eq("household_id", householdId)
        .is("deleted_at", null)
        .gte("occurred_at", twelveMonthsAgo.toISOString()),
      supabase
        .from("transactions")
        .select("type, amount, category_id, is_fixed, actual_user_member_id")
        .eq("household_id", householdId)
        .is("deleted_at", null)
        .gte("occurred_at", monthStart.toISOString())
        .lte("occurred_at", monthEnd.toISOString()),
      supabase.from("categories").select("id, name, color").eq("household_id", householdId),
      supabase
        .from("asset_snapshots")
        .select("snapshot_month, net_worth, total_assets, total_liabilities")
        .eq("household_id", householdId)
        .order("snapshot_month", { ascending: true })
        .limit(12),
      supabase
        .from("budgets")
        .select("id, scope, limit_amount, alert_thresholds, target_member_id, target_category_id")
        .eq("household_id", householdId)
        .is("deleted_at", null)
        .lte("period_start", todayStr)
        .gte("period_end", todayStr),
      supabase
        .from("monthly_closings")
        .select("closed_month, total_income, total_expense, total_savings, net_worth, closed_at")
        .eq("household_id", householdId)
        .order("closed_month", { ascending: false })
        .limit(6),
    ]);

  // 12개월 수입·지출 추이
  const monthlyTrend = Array.from({ length: 12 }).map((_, i) => {
    const d = subMonths(now, 11 - i);
    const start = startOfMonth(d);
    const end = endOfMonth(d);
    const inMonth = (yearTx ?? []).filter((t) => {
      const occurred = new Date(t.occurred_at);
      return occurred >= start && occurred <= end;
    });
    const income = inMonth.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
    const expense = inMonth
      .filter((t) => t.type === "living_expense" || t.type === "debt_interest")
      .reduce((a, t) => a + t.amount, 0);
    return { month: format(d, "M월", { locale: ko }), income, expense };
  });

  // 이번 달 카테고리별 지출 비중
  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c]));
  const categoryTotals = new Map<string, number>();
  (monthTx ?? [])
    .filter((t) => t.type === "living_expense")
    .forEach((t) => {
      const key = t.category_id ?? "__uncategorized";
      categoryTotals.set(key, (categoryTotals.get(key) ?? 0) + t.amount);
    });
  const categoryBreakdown = Array.from(categoryTotals.entries())
    .map(([categoryId, value], i) => {
      const category = categoryMap.get(categoryId);
      return {
        name: category?.name ?? "미분류",
        value,
        color: category?.color ?? CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] ?? "#94a3b8",
      };
    })
    .sort((a, b) => b.value - a.value);

  // 순자산 추이 (스냅샷 기준)
  const netWorthTrend = (snapshots ?? []).map((s) => ({
    month: format(new Date(`${s.snapshot_month}-01`), "yyyy.M", { locale: ko }),
    netWorth: s.net_worth,
    totalAssets: s.total_assets,
    totalLiabilities: s.total_liabilities,
  }));

  // 진행 중인 예산 사용률
  const budgetUsage = (budgets ?? []).map((b) => {
    const used = computeBudgetUsage(b.scope, monthTx ?? [], b.target_member_id, b.target_category_id);
    const { ratio, health } = computeBudgetHealth(used, b.limit_amount, b.alert_thresholds ?? [70, 90, 100]);
    const categoryName = b.target_category_id ? categoryMap.get(b.target_category_id)?.name : null;
    return {
      name: categoryName ?? BUDGET_SCOPE_LABEL[b.scope] ?? b.scope,
      ratio: Math.round(ratio),
      health,
    };
  });

  const thisMonth = monthlyTrend[monthlyTrend.length - 1];
  const latestNetWorth = netWorthTrend[netWorthTrend.length - 1];
  const shareText = [
    `${household?.name ?? "우리 가정"} 가계부 · ${format(now, "yyyy년 M월", { locale: ko })} 요약`,
    thisMonth ? `수입 ${formatKRW(thisMonth.income)} · 지출 ${formatKRW(thisMonth.expense)}` : null,
    latestNetWorth ? `순자산 ${formatKRW(latestNetWorth.netWorth)} (${latestNetWorth.month} 기준)` : null,
    "가족 공동 가계부 앱에서 생성됨",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="hidden print:block">
        <h1 className="text-xl font-semibold text-text-primary">
          {household?.name ?? "우리 가정"} · 상세 리포트
        </h1>
        <p className="mt-1 text-sm text-text-secondary">{format(now, "yyyy년 M월 d일", { locale: ko })} 기준</p>
      </div>

      <div className="print:hidden">
        <h1 className="text-xl font-semibold text-text-primary">상세 리포트</h1>
        <p className="mt-1 text-sm text-text-secondary">
          최근 12개월 수입·지출 추이, 이번 달 지출 비중, 순자산 추이, 예산 사용률을 한눈에 확인합니다.
        </p>
      </div>

      <ReportActions shareTitle={`${household?.name ?? "우리 가정"} 가계부 요약`} shareText={shareText} />

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-secondary">월마감</h2>
          <CloseMonthButton householdId={householdId} />
        </div>
        {!closings || closings.length === 0 ? (
          <p className="text-sm text-text-muted">아직 마감한 달이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border">
            {closings.map((c) => (
              <li key={c.closed_month} className="flex items-center justify-between py-2 text-sm">
                <span className="text-text-primary">{c.closed_month}</span>
                <span className="text-text-secondary">
                  수입 {formatKRW(c.total_income)} · 지출 {formatKRW(c.total_expense)} · 저축·투자 {formatKRW(c.total_savings)}
                </span>
                <span className="shrink-0 text-xs text-text-muted">{formatDateShortKo(c.closed_at)} 마감</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-medium text-text-secondary">최근 12개월 수입·지출</h2>
        <TrendChart data={monthlyTrend} />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-medium text-text-secondary">이번 달 카테고리별 지출 비중</h2>
        <CategoryBreakdownChart data={categoryBreakdown} />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-medium text-text-secondary">순자산 추이 (월별 스냅샷)</h2>
        <NetWorthTrendChart data={netWorthTrend} />
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-medium text-text-secondary">진행 중인 예산 사용률</h2>
        <BudgetUsageBarChart data={budgetUsage} />
      </Card>
    </div>
  );
}
