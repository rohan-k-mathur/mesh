import { subscribe } from "@/lib/sse";

export function GET(
  _req: Request,
  { params }: { params: { stallId: string } },
) {
  const stream = new ReadableStream({
    start(controller) {
      const writer = controller.writable.getWriter();
      subscribe(params.stallId, writer);
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
