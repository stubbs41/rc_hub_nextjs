import { supabase } from "@/lib/supabaseClient";
import { PartDiagram, DiagramHotspot } from "@/types/diagram";

// --- Diagram Functions ---

// Fetch all diagrams for the current user (or optionally filtered by vehicle/part)
export const fetchDiagrams = async (userId: string, filter?: { vehicleId?: string; partId?: string }): Promise<PartDiagram[]> => {
  let query = supabase
    .from("part_diagrams")
    .select("*, hotspots:diagram_hotspots(*, part:parts(*))") // Fetch hotspots and linked part details
    .eq("user_id", userId);

  if (filter?.vehicleId) {
    query = query.eq("vehicle_id", filter.vehicleId);
  }
  if (filter?.partId) {
    query = query.eq("part_id", filter.partId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching diagrams:", error);
    throw error;
  }
  return data || [];
};

// Fetch a single diagram by ID, including its hotspots and linked parts
export const fetchDiagramById = async (id: string): Promise<PartDiagram | null> => {
  const { data, error } = await supabase
    .from("part_diagrams")
    .select("*, hotspots:diagram_hotspots(*, part:parts(*))") // Fetch hotspots and linked part details
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching diagram:", error);
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }
  return data;
};

// Add a new diagram
export const addDiagram = async (diagramData: Omit<PartDiagram, "id" | "created_at" | "updated_at" | "hotspots">): Promise<PartDiagram> => {
  const { data, error } = await supabase
    .from("part_diagrams")
    .insert([diagramData])
    .select()
    .single();

  if (error) {
    console.error("Error adding diagram:", error);
    throw error;
  }
  return data;
};

// Update an existing diagram
export const updateDiagram = async (id: string, updates: Partial<Omit<PartDiagram, "id" | "created_at" | "updated_at" | "hotspots">>): Promise<PartDiagram> => {
  const { data, error } = await supabase
    .from("part_diagrams")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating diagram:", error);
    throw error;
  }
  return data;
};

// Delete a diagram (also deletes associated hotspots due to CASCADE constraint)
export const deleteDiagram = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("part_diagrams")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting diagram:", error);
    throw error;
  }
};

// --- Hotspot Functions ---

// Fetch hotspots for a specific diagram
export const fetchHotspotsForDiagram = async (diagramId: string): Promise<DiagramHotspot[]> => {
  const { data, error } = await supabase
    .from("diagram_hotspots")
    .select("*, part:parts(*)") // Fetch linked part details
    .eq("diagram_id", diagramId);

  if (error) {
    console.error("Error fetching hotspots:", error);
    throw error;
  }
  return data || [];
};

// Add a new hotspot to a diagram
export const addHotspot = async (hotspotData: Omit<DiagramHotspot, "id" | "created_at" | "part">): Promise<DiagramHotspot> => {
  const { data, error } = await supabase
    .from("diagram_hotspots")
    .insert([hotspotData])
    .select()
    .single();

  if (error) {
    console.error("Error adding hotspot:", error);
    throw error;
  }
  return data;
};

// Update an existing hotspot
export const updateHotspot = async (id: string, updates: Partial<Omit<DiagramHotspot, "id" | "created_at" | "diagram_id" | "part">>): Promise<DiagramHotspot> => {
  const { data, error } = await supabase
    .from("diagram_hotspots")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating hotspot:", error);
    throw error;
  }
  return data;
};

// Delete a hotspot
export const deleteHotspot = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("diagram_hotspots")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting hotspot:", error);
    throw error;
  }
};

