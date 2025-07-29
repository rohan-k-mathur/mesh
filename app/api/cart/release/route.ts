import { getUserFromCookies } from "@/lib/serverutils";
import { releaseEscrow } from "@/lib/actions/offerCart.server";

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return new Response("Auth", { status: 401 });
  const { cartId } = await req.json();
  if (!cartId) return new Response("Missing", { status: 400 });
  const esc = await releaseEscrow(BigInt(cartId));
  return Response.json(esc);
}
