// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

// Each tab gets a unique random key for isolated sessions
const tabId = (() => {
  let existing = sessionStorage.getItem("sb-tab-id");
  if (!existing) {
    existing = Math.random().toString(36).substring(2, 10);
    sessionStorage.setItem("sb-tab-id", existing);
  }
  return existing;
})();

// Detect portal type (admin or user) based on current route or context
// This helps separate sessions for admins vs normal users completely.
const isAdminPortal =
  typeof window !== "undefined" && window.location.pathname.startsWith("/portal");

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Generate unique storage key per tab and role context
const storageKeyPrefix = isAdminPortal ? "sb-admin-session" : "sb-session";
const storageKey = `${storageKeyPrefix}-${tabId}`;

// Create client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage, // persist login between refreshes
    storageKey, // isolate per tab and per role context
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
