import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { RecommendationList } from "@/components/dashboard/RecommendationList";
import { AIRecommendationButton } from "@/components/recommendations/AIRecommendationButton";
import { generateRuleBasedRecommendations } from "@/lib/finance-engine/recommendations";
import { loadCurrentMonthSummary } from "@/lib/finance-engine/load-monthly-summary";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/supabase/current-household";

/**
 * 기본권고(요구사항 32)는 규칙기반 계산 결과로 지금 바로 정상 작동한다 — AI 없이도 동작.
 * AI 상세권고(요구사항 33)는 버튼을 눌렀을 때만 /api/ai/recommend를 통해 서버에서 AI를 호출한다 (11단계).
 */
export default async function RecommendationsPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  const membership = user ? await getCurrentMembership(supabase, user.id) : null;
  const result = await loadCurrentMonthSummary(supabase, membership!.householdId);
  const recommendations = generateRuleBasedRecommendations(result);

  const { data: activeScenario } = result.calculationBasis.scenarioId
    ? await supabase.from("income_scenarios").select("name").eq("id", result.calculationBasis.scenarioId).maybeSingle()
    : { data: null };

  const { data: latestAiRecommendation } = membership
    ? await supabase
        .from("ai_recommendations")
        .select("response_text, disclaimer, created_at")
        .eq("household_id", membership.householdId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-xl font-semibold text-text-primary">기본권고 · AI 권고</h1>

      <p className="text-xs text-text-muted">
        계산기준: {result.calculationBasis.periodStart.slice(0, 10)} ~ {result.calculationBasis.periodEnd.slice(0, 10)}
        {activeScenario ? ` · "${activeScenario.name}" 시나리오 적용 중` : " · 이번 달 실제 수입 기준"}
      </p>

      <div>
        <h2 className="mb-2 text-sm font-medium text-text-secondary">기본권고 (규칙기반, 지금 바로 동작)</h2>
        <RecommendationList items={recommendations} />
      </div>

      <Card>
        <div className="mb-2 flex items-center gap-2">
          <Sparkles size={16} className="text-purple" />
          <h2 className="text-sm font-medium text-text-primary">AI 상세권고</h2>
        </div>
        <p className="mb-3 text-xs text-text-secondary">
          버튼을 눌렀을 때만 서버에서 AI를 호출합니다. 특정 금융상품의 매수·매도나 보험해지를 단정적으로 권고하지 않으며,
          결과는 참고용으로만 제공되고 전문 금융자문을 대신하지 않습니다.
        </p>
        <AIRecommendationButton
          initialText={latestAiRecommendation?.response_text ?? null}
          initialDisclaimer={latestAiRecommendation?.disclaimer ?? null}
          initialCreatedAt={latestAiRecommendation?.created_at ?? null}
        />
      </Card>
    </div>
  );
}
