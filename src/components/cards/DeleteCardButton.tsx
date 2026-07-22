"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export function DeleteCardButton({ cardId }: { cardId: string }) {
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
    await supabase.from("cards").update({ deleted_at: new Date().toISOString() }).eq("id", cardId);
    setBusy(false);
    router.push("/cards");
    router.refresh();
  };

  return (
    <Button type="button" variant="ghost" onClick={onDelete} disabled={busy} className="text-status-danger">
      <Trash2 size={14} />
      {confirming ? "한 번 더 누르면 카드 삭제" : "카드 삭제"}
    </Button>
  );
}
