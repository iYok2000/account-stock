"use client";

import { memo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = {
  earned: "#10b981",   // emerald-500
  lost: "#f59e0b",     // amber-400
  grid: "#f5f0e8",
  text: "#5c4a2a",
  border: "#e8ddd0",
};

function fmt(value: number): string {
  return `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ── Top Shops Chart ──

export interface ShopChartItem {
  name: string;
  earned: number;
  gmv: number;
  ineligibleAmount: number;
}

export const AffiliateTopShopsChart = memo(function AffiliateTopShopsChart({
  data,
}: {
  data: ShopChartItem[];
}) {
  if (data.length === 0) return null;

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: COLORS.text }}
            tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}K`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: COLORS.text }}
            width={130}
          />
          <Tooltip
            formatter={(v: number, name: string) => {
              if (name === "earned") return [fmt(v), "ค่าคอมที่ได้"];
              if (name === "ineligibleAmount") return [fmt(v), "Ineligible"];
              return [fmt(v), "ยอดขาย"];
            }}
            contentStyle={{ borderColor: COLORS.border, borderRadius: 8, fontSize: 12 }}
          />
          <Legend
            formatter={(value: string) => {
              if (value === "earned") return "ค่าคอมที่ได้";
              if (value === "ineligibleAmount") return "Ineligible";
              return value;
            }}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="earned" name="earned" fill={COLORS.earned} radius={[0, 4, 4, 0]} stackId="a" />
          <Bar dataKey="ineligibleAmount" name="ineligibleAmount" fill={COLORS.lost} radius={[0, 4, 4, 0]} stackId="a" opacity={0.75} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
AffiliateTopShopsChart.displayName = "AffiliateTopShopsChart";

// ── Top Products Chart ──

export interface ProductChartItem {
  name: string;
  commission: number;
}

export const AffiliateProductsChart = memo(function AffiliateProductsChart({
  data,
}: {
  data: ProductChartItem[];
}) {
  if (data.length === 0) return null;

  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: COLORS.text }}
            tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}K`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: COLORS.text }}
            width={150}
          />
          <Tooltip
            formatter={(v: number) => [fmt(v), "ค่าคอมที่ได้"]}
            contentStyle={{ borderColor: COLORS.border, borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="commission" fill={COLORS.earned} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
AffiliateProductsChart.displayName = "AffiliateProductsChart";
