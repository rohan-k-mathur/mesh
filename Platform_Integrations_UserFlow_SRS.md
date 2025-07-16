### Goal

Let a non‑technical user link Shopify, Gmail/Google Workspace, Meta (Instagram / Facebook), TikTok, Pinterest, Stripe, etc. **in < 60 seconds, with no copying of API keys**—and keep those connections healthy so Flowstate can run automations unattended.

---

## 1. Core Design Principles

| Principle                                   | What it means in practice                                                                                                                                                                           |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **OAuth Everywhere**                        | Use the provider’s first‑party OAuth 2.0 / OpenID Connect flow so the user logs in on a familiar consent screen. Flowstate owns the *app credentials* (client‑id/secret); the user never sees them. |
| **One “Connections” Hub**                   | A single page inside Settings that lists all services with status chips (✅ Connected / ⚠️ Needs re‑auth / ➕ Connect).                                                                               |
| **“Least‑Privilege + Just‑in‑Time” scopes** | Ask only for scopes required by the blocks present in the workflow. Expand scopes later via incremental consent if the user adds new blocks.                                                        |
| **Host‑side Secret Vault**                  | Store access & refresh tokens encrypted at rest (AES‑256‑GCM via AWS KMS or Hashicorp Vault) and in memory only as long as needed.                                                                  |
| **Auto‑Refresh & Rotation**                 | A background job refreshes tokens before expiry, rotates if the provider offers short‑lived tokens (Meta, Google). Fail‑open options are never used.                                                |
| **Clear Recovery Paths**                    | If a token expires or permissions are revoked, the next run pauses and surfaces a “Re‑connect” button that jumps directly back into the OAuth flow.                                                 |

---

## 2. High‑Level Component Diagram

```
Browser (React) ──▶ /connections          │  ← lists linked services
                       │
                       ├─ “Connect Shopify”  
                       ▼                       (1) OAuth / install flow
                 OAuth Popup Window ────────▶ Shopify Consent
                                              (redirect_uri = Flowstate /oauth/callback/shopify)

 Flowstate API  
 ├─ /oauth/callback/<provider>               (2) Exchanges code for token
 ├─ Secrets Vault                            (3) Stores encrypted token + metadata
 └─ Token Refresh Worker  ◄──────────────────(4) Refresh loop / webhooks for revocation
```

---

## 3. Provider‑Specific Notes & Best Practices

| Provider                     | Recommended Flow                            | Special Steps                                                                                                                               | Token Lifetime & Refresh Technique                                                             |
| ---------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Shopify**                  | App‑installation OAuth within Shopify Admin | Pre‑list Flowstate as a *Sales/Marketing* app (unlisted is fine for beta). Include “write\_products, read\_inventory, read\_orders” scopes. | Permanent access token (no refresh). Rotate on uninstall event.                                |
| **Google / Gmail / YouTube** | OAuth 2.0 **PKCE** (Authorization‑Code)     | Domain‑verification & Google Cloud consent‑screen approval. Request granular scopes: `gmail.send`, `gmail.readonly`, `analytics.readonly`.  | Refresh token valid until user revokes. Use offline access.                                    |
| **Meta (IG/FB)**             | Facebook Login (Business Integration)       | App review for `instagram_basic`, `instagram_manage_comments`, `pages_show_list` etc. Provide clear business use in review screencast.      | Short‑lived user token → long‑lived (60 d). Auto‑rotate via Facebook token‑extension endpoint. |
| **TikTok**                   | TikTok Marketing OAuth                      | Requires developer app approval for `scope=ads.read,ads.write,content.publish`.                                                             | 30‑day refresh token; refresh 3 days before expiry.                                            |
| **Pinterest**                | Content Publishing API OAuth                | Must whitelist Pinterest Business Account IDs while in beta.                                                                                | Tokens last 30 d; refresh via `POST /v5/oauth/token`.                                          |
| **QuickBooks**               | Intuit OpenID OAuth 2.0                     | Production keys require Intuit app review; supply sample data.                                                                              | Refresh token 100 d; access token 1 h.                                                         |
| **Stripe**                   | Stripe Connect (*Standard* accounts)        | User is redirected to `https://connect.stripe.com/oauth/authorize`. Flowstate receives `stripe_user_id`.                                    | No refresh token; re‑auth only if account deauthorizes.                                        |

---

## 4. User Experience Flow (Example: “Connect Instagram”)

