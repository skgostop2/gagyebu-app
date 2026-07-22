import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { LogoutButton } from "@/components/settings/LogoutButton";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { ExportTransactionsButton } from "@/components/settings/ExportTransactionsButton";
import { ImportTransactionsForm } from "@/components/settings/ImportTransactionsForm";
import { BackupDownloadButton } from "@/components/settings/BackupDownloadButton";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/supabase/current-household";
import { AUDIT_TABLE_LABEL, AUDIT_ACTION_LABEL } from "@/lib/audit-labels";
import { formatDateKo } from "@/lib/utils";

/** 설정 화면 — 최근 변경이력(요구사항: 수정·삭제 이력)을 함께 보여준다 */
export default async function SettingsPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  const [membership, { data: profile }] = await Promise.all([
    user ? getCurrentMembership(supabase, user.id) : Promise.resolve(null),
    user
      ? supabase.from("user_profiles").select("display_name, phone").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const [{ data: isAdmin }, { data: household }] = user
    ? await Promise.all([
        supabase.rpc("is_platform_admin"),
        membership
          ? supabase.from("households").select("plan_code").eq("id", membership.householdId).maybeSingle()
          : Promise.resolve({ data: null }),
      ])
    : [{ data: false }, { data: null }];

  const { data: currentPlan } = household
    ? await supabase.from("pricing_plans").select("name").eq("code", household.plan_code).maybeSingle()
    : { data: null };

  const [{ data: auditLogs }, { data: members }] = membership
    ? await Promise.all([
        supabase
          .from("audit_logs")
          .select("id, table_name, action, changed_by, changed_at, before_data, after_data")
          .eq("household_id", membership.householdId)
          .order("changed_at", { ascending: false })
          .limit(30),
        supabase.from("household_members").select("user_id, display_name").eq("household_id", membership.householdId),
      ])
    : [{ data: null }, { data: null }];

  const memberNameMap = new Map((members ?? []).map((m) => [m.user_id, m.display_name]));

  function displayAction(action: string, before: unknown, after: unknown): string {
    if (action === "update" && before && after && typeof before === "object" && typeof after === "object") {
      const b = before as Record<string, unknown>;
      const a = after as Record<string, unknown>;
      if (!b.deleted_at && a.deleted_at) return "삭제";
    }
    return AUDIT_ACTION_LABEL[action] ?? action;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold text-text-primary">설정</h1>

      {user && (
        <Card>
          <h2 className="mb-3 text-sm font-medium text-text-primary">내 정보</h2>
          <ProfileForm
            userId={user.id}
            initialDisplayName={profile?.display_name ?? ""}
            initialPhone={profile?.phone ?? null}
          />
        </Card>
      )}

      <Card>
        <p className="mb-3 text-sm text-text-secondary">
          알림 기준, 라이트/다크모드 전환은 이후 단계에서 순차 연결됩니다.
        </p>
        {household && (
          <p className="mb-3 text-sm text-text-secondary">
            현재 요금제: <span className="font-medium text-text-primary">{currentPlan?.name ?? household.plan_code}</span>{" "}
            · <Link href="/pricing" className="text-neon-blue hover:underline">요금제 보기</Link>
          </p>
        )}
        {isAdmin && (
          <p className="mb-3 text-sm text-text-secondary">
            <Link href="/admin" className="text-neon-blue hover:underline">운영자 콘솔로 이동</Link>
          </p>
        )}
        <LogoutButton />
      </Card>

      {membership && (
        <Card>
          <h2 className="mb-1 text-sm font-medium text-text-primary">가져오기·내보내기·백업</h2>
          <p className="mb-3 text-xs text-text-muted">
            거래내역은 CSV로 내보내고 다시 가져올 수 있습니다(이 앱에서 내보낸 형식만 지원). 전체 백업은 보관·이전용
            JSON 파일로 내려받을 수 있으며, 여러 테이블을 한 번에 복원하는 기능은 아직 지원하지 않습니다.
          </p>
          <div className="flex flex-wrap gap-2">
            <ExportTransactionsButton householdId={membership.householdId} />
            <ImportTransactionsForm householdId={membership.householdId} />
          </div>
          <div className="mt-3 border-t border-border pt-3">
            <BackupDownloadButton householdId={membership.householdId} />
          </div>
        </Card>
      )}

      <Card className="p-0">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-medium text-text-primary">최근 변경 이력</h2>
          <p className="mt-0.5 text-xs text-text-muted">거래·예산·카드·자산 등 주요 항목의 등록·수정·삭제 기록입니다.</p>
        </div>
        {!auditLogs || auditLogs.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-secondary">변경 이력이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border">
            {auditLogs.map((log) => (
              <li key={log.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div>
                  <span className="text-text-primary">{AUDIT_TABLE_LABEL[log.table_name] ?? log.table_name}</span>
                  <span className="ml-1.5 text-text-muted">
                    {displayAction(log.action, log.before_data, log.after_data)}
                  </span>
                  <span className="ml-2 text-xs text-text-muted">
                    {log.changed_by ? (memberNameMap.get(log.changed_by) ?? "구성원") : "시스템"}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-text-muted">{formatDateKo(log.changed_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
