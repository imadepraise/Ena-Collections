'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

type Profile = { full_name: string | null; phone: string | null; role: 'customer' | 'admin' };
type Ctx = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = supabase();

    async function load(u: User | null) {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const { data } = await sb
        .from('profiles')
        .select('full_name,phone,role')
        .eq('id', u.id)
        .maybeSingle();
      setProfile((data as Profile) ?? null);
      setLoading(false);
    }

    sb.auth.getSession().then(({ data }) => load(data.session?.user ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      // run outside the callback so Supabase calls cannot deadlock
      setTimeout(() => load(session?.user ?? null), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase().auth.signOut();
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthCtx.Provider value={{ user, profile, loading, signOut }}>{children}</AuthCtx.Provider>
  );
}
