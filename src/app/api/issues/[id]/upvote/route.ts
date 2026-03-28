import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculatePriorityScore } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: issueId } = await params;

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const issue = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Check if user already upvoted
    const existingUpvote = await prisma.upvote.findUnique({
      where: { issueId_userId: { issueId, userId: user.id } },
    });

    let hasUpvoted: boolean;
    let newUpvoteCount: number;

    if (existingUpvote) {
      // Remove upvote (toggle)
      await prisma.upvote.delete({
        where: { issueId_userId: { issueId, userId: user.id } },
      });
      newUpvoteCount = Math.max(0, issue.upvoteCount - 1);
      hasUpvoted = false;
    } else {
      // Add upvote
      await prisma.upvote.create({
        data: { issueId, userId: user.id },
      });
      newUpvoteCount = issue.upvoteCount + 1;
      hasUpvoted = true;
    }

    // Recalculate priority score with new upvote count
    const newPriorityScore = calculatePriorityScore({
      severity: issue.severity,
      urgency: issue.urgency,
      upvoteCount: newUpvoteCount,
      createdAt: issue.createdAt,
    });

    // Update issue upvote count and priority score
    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        upvoteCount: newUpvoteCount,
        priorityScore: newPriorityScore,
      },
    });

    return NextResponse.json({
      hasUpvoted,
      upvoteCount: updatedIssue.upvoteCount,
      priorityScore: updatedIssue.priorityScore,
    });
  } catch (error) {
    console.error("POST /api/issues/[id]/upvote error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
