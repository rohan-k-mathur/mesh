import { NextRequest, NextResponse } from "next/server";
import { fetchMessages, sendMessage } from "@/lib/actions/message.actions";
import { ensureParticipant } from "../ensureParticipant";
import { jsonSafe } from "@/lib/bigintjson";
// export async function GET(
//   req: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   const conversationId = BigInt(params.id);
//   const userCheck = await ensureParticipant(req, conversationId);
//   if (userCheck instanceof NextResponse) return userCheck;

//   const cursorParam = req.nextUrl.searchParams.get("cursor");
//   const limitParam = req.nextUrl.searchParams.get("limit");
//   const cursor = cursorParam ? BigInt(cursorParam) : undefined;
//   const limit = limitParam ? parseInt(limitParam, 10) : undefined;
//     const messages = await fetchMessages({ conversationId, cursor, limit });
//     const json = messages.map((m) => ({
//       id: m.id.toString(),
//       text: m.text,
//       createdAt: m.created_at.toISOString(),
//       senderId: m.sender_id.toString(),
//       sender: { name: m.sender.name, image: m.sender.image },
//       attachments: m.attachments.map((a) => ({
//         id: a.id.toString(),
//         path: a.path,
//         type: a.type,
//         size: a.size,
//       })),
//     }));
//     return NextResponse.json(json, { status: 200 });
// }

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const conversationId = BigInt(params.id);
  const userCheck = await ensureParticipant(req, conversationId);
  if (userCheck instanceof NextResponse) return userCheck;

  const cursorParam = req.nextUrl.searchParams.get("cursor");
  const limitParam  = req.nextUrl.searchParams.get("limit");
  const cursor = cursorParam ? BigInt(cursorParam) : undefined;
  const limit  = limitParam ? parseInt(limitParam, 10) : undefined;

  const rows = await fetchMessages({ conversationId, cursor, limit });

  // Map to UI shape, then jsonSafe
  const payload = rows.map(m => ({
    id: m.id,
    text: m.text,
    createdAt: m.created_at,
    senderId: m.sender_id,
    sender: { name: m.sender.name, image: m.sender.image },
    attachments: m.attachments.map(a => ({
      id: a.id,
      path: a.path,
      type: a.type,
      size: a.size,
    })),
  }));

  return NextResponse.json(jsonSafe(payload), { status: 200 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const conversationId = BigInt(params.id);
  const userCheck = await ensureParticipant(req, conversationId);
  if (userCheck instanceof NextResponse) return userCheck;
  const { userId } = userCheck;

  const form = await req.formData();
  const text = form.get("text") as string | null;
  const files = form.getAll("files").filter(Boolean) as File[];
  const message = await sendMessage({
    conversationId,
    senderId: userId,
    text: text ?? undefined,
    files: files.length ? files : undefined,
  });
  
  return NextResponse.json(jsonSafe(message), { status: 201 });
}
