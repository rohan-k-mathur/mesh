import { NextRequest, NextResponse } from "next/server";

// TODO: inject prisma & supabase server client once your pipeline is ready

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}));
  // TEMP stub so UI can land: replace with real import (create LibraryPost/Stack rows, queue thumbs, create feed post)
  return NextResponse.json({ ok: true, received: payload });
}

