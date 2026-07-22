"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function DeleteBudgetButton({ budgetId }: { budgetId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const onDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    const supabase = createClient();
    await supabase.from("budgets").update({ deleted_at: new Date().toISOString() }).eq("id", budgetId);
    setBusy(false);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      className="touch-target flex items-center gap-1 rounded-lg px-2 text-xs text-text-muted hover:text-status-danger"
    >
      <Trash2 size={14} />
      {confirming ? "한 번 더 누르면 삭제" : "삭제"}
    </button>
  );
}
