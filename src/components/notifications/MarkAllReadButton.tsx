"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

/** 미확인 알림 전체 읽음 처리 */
export function MarkAllReadButton({ householdId }: { householdId: string }) {
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
      .eq("household_id", householdId)
      .eq("is_read", false);
    setBusy(false);
    router.refresh();
  };

  return (
    <Button variant="secondary" onClick={onClick} disabled={busy}>
      <CheckCheck size={16} /> 모두 읽음 처리
    </Button>
  );
}
