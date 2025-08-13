// app/api/library/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/serverutils";
import { prisma } from "@/lib/prismaclient";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUserId } from "@/lib/serverutils";

function sanitizeKey(name: string) {
  // keep ascii letters/digits/._- ; collapse others to _
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// --- helpers ---------------------------------------------------------------

function safeFileName(name: string) {
  // keep letters, numbers, dots and dashes; normalize spaces and slashes
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseBool(v: FormDataEntryValue | null | undefined, fallback = false) {
  if (typeof v !== "string") return fallback;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}

function parsePreviews(fd: FormData): string[] {
  const raw = fd.get("previews");
  if (!raw || typeof raw !== "string") return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s: any) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function dataUrlToBuffer(dataUrl: string): { buf: Buffer; mime: string } | null {
  const m = /^data:([^;]+);base64,(.*)$/i.exec(dataUrl);
  if (!m) return null;
  const mime = m[1];
  const buf = Buffer.from(m[2], "base64");
  return { buf, mime };
}

// export async function POST(req: NextRequest) {
//   try {
//     const form = await req.formData();

//     // 1) who is uploading?
//     const devHeader = req.headers.get("x-dev-user-id");
//     let uploaderId: bigint | null = null;

//     const u = await getUserFromCookies().catch(() => null);
//     if (u?.userId) uploaderId = BigInt(u.userId);
//     if (!uploaderId && devHeader) {
//       // DEV ONLY: header override
//       uploaderId = BigInt(devHeader);
//     }
//     if (!uploaderId) {
//       return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
//     }

//     const isPublic = String(form.get("isPublic") ?? "true") === "true";
//     const caption = (form.get("caption") as string) || undefined;
//     const stackIdIn = (form.get("stackId") as string) || null;
//     const stackName = (form.get("stackName") as string) || "Untitled Stack";

//     const files = form.getAll("files").filter(Boolean) as File[];
//     if (!files.length) {
//       return NextResponse.json({ error: "No files" }, { status: 400 });
//     }

//     const supa = supabaseAdmin(); // ✅ no @supabase/ssr, no cookie adapter needed
//         const pdfBucket = "pdfs"; // make sure this exists
//     const now = Date.now();

//     // 2) create stack if multiple uploads and no stackId provided
//     let stackId = stackIdIn;
//     if (!stackId && files.length > 1) {
//       const stack = await prisma.stack.create({
//         data: {
//           owner_id: uploaderId,
//           name: stackName,
//           is_public: isPublic,
//           order: [], // you can fill after creating posts
//         },
//         select: { id: true },
//       });
//       stackId = stack.id;
//     }

//     // 3) upload each pdf and create library_posts
//     const postIds: string[] = [];
//     for (let i = 0; i < files.length; i++) {
//       const f = files[i];
//       const safe = sanitizeKey(f.name || `file_${now}_${i}.pdf`);
//       const key = `user_${uploaderId}/${now}_${safe}`;

//       const { error: upErr } = await supa.storage
//         .from(pdfBucket)
//         .upload(key, f, {
//           contentType: f.type || "application/pdf",
//           upsert: false,
//         });

//       if (upErr) {
//         return NextResponse.json({ error: upErr.message }, { status: 500 });
//       }

//       // public URL (or use signed URL if you prefer)
//       const { data: pub } = supa.storage.from(pdfBucket).getPublicUrl(key);

//       const lp = await prisma.libraryPost.create({
//         data: {
//           uploader_id: uploaderId,
//           stack_id: stackId || undefined,
//           title: f.name || null,
//           page_count: 0,         // will update after thumbnailer runs
//           file_url: pub.publicUrl,
//           thumb_urls: [],        // will fill later
//         },
//         select: { id: true },
//       });

//       postIds.push(lp.id);
//     }

//     // optional: kick a thumbnailer (edge function / worker)
//     // if (process.env.THUMBER_URL && process.env.THUMBER_BEARER) { ... }

//     // return IDs so the client can create a feed row with FKs
//     return NextResponse.json({ postIds, stackId, caption, isPublic });
//   } catch (e: any) {
//     console.error("[library/upload] error", e);
//     return NextResponse.json(
//       { error: e?.message || "Upload failed" },
//       { status: 500 }
//     );
//   }
// }

// --- route -----------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    // Identify user (Firebase cookie) — dev override header allowed
    const devHeader = req.headers.get("x-dev-user-id");
    let userId = devHeader ? BigInt(devHeader) : await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const form = await req.formData();

    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const previews = parsePreviews(form); // optional data URLs aligned with files
    const isPublic = parseBool(form.get("isPublic"), true);
    const stackName = (form.get("stackName") as string) || "";
    let stackId = (form.get("stackId") as string) || "";

    const supabase = supabaseAdmin(); // service-role client

    // Create a stack if needed (multiple files or explicit stackName)
    if (!stackId && (files.length > 1 || stackName)) {
      const name =
        stackName ||
        `Uploads ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
      const stack = await prisma.stack.create({
        data: {
          owner_id: userId,
          name,
          is_public: isPublic,
          order: [], // we’ll fill after we know all post IDs
        },
        select: { id: true },
      });
      stackId = stack.id;
    }

    const postIds: string[] = [];
    const coverUrls: string[] = [];

    // Upload + DB create for each file
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const ext = (f.name.split(".").pop() || "pdf").toLowerCase();
      if (ext !== "pdf") {
        return NextResponse.json({ error: `Only PDF allowed: ${f.name}` }, { status: 400 });
      }

      const baseKey = `user_${userId}/${Date.now()}_${safeFileName(f.name)}`;
      const pdfKey = baseKey.endsWith(".pdf") ? baseKey : `${baseKey}.pdf`;

      // Upload PDF
      const ab = await f.arrayBuffer();
      const { error: upErr } = await supabase.storage
        .from("pdfs")
        .upload(pdfKey, Buffer.from(ab), {
          contentType: "application/pdf",
          upsert: false,
        });
      if (upErr) {
        console.error("[upload] pdf error", upErr);
        return NextResponse.json({ error: upErr.message || "Upload failed" }, { status: 500 });
      }

      const { data: pubPdf } = supabase.storage.from("pdfs").getPublicUrl(pdfKey);
      const fileUrl = pubPdf?.publicUrl ?? "";

      // Optional preview upload (so feed can show real CDN thumbs immediately)
      let thumbUrl: string | undefined;
      const preview = previews[i];
      if (preview) {
        const parsed = dataUrlToBuffer(preview);
        if (parsed) {
          // Produce a parallel key in pdf-thumbs
          const pngKey =
            pdfKey.replace(/\.pdf$/i, ".png") ||
            `${baseKey}.png`;

          const { error: thErr } = await supabase.storage
            .from("pdf-thumbs")
            .upload(pngKey, parsed.buf, {
              contentType: parsed.mime || "image/png",
              upsert: true,
            });

          if (!thErr) {
            const { data: pubPng } = supabase.storage.from("pdf-thumbs").getPublicUrl(pngKey);
            thumbUrl = pubPng?.publicUrl;
          } else {
            console.warn("[upload] thumb upload failed", thErr.message);
          }
        }
      }

      // Create LibraryPost
      const lp = await prisma.libraryPost.create({
        data: {
          uploader_id: userId,
          stack_id: stackId || null,
          title: f.name,
          page_count: 0, // worker/edge will update later
          file_url: fileUrl,
          thumb_urls: thumbUrl ? [thumbUrl] : [],
        },
        select: { id: true, thumb_urls: true },
      });

      postIds.push(lp.id);
      // Use uploaded thumb if present; otherwise fall back to nothing (UI already shows a placeholder)
      if (lp.thumb_urls?.[0]) coverUrls.push(lp.thumb_urls[0]);
    }

    // If we created a new stack, set its display order (newest first)
    if (stackId && postIds.length) {
      await prisma.stack.update({
        where: { id: stackId },
        data: { order: postIds },
      });
    }

    // Response that the modal can use to create a real feed post right away
    return NextResponse.json({
      ok: true,
      stackId: stackId || null,
      postIds,
      coverUrls, // aligned with files; use these for initial card covers
    });
  } catch (err: any) {
    console.error("[library/upload] error", err);
    return NextResponse.json(
      { error: String(err?.message || err || "Unknown error") },
      { status: 500 }
    );
  }
}