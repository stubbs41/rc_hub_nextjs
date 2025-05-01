export interface Part {
  id: string;
  user_id: string;
  part_number?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  quantity: number;
  status?: string | null;
  purchase_date?: string | null;
  cost?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Potential future fields
  // media?: Media[];
  // vehicles?: Vehicle[]; // Representing vehicles this part is installed on
}

// Interface for VehiclePart (Junction Table)
export interface VehiclePart {
  vehicle_id: string;
  part_id: string;
  installed_date?: string | null;
  notes?: string | null;
}

