import { prisma } from "@/lib/prismaclient";
import * as Y from "yjs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const stall = await prisma.stall.findUnique({
    where: { id: BigInt(params.id) },
    select: { doc: true },
  });
  if (!stall?.doc) return Response.json({ update: null });
  return Response.json(stall.doc);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const encoded = body.update as string | undefined;
  if (!encoded) return new Response("Missing update", { status: 400 });
  const incoming = Uint8Array.from(Buffer.from(encoded, "base64"));

  const current = await prisma.stall.findUnique({
    where: { id: BigInt(params.id) },
    select: { doc: true },
  });
  let merged = incoming;
  const existing = current?.doc?.update as string | undefined;
  if (existing) {
    const prev = Uint8Array.from(Buffer.from(existing, "base64"));
    merged = Y.mergeUpdates([prev, incoming]);
  }
  const update = Buffer.from(merged).toString("base64");
  await prisma.stall.update({
    where: { id: BigInt(params.id) },
    data: { doc: { update } },
  });
  return new Response("ok");
}
