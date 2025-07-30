// app/api/stripe/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { getSupabaseServerClient } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ charges_enabled: false });
  const sellerId = BigInt(user.id);        // or Number(user.id)
  const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
  //const seller = await prisma.seller.findUnique({ where: { id: user.id } });
  return NextResponse.json({ charges_enabled: !!seller?.stripeChargesEnabled });
}
