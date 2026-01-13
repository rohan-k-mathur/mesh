/**
 * Public Sources API - List/Search
 *
 * @route GET /api/v1/sources
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaclient";
import {
  apiMiddleware,
  apiPaginated,
  apiError,
  handleCorsPreFlight,
} from "@/lib/api/middleware";

/**
 * Handle CORS preflight
 */
export async function OPTIONS(req: NextRequest) {
  return handleCorsPreFlight(req);
}

/**
 * Search and list sources
 *
 * Query params:
 * - q: Search query (searches title, abstract)
 * - doi: Filter by DOI
 * - type: Filter by source type
 * - verified: Filter by verification status (true/false)
 * - limit: Number of results (max 100, default 20)
 * - cursor: Pagination cursor
 */
export async function GET(req: NextRequest) {
  // Authenticate
  const auth = await apiMiddleware(req, ["read:sources"]);
  if (!auth.authorized) return auth.error!;

  const { searchParams } = new URL(req.url);

  // Parse query parameters
  const q = searchParams.get("q");
  const doi = searchParams.get("doi");
  const type = searchParams.get("type");
  const verified = searchParams.get("verified");
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const cursor = searchParams.get("cursor");

  // Build where clause
  const where: Record<string, unknown> = {};

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { abstract: { contains: q, mode: "insensitive" } },
      { authors: { contains: q, mode: "insensitive" } },
    ];
  }

  if (doi) {
    where.doi = doi;
  }

  if (type) {
    where.type = type;
  }

  if (verified !== null) {
    if (verified === "true") {
      where.verification = { isNot: null };
    } else if (verified === "false") {
      where.verification = null;
    }
  }

  try {
    // Fetch sources with pagination
    const sources = await prisma.source.findMany({
      where,
      take: limit + 1, // Fetch one extra to determine if there's more
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        authors: true,
        publicationDate: true,
        doi: true,
        url: true,
        type: true,
        container: true,
        publisher: true,
        volume: true,
        issue: true,
        pages: true,
        abstract: true,
        isOpenAccess: true,
        createdAt: true,
        updatedAt: true,
        verification: {
          select: {
            status: true,
            verifiedAt: true,
            score: true,
          },
        },
        _count: {
          select: { citations: true },
        },
      },
    });

    // Check if there are more results
    const hasMore = sources.length > limit;
    const results = hasMore ? sources.slice(0, -1) : sources;
    const nextCursor = hasMore ? results[results.length - 1].id : null;

    // Transform results
    const data = results.map((source) => ({
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
      abstract: source.abstract?.slice(0, 500), // Truncate for list view
      isOpenAccess: source.isOpenAccess,
      verificationStatus: source.verification?.status || "unverified",
      citationCount: source._count.citations,
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
    }));

    return apiPaginated(data, { hasMore, nextCursor });
  } catch (error) {
    console.error("[API] Sources search error:", error);
    return apiError("search_failed", "Failed to search sources", 500);
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
    // Treat as comma-separated string
    return authors.split(",").map((a) => ({ name: a.trim() }));
  }

  return [];
}
