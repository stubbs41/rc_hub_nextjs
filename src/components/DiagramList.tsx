"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { PartDiagram } from "@/types/diagram";
import { fetchDiagrams, deleteDiagram } from "@/services/diagramService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Session } from "@supabase/supabase-js";
import InteractiveDiagramViewer from "./InteractiveDiagramViewer"; // Import the viewer
// Placeholder for Add/Edit Diagram Modal/Page
// import DiagramForm from "./DiagramForm";

export default function DiagramList() {
  const [diagrams, setDiagrams] = useState<PartDiagram[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [selectedDiagram, setSelectedDiagram] = useState<PartDiagram | null>(null);
  const [viewingDiagramId, setViewingDiagramId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadDiagrams(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          loadDiagrams(session.user.id);
        } else {
          setDiagrams([]);
          setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadDiagrams = async (userId: string) => {
    setLoading(true);
    try {
      // Fetch all diagrams for the user for now
      const data = await fetchDiagrams(userId);
      setDiagrams(data);
    } catch (error) {
      console.error("Failed to load diagrams:", error);
      // TODO: Show error message to user
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!session?.user) return;
    if (window.confirm("Are you sure you want to delete this diagram and all its hotspots?")) {
      try {
        await deleteDiagram(id);
        // Refresh the list
        loadDiagrams(session.user.id);
      } catch (error) {
        console.error("Failed to delete diagram:", error);
        // TODO: Show error message to user
      }
    }
  };

  const handleAddClick = () => {
    setSelectedDiagram(null);
    // setShowAddEditModal(true); // Enable when DiagramForm is ready
    alert("Add Diagram functionality not yet implemented.");
  };

  const handleEditClick = (diagram: PartDiagram) => {
    setSelectedDiagram(diagram);
    // setShowAddEditModal(true); // Enable when DiagramForm is ready
    alert("Edit Diagram functionality not yet implemented.");
  };

  const handleViewClick = (diagramId: string) => {
    setViewingDiagramId(diagramId);
  };

  const handleCloseViewer = () => {
    setViewingDiagramId(null);
  };

  const handleModalClose = () => {
    setShowAddEditModal(false);
    if (session?.user) {
      loadDiagrams(session.user.id); // Refresh list after closing modal
    }
  };

  if (loading) {
    return <p>Loading diagrams...</p>;
  }

  if (!session) {
    return null; // Don't render if not logged in
  }

  // If viewing a specific diagram, show only the viewer
  if (viewingDiagramId) {
    return (
      <div className="container mx-auto p-4 mt-6 border-t pt-6">
        <Button onClick={handleCloseViewer} className="mb-4">Back to Diagrams List</Button>
        <InteractiveDiagramViewer diagramId={viewingDiagramId} />
      </div>
    );
  }

  // Otherwise, show the list of diagrams
  return (
    <div className="container mx-auto p-4 mt-6 border-t pt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Diagrams</h2>
        <Button onClick={handleAddClick}>Add Diagram</Button>
      </div>

      {/* Modal for Adding/Editing Diagrams (Implement later) */}
      {/* {showAddEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <DiagramForm diagram={selectedDiagram} onClose={handleModalClose} userId={session.user.id} />
          </div>
        </div>
      )} */}

      {diagrams.length === 0 ? (
        <p>No diagrams available yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {diagrams.map((diagram) => (
            <Card key={diagram.id}>
              <CardHeader>
                <CardTitle>{diagram.name}</CardTitle>
                {/* Add relation info if available (Vehicle/Part) */}
                <CardDescription>{diagram.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Display thumbnail? */}
                <img src={diagram.diagram_url} alt={diagram.name} className="w-full h-32 object-cover mb-2"/>
                <p className="text-sm">Hotspots: {diagram.hotspots?.length || 0}</p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleViewClick(diagram.id)}>View</Button>
                <Button variant="outline" size="sm" onClick={() => handleEditClick(diagram)}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(diagram.id)}>Delete</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

