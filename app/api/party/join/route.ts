import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";
import { channels } from '../[id]/events/route'; // or move to a shared file
import { Prisma } from "@prisma/client";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';  // prevent Next from caching the RSC

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return new Response("auth", { status: 401 });
  const { partyId, x, y } = await req.json();

  /* ---- broadcast cursor to connected clients ---- */
  const listeners = channels.get(partyId);
  if (listeners?.size) {
    const msg = { kind: 'cursor', x, y };
    const json = JSON.stringify(msg);          // 🔑 stringify!
    listeners.forEach((fn) => fn(json));
  }


/* build the literal object with the right type */
// const createData: Prisma.PartyPresenceUncheckedCreateInput = {
//   id:       `${partyId}-${user.userId}`,
//   party_id: partyId,
//   x,
//   y,
//   user_id:  user.userId ? BigInt(user.userId) : null,    // OK: bigint | null
// };

await prisma.partyPresence.upsert({
  where:  { id: `${partyId}-${user.userId}` },
  update: { x, y },
  create: {
    id:       `${partyId}-${user.userId}`,
    party_id: partyId,
    x, y,
    ...(user.userId && { user_id: BigInt(user.userId) }),  // 🔑 spreads only when truthy
  },
});
  return new Response("ok");
}
