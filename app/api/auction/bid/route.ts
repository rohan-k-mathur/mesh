import { getUserFromCookies } from "@/lib/serverutils";
import { placeBid } from "@/lib/actions/auction.server";

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return new Response("auth", { status: 401 });

  const { auctionId, amountCents } = await req.json();
  await placeBid(auctionId, user.userId, amountCents);
  return new Response("ok");
}
