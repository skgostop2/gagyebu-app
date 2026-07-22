import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { MaintenanceFeeForm } from "@/components/maintenance/MaintenanceFeeForm";
import { DeleteMaintenanceFeeButton } from "@/components/maintenance/DeleteMaintenanceFeeButton";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/supabase/current-household";
import { formatKRW } from "@/lib/utils";

/** 관리비 등록 + 이력·변화 분석 (요구사항 22) */
export default async function MaintenanceFeePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const membership = user ? await getCurrentMembership(supabase, user.id) : null;
  if (!membership) {
    return <p className="text-sm text-text-secondary">소속된 가정이 없습니다.</p>;
  }

  const { data: fees } = await supabase
    .from("maintenance_fees")
    .select("*")
    .eq("household_id", membership.householdId)
    .is("deleted_at", null)
    .order("target_month", { ascending: false })
    .limit(24);

  const canManageAll = membership.role === "owner" || membership.role === "admin";
  const sorted = fees ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">관리비</h1>
        <p className="mt-1 text-sm text-text-secondary">아파트 관리비를 월별로 등록하고 변화를 확인합니다.</p>
      </div>

      <Card className="p-0">
        {sorted.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-secondary">등록된 관리비가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((f, idx) => {
              const prev = sorted[idx + 1];
              const diff = prev ? f.total_amount - prev.total_amount : null;
              const canEdit = canManageAll || f.created_by === user!.id;
              return (
                <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm text-text-primary">{f.target_month}</div>
                    <div className="mt-0.5 text-xs text-text-muted">
                      {f.entry_mode === "itemized" ? "세부항목 입력" : "총액 입력"}
                      {f.due_date ? ` · 납부기한 ${f.due_date}` : ""}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium text-text-primary">{formatKRW(f.total_amount)}</div>
                      {diff !== null && (
                        <div
                          className={
                            "flex items-center justify-end gap-1 text-xs " +
                            (diff > 0 ? "text-status-danger" : diff < 0 ? "text-status-stable" : "text-text-muted")
                          }
                        >
                          {diff > 0 ? <TrendingUp size={12} /> : diff < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                          {diff === 0 ? "전월 동일" : `${diff > 0 ? "+" : ""}${formatKRW(diff)}`}
                        </div>
                      )}
                    </div>
                    {canEdit && <DeleteMaintenanceFeeButton maintenanceFeeId={f.id} />}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-medium text-text-primary">관리비 등록</h2>
        <MaintenanceFeeForm householdId={membership.householdId} />
      </Card>
    </div>
  );
}
