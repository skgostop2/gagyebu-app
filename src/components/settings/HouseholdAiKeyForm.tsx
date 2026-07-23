"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

type Provider = "anthropic" | "openai";

/**
 * 가정별 AI API 키 등록 (owner/admin 전용) — 요청사항: 다른 가정은 각자 자기 API 키를 쓰도록.
 * 키 값은 저장 후 화면에 다시 보여주지 않는다(write-only) — 등록 여부와 어떤 제공자인지만 표시한다.
 */
export function HouseholdAiKeyForm({
  householdId,
  initialProvider,
  initialConfiguredAt,
}: {
  householdId: string;
  initialProvider: Provider | null;
  initialConfiguredAt: string | null;
}) {
  const [provider, setProvider] = useState<Provider>(initialProvider ?? "anthropic");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [configured, setConfigured] = useState<{ provider: Provider; at: string } | null>(
    initialProvider && initialConfiguredAt ? { provider: initialProvider, at: initialConfiguredAt } : null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const onSave = async () => {
    if (!apiKey.trim()) {
      setError("API 키를 입력해 주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: upsertError } = await supabase.from("household_ai_config").upsert({
      household_id: householdId,
      provider,
      api_key: apiKey.trim(),
      model: model.trim() === "" ? null : model.trim(),
    });
    setSaving(false);
    if (upsertError) {
      setError("저장하지 못했습니다. 관리자 이상만 등록할 수 있습니다.");
      return;
    }
    setApiKey("");
    setConfigured({ provider, at: new Date().toISOString() });
    setSavedAt(Date.now());
  };

  const onClear = async () => {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("household_ai_config").delete().eq("household_id", householdId);
    setSaving(false);
    if (deleteError) {
      setError("삭제하지 못했습니다.");
      return;
    }
    setConfigured(null);
    setSavedAt(null);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-muted">
        우리 가정만의 AI 키를 등록하면 AI 상세권고 요청이 이 키로 처리됩니다. 등록하지 않으면 서비스 공용 키(등록돼 있는 경우)를
        같이 씁니다.
      </p>

      {configured && (
        <p className="text-sm text-status-stable">
          현재 {configured.provider === "anthropic" ? "Anthropic (Claude)" : "OpenAI (ChatGPT)"} 키가 설정돼 있습니다.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="ai-provider" className="text-sm text-text-secondary">
          제공자
        </label>
        <select
          id="ai-provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value as Provider)}
          className="touch-target rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-neon-blue"
        >
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="openai">OpenAI (ChatGPT)</option>
        </select>
      </div>

      <div>
        <label htmlFor="ai-api-key" className="mb-1.5 block text-sm text-text-secondary">
          API 키
        </label>
        <input
          id="ai-api-key"
          type="password"
          autoComplete="off"
          placeholder={configured ? "변경하려면 새 키를 입력하세요" : "sk-... 또는 sk-ant-..."}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
        />
      </div>

      <div>
        <label htmlFor="ai-model" className="mb-1.5 block text-sm text-text-secondary">
          모델 (선택)
        </label>
        <input
          id="ai-model"
          type="text"
          placeholder="비워두면 기본 모델 사용"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="touch-target w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-primary outline-none focus:border-neon-blue"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onSave} disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </Button>
        {configured && (
          <Button variant="secondary" onClick={onClear} disabled={saving}>
            키 삭제(공용 키로 되돌리기)
          </Button>
        )}
        {savedAt && <span className="text-xs text-status-stable">저장됐습니다.</span>}
        {error && <span className="text-xs text-status-danger">{error}</span>}
      </div>
    </div>
  );
}
