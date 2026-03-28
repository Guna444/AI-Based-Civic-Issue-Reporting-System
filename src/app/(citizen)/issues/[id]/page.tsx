import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CATEGORY_LABELS,
  SEVERITY_COLORS,
  URGENCY_COLORS,
  STATUS_COLORS,
} from "@/types";
import {
  MapPin,
  Clock,
  Bot,
  User,
  ChevronLeft,
  ThumbsUp,
  AlertTriangle,
  Tag,
} from "lucide-react";
import { formatDateTime, getPriorityColor, getPriorityLabel, cn } from "@/lib/utils";
import { UpvoteButton } from "@/components/issues/UpvoteButton";
import { MCIAChart } from "@/components/issues/MCIAChart";

async function getIssue(id: string, userId: string) {
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, imageUrl: true, email: true } },
      aiAnalysis: true,
      duplicateOf: { select: { id: true, title: true, status: true } },
      duplicates: { select: { id: true, title: true, status: true, createdAt: true } },
      upvotes: { where: { userId }, select: { id: true } },
      _count: { select: { upvotes: true } },
    },
  });
  return issue;
}

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) redirect("/sign-in");

  const { id } = await params;
  const issue = await getIssue(id, user.id);
  if (!issue) notFound();

  const hasUpvoted = issue.upvotes.length > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <Link href="/issues">
        <Button variant="ghost" size="sm" className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back to Issues
        </Button>
      </Link>

      {/* Main issue card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge className={cn("text-xs", SEVERITY_COLORS[issue.severity])}>
                  {issue.severity} Severity
                </Badge>
                <Badge className={cn("text-xs", URGENCY_COLORS[issue.urgency])}>
                  {issue.urgency} Urgency
                </Badge>
                <Badge className={cn("text-xs", STATUS_COLORS[issue.status])}>
                  {issue.status.replace("_", " ")}
                </Badge>
              </div>
              <CardTitle className="text-xl">{issue.title}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {CATEGORY_LABELS[issue.category]}
              </p>
            </div>
            <div className="text-right">
              <div className={cn("text-2xl font-bold", getPriorityColor(issue.priorityScore))}>
                {issue.priorityScore.toFixed(1)}
              </div>
              <p className="text-xs text-gray-400">{getPriorityLabel(issue.priorityScore)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
            <p className="text-gray-600 leading-relaxed">{issue.description}</p>
          </div>

          <Separator />

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-gray-500">Reported by</p>
                <p className="font-medium">{issue.user.name || issue.user.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-gray-500">Submitted</p>
                <p className="font-medium">{formatDateTime(issue.createdAt)}</p>
              </div>
            </div>
            {issue.address && (
              <div className="flex items-start gap-2 col-span-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500">Location</p>
                  <p className="font-medium">{issue.address}</p>
                  <p className="text-xs text-gray-400">
                    {issue.latitude.toFixed(6)}, {issue.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Images */}
          {issue.imageUrls.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Attached Images ({issue.imageUrls.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {issue.imageUrls.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <Image src={url} alt={`Issue image ${i + 1}`} fill className="object-cover" unoptimized />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Admin Notes */}
          {issue.adminNotes && (
            <>
              <Separator />
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-1">Admin Notes</h3>
                <p className="text-sm text-blue-700">{issue.adminNotes}</p>
              </div>
            </>
          )}

          {/* Resolution */}
          {issue.resolvedAt && (
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm font-medium text-green-800">
                Resolved on {formatDateTime(issue.resolvedAt)}
              </p>
            </div>
          )}

          {/* Duplicate notice */}
          {issue.status === "DUPLICATE" && issue.duplicateOf && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-purple-800">Duplicate Issue</h3>
              </div>
              <p className="text-sm text-purple-700">
                This report is a duplicate of an existing issue.
              </p>
              <Link href={`/issues/${issue.duplicateOf.id}`}>
                <Button variant="link" size="sm" className="text-purple-600 p-0 h-auto mt-1">
                  View Original: {issue.duplicateOf.title}
                </Button>
              </Link>
            </div>
          )}

          <Separator />

          {/* Upvote */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {issue.upvoteCount} citizen{issue.upvoteCount !== 1 ? "s" : ""} support{issue.upvoteCount === 1 ? "s" : ""} this issue
              </span>
            </div>
            <UpvoteButton
              issueId={issue.id}
              initialCount={issue.upvoteCount}
              initialHasUpvoted={hasUpvoted}
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Card */}
      {issue.aiAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-5 w-5 text-blue-600" />
              Gemini AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">AI Category</p>
                <p className="text-sm font-semibold">{CATEGORY_LABELS[issue.aiAnalysis.category as keyof typeof CATEGORY_LABELS] || issue.aiAnalysis.category}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Severity</p>
                <Badge className={cn("text-xs", SEVERITY_COLORS[issue.aiAnalysis.severity as keyof typeof SEVERITY_COLORS])}>
                  {issue.aiAnalysis.severity}
                </Badge>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Urgency</p>
                <Badge className={cn("text-xs", URGENCY_COLORS[issue.aiAnalysis.urgency as keyof typeof URGENCY_COLORS])}>
                  {issue.aiAnalysis.urgency}
                </Badge>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Confidence</p>
                <p className="text-sm font-semibold text-blue-600">
                  {Math.round(issue.aiAnalysis.confidence * 100)}%
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">AI Assessment</h3>
              <p className="text-sm text-gray-600">{issue.aiAnalysis.analysisText}</p>
            </div>

            {issue.aiAnalysis.tags.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <Tag className="h-3.5 w-3.5 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-700">AI Tags</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {issue.aiAnalysis.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-600 mb-4">
                MCIA Score Breakdown — {issue.priorityScore.toFixed(2)} / 10
              </p>
              <MCIAChart
                severity={issue.severity}
                urgency={issue.urgency}
                upvoteCount={issue.upvoteCount}
                createdAt={issue.createdAt}
                priorityScore={issue.priorityScore}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Issues (duplicates) */}
      {issue.duplicates && issue.duplicates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Related Reports ({issue.duplicates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {issue.duplicates.map((dup) => (
                <Link key={dup.id} href={`/issues/${dup.id}`}>
                  <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border">
                    <span className="text-sm font-medium text-gray-700">{dup.title}</span>
                    <Badge className={cn("text-xs", STATUS_COLORS[dup.status as keyof typeof STATUS_COLORS])}>
                      {dup.status.replace("_", " ")}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
