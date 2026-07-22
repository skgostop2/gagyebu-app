"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { INVESTMENT_TYPES, INVESTMENT_TYPE_LABEL, type InvestmentType } from "@/lib/asset-labels";
import type { Tables } from "@/lib/supabase/database.types";

type Member = Tables<"household_members">;

/** 투자 등록 (요구사항 25) — 평가액은 사용자가 직접 입력한다(자동연동 없음) */
export function InvestmentForm({ householdId, members }: { householdId: string; members: Member[] }) {
  const router = useRouter();
  const [productName, setProductName] = useState("");
  const [investmentType, setInvestmentType] = useState<InvestmentType>("domestic_stock");
  const [institution, setInstitution] = useState("");
  const [ownerMemberId, setOwnerMemberId] = useState("");
  const [principal, setPrincipal] = useState("");
  const [currentValuation, setCurrentValuation] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [lastValuationDate, setLastValuationDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!productName.trim() || !institution.trim()) {
      setError("종목/상품명과 증권사(운용사)를 입력해 주세요.");
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

    const { error: insertError } = await supabase.from("investments").insert({
      household_id: householdId,
      product_name: productName.trim(),
      investment_type: investmentType,
      institution: institution.trim(),
      owner_member_id: ownerMemberId || null,
      principal: Number(principal) || 0,
      current_valuation: Number(currentValuation) || 0,
      purchase_date: purchaseDate,
      last_valuation_date: lastValuationDate,
      created_by: user.id,
    });

    setSubmitting(false);
    if (insertError) {
      setError("등록 중 문제가 발생했습니다. 다시 시도해 주세요.");
      return;
    }

    setProductName("");
    setInstitution("");
    setPrincipal("");
    setCurrentValuation("");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">종목/상품명</label>
          <input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">유형</label>
          <select
            value={investmentType}
            onChange={(e) => setInvestmentType(e.target.value as InvestmentType)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          >
            {INVESTMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {INVESTMENT_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">증권사·운용사</label>
        <input
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">투자원금</label>
          <input
            type="number"
            inputMode="numeric"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">현재 평가액</label>
          <input
            type="number"
            inputMode="numeric"
            value={currentValuation}
            onChange={(e) => setCurrentValuation(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">매수일</label>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">평가 기준일</label>
          <input
            type="date"
            value={lastValuationDate}
            onChange={(e) => setLastValuationDate(e.target.value)}
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
        투자 등록
      </Button>
    </form>
  );
}
