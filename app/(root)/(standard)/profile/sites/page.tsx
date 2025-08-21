import { prisma } from '@/lib/prismaclient';
import { getUserFromCookies } from '@/lib/serverutils';
import { redirect } from 'next/navigation';
import SitesDashboard from './ui/SitesDashboard';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 15;

export default async function SitesPage() {
  const user = await getUserFromCookies();
  if (!user) redirect('/login');

  const rows = await prisma.portfolioPage.findMany({
    where: { owner_id: BigInt(user.userId) },
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    take: PAGE_SIZE + 1,
    select: { id: true, slug: true, created_at: true, snapshot: true },
  });

  const page = rows.slice(0, PAGE_SIZE);
  const initialItems = page.map(p => ({
    id: p.id.toString(),
    slug: p.slug,
    created_at: p.created_at.toISOString(),
    snapshot: p.snapshot ?? null,
  }));

  return <SitesDashboard initialItems={initialItems} />;
}
