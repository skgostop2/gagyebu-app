"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import {
  SELECTABLE_TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABEL,
  usesCategory,
  categoryKindOf,
  type SelectableTransactionType,
} from "@/lib/transaction-labels";
import type { Tables } from "@/lib/supabase/database.types";

type Category = Tables<"categories">;

function todayLocalDatetime(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

interface TransactionFormProps {
  householdId: string;
  categories: Category[];
  mode: "create" | "edit";
  transactionId?: string;
  initialValues?: {
    type: SelectableTransactionType;
    amount: number;
    occurredAt: string;
    categoryId: string | null;
    isFixed: boolean;
    isEssential: boolean;
    memo: string;
  };
  defaultType?: SelectableTransactionType;
  /** 사진·PDF 업로드 흐름(10단계)에서 미리 업로드해 둔 첨부파일 id — 등록 성공 시 이 거래에 연결한다 */
  pendingAttachmentId?: string;
}

/** 거래 등록·수정 공용 폼 (요구사항 18, 19) */
export function TransactionForm({
  householdId,
  categories,
  mode,
  transactionId,
  initialValues,
  defaultType,
  pendingAttachmentId,
}: TransactionFormProps) {
  const router = useRouter();
  const [type, setType] = useState<SelectableTransactionType>(
    initialValues?.type ?? defaultType ?? "living_expense"
  );
  const [amount, setAmount] = useState(initialValues ? String(initialValues.amount) : "");
  const [occurredAt, setOccurredAt] = useState(initialValues?.occurredAt.slice(0, 16) ?? todayLocalDatetime());
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? "");
  const [isFixed, setIsFixed] = useState(initialValues?.isFixed ?? false);
  const [isEssential, setIsEssential] = useState(initialValues?.isEssential ?? false);
  const [memo, setMemo] = useState(initialValues?.memo ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showCategory = usesCategory(type);
  const categoryOptions = showCategory
    ? categories.filter((c) => c.kind === categoryKindOf(type) && c.is_active)
    : [];
  const showLivingExpenseOptions = type === "living_expense";

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

    if (mode === "create") {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("로그인이 필요합니다.");
        setSubmitting(false);
        return;
      }

      const { data: inserted, error: insertError } = await supabase
        .from("transactions")
        .insert({
          household_id: householdId,
          type,
          amount: amountNumber,
          occurred_at: new Date(occurredAt).toISOString(),
          category_id: showCategory && categoryId ? categoryId : null,
          is_fixed: showLivingExpenseOptions ? isFixed : false,
          is_essential: showLivingExpenseOptions ? isEssential : false,
          memo: memo || null,
          created_by: user.id,
        })
        .select("id")
        .single();

      setSubmitting(false);
      if (insertError) {
        setError("등록 중 문제가 발생했습니다. 다시 시도해 주세요.");
        return;
      }

      if (pendingAttachmentId && inserted) {
        await supabase
          .from("transaction_attachments")
          .update({ transaction_id: inserted.id })
          .eq("id", pendingAttachmentId);
      }
    } else {
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          type,
          amount: amountNumber,
          occurred_at: new Date(occurredAt).toISOString(),
          category_id: showCategory && categoryId ? categoryId : null,
          is_fixed: showLivingExpenseOptions ? isFixed : false,
          is_essential: showLivingExpenseOptions ? isEssential : false,
          memo: memo || null,
        })
        .eq("id", transactionId!);

      setSubmitting(false);
      if (updateError) {
        setError("수정 권한이 없거나 문제가 발생했습니다.");
        return;
      }
    }

    router.push("/transactions");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">거래유형</label>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as SelectableTransactionType);
            setCategoryId("");
          }}
          className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
        >
          {SELECTABLE_TRANSACTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {TRANSACTION_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">금액 (원)</label>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">일시</label>
        <input
          type="datetime-local"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
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

      {showLivingExpenseOptions && (
        <div className="flex gap-4 text-sm text-text-secondary">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="touch-target" checked={isFixed} onChange={(e) => setIsFixed(e.target.checked)} />
            고정지출
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="touch-target"
              checked={isEssential}
              onChange={(e) => setIsEssential(e.target.checked)}
            />
            필수지출
          </label>
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
        {mode === "create" ? "등록" : "수정 저장"}
      </Button>
    </form>
  );
}
