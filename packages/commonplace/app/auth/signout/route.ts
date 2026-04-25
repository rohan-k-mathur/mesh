import { NextResponse } from "next/server";
import { createClient } from "@cp/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url));
}
