"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/** 알림 1건 읽음 처리 (가정 공용 알림 — 누구든 읽음 처리 가능) */
export function MarkReadButton({ notificationId }: { notificationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from("notifications")
      .update({ is_read: true, read_by: user?.id ?? null, read_at: new Date().toISOString() })
      .eq("id", notificationId);
    setBusy(false);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="touch-target flex items-center gap-1 rounded-lg px-2 text-xs text-cyan hover:underline"
    >
      <Check size={14} /> 읽음
    </button>
  );
}
