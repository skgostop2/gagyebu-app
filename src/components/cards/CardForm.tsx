"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { CARD_TYPE_LABEL } from "@/lib/card-labels";
import type { Tables } from "@/lib/supabase/database.types";

type Member = Tables<"household_members">;

/** 카드 등록 (요구사항 20, 21) — 카드전체번호·CVC·비밀번호는 애초에 입력받지 않는다 */
export function CardForm({ householdId, members }: { householdId: string; members: Member[] }) {
  const router = useRouter();
  const [alias, setAlias] = useState("");
  const [issuer, setIssuer] = useState("");
  const [cardType, setCardType] = useState<"credit" | "check">("credit");
  const [ownerMemberId, setOwnerMemberId] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [last4, setLast4] = useState("");
  const [billingDay, setBillingDay] = useState("14");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!alias.trim() || !issuer.trim()) {
      setError("카드 별칭과 발급사를 입력해 주세요.");
      return;
    }
    if (!/^[0-9]{4}$/.test(last4)) {
      setError("카드 뒤 4자리 숫자를 입력해 주세요. (전체 카드번호는 저장하지 않습니다)");
      return;
    }
    const billingDayNumber = Number(billingDay);
    if (!billingDayNumber || billingDayNumber < 1 || billingDayNumber > 31) {
      setError("결제일을 1~31 사이로 입력해 주세요.");
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

    const { error: insertError } = await supabase.from("cards").insert({
      household_id: householdId,
      alias: alias.trim(),
      issuer: issuer.trim(),
      card_type: cardType,
      owner_member_id: ownerMemberId || null,
      is_shared: isShared,
      last4,
      billing_day: billingDayNumber,
      monthly_limit: monthlyLimit ? Number(monthlyLimit) : null,
      created_by: user.id,
    });

    setSubmitting(false);
    if (insertError) {
      setError("등록 중 문제가 발생했습니다. 다시 시도해 주세요.");
      return;
    }

    setAlias("");
    setIssuer("");
    setLast4("");
    setMonthlyLimit("");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">카드 별칭</label>
          <input
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="예: 생활비 카드"
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">발급사</label>
          <input
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            placeholder="예: 신한카드"
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">카드 종류</label>
          <select
            value={cardType}
            onChange={(e) => setCardType(e.target.value as "credit" | "check")}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          >
            {Object.entries(CARD_TYPE_LABEL).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">카드번호 뒤 4자리</label>
          <input
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
            inputMode="numeric"
            placeholder="1234"
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">결제일 (매월)</label>
          <input
            type="number"
            min={1}
            max={31}
            value={billingDay}
            onChange={(e) => setBillingDay(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">월 한도 (선택)</label>
          <input
            type="number"
            inputMode="numeric"
            value={monthlyLimit}
            onChange={(e) => setMonthlyLimit(e.target.value)}
            placeholder="선택 안 함"
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">주 사용자</label>
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

      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input type="checkbox" className="touch-target" checked={isShared} onChange={(e) => setIsShared(e.target.checked)} />
        가족 공동 사용 카드
      </label>

      {error && <p className="text-sm text-status-danger">{error}</p>}

      <Button type="submit" variant="primary" fullWidth disabled={submitting}>
        카드 등록
      </Button>
    </form>
  );
}
