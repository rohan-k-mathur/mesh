   // Server component: renders comments inline beneath the stack
   import { prisma } from "@/lib/prismaclient";
   import { getUserFromCookies } from "@/lib/serverutils";
   import CommentComposer from "./CommentComposer";
   import Image from "next/image";

   function timeAgo(d: Date) {
     const s = Math.floor((Date.now() - d.getTime()) / 1000);
     if (s < 60) return `${s}s`;
     const m = Math.floor(s / 60);
     if (m < 60) return `${m}m`;
     const h = Math.floor(m / 60);
     if (h < 24) return `${h}h`;
     const days = Math.floor(h / 24);
     return `${days}d`;
   }
   
   export default async function StackDiscussion({ feedPostId }: { feedPostId: number | bigint }) {
     const rootId = BigInt(feedPostId);
     const root = await prisma.feedPost.findUnique({
       where: { id: rootId },
       select: { id: true, stack_id: true, isPublic: true },
     });
     if (!root) return null;
   
     const comments = await prisma.feedPost.findMany({
       where: { parent_id: rootId },
       orderBy: { created_at: "asc" },
       select: {
         id: true,
         content: true,
         created_at: true,
         author: { select: { id: true, name: true, image: true } },
       },
     });
     const viewer = await getUserFromCookies();
   
     return (
       <div className="flex flex-col mt-1 space-y-4">
         {/* Composer */}
         {viewer ? (
           <CommentComposer rootId={rootId.toString()} />
         ) : (
           <div className="text-sm text-muted-foreground">
             Sign in to join the discussion.
           </div>
         )}
   
         {/* List */}
         <div className="space-y-4">
           {comments.map((c) => (
             <div key={c.id.toString()} className="flex gap-3">
               <div className="h-8 w-8 rounded-full overflow-hidden border shrink-0">
                 <Image
                   src={c.author?.image || "/assets/user-helsinki.svg"}
                   alt={c.author?.name || "User"}
                   width={32}
                   height={32}
                   className="object-cover"
                 />
               </div>
               <div className="flex-1">
                 <div className="text-sm">
                   <span className="font-medium">{c.author?.name || "User"}</span>
                   <span className="ml-2 text-xs text-slate-500">
                     {timeAgo(c.created_at)}
                   </span>
                 </div>
                 <div className="text-sm whitespace-pre-wrap mt-1">
                   {c.content}
                 </div>
               </div>
             </div>
           ))}
           {comments.length === 0 && (
             <div className="text-sm text-muted-foreground">Be the first to comment.</div>
           )}
         </div>
       </div>
     );
   }
