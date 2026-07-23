import { NextResponse } from "next/server";
import { startOfMonth } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/supabase/current-household";
import { loadCurrentMonthSummary } from "@/lib/finance-engine/load-monthly-summary";
import { generateRuleBasedRecommendations } from "@/lib/finance-engine/recommendations";
import { requestAiRecommendation, computeInputHash, type AiProvider } from "@/lib/ai/recommend";

/** 남용 방지용 최종 안전장치 — 요금제 조회가 실패하는 예외 상황에서만 사용하는 하한값 */
const FALLBACK_MONTHLY_AI_LIMIT = 5;

/** AI 상세권고 요청 — 버튼을 눌렀을 때만 서버에서 AI를 호출한다 (요구사항 33) */
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const membership = await getCurrentMembership(supabase, user.id);
  if (!membership) {
    return NextResponse.json({ error: "소속된 가정이 없습니다." }, { status: 403 });
  }

  // 요금제(14단계)별 AI 월 사용한도를 조회 — households.plan_code → pricing_plans.ai_monthly_limit
  const { data: household } = await supabase
    .from("households")
    .select("plan_code")
    .eq("id", membership.householdId)
    .maybeSingle();
  const planCode = household?.plan_code ?? "free";
  const { data: plan } = await supabase
    .from("pricing_plans")
    .select("ai_monthly_limit, name")
    .eq("code", planCode)
    .maybeSingle();
  const monthlyLimit = plan?.ai_monthly_limit ?? FALLBACK_MONTHLY_AI_LIMIT;

  const monthStart = startOfMonth(new Date()).toISOString();
  const { count: usedThisMonth } = await supabase
    .from("ai_usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("household_id", membership.householdId)
    .eq("status", "success")
    .gte("created_at", monthStart);

  if ((usedThisMonth ?? 0) >= monthlyLimit) {
    await supabase.from("ai_usage_logs").insert({
      household_id: membership.householdId,
      user_id: user.id,
      status: "rate_limited",
    });
    return NextResponse.json(
      {
        ok: false,
        reason: "rate_limited",
        message: `이번 달 AI 상세권고 요청 한도(${plan?.name ?? "무료"} 요금제, ${monthlyLimit}회)에 도달했습니다. 요금제를 업그레이드하면 한도가 늘어납니다.`,
      },
      { status: 429 }
    );
  }

  const result = await loadCurrentMonthSummary(supabase, membership.householdId);
  const ruleBasedRecommendations = generateRuleBasedRecommendations(result);
  const inputHash = computeInputHash({ result, ruleBasedRecommendations });

  // 동일 입력에 대한 최근 24시간 내 결과가 있으면 재사용한다 (비용 절감)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: cached } = await supabase
    .from("ai_recommendations")
    .select("response_text, disclaimer, created_at")
    .eq("household_id", membership.householdId)
    .eq("input_hash", inputHash)
    .gte("created_at", oneDayAgo)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cached) {
    return NextResponse.json({
      ok: true,
      cached: true,
      text: cached.response_text,
      disclaimer: cached.disclaimer,
      createdAt: cached.created_at,
    });
  }

  // 가정이 자체 AI API 키를 등록했으면 그걸 우선 사용한다(설정 화면 → owner/admin만 등록 가능).
  // 일반 구성원도 이 값을 "사용"은 할 수 있어야 하므로 SECURITY DEFINER 함수를 거쳐 조회한다.
  const { data: aiConfigRows } = await supabase.rpc("get_household_ai_config", {
    hh_id: membership.householdId,
  });
  const aiConfig = aiConfigRows?.[0];
  const householdOverride = aiConfig
    ? { provider: aiConfig.provider as AiProvider, apiKey: aiConfig.api_key, model: aiConfig.model }
    : null;

  const outcome = await requestAiRecommendation({ result, ruleBasedRecommendations }, householdOverride);

  if (!outcome.ok) {
    await supabase.from("ai_usage_logs").insert({
      household_id: membership.householdId,
      user_id: user.id,
      status: outcome.reason,
    });
    const status = outcome.reason === "not_configured" ? 200 : 502;
    return NextResponse.json({ ok: false, reason: outcome.reason, message: outcome.message }, { status });
  }

  const disclaimer =
    "이 내용은 참고용이며 특정 금융상품의 매수·매도·해지를 권고하지 않고, 전문 금융자문을 대신하지 않습니다.";

  const { error: insertError } = await supabase.from("ai_recommendations").insert({
    household_id: membership.householdId,
    scenario_id: result.calculationBasis.scenarioId,
    analysis_period_start: result.calculationBasis.periodStart,
    analysis_period_end: result.calculationBasis.periodEnd,
    response_text: outcome.text,
    input_hash: outcome.inputHash,
    disclaimer,
    created_by: user.id,
  });

  await supabase.from("ai_usage_logs").insert({
    household_id: membership.householdId,
    user_id: user.id,
    status: insertError ? "fail" : "success",
  });

  return NextResponse.json({ ok: true, cached: false, text: outcome.text, disclaimer });
}
