import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if variables are defined before creating the client
if (!supabaseUrl || !supabaseAnonKey) {
  // Throw an error to make it clear during build if variables are missing.
  throw new Error("Supabase URL or Anon Key is missing in environment variables during build/initialization.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

