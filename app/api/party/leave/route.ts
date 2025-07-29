import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return new Response("auth", { status: 401 });
  const { partyId } = await req.json();
  await prisma.partyPresence.delete({ where: { id: `${partyId}-${user.userId}` } }).catch(() => {});
  return new Response("ok");
}
