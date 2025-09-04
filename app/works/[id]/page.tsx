// app/works/[id]/page.tsx
import { prisma } from '@/lib/prismaclient';
import WorkDetailClient from '@/components/work/WorkDetailClient';

export default async function WorkDetailPage({ params }:{ params:{ id:string }}) {
  const work = await prisma.theoryWork.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      deliberationId: true,
      title: true,
      theoryType: true,
      standardOutput: true,
      createdAt: true,
      authorId: true,
    }
  });

  if (!work) {
    return <div className="max-w-3xl mx-auto p-4 text-sm">Work not found.</div>;
  }

  // Pass only serializable props to the client
  return (
    <WorkDetailClient
      id={work.id}
      deliberationId={work.deliberationId}
      title={work.title}
      theoryType={work.theoryType as 'DN'|'IH'|'TC'|'OP'}
      standardOutput={work.standardOutput ?? undefined}
    />
  );
}
