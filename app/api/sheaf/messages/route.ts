import { NextRequest } from "next/server";
import { prisma } from "../_prisma";
import { jsonSafe } from "@/lib/bigintjson";
import { readJSON, ok, badRequest, toBigInt, s } from "../_util";
import { toAclFacet, userCtxFrom } from "../_map";
import type { AudienceSelector } from "@app/sheaf-acl";
import {
  visibleFacetsFor,
  defaultFacetFor,
  priorityRank,
} from "@app/sheaf-acl";
// ---------- GET /api/sheaf/messages?userId=...&conversationId=...&messageId=... ----------
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return badRequest("Missing userId");

  const convo = searchParams.get("conversationId");
  const messageId = searchParams.get("messageId");
  const driftId = searchParams.get("driftId");

  // Build where
  let whereMsg: any = {};
  if (messageId) {
    whereMsg.id = toBigInt(messageId);
  } else if (convo) {
    whereMsg.conversation_id = toBigInt(convo);
  }
   // 🔒 Main timeline: exclude drift children on conversation view.
  // We only want top-level messages (anchors are top-level too since drift_id is null).
  if (!messageId && convo && !driftId) {
    whereMsg.drift_id = null;
  }
  // When a drift is requested explicitly, scope to that drift.
  if (driftId) {
    whereMsg.drift_id = toBigInt(driftId);
  }
  if (driftId) {
        // When driftId is present, scope to messages inside that drift
        whereMsg.drift_id = toBigInt(driftId);
      }

  const viewer = await prisma.user.findUnique({
    where: { id: toBigInt(userId) },
  });
  if (!viewer) return badRequest("Unknown userId");

  const viewerRoles = await prisma.userRole.findMany({
    where: { userId: viewer.id },
  });
  const rolesArr = viewerRoles.map((r) => r.role);

  // Load messages (with sender + top-level attachments)
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
     
      sender: { select: { name: true, image: true } }, // 👈 avatar
      attachments: { select: { id: true, path: true, type: true, size: true } }, // 👈 top-level attachments
    },
  });

  const messageIds = messages.map((m) => m.id);
  if (messageIds.length === 0) return ok({ userId, messages: [] });

  // Load Sheaf facets (if any)
  const facets = await prisma.sheafFacet.findMany({
    where: { messageId: { in: messageIds } },
  });

  // Preload lists for dynamic checks
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

  const ctx = userCtxFrom(viewer, rolesArr, lists);

  // Build DTOs
  const results = messages
    .map((m) => {
 // 🔒 If the message is redacted, return a tombstone immediately
        const isRedacted = !!(m as any).is_redacted;
        if (isRedacted) {
          return {
            id: s(m.id),
            senderId: s(m.sender_id),
            sender: {
              name: m.sender?.name ?? null,
              image: m.sender?.image ?? null,
            },
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

      // ✅ PLAIN MESSAGE: no Sheaf facets at all → return text + top-level attachments
      if (raw.length === 0) {
        return {
          id: s(m.id),
          senderId: s(m.sender_id),
          sender: {
            name: m.sender?.name ?? null,
            image: m.sender?.image ?? null,
          },
          createdAt: m.created_at.toISOString(),
          driftId: m.drift_id ? s(m.drift_id) : null,
          meta: (m.meta as any) ?? null,
          isRedacted: false,
          facets: [], // no layers
          defaultFacetId: null,
          text: m.text ?? null,
          attachments: m.attachments.map((a) => ({
            id: a.id.toString(),
            path: a.path,
            type: a.type,
            size: a.size,
          })),
        };
      }

      // Sheaf message with facets
      const fs = raw.map(toAclFacet).map((af) => ({
        ...af,
        attachments: attByFacet.get(af.id) ?? [],
      }));

      const visible = visibleFacetsFor(ctx, fs as any);

      // If viewer can’t see any facet, but the message has a plain text fallback, show text.
      if (visible.length === 0) {
        if (m.text || m.attachments.length) {
          return {
            id: s(m.id),
            senderId: s(m.sender_id),
            sender: {
              name: m.sender?.name ?? null,
              image: m.sender?.image ?? null,
            },
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
          };
        }
        // Otherwise, hidden to this viewer
        return null;
      }

      const def = defaultFacetFor(ctx, fs as any);

      return {
        id: s(m.id),
        senderId: s(m.sender_id),
        sender: {
          name: m.sender?.name ?? null,
          image: m.sender?.image ?? null,
        }, // 👈 avatar
        createdAt: m.created_at.toISOString(),
        isRedacted: false,
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
        })),
        defaultFacetId: def?.id ?? visible[0].id,
        text: m.text ?? null,
        attachments: m.attachments.map((a) => ({
          id: a.id.toString(),
          path: a.path,
          type: a.type,
          size: a.size,
        })),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const ordered = messageId
    ? results // single hydrate: keep as-is
    : [...results].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

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
  };

  let body: Body;
  try {
    body = await readJSON<Body>(req);
  } catch {
    return badRequest("Invalid JSON");
  }

  const { conversationId, authorId, facets, text, defaultFacetIndex } = body;

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
