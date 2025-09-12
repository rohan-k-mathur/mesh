
 import { NextRequest, NextResponse } from 'next/server'
 import { z } from 'zod'
 import { prisma } from '@/lib/prismaclient'
 

 const Query = z.object({
   deliberationId: z.string().min(5),
   targetId: z.string().min(5),
 })
 
 export async function GET(req: NextRequest) {

   const url = new URL(req.url)
   const qs = Object.fromEntries(url.searchParams)
   const parsed = Query.safeParse(qs)
   if (!parsed.success) {
     return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
   }
   const { deliberationId, targetId } = parsed.data
 
   const rows = await prisma.dialogueMove.findMany({
     where: {
       deliberationId,
       targetId,
       kind: { in: ['WHY', 'GROUNDS'] },
     },
     orderBy: { createdAt: 'asc' },
     select: { kind: true, payload: true, createdAt: true },
   })
 
   type Row = { kind: 'WHY' | 'GROUNDS'; payload: any; createdAt: Date }
   const latestByKey = new Map<string, Row>()
 
   for (const r of rows as Row[]) {
     const key =
       String(r?.payload?.cqId ?? r?.payload?.schemeKey ?? 'default')
     const prev = latestByKey.get(key)
     if (!prev || r.createdAt > prev.createdAt) latestByKey.set(key, r)
   }
 
   const cqOpen = Array.from(latestByKey.entries())
     .filter(([, v]) => v.kind === 'WHY')
     .map(([k]) => k)
 
   return NextResponse.json({ ok: true, cqOpen })
 }
