'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';

const Ctx = createContext<{ count: number; refresh: () => Promise<void> }>({
  count: 0,
  refresh: async () => {},
});

export const useCart = () => useContext(Ctx);

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setCount(0);
      return;
    }
    const { data } = await supabase().from('cart_items').select('quantity').eq('user_id', user.id);
    setCount((data ?? []).reduce((sum: number, r: { quantity: number }) => sum + r.quantity, 0));
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <Ctx.Provider value={{ count, refresh }}>{children}</Ctx.Provider>;
}
