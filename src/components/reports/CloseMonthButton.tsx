"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

/** 이번 달 마감 — 서버의 close_month() 함수가 수입·지출·저축·순자산을 재집계해 저장한다 (요구사항: 월마감) */
export function CloseMonthButton({ householdId }: { householdId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const onClick = async () => {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("close_month", { p_household_id: householdId });
    setBusy(false);
    if (!error) {
      setDone(true);
      router.refresh();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" onClick={onClick} disabled={busy}>
        <CalendarCheck size={16} /> 이번 달 마감하기
      </Button>
      {done && <span className="text-xs text-status-stable">마감 완료 — 알림에서 확인하세요.</span>}
    </div>
  );
}
