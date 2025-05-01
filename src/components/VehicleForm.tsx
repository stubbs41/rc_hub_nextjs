"use client";

import { useState, useEffect } from "react";
import { Vehicle } from "@/types/vehicle";
import { addVehicle, updateVehicle } from "@/services/vehicleService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

interface VehicleFormProps {
  vehicle?: Vehicle | null;
  onClose: () => void;
  userId: string;
}

export default function VehicleForm({ vehicle, onClose, userId }: VehicleFormProps) {
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    brand: "",
    model: "",
    category: "",
    purchase_date: null,
    status: "",
    notes: "",
    user_id: userId,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        ...vehicle,
        purchase_date: vehicle.purchase_date ? new Date(vehicle.purchase_date).toISOString().split("T")[0] : null, // Format for date input
      });
    } else {
      setFormData({
        brand: "",
        model: "",
        category: "",
        purchase_date: null,
        status: "",
        notes: "",
        user_id: userId,
      });
    }
  }, [vehicle, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value ? value : null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.model) {
        setError("Model is required.");
        setLoading(false);
        return;
    }

    try {
      const dataToSave: Partial<Vehicle> = {
        ...formData,
        purchase_date: formData.purchase_date ? new Date(formData.purchase_date).toISOString() : null,
      };

      if (vehicle?.id) {
        // Update existing vehicle
        await updateVehicle(vehicle.id, dataToSave);
      } else {
        // Add new vehicle
        // Ensure user_id is set for new vehicles
        if (!dataToSave.user_id) {
            throw new Error("User ID is missing");
        }
        await addVehicle(dataToSave as Omit<Vehicle, "id" | "created_at" | "updated_at">);
      }
      onClose(); // Close the form/modal on success
    } catch (err) {
      console.error("Failed to save vehicle:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">{vehicle ? "Edit Vehicle" : "Add New Vehicle"}</h2>
      {error && <p className="text-red-500">Error: {error}</p>}
      <div>
        <Label htmlFor="model">Model *</Label>
        <Input
          id="model"
          name="model"
          value={formData.model || ""}
          onChange={handleChange}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="brand">Brand</Label>
        <Input
          id="brand"
          name="brand"
          value={formData.brand || ""}
          onChange={handleChange}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          name="category"
          value={formData.category || ""}
          onChange={handleChange}
          placeholder="e.g., Buggy, Crawler, On-road"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Input
          id="status"
          name="status"
          value={formData.status || ""}
          onChange={handleChange}
          placeholder="e.g., Operational, Needs Repair"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="purchase_date">Purchase Date</Label>
        <Input
          id="purchase_date"
          name="purchase_date"
          type="date"
          value={formData.purchase_date || ""}
          onChange={handleDateChange}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes || ""}
          onChange={handleChange}
          className="mt-1"
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Vehicle"}
        </Button>
      </div>
    </form>
  );
}

