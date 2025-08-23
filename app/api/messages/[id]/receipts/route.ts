import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";
 import { z } from "zod";


 const qp = z.object({
       latest: z.coerce.boolean().optional(),
     });


// export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
//   const me = await getUserFromCookies();
//   if (!me?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const messageId = BigInt(params.id);
//   const rows = await prisma.mergeReceipt.findMany({
//     where: { message_id: messageId },
//     orderBy: { merged_at: "asc" }, // oldest→newest so index is vN
//     select: { id: true, version_hash: true, merged_by: true, merged_at: true, signature: true }
//   });
//   const items = rows.map((r, i) => ({
//     id: r.id, v: i   1, versionHash: r.version_hash,
//     mergedBy: r.merged_by.toString(), mergedAt: r.merged_at,
//     signature: r.signature
//   }));
//   return NextResponse.json({ items, latest: items.at(-1) ?? null });
// }

 export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
       const messageId = BigInt(params.id);
       const { latest } = qp.parse(Object.fromEntries(req.nextUrl.searchParams));
       const receipts = await prisma.mergeReceipt.findMany({
         where: { message_id: messageId },
         orderBy: [{ v: "desc" }],
         take: latest ? 1 : 100,
       });
       return NextResponse.json({ ok: true, items: receipts });
     }