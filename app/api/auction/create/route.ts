import { getUserFromCookies } from "@/lib/serverutils";
import { createAuction } from "@/lib/actions/auction.server";

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return new Response("auth", { status: 401 });

  const { stallId, itemId, reserveCents, minutes } = await req.json();
  const a = await createAuction(stallId, itemId, reserveCents, minutes);
  return Response.json({ id: a.id });
}
