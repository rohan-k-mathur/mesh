 'use client'
 import Image from 'next/image'
 import Link from 'next/link'
 import { Dialog, DialogTrigger } from '@/components/ui/dialog'
 import ArticlePostModal from '../modals/ArticlePostModal'
 import { useCallback } from 'react'


export type ArticleMeta = {
    articleId?: string | null
    slug: string
    title: string
    heroImageKey?: string | null
    excerpt?: string | null
    readingTime?: number | null
  }

export default function ArticleCard({ meta, postId }: { meta: ArticleMeta; postId: bigint }) {
    const href = `/article/${meta.slug}`
    const onPreview = useCallback(() => {}, [postId])
 
    return (
      <div className="rounded-xl border bg-white overflow-hidden w-full h-full ">
        {meta.heroImageKey && (
          <div className="relative aspect-[16/9]">
            <Image
              src={meta.heroImageKey}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={false}
            />
          </div>
        )}
        <div className="p-3">
          <Link href={href} className="block">
            <h3 className="text-[1.05rem] font-semibold leading-snug line-clamp-2" data-ff="founders">
              {meta.title}
            </h3>
          </Link>
          {!!meta.excerpt && (
            <p className="mt-1 text-sm text-neutral-600 line-clamp-3">{meta.excerpt}</p>
          )}
          <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
            {meta.readingTime ? <span>{meta.readingTime} min read</span> : null}
          </div>
 

         <div className="mt-3 flex items-center gap-2">
           <Dialog>
             <DialogTrigger asChild>
               <button className="px-2 py-1 border rounded text-sm">Preview</button>
             </DialogTrigger>
             <ArticlePostModal slug={meta.slug} />
           </Dialog>
           <Link href={href} className="px-2 py-1 border rounded text-sm">Read</Link>
         </div>
        </div>
      </div>
    )
  }
 