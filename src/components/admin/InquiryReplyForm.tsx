"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

/** 운영자 문의 답변 폼 (14단계) */
export function InquiryReplyForm({ inquiryId, existingReply }: { inquiryId: string; existingReply: string | null }) {
  const router = useRouter();
  const [reply, setReply] = useState(existingReply ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reply.trim()) {
      setError("답변 내용을 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: updateError } = await supabase
      .from("inquiries")
      .update({
        admin_reply: reply.trim(),
        status: "answered",
        answered_by: user?.id ?? null,
        answered_at: new Date().toISOString(),
      })
      .eq("id", inquiryId);

    setSubmitting(false);
    if (updateError) {
      setError("답변 저장 중 문제가 발생했습니다.");
      return;
    }
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="mt-2 space-y-2">
      <label htmlFor={`inquiry-reply-${inquiryId}`} className="sr-only">
        답변 내용
      </label>
      <textarea
        id={`inquiry-reply-${inquiryId}`}
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={3}
        placeholder="답변을 입력해 주세요."
        className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-neon-blue"
      />
      {error && <p className="text-sm text-status-danger">{error}</p>}
      <Button type="submit" variant="secondary" disabled={submitting}>
        {existingReply ? "답변 수정" : "답변 등록"}
      </Button>
    </form>
  );
}
