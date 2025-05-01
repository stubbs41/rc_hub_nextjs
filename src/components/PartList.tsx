"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Part } from "@/types/part";
import { fetchParts, deletePart } from "@/services/partService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Session } from "@supabase/supabase-js";
import PartForm from "./PartForm"; // Assuming PartForm component exists

export default function PartList() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadParts(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          loadParts(session.user.id);
        } else {
          setParts([]);
          setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadParts = async (userId: string) => {
    setLoading(true);
    try {
      const data = await fetchParts(userId);
      setParts(data);
    } catch (error) {
      console.error("Failed to load parts:", error);
      // TODO: Show error message to user
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!session?.user) return;
    if (window.confirm("Are you sure you want to delete this part? This will also remove it from any vehicles it is associated with.")) {
      try {
        await deletePart(id);
        // Refresh the list
        loadParts(session.user.id);
      } catch (error) {
        console.error("Failed to delete part:", error);
        // TODO: Show error message to user
      }
    }
  };

  const handleAddClick = () => {
    setSelectedPart(null);
    setShowAddEditModal(true);
  };

  const handleEditClick = (part: Part) => {
    setSelectedPart(part);
    setShowAddEditModal(true);
  };

  const handleModalClose = () => {
    setShowAddEditModal(false);
    if (session?.user) {
      loadParts(session.user.id); // Refresh list after closing modal
    }
  };

  if (loading) {
    return <p>Loading parts...</p>;
  }

  if (!session) {
    // This component should ideally only be rendered when logged in,
    // but adding a check just in case.
    return <p>Please log in to manage your parts.</p>;
  }

  return (
    <div className="container mx-auto p-4 mt-6 border-t pt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">My Parts Inventory</h2>
        <Button onClick={handleAddClick}>Add Part</Button>
      </div>

      {showAddEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <PartForm part={selectedPart} onClose={handleModalClose} userId={session.user.id} />
          </div>
        </div>
      )}

      {parts.length === 0 ? (
        <p>You haven't added any parts yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parts.map((part) => (
            <Card key={part.id}>
              <CardHeader>
                <CardTitle>{part.name}</CardTitle>
                <CardDescription>{part.part_number || "No Part #"} - {part.category || "Uncategorized"}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Quantity: {part.quantity}</p>
                <p>Status: {part.status || "N/A"}</p>
                {part.cost && <p>Cost: ${part.cost.toFixed(2)}</p>}
                {part.purchase_date && <p>Purchased: {new Date(part.purchase_date).toLocaleDateString()}</p>}
                {part.description && <p className="mt-2 text-sm text-gray-600">Desc: {part.description}</p>}
                {part.notes && <p className="mt-2 text-sm text-gray-600">Notes: {part.notes}</p>}
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEditClick(part)}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(part.id)}>Delete</Button>
                {/* TODO: Add View Details / Associate with Vehicle Button */}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

