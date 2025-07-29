import { getUserFromCookies } from "@/lib/serverutils";
import { createAuction } from "@/lib/actions/auction.server";
import { prisma } from "@/lib/prismaclient";

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return new Response("auth", { status: 401 });

  const { stallId, itemId, reserveCents, minutes } = await req.json();
  const item = await prisma.item.findUnique({
    where: { id: BigInt(itemId) },
    select: {
      stall_id: true,
      auction: { select: { id: true } },
      stall: { select: { owner_id: true } },
    },
  });
  if (
    !item ||
    Number(item.stall_id) !== Number(stallId) ||
    item.auction ||
    Number(item.stall.owner_id) !== Number(user.userId)
  ) {
    return new Response("forbidden", { status: 403 });
  }

  const a = await createAuction(stallId, itemId, reserveCents, minutes);
  return Response.json({ id: a.id });
}
