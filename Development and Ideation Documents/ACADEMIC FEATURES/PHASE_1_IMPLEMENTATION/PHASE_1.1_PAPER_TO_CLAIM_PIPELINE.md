# Phase 1.1: Paper-to-Claim Pipeline

**Sub-Phase:** 1.1 of 1.4  
**Timeline:** Weeks 1-3  
**Status:** Planning  
**Depends On:** Existing Source model  
**Enables:** Phase 1.2 (Claim Search)

---

## Objective

Transform the source registration experience so scholars can extract and register individual claims from papers, enabling claim-level engagement rather than paper-level citation.

---

## User Stories

| ID | Story | Priority | Effort |
|----|-------|----------|--------|
| US-1.1.1 | As a researcher, I want to paste a DOI and have metadata auto-populated | P0 | S |
| US-1.1.2 | As a researcher, I want to upload a PDF and have the DOI extracted | P1 | M |
| US-1.1.3 | As a researcher, I want to manually create a claim with source location | P0 | S |
| US-1.1.4 | As a researcher, I want AI to suggest claims from my paper | P0 | L |
| US-1.1.5 | As a researcher, I want to classify claims by type (thesis, empirical, etc.) | P1 | S |
| US-1.1.6 | As a researcher, I want to link a claim to an exact quote | P1 | M |
| US-1.1.7 | As a researcher, I want to verify/edit AI-suggested claims | P0 | M |

---

## Implementation Steps

### Step 1.1.1: Schema Updates

**File:** `prisma/schema.prisma`

Add new fields to Source model and create ClaimType enum:

```prisma
// Add to existing enums section
enum ClaimType {
  THESIS
  INTERPRETIVE
  HISTORICAL
  CONCEPTUAL
  NORMATIVE
  METHODOLOGICAL
  COMPARATIVE
  CAUSAL
  META
  EMPIRICAL
}

enum IdentifierType {
  DOI
  ISBN
  ARXIV
  URL
  MANUAL
}

// Update Source model
model Source {
  id              String    @id @default(cuid())
  
  // Existing fields
  title           String
  authors         String[]
  publicationDate DateTime?
  url             String?
  identifier      String?   // DOI, ISBN, etc.
  
  // NEW: Enhanced metadata fields
  identifierType  IdentifierType?
  openAlexId      String?           // OpenAlex work ID
  authorOrcids    String[]          // ORCID IDs for authors
  abstractText    String?   @db.Text
  keywords        String[]
  venue           String?           // Journal/conference name
  volume          String?
  issue           String?
  pages           String?
  publisher       String?
  
  // NEW: PDF handling
  pdfUrl          String?
  pdfHash         String?           // For deduplication
  
  // Existing relations
  claims          Claim[]
  citations       Citation[]
  
  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  createdById     String?
  createdBy       User?     @relation(fields: [createdById], references: [id])
  
  @@index([identifier])
  @@index([openAlexId])
}

// Update Claim model
model Claim {
  id              String    @id @default(cuid())
  
  // Existing fields
  text            String    @db.Text
  sourceId        String?
  source          Source?   @relation(fields: [sourceId], references: [id])
  
  // NEW: Claim classification
  claimType       ClaimType?
  
  // NEW: Source location
  pageNumber      Int?
  sectionName     String?
  paragraphIndex  Int?
  
  // NEW: Supporting quote
  supportingQuote String?   @db.Text
  quoteLocator    String?   // "p.42, para.3"
  
  // NEW: AI extraction metadata
  extractedByAI   Boolean   @default(false)
  aiConfidence    Float?    // 0.0 - 1.0
  humanVerified   Boolean   @default(false)
  verifiedById    String?
  verifiedBy      User?     @relation("ClaimVerifier", fields: [verifiedById], references: [id])
  verifiedAt      DateTime?
  
  // NEW: Canonical linking (for Phase 3)
  canonicalId     String?   // Link to canonical claim
  
  // Existing relations
  arguments       Argument[]
  edges           ClaimEdge[]
  
  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  createdById     String
  createdBy       User      @relation(fields: [createdById], references: [id])
  
  @@index([sourceId])
  @@index([claimType])
  @@index([canonicalId])
}
```

