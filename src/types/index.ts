export type Role = "CITIZEN" | "ADMIN";

export type Category =
  | "POTHOLE"
  | "GARBAGE"
  | "WATER_LEAKAGE"
  | "DAMAGED_INFRASTRUCTURE"
  | "STREET_LIGHT"
  | "SEWAGE"
  | "ENCROACHMENT"
  | "NOISE_POLLUTION"
  | "AIR_POLLUTION"
  | "OTHER";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Urgency = "LOW" | "MEDIUM" | "HIGH" | "IMMEDIATE";
export type Status =
  | "PENDING"
  | "UNDER_REVIEW"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REJECTED"
  | "DUPLICATE";

export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  role: Role;
  createdAt: Date;
}

export interface IssueUser {
  id: string;
  name: string | null;
  email: string;
  imageUrl: string | null;
  clerkId?: string;
  role?: Role;
  createdAt?: Date;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: Category;
  severity: Severity;
  urgency: Urgency;
  status: Status;
  priorityScore: number;
  latitude: number;
  longitude: number;
  address: string | null;
  imageUrls: string[];
  upvoteCount: number;
  assignedTo: string | null;
  adminNotes: string | null;
  resolvedAt: Date | null;
  userId: string;
  user: IssueUser;
  aiAnalysis?: AIAnalysis | null;
  createdAt: Date;
  updatedAt: Date;
  hasUpvoted?: boolean;
  duplicateOfId?: string | null;
}

export interface AIAnalysis {
  id: string;
  issueId: string;
  category: string;
  severity: string;
  urgency: string;
  priorityScore: number;
  confidence: number;
  analysisText: string;
  tags: string[];
  isDuplicate: boolean;
  duplicateOfId: string | null;
  createdAt: Date;
}

export interface AIAnalysisRequest {
  title: string;
  description: string;
  category?: string;
  latitude: number;
  longitude: number;
  imageBase64?: string;
  existingIssues?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    category: string;
    status: string;
  }>;
}

export interface AIAnalysisResponse {
  category: Category;
  severity: Severity;
  urgency: Urgency;
  priorityScore: number;
  confidence: number;
  analysisText: string;
  tags: string[];
  isDuplicate: boolean;
  duplicateOfId: string | null;
}

export interface DashboardStats {
  totalIssues: number;
  pendingIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  criticalIssues: number;
  categoryBreakdown: Record<string, number>;
  recentIssues: Issue[];
}

export const CATEGORY_LABELS: Record<Category, string> = {
  POTHOLE: "Pothole",
  GARBAGE: "Garbage / Waste",
  WATER_LEAKAGE: "Water Leakage",
  DAMAGED_INFRASTRUCTURE: "Damaged Infrastructure",
  STREET_LIGHT: "Street Light",
  SEWAGE: "Sewage Problem",
  ENCROACHMENT: "Encroachment",
  NOISE_POLLUTION: "Noise Pollution",
  AIR_POLLUTION: "Air Pollution",
  OTHER: "Other",
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

export const URGENCY_COLORS: Record<Urgency, string> = {
  LOW: "bg-blue-100 text-blue-800",
  MEDIUM: "bg-purple-100 text-purple-800",
  HIGH: "bg-orange-100 text-orange-800",
  IMMEDIATE: "bg-red-100 text-red-800",
};

export const STATUS_COLORS: Record<Status, string> = {
  PENDING: "bg-gray-100 text-gray-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  RESOLVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  DUPLICATE: "bg-purple-100 text-purple-800",
};
