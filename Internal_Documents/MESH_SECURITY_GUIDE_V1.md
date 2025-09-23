You got it. Here’s a **tailored, end-to-end security manual** for a Mesh-style app on **Vercel + Supabase**, fronted by **Cloudflare**. It’s opinionated, copy-pastable, and split into fast phases so you can harden quickly and keep iterating.

---

# 0) Map the stack (so we secure the *real* edges)

* **Client + API**: Next.js 14 on **Vercel** (Serverless/Edge Functions, Preview/Prod envs).
* **Data**: **Supabase** (Postgres + RLS, Auth, Storage, Realtime).
* **Front door**: **Cloudflare** (DNS, TLS, WAF, rate-limits, Turnstile).
* **Email**: a transactional service (Postmark/SendGrid/etc).
* **Optional**: Upstash Redis (or skip now; we’ll lean on Cloudflare rate-limits to start).

Principles: **least privilege**, **no secrets in client**, **RLS on every table**, **security headers by default**, **Cloudflare as the bouncer**.

---

# 1) Day-0 hardening (1–2 days; do this first)

## Cloudflare (DNS/TLS/WAF as the outer moat)

1. **DNS**

   * Turn on **DNSSEC** for your root domain.
   * Add **CAA** records (only your CA can issue; e.g., `0 issue "letsencrypt.org"`).
2. **TLS**

   * SSL/TLS mode: **Full (strict)**.
   * Enforce HTTPS: **Always Use HTTPS** + **HSTS** (include subdomains, preload after testing).
3. **WAF / Bot**

   * Enable **Managed WAF rules** (+ OWASP set).
   * Add **Rate Limiting** rules:

     * `POST /api/auth/*` → 10 req/min/IP (block for 10 min after burst).
     * `POST /api/*` → 60 req/min/IP (challenge above).
   * Turn on **Bot Fight** (standard) and **Browser Integrity Check**.
4. **Turnstile (CAPTCHA without dark patterns)**

   * Require on **signup**, **password reset**, and **bursting** posting endpoints (server verifies Turnstile token).

> Note: Put Cloudflare **in front of Vercel** by CNAME to your `cname.vercel-dns.com` target; keep the orange cloud proxied.

## Vercel (app edge hygiene)

1. **Environments**

   * Separate **Development / Preview / Production** with distinct env vars.
   * **Protect preview** deployments (team-only, or password via Vercel Protection).
   * Block robots on non-prod (`X-Robots-Tag: noindex`).
2. **Secrets**

   * Store secrets in **Vercel Env Vars**; never in client bundles.
   * Client uses only **Supabase `anon` key**; **service role key stays server-only** (API routes/functions).
3. **Security headers (global)**

   * Set via `middleware.ts` (sample below):

     * HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`,
     * `Permissions-Policy` (disable camera/mic/geo if unused),
     * `Cross-Origin-Opener/Resource-Policy: same-origin`.
   * **CSP** with nonces (see snippet) and only allow Supabase endpoints you actually use:

     * `connect-src 'self' https://<project>.supabase.co wss://<project>.supabase.co`
     * `img-src 'self' data: blob: https://<project>.supabase.co https://*.supabase.in`
4. **Cookies & CSRF**

   * Session cookies: `Secure; HttpOnly; SameSite=Lax` (Strict for admin).
   * CSRF: for cookie-based auth, verify **Origin/Referer** + CSRF tokens on state-changing routes.
5. **Validation & limits**

   * Validate every request body with **zod**.
   * JSON body max \~1 MB; uploads with explicit size and MIME checks.
6. **Rate-limit at app layer (minimal viable)**

   * If no Redis yet, rely on **Cloudflare** rate-limits; add per-user cool-downs in code for heavy actions (e.g., one post per 10s).

## Supabase (DB/Auth/Storage defaults)

1. **Auth**

   * Require **email confirmation**; set strong password policy.
   * Enable **MFA/TOTP** for users & **SSO** for staff if available.
   * Restrict **OAuth redirect URLs** to your domains only.
2. **Postgres**

   * **Enable RLS** on **every** table (default deny).
   * Use `uuid` PKs; timestamps with time zone.
   * Turn on automatic backups + **Point-in-Time Recovery** (plan-dependent).
3. **RLS baseline**

   * Create a `public.profiles` mapping `id uuid primary key references auth.users`.
   * Example multi-tenant policy (see SQL below) for `rooms`, `memberships`, `messages`.
4. **Storage**

   * Buckets: split by purpose (e.g., `avatars`, `posts`, `private`).
   * **Disable public** by default; serve via **signed URLs**.
   * Add storage policies mirroring table RLS (only owners/members can read/write).
