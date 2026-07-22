import { Card } from "@/components/ui/Card";
import { InquiryReplyForm } from "@/components/admin/InquiryReplyForm";
import { createClient } from "@/lib/supabase/server";
import { formatDateKo } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  open: "접수됨",
  answered: "답변완료",
  closed: "종료",
};

/** 운영자 콘솔 (14단계) — 가정 목록·AI 사용량·문의 조회/답변. is_platform_admin이 아니면 접근 거부. */
export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <p className="p-6 text-sm text-text-secondary">로그인이 필요합니다.</p>;
  }

  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <p className="text-sm text-text-secondary">운영자만 접근할 수 있는 화면입니다.</p>
      </div>
    );
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [{ data: households }, { data: usageLogs }, { data: inquiries }] = await Promise.all([
    supabase
      .from("households")
      .select("id, name, plan_code, member_count, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("ai_usage_logs").select("status").gte("created_at", monthStart.toISOString()),
    supabase
      .from("inquiries")
      .select("id, email, subject, message, status, admin_reply, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const usageSummary = (usageLogs ?? []).reduce(
    (acc, log) => {
      acc[log.status] = (acc[log.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold text-text-primary">운영자 콘솔</h1>

      <Card>
        <h2 className="mb-3 text-sm font-medium text-text-primary">이번 달 AI 사용량 (전체 가정)</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-text-primary">{usageSummary.success ?? 0}</p>
            <p className="text-xs text-text-muted">성공</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{usageSummary.rate_limited ?? 0}</p>
            <p className="text-xs text-text-muted">한도초과</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{usageSummary.fail ?? 0}</p>
            <p className="text-xs text-text-muted">실패</p>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-medium text-text-primary">가정 목록 ({households?.length ?? 0})</h2>
        </div>
        {!households || households.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-secondary">가정이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border">
            {households.map((h) => (
              <li key={h.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div>
                  <span className="text-text-primary">{h.name}</span>
                  <span className="ml-2 text-xs text-text-muted">
                    {h.plan_code} · 구성원 {h.member_count}명
                  </span>
                </div>
                <span className="text-xs text-text-muted">{formatDateKo(h.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-0">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-medium text-text-primary">문의 목록 ({inquiries?.length ?? 0})</h2>
        </div>
        {!inquiries || inquiries.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-secondary">문의가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border">
            {inquiries.map((q) => (
              <li key={q.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-text-primary">{q.subject}</span>
                  <span className="shrink-0 text-xs text-text-muted">{STATUS_LABEL[q.status] ?? q.status}</span>
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  {q.email} · {formatDateKo(q.created_at)}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">{q.message}</p>
                <InquiryReplyForm inquiryId={q.id} existingReply={q.admin_reply} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
