"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ImageUpload } from "@/components/forms/ImageUpload";
import { LocationPicker } from "@/components/forms/LocationPicker";
import { useToast } from "@/components/ui/use-toast";
import {
  Bot,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Send,
  Info,
} from "lucide-react";
import { CATEGORY_LABELS, SEVERITY_COLORS, URGENCY_COLORS, AIAnalysisResponse } from "@/types";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
});

type FormData = z.infer<typeof formSchema>;

export function ReportForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<string[]>([]);
  const [imageBase64, setImageBase64] = useState<string>("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState<string>("");
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const title = watch("title");
  const description = watch("description");

  const handleLocationChange = (lat: number, lng: number, addr: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(addr);
  };

  const handleImagesChange = (urls: string[], base64: string) => {
    setImages(urls);
    setImageBase64(base64);
  };

  const canAnalyze = title?.length >= 5 && description?.length >= 10;

  const handleAnalyze = () => {
    if (!canAnalyze) return;
    setAiAnalysis({
      category: "OTHER",
      severity: "MEDIUM",
      urgency: "MEDIUM",
      priorityScore: 5.0,
      confidence: 0.75,
      analysisText: "Your issue will be analyzed by Gemini AI upon submission.",
      tags: ["pending-analysis"],
      isDuplicate: false,
      duplicateOfId: null,
    });
    setStep(2);
  };

  const onSubmit = async (data: FormData) => {
    if (!latitude || !longitude) {
      toast({
        title: "Location required",
        description: "Please detect or enter your location before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          latitude,
          longitude,
          address,
          imageBase64,
          imageUrls: images,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to submit issue");
      }

      const result = await response.json();
      setAiAnalysis(result.aiAnalysis);
      setStep(3);

      toast({
        title: "Issue submitted successfully!",
        description: `Your report has been filed with priority score ${result.issue.priorityScore.toFixed(1)}.`,
      });

      // Redirect after a moment
      setTimeout(() => {
        router.push("/issues");
      }, 3000);
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 3 && aiAnalysis) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Issue Reported!</h2>
          <p className="text-gray-600 mb-6">
            Your complaint has been submitted and analyzed by our AI system.
          </p>

          {/* AI Analysis Results */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">AI Analysis Results</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-gray-500">Category</p>
                <p className="text-sm font-medium">{CATEGORY_LABELS[aiAnalysis.category]}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Priority Score (MCIA)</p>
                <p className="text-2xl font-bold text-blue-600">{aiAnalysis.priorityScore.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Severity</p>
                <Badge className={cn("text-xs", SEVERITY_COLORS[aiAnalysis.severity])}>
                  {aiAnalysis.severity}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500">Urgency</p>
                <Badge className={cn("text-xs", URGENCY_COLORS[aiAnalysis.urgency])}>
                  {aiAnalysis.urgency}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-gray-700">{aiAnalysis.analysisText}</p>
            {aiAnalysis.isDuplicate && (
              <div className="mt-3 flex items-center gap-2 text-sm text-orange-700 bg-orange-50 p-2 rounded">
                <AlertTriangle className="h-4 w-4" />
                <span>Similar issue found nearby. Your report has been merged.</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push("/issues")}>
              View All Issues
            </Button>
            <Button variant="outline" onClick={() => router.push("/report")}>
              Report Another
            </Button>
          </div>

          <p className="text-xs text-gray-400 mt-4">Redirecting to issues page...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Step {step} of 2</span>
          <span>{step === 1 ? "Issue Details" : "Review & Submit"}</span>
        </div>
        <Progress value={step === 1 ? 50 : 100} className="h-2" />
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              Report a Civic Issue
            </CardTitle>
            <CardDescription>
              Describe the urban issue. Gemini AI will automatically classify and prioritize it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Issue Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Large pothole on MG Road near bus stop"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the issue in detail — size, impact on traffic/residents, how long it's been there..."
                rows={4}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
              <p className="text-xs text-gray-400">
                {description?.length || 0}/2000 characters
              </p>
            </div>

            {/* Images */}
            <ImageUpload
              images={images}
              imageBase64={imageBase64}
              onImagesChange={handleImagesChange}
            />

            {/* Location */}
            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              address={address}
              onLocationChange={handleLocationChange}
            />

            {/* Info box */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                Gemini AI will analyze your report, classify the issue, assess severity, detect
                duplicates, and calculate a priority score using the MCIA algorithm.
              </p>
            </div>

            <Button
              type="button"
              className="w-full"
              onClick={handleAnalyze}
              disabled={!canAnalyze}
            >
              <>
                Continue to Review
                <Bot className="h-4 w-4 ml-2" />
              </>
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Review & Submit</CardTitle>
              <CardDescription>
                Confirm your details before AI analysis and submission.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-600">{description}</p>
                {images.length > 0 && (
                  <p className="text-sm text-gray-500">{images.length} image(s) attached</p>
                )}
                {latitude && longitude && (
                  <p className="text-sm text-gray-500">
                    📍 {address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
                  </p>
                )}
              </div>

              {/* AI Notice */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <Bot className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Gemini AI Analysis</p>
                  <p className="text-blue-600 text-xs mt-1">
                    Upon submission, AI will classify your issue, detect severity & urgency,
                    check for duplicates within 500m, and calculate the MCIA priority score.
                  </p>
                </div>
              </div>

              {!latitude && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  Location is required. Please go back and add your location.
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitting || !latitude}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing & Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