5. **Realtime**

   * Channel auth must check room membership (don’t rely on client claims).

## Email (deliverability & spoofing)

* Configure **SPF, DKIM, DMARC** for sending domain.
* Set **“abuse” and “postmaster”** aliases.
* Bounce handling webhooks → **suppress** bad recipients.

---

# 2) Week-1 checklist (7–10 days; deepen defenses)

## App & API hardening

* **Unified authorization helper**: central `assertCan(user, action, resource)` (prevents IDOR).
* **Error handling**: generic 4xx/5xx; never leak stack traces or SQL hints to clients.
* **File uploads**:

  * Accept only expected types (e.g., images).
  * **Re-encode** server-side (strip EXIF) before uploading to Supabase Storage.
  * For now, defer AV scanning; enforce **size caps** and **mime sniffing**.

### Next.js security headers (drop-in)

```ts
// middleware.ts
import { NextResponse } from 'next/server'
export function middleware(req: Request) {
  const res = NextResponse.next()
  res.headers.set('Strict-Transport-Security','max-age=31536000; includeSubDomains; preload')
  res.headers.set('X-Content-Type-Options','nosniff')
  res.headers.set('Referrer-Policy','no-referrer')
  res.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=(), interest-cohort=()')
  res.headers.set('Cross-Origin-Opener-Policy','same-origin')
  res.headers.set('Cross-Origin-Resource-Policy','same-origin')
  // CSP: add a per-request nonce and inject into <script nonce="..."> tags in _document.tsx
  return res
}
```

### zod request guard (pattern)

```ts
import { z } from 'zod'
const CreatePost = z.object({
  room_id: z.string().uuid(),
  kind: z.enum(['text','article','site','auction','forecast']),
  body: z.string().max(20000),
  sources: z.array(z.string().url()).max(20).optional(),
})
```

## Supabase RLS examples (copy-paste and adapt)

```sql
-- Profiles
alter table public.profiles enable row level security;
create policy "read own profile or public"
on public.profiles for select
using ( id = auth.uid() or is_public = true );

create policy "update own profile"
on public.profiles for update
using ( id = auth.uid() );

-- Rooms & memberships
alter table public.rooms enable row level security;
alter table public.memberships enable row level security;

-- A user sees rooms they are a member of or that are public
create policy "read visible rooms"
on public.rooms for select
using (
  is_public
  or exists (
    select 1 from public.memberships m
    where m.room_id = rooms.id and m.user_id = auth.uid()
  )
);

-- Only room owner or stewards can update settings
create policy "update room by owner or steward"
on public.rooms for update
using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.memberships m
    where m.room_id = rooms.id and m.user_id = auth.uid() and m.role in ('steward','owner')
  )
);

-- Messages
alter table public.messages enable row level security;
create policy "read messages in visible rooms"
on public.messages for select
using (
  exists (
    select 1 from public.rooms r
    where r.id = messages.room_id and
      ( r.is_public or exists (
        select 1 from public.memberships m
        where m.room_id = r.id and m.user_id = auth.uid()
      ))
  )
);

create policy "insert messages as member"
on public.messages for insert
with check (
  exists (
    select 1 from public.memberships m
    where m.room_id = messages.room_id and m.user_id = auth.uid()
  )
);
```

### Supabase Storage policies

```sql
-- Example: bucket "posts"
create policy "read post media in visible rooms"
on storage.objects for select
using (
  bucket_id = 'posts' and
  exists (
    select 1 from public.messages msg
    join public.rooms r on r.id = msg.room_id
    where msg.id::text = (split_part(name,'/',1)) -- if you use messageId/path.jpg
      and ( r.is_public or exists (
        select 1 from public.memberships m
        where m.room_id = r.id and m.user_id = auth.uid()
      ))
  )
);

create policy "upload post media as member"
on storage.objects for insert
with check (bucket_id = 'posts' and auth.role() = 'authenticated');
```

## Cloudflare extras

* **Transform Rules** to normalize URLs, remove tracking params (`utm_*`) at the edge.
* **Access** (Zero Trust) for **/admin** or internal dashboards: SSO-gated, even if the route exists publicly.
* **Firewall rules** to **allowlist** your Vercel IP ranges for sensitive webhooks (or sign all webhooks).

## Observability & alerts

* Vercel: set **log drains** to your provider (Logtail/Datadog).
* Supabase: enable database **log retention** and monitor auth errors.
* Cloudflare: create alerts for WAF spikes, rate-limit hits, 5xx surges.

