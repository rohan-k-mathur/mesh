// Marks this route as Node (not Edge)
export const runtime = "nodejs";

import { spawnSection } from "@/lib/actions/section.server";

export async function GET() {
  const { x, y } = await spawnSection();     // Safe: runs on Node
  return Response.json({ x, y });
}
