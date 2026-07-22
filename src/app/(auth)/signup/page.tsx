"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, getPasswordStrength, type SignupFormValues } from "@/lib/validation/auth";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const strengthLabel = { weak: "사용 불가", normal: "보통", strong: "안전" } as const;
const strengthClass = {
  weak: "text-status-danger",
  normal: "text-status-caution",
  strong: "text-status-stable",
} as const;

export default function SignupPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema) });

  const strength = getPasswordStrength(password);

  const onSubmit = async (values: SignupFormValues) => {
    setServerError(null);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          display_name: values.displayName,
          phone: values.phone,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });

    if (error) {
      setServerError(
        error.message.includes("already registered") || error.status === 422
          ? "이미 가입된 이메일입니다."
          : "회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요."
      );
      return;
    }

    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">회원가입</h1>
        <p className="mt-1 text-sm text-text-secondary">
          가입 후 바로 이용할 수 있습니다. 이메일·휴대폰 인증 연동은 이후 단계에서 제공됩니다.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="이메일" htmlFor="email" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
            {...register("email")}
          />
        </Field>

        <Field label="휴대폰 번호" htmlFor="phone" error={errors.phone?.message}>
          <input
            id="phone"
            type="tel"
            placeholder="01012345678"
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
            {...register("phone")}
          />
        </Field>

        <Field label="이름 또는 별명" htmlFor="displayName" error={errors.displayName?.message}>
          <input
            id="displayName"
            type="text"
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
            {...register("displayName")}
          />
        </Field>

        <Field label="비밀번호" htmlFor="password" error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            {...register("password", { onChange: (e) => setPassword(e.target.value) })}
          />
          {password.length > 0 && (
            <p className={cn("mt-1 text-xs", strengthClass[strength])}>
              비밀번호 강도: {strengthLabel[strength]}
            </p>
          )}
        </Field>

        <Field label="비밀번호 확인" htmlFor="passwordConfirm" error={errors.passwordConfirm?.message}>
          <PasswordInput id="passwordConfirm" autoComplete="new-password" {...register("passwordConfirm")} />
        </Field>

        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2 text-text-secondary">
            <input type="checkbox" className="touch-target" {...register("agreeTerms")} />
            이용약관에 동의합니다. (필수)
          </label>
          {errors.agreeTerms && <p className="text-xs text-status-danger">{errors.agreeTerms.message}</p>}

          <label className="flex items-center gap-2 text-text-secondary">
            <input type="checkbox" className="touch-target" {...register("agreePrivacy")} />
            개인정보 처리방침에 동의합니다. (필수)
          </label>
          {errors.agreePrivacy && <p className="text-xs text-status-danger">{errors.agreePrivacy.message}</p>}
        </div>

        {serverError && <p className="text-sm text-status-danger">{serverError}</p>}

        <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
          회원가입
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-cyan hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-text-secondary" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-status-danger">{error}</p>}
    </div>
  );
}
