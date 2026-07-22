"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { BUDGET_SCOPE_LABEL, BUDGET_SCOPES, defaultPeriodForScope, type BudgetScope } from "@/lib/budget-labels";
import type { Tables } from "@/lib/supabase/database.types";

type Member = Tables<"household_members">;
type Category = Tables<"categories">;

interface BudgetFormProps {
  householdId: string;
  members: Member[];
  categories: Category[];
}

/** 예산 등록 (요구사항 23) — 범위별로 대상·기간이 달라진다 */
export function BudgetForm({ householdId, members, categories }: BudgetFormProps) {
  const router = useRouter();
  const [scope, setScope] = useState<BudgetScope>("household_monthly");
  const [targetMemberId, setTargetMemberId] = useState("");
  const [targetCategoryId, setTargetCategoryId] = useState("");
  const [period, setPeriod] = useState(() => defaultPeriodForScope("household_monthly"));
  const [limitAmount, setLimitAmount] = useState("");
  const [thresholds, setThresholds] = useState({ t1: "70", t2: "90", t3: "100" });
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const expenseCategories = categories.filter((c) => c.kind === "expense" && c.is_active);

  const onScopeChange = (value: BudgetScope) => {
    setScope(value);
    setPeriod(defaultPeriodForScope(value));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const limitNumber = Number(limitAmount);
    if (!limitNumber || limitNumber <= 0) {
      setError("한도 금액을 올바르게 입력해 주세요.");
      return;
    }
    if (scope === "member" && !targetMemberId) {
      setError("구성원을 선택해 주세요.");
      return;
    }
    if (scope === "category" && !targetCategoryId) {
      setError("카테고리를 선택해 주세요.");
      return;
    }
    if (new Date(period.end) < new Date(period.start)) {
      setError("종료일이 시작일보다 빠를 수 없습니다.");
      return;
    }

    const parsedThresholds = [thresholds.t1, thresholds.t2, thresholds.t3]
      .map((v) => Number(v))
      .filter((v) => v > 0 && v <= 300)
      .sort((a, b) => a - b);

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

    const { error: insertError } = await supabase.from("budgets").insert({
      household_id: householdId,
      scope,
      target_member_id: scope === "member" ? targetMemberId : null,
      target_category_id: scope === "category" ? targetCategoryId : null,
      period_start: period.start,
      period_end: period.end,
      limit_amount: limitNumber,
      alert_thresholds: parsedThresholds.length > 0 ? parsedThresholds : [70, 90, 100],
      memo: memo || null,
      created_by: user.id,
    });

    setSubmitting(false);
    if (insertError) {
      setError("등록 중 문제가 발생했습니다. 다시 시도해 주세요.");
      return;
    }

    setLimitAmount("");
    setMemo("");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">범위</label>
        <select
          value={scope}
          onChange={(e) => onScopeChange(e.target.value as BudgetScope)}
          className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
        >
          {BUDGET_SCOPES.map((s) => (
            <option key={s} value={s}>
              {BUDGET_SCOPE_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {scope === "member" && (
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">대상 구성원</label>
          <select
            value={targetMemberId}
            onChange={(e) => setTargetMemberId(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          >
            <option value="">선택</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.display_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {scope === "category" && (
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">대상 카테고리</label>
          <select
            value={targetCategoryId}
            onChange={(e) => setTargetCategoryId(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          >
            <option value="">선택</option>
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">시작일</label>
          <input
            type="date"
            value={period.start}
            onChange={(e) => setPeriod((p) => ({ ...p, start: e.target.value }))}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">종료일</label>
          <input
            type="date"
            value={period.end}
            onChange={(e) => setPeriod((p) => ({ ...p, end: e.target.value }))}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">한도 금액 (원)</label>
        <input
          type="number"
          inputMode="numeric"
          value={limitAmount}
          onChange={(e) => setLimitAmount(e.target.value)}
          className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">알림 임계치 (%)</label>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            value={thresholds.t1}
            onChange={(e) => setThresholds((t) => ({ ...t, t1: e.target.value }))}
            aria-label="첫 번째 알림 임계치 (%)"
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
          <input
            type="number"
            value={thresholds.t2}
            onChange={(e) => setThresholds((t) => ({ ...t, t2: e.target.value }))}
            aria-label="두 번째 알림 임계치 (%)"
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
          <input
            type="number"
            value={thresholds.t3}
            onChange={(e) => setThresholds((t) => ({ ...t, t3: e.target.value }))}
            aria-label="세 번째 알림 임계치 (%)"
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
        <p className="mt-1 text-xs text-text-muted">기본값 70 / 90 / 100%. 이 비율에 도달하면 주의·위험·초과로 표시됩니다.</p>
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
        예산 등록
      </Button>
    </form>
  );
}
