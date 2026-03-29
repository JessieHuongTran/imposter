import { createContext, useContext } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://llyhendfolaiwwhykwxj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_iRUAAg91O4PR-GKkK7UQ6A_wi-5kVY_";

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const SupabaseContext = createContext(null);

export function SupabaseProvider({ children }) {
  return <SupabaseContext.Provider value={sb}>{children}</SupabaseContext.Provider>;
}

export function useSB() {
  return useContext(SupabaseContext);
}

export function generateId() {
  return crypto.randomUUID();
}

export function generateCode() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) code += c[Math.floor(Math.random() * c.length)];
  return code;
}
