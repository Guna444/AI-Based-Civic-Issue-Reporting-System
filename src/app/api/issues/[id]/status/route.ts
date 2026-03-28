import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
    const { status, adminNotes, assignedTo } = await req.json();

    const validStatuses = ["PENDING", "UNDER_REVIEW", "IN_PROGRESS", "RESOLVED", "REJECTED", "DUPLICATE"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { status };
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (status === "RESOLVED") updateData.resolvedAt = new Date();

    const issue = await prisma.issue.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(issue);
  } catch (error) {
    console.error("PATCH /api/issues/[id]/status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
