/**
 * Public Sources API - Get Single Source
 *
 * @route GET /api/v1/sources/[sourceId]
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaclient";
import {
  apiMiddleware,
  apiSuccess,
  apiError,
  handleCorsPreFlight,
} from "@/lib/api/middleware";

interface RouteParams {
  params: Promise<{ sourceId: string }>;
}

/**
 * Handle CORS preflight
 */
export async function OPTIONS(req: NextRequest) {
  return handleCorsPreFlight(req);
}

/**
 * Get a source by ID
 *
 * Query params:
 * - include: Comma-separated list of relations to include (citations, stacks)
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  // Authenticate
  const auth = await apiMiddleware(req, ["read:sources"]);
  if (!auth.authorized) return auth.error!;

  const { sourceId } = await params;
  const { searchParams } = new URL(req.url);
  const include = searchParams.get("include")?.split(",") || [];

  try {
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
      include: {
        verification: {
          select: {
            id: true,
            status: true,
            verifiedAt: true,
            score: true,
            httpStatus: true,
            lastCheckedAt: true,
          },
        },
        // Conditionally include citations
        ...(include.includes("citations") && {
          citations: {
            select: {
              id: true,
              targetId: true,
              targetType: true,
              intent: true,
              quote: true,
              locator: true,
              createdAt: true,
            },
            take: 50,
          },
        }),
        // Conditionally include stacks
        ...(include.includes("stacks") && {
          stackItems: {
            include: {
              stack: {
                select: {
                  id: true,
                  name: true,
                  visibility: true,
                  ownerId: true,
                },
              },
            },
            take: 20,
          },
        }),
        _count: {
          select: { citations: true },
        },
      },
    });

    if (!source) {
      return apiError("not_found", "Source not found", 404);
    }

    // Transform response
    const data = {
      id: source.id,
      title: source.title,
      authors: parseAuthors(source.authors),
      year: source.publicationDate
        ? new Date(source.publicationDate).getFullYear()
        : null,
      publicationDate: source.publicationDate,
      doi: source.doi,
      url: source.url,
      type: source.type,
      container: source.container,
      publisher: source.publisher,
      volume: source.volume,
      issue: source.issue,
      pages: source.pages,
      abstract: source.abstract,
      language: source.language,
      isOpenAccess: source.isOpenAccess,
      pdfUrl: source.pdfUrl,
      citationCount: source._count.citations,
      verification: source.verification
        ? {
            status: source.verification.status,
            verifiedAt: source.verification.verifiedAt,
            score: source.verification.score,
            httpStatus: source.verification.httpStatus,
            lastCheckedAt: source.verification.lastCheckedAt,
          }
        : null,
      // Optional includes
      ...(include.includes("citations") && {
        citations: source.citations,
      }),
      ...(include.includes("stacks") && {
        stacks: source.stackItems
          ?.filter((item) => {
            // Only show public stacks or stacks owned by the API user
            const stack = item.stack;
            return (
              stack.visibility === "public_open" ||
              stack.visibility === "public_closed" ||
              stack.visibility === "unlisted" ||
              stack.ownerId === auth.user?.id
            );
          })
          .map((item) => ({
            id: item.stack.id,
            name: item.stack.name,
            visibility: item.stack.visibility,
          })),
      }),
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
    };

    return apiSuccess(data);
  } catch (error) {
    console.error("[API] Get source error:", error);
    return apiError("fetch_failed", "Failed to fetch source", 500);
  }
}

/**
 * Parse authors from JSON string or array
 */
function parseAuthors(authors: string | null): Array<{ name: string }> {
  if (!authors) return [];

  try {
    const parsed = JSON.parse(authors);
    if (Array.isArray(parsed)) {
      return parsed.map((a: string | { name?: string }) =>
        typeof a === "string" ? { name: a } : { name: a.name || "" }
      );
    }
  } catch {
    return authors.split(",").map((a) => ({ name: a.trim() }));
  }

  return [];
}
