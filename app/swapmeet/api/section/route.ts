// // app/swapmeet/api/section/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { getSection } from "swapmeet-api";

// export async function GET(req: NextRequest) {
//   const { searchParams } = new URL(req.url);
//   const x = Number(searchParams.get("x") ?? 0);
//   const y = Number(searchParams.get("y") ?? 0);

//   if (Number.isNaN(x) || Number.isNaN(y)) {
//     return NextResponse.json({ message: "Invalid coordinates" }, { status: 400 });
//   }

//   return NextResponse.json(await getSection(x, y));
// }
// // 
import { jsonSafe } from "@/lib/bigintjson";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getSection } from "swapmeet-api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const xParam = searchParams.get("x");
  const yParam = searchParams.get("y");

  if (xParam !== null && yParam !== null) {
    const x = Number(xParam);
    const y = Number(yParam);
    if (Number.isNaN(x) || Number.isNaN(y)) {
      return NextResponse.json({ message: "Invalid coordinates" }, { status: 400 });
    }
    const section = await getSection(x, y);
    return NextResponse.json(jsonSafe(section));
  }

  const sections = await prisma.section.findMany({
    select: { id: true, x: true, y: true },
    orderBy: [{ y: "asc" }, { x: "asc" }],
  });
  return NextResponse.json(jsonSafe(sections));
}