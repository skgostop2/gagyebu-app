"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export function GenerateRecurringButton({ householdId }: { householdId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const onGenerate = async () => {
    setBusy(true);
    setResult(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("generate_due_recurring_transactions", {
      p_household_id: householdId,
    });
    setBusy(false);

    if (error) {
      setResult("생성 중 문제가 발생했습니다.");
      return;
    }

    setResult(`${data?.length ?? 0}건 생성했습니다.`);
    router.refresh();
  };

  return (
    <div className="space-y-1">
      <Button variant="secondary" onClick={onGenerate} disabled={busy}>
        <RefreshCw size={16} /> 이번 달 반복거래 생성
      </Button>
      {result && <p className="text-xs text-text-secondary">{result}</p>}
    </div>
  );
}
