// app/deliberation/[id]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prismaclient";
import NextLink from "next/link";
import DeliberationReader from "../components/DeliberationPage";
import { GridBG } from "@/components/ui/GridBG";

export default async function DeliberationPage({
  params,
}: {
  params: { id: string };
}) {


  // Ensure the deliberation exists
  const delib = await prisma.deliberation.findUnique({
    where: { id: params.id },
    select: { id: true, hostType: true, hostId: true },
  });
  if (!delib) notFound();

  // If this delib is hosted by an article, fetch slug/title for a back-link
  const article =
    delib.hostType === "article"
      ? await prisma.article.findUnique({
          where: { id: delib.hostId },
          select: { slug: true, title: true },
        })
      : null;

 return (
    // 1. Make this div the positioning context. It will now grow with its content.
    <div className="relative w-full">
      <GridBG />

   
      {/* 2. Wrap your page content to control its stacking order. */}
      <div className="relative z-10 mt-4">
        <DeliberationReader deliberationId={delib.id} />
        {article && (
          <NextLink
            href={`/article/${article.slug}`}
            className="absolute text-xs font-semibold ml-12 left-0 top-0  btnv2"
            prefetch
          >
            ← Return{article.title ? `: ${article.title}` : ""}
          </NextLink>
        )}
      </div>
    </div>
  );
}