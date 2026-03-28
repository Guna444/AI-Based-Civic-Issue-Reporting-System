import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CATEGORY_LABELS, SEVERITY_COLORS, URGENCY_COLORS, STATUS_COLORS } from "@/types";
import { cn, formatDateTime, getPriorityColor, getPriorityLabel } from "@/lib/utils";
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
import { AdminStatusUpdate } from "@/components/admin/AdminStatusUpdate";

async function getIssue(id: string) {
  return prisma.issue.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, imageUrl: true, email: true } },
      aiAnalysis: true,
      duplicateOf: { select: { id: true, title: true, status: true } },
      duplicates: { select: { id: true, title: true, status: true, createdAt: true } },
      _count: { select: { upvotes: true } },
    },
  });
}

export default async function AdminIssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const issue = await getIssue(id);
  if (!issue) notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/issues">
          <Button variant="ghost" size="sm" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Issues
          </Button>
        </Link>
        <div className="text-gray-400">/</div>
        <span className="text-sm text-gray-600">Issue #{id.slice(-8)}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
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
                {issue.status === "DUPLICATE" && (
                  <Badge className="bg-purple-100 text-purple-800 text-xs">
                    Duplicate
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl">{issue.title}</CardTitle>
              <p className="text-sm text-gray-500">{CATEGORY_LABELS[issue.category]}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
                <p className="text-gray-600 leading-relaxed">{issue.description}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-500">Reported by</p>
                    <p className="font-medium">{issue.user.name || "N/A"}</p>
                    <p className="text-xs text-gray-400">{issue.user.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-500">Submitted</p>
                    <p className="font-medium">{formatDateTime(issue.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ThumbsUp className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-500">Community Support</p>
                    <p className="font-medium">{issue.upvoteCount} upvotes</p>
                  </div>
                </div>
                {issue.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-500">Location</p>
                      <p className="font-medium text-xs">{issue.address}</p>
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

              {/* Duplicate */}
              {issue.status === "DUPLICATE" && issue.duplicateOf && (
                <>
                  <Separator />
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-purple-600" />
                      <h3 className="text-sm font-semibold text-purple-800">Duplicate of</h3>
                    </div>
                    <Link href={`/admin/issues/${issue.duplicateOf.id}`}>
                      <p className="text-sm text-purple-700 hover:underline">{issue.duplicateOf.title}</p>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* AI Analysis */}
          {issue.aiAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot className="h-5 w-5 text-blue-600" />
                  Gemini AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">AI Category</p>
                    <p className="text-sm font-semibold">
                      {CATEGORY_LABELS[issue.aiAnalysis.category as keyof typeof CATEGORY_LABELS] || issue.aiAnalysis.category}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Confidence</p>
                    <p className="text-sm font-bold text-blue-600">
                      {Math.round(issue.aiAnalysis.confidence * 100)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Priority Score</p>
                    <p className={cn("text-lg font-bold", getPriorityColor(issue.aiAnalysis.priorityScore))}>
                      {issue.aiAnalysis.priorityScore.toFixed(1)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Duplicate?</p>
                    <p className={cn("text-sm font-semibold", issue.aiAnalysis.isDuplicate ? "text-purple-600" : "text-green-600")}>
                      {issue.aiAnalysis.isDuplicate ? "Yes" : "No"}
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
                        <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
                  MCIA Formula: Priority = Severity × 0.4 + Urgency × 0.3 + Community × 0.2 + Recency × 0.1
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Status Management */}
        <div className="space-y-4">
          {/* Priority Score Widget */}
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-xs text-gray-500 mb-1">MCIA Priority Score</p>
              <p className={cn("text-5xl font-bold", getPriorityColor(issue.priorityScore))}>
                {issue.priorityScore.toFixed(1)}
              </p>
              <p className="text-sm text-gray-500 mt-1">{getPriorityLabel(issue.priorityScore)}</p>
              <div className="mt-3 bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${(issue.priorityScore / 10) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Status Update */}
          <AdminStatusUpdate issue={issue} />

          {/* Related issues */}
          {issue.duplicates.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Duplicate Reports ({issue.duplicates.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {issue.duplicates.map((dup) => (
                    <Link key={dup.id} href={`/admin/issues/${dup.id}`}>
                      <div className="p-2 hover:bg-gray-50 rounded border text-sm">
                        <p className="font-medium text-gray-700 truncate">{dup.title}</p>
                        <Badge className={cn("text-xs mt-1", STATUS_COLORS[dup.status as keyof typeof STATUS_COLORS])}>
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
      </div>
    </div>
  );
}
