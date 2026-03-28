import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIAnalysisRequest, AIAnalysisResponse, Category, Severity, Urgency } from "@/types";
import { calculateDistance, calculatePriorityScore } from "./utils";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export async function analyzeIssue(
  request: AIAnalysisRequest
): Promise<AIAnalysisResponse> {
  try {
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    // Add image if provided
    if (request.imageBase64) {
      const base64Data = request.imageBase64.split(",")[1] || request.imageBase64;
      const mimeType = request.imageBase64.startsWith("data:image/png") ? "image/png" : "image/jpeg";
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    const prompt = `You are an AI assistant for an Urban Governance System. Analyze this civic issue report and provide a structured assessment.

Issue Title: ${request.title}
Description: ${request.description}
${request.category ? `Reported Category: ${request.category}` : ""}
Location: Latitude ${request.latitude}, Longitude ${request.longitude}

${request.imageBase64 ? "An image has been provided with this report." : "No image was provided."}

Please analyze and respond with ONLY a valid JSON object in exactly this format (no markdown, no code blocks):
{
  "category": "one of: POTHOLE, GARBAGE, WATER_LEAKAGE, DAMAGED_INFRASTRUCTURE, STREET_LIGHT, SEWAGE, ENCROACHMENT, NOISE_POLLUTION, AIR_POLLUTION, OTHER",
  "severity": "one of: LOW, MEDIUM, HIGH, CRITICAL",
  "urgency": "one of: LOW, MEDIUM, HIGH, IMMEDIATE",
  "confidence": 0.85,
  "analysisText": "Brief professional assessment of the issue (2-3 sentences)",
  "tags": ["tag1", "tag2", "tag3"]
}

Guidelines:
- CRITICAL severity: Immediate danger to public safety (open manholes, severe flooding, collapsed infrastructure)
- HIGH severity: Significant hazard affecting daily life (deep potholes, major water leakage)
- MEDIUM severity: Moderate inconvenience (garbage accumulation, minor damage)
- LOW severity: Minor issues (faded markings, small potholes)
- IMMEDIATE urgency: Life-threatening or major infrastructure failure
- HIGH urgency: Causing accidents or major disruption
- MEDIUM urgency: Affecting quality of life
- LOW urgency: Aesthetic or minor functional issues
- confidence: float between 0 and 1 representing analysis confidence
- tags: 2-5 relevant descriptive tags`;

    parts.push({ text: prompt });

    const result = await model.generateContent(parts);
    const response = result.response;
    const text = response.text().trim();

    // Clean response - remove markdown code blocks if present
    const cleanText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let aiResult;
    try {
      aiResult = JSON.parse(cleanText);
    } catch {
      // Fallback parsing
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    // Validate and sanitize fields
    const validCategories: Category[] = [
      "POTHOLE", "GARBAGE", "WATER_LEAKAGE", "DAMAGED_INFRASTRUCTURE",
      "STREET_LIGHT", "SEWAGE", "ENCROACHMENT", "NOISE_POLLUTION",
      "AIR_POLLUTION", "OTHER",
    ];
    const validSeverities: Severity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const validUrgencies: Urgency[] = ["LOW", "MEDIUM", "HIGH", "IMMEDIATE"];

    const category: Category = validCategories.includes(aiResult.category)
      ? aiResult.category
      : (request.category as Category) || "OTHER";
    const severity: Severity = validSeverities.includes(aiResult.severity)
      ? aiResult.severity
      : "MEDIUM";
    const urgency: Urgency = validUrgencies.includes(aiResult.urgency)
      ? aiResult.urgency
      : "MEDIUM";

    // Check for duplicate issues using geospatial analysis
    let isDuplicate = false;
    let duplicateOfId: string | null = null;

    if (request.existingIssues && request.existingIssues.length > 0) {
      const DUPLICATE_RADIUS_METERS = 500;

      for (const existing of request.existingIssues) {
        const distance = calculateDistance(
          request.latitude,
          request.longitude,
          existing.latitude,
          existing.longitude
        );

        if (
          distance <= DUPLICATE_RADIUS_METERS &&
          existing.category === category &&
          existing.status !== "RESOLVED" &&
          existing.status !== "REJECTED"
        ) {
          isDuplicate = true;
          duplicateOfId = existing.id;
          break;
        }
      }
    }

    // Calculate MCIA priority score
    const priorityScore = calculatePriorityScore({
      severity,
      urgency,
      upvoteCount: 0,
      createdAt: new Date(),
    });

    return {
      category,
      severity,
      urgency,
      priorityScore,
      confidence: Math.min(Math.max(aiResult.confidence || 0.75, 0), 1),
      analysisText: aiResult.analysisText || "Issue analyzed successfully.",
      tags: Array.isArray(aiResult.tags) ? aiResult.tags.slice(0, 5) : [],
      isDuplicate,
      duplicateOfId,
    };
  } catch (error) {
    console.error("Gemini AI analysis error:", error);

    // Return fallback analysis
    return {
      category: (request.category as Category) || "OTHER",
      severity: "MEDIUM",
      urgency: "MEDIUM",
      priorityScore: 5.0,
      confidence: 0.5,
      analysisText: "Automated analysis unavailable. Issue has been recorded for manual review.",
      tags: ["manual-review"],
      isDuplicate: false,
      duplicateOfId: null,
    };
  }
}
