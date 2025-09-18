import Agora from "./ui/Agora";
export const dynamic = "force-dynamic";

function abs(path: string) {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT || 3000}`);
  return `${base}${path}`;
}

export default async function AgoraPage() {
  // SSR initial events
  const res = await fetch(abs("/api/agora/events?limit=30"), { cache: "no-store" }).catch(() => null);
  const initial = (await res?.json().catch(() => null))?.events ?? [];
  return <Agora initialEvents={initial} />;
}
