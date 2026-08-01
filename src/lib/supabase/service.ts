import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// ATENÇÃO: este client usa a secret key (substituta da antiga
// service_role key) e bypassa o RLS. Use SOMENTE em código
// server-side (Route Handlers) que valide manualmente o
// share_token antes de retornar qualquer dado.
// NUNCA importe este arquivo em um Client Component, e nunca
// prefixe SUPABASE_SECRET_KEY com NEXT_PUBLIC_.
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
