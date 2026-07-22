"use client";

import { useState } from "react";
import { Copy, TicketPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function CreateInvitationButton({ householdId }: { householdId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const create = async () => {
    setSubmitting(true);
    setError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const newCode = randomCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase.from("household_invitations").insert({
      household_id: householdId,
      code: newCode,
      invited_role: "member",
      max_uses: 1,
      expires_at: expiresAt,
      created_by: user.id,
    });

    setSubmitting(false);

    if (insertError) {
      setError("초대코드를 만들 권한이 없거나 문제가 발생했습니다.");
      return;
    }

    setCode(newCode);
  };

  return (
    <div className="space-y-2">
      <Button variant="secondary" onClick={create} disabled={submitting}>
        <TicketPlus size={16} /> 초대코드 만들기 (7일 유효)
      </Button>
      {code && (
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(code)}
          className="flex items-center gap-2 rounded-xl border border-border bg-bg-elevated px-4 py-2 text-lg font-semibold tracking-widest text-neon-blue"
        >
          {code} <Copy size={14} />
        </button>
      )}
      {error && <p className="text-xs text-status-danger">{error}</p>}
    </div>
  );
}
