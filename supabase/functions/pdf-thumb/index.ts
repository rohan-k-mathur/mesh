// supabase/functions/pdf-thumb/index.ts
// deno-lint-ignore-file no-explicit-any
import { createClient } from "@supabase/supabase-js";


Deno.serve(async (req) => {
  try {
    const { bucket, path, libraryPostId, thumbBucket, thumbPath } = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const WORKER_URL   = Deno.env.get("THUMBER_URL")!; // e.g. https://your-worker.example.com/render
    const WORKER_TOKEN = Deno.env.get("THUMBER_BEARER")!;

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    // Get a 5-min signed URL for the source PDF
    const signed = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 5);
    if (!signed.data?.signedUrl) throw new Error("Failed to sign source PDF");

    // Ask the worker to render and upload to Supabase
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${WORKER_TOKEN}` },
      body: JSON.stringify({
        pdfUrl: signed.data.signedUrl,
        supabaseUrl: SUPABASE_URL,
        supabaseKey: SERVICE_KEY,
        thumbBucket,
        thumbPath, // e.g. pdf-thumbs/user_123/169..._file.png
      }),
    });
    if (!res.ok) throw new Error(`Worker error ${res.status}`);
    const { pageCount } = await res.json();

    // Build a public or signed URL for the new thumb; here we compute a public URL
    const publicUrl = supabase.storage.from(thumbBucket).getPublicUrl(thumbPath.replace(/^pdf-thumbs\//, "")).data.publicUrl;

    // Update DB row
    await supabase.from("library_posts").update({
      thumb_urls: [publicUrl],
      page_count: pageCount ?? 1,
    }).eq("id", libraryPostId);

    return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: { "content-type": "application/json" } });
  }
});
