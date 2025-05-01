import { Vehicle } from "./vehicle";
import { Part } from "./part";

export interface DiagnosticRequest {
  id: string;
  user_id: string;
  vehicle_id?: string | null;
  issue_description: string;
  image_urls?: string[] | null; // Array of URLs for uploaded images
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  updated_at: string;
  result?: DiagnosticResult | null; // Embed result or link via ID
  vehicle?: Vehicle | null; // Optional: Include linked vehicle details
}

export interface DiagnosticResult {
  // This might be stored directly in the request record or as a separate related record
  // For simplicity, let's assume it's part of the request record for now (JSONB or separate columns)
  analysis: string; // AI-generated analysis text
  suggested_parts?: Part[] | null; // Array of suggested parts (or just IDs)
  suggested_solutions?: string[] | null; // Array of suggested solution steps
  confidence_score?: number | null; // Optional confidence score from AI
  processed_at: string;
}

