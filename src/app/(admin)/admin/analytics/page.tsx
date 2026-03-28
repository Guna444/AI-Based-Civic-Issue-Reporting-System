import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_LABELS } from "@/types";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";

async function getAnalyticsData() {
  const [categoryStats, statusStats, severityStats, monthlyStats] = await Promise.all([
    prisma.issue.groupBy({
      by: ["category"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.issue.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.issue.groupBy({
      by: ["severity"],
      _count: { id: true },
    }),
    // Last 6 months
    prisma.$queryRaw<Array<{ month: string; count: bigint; resolved: bigint }>>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') as month,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved
      FROM "Issue"
      WHERE "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt") ASC
    `,
  ]);

  return {
    categoryStats: categoryStats.map((c) => ({
      name: CATEGORY_LABELS[c.category] || c.category,
      value: c._count.id,
    })),
    statusStats: statusStats.map((s) => ({
      name: s.status.replace("_", " "),
      value: s._count.id,
    })),
    severityStats: severityStats.map((s) => ({
      name: s.severity,
      value: s._count.id,
    })),
    monthlyStats: monthlyStats.map((m) => ({
      month: m.month,
      total: Number(m.count),
      resolved: Number(m.resolved),
    })),
  };
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">
          Urban issue reporting trends and performance metrics
        </p>
      </div>

      <AnalyticsCharts data={data} />
    </div>
  );
}
