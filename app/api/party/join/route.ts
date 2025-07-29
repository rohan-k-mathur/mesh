import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return new Response("auth", { status: 401 });
  const { partyId, x, y } = await req.json();
  await prisma.partyPresence.upsert({
    where: { id: `${partyId}-${user.userId}` }, // composite id trick
    update: { x, y },
    create: {
      id: `${partyId}-${user.userId}`,
      party_id: partyId,
      user_id: user.userId,
      x, y,
    },
  });
  return new Response("ok");
}
