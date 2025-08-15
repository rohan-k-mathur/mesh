import type { NextRequest } from 'next/server';

export async function readJSON<T>(req: NextRequest): Promise<T> {
  try {
    return await req.json();
  } catch {
    throw new Error('Invalid JSON');
  }
}

export function badRequest(message: string, extra?: any) {
  return new Response(JSON.stringify({ error: message, ...(extra ?? {}) }), {
    status: 400,
    headers: { 'content-type': 'application/json' },
  });
}

export function ok(data: any) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
