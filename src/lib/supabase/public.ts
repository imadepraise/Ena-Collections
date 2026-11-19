import { createClient } from '@supabase/supabase-js';

// Read-only client for pages that anyone can see (products, categories).
// The database rules (RLS) decide what it is allowed to read.
export function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export function mediaUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-media/${path}`;
}
