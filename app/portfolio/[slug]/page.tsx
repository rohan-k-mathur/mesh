import { prisma } from "@/lib/prismaclient";
import dynamic from "next/dynamic";
import CanvasRenderer from "@/lib/components/CanvasRenderer";

/* Use a client component for Image, or keep this as an RSC and let <Image> be its own client boundary. */

export default async function PortfolioPage({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const rec = await prisma.portfolioPage.findUnique({
    where: { slug },
    select: {
      html: true,
      css: true,
      tsx: true,
      /* payload is whatever you stored; assuming ‘payload’ JSON column: */
      payload: true,
    },
  });

  if (!rec) return <p className="p-12 text-center">Not found.</p>;

   const payload = rec.payload as any;

  /* 1️⃣  Prefer ‘snapshot’ */
  if (payload?.snapshot) {
    return (
      <img
        src={payload.snapshot}
        alt="Portfolio snapshot"
        className="max-w-full h-auto block mx-auto my-8"
      />
    );
  }

  /* 2️⃣  Render free‑layout JSON */
  if (payload?.layout === "free" && payload.absolutes?.length) {
    return (
      <CanvasRenderer
        elements={payload.absolutes}
        bgClass={payload.color}
      />
    );
  }

  /* 3️⃣  Fallback to pre‑baked HTML (column / grid) */
  return (
    <div
      dangerouslySetInnerHTML={{ __html: rec.html }}
      /* Or stream from rec.html file on disk, same as before */
    />
  );
}
