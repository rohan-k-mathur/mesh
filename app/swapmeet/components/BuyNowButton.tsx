'use client';
import { loadStripe } from '@stripe/stripe-js';
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function BuyNowButton({ itemId }: { itemId: string }) {
  const checkout = async () => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId }),
    });
    const { sessionUrl } = await res.json();
    window.location.href = sessionUrl;
  };

  return <button onClick={checkout} className="btn-primary">Buy Now</button>;
}
