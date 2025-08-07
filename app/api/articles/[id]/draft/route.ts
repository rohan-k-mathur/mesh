// app/api/articles/[id]/draft/route.ts
import { prisma } from '@/lib/prismaclient'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z
  .object({
    astJson: z.any(),
    template: z.string().optional(),
    heroImageKey: z.string().optional(),
  })
  .partial()                           // allow sparse payloads

  export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
  ) {
    // ↙ safeguard against empty body (avoids “Unexpected end of JSON”)
    const safeJson = async () => {
      try { return await req.json() } catch { return {} }
    }
    const body = await safeJson()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }
  
    await prisma.article.update({
      where: { id: params.id },
      data : { ...parsed.data, status: 'DRAFT' },
    })
  
    return NextResponse.json({ ok: true })
  }