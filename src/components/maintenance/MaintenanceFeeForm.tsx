"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { MAINTENANCE_FEE_ITEM_KINDS, MAINTENANCE_FEE_ITEM_LABEL, currentYearMonth } from "@/lib/card-labels";
import type { MaintenanceFeeItemKind } from "@/lib/card-labels";

interface ItemRow {
  kind: MaintenanceFeeItemKind;
  amount: string;
}

/** 관리비 등록 (요구사항 22) — 총액입력과 세부항목입력을 하나의 달에 이중으로 반영하지 않는다 */
export function MaintenanceFeeForm({ householdId }: { householdId: string }) {
  const router = useRouter();
  const [targetMonth, setTargetMonth] = useState(currentYearMonth());
  const [entryMode, setEntryMode] = useState<"total_only" | "itemized">("total_only");
  const [totalAmount, setTotalAmount] = useState("");
  const [items, setItems] = useState<ItemRow[]>([{ kind: "general_management", amount: "" }]);
  const [dueDate, setDueDate] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const itemsSum = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);

  const updateItem = (idx: number, patch: Partial<ItemRow>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (entryMode === "total_only") {
      const amountNumber = Number(totalAmount);
      if (!amountNumber || amountNumber <= 0) {
        setError("관리비 총액을 올바르게 입력해 주세요.");
        return;
      }
    } else {
      const validItems = items.filter((it) => Number(it.amount) > 0);
      if (validItems.length === 0) {
        setError("세부항목을 1개 이상 입력해 주세요.");
        return;
      }
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

    const { data: inserted, error: insertError } = await supabase
      .from("maintenance_fees")
      .insert({
        household_id: householdId,
        target_month: targetMonth,
        total_amount: entryMode === "total_only" ? Number(totalAmount) : 0,
        entry_mode: entryMode,
        due_date: dueDate || null,
        memo: memo || null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      setSubmitting(false);
      setError(
        insertError?.code === "23505"
          ? "해당 월 관리비는 이미 등록되어 있습니다."
          : "등록 중 문제가 발생했습니다. 다시 시도해 주세요."
      );
      return;
    }

    if (entryMode === "itemized") {
      const rows = items
        .filter((it) => Number(it.amount) > 0)
        .map((it) => ({
          household_id: householdId,
          maintenance_fee_id: inserted.id,
          kind: it.kind,
          amount: Number(it.amount),
        }));
      const { error: itemsError } = await supabase.from("maintenance_fee_items").insert(rows);
      if (itemsError) {
        setSubmitting(false);
        setError("세부항목 등록 중 문제가 발생했습니다.");
        return;
      }
    }

    setSubmitting(false);
    setTotalAmount("");
    setItems([{ kind: "general_management", amount: "" }]);
    setMemo("");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">대상 월</label>
          <input
            type="month"
            value={targetMonth}
            onChange={(e) => setTargetMonth(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">납부기한 (선택)</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
      </div>

      <div className="flex gap-4 text-sm text-text-secondary">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={entryMode === "total_only"}
            onChange={() => setEntryMode("total_only")}
          />
          총액만 입력
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={entryMode === "itemized"}
            onChange={() => setEntryMode("itemized")}
          />
          세부항목 입력
        </label>
      </div>

      {entryMode === "total_only" ? (
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">관리비 총액 (원)</label>
          <input
            type="number"
            inputMode="numeric"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <select
                value={it.kind}
                onChange={(e) => updateItem(idx, { kind: e.target.value as MaintenanceFeeItemKind })}
                aria-label="관리비 항목 종류"
                className="touch-target flex-1 rounded-xl border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
              >
                {MAINTENANCE_FEE_ITEM_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {MAINTENANCE_FEE_ITEM_LABEL[k]}
                  </option>
                ))}
              </select>
              <input
                type="number"
                inputMode="numeric"
                value={it.amount}
                onChange={(e) => updateItem(idx, { amount: e.target.value })}
                placeholder="금액"
                aria-label="항목 금액"
                className="touch-target w-28 rounded-xl border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
              />
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                aria-label="이 항목 삭제"
                className="touch-target flex items-center justify-center rounded-lg px-2 text-text-muted hover:text-status-danger"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, { kind: "other", amount: "" }])}
            className="flex items-center gap-1 text-xs text-cyan hover:underline"
          >
            <Plus size={12} /> 항목 추가
          </button>
          <p className="text-sm text-text-secondary">항목 합계: {itemsSum.toLocaleString("ko-KR")}원</p>
        </div>
      )}

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
        관리비 등록
      </Button>
    </form>
  );
}
