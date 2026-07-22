"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ScenarioActionsProps {
  scenarioId: string;
  householdId: string;
  isActive: boolean;
}

/** 시나리오 활성화/해제/삭제 — 활성 시나리오는 가정당 1개만 유지된다 (요구사항 30) */
export function ScenarioActions({ scenarioId, householdId, isActive }: ScenarioActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const onToggleActive = async () => {
    setBusy(true);
    const supabase = createClient();
    if (isActive) {
      await supabase.rpc("deactivate_income_scenarios", { p_household_id: householdId });
    } else {
      await supabase.rpc("activate_income_scenario", { p_scenario_id: scenarioId });
    }
    setBusy(false);
    router.refresh();
  };

  const onDelete = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setBusy(true);
    const supabase = createClient();
    await supabase.from("income_scenarios").update({ deleted_at: new Date().toISOString() }).eq("id", scenarioId);
    setBusy(false);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToggleActive}
        disabled={busy}
        className={
          "touch-target flex items-center gap-1 rounded-lg px-2 text-xs " +
          (isActive ? "text-status-stable" : "text-text-muted hover:text-status-stable")
        }
      >
        <CheckCircle2 size={14} />
        {isActive ? "적용 중 (해제)" : "이 시나리오 적용"}
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        className="touch-target flex items-center gap-1 rounded-lg px-2 text-xs text-text-muted hover:text-status-danger"
      >
        <Trash2 size={14} />
        {confirmingDelete ? "한 번 더 누르면 삭제" : "삭제"}
      </button>
    </div>
  );
}
