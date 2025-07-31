import Stripe from 'stripe';
import { prisma } from '@/lib/prismaclient';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-06-30.basil' });
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const rawBody = await req.arrayBuffer();             // ArrayBuffer
const body    = Buffer.from(rawBody);            
  const sig  = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    return NextResponse.json({ error: 'Signature mismatch' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = BigInt(session.metadata!.orderId);

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: 'paid' },
        include: { item: true },
      });
      await tx.item.update({
        where: { id: order.item_id },
        data:  { stock: { decrement: order.amount } },
      });
      
      const current = await tx.item.findUnique({ where: { id: order.item_id } });
      if (current!.stock < 0) throw new Error('oversold');
    });
  }

  return NextResponse.json({ received: true });
}