**Migration Commands:**
```bash
npx prisma db push
npx prisma generate
```

---

### Step 1.1.2: DOI Resolution Service

**File:** `lib/integrations/crossref.ts`

```typescript
/**
 * Crossref API integration for DOI resolution
 * API Docs: https://api.crossref.org/swagger-ui/index.html
 */

import { Source } from "@prisma/client";

const CROSSREF_BASE = "https://api.crossref.org/works";
const POLITE_POOL_EMAIL = process.env.CROSSREF_EMAIL || "contact@mesh.app";

interface CrossrefWork {
  DOI: string;
  title: string[];
  author?: Array<{
    given?: string;
    family?: string;
    ORCID?: string;
  }>;
  published?: {
    "date-parts": number[][];
  };
  abstract?: string;
  "container-title"?: string[];
  volume?: string;
  issue?: string;
  page?: string;
  publisher?: string;
  subject?: string[];
  URL?: string;
}

interface CrossrefResponse {
  status: string;
  message: CrossrefWork;
}

export async function resolveDOI(doi: string): Promise<Partial<Source> | null> {
  // Normalize DOI
  const normalizedDOI = normalizeDOI(doi);
  if (!normalizedDOI) return null;

  try {
    const response = await fetch(
      `${CROSSREF_BASE}/${encodeURIComponent(normalizedDOI)}`,
      {
        headers: {
          "User-Agent": `MeshApp/1.0 (mailto:${POLITE_POOL_EMAIL})`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`Crossref API error: ${response.status}`);
      return null;
    }

    const data: CrossrefResponse = await response.json();
    return mapCrossrefToSource(data.message);
  } catch (error) {
    console.error("DOI resolution failed:", error);
    return null;
  }
}

function normalizeDOI(input: string): string | null {
  // Handle various DOI formats:
  // - 10.1234/abc
  // - doi:10.1234/abc
  // - https://doi.org/10.1234/abc
  // - http://dx.doi.org/10.1234/abc
  
  const patterns = [
    /^(10\.\d{4,}\/[^\s]+)$/,                    // Raw DOI
    /^doi:(10\.\d{4,}\/[^\s]+)$/i,               // doi: prefix
    /^https?:\/\/doi\.org\/(10\.\d{4,}\/[^\s]+)$/i,  // doi.org URL
    /^https?:\/\/dx\.doi\.org\/(10\.\d{4,}\/[^\s]+)$/i,  // dx.doi.org URL
  ];

  for (const pattern of patterns) {
    const match = input.trim().match(pattern);
    if (match) return match[1];
  }

  return null;
}

function mapCrossrefToSource(work: CrossrefWork): Partial<Source> {
  const authors = work.author?.map((a) => {
    if (a.given && a.family) return `${a.given} ${a.family}`;
    return a.family || "Unknown";
  }) || [];

  const authorOrcids = work.author
    ?.filter((a) => a.ORCID)
    .map((a) => a.ORCID!.replace("http://orcid.org/", "")) || [];

  let publicationDate: Date | undefined;
  if (work.published?.["date-parts"]?.[0]) {
    const [year, month = 1, day = 1] = work.published["date-parts"][0];
    publicationDate = new Date(year, month - 1, day);
  }

  return {
    identifier: work.DOI,
    identifierType: "DOI",
    title: work.title?.[0] || "Untitled",
    authors,
    authorOrcids,
    publicationDate,
    abstractText: work.abstract ? stripHTML(work.abstract) : undefined,
    venue: work["container-title"]?.[0],
    volume: work.volume,
    issue: work.issue,
    pages: work.page,
    publisher: work.publisher,
    keywords: work.subject || [],
    url: work.URL,
  };
}

function stripHTML(html: string): string {
  return html
    .replace(/<jats:[^>]+>/g, "")
    .replace(/<\/jats:[^>]+>/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

// Batch resolution for multiple DOIs
export async function resolveDOIs(
  dois: string[]
): Promise<Map<string, Partial<Source>>> {
  const results = new Map<string, Partial<Source>>();
  
  // Process in batches to respect rate limits
  const BATCH_SIZE = 10;
  const BATCH_DELAY = 250; // ms between batches
  
  for (let i = 0; i < dois.length; i += BATCH_SIZE) {
    const batch = dois.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (doi) => {
      const result = await resolveDOI(doi);
      if (result) results.set(doi, result);
    });
    
    await Promise.all(promises);
    
    if (i + BATCH_SIZE < dois.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY));
    }
  }
  
  return results;
}
```

