// app/api/dev/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nacl from 'tweetnacl';

export async function POST(req: NextRequest) {
  const { payload, signature } = await req.json();
  const pub = Buffer.from(process.env.MESH_EXPORT_PUBLIC_KEY!, 'base64');
  const ok = nacl.sign.detached.verify(Buffer.from(JSON.stringify(payload)), Buffer.from(signature, 'base64'), pub);
  return NextResponse.json({ valid: ok });
}
