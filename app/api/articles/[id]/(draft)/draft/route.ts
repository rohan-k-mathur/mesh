// app/api/articles/[id]/draft/route.ts
import { prisma } from '@/lib/prismaclient'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserFromCookies } from '@/lib/serverutils'
// app/api/articles/[id]/draft/route.ts
const schema = z.object({
  astJson: z.any().optional(),
  template: z.string().optional(),
  heroImageKey: z.string().nullable().optional(),
  title: z.string().min(1).max(200).optional(),   // ⬅️ add this
}).partial()          

  export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
  ) {
    const user = await getUserFromCookies()
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })



  const safe = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(safe)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
 // check ownership first
 const a = await prisma.article.findUnique({ where: { id: params.id } })
 if (!a || a.authorId !== user.userId.toString()) {
   return NextResponse.json({ error: 'Not found' }, { status: 404 })
 }

 await prisma.article.update({
   where: { id: params.id },
   data : parsed.data,
 })

 return NextResponse.json({ ok: true })
}
// }
//     // ↙ safeguard against empty body (avoids “Unexpected end of JSON”)
//     const safeJson = async () => {
//       try { return await req.json() } catch { return {} }
//     }
//     const body = await safeJson()
//     const parsed = schema.safeParse(body)
//     if (!parsed.success) {
//       return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
//     }
//     const a = await prisma.article.findUnique({ where: { id: params.id } })
//   if (!a || a.authorId !== user.userId.toString()) {
//     return NextResponse.json({ error: 'Not found' }, { status: 404 })
//   }


//   // ✔ do NOT force status back to DRAFT here
//   await prisma.article.update({
//     where: { id: params.id },
//     data : { ...parsed.data },
//   })

//   return NextResponse.json({ ok: true })
// }
// }
//     await prisma.article.update({
//       where: { id: params.id },
//       data : { ...parsed.data, status: 'DRAFT' },
//     })
//     if (!parsed.success) {
//       console.error(parsed.error.flatten())
//       return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
//     }
  
//     return NextResponse.json({ ok: true })
//   }