import { Card } from "@/components/ui/Card";
import { IncomeScenarioForm } from "@/components/scenarios/IncomeScenarioForm";
import { ScenarioActions } from "@/components/scenarios/ScenarioActions";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/supabase/current-household";
import { INCOME_SCENARIO_KIND_LABEL, type IncomeScenarioKind } from "@/lib/income-scenario-labels";
import { formatKRW, formatDateShortKo } from "@/lib/utils";

/** 미래수입 시나리오 등록·적용 (요구사항 30) — 적용된 시나리오는 대시보드·기본권고 계산에 즉시 반영된다 */
export default async function IncomeScenariosPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  const membership = user ? await getCurrentMembership(supabase, user.id) : null;
  if (!membership) {
    return <p className="text-sm text-text-secondary">소속된 가정이 없습니다.</p>;
  }

  const { data: scenarios } = await supabase
    .from("income_scenarios")
    .select("*")
    .eq("household_id", membership.householdId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const activeScenario = (scenarios ?? []).find((s) => s.is_active);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">미래수입 시나리오</h1>
        <p className="mt-1 text-sm text-text-secondary">
          퇴사·이직·휴직·은퇴 등 상황별 예상 월수입을 등록하고, 하나를 적용하면 대시보드·기본권고 계산에 바로 반영됩니다.
        </p>
      </div>

      <Card>
        <div className="text-sm text-text-secondary">현재 적용 중인 시나리오</div>
        {activeScenario ? (
          <div className="mt-1">
            <div className="text-lg font-semibold text-text-primary">{activeScenario.name}</div>
            <div className="text-sm text-text-muted">
              예상 월수입 {formatKRW(activeScenario.projected_monthly_income)} · {activeScenario.effective_from} 부터
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm text-text-muted">적용된 시나리오가 없습니다. 이번 달 실제 수입 기준으로 계산됩니다.</p>
        )}
      </Card>

      <Card className="p-0">
        {!scenarios || scenarios.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-secondary">등록된 시나리오가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border">
            {scenarios.map((s) => (
              <li key={s.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm text-text-primary">
                      {s.name}
                      {s.is_active && <span className="ml-2 text-xs text-status-stable">● 적용 중</span>}
                    </div>
                    <div className="mt-0.5 text-xs text-text-muted">
                      {INCOME_SCENARIO_KIND_LABEL[s.kind as IncomeScenarioKind]} · {formatDateShortKo(s.effective_from)} 부터
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-text-primary">{formatKRW(s.projected_monthly_income)}</span>
                </div>
                <div className="mt-2">
                  <ScenarioActions scenarioId={s.id} householdId={membership.householdId} isActive={s.is_active} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-medium text-text-primary">시나리오 등록</h2>
        <IncomeScenarioForm householdId={membership.householdId} />
      </Card>
    </div>
  );
}
