"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import type { HouseholdType } from "@/lib/types";

const typeOptions: { value: HouseholdType; label: string }[] = [
  { value: "single", label: "1인 가구" },
  { value: "couple", label: "부부" },
  { value: "with_children", label: "자녀 포함 가족" },
  { value: "with_parents", label: "부모 포함 가족" },
  { value: "other", label: "기타" },
];

export default function NewHouseholdPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<HouseholdType>("with_children");
  const [displayName, setDisplayName] = useState("");
  const [fiscalStartDay, setFiscalStartDay] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !displayName.trim()) {
      setError("가정 이름과 대표자 이름을 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("create_household", {
      p_name: name.trim(),
      p_type: type,
      p_member_count: 1,
      p_fiscal_start_day: fiscalStartDay,
      p_display_name: displayName.trim(),
    });
    setSubmitting(false);

    if (rpcError) {
      setError("가정을 만드는 중 문제가 발생했습니다. 다시 시도해 주세요.");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">새로운 가정 만들기</h1>
        <p className="mt-1 text-sm text-text-secondary">가정 정보를 입력해 주세요.</p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">가정 이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 우리 가족"
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">가정 유형</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as HouseholdType)}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          >
            {typeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">대표자 이름 (나)</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="예: 아빠"
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-secondary">월 기준 시작일</label>
          <input
            type="number"
            min={1}
            max={28}
            value={fiscalStartDay}
            onChange={(e) => setFiscalStartDay(Number(e.target.value))}
            className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
          />
        </div>

        {error && <p className="text-sm text-status-danger">{error}</p>}

        <Button type="submit" variant="primary" fullWidth disabled={submitting}>
          가정 만들기
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        초대코드가 있으신가요?{" "}
        <Link href="/household/join" className="text-cyan hover:underline">
          기존 가정 참여하기
        </Link>
      </p>
    </div>
  );
}
