import { cn } from "@/lib/utils";

export type FinanceStatus = "stable" | "needs_attention" | "caution" | "danger";

const statusMap: Record<FinanceStatus, { label: string; icon: string; className: string }> = {
  stable: { label: "안정", icon: "●", className: "bg-status-stable/15 text-status-stable" },
  needs_attention: { label: "관리 필요", icon: "◐", className: "bg-cyan/15 text-cyan" },
  caution: { label: "주의", icon: "▲", className: "bg-status-caution/15 text-status-caution" },
  danger: { label: "위험", icon: "■", className: "bg-status-danger/15 text-status-danger" },
};

/** 색상만이 아니라 문자·아이콘을 함께 사용 (요구사항 35, 60 접근성) */
export function StatusBadge({ status }: { status: FinanceStatus }) {
  const s = statusMap[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        s.className
      )}
    >
      <span aria-hidden>{s.icon}</span>
      {s.label}
    </span>
  );
}
