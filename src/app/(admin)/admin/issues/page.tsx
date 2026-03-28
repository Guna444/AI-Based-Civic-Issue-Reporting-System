import { Suspense } from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CATEGORY_LABELS, SEVERITY_COLORS, URGENCY_COLORS, STATUS_COLORS } from "@/types";
import { cn, formatDateTime, getPriorityColor } from "@/lib/utils";
import { ThumbsUp, ChevronRight, Filter } from "lucide-react";
import { AdminIssueFilters } from "@/components/admin/AdminIssueFilters";

interface SearchParams {
  status?: string;
  category?: string;
  severity?: string;
  sortBy?: string;
  page?: string;
}

async function getIssues(searchParams: SearchParams) {
  const page = parseInt(searchParams.page || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (searchParams.status && searchParams.status !== "all") where.status = searchParams.status;
  if (searchParams.category && searchParams.category !== "all") where.category = searchParams.category;
  if (searchParams.severity && searchParams.severity !== "all") where.severity = searchParams.severity;

  const orderBy: Record<string, string> =
    searchParams.sortBy === "priority"
      ? { priorityScore: "desc" }
      : searchParams.sortBy === "upvotes"
      ? { upvoteCount: "desc" }
      : { createdAt: "desc" };

  const [issues, total] = await Promise.all([
    prisma.issue.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { upvotes: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.issue.count({ where }),
  ]);

  return { issues, total, page, totalPages: Math.ceil(total / limit) };
}

export default async function AdminIssuesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { issues, total, page, totalPages } = await getIssues(params);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Issues</h1>
          <p className="text-gray-500 text-sm mt-1">
            {total} total issue{total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-16 bg-gray-100 rounded-lg animate-pulse" />}>
        <AdminIssueFilters currentParams={params} />
      </Suspense>

      {/* Issues Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Upvotes</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-gray-500">
                    No issues found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                issues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="font-medium text-gray-900 truncate">{issue.title}</p>
                        <p className="text-xs text-gray-400 truncate">{issue.description.substring(0, 60)}...</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {CATEGORY_LABELS[issue.category]}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", SEVERITY_COLORS[issue.severity])}>
                        {issue.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", URGENCY_COLORS[issue.urgency])}>
                        {issue.urgency}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", STATUS_COLORS[issue.status])}>
                        {issue.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={cn("font-bold text-base", getPriorityColor(issue.priorityScore))}>
                        {issue.priorityScore.toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {issue.upvoteCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {issue.user.name || issue.user.email}
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">
                      {formatDateTime(issue.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/issues/${issue.id}`}>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={`/admin/issues?${new URLSearchParams({ ...params, page: String(page - 1) })}`}>
              <Button variant="outline" size="sm">Previous</Button>
            </Link>
          )}
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/issues?${new URLSearchParams({ ...params, page: String(page + 1) })}`}>
              <Button variant="outline" size="sm">Next</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
