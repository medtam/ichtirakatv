// utils/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cudfgfzpnhwwmayecrbe.supabase.coL";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1ZGZnZnpwbmh3d21heWVjcmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjYxMjgsImV4cCI6MjA3NTAwMjEyOH0.rJ2LSFMjDzAB4fi726xGb3XE1kjC_attVR2brBp-3kc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
