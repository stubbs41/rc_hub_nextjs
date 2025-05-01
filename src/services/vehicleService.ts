import { supabase } from "@/lib/supabaseClient";
import { Vehicle } from "@/types/vehicle";

// Fetch all vehicles for the current user
export const fetchVehicles = async (userId: string): Promise<Vehicle[]> => {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching vehicles:", error);
    throw error;
  }
  return data || [];
};

// Fetch a single vehicle by ID
export const fetchVehicleById = async (id: string): Promise<Vehicle | null> => {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching vehicle:", error);
    // Handle not found error specifically if needed
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }
  return data;
};

// Add a new vehicle
export const addVehicle = async (vehicleData: Omit<Vehicle, "id" | "created_at" | "updated_at">): Promise<Vehicle> => {
  const { data, error } = await supabase
    .from("vehicles")
    .insert([vehicleData])
    .select()
    .single();

  if (error) {
    console.error("Error adding vehicle:", error);
    throw error;
  }
  return data;
};

// Update an existing vehicle
export const updateVehicle = async (id: string, updates: Partial<Vehicle>): Promise<Vehicle> => {
  const { data, error } = await supabase
    .from("vehicles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating vehicle:", error);
    throw error;
  }
  return data;
};

// Delete a vehicle
export const deleteVehicle = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("vehicles")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting vehicle:", error);
    throw error;
  }
};

