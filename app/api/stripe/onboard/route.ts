// app/api/stripe/onboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ensureStripeAccount, createOnboardingLink } from '@/lib/payouts.server';
import { getSupabaseServerClient } from '@/lib/auth';    // helper to retrieve user

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const acctId = await ensureStripeAccount(user.id);
  const url = await createOnboardingLink(acctId);
  return NextResponse.json({ url });
}
