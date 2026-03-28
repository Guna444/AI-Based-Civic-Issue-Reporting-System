"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Settings, CheckCircle } from "lucide-react";
import { STATUS_COLORS } from "@/types";
import { cn } from "@/lib/utils";

interface AdminStatusUpdateProps {
  issue: {
    id: string;
    status: string;
    adminNotes: string | null;
    assignedTo: string | null;
  };
}

export function AdminStatusUpdate({ issue }: AdminStatusUpdateProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState(issue.status);
  const [adminNotes, setAdminNotes] = useState(issue.adminNotes || "");
  const [assignedTo, setAssignedTo] = useState(issue.assignedTo || "");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes, assignedTo }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }

      toast({
        title: "Issue updated",
        description: `Status changed to ${status.replace("_", " ")}.`,
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasChanges =
    status !== issue.status ||
    adminNotes !== (issue.adminNotes || "") ||
    assignedTo !== (issue.assignedTo || "");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="h-4 w-4 text-gray-600" />
          Status Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Current Status</p>
          <Badge className={cn("text-sm", STATUS_COLORS[issue.status as keyof typeof STATUS_COLORS])}>
            {issue.status.replace("_", " ")}
          </Badge>
        </div>

        {/* Update Status */}
        <div>
          <Label className="text-sm">Update Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="DUPLICATE">Duplicate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assigned To */}
        <div>
          <Label className="text-sm">Assigned To (optional)</Label>
          <Input
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            placeholder="Enter department or officer name"
            className="mt-1"
          />
        </div>

        {/* Admin Notes */}
        <div>
          <Label className="text-sm">Admin Notes</Label>
          <Textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add notes about actions taken, reasons for status change..."
            rows={3}
            className="mt-1 text-sm"
          />
        </div>

        {/* Quick Status Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setStatus("IN_PROGRESS")}
            className="text-xs"
          >
            Mark In Progress
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setStatus("RESOLVED")}
            className="text-xs text-green-600 border-green-300"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Resolve
          </Button>
        </div>

        <Button
          onClick={handleUpdate}
          disabled={loading || !hasChanges}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Issue"
          )}
        </Button>

        {!hasChanges && (
          <p className="text-xs text-gray-400 text-center">No changes to save</p>
        )}
      </CardContent>
    </Card>
  );
}