---

### Step 1.1.3: OpenAlex Enrichment Service

**File:** `lib/integrations/openAlex.ts`

```typescript
/**
 * OpenAlex API integration for paper enrichment
 * API Docs: https://docs.openalex.org/
 */

const OPENALEX_BASE = "https://api.openalex.org";
const OPENALEX_EMAIL = process.env.OPENALEX_EMAIL || "contact@mesh.app";

interface OpenAlexWork {
  id: string;
  doi?: string;
  title: string;
  abstract_inverted_index?: Record<string, number[]>;
  authorships: Array<{
    author: {
      id: string;
      display_name: string;
      orcid?: string;
    };
    institutions: Array<{
      display_name: string;
    }>;
  }>;
  concepts: Array<{
    display_name: string;
    level: number;
    score: number;
  }>;
  cited_by_count: number;
  publication_date?: string;
  primary_location?: {
    source?: {
      display_name: string;
    };
  };
}

export async function enrichFromOpenAlex(
  doi: string
): Promise<OpenAlexEnrichment | null> {
  try {
    const encodedDOI = encodeURIComponent(`https://doi.org/${doi}`);
    const response = await fetch(
      `${OPENALEX_BASE}/works/${encodedDOI}?mailto=${OPENALEX_EMAIL}`
    );

    if (!response.ok) return null;

    const work: OpenAlexWork = await response.json();
    return mapOpenAlexEnrichment(work);
  } catch (error) {
    console.error("OpenAlex enrichment failed:", error);
    return null;
  }
}

interface OpenAlexEnrichment {
  openAlexId: string;
  abstract?: string;
  concepts: string[];
  citedByCount: number;
  authorInstitutions: Map<string, string[]>;
}

function mapOpenAlexEnrichment(work: OpenAlexWork): OpenAlexEnrichment {
  // Reconstruct abstract from inverted index
  let abstract: string | undefined;
  if (work.abstract_inverted_index) {
    const words: [string, number][] = [];
    for (const [word, positions] of Object.entries(
      work.abstract_inverted_index
    )) {
      for (const pos of positions) {
        words.push([word, pos]);
      }
    }
    words.sort((a, b) => a[1] - b[1]);
    abstract = words.map((w) => w[0]).join(" ");
  }

  // Extract high-level concepts (level 0-1, score > 0.3)
  const concepts = work.concepts
    .filter((c) => c.level <= 1 && c.score > 0.3)
    .map((c) => c.display_name);

  // Map authors to institutions
  const authorInstitutions = new Map<string, string[]>();
  for (const authorship of work.authorships) {
    const name = authorship.author.display_name;
    const institutions = authorship.institutions.map((i) => i.display_name);
    authorInstitutions.set(name, institutions);
  }

  return {
    openAlexId: work.id.replace("https://openalex.org/", ""),
    abstract,
    concepts,
    citedByCount: work.cited_by_count,
    authorInstitutions,
  };
}

// Search OpenAlex for works by title
export async function searchOpenAlex(
  query: string,
  limit = 10
): Promise<OpenAlexWork[]> {
  try {
    const response = await fetch(
      `${OPENALEX_BASE}/works?search=${encodeURIComponent(query)}&per_page=${limit}&mailto=${OPENALEX_EMAIL}`
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("OpenAlex search failed:", error);
    return [];
  }
}
```

---

### Step 1.1.4: Source Registration API

**File:** `app/api/sources/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveDOI } from "@/lib/integrations/crossref";
import { enrichFromOpenAlex } from "@/lib/integrations/openAlex";
import { z } from "zod";

