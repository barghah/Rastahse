"use client";

import { useState, useMemo, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  items: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shipping_address?: any;
}

interface Props {
  orders: Order[];
}

type XMode = "daily" | "weekly" | "monthly" | "category";
type YMode = "orders" | "revenue";

interface DataPoint {
  label: string;
  value: number;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function isoWeek(d: Date): string {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `W${week} '${String(d.getFullYear()).slice(2)}`;
}

function dayKey(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
function monthKey(d: Date): string {
  return `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
}

function getCategory(order: Order): string {
  const items = Array.isArray(order.items) ? order.items as Array<{ category?: string; name?: string }> : [];
  return items[0]?.category ?? "other";
}

// ─── Data aggregation ─────────────────────────────────────────────────────────

function buildPoints(orders: Order[], xMode: XMode, yMode: YMode): DataPoint[] {
  const VALID = ["paid", "processing", "shipped", "delivered"];
  const valid = orders.filter((o) => VALID.includes(o.status));

  if (xMode === "category") {
    const map = new Map<string, number>();
    for (const o of valid) {
      const cat = getCategory(o);
      const v = yMode === "revenue" ? Number(o.total) / 100 : 1;
      map.set(cat, (map.get(cat) ?? 0) + v);
    }
    return Array.from(map.entries())
      .map(([label, value]) => ({ label: label.replace(/-/g, " "), value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }

  // Time-series modes — last N periods
  const now = new Date();
  const periods: { key: string; label: string; start: Date; end: Date }[] = [];

  if (xMode === "daily") {
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      periods.push({ key: d.toDateString(), label: dayKey(d), start: d, end });
    }
  } else if (xMode === "weekly") {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      periods.push({ key: isoWeek(weekStart), label: isoWeek(weekStart), start: weekStart, end: weekEnd });
    }
  } else {
    // monthly — last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      periods.push({ key: monthKey(d), label: monthKey(d), start: d, end });
    }
  }

  const map = new Map<string, number>(periods.map((p) => [p.key, 0]));

  for (const o of valid) {
    const t = new Date(o.created_at).getTime();
    for (const p of periods) {
      if (t >= p.start.getTime() && t <= p.end.getTime()) {
        const v = yMode === "revenue" ? Number(o.total) / 100 : 1;
        map.set(p.key, (map.get(p.key) ?? 0) + v);
        break;
      }
    }
  }

  return periods.map((p) => ({
    label: p.label,
    value: Math.round(map.get(p.key) ?? 0),
  }));
}

// ─── SVG Chart ────────────────────────────────────────────────────────────────

const W = 560;
const H = 180;
const PAD_L = 50;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 36;
const CW = W - PAD_L - PAD_R;
const CH = H - PAD_T - PAD_B;

function svgPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
}

function formatVal(v: number, yMode: YMode): string {
  if (yMode === "revenue") {
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
    return `₹${v}`;
  }
  return String(v);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminInsightChart({ orders }: Props) {
  const [xMode, setXMode] = useState<XMode>("weekly");
  const [yMode, setYMode] = useState<YMode>("orders");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const data = useMemo(() => buildPoints(orders, xMode, yMode), [orders, xMode, yMode]);

  const maxVal = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);

  // Compute polyline coords
  const pts = useMemo(() => {
    if (data.length === 0) return [];
    const isBar = xMode === "category";
    if (isBar) {
      return data.map((d, i) => ({
        x: PAD_L + (i / data.length) * CW + CW / data.length / 2,
        y: PAD_T + CH - (d.value / maxVal) * CH,
      }));
    }
    return data.map((d, i) => ({
      x: PAD_L + (i / (data.length - 1)) * CW,
      y: PAD_T + CH - (d.value / maxVal) * CH,
    }));
  }, [data, maxVal, xMode]);

  const pathD = svgPath(pts);
  const areaD =
    pts.length > 1
      ? `${pathD} L${pts[pts.length - 1].x.toFixed(1)},${(PAD_T + CH).toFixed(1)} L${PAD_L},${(PAD_T + CH).toFixed(1)} Z`
      : "";

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: PAD_T + CH - f * CH,
    label: formatVal(Math.round(f * maxVal), yMode),
  }));

  // Totals for summary strip
  const totalVal = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);
  const avgVal = data.length > 0 ? Math.round(totalVal / data.length) : 0;
  const peakPoint = data.reduce((best, d) => (d.value > best.value ? d : best), data[0] ?? { label: "—", value: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || data.length === 0) return;
    const x = (e.clientX - rect.left) * (W / rect.width);
    const isBar = xMode === "category";
    if (isBar) {
      const bw = CW / data.length;
      const idx = Math.floor((x - PAD_L) / bw);
      setHoverIdx(idx >= 0 && idx < data.length ? idx : null);
    } else {
      const step = CW / (data.length - 1);
      const idx = Math.round((x - PAD_L) / step);
      setHoverIdx(idx >= 0 && idx < data.length ? idx : null);
    }
  }, [data.length, xMode]);

  const hovered = hoverIdx !== null ? data[hoverIdx] : null;
  const hoveredPt = hoverIdx !== null ? pts[hoverIdx] : null;

  return (
    <div className="bg-paper rounded-[20px] border border-brand shadow-soft overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-brand">
        <div>
          <h2 className="font-label text-sm text-ink font-semibold tracking-tight">Insight Chart</h2>
          <p className="font-body text-[11px] text-ink/40 mt-0.5">Dynamic view of store performance</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* X-axis selector */}
          <div className="flex items-center rounded-[10px] border border-brand overflow-hidden bg-surface/50">
            {(["daily", "weekly", "monthly", "category"] as XMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setXMode(m)}
                className={`px-3 py-1.5 font-label text-[9.5px] uppercase tracking-wider transition-all cursor-pointer ${
                  xMode === m
                    ? "bg-ink text-paper"
                    : "text-ink/50 hover:text-ink"
                }`}
              >
                {m === "category" ? "By Category" : m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          {/* Y-axis selector */}
          <div className="flex items-center rounded-[10px] border border-brand overflow-hidden bg-surface/50">
            {(["orders", "revenue"] as YMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setYMode(m)}
                className={`px-3 py-1.5 font-label text-[9.5px] uppercase tracking-wider transition-all cursor-pointer ${
                  yMode === m
                    ? "bg-berry text-paper"
                    : "text-ink/50 hover:text-ink"
                }`}
              >
                {m === "revenue" ? "Revenue (₹)" : "Orders"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="flex flex-wrap gap-0 border-b border-brand/50">
        {[
          { label: yMode === "revenue" ? "Total Revenue" : "Total Orders", value: formatVal(totalVal, yMode) },
          { label: "Average / period",  value: formatVal(avgVal, yMode) },
          { label: "Peak",              value: `${peakPoint?.label ?? "—"} (${formatVal(peakPoint?.value ?? 0, yMode)})` },
        ].map((s, i) => (
          <div key={i} className={`px-5 py-3 flex-1 min-w-[120px] ${i > 0 ? "border-l border-brand/50" : ""}`}>
            <p className="font-label text-[9px] text-ink/35 uppercase tracking-widest">{s.label}</p>
            <p className="font-label text-sm text-ink font-semibold mt-0.5 truncate">{s.value}</p>
          </div>
        ))}
      </div>

      {/* SVG Chart */}
      <div className="px-3 py-4">
        {data.length === 0 ? (
          <div className="h-[180px] flex items-center justify-center">
            <p className="font-body text-sm text-ink/30">No data yet — orders will appear here once placed.</p>
          </div>
        ) : (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            style={{ height: "180px" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverIdx(null)}
          >
            <defs>
              <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6b0020" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#6b0020" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Y-axis grid lines & labels */}
            {yTicks.map((t, i) => (
              <g key={i}>
                <line
                  x1={PAD_L} y1={t.y} x2={W - PAD_R} y2={t.y}
                  stroke="#e8ddd0" strokeWidth="1" strokeDasharray={i === 0 ? "0" : "3 4"}
                />
                <text
                  x={PAD_L - 5} y={t.y + 4}
                  textAnchor="end"
                  fontSize="8"
                  fill="#9b8f82"
                  fontFamily="ui-monospace, monospace"
                >
                  {t.label}
                </text>
              </g>
            ))}

            {/* Area fill */}
            {areaD && (
              <path d={areaD} fill="url(#chartArea)" />
            )}

            {/* Bars for category mode */}
            {xMode === "category" && data.map((d, i) => {
              const bw = CW / data.length - 4;
              const x = PAD_L + (i / data.length) * CW + 2;
              const barH = (d.value / maxVal) * CH;
              return (
                <rect
                  key={i}
                  x={x} y={PAD_T + CH - barH}
                  width={bw} height={barH}
                  rx="4"
                  fill={hoverIdx === i ? "#6b0020" : "#be1240"}
                  fillOpacity={hoverIdx === i ? 1 : 0.7}
                  className="transition-all"
                />
              );
            })}

            {/* Line for time modes */}
            {xMode !== "category" && pathD && (
              <path d={pathD} fill="none" stroke="#be1240" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            )}

            {/* Dots */}
            {pts.map((p, i) => (
              <circle
                key={i}
                cx={p.x} cy={p.y} r={hoverIdx === i ? 4 : 2.5}
                fill={hoverIdx === i ? "#6b0020" : "#be1240"}
                stroke="white" strokeWidth="1.5"
                className="transition-all"
              />
            ))}

            {/* X-axis labels — show every Nth to avoid crowding */}
            {data.map((d, i) => {
              const step = Math.ceil(data.length / 8);
              if (i % step !== 0 && i !== data.length - 1) return null;
              const x = xMode === "category"
                ? PAD_L + (i / data.length) * CW + CW / data.length / 2
                : PAD_L + (i / (data.length - 1)) * CW;
              return (
                <text
                  key={i}
                  x={x} y={H - 8}
                  textAnchor="middle"
                  fontSize="7.5"
                  fill="#9b8f82"
                  fontFamily="ui-sans-serif, sans-serif"
                  className="capitalize"
                >
                  {d.label.length > 8 ? d.label.slice(0, 7) + "…" : d.label}
                </text>
              );
            })}

            {/* Hover tooltip */}
            {hovered && hoveredPt && (
              <g>
                <line
                  x1={hoveredPt.x} y1={PAD_T} x2={hoveredPt.x} y2={PAD_T + CH}
                  stroke="#6b0020" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.5"
                />
                <rect
                  x={Math.min(hoveredPt.x + 6, W - 90)}
                  y={hoveredPt.y - 24}
                  width={82} height={22}
                  rx="6" fill="#1a1410" fillOpacity="0.88"
                />
                <text
                  x={Math.min(hoveredPt.x + 47, W - 49)}
                  y={hoveredPt.y - 9}
                  textAnchor="middle"
                  fontSize="9"
                  fill="white"
                  fontFamily="ui-monospace, monospace"
                >
                  {hovered.label}: {formatVal(hovered.value, yMode)}
                </text>
              </g>
            )}
          </svg>
        )}
      </div>
    </div>
  );
}
