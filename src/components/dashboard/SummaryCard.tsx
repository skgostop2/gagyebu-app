import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatKRW } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  label: string;
  amount: number;
  icon: LucideIcon;
  tone?: "neutral" | "positive" | "negative";
}

/** 대시보드 핵심 카드 (요구사항 35) — 최대 6개만 노출 */
export function SummaryCard({ label, amount, icon: Icon, tone = "neutral" }: SummaryCardProps) {
  const toneClass =
    tone === "positive" ? "text-status-stable" : tone === "negative" ? "text-status-danger" : "text-text-primary";

  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-text-secondary">{label}</span>
        <Icon size={16} className="text-cyan" />
      </div>
      <div className={cn("text-lg font-semibold", toneClass)}>{formatKRW(amount)}</div>
    </Card>
  );
}
