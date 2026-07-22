"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { LIABILITY_KINDS, LIABILITY_KIND_LABEL, type LiabilityKind } from "@/lib/asset-labels";
import type { Tables } from "@/lib/supabase/database.types";

type Member = Tables<"household_members">;

/** 부채 등록 (요구사항 27) */
export function LiabilityForm({ householdId, members }: { householdId: string; members: Member[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<LiabilityKind>("mortgage");
  const [debtorMemberId, setDebtorMemberId] = useState("");
  const [institution, setInstitution] = useState("");
  const [originalAmount, setOriginalAmount] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [paymentDueDay, setPaymentDueDay] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [maturityDate, setMaturityDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !institution.trim()) {
      setError("부채 이름과 금융기관을 입력해 주세요.");
      return;
    }
    const originalNumber = Number(originalAmount);
    if (!originalNumber || originalNumber <= 0) {
      setError("최초 대출금액을 올바르게 입력해 주세요.");
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

    const { error: insertError } = await supabase.from("liabilities").insert({
      household_id: householdId,
      name: name.trim(),
      kind,
      debtor_member_id: debtorMemberId || null,
      institution: institution.trim(),
      original_amount: originalNumber,
      current_balance: Number(currentBalance) || 0,
      interest_rate: Number(interestRate) || 0,
      monthly_payment: Number(monthlyPayment) || 0,
      payment_due_day: paymentDueDay ? Number(paymentDueDay) : null,
      start_date: startDate,
      maturity_date: maturityDate || null,
      created_by: user.id,
    });

    setSubmitting(false);
    if (insertError) {
      setError("등록 중 문제가 발생했습니다. 다시 시도해 주세요.");
      return;
    }

    setName("");
    setOriginalAmount("");
    setCurrentBalance("");
    setMonthlyPayment("");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">부채명</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 전세자금대출"
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">종류</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as LiabilityKind)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          >
            {LIABILITY_KINDS.map((k) => (
              <option key={k} value={k}>
                {LIABILITY_KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">금융기관</label>
        <input
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">최초 대출금액</label>
          <input
            type="number"
            inputMode="numeric"
            value={originalAmount}
            onChange={(e) => setOriginalAmount(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">현재 잔액</label>
          <input
            type="number"
            inputMode="numeric"
            value={currentBalance}
            onChange={(e) => setCurrentBalance(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">금리 %</label>
          <input
            type="number"
            step="0.01"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">월 상환액</label>
          <input
            type="number"
            inputMode="numeric"
            value={monthlyPayment}
            onChange={(e) => setMonthlyPayment(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">대출일</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">만기일 (선택)</label>
          <input
            type="date"
            value={maturityDate}
            onChange={(e) => setMaturityDate(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">상환일 (선택)</label>
          <input
            type="number"
            min={1}
            max={31}
            value={paymentDueDay}
            onChange={(e) => setPaymentDueDay(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">채무자 (선택)</label>
          <select
            value={debtorMemberId}
            onChange={(e) => setDebtorMemberId(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          >
            <option value="">미지정</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.display_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-status-danger">{error}</p>}

      <Button type="submit" variant="primary" fullWidth disabled={submitting}>
        부채 등록
      </Button>
    </form>
  );
}
