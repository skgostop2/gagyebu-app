"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatKRW } from "@/lib/utils";

interface NetWorthTrendChartProps {
  data: { month: string; netWorth: number; totalAssets: number; totalLiabilities: number }[];
}

/** 월별 자산 스냅샷 기반 순자산 추이 (8단계 상세그래프) */
export function NetWorthTrendChart({ data }: NetWorthTrendChartProps) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-text-muted">
        저장된 월별 스냅샷이 없습니다. 자산·부채 화면에서 &quot;이번 달 스냅샷 저장&quot;을 눌러주세요.
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: "#141b2b", border: "1px solid #232d42", borderRadius: 8 }}
            labelStyle={{ color: "#f5f7fa" }}
            formatter={(value: number, name: string) => [formatKRW(value), name]}
          />
          <Line type="monotone" dataKey="netWorth" stroke="#34d399" strokeWidth={2} dot name="순자산" />
          <Line type="monotone" dataKey="totalAssets" stroke="#22d3ee" strokeWidth={1.5} dot={false} name="총자산" />
          <Line type="monotone" dataKey="totalLiabilities" stroke="#f87171" strokeWidth={1.5} dot={false} name="총부채" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
