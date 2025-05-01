import { Part } from "./part";

export interface PartDiagram {
  id: string;
  user_id: string;
  vehicle_id?: string | null;
  part_id?: string | null;
  name: string;
  diagram_url: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
  hotspots?: DiagramHotspot[]; // Optional: Include hotspots directly
}

export interface DiagramHotspot {
  id: string;
  diagram_id: string;
  part_id?: string | null; // Link to a specific part in inventory
  coordinates: any; // JSONB - Could be { x, y, width, height } or SVG path data
  label?: string | null;
  created_at: string;
  part?: Part | null; // Optional: Include linked part details
}

