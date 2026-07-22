import { Card } from "@/components/ui/Card";
import { SavingsAccountForm } from "@/components/savings/SavingsAccountForm";
import { InvestmentForm } from "@/components/savings/InvestmentForm";
import { DeleteSavingsButton } from "@/components/savings/DeleteSavingsButton";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/supabase/current-household";
import { INVESTMENT_TYPE_LABEL, savingsGoalRate, investmentGain, type InvestmentType } from "@/lib/asset-labels";
import { formatKRW, formatPercent } from "@/lib/utils";

/** 저축·투자 등록 + 목표 달성률·손익 표시 (요구사항 24, 25) */
export default async function SavingsInvestmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const membership = user ? await getCurrentMembership(supabase, user.id) : null;
  if (!membership) {
    return <p className="text-sm text-text-secondary">소속된 가정이 없습니다.</p>;
  }

  const [{ data: savings }, { data: investments }, { data: members }] = await Promise.all([
    supabase
      .from("savings_accounts")
      .select("*, owner:household_members(display_name)")
      .eq("household_id", membership.householdId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("investments")
      .select("*, owner:household_members(display_name)")
      .eq("household_id", membership.householdId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("household_members").select("*").eq("household_id", membership.householdId).eq("status", "active"),
  ]);

  const canManageAll = membership.role === "owner" || membership.role === "admin";

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">저축·투자</h1>
        <p className="mt-1 text-sm text-text-secondary">저축상품·투자상품을 등록하고 목표 달성률을 확인합니다.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-text-primary">저축</h2>
        <Card className="p-0">
          {!savings || savings.length === 0 ? (
            <p className="p-6 text-center text-sm text-text-secondary">등록된 저축상품이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-border">
              {savings.map((s) => {
                const rate = savingsGoalRate(s.current_balance, s.target_amount);
                const canEdit = canManageAll || s.created_by === user!.id;
                return (
                  <li key={s.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm text-text-primary">
                          {s.product_name} <span className="text-text-muted">· {s.institution}</span>
                        </div>
                        <div className="mt-0.5 text-xs text-text-muted">
                          {s.owner?.display_name ?? "미지정"} · 월 {formatKRW(s.monthly_contribution)} 납입
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm font-medium text-text-primary">{formatKRW(s.current_balance)}</span>
                        {canEdit && <DeleteSavingsButton table="savings_accounts" id={s.id} />}
                      </div>
                    </div>
                    {rate !== null && (
                      <>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-elevated">
                          <div className="h-full rounded-full bg-status-stable" style={{ width: `${rate}%` }} />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-text-muted">
                          <span>목표 {formatKRW(s.target_amount!)}</span>
                          <span>{formatPercent(rate, 0)} 달성</span>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card>
          <h3 className="mb-3 text-sm font-medium text-text-primary">저축 등록</h3>
          <SavingsAccountForm householdId={membership.householdId} members={members ?? []} />
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-text-primary">투자</h2>
        <Card className="p-0">
          {!investments || investments.length === 0 ? (
            <p className="p-6 text-center text-sm text-text-secondary">등록된 투자상품이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-border">
              {investments.map((iv) => {
                const gain = investmentGain(iv.principal, iv.current_valuation);
                const canEdit = canManageAll || iv.created_by === user!.id;
                return (
                  <li key={iv.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm text-text-primary">
                        {iv.product_name}{" "}
                        <span className="text-text-muted">· {INVESTMENT_TYPE_LABEL[iv.investment_type as InvestmentType]}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-text-muted">
                        {iv.owner?.display_name ?? "미지정"} · {iv.institution}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-right">
                      <div>
                        <div className="text-sm font-medium text-text-primary">{formatKRW(iv.current_valuation)}</div>
                        <div
                          className={
                            "text-xs " + (gain.amount > 0 ? "text-status-stable" : gain.amount < 0 ? "text-status-danger" : "text-text-muted")
                          }
                        >
                          {gain.amount >= 0 ? "+" : ""}
                          {formatKRW(gain.amount)} ({formatPercent(gain.rate, 1)})
                        </div>
                      </div>
                      {canEdit && <DeleteSavingsButton table="investments" id={iv.id} />}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card>
          <h3 className="mb-3 text-sm font-medium text-text-primary">투자 등록</h3>
          <InvestmentForm householdId={membership.householdId} members={members ?? []} />
        </Card>
      </section>
    </div>
  );
}
