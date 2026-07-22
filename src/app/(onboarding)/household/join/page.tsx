"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function JoinHouseholdPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim() || !displayName.trim()) {
      setError("초대코드와 이름을 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("join_household_with_code", {
      p_code: code.trim().toUpperCase(),
      p_display_name: displayName.trim(),
    });
    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message.includes("유효하지") || rpcError.message.includes("이미 참여")
        ? rpcError.message
        : "가정에 참여하는 중 문제가 발생했습니다.");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">기존 가정 참여하기</h1>
        <p className="mt-1 text-sm text-text-secondary">초대코드로 가정에 참여하세요.</p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">초대코드</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-center text-lg tracking-widest text-text-primary outline-none focus:border-neon-blue"
            placeholder="ABCD12"
            maxLength={8}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">이름 또는 별명</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
        {error && <p className="text-sm text-status-danger">{error}</p>}
        <Button type="submit" variant="primary" fullWidth disabled={submitting}>
          참여하기
        </Button>
      </form>
    </div>
  );
}
