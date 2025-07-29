import { getUserFromCookies } from "@/lib/serverutils";
import { viewCart } from "@/lib/actions/offerCart.server";
import { jsonSafe } from "@/lib/bigintjson";

export async function GET() {
  const user = await getUserFromCookies();
  if (!user) return new Response("Auth", { status: 401 });
  const rows = await viewCart(user.userId);
  return Response.json(jsonSafe(rows), { headers: { "Cache-Control": "no-store" } });
}
