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

  // Fetch the host object to get its name/title
  let hostName: string | null = null;

  if (delib.hostType === "article") {
    const article = await prisma.article.findUnique({
      where: { id: delib.hostId },
      select: { slug: true, title: true },
    });
    hostName = article?.title ?? null;
  } else if (delib.hostType === "post") {
    const post = await prisma.post.findUnique({
      where: { id: delib.hostId },
      select: { title: true, textContent: true },
    });
    hostName = post?.title ?? post?.textContent?.slice(0, 50) ?? null;
  } else if (delib.hostType === "room_thread") {
    const thread = await prisma.roomThread.findUnique({
      where: { id: delib.hostId },
      select: { title: true },
    });
    hostName = thread?.title ?? null;
  }

  // If this delib is hosted by an article, fetch slug for a back-link
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