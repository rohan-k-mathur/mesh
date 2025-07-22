import { NextRequest, NextResponse } from "next/server";
import { generatePortfolioTemplates, PortfolioExportData } from "@/lib/portfolio/export";
import { createPortfolioPage } from "@/lib/actions/portfolio.actions";
import { getUserFromCookies } from "@/lib/serverutils";
import { createRealtimePost } from "@/lib/actions/realtimepost.actions";
// const { html, css, tsx } = generatePortfolioTemplates(data);

// await createPortfolioPage({
//   html,
//   css,
//   tsx,          // NEW (can be undefined)
// });


export async function POST(req: NextRequest) {
  const data = (await req.json()) as PortfolioExportData;
  const user  = await getUserFromCookies();   // safe here

  const { html, css, tsx } = generatePortfolioTemplates(data);

  const slug = await createPortfolioPage({ html, css, tsx });

  return NextResponse.json({ url: `/portfolio/${slug}` });
}
