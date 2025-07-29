import { getUserFromCookies } from "@/lib/serverutils";
import { createEscrow } from "@/lib/actions/offerCart.server";

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return new Response("Auth", { status: 401 });
  const { cartId, txRef } = await req.json();
  if (!cartId || !txRef) return new Response("Missing", { status: 400 });
  const escrow = await createEscrow(BigInt(cartId), txRef);
  return Response.json(escrow);
}
