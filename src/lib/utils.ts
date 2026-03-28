import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Severity, Urgency } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDate(date);
}

// Haversine formula to calculate distance between two GPS coordinates in meters
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// MCIA - Multimodal Civic Intelligence Algorithm priority score calculation
export function calculatePriorityScore(params: {
  severity: Severity;
  urgency: Urgency;
  upvoteCount: number;
  createdAt: Date | string;
}): number {
  const severityScores: Record<Severity, number> = {
    LOW: 2.5,
    MEDIUM: 5,
    HIGH: 7.5,
    CRITICAL: 10,
  };

  const urgencyScores: Record<Urgency, number> = {
    LOW: 2.5,
    MEDIUM: 5,
    HIGH: 7.5,
    IMMEDIATE: 10,
  };

  const severityScore = severityScores[params.severity];
  const urgencyScore = urgencyScores[params.urgency];

  // Community score: capped at 10, grows with upvotes
  const communityScore = Math.min(params.upvoteCount * 0.5, 10);

  // Recency score: decays exponentially over 30 days
  const ageInDays =
    (Date.now() - new Date(params.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = 10 * Math.exp(-ageInDays / 30);

  // Weighted MCIA score
  const priorityScore =
    severityScore * 0.4 +
    urgencyScore * 0.3 +
    communityScore * 0.2 +
    recencyScore * 0.1;

  return Math.round(priorityScore * 100) / 100;
}

export function getPriorityLabel(score: number): string {
  if (score >= 8) return "Critical Priority";
  if (score >= 6) return "High Priority";
  if (score >= 4) return "Medium Priority";
  return "Low Priority";
}

export function getPriorityColor(score: number): string {
  if (score >= 8) return "text-red-600";
  if (score >= 6) return "text-orange-600";
  if (score >= 4) return "text-yellow-600";
  return "text-green-600";
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + "...";
}
