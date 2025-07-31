import Stripe from "stripe";
import { prisma } from "@/lib/prismaclient";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

export async function POST(req: NextRequest) {
  const { itemId, qty = 1 } = await req.json();

  // const { itemId } = await req.json();
  const item = await prisma.item.findUnique({ where: { id: BigInt(itemId) } });
  if (!item || item.stock <= 0) {
    return NextResponse.json({ error: "Out of stock" }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      stall_id: item.stall_id,
      item_id: item.id,
      amount: qty,
    //   sessionId: "undefined",
    //   buyer_id: 1,
      status:   'PENDING',

    },
  });

    /* 2 · Stripe Checkout session ---------------------------------------- */
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${process.env.NEXT_PUBLIC_URL}/cancel`,
        line_items: [{
          price_data: {
            currency: 'usd',
            unit_amount: item.price_cents,
            product_data: { name: item.name },
          },
          quantity: qty,
        }],
        metadata: { orderId: order.id.toString(), itemId: item.id.toString() },
      });

//   const session = await stripe.checkout.sessions.create({
//     mode: "payment",
//     success_url: `${process.env.NEXT_PUBLIC_URL}/success`,
//     cancel_url: `${process.env.NEXT_PUBLIC_URL}/cancel`,
//     line_items: [
//       {
//         price_data: {
//           currency: "usd",
//           unit_amount: item.price_cents,
//           product_data: { name: item.name },
//         },
//         quantity: 1,
//       },
//     ],
//     metadata: { orderId: order.id.toString(), itemId: item.id.toString() },
//   });
 /* 3 · save sessionId for reconciliation ------------------------------ */
 await prisma.order.update({
    where: { id: order.id },
    data:  { sessionId: session.id },
  });


  return NextResponse.json({ sessionUrl: session.url }, { status: 200 });
}
