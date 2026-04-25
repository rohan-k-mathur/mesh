"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@cp/lib/supabase/client";

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/write";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-stone-900">Sign in</h1>
      <p className="text-stone-600">
        Enter your email. We&rsquo;ll send a one-time link.
      </p>

      {status === "sent" ? (
        <p className="rounded border border-stone-300 bg-stone-100 p-4 text-stone-800">
          Link sent to <strong>{email}</strong>. Check your inbox.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded border border-stone-300 bg-white px-3 py-2 focus:border-stone-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded bg-stone-900 px-4 py-2 text-stone-50 disabled:opacity-50"
          >
            {status === "sending" ? "Sending…" : "Send link"}
          </button>
          {error && <p className="text-sm text-rose-700">{error}</p>}
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-stone-500">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
