// lib/auth.ts  (or lib/supabase-server.ts)
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

export function getSupabaseServerClient() {
  const store = cookies();                        // request‑scoped cookie store

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /** read a single cookie value */
        get(name) {
          return store.get(name)?.value;
        },

        /** set/overwrite a cookie */
        set(name, value, options: CookieOptions) {
          store.set({ name, value, ...options });  // ResponseCookie shape
        },

        /** remove a cookie */
        remove(name, options: CookieOptions) {
          // Supabase calls remove with { path: '/' } by default
          store.delete({ name, ...options });
        }
      }
    }
  );
}