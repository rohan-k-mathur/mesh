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

function buildKey(userId: bigint | number | string, rawName: string) {
  const safe = sanitizeFileName(rawName);
  return `user_${userId}/${Date.now()}_${safe}`;
}

export async function POST(req: NextRequest) {
  
  try {
    const supabase = supabaseAdmin();
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const {
      objects = [],
      externalUrls = [],
      stackId: stackIdParam = null,
      stackName = "My Library",
      isPublic = true,
      // caption is ignored here; the feed post is created client-side
    } = await req.json();

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

    // B) Handle external URLs (download → upload → create rows)
    for (const url of externalUrls as string[]) {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
      const ab = await resp.arrayBuffer();
  
      const nameGuess =
        url.split("?")[0].split("#")[0].split("/").pop() || "document.pdf";
      const pdfKey = buildKey(userId, nameGuess);         // ← sanitized key
  
      const up = await supabase.storage.from("pdfs").upload(pdfKey, Buffer.from(ab), {
        contentType: "application/pdf",
        upsert: true,
      });
      if (up.error) throw new Error(up.error.message);
  
      const created = await prisma.libraryPost.create({
        data: {
          uploader_id: userId,
          stack_id: stackId!,
          title: nameGuess,
          page_count: 1,
          file_url: up.data.path,
          thumb_urls: [],
        },
        select: { id: true },
      });
      postIds.push(created.id);
    }
  

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
    console.error("IMPORT_ERR:", e);
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
