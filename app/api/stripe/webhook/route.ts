import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prismaclient";
import { NextRequest, NextResponse } from "next/server";
import { broadcast } from "@/lib/sse";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature")!;
  const buf = await req.arrayBuffer();
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    return new NextResponse("Webhook error", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const sess = event.data.object as Stripe.Checkout.Session;
      const order = await prisma.order.create({
        data: {
          sessionId: sess.id,
          amount: sess.amount_total!,
          stallId: sess.metadata!.stallId,
          itemId: sess.metadata!.itemId,
        },
      });
      await prisma.item.update({
        where: { id: order.itemId },
        data: { sold: true },
      });
      broadcast(order.stallId, { type: "ITEM_SOLD", payload: order.itemId });
      break;
    }
    case "account.updated": {
      break;
    }
  }
  return new NextResponse(null, { status: 200 });
}
