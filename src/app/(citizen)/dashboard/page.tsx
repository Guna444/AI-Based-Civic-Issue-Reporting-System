import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { IssueCard } from "@/components/issues/IssueCard";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  ThumbsUp,
  List,
} from "lucide-react";
import { STATUS_COLORS } from "@/types";
import { cn } from "@/lib/utils";

async function getDashboardData(userId: string) {
  const [myIssues, stats, recentActivity] = await Promise.all([
    prisma.issue.findMany({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, imageUrl: true, email: true } },
        aiAnalysis: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.issue.groupBy({
      by: ["status"],
      where: { userId },
      _count: { id: true },
    }),
    prisma.issue.findMany({
      where: { userId, status: { in: ["IN_PROGRESS", "RESOLVED"] } },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { id: true, title: true, status: true, updatedAt: true },
    }),
  ]);

  const statusCounts = stats.reduce(
    (acc, s) => ({ ...acc, [s.status]: s._count.id }),
    {} as Record<string, number>
  );

  return { myIssues, statusCounts, recentActivity };
}

export default async function CitizenDashboard() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) redirect("/sign-in");

  const { myIssues, statusCounts, recentActivity } = await getDashboardData(user.id);

  const totalIssues = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const pendingIssues = (statusCounts["PENDING"] || 0) + (statusCounts["UNDER_REVIEW"] || 0);
  const inProgressIssues = statusCounts["IN_PROGRESS"] || 0;
  const resolvedIssues = statusCounts["RESOLVED"] || 0;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user.name?.split(" ")[0] || "Citizen"}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Track your complaints and contribute to a better city.
          </p>
        </div>
        <Link href="/report">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Report Issue
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Reports"
          value={totalIssues}
          icon={FileText}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatsCard
          title="Pending"
          value={pendingIssues}
          icon={Clock}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
        />
        <StatsCard
          title="In Progress"
          value={inProgressIssues}
          icon={AlertTriangle}
          iconColor="text-yellow-600"
          bgColor="bg-yellow-50"
        />
        <StatsCard
          title="Resolved"
          value={resolvedIssues}
          icon={CheckCircle}
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Recent Issues */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">My Recent Reports</h2>
            <Link href="/issues?myIssues=true">
              <Button variant="ghost" size="sm" className="gap-1">
                <List className="h-4 w-4" />
                View All
              </Button>
            </Link>
          </div>

          {myIssues.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-700 mb-2">No reports yet</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Help improve your city by reporting civic issues.
                </p>
                <Link href="/report">
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Report Your First Issue
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {myIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={{
                    ...issue,
                    hasUpvoted: false,
                  }}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Issue Status Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {totalIssues === 0 ? (
                <p className="text-sm text-gray-500 text-center py-2">No issues reported yet</p>
              ) : (
                Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <Badge className={cn("text-xs", STATUS_COLORS[status as keyof typeof STATUS_COLORS])}>
                      {status.replace("_", " ")}
                    </Badge>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Recent Updates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivity.map((issue) => (
                  <Link key={issue.id} href={`/issues/${issue.id}`}>
                    <div className="hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded cursor-pointer">
                      <p className="text-sm font-medium text-gray-700 line-clamp-1">
                        {issue.title}
                      </p>
                      <Badge
                        className={cn("text-xs mt-1", STATUS_COLORS[issue.status as keyof typeof STATUS_COLORS])}
                      >
                        {issue.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/report">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Report New Issue
                </Button>
              </Link>
              <Link href="/issues">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  Upvote Issues
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
