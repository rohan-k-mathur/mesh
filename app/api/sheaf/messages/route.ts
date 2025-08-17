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
          attachments: m.attachments.map(a => ({ id: a.id.toString(), path: a.path, type: a.type, size: a.size })),
          isRedacted: false,
          edited,
          quotes,
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

      return {
        id: s(m.id),
        senderId: s(m.sender_id),
        sender: { name: m.sender?.name ?? null, image: m.sender?.image ?? null },
        createdAt: m.created_at.toISOString(),
        driftId: m.drift_id ? s(m.drift_id) : null,
        meta: (m.meta as any) ?? null,
        facets: visible.map((f: any) => ({
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
        })),
        defaultFacetId: defId,
        text: m.text ?? null,
        attachments: m.attachments.map(a => ({ id: a.id.toString(), path: a.path, type: a.type, size: a.size })),
        isRedacted: false,
        edited,    // neutral indicator for the shown facet
        quotes,
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
