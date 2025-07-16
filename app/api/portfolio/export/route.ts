import { NextRequest, NextResponse } from "next/server";
import { generatePortfolioTemplates, PortfolioExportData } from "@/lib/portfolio/export";
import { createPortfolioPage } from "@/lib/actions/portfolio.actions";

export async function POST(req: NextRequest) {
  const data = (await req.json()) as PortfolioExportData;
  const { html, css } = generatePortfolioTemplates(data);
  const slug = await createPortfolioPage({ html, css });
  return NextResponse.json({ url: `/portfolio/${slug}` });
}
