"use server";

import { supabase } from "@/lib/supabaseclient";
import { getUserFromCookies } from "@/lib/serverutils";

export interface Integration {
  id: string;
  service: string;
  credential: string;
}

export async function fetchIntegrations() {
  const user = await getUserFromCookies();
  if (!user) throw new Error("User not authenticated");
  const { data, error } = await supabase
    .from("integrations")
    .select("id, service, credential")
    .eq("user_id", user.userId);
  if (error) throw new Error(error.message);
  return data as Integration[];
}

export async function saveIntegration({
  service,
  credential,
}: {
  service: string;
  credential: string;
}) {
  const user = await getUserFromCookies();
  if (!user) throw new Error("User not authenticated");
  const { error } = await supabase.from("integrations").upsert({
    user_id: user.userId,
    service,
    credential,
  });
  if (error) throw new Error(error.message);
}

export async function deleteIntegration(id: string) {
  const user = await getUserFromCookies();
  if (!user) throw new Error("User not authenticated");
  const { error } = await supabase
    .from("integrations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.userId);
  if (error) throw new Error(error.message);
}
