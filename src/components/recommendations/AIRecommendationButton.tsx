"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDateKo } from "@/lib/utils";

interface AIRecommendationButtonProps {
  initialText: string | null;
  initialDisclaimer: string | null;
  initialCreatedAt: string | null;
}

/** AI 상세권고 요청 버튼 (11단계) — 버튼을 눌렀을 때만 서버(/api/ai/recommend)에서 AI를 호출한다 */
export function AIRecommendationButton({ initialText, initialDisclaimer, initialCreatedAt }: AIRecommendationButtonProps) {
  const [text, setText] = useState(initialText);
  const [disclaimer, setDisclaimer] = useState(initialDisclaimer);
  const [createdAt, setCreatedAt] = useState(initialCreatedAt);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const onClick = async () => {
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/ai/recommend", { method: "POST" });
      const data = await res.json();

      if (data.ok) {
        setText(data.text);
        setDisclaimer(data.disclaimer);
        setCreatedAt(data.createdAt ?? new Date().toISOString());
      } else if (data.reason === "not_configured") {
        setNotice(data.message);
      } else {
        setNotice(data.message ?? "요청 중 문제가 발생했습니다.");
      }
    } catch {
      setNotice("네트워크 문제로 요청하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button variant="secondary" onClick={onClick} disabled={loading}>
        <Sparkles size={16} /> {loading ? "분석 중..." : "AI 상세분석 요청"}
      </Button>

      {notice && <p className="text-sm text-status-caution">{notice}</p>}

      {text && (
        <div className="rounded-xl border border-border bg-bg-elevated p-4">
          <p className="whitespace-pre-wrap text-sm text-text-primary">{text}</p>
          {disclaimer && <p className="mt-3 text-xs text-text-muted">{disclaimer}</p>}
          {createdAt && <p className="mt-1 text-xs text-text-muted">생성 시각: {formatDateKo(createdAt)}</p>}
        </div>
      )}
    </div>
  );
}
