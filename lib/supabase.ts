// lib/supabase.ts
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';   // generated types optional

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
