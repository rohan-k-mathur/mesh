import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import path from "path";
import { generatePortfolioTemplates, PortfolioExportData } from "@/lib/portfolio/export";

export async function POST(req: NextRequest) {
  const data = (await req.json()) as PortfolioExportData;
  const { html, css } = generatePortfolioTemplates(data);

  const zip = new JSZip();
  zip.file("index.html", html);
  zip.file("tailwind.css", css);

  const imagesFolder = zip.folder("images");
  if (imagesFolder) {
    for (const url of data.images) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          const name = path.basename(new URL(url).pathname);
          imagesFolder.file(name, buffer);
        }
      } catch (e) {
        console.error(`Failed to fetch ${url}`, e);
      }
    }
  }

  const content = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=portfolio.zip",
    },
  });
}
