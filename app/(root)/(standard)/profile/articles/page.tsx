import { prisma } from '@/lib/prismaclient'
import { getUserFromCookies } from '@/lib/serverutils'
import { notFound, redirect } from 'next/navigation'
import ArticlesDashboard from './ui/ArticlesDashboard'

export default async function ArticlesPage() {
  const user = await getUserFromCookies()
  if (!user) redirect('/login') // or notFound()

  const raw = await prisma.article.findMany({
    where: { authorId: user.userId.toString() },
    orderBy: [{ updatedAt: 'desc' }],
    select: {
      id: true, title: true, slug: true, status: true,
      createdAt: true, updatedAt: true, heroImageKey: true, template: true,
    },
  })

  
const items = raw.map(a => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }))

//   const items = await prisma.article.findMany({
//     where: { authorId: user.userId.toString() },
//     orderBy: [{ updatedAt: 'desc' }],
//     select: {
//       id: true, title: true, slug: true, status: true,
//       createdAt: true, updatedAt: true, heroImageKey: true, template: true,
//     },
//   })

  return <ArticlesDashboard initialItems={items} />
}
