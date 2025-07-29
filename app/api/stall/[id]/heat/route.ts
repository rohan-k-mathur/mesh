import { prisma } from "@/lib/prismaclient";
export async function GET(_req:Request,{params}:{params:{id:string}}){
  const rows=await prisma.stallHeat.findMany({
    where:{ stall_id: BigInt(params.id) }
  });
  const arr=Array(9).fill(0);
  rows.forEach(r=>arr[r.cell]=r.views);
  return Response.json(arr,{headers:{"Cache-Control":"no-store"}});
}
