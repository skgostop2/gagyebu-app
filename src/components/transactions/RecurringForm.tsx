"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { TRANSACTION_TYPE_LABEL, usesCategory, categoryKindOf } from "@/lib/transaction-labels";
import type { Tables } from "@/lib/supabase/database.types";

type Category = Tables<"categories">;

const RECURRING_TEMPLATE_TYPES = [
  "income",
  "living_expense",
  "saving",
  "investment",
  "debt_principal",
  "debt_interest",
] as const;

const FREQUENCY_LABEL: Record<string, string> = {
  daily: "매일",
  weekly: "매주",
  monthly: "매월",
  yearly: "매년",
  custom: "사용자 지정",
};

export function RecurringForm({ householdId, categories }: { householdId: string; categories: Category[] }) {
  const router = useRouter();
  const [templateType, setTemplateType] = useState<(typeof RECURRING_TEMPLATE_TYPES)[number]>("living_expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly" | "yearly" | "custom">("monthly");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showCategory = usesCategory(templateType);
  const categoryOptions = showCategory
    ? categories.filter((c) => c.kind === categoryKindOf(templateType) && c.is_active)
    : [];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountNumber = Number(amount);
    if (!amountNumber || amountNumber <= 0) {
      setError("금액을 올바르게 입력해 주세요.");
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

    const { error: insertError } = await supabase.from("recurring_transactions").insert({
      household_id: householdId,
      template_type: templateType,
      amount: amountNumber,
      category_id: showCategory && categoryId ? categoryId : null,
      frequency,
      start_date: startDate,
      memo: memo || null,
      created_by: user.id,
    });

    setSubmitting(false);
    if (insertError) {
      setError("등록 권한이 없거나 문제가 발생했습니다. (관리자 이상만 등록할 수 있습니다)");
      return;
    }

    setAmount("");
    setMemo("");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">유형</label>
          <select
            value={templateType}
            onChange={(e) => {
              setTemplateType(e.target.value as typeof templateType);
              setCategoryId("");
            }}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          >
            {RECURRING_TEMPLATE_TYPES.map((t) => (
              <option key={t} value={t}>
                {TRANSACTION_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">주기</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as typeof frequency)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          >
            {Object.entries(FREQUENCY_LABEL).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">금액 (원)</label>
        <input
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
        />
      </div>

      {showCategory && (
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">항목</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          >
            <option value="">선택 안 함</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">시작일</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">메모</label>
        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="예: 월세, 통신비, 적금"
          className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
        />
      </div>

      {error && <p className="text-sm text-status-danger">{error}</p>}

      <Button type="submit" variant="primary" fullWidth disabled={submitting}>
        반복거래 등록
      </Button>
    </form>
  );
}
