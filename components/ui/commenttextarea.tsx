import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const CommentTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[40px] w-full rounded-md border-transparent   bg-white px-2 py-3 text-[1rem] placeholder:text-slate-500   focus-within:shadow-none focus-within:border-black focus-visible:shadow-none focus-visible:border-black focus:shadow-none focus:border-black disabled:cursor-not-allowed disabled:opacity-50 ",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
CommentTextarea.displayName = "CommentTextarea"

export { CommentTextarea }
