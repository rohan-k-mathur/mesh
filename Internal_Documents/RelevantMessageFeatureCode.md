│  ├─ messages
│  │  │  │  └─ [id]
│  │  │  │     └─ page.tsx

—
import { fetchMessages } from "@/lib/actions/message.actions";
import { fetchConversation } from "@/lib/actions/conversation.actions";
import { getUserFromCookies } from "@/lib/server/getUser";
import { redirect, notFound } from "next/navigation";
import ChatRoom from "@/components/chat/ChatRoom";
import MessageComposer from "@/components/chat/MessageComposer";
import MessengerPane from "@/components/chat/MessengerPane";
import Image from "next/image";
import { headers } from "next/headers";


export default async function Page({ params, searchParams }: { params: { id: string }; searchParams: { mid?: string } }) {
  const user = await getUserFromCookies();
  if (!user?.userId) redirect("/login");

  const conversationId = BigInt(params.id);
  let conversation;
  try {
    conversation = await fetchConversation(conversationId, user.userId);
  } catch {
    notFound();
  }
  const isGroup = conversation.is_group;


  // Build a title for the header
  const title = (() => {
    if (conversation.is_group) {
      if (conversation.title?.trim()) return conversation.title!;
      const others = conversation.participants
        .filter((p) => p.user_id !== user.userId)
        .map((p) => p.user.name);
      const base = others.slice(0, 3).join(", ");
      const extra = others.length - 3;
      return extra > 0 ? `${base} +${extra}` : base || "Group";
    } else {
      const other = conversation.participants.find((p) => p.user_id !== user.userId)?.user;
      return other?.name ?? "Direct Message";
    }
  })();
  // Header avatar data
  const headerUsers = isGroup
    ? conversation.participants
        .filter((p) => p.user_id !== user.userId)
        .map((p) => p.user)
    : [
        conversation.participants.find((p) => p.user_id !== user.userId)?.user,
      ].filter(Boolean) as { name: string; image: string | null }[];


  // Messages newest->oldest then flip so newest at bottom
  const rows = (await fetchMessages({ conversationId })).reverse();
  
  const highlightMessageId = searchParams?.mid || null;
 // Build an absolute base URL for server-side fetch
const h = headers();
const host = h.get("x-forwarded-host") ?? h.get("host");
const proto = h.get("x-forwarded-proto") ?? "http";
const base = `${proto}://${host}`;

// Get Layer-aware messages (viewer-filtered + sender object)
const res = await fetch(
  `${base}/api/sheaf/messages?conversationId=${conversationId.toString()}&userId=${user.userId.toString()}`,
  { cache: "no-store" }
);
const { messages: initialMessages } = await res.json();
  return (
    <main className="p-4 mt-[-4rem] items-center justify-center">
      <div className="flex w-full h-full items-center justify-center align-center gap-4">
                {isGroup ? (
          // Composite avatar (up to 4 faces)
          <div className="flex flex-wrap rounded-full gap-4 ">
            {headerUsers.slice(0, 4).map((u, i) => (
                       <button key={u?.name ?? i} className="flex w-[2.5rem] h-[2.5rem]">
                         <Image
                src={u.image || "/assets/user-helsinki.svg"}
                alt={u.name}
                width={50}
                height={50}
                className="rounded-full object-fill p-1 profile-shadow bg-white/20 align-center justify-center items-center"
                />
                     </button>

            ))}
          </div>
        ) : (
          // Single avatar
          <button className="flex w-[2.5rem] h-[2.5rem]">
          <Image
            src={headerUsers[0]?.image || "/assets/user-helsinki.svg"}
            alt={headerUsers[0]?.name ?? "User"}
            width={50}
            height={50}
            className="rounded-full object-fill w-full h-full p-[.1rem] profile-shadow bg-white/20 align-center justify-center items-center"
          />
          </button>
        )}
        <button>
        <h1 className="text-[2.1rem] justify-center items-center align-center tracking-wider mt-1">{title}</h1>
        </button>
      </div>
      <hr className="mt-3"/>



  <div className="mt-6 space-y-6">
  
  <ChatRoom
        conversationId={params.id}
        currentUserId={user.userId.toString()}
        currentUserName={user.username ?? ""}
 currentUserImage={user.photoURL ?? null}
        initialMessages={initialMessages}
        highlightMessageId={highlightMessageId ?? null}
      />
      <hr />
      <MessageComposer
        conversationId={String(conversationId)}
        currentUserId={user.userId.toString()}
        currentUserName={user.username ?? ""}
 currentUserImage={user.photoURL ?? null}
      />
    </div>
    <MessengerPane currentUserId={user.userId.toString()} />
  </main>
    );
}



│  │  ├─ notifications
│  │  │  │  ├─ NotificationsList.tsx
│  │  │  │  └─ page.tsx

-"use client";

import Image from "next/image";
import Link from "next/link";
import { useNotifications } from "@/hooks/useNotifications";

interface Props {
  initial: any[];
}

export default function NotificationsList({ initial }: Props) {
  const { notifications, deleteNotification, clearNotifications } =
    useNotifications();

  const list = notifications.length > 0 ? notifications : initial;

  return (
    <>
      {list.length > 0 && (

        <button
          className="relative -right-[90%] mb-0 mt-4 bg-white bg-opacity-20 text-sm savebutton rounded-xl tracking-wide px-3 py-1 text-center"
          onClick={clearNotifications}
        >
          Clear All
        </button>
      )}

      <section className="mt-6 flex flex-col gap-3 ">
        {list.length > 0 ? (
          <>
            {list.map((n: any) => {
              const id = typeof n.id === "string" ? BigInt(n.id) : (n.id as bigint);
              return (
                <div
                  key={n.id.toString()}
                  className="flex items-center gap-2 px-5 py-3 bg-indigo-300 bg-opacity-40 rounded-xl border-none sheaf-bubble inline-block"
                >
                  <button
                    onClick={() => deleteNotification(id)}
                    className="relative text-center align-center rounded-full  w-fit h-fit px-[.4rem] bg-transparent text-[.9rem] font-bold mr-6"
                    aria-label="delete"
                  >
                    ×
                  </button>
                  <div className="flex inline-block align-center gap-2 tracking-wide">
                    <Image
                      src={n.actor?.image || "/assets/user-helsinki.svg"}
                      alt="Profile Picture"
                      width={24}
                      height={24}
                      className="rounded-full object-cover w-5 h-5 mr-0 flex align-center"
                    />
                    {n.type === "FOLLOW" && (
                      <Link href={`/profile/${n.actor_id}`}>
                        <p className="!text-base text-black">
                          <span className="mr-2 text-blue">{n.actor?.name}</span> Followed You
                        </p>
                      </Link>
                    )}
                    {n.type === "MESSAGE" && (
                      <Link href={`/messages/${n.conversation_id}`}>
                        <p className="!text-base text-black">
                          <span className="mr-2 text-blue">{n.actor?.name}</span> Sent You a Message
                        </p>
                      </Link>
                    )}
                    {n.type === "TRADE_EXECUTED" && n.market && n.trade && (
                      <Link href={`/prediction/${n.market_id}`}>
                        <p className="!text-base text-black">
                          <span className="mr-2 text-blue">{n.actor?.name}</span> Trade on {n.market.question} Executed at {Math.round(n.trade.price * 100)}%
                        </p>
                      </Link>
                    )}
                    {n.type === "MARKET_RESOLVED" && n.market && (
                      <Link href={`/prediction/${n.market_id}`}>
                        <p className="!text-base text-black">
                          Market {n.market.question} Resolved to {n.market.outcome}
                        </p>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <p className="!text-base-regular text-light-3">No notifications</p>
        )}
      </section>
    </>
  );
}
 -
import { fetchNotifications } from "@/lib/actions/notification.actions";
import { jsonSafe } from "@/lib/bigintjson";
import { getUserFromCookies } from "@/lib/serverutils";
import { redirect } from "next/navigation";
import NotificationsList from "./NotificationsList";
export default async function Page() {
  const user = await getUserFromCookies();
  if (!user?.userId) redirect("/login");
  const initialRaw = await fetchNotifications({ userId: user.userId });
  const initial = jsonSafe(initialRaw);

  return (
    <section>
      <h1 className="head-text mb-2 mt-[-3rem] ">Notifications</h1>
      <hr></hr>
      <NotificationsList initial={initial} />

    </section>
  );
}



─ profile
│  │  │  │  ├─ [id]
│  │  │  │  │  ├─ customize
│  │  │  │  │  │  ├─ customize-components.tsx
│  │  │  │  │  │  └─ page.tsx
│  │  │  │  │  ├─ messages
│  │  │  │  │  │  └─ page.tsx
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ articles
│  │  │  │  │  ├─ page.tsx
│  │  │  │  │  └─ ui
│  │  │  │  │     └─ ArticlesDashboard.tsx
│  │  │  │  ├─ messages
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ settings
│  │  │  │  │  ├─ (admin)
│  │  │  │  │  │  └─ page.tsx
│  │  │  │  │  ├─ (client)
│  │  │  │  │  │  └─ AccountForm.tsx
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ sites
│  │  │  │  │  ├─ page.tsx
│  │  │  │  │  └─ ui
│  │  │  │  │     └─ SitesDashboard.tsx
│  │  │  │  └─ stacks
│  │  │  │     ├─ page.tsx
│  │  │  │     └─ ui
│  │  │  │        └─ StacksDashboard.tsx

-app/(root)/(standard)/profile/messages/page.tsx: import { fetchConversations } from "@/lib/actions/conversation.actions";
import { getUserFromCookies } from "@/lib/serverutils";
import { redirect } from "next/navigation";
import ConversationList from "@/components/chat/ConversationList";
import GroupCreationModal from "@/components/chat/GroupCreationModal";
import MessageUserModal from "@/components/chat/MessageUserModal";

export default async function Page() {
  const user = await getUserFromCookies();
  if (!user?.userId) redirect("/login");
  const rows = await fetchConversations(user.userId);
  const list = rows.map((c) => ({
    id: c.id.toString(),
    isGroup: c.is_group,
    title: c.title,
    participants: c.participants.map((p) => ({
      id: p.user_id.toString(),
      name: p.user.name,
      image: p.user.image,
    })),
    lastMessage: c.messages[0]?.text ?? null,
  }));
  return (
    <main className="p-4 mt-[-2rem]">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[3rem] text-center">Messages</h1>
        <div className="flex gap-4">
        <GroupCreationModal />
        <MessageUserModal />
        </div>
      </div>
      <hr />
      <ConversationList
        conversations={list}
        currentUserId={user.userId.toString()}
      />
    </main>
  );
}



│  ├─ (server)
│  │  └─ sheafActions.ts

-// app/(server)/sheafActions.ts
'use server';

import { createMessage, listMessagesFor } from '@/app/api/_sheaf-acl-demo/_store';

export async function createSheafMessage(input: Parameters<typeof createMessage>[0]) {
  return createMessage(input);
}

export async function listSheafMessagesFor(userId: string) {
  return listMessagesFor(userId);
}



│  ├─ admin
│  │  └─ sheaf
│  │     ├─ layout.tsx
│  │     └─ page.tsx

-// Server Component
import { prisma } from '@/app/api/sheaf/_prisma';
import { toAclFacet, userCtxFrom } from '@/app/api/sheaf/_map';
import { visibleFacetsFor, defaultFacetFor } from '@app/sheaf-acl';
import React from 'react';

export const dynamic = 'force-dynamic';

function FacetBadges({ labels }: { labels: string[] }) {
  if (labels.length === 0) return <span className="text-slate-500">none</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((l, i) => (
        <span key={i} className="inline-block rounded-full border px-2 py-0.5 text-xs bg-white/70 text-slate-700">
          {l}
        </span>
      ))}
    </div>
  );
}

export default async function SheafAdminPage() {
  // Pick a small cohort to display (e.g., last 3 created users)
  const users = await prisma.user.findMany({
    orderBy: { created_at: 'desc' },
    take: 3,
    select: { id: true, username: true, name: true },
  });

  const messages = await prisma.message.findMany({
    orderBy: { created_at: 'desc' },
    take: 20,
    select: { id: true, created_at: true, sender_id: true },
  });

  const messageIds = messages.map(m => m.id);
  const facets = await prisma.sheafFacet.findMany({ where: { messageId: { in: messageIds } } });

  // Preload dynamic lists referenced
  const listIds = Array.from(new Set(facets.map(f => f.audienceListId).filter(Boolean))) as string[];
  const lists = new Map((await prisma.sheafAudienceList.findMany({ where: { id: { in: listIds } } }))
    .map(l => [l.id, l]));

  // Preload viewer roles (global roles)
  const userRoles = await prisma.userRole.findMany({ where: { userId: { in: users.map(u => u.id) } } });
  const rolesByUser = new Map<string, string[]>();
  for (const u of users) rolesByUser.set(u.id.toString(), []);
  for (const r of userRoles) {
    const arr = rolesByUser.get(r.userId.toString())!;
    arr.push(r.role);
  }

  // Group facets by message
  const fByMsg = new Map<string, typeof facets>();
  for (const f of facets) {
    const key = f.messageId.toString();
    if (!fByMsg.has(key)) fByMsg.set(key, []);
    fByMsg.get(key)!.push(f);
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-xl font-semibold">Sheaf Admin — Per-User Visibility</h1>
      <div className="mt-6 space-y-6">
        {messages.map((m) => {
          const fs = (fByMsg.get(m.id.toString()) ?? []).map(toAclFacet);
          if (fs.length === 0) return null;

          return (
            <div key={m.id.toString()} className="rounded-xl border bg-white/70 p-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-sm text-slate-600">Message</div>
                  <div className="font-mono text-xs text-slate-700">{m.id.toString()}</div>
                </div>
                <div className="text-xs text-slate-600">{new Date(m.created_at).toLocaleString()}</div>
              </div>

              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="py-1 pr-3">User</th>
                    <th className="py-1 pr-3">Visible Facets</th>
                    <th className="py-1 pr-3">Default</th>
                    <th className="py-1">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const ctx = userCtxFrom(
                      { id: u.id, auth_id: '', created_at: new Date(), updated_at: null, username: u.username, name: u.name } as any,
                      rolesByUser.get(u.id.toString()) ?? [],
                      lists
                    );
                    const vis = visibleFacetsFor(ctx, fs);
                    const def = defaultFacetFor(ctx, fs);
                    const labels = vis.map((f) => {
                      switch (f.audience.kind) {
                        case 'EVERYONE': return 'Public';
                        case 'ROLE': return `Role:${f.audience.role}`;
                        case 'LIST': return f.audience.listId;
                        case 'USERS': return 'Direct';
                      }
                    });
                    const defLabel = def
                      ? (def.audience.kind === 'EVERYONE'
                          ? 'Public'
                          : def.audience.kind === 'ROLE'
                            ? `Role:${def.audience.role}`
                            : def.audience.kind === 'LIST'
                              ? def.audience.listId
                              : 'Direct')
                      : '—';
                    const preview = typeof (def?.body as any)?.text === 'string'
                      ? (def?.body as any).text
                      : '—';

                    return (
                      <tr key={u.id.toString()} className="border-t">
                        <td className="py-2 pr-3">
                          <div className="font-medium">{u.name ?? u.username}</div>
                          <div className="text-xs text-slate-500">{u.id.toString()}</div>
                        </td>
                        <td className="py-2 pr-3"><FacetBadges labels={labels as string[]} /></td>
                        <td className="py-2 pr-3">{defLabel}</td>
                        <td className="py-2"><div className="truncate text-slate-800">{preview}</div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}


  │  ├─ _sheaf-acl-demo
│  │  │  ├─ _store.ts
│  │  │  ├─ _util.ts
│  │  │  ├─ admin
│  │  │  │  ├─ messages
│  │  │  │  │  └─ [id]
│  │  │  │  │     └─ page.tsx
│  │  │  │  └─ page.tsx
│  │  │  ├─ forward-check
│  │  │  │  └─ route.ts
│  │  │  ├─ messages
│  │  │  │  └─ route.ts
│  │  │  └─ preview
│  │  │     └─ route.ts

-/** Core types for Sheaf ACL */

export type AudienceKind = 'EVERYONE' | 'ROLE' | 'LIST' | 'USERS';
export type AudienceMode = 'DYNAMIC' | 'SNAPSHOT';
export type SharePolicy = 'ALLOW' | 'REDACT' | 'FORBID';

export type AudienceSelector =
  | { kind: 'EVERYONE'; mode?: 'DYNAMIC' } // implicit dynamic
  | { kind: 'ROLE'; role: string; mode: 'DYNAMIC' }
  | {
      kind: 'LIST';
      listId: string;
      mode: AudienceMode;
      /** When mode=SNAPSHOT, the frozen set at send time */
      snapshotMemberIds?: string[];
      /** Optional provenance for SNAPSHOT */
      listVersionAtSend?: number;
    }
  | {
      kind: 'USERS';
      mode: AudienceMode;
      /** When mode=DYNAMIC, explicit users */
      userIds?: string[];
      /** When mode=SNAPSHOT, the frozen set at send time */
      snapshotMemberIds?: string[];
    };

export interface AttachmentRef {
  id: string;
  name: string;
  mime: string;
  size: number;
  sha256: string;
}

export interface MessageFacet {
  id: string;
  messageId: string;
  audience: AudienceSelector;
  sharePolicy: SharePolicy;
  expiresAt?: number | null; // epoch ms
  body: unknown; // your tiptap JSON, etc.
  attachments?: AttachmentRef[];
  createdAt?: number; // epoch ms; used for tie-break in sorting
  /** Optional cached rank (lower = more private), but recomputed if absent */
  updatedAt?: number;
  priorityRank?: number;
}

export interface Message {
  id: string;
  threadId: string;
  authorId: string;
  createdAt: number;
  replyTo?: string | null;
  facets: MessageFacet[];
  defaultFacetId?: string | null;
}

export interface UserContext {
  id: string;
  roles: Set<string>;
  /**
   * Dynamic list membership resolver (server-side). If omitted, dynamic LIST checks
   * will be treated as false for visibility and "indeterminate" for subset checks.
   */
  inList?: (listId: string) => boolean;
}

/** Optional environment for subset checks across dynamic audiences */
export interface AudienceEnv {
  resolveListMembers?: (listId: string) => string[] | null | undefined;
  resolveRoleMembers?: (role: string) => string[] | null | undefined;
}

/** Tri-state for subset checks */
export type Tri = 'yes' | 'no' | 'indeterminate';

-import type {
    AudienceEnv,
    AudienceSelector,
    AudienceMode,
    MessageFacet,
    Tri,
    UserContext,
  } from './types';

  /** Rank: lower is "more private" and wins as default */
  export function priorityRank(a: AudienceSelector): number {
    switch (a.kind) {
      case 'USERS':
        return 100;
      case 'LIST':
        return 200;
      case 'ROLE':
        return 300;
      case 'EVERYONE':
        return 400;
      default:
        return 999;
    }
  }
  
  function createdAtMs(f: MessageFacet): number {
    // Treat undefined createdAt as 0 for deterministic order in tests
    return typeof f.createdAt === 'number' ? f.createdAt : 0;
  }
  
  /** Sort by privacy rank (asc) then createdAt (asc) */
  export function sortFacetsForDefault(facets: MessageFacet[]): MessageFacet[] {
    return [...facets].sort((a, b) => {
      const ar = a.priorityRank ?? priorityRank(a.audience);
      const br = b.priorityRank ?? priorityRank(b.audience);
      if (ar !== br) return ar - br;
      return createdAtMs(a) - createdAtMs(b);
    });
  }
  
  /** Visible = union of facets the user qualifies for at view time */
  export function visibleFacetsFor(
    user: UserContext,
    facets: MessageFacet[]
  ): MessageFacet[] {
    const visible = facets.filter((f) => isUserInAudience(user, f.audience));
    return sortFacetsForDefault(visible);
  }
  
  /** Default facet = most private visible facet (or null) */
  export function defaultFacetFor(
    user: UserContext,
    facets: MessageFacet[]
  ): MessageFacet | null {
    const vis = visibleFacetsFor(user, facets);
    return vis.length ? vis[0] : null;
  }
  
  /** Core membership check for a user against an audience selector */
  export function isUserInAudience(
    user: UserContext,
    a: AudienceSelector
  ): boolean {
    switch (a.kind) {
      case 'EVERYONE':
        return true;
      case 'ROLE':
        return user.roles.has(a.role);
      case 'LIST':
        if (a.mode === 'SNAPSHOT') {
          const snap = a.snapshotMemberIds ?? [];
          return snap.includes(user.id);
        } else {
          return !!user.inList?.(a.listId);
        }
      case 'USERS':
        if (a.mode === 'SNAPSHOT') {
          const snap = a.snapshotMemberIds ?? [];
          return snap.includes(user.id);
        } else {
          const ids = a.userIds ?? [];
          return ids.includes(user.id);
        }
    }
  }
  
  /**
   * Does "target" form a subset of "original"? (i.e., can we forward from original → target?)
   * Returns tri-state: 'yes' | 'no' | 'indeterminate'.
   * For DYNAMIC audiences we need env resolvers to know the actual set; otherwise we return 'indeterminate'
   * except for trivial structural cases (e.g., X ⊆ EVERYONE).
   */
export function audienceSubsetOf(
  target: AudienceSelector,
  original: AudienceSelector,
  env?: AudienceEnv
): Tri {
  // ORIGINAL = EVERYONE ⇒ always superset
  if (original.kind === 'EVERYONE') return 'yes';

  // If TARGET = EVERYONE but ORIGINAL ≠ EVERYONE, it's never a subset
  if (target.kind === 'EVERYONE') return 'no';

  // Equal selectors are trivially subset
  if (audienceSelectorsEqual(target, original)) return 'yes';

  
    // If both sides can be materialized to explicit sets, compare sets
    const targetSet = materializeMembers(target, env);
    const originalSet = materializeMembers(original, env);
  
    if (targetSet && originalSet) {
      return isSubset(targetSet, originalSet) ? 'yes' : 'no';
    }
  
    // Structural subset rules that don't require full sets
    // USERS (any) ⊆ ROLE is 'indeterminate' unless env supplies role members
    // USERS (any) ⊆ LIST(DYNAMIC) is 'indeterminate' unless env supplies list members
  
    // LIST(DYNAMIC) same listId on both sides: equal sets → subset
    if (
      target.kind === 'LIST' &&
      original.kind === 'LIST' &&
      target.mode === 'DYNAMIC' &&
      original.mode === 'DYNAMIC' &&
      target.listId === original.listId
    ) {
      return 'yes';
    }
  
    // ROLE(DYNAMIC) same role is subset (equal)
    if (
      target.kind === 'ROLE' &&
      original.kind === 'ROLE' &&
      target.role === original.role
    ) {
      return 'yes';
    }
  
    // LIST(SNAPSHOT) ⊆ LIST(DYNAMIC same listId) is indeterminate without env (members may have changed)
    if (
      target.kind === 'LIST' &&
      original.kind === 'LIST' &&
      target.mode === 'SNAPSHOT' &&
      original.mode === 'DYNAMIC' &&
      target.listId === original.listId
    ) {
      return 'indeterminate';
    }
  
    // Otherwise we don't know without env
    return 'indeterminate';
  }
  
  /** Forwarding policy check based on original facet sharePolicy + subset relation */
  export function canForward(
    originalFacet: MessageFacet,
    target: AudienceSelector,
    env?: AudienceEnv
  ): 'ALLOW' | 'REDACT' | 'FORBID' {
    switch (originalFacet.sharePolicy) {
      case 'FORBID':
        return 'FORBID';
      case 'REDACT':
        return 'REDACT';
      case 'ALLOW': {
        const tri = audienceSubsetOf(target, originalFacet.audience, env);
        return tri === 'yes' ? 'ALLOW' : 'REDACT';
      }
    }
  }
  
  /* ------------------------ Helpers ------------------------ */
  
  function audienceSelectorsEqual(a: AudienceSelector, b: AudienceSelector): boolean {
    if (a.kind !== b.kind) return false;
    switch (a.kind) {
      case 'EVERYONE':
        return true;
      case 'ROLE':
        return b.kind === 'ROLE' && a.role === b.role;
      case 'LIST':
        return b.kind === 'LIST' && a.listId === b.listId && a.mode === b.mode &&
          (a.mode !== 'SNAPSHOT' ||
            arraysEqual(sorted(a.snapshotMemberIds), sorted((b as any).snapshotMemberIds)));
      case 'USERS':
        if (b.kind !== 'USERS' || a.mode !== b.mode) return false;
        if (a.mode === 'SNAPSHOT') {
          return arraysEqual(sorted(a.snapshotMemberIds), sorted(b.snapshotMemberIds));
        } else {
          return arraysEqual(sorted(a.userIds), sorted(b.userIds));
        }
    }
  }
  
  function arraysEqual(a?: readonly string[] | null, b?: readonly string[] | null): boolean {
    const aa = a ?? [];
    const bb = b ?? [];
    if (aa.length !== bb.length) return false;
    for (let i = 0; i < aa.length; i++) if (aa[i] !== bb[i]) return false;
    return true;
  }
  
  function sorted(a?: readonly string[] | null): string[] {
    return [...(a ?? [])].sort();
  }
  
  function isSubset(a: Set<string>, b: Set<string>): boolean {
    for (const x of a) if (!b.has(x)) return false;
    return true;
  }
  
  /**
   * Try to materialize the concrete set of userIds represented by an AudienceSelector.
   * Returns:
   *   - Set<string> when we can know the exact membership
   *   - null when it is dynamic/unknown without env
   */
  function materializeMembers(
    a: AudienceSelector,
    env?: AudienceEnv
  ): Set<string> | null {
    switch (a.kind) {
      case 'EVERYONE':
        return null; // infinite set, treat structurally elsewhere
      case 'ROLE': {
        const members = env?.resolveRoleMembers?.(a.role);
        return members ? new Set(members) : null;
      }
      case 'LIST':
        if (a.mode === 'SNAPSHOT') {
          return new Set(a.snapshotMemberIds ?? []);
        } else {
          const members = env?.resolveListMembers?.(a.listId);
          return members ? new Set(members) : null;
        }
      case 'USERS':
        if (a.mode === 'SNAPSHOT') return new Set(a.snapshotMemberIds ?? []);
        return new Set(a.userIds ?? []);
    }
  }
  
-import { describe, it, expect } from 'vitest';
import {
  AudienceSelector,
  MessageFacet,
  UserContext,
  audienceSubsetOf,
  canForward,
  defaultFacetFor,
  visibleFacetsFor,
} from '../src';

const facet = (a: AudienceSelector, extra?: Partial<MessageFacet>): MessageFacet => ({
  id: `f_${Math.random()}`,
  messageId: 'm1',
  audience: a,
  sharePolicy: 'ALLOW',
  body: {},
  createdAt: extra?.createdAt ?? 0,
  priorityRank: extra?.priorityRank,
  ...extra,
});

const U = (id: string, roles: string[] = [], inList?: (id: string) => boolean): UserContext => ({
  id,
  roles: new Set(roles),
  inList,
});

describe('visibleFacetsFor / defaultFacetFor', () => {
  it('EVERYONE facet is visible to all', () => {
    const f = [facet({ kind: 'EVERYONE' })];
    const user = U('u1');
    const vis = visibleFacetsFor(user, f);
    expect(vis.length).toBe(1);
    const def = defaultFacetFor(user, f);
    expect(def?.audience.kind).toBe('EVERYONE');
  });

  it('ROLE:MOD facet visible only to mods; default picks ROLE over EVERYONE', () => {
    const f = [facet({ kind: 'EVERYONE' }), facet({ kind: 'ROLE', role: 'MOD', mode: 'DYNAMIC' })];
    const mod = U('m1', ['MOD']);
    const normie = U('n1', []);
    expect(visibleFacetsFor(mod, f).map((x) => x.audience.kind)).toEqual(['ROLE', 'EVERYONE']);
    expect(defaultFacetFor(mod, f)?.audience.kind).toBe('ROLE');
    expect(visibleFacetsFor(normie, f).map((x) => x.audience.kind)).toEqual(['EVERYONE']);
  });

  it('LIST SNAPSHOT membership', () => {
    const f = [
      facet({ kind: 'EVERYONE' }),
      facet({
        kind: 'LIST',
        listId: 'core',
        mode: 'SNAPSHOT',
        snapshotMemberIds: ['u1', 'u2'],
      }),
    ];
    const u1 = U('u1');
    const u3 = U('u3');
    expect(visibleFacetsFor(u1, f).map((x) => x.audience.kind)).toEqual(['LIST', 'EVERYONE']);
    expect(defaultFacetFor(u1, f)?.audience.kind).toBe('LIST');
    expect(visibleFacetsFor(u3, f).map((x) => x.audience.kind)).toEqual(['EVERYONE']);
  });

  it('LIST DYNAMIC membership via user.inList', () => {
    const f = [
      facet({ kind: 'EVERYONE' }),
      facet({ kind: 'LIST', listId: 'core', mode: 'DYNAMIC' }),
    ];
    const inCore = U('u1', [], (id) => id === 'core');
    const notInCore = U('u2', [], () => false);
    expect(visibleFacetsFor(inCore, f).map((x) => x.audience.kind)).toEqual(['LIST', 'EVERYONE']);
    expect(visibleFacetsFor(notInCore, f).map((x) => x.audience.kind)).toEqual(['EVERYONE']);
  });

  it('USERS SNAPSHOT membership', () => {
    const f = [
      facet({ kind: 'USERS', mode: 'SNAPSHOT', snapshotMemberIds: ['u1'] }),
      facet({ kind: 'EVERYONE' }),
    ];
    const u1 = U('u1');
    const u2 = U('u2');
    expect(visibleFacetsFor(u1, f).map((x) => x.audience.kind)).toEqual(['USERS', 'EVERYONE']);
    expect(visibleFacetsFor(u2, f).map((x) => x.audience.kind)).toEqual(['EVERYONE']);
  });

  it('defaultFacetFor returns null when none visible', () => {
    const f = [facet({ kind: 'USERS', mode: 'SNAPSHOT', snapshotMemberIds: ['other'] })];
    expect(defaultFacetFor(U('u1'), f)).toBeNull();
  });

  it('sorting: same rank uses createdAt as tiebreaker', () => {
    const f1 = facet({ kind: 'USERS', mode: 'SNAPSHOT', snapshotMemberIds: ['u1'] }, { createdAt: 200 });
    const f2 = facet({ kind: 'USERS', mode: 'SNAPSHOT', snapshotMemberIds: ['u1'] }, { createdAt: 100 });
    const vis = visibleFacetsFor(U('u1'), [f1, f2]);
    expect(vis[0].createdAt).toBe(100);
    expect(vis[1].createdAt).toBe(200);
  });
});

describe('audienceSubsetOf (tri-state)', () => {
  it('trivial: X ⊆ EVERYONE', () => {
    const t: AudienceSelector = { kind: 'USERS', mode: 'SNAPSHOT', snapshotMemberIds: ['u1'] };
    expect(audienceSubsetOf(t, { kind: 'EVERYONE' })).toBe('yes');
  });

  it('EVERYONE ⊆ USERS is false', () => {
    const t: AudienceSelector = { kind: 'EVERYONE' };
    const o: AudienceSelector = { kind: 'USERS', mode: 'SNAPSHOT', snapshotMemberIds: ['u1'] };
    expect(audienceSubsetOf(t, o)).toBe('no');
  });

  it('USERS subset of USERS by set inclusion', () => {
    const t: AudienceSelector = { kind: 'USERS', mode: 'SNAPSHOT', snapshotMemberIds: ['u1'] };
    const o: AudienceSelector = { kind: 'USERS', mode: 'SNAPSHOT', snapshotMemberIds: ['u1', 'u2'] };
    expect(audienceSubsetOf(t, o)).toBe('yes');
  });

  it('LIST(SNAPSHOT) subset of LIST(SNAPSHOT) by set inclusion', () => {
    const t: AudienceSelector = { kind: 'LIST', listId: 'core', mode: 'SNAPSHOT', snapshotMemberIds: ['a'] };
    const o: AudienceSelector = { kind: 'LIST', listId: 'core', mode: 'SNAPSHOT', snapshotMemberIds: ['a', 'b'] };
    expect(audienceSubsetOf(t, o)).toBe('yes');
  });

  it('DYNAMIC comparisons without env are indeterminate (except trivial equals)', () => {
    const t: AudienceSelector = { kind: 'USERS', mode: 'DYNAMIC', userIds: ['u1'] };
    const o: AudienceSelector = { kind: 'ROLE', role: 'MOD', mode: 'DYNAMIC' };
    expect(audienceSubsetOf(t, o)).toBe('indeterminate');
  });

  it('DYNAMIC comparisons can resolve with env resolvers', () => {
    const t: AudienceSelector = { kind: 'USERS', mode: 'DYNAMIC', userIds: ['u1'] };
    const o: AudienceSelector = { kind: 'ROLE', role: 'MOD', mode: 'DYNAMIC' };
    const env = { resolveRoleMembers: (role: string) => (role === 'MOD' ? ['u1', 'u3'] : []) };
    expect(audienceSubsetOf(t, o, env)).toBe('yes');
  });

  it('LIST(DYNAMIC) same listId is subset (equal)', () => {
    const t: AudienceSelector = { kind: 'LIST', listId: 'core', mode: 'DYNAMIC' };
    const o: AudienceSelector = { kind: 'LIST', listId: 'core', mode: 'DYNAMIC' };
    expect(audienceSubsetOf(t, o)).toBe('yes');
  });
});

describe('canForward', () => {
  const of = (aud: AudienceSelector, policy = 'ALLOW' as const): MessageFacet =>
    facet(aud, { sharePolicy: policy });

  it('FORBID blocks', () => {
    const orig = of({ kind: 'EVERYONE' }, 'FORBID');
    const target: AudienceSelector = { kind: 'EVERYONE' };
    expect(canForward(orig, target)).toBe('FORBID');
  });

  it('REDACT always redacts', () => {
    const orig = of({ kind: 'EVERYONE' }, 'REDACT');
    const target: AudienceSelector = { kind: 'EVERYONE' };
    expect(canForward(orig, target)).toBe('REDACT');
  });

  it('ALLOW with proven subset → ALLOW', () => {
    const orig = of({ kind: 'USERS', mode: 'SNAPSHOT', snapshotMemberIds: ['u1', 'u2'] }, 'ALLOW');
    const target: AudienceSelector = { kind: 'USERS', mode: 'SNAPSHOT', snapshotMemberIds: ['u1'] };
    expect(canForward(orig, target)).toBe('ALLOW');
  });

  it('ALLOW with indeterminate subset → REDACT', () => {
    const orig = of({ kind: 'ROLE', role: 'MOD', mode: 'DYNAMIC' }, 'ALLOW');
    const target: AudienceSelector = { kind: 'USERS', mode: 'DYNAMIC', userIds: ['u1'] };
    expect(canForward(orig, target)).toBe('REDACT');
  });

  it('ALLOW when original is EVERYONE → ALLOW to anything', () => {
    const orig = of({ kind: 'EVERYONE' }, 'ALLOW');
    const target: AudienceSelector = { kind: 'USERS', mode: 'SNAPSHOT', snapshotMemberIds: ['x'] };
    expect(canForward(orig, target)).toBe('ALLOW');
  });
});


│  │  ├─ drifts
│  │  │  ├─ [id]
│  │  │  │  └─ messages
│  │  │  │     └─ route.ts
│  │  │  ├─ list
│  │  │  │  └─ route.ts
│  │  │  ├─ query
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts
│  │  ├─ embed
│  │  │  └─ route.ts

-export const runtime = "nodejs";
export const revalidate = 0;                  // Next.js: no ISR
export const dynamic = "force-dynamic";   

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { toAclFacet, userCtxFrom } from "@/app/api/sheaf/_map";
import { visibleFacetsFor, defaultFacetFor } from "@app/sheaf-acl";
import { facetToPlainText } from "@/lib/text/mentions";
import { extractUrls } from "@/lib/text/urls";
import { hashUrl } from "@/lib/unfurl";
import { resolveQuoteForViewer, QuoteSpec } from "@/lib/sheaf/resolveQuote";
import { sendMessage } from "@/lib/actions/message.actions"; // for POST only
import { getUserFromCookies } from "@/lib/serverutils";      // for POST only

function toMs(v?: number | string | Date | null): number {
  if (!v) return 0;
  if (typeof v === "number") return v;
  const t = new Date(v as any).getTime();
  return Number.isFinite(t) ? t : 0;
}
const s = (b: bigint) => b.toString();

//
// GET /api/drifts/:id/messages?userId=...&limit=...&cursor=...
// - cursor is an optional message id; we return items strictly AFTER it.
// - ordered ASC by createdAt.
//
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdStr = searchParams.get("userId");
    if (!userIdStr) return NextResponse.json({ ok: false, error: "Missing userId" }, { status: 400 });

    const driftId = BigInt(params.id);
    const viewerId = BigInt(userIdStr);

    // Resolve drift → conversation and ACL-check membership
    const drift = await prisma.drift.findUnique({
      where: { id: driftId },
      select: { id: true, conversation_id: true },
    });
    if (!drift) return NextResponse.json({ ok: false, error: "Unknown drift" }, { status: 404 });

    const isMember = await prisma.conversationParticipant.findFirst({
      where: { conversation_id: drift.conversation_id, user_id: viewerId },
      select: { user_id: true },
    });
    if (!isMember) return new NextResponse("Forbidden", { status: 403 });

    // Pagination
    const rawLimit = parseInt(searchParams.get("limit") ?? "100", 10);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 200)) : 100;
    const cursorIdStr = searchParams.get("cursor"); // fetch strictly AFTER this id
    const whereMsg: any = { drift_id: driftId };
    if (cursorIdStr) {
      whereMsg.id = { gt: BigInt(cursorIdStr) };
    }
// read params
const order = (searchParams.get("order") || "asc").toLowerCase();
const limitParam = searchParams.get("limit");
const summaryLimit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 1, 1), 200) : undefined;


    // Base rows
    const messages = await prisma.message.findMany({
      where: whereMsg,
      orderBy: { created_at: "asc" },
      take: limit,
      select: {
        id: true,
        sender_id: true,
        created_at: true,
        text: true,
        drift_id: true,
        meta: true,
        is_redacted: true,
        edited_at: true,
        sender: { select: { name: true, image: true } },
        attachments: { select: { id: true, path: true, type: true, size: true } },
      },
    });

    const messageIds = messages.map((m) => m.id);
    if (messageIds.length === 0) {
      return NextResponse.json({
        ok: true,
        conversationId: s(drift.conversation_id),
        driftId: s(driftId),
        messages: [],
        nextCursor: null,
      });
    }

    // Facets for these messages
    const facets = await prisma.sheafFacet.findMany({
      where: { messageId: { in: messageIds } },
    });

    // Preload lists for ACL
    const listIds = Array.from(
      new Set(facets.map((f) => f.audienceListId).filter((x): x is string => !!x))
    );
    const lists = new Map(
      (
        await prisma.sheafAudienceList.findMany({
          where: { id: { in: listIds } },
        })
      ).map((l) => [l.id, l])
    );

    // Facet attachments
    const facetIds = facets.map((f) => f.id);
    const atts = await prisma.sheafAttachment.findMany({
      where: { facetId: { in: facetIds } },
      include: { blob: true },
    });
    const attByFacet = new Map<string, { id: string; name: string; mime: string; size: number; sha256: string; path?: string | null }[]>();
    for (const a of atts) {
      const key = a.facetId.toString();
      const list = attByFacet.get(key) ?? [];
      list.push({
        id: a.id.toString(),
        name: a.name,
        mime: a.blob.mime,
        size: a.blob.size,
        sha256: a.blob.sha256,
        path: a.blob.path ?? null,
      });
      attByFacet.set(key, list);
    }

    // Group facets by message
    const byMessage = new Map<string, typeof facets>();
    for (const f of facets) {
      const key = f.messageId.toString();
      if (!byMessage.has(key)) byMessage.set(key, []);
      byMessage.get(key)!.push(f);
    }

    // Viewer context (roles + lists)
    const viewer = await prisma.user.findUnique({ where: { id: viewerId } });
    const viewerRoles = await prisma.userRole.findMany({ where: { userId: viewerId } });
    const rolesArr = viewerRoles.map((r) => r.role);
    const ctx = userCtxFrom(viewer!, rolesArr, lists);

    // ---------- Quotes preload ----------
    const quotesByMsg = new Map<string, QuoteSpec[]>();
    const allSourceIds = new Set<bigint>();
    for (const m of messages) {
      const meta = (m.meta ?? {}) as any;
      const arr = Array.isArray(meta?.quotes) ? meta.quotes : [];
      const list: QuoteSpec[] = [];
      for (const q of arr) {
        try {
          const sid = BigInt(String(q.sourceMessageId));
          const sfid = q.sourceFacetId ? BigInt(String(q.sourceFacetId)) : null;
          if (sid) {
            list.push({ sourceMessageId: sid, sourceFacetId: sfid ?? null });
            allSourceIds.add(sid);
          }
        } catch {}
      }
      if (list.length) quotesByMsg.set(m.id.toString(), list);
    }

    const srcMsgs = allSourceIds.size
      ? await prisma.message.findMany({
          where: { id: { in: Array.from(allSourceIds) } },
          select: {
            id: true,
            text: true,
            is_redacted: true,
            edited_at: true,
            sender: { select: { name: true, image: true } },
            attachments: { select: { id: true, path: true, type: true, size: true } },
          },
        })
      : [];
    const srcMsgById = new Map<string, (typeof srcMsgs)[number]>();
    for (const sm of srcMsgs) srcMsgById.set(sm.id.toString(), sm);

    const srcFacets = allSourceIds.size
      ? await prisma.sheafFacet.findMany({ where: { messageId: { in: Array.from(allSourceIds) } } })
      : [];
    const srcFacetById = new Map<string, (typeof srcFacets)[number]>();
    for (const f of srcFacets) srcFacetById.set(f.id.toString(), f);

    const srcFacetIds = srcFacets.map((f) => f.id);
    const srcAtts = srcFacetIds.length
      ? await prisma.sheafAttachment.findMany({
          where: { facetId: { in: srcFacetIds } },
          include: { blob: true },
        })
      : [];
    const srcAttByFacet = new Map<string, any[]>();
    for (const a of srcAtts) {
      const key = a.facetId.toString();
      const list = srcAttByFacet.get(key) ?? [];
      list.push({
        id: a.id.toString(),
        name: a.name,
        mime: a.blob.mime,
        size: a.blob.size,
        sha256: a.blob.sha256,
        path: a.blob.path ?? null,
      });
      srcAttByFacet.set(key, list);
    }

    const resolvedQuotesByMsg = new Map<string, any[]>();
    for (const m of messages) {
      const specs = quotesByMsg.get(m.id.toString()) ?? [];
      if (!specs.length) continue;
      const resolved = await Promise.all(
        specs.map((q) =>
          resolveQuoteForViewer(q, {
            srcMsgById,
            srcFacetById,
            srcAttByFacet,
            requireSourceVisibility: false,
          })
        )
      );
      resolvedQuotesByMsg.set(m.id.toString(), resolved);
    }

    // ---------- Link preview hydration (plain + facets) ----------
    const plainHashesByMsg = new Map<string, string[]>();
    const facetHashesByFacetId = new Map<string, string[]>();
    const allHashes = new Set<string>();

    for (const m of messages) {
      if (m.is_redacted) continue;
      const hashes = extractUrls(m.text ?? "").map(hashUrl);
      if (hashes.length) {
        plainHashesByMsg.set(m.id.toString(), hashes);
        hashes.forEach((h) => allHashes.add(h));
      }
    }

    for (const f of facets) {
      const text = facetToPlainText((f as any).body);
      const hashes = extractUrls(text).map(hashUrl);
      if (hashes.length) {
        facetHashesByFacetId.set(f.id.toString(), hashes);
        hashes.forEach((h) => allHashes.add(h));
      }
    }

    const previewRows = allHashes.size
      ? await prisma.linkPreview.findMany({
          where: { urlHash: { in: Array.from(allHashes) } },
        })
      : [];
    const previewByHash = new Map(previewRows.map((lp) => [lp.urlHash, lp]));

    // Mentions (for this viewer)
    const mentionRows = await prisma.messageMention.findMany({
      where: { messageId: { in: messageIds }, userId: viewerId },
      select: { messageId: true },
    });
    const mentionedMsgIds = new Set(mentionRows.map((r) => r.messageId.toString()));

    // ---------- Build DTOs ----------
    const results = messages
      .map((m) => {
        if (m.is_redacted) {
          return {
            id: s(m.id),
            senderId: s(m.sender_id),
            sender: { name: m.sender?.name ?? null, image: m.sender?.image ?? null },
            createdAt: m.created_at.toISOString(),
            driftId: m.drift_id ? s(m.drift_id) : null,
            meta: (m.meta as any) ?? null,
            isRedacted: true,
            facets: [],
            defaultFacetId: null,
            text: null,
            attachments: [],
          };
        }

        const raw = byMessage.get(m.id.toString()) ?? [];
        const quotes = resolvedQuotesByMsg.get(m.id.toString()) ?? [];

        // Plain
        if (raw.length === 0) {
          const edited = !!m.edited_at;
          const hashes = plainHashesByMsg.get(m.id.toString()) ?? [];
          const linkPreviews = hashes
            .map((h) => previewByHash.get(h))
            .filter(Boolean)
            .map((lp: any) => ({
              urlHash: lp.urlHash,
              url: lp.url,
              title: lp.title,
              desc: lp.desc,
              image: lp.image,
              status: lp.status,
            }));

          const mentionsMe = mentionedMsgIds.has(m.id.toString());

          return {
            id: s(m.id),
            senderId: s(m.sender_id),
            sender: { name: m.sender?.name ?? null, image: m.sender?.image ?? null },
            createdAt: m.created_at.toISOString(),
            driftId: m.drift_id ? s(m.drift_id) : null,
            meta: (m.meta as any) ?? null,
            facets: [],
            defaultFacetId: null,
            text: m.text ?? null,
            attachments: m.attachments.map((a) => ({
              id: a.id.toString(),
              path: a.path,
              type: a.type,
              size: a.size,
            })),
            isRedacted: false,
            edited,
            quotes,
            linkPreviews,
            mentionsMe,
          };
        }

        // Sheaf (visible facets only)
        const fs = raw.map(toAclFacet).map((af) => ({ ...af, attachments: attByFacet.get(af.id) ?? [] }));
        const visible = visibleFacetsFor(ctx, fs as any);

        if (visible.length === 0) {
          if (m.text || m.attachments.length) {
            const edited = !!m.edited_at;
            return {
              id: s(m.id),
              senderId: s(m.sender_id),
              sender: { name: m.sender?.name ?? null, image: m.sender?.image ?? null },
              createdAt: m.created_at.toISOString(),
              driftId: m.drift_id ? s(m.drift_id) : null,
              meta: (m.meta as any) ?? null,
              isRedacted: false,
              facets: [],
              defaultFacetId: null,
              text: m.text ?? null,
              attachments: m.attachments.map((a) => ({
                id: a.id.toString(),
                path: a.path,
                type: a.type,
                size: a.size,
              })),
              edited,
              quotes,
            };
          }
          return null;
        }

        const def = defaultFacetFor(ctx, fs as any);
        const defId = def?.id ?? visible[0].id;
        const defObj = visible.find((f: any) => f.id === defId) ?? visible[0];
        const edited = toMs(defObj?.updatedAt) > toMs(defObj?.createdAt);
        const mentionsMe = mentionedMsgIds.has(m.id.toString());

        return {
          id: s(m.id),
          senderId: s(m.sender_id),
          sender: { name: m.sender?.name ?? null, image: m.sender?.image ?? null },
          createdAt: m.created_at.toISOString(),
          driftId: m.drift_id ? s(m.drift_id) : null,
          meta: (m.meta as any) ?? null,
          facets: visible.map((f: any) => {
            const fHashes = facetHashesByFacetId.get(f.id) ?? [];
            const fPreviews = fHashes
              .map((h) => previewByHash.get(h))
              .filter(Boolean)
              .map((lp: any) => ({
                urlHash: lp.urlHash,
                url: lp.url,
                title: lp.title,
                desc: lp.desc,
                image: lp.image,
                status: lp.status,
              }));
            return {
              id: f.id,
              audience: f.audience,
              sharePolicy: f.sharePolicy,
              expiresAt: f.expiresAt ?? null,
              body: f.body,
              attachments: f.attachments ?? [],
              priorityRank: f.priorityRank,
              createdAt: f.createdAt,
              updatedAt: f.updatedAt ?? null,
              isEdited: toMs(f.updatedAt) > toMs(f.createdAt),
              linkPreviews: fPreviews,
            };
          }),
          defaultFacetId: defId,
          text: m.text ?? null,
          attachments: m.attachments.map((a) => ({
            id: a.id.toString(),
            path: a.path,
            type: a.type,
            size: a.size,
          })),
          isRedacted: false,
          edited,
          quotes,
          mentionsMe,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const nextCursor =
      results.length > 0 ? results[results.length - 1].id : null;
      return NextResponse.json(
        {
          ok: true,
          conversationId: s(drift.conversation_id),
          driftId: s(driftId),
          messages: results,
          nextCursor,
        },
        {
          headers: {
            // belt & suspenders for any aggressive caches
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
      
  } catch (e: any) {
    console.error("[GET /api/drifts/:id/messages] error", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Internal error" }, { status: 500 });
  }
}

//
// OPTIONAL: POST /api/drifts/:id/messages
// Accepts multipart/form-data like your /api/messages/:conversationId endpoint:
//  - text (string?)
//  - files (File[]) optional
//  - clientId (string) optional idempotency key
//  - meta (stringified JSON) optional (e.g., quotes)
//
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const me = await getUserFromCookies();
    if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });

    const driftId = BigInt(params.id);
    const drift = await prisma.drift.findUnique({
      where: { id: driftId },
      select: { id: true, conversation_id: true },
    });
    if (!drift) return NextResponse.json({ ok: false, error: "Unknown drift" }, { status: 404 });

    // Ensure participant
    const isMember = await prisma.conversationParticipant.findFirst({
      where: { conversation_id: drift.conversation_id, user_id: me.userId },
      select: { user_id: true },
    });
    if (!isMember) return new NextResponse("Forbidden", { status: 403 });

    const form = await req.formData();
    const text = (form.get("text") as string | null) ?? null;
    const files = form.getAll("files").filter(Boolean) as File[];
    const clientId = (form.get("clientId") as string | null) ?? undefined;

    let meta: any | undefined = undefined;
    const metaRaw = form.get("meta");
    if (typeof metaRaw === "string" && metaRaw.trim()) {
      try { meta = JSON.parse(metaRaw); } catch {}
    }

    const saved = await sendMessage({
      conversationId: drift.conversation_id,
      senderId: me.userId,
      text: text ?? undefined,
      files: files.length ? files : undefined,
      driftId,
      clientId,
      meta,
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/drifts/:id/messages] error", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Internal error" }, { status: 500 });
  }
}

-app/api/drifts/list/route.ts: import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";
import { jsonSafe } from "@/lib/bigintjson";

// Strongly disable caching to avoid stale lists
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const me = await getUserFromCookies();
    if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    if (!conversationId) {
      return NextResponse.json({ ok: false, error: "conversationId required" }, { status: 400 });
    }
    const convoId = BigInt(conversationId);

    // Ensure participant
    const member = await prisma.conversationParticipant.findFirst({
      where: { conversation_id: convoId, user_id: me.userId },
      select: { id: true },
    });
    if (!member) return new NextResponse("Forbidden", { status: 403 });

    // 1) Fetch drifts (both DRIFT and THREAD) – scalars only
    const drifts = await prisma.drift.findMany({
      where: { conversation_id: convoId },
      select: {
        id: true,
        conversation_id: true,
        title: true,
        is_closed: true,
        is_archived: true,
        message_count: true,
        last_message_at: true,
        anchor_message_id: true,
        kind: true,
        root_message_id: true,
      },
      orderBy: { updated_at: "desc" },
    });

    // Early return if none
    if (drifts.length === 0) {
      return NextResponse.json(
        jsonSafe({
          ok: true,
          items: [],
        }),
        {
          status: 200,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    // 2) Fetch my per-drift prefs in one shot
    const myPrefs = await prisma.driftMember.findMany({
      where: { user_id: me.userId, drift_id: { in: drifts.map((d) => d.id) } },
      select: {
        drift_id: true,
        collapsed: true,
        pinned: true,
        muted: true,
        last_read_at: true,
      },
    });
    const myById = new Map(
      myPrefs.map((m) => [
        m.drift_id.toString(),
        {
          collapsed: m.collapsed,
          pinned: m.pinned,
          muted: m.muted,
          lastReadAt: m.last_read_at ? m.last_read_at.toISOString() : null,
        },
      ])
    );

    // 3) Map to client shape (camelCase DTO)
    const items = drifts.map((d) => ({
      drift: {
        id: d.id.toString(),
        conversationId: d.conversation_id.toString(),
        title: d.title,
        isClosed: d.is_closed,
        isArchived: d.is_archived,
        messageCount: d.message_count,
        lastMessageAt: d.last_message_at ? d.last_message_at.toISOString() : null,
        anchorMessageId: d.anchor_message_id ? d.anchor_message_id.toString() : null,
        kind: d.kind, // "DRIFT" | "THREAD"
        rootMessageId: d.root_message_id ? d.root_message_id.toString() : null,
      },
      my:
        myById.get(d.id.toString()) ??
        { collapsed: true, pinned: false, muted: false, lastReadAt: null },
    }));

    return NextResponse.json(
      jsonSafe({ ok: true, items }),
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (e: any) {
    console.error("[GET /api/drifts/list] error", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Internal error" }, { status: 500 });
  }
}


-app/api/drifts/query/route.ts: import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";
import { jsonSafe } from "@/lib/bigintjson";

export async function POST(req: NextRequest) {
  try {
    const me = await getUserFromCookies();
    if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });

    const { anchorMessageIds } = await req.json();
    if (!Array.isArray(anchorMessageIds) || anchorMessageIds.length === 0) {
      return NextResponse.json({ ok: true, items: [] }, { status: 200 });
    }

    const anchors = await prisma.message.findMany({
      where: { id: { in: anchorMessageIds.map((s: string) => BigInt(s)) } },
      select: { id: true, conversation_id: true, meta: true },
    });

    const anchorIdToDriftId = anchors
      .filter(a => (a.meta as any)?.kind === "DRIFT_ANCHOR")
      .reduce<Record<string, string>>((acc, a) => {
        const driftId = (a.meta as any)?.driftId;
        if (driftId) acc[a.id.toString()] = String(driftId);
        return acc;
      }, {});

    const driftIds = Object.values(anchorIdToDriftId);
    if (driftIds.length === 0) {
      return NextResponse.json({ ok: true, items: [] }, { status: 200 });
    }

    const drifts = await prisma.drift.findMany({
      where: { id: { in: driftIds.map((s) => BigInt(s)) } },
      select: {
        id: true,
        conversation_id: true,
        title: true,
        is_closed: true,
        is_archived: true,
        message_count: true,
        last_message_at: true,
        anchor_message_id: true,
        kind: true,
     root_message_id: true,
      },
    });

    // Member prefs (optional; defaults otherwise)
    const members = await prisma.driftMember.findMany({
      where: { drift_id: { in: drifts.map(d => d.id) }, user_id: me.userId },
    });
    const myByDrift = new Map<string, { collapsed: boolean; pinned: boolean; muted: boolean; lastReadAt: string | null }>();
    for (const m of members) {
      myByDrift.set(m.drift_id.toString(), {
        collapsed: m.collapsed,
        pinned: m.pinned,
        muted: m.muted,
        lastReadAt: m.last_read_at ? m.last_read_at.toISOString() : null,
      });
    }

    const items = drifts.map(d => ({
      anchorMessageId: d.anchor_message_id.toString(),
      drift: {
        id: d.id.toString(),
        conversationId: d.conversation_id.toString(),
        title: d.title,
        isClosed: d.is_closed,
        isArchived: d.is_archived,
        messageCount: d.message_count,
        lastMessageAt: d.last_message_at ? d.last_message_at.toISOString() : null,
        anchorMessageId: d.anchor_message_id.toString(),
        kind: d.kind,
        rootMessageId: d.root_message_id ? d.root_message_id.toString() : null,
      },
      my: myByDrift.get(d.id.toString()) ?? { collapsed: true, pinned: false, muted: false, lastReadAt: null },
    }));

    return NextResponse.json(jsonSafe({ ok: true, items }), { status: 200 });
  } catch (e: any) {
    console.error("[POST /api/drifts/query] error", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Internal error" }, { status: 500 });
  }
}


-app/api/drifts/route.ts: export const runtime = "nodejs"
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";
import { jsonSafe } from "@/lib/bigintjson";
import { supabase } from "@/lib/supabaseclient";
import { broadcast } from "@/lib/realtime/broadcast";

export async function POST(req: NextRequest) {
  try {
    const me = await getUserFromCookies();
    if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });

    const { conversationId, title } = await req.json();
    if (!conversationId || !title || !String(title).trim()) {
      return NextResponse.json({ ok: false, error: "conversationId and title are required" }, { status: 400 });
    }
    const convoId = BigInt(conversationId);

    // Ensure participant
    const isMember = await prisma.conversationParticipant.findFirst({
      where: { conversation_id: convoId, user_id: me.userId },
      select: { id: true },
    });
    if (!isMember) return new NextResponse("Forbidden", { status: 403 });

    const created = await prisma.$transaction(async (tx) => {
      // 1) Create anchor message (no text), tagged as DRIFT_ANCHOR in meta
      const anchor = await tx.message.create({
        data: {
          conversation_id: convoId,
          sender_id: me.userId,
          text: null,
          meta: { kind: "DRIFT_ANCHOR", title },
        },
        include: { sender: { select: { name: true, image: true } } },
      });

 // app/api/drifts/route.ts (classic drift)
const drift = await tx.drift.create({
  data: {
    conversation_id:   convoId,
    created_by:        me.userId,
    title:             String(title),
    kind:              "DRIFT",
    anchor_message_id: anchor.id, // ✅ required for DRIFT
  },
});
      
      // 3) Patch anchor meta with driftId
      await tx.message.update({
        where: { id: anchor.id },
        data: { meta: { kind: "DRIFT_ANCHOR", driftId: drift.id.toString(), title: String(title) } },
      });

      return { anchor, drift };
    });

    // Build anchor DTO (same shape as conversation message DTO + meta)
    const anchorDto = {
      id: created.anchor.id.toString(),
      conversationId: String(conversationId),
      text: null,
      createdAt: created.anchor.created_at.toISOString(),
      senderId: created.anchor.sender_id.toString(),
      sender: { name: created.anchor.sender?.name ?? null, image: created.anchor.sender?.image ?? null },
      attachments: [] as any[],
      isRedacted: false,
      meta: { kind: "DRIFT_ANCHOR", driftId: created.drift.id.toString(), title: created.drift.title },
      driftId: null, // anchor itself is not inside the drift
    };

    // Realtime notify room
    // await supabase
    //   .channel(`conversation-${String(conversationId)}`)
    //   .send({
    //     type: "broadcast",
    //     event: "drift_create",
    //     payload: jsonSafe({ anchor: anchorDto, drift: {
    //       id: created.drift.id.toString(),
    //       conversationId: String(conversationId),
    //       title: created.drift.title,
    //       isClosed: created.drift.is_closed,
    //       isArchived: created.drift.is_archived,
    //       messageCount: created.drift.message_count,
    //       lastMessageAt: created.drift.last_message_at ? created.drift.last_message_at.toISOString() : null,
    //       anchorMessageId: created.drift.anchor_message_id.toString(),
    //     }}),
    //   });

      await broadcast(`conversation-${String(conversationId)}`, "drift_create", {
        anchor: anchorDto,
        drift: {
          id: created.drift.id.toString(),
          conversationId: String(conversationId),
          title: created.drift.title,
          isClosed: created.drift.is_closed,
          isArchived: created.drift.is_archived,
          messageCount: created.drift.message_count,
          lastMessageAt: created.drift.last_message_at ? created.drift.last_message_at.toISOString() : null,
          anchorMessageId: created.drift.anchor_message_id.toString(),
        },
      });

    return NextResponse.json(jsonSafe({ ok: true, anchor: anchorDto, drift: {
      id: created.drift.id.toString(),
      conversationId: String(conversationId),
      title: created.drift.title,
      isClosed: created.drift.is_closed,
      isArchived: created.drift.is_archived,
      messageCount: created.drift.message_count,
      lastMessageAt: created.drift.last_message_at ? created.drift.last_message_at.toISOString() : null,
      anchorMessageId: created.drift.anchor_message_id.toString(),
    }}), { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/drifts] error", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Internal error" }, { status: 500 });
  }
}



│  │  ├─ me
│  │  │  └─ route.ts

-// app/api/me/route.ts
import { NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/serverutils";   // existing util
import { jsonSafe } from "@/lib/bigintjson";

export async function GET() {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json(null, { status: 401 });

  // Send only what the client needs – keep it small
  return NextResponse.json(jsonSafe({
    userId: user.userId,
    email:  user.email,
    name:   user.displayName,
  }), { headers: { "Cache-Control": "no-store" } });
}



│  │  ├─ messages
│  │  │  ├─ [id]
│  │  │  │  ├─ ack
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ bookmark
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ lock
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ receipts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ route.ts
│  │  │  │  └─ star
│  │  │  │     └─ route.ts
│  │  │  ├─ attachments
│  │  │  │  └─ [id]
│  │  │  │     └─ sign
│  │  │  │        └─ route.ts
│  │  │  ├─ ensureParticipant.ts
│  │  │  ├─ item
│  │  │  │  └─ [messageId]
│  │  │  │     └─ route.ts
│  │  │  └─ start
│  │  │     └─ route.ts

-app/api/messages/item/[messageId]/route.ts: import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";
import { supabase } from "@/lib/supabaseclient";
import { jsonSafe } from "@/lib/bigintjson";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const me = await getUserFromCookies();
    if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });

    const id = BigInt(params.messageId);

    const message = await prisma.message.findUnique({
      where: { id },
      select: {
        id: true,
        sender_id: true,
        conversation_id: true,
        is_redacted: true,
      },
    });

    if (!message) return new NextResponse("Not found", { status: 404 });
    if (message.sender_id !== me.userId) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    if (message.is_redacted) {
      // already redacted; treat as success
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    await prisma.$transaction(async (tx) => {
      // Remove DB attachment rows (storage cleanup optional / later)
      await tx.messageAttachment.deleteMany({ where: { message_id: id } });
      await tx.message.update({
        where: { id },
        data: {
          text: null,
          is_redacted: true,
          deleted_at: new Date(),
        },
      });
    });

    // Notify room
    await supabase
      .channel(`conversation-${message.conversation_id.toString()}`)
      .send({
        type: "broadcast",
        event: "message_redacted",
        payload: jsonSafe({ id: message.id }),
      });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    console.error("[DELETE message] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}

-// app/api/messages/attachments/[id]/sign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { supabase } from "@/lib/supabaseclient";
// import { getUserFromCookies } from "@/lib/server/getUser";
import { getUserFromCookies } from "@/lib/serverutils";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ATTACHMENTS_BUCKET } from "@/lib/storage/constants";
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromCookies();
  if (!user?.userId) return new NextResponse("Unauthorized", { status: 401 });

  const attachmentId = BigInt(params.id);
  const a = await prisma.messageAttachment.findFirst({
    where: { id: attachmentId },
    select: {
      path: true,
      message: {
        select: {
          conversation_id: true,
          conversation: {
            select: { participants: { where: { user_id: user.userId }, select: { user_id: true } } },
          },
        },
      },
    },
  });

  if (!a) return new NextResponse("Not Found", { status: 404 });
  if (a.message.conversation.participants.length === 0)
    return new NextResponse("Forbidden", { status: 403 });

     const { data, error } = await supabaseAdmin
       .storage
       .from(ATTACHMENTS_BUCKET)
       .createSignedUrl(a.path, 60 * 60);
  if (error) return new NextResponse("Failed to sign", { status: 500 });

  return NextResponse.json({ url: data.signedUrl }, { status: 200 });
}

app/api/messages/start/route.ts: import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/serverutils";
import { getOrCreateDM } from "@/lib/actions/conversation.actions";
import { jsonSafe } from "@/lib/bigintjson";
import { prisma } from "@/lib/prismaclient";

//add later:
// async function canSendDM(senderId: bigint, recipientId: bigint) {
//   // Example checks – tailor to your schema:
//   const settings = await prisma.userSettings.findUnique({
//     where: { user_id: recipientId },
//     select: { dm_from_friends_only: true },
//   });

//   if (!settings?.dm_from_friends_only) return true;

//   // Are they friends?
//   const isFriend = await prisma.friendship.findFirst({
//     where: {
//       OR: [
//         { user_a_id: senderId, user_b_id: recipientId, status: "accepted" },
//         { user_a_id: recipientId, user_b_id: senderId, status: "accepted" },
//       ],
//     },
//     select: { id: true },
//   });

//   return Boolean(isFriend);
// }


export async function POST(req: NextRequest) {
  const user = await getUserFromCookies();
  if (!user?.userId) return new NextResponse("Unauthorized", { status: 401 });

  const { targetUserId } = await req.json();
  const recipientId = BigInt(targetUserId);


  // const allowed = await canSendDM(user.userId, recipientId);
  // if (!allowed) {
  //   return new NextResponse("Recipient only accepts DMs from friends", { status: 403 });
  // }

  const dm = await getOrCreateDM({ userAId: user.userId, userBId: recipientId });
  // return id as string for client convenience
  return NextResponse.json({ id: dm.id.toString() }, { status: 200 });
}

-app/api/messages/ensureParticipant.ts: import { NextRequest, NextResponse } from "next/server";
import { getUserFromCookies } from "@/lib/serverutils";
import { prisma } from "@/lib/prismaclient";

export async function ensureParticipant(
  req: NextRequest,
  conversationId: bigint
): Promise<{ userId: bigint } | NextResponse> {
  const user = await getUserFromCookies();
  if (!user?.userId)
    return new NextResponse("Unauthorized", { status: 401 });

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId },
    select: {
      id: true,
      participants: { where: { user_id: user.userId }, select: { user_id: true } },
    },
  });
  if (!conversation) {
    return new NextResponse("Not Found", { status: 404 });
  }
  if (conversation.participants.length === 0) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  return { userId: user.userId };
}

-app/api/messages/[id]/receipts/route.ts: import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaclient";

export const runtime = "nodejs";

const qp = z.object({
  latest: z
    .union([z.string(), z.number(), z.boolean()])
    .optional()
    .transform((v) => {
      if (v === undefined) return false;
      if (typeof v === "boolean") return v;
      const s = String(v).toLowerCase();
      return s === "1" || s === "true" || s === "yes";
    }),
});

function toJsonReceipt(r: any, v: number) {
  // Convert BigInt fields so JSON.stringify won't explode
  return {
    id: r.id?.toString?.() ?? r.id,
    message_id: r.message_id?.toString?.() ?? r.message_id,
    v,
    version_hash: r.version_hash,
    parents: r.parents ?? [],
    from_facet_ids: r.from_facet_ids ?? [],
    merged_by: r.merged_by?.toString?.() ?? r.merged_by,
    merged_at: r.merged_at, // Date is fine (serializes as ISO)
    policy_id: r.policy_id ?? "owner-or-mod@v1",
    approvals: r.approvals ?? [],
    blocks: r.blocks ?? [],
    summary: r.summary ?? null,
    prev_receipt_hash: r.prev_receipt_hash ?? null,
    signature: r.signature ?? null,
  };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const messageId = BigInt(params.id);
  const { latest } = qp.parse(Object.fromEntries(new URL(req.url).searchParams));

  if (latest) {
    // Compute latest by merged_at desc; compute v as count (ordinal)
    const total = await prisma.mergeReceipt.count({ where: { message_id: messageId } });
    if (total === 0) return NextResponse.json({ ok: true, items: [] });

    const row = await prisma.mergeReceipt.findFirst({
      where: { message_id: messageId },
      orderBy: [{ merged_at: "desc" }, { id: "desc" }], // tie-breaker by id
    });

    return NextResponse.json({
      ok: true,
      items: row ? [toJsonReceipt(row, total)] : [],
    });
  }

  // Full history: oldest → newest so v = index+1
  const rows = await prisma.mergeReceipt.findMany({
    where: { message_id: messageId },
    orderBy: [{ merged_at: "asc" }, { id: "asc" }],
  });

  const items = rows.map((r, i) => toJsonReceipt(r, i + 1));

  return NextResponse.json({ ok: true, items });
}


-app/api/messages/[id]/star/route.ts:  import { NextRequest, NextResponse } from "next/server";
 import { z } from "zod";
 import { prisma } from "@/lib/prismaclient";
 import { getUserFromCookies } from "@/lib/serverutils";
 
 const paramsSchema = z.object({ id: z.coerce.bigint() });
 
 async function ensureAccess(conversationId: bigint, userId: bigint) {
   // prefer participants
   const part = await prisma.conversationParticipant.findFirst({
     where: { conversation_id: conversationId, user_id: userId },
     select: { user_id: true },
   });
   if (part) return true;
   // fallback to DM tuple
   const dm = await prisma.conversation.findUnique({
     where: { id: conversationId },
     select: { user1_id: true, user2_id: true },
   });
   return !!dm && (dm.user1_id === userId || dm.user2_id === userId);
 }
 
 export async function POST(_req: NextRequest, ctx: { params: { id: string } }) {
   const me = await getUserFromCookies();
   if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });
 
   const { id: messageId } = paramsSchema.parse(ctx.params);
 
   const msg = await prisma.message.findUnique({
     where: { id: messageId },
     select: { id: true, conversation_id: true },
   });
   if (!msg) return new NextResponse("Not Found", { status: 404 });
 
   const ok = await ensureAccess(msg.conversation_id, me.userId);
   if (!ok) return new NextResponse("Forbidden", { status: 403 });
 
   // toggle: delete if exists else create
   const del = await prisma.messageStar.deleteMany({
     where: { user_id: me.userId, message_id: messageId },
   });
   if (del.count > 0) {
     return NextResponse.json({ starred: false });
   }
   await prisma.messageStar.create({
     data: { user_id: me.userId, message_id: messageId },
   });
   return NextResponse.json({ starred: true });
 }
 

-app/api/messages/[id]/lock/route.ts: // app/api/messages/[id]/lock/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.union([z.string(), z.number(), z.bigint()]).transform(v => BigInt(v)) });

async function canLock(messageId: bigint, userId: bigint) {
  const msg = await prisma.message.findUnique({
    where: { id: messageId },
    select: { sender_id: true, conversation_id: true },
  });
  if (!msg) return false;
  if (msg.sender_id === userId) return true;

  const part = await prisma.conversationParticipant.findFirst({
    where: { conversation_id: msg.conversation_id, user_id: userId },
    select: { /* adjust to your schema */ role: true } as any,
  });
  const role = (part as any)?.role as string | undefined;
  return !!role && ["ADMIN", "MOD", "OWNER"].includes(role.toUpperCase());
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const me = await getUserFromCookies();
  if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });

  const { id: messageId } = paramsSchema.parse(params);

  if (!(await canLock(messageId, me.userId))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // idempotent: if lock exists, just return it
  const existing = await prisma.agreementLock.findUnique({ where: { message_id: messageId } });
  if (existing) {
    return NextResponse.json({ ok: true, lock: existing, already: true });
  }

  const lock = await prisma.agreementLock.create({
    data: { message_id: messageId, locked_by: me.userId },
  });

  // Optional: system note / broadcast could be emitted here
  return NextResponse.json({ ok: true, lock });
}


-app/api/messages/[id]/bookmark/route.ts:  import { NextRequest, NextResponse } from "next/server";
 import { z } from "zod";
 import { prisma } from "@/lib/prismaclient";
 import { getUserFromCookies } from "@/lib/serverutils";
 
 const paramsSchema = z.object({ id: z.coerce.bigint() });
 const bodySchema = z.object({
   label: z.string().trim().max(120).optional().nullable(),
 });
 
 async function ensureAccess(conversationId: bigint, userId: bigint) {
   const part = await prisma.conversationParticipant.findFirst({
     where: { conversation_id: conversationId, user_id: userId },
     select: { user_id: true },
   });
   if (part) return true;
   const dm = await prisma.conversation.findUnique({
     where: { id: conversationId },
     select: { user1_id: true, user2_id: true },
   });
   return !!dm && (dm.user1_id === userId || dm.user2_id === userId);
 }
 
 export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
   const me = await getUserFromCookies();
   if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });
   const { id: messageId } = paramsSchema.parse(ctx.params);
   const { label } = bodySchema.parse(await req.json().catch(() => ({})));
 
   const msg = await prisma.message.findUnique({
     where: { id: messageId },
     select: { id: true, conversation_id: true },
   });
   if (!msg) return new NextResponse("Not Found", { status: 404 });
 
   const ok = await ensureAccess(msg.conversation_id, me.userId);
   if (!ok) return new NextResponse("Forbidden", { status: 403 });
 
   const bk = await prisma.bookmark.upsert({
     where: { user_id_message_id: { user_id: me.userId, message_id: messageId } },
     update: { label: label ?? null },
     create: { user_id: me.userId, message_id: messageId, label: label ?? null },
     select: { id: true, label: true },
   });
   return NextResponse.json({ status: "ok", id: bk.id.toString(), label: bk.label ?? null });
 }
 
 export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
   const me = await getUserFromCookies();
   if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });
   const { id: messageId } = paramsSchema.parse(ctx.params);
 
   await prisma.bookmark.deleteMany({
     where: { user_id: me.userId, message_id: messageId },
   });
   return NextResponse.json({ status: "ok" });
 }
 

-app/api/messages/[id]/ack/route.ts: // app/api/messages/[id]/ack/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";

export const runtime = "nodejs";
const paramsSchema = z.object({ id: z.union([z.string(), z.number(), z.bigint()]).transform(v => BigInt(v)) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const me = await getUserFromCookies();
  if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });
  const { id: messageId } = paramsSchema.parse(params);

  // Require a lock
  const lock = await prisma.agreementLock.findUnique({ where: { message_id: messageId } });
  if (!lock) return new NextResponse("No lock for message", { status: 400 });

  // Optional: ensure participant of the conversation
  const msg = await prisma.message.findUnique({
    where: { id: messageId }, select: { conversation_id: true }
  });
  if (!msg) return new NextResponse("Not found", { status: 404 });

  const part = await prisma.conversationParticipant.findFirst({
    where: { conversation_id: msg.conversation_id, user_id: me.userId },
    select: { user_id: true },
  });
  if (!part) return new NextResponse("Forbidden", { status: 403 });

  // Upsert ack
  await prisma.agreementAck.upsert({
    where: { message_id_user_id: { message_id: messageId, user_id: me.userId } },
    update: { ack_at: new Date() as any },
    create: { message_id: messageId, user_id: me.userId },
  });

  // Return coverage
  const total = await prisma.conversationParticipant.count({
    where: { conversation_id: msg.conversation_id },
  });
  const acks = await prisma.agreementAck.count({ where: { message_id: messageId } });

  return NextResponse.json({ ok: true, acks, total });
}


-app/api/messages/[id]/route.ts: export const runtime = "nodejs"; // 👈 add at top

import { NextRequest, NextResponse } from "next/server";
import { fetchMessages, sendMessage } from "@/lib/actions/message.actions";
import { prisma } from "@/lib/prismaclient";
import { supabase } from "@/lib/supabaseclient";
import { ensureParticipant } from "../ensureParticipant";
import { jsonSafe } from "@/lib/bigintjson";


// ...inside POST after calling sendMessage (unchanged)...


export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const conversationId = BigInt(params.id);
  const userCheck = await ensureParticipant(req, conversationId);
  if (userCheck instanceof NextResponse) return userCheck;

  const cursorParam = req.nextUrl.searchParams.get("cursor");
  const limitParam  = req.nextUrl.searchParams.get("limit");
  const cursor = cursorParam ? BigInt(cursorParam) : undefined;
  const limit  = limitParam ? parseInt(limitParam, 10) : undefined;

  const rows = await fetchMessages({ conversationId, cursor, limit });
  const topLevel = rows.filter((m) => m.drift_id == null);

  // Map to UI shape, then jsonSafe
  const payload = topLevel.map(m => ({
    id: m.id,
    text: m.text,
    createdAt: m.created_at,
    senderId: m.sender_id,
    isRedacted: m.is_redacted,
    meta: m.meta,                // lets the client see DRIFT_ANCHOR immediately
    driftId: m.drift_id,         // consistency with the rest of your DTOs
    sender: { name: m.sender.name, image: m.sender.image },
    
    attachments: m.is_redacted ? [] : m.attachments.map(a => ({
      id: a.id,
      path: a.path,
      type: a.type,
      size: a.size,
    })),
  }));

  return NextResponse.json(jsonSafe(payload), { status: 200 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
      try {
          const conversationId = BigInt(params.id);
          const userCheck = await ensureParticipant(req, conversationId);
          if (userCheck instanceof NextResponse) return userCheck;
          const { userId } = userCheck;
      
          const form = await req.formData();
          const text = form.get("text") as string | null;
          const files = form.getAll("files").filter(Boolean) as File[];
          const driftIdIn = form.get("driftId") as string | null;
          const clientId = (form.get("clientId") as string | null) ?? undefined;

           // NEW: accept optional meta (stringified JSON)
           const metaRaw = form.get("meta");

    let meta: any | undefined = undefined;
    if (typeof metaRaw === "string" && metaRaw.trim().length) {
      try { meta = JSON.parse(metaRaw); } catch {}
    }

          const saved = await sendMessage({
            conversationId,
            senderId: userId,
            text: text ?? undefined,
            files: files.length ? files : undefined,
            driftId: driftIdIn ? BigInt(driftIdIn) : undefined,
            clientId,
            meta, 
          });
      
          // Coerce id to BigInt for Prisma in case sendMessage returned a string.
          const savedId = typeof (saved as any).id === "bigint"
            ? (saved as any).id
            : BigInt((saved as any).id);
      
          // Small retry: attachment rows can lag a tick after message insert.
          async function readFullMessage(retries = 2) {
            for (let i = 0; i <= retries; i++) {
            const full = await prisma.message.findUnique({
              where: { id: savedId },
                include: {
                  sender: { select: { name: true, image: true } },
                  attachments: { select: { id: true, path: true, type: true, size: true } },
                },
              });
              if (full && (i === retries || full.attachments)) return full;
              await new Promise(r => setTimeout(r, 25));
            }
            return null;
          }
      
          const full = await readFullMessage();
          if (!full) {
            return NextResponse.json({ ok: false, error: "Message not found after save" }, { status: 500 });
          }
      
          const dto = {
            id: full.id.toString(),
            text: full.text ?? null,
            createdAt: full.created_at.toISOString(),
            senderId: full.sender_id.toString(),
            driftId: full.drift_id ? full.drift_id.toString() : null,
            clientId: clientId ?? null,
            isRedacted: Boolean(full.is_redacted),
            sender: { name: full.sender.name, image: full.sender.image },
            attachments: full.is_redacted ? [] : full.attachments.map((a) => ({
              id: a.id.toString(),
              path: a.path,
              type: a.type,
              size: a.size,
            })),
          };
      
          // Do NOT broadcast from server here. Your existing realtime path can handle it.
          // If you must broadcast here, do it fire-and-forget (and ensure your supabase client supports ws on server):
          // supabase.channel(`conversation-${params.id}`).send({ type: "broadcast", event: "new_message", payload: dto }).catch(()=>{});
      
          return NextResponse.json(dto, { status: 201 });
        } catch (e: any) {
          console.error("POST /api/messages/:id failed", e);
          return NextResponse.json({ ok: false, error: e?.message || "Internal Server Error" }, { status: 500 });
        }
}


│  │  ├─ polls
│  │  │  ├─ [id]
│  │  │  │  └─ vote
│  │  │  │     └─ route.ts
│  │  │  ├─ query
│  │  │  │  └─ route.ts
│  │  │  └─ route.ts

-app/api/polls/route.ts: import { NextResponse } from "next/server";
import { createPoll } from "@/lib/actions/poll.actions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const poll = await createPoll({
      conversationId: BigInt(body.conversationId),
      messageId: BigInt(body.messageId),
      kind: body.kind,
      options: body.options,
    });
    // IMPORTANT: do NOT spread the Prisma model (it has BigInts).
    const dto = {
         id: String(poll.id),
         conversationId: String(poll.conversation_id),
         messageId: String(poll.message_id),
         createdById: String(poll.created_by_id),
         kind: poll.kind,
         options: poll.options ?? undefined,
         maxOptions: poll.max_options,
         closesAt: poll.closes_at ? poll.closes_at.toISOString() : null,
         anonymous: poll.anonymous,
         createdAt: poll.created_at.toISOString(),
       };
       return NextResponse.json({ ok: true, poll: dto });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}


-app/api/polls/[id]/vote/route.ts: import { NextResponse } from "next/server";
import { upsertVote } from "@/lib/actions/poll.actions";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { state } = await upsertVote({
      pollId: BigInt(params.id),
      kind: body.kind,
      optionIdx: body.optionIdx,
      value: body.value,
    });
    return NextResponse.json({ ok: true, state });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}


-app/api/polls/query/route.ts: import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/server/getUser";

export async function POST(req: Request) {
  try {
    const { messageIds } = await req.json();
    const ids = Array.isArray(messageIds) ? messageIds.map((s: string) => BigInt(s)) : [];
    if (!ids.length) return NextResponse.json({ ok: true, items: [] });

    const me = await getUserFromCookies();
    const uid = me?.userId ? BigInt(me.userId) : null;

    const polls = await prisma.poll.findMany({
      where: { message_id: { in: ids } },
      orderBy: { created_at: "asc" },
    });

    const items = [];
    for (const p of polls) {
      let state: any = null;
      if (p.kind === "OPTIONS") {
        const rows = await prisma.pollVote.groupBy({
          by: ["option_idx"],
          where: { poll_id: p.id },
          _count: { _all: true },
        });
        const totals = new Array(p.options?.length ?? 0).fill(0);
        for (const r of rows) {
          const idx = r.option_idx ?? -1;
          if (idx >= 0 && idx < totals.length) totals[idx] = r._count._all;
        }
        const count = rows.reduce((a, r) => a + r._count._all, 0);
        state = { kind: "OPTIONS", pollId: String(p.id), totals, count };
      } else {
        const agg = await prisma.pollVote.aggregate({
          where: { poll_id: p.id, value: { not: null } },
          _avg: { value: true },
          _count: { _all: true },
        });
        state = {
          kind: "TEMP",
          pollId: String(p.id),
          avg: Math.round(agg._avg.value ?? 0),
          count: agg._count._all ?? 0,
        };
      }

      let my: any = null;
      if (uid) {
        const myRow = await prisma.pollVote.findUnique({
          where: { poll_id_user_id: { poll_id: p.id, user_id: uid } },
        });
        if (myRow) {
          my =
            p.kind === "OPTIONS"
              ? { kind: "OPTIONS", pollId: String(p.id), optionIdx: myRow.option_idx }
              : { kind: "TEMP", pollId: String(p.id), value: myRow.value };
        }
      }

      items.push({
        poll: {
          id: String(p.id),
          conversationId: String(p.conversation_id),
          messageId: String(p.message_id),
          createdById: String(p.created_by_id),
          kind: p.kind,
          options: p.options ?? undefined,
          maxOptions: p.max_options,
          closesAt: p.closes_at ? p.closes_at.toISOString() : null,
          anonymous: p.anonymous,
          createdAt: p.created_at.toISOString(),
        },
        state,
        my,
      });
    }

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}


│  │  ├─ proposals
│  │  │  ├─ candidates
│  │  │  │  └─ route.ts
│  │  │  ├─ ensure
│  │  │  │  └─ route.ts
│  │  │  ├─ list
│  │  │  │  └─ route.ts
│  │  │  ├─ merge
│  │  │  │  └─ route.ts
│  │  │  └─ signal
│  │  │     └─ route.ts

-app/api/proposals/candidates/route.ts: import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";

export const runtime = "nodejs";

const q = z.object({
  rootMessageId: z
    .union([z.string(), z.number(), z.bigint()])
    .transform((v) => BigInt(v as any)),
  limit: z.coerce.number().min(1).max(100).default(100),
});

function ok(items: any[]) {
  return NextResponse.json({ items });
}

export async function GET(req: NextRequest) {
  const me = await getUserFromCookies();
  if (!me?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const { rootMessageId, limit } = q.parse(Object.fromEntries(searchParams));

  // 1) Root message + conversation
  const root = await prisma.message.findUnique({
    where: { id: rootMessageId },
    select: { id: true, conversation_id: true },
  });
  if (!root) return ok([]); // 200 empty rather than 404 to avoid UI error

  // 2) Membership: participant OR DM tuple fallback
  const part = await prisma.conversationParticipant.findFirst({
    where: { conversation_id: root.conversation_id, user_id: me.userId },
    select: { user_id: true },
  });
  let member = !!part;
  if (!member) {
    const dm = await prisma.conversation.findUnique({
      where: { id: root.conversation_id },
      select: { user1_id: true, user2_id: true },
    });
    member =
      !!dm &&
      (String(dm.user1_id) === String(me.userId) ||
        String(dm.user2_id) === String(me.userId));
  }
  if (!member) return ok([]); // treat as empty list rather than 403

  // 3) Find the shared PROPOSAL drift (if none yet, return empty)
  const drift = await prisma.drift.findFirst({
    where: {
      conversation_id: root.conversation_id,
      root_message_id: root.id,
      kind: "PROPOSAL" as any,
    },
    select: { id: true },
  });
  if (!drift) return ok([]); // proposals not started yet

  // 4) Fetch candidate messages in that drift
  //    Keep this robust and text-first; facet preview can be added later.
  const msgs = await prisma.message.findMany({
    where: {
      drift_id: drift.id,
      is_redacted: false,
      text: { not: null }, // only text candidates for robustness
    } as any,
    orderBy: { created_at: "desc" },
    take: limit,
    select: {
      id: true,
      text: true,
      created_at: true,
      sender_id: true,
      sender: { select: { id: true, name: true } },
    },
  });

  const items = msgs.map((m) => ({
    kind: "TEXT",
    messageId: m.id.toString(),
    authorId: m.sender_id.toString(),
    authorName: m.sender?.name ?? `User ${m.sender_id}`,
    createdAt: (m as any).created_at,
    previewTitle: "Text",
    preview: (m.text || "").slice(0, 200),
  }));

  return ok(items);
}


-app/api/proposals/ensure/route.ts: // app/api/proposals/ensure/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";

const bodySchema = z.object({
  rootMessageId: z.union([z.string(), z.number(), z.bigint()]).transform((v) => BigInt(v)),
});

function snippet(t: string | null | undefined, n = 42) {
  if (!t) return "Proposal";
  const s = t.replace(/\s+/g, " ").trim();
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export async function POST(req: NextRequest) {
  try {
    const me = await getUserFromCookies();
    if (!me?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const json = await req.json().catch(() => ({}));
    const { rootMessageId } = bodySchema.parse(json);

    // Load root + conversation for access keys/titling
    const root = await prisma.message.findUnique({
      where: { id: rootMessageId },
      select: { id: true, text: true, conversation_id: true },
    });
    if (!root) return NextResponse.json({ error: "Root message not found" }, { status: 404 });

    // Optional: ensure requester is a participant
    const part = await prisma.conversationParticipant.findFirst({
      where: { conversation_id: root.conversation_id, user_id: me.userId },
      select: { user_id: true },
    });
    if (!part) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // === One shared PROPOSAL drift per (conversation, root) ===
    // NOTE: relies on @@unique([conversation_id, root_message_id, kind]) in Prisma schema.
    // Prisma exposes compound unique as conversation_id_root_message_id_kind
    const drift = await prisma.drift.upsert({
      where: {
        conversation_id_root_message_id_kind: {
          conversation_id: root.conversation_id,
          root_message_id: root.id,
          kind: "PROPOSAL" as any,
        },
      } as any,
      update: {}, // no-op: we only need the existing row
      create: {
        conversation_id: root.conversation_id,
        root_message_id: root.id,
        kind: "PROPOSAL" as any,
        created_by: me.userId, // kept for attribution; doesn't affect uniqueness
        title: `Proposal: ${snippet(root.text, 42)}`,
      } as any,
    });

    // Normalize payload to your DriftUI shape (force UI kind to "DRIFT")
    const payload = {
      id: (drift as any).id?.toString?.() ?? "",
      title: (drift as any).title || "Proposal",
      isClosed: Boolean((drift as any).is_closed ?? (drift as any).isClosed ?? false),
      isArchived: Boolean((drift as any).is_archived ?? (drift as any).isArchived ?? false),
      kind: "DRIFT" as const, // UI union is "DRIFT" | "THREAD"
      conversationId: (drift as any).conversation_id?.toString?.() ?? "",
      rootMessageId: (drift as any).root_message_id?.toString?.() ?? "",
      messageCount: Number((drift as any).message_count ?? 0),
      lastMessageAt: (drift as any).last_message_at
        ? new Date((drift as any).last_message_at).toISOString()
        : null,
    };

    return NextResponse.json({ ok: true, drift: payload });
  } catch (err: any) {
    // If a race still slips through (rare), fall back to a find and return
    if (err?.code === "P2002") {
      const json = await req.json().catch(() => ({}));
      const { rootMessageId } = bodySchema.parse(json);
      const root = await prisma.message.findUnique({
        where: { id: rootMessageId },
        select: { id: true, conversation_id: true },
      });
      if (root) {
        const d = await prisma.drift.findFirst({
          where: { conversation_id: root.conversation_id, root_message_id: root.id, kind: "PROPOSAL" as any },
        });
        if (d) {
          return NextResponse.json({
            ok: true,
            drift: {
              id: d.id.toString(),
              title: (d as any).title || "Proposal",
              isClosed: Boolean((d as any).is_closed ?? false),
              isArchived: Boolean((d as any).is_archived ?? false),
              kind: "DRIFT" as const,
              conversationId: (d as any).conversation_id?.toString?.() ?? "",
              rootMessageId: (d as any).root_message_id?.toString?.() ?? "",
              messageCount: Number((d as any).message_count ?? 0),
              lastMessageAt: (d as any).last_message_at
                ? new Date((d as any).last_message_at).toISOString()
                : null,
            },
          });
        }
      }
    }
    console.error("[proposals/ensure] error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

-app/api/proposals/candidates/route.ts: import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";

export const runtime = "nodejs";

const q = z.object({
  rootMessageId: z
    .union([z.string(), z.number(), z.bigint()])
    .transform((v) => BigInt(v as any)),
  limit: z.coerce.number().min(1).max(100).default(100),
});

function ok(items: any[]) {
  return NextResponse.json({ items });
}

export async function GET(req: NextRequest) {
  const me = await getUserFromCookies();
  if (!me?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const { rootMessageId, limit } = q.parse(Object.fromEntries(searchParams));

  // 1) Root message + conversation
  const root = await prisma.message.findUnique({
    where: { id: rootMessageId },
    select: { id: true, conversation_id: true },
  });
  if (!root) return ok([]); // 200 empty rather than 404 to avoid UI error

  // 2) Membership: participant OR DM tuple fallback
  const part = await prisma.conversationParticipant.findFirst({
    where: { conversation_id: root.conversation_id, user_id: me.userId },
    select: { user_id: true },
  });
  let member = !!part;
  if (!member) {
    const dm = await prisma.conversation.findUnique({
      where: { id: root.conversation_id },
      select: { user1_id: true, user2_id: true },
    });
    member =
      !!dm &&
      (String(dm.user1_id) === String(me.userId) ||
        String(dm.user2_id) === String(me.userId));
  }
  if (!member) return ok([]); // treat as empty list rather than 403

  // 3) Find the shared PROPOSAL drift (if none yet, return empty)
  const drift = await prisma.drift.findFirst({
    where: {
      conversation_id: root.conversation_id,
      root_message_id: root.id,
      kind: "PROPOSAL" as any,
    },
    select: { id: true },
  });
  if (!drift) return ok([]); // proposals not started yet

  // 4) Fetch candidate messages in that drift
  //    Keep this robust and text-first; facet preview can be added later.
  const msgs = await prisma.message.findMany({
    where: {
      drift_id: drift.id,
      is_redacted: false,
      text: { not: null }, // only text candidates for robustness
    } as any,
    orderBy: { created_at: "desc" },
    take: limit,
    select: {
      id: true,
      text: true,
      created_at: true,
      sender_id: true,
      sender: { select: { id: true, name: true } },
    },
  });

  const items = msgs.map((m) => ({
    kind: "TEXT",
    messageId: m.id.toString(),
    authorId: m.sender_id.toString(),
    authorName: m.sender?.name ?? `User ${m.sender_id}`,
    createdAt: (m as any).created_at,
    previewTitle: "Text",
    preview: (m.text || "").slice(0, 200),
  }));

  return ok(items);
}


-app/api/proposals/list/route.ts: 
 import { NextRequest, NextResponse } from "next/server";
 import { z } from "zod";
 import { prisma } from "@/lib/prismaclient";
 
 const q = z.object({
   rootMessageId: z.union([z.string(), z.number(), z.bigint()]).transform(v => BigInt(v as any)),
 });
 
 export async function GET(req: NextRequest) {
   const { rootMessageId } = q.parse(Object.fromEntries(req.nextUrl.searchParams));
 
   // Proposals live in DRIFT(kind=PROPOSAL) and each created a facet; we’ll read facets via your existing join if available.
   // For MVP, return counts by facet_id from ProposalSignal.
   const signals = await prisma.proposalSignal.findMany({
     where: { message_id: rootMessageId },
     select: { facet_id: true, kind: true },
   });
   const counts: Record<string, { approve: number; block: number }> = {};
   for (const s of signals) {
    counts[s.facet_id] ??= { approve: 0, block: 0 };
    if (s.kind === "APPROVE") counts[s.facet_id].approve++;
    if (s.kind === "BLOCK") counts[s.facet_id].block++;
  }

  // If you track proposals elsewhere (e.g., facets table), stitch titles/snippets here.
  // Return a thin list so UI can show ✅/⛔ counts per candidate.
  return NextResponse.json({ ok: true, counts });
}


-app/api/proposals/merge/route.ts: // app/api/proposals/merge/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";
import { versionHashOf } from "@/lib/receipts/hash";   // sha256 over canonicalized payload
import { signReceipt } from "@/lib/receipts/sign";     // returns { signature, keyId }
import { checkMergeAllowed, DefaultMergePolicy } from "@/lib/gitchat/policies";

export const runtime = "nodejs";

const bodySchema = z.object({
  rootMessageId: z.union([z.string(), z.number(), z.bigint()]).transform((v) => BigInt(v)),
  proposalMessageId: z.union([z.string(), z.number(), z.bigint()]).transform((v) => BigInt(v)).optional(),
  facetId: z.union([z.string(), z.number(), z.bigint()]).transform((v) => BigInt(v)).optional(),
});

// pragmatic local gate: owner/mod/proposal author
async function canMergeLocal({
  rootMessageId,
  userId,
  proposalMessageId,
}: {
  rootMessageId: bigint;
  userId: bigint;
  proposalMessageId?: bigint;
}) {
  const root = await prisma.message.findUnique({
    where: { id: rootMessageId },
    select: { sender_id: true, conversation_id: true },
  });
  if (!root) return false;

  // 1) root author
  if (root.sender_id === userId) return true;

  // 2) mods/admins (if roles exist)
  const part = await prisma.conversationParticipant.findFirst({
    where: { conversation_id: root.conversation_id, user_id: userId },
    select: { role: true } as any,
  });
  const role = (part as any)?.role as string | undefined;
  if (role && ["ADMIN", "MOD", "OWNER"].includes(role.toUpperCase())) return true;

  // 3) dev flag: any participant
  if (process.env.MERGE_ALLOW_PARTICIPANTS === "true" && part) return true;

  // 4) proposal author (when merging from proposalMessageId)
  if (proposalMessageId) {
    const prop = await prisma.message.findUnique({
      where: { id: proposalMessageId },
      select: { drift: { select: { created_by: true } } } as any,
    });
    if (prop?.drift?.created_by && prop.drift.created_by === userId) return true;
  }

  return false;
}

/** Clone a facet to the root message and set it as default via SheafMessageMeta. */
async function cloneFacetToRoot(rootMessageId: bigint, facetId: bigint) {
  const facet = await prisma.sheafFacet.findUnique({
    where: { id: facetId },
    select: {
      id: true,
      audienceKind: true,
      audienceMode: true,
      audienceRole: true,
      audienceListId: true,
      snapshotMemberIds: true,
      listVersionAtSend: true,
      audienceUserIds: true,
      sharePolicy: true,
      expiresAt: true,
      body: true,
      priorityRank: true,
      visibilityKey: true,
    },
  } as any);
  if (!facet) throw new Error("facet not found");

  const newFacet = await prisma.sheafFacet.create({
    data: {
      messageId: rootMessageId,
      audienceKind: facet.audienceKind,
      audienceMode: facet.audienceMode,
      audienceRole: facet.audienceRole,
      audienceListId: facet.audienceListId,
      snapshotMemberIds: facet.snapshotMemberIds ?? [],
      listVersionAtSend: facet.listVersionAtSend ?? null,
      audienceUserIds: facet.audienceUserIds ?? [],
      sharePolicy: facet.sharePolicy,
      expiresAt: facet.expiresAt ?? null,
      body: facet.body,
      priorityRank: facet.priorityRank ?? 0,
      visibilityKey: facet.visibilityKey ?? null,
    } as any,
  });

  // Upsert SheafMessageMeta.defaultFacetId
  await prisma.sheafMessageMeta.upsert({
    where: { messageId: rootMessageId },
    update: { defaultFacetId: newFacet.id },
    create: { messageId: rootMessageId, defaultFacetId: newFacet.id },
  });

  // Canonical payload for hashing
  const facetPayload = { type: "facet", body: facet.body };
  return { newFacetId: newFacet.id as any, facetPayload };
}

export async function POST(req: NextRequest) {
  const me = await getUserFromCookies();
  if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });

  const { rootMessageId, proposalMessageId, facetId } = bodySchema.parse(await req.json());

  // 1) policy gate (room/conversation)
  const allowed = await checkMergeAllowed(DefaultMergePolicy, me.userId, rootMessageId);
  if (!allowed) return new NextResponse("Forbidden", { status: 403 });

  // 2) pragmatic local gate
  if (!(await canMergeLocal({ rootMessageId, userId: me.userId, proposalMessageId }))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    // root message (for conversation id)
    const root = await prisma.message.findUnique({
      where: { id: rootMessageId },
      select: { id: true, conversation_id: true },
    });
    if (!root) return new NextResponse("Not found", { status: 404 });
  
    let mergedFromMessageId: string | null = null;
    let versionHash = "";
    let fromFacetIds: string[] = [];
    let snapshot: any = null; // <— define once
  
    if (facetId) {
      // FACET merge
      const facet = await prisma.sheafFacet.findUnique({
        where: { id: facetId },
        select: {
          id: true,
          audienceKind: true,
          audienceMode: true,
          audienceRole: true,
          audienceListId: true,
          snapshotMemberIds: true,
          listVersionAtSend: true,
          audienceUserIds: true,
          sharePolicy: true,
          expiresAt: true,
          body: true,
          priorityRank: true,
          visibilityKey: true,
        },
      } as any);
      if (!facet) return new NextResponse("facet not found", { status: 400 });
  
      const newFacet = await prisma.sheafFacet.create({
        data: {
          messageId: rootMessageId,
          audienceKind: facet.audienceKind,
          audienceMode: facet.audienceMode,
          audienceRole: facet.audienceRole,
          audienceListId: facet.audienceListId,
          snapshotMemberIds: facet.snapshotMemberIds ?? [],
          listVersionAtSend: facet.listVersionAtSend ?? null,
          audienceUserIds: facet.audienceUserIds ?? [],
          sharePolicy: facet.sharePolicy,
          expiresAt: facet.expiresAt ?? null,
          body: facet.body,
          priorityRank: facet.priorityRank ?? 0,
          visibilityKey: facet.visibilityKey ?? null,
        } as any,
      });
  
      // default facet via SheafMessageMeta
      await prisma.sheafMessageMeta.upsert({
        where: { messageId: rootMessageId },
        update: { defaultFacetId: newFacet.id },
        create: { messageId: rootMessageId, defaultFacetId: newFacet.id },
      });
  
      const facetPayload = { type: "facet", body: facet.body };
      versionHash = versionHashOf(facetPayload);
      snapshot = facetPayload;              // <— set snapshot here
      fromFacetIds = [String(facetId)];
      mergedFromMessageId = null;
    } else {
      // TEXT merge
      const candidate = await prisma.message.findUnique({
        where: { id: proposalMessageId! },
        select: { id: true, text: true },
      });
      if (!candidate || !candidate.text) {
        return new NextResponse("No mergeable text", { status: 400 });
      }
  
      await prisma.message.update({
        where: { id: rootMessageId },
        data: { text: candidate.text, edited_at: new Date() as any },
      });
  
      const textPayload = { type: "text", text: candidate.text.trim() };
      versionHash = versionHashOf(textPayload);
      snapshot = textPayload;               // <— set snapshot here
      mergedFromMessageId = candidate.id.toString();
    }
  
    // Parent linkage (latest by time)
    const lastReceipt = await prisma.mergeReceipt.findFirst({
      where: { message_id: root.id },
      orderBy: [{ merged_at: "desc" }, { id: "desc" }],
      select: { version_hash: true },
    });
  
    // approvals/blocks (only meaningful for facet merges)
    let approvals: any[] = [];
    let blocks: any[] = [];
    if (fromFacetIds.length > 0) {
      const sigRows = await prisma.proposalSignal.findMany({
        where: { message_id: root.id, facet_id: { in: fromFacetIds } },
        select: { user_id: true, kind: true, created_at: true },
      });
      approvals = sigRows
        .filter((r) => r.kind === "APPROVE")
        .map((r) => ({
          userId: r.user_id.toString(),
          role: "member",
          at: r.created_at.toISOString(),
        }));
      blocks = sigRows
        .filter((r) => r.kind === "BLOCK")
        .map((r) => ({
          userId: r.user_id.toString(),
          role: "member",
          at: r.created_at.toISOString(),
        }));
    }
  // Receipt body & signature (v is computed by the /receipts API)
const receiptBody = {
  messageId: root.id.toString(),
  versionHash,
  parents: lastReceipt?.version_hash ? [lastReceipt.version_hash] : [],
  // fromFacetIds: <— REMOVE from signed body (or don’t include at all)
  mergedBy: me.userId.toString(),
  mergedAt: new Date().toISOString(),
  policy: { id: "owner-or-mod@v1", quorum: null, minApprovals: null, timeoutSec: null },
  approvals,
  blocks,
  prevReceiptHash: lastReceipt?.version_hash || null,
  snapshot, // {type:"text", text:"..."} or {type:"facet", body:{...}}
};
const { signature } = signReceipt(receiptBody);

await prisma.mergeReceipt.create({
  data: {
    message_id: root.id,
    version_hash: versionHash,
    parents: receiptBody.parents as any,
    // from_facet_ids: <— REMOVE this line (field does not exist in schema)
    merged_by: me.userId,
    merged_at: new Date(receiptBody.mergedAt),
    policy_id: receiptBody.policy.id,
    approvals: approvals as any,
    blocks: blocks as any,
    prev_receipt_hash: receiptBody.prevReceiptHash,
    signature,
    snapshot: snapshot as any,
  },
});
  
    // Broadcast so open UIs refresh
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await admin
        .channel(`conversation-${root.conversation_id.toString()}`)
        .send({
          type: "broadcast",
          event: "proposal_merge",
          payload: { rootMessageId: root.id.toString(), versionHash },
        });
    } catch (e) {
      console.warn("[ap] proposal_merge broadcast failed", e);
    }
  
    // System note
    try {
      const count = await prisma.mergeReceipt.count({ where: { message_id: rootMessageId } });
      await prisma.message.create({
        data: {
          conversation_id: root.conversation_id,
          sender_id: me.userId,
          text: `Merged to v${count} by user ${me.userId}`,
          meta: { kind: "MERGE_NOTE", rootMessageId: rootMessageId.toString() } as any,
        },
      });
    } catch {}
  
    return NextResponse.json({
      ok: true,
      mode: facetId ? "FACET" : "TEXT",
      mergedFromMessageId,
      versionHash,
    });
  } catch (e: any) {
    console.error("[proposals/merge] error", e);
    return new NextResponse("Merge failed", { status: 500 });
  }
}


-app/api/proposals/signal/route.ts: 
 import { NextRequest, NextResponse } from "next/server";
 import { z } from "zod";
 import { prisma } from "@/lib/prismaclient";
 import { getUserFromCookies } from "@/lib/serverutils";
 
 const bodySchema = z.object({
   messageId: z.union([z.string(), z.number(), z.bigint()]).transform(v => BigInt(v as any)),
   conversationId: z.union([z.string(), z.number(), z.bigint()]).transform(v => BigInt(v as any)),
   facetId: z.string().min(1),
   kind: z.enum(["APPROVE", "BLOCK", "CLEAR"]),
 });
 
 export async function POST(req: NextRequest) {
   const me = await getUserFromCookies();
   if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });
   const { messageId, conversationId, facetId, kind } = bodySchema.parse(await req.json());
 
   if (kind === "CLEAR") {
     await prisma.proposalSignal.deleteMany({ where: { facet_id: facetId, user_id: me.userId } });
   } else {
     await prisma.proposalSignal.upsert({
       where: { facet_id_user_id: { facet_id: facetId, user_id: me.userId } },
       update: { kind },
       create: { facet_id: facetId, message_id: messageId, conversation_id: conversationId, user_id: me.userId, kind },
     });
   }
 
   // Broadcast to room channel so UIs refresh proposal counts
    try {
        const { createClient } = await import("@supabase/supabase-js");
        const admin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        // You need the conversation id to address the right channel name
        await admin
          .channel(`conversation-${String(conversationId)}`)
          .send({
            type: "broadcast",
            event: "proposal_signal",
            payload: { rootMessageId: String(messageId), facetId, kind },
          });
      } catch (e) {
        console.warn("[rt] proposal_signal broadcast failed", e);
      }  
 
   return NextResponse.json({ ok: true });
 }



│  │  ├─ sheaf
│  │  │  ├─ _map.ts
│  │  │  ├─ _prisma.ts
│  │  │  ├─ _util.ts
│  │  │  ├─ forward-check
│  │  │  │  └─ route.ts
│  │  │  ├─ lists
│  │  │  │  └─ route.ts
│  │  │  ├─ messages
│  │  │  │  └─ route.ts
│  │  │  ├─ participants
│  │  │  │  └─ route.ts
│  │  │  ├─ preview
│  │  │  │  └─ route.ts
│  │  │  └─ upload
│  │  │     └─ route.ts

-app/api/sheaf/forward-check/route.ts: import { NextRequest } from 'next/server';
import { prisma } from '../_prisma';
import { readJSON, ok, badRequest, toBigInt } from '../_util';
import { buildAudienceEnv, toAudienceSelector } from '../_map';
import { audienceSubsetOf, canForward } from '@app/sheaf-acl';

// POST /api/sheaf/forward-check
// Body: { op: 'quote'|'forward', messageId: string|number, facetId: string|number, target: AudienceSelector }
export async function POST(req: NextRequest) {
  type Body = {
    op: 'quote' | 'forward';
    messageId: string | number;
    facetId: string | number;
    target: any; // AudienceSelector shape
  };

  let body: Body;
  try { body = await readJSON<Body>(req); }
  catch { return badRequest('Invalid JSON'); }

  const { op, messageId, facetId, target } = body;
  if (!op || !messageId || !facetId || !target) return badRequest('Missing fields');

  const facet = await prisma.sheafFacet.findUnique({ where: { id: toBigInt(facetId) } });
  if (!facet || facet.messageId !== toBigInt(messageId)) return badRequest('Unknown facet/message pair');

  // Build env: load lists referenced by the target or the original facet (for subset materialization)
  const listIds = [
    facet.audienceListId,
    target?.kind === 'LIST' ? target.listId : null,
  ].filter(Boolean) as string[];

  const lists = new Map(
    (await prisma.sheafAudienceList.findMany({ where: { id: { in: listIds } } }))
      .map(l => [l.id, l])
  );

  const rolesInPlay = new Set<string>();
  if (facet.audienceKind === 'ROLE' && facet.audienceRole) rolesInPlay.add(facet.audienceRole);
  if (target?.kind === 'ROLE' && target.role) rolesInPlay.add(target.role);
  const roleMembersRows = await prisma.userRole.findMany({ where: { role: { in: [...rolesInPlay] } } });
  const roleMembers = new Map<string, string[]>();
  for (const r of roleMembersRows) {
    const arr = roleMembers.get(r.role) ?? [];
    arr.push(r.userId.toString());
    roleMembers.set(r.role, arr);
  }
  const env = buildAudienceEnv(lists, roleMembers);
  
  const originalAudience = toAudienceSelector(facet);
  const subsetTri = audienceSubsetOf(target, originalAudience, env);
  const decision = canForward(
    { id: facet.id.toString(), messageId: facet.messageId.toString(), audience: originalAudience, sharePolicy: facet.sharePolicy, body: {}, attachments: [], createdAt: facet.createdAt?.getTime(), priorityRank: facet.priorityRank },
    target,
    env
  );

  if (decision === 'ALLOW') {
    return ok({
      op, decision, subset: subsetTri,
      suggestion: { mode: 'direct', note: 'Subset proven (or original EVERYONE). Include content.' },
    });
  }
  if (decision === 'REDACT') {
    return ok({
      op, decision, subset: subsetTri,
      suggestion: {
        mode: 'redacted',
        redactedShell: {
          body: { type: 'text', text: '[[redacted]]' },
          meta: { fromMessageId: messageId.toString(), fromFacetId: facetId.toString() }
        }
      }
    });
  }
  return ok({ op, decision, subset: subsetTri, suggestion: { mode: 'blocked', note: 'sharePolicy=FORBID' } });
}


-app/api/sheaf/lists/route.ts: import { NextRequest } from 'next/server';
import { prisma } from '../_prisma';
import { ok, badRequest } from '../_util';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ownerId = searchParams.get('ownerId');
  if (!ownerId) return badRequest('Missing ownerId');
  const rows = await prisma.sheafAudienceList.findMany({
    where: { ownerId: String(ownerId) },
    select: { id: true, name: true }
  });
  return ok({ lists: rows });
}


-app/api/sheaf/messages/route.ts: export const runtime = "nodejs";
export const revalidate = 0;                  // Next.js: no ISR
export const dynamic = "force-dynamic";   


import { NextRequest } from "next/server";
import { prisma } from "../_prisma";
import { jsonSafe } from "@/lib/bigintjson";
import { readJSON, ok, badRequest, toBigInt, s } from '@/app/api/sheaf/_util';
import { toAclFacet, userCtxFrom } from '@/app/api/sheaf/_map';
import type { AudienceSelector } from "@app/sheaf-acl";
import { resolveQuoteForViewer, QuoteSpec } from "@/lib/sheaf/resolveQuote";
import {
  visibleFacetsFor,
  defaultFacetFor,
  priorityRank,
} from "@app/sheaf-acl";
import { facetToPlainText, parseMentionsFromText } from "@/lib/text/mentions";
import { extractUrls } from "@/lib/text/urls";
import { getOrFetchLinkPreview, hashUrl } from "@/lib/unfurl";
import { canUserSeeFacetNow } from "@/lib/sheaf/visibility";
import { createMessageNotification } from "@/lib/actions/notification.actions";
import { supabase } from "@/lib/supabaseclient";

// util at top of the file (or a shared util module)
function toMs(v?: number | string | Date | null): number {
  if (!v) return 0;
  if (typeof v === "number") return v;                  // already ms (or s) – adjust if needed
  const t = new Date(v as any).getTime();
  return Number.isFinite(t) ? t : 0;
}

// ---------- GET /api/sheaf/messages?userId=...&conversationId=...&messageId=... ----------
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return badRequest("Missing userId");

  const convo    = searchParams.get("conversationId");
  const messageId = searchParams.get("messageId");
  const driftId   = searchParams.get("driftId");

  // Build where
  const whereMsg: any = {};
  if (messageId) whereMsg.id = toBigInt(messageId);
  else if (convo) whereMsg.conversation_id = toBigInt(convo);

  // Main timeline excludes drift children
  if (!messageId && convo && !driftId) whereMsg.drift_id = null;
  // Drift view: only drift children
  if (driftId) whereMsg.drift_id = toBigInt(driftId);

  const viewer = await prisma.user.findUnique({ where: { id: toBigInt(userId) } });
  if (!viewer) return badRequest("Unknown userId");

  const viewerRoles = await prisma.userRole.findMany({ where: { userId: viewer.id } });
  const rolesArr = viewerRoles.map(r => r.role);

  // Load messages
  const messages = await prisma.message.findMany({
    where: whereMsg,
    orderBy: messageId ? undefined : { created_at: "desc" },
    take: messageId ? undefined : 50,
    select: {
      id: true,
      sender_id: true,
      created_at: true,
      text: true,
      drift_id: true,
      meta: true,
      is_redacted: true,
      edited_at: true,
      sender: { select: { name: true, image: true } },
      attachments: { select: { id: true, path: true, type: true, size: true } },
    },
  });

  const messageIds = messages.map(m => m.id);
  if (messageIds.length === 0) return ok({ userId, messages: [] });

  // Load facets for these messages
  const facets = await prisma.sheafFacet.findMany({ where: { messageId: { in: messageIds } } });

  // Preload lists for ACL
  const listIds = Array.from(new Set(facets.map(f => f.audienceListId).filter((x): x is string => !!x)));
  const lists = new Map(
    (await prisma.sheafAudienceList.findMany({ where: { id: { in: listIds } } })).map(l => [l.id, l])
  );

  // Facet attachments
  const facetIds = facets.map(f => f.id);
  const atts = await prisma.sheafAttachment.findMany({
    where: { facetId: { in: facetIds } },
    include: { blob: true },
  });
  const attByFacet = new Map<string, { id: string; name: string; mime: string; size: number; sha256: string; path?: string | null }[]>();
  for (const a of atts) {
    const key = a.facetId.toString();
    const list = attByFacet.get(key) ?? [];
    list.push({ id: a.id.toString(), name: a.name, mime: a.blob.mime, size: a.blob.size, sha256: a.blob.sha256, path: a.blob.path ?? null });
    attByFacet.set(key, list);
  }

  // Group facets by message
  const byMessage = new Map<string, typeof facets>();
  for (const f of facets) {
    const key = f.messageId.toString();
    if (!byMessage.has(key)) byMessage.set(key, []);
    byMessage.get(key)!.push(f);
  }

  const ctx = userCtxFrom(viewer, rolesArr, lists);

  // ---------- Collect quote refs & preload sources ----------
  const quotesByMsg = new Map<string, QuoteSpec[]>();
  const allSourceIds = new Set<bigint>();
  for (const m of messages) {
    const meta = (m.meta ?? {}) as any;
    const arr = Array.isArray(meta?.quotes) ? meta.quotes : [];
    const list: QuoteSpec[] = [];
    for (const q of arr) {
      try {
        const sid = toBigInt(String(q.sourceMessageId));
        const sfid = q.sourceFacetId ? toBigInt(String(q.sourceFacetId)) : null;
        if (sid) { list.push({ sourceMessageId: sid, sourceFacetId: sfid ?? null }); allSourceIds.add(sid); }
      } catch {}
    }
    if (list.length) quotesByMsg.set(m.id.toString(), list);
  }

  const srcMsgs = allSourceIds.size
    ? await prisma.message.findMany({
        where: { id: { in: Array.from(allSourceIds) } },
        select: {
          id: true,
          text: true,
          is_redacted: true,
          edited_at: true,
          sender: { select: { name: true, image: true } },
          attachments: { select: { id: true, path: true, type: true, size: true } },
        },
      })
    : [];
  const srcMsgById = new Map<string, (typeof srcMsgs)[number]>();
  for (const sm of srcMsgs) srcMsgById.set(sm.id.toString(), sm);

  const srcFacets = allSourceIds.size
    ? await prisma.sheafFacet.findMany({ where: { messageId: { in: Array.from(allSourceIds) } } })
    : [];
  const srcFacetById = new Map<string, (typeof srcFacets)[number]>();
  for (const f of srcFacets) srcFacetById.set(f.id.toString(), f);

  const srcFacetIds = srcFacets.map(f => f.id);
  const srcAtts = srcFacetIds.length
    ? await prisma.sheafAttachment.findMany({ where: { facetId: { in: srcFacetIds } }, include: { blob: true } })
    : [];
  const srcAttByFacet = new Map<string, any[]>();
  for (const a of srcAtts) {
    const key = a.facetId.toString();
    const list = srcAttByFacet.get(key) ?? [];
    list.push({ id: a.id.toString(), name: a.name, mime: a.blob.mime, size: a.blob.size, sha256: a.blob.sha256, path: a.blob.path ?? null });
    srcAttByFacet.set(key, list);
  }

  // Resolve all quotes once (no await in the DTO map)
  const resolvedQuotesByMsg = new Map<string, any[]>();
  for (const m of messages) {
    const specs = quotesByMsg.get(m.id.toString()) ?? [];
    if (!specs.length) continue;
    const resolved = await Promise.all(
      specs.map(q =>
        resolveQuoteForViewer(q, {
          srcMsgById,
          srcFacetById,
          srcAttByFacet,
          requireSourceVisibility: false, // switch to true if you want stricter policy
        })
      )
    );
    resolvedQuotesByMsg.set(m.id.toString(), resolved);
  }

// ---------- Link preview collection (batched) ----------
const plainHashesByMsg = new Map<string, string[]>();      // msgId -> [hash]
const facetHashesByFacetId = new Map<string, string[]>();  // facetId -> [hash]
const allHashes = new Set<string>();

// Plain message urls (skip redacted)
for (const m of messages) {
  if (m.is_redacted) continue;
  const hashes = extractUrls(m.text ?? "").map(hashUrl);
  if (hashes.length) {
    plainHashesByMsg.set(m.id.toString(), hashes);
    hashes.forEach((h) => allHashes.add(h));
  }
}

// Facet urls (collect for all; we’ll render only visible later)
for (const f of facets) {
  const text = facetToPlainText((f as any).body);
  const hashes = extractUrls(text).map(hashUrl);
  if (hashes.length) {
    facetHashesByFacetId.set(f.id.toString(), hashes);
    hashes.forEach((h) => allHashes.add(h));
  }
}

// One DB call to hydrate all previews
const previewRows = allHashes.size
  ? await prisma.linkPreview.findMany({ where: { urlHash: { in: Array.from(allHashes) } } })
  : [];

const previewByHash = new Map(previewRows.map((lp) => [lp.urlHash, lp]));

// ---------- Mentions (batched) ----------
const mentionRows = await prisma.messageMention.findMany({
  where: { messageId: { in: messageIds }, userId: toBigInt(userId) },
  select: { messageId: true },
});
const mentionedMsgIds = new Set(mentionRows.map((r) => r.messageId.toString()));

  // ---------- Build DTOs ----------
  const results = messages
    .map((m) => {
      // Tombstone for redacted
      if (m.is_redacted) {
        return {
          id: s(m.id),
          senderId: s(m.sender_id),
          sender: { name: m.sender?.name ?? null, image: m.sender?.image ?? null },
          createdAt: m.created_at.toISOString(),
          driftId: m.drift_id ? s(m.drift_id) : null,
          meta: (m.meta as any) ?? null,
          isRedacted: true,
          facets: [],
          defaultFacetId: null,
          text: null,
          attachments: [],
        };
      }

      const raw = byMessage.get(m.id.toString()) ?? [];
      const quotes = resolvedQuotesByMsg.get(m.id.toString()) ?? [];

      // Plain (no facets)
      if (raw.length === 0) {
        const edited = !!m.edited_at;
        const hashes = plainHashesByMsg.get(m.id.toString()) ?? [];
        const linkPreviews = hashes
          .map((h) => previewByHash.get(h))
          .filter(Boolean)
          .map((lp: any) => ({
            urlHash: lp.urlHash,
            url: lp.url,
            title: lp.title,
            desc: lp.desc,
            image: lp.image,
            status: lp.status,
          }));
      
        const mentionsMe = mentionedMsgIds.has(m.id.toString());
      
        return {
          id: s(m.id),
          senderId: s(m.sender_id),
          sender: { name: m.sender?.name ?? null, image: m.sender?.image ?? null },
          createdAt: m.created_at.toISOString(),
          driftId: m.drift_id ? s(m.drift_id) : null,
          meta: (m.meta as any) ?? null,
          facets: [],
          defaultFacetId: null,
          text: m.text ?? null,
          attachments: m.attachments.map((a) => ({ id: a.id.toString(), path: a.path, type: a.type, size: a.size })),
          isRedacted: false,
          edited,
          quotes,
          // ✅ new
          linkPreviews,
          mentionsMe,
        };
      }

      // Sheaf (with visible facets)
      const fs = raw.map(toAclFacet).map(af => ({ ...af, attachments: attByFacet.get(af.id) ?? [] }));
      const visible = visibleFacetsFor(ctx, fs as any);

      if (visible.length === 0) {
        if (m.text || m.attachments.length) {
          const edited = !!m.edited_at;
          return {
            id: s(m.id),
            senderId: s(m.sender_id),
            sender: { name: m.sender?.name ?? null, image: m.sender?.image ?? null },
            createdAt: m.created_at.toISOString(),
            driftId: m.drift_id ? s(m.drift_id) : null,
            meta: (m.meta as any) ?? null,
            isRedacted: false,
            facets: [],
            defaultFacetId: null,
            text: m.text ?? null,
            attachments: m.attachments.map(a => ({ id: a.id.toString(), path: a.path, type: a.type, size: a.size })),
            edited,
            quotes,
          };
        }
        return null;
      }

      const def = defaultFacetFor(ctx, fs as any);
      const defId = def?.id ?? visible[0].id;
      const defObj = visible.find((f: any) => f.id === defId) ?? visible[0];

      const edited = toMs(defObj?.updatedAt) > toMs(defObj?.createdAt);
      const mentionsMe = mentionedMsgIds.has(m.id.toString());

      return {
        id: s(m.id),
        senderId: s(m.sender_id),
        sender: { name: m.sender?.name ?? null, image: m.sender?.image ?? null },
        createdAt: m.created_at.toISOString(),
        driftId: m.drift_id ? s(m.drift_id) : null,
        meta: (m.meta as any) ?? null,
        facets: visible.map((f: any) => {
          const fHashes = facetHashesByFacetId.get(f.id) ?? [];
          const fPreviews = fHashes
            .map((h) => previewByHash.get(h))
            .filter(Boolean)
            .map((lp: any) => ({
              urlHash: lp.urlHash,
              url: lp.url,
              title: lp.title,
              desc: lp.desc,
              image: lp.image,
              status: lp.status,
            }));
        
          return {
            id: f.id,
            audience: f.audience,
            sharePolicy: f.sharePolicy,
            expiresAt: f.expiresAt ?? null,
            body: f.body,
            attachments: f.attachments ?? [],
            priorityRank: f.priorityRank,
            createdAt: f.createdAt,
            updatedAt: f.updatedAt ?? null,
            isEdited: toMs(f.updatedAt) > toMs(f.createdAt),
            // NEW:
            linkPreviews: fPreviews,
          };
        }),
        defaultFacetId: defId,
        text: m.text ?? null,
        attachments: m.attachments.map(a => ({ id: a.id.toString(), path: a.path, type: a.type, size: a.size })),
        isRedacted: false,
        edited,    // neutral indicator for the shown facet
        quotes,
        mentionsMe,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const ordered = messageId
    ? results
    : [...results].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return ok({ userId, messages: ordered });
}

// ---------- POST /api/sheaf/messages ----------
/**
 * Body:
 * {
 *   conversationId: string|number,
 *   authorId: string|number,
 *   text?: string|null,
 *   facets: Array<{
 *     audience: AudienceSelector,
 *     sharePolicy?: 'ALLOW'|'REDACT'|'FORBID',
 *     expiresAt?: number|null,
 *     body: unknown,
 *     attachments?: Array<{ name: string; mime: string; size: number; sha256: string; path?: string|null; blobId?: string|null }>
 *   }>,
 *   defaultFacetIndex?: number
 * }
 */
export async function POST(req: NextRequest) {
  type FacetAttachmentIn = {
    name: string;
    mime: string;
    size: number;
    sha256: string;
    path?: string | null;
    blobId?: string | null;
  };
  type FacetIn = {
    audience: AudienceSelector;
    sharePolicy?: "ALLOW" | "REDACT" | "FORBID";
    expiresAt?: number | null;
    body: unknown;
    attachments?: FacetAttachmentIn[];
  };
  type Body = {
    conversationId: string | number;
    authorId: string | number;
    text?: string | null;
    facets: FacetIn[];
    defaultFacetIndex?: number;
    meta?: any; // ← NEW
  };

  let body: Body;
  try {
    body = await readJSON<Body>(req);
  } catch {
    return badRequest("Invalid JSON");
  }

  const { conversationId, authorId, facets, text, defaultFacetIndex, meta } = body;

  // Helpful 400
  if (
    !conversationId ||
    !authorId ||
    !Array.isArray(facets) ||
    facets.length === 0
  ) {
    return badRequest(
      `Missing conversationId/authorId/facets; got: ` +
        `conversationId=${String(conversationId)}; ` +
        `authorId=${String(authorId)}; ` +
        `facets=${
          Array.isArray(facets) ? `array(${facets.length})` : typeof facets
        }`
    );
  }

  const [author, convo] = await Promise.all([
    prisma.user.findUnique({ where: { id: toBigInt(authorId) } }),
    prisma.conversation.findUnique({ where: { id: toBigInt(conversationId) } }),
  ]);
  if (!author) return badRequest("Unknown authorId");
  if (!convo) return badRequest("Unknown conversationId");

  const message = await prisma.message.create({
    data: {
      conversation_id: toBigInt(conversationId),
      sender_id: toBigInt(authorId),
      text: text ?? null,
      meta: meta ?? undefined, // ← write meta
    },
    select: { id: true, created_at: true },
  });
  const msg = message; // ✅ make msg defined for later uses

  await createMessageNotification({
    conversationId: toBigInt(conversationId),
    messageId: msg.id,
    senderId: toBigInt(authorId),
  });
  // Preload LISTs for SNAPSHOT freeze
  const listIdsRef = Array.from(
    new Set(
      facets
        .map((f) => (f.audience.kind === "LIST" ? f.audience.listId : null))
        .filter(Boolean)
    )
  ) as string[];
  const listsRef = new Map(
    (
      await prisma.sheafAudienceList.findMany({
        where: { id: { in: listIdsRef } },
      })
    ).map((l) => [l.id, l])
  );

  const createdFacets: { id: bigint }[] = [];

  for (const f of facets) {
    const aud = f.audience;

    let audienceKind: "EVERYONE" | "ROLE" | "LIST" | "USERS" = "EVERYONE";
    let audienceMode: "DYNAMIC" | "SNAPSHOT" = "DYNAMIC";
    let audienceRole: string | null = null;
    let audienceListId: string | null = null;
    let snapshotMemberIds: string[] = [];
    let listVersionAtSend: number | null = null;
    let audienceUserIds: string[] = [];

    switch (aud.kind) {
      case "EVERYONE":
        audienceKind = "EVERYONE";
        break;
      case "ROLE":
        audienceKind = "ROLE";
        audienceMode = "DYNAMIC";
        audienceRole = aud.role;
        break;
      case "LIST":
        audienceKind = "LIST";
        audienceMode = aud.mode;
        audienceListId = aud.listId;
        if (aud.mode === "SNAPSHOT") {
          const l = listsRef.get(aud.listId);
          snapshotMemberIds = l
            ? l.memberIds.slice()
            : (aud as any).snapshotMemberIds ?? [];
          listVersionAtSend = l?.version ?? (aud as any).listVersionAtSend ?? 0;
        }
        break;
      case "USERS":
        audienceKind = "USERS";
        audienceMode = aud.mode;
        if (aud.mode === "SNAPSHOT") {
          snapshotMemberIds = (
            (aud as any).snapshotMemberIds ??
            aud.userIds ??
            []
          ).map(String);
        } else {
          audienceUserIds = (aud.userIds ?? []).map(String);
        }
        break;
    }

    const created = await prisma.sheafFacet.create({
      data: {
        messageId: message.id,
        audienceKind,
        audienceMode,
        audienceRole,
        audienceListId,
        snapshotMemberIds,
        listVersionAtSend,
        audienceUserIds,
        sharePolicy: f.sharePolicy ?? "ALLOW",
        expiresAt: f.expiresAt ? new Date(f.expiresAt) : null,
        body: f.body as any,
        priorityRank: priorityRank(f.audience),
      },
      select: { id: true },
    });

    // Persist attachments ONCE (don’t pass attachments in facet.create())
    if (f.attachments?.length) {
      for (const a of f.attachments) {
        const blob = await prisma.sheafBlob.upsert({
          where: { sha256: a.sha256 },
          update: { mime: a.mime, size: a.size, path: a.path ?? undefined },
          create: {
            id: a.blobId ?? undefined,
            sha256: a.sha256,
            mime: a.mime,
            size: a.size,
            path: a.path ?? null,
          },
        });
        await prisma.sheafAttachment.create({
          data: { facetId: created.id, blobId: blob.id, name: a.name },
        });
      }
    }

    createdFacets.push(created);
  }

  // Default facet
  if (defaultFacetIndex != null) {
    const df = createdFacets[defaultFacetIndex];
    if (df) {
      await prisma.sheafMessageMeta.upsert({
        where: { messageId: message.id },
        update: { defaultFacetId: df.id },
        create: { messageId: message.id, defaultFacetId: df.id },
      });
    }
  }

  // Build author-visible DTO to return for optimistic append
  const [viewer, viewerRoles] = await Promise.all([
    prisma.user.findUnique({ where: { id: toBigInt(authorId) } }),
    prisma.userRole.findMany({ where: { userId: toBigInt(authorId) } }),
  ]);

  const dbFacets = await prisma.sheafFacet.findMany({
    where: { messageId: message.id },
  });

  const facetIds = dbFacets.map((f) => f.id);
  const atts = await prisma.sheafAttachment.findMany({
    where: { facetId: { in: facetIds } },
    include: { blob: true },
  });
  const attByFacet = new Map<
    string,
    {
      id: string;
      name: string;
      mime: string;
      size: number;
      sha256: string;
      path?: string | null;
    }[]
  >();
  for (const a of atts) {
    const list = attByFacet.get(a.facetId.toString()) ?? [];
    list.push({
      id: a.id.toString(),
      name: a.name,
      mime: a.blob.mime,
      size: a.blob.size,
      sha256: a.blob.sha256,
      path: a.blob.path ?? null,
    });
    attByFacet.set(a.facetId.toString(), list);
  }

  const listIds2 = Array.from(
    new Set(dbFacets.map((f) => f.audienceListId).filter(Boolean))
  ) as string[];
  const listRows2 = await prisma.sheafAudienceList.findMany({
    where: { id: { in: listIds2 } },
    select: { id: true, memberIds: true },
  });
  const lists2 = new Map<string, { id: string; memberIds: string[] }>();
  for (const l of listRows2)
    lists2.set(l.id, { id: l.id, memberIds: l.memberIds });

  const rolesArr = viewerRoles.map((r) => r.role);
  const ctx = userCtxFrom(viewer!, rolesArr, lists2); // viewer is known to exist above

  const fs = dbFacets.map(toAclFacet).map((f) => ({
    ...f,
    attachments: attByFacet.get(f.id) ?? [],
  }));

  const visible = visibleFacetsFor(ctx, fs as any);
// After facets are created (dbFacets or createdFacets visible)
// 1) Mentions per facet
for (const f of dbFacets) {
  try {
    const text = facetToPlainText(f.body as any);
    const tokens = await parseMentionsFromText(text, undefined, async (names) => {
      const users = await prisma.user.findMany({ where: { username: { in: names } }, select: { id: true, username: true } });
      return users.map(u => ({ id: u.id.toString(), username: u.username }));
    });
    if (!tokens.length) continue;

    const allowed: bigint[] = [];
    await Promise.all(tokens.map(async t => {
      const uid = BigInt(t.userId);
      if (uid === toBigInt(authorId)) return; // skip self
      if (await canUserSeeFacetNow(uid, f as any)) allowed.push(uid);
    }));

    if (allowed.length) {
      await prisma.messageMention.createMany({
        data: allowed.map(uid => ({ messageId: message.id, facetId: f.id, userId: uid })),
        skipDuplicates: true,
      });
      // TODO: notifications
    }
  } catch (e) {
    console.warn("[sheaf] mention parse failed", e);
  }
}

// 2) Unfurl per facet (post-response fire-and-forget)
const facetUrls = dbFacets.flatMap(f => extractUrls(facetToPlainText(f.body as any)));
Promise.resolve().then(() => {
  for (const url of facetUrls.slice(0, 8)) {
    getOrFetchLinkPreview(url, /* facetId */ undefined)
      .then(() => supabase
        .channel(`conversation-${String(conversationId)}`)
        .send({
          type: "broadcast",
          event: "link_preview_update",
          payload: { messageId: String(message.id), urlHash: hashUrl(url) },
        }).catch(() => {}))
      .catch(() => {});
  }
});

  const def = visible.length
    ? defaultFacetFor(ctx, fs as any)?.id ?? visible[0].id
    : null;

  return ok({
    message: {
      id: s(message.id),
      senderId: s(authorId),
      sender: { name: author.name, image: author.image ?? null }, // 👈 include sender here
      createdAt: message.created_at.toISOString(),
      facets: visible.map((f: any) => ({
        id: f.id,
        audience: f.audience,
        sharePolicy: f.sharePolicy,
        expiresAt: f.expiresAt ?? null,
        body: f.body,
        attachments: f.attachments ?? [],
        priorityRank: f.priorityRank,
        createdAt: f.createdAt,
      })),
      defaultFacetId: def,
      text: null,
    },
  });
}

-app/api/sheaf/participants/route.ts: import { NextRequest } from 'next/server';
import { prisma } from '../_prisma';
import { ok, badRequest, toBigInt } from '../_util';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversationId');
  if (!conversationId) return badRequest('Missing conversationId');

  const parts = await prisma.conversationParticipant.findMany({
    where: { conversation_id: toBigInt(conversationId) },
    include: { user: { select: { id: true, name: true, username: true } } }
  });

  const users = parts.map((p) => ({
    id: String(p.user.id),
    name: p.user.name || p.user.username || String(p.user.id),
  }));

  return ok({ users });
}


-app/api/sheaf/preview/route.ts: import { NextRequest } from 'next/server';
import { prisma } from '../_prisma';
import { ok, badRequest } from '../_util';
import { userCtxFrom } from '../_map';
import {
  visibleFacetsFor,
  defaultFacetFor,
  priorityRank,
  type AudienceSelector,
  type MessageFacet,
} from '@app/sheaf-acl';
import type { SheafAudienceList } from '@prisma/client';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  type FacetIn = {
    audience: AudienceSelector;
    sharePolicy?: 'ALLOW' | 'REDACT' | 'FORBID';
    expiresAt?: number | null;
    body: any;
    attachments?: any[];
  };
  type Body = {
    viewer: { everyone?: true; role?: string; userId?: string | number; roles?: string[] };
    facets: FacetIn[];
  };

  let body: Body;
  try { body = await req.json(); } catch { return badRequest('Invalid JSON'); }

  const { viewer, facets } = body;
  if (!viewer || !Array.isArray(facets)) return badRequest('Missing viewer/facets');

  // Preload lists referenced by facets
  const listIds = Array.from(new Set(
    facets.map(f => f.audience?.kind === 'LIST' ? f.audience.listId : null).filter(Boolean)
  )) as string[];

  const listRows = await prisma.sheafAudienceList.findMany({
    where: { id: { in: listIds } },
    select: { id: true, memberIds: true },  // only what we need
  });



// ✅ typed map
const lists = new Map<string, Pick<SheafAudienceList, 'id' | 'memberIds'>>();
for (const l of listRows) {
  lists.set(l.id, { id: l.id, memberIds: l.memberIds });
}

  // Viewer context
  let dbUser = null, roles: string[] = [];
  if (viewer.userId != null) {
    dbUser = await prisma.user.findUnique({ where: { id: BigInt(viewer.userId) } });
    roles = viewer.roles ?? [];
  } else if (viewer.role) {
    roles = [viewer.role];
  }
  const ctx = userCtxFrom(dbUser, roles, lists);

  // Build ACL facets directly from draft
  const aclFacets: MessageFacet[] = facets.map((f, i) => ({
    id: `draft_${i}`,
    messageId: 'draft',
    audience: f.audience,
    sharePolicy: f.sharePolicy ?? 'ALLOW',
    expiresAt: f.expiresAt ?? undefined,
    body: f.body,
    attachments: f.attachments ?? [],
    createdAt: Date.now(),
    priorityRank: priorityRank(f.audience),
  }));

  const visible = visibleFacetsFor(ctx, aclFacets);
  if (visible.length === 0) return ok({ visible: [], defaultFacetId: null });

  const def = defaultFacetFor(ctx, aclFacets);
  return ok({ visible: visible.map(f => f.id), defaultFacetId: def?.id ?? visible[0].id });
}


-app/api/sheaf/upload/route.ts: import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { createWriteStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import crypto from 'node:crypto';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ ok: false, error: 'No file' }, { status: 400 });

  const arrayBuf = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuf);

  // compute sha256
  const sha256 = crypto.createHash('sha256').update(buf).digest('hex');

  // write under .uploads/sheaf (dev only)
  const dir = join(process.cwd(), '.uploads', 'sheaf');
  await mkdir(dir, { recursive: true });
  const outPath = join(dir, `${sha256}-${file.name}`);
  await new Promise<void>((resolve, reject) => {
    const ws = createWriteStream(outPath);
    ws.on('error', reject);
    ws.on('finish', () => resolve());
    ws.end(buf);
  });

  // upsert SheafBlob
  const blob = await prisma.sheafBlob.upsert({
    where: { sha256 },
    update: { mime: file.type || 'application/octet-stream', size: buf.length, path: outPath },
    create: { sha256, mime: file.type || 'application/octet-stream', size: buf.length, path: outPath },
  });

  return NextResponse.json({
    ok: true,
    blob: {
      id: String(blob.id),
      sha256,
      mime: blob.mime,
      size: blob.size,
      path: blob.path,
      name: file.name,
    }
  });
}


-app/api/sheaf/_map.ts: import type { SheafFacet, SheafAudienceList, User } from '@prisma/client';

import {
    AudienceSelector,
    AudienceEnv,
    priorityRank,
    MessageFacet as AclFacet,
  } from '@app/sheaf-acl';


  import type { UserContext } from '@app/sheaf-acl';



  export function toAudienceSelector(row: SheafFacet): AudienceSelector {
    let sel: AudienceSelector;
  
    switch (row.audienceKind) {
      case 'EVERYONE': {
        sel = { kind: 'EVERYONE' };
        break;
      }
  
      case 'ROLE': {
        sel = { kind: 'ROLE', role: row.audienceRole!, mode: 'DYNAMIC' };
        break;
      }
  
      case 'LIST': {
        sel = {
          kind: 'LIST',
          listId: row.audienceListId!,
          mode: row.audienceMode as 'DYNAMIC' | 'SNAPSHOT',
          snapshotMemberIds:
            row.audienceMode === 'SNAPSHOT' ? row.snapshotMemberIds ?? [] : undefined,
          listVersionAtSend: row.listVersionAtSend ?? undefined,
        };
        break;
      }
  
      case 'USERS': {
        sel =
          row.audienceMode === 'SNAPSHOT'
            ? { kind: 'USERS', mode: 'SNAPSHOT', snapshotMemberIds: row.snapshotMemberIds ?? [] }
            : { kind: 'USERS', mode: 'DYNAMIC', userIds: row.audienceUserIds ?? [] };
        break;
      }
  
      default: {
        // If the enum ever changes at runtime, fail safe:
        sel = { kind: 'EVERYONE' };
        break;
      }
    }
  
    return sel;
  }
  

export function toAclFacet(row: SheafFacet): AclFacet {
  const aud = toAudienceSelector(row);
  return {
    id: row.id.toString(),
    messageId: row.messageId.toString(),
    audience: aud,
    sharePolicy: row.sharePolicy,
    expiresAt: row.expiresAt ? row.expiresAt.getTime() : undefined,
    body: row.body,
    attachments: undefined, // you can fill from DB in your route if needed
    createdAt: row.createdAt?.getTime(),
    priorityRank: row.priorityRank ?? priorityRank(aud),
  };
}

export function userCtxFrom(
    user: User | null,
    roles: string[],
    lists: Map<string, Pick<SheafAudienceList, 'id' | 'memberIds'>>
  ): UserContext {
    return {
      id: user ? user.id.toString() : 'anon',
      roles: new Set(roles),
      inList: (listId: string) => {
        if (!user) return false;
        const l = lists.get(listId);
        return !!l && l.memberIds.includes(user.id.toString());
      },
    };
  }
  

export function buildAudienceEnv(
  dynamicLists: Map<string, SheafAudienceList>,
  roleMembers?: Map<string, string[]>
): AudienceEnv {
  return {
    resolveListMembers: (listId) => dynamicLists.get(listId)?.memberIds ?? null,
    resolveRoleMembers: (role) => roleMembers?.get(role) ?? null,
  };
}


-import { PrismaClient } from '@prisma/client';

const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') g.prisma = prisma;

-import type { NextRequest } from 'next/server';

export async function readJSON<T>(req: NextRequest): Promise<T> {
  try { return await req.json(); } catch { throw new Error('Invalid JSON'); }
}

export function ok(data: any, init: number = 200) {
  return new Response(JSON.stringify(data), {
    status: init,
    headers: { 'content-type': 'application/json' },
  });
}

export function badRequest(message: string, extra?: any) {
  return ok({ error: message, ...(extra ?? {}) }, 400);
}

export function toBigInt(id: string | number | bigint): bigint {
  if (typeof id === 'bigint') return id;
  if (typeof id === 'number') return BigInt(id);
  // string
  return BigInt(id);
}

export function s(x: bigint | number | string | null | undefined) {
  if (x === null || x === undefined) return null;
  return typeof x === 'bigint' ? x.toString() : String(x);
}



  │  ├─ threads
│  │  │  ├─ [id]
│  │  │  │  └─ resolve
│  │  │  │     └─ route.ts
│  │  │  └─ ensure
│  │  │     └─ route.ts

-app/api/threads/[id]/resolve/route.ts: import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const updated = await prisma.commentThread.update({
    where: { id: params.id },
    data: { resolved: true },
    select: { id: true, resolved: true },
  });
  return NextResponse.json(updated);
}


-app/api/threads/ensure/route.ts: import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";
import { jsonSafe } from "@/lib/bigintjson";

export async function POST(req: NextRequest) {
  try {
    const me = await getUserFromCookies();
    if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });

    const { rootMessageId } = await req.json();
    if (!rootMessageId) {
      return NextResponse.json({ ok: false, error: "rootMessageId required" }, { status: 400 });
    }
    const rootId = BigInt(rootMessageId);

    // Load the root message to resolve conversation + auth
    const root = await prisma.message.findUnique({
      where: { id: rootId },
      select: { id: true, conversation_id: true },
    });
    if (!root) return NextResponse.json({ ok: false, error: "Root message not found" }, { status: 404 });

    // Ensure membership
    const member = await prisma.conversationParticipant.findFirst({
      where: { conversation_id: root.conversation_id, user_id: me.userId },
      select: { id: true },
    });
    if (!member) return new NextResponse("Forbidden", { status: 403 });

    // Try to find existing THREAD drift for this root
    const existing = await prisma.drift.findFirst({
      where: { conversation_id: root.conversation_id, root_message_id: root.id, kind: "THREAD" as any },
    });
    if (existing) {
      return NextResponse.json(jsonSafe({
        ok: true,
        drift: {
          id: existing.id.toString(),
          conversationId: existing.conversation_id.toString(),
          title: existing.title,
          isClosed: existing.is_closed,
          isArchived: existing.is_archived,
          messageCount: existing.message_count,
          lastMessageAt: existing.last_message_at ? existing.last_message_at.toISOString() : null,
          anchorMessageId: existing.anchor_message_id ? existing.anchor_message_id.toString() : null,
          kind: "THREAD",
          rootMessageId: existing.root_message_id?.toString() ?? null,
        },
      }), { status: 200 });
    }

    const created = await prisma.drift.create({
        data: {
          conversation_id: root.conversation_id, // ✅ snake_case matches your model
          created_by:      me.userId,
          title:           "Thread",
          kind:            "THREAD",
          root_message_id: root.id,
          anchor_message_id: null,                // ✅ now allowed
        },
      });

    // (No anchor broadcast; thread pane appears when the user opens it.)
    // Counters will be broadcast on first reply (see §5).

    return NextResponse.json(jsonSafe({
      ok: true,
      drift: {
        id: created.id.toString(),
        conversationId: created.conversation_id.toString(),
        title: created.title,
        isClosed: created.is_closed,
        isArchived: created.is_archived,
        messageCount: created.message_count,
        lastMessageAt: created.last_message_at ? created.last_message_at.toISOString() : null,
        anchorMessageId: created.anchor_message_id ? created.anchor_message_id.toString() : null,
        kind: "THREAD",
        rootMessageId: created.root_message_id?.toString() ?? null,
      },
    }), { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/threads/ensure] error", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Internal error" }, { status: 500 });
  }
}



│  ├─ chat
│  │  ├─ ChatRoom.tsx
│  │  ├─ ConversationList.tsx
│  │  ├─ ConversationView.tsx
│  │  ├─ DriftChip.tsx
│  │  ├─ DriftPane.tsx
│  │  ├─ GroupCreationModal.tsx
│  │  ├─ LinkCard.tsx
│  │  ├─ MessageActions.tsx
│  │  ├─ MessageComposer.tsx
│  │  ├─ MessageUserModal.tsx
│  │  ├─ MessagesRealtimeBootstrap.tsx
│  │  ├─ MessengerPane.tsx
│  │  ├─ PollChip.tsx
│  │  ├─ PrivateChatDock.tsx
│  │  ├─ PrivateChatShell.tsx
│  │  ├─ QuickPollComposer.tsx
│  │  ├─ QuickPollModal.tsx
│  │  ├─ QuickTempModal.tsx
│  │  ├─ QuoteBlock.tsx
│  │  ├─ StarToggle.tsx
│  │  └─ StarredFilterToggle.tsx

-ChatRoom.tsx: // components/chat/ChatRoom.tsx
"use client";

import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseclient";
import type { DriftUI, Message, PollUI } from "@/contexts/useChatStore";
import { useChatStore } from "@/contexts/useChatStore";
import {
  ChatMessage,
  ChatMessageContent,
  ChatMessageAvatar,
} from "@/components/ui/chat-message";
import { SheafMessageBubble } from "@/components/sheaf/SheafMessageBubble";
import { usePrivateChatManager } from "@/contexts/PrivateChatManager";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { roomKey } from "@/lib/chat/roomKey";
import PollChip from "@/components/chat/PollChip";
// import QuickPollComposer from "@/components/chat/QuickPollComposer"; // (unused)
import type { PollStateDTO } from "@/types/poll";
// import { ReactionSummary } from "@/components/reactions/ReactionSummary"; // (unused)
/* import { ReactionBar } from "@/components/reactions/ReactionBar";
import { ReactionTrigger } from "@/components/reactions/ReactionTrigger"; */
import { DriftChip } from "@/components/chat/DriftChip";
import { DriftPane } from "@/components/chat/DriftPane";
import { QuoteBlock } from "@/components/chat/QuoteBlock";
import { LinkCard } from "@/components/chat/LinkCard";
import { useConversationRealtime } from "@/hooks/useConversationRealtime";
import { useStars } from "@/hooks/useStars";
import StarToggle from "@/components/chat/StarToggle";
import StarredFilterToggle from "@/components/chat/StarredFilterToggle";
import { useSearchParams } from "next/navigation";
import { useBookmarks } from "@/hooks/useBooksmarks";
import ProposalsCompareModal from "@/components/proposals/ProposalsCompareModal";
import { useReceipts } from "@/hooks/useReceipts";
import ReceiptChip from "@/components/gitchat/ReceiptChip";
import { mutate as swrMutate } from "swr";


const ENABLE_REACTIONS = false;

type Props = {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
  highlightMessageId?: string | null;
  currentUserName?: string;
  currentUserImage?: string | null;
  onQuote?: (qr: { messageId: string; facetId?: string }) => void;
};

function excerpt(text?: string | null, len = 100) {
  if (!text) return null;
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > len ? t.slice(0, len - 1) + "…" : t;
}

function textFromTipTap(node: any): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(textFromTipTap).join("");
  if (typeof node === "object") {
    if (node.text) return String(node.text);
    if (Array.isArray(node.content))
      return node.content.map(textFromTipTap).join("");
    return textFromTipTap(node.content);
  }
  return "";
}
function toSnippet(raw: string, max = 48) {
  const s = raw.replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// --- Merge / Edit summary chip (expandable), safe hook usage ---
function MergeHistorySummary({
  messageId,
  isMine,
  edited,
}: {
  messageId: string;
  isMine: boolean;
  edited?: boolean;
}) {
  const { list, latest, isLoading } = useReceipts(messageId);
  const hasReceipts = Array.isArray(list) && list.length > 0;
  const hasEditsOnly = !!edited && !hasReceipts;

  if (!hasReceipts && !hasEditsOnly) return null;

  const [open, setOpen] = React.useState(false);

  // label summary (like your thread chip)
  const label = hasReceipts
    ? `v${latest?.v ?? list.length} • merged ${new Date(
        (latest as any)?.mergedAt ?? (latest as any)?.merged_at ?? Date.now()
      ).toLocaleString()}`
    : <div className=" mt-2">(edited)</div>;

  return (
    <div className={["mx-[3%] px-3 mt-0 mb-0", isMine ? "text-right" : "text-left"].join(" ")}>
      <button
        type="button"
        className={[
          "mt-1 text-[12px] transition-opacity",
          "text-slate-800 hover:underline hover:underline-offset-4",
        ].join(" ")}
        onClick={() => setOpen((o) => !o)}
        title={hasReceipts ? "Show merge history" : "Show edit info"}
      >
        <div className="flex inline-block gap-2 items-center">
          {isMine ? (
            <>
              <span className="text-[.8rem] inline-block  hover:underline hover:underline-offset-4">{label}</span>
              <div className=" mr-4 w-8 h-3 border-b-[1px] border-r-[1px] border-slate-600"></div>
            </>
          ) : (
            <>
            <div className=" ml-4 w-8 h-3 border-b-[1px] border-l-[1px] border-slate-600"></div>

              <span className="text-[.8rem] inline-block  hover:underline hover:underline-offset-4">{label}</span>
              </>
          )}
        </div>
      </button>

      {/* expanded panel */}
      {open && (
        <div
          className={[
            "mt-2 inline-block max-w-[92%] rounded-xl border bg-white/70 backdrop-blur px-3 py-2",
            isMine ? "text-right" : "text-left",
          ].join(" ")}
        >
          {isLoading ? (
            <div className="text-[12px] text-slate-600">Loading…</div>
          ) : hasReceipts ? (
            <div className="space-y-1 ">
              {/* show newest first */}
              {[...list].reverse().slice(0, 6).map((r: any) => {
                const mergedAt = r.mergedAt ?? r.merged_at;
                const v = r.v ?? "(?)";
                return (
                  <div key={`${messageId}-v-${v}`} className="text-[12px] text-slate-700">
                    <span className="mr-2 font-medium">v{v}</span>
                    <span className="mr-2 opacity-80">
                      {mergedAt ? new Date(mergedAt).toLocaleString() : ""}
                    </span>
                    <a
                      href={`/m/${encodeURIComponent(messageId)}/compare?v=${v}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      view
                    </a>
                  </div>
                );
              })}
              {list.length > 6 && (
                <div className="text-[12px] text-slate-500">… {list.length - 6} more</div>
              )}
            </div>
          ) : (
          <div className="text-[.75rem]">edited @</div>
          )}
        </div>
      )}
    </div>
  );
}

function ThreadSummary({
  threadEntry,
  messageId,
  isMine,
  onOpen,
}: {
  threadEntry?: DriftUI;
  messageId: string;
  isMine: boolean;
  onOpen: (driftId: string) => void;
}) {
  const count = Math.max(0, threadEntry?.drift?.messageCount ?? 0);
  const hasReplies = count > 0;
  return (
    <div
      className={[
        "mx-[3%] px-3 mt-0 mb-0",
        isMine ? "text-right" : "text-left",
      ].join(" ")}
    >
      <button
        type="button"
        className={[
          "mt-1 text-[12px] transition-opacity",
          hasReplies ? "text-slate-800 " : "hidden",
        ].join(" ")}
        onClick={() =>
          hasReplies && threadEntry && onOpen(threadEntry.drift.id)
        }
        title="Open thread"
      >
        <div className="flex inline-block gap-2">
          {isMine ? (
            <>
              <span className="text-[.8rem] inline-block mt-[5px] hover:underline hover:underline-offset-4">
                {count === 0
                  ? "reply"
                  : `${count} ${count === 1 ? "reply" : "replies"}`}
              </span>

              <div className=" mr-4 w-12 h-4 border-b-[1px] border-r-[1px] border-slate-600"></div>
            </>
          ) : (
            <>
              <div className=" ml-4 w-12 h-4 border-b-[1px] border-l-[1px] border-slate-600"></div>
              <span className="text-[.8rem] inline-block mt-[5px] hover:underline hover:underline-offset-4">
                {count === 0
                  ? "reply"
                  : `${count} ${count === 1 ? "reply" : "replies"}`}
              </span>
            </>
          )}
        </div>
      </button>
    </div>
  );
}

function Attachment({
  a,
}: {
  a: { id: string; path: string; type: string; size: number };
}) {
  const [url, setUrl] = useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function signWithRetry() {
      for (let i = 0; i < 4; i++) {
        try {
          const r = await fetch(`/api/messages/attachments/${a.id}/sign`);
          if (r.ok) {
            const { url } = await r.json();
            if (!cancelled) setUrl(url);
            return;
          } else {
            const txt = await r.text();
            console.warn(
              `[attachment] sign ${a.id} try ${i + 1} failed:`,
              r.status,
              txt
            );
          }
        } catch (e) {
          console.warn(
            `[attachment] sign ${a.id} network error try ${i + 1}`,
            e
          );
        }
        await new Promise((res) => setTimeout(res, 150 * (i + 1)));
      }
      if (!cancelled) setUrl(null);
    }
    signWithRetry();
    return () => {
      cancelled = true;
    };
  }, [a.id]);

  if (!url) return null;

  if (a.type.startsWith("image/")) {
    return (
      <Image
        src={url}
        alt="attachment"
        width={256}
        height={256}
        className="rounded-md max-h-64 object-cover"
      />
    );
  }

  const name = a.path.split("/").pop();
  return (
    <a
      href={url}
      download={name || undefined}
      className="flex items-center gap-2 text-blue-600 underline"
    >
      <span>📎</span>
      <span>{(a.size / 1024).toFixed(1)} KB</span>
    </a>
  );
}

 function ReceiptRow({ messageId, isMine }: { messageId: string; isMine: boolean }) {
     const { latest } = useReceipts(messageId);
     if (!latest) return null;
     const mergedAt = (latest as any).mergedAt ?? (latest as any).merged_at;
     return (
       <div
         className={[
           "mt-1 text-[11px] text-slate-500 italic",
           isMine ? "text-right flex flex-col pr-3" : "text-left flex flex-col pl-3",
         ].join(" ")}
       >
         v{latest.v} merge at {mergedAt ? new Date(mergedAt).toLocaleString() : ""}
         {" "}
         <a
           className="underline"
           href={`/m/${encodeURIComponent(messageId)}/compare?v=${latest.v}`}
           target="_blank"
           rel="noreferrer"
         >
           View 
         </a>
       </div>
     );
   }
   

const MessageRow = memo(function MessageRow({
  m,
  currentUserId,
  conversationId,
  onOpen,
  onPrivateReply,
  onCreateOptions,
  onCreateTemp,
  onReplyInThread,
  onProposeAlternative,
  onCompareProposals,
  onMergeProposal,
  onDelete,
}: {
  m: Message;
  currentUserId: string;
  conversationId: string;
  onOpen: (peerId: string, peerName: string, peerImage?: string | null) => void;
  onPrivateReply?: (m: Message) => void;
  onCreateOptions: (m: Message) => void;
  onCreateTemp: (m: Message) => void;
  onReplyInThread: (messageId: string) => void; // NEW
  onProposeAlternative: (rootMessageId: string) => void;
  onCompareProposals: (rootMessageId: string) => void;
  onMergeProposal: (rootMessageId: string) => void;
  onDelete: (id: string) => void;
}) {
  const setQuoteDraft = useChatStore((s) => s.setQuoteDraft);
  const isMine = String(m.senderId) === String(currentUserId);
  const isRedacted = Boolean((m as any).isRedacted || (m as any).is_redacted);
  // ★ Stars
  const { isStarred, toggleStar } = useStars(conversationId);
  const starred = isStarred(m.id);
  // 🔖 Bookmarks
  const { isBookmarked, toggleBookmark, labelFor } =
    useBookmarks(conversationId);
  const bookmarked = isBookmarked(m.id);
  return (
    <ChatMessage
      type={isMine ? "outgoing" : "incoming"}
      id={m.id}
      variant="bubble"
      data-msg-id={m.id}
    >
      {!isMine && (
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer">
            <ChatMessageAvatar
              imageSrc={m.sender?.image || "/assets/user-helsinki.svg"}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={6}>
            <DropdownMenuItem
              onClick={() =>
                onOpen(
                  String(m.senderId),
                  m.sender?.name ?? "User",
                  m.sender?.image ?? null
                )
              }
            >
              💬 Side Chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPrivateReply?.(m)}>
              🔒 Reply To {m.sender?.name || "User"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {isRedacted ? (
        <div
          className={[
            "relative group w-full",
            isMine ? "flex justify-end" : "flex justify-start",
          ].join(" ")}
        >
          <ChatMessageContent
            content="(redacted)"
            className="opacity-70 italic"
          />
        </div>
      ) : Array.isArray(m.facets) && m.facets.length > 0 ? (
        <>
          <div
            className={[
              "relative group w-full",
              isMine ? "flex justify-end" : "flex justify-start",
            ].join(" ")}
          >
            <SheafMessageBubble
              messageId={m.id}
              conversationId={conversationId}
              currentUserId={currentUserId}
              facets={m.facets as any}
              defaultFacetId={m.defaultFacetId}
            />
            {(m as any).edited ? (
              <div
                className={[
                  "mt-1 text-[11px] text-slate-500 italic",
                  isMine ? "text-right" : "text-left",
                ].join(" ")}
              >
                (edited)
              </div>
            ) : null}

            {/* ✅ Receipt row lives OUTSIDE the bubble container */}
<div className={isMine ? "mt-1 w-full flex justify-end pr-3" : "mt-1 w-full flex justify-start pl-3"}>
  <ReceiptRow messageId={String(m.id)} isMine={isMine} />
</div>
             {/* Merge receipt chip (safe hook usage in child) */}

            <div
              className={[
                "absolute top-1 z-20 flex",
                isMine ? "-right-0" : "left-0",
                "invisible opacity-0 pointer-events-none",
                "group-hover:visible group-hover:opacity-100 group-hover:pointer-events-auto",
                "transition-opacity duration-150",
              ].join(" ")}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="py-0 px-0 bg-transparent align-center my-auto  rounded-md text-xs focus:outline-none"
                    title="Message actions"
                    type="button"
                  >
                    ᳀
                    {/* <Image
                      src="/assets/dot-mark.svg"
                      alt="actions"
                      width={32}
                      height={32}
                      className="cursor-pointer object-fill w-[10px]"
                    /> */}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align={isMine ? "end" : "start"}
                  sideOffset={6}
                  className="flex flex-col bg-white/30 border-none backdrop-blur rounded-xl max-w-[400px] py-2"
                >
                  {isMine ? (
                    <>
                      <DropdownMenuItem
                        onClick={() => onProposeAlternative(m.id)}
                      >
                        ሗ New Fork 
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onCompareProposals(m.id)}
                      >
                        𐂶 Compare Forks
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onMergeProposal(m.id)}>
                        ✅ Approve Merge
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => alert("Edit is coming soon.")}
                      >
                        ✏️ Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onReplyInThread(m.id)}>
                        🧵 Reply
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => {
                          const facetId =
                            (m as any).defaultFacetId ??
                            (Array.isArray(m.facets) && m.facets[0]?.id) ??
                            undefined;
                          useChatStore
                            .getState()
                            .setQuoteDraft(conversationId, {
                              messageId: m.id,
                              facetId,
                            });
                        }}
                      >
                        📋 Quote
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (bookmarked) {
                            // remove
                            toggleBookmark(m.id);
                          } else {
                            // prompt optional label on add
                            const label = (
                              typeof window !== "undefined"
                                ? window.prompt("Add a label (optional)", "")
                                : ""
                            )?.trim();
                            toggleBookmark(m.id, {
                              label: label ? label : null,
                            });
                          }
                        }}
                      >
                        {bookmarked ? "🔖 Remove Bookmark" : "🔖 Bookmark…"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleStar(m.id)}>
                        {starred ? "★ Unstar" : "☆ Star"}
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => onDelete(m.id)}
                      >
                        🗑 Delete
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem
                        onClick={() => {
                          const facetId =
                            (m as any).defaultFacetId ??
                            (Array.isArray(m.facets) && m.facets[0]?.id) ??
                            undefined;
                          useChatStore
                            .getState()
                            .setQuoteDraft(conversationId, {
                              messageId: m.id,
                              facetId,
                            });
                        }}
                      >
                        📋 Quote
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onProposeAlternative(m.id)}
                      >
                        ሗ New Fork 
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onCompareProposals(m.id)}
                      >
                        𐂶 Compare Forks
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPrivateReply?.(m)}>
                        ↩️ Reply in DMs
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onReplyInThread(m.id)}>
                        🧵 Thread Reply 
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (bookmarked) {
                            toggleBookmark(m.id);
                          } else {
                            const label = (
                              typeof window !== "undefined"
                                ? window.prompt("Add a label (optional)", "")
                                : ""
                            )?.trim();
                            toggleBookmark(m.id, {
                              label: label ? label : null,
                            });
                          }
                        }}
                      >
                        {bookmarked ? "🔖 Remove Bookmark" : "🔖 Bookmark…"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleStar(m.id)}>
                        {starred ? "★ Unstar" : "☆ Star"}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </>
      ) : (
        <>
        
          <div
            className={[
              "relative  group w-full",
              isMine ? "flex justify-end" : "flex justify-start",
            ].join(" ")}
          >
            {m.text ? (
              <ChatMessageContent content={m.text} />
            ) : (
              <ChatMessageContent content="" className="min-h-6" />
            )}

        

            <div
              className={[
                "absolute top-1 z-20 flex",
                "invisible opacity-0 pointer-events-none",
                "group-hover:visible group-hover:opacity-100 group-hover:pointer-events-auto",
                "transition-opacity duration-150",
              ].join(" ")}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="py-0 px-0 bg-transparent align-center my-auto  rounded-md text-xs focus:outline-none"
                    title="Message actions"
                    type="button"
                  >
                    ᳀
                    {/* <Image
                      src="/assets/dot-mark.svg"
                      alt="actions"
                      width={32}
                      height={32}
                      className="cursor-pointer object-fill w-[10px]"
                    /> */}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align={isMine ? "end" : "start"}
                  sideOffset={6}
                  className="flex flex-col bg-white/30 border-none backdrop-blur rounded-xl max-w-[400px] py-2"
                >
                  {isMine ? (
                    <>
                      <DropdownMenuItem
                        onClick={() => onProposeAlternative(m.id)}
                      >
                        ሗ New Fork
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onCompareProposals(m.id)}
                      >
                        𐂶 Compare Forks
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onMergeProposal(m.id)}>
                        ✅ Approve Merge
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onReplyInThread(m.id)}>
                        🧵 Thread Reply
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => alert("Edit is coming soon.")}
                      >
                        ✏️ Edit
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => {
                          const facetId =
                            (m as any).defaultFacetId ??
                            (Array.isArray(m.facets) && m.facets[0]?.id) ??
                            undefined;
                          useChatStore
                            .getState()
                            .setQuoteDraft(conversationId, {
                              messageId: m.id,
                              facetId,
                            });
                        }}
                      >
                        📋 Quote
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (bookmarked) {
                            toggleBookmark(m.id);
                          } else {
                            const label = (
                              typeof window !== "undefined"
                                ? window.prompt("Add a label (optional)", "")
                                : ""
                            )?.trim();
                            toggleBookmark(m.id, {
                              label: label ? label : null,
                            });
                          }
                        }}
                      >
                        {bookmarked ? "🔖 Remove Bookmark" : "🔖 Bookmark…"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleStar(m.id)}>
                        {starred ? "★ Unstar" : "☆ Star"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => onDelete(m.id)}
                      >
                        🗑 Delete
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem
                        onClick={() => onProposeAlternative(m.id)}
                      >
                        🪄 Propose an Alternative
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onCompareProposals(m.id)}
                      >
                        🧬 Compare Proposals
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const facetId =
                            (m as any).defaultFacetId ??
                            (Array.isArray(m.facets) && m.facets[0]?.id) ??
                            undefined;
                          useChatStore
                            .getState()
                            .setQuoteDraft(conversationId, {
                              messageId: m.id,
                              facetId,
                            });
                        }}
                      >
                        📋 Quote
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => onPrivateReply?.(m)}>
                        ↩️ Reply in DMs
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleStar(m.id)}>
                        {starred ? "★ Unstar" : "☆ Star"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onReplyInThread(m.id)}>
                        🧵 Create Reply Thread
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (bookmarked) {
                            toggleBookmark(m.id);
                          } else {
                            const label = (
                              typeof window !== "undefined"
                                ? window.prompt("Add a label (optional)", "")
                                : ""
                            )?.trim();
                            toggleBookmark(m.id, {
                              label: label ? label : null,
                            });
                          }
                        }}
                      >
                        {bookmarked ? "🔖 Remove Bookmark" : "🔖 Bookmark…"}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </>
      )}

      {isMine && (
        <ChatMessageAvatar
          imageSrc={m.sender?.image || "/assets/user-helsinki.svg"}
        />
      )}
      
    </ChatMessage>
  );
});

export default function ChatRoom({
  conversationId,
  currentUserId,
  initialMessages,
  highlightMessageId,
  currentUserName = "",
  currentUserImage = null,
}: Props) {
  const { open, state } = usePrivateChatManager();

  const driftsByAnchorId = useChatStore((s) => s.driftsByAnchorId);
  const driftsByRoot = useChatStore((s) => s.driftsByRootMessageId);
  const setDrifts = useChatStore((s) => s.setDrifts);
  const upsertDrift = useChatStore((s) => s.upsertDrift);
  const setDriftMessages = useChatStore((s) => s.setDriftMessages);
  const appendDriftMessage = useChatStore((s) => s.appendDriftMessage);
  const [compareFor, setCompareFor] = useState<string | null>(null);

  const [openDrifts, setOpenDrifts] = useState<Record<string, boolean>>({});
  const openDrift = React.useCallback(
    (driftId: string) => {
      setOpenDrifts((prev) => ({ ...prev, [driftId]: true }));
      // fire-and-forget refresh (debounced naturally by user behavior)
      fetch(
        `/api/drifts/${encodeURIComponent(
          driftId
        )}/messages?userId=${encodeURIComponent(
          currentUserId
        )}&_t=${Date.now()}`,
        { cache: "no-store" }
      )
        .then((r) => (r.ok ? r.json() : null))
        .then(
          (d) =>
            Array.isArray(d?.messages) &&
            useChatStore.getState().setDriftMessages(driftId, d.messages)
        )
        .catch(() => {});
    },
    [currentUserId]
  );

  const closeDrift = React.useCallback(
    (driftId: string) => setOpenDrifts((p) => ({ ...p, [driftId]: false })),
    []
  );

  const handleOpen = useCallback(
    (peerId: string, peerName: string, peerImage?: string | null) => {
      const rid = roomKey(conversationId, currentUserId, peerId);
      open(peerId, peerName, conversationId, {
        roomId: rid,
        peerImage: peerImage ?? null,
      });
    },
    [open, conversationId, currentUserId]
  );

  const allMessages = useChatStore((s) => s.messages);
  const messages = React.useMemo(
    () => allMessages[conversationId] ?? [],
    [allMessages, conversationId]
  );
  const setMessages = useChatStore((s) => s.setMessages);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const pollsByMessageId = useChatStore((s) => s.pollsByMessageId);
  const upsertPoll = useChatStore((s) => s.upsertPoll);
  const applyPollState = useChatStore((s) => s.applyPollState);
  const setMyVote = useChatStore((s) => s.setMyVote);

  const { online, typing } = useConversationRealtime(conversationId, {
    id: String(currentUserId),
    name: currentUserName,
    image: currentUserImage,
  });

  const [readers, setReaders] = useState<
    { userId: string; lastReadAt: string }[]
  >([]);
  const chRef = useRef<any>(null);

  const lastReadSentAtRef = useRef(0);
  const markRead = useCallback((convId: string) => {
    const now = Date.now();
    if (now - lastReadSentAtRef.current < 1500) return;
    lastReadSentAtRef.current = now;
    fetch(`/api/conversations/${encodeURIComponent(convId)}/read`, {
      method: "POST",
    }).catch(() => {});
  }, []);

  const lastMsg = messages[messages.length - 1];

  const othersTypingIds = React.useMemo(
    () =>
      Object.keys(typing || {}).filter((uid) => uid !== String(currentUserId)),
    [typing, currentUserId]
  );

  const getTypingName = useCallback(
    (uid: string) => {
      const nameFromTyping = (typing as any)?.[uid]?.name;
      if (nameFromTyping && nameFromTyping.trim()) return nameFromTyping;
      const nameFromOnline = (online as any)?.[uid]?.name;
      if (nameFromOnline && nameFromOnline.trim()) return nameFromOnline;
      const msg = messages.find((mm) => String(mm.senderId) === String(uid));
      const nameFromMsg = msg?.sender?.name;
      if (nameFromMsg && nameFromMsg.trim()) return nameFromMsg;
      return "Someone";
    },
    [typing, online, messages]
  );
  // ↓ anchor & state
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showScrollDownDelayed, setShowScrollDownDelayed] = useState(false);

  // fade-in delay
  useEffect(() => {
    let t: any;
    if (showScrollDown) {
      t = setTimeout(() => setShowScrollDownDelayed(true), 500);
    } else {
      setShowScrollDownDelayed(false);
    }
    return () => t && clearTimeout(t);
  }, [showScrollDown]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, []);

  // Find nearest scroll container for [data-chat-root] (or fall back to window)
  function getScrollContainer(node: HTMLElement | null): HTMLElement | null {
    let n: HTMLElement | null = node;
    while (n) {
      const style = getComputedStyle(n);
      const oy = style.overflowY;
      if (oy === "auto" || oy === "scroll") return n;
      n = n.parentElement;
    }
    return null;
  }
  // IntersectionObserver on the bottom anchor, but with the right root
  useEffect(() => {
    const sentinel = bottomRef.current;
    if (!sentinel) return;

    const rootEl = document.querySelector(
      "[data-chat-root]"
    ) as HTMLElement | null;
    const scroller = getScrollContainer(rootEl) || null;

    const io = new IntersectionObserver(
      (entries) => {
        const inView = entries.some((e) => e.isIntersecting);
        setShowScrollDown(!inView);
      },
      {
        root: scroller, // if null, uses viewport
        threshold: 0.01,
        rootMargin: "0px 0px -15% 0px", // treat “near bottom” as visible
      }
    );

    io.observe(sentinel);
    return () => io.disconnect();
  }, [messages.length]); // rerun when list size changes

  // Scroll/resize fallback for environments where IO is finicky
  useEffect(() => {
    const rootEl = document.querySelector(
      "[data-chat-root]"
    ) as HTMLElement | null;
    const scroller = getScrollContainer(rootEl);
    const target: any = scroller || window;

    const getMetrics = () => {
      if (scroller) {
        const gap =
          scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop;
        setShowScrollDown(gap > 160);
      } else {
        const doc = document.scrollingElement || document.documentElement;
        const gap = doc.scrollHeight - doc.clientHeight - doc.scrollTop;
        setShowScrollDown(gap > 160);
      }
    };

    getMetrics();
    target.addEventListener("scroll", getMetrics, { passive: true });
    window.addEventListener("resize", getMetrics);
    return () => {
      target.removeEventListener("scroll", getMetrics);
      window.removeEventListener("resize", getMetrics);
    };
  }, [messages.length]);
  const appendRef = useRef(appendMessage);
  useEffect(() => {
    appendRef.current = appendMessage;
  }, [appendMessage]);

  const markAsRedacted = useCallback(
    (mid: string) => {
      const list = useChatStore.getState().messages[conversationId] ?? [];
      setMessages(
        conversationId,
        list.map((row) =>
          String(row.id) === String(mid)
            ? {
                ...row,
                isRedacted: true,
                is_redacted: true,
                text: null,
                attachments: [],
                facets: [],
              }
            : row
        )
      );
    },
    [conversationId, setMessages]
  );

  const handleDelete = useCallback(
    async (mid: string) => {
      markAsRedacted(mid);
      try {
        const res = await fetch(
          `/api/messages/item/${encodeURIComponent(mid)}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error(await res.text());
      } catch (e) {
        console.warn("[delete] failed; consider refetch or revert", e);
      }
    },
    [markAsRedacted]
  );

  const initRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);
  const driftsListHydratedRef = useRef(false);

  useEffect(() => {
    if (initRef.current === conversationId) return;
    setMessages(conversationId, initialMessages);
    initRef.current = conversationId;
  }, [conversationId, setMessages, initialMessages]);

  useEffect(() => {
    if (hydratedRef.current) return;
    const list = allMessages[conversationId] ?? [];
    if (!list.length) return;
    hydratedRef.current = true;
    const ids = list.map((m) => m.id);

    fetch("/api/polls/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageIds: ids }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.items)) {
          data.items.forEach((it: any) => upsertPoll(it.poll, it.state, it.my));
        }
      })
      .catch((e) => console.warn("[polls] hydrate failed:", e));
  }, [allMessages, conversationId, upsertPoll]);

  const reactionsHydratedKeyRef = useRef<string>("");
  useEffect(() => {
    if (!ENABLE_REACTIONS) return;
    const idsKey = messages.map((m) => m.id).join(",");
    if (!idsKey || idsKey === reactionsHydratedKeyRef.current) return;
    reactionsHydratedKeyRef.current = idsKey;

    const setReactionsNow = useChatStore.getState().setReactions;
    fetch(
      `/api/reactions?userId=${encodeURIComponent(
        currentUserId
      )}&messageIds=${encodeURIComponent(idsKey)}`,
      { cache: "no-store" }
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.items) return;
        data.items.forEach((row: { messageId: string; reactions: any[] }) => {
          setReactionsNow(row.messageId, row.reactions);
        });
      })
      .catch((e) => console.warn("[reactions] hydrate failed:", e));
  }, [messages, currentUserId]);

  const hydratedAnchorIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const unseen = messages
      .filter((m) => (m as any).meta?.kind === "DRIFT_ANCHOR")
      .map((m) => m.id)
      .filter(
        (id) => !driftsByAnchorId[id] && !hydratedAnchorIdsRef.current.has(id)
      );

    if (unseen.length === 0) return;

    unseen.forEach((id) => hydratedAnchorIdsRef.current.add(id));

    fetch("/api/drifts/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anchorMessageIds: unseen }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.ok || !Array.isArray(data.items)) return;
        setDrifts(
          data.items.map((it: any) => ({ drift: it.drift, my: it.my }))
        );
      })
      .catch((e) => console.warn("[drifts] hydrate failed:", e));
  }, [messages, driftsByAnchorId, setDrifts]);

  useEffect(() => {
    if (driftsListHydratedRef.current) return;
    driftsListHydratedRef.current = true;

    fetch(
      `/api/drifts/list?conversationId=${encodeURIComponent(conversationId)}`,
      { cache: "no-store" }
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.ok || !Array.isArray(data.items)) return;
        setDrifts(
          data.items.map((it: any) => ({ drift: it.drift, my: it.my }))
        );
      })
      .catch((e) => console.warn("[drifts] list hydrate failed:", e));
  }, [conversationId, setDrifts]);

  // 👉 Debug effect: log drifts after reload
  useEffect(() => {
    fetch(
      `/api/drifts/list?conversationId=${encodeURIComponent(conversationId)}`,
      { cache: "no-store" }
    )
      .then((r) => r.json())
      .then((d) =>
        console.log(
          "[drifts/list]",
          d.items.map((x: any) => x.drift)
        )
      )
      .catch((e) => console.warn("[drifts/list] debug failed:", e));
  }, [conversationId]);

  useEffect(() => {
    const root = document.querySelector("[data-chat-root]");
    if (!root) return;

    const nodes = root.querySelectorAll("[data-msg-id]");
    const last = nodes[nodes.length - 1] as HTMLElement | null;
    if (!last) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && document.visibilityState === "visible") {
            markRead(conversationId);
          }
        }
      },
      { root: null, threshold: 0.8 }
    );

    io.observe(last);
    return () => io.disconnect();
  }, [conversationId, messages.length, markRead]);

  useEffect(() => {
    const onFocus = () => markRead(conversationId);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [conversationId, markRead]);

  useEffect(() => {
    if (!lastMsg) return;
    fetch(`/api/conversations/${encodeURIComponent(conversationId)}/readers`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.items) setReaders(data.items);
      })
      .catch(() => {});
  }, [conversationId, lastMsg?.id]);

  // Keep a ref mirror of openDrifts for handlers
  const openDriftsRef = useRef(openDrifts);
  useEffect(() => {
    openDriftsRef.current = openDrifts;
  }, [openDrifts]);

  // Helper: unwrap payloads sometimes wrapped as { payload: {...} }
  function unwrap<T extends object>(raw: any): any {
    if (!raw) return null;
    if (typeof raw === "object" && ("poll" in raw || "pollId" in raw))
      return raw;
    if (typeof raw === "object" && "payload" in raw)
      return (raw as any).payload;
    return raw;
  }

  // === REALTIME CHANNEL EFFECT ===
  useEffect(() => {
    const topic = `conversation-${conversationId}`;
    const channel = supabase.channel(topic, {
      config: { broadcast: { self: true } },
    });
    chRef.current = channel;

    const msgHandler = ({ payload }: any) => {
      const mid = String(payload?.id ?? payload?.message?.id ?? "");
      const payloadDriftId = String(
        payload?.driftId ?? payload?.message?.driftId ?? ""
      );
      const from = String(
        payload?.senderId ?? payload?.message?.senderId ?? ""
      );
      console.log("[rt] new_message payload", { mid, payloadDriftId, from });
      if (!mid) {
        appendRef.current(conversationId, payload as any);
        return;
      }

      fetch(
        `/api/sheaf/messages?userId=${encodeURIComponent(
          currentUserId
        )}&messageId=${encodeURIComponent(mid)}`
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          const hydrated = data?.messages?.[0] ?? data?.message ?? null;
          const hydratedDriftId = hydrated?.driftId
            ? String(hydrated.driftId)
            : "";
          const driftKey = hydratedDriftId || payloadDriftId || "";
          console.log("[rt] hydrated", mid, {
            hydratedDriftId,
            payloadDriftId,
          });
          if (hydrated) {
            if (driftKey) appendDriftMessage(driftKey, hydrated);
            else appendRef.current(conversationId, hydrated);
            return;
          }
          if (payloadDriftId) {
            appendDriftMessage(payloadDriftId, {
              id: mid,
              text: payload?.text ?? null,
              createdAt: payload?.createdAt ?? new Date().toISOString(),
              senderId: from,
              driftId: payloadDriftId,
              sender: payload?.sender ?? undefined,
              attachments: Array.isArray(payload?.attachments)
                ? payload.attachments
                : [],
            });
          } else {
            appendRef.current(conversationId, payload as any);
          }
        })
        .catch(() => {
          if (payloadDriftId) {
            appendDriftMessage(payloadDriftId, {
              id: mid,
              text: payload?.text ?? null,
              createdAt: payload?.createdAt ?? new Date().toISOString(),
              senderId: from,
              driftId: payloadDriftId,
              sender: payload?.sender ?? undefined,
              attachments: Array.isArray(payload?.attachments)
                ? payload.attachments
                : [],
            });
          } else {
            appendRef.current(conversationId, payload as any);
          }
        });
    };

    const linkPreviewHandler = async ({ payload }: any) => {
      const mid = String(payload?.messageId ?? "");
      if (!mid) return;
      try {
        const r = await fetch(
          `/api/sheaf/messages?userId=${encodeURIComponent(
            currentUserId
          )}&messageId=${encodeURIComponent(mid)}`,
          { cache: "no-store" }
        );
        const data = await r.json();
        const hydrated = data?.messages?.[0] ?? data?.message ?? null;
        if (!hydrated) return;

        // Replace where it lives (main or drift) — requires store helper
        useChatStore
          .getState()
          .replaceMessageInConversation(conversationId, hydrated);
      } catch {}
    };

    const pollCreateHandler = ({ payload }: any) => {
      const data = unwrap(payload);
      if (!data?.poll) {
        console.warn("[polls] poll_create missing poll:", payload);
        return;
      }
      upsertPoll(data.poll, data.state ?? null, data.my ?? null);
    };

    const pollStateHandler = ({ payload }: any) => {
      const data = unwrap(payload);
      if (!data) return;
      applyPollState(data as PollStateDTO);
    };

    const applyReactionDeltaNow = (
      messageId: string,
      emoji: string,
      op: "add" | "remove",
      byMe: boolean
    ) => useChatStore.getState().applyReactionDelta(messageId, emoji, op, byMe);

    const reactionAdd = ({ payload }: any) => {
      const { messageId, emoji, userId } = payload || {};
      if (!messageId || !emoji) return;
      applyReactionDeltaNow(
        messageId,
        emoji,
        "add",
        String(userId) === String(currentUserId)
      );
    };

    const reactionRemove = ({ payload }: any) => {
      const { messageId, emoji, userId } = payload || {};
      if (!messageId || !emoji) return;
      applyReactionDeltaNow(
        messageId,
        emoji,
        "remove",
        String(userId) === String(currentUserId)
      );
    };

    const driftCreateHandler = ({ payload }: any) => {
      const { anchor, drift } = payload || {};
      if (!drift) return;
      if (anchor) appendRef.current(conversationId, anchor); // only classic drifts have anchors
      setDrifts([
        {
          drift,
          my: {
            collapsed: true,
            pinned: false,
            muted: false,
            lastReadAt: null,
          },
        },
      ]);
    };

    const driftCountersHandler = ({ payload }: any) => {
      const { driftId, messageCount, lastMessageAt } = payload || {};
      if (!driftId) return;
      useChatStore
        .getState()
        .updateDriftCounters?.(driftId, { messageCount, lastMessageAt });

      const have = (useChatStore.getState().driftMessages[driftId] ?? [])
        .length;
      const paneOpen = !!openDriftsRef.current?.[driftId];

      if (paneOpen || have < (messageCount ?? 0)) {
        fetch(
          `/api/drifts/${encodeURIComponent(
            driftId
          )}/messages?userId=${encodeURIComponent(currentUserId)}`,
          { cache: "no-store" }
        )
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (Array.isArray(d?.messages)) {
              useChatStore.getState().setDriftMessages(driftId, d.messages);
            }
          })
          .catch(() => {});
      }
    };

 

    const redactedHandler = ({ payload }: any) => {
      const mid = String(payload?.id ?? payload?.messageId ?? "");
      if (!mid) return;
      markAsRedacted(mid);
    };

    const readHandler = ({ payload }: any) => {
      const { userId, ts } = payload || {};
      if (!userId || !ts) return;
      setReaders((prev) => {
        const i = prev.findIndex((p) => p.userId === String(userId));
        if (i >= 0) {
          const next = prev.slice();
          next[i] = { userId: String(userId), lastReadAt: ts };
          return next;
        }
        return [...prev, { userId: String(userId), lastReadAt: ts }];
      });
    };


         // --- Refresh merged message   invalidate SWR keys on merge ---
         const proposalMergeHandler = ({ payload }: any) => {
           const rootId = String(payload?.rootMessageId ?? payload?.messageId ?? "");
           const versionHash = String(payload?.versionHash ?? "");
           if (!rootId) return;
     
           fetch(
             `/api/sheaf/messages?userId=${encodeURIComponent(
               currentUserId
             )}&messageId=${encodeURIComponent(rootId)}`,
             { cache: "no-store" }
           )
             .then((r) => (r.ok ? r.json() : null))
             .then((data) => {
               const hydrated = data?.messages?.[0] ?? data?.message ?? null;
               if (hydrated) {
                 useChatStore
                   .getState()
                   .replaceMessageInConversation(conversationId, hydrated);
               }
             })
             .catch(() => {});
     
           // SWR invalidations: receipts chip   candidates   counts
           swrMutate(`/api/messages/${encodeURIComponent(rootId)}/receipts?latest=1`);
           swrMutate(`/api/proposals/candidates?rootMessageId=${encodeURIComponent(rootId)}`);
           swrMutate(`/api/proposals/list?rootMessageId=${encodeURIComponent(rootId)}`);
     
           console.log("[rt] proposal_merge received", { rootId, versionHash });
         };
     
         // --- Refresh proposal counts/candidates when someone approves/blocks ---
         const proposalSignalHandler = ({ payload }: any) => {
           const rootId = String(payload?.rootMessageId ?? "");
           if (!rootId) return;
           swrMutate(`/api/proposals/list?rootMessageId=${encodeURIComponent(rootId)}`);
           swrMutate(`/api/proposals/candidates?rootMessageId=${encodeURIComponent(rootId)}`);
           console.log("[rt] proposal_signal refresh", { rootId, facetId: payload?.facetId, kind: payload?.kind });
        };


    channel.on("broadcast", { event: "new_message" }, msgHandler);
    channel.on(
      "broadcast",
      { event: "link_preview_update" },
      linkPreviewHandler
    );
    channel.on("broadcast", { event: "poll_create" }, pollCreateHandler);
    channel.on("broadcast", { event: "poll_state" }, pollStateHandler);
    channel.on("broadcast", { event: "drift_create" }, driftCreateHandler);
    channel.on("broadcast", { event: "drift_counters" }, driftCountersHandler);
    channel.on("broadcast", { event: "message_redacted" }, redactedHandler);
    channel.on("broadcast", { event: "read" }, readHandler);
    channel.on("broadcast", { event: "proposal_merge" }, proposalMergeHandler); // ← added
    channel.on("broadcast", { event: "proposal_signal" }, proposalSignalHandler);


    let pingTimer: any = null;
    channel.on("broadcast", { event: "debug_ping" }, () => {});
    console.log(`[rt:${topic}] subscribing`);
    channel.subscribe((status) => {
      console.log(`[rt:${topic}] status`, status);
      if (status === "SUBSCRIBED") {
        channel.send({
          type: "broadcast",
          event: "debug_ping",
          payload: { from: "ChatRoom", at: Date.now() },
        });
        pingTimer = setInterval(() => {
          channel.send({
            type: "broadcast",
            event: "debug_ping",
            payload: { from: "ChatRoom/heartbeat", at: Date.now() },
          });
        }, 15000);
      }
    });

    return () => {
      console.log(`[rt:${topic}] cleanup`);
      if (pingTimer) clearInterval(pingTimer);
      chRef.current = null;
      try {
        channel.unsubscribe?.();
      } catch {}
      supabase.removeChannel?.(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, currentUserId]);

  // Voting handlers
  const onCreateOptions = useCallback((_m: Message) => {}, []);
  const onCreateTemp = useCallback(async (_m: Message) => {}, []);

  const onVote = useCallback(
    async (poll: PollUI, body: any) => {
      const { state } = await fetch(`/api/polls/${poll.poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: poll.kind, ...body }),
      }).then((r) => r.json());
      applyPollState(state);
      if (poll.kind === "OPTIONS") {
        setMyVote({
          kind: "OPTIONS",
          pollId: poll.poll.id,
          optionIdx: body.optionIdx,
        });
      } else {
        setMyVote({ kind: "TEMP", pollId: poll.poll.id, value: body.value });
      }
      chRef.current?.send({
        type: "broadcast",
        event: "poll_state",
        payload: state,
      });
    },
    [applyPollState, setMyVote, conversationId]
  );

  // Ensure thread drift and open its pane
  const ensureAndOpenThread = useCallback(
    async (rootMessageId: string) => {
      const have = useChatStore.getState().driftsByRootMessageId[rootMessageId];
      if (have?.drift?.id) {
        setOpenDrifts((prev) => ({ ...prev, [have.drift.id]: true }));
        return;
      }
      const r = await fetch("/api/threads/ensure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rootMessageId }),
      });
      const data = await r.json();
      if (!r.ok || !data?.drift) {
        console.warn("[thread] ensure failed:", data);
        alert(data?.error ?? "Failed to start thread");
        return;
      }
      upsertDrift({
        drift: data.drift,
        my: { collapsed: false, pinned: false, muted: false, lastReadAt: null },
      });
      setOpenDrifts((prev) => ({ ...prev, [data.drift.id]: true }));
    },
    [upsertDrift]
  );

  // Proposals: ensure and open
  const ensureAndOpenProposal = useCallback(
    async (rootMessageId: string) => {
      try {
        const r = await fetch("/api/proposals/ensure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rootMessageId }),
        });
        // Parse JSON safely even on non-2xx
        const raw = await r.text();
        let data: any = null;
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch {}
        if (!r.ok || !data?.drift?.id) {
          console.warn("[proposal/ensure] server said:", raw);
          alert(data?.error || raw || "Failed to start proposal");
          return;
        }
        // Place into store with all required fields so UI can render immediately
        upsertDrift({
          drift: {
            id: data.drift.id,
            conversationId: data.drift.conversationId ?? String(conversationId),
            title: data.drift.title || "Proposal",
            isClosed: Boolean(data.drift.isClosed),
            isArchived: Boolean(data.drift.isArchived),
            messageCount: Number(data.drift.messageCount ?? 0),
            lastMessageAt: data.drift.lastMessageAt ?? null,
            // IMPORTANT: proposals are rooted, not anchored
            rootMessageId: data.drift.rootMessageId ?? rootMessageId,
            // Force them down the thread rendering path; variant will relabel it as a proposal
            kind: "THREAD",
            // DO NOT set anchorMessageId here
          },
          my: {
            collapsed: false,
            pinned: false,
            muted: false,
            lastReadAt: null,
          },
        });

        setOpenDrifts((prev) => ({ ...prev, [data.drift.id]: true }));
      } catch (e) {
        console.warn("[proposal] ensure failed", e);
      }
    },
    [upsertDrift, conversationId]
  );

  const onCompareProposals = useCallback((rootMessageId: string) => {
    setCompareFor(rootMessageId);
  }, []);

  const onMergeProposal = useCallback((rootMessageId: string) => {
    // Open the compare modal; merging is actioned from there (choosing a proposal)
    setCompareFor(rootMessageId);
  }, []);

  useEffect(() => {
    if (!highlightMessageId) return;
    const el = document.querySelector(
      `[data-msg-id="${highlightMessageId}"]`
    ) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.classList.add("ring-2", "ring-indigo-400", "ring-offset-2");
      setTimeout(
        () => el.classList.remove("ring-2", "ring-indigo-400", "ring-offset-2"),
        2000
      );
    }
  }, [highlightMessageId, messages.length]);

  return (
    <div className="space-y-3" data-chat-root>
      <ProposalsCompareModal
        open={!!compareFor}
        onClose={() => setCompareFor(null)}
        rootMessageId={String(compareFor || "")}
        conversationId={String(conversationId)}
                currentUserId={currentUserId}
        onOpenDrift={(driftId) =>
          setOpenDrifts((prev) => ({ ...prev, [driftId]: true }))
        }
        onMerged={() => {
          // Optionally: refresh the root message; your existing hydration often handles it.
        }}
      />
      {messages.map((m) => {
        const isMine = String(m.senderId) === String(currentUserId);
        const panes = Object.values(state.panes);
        const anchored = panes.find(
          (p) => p.anchor?.messageId === m.id && p.peerId === String(m.senderId)
        );
        const driftEntry = driftsByAnchorId[m.id];
        const isDriftAnchor =
          !!driftEntry && driftEntry.drift.kind !== "THREAD"; // hide chip for threads
        const threadEntry = driftsByRoot[m.id];

        const isProposal =
          !!threadEntry?.drift?.title &&
          threadEntry.drift.title.toLowerCase().startsWith("proposal:");

        return (
          <div key={m.id} className="space-y-2" data-msg-id={m.id}>
            {!isDriftAnchor && (
              <MessageRow
                m={m}
                currentUserId={currentUserId}
                conversationId={conversationId}
                onOpen={handleOpen}
                onPrivateReply={() => {}}
                onCreateOptions={onCreateOptions}
                onCreateTemp={onCreateTemp}
                onReplyInThread={ensureAndOpenThread}
                onProposeAlternative={ensureAndOpenProposal}
                onCompareProposals={onCompareProposals}
                onMergeProposal={onMergeProposal}
                onDelete={handleDelete}
              />
            )}

            {/* {!isDriftAnchor &&
            !(m as any).isRedacted &&
            m.attachments?.length ? (
              <div
                className={[
                  "mt-1 flex flex-col gap-2 px-3",
                  isMine ? "items-end" : "items-start",
                ].join(" ")}
              >
                {m.attachments.map((a) => (
                  <Attachment key={a.id} a={a as any} />
                ))}
              </div>
            ) : null} */}

            {/* Attachments (outside bubble) */}
            {!isDriftAnchor &&
            !(m as any).isRedacted &&
            m.attachments?.length ? (
              <div
                className={[
                  "mt-1 flex flex-col gap-2 px-3",
                  isMine ? "items-end" : "items-start",
                ].join(" ")}
              >
                {m.attachments.map((a) => (
                  <Attachment key={a.id} a={a as any} />
                ))}
              </div>
            ) : null}

            {/* Quotes */}
            {Array.isArray((m as any).quotes) &&
              (m as any).quotes.length > 0 &&
              (() => {
                const q0 = (m as any).quotes[0];
                const textRaw =
                  typeof q0?.body === "string"
                    ? q0.body
                    : q0?.body
                    ? textFromTipTap(q0.body)
                    : "";
                const inlineLabel =
                  q0?.sourceAuthor?.name || toSnippet(textRaw, 48);
                return (
                  <div
                    className={[
                      "px-3 mt-1 flex",
                      isMine ? "justify-end" : "justify-start",
                    ].join(" ")}
                  >
                    <div className="max-w-[60%]">
                      <div className="text-slate-500 flex  items-center gap-1">
                        <span className="flex mr-1 h-2 w-2 mb-1 justify-center items-center align-center  rounded-full bg-slate-600" />
                        <span className="text-[.75rem] align-center  my-auto">
                          Replying to&nbsp;{inlineLabel}
                        </span>
                      </div>
                      <div
                        className={[
                          "mt-1 h-fit  pl-3 border-l-[1px]",
                          isMine
                            ? "border-rose-400 ml-1"
                            : "border-indigo-400 mx-1",
                        ].join(" ")}
                      >
                        {(m as any).quotes.map((q: any, i: number) => (
                          <QuoteBlock key={`${m.id}-q-${i}`} q={q} compact />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* Plain message link previews */}
            {!Array.isArray((m as any).facets) &&
              Array.isArray((m as any).linkPreviews) &&
              (m as any).linkPreviews.length > 0 && (
                <div
                  className={[
                    "mt-2 flex flex-col gap-2 px-3",
                    isMine ? "items-end" : "items-start",
                  ].join(" ")}
                >
                  {(m as any).linkPreviews.slice(0, 3).map((p: any) => (
                    <LinkCard key={p.urlHash} p={p} />
                  ))}
                </div>
              )}

            {/* Sheaf (default facet) link previews */}
            {Array.isArray((m as any).facets) &&
              (m as any).facets.length > 0 &&
              (() => {
                const defId =
                  (m as any).defaultFacetId ?? (m as any).facets[0]?.id;
                const def =
                  (m as any).facets.find((f: any) => f.id === defId) ??
                  (m as any).facets[0];
                if (!def?.linkPreviews?.length) return null;
                return (
                  <div
                    className={[
                      "mt-2 flex flex-col gap-2 px-3",
                      isMine ? "items-end" : "items-start",
                    ].join(" ")}
                  >
                    {def.linkPreviews.slice(0, 3).map((p: any) => (
                      <LinkCard key={p.urlHash} p={p} />
                    ))}
                  </div>
                );
              })()}

            {/* Poll chip */}
            {pollsByMessageId[m.id] && (
              <PollChip
                poll={pollsByMessageId[m.id]}
                onVote={(body) => onVote(pollsByMessageId[m.id], body)}
              />
            )}
            <MergeHistorySummary
  messageId={String(m.id)}
  isMine={isMine}
  edited={Boolean((m as any).edited)}
/>


            <ThreadSummary
              threadEntry={threadEntry}
              messageId={m.id}
              isMine={isMine}
              onOpen={(driftId) =>
                setOpenDrifts((prev) => ({ ...prev, [driftId]: true }))
              }
            />
            {/* Classic Drift anchor chip + pane */}
            {isDriftAnchor && driftEntry && (
              <>
                <DriftChip
                  title={driftEntry.drift.title}
                  count={driftEntry.drift.messageCount}
                  onOpen={() => openDrift(driftEntry.drift.id)}
                />
                {openDrifts[driftEntry.drift.id] && (
                  <>
                    <hr />
                    <DriftPane
                      key={driftEntry.drift.id}
                      drift={{
                        id: driftEntry.drift.id,
                        title: driftEntry.drift.title,
                        isClosed: driftEntry.drift.isClosed,
                        isArchived: driftEntry.drift.isArchived,
                      }}
                      conversationId={String(conversationId)}
                      currentUserId={currentUserId}
                      onClose={() => closeDrift(driftEntry.drift.id)}
                    />
                  </>
                )}
              </>
            )}

            {threadEntry && openDrifts[threadEntry.drift.id] && (
              <>
                <hr />
                <DriftPane
                  key={threadEntry.drift.id}
                  drift={{
                    id: threadEntry.drift.id,
                    title:
                      threadEntry.drift.title ||
                      (isProposal ? "Proposal" : "Thread"),
                    isClosed: threadEntry.drift.isClosed,
                    isArchived: threadEntry.drift.isArchived,
                  }}
                  conversationId={String(conversationId)}
                  currentUserId={currentUserId}
                  variant={isProposal ? "proposal" : "thread"} // 👈 show the 🪄 header
                  align={isMine ? "end" : "start"} // right for my root, left for others
                  onClose={() =>
                    setOpenDrifts((prev) => ({
                      ...prev,
                      [threadEntry.drift.id]: false,
                    }))
                  }
                />
              </>
            )}
            <div ref={bottomRef} data-bottom-anchor />
          </div>
        );
      })}
      {showScrollDownDelayed && (
        <button
          type="button"
          onClick={scrollToBottom}
          className={[
            "fixed z-[70]  bottom-32", // position
            "h-10 w-10 rounded-full shadow-md ", // shape
            "bg-white/50 backdrop-blur-sm likebutton", // look
            "flex items-center justify-center", // center icon
            "transition-transform hover:translate-y-[1px]", // tiny nudge
          ].join(" ")}
          title="Scroll to composer"
          aria-label="Scroll to composer"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 4v14m0 0l-6-6m6 6l6-6"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      {othersTypingIds.length > 0 && (
        <div className="px-3 text-[12px] text-slate-500 italic">
          {othersTypingIds.length === 1
            ? `${getTypingName(othersTypingIds[0])} is typing…`
            : "Several people are typing…"}
        </div>
      )}
    </div>
  );
}

-ConversationList.tsx: import Image from "next/image";
import Link from "next/link";

interface Participant {
  id: string;
  name: string;
  image: string | null;
}

interface Conversation {
  id: string;
  isGroup: boolean;
  title?: string | null;
  participants: Participant[];
  lastMessage?: string | null;
}

interface Props {
  conversations: Conversation[];
  currentUserId: string;
}

function GroupAvatar({ participants }: { participants: Participant[] }) {
  const imgs = participants.slice(0, 1);
  return (
    // <div className="grid grid-cols-2 grid-rows-2 w-[3.1rem] h-[3.1rem] rounded-full overflow-hidden profile-shadow">
    <>
    {imgs.map((p) => (
        <Image
          key={p.id}
          src={ p.image|| "/assets/user-helsinki.svg"}
          alt={p.name}
          width={54}
          height={54}
                className="object-cover flex-1 border-[.05rem] rounded-full border-indigo-300 profile-shadow "
          />
      ))}
    </>
  );
}

export default function ConversationList({
  conversations,
  currentUserId,
}: Props) {
  return (
    <div className="flex flex-1 gap-4 mt-6 ">
    <ul className="flex flex-wrap gap-5 h-fit w-fit ">
      {conversations.map((c) => {
        const last = c.lastMessage;
        if (c.isGroup) {
          const title =
            c.title ||
            c.participants
              .map((p) => p.name)
              .slice(0, 3)
              .join(", ");
          return (
            <li
            key={c.id}
            className="flex flex-1 flex-wrap w-fit sheaf-bubble bg-white/20 items-center gap-3  px-1 py-1 rounded-xl "
              >
                <hr className="w-full  border-[1px] border-transparent"></hr>
                <div className="flex w-full h-full align-center px-2 gap-2 ml-2">
                <button className="flex w-[3.7rem] h-[3.7rem]  border-2 border-transparent">

              <GroupAvatar participants={c.participants} />
              </button>
              <button className="flex text-start h-full align-center border-2 border-transparent ml-2">

              <Link href={`/messages/${c.id}`} className="flex flex-col align-center  flex-1 py-1 ">
                <p className="font-bold tracking-wider text-[1.1rem] whitespace-nowrap hover:underline hover:underline-offset-4">{title}</p>
                {last && (
                  <p className="text-[1rem] tracking-wide text-gray-700 truncate max-w-xs">{last}</p>
                )}
              </Link>
              </button>

</div>
<hr className="w-full  border-[1px] border-transparent"></hr>
</li>
          );
        }
        const other = c.participants.find((p) => p.id !== currentUserId);
        if (!other) return null;
        return (
          <li
            key={c.id}
            className="flex flex-1 flex-wrap w-fit sheaf-bubble bg-white/20 items-center gap-3  px-1 py-1 rounded-xl "
            >            <hr className="w-full  border-[1px] border-transparent"></hr>

                          <div className="flex w-full h-full align-center px-2 gap-2 ml-2">
            <button className="flex w-[3.7rem] h-[3.7rem]  border-2 border-transparent ">
            {/* <div className="flex h-[3.1rem] w-[3.1rem]"> */}
              <Image
                src={other.image || "/assets/user-helsinki.svg"}
                alt={other.name}
                width={54}
                height={54}
                className="object-cover flex-1 border-[.05rem] rounded-full border-indigo-300 profile-shadow "
              />
            
            {/* </div> */}
            </button>
            <button className="flex flex-1 text-start w-full h-full align-center border-2 border-transparent ml-2">

            <Link href={`/messages/${c.id}`} className="flex flex-col align-center  flex-1 py-1 ">
            
              <p className="font-bold tracking-wider text-[1.1rem] whitespace-nowrap hover:underline hover:underline-offset-4">{other.name}</p>
              {last && (
                <p className="text-[1rem] tracking-wide text-gray-700 truncate max-w-[10rem]">{last}</p>
              )}
            </Link>
            </button>

            </div>
            <hr className="w-full  border-[1px] border-transparent"></hr>

          </li>
        );
      })}
    </ul>
    </div>
  );
}

-ConversationView.tsx: "use client";

import React from "react";
import ChatRoom from "@/components/chat/ChatRoom";
import MessageComposer from "@/components/chat/MessageComposer";
import MessengerPane from "@/components/chat/MessengerPane";

type QuoteRef = { messageId: string; facetId?: string };

export default function ConversationView({
  conversationId,
  currentUserId,
  initialMessages,
  highlightMessageId,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: any[];
  highlightMessageId?: string | null;
}) {
  const [quoteRef, setQuoteRef] = React.useState<QuoteRef | undefined>(undefined);

  // Optional: expose a handler to ChatRoom so message actions can set quote
  const handleQuote = React.useCallback((qr: QuoteRef) => setQuoteRef(qr), []);

  return (
    <div className="mt-6 space-y-6">
      <ChatRoom
        conversationId={conversationId}
        currentUserId={currentUserId}
        initialMessages={initialMessages}
        highlightMessageId={highlightMessageId ?? null}
        // onQuote={handleQuote} // ← add this prop in ChatRoom to trigger quoting from a message menu
      />
      <hr />
      {/* Show quote pill if present */}
      {quoteRef && (
        <div className="mx-auto max-w-[720px] text-xs text-slate-600 flex items-center gap-2 px-2">
          <span>Quoting #{quoteRef.messageId}{quoteRef.facetId ? ` · facet ${quoteRef.facetId}` : ""}</span>
          <button
            className="ml-2 px-2 py-1 border rounded bg-white hover:bg-slate-50"
            onClick={() => setQuoteRef(undefined)}
          >
            Clear
          </button>
        </div>
      )}
      
      <MessageComposer
        conversationId={conversationId}
        currentUserId={currentUserId}
        quoteRef={quoteRef}
        // driftId can be provided if you mount a composer in a drift pane
      />
      <MessengerPane currentUserId={currentUserId} />
    </div>
  );
}

-DriftChip.tsx: "use client";
import React from "react";

export function DriftChip({
  title,
  count,
  onOpen,
}: {
  title: string;
  count: number;
  onOpen?: () => void;
}) {
  return (
    <div className="mx-auto mt-4 rounded-xl border-[.1rem] border-[#D1C6E7] min-w-[25%] max-w-[30%]">
      <button
        type="button"
        onClick={onOpen}
        className="w-full justify-center items-center text-center text-[0.9rem] py-3 px-3 rounded-xl
        bg-white/40 driftbutton [data-effects='off']:backdrop-blur-0 [data-effects='off']:bg-white/45"
        title="Open drift"
      >
        𒈝<span className="ml-2 font-medium">{title}</span>
        <span className="ml-2 text-slate-500">· {count} message{count === 1 ? "" : "s"}</span>
      </button>
    </div>
  );
}

-DriftPane.tsx: "use client";

import * as React from "react";
import Image from "next/image";
import { ChatMessage, ChatMessageContent, ChatMessageAvatar } from "@/components/ui/chat-message";
import { SheafMessageBubble } from "@/components/sheaf/SheafMessageBubble";
import { useChatStore } from "@/contexts/useChatStore";
import MessageComposer from "@/components/chat/MessageComposer";


function Attachment({ a }: { a: { id: string; path: string; type: string; size: number } }) {
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/messages/attachments/${a.id}/sign`);
        if (r.ok) {
          const { url } = await r.json();
          if (!cancelled) setUrl(url);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [a.id]);
  if (!url) return null;
  if (a.type.startsWith("image/")) {
    return (
      <Image
        src={url}
        alt="attachment"
        width={256}
        height={256}
        className="rounded-md max-h-64 object-cover"
      />
    );
  }
  const name = a.path.split("/").pop();
  return (
    <a href={url} download={name || undefined} className="flex items-center gap-2 text-blue-600 underline">
      <span>📎</span>
      <span>{(a.size / 1024).toFixed(1)} KB</span>
    </a>
  );
}

export function DriftPane({
  drift,
  conversationId,
  currentUserId,
  onClose,
  variant = "drift",          // "drift" | "thread" | "proposal"
  align = "center",           // "start" | "end" | "center"
}: {
  drift: {
    id: string;
    title: string;
    isClosed: boolean;
    isArchived: boolean;
  };
  conversationId: string;
  currentUserId: string;
  onClose: () => void;
  variant?: "drift" | "thread" | "proposal";
  align?: "start" | "end" | "center";
}) {
    const EMPTY: any[] = React.useMemo(() => [], []);
  const msgs = useChatStore(
    React.useCallback((s) => s.driftMessages[drift.id] ?? EMPTY, [drift.id, EMPTY])
  );
    const setDriftMessages = useChatStore((s) => s.setDriftMessages);
    const fetchedForRef = React.useRef<string | null>(null);
    const listRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
      let aborted = false;
      (async () => {
        // 🔎 debug so you can correlate requests in FF vs Chrome
        console.log("[DriftPane] fetch", { driftId: drift.id, as: currentUserId });
    
        const r = await fetch(
          `/api/drifts/${encodeURIComponent(drift.id)}/messages?userId=${encodeURIComponent(
            currentUserId
          )}&_t=${Date.now()}`, // cache buster for FF/proxies
          { cache: "no-store", headers: { "cache-control": "no-store" } }
        );
    
        if (!r.ok) {
          console.warn("[DriftPane] fetch failed", r.status, await r.text().catch(() => ""));
          return;
        }
        const data = await r.json();
        if (!aborted && Array.isArray(data?.messages)) {
          const asc = [...data.messages].sort(
            (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          setDriftMessages(drift.id, asc);
          console.log("[DriftPane] fetched", drift.id, asc.length);
        }
      })().catch((e) => console.warn("[DriftPane] fetch error", e));
    
      return () => { aborted = true; };
      // ⬇️ run on mount/when drift id or viewer changes
    }, [drift.id, currentUserId, setDriftMessages]);


   // Auto-scroll: jump to bottom on open
   React.useEffect(() => {
     const el = listRef.current;
     if (!el) return;
     el.scrollTo({ top: el.scrollHeight });
   }, [drift.id]);
 
   // Auto-scroll: smooth scroll on new message
   React.useEffect(() => {
     const el = listRef.current;
     if (!el) return;
     el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
   }, [msgs.length]);

   // (optional) debug log when msgs update
   React.useEffect(() => {
     console.log("[DriftPane] rows", drift.id, msgs.length);
   }, [drift.id, msgs.length]);


  return (
    <div   className={[
      "my-2 w-full px-3",             // base
      variant === "thread" ? "max-w-[500px]" : "max-w-[690px]",
      align === "start" ? "mr-auto" : align === "end" ? "ml-auto" : "mx-auto",
      "rounded-xl border bg-white/50 backdrop-blur py-2 shadow-sm",
    ].join(" ")}>
      {/* Header */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2">
        <span className="flex tracking-wide ">
            {variant === "proposal" ? "🪄" : "𒈝"} {drift.title}
          </span>
          {drift.isClosed && <span className="ml-1 text-xs rounded bg-slate-200 px-2 py-0.5">closed</span>}
          {drift.isArchived && <span className="ml-1 text-xs rounded bg-slate-200 px-2 py-0.5">archived</span>}
        </div>
        <button onClick={onClose} className="text-xs px-4 py-1 rounded-xl bg-white/50 sendbutton hover:bg-slate-50">
          Close
        </button>
      </div>

      <hr className="my-2 border-slate-400/60 border-[.1px]" />

      {/* Body */}
      {/* <div className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto px-1 py-1"> */}
      <div ref={listRef} className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto px-1 py-1">
        {msgs.map((m: any) => {
          const isMine = String(m.senderId) === String(currentUserId);
          const redacted = !!m.isRedacted;
          return (
            <ChatMessage key={m.id} id={m.id} type={isMine ? "outgoing" : "incoming"} variant="bubble">
              {!isMine && <ChatMessageAvatar imageSrc={m.sender?.image || "/assets/user-helsinki.svg"} />}
              {redacted ? (
                <ChatMessageContent content="(redacted)" className="opacity-70 italic" />
              ) : Array.isArray(m.facets) && m.facets.length > 0 ? (
                <SheafMessageBubble
                  messageId={m.id}
                  conversationId={conversationId}
                  currentUserId={currentUserId}
                  facets={m.facets}
                  defaultFacetId={m.defaultFacetId}
                />
              ) : (
                <ChatMessageContent content={m.text ?? ""} />
              )}
              {m.attachments?.length ? (
                <div className="mt-2 space-y-2">
                  {m.attachments.map((a: any) => (
                    <Attachment key={a.id} a={a} />
                  ))}
                </div>
              ) : null}
              {isMine && <ChatMessageAvatar imageSrc={m.sender?.image || "/assets/user-helsinki.svg"} />}
            </ChatMessage>
          );
        })}
      </div>

      {/* Composer */}
      <div className="mt-2 ">
        {/* Disabled when closed/archived */}
        <fieldset disabled={drift.isClosed || drift.isArchived} className="disabled:opacity-60">
          <div className=" sheaf-bubble  rounded-xl p-2 bg-white/50">
            <div className="mt-1">
              <MessageComposer
                conversationId={conversationId}
                currentUserId={currentUserId}
                driftId={drift.id}
              />
            </div>
          </div>
        </fieldset>
      </div>
    </div>
  );
}


-GroupCreationModal.tsx: "use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface UserLite {
  id: string;
  name: string;
  image: string | null;
}

export default function GroupCreationModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced] = useDebounce(query, 300);
  const [results, setResults] = useState<UserLite[]>([]);
  const [selected, setSelected] = useState<UserLite[]>([]);
  const [title, setTitle] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function search() {
      if (!debounced) {
        setResults([]);
        return;
      }
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(debounced)}`);
      if (res.ok) {
        setResults(await res.json());
        
      }
    }
    search();
  }, [debounced]);

  function toggle(user: UserLite) {
    setSelected((prev) => {
      if (prev.some((u) => u.id === user.id)) {
        return prev.filter((u) => u.id !== user.id);
      }
      return [...prev, user];
    });
  }

  async function create() {
    const body = {
      title: title || undefined,
      participantIds: selected.map((u) => u.id),
    };
    const res = await fetch("/api/conversations/group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      setOpen(false);
      router.push(`/messages/${data.id}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="savebutton bg-white/30 rounded-xl py-2 px-3 text-[1rem]">Create Group Chat</button>
      </DialogTrigger>
      <DialogContent className="max-w-[45rem]  bg-slate-700 border-blue">
        <DialogHeader>
          <DialogTitle className="text-[1.8rem] text-white tracking-wide ">Create Group</DialogTitle>
        </DialogHeader>
        <hr ></hr>

        <div className="space-y-8 py-4">
          <Input
          className="modalfield text-[1.1rem] tracking-wide p-3"
            placeholder="Group Name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div>
            <Input
                      className="modalfield text-[1.1rem] tracking-wide p-3"

              placeholder="Add Users"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {results.length > 0 && (
              <ul className="max-h-40 overflow-y-auto mt-2 border rounded-md">
                {results.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => toggle(u)}
                  >
                    <Image
                      src={u.image || "/assets/user-helsinki.svg"}
                      alt={u.name}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                    <span>{u.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map((u) => (
                <span
                  key={u.id}
                  className="flex items-center gap-1 bg-gray-200 px-2 py-1 rounded-full text-sm"
                >
                  {u.name}
                  <button onClick={() => toggle(u)}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>
        <hr className="mt-1"></hr>
        <button className="mt-1 flex text-center justify-start savebutton rounded-xl bg-white px-5 py-1 text-[1.1rem] tracking-wide w-fit " onClick={create} disabled={selected.length < 2}>
            Create
          </button>
      </DialogContent>
    </Dialog>
  );
}


-LinkCard.tsx: // components/chat/LinkCard.tsx
"use client";
export function LinkCard({ p }: { p: { urlHash: string; url: string; title?: string|null; desc?: string|null; image?: string|null; status: string } }) {
  const host = (() => { try { return new URL(p.url).host; } catch { return ""; }})();
  if (p.status !== "ok") {
    return <a href={p.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border bg-white/70 px-3 py-2 text-sm hover:bg-white">{p.url}</a>;
  }
  return (
    <a href={p.url} target="_blank" rel="noopener noreferrer" className="block savebutton border-[1.5px] border-slate-400  rounded-xl  max-w-[60%] px-3 py-3 ">
      <div className="text-[12px]  flex flex-wrap flex-col w-fit text-slate-500">{host}</div>
      {p.title ? <div className="font-medium">{p.title}</div> : null}
      {p.desc ? <div className="text-sm text-slate-600    w-fit text-slate-500 mt-1 line-clamp-3">{p.desc}</div> : null}
      {p.image ? <div className="mt-2 overflow-hidden rounded-md"><img src={p.image} alt="" className="max-h-40 rounded-xl w-fit object-fill" /></div> : null}
    </a>
  );
}


-MessageActions.tsx: 'use client';
import * as React from 'react';
import { useSafeForward } from '@/hooks/useSafeForward';
import type { AudienceSelector } from '@app/sheaf-acl';
import { toast } from 'sonner';

export function MessageActions({
  messageId,
  facetId,
  currentFacet, // { body, attachments }
  onForwardDone,
}: {
  messageId: string;
  facetId: string;
  currentFacet: { body: any; attachments?: any[] };
  onForwardDone?: () => void;
}) {
  const { check, prepareOutgoing, loading } = useSafeForward();

  async function onForwardClick(target: AudienceSelector) {
    try {
      const decision = await check('forward', messageId, facetId, target);
      if (decision.decision === 'FORBID') {
        toast.error('Forwarding is forbidden for this facet');
        return;
      }

      const outgoing = prepareOutgoing(
        decision.decision,
        { body: currentFacet.body, attachments: currentFacet.attachments, facetId, messageId },
        decision.suggestion
      );
      if (outgoing.mode === 'blocked') return;

      // Post to your normal send endpoint (or a dedicated forward endpoint)
      await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          // choose a conversation or target audience for the forward
          targetAudience: target,
          payload: outgoing,
        }),
      });

      onForwardDone?.();
      toast.success(decision.decision === 'REDACT' ? 'Forwarded (redacted).' : 'Forwarded.');
    } catch (e: any) {
      toast.error(e.message ?? 'Forward failed');
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => onForwardClick({ kind: 'EVERYONE' })}
        className="text-xs rounded px-2 py-1 bg-white/70"
        title="Forward to Everyone"
      >
        ↗ Forward
      </button>
      {/* You can add a small menu here to pick ROLE/LIST/USERS as target */}
    </div>
  );
}

-MessageComposer: "use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { X, File as FileIcon, Paperclip } from "lucide-react";
import { useChatStore } from "@/contexts/useChatStore";
import { supabase } from "@/lib/supabaseclient";
import QuickPollModal from "@/components/chat/QuickPollModal";
import QuickTempModal from "@/components/chat/QuickTempModal";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useConversationRealtime } from "@/hooks/useConversationRealtime";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // shadcn dialog
import { SheafComposer } from "../sheaf/SheafComposer";
interface Props {
  conversationId: string;
  currentUserId: string | number; // NEW
  driftId?: string;               // NEW (optional)
  currentUserName?: string;
   currentUserImage?: string | null;
}
type QuoteRef = { messageId: string; facetId?: string };

export default function MessageComposer({
  conversationId,
  currentUserId,
  driftId,
  currentUserName = "",
   currentUserImage = null,

  
}: Props) {
  const appendMessage = useChatStore((s) => s.appendMessage);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previews, setPreviews] = useState<string[]>([]);
  const [showPoll, setShowPoll] = useState(false);
  const [showSheaf, setShowSheaf] = useState(false);
  const [showTemp, setShowTemp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
//    const quoteDraft = useChatStore((s) => s.quoteDraftByConversationId[conversationId]);
//  const setQuoteDraft = useChatStore((s) => s.setQuoteDraft);
//  const clearQuoteDraft = () => setQuoteDraft(conversationId, undefined);

const { sendTyping } = useConversationRealtime(
  conversationId,
  { id: String(currentUserId), name: String(currentUserName), image: currentUserImage }
);


  function onFilesSelected(list: FileList | null) {
    console.log("[files] selected", list?.length);
    if (!list) return;
    const filesArray = Array.from(list);
    const urls = filesArray.map((f) =>
      f.type.startsWith("image/") ? URL.createObjectURL(f) : ""
    );
    setFiles((prev) => [...prev, ...filesArray]);
    setPreviews((prev) => [...prev, ...urls]);
    // allow picking the same file twice
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => {
      const [toRevoke] = prev.slice(idx, idx + 1);
      if (toRevoke) URL.revokeObjectURL(toRevoke);
      return prev.filter((_, i) => i !== idx);
    });
  }

  useEffect(() => {
    return () => {
      previews.forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, [previews]);

  // function onFilesSelected(list: FileList | null) {
  //   if (!list) return;
  //   setFiles((prev) => [...prev, ...Array.from(list)]);
  // }

  // function removeFile(idx: number) {
  //   setFiles((prev) => prev.filter((_, i) => i !== idx));
  // }

  // read quote draft from store


  async function hydrateAndAppendById(messageId: string, driftId?: string | null) {
    try {
      const r = await fetch(
        `/api/sheaf/messages?userId=${encodeURIComponent(String(currentUserId))}&messageId=${encodeURIComponent(messageId)}`,
        { cache: "no-store" }
      );
      const data = await r.json();
      const hydrated = data?.messages?.[0] ?? data?.message ?? null;
      if (!hydrated) return;
      if (hydrated.driftId || driftId) {
        // route to drift pane
        useChatStore.getState().appendDriftMessage(hydrated.driftId ?? String(driftId), hydrated);
      } else {
        // main timeline
        useChatStore.getState().appendMessage(conversationId, hydrated);
      }
    } catch (e) {
      console.warn("[Drift] hydrate after send failed", e);
    }
  }
  
 const quoteDraft = useChatStore(
     useCallback((s) => s.quoteDraftByConversationId[conversationId], [conversationId])
   );
   const setQuoteDraft = useChatStore((s) => s.setQuoteDraft);
   const clearQuoteDraft = useCallback(() => setQuoteDraft(conversationId, undefined), [conversationId, setQuoteDraft]);

  async function send() {

    if (uploading) return;
    if (!text.trim() && files.length === 0 && !quoteDraft) return; // allow “quote only”
        const clientId = crypto.randomUUID();
    const form = new FormData();
    if (text.trim()) form.append("text", text);
  
    if (driftId) form.append("driftId", driftId); // ← tag to a drift
    if (quoteDraft) console.log("sending meta", { quotes: [{ sourceMessageId: quoteDraft.messageId, sourceFacetId: quoteDraft.facetId ?? null }]});
    if (quoteDraft) {
           // Use set() so there is exactly one meta value
           form.set(
             "meta",
             JSON.stringify({
              quotes: [
                 {
                   sourceMessageId: quoteDraft.messageId,
                   sourceFacetId: quoteDraft.facetId ?? null,
                 },
               ],
             })
           );
         }
    files.forEach((f) => form.append("files", f));
    form.append("clientId", clientId);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/messages/${conversationId}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress((e.loaded / e.total) * 100);
      }
    };
    xhr.onload = () => {
      try {
        if (xhr.status < 200 || xhr.status >= 300)
          throw new Error("Upload failed");
             // Parse the minimal DTO returned by POST /api/messages/:id
             const resp = JSON.parse(xhr.responseText);
             const mid = String(resp?.id ?? "");
             const did = resp?.driftId ? String(resp.driftId) : (driftId ? String(driftId) : null);
             if (mid) {
               // Immediately rehydrate + append to the correct place (pane or main)
               hydrateAndAppendById(mid, did ?? undefined);
             }
       
      } catch (e) {
        // TODO: surface error toast
      } finally {
        setText("");
        setFiles([]);
        clearQuoteDraft();        
        setUploading(false);
        setProgress(0);
      }
    };
    xhr.onerror = () => {
      setUploading(false);
      setProgress(0);
      // TODO: toast
    };
    setUploading(true);
    xhr.send(form);
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (uploading) return;
    // reuse your existing send() logic
    send();
  }

  // helper: create a plain text message and return its id    normalized DTO for local append
  async function createQuestionMessage(question: string) {
    const fd = new FormData();
    fd.set("text", question);
    // const res = await fetch(`/api/messages/${conversationId}`, {
    //   method: "POST",
    //   body: fd,
    // });
    const res = await fetch(
      `/api/sheaf/messages?conversationId=${conversationId}&userId=${currentUserId}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error("Failed to create message");
    const msg = await res.json(); // matches useChatStore Message dto
    appendMessage(conversationId, msg);
    return msg;
  }

  async function createOptionsPoll(question: string, options: string[]) {
    const msg = await createQuestionMessage(question);
    const res = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        messageId: msg.id,
        kind: "OPTIONS",
        options,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data?.ok)
      throw new Error(data?.error || "Failed to create poll");
    // broadcast so everyone renders the chip under this message
    supabase.channel(`conversation-${conversationId}`).send({
      type: "broadcast",
      event: "poll_create",
      payload: { poll: data.poll, state: null, my: null },
    });
  }

  async function createTempCheck(question: string) {
    const msg = await createQuestionMessage(question);
    const res = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        messageId: msg.id,
        kind: "TEMP",
      }),
    });
    const data = await res.json();
    if (!res.ok || !data?.ok)
      throw new Error(data?.error || "Failed to create temperature check");
    supabase.channel(`conversation-${conversationId}`).send({
      type: "broadcast",
      event: "poll_create",
      payload: { poll: data.poll, state: null, my: null },
    });
  }
  async function refreshAndAppendSheaf(messageId: string) {
    try {
      const res = await fetch(
        `/api/sheaf/messages?userId=${currentUserId}&conversationId=${conversationId}`
      );
      if (!res.ok) return;
      const data = await res.json();
      // data: { userId, messages: [...] }
      const found = (data?.messages || []).find(
        (m: any) => String(m.id) === String(messageId)
      );
      if (found) {
        appendMessage(conversationId, found);
      }
    } catch (e) {
      // non-fatal
      console.warn("[Sheaf] append fallback failed", e);
    }
  }

  return (
    <div
      className="relative"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        onFilesSelected(e.dataTransfer.files);
      }}
    >
  {/* Quote pill (if quoting) */}
      {quoteDraft && (
       <div className="mb-2 mx-1 max-w-[720px] text-xs text-slate-600 flex items-center gap-2">
         <span>
           Quoting #{quoteDraft.messageId}
           {quoteDraft.facetId ? ` · facet ${quoteDraft.facetId}` : ""}
         </span>
         <button
           type="button"
           className="px-2 py-0.5 border rounded bg-white/80 hover:bg-white"
           onClick={clearQuoteDraft}
         >
           Clear
         </button>
       </div>
     )}
      {dragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 text-white border-2 border-dashed rounded-md">
          Drop files here
        </div>
      )}

      <div className="space-y-2">
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((file, i) => {
              const isImg = file.type.startsWith("image/");
              ///const url = isImg ? URL.createObjectURL(file) : undefined;
              const url = isImg ? previews[i] : undefined;
              return (
                <div
                  key={i}
                  className="relative w-20 h-20 border rounded-md overflow-hidden"
                >
                  {isImg ? (
                    <Image
                      src={url!}
                      alt={file.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-gray-100">
                      <FileIcon className="w-8 h-8" />
                    </div>
                  )}
                  <button
                    type="button"
                    className="absolute top-0 right-0 bg-black/50 text-white rounded-bl p-1"
                    onClick={() => removeFile(i)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="relative"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            onFilesSelected(e.dataTransfer.files);
          }}
        >
          <div className="flex flex-1 w-full  align-center  gap-3">
            
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex bg-white/70 sendbutton h-fit w-fit text-black tracking-widest text-[1.1rem] rounded-xl px-4 py-2"
                    title="Create"
                  >
                    <Image
                src="/assets/layers--external.svg"
                alt="share"
                width={24}
                height={24}
                className="cursor-pointer object-contain flex  justify-center items-center "
              />
                  
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="flex flex-col flex-1 bg-white/30 backdrop-blur rounded-xl min-w-[200px] max-w-[400px] py-2 max-h-[500px] w-full gap-1
                h-full text-[1rem] tracking-wide" align="start" sideOffset={6}>
                  <DropdownMenuItem className="rounded-xl  w-full" onClick={() => setShowPoll(true)}>
                    <div className="flex  w-full gap-1">
                  <p className="flex justify-start text-start">𒆝</p>  
                  <p className="flex justify-center items-center text-center"> Create Poll</p> 
                  </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-xl w-full" onClick={() => setShowTemp(true)}>
                  <div className="flex  w-full gap-1">
                  <p className="flex justify-start text-start">𒋲</p>  
                  <p className="flex justify-center items-center text-center"> Temp Check</p> 
                  </div>

                  </DropdownMenuItem>
                  <DropdownMenuItem
                     className="rounded-xl w-full"
                     onClick={async () => {
                       const title = prompt("Drift title");
                       if (!title) return;
                       try {
                        const res = await fetch("/api/drifts", {
                             method: "POST",
                             headers: { "Content-Type": "application/json" },
                             body: JSON.stringify({ conversationId, title }),
                          });
                           if (!res.ok) throw new Error(await res.text());
                           const data = await res.json();
                           const { anchor, drift } = data;
                           // 1) insert anchor into the main timeline
                           useChatStore.getState().appendMessage(String(conversationId), anchor);
                           // 2) upsert drift metadata for the chip
                           useChatStore.getState().upsertDrift({
                             drift,
                             my: { collapsed: true, pinned: false, muted: false, lastReadAt: null }
                          });
                          
                       } catch (e: any) {
                         alert(e?.message ?? "Failed to create drift");
                       }
                     }}
                   >
                            <div className="flex  w-full gap-1">
                  <p className="flex justify-start text-start">𒂝 </p>  
                  <p className="flex justify-center items-center text-center">  Create Drift</p> 
                  </div>
                   </DropdownMenuItem>
                  {/* ✅ NEW: toggle Sheaf panel */}
                  <DropdownMenuItem className="rounded-xl w-full" onClick={() => setShowSheaf((v) => !v)}>
                  <div className="flex  w-full gap-1">
                  <p className="flex justify-start text-start">𒒚</p>  
                  <p className="flex justify-end items-end text-center"> Stratified</p> 
                  </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* ✅ NEW: Inline Sheaf panel (collapsible)
        {showSheaf && (
          <div className="mt-3 rounded-xl border bg-white/60 p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Sheaf message</div>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded bg-white/70 border"
                onClick={() => setShowSheaf(false)}
              >
                Close
              </button>
            </div>

            <SheafComposer
              threadId={conversationId}
              authorId={currentUserId}
              onSent={({ messageId }) => {
                // You can optionally fetch the message and append, or rely on realtime.
                // Close panel after successful send:
                setShowSheaf(false);
                // console.log('Sheaf sent', messageId);
              }}
              viewAsCandidates={[
                { id: "MOD", label: "Role: MOD", type: "role" },
                // add more view-as entries if needed
              ]}
            />
          </div>
        )} */}
              {/* Sheaf Modal */}
              {/* <Dialog open={showSheaf} onOpenChange={setShowSheaf}>
                <DialogContent className="flex flex-1 flex-col max-h-[90vh] max-w-3xl h-full w-full bg-slate-300 rounded-xl    ">
                  <DialogHeader >
                    <DialogTitle hidden className="py-0    my-0 tracking-wide">Create layered message</DialogTitle>
                  </DialogHeader>
                  <h1 className="text-[1.25rem] font-semibold tracking-wide py-0 my-0">Create layered message</h1>
                  <div className="mt-0">
                    <SheafComposer
                      threadId={conversationId}
                      authorId={currentUserId}
                      onSent={async ({ messageId }) => {
                        setShowSheaf(false);
                        await refreshAndAppendSheaf(messageId);
                      }}
                      onCancel={() => setShowSheaf(false)}
                      viewAsCandidates={[
                        { id: "MOD", label: "Role: MOD", type: "role" },
                      ]}
                    />
                  </div>
                </DialogContent>
              </Dialog> */}

              <Dialog open={showSheaf} onOpenChange={setShowSheaf}>
  <DialogContent className="p-3 sheaf-shadow max-w-3xl w-full bg-white/10 rounded-xl  border-[2px] border-indigo-300
   backdrop-blur-lg">
    {/* The column wrapper needs an explicit height and min-h-0 so the middle can scroll */}
    <div className="flex h-[90vh] max-h-[90vh] flex-col min-h-0  bg-transparent
 rounded-xl border-none custom-scrollbar">
      {/* Header (not scrollable) */}
      <div className="shrink-0 p-4">
        <DialogHeader className="p-0  ">
          <DialogTitle className="text-xl text-slate-100 px-2 py-2 tracking-wide  ">Create Stratified Message</DialogTitle>
        </DialogHeader>
        <hr className="border-white/40 "></hr>
      </div>

      {/* Body (scrollable) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4">
        <SheafComposer
          threadId={conversationId}
          authorId={currentUserId}
          onSent={async ({ messageId }) => {
            setShowSheaf(false);
            await refreshAndAppendSheaf(messageId);
          }}
          onCancel={() => setShowSheaf(false)}
        />
      </div>

      {/* Optional footer (fixed) */}
      {/* <div className="shrink-0 p-4 border-t">
        …anything fixed at bottom…
      </div> */}
    </div>
  </DialogContent>
</Dialog>


              <QuickPollModal
                open={showPoll}
                onClose={() => setShowPoll(false)}
                onSubmit={async ({ question, options }) => {
                  try {
                    await createOptionsPoll(question, options);
                  } catch (e: any) {
                    alert(e?.message || "Failed to create poll");
                  }
                }}
              />

              <QuickTempModal
                open={showTemp}
                onClose={() => setShowTemp(false)}
                onSubmit={async ({ question }) => {
                  try {
                    await createTempCheck(question);
                  } catch (e: any) {
                    alert(e?.message || "Failed to create temperature check");
                  }
                }}
              />
            </>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach files"
              className="flex bg-white/70 sendbutton  h-fit w-fit text-black tracking-widest text-[1.1rem] rounded-xl px-3 py-2"
            >
              <input
                type="file"
                multiple
                accept="image/*,application/pdf,application/zip"
                onChange={(e) => onFilesSelected(e.target.files)}
                className="hidden"
              />
              {/* <Paperclip className="w-[24px] h-[24px]  cursor-pointer" /> */}
              <Image
                src="/assets/attachment.svg"
                alt="share"
                width={24}
                height={24}
                className="cursor-pointer object-contain flex  justify-center items-center "
              />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf,application/zip"
              onChange={(e) => onFilesSelected(e.target.files)}
              className="hidden"
            />
            <div className="flex flex-1 w-full">
              <textarea
                className="flex flex-1 h-full w-full text-start align-center rounded-xl bg-white/70 px-4 py-3 text-[.9rem] tracking-wider  messagefield text-black"
                rows={1}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (e.target.value.trim()) sendTyping(); // hook can debounce/throttle internally
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!uploading) send();
                  }
                }}
                disabled={uploading}
              />
            </div>
            <button
              type="submit"
              className="flex bg-white/70 sendbutton h-fit w-fit text-black tracking-widest text-[1.1rem] rounded-xl px-5 py-2"
              disabled={uploading}
            >
              <Image
                src="/assets/send--alt.svg"
                alt="share"
                width={24}
                height={24}
                className="cursor-pointer object-contain"
              />
            </button>
          </div>
          {uploading && (
            <div className="h-2 bg-gray-200 rounded-full mt-5">
              <div
                className="h-full bg-indigo-300 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// components/chat/MessageComposer.tsx (snippet for adding realtime presence ui)
// const { sendTyping } = useConversationRealtime(conversationId, {
//   id: currentUserId,
//   name: currentUserName,
//   image: currentUserImage,
// });

// <input
//   type="text"
//   value={text}
//   onChange={(e) => {
//     setText(e.target.value);
//     if (e.target.value.trim()) sendTyping();
//   }}
//   // …
// />


-// components/chat/MessagesRealtimeBootstrap.tsx
"use client";
import { useUserInbox } from "@/hooks/useUserInbox";
import { useEffect } from "react";
export default function MessagesRealtimeBootstrap({ me }: { me: string }) {
  useUserInbox(me);
  useEffect(() => {
    console.log("[inbox bootstrap] me:", me);
  }, [me]);
  return null;
}


-// components/chat/MessageUserModal.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type UserLite = {
  id: string;
  name: string;
  username?: string | null;
  image: string | null;
};

export default function MessageUserModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced] = useDebounce(query, 300);
  const [results, setResults] = useState<UserLite[]>([]);
  const [selected, setSelected] = useState<UserLite | null>(null);
  const [firstMessage, setFirstMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!debounced) {
        setResults([]);
        return;
      }
      const res = await fetch(
        `/api/users/search?q=${encodeURIComponent(debounced)}`
      );
      if (!res.ok) return;
      const data = (await res.json()) as UserLite[];
      if (!cancelled) setResults(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  function pick(u: UserLite) {
    setSelected(u);
    setQuery(`${u.name}${u.username ? ` (@${u.username})` : ""}`);
    setResults([]); // close list
  }

  async function handleSend() {
    setError(null);
    if (!selected) {
      setError("Please select a user to message.");
      return;
    }

    // 1) Create (or fetch) the DM conversation
    const res = await fetch("/api/messages/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: selected.id }),
    });

    if (res.status === 403) {
      setError("This user only accepts messages from friends.");
      return;
    }
    if (!res.ok) {
      setError("Could not start a conversation.");
      return;
    }

    const { id } = await res.json();

    // 2) Optionally send the first message
    const text = firstMessage.trim();
    if (text) {
      const form = new FormData();
      form.append("text", text);
      await fetch(`/api/messages/${id}`, { method: "POST", body: form });
    }

    // 3) Go to the conversation
    setOpen(false);
    setSelected(null);
    setFirstMessage("");
    setQuery("");
    router.push(`/messages/${id}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      // Enter picks the first result if nothing selected yet
      if (!selected && results.length > 0) {
        e.preventDefault();
        pick(results[0]);
      }
    }
  }

  //   useEffect(() => {
  //     async function search() {
  //       if (!debounced) {
  //         setResults([]);
  //         return;
  //       }
  //       const res = await fetch(`/api/users/search?q=${encodeURIComponent(debounced)}`);
  //       if (res.ok) {
  //         setResults(await res.json());

  //       }
  //     }
  //     search();
  //   }, [debounced]);

  //   function toggle(user: UserLite) {
  //     setSelected((prev) => {
  //       if (prev.some((u) => u.id === user.id)) {
  //         return prev.filter((u) => u.id !== user.id);
  //       }
  //       return [...prev, user];
  //     });
  //   }

  //   async function create() {
  //     const body = {
  //       title: title || undefined,
  //       participantIds: selected.map((u) => u.id),
  //     };
  //     const res = await fetch("/api/conversations/group", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(body),
  //     });
  //     if (res.ok) {
  //       const data = await res.json();
  //       setOpen(false);
  //       router.push(`/messages/${data.id}`);
  //     }
  //   }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setSelected(null);
          setFirstMessage("");
          setResults([]);
          setQuery("");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <button className="savebutton bg-white/30 rounded-xl py-2 px-3 text-[1rem]">
          Send Direct Message
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[45rem]  bg-slate-700 border-blue">
        <DialogHeader>
          <DialogTitle className="text-[1.8rem] text-white tracking-wide ">
            New Message
          </DialogTitle>
        </DialogHeader>
        <hr></hr>

        <div className="space-y-8 py-4">
          <div>
            <Input
              className="modalfield text-[1.1rem] tracking-wide p-3"
              placeholder="Search by name or @username"
              
              
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(null);
              }}
              onKeyDown={onKeyDown}
                          />
            {results.length > 0 && (
              <ul className="max-h-40 overflow-y-auto mt-2 border rounded-md">
                {results.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => pick(u)}
                                      >
                    <Image
                      src={u.image || "/assets/user-helsinki.svg"}
                      alt={u.name}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{u.name}</div>
                      {u.username && <div className="text-xs text-gray-500">@{u.username}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Input
                 className="modalfield text-[1.05rem] tracking-wide p-3"
                 placeholder="Write a message…"
                 value={firstMessage}
                 onChange={(e) => setFirstMessage(e.target.value)}
          />


{selected && (
            <div className="text-white/90 text-sm">
              Sending to <span className="font-semibold">{selected.name}</span>
              {selected.username ? ` (@${selected.username})` : ""}
            </div>
          )}
 {error && <div className="text-red-300 text-sm">{error}</div>}
        </div>

        <div className="flex justify-start">
          <button
            onClick={handleSend}
            disabled={!selected}
            className="rounded-xl bg-white px-5 py-1 savebutton text-[1.05rem] tracking-wide"
          >
            Send
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

//           {selected.length > 0 && (
//             <div className="flex flex-wrap gap-2">
//               {selected.map((u) => (
//                 <span
//                   key={u.id}
//                   className="flex items-center gap-1 bg-gray-200 px-2 py-1 rounded-full text-sm"
//                 >
//                   {u.name}
//                   <button onClick={() => toggle(u)}>×</button>
//                 </span>
//               ))}
//             </div>
//           )}
//         </div>
//         <hr className="mt-1"></hr>
//         <button
//           className="mt-1 flex text-center justify-start savebutton rounded-xl bg-white px-5 py-1 text-[1.1rem] tracking-wide w-fit "
//           onClick={create}
//           disabled={selected.length < 2}
//         >
//           Send
//         </button>
//       </DialogContent>
//     </Dialog>
//   );
// }


-// components/chat/MessengerPane.tsx
"use client";

import useSWR from "swr";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";

type Participant = { id: string; name: string; image: string | null };
type Conversation = {
  id: string;
  isGroup: boolean;
  title?: string | null;
  participants: Participant[];
  lastMessage?: string | null;
  lastAt?: string | null;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function GroupAvatar({ participants }: { participants: Participant[] }) {
  const imgs = participants.slice(0, 3);
  return (
    <div className="flex  w-10 h-10 rounded-full overflow-hidden bg-white/50">
      {imgs.map((p) => (
        <Image
          key={p.id}
          src={p.image || "/assets/user-helsinki.svg"}
          alt={p.name}
          width={40}
          height={40}
          className="object-fill"
        />
      ))}
    </div>
  );
}

function Title({ c, currentUserId }: { c: Conversation; currentUserId: string }) {
  if (c.isGroup) {
    const base =
      c.title?.trim() ||
      c.participants
        .map((p) => p.name)
        .slice(0, 3)
        .join(", ");
    const extra = c.participants.length - 3;
    return <span className="font-semibold">{extra > 0 ? `${base} +${extra}` : base || "Group"}</span>;
  }
  const other = c.participants.find((p) => p.id !== currentUserId);
  return <span className="font-semibold">{other?.name ?? "Direct Message"}</span>;
}

export default function MessengerPane({ currentUserId }: { currentUserId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Load conversations when pane is open the first time
  const { data, isLoading, error, mutate } = useSWR<Conversation[]>(
    open ? "/api/conversations/list" : null,
    fetcher,
    { revalidateOnFocus: true }
  );

  // Close pane on route change (optional)
  const isMessagesPage = useMemo(() => pathname?.startsWith("/messages/"), [pathname]);

  function go(id: string) {
    router.push(`/messages/${id}`);
    setOpen(false);
  }

  return (
    <>
      {/* bottom-left tab button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="absolute left-[14rem] tracking-wide top-6 z-[9000] rounded-full bg-white/50  px-4 py-1 likebutton"
        >
          ⇤
  Messages
        </button>
      )}

      {/* sliding pane */}
      <div
        className={[
          "fixed left-0 bottom-16 sm:bottom-20 z-[9996] h-[65vh] sm:h-[70vh] w-[22rem] sm:w-[24rem]",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-[110%]",
          "pointer-events-auto",
        ].join(" ")}
      >
        <div className="flex h-full flex-col rounded-r-xl border border-slate-200 bg-indigo-50/50 backdrop-blur shadow-xl ">
          <div className="flex items-center justify-between px-3 py-2 border-b bg-slate-50 rounded-tl-xl w-full rounded-tr-xl">
            <div className="font-semibold text-[1.05rem] tracking-widest px-3">Your Conversations</div>
            <div className="space-x-1">
              <button
                className="rounded px-2 py-1 hover:bg-black/5"
                onClick={() => mutate()} // refresh list
                title="Refresh"
              >
                ⟳
              </button>
              <button
                className="rounded px-2 py-1 hover:bg-black/5"
                onClick={() => setOpen(false)} // minimize to tab
                title="Minimize"
              >
                –
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 ">
            {isLoading && <div className="text-sm text-gray-500 px-2 py-4">Loading…</div>}
            {error && <div className="text-sm text-red-600 px-2 py-4">Failed to load conversations.</div>}
            {data?.length === 0 && <div className="text-sm text-gray-500 px-2 py-4">No conversations yet.</div>}
            <ul className="space-y-2">
              {data?.map((c) => {
                const other = !c.isGroup ? c.participants.find((p) => p.id !== currentUserId) : null;
                return (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 p-2 bg-white/70 shadow-md rounded-lg border hover:bg-white cursor-pointer"
                    onClick={() => go(c.id)}
                  >
                    {c.isGroup ? (
                      <GroupAvatar participants={c.participants} />
                    ) : (
                      <Image
                        src={other?.image || "/assets/user-helsinki.svg"}
                        alt={other?.name || "User"}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="truncate">
                        <Title c={c} currentUserId={currentUserId} />
                      </div>
                      {c.lastMessage && (
                        <div className="text-sm text-gray-600 truncate">{c.lastMessage}</div>
                      )}
                    </div>

                    {/* optional: timestamp */}
                    {c.lastAt && (
                      <div className="ml-2 shrink-0 text-[11px] text-gray-500">
                        {new Date(c.lastAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* footer (optional shortcut) */}
          <div className="border-t px-3 py-2 bg-white/60 rounded-br-xl">
            <Link href="/profile/messages" className="text-sm underline">
              Open Messages Page
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}


-PollChip.tsx:   /* components/chat/PollChip.tsx */
  "use client";
  import * as React from "react";
  import { PollUI } from "@/contexts/useChatStore";
  
  type VoteBody = { optionIdx?: number; value?: number };

  function leadingIndices(votes: number[]) {
    const max = Math.max(0, ...votes);
    if (max <= 0) return [];
    const out: number[] = [];
    votes.forEach((v, i) => { if (v === max) out.push(i); });
    return out;
  }
  
  function SmallMeta({ children }: { children: React.ReactNode }) {
    return <div className="text-[11px] leading-4 text-slate-600">{children}</div>;
  }
  function MediumMeta({ children }: { children: React.ReactNode }) {
    return <div className="text-[1rem] leading-4 text-slate-700">{children}</div>;
  }
  
  function SummaryButton({
    label,
    onClick,
  }: {
    label: string;
    onClick: () => void;
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex flex-col justify-center   items-center mx-auto w-fit gap-2 px-2 py-2 rounded-xl  bg-white/70  text-[.85rem] sendbutton"
        aria-expanded={false}
      >
        {label}
      </button>
    );
  }
  
  export default function PollChip({
    poll,
    onVote,
  }: {
    poll: PollUI;
    onVote: (params: VoteBody) => void;
  }) {
    const pollId = poll.poll.id;
    const key = React.useMemo(() => `poll:collapsed:${pollId}`, [pollId]);
    const voted =
      poll.kind === "OPTIONS" ? poll.myVote != null : poll.myValue != null;
  
    // Default: not voted → expanded; voted → collapsed
    const [collapsed, setCollapsed] = React.useState<boolean>(voted);
  
    // Hydrate from localStorage (if user toggled before)
    React.useEffect(() => {
      try {
        const v = localStorage.getItem(key);
        if (v !== null) setCollapsed(v === "1");
        else setCollapsed(voted);
      } catch {}
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
  
    // If user just voted and we have no stored pref yet, collapse by default
    const prevVoted = React.useRef(voted);
    React.useEffect(() => {
      if (!prevVoted.current && voted) {
        try {
          const hadPref = localStorage.getItem(key);
          if (hadPref === null) {
            localStorage.setItem(key, "1");
            setCollapsed(true);
          }
        } catch {}
      }
      prevVoted.current = voted;
    }, [voted, key]);
  
    const persist = (v: boolean) => {
      setCollapsed(v);
      try {
        localStorage.setItem(key, v ? "1" : "0");
      } catch {}
    };
  
    // If user hasn't voted yet, keep the current UI (never collapsed)
    if (!voted) {
      return poll.kind === "OPTIONS" ? (
        <OptionsVoteView poll={poll} onVote={onVote} />
      ) : (
        <TempVoteView poll={poll} onVote={onVote} />
      );
    }
  
    // Collapsed: show a compact summary button
    if (collapsed) {
      const label =
        poll.kind === "OPTIONS"
          ? optionsSummaryLabel(poll)
          : `🌡 View temperature • Avg ${poll.avg} (${poll.count})`;
      return <SummaryButton label={label} onClick={() => persist(false)} />;
    }
  
    // Expanded: show results with a small “×” to minimize
    return poll.kind === "OPTIONS" ? (
      <OptionsResultsView poll={poll} onVote={onVote} onClose={() => persist(true)} />
    ) : (
      <TempResultsView poll={poll} onVote={onVote} onClose={() => persist(true)} />
    );
  }
  
  /* ---------- OPTIONS ---------- */
  
  // function optionsSummaryLabel(p: Extract<PollUI, { kind: "OPTIONS" }>) {
  //   const { totals, count } = p;
  //   if (!p.poll.options?.length) return "📊 View poll results";
  //   const total = Math.max(1, count);
  //   let leader = 0;
  //   for (let i = 1; i < p.poll.options.length; i  ++) {
  //     if ((totals[i] ?? 0) > (totals[leader] ?? 0)) leader = i;
  //   }
  //   const pct = Math.round(((totals[leader] ?? 0) * 100) / total);
  //   return `📊 View poll • ${count} vote${count === 1 ? "" : "s"} • Leading: “${
  //     p.poll.options[leader]
  //   }” (${pct}%)`;
  // }
  function optionsSummaryLabel(p: Extract<PollUI, { kind: "OPTIONS" }>) {
    const { totals, count } = p;
    const options = p.poll.options ?? [];
    if (!options.length) return "📊 View poll results";
  
    const totalVotes = Math.max(1, count);
    const votes = options.map((_, i) => totals[i] ?? 0);
    const max = Math.max(0, ...votes);
  
    // Find all indices tied for the lead
    const leaders = votes.reduce<number[]>((acc, v, i) => {
      if (v === max) acc.push(i);
      return acc;
    }, []);
  
    // If there’s a real tie (>=2 leaders) and at least one vote has been cast
    if (max > 0 && leaders.length >= 2) {
      return `📊 View poll • ${count} vote${count === 1 ? "" : "s"} • Leading: tie`;
    }
  
    // Otherwise show the leading option + its percentage
    const leader = leaders[0] ?? 0;
    const pct = Math.round(((votes[leader] ?? 0) * 100) / totalVotes);
    return `📊 View poll • ${count} vote${count === 1 ? "" : "s"} • Leading: “${options[leader]}” (${pct}%)`;
  }
  
  
  function OptionsVoteView({
    poll,
    onVote,
  }: {
    poll: Extract<PollUI, { kind: "OPTIONS" }>;
    onVote: (b: VoteBody) => void;
  }) {
    const { poll: p } = poll;
    const [submitting, setSubmitting] = React.useState<number | null>(null);
    const handle = async (idx: number) => {
      try {
        setSubmitting(idx);
        await onVote({ optionIdx: idx });
      } finally {
        setSubmitting(null);
      }
    };
    return (

      <div className="relative text-[1rem] rounded-xl text-center bg-white/30 px-8 py-4 shadow-xl mx-auto w-[50%] gap-2 ">
        <MediumMeta >📊 Poll · Choose One</MediumMeta>
        <div className="mt-4  justify-center items-center flex flex-wrap gap-4">
          {p.options!.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handle(idx)}
              disabled={submitting !== null}
              className="px-3 pt-1 text-[1rem] tracking-wide rounded-full  bg-white/70 sendbutton text-xs transition disabled:opacity-60"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }
  
  function OptionsResultsView({
    poll,
    onVote,
    onClose,
  }: {
    poll: Extract<PollUI, { kind: "OPTIONS" }>;
    onVote: (b: VoteBody) => void;
    onClose: () => void;
  }) {
    const { poll: p, totals, count, myVote } = poll;
    const total = Math.max(1, count);

      // tie detection for expanded view
  const votes = p.options!.map((_, i) => totals[i] ?? 0);
  const leaders = leadingIndices(votes);
  const isTie = leaders.length >= 2;

    const handle = async (idx: number) => {
      await onVote({ optionIdx: idx });
    };

    return (
      <div
        className="relative rounded-xl bg-white/30 px-8 py-4 shadow-xl mx-auto w-[70%]"
        role="group"
        aria-label="Poll results"
      >
        <button
          type="button"
          aria-label="Minimize poll"
          onClick={onClose}
          className="absolute top-2 right-2 text-slate-500 hover:text-slate-700"
        >
          ｘ

        </button>
        <div className="flex text-[1rem] text-center justify-between items-baseline">
          <SmallMeta>📊 Poll · {count} vote{count === 1 ? "" : "s"}
          {isTie ? " · Leading: tie" : null}
          </SmallMeta>
        </div>
        <div className="mt-1.5 space-y-1.5">
          {p.options!.map((opt, idx) => {
            const pct = Math.round(((totals[idx] ?? 0) * 100) / total);
            const mine = myVote === idx;
            const isLeader = leaders.includes(idx);
          const showTieBadge = isTie && isLeader;

            return (
              <button key={idx} onClick={() => handle(idx)} className="block w-full text-left" aria-pressed={mine}
              aria-label={
                showTieBadge
                  ? `${opt}, ${pct} percent, tied for lead`
                  : `${opt}, ${pct} percent`
              }>
                <div className="flex items-baseline justify-between text-[12px]">
                  <span className={mine ? "font-semibold" : ""}>
                    {mine ? "✓ " : ""}
                    {opt}
                    {showTieBadge && (
                    <span
                      className="ml-2 align-middle rounded-full px-1.5 py-0.5 text-[10px] bg-amber-200/70 text-amber-900"
                      aria-hidden="true"
                    >
                      tie
                    </span>
                     )}
                  </span>
                  <span className="tabular-nums">{pct}%</span>
                </div>
                <div className="mt-0.5 h-1.5 rounded bg-slate-300 overflow-hidden">
                <div
                  className={[
                    "h-1.5 rounded transition-all duration-300",
                    mine
                      ? "bg-indigo-500"
                      : showTieBadge
                      ? "bg-amber-400"
                      : "bg-rose-400",
                  ].join(" ")}
                  style={{ width: `${pct}%` }}
                />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  
  /* ---------- TEMPERATURE ---------- */
  function TempVoteView({
    poll,
    onVote,
    framed = true, // ⬅️ new prop
  }: {
    poll: Extract<PollUI, { kind: "TEMP" }>;
    onVote: (b: VoteBody) => void;
    framed?: boolean;
  }) {
    const { myValue } = poll;
    const [value, setValue] = React.useState<number>(myValue ?? 50);
    const [dragging, setDragging] = React.useState(false);
    const [pending, setPending] = React.useState(false);
  
    const commit = async (v: number) => {
      setPending(true);
      try {
        await onVote({ value: v });
      } finally {
        setPending(false);
      }
    };
  
    const Inner = (
      <>
        <div className="flex items-baseline justify-between">
          <SmallMeta>🌡 Temperature check</SmallMeta>
        </div>
  
        <div className="mt-2">
          <div className="relative">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              onPointerDown={() => setDragging(true)}
              onPointerUp={() => { setDragging(false); commit(value); }}
              className="w-full"
              aria-label="Set your temperature"
            />
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-slate-600">
            <span>0 · Nope</span><span>50 · Meh</span><span>100 · Yes</span>
          </div>
        </div>
  
        <div className="mt-1 text-[11px] text-slate-700">
          Your value: <span className="tabular-nums">{value}</span>
          {pending ? " • saving…" : dragging ? " • release to save" : null}
        </div>
      </>
    );
  
    if (!framed) return Inner;
  
    return (
      <div
        className="relative rounded-xl bg-white/30 px-8 py-4 shadow-xl mx-auto w-[70%]"
        role="group"
        aria-label="Temperature Check"
      >
        {Inner}
      </div>
    );
  }
  
  
  function TempResultsView({
    poll,
    onVote,
    onClose,
  }: {
    poll: Extract<PollUI, { kind: "TEMP" }>;
    onVote: (b: VoteBody) => void;
    onClose: () => void;
  }) {
    const { avg, count } = poll;
  
    return (
      <div
        className="relative rounded-xl bg-white/30 px-8 py-4 shadow-xl mx-auto w-[70%]"
        role="group"
        aria-label="Temperature results"
      >
        <button
          type="button"
          aria-label="Minimize poll"
          onClick={onClose}
          className="absolute top-2 right-2 text-slate-500 hover:text-slate-700"
        >
          ｘ

        </button>
  
        <div className="mb-1 flex items-baseline justify-between">
          <SmallMeta>
            🌡 Temperature · Avg {avg} · {count} vote{count === 1 ? "" : "s"}
          </SmallMeta>
        </div>
  
        {/* Render slider UI without its own frame */}
        <TempVoteView poll={poll} onVote={onVote} framed={false} />
      </div>
    );
  }
  

-// components/chat/PrivateChatDock.tsx
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import PrivateChatPane from "../PrivateChatPane";
import { usePrivateChatManager } from "@/contexts/PrivateChatManager";
import { useAuth } from "@/lib/AuthContext";

export default function PrivateChatDock({ currentUserId }: { currentUserId?: string }) {
  // Call hooks unconditionally, in a stable order
  const { state, dispatch } = usePrivateChatManager();
  const { user } = useAuth();

  // Hydration guard
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Bail out of rendering until mounted (prevents hydration mismatch)
  if (!mounted) return null;

  const panes = Object.values(state.panes || []);
  const openPanes = panes.filter(p => !p.minimised);
  const minimised = panes.filter(p => p.minimised);
  if (!panes.length) return null;

  // useEffect(() => {
  //   console.log("[DOCK] open panes:", openPanes.map(p => ({id:p.id, unread:p.unread, min:p.minimised})));
  //   console.log("[DOCK] minimised tabs:", minimised.map(p => ({id:p.id, unread:p.unread})));
  // }, [state.panes, openPanes.length, minimised.length]);

  const meName = user?.name ?? user?.username ?? null;
  const meImage = user?.image ?? null;

  return (
    <div id="pcp-bounds" className="fixed inset-0 pointer-events-none z-[9990]">
      {openPanes.map(p => (
        <PrivateChatPane
          key={p.id}
          pane={p}
          currentUserId={currentUserId}
          currentUserName={meName}
          currentUserImage={meImage}
        />
      ))}
      {minimised.length > 0 && (
        <div className="pointer-events-auto fixed bottom-0 left-12 flex flex-row-reverse gap-2">
          {minimised.map(p => (
            <button
              key={p.id}
              title={`Open chat with ${p.peerName}`}
              onClick={() => dispatch({ type: "RESTORE", id: p.id })}
              className="group flex items-center gap-2 rounded-t-md rounded-bl-md bg-white/90 backdrop-blur border shadow px-3 py-2 hover:bg-white"
            >
              {p.peerImage ? (
                <Image src={p.peerImage} alt="" width={20} height={20} className="rounded-full object-cover" />
              ) : (
                <span className="inline-block w-5 h-5 rounded-full bg-slate-300" />
              )}
              <span className="text-sm">{p.peerName}</span>
              {p.unread ? (
                <span className="ml-1 text-xs rounded bg-indigo-600 text-white px-1">{p.unread}</span>
              ) : null}
              <span
                className="ml-2 text-slate-500 hover:text-slate-800"
                onClick={(e) => { e.stopPropagation(); dispatch({ type: "CLOSE", id: p.id }); }}
              >
                ×
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


-"use client";
import { PrivateChatProvider } from "@/contexts/PrivateChatManager";

export default function PrivateChatShell({
  meId,
  children,
}: {
  meId: string | null;
  children: React.ReactNode;
}) {
  return <PrivateChatProvider meId={meId}>{children}</PrivateChatProvider>;
}


-// components/chat/QuickPollComposer.tsx
"use client";
import React from "react";

export default function QuickPollComposer({
  onSubmit,
  onCancel,
}: {
  onSubmit: (options: string[]) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [opts, setOpts] = React.useState<string[]>(["", ""]);
  const [submitting, setSubmitting] = React.useState(false);

  const canAdd = opts.length < 4;
  const sanitized = opts.map((o) => o.trim()).filter(Boolean);
  const canCreate = sanitized.length >= 2;

  const update = (i: number, v: string) => {
    const next = [...opts];
    next[i] = v;
    setOpts(next);
  };

  const add = () => {
    if (!canAdd) return;
    setOpts((o) => [...o, ""]);
  };

  const remove = (i: number) => {
    const next = [...opts];
    next.splice(i, 1);
    setOpts(next.length ? next : ["", ""]);
  };

  const submit = async () => {
    if (!canCreate || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(sanitized.slice(0, 4));
      onCancel();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-md border bg-white/70 px-3 py-3 max-w-[34rem] backdrop-blur">
      <div className="text-[12px] text-slate-700 mb-2">📊 Create a quick poll</div>

      <div className="space-y-1.5">
        {opts.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="flex-1 rounded border px-2 py-1 text-sm bg-white/90 outline-none"
              placeholder={`Option ${i + 1}`}
              value={v}
              onChange={(e) => update(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
            {opts.length > 2 && (
              <button
                onClick={() => remove(i)}
                className="rounded px-2 py-1 text-xs border bg-white/80 hover:bg-white"
                title="Remove"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-slate-600">
          <label className="inline-flex items-center gap-1 opacity-60 cursor-not-allowed">
            <input type="checkbox" disabled /> Allow multiple <span className="opacity-70">(soon)</span>
          </label>
          <label className="inline-flex items-center gap-1 opacity-60 cursor-not-allowed">
            <input type="checkbox" disabled /> Anonymous <span className="opacity-70">(soon)</span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="rounded px-3 py-1 text-xs border bg-white/80 hover:bg-white"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!canCreate || submitting}
            className="rounded px-3 py-1 text-xs border bg-indigo-600/10 hover:bg-indigo-600/20 disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}


-// components/chat/QuickPollModal.tsx
"use client";
import * as React from "react";

export default function QuickPollModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (args: { question: string; options: string[] }) => Promise<void> | void;
}) {
  const [question, setQuestion] = React.useState("");
  const [opts, setOpts] = React.useState<string[]>(["", ""]);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setQuestion("");
      setOpts(["", ""]);
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  const canAdd = opts.length < 10;
  const cleanOpts = opts.map((o) => o.trim()).filter(Boolean);
  const canCreate = question.trim().length > 0 && cleanOpts.length >= 2;

  const update = (i: number, v: string) => {
    const next = [...opts];
    next[i] = v;
    setOpts(next);
  };
  const add = () => canAdd && setOpts((x) => [...x, ""]);
  const remove = (i: number) => {
    const next = [...opts];
    next.splice(i, 1);
    setOpts(next.length ? next : ["", ""]);
  };

  const submit = async () => {
    if (!canCreate || busy) return;
    setBusy(true);
    try {
      await onSubmit({ question: question.trim(), options: cleanOpts.slice(0, 10) });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-xl border bg-white/80 backdrop-blur shadow-xl p-4">
          <div className="text-sm font-medium mb-2">📊 Create poll</div>

          <label className="text-[12px] text-slate-600">Question</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2 text-sm bg-white/95 outline-none"
            placeholder="What do you think we should ship first?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />

          <div className="mt-3">
            <div className="flex items-center justify-between">
              <label className="text-[12px] text-slate-600">Options (2–10)</label>
              <button
                onClick={add}
                disabled={!canAdd}
                className="text-[12px] rounded px-2 py-1 border bg-white/80 hover:bg-white disabled:opacity-50"
              >
                + Add option
              </button>
            </div>
            <div className="mt-2 space-y-2 max-h-64 overflow-auto pr-1">
              {opts.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className="flex-1 rounded border px-3 py-2 text-sm bg-white/95 outline-none"
                    placeholder={`Option ${i + 1}`}
                    value={v}
                    onChange={(e) => update(i, e.target.value)}
                  />
                  {opts.length > 2 && (
                    <button
                      onClick={() => remove(i)}
                      className="rounded px-2 py-1 text-xs border bg-white/80 hover:bg-white"
                      title="Remove"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button onClick={onClose} className="rounded px-3 py-1 text-sm border bg-white/80 hover:bg-white">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!canCreate || busy}
              className="rounded px-3 py-1 text-sm border bg-indigo-600/10 hover:bg-indigo-600/20 disabled:opacity-50"
            >
              {busy ? "Creating…" : "Create poll"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

-// components/chat/QuickTempModal.tsx
"use client";
import * as React from "react";

export default function QuickTempModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (args: { question: string }) => Promise<void> | void;
}) {
  const [question, setQuestion] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setQuestion("");
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  const canCreate = question.trim().length > 0;

  const submit = async () => {
    if (!canCreate || busy) return;
    setBusy(true);
    try {
      await onSubmit({ question: question.trim() });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-xl border bg-white/80 backdrop-blur shadow-xl p-4">
          <div className="text-sm font-medium mb-2">🌡 Temperature check</div>
          <label className="text-[12px] text-slate-600">Prompt</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2 text-sm bg-white/95 outline-none"
            placeholder="How confident are we to ship on Friday?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <div className="mt-4 flex items-center justify-end gap-2">
            <button onClick={onClose} className="rounded px-3 py-1 text-sm border bg-white/80 hover:bg-white">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!canCreate || busy}
              className="rounded px-3 py-1 text-sm border bg-indigo-600/10 hover:bg-indigo-600/20 disabled:opacity-50"
            >
              {busy ? "Creating…" : "Create check"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


-"use client";
import React from "react";

type Quote = {
  sourceMessageId: string;
  sourceFacetId?: string | null;
  status: "ok" | "redacted" | "unavailable";
  body?: unknown | string | null;
  attachments?: Array<{ id: string; name?: string; mime: string; size: number; sha256?: string; path?: string | null }>;
  isEdited?: boolean;
  sourceAuthor?: { name: string | null; image: string | null } | null;
  updatedAt?: string | null;
};

function textFromTipTap(node: any): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(textFromTipTap).join("");
  if (typeof node === "object") {
    // TipTap nodes: { type, text?, content? }
    if (node.text) return String(node.text);
    if (Array.isArray(node.content)) return node.content.map(textFromTipTap).join("");
    return textFromTipTap(node.content);
  }
  return "";
}

function toSnippet(raw: string, max = 240) {
  const s = raw.replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export function QuoteBlock({
  q,
  compact = true,
}: {
  q: Quote;
  compact?: boolean;
}) {
  if (q.status === "redacted")
    return <div className="rounded-md border bg-slate-50/70 px-2 py-1.5 text-slate-500 italic">(redacted)</div>;
  if (q.status === "unavailable")
    return <div className="rounded-md border bg-slate-50/70 px-2 py-1.5 text-slate-500 italic">(unavailable)</div>;

  // Normalize body to text
  const textRaw =
    typeof q.body === "string"
      ? q.body
      : q.body
      ? textFromTipTap(q.body)
      : "";
  const snippet = toSnippet(textRaw || "");

  const handleJump = () => {
    const el = document.querySelector(`[data-msg-id="${q.sourceMessageId}"]`) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("bg-white/10", "rounded-xl", "shadow-xl");
    setTimeout(() => el.classList.remove("bg-white/10", "rounded-xl", "shadow-xl"), 1200);
  };

  return (
    <button
      type="button"
      onClick={handleJump}
      className="group text-left inline-block max-w-full"
      title="Jump to quoted message"
    >
     <div className="rounded-md bg-white/50 px-4 py-1 likebutton max-w-full">
        {/* Header: author + (edited) if not using the outer label */}
        {!compact && (q.sourceAuthor?.name || q.isEdited) && (
          <div className="text-[11px] text-slate-500 mb-0.5">
            {q.sourceAuthor?.name ?? "Quoted message"}
            {q.isEdited ? <span className="ml-1 italic">(edited)</span> : null}
          </div>
        )}

        {/* Body text */}
        <div className="text-[13px] leading-snug whitespace-pre-wrap break-words text-slate-800 max-w-full">
          {snippet || <span className="text-slate-500 italic">(no text)</span>}
        </div>

        {/* Attachments hint */}
        {Array.isArray(q.attachments) && q.attachments.length > 0 && (
          <div className="mt-1 text-[11px] text-slate-500">
            {q.attachments.length} attachment{q.attachments.length === 1 ? "" : "s"}
          </div>
        )}
      </div>
    </button>
  );
}


- "use client";
 import { useRouter, useSearchParams } from "next/navigation";
 
 export default function StarredFilterToggle() {
   const router = useRouter();
   const sp = useSearchParams();
   const starred = sp.get("starred") === "1";
 
   function toggle() {
     const params = new URLSearchParams(sp.toString());
     if (starred) params.delete("starred");
     else params.set("starred", "1");
     router.replace("?" + params.toString());
   }
 
   return (
     <button
       type="button"
       onClick={toggle}
       className={
         "text-xs px-2 py-1 rounded-lg border " +
         (starred
           ? "bg-yellow-200 border-yellow-300 text-yellow-900"
           : "bg-transparent border-gray-300 text-gray-600 hover:bg-gray-100")
       }
       title="Show only starred messages"
     >
       ★ Starred
     </button>
   );
 }
 

- "use client";
 import { useStars } from "@/hooks/useStars";
 
 type IdLike = string | number | bigint;
 const toStr = (v: IdLike) => (typeof v === "bigint" ? v.toString() : String(v));
 
 export default function StarToggle({
   conversationId,
   messageId,
   className = "",
 }: {
   conversationId: IdLike;
   messageId: IdLike;
   className?: string;
 }) {
   const { isStarred, toggleStar } = useStars(conversationId);
   const starred = isStarred(messageId);
 
   return (
     <button
       type="button"
       onClick={(e) => {
         e.preventDefault();
         e.stopPropagation();
         toggleStar(messageId);
       }}
       aria-pressed={starred}
       title={starred ? "Unstar" : "Star"}
       className={
         "opacity-0 group-hover:opacity-100 transition-opacity text-yellow-500/80 hover:text-yellow-500 focus:opacity-100 "  +
         (className ?? "")
       }
     >
       <span className="text-lg leading-none">{starred ? "★" : "☆"}</span>
     </button>
   );
 }
 


│  ├─ gitchat
│  │  └─ ReceiptChip.tsx

-lib/gitchat/policies.ts: 
 import { prisma } from "@/lib/prismaclient";
 
 // Baseline policy: message author or conversation moderator can merge.
 export async function canMerge_ownerOrMod(userId: bigint, messageId: bigint): Promise<boolean> {
   const msg = await prisma.message.findUnique({
     where: { id: messageId },
     select: { sender_id: true, conversation_id: true },
   });
   if (!msg) return false;
   if (String(msg.sender_id) === String(userId)) return true;
   // Heuristic: check ConversationParticipant role if you have it, else grant to room creator (cheap baseline).
   const part = await prisma.conversationParticipant.findFirst({
     where: { conversation_id: msg.conversation_id, user_id: userId },
     select: { role: true },
   }).catch(() => null as any);
   const role = (part as any)?.role ?? "";
   return ["MOD", "ADMIN", "OWNER"].includes(String(role).toUpperCase());
 }
 
 export type MergePolicyId = "owner-or-mod@v1";
 export const DefaultMergePolicy: MergePolicyId = "owner-or-mod@v1";
 
 export async function checkMergeAllowed(policy: MergePolicyId, userId: bigint, messageId: bigint) {
   switch (policy) {
     case "owner-or-mod@v1":
     default:
       return canMerge_ownerOrMod(userId, messageId);
   }
 }

-ReceiptChip.tsx: 
 "use client";
 import React from "react";
 
 export default function ReceiptChip({ messageId, latest }: { messageId: string; latest: any }) {
   if (!latest) return null;
   const t = new Date(latest.merged_at || latest.mergedAt).toLocaleString();
   return (
     <div className="mt-1 text-[11px] text-slate-500">
       v{latest.v} • merged {t}{" "}
       <a
         className="underline"
         href={`/m/${encodeURIComponent(messageId)}/compare?v=${latest.v}`}
         target="_blank"
         rel="noreferrer"
       >
         view
       </a>
     </div>
   );
 }


│  ├─ proposals
│  │  └─ ProposalsCompareModal.tsx

-ProposalsCompareModal.tsx: "use client";
import * as React from "react";
import useSWR from "swr";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function ProposalsCompareModal({
  open,
  onClose,
  rootMessageId,
  conversationId,    // required for signals
  currentUserId,
  onOpenDrift,       // not used yet, but keep for future
  onMerged,
}: {
  open: boolean;
  onClose: () => void;
  rootMessageId: string;
  conversationId: string;
  currentUserId: string;
  onOpenDrift: (driftId: string) => void;
  onMerged?: () => void;
}) {
  // ---- Counts (✅/⛔) via SWR; non-blocking
  const { data: listData, mutate: mutateCounts } = useSWR(
    open ? `/api/proposals/list?rootMessageId=${encodeURIComponent(rootMessageId)}` : null,
    fetcher
  );
  const counts = listData?.counts ?? {};

  // ---- Candidates (what you render)
  const [candidates, setCandidates] = React.useState<any[]>([]);
  const [candLoading, setCandLoading] = React.useState(false);
  const [candErr, setCandErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setCandLoading(true);
    setCandErr(null);
    fetch(`/api/proposals/candidates?rootMessageId=${encodeURIComponent(rootMessageId)}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : r.text().then((t) => Promise.reject(new Error(t)))))
      .then((d) => setCandidates(Array.isArray(d?.items) ? d.items : []))
      .catch((e) => setCandErr(e?.message || "Failed to load proposals"))
      .finally(() => setCandLoading(false));
  }, [open, rootMessageId]);

  // ✅ signals for Approve/Block/Clear
  async function signal(facetId: string, kind: "APPROVE" | "BLOCK" | "CLEAR") {
    try {
      await fetch(`/api/proposals/signal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: rootMessageId, conversationId, facetId, kind }),
      });
      mutateCounts(); // refresh counts; candidates list can stay as-is
    } catch {
      // non-blocking; counts will refresh on broadcast too
    }
  }

  async function mergeFacet(facetId: string) {
    const resp = await fetch(`/api/proposals/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rootMessageId, facetId }),
    });
    if (!resp.ok) {
      alert(await resp.text());
      return;
    }
    onMerged?.();
    onClose();
  }

  async function mergeMessage(messageId: string) {
    const resp = await fetch(`/api/proposals/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rootMessageId, proposalMessageId: messageId }),
    });
    if (!resp.ok) {
      alert(await resp.text());
      return;
    }
    onMerged?.();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40">
      <div className="w-[720px] max-w-[95vw] rounded-xl bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Compare Proposals</h2>
          <button className="text-sm px-2 py-1 rounded bg-slate-100" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="mt-3">
          {candLoading ? (
            <div className="text-sm text-slate-600">Loading…</div>
          ) : candErr ? (
            <div className="text-sm text-red-600">{candErr}</div>
          ) : candidates.length === 0 ? (
            <div className="text-sm text-slate-600">No proposals yet.</div>
          ) : (
            <div className="space-y-2">
              {candidates.map((c) => {
                const key = c.kind === "FACET" ? `f:${c.facetId}` : `m:${c.messageId}`;
                // counts only for facets; for TEXT candidates we don’t render counts
                const ctn = c.kind === "FACET" ? counts[c.facetId as string] || { approve: 0, block: 0 } : null;

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{c.previewTitle || c.authorName}</div>
                      <div className="text-xs text-slate-500">
                        {c.authorName} • {new Date(c.createdAt).toLocaleString()}
                      </div>
                      <div className="text-sm mt-1 line-clamp-3">{c.preview}</div>
                      {c.kind === "FACET" && (
                        <div className="mt-1 text-xs text-slate-600">
                          ✅ {ctn!.approve} · ⛔ {ctn!.block}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {c.kind === "FACET" ? (
                        <>
                          <button
                            className="text-xs rounded-md border px-2 py-1 bg-white hover:bg-slate-100"
                            onClick={() => signal(c.facetId, "APPROVE")}
                          >
                            Approve
                          </button>
                          <button
                            className="text-xs rounded-md border px-2 py-1 bg-white hover:bg-slate-100"
                            onClick={() => signal(c.facetId, "BLOCK")}
                          >
                            Request changes
                          </button>
                          <button
                            className="text-xs rounded-md border px-2 py-1 bg-white/60 hover:bg-slate-100"
                            onClick={() => signal(c.facetId, "CLEAR")}
                          >
                            Clear
                          </button>
                          <button
                            className="text-xs rounded-md border px-2 py-1 bg-emerald-50 hover:bg-emerald-100"
                            onClick={() => mergeFacet(c.facetId)}
                          >
                            ✅ Merge facet
                          </button>
                        </>
                      ) : (
                        <button
                          className="text-xs rounded-md border px-2 py-1 bg-emerald-50 hover:bg-emerald-100"
                          onClick={() => mergeMessage(c.messageId)}
                        >
                          ✅ Merge
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Tip: Merging updates the original message. Receipts keep a signed history (vN).
        </p>
      </div>
    </div>
  );
}


│  ├─ sheaf
│  │  ├─ AttachmentList.tsx
│  │  ├─ AudiencePickers.tsx
│  │  ├─ ConflictBanner.tsx
│  │  ├─ FacetChipBar.tsx
│  │  ├─ FacetEditor.tsx
│  │  ├─ FacetEditorTabs.tsx
│  │  ├─ SheafComposer.tsx
│  │  ├─ SheafFacetPills.tsx
│  │  ├─ SheafMessageBubble.tsx
│  │  ├─ ViewAsBar.tsx
│  │  └─ ViewAsMenu.tsx

-components/sheaf/AttachmentList.tsx: 'use client';
import * as React from 'react';
import type { UIAttachment } from './FacetChipBar';

export function AttachmentList({
  items, onRemove, onUploadOne,
}: {
  items: UIAttachment[];
  onRemove: (sha256: string) => void;
  onUploadOne?: (att: UIAttachment) => Promise<{ path: string }>;
}) {
  const [busy, setBusy] = React.useState<string | null>(null);

  async function handleUpload(a: UIAttachment) {
    if (!onUploadOne || !a.file) return;
    setBusy(a.sha256);
    try {
      const { path } = await onUploadOne(a);
      a.path = path; // mutate local copy; parent holds reference
    } finally {
      setBusy(null);
    }
  }

  if (!items?.length) return null;
  return (
    <div className="rounded-md border bg-white/60 p-2 text-xs">
      <div className="mb-1 font-medium">Attachments</div>
      <ul className="space-y-1">
        {items.map((a) => (
          <li key={a.sha256} className="flex items-center gap-2">
            <span className="truncate">{a.name}</span>
            <span className="text-slate-500">({Math.ceil(a.size/1024)} KB)</span>
            {a.path
              ? <span className="ml-auto px-2 py-0.5 rounded bg-green-100 text-green-800">uploaded</span>
              : <button
                  type="button"
                  onClick={() => handleUpload(a)}
                  disabled={!onUploadOne || !a.file || busy === a.sha256}
                  className="ml-auto px-2 py-0.5 rounded bg-white/70 border"
                >
                  {busy === a.sha256 ? 'Uploading…' : 'Upload'}
                </button>}
            <button type="button" className="px-2 py-0.5 rounded bg-white/70 border" onClick={() => onRemove(a.sha256)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}


-AudiencePickers.tsx: 'use client';

import * as React from 'react';
import type { AudienceSelector } from '@app/sheaf-acl';

export function AudiencePicker(props: {
  value: AudienceSelector;
  onChange: (a: AudienceSelector) => void;
  authorId: string | number;
  conversationId: string | number;
}) {
  const { value, onChange, authorId, conversationId } = props;
  const [kind, setKind] = React.useState<AudienceSelector['kind']>(value.kind);
  const [role, setRole] = React.useState(value.kind === 'ROLE' ? value.role : 'MOD');
  const [lists, setLists] = React.useState<{ id: string; name: string }[]>([]);
  const [listId, setListId] = React.useState(
    value.kind === 'LIST' ? value.listId : ''
  );
  const [mode, setMode] = React.useState<'DYNAMIC' | 'SNAPSHOT'>(
    value.kind === 'LIST' || value.kind === 'USERS' ? value.mode : 'SNAPSHOT'
  );
  const [people, setPeople] = React.useState<{ id: string; name: string }[]>(
    []
  );
  const [userIds, setUserIds] = React.useState<string[]>(
    value.kind === 'USERS' ? (value.userIds ?? []) : []
  );

  // load lists for author
  React.useEffect(() => {
    fetch(`/api/sheaf/lists?ownerId=${authorId}`)
      .then((r) => r.ok ? r.json() : { lists: [] })
      .then((d) => setLists(d.lists ?? []))
      .catch(() => {});
  }, [authorId]);

  // load participants for users picker
  React.useEffect(() => {
    fetch(`/api/sheaf/participants?conversationId=${conversationId}`)
      .then((r) => r.ok ? r.json() : { users: [] })
      .then((d) =>
            setPeople((d.users ?? []).map((u: any) => ({
              id: String(u.id),
              name: u.name ?? "User",
            })))
          )
      .catch(() => {});
  }, [conversationId]);

  React.useEffect(() => {
    switch (kind) {
      case 'EVERYONE':
        onChange({ kind: 'EVERYONE' });
        break;
      case 'ROLE':
        onChange({ kind: 'ROLE', role });
        break;
      case 'LIST':
        onChange({ kind: 'LIST', listId, mode });
        break;
      case 'USERS':
        onChange({ kind: 'USERS', mode, userIds });
        break;
    }
  }, [kind, role, listId, mode, userIds, onChange]);

  return (
    <div className="flex flex-wrap items-center gap-6">
      <select
                               className="text-xs lockbutton rounded-xl px-2 py-1 bg-white/70"

        value={kind}
        onChange={(e) => setKind(e.target.value as any)}
      >
        <option value="EVERYONE">Everyone</option>
        <option value="ROLE">Role</option>
        <option value="LIST">List</option>
        <option value="USERS">Specific people</option>
      </select>

      {kind === 'ROLE' && (
        <select
        className="text-xs lockbutton rounded-xl px-2 py-1 bg-white/70"
        value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="MOD">MOD</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      )}

      {kind === 'LIST' && (
        <>
          <select
                               className="text-xs lockbutton rounded-xl px-2 py-1 bg-white/70"
                               value={listId}
            onChange={(e) => setListId(e.target.value)}
          >
            <option value="">— choose list —</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <select
                               className="text-xs lockbutton rounded-xl px-2 py-1 bg-white/70"
                               value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            title="Snapshot = freeze membership at send time"
          >
            <option value="SNAPSHOT">Snapshot</option>
            <option value="DYNAMIC">Dynamic</option>
          </select>
        </>
      )}

      {kind === 'USERS' && (
        <>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto rounded-md border bg-white/70 px-2 py-2">
      {people.map((p) => {
        const checked = userIds.includes(p.id);
        return (
          <label key={p.id} className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              className="h-3.5 w-3.5"
              checked={checked}
              onChange={(e) =>
                setUserIds((prev) =>
                  e.target.checked ? [...prev, p.id] : prev.filter((id) => id !== p.id)
                )
              }
            />
            <span className="truncate">{p.name}</span>
          </label>
        );
      })}
    </div>
          <select
                               className="text-xs lockbutton rounded-xl px-2 py-1 bg-white/70"
                               value={mode}
            onChange={(e) => setMode(e.target.value as any)}
          >
            <option value="SNAPSHOT">Snapshot</option>
            <option value="DYNAMIC">Dynamic</option>
          </select>
        </>
      )}
    </div>
  );
}


-ConflictBanner: 'use client';
import * as React from 'react';

export function ConflictBanner({
  conflicts,
  onJumpToFacetIndex,
}: {
  conflicts: Array<{ aFacetId: string; bFacetId: string; severity: 'WARN'|'HIGH'|'INFO'; note: string }> | undefined;
  onJumpToFacetIndex: (idx: number) => void;
}) {
  if (!conflicts || conflicts.length === 0) return null;
  const issues = conflicts.filter(c => c.severity !== 'INFO');
  if (issues.length === 0) return null;

  return (
    <div className="rounded-lg border px-3 py-2 bg-amber-50 text-amber-900 text-xs">
      <div className="font-medium mb-1">Potential facet conflicts</div>
      <ul className="space-y-1">
        {issues.map((c, i) => {
          // IDs are "draft_f_<index>" from the preview builder
          const ai = Number(c.aFacetId.replace('draft_f_', ''));
          const bi = Number(c.bFacetId.replace('draft_f_', ''));
          return (
            <li key={i} className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded ${c.severity === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                {c.severity}
              </span>
              <span className="truncate">{c.note}</span>
              <button className="ml-auto underline" onClick={() => onJumpToFacetIndex(ai)}>Go to A</button>
              <button className="underline" onClick={() => onJumpToFacetIndex(bi)}>Go to B</button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}


-FacetChipBar.tsx: 'use client';
import * as React from 'react';

export type AudienceSelector =
  | { kind: 'EVERYONE' }
  | { kind: 'ROLE'; role: string; mode: 'DYNAMIC' }
  | { kind: 'LIST'; listId: string; mode: 'DYNAMIC' | 'SNAPSHOT' }
  | { kind: 'USERS'; mode: 'SNAPSHOT' | 'DYNAMIC'; userIds?: string[]; snapshotMemberIds?: string[] };

  export type UIAttachment = {
    name: string;
    mime: string;
    size: number;
    sha256: string;
    path?: string | null;
    file?: File; // local only
  };

export type FacetDraft = {
  id: string;                // local id
  audience: AudienceSelector;
  policy: 'ALLOW'|'REDACT'|'FORBID';
  expiresAt?: number | null;
  body: any;                 // your TipTap JSON
  attachments?: UIAttachment[];
};

export function FacetChipBar({
  facets, onChange, onAddFacet, onRemoveFacet, activeIndex, onActiveIndex,
}: {
  facets: FacetDraft[];
  onChange: (next: FacetDraft[]) => void;
  onAddFacet: (audience: AudienceSelector) => void;
  onRemoveFacet: (idx: number) => void;
  activeIndex: number;
  onActiveIndex: (idx: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {facets.map((f, i) => {
        const label =
          f.audience.kind === 'EVERYONE' ? 'Everyone' :
          f.audience.kind === 'ROLE' ? `Role:${f.audience.role}` :
          f.audience.kind === 'LIST' ? f.audience.listId :
          'Direct';
        return (
          <button
            type="button"
            key={f.id}
            className={`px-2 py-1 rounded-full text-xs ${i===activeIndex ? 'bg-black text-white' : 'bg-white/70'}`}
            onClick={() => onActiveIndex(i)}
          >
            {label}
          </button>
        );
      })}
      <div className="flex-1" />
      <div className="flex items-center gap-1">
        <button type="button" className="px-2 py-1 rounded bg-white/70 text-xs" onClick={() => onAddFacet({ kind: 'EVERYONE' })}>+ Everyone</button>
        <button type="button" className="px-2 py-1 rounded bg-white/70 text-xs" onClick={() => onAddFacet({ kind: 'LIST', listId: 'core_team', mode: 'SNAPSHOT' })}>+ Core</button>
        <button type="button" className="px-2 py-1 rounded bg-white/70 text-xs" onClick={() => onAddFacet({ kind: 'ROLE', role: 'MOD', mode: 'DYNAMIC' })}>+ Mod</button>
      </div>
    </div>
  );
}


-FacetEditor.tsx: 'use client';

import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export type JSONContent = Record<string, any>;

export function FacetEditor(props: {
  value: JSONContent | null;
  onChange: (next: JSONContent) => void;
  placeholder?: string;
}) {
  const { value, onChange, placeholder } = props;

  const editor = useEditor({
    extensions: [StarterKit],
    content: value ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as JSONContent);
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    // external updates
    if (value) editor.commands.setContent(value as any, false);
  }, [value, editor]);

  return (
    <div className="rounded-xl text-[.87rem] bg-white/50 px-3 py-2 modalfield ">
   
      <EditorContent editor={editor} />
    </div>
  );
}


-FacetEditorTabs.tsx: 'use client';
import * as React from 'react';
import type { FacetDraft } from './FacetChipBar';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';

function asTipTapContent(body: any) {
  // If you already store TipTap JSON, pass it through.
  if (body && typeof body === 'object' && ('type' in body || 'content' in body)) return body;
  // Fallback: plain text -> paragraph doc
  const text = typeof body?.text === 'string' ? body.text : (typeof body === 'string' ? body : '');
  return { type: 'doc', content: [{ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }] };
}

export function FacetEditorTabs({
  facets, activeIndex, onFacetChange,
}: {
  facets: FacetDraft[];
  activeIndex: number;
  onFacetChange: (idx: number, patch: Partial<FacetDraft>) => void;
}) {
  const f = facets[activeIndex];
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: true, autolink: true }),
    ],
    content: asTipTapContent(f?.body),
    onUpdate({ editor }) {
      onFacetChange(activeIndex, { body: editor.getJSON() });
    },
    editorProps: {
      attributes: {
        class: 'min-h-[120px] border rounded p-2 bg-white/90 prose prose-sm focus:outline-none',
      },
    },
  }, [activeIndex]);

  // Update editor when you switch tabs/facets
  React.useEffect(() => {
    if (editor && f) editor.commands.setContent(asTipTapContent(f.body), false, { preserveWhitespace: 'full' });
  }, [activeIndex, f?.id]); // eslint-disable-line

  if (!f) return null;

  return (
    <div className="mt-3 space-y-3">
      <div className="flex gap-2 items-center">
        <label className="text-xs">Policy:</label>
        <select
          className="text-xs border rounded px-2 py-1 bg-white/70"
          value={f.policy}
          onChange={(e) => onFacetChange(activeIndex, { policy: e.target.value as any })}
        >
          <option value="ALLOW">Allow</option>
          <option value="REDACT">Require Redact</option>
          <option value="FORBID">Forbid</option>
        </select>

        <label className="ml-3 text-xs">Expire:</label>
        <select
          className="text-xs border rounded px-2 py-1 bg-white/70"
          value={f.expiresAt ?? 0}
          onChange={(e) => {
            const v = Number(e.target.value);
            onFacetChange(activeIndex, { expiresAt: v === 0 ? null : Date.now() + v });
          }}
        >
          <option value={0}>Off</option>
          <option value={3600_000}>1h</option>
          <option value={86_400_000}>1d</option>
        </select>
      </div>

      {/* Toolbar (minimal) */}
      <div className="flex items-center gap-1 text-xs">
        <button onClick={() => editor?.chain().focus().toggleBold().run()} className="px-2 py-1 rounded bg-white/70">B</button>
        <button onClick={() => editor?.chain().focus().toggleItalic().run()} className="px-2 py-1 rounded bg-white/70"><i>I</i></button>
        <button onClick={() => editor?.chain().focus().toggleUnderline().run()} className="px-2 py-1 rounded bg-white/70"><u>U</u></button>
        <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className="px-2 py-1 rounded bg-white/70">• List</button>
        <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} className="px-2 py-1 rounded bg-white/70">1. List</button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}


-SheafComposer.tsx: 

'use client';

import * as React from 'react';
import type { AudienceSelector } from '@app/sheaf-acl';
import { priorityRank } from '@app/sheaf-acl';
import { FacetEditor, type JSONContent } from './FacetEditor';
import { AudiencePicker } from './AudiencePickers';
import { ViewAsBar } from './ViewAsBar';
import { sha256Hex } from '@/lib/crypto/sha256';
import { useChatStore } from "@/contexts/useChatStore";
import Image from 'next/image';

type SharePolicy = 'ALLOW'|'REDACT'|'FORBID';

type FacetDraft = {
  id: string;
  audience: AudienceSelector;
  sharePolicy: SharePolicy;
  body: JSONContent | null;

  attachments: {
    name: string;
    mime: string;
    size: number;
    sha256: string;
    path?: string | null;
    blobId?: string | null;
  }[];
};

export function SheafComposer(props: {
  threadId: string|number;
  authorId: string|number;
  onSent?: (res: { messageId: string }) => void;
  onCancel?: () => void;
}) {
  const { threadId, authorId, onSent, onCancel } = props;
  const appendMessage = useChatStore(s => s.appendMessage);
  const [facets, setFacets] = React.useState<FacetDraft[]>([{
    id: crypto.randomUUID(),
    audience: { kind: 'EVERYONE' },
    sharePolicy: 'ALLOW',
    body: null,
    attachments: [],
  }]);

  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const updateFacet = (id: string, patch: Partial<FacetDraft>) => {
    setFacets(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  };

  const addFacet = (audience: AudienceSelector) => {
    setFacets(prev => [...prev, {
      id: crypto.randomUUID(),
      audience,
      sharePolicy: audience.kind === 'EVERYONE' ? 'ALLOW' : 'REDACT',
      body: null,
      attachments: [],
    }]);
  };

  const removeFacet = (id: string) => {
    setFacets(prev => prev.length === 1 ? prev : prev.filter(f => f.id !== id));
  };

  function defaultFacetIndex(): number {
    let best = 0;
    let bestRank = priorityRank(facets[0].audience as any);
    for (let i = 1; i < facets.length; i++) {
      const r = priorityRank(facets[i].audience as any);
      if (r < bestRank) { best = i; bestRank = r; }
    }
    return best;
  }

  async function handleUploadFiles(fid: string, files: FileList | null) {
    if (!files || files.length === 0) return;
    const out: FacetDraft['attachments'] = [];

    for (const f of Array.from(files)) {
      const sha = await sha256Hex(f);
      const form = new FormData();
      form.set('file', f);
      const res = await fetch('/api/sheaf/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok && data?.ok) {
        out.push({
          name: data.blob.name ?? f.name,
          mime: data.blob.mime ?? f.type,
          size: data.blob.size ?? f.size,
          sha256: data.blob.sha256 ?? sha,
          path: data.blob.path ?? null,
          blobId: data.blob.id ?? null,
        });
      }
    }

    setFacets(prev => prev.map(x => x.id === fid ? { ...x, attachments: [...x.attachments, ...out] } : x));
  }

  function removeAttachment(fid: string, idx: number) {
    setFacets(prev => prev.map(x => {
      if (x.id !== fid) return x;
      const next = x.attachments.slice();
      next.splice(idx, 1);
      return { ...x, attachments: next };
    }));
  }

  async function send() {
    setError(null);

    const hasContent = facets.some(f => (f.body && JSON.stringify(f.body) !== '{}') || f.attachments.length > 0);
    if (!hasContent) {
      setError('Add some content in at least one layer (or an attachment).');
      return;
    }

    const payload = {
      conversationId: threadId,
      authorId,
      text: null,
      facets: facets.map(f => ({
        audience: f.audience,
        sharePolicy: f.sharePolicy,
        body: f.body ?? { type: 'doc', content: [{ type: 'paragraph' }] },
        attachments: f.attachments,
      })),
      defaultFacetIndex: defaultFacetIndex(),
    };

    try {
      setSending(true);
      const res = await fetch("/api/sheaf/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send");
      
      const msg = data.message ?? data; // tolerate either shape
      appendMessage(String(threadId), msg);
      onSent?.({ messageId: String(msg.id) });
      
      
    } catch (e: any) {
      setError(e?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
    
  }
  

  return (
<div className="space-y-4  ">
          {/* View-as (preview which layers are visible for common audiences) */}
      <ViewAsBar
        facets={facets.map(f => ({
          id: f.id,
          audience: f.audience,
          sharePolicy: f.sharePolicy,
          body: f.body ?? { type: 'doc', content: [{ type: 'paragraph' }] },
          attachments: f.attachments,
        }))}
        authorId={authorId}
      />
{/* Add this block just before the facets map */}
<div className="sticky flex w-full flex-1 rounded-lg top-0 z-10 shadow-lg bg-indigo-300 px-3 py-3  h-fit">
    
      <p className="  text-sm py-1 w-fit h-fit text-slate-800   whitespace-nowrap font-medium">Add layer: </p>
<div className='flex w-fit gap-3 ml-2 '>
  <button
    type="button"
    className="flex  px-2 py-0 align-center w-full  rounded-xl lockbutton border bg-white/70 text-xs"
    onClick={() => addFacet({ kind: 'EVERYONE' })}
    disabled={sending}
  >
    <p className='flex text-center whitespace-nowrap mx-auto w-full justify-center align-center my-auto'>+ Public</p>
  </button>

  <button
    type="button"
    className="flex  px-2 py-0 align-center w-full  rounded-xl lockbutton border bg-white/70 text-xs"
    onClick={() => addFacet({ kind: 'ROLE', role: 'MOD', mode: 'DYNAMIC' })}
    disabled={sending}
  >
        <p className='flex text-center whitespace-nowrap mx-auto w-full justify-center align-center my-auto'>+ Role: Mod</p>
  </button>

  <button
    type="button"
    className="flex  px-2 py-0 align-center w-full whitespace-nowrap rounded-xl lockbutton border bg-white/70 text-xs"
    onClick={() => addFacet({ kind: 'LIST', listId: 'core_team', mode: 'SNAPSHOT' })}
    disabled={sending}
    title="Snapshot freezes membership at send"
  >
            <p className='flex text-center whitespace-nowrap mx-auto w-full justify-center align-center my-auto'>+ List: Core Team</p>


  </button>

  <button
    type="button"
    className="flex  px-2 py-0 align-center w-full  rounded-xl lockbutton border bg-white/70 text-xs"
    onClick={() => addFacet({ kind: 'USERS', mode: 'SNAPSHOT', snapshotMemberIds: [] })}
    disabled={sending}
    title="Add specific people (choose in the Audience picker below)"
  >
            <p className='flex text-center whitespace-nowrap mx-auto w-full justify-center align-center my-auto'>+ Choose People</p>

  </button>
  </div>
</div>
      {/* Facets */}
      <div className="space-y-4 ">
        {facets.map((f, idx) => (
          <div key={f.id} className="rounded-xl shadow-lg bg-indigo-100/80 py-4 px-5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[.95rem] tracking-wide font-semibold px-1 text-slate-800">
                <strong>Layer {idx + 1}</strong>
              </div>
              <button
                type="button"
                className="text-xs align-center my-auto text-center bg-rose-500 text-slate-100 px-2 py-1 rounded-xl lockbutton"
                disabled={facets.length === 1 || sending}
                onClick={() => removeFacet(f.id)}
              >
                Remove
              </button>
            </div>
<div className='flex flex-col gap-3'>
            <div className="flex flex-col">
              <div className="text-sm ml-1 mt-1 font-medium text-slate-800 mb-1">Audience</div>
              <AudiencePicker
                value={f.audience}
                onChange={(aud) => updateFacet(f.id, { audience: aud })}
                authorId={authorId}
                conversationId={threadId}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-1 ">Share Policy</label>
              <select
                               className="text-xs lockbutton w-fit rounded-xl px-2 py-1 bg-white/70"


                value={f.sharePolicy}
                onChange={(e) => updateFacet(f.id, { sharePolicy: e.target.value as SharePolicy })}
                disabled={sending}
              >
                <option value="ALLOW">Allow</option>
                <option value="REDACT">Require Redact</option>
                <option value="FORBID">Forbid</option>
              </select>
            </div>
            </div>

<div className="flex gap-3 mt-4 w-full">
         

            {/* attachments */}
            <button
              type="button"
              aria-label="Attach Files"
              className=" rounded-full flex  align-center bg-white/70 lockbutton h-fit  w-fit text-black tracking-widest sheaf-button mt-1 px-2 py-2"
            >
              <input
                type="file"
                multiple
                accept="image/*,application/pdf,application/zip"
                onChange={(e) => handleUploadFiles(f.id, e.target.files)}
                className="hidden"
              />
              <Image
                src="/assets/attachment.svg"
                alt="share"
                width={20}
                height={20}
                className="cursor-pointer object-contain flex align-center justify-center items-center "
              />
            </button>
            <div className=" h-full w-full">
              <FacetEditor
                value={f.body}
                onChange={(json) => updateFacet(f.id, { body: json })}
                placeholder="Write the content for this layer…"
              />
            </div>
            </div>
        
              {f.attachments.length > 0 && (
                <ul className="mt-1 text-xs text-slate-700 space-y-1">
                  {f.attachments.map((a, i) => (
                    <li key={i} className="flex items-center justify-between gap-2">
                      <span className="truncate">{a.name} <span className="text-slate-400">({a.mime}, {a.size}b)</span></span>
                      <button
                        type="button"
                        className="px-1 py-0.5 rounded border"
                        onClick={() => removeAttachment(f.id, i)}
                      >
                        remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
        ))}
      </div>

      {/* Footer */}
      {error && <div className="text-xs text-rose-600">{error}</div>}
      <div className="flex items-center gap-4  pb-3">
        <button type="button" onClick={onCancel} className="px-4 py-3 rounded-xl tracking-wide lockbutton bg-white/70 text-sm" disabled={sending}>
        𒁈
        </button>
        <button
          type="button"
          onClick={send}
          className={sending ? 'px-4 py-3 rounded-xl tracking-wide lockbutton text-sm opacity-60 cursor-not-allowed bg-indigo-300' : 'px-3 py-3 tracking-wide rounded-xl lockbutton text-sm bg-indigo-500 text-white'}
          disabled={sending}
        >
          {sending ? 'Sending…' : '𒓳𒓵'}
        </button>
      </div>
    </div>
  );
}


-SheafFacetPills.tsx: "use client";
import clsx from "clsx";

export function SheafFacetPills({
  facets,
  activeId,
  onSelect,
}: {
  facets: { id: string; audience: { kind: string; role?: string } }[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mb-1.5 flex flex-wrap gap-1 text-[11px] text-slate-600">
      {facets.map(f => (
        <button
          key={f.id}
          type="button"
          onClick={() => onSelect(f.id)}
          className={clsx(
            "px-2 py-0.5 rounded-full border transition",
            activeId === f.id ? "bg-slate-100 border-slate-300" : "bg-white border-slate-200 hover:bg-slate-50"
          )}
        >
          {label(f.audience)}
        </button>
      ))}
    </div>
  );
}

function label(a: { kind: string; role?: string }) {
  switch (a.kind) {
    case "EVERYONE": return "Public";
    case "ROLE": return `Role: ${a.role}`;
    case "LIST": return "List";
    case "USERS": return "Specific";
    default: return a.kind;
  }
}


-SheafMessageBubble.tsx: "use client";

import * as React from "react";
import type { CSSProperties } from "react";
import { ReactionSummary } from "../reactions/ReactionSummary";
import { ReactionTrigger } from "../reactions/ReactionTrigger";


type FacetDTO = {
  id: string;
  audience: any;
  sharePolicy: "ALLOW" | "REDACT" | "FORBID";
  expiresAt: string | null;
  body: any;
  attachments?: { id?: string; name?: string; mime?: string; size?: number; path?: string; sha256?: string }[];
  priorityRank: number;
  createdAt: string;
};


function textFromTipTap(node: any): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (node.text) return node.text;
  if (Array.isArray(node.content)) return node.content.map(textFromTipTap).join("");
  if (typeof node === "object") return textFromTipTap(node.content);
  return "";
}

function renderBody(body: any) {
  if (!body) return null;

  // 1) Simple shape: { text: "..." }
  if (typeof body === "object" && typeof body.text === "string") {
    return <p className="whitespace-pre-wrap">{body.text}</p>;
  }

  // 2) TipTap JSON: { type:"doc", content:[...] }
  if (typeof body === "object" && body.type === "doc") {
    const txt = textFromTipTap(body);
    if (txt.trim().length > 0) {
      return <p className="whitespace-pre-wrap">{txt}</p>;
    }
  }

  // 3) Fallback (visible during dev only)
  try {
    const short = JSON.stringify(body);
    return <pre className="text-xs text-slate-500 overflow-x-auto">{short}</pre>;
  } catch {
    return null;
  }
}

export function SheafMessageBubble(props: {
  messageId: string;
  conversationId: string;
  currentUserId: string;
  facets: FacetDTO[];
  defaultFacetId?: string | null;
  style?: CSSProperties;
  className?: string;
}) {
  // const { facets, defaultFacetId } = props;
  const { messageId, conversationId, currentUserId, facets, defaultFacetId } = props;
  const [activeId, setActiveId] = React.useState<string>(() => {
    if (!facets?.length) return '';
    const byId = new Set(facets.map(f => f.id));
    if (defaultFacetId && byId.has(defaultFacetId)) return defaultFacetId;
    // fall back to most-private (lowest priorityRank)
    return [...facets].sort((a,b) => a.priorityRank - b.priorityRank)[0].id;
  });
  // const [activeId, setActiveId] = React.useState<string | null>(
    // defaultFacetId ?? facets[0]?.id ?? null
  
    React.useEffect(() => {
      if (!facets?.length) return;
      const byId = new Set(facets.map(f => f.id));
      if (defaultFacetId && byId.has(defaultFacetId)) setActiveId(defaultFacetId);
    }, [defaultFacetId, facets]);
  
    const active = facets.find(f => f.id === activeId) ?? facets[0];

  if (!active) return null;

  return (
    <>
    <div className= "bg-slate-50  rounded-lg px-4   h-fit align-center  py-[1.2px] tracking-wide max-w-[60%]   bg-opacity-70 chat-bubble outline-transparent text-[.9rem]  text-slate-950 dark:bg-slate-50 dark:text-slate-900">
      {facets.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {facets.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveId(f.id)}
              className={[
                "text-[.9rem] ",
                f.id === activeId ? "bg-indigo-500 text-white" : "bg-white/80",
              ].join(" ")}
              title={
                typeof f.audience === "object" && f.audience?.kind
                  ? `Layer: ${f.audience.kind}`
                  : "Layer"
              }
            >
              {f.audience?.kind === "EVERYONE"
                ? "Everyone"
                : f.audience?.kind === "ROLE"
                ? `Role: ${f.audience?.role ?? "?"}`
                : f.audience?.kind === "LIST"
                ? `List: ${f.audience?.listId ?? "?"}`
                : f.audience?.kind === "USERS"
                ? "Specific people"
                : "Layer"}
            </button>
          ))}
        </div>
      )}

      {/* Body */}
      <div>{renderBody(active.body)}</div>

      {/* Facet-level attachments (optional) */}
      {Array.isArray(active.attachments) && active.attachments.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs">
          {active.attachments.map((a, i) => (
            <li key={a.sha256 ?? a.id ?? i} className="flex items-center gap-2">
              <span>📎</span>
              <span className="truncate">
                {a.name ?? a.path ?? a.sha256 ?? "file"}{" "}
                {typeof a.size === "number" && (
                  <span className="text-slate-400">({(a.size / 1024).toFixed(1)} KB)</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

          
    </div>
  
    </>
  );
}


-// components/sheaf/ViewAsBar.tsx
'use client';

import * as React from 'react';

export function ViewAsBar(props: {
  facets: { id: string; audience: any; sharePolicy?: string; body: any; attachments?: any[] }[];
  authorId: string|number;
  onResult?: (r: { visible: string[]; defaultFacetId: string|null }) => void;
}) {
  const { facets, authorId, onResult } = props;
  const [who, setWho] = React.useState<'everyone'|'mod'|'me'>('me');
  const [result, setResult] = React.useState<{ visible: string[]; defaultFacetId: string|null } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const viewer =
        who === 'everyone' ? { everyone: true } :
        who === 'mod' ? { role: 'MOD' } :
        { userId: authorId };

      const res = await fetch('/api/sheaf/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewer, facets }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // ignore parse errors; we’ll show a soft error
      }

      if (!res.ok) {
        setErr(typeof data?.error === 'string' ? data.error : 'Preview failed');
        setResult(null);
        return;
      }

      setResult(data);
      onResult?.(data);
    } catch (e: any) {
      setErr(e?.message || 'Network error');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [who, JSON.stringify(facets)]);

  return (
    <div className="rounded-lg  bg-transparent text-indigo-300 px-3 py-0 text-sm flex items-center gap-2">
      <span className="font-medium">Preview as:</span>
      <select
        className="rounded-md text-indigo-900 text-xs lockbutton  px-3 py-1 bg-white/80 tracking-wide focus:border-none focus:outline-none"
        value={who}
        onChange={(e) => setWho(e.target.value as any)}
      >
        <option value="me">You (author)</option>
        <option value="mod">Role: MOD</option>
        <option value="everyone">Everyone</option>
      </select>
      {loading && <span>Calculating…</span>}
      {!loading && err && <span className="text-rose-700">• {err}</span>}
      {!loading && !err && result && (
        <>
        <span className='ml-2 text-sm font-bold'>
        ¦

        </span>
                  <span className='ml-2 text-sm'>

           Visible layers: <strong>{result.visible.length}</strong>
          {result.defaultFacetId ? ` • default: ${result.defaultFacetId}` : null}
        </span>
        </>
      )}
    </div>
  );
}


-ViewAsMenu.tsx: 'use client';
import * as React from 'react';
import { useSheafPreview } from '@/hooks/useSheafPreview';
import type { FacetDraft } from './FacetChipBar';

export function ViewAsMenu({
  draft, threadId, authorId, candidates,
}: {
  draft: FacetDraft[];
  threadId: string | number;
  authorId: string | number;
  candidates: Array<{ id: string; label: string; type: 'user'|'role'|'everyone' }>;
}) {
  const [as, setAs] = React.useState<{ kind: 'user'|'role'|'everyone'; value?: string }>({ kind: 'everyone' });
  const { data, loading, error, preview } = useSheafPreview();

  const onPreview = () => {
    const viewAs =
      as.kind === 'everyone' ? { everyone: true } :
      as.kind === 'role' ? { role: as.value } :
      { userId: as.value };
    preview({
      draftMessage: { threadId, authorId, facets: draft.map(d => ({ audience: d.audience, body: d.body, sharePolicy: d.policy, expiresAt: d.expiresAt ?? null })) },
      viewAs,
    });
  };

  return (
    <div className="flex items-center gap-2">
      <select
        className="text-xs border rounded px-2 py-1 bg-white/70"
        value={`${as.kind}:${as.value ?? ''}`}
        onChange={(e) => {
          const [kind, value] = e.target.value.split(':');
          setAs({ kind: kind as any, value: value || undefined });
        }}
      >
        <option value="everyone:">Everyone</option>
        {candidates.map((c) => (
          <option key={`${c.type}:${c.id}`} value={`${c.type}:${c.id}`}>{c.label}</option>
        ))}
      </select>
      <button type="button" className="px-2 py-1 rounded bg-white/70 text-xs" onClick={onPreview}>
        {loading ? 'Previewing…' : 'View as'}
      </button>
      {error && <span className="text-xs text-red-600">{String(error)}</span>}
      {data && <span className="text-xs text-slate-600">Default facet: {data.defaultFacetId}</span>}
    </div>
  );
}


│  │  ├─ chat-message.tsx

-import { cn } from "@/lib/utils";
import Image from "next/image";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { type VariantProps, cva } from "class-variance-authority";
import { SparklesIcon, UserIcon } from "lucide-react";
import React, { type ReactNode } from "react";

const chatMessageVariants = cva("flex gap-4 w-full", {
    variants: {
        variant: {
            default: "",
            bubble: "",
            full: "p-5",
        },
        type: {
            incoming: "justify-start mr-auto",
            outgoing: "justify-end ml-auto",
        },
    },
    compoundVariants: [
        {
            variant: "full",
            type: "outgoing",
            className: "bg-slate-100 dark:bg-slate-800",
        },
        {
            variant: "full",
            type: "incoming",
            className: "bg-white dark:bg-slate-950",
        },
    ],
    defaultVariants: {
        variant: "default",
        type: "incoming",
    },
});

interface MessageContextValue extends VariantProps<typeof chatMessageVariants> {
    id: string;
}

const ChatMessageContext = React.createContext<MessageContextValue | null>(
    null,
);

const useChatMessage = () => {
    const context = React.useContext(ChatMessageContext);
    return context;
};

// Root component
interface ChatMessageProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof chatMessageVariants> {
    children?: React.ReactNode;
    id: string;
}

const ChatMessage = React.forwardRef<HTMLDivElement, ChatMessageProps>(
    (
        {
            className,
            variant = "default",
            type = "incoming",
            id,
            children,
            ...props
        },
        ref,
    ) => {
        return (
            <ChatMessageContext.Provider value={{ variant, type, id }}>
                <div
                    ref={ref}
                    className={cn(chatMessageVariants({ variant, type, className }))}
                    {...props}
                >
                    {children}
                </div>
            </ChatMessageContext.Provider>
        );
    },
);
ChatMessage.displayName = "ChatMessage";

// Avatar component

const chatMessageAvatarVariants = cva(
    " flex items-center w-5 h-5 aspect-square rounded-full justify-center align-center my-auto py-auto chat-bubble  overflow-hidden",
    {
        variants: {
            type: {
                incoming: "ring-slate-200 dark:ring-slate-800",
                outgoing: "ring-slate-500/30 dark:ring-slate-400/30",
            },
        },
        defaultVariants: {
            type: "incoming",
        },
    },
);

interface ChatMessageAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    imageSrc?: string;
    icon?: ReactNode;
}

const ChatMessageAvatar = React.forwardRef<
    HTMLDivElement,
    ChatMessageAvatarProps
>(({ className, icon: iconProps, imageSrc, ...props }, ref) => {
    const context = useChatMessage();
    const type = context?.type ?? "incoming";
    const icon =
        iconProps ?? (type === "incoming" ? <SparklesIcon /> : <UserIcon />);
    return (
        <div
            ref={ref}
            className={cn(chatMessageAvatarVariants({ type, className }))}
            {...props}
        >
            {imageSrc ? (
                <Image src={imageSrc} alt="Avatar" 
                width={0} height={0} sizes="30vw"  
                className="object-fill w-full h-fit  aspect-square rounded-full bg-white/20 " />
            ) : (
                <div className="translate-y-px [&_svg]:size-4 [&_svg]:shrink-0">
                    {icon}
                </div>
            )}
        </div>
    );
});
ChatMessageAvatar.displayName = "ChatMessageAvatar";

// Content component

const chatMessageContentVariants = cva("flex flex-col gap-2 ", {
    variants: {
        variant: {
            default: "",
            bubble: "rounded-xl px-2 py-0 ",
            full: "",
        },
        type: {
            incoming: "",
            outgoing: "",
        },
    },
    compoundVariants: [
        {
            variant: "bubble",
            type: "incoming",
            className: "bg-sky-50  rounded-lg px-4   h-fit align-center my-auto py-[1.2px] tracking-wide max-w-[60%] bg-opacity-70 chat-bubble outline-transparent text-[.9rem]  text-slate-950 dark:bg-slate-50 dark:text-slate-900",
        },
        {
            variant: "bubble",
            type: "outgoing",
            className: "bg-fuchsia-50  rounded-lg px-4 h-fit align-center my-auto py-[1.2px]  tracking-wide max-w-[60%] bg-opacity-70 chat-bubble outline-transparent text-[.9rem] text-slate-950 dark:bg-slate-50 dark:text-slate-900",
        },
    ],
    defaultVariants: {
        variant: "default",
        type: "incoming",
    },
});

interface ChatMessageContentProps extends React.HTMLAttributes<HTMLDivElement> {
    id?: string;
    content: string;
}

const ChatMessageContent = React.forwardRef<
    HTMLDivElement,
    ChatMessageContentProps
>(({ className, content, id: idProp, children, ...props }, ref) => {
    const context = useChatMessage();

    const variant = context?.variant ?? "default";
    const type = context?.type ?? "incoming";
    const id = idProp ?? context?.id ?? "";

    return (
        <div
            ref={ref}
            className={cn(chatMessageContentVariants({ variant, type, className }))}
            {...props}
        >
            {content.length > 0 && <MarkdownContent id={id} content={content} />}
            {children}
        </div>
    );
});
ChatMessageContent.displayName = "ChatMessageContent";

export { ChatMessage, ChatMessageAvatar, ChatMessageContent };




├─ contexts
│  ├─ PrivateChatManager.tsx
│  └─ useChatStore.ts

-useChatStore.ts: "use client";
import { create } from "zustand";
import type { PollDTO, PollStateDTO, MyVoteDTO } from "@/types/poll";

export interface Attachment {
  id: string;
  path: string;
  type: string;
  size: number;
}

export type ReactionAgg = { emoji: string; count: number; mine: boolean };

// ---- Sheaf-aware Message type (you already had this; kept here for clarity)
export interface Message {
  id: string;
  text: string | null;
  createdAt: string;
  senderId: string;
  sender?: { name: string; image: string | null };
  attachments?: Attachment[];

  facets?: {
    id: string;
    audience: any; // or AudienceSelector
    sharePolicy: "ALLOW" | "REDACT" | "FORBID";
    expiresAt: string | null;
    body: any;
    attachments?: any[];
    priorityRank: number;
    createdAt: string;
  }[];
  defaultFacetId?: string | null;
  isRedacted?: boolean;
   meta?: any;           // 👈 allow anchors to carry drift info
    driftId?: string | null;
    mentionsMe?: boolean;
}

interface Conversation {
  id: string;
  title?: string | null;
}
export type DriftUI = {
  drift: {
    id: string;
    conversationId: string;
    title: string;
    isClosed: boolean;
    isArchived: boolean;
    messageCount: number;
    lastMessageAt: string | null;
    anchorMessageId?: string | null; // may be null for THREAD
    kind?: "DRIFT" | "THREAD";
    rootMessageId?: string | null;   // set for THREAD
  };
  my?: { collapsed: boolean; pinned: boolean; muted: boolean; lastReadAt: string | null };
};

// Types
type QuoteRef = { messageId: string; facetId?: string };



export type PollUI =
  | { kind: "OPTIONS"; poll: PollDTO; totals: number[]; count: number; myVote: number | null }
  | { kind: "TEMP"; poll: PollDTO; avg: number; count: number; myValue: number | null };

  function normalizeDriftMessage(incoming: any): Message {
    const raw = incoming?.message ?? incoming;
  
    // Coerce to the same shape your UI expects
    const base: Message = {
      id: String(raw.id),
      text: raw.text ?? null,
      createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
      senderId: String(raw.senderId ?? raw.sender_id ?? ""),
      sender: raw.sender ?? undefined,
      attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
      defaultFacetId: raw.defaultFacetId ?? null,
  
      // pass-throughs you already handle elsewhere
      // @ts-ignore
      driftId: raw.driftId ?? raw.drift_id ?? null,
      mentionsMe: typeof raw.mentionsMe === "boolean" ? raw.mentionsMe : undefined,
      // @ts-ignore
      isRedacted: raw.isRedacted ?? raw.is_redacted ?? false,
      // @ts-ignore
      meta: raw.meta ?? undefined,
      // @ts-ignore
      edited: raw.edited ?? false,
      // @ts-ignore
      quotes: Array.isArray(raw.quotes) ? raw.quotes : undefined,
      // @ts-ignore
      linkPreviews: Array.isArray(raw.linkPreviews) ? raw.linkPreviews : undefined,
    };
  
    if (Array.isArray(raw.facets)) {
      base.facets = raw.facets.map((f: any) => ({
        id: String(f.id),
        audience: f.audience,
        sharePolicy: f.sharePolicy,
        expiresAt: f.expiresAt ?? null,
        body: f.body,
        attachments: Array.isArray(f.attachments) ? f.attachments : [],
        priorityRank: typeof f.priorityRank === "number" ? f.priorityRank : 999,
        createdAt: f.createdAt ?? base.createdAt,
        // @ts-ignore
        isEdited: f.isEdited ?? false,
        // @ts-ignore
        updatedAt: f.updatedAt ?? null,
        // @ts-ignore
        linkPreviews: Array.isArray(f.linkPreviews) ? f.linkPreviews : undefined,
      }))
      .sort((a, b) => a.priorityRank - b.priorityRank);
    }
  
    return base;
  }

function normalizeMessage(incoming: any): Message {
  // tolerate both envelope {message:{...}} and bare message {...}
  const raw = incoming?.message ?? incoming;

  const base: Message = {
    id: String(raw.id),
    text: raw.text ?? null,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    senderId: String(raw.senderId ?? raw.sender_id ?? ""),
    sender: raw.sender ?? undefined,
    attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
    defaultFacetId: raw.defaultFacetId ?? null,
   // 🔽 pass-throughs (new)
   driftId: raw.driftId ?? raw.drift_id ?? null,
   isRedacted: raw.isRedacted ?? raw.is_redacted ?? false,
   meta: raw.meta ?? undefined,
    // @ts-ignore to avoid widening your Message type if you prefer
   linkPreviews: Array.isArray(raw.linkPreviews) ? raw.linkPreviews : undefined,
   // If you want, add `edited?: boolean` to the Message interface too.
   // @ts-ignore
   edited: raw.edited ?? false,
   // @ts-ignore — keep quotes on the object, UI reads via (m as any).quotes
   quotes: Array.isArray(raw.quotes) ? raw.quotes : undefined,
 };

  if (Array.isArray(raw.facets)) {
    base.facets = raw.facets
      .map((f: any) => ({
        id: String(f.id),
        audience: f.audience,
        sharePolicy: f.sharePolicy,
        expiresAt: f.expiresAt ?? null,
        body: f.body,
        attachments: Array.isArray(f.attachments) ? f.attachments : [],
        priorityRank:
          typeof f.priorityRank === "number"
            ? f.priorityRank
            : 999, // last if unspecified
        createdAt: f.createdAt ?? base.createdAt,
      // Facet-level edited info (UI reads via (facet as any).isEdited)
        // @ts-ignore
        isEdited: f.isEdited ?? (f.updatedAt ? new Date(f.updatedAt).getTime() > new Date(f.createdAt ?? base.createdAt).getTime() : false),
        // keep updatedAt if present (some UIs display it)
        // @ts-ignore
        updatedAt: f.updatedAt ?? null,
        // optional: link previews if you add them later
        // @ts-ignore
        linkPreviews: Array.isArray(f.linkPreviews) ? f.linkPreviews : undefined,
      }))
      .sort((a, b) => a.priorityRank - b.priorityRank);
  }

  return base;
}

interface ChatState {
  conversations: Record<string, Conversation>;
  currentConversation?: string;
  messages: Record<string, Message[]>;
  pollsByMessageId: Record<string, PollUI>;
  setCurrentConversation: (id: string) => void;
  setConversations: (list: Conversation[]) => void;
  setMessages: (id: string, msgs: Message[] | any[]) => void;
  appendMessage: (id: string, msg: Message | any) => void;
  setPolls: (conversationId: string, polls: PollUI[]) => void;
  upsertPoll: (poll: PollDTO, initState: PollStateDTO | null, myVote: MyVoteDTO | null) => void;
  applyPollState: (state: PollStateDTO) => void;
  setMyVote: (my: MyVoteDTO) => void;
  sendMessage: (id: string, data: FormData) => Promise<void>;
  reactionsByMessageId: Record<string, ReactionAgg[]>;
  setReactions: (messageId: string, items: ReactionAgg[]) => void;
  applyReactionDelta: (messageId: string, emoji: string, op: 'add'|'remove', byMe: boolean) => void;
  driftsByAnchorId: Record<string, DriftUI>;
  driftsByRootMessageId: Record<string, DriftUI>; // NEW
  driftMessages: Record<string /*driftId*/, any[]>;
  setDrifts: (items: DriftUI[]) => void;
  upsertDrift: (item: DriftUI) => void;
  updateDriftCounters: (driftId: string, patch: { messageCount?: number; lastMessageAt?: string | null }) => void;
  setDriftMessages: (driftId: string, rows: any[]) => void;
  appendDriftMessage: (driftId: string, msg: any) => void;
  quoteDraftByConversationId: Record<string, QuoteRef | undefined>;
  setQuoteDraft: (conversationId: string, ref?: QuoteRef) => void;
  clearQuoteDraft: (conversationId: string) => void;
  replaceMessageInConversation: (conversationId: string, msg: Message | any) => void;
  markMessageRedacted: (conversationId: string, messageId: string) => void;
  appendManyDriftMessages: (driftId: string, rows: any[]) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: {},
  messages: {},
  pollsByMessageId: {},
  reactionsByMessageId: {},
  setCurrentConversation: (id) => set({ currentConversation: id }),
  // State
  quoteDraftByConversationId: {},
  driftsByAnchorId: {},
  driftsByRootMessageId: {},


  setConversations: (list) =>
    set({ conversations: Object.fromEntries(list.map((c) => [c.id, c])) }),

  setMessages: (id, msgs) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [id]: (msgs ?? []).map((m) => {
          const normalized = normalizeMessage(m);
          return { ...normalized, attachments: normalized.attachments ?? [] };
        }),
      },
    })),
    replaceMessageInConversation: (conversationId, msg) => {
      const normalized = normalizeMessage(msg);
      set((state) => {
        const list = state.messages[conversationId] ?? [];
        const i = list.findIndex((m) => String(m.id) === String(normalized.id));
        if (i === -1) return { messages: state.messages }; // not found: no op
        const next = list.slice();
        next[i] = { ...normalized, attachments: normalized.attachments ?? [] };
        return { messages: { ...state.messages, [conversationId]: next } };
      });
    },
    setReactions: (messageId, items) =>
    set((state) => ({
      reactionsByMessageId: { ...state.reactionsByMessageId, [messageId]: items },
    })),
    markMessageRedacted: (conversationId, messageId) =>
    set((state) => {
      const list = state.messages[conversationId] ?? [];
      const next = list.map((row) =>
        String(row.id) === String(messageId)
          ? {
              ...row,
              isRedacted: true,
              // keep parity with server tombstone semantics
              text: null,
              attachments: [],
              facets: [],
            }
          : row
      );
      return { messages: { ...state.messages, [conversationId]: next } };
    }),
    applyReactionDelta: (messageId, emoji, op, byMe) =>
    set((state) => {
      const current = state.reactionsByMessageId[messageId] ?? [];
      const idx = current.findIndex((r) => r.emoji === emoji);
      if (idx === -1) {
        if (op === 'add') {
          const next = [...current, { emoji, count: 1, mine: byMe }];
          return { reactionsByMessageId: { ...state.reactionsByMessageId, [messageId]: next } };
        }
        return {}; // removing a non-existent agg: ignore
      }
      const row = { ...current[idx] };
      row.count += (op === 'add' ? 1 : -1);
      if (row.count < 0) row.count = 0;
      if (byMe) row.mine = (op === 'add');
      const next = current.slice();
      if (row.count === 0) next.splice(idx, 1);
      else next[idx] = row;
      return { reactionsByMessageId: { ...state.reactionsByMessageId, [messageId]: next } };
    }),
    appendManyDriftMessages: (driftId, rows) =>
    set((s) => {
      const existing = s.driftMessages[driftId] ?? [];
      const add = rows.map((m) => normalizeDriftMessage(m));
      // de-dupe by id
      const seen = new Set(existing.map((m) => String(m.id)));
      const merged = existing.concat(add.filter((m) => !seen.has(String(m.id))));
      merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return { driftMessages: { ...s.driftMessages, [driftId]: merged } };
    }),
  appendMessage: (id, msg) =>
    set((state) => {
      const list = state.messages[id] || [];
      const normalized = normalizeMessage(msg);
      if (list.some((m) => m.id === normalized.id)) {
        return { messages: state.messages };
      }
      return {
        messages: {
          ...state.messages,
          [id]: [...list, { ...normalized, attachments: normalized.attachments ?? [] }],
        },
      };
    }),

  setPolls: (_cid, polls) =>
    set((state) => ({
      pollsByMessageId: {
        ...state.pollsByMessageId,
        ...Object.fromEntries(polls.map((p) => [p.poll.messageId, p])),
      },
    })),

  upsertPoll: (poll, initState, myVote) =>
    set((state) => {
      if (!poll) {
        console.warn("[polls] upsertPoll called without poll", { initState, myVote });
        return {};
      }
      let ui: PollUI;
      if (poll.kind === "OPTIONS") {
        const totals =
          initState && initState.kind === "OPTIONS"
            ? initState.totals
            : new Array(poll.options?.length ?? 0).fill(0);
        const count =
          initState && initState.kind === "OPTIONS" ? initState.count : 0;
        const my =
          myVote && myVote.kind === "OPTIONS" ? myVote.optionIdx : null;
        ui = { kind: "OPTIONS", poll, totals, count, myVote: my };
      } else {
        const avg =
          initState && initState.kind === "TEMP" ? initState.avg : 0;
        const count =
          initState && initState.kind === "TEMP" ? initState.count : 0;
        const my = myVote && myVote.kind === "TEMP" ? myVote.value : null;
        ui = { kind: "TEMP", poll, avg, count, myValue: my };
      }
      return {
        pollsByMessageId: {
          ...state.pollsByMessageId,
          [poll.messageId]: ui,
        },
      };
    }),

  applyPollState: (incoming) =>
    set((state) => {
      const entryKey = Object.keys(state.pollsByMessageId).find(
        (k) => state.pollsByMessageId[k].poll.id === incoming.pollId
      );
      if (!entryKey) return {};
      const existing = state.pollsByMessageId[entryKey];
      let updated: PollUI | undefined;
      if (incoming.kind === "OPTIONS" && existing.kind === "OPTIONS") {
        updated = { ...existing, totals: incoming.totals, count: incoming.count };
      } else if (incoming.kind === "TEMP" && existing.kind === "TEMP") {
        updated = { ...existing, avg: incoming.avg, count: incoming.count };
      }
      if (!updated) return {};
      return {
        pollsByMessageId: { ...state.pollsByMessageId, [entryKey]: updated },
      };
    }),

  setMyVote: (my) =>
    set((state) => {
      const entryKey = Object.keys(state.pollsByMessageId).find(
        (k) => state.pollsByMessageId[k].poll.id === my.pollId
      );
      if (!entryKey) return {};
      const existing = state.pollsByMessageId[entryKey];
      let updated: PollUI | undefined;
      if (my.kind === "OPTIONS" && existing.kind === "OPTIONS") {
        updated = { ...existing, myVote: my.optionIdx };
      } else if (my.kind === "TEMP" && existing.kind === "TEMP") {
        updated = { ...existing, myValue: my.value };
      }
      if (!updated) return {};
      return {
        pollsByMessageId: { ...state.pollsByMessageId, [entryKey]: updated },
      };
    }),

    setQuoteDraft: (conversationId, ref) =>
    set((state) => ({
      quoteDraftByConversationId: {
        ...state.quoteDraftByConversationId,
        [conversationId]: ref,
      },
    })),

  clearQuoteDraft: (conversationId) =>
    set((state) => {
      const next = { ...state.quoteDraftByConversationId };
      delete next[conversationId];
      return { quoteDraftByConversationId: next };
    }),

  sendMessage: async (id, data) => {
    const res = await fetch(`/api/messages/${id}`, { method: "POST", body: data });
    if (!res.ok) throw new Error("Failed to send message");
    const msg = await res.json();
    get().appendMessage(id, msg);
  },

  driftMessages: {},
  // in initial state:
  setDrifts: (items) =>
  set((s) => {
    const byAnchor = { ...s.driftsByAnchorId };
    const byRoot   = { ...s.driftsByRootMessageId };
    for (const it of items) {
      const d = (it as any).drift ?? it;
      // Only index anchors for classic DRIFT (not THREAD)
      if (d.anchorMessageId && (d.kind ?? "DRIFT") === "DRIFT") {
        byAnchor[d.anchorMessageId] = it as DriftUI;
      }
      if (d.rootMessageId) {
        byRoot[d.rootMessageId] = it as DriftUI;
      }
    }
    return { driftsByAnchorId: byAnchor, driftsByRootMessageId: byRoot };
  }),

upsertDrift: (item) =>
  set((s) => {
    const d = (item as any).drift ?? item;
    const byAnchor = { ...s.driftsByAnchorId };
    const byRoot   = { ...s.driftsByRootMessageId };
    if (d.anchorMessageId && (d.kind ?? "DRIFT") === "DRIFT") {
      byAnchor[d.anchorMessageId] = item as DriftUI;
    }
    if (d.rootMessageId) {
      byRoot[d.rootMessageId] = item as DriftUI;
    }
    return { driftsByAnchorId: byAnchor, driftsByRootMessageId: byRoot };
  }),
// Make counters update no matter which index the drift sits in:
updateDriftCounters: (driftId, patch) =>
  set((s) => {
    let touched = false;
    const touch = (v: DriftUI) => ({
      ...v,
      drift: {
        ...v.drift,
        messageCount: patch.messageCount ?? v.drift.messageCount,
        lastMessageAt: patch.lastMessageAt ?? v.drift.lastMessageAt,
      },
    });

    const byAnchor = { ...s.driftsByAnchorId };
    for (const [k, v] of Object.entries(byAnchor)) {
      if (v.drift.id === driftId) {
        byAnchor[k] = touch(v);
        touched = true;
        break;
      }
    }
    const byRoot = { ...s.driftsByRootMessageId };
    for (const [k, v] of Object.entries(byRoot)) {
      if (v.drift.id === driftId) {
        byRoot[k] = touch(v);
        touched = true;
        break;
      }
    }
    return touched ? { driftsByAnchorId: byAnchor, driftsByRootMessageId: byRoot } : {};
  }),
  setDriftMessages: (driftId, rows) =>
    set((s) => ({
        driftMessages: {
          ...s.driftMessages,
          [driftId]: (rows ?? []).map((m: any) => normalizeDriftMessage(m)),
        },
      })),  
      appendDriftMessage: (driftId, msg) =>
      set((s) => {
        const list = s.driftMessages[driftId] ?? [];
        const normalized = normalizeDriftMessage(msg);
        if (list.some((m) => String(m.id) === String(normalized.id))) {
          return {};
        }
        const next = [...list, normalized].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        return {
          driftMessages: {
            ...s.driftMessages,
            [driftId]: next,
          },
        };
      }),
    
  
  
}));


-PrivateChatManager.tsx: "use client";
import React, { createContext, useContext, useMemo, useReducer, useCallback, useEffect, useRef } from "react";

export type Msg = { paneId: string; from: string; body: string; ts: number };


export type PaneAnchor = {
  messageId: string;
  messageText?: string | null;
  authorId: string;
  authorName?: string | null;
  conversationId: string;
};


export type Pane = {
  id: string;                 // roomId
  conversationId: string;
  peerId: string;
  peerName: string;
  peerImage?: string | null;
  msgs: Msg[];
  minimised: boolean;
  unread?: number;
  pos: { x: number; y: number };
  anchor?: PaneAnchor;
};

type State = { panes: Record<string, Pane> };

// ---- actions
type Action =
  | { type: "HYDRATE"; state: State }
  | { type: "OPEN"; pane: Omit<Pane, "msgs" | "minimised" | "unread"> }
  | { type: "OPEN_OR_INCREMENT"; pane: Omit<Pane, "msgs" | "minimised" | "unread"> }
  | { type: "ENSURE_PANE"; pane: Omit<Pane, "msgs" | "minimised" | "unread"> } // <— NEW
  | { type: "CLOSE"; id: string }
  | { type: "MINIMISE"; id: string }
  | { type: "RESTORE"; id: string }
  | { type: "MARK_READ"; id: string }
  | { type: "SET_POS"; id: string; pos: { x: number; y: number } }
  | { type: "ADD_MSG"; id: string; msg: Msg };

  const DEBUG = false;

function debug(action: Action, next: State) {
  if (!DEBUG) return;
  console.log("[REDUCER]", action.type, action, "→ panes:", Object.keys(next.panes));
  if ("pane" in action) console.log("[REDUCER] pane after:", next.panes[action.pane.id]);
  if (action.type === "ADD_MSG") console.log("[REDUCER] msgs after:", next.panes[action.id]?.msgs?.length, "unread:", next.panes[action.id]?.unread);
}

// ---- reducer
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE":
      return action.state;

    case "OPEN": {
      const p = state.panes[action.pane.id];
      if (p) {
        return {
          ...state,
          panes: {
            ...state.panes,
            [p.id]: { ...p, minimised: false, unread: 0, anchor: action.pane.anchor ?? p.anchor },
          },
        };
      }
      const offset = Object.keys(state.panes).length * 40;
      return {
        ...state,
        panes: {
          ...state.panes,
          [action.pane.id]: {
            ...action.pane,
            msgs: [],
            minimised: false,
            unread: 0,
            pos: action.pane.pos ?? { x: 420 + offset, y: 24 + offset },
          },
        },
      };
    }

    // case "OPEN_OR_INCREMENT": {
    //   const p = state.panes[action.pane.id];
    //   if (p) {
    //     const unread = p.minimised ? (p.unread ?? 0) + 1 : p.unread ?? 0;
    //     return {
    //       ...state,
    //       panes: {
    //         ...state.panes,
    //         [p.id]: {
    //           ...p,
    //           // refresh name/image in case we previously had "User"
    //           peerName: action.pane.peerName || p.peerName,
    //           peerImage: action.pane.peerImage ?? p.peerImage,
    //           unread,
    //         },
    //       },
    //     };
    //   }
    //   return {
    //     ...state,
    //     panes: {
    //       ...state.panes,
    //       [action.pane.id]: {
    //         ...action.pane,
    //         msgs: [],
    //         minimised: true,   // start minimised on receiver
    //         unread: 1,
    //         pos: action.pane.pos ?? { x: 420, y: 24 },
    //       },
    //     },
    //   };
    // }
    case "OPEN_OR_INCREMENT": {
      const p = state.panes[action.pane.id];
      const next = p
      ? {
        ...state,
        panes: {
          ...state.panes,
          [p.id]: {
            ...p,
            peerName: action.pane.peerName || p.peerName,
            peerImage: action.pane.peerImage ?? p.peerImage,
            unread: p.minimised ? (p.unread ?? 0) + 1 : p.unread ?? 0,
            anchor: action.pane.anchor ?? p.anchor,
          },
        },
      }
    : {
        ...state,
        panes: {
          ...state.panes,
          [action.pane.id]: {
            ...action.pane,
            msgs: [],
            minimised: true,
            unread: 1,
            pos: action.pane.pos ?? { x: 420, y: 24 },
          },
        },
      };
      debug(action, next);
      return next;
    }
    case "ENSURE_PANE": {
      const p = state.panes[action.pane.id];
      if (p) {
        // update name/image if we learned better values; DO NOT change unread
        return {
          ...state,
          panes: { ...state.panes, [p.id]: { ...p, peerName: action.pane.peerName || p.peerName, peerImage: action.pane.peerImage ?? p.peerImage } }
        };
      }
      // create minimized with unread 0; we'll bump on ADD_MSG
      return {
        ...state,
        panes: {
          ...state.panes,
          [action.pane.id]: {
            ...action.pane,
            msgs: [],
            minimised: true,
            unread: 0,
            pos: action.pane.pos ?? { x: 420, y: 24 },
          },
        },
      };
    }
    

    case "CLOSE": {
      const { [action.id]: _, ...rest } = state.panes;
      return { ...state, panes: rest };
    }
    case "MINIMISE": {
      const p = state.panes[action.id];
      if (!p) return state;
      return { ...state, panes: { ...state.panes, [p.id]: { ...p, minimised: true } } };
    }
    case "RESTORE": {
      const p = state.panes[action.id];
      if (!p) return state;
      return { ...state, panes: { ...state.panes, [p.id]: { ...p, minimised: false, unread: 0 } } };
    }
    case "MARK_READ": {
      const p = state.panes[action.id];
      if (!p) return state;
      return { ...state, panes: { ...state.panes, [p.id]: { ...p, unread: 0 } } };
    }
    case "SET_POS": {
      const p = state.panes[action.id];
      if (!p) return state;
      return { ...state, panes: { ...state.panes, [p.id]: { ...p, pos: action.pos } } };
    }
    // case "ADD_MSG": {
    //   const p = state.panes[action.id];
    //   if (!p) return state;
    //   const isIncoming = String(action.msg.from) === p.peerId;
    //   const unread = p.minimised && isIncoming ? (p.unread ?? 0) + 1 : p.unread ?? 0;
    //   return {
    //     ...state,
    //     panes: { ...state.panes, [p.id]: { ...p, msgs: [...p.msgs, action.msg].slice(-50), unread } },
    //   };
    // }

case "ADD_MSG": {
  const p = state.panes[action.id];
  if (!p) return state;
  const isIncoming = String(action.msg.from) === p.peerId;
  const unread = p.minimised && isIncoming ? (p.unread ?? 0) + 1 : p.unread ?? 0;
  const next = { ...state, panes: { ...state.panes, [p.id]: { ...p, msgs: [...p.msgs, action.msg].slice(-50), unread } } };
  debug(action, next);
  return next;
}

    default:
      return state;
  }
}

// ---- persistence helpers (sessionStorage)
type Persisted = {
  v: 2;
  panes: Record<string, {
    id: string;
    conversationId: string;
    peerId: string;
    peerName: string;
    peerImage?: string | null;
    minimised: boolean;
    unread?: number;
    pos: { x: number; y: number };
    msgs?: Msg[];
    anchor?: PaneAnchor;
  }>;
};

function serialize(state: State): Persisted {
  const panes = Object.fromEntries(
    Object.entries(state.panes).map(([id, p]) => [
      id,
      {
        id: p.id,
        conversationId: p.conversationId,
        peerId: p.peerId,
        peerName: p.peerName,
        peerImage: p.peerImage ?? null,
        minimised: p.minimised,
        unread: p.unread ?? 0,
        pos: p.pos,
        // keep the last 25 msgs for lightweight restore
        msgs: p.msgs.slice(-25),
        anchor: p.anchor ?? undefined,
      },
    ])
  );
  return { v: 2, panes };
}

function mergeLocalPrefs(p: Persisted["panes"][string]): Persisted["panes"][string] {
  // merge pos/minimised from localStorage (so those survive across sessions)
  try {
    const raw = localStorage.getItem(`pcp:prefs:${p.id}`);
    if (!raw) return p;
    const { pos, minimised } = JSON.parse(raw) || {};
    return { ...p, pos: pos ?? p.pos, minimised: typeof minimised === "boolean" ? minimised : p.minimised };
  } catch {
    return p;
  }
}

function deserialize(raw: string): State {
  try {
    const data: Persisted = JSON.parse(raw);
    if (!data?.panes) return { panes: {} };
    const panes: Record<string, Pane> = {};
    for (const [id, p] of Object.entries(data.panes)) {
      const merged = mergeLocalPrefs(p);
      panes[id] = {
        id: merged.id,
        conversationId: merged.conversationId,
        peerId: merged.peerId,
        peerName: merged.peerName,
        peerImage: merged.peerImage ?? null,
        msgs: merged.msgs ?? [],
        minimised: !!merged.minimised,
        unread: merged.unread ?? 0,
        pos: merged.pos ?? { x: 420, y: 24 },
        anchor: merged.anchor,
      };
    }
    return { panes };
  } catch {
    return { panes: {} };
  }
}

// ---- context
type OpenOptions = {
  peerImage?: string | null;
  roomId?: string;
  pos?: { x: number; y: number };
  anchor?: PaneAnchor;
};

type Ctx = {
  state: State;
  dispatch: React.Dispatch<Action>;
  open: (peerId: string, peerName: string, conversationId: string, opts?: OpenOptions) => void;
};

const C = createContext<Ctx | null>(null);

export function PrivateChatProvider(
  props: { children: React.ReactNode; meId?: string | null }
) {
  const { children } = props; // don't pull out meId
  const key = "pcp:v1";

  // lazy init from sessionStorage
  const [state, dispatch] = useReducer(
    reducer,
    undefined as unknown as State,
    () => {
      if (typeof window === "undefined") return { panes: {} };
      const raw = sessionStorage.getItem(key);
      return raw ? deserialize(raw) : { panes: {} };
    }
  );

  // persist on any state change
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(serialize(state)));
    } catch {}
  }, [state, key]);

  // if meId changes, rehydrate under the new key (rare)
  const lastKeyRef = useRef(key);
  useEffect(() => {
    if (lastKeyRef.current === key) return;
    try {
      const raw = sessionStorage.getItem(key);
      dispatch({ type: "HYDRATE", state: raw ? deserialize(raw) : { panes: {} } });
      lastKeyRef.current = key;
    } catch {}
  }, [key]);

  // write per-pane pos/minimised to localStorage (cross-session preference)
  useEffect(() => {
    try {
      for (const p of Object.values(state.panes)) {
        localStorage.setItem(`pcp:prefs:${p.id}`, JSON.stringify({ pos: p.pos, minimised: p.minimised }));
      }
    } catch {}
  }, [state.panes]);

  const open = useCallback<Ctx["open"]>((peerId, peerName, conversationId, opts) => {
    const roomId = opts?.roomId ?? `dm:${conversationId}:${peerId}`;
    dispatch({
      type: "OPEN",
      pane: {
        id: roomId,
        conversationId,
        peerId,
        peerName,
        peerImage: opts?.peerImage ?? null,
        pos: opts?.pos ?? { x: 420, y: 24 },
        anchor: opts?.anchor,
      },
    });
  }, []);

  const value = useMemo(() => ({ state, dispatch, open }), [state, open]);
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function usePrivateChatManager() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("PrivateChatProvider missing");
  return ctx;
}


├─ hooks
│  ├─ useBooksmarks.ts
│  ├─ useConversationRealtime.ts
│  ├─ useGridNavigator.ts
│  ├─ useKeyPress.ts
│  ├─ useMarket.ts
│  ├─ useNotifications.ts
│  ├─ usePrivateChatSocket.ts
│  ├─ useReceipts.tsx
│  ├─ useSafeForward.ts
│  ├─ useSelectionRects.ts
│  ├─ useSheafPreview.ts
│  ├─ useStallPresence.ts
│  ├─ useStars.ts
│  └─ useUserInbox.ts

-useBookmarks.ts:  "use client";
 import useSWR from "swr";
 import { useMemo } from "react";
 import { useAuth } from "@/lib/AuthContext";
 
 const fetcher = (url: string) => fetch(url).then((r) => r.json());
 type IdLike = string | number | bigint;
 const toStr = (v: IdLike) => (typeof v === "bigint" ? v.toString() : String(v));
 
 export function useBookmarks(conversationId?: IdLike) {
   const { user } = useAuth();
   const conv = conversationId != null ? toStr(conversationId) : undefined;
   const { data, mutate } = useSWR<{ items: { message_id: string; label: string | null }[] }>(
     user && conv ? `/api/conversations/${conv}/bookmark` : null,
     fetcher,
     { refreshInterval: 30000 }
   );
 
   const items = data?.items ?? [];
   const map = useMemo(() => {
     const m = new Map<string, string | null>();
     for (const it of items) m.set(String(it.message_id), it.label ?? null);
     return m;
   }, [items]);
 
   function isBookmarked(messageId: IdLike) {
     return map.has(toStr(messageId));
   }
   function labelFor(messageId: IdLike) {
     return map.get(toStr(messageId)) ?? null;
   }
 
   async function toggleBookmark(messageId: IdLike, opts?: { label?: string | null }) {
     const idStr = toStr(messageId);
     const has = map.has(idStr);
     if (has && opts?.label === undefined) {
       // optimistic remove
       await mutate(
         (prev) => ({
           items: (prev?.items ?? []).filter((it) => String(it.message_id) !== idStr),
         }),
         { revalidate: false }
       );
       await fetch(`/api/messages/${idStr}/bookmark`, { method: "DELETE" });
       mutate();
       return;
     }
     // create or update label
     const label = opts?.label ?? null;
     await mutate(
       (prev) => {
         const rest = (prev?.items ?? []).filter((it) => String(it.message_id) !== idStr);
         return { items: [{ message_id: idStr, label, created_at: new Date().toISOString() }, ...rest] };
       },
       { revalidate: false }
     );
     await fetch(`/api/messages/${idStr}/bookmark`, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ label }),
     });
     mutate();
   }
 
   function filterBookmarked<T extends { id: IdLike }>(messages: T[], label?: string | null) {
     if (!label) return messages.filter((m) => isBookmarked(m.id));
     return messages.filter((m) => map.get(toStr(m.id)) === label);
   }
 
   const labels = useMemo(() => {
     return Array.from(new Set(items.map((it) => it.label).filter(Boolean) as string[])).sort();
   }, [items]);
 
   return {
     isBookmarked,
     labelFor,
     toggleBookmark,          // toggle; supply {label} to add/update, no label to remove
     filterBookmarked,
     labels,
     refreshBookmarks: () => mutate(),
   };
 }

-// hooks/useConversationRealtime.ts
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseclient";

// tiny throttle (or pull from lodash)
function throttle<T extends (...a: any[]) => any>(fn: T, ms: number) {
  let last = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}

 type OnlineMeta = { name: string; image: string | null };
 type TypingEntry = { until: number; name?: string | null };

export function useConversationRealtime(
  conversationId: string,
  currentUser: { id: string; name: string; image: string | null }
) {
  const [online, setOnline] = useState<Record<string, OnlineMeta>>({});
  const [typing, setTyping] = useState<Record<string, TypingEntry>>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // join + presence sync
  useEffect(() => {
    const channel = supabase.channel(`conversation-${conversationId}`, {
      config: { presence: { key: currentUser.id } },
    });

    channel.on("presence", { event: "sync" }, () => {
      // presenceState: { [userId]: [{ name, image, ... }, ...] }
      const state = channel.presenceState() as Record<string, OnlineMeta[]>;
      const flattened: Record<string, OnlineMeta> = {};
      for (const [uid, metas] of Object.entries(state)) {
        const meta = metas[0]; // first device
        if (meta) flattened[uid] = { name: meta.name, image: meta.image ?? null };
      }
      setOnline(flattened);
    });

    channel.on("presence", { event: "join" }, ({ key, newPresences }: any) => {
           const meta = newPresences?.[0] || {};
           setOnline((prev) => ({ ...prev, [String(key)]: { name: meta.name ?? "", image: meta.image ?? null } }));
         });
         channel.on("presence", { event: "leave" }, ({ key }: any) => {
           // Remove only if no devices remain for that user
           const state = channel.presenceState() as Record<string, unknown[]>;
           if (!state[String(key)]?.length) {
             setOnline((prev) => {
               const next = { ...prev };
               delete next[String(key)];
               return next;
             });
           }
         });

    channel.on("broadcast", { event: "typing" }, ({ payload }) => {
      const { userId, until, name } = payload as { userId: string; until: number; name?: string | null };
      if (userId === currentUser.id) return;
       setTyping((prev) => ({ ...prev, [userId]: { until, name: name ?? prev[userId]?.name } }));
        });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ name: currentUser.name, image: currentUser.image });
      }
    });

    channelRef.current = channel;

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
      setOnline({});
      setTyping({});
    };
  }, [conversationId, currentUser.id, currentUser.name, currentUser.image]);

  // expire typing flags
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      setTyping((prev) => {
        const next = { ...prev };
        for (const uid of Object.keys(next)) {
                   if (next[uid].until <= now) delete next[uid];
                 }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const sendTyping = useMemo(
    () =>
      throttle(() => {
        const until = Date.now() + 3000; // visible for 3s
        channelRef.current?.send({
          type: "broadcast",
          event: "typing",
          payload: { userId: currentUser.id, name: currentUser.name, until },
        });
      }, 1000), // send at most once/sec
      [currentUser.id, currentUser.name]
  );

  return { online, typing, sendTyping };
}


-usePrivateChatSocket.ts: import { supabase } from "@/lib/supabaseclient";
import { useCallback, useEffect, useRef } from "react";

type OpenPayload = {
  kind: "open";
  roomId: string;
  conversationId: string;
  from: string;
  to: string;
  ts: number;
  fromName?: string | null;
  fromImage?: string | null;
};
type MessagePayload = {
  kind: "message";
  roomId: string;
  conversationId: string;
  from: string;
  to: string;
  body: string;
  ts: number;
  fromName?: string | null;
  fromImage?: string | null;
};
type Event = OpenPayload | MessagePayload;

export function usePrivateChatSocket(
  ids: {
    roomId: string;
    conversationId: string;
    meId: string;
    peerId: string;
    meName?: string | null;
    meImage?: string | null;
  },
  onEvent: (e: Event) => void
) {
  const { roomId, conversationId, meId, peerId, meName, meImage } = ids;

  const roomRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const roomReady = useRef(false);

  const inboxRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const inboxReady = useRef(false);

  const handlerRef = useRef(onEvent);
  useEffect(() => { handlerRef.current = onEvent; }, [onEvent]);

  // --- ROOM (receive) ---
  // useEffect(() => {
  //   const ch = supabase.channel(roomId, { config: { broadcast: { self: false } } });
  //   roomReady.current = false;
  //   roomRef.current = ch;

  //   ch.on("broadcast", { event: "priv" }, ({ payload }) => {
  //     if (payload?.roomId === roomId) handlerRef.current(payload as Event);
  //   });

  //   ch.subscribe((status) => {
  //     roomReady.current = (status === "SUBSCRIBED");
  //     // console.log("[room status]", status, roomId);
  //   });

  //   return () => {
  //     roomReady.current = false;
  //     roomRef.current = null;
  //     supabase.removeChannel(ch);
  //   };
  // }, [roomId]);
  // room subscribe
useEffect(() => {
  const ch = supabase.channel(roomId, { config: { broadcast: { self: false } } });
  console.log("[SOCKET] subscribe room:", roomId);
  roomRef.current = ch;
  ch.on("broadcast", { event: "priv" }, ({ payload }) => {
    console.log("[SOCKET] room recv", roomId, payload);
    if (payload?.roomId === roomId) handlerRef.current(payload as Event);
  });
  ch.subscribe((status) => console.log("[SOCKET] room status", status, roomId));
  return () => { console.log("[SOCKET] room cleanup", roomId); supabase.removeChannel(ch); roomRef.current = null; };
}, [roomId]);

  // --- INBOX (send) — exactly once per peerId ---
  // useEffect(() => {
  //   const inbox = supabase.channel(`inbox:${peerId}`, { config: { broadcast: { self: false } } });
  //   inboxReady.current = false;
  //   inboxRef.current = inbox;

  //   inbox.subscribe((status) => {
  //     inboxReady.current = (status === "SUBSCRIBED");
  //     // console.log("[inbox sender status]", status, `inbox:${peerId}`);
  //   });

  //   return () => {
  //     inboxReady.current = false;
  //     inboxRef.current = null;
  //     supabase.removeChannel(inbox);
  //   };
  // }, [peerId]);
  useEffect(() => {
    const inbox = supabase.channel(`inbox:${peerId}`, { config: { broadcast: { self: false } } });
    console.log("[SOCKET] subscribe peer inbox:", `inbox:${peerId}`);
    inboxRef.current = inbox;
    inbox.subscribe((status) => console.log("[SOCKET] peer inbox status", status, `inbox:${peerId}`));
    return () => { console.log("[SOCKET] peer inbox cleanup", `inbox:${peerId}`); supabase.removeChannel(inbox); inboxRef.current = null; };
  }, [peerId]);
  

  const sendVia = (ch: NonNullable<typeof inboxRef.current>, event: "priv_open" | "priv_message" | "priv", payload: Event) =>
    ch.send({ type: "broadcast", event, payload });

  // Safe notify helper + one-shot fallback
  // const notifyPeerInbox = useCallback((event: "priv_open" | "priv_message", payload: Event) => {
  //   if (inboxReady.current && inboxRef.current) {
  //     sendVia(inboxRef.current, event, payload);
  //     return;
  //   }
  //   // one-shot fallback if persistent inbox channel isn't ready yet
  //   const tmp = supabase.channel(`inbox:${peerId}`, { config: { broadcast: { self: false } } });
  //   tmp.subscribe((status) => {
  //     if (status === "SUBSCRIBED") {
  //       sendVia(tmp, event, payload).finally(() => supabase.removeChannel(tmp));
  //     }
  //   });
  // }, [peerId]);
  const notifyPeerInbox = useCallback((event: "priv_open" | "priv_message", payload: Event) => {
    const ready = !!inboxRef.current;
    console.log("[SOCKET] notifyPeerInbox", event, "ready?", ready, "topic:", `inbox:${peerId}`, payload);
    if (inboxRef.current) {
      inboxRef.current.send({ type: "broadcast", event, payload });
    }
  }, [peerId]);
  const sendOpen = useCallback(() => {
    const payload: OpenPayload = { kind: "open", roomId, conversationId, from: meId, to: peerId, ts: Date.now(), fromName: meName ?? null, fromImage: meImage ?? null };
    console.log("[SOCKET] sendOpen", payload);
    roomRef.current?.send({ type: "broadcast", event: "priv", payload });
    notifyPeerInbox("priv_open", payload);
  }, [roomId, conversationId, meId, peerId, meName, meImage, notifyPeerInbox]);
  
  const sendMessage = useCallback((body: string) => {
    const payload: MessagePayload = { kind: "message", roomId, conversationId, from: meId, to: peerId, body, ts: Date.now(), fromName: meName ?? null, fromImage: meImage ?? null };
    console.log("[SOCKET] sendMessage", payload);
    roomRef.current?.send({ type: "broadcast", event: "priv", payload });
    notifyPeerInbox("priv_message", payload);
  }, [roomId, conversationId, meId, peerId, meName, meImage, notifyPeerInbox]);

  // Also guard room sends (first send after mount can beat SUBSCRIBED)
  const sendToRoom = useCallback((payload: Event) => {
    if (roomReady.current && roomRef.current) {
      sendVia(roomRef.current, "priv", payload);
      return;
    }
    // one-shot fallback
    const tmp = supabase.channel(roomId, { config: { broadcast: { self: false } } });
    tmp.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        sendVia(tmp, "priv", payload).finally(() => supabase.removeChannel(tmp));
      }
    });
  }, [roomId]);

  // const sendOpen = useCallback(() => {
  //   const payload: OpenPayload = {
  //     kind: "open",
  //     roomId,
  //     conversationId,
  //     from: meId,
  //     to: peerId,
  //     ts: Date.now(),
  //     fromName: meName ?? null,
  //     fromImage: meImage ?? null,
  //   };
  //   sendToRoom(payload);
  //   notifyPeerInbox("priv_open", payload);
  // }, [roomId, conversationId, meId, peerId, meName, meImage, sendToRoom, notifyPeerInbox]);

  // const sendMessage = useCallback((body: string) => {
  //   const payload: MessagePayload = {
  //     kind: "message",
  //     roomId,
  //     conversationId,
  //     from: meId,
  //     to: peerId,
  //     body,
  //     ts: Date.now(),
  //     fromName: meName ?? null,
  //     fromImage: meImage ?? null,
  //   };
  //   sendToRoom(payload);
  //   notifyPeerInbox("priv_message", payload);
  // }, [roomId, conversationId, meId, peerId, meName, meImage, sendToRoom, notifyPeerInbox]);

  return { sendOpen, sendMessage };
}


-useReceipts.ts: "use client";
import useSWR from "swr";

type Receipt = {
  id: string;
  v: number;
  version_hash?: string;   // depending on your API
  versionHash?: string;
  merged_at?: string;
  mergedAt?: string;
  signature?: string | null;
};

type ApiResp = { ok?: boolean; items?: Receipt[] };

const fetcher = (url: string) =>
  fetch(url).then(async (r) => {
    if (!r.ok) throw new Error(await r.text().catch(() => r.statusText));
    return r.json() as Promise<ApiResp>;
  });

export function useReceipts(messageId?: string | number | null) {
  const id = messageId != null ? String(messageId) : null;

  // SWR v1/v2 compatible loading flag
  const { data, mutate, error, isValidating }: any = useSWR(
    id ? `/api/messages/${encodeURIComponent(id)}/receipts?latest=1` : null,
    fetcher
  );

  const list = data?.items ?? [];
  const latest = list[0] ?? null;
  // v1 compatibility: treat "no data and no error" as loading
  const isLoading = typeof (data as any) === "undefined" && !error ? true : !!(data as any)?.isLoading;

  return {
    latest,
    list,
    refreshReceipts: mutate,
    isLoading,
    error,
  };
}


-useSafeForward.ts: 'use client';

import * as React from 'react';

export type AudienceSelector =
  | { kind: 'EVERYONE' }
  | { kind: 'ROLE'; role: string; mode: 'DYNAMIC' }
  | { kind: 'LIST'; listId: string; mode: 'SNAPSHOT' | 'DYNAMIC' }
  | { kind: 'USERS'; mode: 'SNAPSHOT' | 'DYNAMIC'; userIds?: string[]; snapshotMemberIds?: string[] };

type ForwardCheckResponse = {
  op: 'quote'|'forward';
  decision: 'ALLOW'|'REDACT'|'FORBID';
  subset: 'yes'|'no'|'indeterminate';
  suggestion?: any;
};

export function useSafeForward() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function check(
    op: 'quote'|'forward',
    messageId: string | number,
    facetId: string | number,
    target: AudienceSelector
  ): Promise<ForwardCheckResponse> {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/sheaf/forward-check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ op, messageId: String(messageId), facetId: String(facetId), target }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'forward-check failed');
      return json as ForwardCheckResponse;
    } catch (e: any) {
      setError(e.message ?? String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }

  // Given an original facet payload, and target audience, prepare the outgoing payload based on decision
  function prepareOutgoing(
    decision: ForwardCheckResponse['decision'],
    original: { body: any; attachments?: any[]; facetId: string; messageId: string },
    suggestion?: any
  ) {
    if (decision === 'ALLOW') {
      return {
        mode: 'direct',
        body: original.body,
        attachments: original.attachments ?? [],
        meta: { fromMessageId: original.messageId, fromFacetId: original.facetId },
      };
    }
    if (decision === 'REDACT') {
      return {
        mode: 'redacted',
        body: suggestion?.redactedShell?.body ?? { type: 'text', text: '[[redacted]]' },
        attachments: [],
        meta: suggestion?.redactedShell?.meta ?? { fromMessageId: original.messageId, fromFacetId: original.facetId },
      };
    }
    return { mode: 'blocked' as const };
  }

  return { loading, error, check, prepareOutgoing };
}


-useSheafPreview.ts: 'use client';
import * as React from 'react';

type PreviewReq = {
  draftMessage: { threadId: string|number; authorId: string|number; facets: any[] };
  viewAs: { userId?: string; role?: string; everyone?: boolean };
};

export function useSheafPreview() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<any>(null);

  const preview = async (req: PreviewReq) => {
        setLoading(true); setError(null);
    try {
      const res = await fetch('/api/sheaf/preview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(req),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Preview failed');
      setData(json);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, preview };
}


-useStars.ts:  "use client";
 import useSWR from "swr";
 import { useMemo } from "react";
 import { useAuth } from "@/lib/AuthContext";
 
 const fetcher = (url: string) => fetch(url).then((r) => r.json());
 
 type IdLike = string | number | bigint;
 const toStr = (v: IdLike) => (typeof v === "bigint" ? v.toString() : String(v));
 
 export function useStars(conversationId?: IdLike) {
   const { user } = useAuth();
   const conv = conversationId != null ? toStr(conversationId) : undefined;
 
   const { data, mutate } = useSWR<{ ids: string[]; count: number }>(
     user && conv ? `/api/conversations/${conv}/stars` : null,
     fetcher,
     { refreshInterval: 30000 }
   );
 
   const ids = (data?.ids ?? []).map(String);
   const set = useMemo(() => new Set(ids), [ids]);
 
   function isStarred(messageId: IdLike) {
     return set.has(toStr(messageId));
   }
 
   async function toggleStar(messageId: IdLike) {
     const idStr = toStr(messageId);
     // optimistic
     await mutate(
       (prev) => {
         const cur = new Set((prev?.ids ?? []).map(String));
         if (cur.has(idStr)) cur.delete(idStr);
         else cur.add(idStr);
         return { ids: Array.from(cur), count: cur.size };
       },
       { revalidate: false }
     );
     // server
     await fetch(`/api/messages/${idStr}/star`, { method: "POST" });
     // re-sync
     mutate();
   }
 
   function filterStarred<T extends { id: IdLike }>(messages: T[]) {
     return messages.filter((m) => isStarred(m.id));
   }
 
   return {
     starredIds: ids,
     isStarred,
     toggleStar,
     filterStarred,
     refreshStars: () => mutate(),
   };
 }
 

-useUserInbox.ts: import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseclient";
import { usePrivateChatManager } from "@/contexts/PrivateChatManager";

export function useUserInbox(me: string) {
  const { state, dispatch } = usePrivateChatManager();

  // Keep a live pointer to state to read synchronously inside handlers
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Guard StrictMode / remounts in dev
  const didInit = useRef(false);

  useEffect(() => {
    if (!me) return;
    if (didInit.current) return;
    didInit.current = true;

    console.log("[INBOX] mount for", me);
    const inbox = supabase.channel(`inbox:${me}`, { config: { broadcast: { self: false } } });

    inbox.subscribe((status) => {
      console.log("[INBOX] status:", status, `inbox:${me}`);
    });

    inbox.on("broadcast", { event: "priv_open" }, ({ payload }) => {
      console.log("[INBOX] priv_open payload:", payload);
      const { roomId, from, fromName, fromImage, conversationId } = payload || {};
      if (!roomId || !from || !conversationId) return;
      if (String(from) === String(me)) return;

      dispatch({
        type: "OPEN_OR_INCREMENT",
        pane: {
          id: String(roomId),
          conversationId: String(conversationId),
          peerId: String(from),
          peerName: fromName ?? "User",
          peerImage: fromImage ?? null,
          pos: { x: 420, y: 24 },
        },
      });

      queueMicrotask(() => {
        console.log("[INBOX] after OPEN_OR_INCREMENT:", stateRef.current.panes[String(roomId)]);
      });
    });

    inbox.on("broadcast", { event: "priv_message" }, ({ payload }) => {
      console.log("[INBOX] priv_message payload:", payload);
      const { roomId, from, body, ts, conversationId, fromName, fromImage } = payload || {};
      if (!roomId || !from || !conversationId || !body) return;
      if (String(from) === String(me)) return;

      const rid = String(roomId);
      const pane = stateRef.current.panes[rid];
      const isPaneOpen = !!pane && pane.minimised === false;

      // Always ensure/bump the dock tab
      dispatch({
        type: "OPEN_OR_INCREMENT",
        pane: {
          id: rid,
          conversationId: String(conversationId),
          peerId: String(from),
          peerName: fromName ?? "User",
          peerImage: fromImage ?? null,
          pos: { x: 420, y: 24 },
        },
      });

      // If a floating pane is open, the room channel will append this message.
      // Avoid double-append from inbox.
      if (isPaneOpen) {
        console.log("[INBOX] pane is open → skip ADD_MSG (room will append)");
        return;
      }

      // Pane not open (either minimized or not created yet) → append now
      dispatch({
        type: "ADD_MSG",
        id: rid,
        msg: { paneId: rid, from: String(from), body, ts: ts ?? Date.now() },
      });

      queueMicrotask(() => {
        console.log("[INBOX] after ADD_MSG:", stateRef.current.panes[rid]);
      });
    });

    return () => {
      console.log("[INBOX] unmount", me);
      supabase.removeChannel(inbox);
      didInit.current = false; // optional; dev HMR friendliness
    };
  }, [me, dispatch]);
}


│  │  ├─ conversation.actions.ts

-"use server";

import { prisma } from "@/lib/prismaclient";
import { supabase } from "@/lib/supabaseclient";

export async function getOrCreateDM({
  userAId,
  userBId,
}: {
  userAId: bigint;
  userBId: bigint;
}) {
  const existing = await prisma.conversation.findFirst({
    where: {
      OR: [
        { user1_id: userAId, user2_id: userBId },
        { user1_id: userBId, user2_id: userAId },
      ],
    },
  });
  if (existing) return existing;
  return prisma.$transaction(async (tx) => {
    const convo = await tx.conversation.create({
      data: { user1_id: userAId, user2_id: userBId },
    });
    await tx.conversationParticipant.createMany({
      data: [
        { conversation_id: convo.id, user_id: userAId },
        { conversation_id: convo.id, user_id: userBId },
      ],
    });
    
    return convo;
  });
}

export async function createGroupConversation(
  creatorId: bigint,
  participantIds: bigint[],
  title?: string
) {
  const ids = Array.from(new Set([creatorId, ...participantIds]));
  if (ids.length < 3) throw new Error("Minimum 3 participants required");

  const convo = await prisma.$transaction(async (tx) => {
    const created = await tx.conversation.create({
      data: { title, is_group: true },
    });
    await tx.conversationParticipant.createMany({
      data: ids.map((id) => ({ conversation_id: created.id, user_id: id })),
    });
    return created;
  });

  await Promise.all(
    ids.map(async (id) => {
      const channel = supabase.channel(`user-${id.toString()}`);
      await channel.send({
        type: "broadcast",
        event: "group_created",
        payload: { id: convo.id.toString() },
      });
      supabase.removeChannel(channel);
    })
  );

  return convo;
}

export async function fetchConversations(userId: bigint) {
  return prisma.conversation.findMany({
    where: { participants: { some: { user_id: userId } } },
    include: {
      participants: { include: { user: true } },
      messages: { orderBy: { created_at: "desc" }, take: 1 },
    },
    orderBy: { updated_at: "desc" },
  });
}

export async function fetchConversation(
  conversationId: bigint,
  userId: bigint
) {
  const convo = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      participants: { some: { user_id: userId } },
    },
    include: { participants: { include: { user: true } } },
  });
  if (!convo) throw new Error("Conversation not found");
  return convo;
}



│  │  ├─ message.actions.ts

-"use server";

import { prisma } from "@/lib/prismaclient";
import { supabase } from "@/lib/supabaseclient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { uploadAttachment } from "@/lib/storage/uploadAttachment";
import { jsonSafe } from "../bigintjson";
import { extractUrls } from "@/lib/text/urls";
import { parseMentionsFromText } from "@/lib/text/mentions";
import { broadcast } from "@/lib/realtime/broadcast";
import { getOrFetchLinkPreview, hashUrl } from "@/lib/unfurl";

type SendMessageArgs = {
  senderId: bigint;
  conversationId: bigint;
  text?: string;
  files?: File[];
  driftId?: bigint;
  clientId?: string; // ← new
  meta?: any;             // ← NEW
};

export async function fetchMessages({
  conversationId,
  cursor,
  limit = 50,
}: {
  conversationId: bigint;
  cursor?: bigint;
  limit?: number;
}) {
  return prisma.message.findMany({
    where: {
      conversation_id: conversationId,
      ...(cursor ? { id: { lt: cursor } } : {}),
    },
    orderBy: { id: "desc" },
    take: limit,
    include: { sender: true, attachments: true },
  });
}
export async function sendMessage({
  senderId,
  conversationId,
  text,
  files,
  driftId,
  clientId,
  meta,
}: SendMessageArgs) {
  if (!text && (!files || files.length === 0)) {
    throw new Error("Message must contain text or attachment");
  }

  // 1) DB transaction: create/reuse message, attachments, mentions, touch convo, drift counters
  const result = await prisma.$transaction(async (tx) => {
    // ensure participant
    const member = await tx.conversationParticipant.findFirst({
      where: { conversation_id: conversationId, user_id: senderId },
      select: { user_id: true },
    });
    if (!member) throw new Error("Not a participant in this conversation");


       // If a driftId is provided, validate it belongs to this conversation
       if (driftId) {
         const d = await tx.drift.findFirst({
           where: { id: driftId, conversation_id: conversationId },
           select: { id: true },
         });
         if (!d) throw new Error("Invalid driftId for this conversation");
       }

    // create or reuse (idempotency)
    let message:
      | Awaited<ReturnType<typeof tx.message.create>>
      | Awaited<ReturnType<typeof tx.message.findUnique>>;
    let createdNow = false;

    if (clientId) {
      const existing = await tx.message.findUnique({
        where: { conversation_id_client_id: { conversation_id: conversationId, client_id: clientId } },
        include: { sender: { select: { name: true, image: true } } },
      });
      if (existing) {
        message = existing;
          // 🩹 Repair: if caller passed driftId but reused row has no drift_id, set it now.
       if (driftId && !existing.drift_id) {
           message = await tx.message.update({
             where: { id: existing.id },
             data: { drift_id: driftId },
             include: { sender: { select: { name: true, image: true } } },
           });
         }
      } else {
        message = await tx.message.create({
          data: {
            sender_id: senderId,
            conversation_id: conversationId,
            text,
            drift_id: driftId ?? undefined,
            client_id: clientId,
            meta: meta ?? undefined,
          },
          include: { sender: { select: { name: true, image: true } } },
        });
        createdNow = true;
      }
    } else {
      message = await tx.message.create({
        data: {
          sender_id: senderId,
          conversation_id: conversationId,
          text,
          drift_id: driftId ?? undefined,
          meta: meta ?? undefined,
        },
        include: { sender: { select: { name: true, image: true } } },
      });
      createdNow = true;
    }

    // attachments on first creation only
    let attachments: { id: bigint; path: string; type: string; size: number }[] = [];
    if (createdNow && files?.length) {
      attachments = await Promise.all(
        files.map(async (f) => {
          const up = await uploadAttachment(f);
          return tx.messageAttachment.create({
            data: {
              message_id: message.id,
              path: up.path,
              type: up.type,
              size: up.size,
            },
          });
        })
      );
    }

    // mentions (plain text only) — inside txn
    if (message.text) {
      const tokens = await parseMentionsFromText(
        message.text,
        undefined,
        async (names) => {
          const users = await tx.user.findMany({
            where: { username: { in: names } },
            select: { id: true, username: true },
          });
          return users.map((u) => ({ id: u.id.toString(), username: u.username }));
        }
      );

      if (tokens.length) {
        const ids = tokens
          .map((t) => BigInt(t.userId))
          .filter((uid) => uid !== senderId);
        if (ids.length) {
          const participants = await tx.conversationParticipant.findMany({
            where: { conversation_id: conversationId, user_id: { in: ids } },
            select: { user_id: true },
          });
          const allowed = new Set(participants.map((p) => p.user_id.toString()));
          const rows = tokens
            .filter((t) => allowed.has(t.userId) && BigInt(t.userId) !== senderId)
            .map((t) => ({ messageId: message.id, facetId: null, userId: BigInt(t.userId) }));
          if (rows.length) {
            await tx.messageMention.createMany({ data: rows, skipDuplicates: true });
            // TODO optional: insert notifications here
          }
        }
      }
    }

    // collect URLs (we'll unfurl after commit)
    const urlList = extractUrls(message.text ?? "");

    // touch conversation
    await tx.conversation.update({
      where: { id: conversationId },
      data: { updated_at: new Date() },
    });

    // drift counters (notify live). This can be inside txn (cheap) or after.
    if (createdNow && driftId) {
      const updated = await tx.drift.update({
        where: { id: driftId },
        data: { message_count: { increment: 1 }, last_message_at: new Date() },
        select: { id: true, conversation_id: true, message_count: true, last_message_at: true },
            });
      // supabase
      //   .channel(`conversation-${conversationId.toString()}`)
      //   .send({
      //     type: "broadcast",
      //     event: "drift_counters",
      //     payload: {
      //       driftId: driftId.toString(),
      //       messageCount: updated.message_count,
      //       lastMessageAt: updated.last_message_at?.toISOString() ?? null,
      //     },
      //   })
      //  // after updating drift counters in DB
try {
  await broadcast(`conversation-${message.conversation_id.toString()}`, "drift_counters", {
    driftId: driftId.toString(),
    messageCount: updated.message_count,
    lastMessageAt: updated.last_message_at?.toISOString() ?? null,
  });
} catch (e) {
  console.error("[broadcast] drift_counters failed", e);
}

    }

    return { message, createdNow, attachments, urlList };
  });

  const { message, createdNow, attachments, urlList } = result;

  // 2) Broadcast new_message once (on first creation)
  if (createdNow) {
    const topic = `conversation-${message.conversation_id.toString()}`;
    const payload = {
      id: message.id.toString(),
      conversationId: message.conversation_id.toString(),
      text: message.text ?? null,
      createdAt: message.created_at.toISOString(),
      senderId: message.sender_id.toString(),
      driftId: message.drift_id ? message.drift_id.toString() : null,
      clientId: clientId ?? null,
      sender: { name: (message as any).sender?.name ?? null, image: (message as any).sender?.image ?? null },
      attachments: attachments.map((a) => ({
        id: a.id.toString(),
        path: a.path,
        type: a.type,
        size: a.size,
      })),
    };
  
    try {
      await broadcast(topic, "new_message", payload);
    } catch (e) {
      console.error("[broadcast] new_message failed", e);
    }
  }
  
  
  // 3) Post-commit unfurl (warm cache) and patch open clients
  if (createdNow && Array.isArray(urlList) && urlList.length) {
    for (const url of urlList.slice(0, 8)) {
      getOrFetchLinkPreview(url)
        .then(() =>
          supabase
            .channel(`conversation-${message.conversation_id.toString()}`)
            .send({
              type: "broadcast",
              event: "link_preview_update",
              payload: { messageId: message.id.toString(), urlHash: hashUrl(url) },
            })
            .catch(() => {})
        )
        .catch(() => {});
    }
  }

  // 4) Return the same shape ChatRoom expects (client hydrates later anyway)
  return jsonSafe({
    id: message.id.toString(),
    conversationId: message.conversation_id.toString(),
    text: message.text ?? null,
    createdAt: message.created_at.toISOString(),
    senderId: message.sender_id.toString(),
    driftId: message.drift_id ? message.drift_id.toString() : null,
    clientId: clientId ?? null,
    attachments: [] as any[],
  });
}

 

│  │  ├─ poll.actions.ts

-"use server";

import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/server/getUser";

export async function createPoll(input: {
  conversationId: bigint;
  messageId: bigint;
  kind: "OPTIONS" | "TEMP";
  options?: string[];
}) {
  const user = await getUserFromCookies();
  if (!user?.userId) throw new Error("unauthorized");

  if (input.kind === "OPTIONS") {
    const opts = input.options ?? [];
    if (opts.length < 2 || opts.length > 10) throw new Error("bad options");
  }

  const poll = await prisma.poll.create({
    data: {
      conversation_id: input.conversationId,
      message_id: input.messageId,
      created_by_id: BigInt(user.userId),
      kind: input.kind,
      options: input.kind === "OPTIONS" ? input.options! : undefined,
      max_options: 1,
    },
  });

  return poll;
}

export async function upsertVote(input: {
  pollId: bigint;
  kind: "OPTIONS" | "TEMP";
  optionIdx?: number;
  value?: number;
}) {
  const user = await getUserFromCookies();
  if (!user?.userId) throw new Error("unauthorized");

  const poll = await prisma.poll.findUnique({ where: { id: input.pollId } });
  if (!poll) throw new Error("not found");
  if (poll.kind !== input.kind) throw new Error("bad kind");

  if (poll.kind === "OPTIONS") {
    if (typeof input.optionIdx !== "number") throw new Error("missing optionIdx");
    if (!poll.options || input.optionIdx < 0 || input.optionIdx >= poll.options.length) {
      throw new Error("bad optionIdx");
    }
  } else {
    if (typeof input.value !== "number" || input.value < 0 || input.value > 100) {
      throw new Error("bad value");
    }
  }

  await prisma.pollVote.upsert({
    where: { poll_id_user_id: { poll_id: poll.id, user_id: BigInt(user.userId) } },
    update: { option_idx: input.optionIdx ?? null, value: input.value ?? null },
    create: {
      poll_id: poll.id,
      user_id: BigInt(user.userId),
      option_idx: input.optionIdx ?? null,
      value: input.value ?? null,
    },
  });

  if (poll.kind === "OPTIONS") {
    const rows = await prisma.pollVote.groupBy({
      by: ["option_idx"],
      where: { poll_id: poll.id },
      _count: { _all: true },
    });
    const totals = new Array(poll.options?.length ?? 0).fill(0);
    for (const r of rows) {
      const idx = r.option_idx ?? -1;
      if (idx >= 0 && idx < totals.length) totals[idx] = r._count._all;
    }
    const count = rows.reduce((a, r) => a + r._count._all, 0);
    return {
      poll,
      state: {
        kind: "OPTIONS" as const,
        pollId: String(poll.id),
        totals,
        count,
      },
    };
  } else {
    const agg = await prisma.pollVote.aggregate({
      where: { poll_id: poll.id, value: { not: null } },
      _avg: { value: true },
      _count: { _all: true },
    });
    return {
      poll,
      state: {
        kind: "TEMP" as const,
        pollId: String(poll.id),
        avg: Math.round(agg._avg.value ?? 0),
        count: agg._count._all ?? 0,
      },
    };
  }
}



│  │  ├─ user.actions.ts

-"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "../prismaclient";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { getUserFromCookies } from "../serverutils";
import { User } from "@prisma/client";
const userCacheById = new Map<bigint, User| null>();
const userCacheByAuthId = new Map<string, User | null>();

export async function clearUserCache() {
  userCacheById.clear();
  userCacheByAuthId.clear();
}

export interface UpdateUserParams {
  userAuthId: string;
  username: string;
  name: string;
  bio: string;
  image: string;
  path: string;
}

export interface FetchUsersParams {
  userId: bigint;
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: Prisma.SortOrder;
}

export async function updateUser({
  userAuthId,
  username,
  name,
  bio,
  image,
  path,
}: UpdateUserParams) {
  try {
    const result = await prisma.user.upsert({
      where: {
        auth_id: userAuthId,
      },
      update: {
        username: username.toLowerCase(),
        name: name,
        bio: bio,
        image: image,
        onboarded: true,
      },
      create: {
        auth_id: userAuthId,
        username: username.toLowerCase(),
        name: name,
        bio: bio,
        image: image,
        onboarded: true,
      },
    });
    if (path === "/profile/edit") {
      revalidatePath(path);
    }
    return result;
  } catch (error: any) {
    throw new Error(`Failed to create/update user: ${error.message}`);
  }
}

export async function updateUserBio({ bio, path }: { bio: string; path: string }) {
  const user = await getUserFromCookies();
  if (!user) {
    throw new Error("User not authenticated");
  }
  try {
    await prisma.user.update({
      where: {
        id: user.userId!,
      },
      data: { bio },
    });
    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to update bio: ${error.message}`);
  }
}

export async function fetchUserByAuthId(userAuthId: string) {
  if (userCacheByAuthId.has(userAuthId)) {
    return userCacheByAuthId.get(userAuthId) ?? null;
  }
  try {

    await prisma.$connect();
    const user = await prisma.user.findUnique({
      where: {
        auth_id: userAuthId,
      },
    });
    userCacheByAuthId.set(userAuthId, user ?? null);
    if (user) {
      userCacheById.set(user.id, user);
    }
    return user;
  } catch (error: any) {
    throw new Error(`Failed to get user: ${error.message}`);
  }
}

export async function fetchUser(userId: bigint) {
  if (userCacheById.has(userId)) {
    return userCacheById.get(userId) ?? null;
  }
  try {

    await prisma.$connect();
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    userCacheById.set(userId, user ?? null);
    if (user) {
      userCacheByAuthId.set(user.auth_id, user);
    }
    return user;
  } catch (error: any) {
    throw new Error(`Failed to get user: ${error.message}`);
  }
}

export async function fetchUserByUsername(username: string) {
  try {
    return await prisma.user.findFirst({
      where: { username: username.toLowerCase() },
    });
  } catch (error: any) {
    throw new Error(`Failed to get user: ${error.message}`);
  }
}

export async function fetchUserThreads(userId: bigint) {
  try {
    const posts = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        posts: {
          where: {
            OR: [
              { expiration_date: null },
              { expiration_date: { gt: new Date() } },
            ],
          },
          include: {
            author: true,
            children: {
              include: {
                author: {
                  select: {
                    name: true,
                    image: true,
                    id: true,
                  },
                },
                _count: { select: { children: true } },
              },
            },
            _count: { select: { children: true } },
          },
          orderBy: {
            created_at: Prisma.SortOrder.desc,
          },
        },
      },
    });
    if (!posts) return null;
    const mapped = {
      ...posts,
      posts: posts.posts.map((p) => ({
        ...p,
        commentCount: p._count.children,
        children: p.children.map((c) => ({
          ...c,
          commentCount: c._count.children,
        })),
      })),
    };
    return mapped;
  } catch (error: any) {
    throw new Error(`Failed to fetch user threads: ${error.message}`);
  }
}

export async function fetchUsers({
  userId,
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = Prisma.SortOrder.desc,
}: FetchUsersParams) {
  try {
    const skipAmount = (pageNumber - 1) * pageSize;
    const query: Prisma.UserWhereInput[] = [
      {
        NOT: {
          id: userId,
        },
      },
    ];
    if (searchString.trim() !== "") {
      const orQuery: Prisma.UserWhereInput = {
        OR: [
          {
            username: {
              contains: searchString,
            },
          },
          {
            name: {
              contains: searchString,
            },
          },
        ],
      };
      query.push(orQuery);
    }
    const users = await prisma.user.findMany({
      where: {
        AND: query,
      },
      skip: skipAmount,
      take: pageSize,
      orderBy: {
        created_at: sortBy,
      },
    });
    const totalUsersCount = await prisma.user.count({
      where: {
        AND: query,
      },
    });
    const isNext = totalUsersCount > skipAmount + users.length;
    return { users, isNext };
  } catch (error: any) {
    throw new Error(`Failed to fetch users ${error.message}`);
  }
}

export async function getActivity(userId: bigint) {
  try {
    const userThreads = await prisma.feedPost.findMany({
      where: {
        author_id: userId,
      },
      include: {
        children: {
          select: {
            id: true,
          },
        },
      },
    });

    const childThreadIds = userThreads.flatMap((userThread) =>
      userThread.children.map((child) => child.id)
    );
    const replies = await prisma.feedPost.findMany({
      where: {
        AND: [
          {
            id: {
              in: childThreadIds,
            },
            author_id: {
              not: userId,
            },
          },
        ],
      },
      include: {
        author: {
          select: {
            name: true,
            image: true,
            id: true,
          },
        },
      },
    });
    return replies;
  } catch (error: any) {
    throw new Error(`Failed to fetch activity ${error.message}`);
  }
}

export async function fetchRandomUsers(count = 3) {
  try {
    const total = await prisma.user.count({
      where: { onboarded: true },
    });
    const take = Math.min(count, total);
    if (take === 0) return [];
    const skip = Math.max(0, Math.floor(Math.random() * Math.max(total - take + 1, 1)));
    const users = await prisma.user.findMany({
      where: { onboarded: true },
      skip,
      take,
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
      },
    });
    return users.map((u) => ({
      ...u,
      id: Number(u.id),
    }));
  } catch (error: any) {
    throw new Error(`Failed to fetch random users: ${error.message}`);
  }
}

export interface CreateDefaultUserParams {
  authId: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

export async function createDefaultUser({
  authId,
  email,
  name,
  image,
}: CreateDefaultUserParams) {
  try {
    const usernameBase = email ? email.split("@")[0] : `user-${nanoid(6)}`;
    const user = await prisma.user.create({
      data: {
        auth_id: authId,
        username: usernameBase.toLowerCase(),
        name: name ?? "New User",
        bio: "",
        image: image ?? null,
        onboarded: true,
      },
    });
    return user;
  } catch (error: any) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.user.findUnique({
        where: { auth_id: authId },
      });
      if (existing) {
        return existing;
      }
    }
    throw new Error(`Failed to create user: ${error.message}`);
  }
}



│  ├─ chat
│  │  ├─ makePrivateRoomId.ts
│  │  ├─ permalink.ts
│  │  ├─ roomId.ts
│  │  └─ roomKey.ts

-// lib/chat/roomKey.ts
export function makePrivateRoomId(conversationId: string, a: string, b: string) {
  const [x, y] = [a, b].map(String).sort((m, n) => (BigInt(m) < BigInt(n) ? -1 : 1));
  return `dm:${conversationId}:${x}:${y}`;
}


-export function messagePermalink(conversationId: string, messageId: string) {
    return `/messages/${conversationId}?mid=${encodeURIComponent(messageId)}`;
  }

-// lib/chat/roomKey.ts
export function dmRoomId(conversationId: string, a: string, b: string) {
  const [x, y] = [a, b].map(String).sort((m, n) => (BigInt(m) < BigInt(n) ? -1 : 1));
  return `dm:${conversationId}:${x}:${y}`;
}

-// lib/chat/roomKey.ts
export function roomKey(conversationId: string, a: string, b: string) {
  const [x, y] = [a, b].map(String).sort((m, n) => (BigInt(m) < BigInt(n) ? -1 : 1));
  return `dm:${conversationId}:${x}:${y}`;
}



│  ├─ sheaf
│  │  ├─ conflict.ts
│  │  ├─ resolveQuote.ts
│  │  └─ visibility.ts
│  ├─ slug.ts
│  ├─ socket.ts

-// lib/sheaf/resolveQuote.ts
import { toAclFacet } from '@/app/api/sheaf/_map'; // or your actual import
import { s } from '@/app/api/sheaf/_util';

// Minimal shapes to avoid Prisma types here
export type QuoteSpec = { sourceMessageId: bigint; sourceFacetId?: bigint | null };
export type QuoteDTO =
  | { sourceMessageId: string; sourceFacetId?: string; status: "redacted" | "unavailable" }
  | {
      sourceMessageId: string;
      sourceFacetId?: string;
      status: "ok";
      body: unknown | null;
      attachments: Array<{ id: string; name?: string; mime: string; size: number; sha256?: string; path?: string | null }>;
      isEdited: boolean;
      sourceAuthor?: { name: string | null; image: string | null } | null;
      updatedAt?: string | null;
    };

function toMs(v?: number | string | Date | null): number {
  if (!v) return 0;
  if (typeof v === "number") return v;
  const t = new Date(v as any).getTime();
  return Number.isFinite(t) ? t : 0;
}

type ResolveDeps = {
  // lookups preloaded by your route:
  srcMsgById: Map<string, { id: bigint; text: string | null; is_redacted: boolean; edited_at: Date | null; sender?: { name: string | null; image: string | null } | null; attachments: { id: bigint; path: string; type: string; size: number }[] }>;
  srcFacetById: Map<string, any>; // raw facet rows -> will pass through toAclFacet
  srcAttByFacet: Map<string, any[]>;
  // ACL visibility (optional):
  requireSourceVisibility?: boolean; // default false: ALLOW lets you re-share
  // If true, provide a function that returns whether viewer can see this facet now:
  canViewerSeeFacetNow?: (rawFacet: any) => boolean | Promise<boolean>;
};

export async function resolveQuoteForViewer(q: QuoteSpec, deps: ResolveDeps): Promise<QuoteDTO> {
  const { srcMsgById, srcFacetById, srcAttByFacet, requireSourceVisibility = false, canViewerSeeFacetNow } = deps;

  const sm = srcMsgById.get(q.sourceMessageId.toString());
  if (!sm) return { sourceMessageId: s(q.sourceMessageId), status: "unavailable" };
  if (sm.is_redacted) return { sourceMessageId: s(q.sourceMessageId), status: "redacted" };

  // Quoting a specific facet
  if (q.sourceFacetId) {
    const raw = srcFacetById.get(q.sourceFacetId.toString());
    if (!raw)
      return { sourceMessageId: s(q.sourceMessageId), sourceFacetId: s(q.sourceFacetId), status: "unavailable" };

    if (requireSourceVisibility && canViewerSeeFacetNow) {
      const ok = await canViewerSeeFacetNow(raw);
      if (!ok) return { sourceMessageId: s(q.sourceMessageId), sourceFacetId: s(q.sourceFacetId), status: "unavailable" };
    }

    const af = toAclFacet(raw); // { sharePolicy, body, createdAt, updatedAt, id, ... }
    if (af.sharePolicy === "FORBID")
      return { sourceMessageId: s(q.sourceMessageId), sourceFacetId: s(q.sourceFacetId), status: "unavailable" };
    if (af.sharePolicy === "REDACT")
      return { sourceMessageId: s(q.sourceMessageId), sourceFacetId: s(q.sourceFacetId), status: "redacted" };

    // ALLOW
    const isEdited = toMs(af.updatedAt) > toMs(af.createdAt);
    return {
      sourceMessageId: s(q.sourceMessageId),
      sourceFacetId: s(q.sourceFacetId),
      status: "ok",
      body: af.body ?? null,
      attachments: srcAttByFacet.get(af.id) ?? [],
      isEdited,
      sourceAuthor: { name: sm.sender?.name ?? null, image: sm.sender?.image ?? null },
      updatedAt: af.updatedAt ?? null,
    };
  }

  // Quote the plain message
  const isEdited = !!sm.edited_at;
  return {
    sourceMessageId: s(q.sourceMessageId),
    status: "ok",
    body: sm.text ?? null,
    attachments: sm.attachments.map((a) => ({
      id: a.id.toString(),
      name: a.path.split("/").pop() ?? a.path,
      mime: a.type,
      size: a.size,
      sha256: "",
      path: a.path,
    })),
    isEdited,
    sourceAuthor: { name: sm.sender?.name ?? null, image: sm.sender?.image ?? null },
    updatedAt: sm.edited_at ? sm.edited_at.toISOString() : null,
  };
}

-lib/sheaf/conflict.ts: import type { AudienceSelector, MessageFacet } from '@app/sheaf-acl';
import { audienceSubsetOf } from '@app/sheaf-acl';
import type { AudienceEnv } from '@app/sheaf-acl';

function extractText(body: any): string {
  if (!body) return '';
  if (typeof body === 'string') return body;
  if (typeof body.text === 'string') return body.text;
  // TipTap JSON: concatenate text nodes
  try {
    const parts: string[] = [];
    const walk = (node: any) => {
      if (!node) return;
      if (typeof node.text === 'string') parts.push(node.text);
      if (Array.isArray(node.content)) node.content.forEach(walk);
    };
    walk(body);
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  } catch { return ''; }
}

function jaccard(a: Set<string>, b: Set<string>) {
  const inter = new Set([...a].filter(x => b.has(x))).size;
  const uni = new Set([...a, ...b]).size || 1;
  return inter / uni;
}

function tokenize(s: string) {
  return new Set(s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').split(/\s+/).filter(Boolean));
}

function likelyOverlap(a: AudienceSelector, b: AudienceSelector, env?: AudienceEnv): 'yes'|'no'|'maybe' {
  const triAB = audienceSubsetOf(a, b, env);
  const triBA = audienceSubsetOf(b, a, env);
  if (triAB === 'yes' || triBA === 'yes') return 'yes';       // subset either way -> overlap
  if (triAB === 'no' && triBA === 'no') return 'maybe';        // could still partially overlap
  // quick known-disjoint checks
  if (a.kind === 'USERS' && b.kind === 'USERS' && a.mode === 'SNAPSHOT' && b.mode === 'SNAPSHOT') {
    const A = new Set((a.snapshotMemberIds ?? a.userIds ?? []).map(String));
    const B = new Set((b.snapshotMemberIds ?? b.userIds ?? []).map(String));
    const inter = [...A].some(x => B.has(x));
    return inter ? 'yes' : 'no';
  }
  return 'maybe';
}

export type Conflict = {
  aFacetId: string;
  bFacetId: string;
  overlap: 'yes'|'no'|'maybe';
  textSim: number;          // 0..1 (Jaccard over tokens)
  severity: 'INFO'|'WARN'|'HIGH';
  note: string;
};

export function detectFacetConflicts(
  facets: MessageFacet[],
  env?: AudienceEnv,
  opts?: { highDivergenceBelowSim?: number; warnDivergenceBelowSim?: number }
): Conflict[] {
  const HIGH = opts?.highDivergenceBelowSim ?? 0.35; // lower sim -> more divergent
  const WARN = opts?.warnDivergenceBelowSim ?? 0.55;

  const texts = new Map(facets.map(f => [f.id, tokenize(extractText(f.body))]));
  const out: Conflict[] = [];

  for (let i = 0; i < facets.length; i++) {
    for (let j = i + 1; j < facets.length; j++) {
      const a = facets[i], b = facets[j];
      const overlap = likelyOverlap(a.audience, b.audience, env);
      if (overlap === 'no') continue;

      const sim = jaccard(texts.get(a.id)!, texts.get(b.id)!); // 0..1
      const severity =
        overlap === 'yes' && sim <= HIGH ? 'HIGH'
        : sim <= WARN ? 'WARN'
        : 'INFO';

      if (severity !== 'INFO') {
        out.push({
          aFacetId: a.id,
          bFacetId: b.id,
          overlap,
          textSim: sim,
          severity,
          note:
            severity === 'HIGH'
              ? 'Facets likely address overlapping audiences but diverge significantly.'
              : 'Facets may overlap with noticeable differences.',
        });
      }
    }
  }
  return out;
}

-// lib/sheaf/visibility.ts
import { prisma } from "@/lib/prismaclient";

/**
 * These are the only fields we need from a facet to decide visibility.
 * They match your SheafFacet columns.
 */
export type AudienceKind = "EVERYONE" | "ROLE" | "LIST" | "USERS";
export type AudienceMode = "DYNAMIC" | "SNAPSHOT";

export type FacetVisibilityFields = {
  audienceKind: AudienceKind;
  audienceMode: AudienceMode;
  audienceRole: string | null;
  audienceListId: string | null;
  snapshotMemberIds: string[]; // snapshot of user IDs as strings
  audienceUserIds: string[];   // dynamic user IDs as strings
};

/**
 * Can `userId` see this facet *right now*?
 * - EVERYONE: always true
 * - USERS:   SNAPSHOT → in snapshotMemberIds; DYNAMIC → in audienceUserIds
 * - ROLE:    user has given role
 * - LIST:    SNAPSHOT → in snapshotMemberIds; DYNAMIC → in current SheafAudienceList.memberIds
 */
export async function canUserSeeFacetNow(
  userId: bigint,
  facet: FacetVisibilityFields
): Promise<boolean> {
  const uid = userId.toString();
  const mode: AudienceMode = facet.audienceMode ?? "DYNAMIC";

  switch (facet.audienceKind) {
    case "EVERYONE":
      return true;

    case "USERS":
      if (mode === "SNAPSHOT") {
        return Array.isArray(facet.snapshotMemberIds) && facet.snapshotMemberIds.includes(uid);
      }
      return Array.isArray(facet.audienceUserIds) && facet.audienceUserIds.includes(uid);

    case "ROLE": {
      const role = (facet.audienceRole || "").trim();
      if (!role) return false;
      // Composite PK exists in your schema: @@id([userId, role])
      const has = await prisma.userRole.findUnique({
        where: { userId_role: { userId, role } },
        select: { userId: true },
      });
      return !!has;
    }

    case "LIST": {
      if (mode === "SNAPSHOT") {
        return Array.isArray(facet.snapshotMemberIds) && facet.snapshotMemberIds.includes(uid);
      }
      const listId = facet.audienceListId;
      if (!listId) return false;
      const list = await prisma.sheafAudienceList.findUnique({
        where: { id: listId },
        select: { memberIds: true },
      });
      return !!list?.memberIds?.includes(uid);
    }

    default:
      return false;
  }
}

