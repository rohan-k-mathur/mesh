// lib/supabase-server.ts
import { cookies } from "next/headers";
import { createClient, type CookieOptions } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

/** Admin client (server-only) — uses SERVICE_ROLE; never expose to the browser */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-only
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

/** SSR client bound to auth cookies (if/when you need it) */
export function supabaseFromCookies() {
  const store = cookies(); // Next.js server cookies store
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          store.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          store.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );
}
