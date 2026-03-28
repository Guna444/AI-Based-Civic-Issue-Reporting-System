import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { analyzeIssue } from "@/lib/gemini";
import { calculatePriorityScore } from "@/lib/utils";
import { z } from "zod";

const createIssueSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  imageBase64: z.string().optional(),
  imageUrls: z.array(z.string()).optional().default([]),
});

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const myIssues = searchParams.get("myIssues") === "true";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (myIssues) where.userId = user.id;

    const orderBy: Record<string, string> =
      sortBy === "priority"
        ? { priorityScore: "desc" }
        : sortBy === "upvotes"
        ? { upvoteCount: "desc" }
        : { createdAt: "desc" };

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, imageUrl: true, email: true } },
          aiAnalysis: true,
          upvotes: {
            where: { userId: user.id },
            select: { id: true },
          },
          _count: { select: { upvotes: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.issue.count({ where }),
    ]);

    const issuesWithUpvote = issues.map((issue) => ({
      ...issue,
      hasUpvoted: issue.upvotes.length > 0,
      upvotes: undefined,
    }));

    return NextResponse.json({
      issues: issuesWithUpvote,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/issues error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: "User not found. Please complete registration." }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = createIssueSchema.parse(body);

    // Fetch nearby existing issues for duplicate detection
    const existingIssues = await prisma.issue.findMany({
      where: {
        status: { notIn: ["RESOLVED", "REJECTED", "DUPLICATE"] },
        latitude: {
          gte: validatedData.latitude - 0.005,
          lte: validatedData.latitude + 0.005,
        },
        longitude: {
          gte: validatedData.longitude - 0.005,
          lte: validatedData.longitude + 0.005,
        },
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        category: true,
        status: true,
      },
    });

    // Run AI analysis with Gemini
    const aiAnalysis = await analyzeIssue({
      title: validatedData.title,
      description: validatedData.description,
      latitude: validatedData.latitude,
      longitude: validatedData.longitude,
      imageBase64: validatedData.imageBase64,
      existingIssues: existingIssues.map((i) => ({
        id: i.id,
        latitude: i.latitude,
        longitude: i.longitude,
        category: i.category,
        status: i.status,
      })),
    });

    // Calculate initial priority score
    const priorityScore = calculatePriorityScore({
      severity: aiAnalysis.severity,
      urgency: aiAnalysis.urgency,
      upvoteCount: 0,
      createdAt: new Date(),
    });

    // Create the issue
    const issue = await prisma.issue.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        category: aiAnalysis.category,
        severity: aiAnalysis.severity,
        urgency: aiAnalysis.urgency,
        status: aiAnalysis.isDuplicate ? "DUPLICATE" : "PENDING",
        priorityScore,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        address: validatedData.address,
        imageUrls: validatedData.imageUrls,
        userId: user.id,
        duplicateOfId: aiAnalysis.duplicateOfId,
        aiAnalysis: {
          create: {
            category: aiAnalysis.category,
            severity: aiAnalysis.severity,
            urgency: aiAnalysis.urgency,
            priorityScore,
            confidence: aiAnalysis.confidence,
            analysisText: aiAnalysis.analysisText,
            tags: aiAnalysis.tags,
            isDuplicate: aiAnalysis.isDuplicate,
            duplicateOfId: aiAnalysis.duplicateOfId,
          },
        },
      },
      include: {
        user: { select: { id: true, name: true, imageUrl: true, email: true } },
        aiAnalysis: true,
      },
    });

    return NextResponse.json({ issue, aiAnalysis }, { status: 201 });
  } catch (error) {
    console.error("POST /api/issues error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
