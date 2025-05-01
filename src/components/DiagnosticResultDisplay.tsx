"use client";

import { useEffect, useState } from "react";
import { DiagnosticRequest } from "@/types/diagnostic";
import { fetchDiagnosticRequestById } from "@/services/diagnosticService";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Part } from "@/types/part";

interface DiagnosticResultDisplayProps {
  requestId: string;
}

export default function DiagnosticResultDisplay({ requestId }: DiagnosticResultDisplayProps) {
  const [request, setRequest] = useState<DiagnosticRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRequest = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDiagnosticRequestById(requestId);
        if (data?.status !== "completed") {
          // Handle cases where result isn't ready or failed
          // For now, just show the request info
        }
        setRequest(data);
      } catch (err) {
        console.error("Failed to load diagnostic request:", err);
        setError(err instanceof Error ? err.message : "Could not load request details.");
      } finally {
        setLoading(false);
      }
    };

    loadRequest();
  }, [requestId]);

  if (loading) {
    return <p>Loading diagnostic result...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  if (!request) {
    return <p>Diagnostic request not found.</p>;
  }

  const result = request.result;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Diagnostic Result for Request #{request.id.substring(0, 8)}</CardTitle>
                <CardDescription>
                    Submitted: {new Date(request.created_at).toLocaleString()}
                    {request.vehicle && ` - Vehicle: ${request.vehicle.name}`}
                </CardDescription>
            </div>
            <Badge variant={request.status === "completed" ? "default" : "secondary"}>{request.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-1">Issue Description:</h4>
          <p className="text-sm bg-gray-50 p-3 rounded border">{request.issue_description}</p>
        </div>

        {request.image_urls && request.image_urls.length > 0 && (
          <div>
            <h4 className="font-semibold mb-1">Submitted Images:</h4>
            <div className="flex flex-wrap gap-2">
              {request.image_urls.map((url, index) => (
                <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt={`Diagnostic image ${index + 1}`} className="w-24 h-24 object-cover border rounded" />
                </a>
              ))}
            </div>
          </div>
        )}

        {result ? (
          <div className="border-t pt-4 mt-4 space-y-4">
            <div>
              <h4 className="font-semibold mb-1">AI Analysis:</h4>
              <p className="text-sm bg-blue-50 p-3 rounded border border-blue-200">{result.analysis}</p>
              {result.confidence_score && (
                <p className="text-xs text-gray-500 mt-1">Confidence: {(result.confidence_score * 100).toFixed(0)}%</p>
              )}
            </div>

            {result.suggested_solutions && result.suggested_solutions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-1">Suggested Solutions:</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {result.suggested_solutions.map((solution, index) => (
                    <li key={index}>{solution}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.suggested_parts && result.suggested_parts.length > 0 && (
              <div>
                <h4 className="font-semibold mb-1">Suggested Parts:</h4>
                <div className="space-y-2">
                  {result.suggested_parts.map((part: Part) => (
                    <div key={part.id} className="text-sm p-2 border rounded bg-gray-50">
                      <p><strong>{part.name}</strong> (Part #: {part.part_number || "N/A"})</p>
                      {/* Add link to part details later */}
                    </div>
                  ))}
                </div>
              </div>
            )}
             <p className="text-xs text-gray-500 mt-4">Processed at: {new Date(result.processed_at).toLocaleString()}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic mt-4">Diagnostic result is not yet available or processing failed.</p>
        )}
      </CardContent>
      {/* Footer could have actions like "Mark as Resolved" */}
    </Card>
  );
}

