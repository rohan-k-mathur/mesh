export interface StallDetail {
  id: number;
  name: string;
  // visitors: number;
  // avatar?: string | null;
  // liveSrc?: string | null;
  items: { id: number; name: string; price_cents: number }[];
}

import { prisma } from "@/lib/prismaclient";

export async function getStall(id: number): Promise<StallDetail | null> {
  const stall = await prisma.stall.findUnique({
    where: { id: BigInt(id) },
    select: {
      id: true,
      name: true,
      // visitors: true,
      // avatar: true,
      // live_src: true,
      items: { select: { id: true, name: true, price_cents: true } },
    },
  });
  if (!stall) return null;
  return {
    id: Number(stall.id),
    name: stall.name,
    // visitors: stall.visitors ?? 0,
    // avatar: stall.avatar,
    // liveSrc: stall.live_src,
    items: stall.items.map((i) => ({
      id: Number(i.id),
      name: i.name,
      price_cents: i.price_cents,
    })),
  };
}
