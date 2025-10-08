// app/api/library/import/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/serverutils";
import { prisma } from "@/lib/prismaclient";
import { supabaseAdmin } from "@/lib/supabase-server";
import { assertCanEditStack } from "@/lib/actions/stack.actions";
import { getOrCreateStackId } from "@/lib/server/stack-helpers";

function sanitizeFileName(name: string, ext = ".pdf") {
  const base = name.replace(/\.pdf$/i, "")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const ascii = base.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/_+/g, "_");
  const trimmed = ascii.replace(/^[_\.]+|[_\.]+$/g, "");
  return (trimmed || "document") + ext;
}

function dataUrlToBuffer(dataUrl: string): { buf: Buffer; mime: string } | null {
  const m = /^data:([^;]+);base64,(.*)$/i.exec(dataUrl);
  if (!m) return null;
  return { mime: m[1], buf: Buffer.from(m[2], "base64") };
}

function buildKey(userId: bigint | number | string, rawName: string) {
  const safe = sanitizeFileName(rawName);
  return `user_${userId}/${Date.now()}_${safe}`;
}

export async function POST(req: NextRequest) {
  
  try {
    const supabase = supabaseAdmin();
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const payload = await req.json();
    const objects      = payload.objects ?? [];
    const externalUrls = payload.externalUrls ?? [];
    const previews     = Array.isArray(payload.previews) ? payload.previews : []; // string|null[]
    const stackIdParam = payload.stackId ?? null;
    const stackName    = payload.stackName ?? "My Library";
    const isPublic     = payload.isPublic ?? true;

        if (stackIdParam) {
      try {
        await assertCanEditStack(stackIdParam, userId);
      } catch (e: any) {
        return NextResponse.json({ error: e?.message || "Forbidden" }, { status: 403 });
      }
    }
    const stackId = await getOrCreateStackId({
      ownerId: userId,
      stackId: stackIdParam ?? undefined,
      stackName,
      isPublic,
    });


    const postIds: string[] = [];

    // A) Handle uploaded objects (from /upload)
    for (const obj of objects as Array<{ bucket: string; path: string; title?: string; thumbPath?: string }>) {
      let thumbUrl: string | null = null;
      if (obj.thumbPath) {
        thumbUrl = supabase.storage.from("pdf-thumbs").getPublicUrl(obj.thumbPath).data.publicUrl ?? null;
      }
      const created = await prisma.libraryPost.create({
        data: {
          uploader_id: userId,
          stack_id: stackId!,
                    title: obj.title ?? null,
          page_count: 1,
          file_url: obj.path,           // storage key in "pdfs"
          thumb_urls: thumbUrl ? [thumbUrl] : [],
        },
        select: { id: true },
      });
      postIds.push(created.id);
    }
   // Merge new postIds into display order so they appear in the grid
   if (stackId && postIds.length) {
     const existing = await prisma.stack.findUnique({
       where: { id: stackId },
       select: { order: true },
     });
     const prev = existing?.order ?? [];
     const next = Array.from(new Set([...postIds, ...prev]));
     await prisma.stack.update({
       where: { id: stackId },
       data: { order: next },
     });
  }

    // B) Handle external URLs (download → upload → create rows)
//     for (const url of externalUrls as string[]) {
//       const resp = await fetch(url);
//       if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
//       const ab = await resp.arrayBuffer();
  
//       const nameGuess =
//         url.split("?")[0].split("#")[0].split("/").pop() || "document.pdf";
//       const pdfKey = buildKey(userId, nameGuess);         // ← sanitized key

//    const up = await supabase.storage.from("pdfs").upload(pdfKey, Buffer.from(ab), { contentType: "application/pdf", upsert: true }
//    );
//    if (up.error) throw new Error(up.error.message);
//    const { data: pub } = supabase.storage.from("pdfs").getPublicUrl(pdfKey);
//    const publicUrl = pub?.publicUrl ?? up.data.path; // fallback if bucket is private
 
//   const created = await prisma.libraryPost.create({
//         data: {
//           uploader_id: userId,
//           stack_id: stackId!,
//           title: nameGuess,
//           page_count: 0,                        // worker updates it
//       file_url: supabase.storage.from("pdfs").getPublicUrl(pdfKey).data.publicUrl ?? up.data.path,
//           thumb_urls: [],
//         },
//         select: { id: true },
//       });
//       postIds.push(created.id);
       
//    // 🔔 Kick off server-side thumbnailing
//    try {
//      const thumbPath = pdfKey.replace(/\.pdf$/i, ".png");
//      await supabase.functions.invoke("pdf-thumb", {
//        body: {
//          bucket: "pdfs",
//          path: pdfKey,
//          libraryPostId: created.id,
//          thumbBucket: "pdf-thumbs",
//          thumbPath,
//        },
//      });
//    } catch (e) {
//      console.warn("[import] pdf-thumb invoke failed:", (e as any)?.message || e);
//    }
//  }
for (let i = 0; i < (externalUrls as string[]).length; i++) {
  const url = externalUrls[i];
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
  const ab = await resp.arrayBuffer();

  const nameGuess = url.split("?")[0].split("#")[0].split("/").pop() || "document.pdf";
  const pdfKey = buildKey(userId, nameGuess);

  const up = await supabase.storage.from("pdfs").upload(pdfKey, Buffer.from(ab), {
    contentType: "application/pdf",
    upsert: true,
  });
  if (up.error) throw new Error(up.error.message);

  const publicUrl = supabase.storage.from("pdfs").getPublicUrl(pdfKey).data.publicUrl ?? up.data.path;

  const created = await prisma.libraryPost.create({
    data: {
      uploader_id: userId,
      stack_id: stackId!,
      title: nameGuess,
      page_count: 0,
      file_url: publicUrl,
      thumb_urls: [],
    },
    select: { id: true },
  });
  postIds.push(created.id);
  //    // 🔔 Kick off server-side thumbnailing
//    try {
//      const thumbPath = pdfKey.replace(/\.pdf$/i, ".png");
//      await supabase.functions.invoke("pdf-thumb", {
//        body: {
//          bucket: "pdfs",
//          path: pdfKey,
//          libraryPostId: created.id,
//          thumbBucket: "pdf-thumbs",
//          thumbPath,
//        },
//      });
//    } catch (e) {
//      console.warn("[import] pdf-thumb invoke failed:", (e as any)?.message || e);
//    }

  // If the client produced a preview for this URL, upload it now.
  const preview = previews[i];
  if (typeof preview === "string") {
    const parsed = dataUrlToBuffer(preview);
    if (parsed) {
      const pngKey = pdfKey.replace(/\.pdf$/i, ".png");
      const th = await supabase.storage.from("pdf-thumbs").upload(pngKey, parsed.buf, {
        contentType: parsed.mime || "image/png",
        upsert: true,
      });
      if (!th.error) {
        const pub = supabase.storage.from("pdf-thumbs").getPublicUrl(pngKey).data.publicUrl;
        await prisma.libraryPost.update({
          where: { id: created.id },
          data: { thumb_urls: pub ? [pub] : [] },
        });
      }
    }
  }
}

    // Create feed post after processing all external URLs
    if (stackId && postIds.length > 0) {
      const stackInfo = await prisma.stack.findUnique({
        where: { id: stackId },
        select: { is_public: true, name: true },
      });
      await prisma.feedPost.create({
        data: {
          author_id: userId,
          type: "TEXT",
          isPublic: stackInfo?.is_public ?? true,
          content: `added ${postIds.length} item${postIds.length > 1 ? "s" : ""} to`,
          stack_id: stackId,
          caption: stackInfo?.name,
        },
      });
    }

    return NextResponse.json({ stackId, postIds });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Internal error" }, { status: 500 });
  }
}
