import { supabase } from "@/lib/supabaseClient";
import { Part, VehiclePart } from "@/types/part";

// Fetch all parts for the current user
export const fetchParts = async (userId: string): Promise<Part[]> => {
  const { data, error } = await supabase
    .from("parts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching parts:", error);
    throw error;
  }
  return data || [];
};

// Fetch a single part by ID
export const fetchPartById = async (id: string): Promise<Part | null> => {
  const { data, error } = await supabase
    .from("parts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching part:", error);
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }
  return data;
};

// Add a new part
export const addPart = async (partData: Omit<Part, "id" | "created_at" | "updated_at">): Promise<Part> => {
  const { data, error } = await supabase
    .from("parts")
    .insert([partData])
    .select()
    .single();

  if (error) {
    console.error("Error adding part:", error);
    throw error;
  }
  return data;
};

// Update an existing part
export const updatePart = async (id: string, updates: Partial<Part>): Promise<Part> => {
  const { data, error } = await supabase
    .from("parts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating part:", error);
    throw error;
  }
  return data;
};

// Delete a part
export const deletePart = async (id: string): Promise<void> => {
  // First, delete related entries in vehicle_parts junction table
  const { error: junctionError } = await supabase
    .from("vehicle_parts")
    .delete()
    .eq("part_id", id);

  if (junctionError) {
    console.error("Error deleting part associations:", junctionError);
    throw junctionError;
  }

  // Then, delete the part itself
  const { error } = await supabase
    .from("parts")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting part:", error);
    throw error;
  }
};

// --- Vehicle-Part Association Functions ---

// Fetch parts associated with a specific vehicle
export const fetchPartsForVehicle = async (vehicleId: string): Promise<Part[]> => {
  const { data, error } = await supabase
    .from("vehicle_parts")
    .select("parts(*)") // Select all columns from the related parts table
    .eq("vehicle_id", vehicleId);

  if (error) {
    console.error("Error fetching parts for vehicle:", error);
    throw error;
  }
  // The result is an array of objects like { parts: Part }, so we map to get just the Part objects
  return data?.map(item => item.parts).filter(part => part !== null) as Part[] || [];
};

// Associate a part with a vehicle
export const associatePartWithVehicle = async (vehicleId: string, partId: string, notes?: string): Promise<VehiclePart> => {
  const { data, error } = await supabase
    .from("vehicle_parts")
    .insert([{ vehicle_id: vehicleId, part_id: partId, notes: notes }])
    .select()
    .single();

  if (error) {
    console.error("Error associating part with vehicle:", error);
    throw error;
  }
  return data;
};

// Disassociate a part from a vehicle
export const disassociatePartFromVehicle = async (vehicleId: string, partId: string): Promise<void> => {
  const { error } = await supabase
    .from("vehicle_parts")
    .delete()
    .eq("vehicle_id", vehicleId)
    .eq("part_id", partId);

  if (error) {
    console.error("Error disassociating part from vehicle:", error);
    throw error;
  }
};

