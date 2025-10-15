import { prisma } from '@/lib/prismaclient';
import { getUserFromCookies } from '@/lib/serverutils';
import { redirect } from 'next/navigation';
import WorksDashboard, { WorkItemCursor, WorkItem } from './ui/WorksDashboard';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 15;



// model TheoryWork {
//   id             String               @id @default(cuid())
//   deliberationId String
//   authorId       String
//   title          String
//   slug           String               @unique
//   summary        String?              @db.Text
//   body           String               @db.Text
//   theoryType     PhilosophyTheoryType
//   standardOutput String?

//   status     WorkStatus @default(DRAFT)
//   visibility String     @default("room") // room | org | public
//   tags       String[]   @default([])

//   // Publishing hooks
//   publishedAt DateTime?
//   lastExport  Json? // { kind:'sheet'|'kb'|'aif', ids:[...], at:ISO }

//   deliberation Deliberation @relation(fields: [deliberationId], references: [id], onDelete: Cascade)

//   // 1:1 “project” wrappers (guarded by theoryType at API)
//   dn WorkDnProject?
//   tc WorkTcProject?
//   op WorkOpProject?
//   ih WorkIhProject?

//   // 1:1 theses slots
//   WorkDNStructure WorkDNStructure?
//   WorkIHTheses    WorkIHTheses?
//   WorkTCTheses    WorkTCTheses?
//   WorkOPTheses    WorkOPTheses?

//   // Practical & auxiliary
//   practicalJustification WorkPracticalJustification? @relation("Work_Practical")
//   hermeneutic            WorkHermeneuticProject?     @relation("Work_to_HermeneuticProject")
//   pascal                 WorkPascalModel?            @relation("Work_to_PascalModel")

//   // Linking into claim graph & argumentation
//   relatedClaims TheoryWorkClaim[]
//   rules         Rule[]

//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt

//   @@index([deliberationId, theoryType, status, createdAt])
//   @@index([authorId, createdAt])
// }


export default async function WorksPage({ searchParams }:{
  searchParams?: Record<string, string | undefined>;
}) {
  const user = await getUserFromCookies();
  if (!user) redirect('/login');

  const userId = String(user.userId);
  const deliberationId = searchParams?.deliberationId || undefined;

  // Initial load = "My Works" (like Discussions' "mine" tab)
  const items = await prisma.theoryWork.findMany({
    where: { authorId: userId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: PAGE_SIZE + 1,
    select: {
      id: true,
      title: true,
      theoryType: true,
      createdAt: true,
      deliberationId: true,
      authorId: true,
      // If your model has updatedAt, you can also select it here.
      // updatedAt: true,
    },
  });

  const hasMore = items.length > PAGE_SIZE;
  const page = items.slice(0, PAGE_SIZE);

  const initialItems: WorkItem[] = page.map(i => ({
    id: i.id,
    title: i.title ?? "Untitled Work",
    theoryType: (i.theoryType as any) ?? null,
    createdAt: i.createdAt.toISOString(),
    deliberationId: i.deliberationId ?? null,
    createdById: i.authorId ?? null,
  }));

  const last = page[page.length - 1];
  const initialNextCursor: WorkItemCursor | null = hasMore
    ? { createdAt: last.createdAt.toISOString(), id: last.id }
    : null;

  return (
    <WorksDashboard
      initialItems={initialItems}
      initialNextCursor={initialNextCursor}
      pageSize={PAGE_SIZE}
      userId={userId}
      deliberationId={deliberationId ?? null}
    />
  );
}
