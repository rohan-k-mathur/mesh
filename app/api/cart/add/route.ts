import { getUserFromCookies } from "@/lib/serverutils";
import { addOfferToCart } from "@/lib/actions/offerCart.server";

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return new Response("Auth", { status: 401 });
  const { offerId, deadline } = await req.json();
  if (!offerId || !deadline)
    return new Response("Missing fields", { status: 400 });
  await addOfferToCart(
    user.userId,
    BigInt(offerId),
    new Date(deadline)
  );
  return new Response("ok");
}
