import { Card } from "@/components/ui/Card";
import { AssetForm } from "@/components/assets/AssetForm";
import { LiabilityForm } from "@/components/assets/LiabilityForm";
import { DeleteAssetButton } from "@/components/assets/DeleteAssetButton";
import { SaveSnapshotButton } from "@/components/assets/SaveSnapshotButton";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/supabase/current-household";
import { ASSET_CATEGORY_LABEL, ASSET_KIND_LABEL, LIABILITY_KIND_LABEL, type AssetCategory, type LiabilityKind } from "@/lib/asset-labels";
import { formatKRW, formatDateShortKo } from "@/lib/utils";

/** 자산·부채 등록 + 순자산 자동계산 + 월별 스냅샷 (요구사항 26, 27, 28) */
export default async function AssetsLiabilitiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const membership = user ? await getCurrentMembership(supabase, user.id) : null;
  if (!membership) {
    return <p className="text-sm text-text-secondary">소속된 가정이 없습니다.</p>;
  }

  const [{ data: assets }, { data: liabilities }, { data: savings }, { data: investments }, { data: members }, { data: snapshots }] =
    await Promise.all([
      supabase
        .from("assets")
        .select("*, owner:household_members(display_name)")
        .eq("household_id", membership.householdId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("liabilities")
        .select("*, debtor:household_members(display_name)")
        .eq("household_id", membership.householdId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase.from("savings_accounts").select("current_balance").eq("household_id", membership.householdId).is("deleted_at", null),
      supabase.from("investments").select("current_valuation").eq("household_id", membership.householdId).is("deleted_at", null),
      supabase.from("household_members").select("*").eq("household_id", membership.householdId).eq("status", "active"),
      supabase
        .from("asset_snapshots")
        .select("*")
        .eq("household_id", membership.householdId)
        .order("snapshot_month", { ascending: false })
        .limit(12),
    ]);

  const canManageAll = membership.role === "owner" || membership.role === "admin";

  const assetsTotal = (assets ?? []).reduce((acc, a) => acc + a.current_valuation, 0);
  const savingsTotal = (savings ?? []).reduce((acc, s) => acc + s.current_balance, 0);
  const investmentsTotal = (investments ?? []).reduce((acc, i) => acc + i.current_valuation, 0);
  const liabilitiesTotal = (liabilities ?? []).reduce((acc, l) => acc + l.current_balance, 0);
  const totalAssets = assetsTotal + savingsTotal + investmentsTotal;
  const netWorth = totalAssets - liabilitiesTotal;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">자산·부채</h1>
        <p className="mt-1 text-sm text-text-secondary">자산·부채를 등록하면 순자산이 자동으로 계산됩니다.</p>
      </div>

      <Card>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xs text-text-secondary">총자산</div>
            <div className="mt-1 text-lg font-semibold text-text-primary">{formatKRW(totalAssets)}</div>
          </div>
          <div>
            <div className="text-xs text-text-secondary">총부채</div>
            <div className="mt-1 text-lg font-semibold text-status-danger">{formatKRW(liabilitiesTotal)}</div>
          </div>
          <div>
            <div className="text-xs text-text-secondary">순자산</div>
            <div className="mt-1 text-lg font-semibold text-status-stable">{formatKRW(netWorth)}</div>
          </div>
        </div>
        <p className="mt-3 text-xs text-text-muted">자산(등록된 자산 + 저축 잔액 + 투자 평가액) − 부채 = 순자산</p>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-primary">월별 스냅샷</h2>
          <SaveSnapshotButton householdId={membership.householdId} />
        </div>
        <Card className="p-0">
          {!snapshots || snapshots.length === 0 ? (
            <p className="p-6 text-center text-sm text-text-secondary">저장된 스냅샷이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-border">
              {snapshots.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-text-primary">{s.snapshot_month}</span>
                  <span className="text-sm font-medium text-text-primary">{formatKRW(s.net_worth)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-text-primary">자산</h2>
        <Card className="p-0">
          {!assets || assets.length === 0 ? (
            <p className="p-6 text-center text-sm text-text-secondary">등록된 자산이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-border">
              {assets.map((a) => {
                const canEdit = canManageAll || a.created_by === user!.id;
                return (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm text-text-primary">{a.name}</div>
                      <div className="mt-0.5 text-xs text-text-muted">
                        {ASSET_CATEGORY_LABEL[a.category as AssetCategory]} · {ASSET_KIND_LABEL[a.kind]}
                        {a.owner?.display_name ? ` · ${a.owner.display_name}` : ""}
                        {a.is_shared ? " · 공동" : ""}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-medium text-text-primary">{formatKRW(a.current_valuation)}</span>
                      {canEdit && <DeleteAssetButton table="assets" id={a.id} />}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card>
          <h3 className="mb-3 text-sm font-medium text-text-primary">자산 등록</h3>
          <AssetForm householdId={membership.householdId} members={members ?? []} />
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-text-primary">부채</h2>
        <Card className="p-0">
          {!liabilities || liabilities.length === 0 ? (
            <p className="p-6 text-center text-sm text-text-secondary">등록된 부채가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-border">
              {liabilities.map((l) => {
                const canEdit = canManageAll || l.created_by === user!.id;
                return (
                  <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm text-text-primary">{l.name}</div>
                      <div className="mt-0.5 text-xs text-text-muted">
                        {LIABILITY_KIND_LABEL[l.kind as LiabilityKind]} · {l.institution}
                        {l.debtor?.display_name ? ` · ${l.debtor.display_name}` : ""}
                        {l.maturity_date ? ` · 만기 ${formatDateShortKo(l.maturity_date)}` : ""}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-medium text-status-danger">{formatKRW(l.current_balance)}</span>
                      {canEdit && <DeleteAssetButton table="liabilities" id={l.id} />}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card>
          <h3 className="mb-3 text-sm font-medium text-text-primary">부채 등록</h3>
          <LiabilityForm householdId={membership.householdId} members={members ?? []} />
        </Card>
      </section>
    </div>
  );
}
