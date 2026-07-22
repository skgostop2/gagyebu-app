"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

type Member = Tables<"household_members">;

/** 저축 등록 (요구사항 24) */
export function SavingsAccountForm({ householdId, members }: { householdId: string; members: Member[] }) {
  const router = useRouter();
  const [productName, setProductName] = useState("");
  const [institution, setInstitution] = useState("");
  const [ownerMemberId, setOwnerMemberId] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [maturityDate, setMaturityDate] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!productName.trim() || !institution.trim()) {
      setError("상품명과 금융기관을 입력해 주세요.");
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

    const { error: insertError } = await supabase.from("savings_accounts").insert({
      household_id: householdId,
      product_name: productName.trim(),
      institution: institution.trim(),
      owner_member_id: ownerMemberId || null,
      monthly_contribution: Number(monthlyContribution) || 0,
      current_balance: Number(currentBalance) || 0,
      target_amount: targetAmount ? Number(targetAmount) : null,
      start_date: startDate,
      maturity_date: maturityDate || null,
      interest_rate: interestRate ? Number(interestRate) : null,
      created_by: user.id,
    });

    setSubmitting(false);
    if (insertError) {
      setError("등록 중 문제가 발생했습니다. 다시 시도해 주세요.");
      return;
    }

    setProductName("");
    setInstitution("");
    setMonthlyContribution("");
    setCurrentBalance("");
    setTargetAmount("");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">상품명</label>
          <input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="예: 청년내일저축계좌"
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">금융기관</label>
          <input
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">월 납입액</label>
          <input
            type="number"
            inputMode="numeric"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(e.target.value)}
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
          <label className="mb-1.5 block text-sm text-text-secondary">목표금액 (선택)</label>
          <input
            type="number"
            inputMode="numeric"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="선택 안 함"
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">금리 % (선택)</label>
          <input
            type="number"
            step="0.01"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">가입일</label>
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

      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">명의자 (선택)</label>
        <select
          value={ownerMemberId}
          onChange={(e) => setOwnerMemberId(e.target.value)}
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

      {error && <p className="text-sm text-status-danger">{error}</p>}

      <Button type="submit" variant="primary" fullWidth disabled={submitting}>
        저축 등록
      </Button>
    </form>
  );
}
