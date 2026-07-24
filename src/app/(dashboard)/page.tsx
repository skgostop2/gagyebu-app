import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowDownCircle, ArrowUpCircle, Camera, Sparkles, ArrowRight } from "lucide-react";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ko } from "date-fns/locale";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { RecommendationList } from "@/components/dashboard/RecommendationList";
import { StatusBadge, type FinanceStatus } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { generateRuleBasedRecommendations } from "@/lib/finance-engine/recommendations";
import { loadCurrentMonthSummary } from "@/lib/finance-engine/load-monthly-summary";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/supabase/current-household";

// 15단계 경량화 — recharts는 홈 화면 초기 번들에서 제외하고 지연로딩한다 (reports 화면과 동일한 패턴)
const TrendChart = dynamic(() => import("@/components/dashboard/TrendChart").then((m) => m.TrendChart), {
  loading: () => <div className="h-64 w-full animate-pulse rounded-xl bg-bg-elevated" />,
});

/** 간결한 대시보드 홈 (요구사항 35) — 핵심 카드 최대 6개 + 그래프 1개 + 권고 최대 3개 */
export default async function DashboardHomePage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  const membership = user ? await getCurrentMembership(supabase, user.id) : null;
  const now = new Date();

  const { data: household } = membership
    ? await supabase.from("households").select("name").eq("id", membership.householdId).single()
    : { data: null };

  // 대시보드 레이아웃에서 이미 가정 소속 여부를 확인하므로 membership은 정상적으로 존재한다.
  const result = await loadCurrentMonthSummary(supabase, membership!.householdId);

  const { data: activeScenario } = result.calculationBasis.scenarioId
    ? await supabase.from("income_scenarios").select("name").eq("id", result.calculationBasis.scenarioId).maybeSingle()
    : { data: null };

  const recommendations = generateRuleBasedRecommendations(result);

  const status: FinanceStatus =
    result.monthlyShortfall > 0 ? "danger" : result.budgetExceededAmount > 0 ? "caution" : "stable";

  // 최근 6개월 수입·지출 그래프 데이터
  const sixMonthsAgo = startOfMonth(subMonths(now, 5));
  const { data: recentTx } = membership
    ? await supabase
        .from("transactions")
        .select("occurred_at, type, amount")
        .eq("household_id", membership.householdId)
        .is("deleted_at", null)
        .gte("occurred_at", sixMonthsAgo.toISOString())
    : { data: [] };

  const monthlyTrend = Array.from({ length: 6 }).map((_, i) => {
    const d = subMonths(now, 5 - i);
    const start = startOfMonth(d);
    const end = endOfMonth(d);
    const inMonth = (recentTx ?? []).filter((t) => {
      const occurred = new Date(t.occurred_at);
      return occurred >= start && occurred <= end;
    });
    const income = inMonth.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
    const expense = inMonth
      .filter((t) => t.type === "living_expense" || t.type === "debt_interest")
      .reduce((a, t) => a + t.amount, 0);
    return { month: format(d, "M월", { locale: ko }), income, expense };
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">이번 달 요약</h1>
          <p className="text-sm text-text-secondary">
            {format(now, "yyyy년 M월", { locale: ko })} · {household?.name ?? ""}
          </p>
          {activeScenario && (
            <p className="mt-1 text-xs text-cyan">
              &quot;{activeScenario.name}&quot; 시나리오 적용 중 ·{" "}
              <Link href="/income-scenarios" className="underline">
                변경
              </Link>
            </p>
          )}
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <SummaryCard label="이번 달 수입" amount={result.currentMonthlyIncome} icon={ArrowUpCircle} tone="positive" />
        <SummaryCard label="이번 달 생활지출" amount={result.livingExpense} icon={ArrowDownCircle} tone="negative" />
        <SummaryCard label="저축·투자액" amount={result.savingsAmount + result.investmentAmount} icon={ArrowUpCircle} />
        <SummaryCard
          label="남은 사용 가능금액"
          amount={result.monthlySurplus}
          icon={Sparkles}
          tone={result.monthlySurplus > 0 ? "positive" : "negative"}
        />
        <SummaryCard
          label="미래 예상 부족금"
          amount={result.monthlyShortfall}
          icon={ArrowDownCircle}
          tone={result.monthlyShortfall > 0 ? "negative" : "positive"}
        />
        <SummaryCard label="가족 순자산" amount={result.netWorth} icon={Sparkles} tone="positive" />
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-secondary">최근 6개월 수입·지출</h2>
          <Link href="/reports" className="flex items-center gap-1 text-xs text-cyan hover:underline">
            상세보기 <ArrowRight size={12} />
          </Link>
        </div>
        <TrendChart data={monthlyTrend} />
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-medium text-text-secondary">핵심 권고</h2>
        <RecommendationList items={recommendations} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Link href="/transactions/new?type=income">
          <Button variant="secondary" fullWidth>
            <ArrowUpCircle size={16} /> 수입 등록
          </Button>
        </Link>
        <Link href="/transactions/new">
          <Button variant="secondary" fullWidth>
            <ArrowDownCircle size={16} /> 지출 등록
          </Button>
        </Link>
        <Link href="/transactions/new/upload">
          <Button variant="secondary" fullWidth>
            <Camera size={16} /> 사진·PDF 등록
          </Button>
        </Link>
        <Link href="/recommendations">
          <Button variant="primary" fullWidth>
            <Sparkles size={16} /> AI 상세분석
          </Button>
        </Link>
      </div>
    </div>
  );
}
