import { supabase } from "@/lib/supabaseClient";
import { DiagnosticRequest, DiagnosticResult } from "@/types/diagnostic";
import { v4 as uuidv4 } from "uuid";

// --- Diagnostic Request Functions ---

// Create a new diagnostic request
export const createDiagnosticRequest = async (
  requestData: Omit<DiagnosticRequest, "id" | "status" | "created_at" | "updated_at" | "result">
): Promise<DiagnosticRequest> => {
  const { data, error } = await supabase
    .from("diagnostic_requests")
    .insert([
      {
        ...requestData,
        status: "pending", // Initial status
      },
    ])
    .select("*, vehicle:vehicles(*)") // Fetch linked vehicle details
    .single();

  if (error) {
    console.error("Error creating diagnostic request:", error);
    throw error;
  }

  // Simulate AI processing asynchronously (replace with actual AI call later)
  simulateAIProcessing(data.id);

  return data;
};

// Fetch all diagnostic requests for the current user
export const fetchDiagnosticRequests = async (userId: string): Promise<DiagnosticRequest[]> => {
  const { data, error } = await supabase
    .from("diagnostic_requests")
    .select("*, vehicle:vehicles(*)") // Fetch linked vehicle details
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching diagnostic requests:", error);
    throw error;
  }
  return data || [];
};

// Fetch a single diagnostic request by ID
export const fetchDiagnosticRequestById = async (id: string): Promise<DiagnosticRequest | null> => {
  const { data, error } = await supabase
    .from("diagnostic_requests")
    .select("*, vehicle:vehicles(*)") // Fetch linked vehicle details
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching diagnostic request:", error);
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }
  return data;
};

// Update a diagnostic request (e.g., status, result)
export const updateDiagnosticRequest = async (
  id: string,
  updates: Partial<Omit<DiagnosticRequest, "id" | "created_at" | "user_id">>
): Promise<DiagnosticRequest> => {
  const { data, error } = await supabase
    .from("diagnostic_requests")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, vehicle:vehicles(*)")
    .single();

  if (error) {
    console.error("Error updating diagnostic request:", error);
    throw error;
  }
  return data;
};

// Delete a diagnostic request
export const deleteDiagnosticRequest = async (id: string): Promise<void> => {
  // First, delete associated images from storage if they exist
  const { data: request } = await fetchDiagnosticRequestById(id);
  if (request?.image_urls) {
    const filePaths = request.image_urls.map(url => {
        // Assuming URL format is like: .../storage/v1/object/public/diagnostic_images/user_id/image_name.jpg
        const parts = url.split("/diagnostic_images/");
        return parts.length > 1 ? `diagnostic_images/${parts[1]}` : null;
    }).filter(path => path !== null) as string[];

    if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage.from("diagnostic_images").remove(filePaths);
        if (storageError) {
            console.error("Error deleting diagnostic images from storage:", storageError);
            // Decide if you want to proceed with deleting the DB record even if storage deletion fails
        }
    }
  }

  // Then, delete the database record
  const { error } = await supabase
    .from("diagnostic_requests")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting diagnostic request:", error);
    throw error;
  }
};

// --- Image Upload --- (Example)
export const uploadDiagnosticImage = async (userId: string, file: File): Promise<string> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = `diagnostic_images/${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("diagnostic_images")
    .upload(filePath, file);

  if (uploadError) {
    console.error("Error uploading image:", uploadError);
    throw uploadError;
  }

  // Get the public URL
  const { data } = supabase.storage.from("diagnostic_images").getPublicUrl(filePath);

  if (!data?.publicUrl) {
    throw new Error("Could not get public URL for uploaded image.");
  }

  return data.publicUrl;
};

// --- Simulate AI Processing --- (Replace with actual AI integration)
const simulateAIProcessing = async (requestId: string) => {
  console.log(`Simulating AI processing for request ID: ${requestId}`);
  try {
    // 1. Update status to processing
    await updateDiagnosticRequest(requestId, { status: "processing" });

    // 2. Simulate delay
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5-second delay

    // 3. Generate dummy results
    const dummyResult: DiagnosticResult = {
      analysis: `Based on the description, the issue might be related to the motor overheating or a potential ESC failure. Common causes include prolonged high-speed runs, incorrect gearing, or binding in the drivetrain. Checked image (if provided): [Simulated Image Analysis Notes].`,
      suggested_parts: [], // TODO: Link to actual parts if possible
      suggested_solutions: [
        "Check motor temperature after short runs.",
        "Ensure gearing is appropriate for the motor and terrain.",
        "Inspect drivetrain for any binding or obstructions.",
        "Verify ESC settings and connections.",
      ],
      confidence_score: 0.75,
      processed_at: new Date().toISOString(),
    };

    // 4. Update request with results and completed status
    await updateDiagnosticRequest(requestId, {
      result: dummyResult,
      status: "completed",
    });

    console.log(`AI processing simulation completed for request ID: ${requestId}`);

  } catch (error) {
    console.error(`Error during AI simulation for request ${requestId}:`, error);
    // Update status to failed
    try {
      await updateDiagnosticRequest(requestId, { status: "failed" });
    } catch (updateError) {
      console.error(`Failed to update status to failed for request ${requestId}:`, updateError);
    }
  }
};

