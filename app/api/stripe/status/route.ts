// app/api/stripe/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSupabaseServerClient } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const supabase = getSupabaseServerClient(req);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ charges_enabled: false });

  const seller = await prisma.seller.findUnique({ where: { id: user.id } });
  return NextResponse.json({ charges_enabled: !!seller?.stripeChargesEnabled });
}
