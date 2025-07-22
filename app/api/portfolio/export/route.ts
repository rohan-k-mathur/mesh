import { NextRequest, NextResponse } from "next/server";
import { generatePortfolioTemplates, PortfolioExportData } from "@/lib/portfolio/export";
import { createPortfolioPage } from "@/lib/actions/portfolio.actions";
import { screenshotPage } from "@/lib/screenshot";

import { getUserFromCookies } from "@/lib/serverutils";
import { createRealtimePost } from "@/lib/actions/realtimepost.actions";
import { uploadFileToSupabase } from "@/lib/utils";
export const runtime = "nodejs";       // make sure Playwright can run

// const { html, css, tsx } = generatePortfolioTemplates(data);

// await createPortfolioPage({
//   html,
//   css,
//   tsx,          // NEW (can be undefined)
// });


export async function POST(req: NextRequest) {
  const data = (await req.json()) as PortfolioExportData;
  // const user  = await getUserFromCookies();   // safe here



  const { html, css, tsx } = generatePortfolioTemplates(data);

  const slug = await createPortfolioPage({ html, css, tsx });

    /* 2) render → screenshot */
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const pageUrl = `${base}/portfolio/${slug}`;

    const pngBuffer = await screenshotPage(pageUrl);
  const fileName  = `portfolio/snap-${slug}.png`;
  const { fileURL: snapshot, error } = await uploadFileToSupabase(
    new File([pngBuffer], fileName, { type: "image/png" })
  );
  if (error) throw error;

  /* 3) respond with everything the client needs */
  return NextResponse.json({
    url: `/portfolio/${slug}`,
    snapshot,
    snapshotWidth: 800,   // match viewport you passed to screenshotPage
    snapshotHeight: 1200,
  });
}
