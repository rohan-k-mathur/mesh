
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from '@/types/supabase';   
export const supabase = createPagesBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
);
