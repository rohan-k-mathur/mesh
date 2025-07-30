import { stripe, ORIGIN } from "@/lib/stripe";
import { prisma } from "@/lib/prismaclient";

export async function POST(
  _req: Request,
  { params }: { params: { stallId: string; itemId: string } },
) {
  const item = await prisma.item.findUnique({
    where: { id: params.itemId },
    include: { stall: { include: { seller: true } } },
  });
  if (!item) return new Response("Not found", { status: 404 });

  const platformFee = Math.ceil(item.price * 100 * 0.05);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: item.price * 100,
          product_data: { name: item.name },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFee,
      transfer_data: { destination: item.stall.seller.stripeAccountId! },
    },
    success_url: `${ORIGIN}/swapmeet/order/{CHECKOUT_SESSION_ID}`,
    cancel_url: `${ORIGIN}/swapmeet/stall/${params.stallId}`,
  });

  return new Response(JSON.stringify({ url: session.url }), { status: 200 });
}
