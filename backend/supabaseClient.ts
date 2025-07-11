import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase: SupabaseClient | undefined = undefined;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('[server]: Supabase client initialized successfully.');
} else {
  console.warn('[server]: IMPORTANT - Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) not set. Database functionality will be disabled.');
}

export { supabase };
