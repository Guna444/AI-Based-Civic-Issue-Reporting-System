"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IssueCard } from "@/components/issues/IssueCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Issue, CATEGORY_LABELS, Category, Status } from "@/types";
import { Plus, Search, SlidersHorizontal, RefreshCw } from "lucide-react";

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [status, setStatus] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [myIssues, setMyIssues] = useState(false);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        sortBy,
      });
      if (status !== "all") params.set("status", status);
      if (category !== "all") params.set("category", category);
      if (myIssues) params.set("myIssues", "true");

      const res = await fetch(`/api/issues?${params}`);
      const data = await res.json();
      setIssues(data.issues || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, [page, status, category, sortBy, myIssues]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleFilterChange = () => {
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Civic Issues</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} issue{total !== 1 ? "s" : ""} reported
          </p>
        </div>
        <Link href="/report">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Report Issue
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters & Sorting</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select
            value={status}
            onValueChange={(v) => { setStatus(v); handleFilterChange(); }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="DUPLICATE">Duplicate</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={category}
            onValueChange={(v) => { setCategory(v); handleFilterChange(); }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(v) => { setSortBy(v); handleFilterChange(); }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Newest First</SelectItem>
              <SelectItem value="priority">Priority Score</SelectItem>
              <SelectItem value="upvotes">Most Upvoted</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={myIssues ? "default" : "outline"}
            size="sm"
            onClick={() => { setMyIssues(!myIssues); handleFilterChange(); }}
            className="h-10"
          >
            {myIssues ? "My Issues ✓" : "My Issues"}
          </Button>
        </div>
      </div>

      {/* Issue Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3 p-4 border rounded-lg">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-700 mb-2">No issues found</h3>
          <p className="text-sm text-gray-500 mb-4">
            Try adjusting your filters or be the first to report an issue.
          </p>
          <Link href="/report">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Report an Issue
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = page <= 3 ? i + 1 : page - 2 + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? "default" : "outline"}
                      size="sm"
                      className="w-9"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
