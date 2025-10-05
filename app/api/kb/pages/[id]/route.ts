// // // app/api/kb/pages/[id]/route.ts
// // import { NextRequest, NextResponse } from 'next/server';
// // import { prisma } from '@/lib/prismaclient';
// // import { getUserFromCookies } from '@/lib/serverutils';
// // import { requireKbRole, fail } from '@/lib/kb/withSpaceAuth';

// // export const dynamic = 'force-dynamic';
// // export const revalidate = 0;

// // const NO_STORE = { headers: { 'Cache-Control': 'no-store' } } as const;

// // async function assertReadable(pageId: string, userId: string) {
// //   // One trip: page → space → member
// //   const row = await prisma.kbPage.findUnique({
// //     where: { id: pageId },
// //     select: {
// //       id: true, title: true, spaceId: true, createdById: true, updatedAt: true, visibility: true,
// //       space: {
// //         select: {
// //           id: true,
// //           members: { where: { userId }, select: { role: true }, take: 1 },
// //         },
// //       },
// //     },
// //   });

// //   if (!row) return { ok: false as const, code: 404 as const };
// //   const isMember = !!row.space.members.length;
// //   const isOwner  = String(row.createdById) === String(userId);

// //   // For Phase‑A keep it simple: owner or space member can read
// //   if (!isMember && !isOwner) return { ok: false as const, code: 403 as const };

// //   return { ok: true as const, page: row };
// // }

// // export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
// //   try {
// //     await requireKbRole(req, { pageId: params.id, need: 'reader' });

// //     const row = await prisma.kbPage.findUnique({
// //       where: { id: params.id },
// //       select: {
// //         id: true, title: true, summary: true, spaceId: true, createdById: true,
// //         updatedAt: true, visibility: true, tags: true, frontmatter: true,
// //       },
// //     });
// //     if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });

// //     return NextResponse.json({ ok: true, page: row }, NO_STORE);
// //   } catch (err) {
// //     return fail(err);
// //   }
// // }

// // export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
// //   try {
// //     const { userId } = await requireKbRole(req, { pageId: params.id, need: 'editor' });

// //     const body = await req.json().catch(() => ({} as any));
// //     const data: any = {};

// //     if (typeof body?.title === 'string')   data.title   = body.title.trim();
// //     if (typeof body?.summary === 'string' || body?.summary === null) data.summary = body.summary;
// //     if (Array.isArray(body?.tags))         data.tags    = body.tags.filter((t: unknown) => typeof t === 'string').slice(0, 16);
// //     if (body?.frontmatter && typeof body.frontmatter === 'object') data.frontmatter = body.frontmatter;

// //     if (!Object.keys(data).length) {
// //       return NextResponse.json({ ok: true, page: { id: params.id } }, NO_STORE);
// //     }

// //     // NOTE: do NOT set updatedById (column doesn’t exist in schema).
// //     const page = await prisma.kbPage.update({
// //       where: { id: params.id },
// //       data,
// //       select: { id: true, title: true, summary: true, tags: true, updatedAt: true },
// //     });

// //     return NextResponse.json({ ok: true, page }, NO_STORE);
// //   } catch (err) {
// //     return fail(err);
// //   }
// // }
// // app/api/kb/pages/[id]/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prismaclient';
// import { requireKbRole, fail } from '@/lib/kb/withSpaceAuth';

// export const dynamic = 'force-dynamic';
// export const revalidate = 0;
// const NO_STORE = { headers: { 'Cache-Control': 'no-store' } } as const;

// export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     await requireKbRole(_req, { pageId: params.id, need: 'reader' });
//     const row = await prisma.kbPage.findUnique({
//       where: { id: params.id },
//       select: { id: true, title: true, summary: true, tags: true, frontmatter: true, spaceId: true, createdById: true, updatedAt: true },
//     });
//     if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });
//     return NextResponse.json({ ok: true, page: row }, NO_STORE);
//   } catch (e) { return fail(e); }
// }

// export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     await requireKbRole(req, { pageId: params.id, need: 'editor' });
//     const body = await req.json().catch(() => ({} as any));
//     const data: any = {};
//     if (typeof body?.title === 'string') data.title = body.title.trim();
//     if (typeof body?.summary === 'string' || body?.summary === null) data.summary = body.summary;
//     if (Array.isArray(body?.tags)) data.tags = body.tags.filter((t: unknown) => typeof t === 'string').slice(0, 16);
//     if (body?.frontmatter && typeof body.frontmatter === 'object') data.frontmatter = body.frontmatter;

//     if (!Object.keys(data).length) return NextResponse.json({ ok: true, page: { id: params.id } }, NO_STORE);

//     const page = await prisma.kbPage.update({
//       where: { id: params.id },
//       data, // NOTE: no 'updatedById' column in schema; do not set it.
//       select: { id: true, title: true, summary: true, tags: true, updatedAt: true },
//     }).catch(() => null);

//     if (!page) return NextResponse.json({ error: 'not_found' }, { status: 404 });
//     return NextResponse.json({ ok: true, page }, NO_STORE);
//   } catch (e) { return fail(e); }
// }
// app/api/kb/pages/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismaclient';
import { requireKbRole, fail } from '@/lib/kb/withSpaceAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
const NO_STORE = { headers: { 'Cache-Control': 'no-store' } } as const;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireKbRole(_req, { pageId: params.id, need: 'reader' });
    const row = await prisma.kbPage.findUnique({
      where: { id: params.id },
      select: { id: true, title: true, summary: true, tags: true, frontmatter: true, spaceId: true, createdById: true, updatedAt: true },
    });
    if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json({ ok: true, page: row }, NO_STORE);
  } catch (e) { return fail(e); }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireKbRole(req, { pageId: params.id, need: 'editor' });
    const body = await req.json().catch(() => ({} as any));
    const data: any = {};
    if (typeof body?.title === 'string') data.title = body.title.trim();
    if (typeof body?.summary === 'string' || body?.summary === null) data.summary = body.summary;
    if (Array.isArray(body?.tags)) data.tags = body.tags.filter((t: unknown) => typeof t === 'string').slice(0, 16);
    if (body?.frontmatter && typeof body.frontmatter === 'object') data.frontmatter = body.frontmatter;

    if (!Object.keys(data).length) return NextResponse.json({ ok: true, page: { id: params.id } }, NO_STORE);

    const page = await prisma.kbPage.update({
      where: { id: params.id },
      data, // NOTE: no 'updatedById' column in schema; do not set it.
      select: { id: true, title: true, summary: true, tags: true, updatedAt: true },
    }).catch(() => null);

    if (!page) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json({ ok: true, page }, NO_STORE);
  } catch (e) { return fail(e); }
}
