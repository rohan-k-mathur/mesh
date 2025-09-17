import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";
import { emitBus } from "@/lib/server/bus";
import { z } from "zod";

const Body = z.object({
  hostType: z.enum(["article","post","room","stack","card","claim"]).default("article"),
  hostId: z.string().min(1),
  tags: z.array(z.string()).optional(),
  title: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { hostType, hostId, tags = [], title = null } = parsed.data;

  const d = await prisma.deliberation.create({
    data: {
      hostType: hostType as any,
      hostId,
      createdById: String(userId),
      // If you add tags later: tagsJson: tags
    },
    select: { id: true },
  });

  // XRef (if you add the model; see Section 6)
  // await prisma.xRef.create({ data: { fromType: hostType, fromId: hostId, toType:'deliberation', toId: d.id, relation:'discusses' } });

  emitBus("deliberations:created", { id: d.id, hostType, hostId, tags, title });
  return NextResponse.json({ ok: true, id: d.id, redirect: `/deliberation/${d.id}` });
}
