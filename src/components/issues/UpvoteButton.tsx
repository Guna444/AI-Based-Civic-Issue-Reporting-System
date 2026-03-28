"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface UpvoteButtonProps {
  issueId: string;
  initialCount: number;
  initialHasUpvoted: boolean;
}

export function UpvoteButton({ issueId, initialCount, initialHasUpvoted }: UpvoteButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [hasUpvoted, setHasUpvoted] = useState(initialHasUpvoted);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpvote = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/issues/${issueId}/upvote`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to upvote");

      const data = await res.json();
      setCount(data.upvoteCount);
      setHasUpvoted(data.hasUpvoted);

      toast({
        title: data.hasUpvoted ? "Upvoted!" : "Upvote removed",
        description: data.hasUpvoted
          ? "Your support has been registered for this issue."
          : "Your upvote has been removed.",
      });
    } catch {
      toast({ title: "Error", description: "Failed to upvote. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleUpvote}
      disabled={loading}
      variant={hasUpvoted ? "default" : "outline"}
      className={cn("gap-2", hasUpvoted ? "bg-blue-600 hover:bg-blue-700" : "")}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
      {hasUpvoted ? "Upvoted" : "Upvote"} ({count})
    </Button>
  );
}
