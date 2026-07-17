import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/env/server";

export const createSupabaseAdminClient = () => {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());
};
