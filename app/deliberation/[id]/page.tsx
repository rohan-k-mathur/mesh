
 import { notFound } from "next/navigation";
 import { prisma } from "@/lib/prismaclient";
 import NextLink from "next/link";
 import { RhetoricProvider } from "@/components/rhetoric/RhetoricContext";
 import DeepDivePanel from "@/components/deepdive/DeepDivePanel";
 
 export default async function DeliberationPage({
   params,
 }: {
   params: { id: string };
 }) {
   // Ensure the deliberation exists
   const delib = await prisma.deliberation.findUnique({
     where: { id: params.id },
   });
   if (!delib) notFound();
 
   // If this delib is hosted by an article, fetch slug for a handy back-link
   const article =
     delib.hostType === "article"
       ? await prisma.article.findUnique({
           where: { id: delib.hostId },
           select: { slug: true, title: true },
         })
       : null;
 
   return (
     <div className="mx-auto max-w-6xl px-6 py-6 space-y-4">
       <div className="flex items-center justify-between">
         <h1 className="text-lg font-semibold">Discussion</h1>
         {article && (
           <NextLink
             href={`/article/${article.slug}`}
             className="text-sm underline"
             prefetch
           >
             ← Back to article{article.title ? `: ${article.title}` : ""}
           </NextLink>
         )}
       </div>
       <RhetoricProvider>
         <DeepDivePanel deliberationId={delib.id} />
       </RhetoricProvider>
     </div>
   );
 }
