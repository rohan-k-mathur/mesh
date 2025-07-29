import { getUserFromCookies } from "@/lib/serverutils";
import { prisma } from "@/lib/prismaclient";

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return new Response("Auth required", { status: 401 });

  const { stallId, text } = await req.json();
  if (!stallId || !text?.trim())
    return new Response("Bad request", { status: 400 });

  await prisma.stallMessage.create({
    data: {
      stall_id: BigInt(stallId),
      user_id: user.userId,
      text: text.trim(),
    },
  });

  return new Response("ok");
}
