"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setServerError("이메일 인증이 완료되지 않았습니다.");
      } else if (error.message.toLowerCase().includes("invalid login credentials")) {
        setServerError("이메일 또는 비밀번호를 확인해 주세요.");
      } else {
        setServerError("잠시 후 다시 시도해 주세요.");
      }
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">로그인</h1>
        <p className="mt-1 text-sm text-text-secondary">가족 가계부에 오신 것을 환영합니다.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary" htmlFor="email">
            이메일
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
            {...register("email")}
          />
          {errors.email && <p className="mt-1 text-xs text-status-danger">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-secondary" htmlFor="password">
            비밀번호
          </label>
          <PasswordInput id="password" autoComplete="current-password" {...register("password")} />
          {errors.password && <p className="mt-1 text-xs text-status-danger">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-text-secondary">
            <input type="checkbox" className="touch-target" {...register("keepSignedIn")} />
            로그인 상태 유지
          </label>
          <Link href="/reset-password" className="text-cyan hover:underline">
            비밀번호를 잊으셨나요?
          </Link>
        </div>

        {serverError && <p className="text-sm text-status-danger">{serverError}</p>}

        <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
          로그인
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="text-cyan hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}
