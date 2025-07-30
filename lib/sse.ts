// lib/sse.ts
type Payload = { type: string; payload: any };

const channels: Record<string, Set<WritableStreamDefaultWriter>> = {};

export function subscribe(stallId: string, writer: WritableStreamDefaultWriter) {
  channels[stallId] ??= new Set();
  channels[stallId].add(writer);
}

export function broadcast(stallId: string, ev: Payload) {
  channels[stallId]?.forEach(w =>
    w.write(`data: ${JSON.stringify(ev)}\n\n`)
      .catch(() => channels[stallId].delete(w)),
  );
}
