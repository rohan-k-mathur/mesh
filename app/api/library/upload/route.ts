// app/api/library/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/serverutils";
import { prisma } from "@/lib/prismaclient";
import { supabaseAdmin } from "@/lib/supabase-server";
function sanitizeKey(name: string) {
  // keep ascii letters/digits/._- ; collapse others to _
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    // 1) who is uploading?
    const devHeader = req.headers.get("x-dev-user-id");
    let uploaderId: bigint | null = null;

    const u = await getUserFromCookies().catch(() => null);
    if (u?.userId) uploaderId = BigInt(u.userId);
    if (!uploaderId && devHeader) {
      // DEV ONLY: header override
      uploaderId = BigInt(devHeader);
    }
    if (!uploaderId) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const isPublic = String(form.get("isPublic") ?? "true") === "true";
    const caption = (form.get("caption") as string) || undefined;
    const stackIdIn = (form.get("stackId") as string) || null;
    const stackName = (form.get("stackName") as string) || "Untitled Stack";

    const files = form.getAll("files").filter(Boolean) as File[];
    if (!files.length) {
      return NextResponse.json({ error: "No files" }, { status: 400 });
    }

    const supa = supabaseAdmin(); // ✅ no @supabase/ssr, no cookie adapter needed
        const pdfBucket = "pdfs"; // make sure this exists
    const now = Date.now();

    // 2) create stack if multiple uploads and no stackId provided
    let stackId = stackIdIn;
    if (!stackId && files.length > 1) {
      const stack = await prisma.stack.create({
        data: {
          owner_id: uploaderId,
          name: stackName,
          is_public: isPublic,
          order: [], // you can fill after creating posts
        },
        select: { id: true },
      });
      stackId = stack.id;
    }

    // 3) upload each pdf and create library_posts
    const postIds: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const safe = sanitizeKey(f.name || `file_${now}_${i}.pdf`);
      const key = `user_${uploaderId}/${now}_${safe}`;

      const { error: upErr } = await supa.storage
        .from(pdfBucket)
        .upload(key, f, {
          contentType: f.type || "application/pdf",
          upsert: false,
        });

      if (upErr) {
        return NextResponse.json({ error: upErr.message }, { status: 500 });
      }

      // public URL (or use signed URL if you prefer)
      const { data: pub } = supa.storage.from(pdfBucket).getPublicUrl(key);

      const lp = await prisma.libraryPost.create({
        data: {
          uploader_id: uploaderId,
          stack_id: stackId || undefined,
          title: f.name || null,
          page_count: 0,         // will update after thumbnailer runs
          file_url: pub.publicUrl,
          thumb_urls: [],        // will fill later
        },
        select: { id: true },
      });

      postIds.push(lp.id);
    }

    // optional: kick a thumbnailer (edge function / worker)
    // if (process.env.THUMBER_URL && process.env.THUMBER_BEARER) { ... }

    // return IDs so the client can create a feed row with FKs
    return NextResponse.json({ postIds, stackId, caption, isPublic });
  } catch (e: any) {
    console.error("[library/upload] error", e);
    return NextResponse.json(
      { error: e?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
