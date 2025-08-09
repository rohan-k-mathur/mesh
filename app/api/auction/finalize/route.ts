import { prisma } from "@/lib/prismaclient";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function POST() {
  // 1) select ended auctions
  const auctions = await prisma.$queryRaw<
    { id: bigint }[]
  >`select id from auctions where ends_at <= now() and state = 'LIVE' for update skip locked limit 25`;

  let processed = 0;

  for (const a of auctions) {
    const [{ locked }] = await prisma.$queryRaw<{ locked: boolean }[]>`
      select pg_try_advisory_lock(${a.id}::bigint) as locked
    `;
    if (!locked) continue;

    try {
      // recompute winner deterministically
      const winner = await prisma.$queryRaw<{ bidder_id: bigint; amount: any; id: bigint }[]>`
        select bidder_id, amount, id
        from bids
        where auction_id = ${a.id}
          and created_at <= (select ends_at from auctions where id = ${a.id})
        order by amount desc, created_at asc, id asc
        limit 1
      `;

      // mark closed regardless of payment
      await prisma.auction.update({
        where: { id: a.id as any },
        data: { state: "CLOSED", winner_id: winner[0]?.bidder_id as any ?? null },
      });

      if (winner.length) {
        // create order + capture payment
        const amountCents = Math.round(Number(winner[0].amount) * 100);
        const order = await prisma.order.create({
          data: {
            stall_id: (await prisma.auction.findUnique({ where: { id: a.id as any }, select: { stall_id: true } }))!.stall_id,
            buyer_id: winner[0].bidder_id as any,
            auction_id: a.id as any,
            status: "PENDING_PAYMENT",
            subtotal: winner[0].amount as any,
            shipping: 0 as any,
            total: winner[0].amount as any,
            currency: "usd",
            items: {
              create: [
                // one item from auctioned item
                // (lookup the auction.item_id → item price is irrelevant here)
                {
                  item_id: (await prisma.auction.findUnique({ where: { id: a.id as any }, select: { item_id: true } }))!.item_id,
                  qty: 1,
                  unit_price: winner[0].amount as any,
                },
              ],
            },
          },
        });

        // lookup bidder's saved pm (you should store pmId at bid time)
        const bidder = await prisma.user.findUnique({ where: { id: winner[0].bidder_id as any } });
        const pmId = (bidder as any)?.pmId; // adapt to where you store it

        if (pmId) {
          const pi = await stripe.paymentIntents.create({
            amount: amountCents,
            currency: "usd",
            customer: (bidder as any)?.stripeCustomerId, // you should store customer id
            payment_method: pmId,
            confirm: true,
          });
          await prisma.order.update({ where: { id: order.id }, data: { stripePI: pi.id, status: "PAID" } });
        } else {
          // fall back: leave it PENDING_PAYMENT and notify UI
        }
      }

      processed++;
    } finally {
      await prisma.$executeRawUnsafe(`select pg_advisory_unlock(${a.id}::bigint)`);
    }
  }

  return new Response(JSON.stringify({ processed }), { headers: { "Content-Type": "application/json" } });
}