| Screen                     | User Action                                               | Behind the Scenes                                                                                                  |
| -------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Connections Hub**        | Click **Connect Instagram**                               | React opens 600×700 popup pointing at Flowstate `/oauth/redirect/meta?state=…&code_verifier=…`                     |
| **Meta Consent**           | Logs into FB, selects IG business account, clicks *Allow* | Meta redirects back to `/oauth/callback/meta?code=…&state=…`                                                       |
| **Flowstate Status Toast** | Sees “Instagram connected!”                               | API exchanges code → long‑lived token; stores in Secrets Vault; schedules refresh; emits `ConnectionCreated` event |
| **Builder Block**          | Adds “Post to IG” Action                                  | Block introspects available connections; pre‑selects the just‑linked account                                       |

*Average time: 20–30 seconds.*

---

## 5. Implementation Checklist (Eng‑Facing)

1. **Create `integration` table**

   ```sql
   id UUID PK
   org_id FK
   provider ENUM('shopify','google','meta','tiktok',…)
   external_account_id TEXT
   access_token_ciphertext BYTEA
   refresh_token_ciphertext BYTEA NULL
   scope TEXT[]
   expires_at TIMESTAMPTZ NULL
   created_at, updated_at
   ```
2. **API Routes**

   * `POST /connections/:provider/prepare` → returns `authUrl`, `code_verifier`, `state`.
   * `GET  /oauth/callback/:provider` → handles exchange & persistence.
   * `POST /connections/:id/disconnect` → revokes & deletes tokens.
3. **Front‑End Hooks** (`useConnection(provider)`)

   * Returns `{status, connect(), disconnect(), reauth()}` for blocks & settings page.
4. **Token Refresh Worker**

   * Runs every 15 min; selects integrations where `expires_at < now()+30h`; attempts refresh; publishes `ConnectionInvalid` on failure.
5. **Security Hardening**

   * Rotate database encryption key quarterly (envelope encryption).
   * Store PKCE `code_verifier` only in secure, http‑only cookie.
   * Rate‑limit callback endpoint (to avoid auth‑code replay).
6. **Audit & Governance**

   * OPA policy `no_write_if_scope_missing` ensures a workflow step cannot execute if connection lacks required scope (prevents silent failures).
   * All connection events are logged to audit ledger (user id, provider, action, timestamp, IP).

---

## 6. Edge Cases & Recovery

| Scenario                                                                                          | UX                                                                     | System Behaviour                                                                           |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| User revokes permissions in provider dashboard                                                    | “Needs re‑auth” badge turns red; flow runs pause with actionable error | Webhook/cron detects token failure, updates `status`, queues `ReAuthRequired` notification |
| Multi‑account (e.g., two Shopify stores)                                                          | User clicks **Connect** again → adds second row in list                | Each block can choose which account to use (`store_name` label)                            |
| Scope upgrade (e.g., user adds IG comment‑moderation block requiring `instagram_manage_comments`) | Builder detects missing scope → shows “Add permission” link            | Redirects user through **incremental consent** flow; merges new scope list in DB           |
| GDPR data‑deletion request                                                                        | Admin clicks “Delete Connection & Data”                                | Tokens revoked, historical payloads for that connection anonymised or wiped as per DPA     |

---

## 7. UX Copy Snippets (battle‑tested)

* “**Why do we need this?** We’ll post on your behalf—never without your approval—and read basic metrics so we can show performance dashboards.”
* “Flowstate cannot see your password and you can revoke access at any time.”
* Button labels: **Connect**, **Reconnect**, **Disconnect** (avoid “Authorize” jargon).

---

## 8. Recommended Libraries / Services

| Task                | Suggestion                                                            |
| ------------------- | --------------------------------------------------------------------- |
| OAuth client helper | **openapi‑oauth‑client** or **Simple‑OAuth2** (Node)                  |
| Token encryption    | `@aws‑sdk/client‑kms` + `crypto.randomUUID()` IV                      |
| PKCE utilities      | `pkce‑challenge` NPM pkg                                              |
| Secrets vault       | AWS Secrets Manager, Hashicorp Vault, or Postgres `pgcrypto` columns  |
| Refresh scheduling  | Temporal cron workflow, or BullMQ + Redis if Temporal not yet adopted |

---

## 9. Minimal Prototype Timeline (2 Sprints)

| Sprint | Deliverable                                                      | Success Metric                                                                  |
| ------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **1**  | Shopify + Google connectors end‑to‑end; Connections Hub UI       | First merchant installs Flowstate Shopify App and schedules a test post         |
| **2**  | Meta + Stripe + token‑refresh worker; Pause/Resume on auth error | Flow run auto‑pauses on expired Meta token and resumes after re‑auth in < 5 min |

---

### Bottom Line

Implementing an **OAuth‑first “Connections Hub” backed by a secure token‑vault and auto‑refresh worker** is the quickest, least‑friction path for SMB users. They press *Connect*, approve familiar consent screens, and Flowstate is ready to automate—no API keys, no manuals, no surprises.
