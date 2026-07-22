"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

/** 문의 접수 폼 (14단계) */
export function InquiryForm({ defaultEmail, householdId }: { defaultEmail: string; householdId: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!subject.trim() || !message.trim()) {
      setError("제목과 내용을 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("로그인이 필요합니다.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("inquiries").insert({
      household_id: householdId,
      user_id: user.id,
      email: email.trim() || defaultEmail,
      subject: subject.trim(),
      message: message.trim(),
    });

    setSubmitting(false);
    if (insertError) {
      setError("문의 접수 중 문제가 발생했습니다. 다시 시도해 주세요.");
      return;
    }

    setSubject("");
    setMessage("");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">회신받을 이메일</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">제목</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="문의 제목을 입력해 주세요"
          className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">내용</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="문의 내용을 자세히 적어주시면 답변에 도움이 됩니다."
          className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
        />
      </div>

      {error && <p className="text-sm text-status-danger">{error}</p>}

      <Button type="submit" variant="primary" fullWidth disabled={submitting}>
        문의 보내기
      </Button>
    </form>
  );
}
