"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Issue, CATEGORY_LABELS, SEVERITY_COLORS, STATUS_COLORS } from "@/types";
import { timeAgo, getPriorityLabel, getPriorityColor, cn } from "@/lib/utils";
import {
  MapPin,
  ThumbsUp,
  ChevronRight,
  Bot,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface IssueCardProps {
  issue: Issue;
  showActions?: boolean;
  isAdmin?: boolean;
}

export function IssueCard({ issue, showActions = true, isAdmin = false }: IssueCardProps) {
  const [upvoteCount, setUpvoteCount] = useState(issue.upvoteCount);
  const [hasUpvoted, setHasUpvoted] = useState(issue.hasUpvoted || false);
  const [upvoting, setUpvoting] = useState(false);
  const { toast } = useToast();

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (upvoting) return;
    setUpvoting(true);

    try {
      const res = await fetch(`/api/issues/${issue.id}/upvote`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to upvote");

      const data = await res.json();
      setUpvoteCount(data.upvoteCount);
      setHasUpvoted(data.hasUpvoted);

      toast({
        title: data.hasUpvoted ? "Upvoted!" : "Upvote removed",
        description: data.hasUpvoted
          ? "Your support has been registered."
          : "Your upvote has been removed.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to register upvote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpvoting(false);
    }
  };

  const categoryIcon: Record<string, string> = {
    POTHOLE: "🕳️",
    GARBAGE: "🗑️",
    WATER_LEAKAGE: "💧",
    DAMAGED_INFRASTRUCTURE: "🏗️",
    STREET_LIGHT: "💡",
    SEWAGE: "🚰",
    ENCROACHMENT: "⛔",
    NOISE_POLLUTION: "🔊",
    AIR_POLLUTION: "💨",
    OTHER: "📋",
  };

  const detailPath = isAdmin ? `/admin/issues/${issue.id}` : `/issues/${issue.id}`;

  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      <Link href={detailPath}>
        <CardContent className="p-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">{categoryIcon[issue.category]}</span>
              <Badge className={cn("text-xs", SEVERITY_COLORS[issue.severity])}>
                {issue.severity}
              </Badge>
              <Badge className={cn("text-xs", STATUS_COLORS[issue.status])}>
                {issue.status.replace("_", " ")}
              </Badge>
            </div>
            <div className={cn("text-sm font-bold whitespace-nowrap", getPriorityColor(issue.priorityScore))}>
              {issue.priorityScore.toFixed(1)}
              <span className="text-xs font-normal text-gray-400 ml-1">priority</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{issue.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{issue.description}</p>

          {/* Image preview */}
          {issue.imageUrls && issue.imageUrls.length > 0 && (
            <div className="relative h-32 rounded-md overflow-hidden mb-3 bg-gray-100">
              <Image
                src={issue.imageUrls[0]}
                alt={issue.title}
                fill
                className="object-cover"
                unoptimized
              />
              {issue.imageUrls.length > 1 && (
                <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                  +{issue.imageUrls.length - 1}
                </div>
              )}
            </div>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="font-medium text-gray-700">
                {CATEGORY_LABELS[issue.category]}
              </span>
            </span>
            {issue.address && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1 max-w-[150px]">{issue.address}</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo(issue.createdAt)}
            </span>
          </div>

          {/* AI Analysis tags */}
          {issue.aiAnalysis?.tags && issue.aiAnalysis.tags.length > 0 && (
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              <Bot className="h-3 w-3 text-blue-500" />
              {issue.aiAnalysis.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Duplicate warning */}
          {issue.status === "DUPLICATE" && (
            <div className="flex items-center gap-1 mt-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
              <AlertTriangle className="h-3 w-3" />
              Duplicate report - merged with existing issue
            </div>
          )}
        </CardContent>
      </Link>

      {showActions && (
        <CardFooter className="px-4 pb-4 pt-0 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUpvote}
            disabled={upvoting}
            className={cn(
              "gap-1 h-8",
              hasUpvoted ? "text-blue-600 bg-blue-50" : "text-gray-500"
            )}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{upvoteCount}</span>
            {!hasUpvoted && <span className="text-xs">Upvote</span>}
          </Button>

          <Link href={detailPath}>
            <Button variant="ghost" size="sm" className="gap-1 h-8 text-blue-600">
              View Details
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
