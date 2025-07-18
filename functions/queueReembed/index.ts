import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { Queue } from "https://esm.sh/bullmq@4";
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,   // ← use service-role here
  const queue = new Queue("reembed", {
  connection: { host: Deno.env.get("REDIS_HOST") ?? "127.0.0.1", port: 6379 },
}));

// const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
// const queue = new Queue("reembed", {
//   connection: { host: Deno.env.get("REDIS_HOST") ?? "127.0.0.1", port: 6379 },
// });

serve(async (req) => {
  const payload = await req.json();
  const userId = payload.record.user_id || payload.record.id;
  await queue.add("reembed", { userId });
  return new Response("ok");
});
