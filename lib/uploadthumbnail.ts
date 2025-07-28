import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Upload a thumbnail for a stall, return its public URL
 *
 * @param file     – *already* the compressed image blob (if you compress)
 * @param stallId  – bigint ID of the stall
 */
export async function uploadStallThumb(
  file: File,
  stallId: bigint
): Promise<string> {
  // 1 · deterministic filename keeps bucket tidy
  const filename = `${stallId}-${crypto.randomUUID()}.${file.type.split("/")[1]}`;

  // 2 · upload to the “stall-thumbs” bucket
  const { error } = await supabase.storage
    .from("stall-images")
    .upload(filename, file, {
      cacheControl: "3600",
      upsert: false,          // change to true if you want to overwrite
      contentType: file.type
    });

  if (error) throw new Error(error.message);

  // 3 · get a public URL from the SDK (bucket must be public)
  const { data } = supabase
    .storage
    .from("stall-images")
    .getPublicUrl(filename);

  if (!data?.publicUrl) throw new Error("Could not obtain public URL");
  return data.publicUrl;     // save this in `stall_image.url`
}
