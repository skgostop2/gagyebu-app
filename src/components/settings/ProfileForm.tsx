"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

/**
 * 회원가입 때 입력한 휴대폰 번호·이름을 보여주고 수정할 수 있는 폼.
 * 가입 시 phone은 auth 메타데이터를 거쳐 user_profiles.phone에 자동 저장되지만,
 * 지금까지는 그 값을 화면 어디에서도 다시 보여주지 않았다 — 여기서 조회·수정 둘 다 가능하게 한다.
 */
export function ProfileForm({
  userId,
  initialDisplayName,
  initialPhone,
}: {
  userId: string;
  initialDisplayName: string;
  initialPhone: string | null;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ display_name: displayName, phone: phone.trim() === "" ? null : phone.trim() })
      .eq("id", userId);
    setSaving(false);
    if (updateError) {
      setError("저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setSavedAt(Date.now());
  };

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="profile-display-name" className="mb-1.5 block text-sm text-text-secondary">
          이름 또는 별명
        </label>
        <input
          id="profile-display-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
        />
      </div>
      <div>
        <label htmlFor="profile-phone" className="mb-1.5 block text-sm text-text-secondary">
          휴대폰 번호
        </label>
        <input
          id="profile-phone"
          type="tel"
          placeholder="01012345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
        />
        <p className="mt-1 text-xs text-text-muted">가입 때 입력한 번호입니다. 실제 인증 연동 전까지는 참고용으로만 저장됩니다.</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onSave} disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </Button>
        {savedAt && <span className="text-xs text-status-stable">저장됐습니다.</span>}
        {error && <span className="text-xs text-status-danger">{error}</span>}
      </div>
    </div>
  );
}
