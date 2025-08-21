import { NextRequest, NextResponse } from "next/server";
import { generatePortfolioTemplates, PortfolioExportData } from "@/lib/portfolio/export";
import { createPortfolioPage, updatePortfolioPage } from "@/lib/actions/portfolio.actions";
import { upsertProfileSite } from "@/lib/actions/sites.actions";
import { screenshotPage } from "@/lib/screenshot";
import { uploadFileToSupabase } from "@/lib/utils";
import { getUserFromCookies } from "@/lib/server/getUser";   // ✅ use server-side auth
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

// add near top
function toBigIntish(v: unknown): bigint | null {
  if (v == null) return null;
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(v);
  if (typeof v === "string") {
    const s = v.endsWith("n") ? v.slice(0, -1) : v;
    if (/^\d+$/.test(s)) return BigInt(s);
  }
  return null;
}
type PublishPayload = PortfolioExportData & {
  // client *may* pass these, but we will fall back to server user
  ownerId?: number | bigint | string;
  meta?: { title?: string; caption?: string };
};
export async function POST(req: NextRequest) {

  const data = (await req.json()) as PublishPayload;

  const { html, css, tsx } = generatePortfolioTemplates(data);

  // 🔐 derive the user server-side; tolerate either id or userId shape
  const serverUser = await getUserFromCookies().catch(() => null);
  const derivedOwner =
    toBigIntish(data.ownerId) ??
    toBigIntish((serverUser as any)?.id) ??
    toBigIntish((serverUser as any)?.userId);

  // 1) create page and STORE owner_id too
  const slug = await createPortfolioPage({
    html,
    css,
    tsx,
    payload: { ...data },
    ownerId: derivedOwner ?? undefined, // new param; see patch B
  });
  
  // 2) screenshot + upload
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const pageUrl = `${base}/portfolio/${slug}`;
  const pngBuffer = await screenshotPage(pageUrl);
  const { fileURL: snapshot, error } = await uploadFileToSupabase(
    new File([pngBuffer], `portfolio/snap-${slug}.png`, { type: "image/png" })
  );
  if (error) throw error;

  await updatePortfolioPage(slug, { payload: { ...data, snapshot }, snapshot });

  // 3) upsert Sites entry (idempotent by slug)
  if (derivedOwner) {
    await upsertProfileSite({
      slug,
      ownerId: derivedOwner,                        // bigint now
      pageUrl: `/portfolio/${slug}`,
      snapshot: snapshot ?? null,
      title: data.meta?.title ?? null,
      caption: data.meta?.caption ?? null,
      isPublic: true,
    });
    try { revalidatePath("/profile/sites"); } catch {}
  } else {
    console.warn("Publish: missing ownerId; skipping profile_sites upsert", { slug });
  }

  return NextResponse.json({ url: `/portfolio/${slug}`, snapshot });
}