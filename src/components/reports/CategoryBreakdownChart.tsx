"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatKRW } from "@/lib/utils";

interface CategoryBreakdownChartProps {
  data: { name: string; value: number; color: string }[];
}

/** 이번 달 카테고리별 지출 비중 (8단계 상세그래프) */
export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-text-muted">이번 달 지출 내역이 없습니다.</p>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#141b2b", border: "1px solid #232d42", borderRadius: 8 }}
            labelStyle={{ color: "#f5f7fa" }}
            formatter={(value: number, name: string) => [formatKRW(value), name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {data.map((entry) => (
          <li key={entry.name} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden />
            {entry.name} · {formatKRW(entry.value)}
          </li>
        ))}
      </ul>
    </div>
  );
}
