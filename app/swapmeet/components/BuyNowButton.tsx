'use client';
import { loadStripe } from '@stripe/stripe-js';
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function BuyNowButton({ itemId }: { itemId: string }) {
    const handleClick = async () => {
        const res = await fetch('/api/swapmeet/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId, qty: 1 }),
        });
        const { sessionUrl } = await res.json();
        window.location.href = sessionUrl;
      };

//   const checkout = async () => {
//     const res = await fetch('/api/swapmeet/orders', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ itemId }),
//     });
//     const { sessionUrl } = await res.json();
//     window.location.href = sessionUrl;
//   };

  return <button onClick={handleClick} className="likebutton rounded-full p-3 bg-white bg-opacity-30 mt-2">Buy Now</button>;
}
