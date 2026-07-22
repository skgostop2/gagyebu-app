"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPercent } from "@/lib/utils";
import type { BudgetHealth } from "@/lib/types";

interface BudgetUsageBarChartProps {
  data: { name: string; ratio: number; health: BudgetHealth }[];
}

const HEALTH_COLOR: Record<BudgetHealth, string> = {
  stable: "#34d399",
  needs_attention: "#fbbf24",
  caution: "#fbbf24",
  danger: "#f87171",
  exceeded: "#f87171",
};

/** 진행 중인 예산의 사용률 (8단계 상세그래프) */
export function BudgetUsageBarChart({ data }: BudgetUsageBarChartProps) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-text-muted">진행 중인 예산이 없습니다.</p>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 12 }}>
          <XAxis type="number" hide domain={[0, (max: number) => Math.max(100, max)]} />
          <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} width={110} />
          <Tooltip
            contentStyle={{ background: "#141b2b", border: "1px solid #232d42", borderRadius: 8 }}
            labelStyle={{ color: "#f5f7fa" }}
            formatter={(value: number) => [formatPercent(value), "사용률"]}
          />
          <Bar dataKey="ratio" radius={[0, 6, 6, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={HEALTH_COLOR[entry.health]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
