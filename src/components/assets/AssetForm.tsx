"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { ASSET_CATEGORIES, ASSET_CATEGORY_LABEL, ASSET_KINDS_BY_CATEGORY, type AssetCategory } from "@/lib/asset-labels";
import type { Tables } from "@/lib/supabase/database.types";

type Member = Tables<"household_members">;

/** 자산 등록 (요구사항 26) — 현금성/투자성/실물 자산을 포괄 */
export function AssetForm({ householdId, members }: { householdId: string; members: Member[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<AssetCategory>("cash_equivalent");
  const [kind, setKind] = useState(ASSET_KINDS_BY_CATEGORY.cash_equivalent[0]!.value);
  const [ownerMemberId, setOwnerMemberId] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [initialAmount, setInitialAmount] = useState("");
  const [currentValuation, setCurrentValuation] = useState("");
  const [institution, setInstitution] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onCategoryChange = (value: AssetCategory) => {
    setCategory(value);
    setKind(ASSET_KINDS_BY_CATEGORY[value][0]!.value);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("자산 이름을 입력해 주세요.");
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

    const { error: insertError } = await supabase.from("assets").insert({
      household_id: householdId,
      name: name.trim(),
      category,
      kind,
      owner_member_id: ownerMemberId || null,
      is_shared: isShared,
      initial_amount: Number(initialAmount) || 0,
      current_valuation: Number(currentValuation) || 0,
      institution: institution || null,
      created_by: user.id,
    });

    setSubmitting(false);
    if (insertError) {
      setError("등록 중 문제가 발생했습니다. 다시 시도해 주세요.");
      return;
    }

    setName("");
    setInitialAmount("");
    setCurrentValuation("");
    setInstitution("");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">자산명</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 서울 아파트, 청약통장"
          className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">분류</label>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value as AssetCategory)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          >
            {ASSET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {ASSET_CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">종류</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          >
            {ASSET_KINDS_BY_CATEGORY[category].map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">취득가액</label>
          <input
            type="number"
            inputMode="numeric"
            value={initialAmount}
            onChange={(e) => setInitialAmount(e.target.value)}
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

      <div>
        <label className="mb-1.5 block text-sm text-text-secondary">금융기관 (선택)</label>
        <input
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
        />
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

      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input type="checkbox" className="touch-target" checked={isShared} onChange={(e) => setIsShared(e.target.checked)} />
        가족 공동 자산
      </label>

      {error && <p className="text-sm text-status-danger">{error}</p>}

      <Button type="submit" variant="primary" fullWidth disabled={submitting}>
        자산 등록
      </Button>
    </form>
  );
}
