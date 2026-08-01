import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

// Use este client em Client Components ("use client").
//
// A publishable key é o substituto direto da antiga anon key —
// baixo privilégio, seguro para expor no browser. Precisa do
// prefixo NEXT_PUBLIC_ para o Next.js incluir no bundle do client.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
