import { NextRequest, NextResponse } from "next/server";
import { resolveMarket } from "@/packages/server/src/prediction/service";
import { getUserFromCookies } from "@/lib/serverutils";
import { z } from "zod";

const schema = z.object({ outcome: z.enum(["YES", "NO", "N_A"]) });

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getUserFromCookies();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const result = await resolveMarket({
    marketId: params.id,
    outcome: parsed.data.outcome,
    resolverId: user.userId!,
  });
  return NextResponse.json(result);
}
