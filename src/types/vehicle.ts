export interface Vehicle {
  id: string;
  user_id: string;
  brand?: string | null;
  model: string;
  category?: string | null;
  purchase_date?: string | null;
  status?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Potential future fields for media
  // media?: Media[];
}

// Interface for Media (if needed later)
// export interface Media {
//   id: string;
//   file_url: string;
//   file_type?: string | null;
//   description?: string | null;
//   is_primary?: boolean;
// }

