'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Item = {
  id: string
  title: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED'
  createdAt: string
  updatedAt: string
  heroImageKey: string | null
  template: string
}

export default function ArticlesDashboard({ initialItems }: { initialItems: Item[] }) {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>(initialItems)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'ALL' | 'DRAFT' | 'PUBLISHED'>('ALL')
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const s = status === 'ALL' ? items : items.filter(i => i.status === status)
    if (!q.trim()) return s
    const qq = q.toLowerCase()
    return s.filter(i =>
      i.title.toLowerCase().includes(qq) || i.slug.toLowerCase().includes(qq)
    )
  }, [items, q, status])

  async function refresh() {
    const res = await fetch('/api/articles', { cache: 'no-store' })
    if (res.ok) setItems(await res.json())
  }

  async function createNew() {


    router.push('/article/new')
  }

  async function rename(id: string, title: string) {
    await fetch(`/api/articles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    startTransition(refresh)
  }

  async function remove(id: string) {
    if (!confirm('Delete this article? This cannot be undone.')) return
    await fetch(`/api/articles/${id}`, { method: 'DELETE' })
    startTransition(refresh)
  }

  function view(i: Item) {
    if (i.status !== 'PUBLISHED') return // or toast
    router.push(`/article/${i.slug}`)
  }

  function edit(i: Item) {
    router.push('/article/by-id/${i.id}/edit')
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xl font-semibold">Your articles</div>
        <button
          onClick={createNew}
          className="px-3 py-1.5 rounded bg-amber-500 text-white text-sm"
        >
          New article
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by title or slug…"
          className="border rounded px-2 py-1 text-sm"
        />
        <select
          className="border rounded px-2 py-1 text-sm"
          value={status}
          onChange={e => setStatus(e.target.value as any)}
        >
          <option value="ALL">All</option>
          <option value="DRAFT">Drafts</option>
          <option value="PUBLISHED">Published</option>
        </select>
        {isPending && <span className="text-sm text-neutral-500">Refreshing…</span>}
      </div>

      <div className="overflow-x-auto rounded border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="text-left px-3 py-2">Title</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Updated</th>
              <th className="text-right px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(i => (
              <tr key={i.id} className="border-t">
                <td className="px-3 py-2">
                  <InlineTitle initial={i.title} onSave={(t) => rename(i.id, t)} />
                </td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${i.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {i.status.toLowerCase()}
                  </span>
                </td>
                <td className="px-3 py-2 text-neutral-600">
                  {new Date(i.updatedAt).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2 justify-end">
                    <button className="px-2 py-1 border rounded" onClick={() => edit(i)}>Edit</button>
                    <button className="px-2 py-1 border rounded" onClick={() => view(i)}>View</button>
                    <button className="px-2 py-1 border rounded text-red-600" onClick={() => remove(i)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={4} className="px-3 py-10 text-center text-neutral-500">No articles found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function InlineTitle({ initial, onSave }: { initial: string; onSave: (t: string) => void }) {
  const [val, setVal] = useState(initial)
  return (
    <input
      className="w-full outline-none bg-transparent"
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => { if (val.trim() && val !== initial) onSave(val.trim()) }}
      onKeyDown={e => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur() }}
    />
  )
}
