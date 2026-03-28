import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/dashboard/StatsCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { CATEGORY_LABELS, SEVERITY_COLORS, STATUS_COLORS } from "@/types";
import { cn, formatDateTime, getPriorityColor } from "@/lib/utils";

async function getAdminDashboardData() {
  const [
    totalIssues,
    pendingIssues,
    inProgressIssues,
    resolvedIssues,
    criticalIssues,
    totalUsers,
    priorityQueue,
    categoryStats,
    recentIssues,
  ] = await Promise.all([
    prisma.issue.count(),
    prisma.issue.count({ where: { status: { in: ["PENDING", "UNDER_REVIEW"] } } }),
    prisma.issue.count({ where: { status: "IN_PROGRESS" } }),
    prisma.issue.count({ where: { status: "RESOLVED" } }),
    prisma.issue.count({ where: { severity: "CRITICAL", status: { not: "RESOLVED" } } }),
    prisma.user.count({ where: { role: "CITIZEN" } }),
    prisma.issue.findMany({
      where: { status: { in: ["PENDING", "UNDER_REVIEW", "IN_PROGRESS"] } },
      orderBy: { priorityScore: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
    prisma.issue.groupBy({
      by: ["category"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    prisma.issue.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  return {
    totalIssues,
    pendingIssues,
    inProgressIssues,
    resolvedIssues,
    criticalIssues,
    totalUsers,
    priorityQueue,
    categoryStats,
    recentIssues,
  };
}

export default async function AdminDashboard() {
  const data = await getAdminDashboardData();

  const resolutionRate =
    data.totalIssues > 0 ? Math.round((data.resolvedIssues / data.totalIssues) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">AI-Powered Urban Governance Command Center</p>
        </div>
        <Link href="/admin/issues">
          <Button className="gap-2">
            <FileText className="h-4 w-4" />
            Manage Issues
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard title="Total Issues" value={data.totalIssues} icon={FileText} />
        <StatsCard
          title="Pending"
          value={data.pendingIssues}
          icon={Clock}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
        />
        <StatsCard
          title="In Progress"
          value={data.inProgressIssues}
          icon={TrendingUp}
          iconColor="text-yellow-600"
          bgColor="bg-yellow-50"
        />
        <StatsCard
          title="Resolved"
          value={data.resolvedIssues}
          icon={CheckCircle}
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
        <StatsCard
          title="Critical"
          value={data.criticalIssues}
          icon={AlertTriangle}
          iconColor="text-red-600"
          bgColor="bg-red-50"
        />
        <StatsCard
          title="Citizens"
          value={data.totalUsers}
          icon={Users}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      {/* Resolution Rate */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Resolution Rate</p>
              <p className="text-3xl font-bold text-green-600">{resolutionRate}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Issues Resolved</p>
              <p className="text-xl font-semibold">{data.resolvedIssues} / {data.totalIssues}</p>
            </div>
            <div className="w-48">
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${resolutionRate}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Queue */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-red-500" />
                  Priority Queue (Top 5)
                </CardTitle>
                <Link href="/admin/issues?sortBy=priority">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data.priorityQueue.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No pending issues</p>
              ) : (
                <div className="space-y-2">
                  {data.priorityQueue.map((issue, index) => (
                    <Link key={issue.id} href={`/admin/issues/${issue.id}`}>
                      <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border transition-colors">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{issue.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge className={cn("text-xs", SEVERITY_COLORS[issue.severity])}>
                              {issue.severity}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              by {issue.user.name || "Anonymous"}
                            </span>
                          </div>
                        </div>
                        <div className={cn("text-lg font-bold shrink-0", getPriorityColor(issue.priorityScore))}>
                          {issue.priorityScore.toFixed(1)}
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Top Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {data.categoryStats.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No data available</p>
              ) : (
                <div className="space-y-3">
                  {data.categoryStats.map((cat) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {CATEGORY_LABELS[cat.category] || cat.category}
                        </span>
                        <span className="font-semibold">{cat._count.id}</span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{
                            width: `${(cat._count.id / data.totalIssues) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Issues Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Issues</CardTitle>
            <Link href="/admin/issues">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Reported By</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentIssues.map((issue) => (
                <TableRow key={issue.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/admin/issues/${issue.id}`}>
                      <span className="font-medium text-blue-600 hover:underline">
                        {issue.title.length > 40 ? issue.title.substring(0, 40) + "..." : issue.title}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{CATEGORY_LABELS[issue.category]}</TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", SEVERITY_COLORS[issue.severity])}>
                      {issue.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", STATUS_COLORS[issue.status])}>
                      {issue.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={cn("font-bold", getPriorityColor(issue.priorityScore))}>
                      {issue.priorityScore.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {issue.user.name || issue.user.email}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDateTime(issue.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
