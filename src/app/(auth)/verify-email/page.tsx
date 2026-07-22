"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const resend = async () => {
    if (!email) return;
    setStatus("sending");
    const supabase = createClient();
    await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
    setStatus("sent");
  };

  return (
    <div className="space-y-6 text-center">
      <MailCheck size={40} className="mx-auto text-cyan" />
      <div>
        <h1 className="text-xl font-semibold text-text-primary">이메일 인증</h1>
        <p className="mt-2 text-sm text-text-secondary">
          {email ? <span className="text-text-primary">{email}</span> : "입력하신 이메일"}로 인증 링크를
          보내드렸습니다. 메일함을 확인해 주세요.
        </p>
      </div>
      <Button variant="secondary" fullWidth onClick={resend} disabled={!email || status === "sending"}>
        {status === "sent" ? "다시 보냈습니다" : "인증메일 다시 보내기"}
      </Button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
