import { NextRequest, NextResponse } from "next/server";
import { fetchPortfolioPage } from "@/lib/actions/portfolio.actions";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const page = await fetchPortfolioPage(params.slug);
  if (!page) {
    return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(page.css, {
    status: 200,
    headers: { "Content-Type": "text/css" },
  });
}
