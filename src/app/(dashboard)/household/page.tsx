import { Card } from "@/components/ui/Card";
import { CreateInvitationButton } from "@/components/household/CreateInvitationButton";
import { createClient, getAuthUser } from "@/lib/supabase/server";

const roleLabel: Record<string, string> = {
  owner: "가정 소유자",
  admin: "관리자",
  member: "일반 구성원",
  viewer: "조회 전용",
};

/** 가족관리 — 실제 DB에서 가정·구성원을 조회한다 (요구사항 14) */
export default async function HouseholdPage() {
  const supabase = await createClient();
  const user = await getAuthUser();

  const { data: myMembership } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user!.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!myMembership) {
    return <p className="text-sm text-text-secondary">소속된 가정이 없습니다.</p>;
  }

  const [{ data: household }, { data: members }] = await Promise.all([
    supabase.from("households").select("*").eq("id", myMembership.household_id).single(),
    supabase
      .from("household_members")
      .select("*")
      .eq("household_id", myMembership.household_id)
      .eq("status", "active")
      .order("joined_at", { ascending: true }),
  ]);

  const canInvite = myMembership.role === "owner" || myMembership.role === "admin";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">가족관리</h1>
        <p className="mt-1 text-sm text-text-secondary">{household?.name}</p>
      </div>

      <Card className="p-0">
        <ul className="divide-y divide-border">
          {(members ?? []).map((m) => (
            <li key={m.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-text-primary">{m.display_name}</span>
              <span className="text-xs text-text-secondary">{roleLabel[m.role]}</span>
            </li>
          ))}
        </ul>
      </Card>

      {canInvite && <CreateInvitationButton householdId={myMembership.household_id} />}

      <p className="text-center text-xs text-text-muted">
        권한변경·소유권이전·구성원 삭제는 다음 단계에서 연결됩니다.
      </p>
    </div>
  );
}
