'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Terminal } from 'lucide-react';

export default function NewKbPage() {
  const router = useRouter();
  const ran = useRef(false);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      const KEY = 'draftKbPageId';
      try {
        const existing = localStorage.getItem(KEY);
        if (existing) {
          const probe = await fetch(`/api/kb/pages/${existing}`, { cache: 'no-store' });
          if (probe.ok) {
            router.replace(`/kb/pages/${existing}/edit`);
            return;
          }
          localStorage.removeItem(KEY);
        }

        const res = await fetch('/api/kb/pages', { method: 'POST' });
        if (res.status === 401) { router.replace('/login'); return; }
        if (!res.ok) throw new Error(await res.text());
        const { id } = (await res.json()) as { id: string };
        localStorage.setItem(KEY, id);
        router.replace(`/kb/pages/${id}/edit`);
      } catch (e: any) {
        console.error('KB draft create failed', e);
        setError(e?.message || 'Something went wrong creating your KB page.');
      }
    })();
  }, [router]);

  return (
    <div className="fixed inset-0 z-50 isolate overflow-auto w-full h-full bg-gradient-to-b from-indigo-50 via-rose-50 to-slate-50 text-slate-900">
      <GridBG />
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-16">
        <div className="mb-6 inline-flex select-none items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-600 backdrop-blur">
          <Terminal className="h-3.5 w-3.5 text-indigo-500" />
          <span>Launching KB Editor</span>
        </div>
        <ConsoleCard error={!!error} message={error ?? undefined} />
      </div>
    </div>
  );
}

function ConsoleCard({ error, message }: { error?: boolean; message?: string }) {
  const [visibleLines, setVisibleLines] = useState(1);
  const prefersReduced = useReducedMotion();
  useEffect(() => {
    if (error) return;
    const id = setInterval(() => setVisibleLines(n => (n >= LOGS.length ? 1 : n + 1)), 1100);
    return () => clearInterval(id);
  }, [error]);

  return (
    <div className="overflow-hidden max-h-screen rounded-2xl border border-slate-200 bg-white/85 shadow-[0_10px_40px_-10px_rgba(2,6,23,0.12)] backdrop-blur">
      <div className="flex items-center gap-2 border-b border-slate-200/90 bg-slate-50/60 px-4 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-rose-300" />
          <span className="h-3 w-3 rounded-full bg-amber-300" />
          <span className="h-3 w-3 rounded-full bg-emerald-300" />
        </div>
        <div className="ml-3 text-xs text-slate-500">mesh / kb‑editor‑boot</div>
      </div>

      <div className="relative p-6 font-mono text-[13px] leading-relaxed">
        <div className="mb-6 flex items-center gap-4">
          <Spinner prefersReduced={prefersReduced} />
          <div className="text-sm">
            {error ? (
              <span className="font-medium text-rose-600">{message}</span>
            ) : (
              <span className="text-slate-600">Preparing environment…</span>
            )}
          </div>
        </div>

        <div className="space-y-2.5 text-slate-700">
          {error ? (
            <div className="text-rose-600">✖ {message}</div>
          ) : (
            LOGS.slice(0, visibleLines).map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex items-center gap-2"
              >
                <span className="text-slate-400">[{String(i + 1).padStart(2, '0')}]</span>
                <span className="text-indigo-600">$</span>
                <span className="text-slate-700">{line}</span>
                {i === visibleLines - 1 && <Caret />}
              </motion.div>
            ))
          )}
        </div>

        {!error && (
          <div className="mt-6 text-xs text-slate-500">You can start writing immediately once the editor appears.</div>
        )}

        {error && (
          <div className="mt-6 flex items-center gap-3">
            <button onClick={() => location.reload()}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 active:translate-y-px">
              Retry
            </button>
            <a href="/" className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
              Home
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

const LOGS = [
  'Allocating editor buffers…',
  'Fetching user preferences…',
  'Linking extensions & shortcuts…',
  'Starting collaboration layer…',
  'Creating a fresh KB draft…'
];

function Caret() {
  return (
    <motion.span
      className="ml-1 inline-block h-4 w-2 translate-y-[2px] bg-slate-500"
      animate={{ opacity: [0, 1, 0] }}
      transition={{ duration: 1.1, repeat: Infinity }}
    />
  );
}

function Spinner({ prefersReduced }: { prefersReduced: boolean }) {
  return (
    <motion.svg viewBox="0 0 50 50" className="h-10 w-10 text-indigo-400" aria-hidden>
      <motion.circle
        cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
        strokeDasharray="60 120"
        animate={{ strokeDashoffset: [60, 180, 60] }}
        transition={{ duration: prefersReduced ? 0 : 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.svg>
  );
}

function GridBG() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-100/60 via-rose-100/60 to-slate-100/60" />
      <div className="absolute inset-0" style={{
        opacity: 0.08,
        backgroundImage:
          'linear-gradient(to right, rgba(15,23,42,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.2) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />
    </div>
  );
}
