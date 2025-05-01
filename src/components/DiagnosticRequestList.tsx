"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { DiagnosticRequest } from "@/types/diagnostic";
import { fetchDiagnosticRequests, deleteDiagnosticRequest } from "@/services/diagnosticService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Session } from "@supabase/supabase-js";
import DiagnosticRequestForm from "./DiagnosticRequestForm";
import DiagnosticResultDisplay from "./DiagnosticResultDisplay"; // To display results

export default function DiagnosticRequestList() {
  const [requests, setRequests] = useState<DiagnosticRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [viewingRequestId, setViewingRequestId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadRequests(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          loadRequests(session.user.id);
        } else {
          setRequests([]);
          setLoading(false);
        }
      }
    );

    // Set up a real-time listener for changes in diagnostic_requests table
    const channel = supabase
      .channel("diagnostic_requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "diagnostic_requests" },
        (payload) => {
          console.log("Change received!", payload);
          // Refetch requests if the change affects the current user
          if (session?.user && (payload.new as DiagnosticRequest)?.user_id === session.user.id) {
            loadRequests(session.user.id);
          }
        }
      )
      .subscribe();

    return () => {
      authListener.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]); // Re-run effect if user ID changes

  const loadRequests = async (userId: string) => {
    setLoading(true);
    try {
      const data = await fetchDiagnosticRequests(userId);
      setRequests(data);
    } catch (error) {
      console.error("Failed to load diagnostic requests:", error);
      // TODO: Show error message to user
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!session?.user) return;
    if (window.confirm("Are you sure you want to delete this diagnostic request?")) {
      try {
        await deleteDiagnosticRequest(id);
        // Refresh the list
        loadRequests(session.user.id);
      } catch (error) {
        console.error("Failed to delete diagnostic request:", error);
        // TODO: Show error message to user
      }
    }
  };

  const handleFormClose = () => {
    setShowRequestForm(false);
    if (session?.user) {
      loadRequests(session.user.id); // Refresh list after closing form
    }
  };

  const handleViewResult = (requestId: string) => {
    setViewingRequestId(requestId);
  };

  const handleCloseResult = () => {
    setViewingRequestId(null);
  };

  const getStatusBadgeVariant = (status: DiagnosticRequest["status"]): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "pending":
        return "secondary";
      case "processing":
        return "outline";
      case "completed":
        return "default"; // Or a success variant if you add one
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading && requests.length === 0) { // Show loading only on initial load
    return <p>Loading diagnostic requests...</p>;
  }

  if (!session) {
    return null; // Don't render if not logged in
  }

  // If viewing a specific result, show only the result display
  if (viewingRequestId) {
    return (
      <div className="container mx-auto p-4 mt-6 border-t pt-6">
        <Button onClick={handleCloseResult} className="mb-4">Back to Requests</Button>
        <DiagnosticResultDisplay requestId={viewingRequestId} />
      </div>
    );
  }

  // Otherwise, show the list of requests
  return (
    <div className="container mx-auto p-4 mt-6 border-t pt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Diagnostic Requests</h2>
        <Button onClick={() => setShowRequestForm(true)}>New Request</Button>
      </div>

      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <DiagnosticRequestForm userId={session.user.id} onClose={handleFormClose} />
          </div>
        </div>
      )}

      {requests.length === 0 ? (
        <p>You haven't submitted any diagnostic requests yet.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Request #{request.id.substring(0, 8)}</CardTitle>
                    <CardDescription>
                      Submitted: {new Date(request.created_at).toLocaleString()}
                      {request.vehicle && ` - Vehicle: ${request.vehicle.name}`}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusBadgeVariant(request.status)}>{request.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm truncate">{request.issue_description}</p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                {request.status === "completed" && (
                  <Button variant="secondary" size="sm" onClick={() => handleViewResult(request.id)}>View Result</Button>
                )}
                {(request.status === "pending" || request.status === "processing") && (
                    <span className="text-sm text-gray-500 italic">Processing...</span>
                )}
                 {(request.status === "failed") && (
                    <span className="text-sm text-red-500 italic">Processing Failed</span>
                )}
                <Button variant="destructive" size="sm" onClick={() => handleDelete(request.id)}>Delete</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

