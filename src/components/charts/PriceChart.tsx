import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStockHistory } from "@/hooks/useStock";
import type { TimeRange } from "@/types/api";
import { Skeleton } from "@/components/ui/skeleton";

const RANGES: TimeRange[] = ["1D", "1W", "1M", "1Y", "5Y"];

interface Props {
  symbol: string;
  positive: boolean;
}

const formatDate = (iso: string, range: TimeRange) => {
  const d = new Date(iso);
  if (range === "1D") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (range === "1W" || range === "1M") return d.toLocaleDateString([], { month: "short", day: "numeric" });
  return d.toLocaleDateString([], { month: "short", year: "2-digit" });
};

const PriceChart = ({ symbol, positive }: Props) => {
  const [range, setRange] = useState<TimeRange>("1M");
  const { data, isLoading } = useStockHistory(symbol, range);

  const stroke = positive ? "hsl(var(--success))" : "hsl(var(--danger))";
  const gradId = `chart-${symbol}-${positive ? "up" : "down"}`;

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Price chart</h3>
        <div className="flex items-center gap-1 rounded-lg border bg-background p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                range === r
                  ? "gradient-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-56 w-full">
        {isLoading || !data ? (
          <Skeleton className="h-full w-full rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickFormatter={(v) => formatDate(v, range)}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={32}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(v) => `₹${Math.round(v).toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                  color: "hsl(var(--popover-foreground))",
                }}
                labelFormatter={(v) => formatDate(String(v), range)}
                formatter={(v: number) => [`₹${v.toLocaleString()}`, "Close"]}
              />
              <Area type="monotone" dataKey="close" stroke={stroke} strokeWidth={2} fill={`url(#${gradId})`} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default PriceChart;
