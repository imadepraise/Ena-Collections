import { publicClient } from '@/lib/supabase/public';

export const dynamic = 'force-dynamic';

// Visited on a schedule (see vercel.json) so the free Supabase project never looks inactive.
export async function GET() {
  const { error } = await publicClient().from('categories').select('id').limit(1);
  return Response.json({ ok: !error });
}
