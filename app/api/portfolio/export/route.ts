import { NextRequest, NextResponse } from "next/server";
import { generatePortfolioTemplates, PortfolioExportData } from "@/lib/portfolio/export";
import { createPortfolioPage } from "@/lib/actions/portfolio.actions";

// const { html, css, tsx } = generatePortfolioTemplates(data);

// await createPortfolioPage({
//   html,
//   css,
//   tsx,          // NEW (can be undefined)
// });


export async function POST(req: NextRequest) {
  const data = (await req.json()) as PortfolioExportData;
  
  const { html, css, tsx } = generatePortfolioTemplates(data);

  const slug = await createPortfolioPage({ html, css, tsx });

  return NextResponse.json({ url: `/portfolio/${slug}` });
}
