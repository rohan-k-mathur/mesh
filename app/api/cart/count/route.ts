import { getUserFromCookies } from "@/lib/serverutils";
import { getCartCount } from "@/lib/actions/cart.server";

export async function GET() {
  const user = await getUserFromCookies();
  const n = user ? await getCartCount(user.userId) : 0;
  return Response.json({ n }, { headers: { "Cache-Control": "no-store" } });
}
