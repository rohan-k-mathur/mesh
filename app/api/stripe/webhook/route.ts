// import Stripe from 'stripe';
// import { prisma } from '@/lib/prismaclient';
// import { NextRequest, NextResponse } from 'next/server';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-06-30.basil' });
// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// export async function POST(req: NextRequest) {
//   const rawBody = await req.arrayBuffer();             // ArrayBuffer
// const body    = Buffer.from(rawBody);            
//   const sig  = req.headers.get('stripe-signature') as string;

//   let event: Stripe.Event;
//   try {
//     event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
//   } catch (err) {
//     return NextResponse.json({ error: 'Signature mismatch' }, { status: 400 });
//   }

//   if (event.type === 'checkout.session.completed') {
//     const session = event.data.object as Stripe.Checkout.Session;
//     const orderId = BigInt(session.metadata!.orderId);

//     await prisma.$transaction(async (tx) => {
//       const order = await tx.order.update({
//         where: { id: orderId },
//         data: { status: 'paid' },
//         include: { item: true },
//       });
//       await tx.item.update({
//         where: { id: order.item_id },
//         data:  { stock: { decrement: order.amount } },
//       });
      
//       const current = await tx.item.findUnique({ where: { id: order.item_id } });
//       if (current!.stock < 0) throw new Error('oversold');
//     });
//   }

//   return NextResponse.json({ received: true });
// }
// app/api/stripe/webhook/route.ts
import Stripe from "stripe";
import { prisma } from "@/lib/prismaclient";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-06-30.basil' });
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature")!;
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // idempotency guard (optional): store event.id you've processed

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await prisma.order.updateMany({
        where: { stripePI: pi.id },
        data: { status: "PAID" },
      });
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await prisma.order.updateMany({
        where: { stripePI: pi.id },
        data: { status: "PENDING_PAYMENT" },
      });
      break;
    }
    case "charge.refunded": {
      const ch = event.data.object as Stripe.Charge;
      await prisma.order.updateMany({
        where: { stripePI: ch.payment_intent as string },
        data: { status: "REFUNDED" },
      });
      break;
    }
    case "charge.dispute.created": {
      const ch = event.data.object as Stripe.Charge;
      await prisma.order.updateMany({
        where: { stripePI: ch.payment_intent as string },
        data: { status: "DISPUTED" },
      });
      break;
    }
    default:
      // ignore others for now
      break;
  }

  return new Response("ok");
}
