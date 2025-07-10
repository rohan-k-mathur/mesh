import { NextRequest, NextResponse } from "next/server";
import {
  emitWorkflowTrigger,
} from "@/lib/workflowTriggers";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== process.env.BIGCAPITAL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const event = await req.json();
  switch (event.type) {
    case "invoice.paid":
      emitWorkflowTrigger("bigcapital:invoicePaid", event);
      break;
    case "inventory.low":
      emitWorkflowTrigger("bigcapital:lowInventory", event);
      break;
    default:
      break;
  }
  return NextResponse.json({ received: true });
}
