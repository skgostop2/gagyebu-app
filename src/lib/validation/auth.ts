import { z } from "zod";

/** 비밀번호 기준 (요구사항 8) — 최소 8자, 조합 권장 */
export const passwordSchema = z
  .string()
  .min(8, "비밀번호는 최소 8자 이상이어야 합니다.")
  .refine((v) => v.trim() === v, "비밀번호 앞뒤에 공백을 사용할 수 없습니다.");

export function getPasswordStrength(pw: string): "weak" | "normal" | "strong" {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Za-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return "weak";
  if (score <= 3) return "normal";
  return "strong";
}

export const signupSchema = z
  .object({
    email: z.string().email("올바른 이메일 형식이 아닙니다."),
    phone: z
      .string()
      .regex(/^01[0-9]-?\d{3,4}-?\d{4}$/, "휴대폰 번호 형식을 확인해 주세요. (예: 01012345678)"),
    displayName: z.string().min(1, "이름 또는 별명을 입력해 주세요."),
    password: passwordSchema,
    passwordConfirm: z.string(),
    agreeTerms: z.boolean().refine((v) => v === true, "이용약관에 동의해 주세요."),
    agreePrivacy: z.boolean().refine((v) => v === true, "개인정보 처리방침에 동의해 주세요."),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirm"],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(1, "비밀번호를 입력해 주세요."),
  keepSignedIn: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
