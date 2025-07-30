import Stripe from "stripe";
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-08-01",
});
export const ORIGIN = process.env.NEXT_PUBLIC_APP_URL!;
