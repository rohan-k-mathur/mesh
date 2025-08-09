// app/api/escrow/release/route.ts
import { prisma } from "@/lib/prismaclient";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_TOKEN}`) return new Response("forbidden", { status: 403 });

  const updated = await prisma.$executeRawUnsafe(`
    with c as (
      select id from orders
      where status = 'FULFILLED'
        and fulfilled_at <= now() - (hold_days || ' days')::interval
      for update skip locked
      limit 200
    )
    update orders o
    set status = 'RELEASED', released_at = now()
    from c
    where o.id = c.id
      and not exists (
        select 1 from disputes d
        where d.order_id = o.id and d.status in ('OPEN','ESCALATED')
      )
  `);

  return new Response(JSON.stringify({ updated }), { headers: { "Content-Type": "application/json" } });
}
