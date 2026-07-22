"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { INCOME_SCENARIO_KINDS, INCOME_SCENARIO_KIND_LABEL, type IncomeScenarioKind } from "@/lib/income-scenario-labels";

/** 미래수입 시나리오 등록 (요구사항 30) */
export function IncomeScenarioForm({ householdId }: { householdId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<IncomeScenarioKind>("job_change");
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [projectedMonthlyIncome, setProjectedMonthlyIncome] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("시나리오 이름을 입력해 주세요.");
      return;
    }
    const incomeNumber = Number(projectedMonthlyIncome);
    if (projectedMonthlyIncome === "" || incomeNumber < 0) {
      setError("예상 월수입을 올바르게 입력해 주세요. (0 이상)");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("로그인이 필요합니다.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("income_scenarios").insert({
      household_id: householdId,
      name: name.trim(),
      kind,
      effective_from: effectiveFrom,
      projected_monthly_income: incomeNumber,
      memo: memo || null,
      created_by: user.id,
    });

    setSubmitting(false);
    if (insertError) {
      setError("등록 중 문제가 발생했습니다. 다시 시도해 주세요.");
      return;
    }

    setName("");
    setProjectedMonthlyIncome("");
    setMemo("");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">시나리오 이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 이직 후 급여 감소"
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">유형</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as IncomeScenarioKind)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          >
            {INCOME_SCENARIO_KINDS.map((k) => (
              <option key={k} value={k}>
                {INCOME_SCENARIO_KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">적용 시작일</label>
          <input
            type="date"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">예상 월수입 (원)</label>
          <input
            type="number"
            inputMode="numeric"
            value={projectedMonthlyIncome}
            onChange={(e) => setProjectedMonthlyIncome(e.target.value)}
            placeholder="0"
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">메모</label>
        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
        />
      </div>

      {error && <p className="text-sm text-status-danger">{error}</p>}

      <Button type="submit" variant="primary" fullWidth disabled={submitting}>
        시나리오 등록
      </Button>
    </form>
  );
}
