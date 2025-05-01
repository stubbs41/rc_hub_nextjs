-- RC Hub (Next.js) Database Schema

-- Enable Row Level Security (RLS)
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagram_hotspots ENABLE ROW LEVEL SECURITY;

-- Create Policies for RLS
-- Users can only see and manage their own data.
CREATE POLICY "Enable read access for authenticated users only" ON vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users only" ON vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for users based on user_id" ON vehicles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for users based on user_id" ON vehicles FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Enable read access for authenticated users only" ON parts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Enable insert for authenticated users only" ON parts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for users based on user_id" ON parts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for users based on user_id" ON parts FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for other tables (vehicle_parts, media, maintenance_records, diagnostics, diagnostic_media, part_diagrams, diagram_hotspots)
-- Example for vehicle_parts:
CREATE POLICY "Enable read access for related users" ON vehicle_parts
  FOR SELECT USING (
    (SELECT user_id FROM vehicles WHERE id = vehicle_id) = auth.uid()
    AND
    (SELECT user_id FROM parts WHERE id = part_id) = auth.uid()
  );
CREATE POLICY "Enable insert for related users" ON vehicle_parts
  FOR INSERT WITH CHECK (
    (SELECT user_id FROM vehicles WHERE id = vehicle_id) = auth.uid()
    AND
    (SELECT user_id FROM parts WHERE id = part_id) = auth.uid()
  );
CREATE POLICY "Enable delete for related users" ON vehicle_parts
  FOR DELETE USING (
    (SELECT user_id FROM vehicles WHERE id = vehicle_id) = auth.uid()
    AND
    (SELECT user_id FROM parts WHERE id = part_id) = auth.uid()
  );

-- ... (Add policies for media, maintenance_records, diagnostics, diagnostic_media, part_diagrams, diagram_hotspots following the same pattern)

-- Vehicles Table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  brand TEXT,
  model TEXT NOT NULL,
  category TEXT, -- e.g., Buggy, Truggy, Crawler, On-road
  purchase_date DATE,
  status TEXT, -- e.g., Operational, Needs Repair, Shelf Queen
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Parts Table
CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  part_number TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- e.g., Motor, ESC, Servo, Tires, Body
  quantity INTEGER DEFAULT 1,
  status TEXT, -- e.g., New, Used, Needs Replacement
  purchase_date DATE,
  cost NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vehicle-Parts Junction Table (Many-to-Many)
CREATE TABLE vehicle_parts (
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  part_id UUID REFERENCES parts(id) ON DELETE CASCADE,
  installed_date TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  PRIMARY KEY (vehicle_id, part_id)
);

-- Media Table (for Vehicle and Part Images/Videos)
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  part_id UUID REFERENCES parts(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL, -- URL from Supabase Storage
  file_type TEXT, -- e.g., image, video
  description TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT fk_media_owner CHECK (vehicle_id IS NOT NULL OR part_id IS NOT NULL) -- Ensure media belongs to either a vehicle or a part
);

-- Maintenance Records Table
CREATE TABLE maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  record_date DATE NOT NULL,
  description TEXT NOT NULL,
  cost NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Diagnostics Table
CREATE TABLE diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE, -- Optional link to vehicle
  issue_description TEXT NOT NULL,
  ai_analysis TEXT, -- Store the result from the AI
  suggested_parts JSONB, -- Store suggested part IDs or details
  status TEXT DEFAULT 'pending', -- e.g., pending, analyzing, completed, resolved
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Diagnostic Media Table (Images/Videos for Diagnostics)
CREATE TABLE diagnostic_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_id UUID REFERENCES diagnostics(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL, -- URL from Supabase Storage
  file_type TEXT, -- e.g., image, video
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Part Diagrams Table (for Interactive Viewer)
CREATE TABLE part_diagrams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE, -- Link diagram to a specific vehicle model if applicable
  part_id UUID REFERENCES parts(id) ON DELETE CASCADE, -- Or link to a specific complex part
  name TEXT NOT NULL,
  diagram_url TEXT NOT NULL, -- URL of the main diagram image (SVG preferred)
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Diagram Hotspots Table (for Interactive Viewer)
CREATE TABLE diagram_hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagram_id UUID REFERENCES part_diagrams(id) ON DELETE CASCADE NOT NULL,
  part_id UUID REFERENCES parts(id) ON DELETE SET NULL, -- Link hotspot to a specific part in inventory
  coordinates JSONB NOT NULL, -- Store hotspot coordinates (e.g., { "x": 100, "y": 150, "width": 50, "height": 30 } or SVG path data)
  label TEXT, -- Optional label for the hotspot
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_parts_user_id ON parts(user_id);
CREATE INDEX idx_vehicle_parts_vehicle_id ON vehicle_parts(vehicle_id);
CREATE INDEX idx_vehicle_parts_part_id ON vehicle_parts(part_id);
CREATE INDEX idx_media_user_id ON media(user_id);
CREATE INDEX idx_media_vehicle_id ON media(vehicle_id);
CREATE INDEX idx_media_part_id ON media(part_id);
CREATE INDEX idx_maintenance_records_user_id ON maintenance_records(user_id);
CREATE INDEX idx_maintenance_records_vehicle_id ON maintenance_records(vehicle_id);
CREATE INDEX idx_diagnostics_user_id ON diagnostics(user_id);
CREATE INDEX idx_diagnostics_vehicle_id ON diagnostics(vehicle_id);
CREATE INDEX idx_diagnostic_media_diagnostic_id ON diagnostic_media(diagnostic_id);
CREATE INDEX idx_part_diagrams_user_id ON part_diagrams(user_id);
CREATE INDEX idx_part_diagrams_vehicle_id ON part_diagrams(vehicle_id);
CREATE INDEX idx_part_diagrams_part_id ON part_diagrams(part_id);
CREATE INDEX idx_diagram_hotspots_diagram_id ON diagram_hotspots(diagram_id);
CREATE INDEX idx_diagram_hotspots_part_id ON diagram_hotspots(part_id);

-- Function to automatically update `updated_at` timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to update `updated_at` timestamps
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_records_updated_at BEFORE UPDATE ON maintenance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_diagnostics_updated_at BEFORE UPDATE ON diagnostics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_part_diagrams_updated_at BEFORE UPDATE ON part_diagrams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

