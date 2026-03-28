"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"];

const STATUS_COLORS_MAP: Record<string, string> = {
  "PENDING": "#94a3b8",
  "UNDER REVIEW": "#3b82f6",
  "IN PROGRESS": "#f59e0b",
  "RESOLVED": "#10b981",
  "REJECTED": "#ef4444",
  "DUPLICATE": "#8b5cf6",
};

const SEVERITY_COLORS_MAP: Record<string, string> = {
  LOW: "#10b981",
  MEDIUM: "#f59e0b",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

interface AnalyticsChartsProps {
  data: {
    categoryStats: Array<{ name: string; value: number }>;
    statusStats: Array<{ name: string; value: number }>;
    severityStats: Array<{ name: string; value: number }>;
    monthlyStats: Array<{ month: string; total: number; resolved: number }>;
  };
}

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  return (
    <div className="space-y-6">
      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Issue Trends (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.monthlyStats.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-500">
              No data available yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Total Issues"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Resolved"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Issues by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {data.categoryStats.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-500">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.categoryStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" name="Issues" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {data.statusStats.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-500">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.statusStats}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {data.statusStats.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS_MAP[entry.name] || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Severity Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Issues by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            {data.severityStats.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-500">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.severityStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Issues" radius={[4, 4, 0, 0]}>
                    {data.severityStats.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={SEVERITY_COLORS_MAP[entry.name] || COLORS[index]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.statusStats.map((s) => {
              const total = data.statusStats.reduce((acc, s) => acc + s.value, 0);
              const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
              return (
                <div key={s.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{s.name}</span>
                    <span className="font-medium">{s.value} ({pct}%)</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: STATUS_COLORS_MAP[s.name] || "#3b82f6",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
