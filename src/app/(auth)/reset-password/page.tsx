"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Method = "email" | "phone";

export default function ResetPasswordPage() {
  const [method, setMethod] = useState<Method>("email");
  const [value, setValue] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (method === "phone") return;

    setSubmitting(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(value, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    });
    setSubmitting(false);
    setSent(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">비밀번호 재설정</h1>
        <p className="mt-1 text-sm text-text-secondary">
          가입 시 등록한 이메일 또는 휴대폰 번호로 본인확인을 진행합니다.
        </p>
      </div>

      <div className="flex rounded-xl border border-border bg-bg-elevated p-1 text-sm">
        {(["email", "phone"] as Method[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={cn(
              "flex-1 touch-target rounded-lg",
              method === m ? "bg-neon-blue text-white" : "text-text-secondary"
            )}
          >
            {m === "email" ? "이메일 인증" : "휴대폰 인증"}
          </button>
        ))}
      </div>

      {!sent ? (
        <form className="space-y-4" onSubmit={onSubmit}>
          <label htmlFor="reset-password-value" className="sr-only">
            {method === "email" ? "가입한 이메일" : "가입한 휴대폰 번호"}
          </label>
          <input
            id="reset-password-value"
            type={method === "email" ? "email" : "tel"}
            placeholder={method === "email" ? "가입한 이메일" : "가입한 휴대폰 번호"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
          {method === "phone" ? (
            <p className="text-xs text-text-muted">
              휴대폰 인증 기반 재설정은 SMS 연동 이후 단계에서 제공됩니다. 지금은 이메일 인증을 이용해 주세요.
            </p>
          ) : null}
          <Button type="submit" variant="primary" fullWidth disabled={method === "phone" || submitting}>
            {method === "email" ? "재설정 링크 받기" : "인증번호 받기"}
          </Button>
        </form>
      ) : (
        <p className="rounded-xl border border-border bg-bg-elevated p-4 text-sm text-text-secondary">
          입력한 정보로 가입된 계정이 있으면 재설정 안내를 보내드립니다.
        </p>
      )}

      <p className="text-center text-sm text-text-secondary">
        <Link href="/login" className="text-cyan hover:underline">
          로그인으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
