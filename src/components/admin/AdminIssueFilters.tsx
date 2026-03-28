"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_LABELS } from "@/types";
import { SlidersHorizontal } from "lucide-react";

interface AdminIssueFiltersProps {
  currentParams: {
    status?: string;
    category?: string;
    severity?: string;
    sortBy?: string;
  };
}

export function AdminIssueFilters({ currentParams }: AdminIssueFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams();
    if (currentParams.status && currentParams.status !== "all") params.set("status", currentParams.status);
    if (currentParams.category && currentParams.category !== "all") params.set("category", currentParams.category);
    if (currentParams.severity && currentParams.severity !== "all") params.set("severity", currentParams.severity);
    if (currentParams.sortBy) params.set("sortBy", currentParams.sortBy);

    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filters & Sorting</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Select
          value={currentParams.status || "all"}
          onValueChange={(v) => updateFilter("status", v)}
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
          value={currentParams.category || "all"}
          onValueChange={(v) => updateFilter("category", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentParams.severity || "all"}
          onValueChange={(v) => updateFilter("severity", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={currentParams.sortBy || "createdAt"}
          onValueChange={(v) => updateFilter("sortBy", v)}
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
      </div>
    </div>
  );
}
