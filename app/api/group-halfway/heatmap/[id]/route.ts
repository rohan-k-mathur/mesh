import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { haversineDistance } from "@/lib/sorters";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const meeting = await prisma.groupMeeting.findUnique({ where: { id: params.id } });
  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const origins = (meeting.origins as any) || {};
  if (!meeting.participantUids.every((u) => origins[u])) {
    return NextResponse.json({ error: "Origins incomplete" }, { status: 400 });
  }
  const originList = meeting.participantUids.map((u) => origins[u]);
  const centroid = originList.reduce(
    (acc: any, cur: any) => ({ lat: acc.lat + cur.lat / originList.length, lng: acc.lng + cur.lng / originList.length }),
    { lat: 0, lng: 0 }
  );
  const radius = Math.max(...originList.map((o: any) => haversineDistance(o, centroid)));
  const spacing = 150; // meters
  const latStep = spacing / 111320;
  const lngStep = spacing / (111320 * Math.cos((centroid.lat * Math.PI) / 180));
  const maxStep = Math.ceil(radius / spacing);

  const nodes: { lat: number; lng: number; cost: number }[] = [];
  for (let i = -maxStep; i <= maxStep; i++) {
    for (let j = -maxStep; j <= maxStep; j++) {
      const lng = centroid.lng + i * lngStep * 1.5;
      const lat = centroid.lat + j * latStep + (i % 2 ? latStep / 2 : 0);
      if (haversineDistance({ lat, lng }, centroid) > radius) continue;
      const cost = originList.reduce((s: number, o: any) => s + haversineDistance(o, { lat, lng }), 0);
      nodes.push({ lat, lng, cost });
      if (nodes.length >= 400) break;
    }
    if (nodes.length >= 400) break;
  }
  const costs = nodes.map((n) => n.cost);
  const min = Math.min(...costs);
  const max = Math.max(...costs);
  const points = nodes.map((n) => ({
    lat: n.lat,
    lng: n.lng,
    weight: max === min ? 1 : 1 - (n.cost - min) / (max - min),
  }));
  return NextResponse.json({ points }, { headers: { "Cache-Control": "s-maxage=300" } });
}
