   "use client";
   import * as React from "react";
   import { useRouter } from "next/navigation";
   import { addStackComment } from "@/lib/actions/stack.actions";
   import { useFormStatus } from "react-dom";
   import Image from "next/image";
   
   function SubmitBtn() {
     const { pending } = useFormStatus();
     return (
       <button
         type="submit"
         className="w-fit px-4 items-center justify-center py-3 align-center bg-white/70 h-full mx-auto sendbutton rounded-full text-slate-700 disabled:opacity-20"
         disabled={pending}
       >
          <Image
                src="/assets/send (2).svg"
                alt="share"
                width={24}
                height={24}
                className="cursor-pointer object-contain text-center items-center justify-center  ml-1"
              />
         {/* {pending ? "Posting…" : "Post"} */}
       </button>
     );
   }
   
   export default function CommentComposer({ rootId }: { rootId: bigint | number | string }) {
     const router = useRouter();
     const [text, setText] = React.useState("");
   
     async function onSubmit(formData: FormData) {
       await addStackComment(formData);
       setText("");
       router.refresh();
     }
   
     return (
       <form action={onSubmit} className="flex items-start gap-3">
         <input type="hidden" name="rootId" value={String(rootId)} />
         <textarea
           name="text"
           value={text}
           onChange={(e) => setText(e.target.value)}
           placeholder="Add a comment…"
           className="commentfield flex w-full flex-1 h-fit py-3 px-3 max-h-[180px] h-fit align-center border rounded-xl  text-[.9rem] bg-white/70"
           rows={2}
         />
         <SubmitBtn />
       </form>
     );
   }