"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

/** 이번 달 순자산 스냅샷을 서버에서 재계산해 저장한다 (요구사항 28). 같은 달에 다시 누르면 최신값으로 갱신된다. */
export function SaveSnapshotButton({ householdId }: { householdId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const onSave = async () => {
    setBusy(true);
    setResult(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("save_asset_snapshot", { p_household_id: householdId });
    setBusy(false);

    if (error) {
      setResult("저장 중 문제가 발생했습니다.");
      return;
    }

    setResult("이번 달 스냅샷을 저장했습니다.");
    router.refresh();
  };

  return (
    <div className="space-y-1">
      <Button variant="secondary" onClick={onSave} disabled={busy}>
        <Camera size={16} /> 이번 달 스냅샷 저장
      </Button>
      {result && <p className="text-xs text-text-secondary">{result}</p>}
    </div>
  );
}
