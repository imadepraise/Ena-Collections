import { createBrowserClient } from '@supabase/ssr';

// Browser client: used for login, the owner dashboard, carts and orders.
// What each person may read or change is decided by the database rules (RLS).
export function supabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
