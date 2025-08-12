// components/article/ArticleReader.tsx
'use client'

import clsx from 'clsx'
import Image from 'next/image'


interface ArticleReaderProps {
  template: string
  heroSrc?: string | null
  children: React.ReactNode
    title?: string                 // ⬅️ new
}



export default function ArticleReader({
  template,
  heroSrc,
  children,
  title,
}: ArticleReaderProps) {
  return (
    <article className={clsx(template, 'mx-auto')}>
      {heroSrc && (
        <img
          src={heroSrc}
          alt=""
          className="mb-8 w-full rounded-lg object-cover  "
        />
      )}
      {children}
    </article>
  )
}