const CreateSourceSchema = z.object({
  // Option 1: Provide DOI for auto-resolution
  doi: z.string().optional(),
  
  // Option 2: Provide manual data
  title: z.string().optional(),
  authors: z.array(z.string()).optional(),
  publicationDate: z.string().optional(),
  url: z.string().url().optional(),
  
  // Optional enrichment flags
  skipEnrichment: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const input = CreateSourceSchema.parse(body);

    let sourceData: Record<string, any> = {
      createdById: session.user.id,
    };

    // If DOI provided, resolve metadata
    if (input.doi) {
      // Check for existing source with this DOI
      const existing = await prisma.source.findFirst({
        where: { identifier: input.doi },
      });
      
      if (existing) {
        return NextResponse.json(
          { source: existing, existing: true },
          { status: 200 }
        );
      }

      // Resolve DOI via Crossref
      const crossrefData = await resolveDOI(input.doi);
      if (!crossrefData) {
        return NextResponse.json(
          { error: "Could not resolve DOI" },
          { status: 400 }
        );
      }

      sourceData = { ...sourceData, ...crossrefData };

      // Enrich with OpenAlex if not skipped
      if (!input.skipEnrichment) {
        const enrichment = await enrichFromOpenAlex(input.doi);
        if (enrichment) {
          sourceData.openAlexId = enrichment.openAlexId;
          sourceData.abstractText = sourceData.abstractText || enrichment.abstract;
          sourceData.keywords = [
            ...new Set([
              ...(sourceData.keywords || []),
              ...enrichment.concepts,
            ]),
          ];
        }
      }
    } else {
      // Manual creation - require title
      if (!input.title) {
        return NextResponse.json(
          { error: "Title required for manual source creation" },
          { status: 400 }
        );
      }

      sourceData = {
        ...sourceData,
        title: input.title,
        authors: input.authors || [],
        publicationDate: input.publicationDate
          ? new Date(input.publicationDate)
          : undefined,
        url: input.url,
        identifierType: "MANUAL",
      };
    }

    const source = await prisma.source.create({
      data: sourceData,
      include: {
        claims: true,
        createdBy: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json({ source }, { status: 201 });
  } catch (error) {
    console.error("Source creation error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const doi = searchParams.get("doi");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    let where: any = {};

    if (doi) {
      where.identifier = doi;
    } else if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { authors: { hasSome: [query] } },
        { keywords: { hasSome: [query] } },
      ];
    }

    const [sources, total] = await Promise.all([
      prisma.source.findMany({
        where,
        include: {
          _count: { select: { claims: true } },
          createdBy: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.source.count({ where }),
    ]);

    return NextResponse.json({ sources, total, limit, offset });
  } catch (error) {
    console.error("Source fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

### Step 1.1.5: AI Claim Extraction Service

**File:** `lib/claims/extraction.ts`

```typescript
/**
 * AI-assisted claim extraction from source texts
 */

import OpenAI from "openai";
import { ClaimType } from "@prisma/client";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ExtractedClaim {
  text: string;
  claimType: ClaimType;
  supportingQuote?: string;
  pageNumber?: number;
  sectionName?: string;
  confidence: number;
  reasoning: string;
}

interface ExtractionResult {
  claims: ExtractedClaim[];
  processingTime: number;
  tokensUsed: number;
}

const EXTRACTION_SYSTEM_PROMPT = `You are an expert academic analyst specializing in identifying claims in scholarly papers. Your task is to extract specific, debatable claims from the provided text.

CLAIM TYPES:
- THESIS: The central argument or main claim of the work
- INTERPRETIVE: A reading or interpretation of a text, event, or phenomenon
- HISTORICAL: A factual claim about past events or conditions
- CONCEPTUAL: A definition, analysis, or clarification of a concept
- NORMATIVE: An evaluative or prescriptive claim (what ought to be)
- METHODOLOGICAL: A claim about how to study or analyze something
- COMPARATIVE: A claim relating or comparing two or more things
- CAUSAL: A claim about causation or causal mechanisms
- META: A claim about the field, debate, or scholarship itself
- EMPIRICAL: A claim based on data, observations, or experiments

GUIDELINES:
1. Extract SPECIFIC, DEBATABLE claims - not summaries or descriptions
2. Each claim should be a single proposition that could be defended or attacked
3. Prefer claims that are central to the argument, not trivial observations
4. Include the supporting quote from the text when possible
5. Assign confidence based on how clearly the text states the claim (0.0-1.0)
6. Provide brief reasoning for why you identified this as a claim of this type

OUTPUT FORMAT:
Return a JSON array of claims with the following structure:
{
  "claims": [
    {
      "text": "The specific claim statement",
      "claimType": "THESIS|INTERPRETIVE|HISTORICAL|etc.",
      "supportingQuote": "The exact text from the source",
      "sectionName": "Introduction|Methods|Results|Discussion|etc.",
      "confidence": 0.85,
      "reasoning": "Brief explanation of classification"
    }
  ]
}`;

export async function extractClaimsFromText(
  text: string,
  options: {
    maxClaims?: number;
    focusTypes?: ClaimType[];
    sourceTitle?: string;
  } = {}
): Promise<ExtractionResult> {
  const { maxClaims = 10, focusTypes, sourceTitle } = options;
  const startTime = Date.now();

  let userPrompt = `Extract up to ${maxClaims} claims from the following academic text.`;
  
  if (sourceTitle) {
    userPrompt += `\n\nSource: "${sourceTitle}"`;
  }
  
  if (focusTypes && focusTypes.length > 0) {
    userPrompt += `\n\nFocus on these claim types: ${focusTypes.join(", ")}`;
  }
  
  userPrompt += `\n\nTEXT:\n${text}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent extraction
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const parsed = JSON.parse(content);
    const claims: ExtractedClaim[] = (parsed.claims || []).map(
      (claim: any) => ({
        text: claim.text,
        claimType: validateClaimType(claim.claimType),
        supportingQuote: claim.supportingQuote,
        pageNumber: claim.pageNumber,
        sectionName: claim.sectionName,
        confidence: Math.max(0, Math.min(1, claim.confidence || 0.5)),
        reasoning: claim.reasoning || "",
      })
    );

    return {
      claims,
      processingTime: Date.now() - startTime,
      tokensUsed: response.usage?.total_tokens || 0,
    };
  } catch (error) {
    console.error("Claim extraction failed:", error);
    throw error;
  }
}

function validateClaimType(input: string): ClaimType {
  const normalized = input?.toUpperCase();
  if (Object.values(ClaimType).includes(normalized as ClaimType)) {
    return normalized as ClaimType;
  }
  return ClaimType.THESIS; // Default fallback
}

// Extract claims from abstract (quick extraction)
export async function extractClaimsFromAbstract(
  abstract: string,
  sourceTitle: string
): Promise<ExtractionResult> {
  return extractClaimsFromText(abstract, {
    maxClaims: 5,
    focusTypes: [ClaimType.THESIS, ClaimType.EMPIRICAL, ClaimType.CAUSAL],
    sourceTitle,
  });
}

// Extract claims from full PDF text (comprehensive extraction)
export async function extractClaimsFromPDF(
  pdfText: string,
  sourceTitle: string
): Promise<ExtractionResult> {
  // For long texts, process in sections
  const MAX_CHUNK_SIZE = 8000; // tokens approx
  
  if (pdfText.length < MAX_CHUNK_SIZE * 4) {
    // Short enough to process in one go
    return extractClaimsFromText(pdfText, {
      maxClaims: 15,
      sourceTitle,
    });
  }

  // Split into sections and process
  const sections = splitIntoSections(pdfText);
  const allClaims: ExtractedClaim[] = [];
  let totalTime = 0;
  let totalTokens = 0;

  for (const section of sections) {
    const result = await extractClaimsFromText(section.text, {
      maxClaims: 5,
      sourceTitle,
    });
    
    // Add section info to claims
    result.claims.forEach((claim) => {
      claim.sectionName = claim.sectionName || section.name;
    });
    
    allClaims.push(...result.claims);
    totalTime += result.processingTime;
    totalTokens += result.tokensUsed;
  }

  // Deduplicate and rank claims
  const deduped = deduplicateClaims(allClaims);
  const ranked = deduped.sort((a, b) => b.confidence - a.confidence);

  return {
    claims: ranked.slice(0, 15),
    processingTime: totalTime,
    tokensUsed: totalTokens,
  };
}

function splitIntoSections(
  text: string
): Array<{ name: string; text: string }> {
  // Common section headers in academic papers
  const sectionPatterns = [
    /^(abstract|summary)/im,
    /^(introduction|background)/im,
    /^(literature review|related work)/im,
    /^(method|methodology|approach)/im,
    /^(results|findings)/im,
    /^(discussion)/im,
    /^(conclusion|conclusions)/im,
  ];

  const sections: Array<{ name: string; text: string }> = [];
  let currentSection = { name: "Introduction", text: "" };

  const lines = text.split("\n");
  for (const line of lines) {
    let foundSection = false;
    for (const pattern of sectionPatterns) {
      if (pattern.test(line.trim())) {
        // Save current section if it has content
        if (currentSection.text.trim().length > 100) {
          sections.push(currentSection);
        }
        // Start new section
        currentSection = {
          name: line.trim().replace(/^#+\s*/, ""),
          text: "",
        };
        foundSection = true;
        break;
      }
    }
    if (!foundSection) {
      currentSection.text += line + "\n";
    }
  }

  // Add final section
  if (currentSection.text.trim().length > 100) {
    sections.push(currentSection);
  }

  return sections;
}

function deduplicateClaims(claims: ExtractedClaim[]): ExtractedClaim[] {
  // Simple deduplication based on text similarity
  const seen = new Set<string>();
  const result: ExtractedClaim[] = [];

  for (const claim of claims) {
    const normalized = claim.text.toLowerCase().replace(/\s+/g, " ").trim();
    const key = normalized.slice(0, 100); // Use first 100 chars as key
    
    if (!seen.has(key)) {
      seen.add(key);
      result.push(claim);
    }
  }

  return result;
}
```

---

### Step 1.1.6: Claim Extraction API

**File:** `app/api/claims/extract/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  extractClaimsFromAbstract,
  extractClaimsFromPDF,
} from "@/lib/claims/extraction";
import { z } from "zod";

const ExtractClaimsSchema = z.object({
  sourceId: z.string(),
  mode: z.enum(["abstract", "fulltext"]).default("abstract"),
  fulltext: z.string().optional(), // Required if mode is "fulltext"
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const input = ExtractClaimsSchema.parse(body);

    // Get source
    const source = await prisma.source.findUnique({
      where: { id: input.sourceId },
    });

    if (!source) {
      return NextResponse.json(
        { error: "Source not found" },
        { status: 404 }
      );
    }

    let result;

    if (input.mode === "abstract") {
      if (!source.abstractText) {
        return NextResponse.json(
          { error: "Source has no abstract text" },
          { status: 400 }
        );
      }
      result = await extractClaimsFromAbstract(
        source.abstractText,
        source.title
      );
    } else {
      if (!input.fulltext) {
        return NextResponse.json(
          { error: "Fulltext required for fulltext mode" },
          { status: 400 }
        );
      }
      result = await extractClaimsFromPDF(input.fulltext, source.title);
    }

    // Return suggestions without saving - user must confirm
    return NextResponse.json({
      suggestions: result.claims,
      sourceId: source.id,
      sourceTitle: source.title,
      processingTime: result.processingTime,
      tokensUsed: result.tokensUsed,
    });
  } catch (error) {
    console.error("Claim extraction error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

### Step 1.1.7: Claim Creation API

**File:** `app/api/claims/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClaimType } from "@prisma/client";
import { z } from "zod";

const CreateClaimSchema = z.object({
  text: z.string().min(10).max(2000),
  sourceId: z.string(),
  claimType: z.nativeEnum(ClaimType).optional(),
  pageNumber: z.number().int().positive().optional(),
  sectionName: z.string().optional(),
  supportingQuote: z.string().optional(),
  quoteLocator: z.string().optional(),
  
  // AI extraction metadata
  extractedByAI: z.boolean().default(false),
  aiConfidence: z.number().min(0).max(1).optional(),
});

const BatchCreateClaimsSchema = z.object({
  claims: z.array(CreateClaimSchema),
  sourceId: z.string(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Check if batch or single
    if (body.claims && Array.isArray(body.claims)) {
      // Batch creation
      const input = BatchCreateClaimsSchema.parse(body);
      
      const claims = await prisma.$transaction(
        input.claims.map((claim) =>
          prisma.claim.create({
            data: {
              ...claim,
              createdById: session.user.id,
              humanVerified: !claim.extractedByAI, // Manual = verified
              verifiedById: claim.extractedByAI ? undefined : session.user.id,
              verifiedAt: claim.extractedByAI ? undefined : new Date(),
            },
          })
        )
      );

      return NextResponse.json({ claims }, { status: 201 });
    } else {
      // Single creation
      const input = CreateClaimSchema.parse(body);

      const claim = await prisma.claim.create({
        data: {
          ...input,
          createdById: session.user.id,
          humanVerified: !input.extractedByAI,
          verifiedById: input.extractedByAI ? undefined : session.user.id,
          verifiedAt: input.extractedByAI ? undefined : new Date(),
        },
        include: {
          source: {
            select: { id: true, title: true, identifier: true },
          },
          createdBy: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      return NextResponse.json({ claim }, { status: 201 });
    }
  } catch (error) {
    console.error("Claim creation error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Verify an AI-extracted claim
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { claimId, verified, editedText, editedType } = body;

    if (!claimId) {
      return NextResponse.json(
        { error: "claimId required" },
        { status: 400 }
      );
    }

    const claim = await prisma.claim.update({
      where: { id: claimId },
      data: {
        humanVerified: verified,
        verifiedById: session.user.id,
        verifiedAt: new Date(),
        // Allow editing during verification
        ...(editedText && { text: editedText }),
        ...(editedType && { claimType: editedType }),
      },
      include: {
        source: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json({ claim });
  } catch (error) {
    console.error("Claim verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## UI Components (Part 1)

### Step 1.1.8: Claim Type Selector Component

**File:** `components/claims/ClaimTypeSelector.tsx`

```typescript
"use client";

import { ClaimType } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface ClaimTypeSelectorProps {
  value?: ClaimType;
  onChange: (value: ClaimType) => void;
  disabled?: boolean;
}

const CLAIM_TYPE_INFO: Record<
  ClaimType,
  { label: string; description: string; color: string }
> = {
  THESIS: {
    label: "Thesis",
    description: "The central argument or main claim of a work",
    color: "bg-purple-100 text-purple-800",
  },
  INTERPRETIVE: {
    label: "Interpretive",
    description: "A reading or interpretation of text, event, or phenomenon",
    color: "bg-blue-100 text-blue-800",
  },
  HISTORICAL: {
    label: "Historical",
    description: "A factual claim about past events or conditions",
    color: "bg-amber-100 text-amber-800",
  },
  CONCEPTUAL: {
    label: "Conceptual",
    description: "A definition, analysis, or clarification of a concept",
    color: "bg-teal-100 text-teal-800",
  },
  NORMATIVE: {
    label: "Normative",
    description: "An evaluative or prescriptive claim about what ought to be",
    color: "bg-rose-100 text-rose-800",
  },
  METHODOLOGICAL: {
    label: "Methodological",
    description: "A claim about how to study or analyze something",
    color: "bg-indigo-100 text-indigo-800",
  },
  COMPARATIVE: {
    label: "Comparative",
    description: "A claim relating or comparing two or more things",
    color: "bg-orange-100 text-orange-800",
  },
  CAUSAL: {
    label: "Causal",
    description: "A claim about causation or causal mechanisms",
    color: "bg-red-100 text-red-800",
  },
  META: {
    label: "Meta",
    description: "A claim about the field, debate, or scholarship itself",
    color: "bg-gray-100 text-gray-800",
  },
  EMPIRICAL: {
    label: "Empirical",
    description: "A claim based on data, observations, or experiments",
    color: "bg-green-100 text-green-800",
  },
};

export function ClaimTypeSelector({
  value,
  onChange,
  disabled,
}: ClaimTypeSelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as ClaimType)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select type..." />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(CLAIM_TYPE_INFO).map(([type, info]) => (
          <SelectItem key={type} value={type}>
            <div className="flex items-center gap-2">
              <Badge className={info.color} variant="secondary">
                {info.label}
              </Badge>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ClaimTypeBadge({ type }: { type: ClaimType }) {
  const info = CLAIM_TYPE_INFO[type];
  if (!info) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge className={`${info.color} cursor-help`} variant="secondary">
          {info.label}
          <Info className="ml-1 h-3 w-3" />
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs">{info.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export { CLAIM_TYPE_INFO };
```

---

## Testing

### Step 1.1.9: Unit Tests for DOI Resolution

**File:** `__tests__/lib/integrations/crossref.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest";
import { resolveDOI } from "@/lib/integrations/crossref";

// Mock fetch
global.fetch = vi.fn();

describe("Crossref DOI Resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should resolve a valid DOI", async () => {
    const mockResponse = {
      status: "ok",
      message: {
        DOI: "10.1234/test",
        title: ["Test Paper Title"],
        author: [
          { given: "John", family: "Doe", ORCID: "0000-0001-1234-5678" },
        ],
        published: { "date-parts": [[2024, 1, 15]] },
        abstract: "<p>Test abstract</p>",
        "container-title": ["Test Journal"],
        volume: "42",
        issue: "1",
        page: "1-10",
        publisher: "Test Publisher",
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await resolveDOI("10.1234/test");

    expect(result).not.toBeNull();
    expect(result?.title).toBe("Test Paper Title");
    expect(result?.authors).toContain("John Doe");
    expect(result?.authorOrcids).toContain("0000-0001-1234-5678");
    expect(result?.venue).toBe("Test Journal");
  });

  it("should handle various DOI formats", async () => {
    const formats = [
      "10.1234/test",
      "doi:10.1234/test",
      "https://doi.org/10.1234/test",
      "http://dx.doi.org/10.1234/test",
    ];

    for (const format of formats) {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "ok",
          message: { DOI: "10.1234/test", title: ["Test"] },
        }),
      });

      const result = await resolveDOI(format);
      expect(result).not.toBeNull();
    }
  });

  it("should return null for invalid DOI", async () => {
    const result = await resolveDOI("not-a-valid-doi");
    expect(result).toBeNull();
  });

  it("should handle API errors gracefully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const result = await resolveDOI("10.1234/notfound");
    expect(result).toBeNull();
  });
});
```

---

## Summary: Phase 1.1 Checklist

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Schema updates | `prisma/schema.prisma` | 📋 Defined |
| 2 | DOI resolution service | `lib/integrations/crossref.ts` | 📋 Defined |
| 3 | OpenAlex enrichment | `lib/integrations/openAlex.ts` | 📋 Defined |
| 4 | Source registration API | `app/api/sources/route.ts` | 📋 Defined |
| 5 | AI claim extraction | `lib/claims/extraction.ts` | 📋 Defined |
| 6 | Claim extraction API | `app/api/claims/extract/route.ts` | 📋 Defined |
| 7 | Claim creation API | `app/api/claims/route.ts` | 📋 Defined |
| 8 | ClaimTypeSelector component | `components/claims/ClaimTypeSelector.tsx` | 📋 Defined |
| 9 | Unit tests | `__tests__/lib/integrations/crossref.test.ts` | 📋 Defined |

---

## Next Steps

After completing Phase 1.1:
1. Run schema migration
2. Test DOI resolution with sample DOIs
3. Test AI extraction with sample abstracts
4. Proceed to [Phase 1.2: Claim Search & Discovery](./PHASE_1.2_CLAIM_SEARCH_DISCOVERY.md)

---

*Document continues in PHASE_1.1_PART2.md with UI components for claim extraction panel.*
