import { getUserFromCookies } from "@/lib/serverutils";
import { prisma } from "@/lib/prismaclient";
import { broadcast } from "@/lib/sse";
import leo from "leo-profanity";

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return new Response("Auth required", { status: 401 });

  const { stallId, text } = await req.json();
  const clean = text?.trim();
  if (!stallId || !clean) return new Response("Bad request", { status: 400 });
  if (leo.check(clean)) return new Response("Bad request", { status: 400 });

  const msg = await prisma.stallMessage.create({
    data: {
      stall_id: BigInt(stallId),
      user_id: user.userId,
      text: clean,
    },
  });

  broadcast(String(stallId), {
    type: "chat",
    payload: [
      {
        id: String(msg.id),
        user: user.displayName ?? "anon",
        text: msg.text,
        at: msg.created_at.toISOString(),
      },
    ],
  });

  return new Response("ok");
}