---

# 3) Month-1 (strong baseline; privacy & resilience)

## Privacy / “Safer mode”

* **Safer mode toggle** in account settings:

  * Disable link previews and third-party embeds.
  * Hide read receipts/typing.
  * Prefer privacy routes in UI copy (“Private route (Tor)” item in Settings; you can add .onion later).
* **Anonymity hygiene**

  * Don’t auto-link phone numbers/emails in public content.
  * Strip EXIF/location from images on upload.

## CSP tightening (once you enumerate calls)

* Lock `script-src` to `'self' 'nonce-…'`.
* Explicitly list only: your domain(s), your Supabase project endpoints, your image domains.

## Backups & restores

* Supabase PITR verified; practice a **restore drill** into a separate project.
* Export Storage to versioned buckets (or R2) on a nightly job.

## Content lifecycle (deletion-last moderation)

* Implement **states instead of deletes** (needs\_sources/workshop/redirect/duplicate\_merged/disputed/out\_of\_bounds).
* Public **Room Logbook** entry each time a state changes (action + reason).
* Exports: throttle large exports; log and notify the requester; sign manifests.

## Email hygiene

* **DMARC policy** at least `p=quarantine; rua=mailto:dmarc@…` → review reports monthly.
* Disable inbound HTML unless absolutely needed; render safe markdown.

---

# 4) Cloudflare + Vercel deployment notes (gotchas)

* Keep **Cloudflare proxied** (orange cloud) on the apex and `www` → CNAME to Vercel.
* In Vercel, **add the domain** so certs are valid; Cloudflare **Full (strict)** ensures TLS all the way.
* If you need country-level blocks/challenges, do it in **Cloudflare WAF**, *not* in app code.
* For **static assets** heavy traffic, consider a CDN route at Cloudflare; but Vercel already CDN-caches static content—avoid double-cache bugs by setting clear Cache-Control.

---

# 5) Minimal code you can drop in now

## Next.js CSP with nonces (sketch)

1. In middleware, generate a nonce and stash on `request headers` or `cookies`.
2. In `_document.tsx`, read the nonce and add it to `<script nonce={nonce}>`.
3. CSP header example (add Supabase endpoints you use):

```
Content-Security-Policy:
default-src 'self';
script-src 'self' 'nonce-{nonce}';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://<project>.supabase.co https://*.supabase.in;
connect-src 'self' https://<project>.supabase.co wss://<project>.supabase.co;
media-src 'self' blob:;
frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'
```

## Image sanitize (server function)

* Use `sharp` in an API route to decode/re-encode JPEG/PNG/WebP → upload to Supabase Storage.
* Reject files > e.g. 8 MB; reject MIME not matching magic bytes.

---

# 6) Operational runbooks (one-pagers to keep handy)

* **Incident**: DDoS, key leak, data exposure, account takeover → who pages whom; Cloudflare WAF tighten; rotate Supabase keys; revoke tokens; post-mortem template.
* **Restore**: How to PITR restore Supabase, re-point env vars, warm caches.
* **Access**: How to add/remove staff SSO, enforce MFA.
* **Disclosure**: Security.txt (or “/security” page) + security@ mailbox; triage SLA (e.g., acknowledge <48h).

---

# 7) Quick scorecard (track weekly)

* **Auth**: % staff with MFA; passkey adoption.
* **DB**: tables with RLS = 100%; last restore drill date.
* **Edge**: WAF/rate-limit events; 5xx rate; TLS A+.
* **Storage**: % signed URLs; objects with EXIF stripped.
* **App**: CSP violations (should trend to 0); zod validation failures (expected level).
* **Abuse**: login throttles triggered; Turnstile challenges; content state changes vs deletions.
* **Privacy**: Safer-mode usage; export requests SLA.

---

## Priorities (if you can only do a few things this week)

1. **Cloudflare**: Full (strict) TLS, HSTS, WAF + Rate-limits, Turnstile on signup.
2. **Supabase**: RLS on all tables, Storage not-public, service key only server-side, enable backups/PITR.
3. **Vercel**: Security headers + CSP with nonces, protect preview, Origin/Referer checks, zod on inputs.
4. **Email**: SPF/DKIM/DMARC set, links sanitized.
5. **Runbooks & alerts**: basic alarms, incident channel, key rotation checklist.

This gets you to a **solid baseline** on Vercel + Supabase with Cloudflare guarding the door. From there, you can layer in the “at-risk” features (private routes, onion mirror later), E2EE DMs, and deeper governance tooling—without having to re-architect your security posture.
