import { AlertTriangle, Info, ShieldAlert, TriangleAlert } from "lucide-react";
import type { RuleBasedRecommendation } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const severityIcon = {
  info: Info,
  caution: TriangleAlert,
  warning: AlertTriangle,
  danger: ShieldAlert,
} as const;

const severityClass = {
  info: "text-cyan",
  caution: "text-status-caution",
  warning: "text-status-warning",
  danger: "text-status-danger",
} as const;

/** 핵심 권고 최대 3개 (요구사항 35) */
export function RecommendationList({ items }: { items: RuleBasedRecommendation[] }) {
  const top3 = items.slice(0, 3);

  if (top3.length === 0) {
    return (
      <Card>
        <p className="text-sm text-text-secondary">현재 특별한 권고사항이 없습니다.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {top3.map((rec) => {
        const Icon = severityIcon[rec.severity];
        return (
          <Card key={rec.id} className="flex items-start gap-3 p-3">
            <Icon size={18} className={cn("mt-0.5 shrink-0", severityClass[rec.severity])} />
            <div>
              <div className="text-sm font-medium text-text-primary">{rec.title}</div>
              <div className="mt-0.5 text-xs text-text-secondary">{rec.description}</div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
