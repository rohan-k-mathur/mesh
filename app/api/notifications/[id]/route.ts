import { NextRequest, NextResponse } from "next/server";
import { deleteNotification } from "@/lib/actions/notification.actions";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  await deleteNotification(BigInt(params.id));
  return NextResponse.json({ status: "ok" });
}
