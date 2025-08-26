// app/briefs/[slug]/page.tsx (server component)
import { prisma } from '@/lib/prismaclient';
import { notFound } from 'next/navigation';
import BriefViewer from '@/components/briefs/BriefViewer';

export default async function BriefPublicPage({ params }:{ params: { slug: string } }) {
  const brief = await prisma.brief.findUnique({
    where: { slug: params.slug },
    include: {
      currentVersion: { include: { links: true } },
      versions: { include: { links: true }, orderBy: { number: 'asc' } },
    },
  });

  if (!brief || !brief.currentVersion) notFound();

  // ✅ Pass plain JSON into the client component
  return <BriefViewer brief={JSON.parse(JSON.stringify(brief))} />;
}
