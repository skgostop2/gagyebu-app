import { Card } from "@/components/ui/Card";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/supabase/current-household";
import { formatKRW } from "@/lib/utils";

/** 요금제 안내 화면 (14단계) — 결제 연동은 이후 단계 과제, 지금은 요금제 구조·표시·한도 적용까지 */
export default async function PricingPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  const membership = user ? await getCurrentMembership(supabase, user.id) : null;

  const [{ data: plans }, { data: household }] = await Promise.all([
    supabase.from("pricing_plans").select("*").eq("is_active", true).order("sort_order"),
    membership
      ? supabase.from("households").select("plan_code").eq("id", membership.householdId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const currentPlanCode = household?.plan_code ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">요금제</h1>
        <p className="mt-1 text-sm text-text-secondary">
          가정마다 하나의 요금제가 적용되며, AI 상세권고 월 사용횟수와 구성원 수 한도가 요금제별로 다릅니다. 실제 결제
          연동은 아직 준비 중이며, 지금은 요금제 구조와 한도 적용까지만 지원합니다.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(plans ?? []).map((plan) => {
          const isCurrent = plan.code === currentPlanCode;
          return (
            <Card key={plan.code} className={isCurrent ? "border-2 border-neon-blue" : undefined}>
              {isCurrent && (
                <span className="mb-2 inline-block rounded-full bg-neon-blue/15 px-2.5 py-0.5 text-xs font-medium text-neon-blue">
                  현재 요금제
                </span>
              )}
              <h2 className="text-lg font-semibold text-text-primary">{plan.name}</h2>
              <p className="mt-1 text-2xl font-bold text-text-primary">
                {plan.price_krw_monthly === 0 ? "무료" : formatKRW(plan.price_krw_monthly)}
                {plan.price_krw_monthly > 0 && <span className="ml-1 text-sm font-normal text-text-muted">/ 월</span>}
              </p>
              <p className="mt-2 text-sm text-text-secondary">{plan.description}</p>
              <ul className="mt-3 space-y-1.5 text-sm text-text-secondary">
                <li>· AI 상세권고 월 {plan.ai_monthly_limit}회</li>
                <li>· 구성원 최대 {plan.member_limit}명</li>
              </ul>
            </Card>
          );
        })}
      </div>

      {!membership && <p className="text-sm text-text-muted">소속된 가정이 없으면 현재 요금제가 표시되지 않습니다.</p>}
    </div>
  );
}
