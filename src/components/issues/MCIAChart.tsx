"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  LabelList,
} from "recharts";

interface MCIAChartProps {
  severity: string;
  urgency: string;
  upvoteCount: number;
  createdAt: string | Date;
  priorityScore: number;
}

const SEVERITY_SCORES: Record<string, number> = {
  LOW: 2.5, MEDIUM: 5, HIGH: 7.5, CRITICAL: 10,
};
const URGENCY_SCORES: Record<string, number> = {
  LOW: 2.5, MEDIUM: 5, HIGH: 7.5, IMMEDIATE: 10,
};

export function MCIAChart({ severity, urgency, upvoteCount, createdAt, priorityScore }: MCIAChartProps) {
  const severityRaw = SEVERITY_SCORES[severity] ?? 5;
  const urgencyRaw = URGENCY_SCORES[urgency] ?? 5;
  const communityRaw = Math.min(upvoteCount * 0.5, 10);
  const ageInDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const recencyRaw = 10 * Math.exp(-ageInDays / 30);

  const contributions = [
    {
      factor: "Severity",
      raw: severityRaw,
      weighted: +(severityRaw * 0.4).toFixed(2),
      weight: "×0.4",
      color: "#ef4444",
      fullMark: 4,
    },
    {
      factor: "Urgency",
      raw: urgencyRaw,
      weighted: +(urgencyRaw * 0.3).toFixed(2),
      weight: "×0.3",
      color: "#f97316",
      fullMark: 3,
    },
    {
      factor: "Community",
      raw: communityRaw,
      weighted: +(communityRaw * 0.2).toFixed(2),
      weight: "×0.2",
      color: "#3b82f6",
      fullMark: 2,
    },
    {
      factor: "Recency",
      raw: recencyRaw,
      weighted: +(recencyRaw * 0.1).toFixed(2),
      weight: "×0.1",
      color: "#10b981",
      fullMark: 1,
    },
  ];

  const radarData = contributions.map((c) => ({
    factor: c.factor,
    value: c.raw,
    fullMark: 10,
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof contributions[0] }> }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white border rounded-lg shadow-lg p-3 text-xs">
        <p className="font-semibold text-gray-800 mb-1">{d.factor} {d.weight}</p>
        <p className="text-gray-500">Raw score: <span className="font-medium text-gray-800">{d.raw.toFixed(1)} / 10</span></p>
        <p className="text-gray-500">Contribution: <span className="font-medium text-blue-600">{d.weighted}</span></p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Bar chart — weighted contributions */}
      <div>
        <p className="text-xs text-gray-500 mb-3 font-medium">Weighted Contribution to Score ({priorityScore.toFixed(2)} / 10)</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={contributions} layout="vertical" margin={{ left: 8, right: 40, top: 0, bottom: 0 }}>
            <XAxis type="number" domain={[0, 4]} tick={{ fontSize: 11 }} tickCount={5} />
            <YAxis type="category" dataKey="factor" tick={{ fontSize: 12 }} width={70} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="weighted" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {contributions.map((c) => (
                <Cell key={c.factor} fill={c.color} />
              ))}
              <LabelList dataKey="weighted" position="right" style={{ fontSize: 11, fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Radar chart — raw factor scores */}
      <div>
        <p className="text-xs text-gray-500 mb-3 font-medium">Raw Factor Scores (0–10)</p>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="factor" tick={{ fontSize: 11, fill: "#6b7280" }} />
            <Radar
              name="Score"
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.25}
              strokeWidth={2}
            />
            <Tooltip
              formatter={(val: number) => [val.toFixed(1), "Raw Score"]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {contributions.map((c) => (
          <div key={c.factor} className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
            <span className="font-medium">{c.factor}</span>
            <span className="text-gray-400">{c.weight}</span>
            <span className="ml-auto font-semibold" style={{ color: c.color }}>{c.weighted}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
