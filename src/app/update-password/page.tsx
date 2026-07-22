"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { getPasswordStrength } from "@/lib/validation/auth";

const strengthLabel = { weak: "사용 불가", normal: "보통", strong: "안전" } as const;

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const strength = getPasswordStrength(password);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError("비밀번호 변경에 실패했습니다. 링크가 만료되었을 수 있습니다. 다시 시도해 주세요.");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">새 비밀번호 설정</h1>
          <p className="mt-1 text-sm text-text-secondary">사용할 새 비밀번호를 입력해 주세요.</p>
        </div>

        {done ? (
          <p className="rounded-xl border border-border bg-bg-elevated p-4 text-sm text-status-stable">
            비밀번호가 변경되었습니다. 로그인 화면으로 이동합니다.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-text-secondary">새 비밀번호</label>
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              {password.length > 0 && (
                <p className="mt-1 text-xs text-text-secondary">비밀번호 강도: {strengthLabel[strength]}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-text-secondary">새 비밀번호 확인</label>
              <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            </div>
            {error && <p className="text-xs text-status-danger">{error}</p>}
            <Button type="submit" variant="primary" fullWidth disabled={submitting}>
              비밀번호 변경
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
