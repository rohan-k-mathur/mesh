import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Queue } from "https://esm.sh/bullmq@4";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
const queue = new Queue("reembed", {
  connection: { host: Deno.env.get("REDIS_HOST") ?? "127.0.0.1", port: 6379 },
});

serve(async (req) => {
  const payload = await req.json();
  const userId = payload.record.user_id || payload.record.id;
  await queue.add("reembed", { userId });
  return new Response("ok");
});
