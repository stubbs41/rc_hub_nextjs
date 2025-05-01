"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Vehicle } from "@/types/vehicle";
import { fetchVehicles, deleteVehicle } from "@/services/vehicleService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Session } from "@supabase/supabase-js";

// Placeholder for Add/Edit Vehicle Modal/Page
const AddEditVehicle = ({ vehicle, onClose }: { vehicle?: Vehicle | null, onClose: () => void }) => {
  // TODO: Implement form for adding/editing vehicle
  return (
    <div>
      <h2>{vehicle ? "Edit Vehicle" : "Add Vehicle"}</h2>
      {/* Form fields go here */}
      <Button onClick={onClose}>Close</Button>
    </div>
  );
};

export default function VehicleList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadVehicles(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          loadVehicles(session.user.id);
        } else {
          setVehicles([]);
          setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadVehicles = async (userId: string) => {
    setLoading(true);
    try {
      const data = await fetchVehicles(userId);
      setVehicles(data);
    } catch (error) {
      console.error("Failed to load vehicles:", error);
      // TODO: Show error message to user
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!session?.user) return;
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        await deleteVehicle(id);
        // Refresh the list
        loadVehicles(session.user.id);
      } catch (error) {
        console.error("Failed to delete vehicle:", error);
        // TODO: Show error message to user
      }
    }
  };

  const handleAddClick = () => {
    setSelectedVehicle(null);
    setShowAddEditModal(true);
  };

  const handleEditClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowAddEditModal(true);
  };

  const handleModalClose = () => {
    setShowAddEditModal(false);
    if (session?.user) {
      loadVehicles(session.user.id); // Refresh list after closing modal
    }
  };

  if (loading) {
    return <p>Loading vehicles...</p>;
  }

  if (!session) {
    return <p>Please log in to manage your vehicles.</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My RC Vehicles</h1>
        <Button onClick={handleAddClick}>Add Vehicle</Button>
      </div>

      {showAddEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            {/* Use the actual VehicleForm Component */}
            <VehicleForm vehicle={selectedVehicle} onClose={handleModalClose} userId={session.user.id} />
          </div>
        </div>
      )}

      {vehicles.length === 0 ? (
        <p>You haven't added any vehicles yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id}>
              <CardHeader>
                <CardTitle>{vehicle.model}</CardTitle>
                <CardDescription>{vehicle.brand || "Unknown Brand"} - {vehicle.category || "Uncategorized"}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Status: {vehicle.status || "N/A"}</p>
                {vehicle.purchase_date && <p>Purchased: {new Date(vehicle.purchase_date).toLocaleDateString()}</p>}
                {vehicle.notes && <p className="mt-2 text-sm text-gray-600">Notes: {vehicle.notes}</p>}
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEditClick(vehicle)}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(vehicle.id)}>Delete</Button>
                {/* TODO: Add View Details Button */}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

