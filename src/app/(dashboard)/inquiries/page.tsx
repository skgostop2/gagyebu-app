import { Card } from "@/components/ui/Card";
import { InquiryForm } from "@/components/inquiries/InquiryForm";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/supabase/current-household";
import { formatDateKo } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  open: "접수됨",
  answered: "답변완료",
  closed: "종료",
};

const STATUS_COLOR: Record<string, string> = {
  open: "bg-status-warning/15 text-status-warning",
  answered: "bg-status-success/15 text-status-success",
  closed: "bg-text-muted/15 text-text-muted",
};

/** 문의하기 화면 (14단계) — 접수 + 내 문의 목록/답변 확인 */
export default async function InquiriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <p className="p-6 text-sm text-text-secondary">로그인이 필요합니다.</p>;
  }

  const membership = await getCurrentMembership(supabase, user.id);

  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("id, subject, message, status, admin_reply, answered_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold text-text-primary">문의하기</h1>

      <Card>
        <h2 className="mb-3 text-sm font-medium text-text-primary">새 문의 작성</h2>
        <InquiryForm defaultEmail={user.email ?? ""} householdId={membership?.householdId ?? null} />
      </Card>

      <Card className="p-0">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-medium text-text-primary">내 문의 내역</h2>
        </div>
        {!inquiries || inquiries.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-secondary">문의 내역이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border">
            {inquiries.map((q) => (
              <li key={q.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-text-primary">{q.subject}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_COLOR[q.status] ?? ""}`}>
                    {STATUS_LABEL[q.status] ?? q.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-muted">{formatDateKo(q.created_at)}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{q.message}</p>
                {q.admin_reply && (
                  <div className="mt-3 rounded-xl bg-bg-elevated p-3">
                    <p className="mb-1 text-xs font-medium text-neon-blue">운영자 답변</p>
                    <p className="whitespace-pre-wrap text-sm text-text-secondary">{q.admin_reply}</p>
                    {q.answered_at && <p className="mt-1 text-xs text-text-muted">{formatDateKo(q.answered_at)}</p>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
