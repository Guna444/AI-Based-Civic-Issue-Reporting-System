import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { clerkId } });

    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, imageUrl: true, email: true } },
        aiAnalysis: true,
        duplicateOf: {
          select: { id: true, title: true, status: true },
        },
        duplicates: {
          select: { id: true, title: true, status: true, createdAt: true },
        },
        upvotes: user ? { where: { userId: user.id }, select: { id: true } } : false,
        _count: { select: { upvotes: true, duplicates: true } },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...issue,
      hasUpvoted: user ? issue.upvotes.length > 0 : false,
      upvotes: undefined,
    });
  } catch (error) {
    console.error("GET /api/issues/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, adminNotes, assignedTo } = body;

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (status === "RESOLVED") updateData.resolvedAt = new Date();

    const issue = await prisma.issue.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, imageUrl: true } },
        aiAnalysis: true,
      },
    });

    return NextResponse.json(issue);
  } catch (error) {
    console.error("PATCH /api/issues/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { clerkId } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const issue = await prisma.issue.findUnique({ where: { id } });
    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Only allow deletion by the issue owner or admin
    if (issue.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.issue.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/issues/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
