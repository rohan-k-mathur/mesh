import { NextResponse } from "next/server";
import { getAuth } from "@supabase/auth-helpers-nextjs";
import { ensureStripeAccount, createOnboardingLink } from "@/lib/payouts.server";

export async function POST(req: Request) {
  const { user } = await getAuth({ req });
  const acct = await ensureStripeAccount(user.id);
  const url = await createOnboardingLink(acct);
  return NextResponse.json({ url });
}
