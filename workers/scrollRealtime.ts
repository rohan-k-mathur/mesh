import { createClient } from "@supabase/supabase-js";
import { Queue } from "bullmq";
import redis from "@/lib/redis";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const cfQueue = new Queue("scrollEvents", { connection: redis });

supabase
  .channel("user_behavior")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "scroll_events" },
    (payload) => {
      cfQueue.add("forward", payload.new);
    },
  )
  .subscribe();
