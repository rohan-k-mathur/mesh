import { getUserFromCookies } from "@/lib/serverutils";
import { addToCart } from "@/lib/actions/cart.server";

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return new Response("Auth", { status: 401 });
  const { itemId, qty = 1 } = await req.json();
  await addToCart(user.userId, BigInt(itemId), qty);
  return new Response("ok");
}
