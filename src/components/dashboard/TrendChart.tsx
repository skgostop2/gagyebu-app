"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface TrendChartProps {
  data: { month: string; income: number; expense: number }[];
}

/**
 * 대시보드용 그래프는 1개만 유지한다 (요구사항 37).
 * 상세 그래프 화면에서 더 많은 그래프를 지연로딩(next/dynamic)으로 불러온다 (2단계 이후).
 */
export function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: "#141b2b", border: "1px solid #232d42", borderRadius: 8 }}
            labelStyle={{ color: "#f5f7fa" }}
          />
          <Line type="monotone" dataKey="income" stroke="#22d3ee" strokeWidth={2} dot={false} name="수입" />
          <Line type="monotone" dataKey="expense" stroke="#a855f7" strokeWidth={2} dot={false} name="지출" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
