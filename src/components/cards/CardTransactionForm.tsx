"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { estimateBillingMonth } from "@/lib/card-labels";
import type { Tables } from "@/lib/supabase/database.types";

type Category = Tables<"categories">;
type Member = Tables<"household_members">;

function todayLocalDatetime(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

interface CardTransactionFormProps {
  householdId: string;
  cardId: string;
  billingDay: number;
  categories: Category[];
  members: Member[];
}

/** 카드 사용내역 등록 — 일시불/할부 (요구사항 20) */
export function CardTransactionForm({ householdId, cardId, billingDay, categories, members }: CardTransactionFormProps) {
  const router = useRouter();
  const [occurredAt, setOccurredAt] = useState(todayLocalDatetime());
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [actualUserMemberId, setActualUserMemberId] = useState("");
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentMonths, setInstallmentMonths] = useState("3");
  const [monthlyFee, setMonthlyFee] = useState("0");
  const [billingMonth, setBillingMonth] = useState(() => estimateBillingMonth(new Date().toISOString(), billingDay));
  const [billingMonthTouched, setBillingMonthTouched] = useState(false);
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const expenseCategories = categories.filter((c) => c.kind === "expense" && c.is_active);

  const onDateChange = (value: string) => {
    setOccurredAt(value);
    if (!billingMonthTouched) {
      setBillingMonth(estimateBillingMonth(new Date(value).toISOString(), billingDay));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountNumber = Number(amount);
    if (!amountNumber || amountNumber <= 0) {
      setError("금액을 올바르게 입력해 주세요.");
      return;
    }
    if (!merchant.trim()) {
      setError("가맹점(사용처)을 입력해 주세요.");
      return;
    }
    const monthsNumber = isInstallment ? Number(installmentMonths) : 1;
    if (isInstallment && (!monthsNumber || monthsNumber < 2)) {
      setError("할부 개월수는 2개월 이상으로 입력해 주세요.");
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

    const { error: insertError } = await supabase.from("card_transactions").insert({
      household_id: householdId,
      card_id: cardId,
      occurred_at: new Date(occurredAt).toISOString(),
      amount: amountNumber,
      merchant: merchant.trim(),
      category_id: categoryId || null,
      actual_user_scope: actualUserMemberId ? "member" : "household",
      actual_user_member_id: actualUserMemberId || null,
      is_installment: isInstallment,
      installment_months: monthsNumber,
      monthly_fee: isInstallment ? Number(monthlyFee) || 0 : 0,
      billing_month: billingMonth,
      memo: memo || null,
      created_by: user.id,
    });

    setSubmitting(false);
    if (insertError) {
      setError("등록 중 문제가 발생했습니다. 다시 시도해 주세요.");
      return;
    }

    setAmount("");
    setMerchant("");
    setMemo("");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">이용일시</label>
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => onDateChange(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
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
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">사용처</label>
        <input
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">항목 (선택)</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          >
            <option value="">선택 안 함</option>
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">실사용자 (선택)</label>
          <select
            value={actualUserMemberId}
            onChange={(e) => setActualUserMemberId(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          >
            <option value="">가족공동</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.display_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          className="touch-target"
          checked={isInstallment}
          onChange={(e) => setIsInstallment(e.target.checked)}
        />
        할부 결제
      </label>

      {isInstallment && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm text-text-secondary">할부 개월수</label>
            <input
              type="number"
              min={2}
              value={installmentMonths}
              onChange={(e) => setInstallmentMonths(e.target.value)}
              className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-text-secondary">월 할부수수료 (원)</label>
            <input
              type="number"
              inputMode="numeric"
              value={monthlyFee}
              onChange={(e) => setMonthlyFee(e.target.value)}
              className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
            />
          </div>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">최초 청구월</label>
        <input
          type="month"
          value={billingMonth}
          onChange={(e) => {
            setBillingMonthTouched(true);
            setBillingMonth(e.target.value);
          }}
          className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
        />
        <p className="mt-1 text-xs text-text-muted">카드 결제일 기준으로 추정한 값입니다. 실제 명세서와 다르면 직접 수정하세요.</p>
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
        카드 사용내역 등록
      </Button>
    </form>
  );
}
