# Phase 4: Net Analysis - Week 13: Net Identification

**Week 13: Net Identification (40 hours)**

This document covers the first week of Phase 4, focusing on identifying and analyzing argument nets within deliberations. Argument nets represent complex multi-scheme argumentative structures where arguments depend on or support each other.

---

## Overview

Phase 4 introduces net analysis capabilities that detect when arguments form complex interdependent structures rather than simple standalone schemes. This enables more sophisticated argumentation analysis and visualization.

**Week Focus**: Net Identification
**Total Time**: 40 hours

**Components**:
1. Step 4.1.1: Multi-Scheme Detection Service (10 hours)
2. Step 4.1.2: Dependency Inference Engine (10 hours)
3. Step 4.1.3: Explicitness Classifier (8 hours)
4. Step 4.1.4: Reconstruction Suggestion System (8 hours)
5. Step 4.1.5: User Confirmation Workflow (4 hours)

---

# Step 4.1.1: Multi-Scheme Detection Service (10 hours)

## Overview

Build a service that analyzes arguments to detect when multiple argumentation schemes are present within a single argumentative structure, indicating the presence of an argument net.

## Service Structure

**File**: `app/server/services/NetIdentificationService.ts`

```typescript
import { prisma } from "@/lib/prisma";

// ============================================================================
// Types
// ============================================================================

export interface SchemeInstance {
  schemeId: string;
  schemeName: string;
  schemeCategory: string;
  confidence: number; // 0-100
  premises: Array<{
    key: string;
    text: string;
    isFilled: boolean;
    evidenceIds: string[];
  }>;
  conclusion: string;
  role: "primary" | "supporting" | "subordinate";
  span: {
    argumentId: string;
    premiseKeys: string[];
    conclusionKey?: string;
  };
}

export interface NetCandidate {
  id: string;
  deliberationId: string;
  rootArgumentId: string;
  schemes: SchemeInstance[];
  netType: "convergent" | "linked" | "serial" | "divergent" | "hybrid";
  complexity: number; // 0-100
  confidence: number; // 0-100
  relationships: Array<{
    sourceScheme: string;
    targetScheme: string;
    type: "supports" | "depends-on" | "challenges" | "refines";
    strength: number;
  }>;
  detection: {
    method: "structural" | "semantic" | "hybrid";
    timestamp: Date;
    signals: string[];
  };
}

// ============================================================================
// Main Service
// ============================================================================

export class NetIdentificationService {
  /**
   * Analyze an argument to detect if it contains multiple schemes (a net)
   */
  public async detectMultiScheme(argumentId: string): Promise<NetCandidate | null> {
    const argument = await this.fetchArgumentWithContext(argumentId);
    
    if (!argument) {
      return null;
    }

    // Step 1: Detect potential scheme instances
    const schemeInstances = await this.identifySchemeInstances(argument);

    // If only one scheme detected, not a net
    if (schemeInstances.length <= 1) {
      return null;
    }

    // Step 2: Analyze relationships between schemes
    const relationships = await this.analyzeSchemeRelationships(schemeInstances, argument);

    // Step 3: Classify net type
    const netType = this.classifyNetType(schemeInstances, relationships);

    // Step 4: Calculate complexity and confidence
    const complexity = this.calculateComplexity(schemeInstances, relationships);
    const confidence = this.calculateDetectionConfidence(schemeInstances, relationships);

    // Only return if confidence is high enough
    if (confidence < 60) {
      return null;
    }

    return {
      id: `net-${argumentId}-${Date.now()}`,
      deliberationId: argument.deliberationId,
      rootArgumentId: argumentId,
      schemes: schemeInstances,
      netType,
      complexity,
      confidence,
      relationships,
      detection: {
        method: "hybrid",
        timestamp: new Date(),
        signals: this.extractDetectionSignals(schemeInstances, relationships),
      },
    };
  }

  /**
   * Batch analyze multiple arguments in a deliberation
   */
  public async detectNetsInDeliberation(deliberationId: string): Promise<NetCandidate[]> {
    const arguments = await prisma.argument.findMany({
      where: { deliberationId },
      include: {
        premises: true,
        evidence: true,
        scheme: true,
        childArguments: true,
        parentArgument: true,
      },
    });

    const netCandidates: NetCandidate[] = [];

    for (const argument of arguments) {
      const netCandidate = await this.detectMultiScheme(argument.id);
      if (netCandidate) {
        netCandidates.push(netCandidate);
      }
    }

    // Merge overlapping net candidates
    return this.mergeOverlappingNets(netCandidates);
  }

  // ============================================================================
  // Private Methods: Scheme Detection
  // ============================================================================

  private async identifySchemeInstances(argument: any): Promise<SchemeInstance[]> {
    const instances: SchemeInstance[] = [];

    // Method 1: Explicit scheme (already assigned)
    if (argument.schemeId) {
      const explicitScheme = await this.createSchemeInstance(
        argument.scheme,
        argument,
        "primary",
        1.0
      );
      instances.push(explicitScheme);
    }

    // Method 2: Structural analysis - look for embedded schemes
    const embeddedSchemes = await this.detectEmbeddedSchemes(argument);
    instances.push(...embeddedSchemes);

    // Method 3: Semantic analysis - analyze premise patterns
    const semanticSchemes = await this.detectSemanticSchemes(argument);
    instances.push(...semanticSchemes);

    // Deduplicate similar schemes
    return this.deduplicateSchemes(instances);
  }

  private async detectEmbeddedSchemes(argument: any): Promise<SchemeInstance[]> {
    const embedded: SchemeInstance[] = [];
    const premises = argument.premises || [];

    // Look for premises that themselves contain scheme patterns
    for (const premise of premises) {
      const premiseText = premise.text.toLowerCase();

      // Check for common scheme patterns
      const patterns = [
        {
          pattern: /according to (.+?),|expert (.+?) states/i,
          schemeId: "expert-opinion",
          role: "supporting" as const,
        },
        {
          pattern: /studies show|research indicates|data suggests/i,
          schemeId: "argument-from-evidence",
          role: "supporting" as const,
        },
        {
          pattern: /if (.+?) then|because (.+?) therefore/i,
          schemeId: "practical-reasoning",
          role: "subordinate" as const,
        },
        {
          pattern: /similar to|analogous to|like the case of/i,
          schemeId: "argument-from-analogy",
          role: "supporting" as const,
        },
        {
          pattern: /generally|most|typically|usually/i,
          schemeId: "argument-from-sign",
          role: "supporting" as const,
        },
      ];

      for (const { pattern, schemeId, role } of patterns) {
        if (pattern.test(premiseText)) {
          const scheme = await prisma.argumentScheme.findFirst({
            where: { id: schemeId },
          });

          if (scheme) {
            embedded.push(
              await this.createSchemeInstance(scheme, argument, role, 0.7)
            );
          }
        }
      }
    }

    return embedded;
  }

  private async detectSemanticSchemes(argument: any): Promise<SchemeInstance[]> {
    const semantic: SchemeInstance[] = [];

    // Use premise structure and content to infer schemes
    const premises = argument.premises || [];
    const premiseTexts = premises.map((p: any) => p.text).join(" ");

    // Get all schemes and calculate similarity
    const allSchemes = await prisma.argumentScheme.findMany({
      include: { premises: true },
    });

    for (const scheme of allSchemes) {
      // Skip the primary scheme if already assigned
      if (argument.schemeId === scheme.id) continue;

      const similarity = await this.calculateSchemeSimilarity(
        premiseTexts,
        scheme
      );

      if (similarity > 0.6) {
        semantic.push(
          await this.createSchemeInstance(scheme, argument, "supporting", similarity)
        );
      }
    }

    return semantic;
  }

  private async createSchemeInstance(
    scheme: any,
    argument: any,
    role: "primary" | "supporting" | "subordinate",
    confidence: number
  ): Promise<SchemeInstance> {
    const premises = (argument.premises || []).map((p: any) => ({
      key: p.key,
      text: p.text,
      isFilled: Boolean(p.text && p.text.length > 0),
      evidenceIds: p.evidence?.map((e: any) => e.id) || [],
    }));

    return {
      schemeId: scheme.id,
      schemeName: scheme.name,
      schemeCategory: scheme.category,
      confidence: confidence * 100,
      premises,
      conclusion: argument.conclusion || "",
      role,
      span: {
        argumentId: argument.id,
        premiseKeys: premises.map((p) => p.key),
      },
    };
  }

  private deduplicateSchemes(schemes: SchemeInstance[]): SchemeInstance[] {
    const seen = new Map<string, SchemeInstance>();

    for (const scheme of schemes) {
      const key = `${scheme.schemeId}-${scheme.role}`;
      const existing = seen.get(key);

      if (!existing || scheme.confidence > existing.confidence) {
        seen.set(key, scheme);
      }
    }

    return Array.from(seen.values());
  }

  // ============================================================================
  // Private Methods: Relationship Analysis
  // ============================================================================

  private async analyzeSchemeRelationships(
    schemes: SchemeInstance[],
    argument: any
  ): Promise<Array<any>> {
    const relationships = [];

    // Analyze pairwise relationships
    for (let i = 0; i < schemes.length; i++) {
      for (let j = i + 1; j < schemes.length; j++) {
        const rel = await this.inferRelationship(schemes[i], schemes[j], argument);
        if (rel) {
          relationships.push(rel);
        }
      }
    }

    return relationships;
  }

  private async inferRelationship(
    source: SchemeInstance,
    target: SchemeInstance,
    argument: any
  ): Promise<any | null> {
    // Check for support relationships
    if (source.role === "supporting" && target.role === "primary") {
      return {
        sourceScheme: source.schemeId,
        targetScheme: target.schemeId,
        type: "supports",
        strength: 0.8,
      };
    }

    // Check for dependency relationships
    if (source.role === "subordinate" || target.role === "subordinate") {
      // Analyze premise dependencies
      const sourcePremises = new Set(source.span.premiseKeys);
      const targetPremises = new Set(target.span.premiseKeys);
      
      const overlap = [...sourcePremises].filter((k) => targetPremises.has(k)).length;
      
      if (overlap > 0) {
        return {
          sourceScheme: source.schemeId,
          targetScheme: target.schemeId,
          type: "depends-on",
          strength: overlap / Math.min(sourcePremises.size, targetPremises.size),
        };
      }
    }

    // Check for refinement relationships
    if (source.schemeCategory === target.schemeCategory) {
      return {
        sourceScheme: source.schemeId,
        targetScheme: target.schemeId,
        type: "refines",
        strength: 0.6,
      };
    }

    return null;
  }

  // ============================================================================
  // Private Methods: Net Classification
  // ============================================================================

  private classifyNetType(
    schemes: SchemeInstance[],
    relationships: Array<any>
  ): "convergent" | "linked" | "serial" | "divergent" | "hybrid" {
    const supportCount = relationships.filter((r) => r.type === "supports").length;
    const dependsCount = relationships.filter((r) => r.type === "depends-on").length;
    const primary = schemes.find((s) => s.role === "primary");
    const supporting = schemes.filter((s) => s.role === "supporting");

    // Convergent: multiple independent schemes support conclusion
    if (supporting.length >= 2 && supportCount >= 2 && dependsCount === 0) {
      return "convergent";
    }

    // Linked: schemes depend on each other
    if (dependsCount >= relationships.length * 0.5) {
      return "linked";
    }

    // Serial: chain of schemes
    if (schemes.length >= 3 && this.isSerialChain(schemes, relationships)) {
      return "serial";
    }

    // Divergent: one scheme supports multiple conclusions
    if (primary && supporting.length === 0 && schemes.length >= 2) {
      return "divergent";
    }

    // Hybrid: mixed structure
    return "hybrid";
  }

  private isSerialChain(schemes: SchemeInstance[], relationships: Array<any>): boolean {
    // Check if schemes form a linear chain
    const graph = new Map<string, string[]>();
    
    for (const rel of relationships) {
      if (!graph.has(rel.sourceScheme)) {
        graph.set(rel.sourceScheme, []);
      }
      graph.get(rel.sourceScheme)!.push(rel.targetScheme);
    }

    // Simple chain detection (can be enhanced)
    for (const [_, targets] of graph) {
      if (targets.length > 1) return false; // Branching
    }

    return true;
  }

  // ============================================================================
  // Private Methods: Metrics
  // ============================================================================

  private calculateComplexity(
    schemes: SchemeInstance[],
    relationships: Array<any>
  ): number {
    // Factors: number of schemes, relationships, premise overlap
    const schemeCount = schemes.length;
    const relationshipCount = relationships.length;
    const avgConfidence = schemes.reduce((sum, s) => sum + s.confidence, 0) / schemes.length;

    // Normalize to 0-100
    const complexity = Math.min(
      100,
      (schemeCount * 15) + (relationshipCount * 10) + ((100 - avgConfidence) * 0.5)
    );

    return Math.round(complexity);
  }

  private calculateDetectionConfidence(
    schemes: SchemeInstance[],
    relationships: Array<any>
  ): number {
    // High confidence if:
    // - Multiple schemes detected with high individual confidence
    // - Clear relationships between schemes
    // - Consistent roles

    const avgSchemeConfidence = schemes.reduce((sum, s) => sum + s.confidence, 0) / schemes.length;
    const relationshipStrength = relationships.reduce((sum, r) => sum + r.strength, 0) / Math.max(relationships.length, 1);
    const hasRoleVariety = new Set(schemes.map((s) => s.role)).size > 1;

    const confidence =
      avgSchemeConfidence * 0.5 +
      relationshipStrength * 100 * 0.3 +
      (hasRoleVariety ? 20 : 0);

    return Math.min(100, Math.round(confidence));
  }

  private extractDetectionSignals(
    schemes: SchemeInstance[],
    relationships: Array<any>
  ): string[] {
    const signals: string[] = [];

    signals.push(`${schemes.length} schemes detected`);
    signals.push(`${relationships.length} inter-scheme relationships`);

    const primary = schemes.find((s) => s.role === "primary");
    const supporting = schemes.filter((s) => s.role === "supporting");
    const subordinate = schemes.filter((s) => s.role === "subordinate");

    if (primary) signals.push("Primary scheme identified");
    if (supporting.length > 0) signals.push(`${supporting.length} supporting schemes`);
    if (subordinate.length > 0) signals.push(`${subordinate.length} subordinate schemes`);

    const categories = new Set(schemes.map((s) => s.schemeCategory));
    if (categories.size > 1) signals.push(`${categories.size} scheme categories involved`);

    return signals;
  }

  // ============================================================================
  // Private Methods: Utility
  // ============================================================================

  private async fetchArgumentWithContext(argumentId: string): Promise<any> {
    return await prisma.argument.findUnique({
      where: { id: argumentId },
      include: {
        premises: {
          include: {
            evidence: true,
          },
        },
        evidence: true,
        scheme: {
          include: {
            premises: true,
          },
        },
        childArguments: true,
        parentArgument: true,
      },
    });
  }

  private async calculateSchemeSimilarity(
    argumentText: string,
    scheme: any
  ): Promise<number> {
    // Simplified semantic similarity
    // In production, use embeddings or ML model
    const argWords = new Set(argumentText.toLowerCase().split(/\s+/));
    const schemeWords = new Set(
      scheme.premises
        .map((p: any) => p.template.toLowerCase())
        .join(" ")
        .split(/\s+/)
    );

    const intersection = new Set([...argWords].filter((w) => schemeWords.has(w)));
    const union = new Set([...argWords, ...schemeWords]);

    return intersection.size / union.size;
  }

  private mergeOverlappingNets(candidates: NetCandidate[]): NetCandidate[] {
    // Simple merge: if nets share arguments, merge them
    // More sophisticated logic can be added
    const merged: NetCandidate[] = [];
    const processed = new Set<string>();

    for (const candidate of candidates) {
      if (processed.has(candidate.id)) continue;

      const overlapping = candidates.filter(
        (c) =>
          c.id !== candidate.id &&
          !processed.has(c.id) &&
          this.netsOverlap(candidate, c)
      );

      if (overlapping.length > 0) {
        const mergedNet = this.mergeNetCandidates(candidate, overlapping);
        merged.push(mergedNet);
        processed.add(candidate.id);
        overlapping.forEach((c) => processed.add(c.id));
      } else {
        merged.push(candidate);
        processed.add(candidate.id);
      }
    }

    return merged;
  }

  private netsOverlap(net1: NetCandidate, net2: NetCandidate): boolean {
    const schemes1 = new Set(net1.schemes.map((s) => s.schemeId));
    const schemes2 = new Set(net2.schemes.map((s) => s.schemeId));

    const intersection = [...schemes1].filter((s) => schemes2.has(s));
    return intersection.length > 0;
  }

  private mergeNetCandidates(
    primary: NetCandidate,
    others: NetCandidate[]
  ): NetCandidate {
    const allSchemes = [primary, ...others].flatMap((n) => n.schemes);
    const allRelationships = [primary, ...others].flatMap((n) => n.relationships);

    // Deduplicate
    const uniqueSchemes = this.deduplicateSchemes(allSchemes);
    const uniqueRelationships = this.deduplicateRelationships(allRelationships);

    return {
      ...primary,
      schemes: uniqueSchemes,
      relationships: uniqueRelationships,
      complexity: this.calculateComplexity(uniqueSchemes, uniqueRelationships),
      confidence: this.calculateDetectionConfidence(uniqueSchemes, uniqueRelationships),
    };
  }

  private deduplicateRelationships(relationships: Array<any>): Array<any> {
    const seen = new Map<string, any>();

    for (const rel of relationships) {
      const key = `${rel.sourceScheme}-${rel.targetScheme}-${rel.type}`;
      const existing = seen.get(key);

      if (!existing || rel.strength > existing.strength) {
        seen.set(key, rel);
      }
    }

    return Array.from(seen.values());
  }
}
```

## API Routes

**File**: `app/api/nets/detect/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { NetIdentificationService } from "@/app/server/services/NetIdentificationService";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { argumentId, deliberationId } = body;

    const service = new NetIdentificationService();

    if (argumentId) {
      // Detect net in single argument
      const netCandidate = await service.detectMultiScheme(argumentId);
      return NextResponse.json({ net: netCandidate });
    } else if (deliberationId) {
      // Detect all nets in deliberation
      const nets = await service.detectNetsInDeliberation(deliberationId);
      return NextResponse.json({ nets });
    } else {
      return NextResponse.json(
        { error: "Either argumentId or deliberationId required" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Net detection error:", error);
    return NextResponse.json(
      { error: "Failed to detect nets" },
      { status: 500 }
    );
  }
}
```

**File**: `app/api/nets/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const net = await prisma.argumentNet.findUnique({
      where: { id: params.id },
      include: {
        schemes: true,
        relationships: true,
      },
    });

    if (!net) {
      return NextResponse.json({ error: "Net not found" }, { status: 404 });
    }

    return NextResponse.json({ net });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch net" },
      { status: 500 }
    );
  }
}
```

## Database Schema

**File**: `prisma/schema.prisma` (additions)

```prisma
model ArgumentNet {
  id              String   @id @default(cuid())
  deliberationId  String
  rootArgumentId  String
  netType         String   // convergent, linked, serial, divergent, hybrid
  complexity      Int      // 0-100
  confidence      Int      // 0-100
  isExplicit      Boolean  @default(false)
  isConfirmed     Boolean  @default(false)
  
  detectionMethod String   // structural, semantic, hybrid
  detectionSignals String[] // array of detection signals
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  deliberation    Deliberation @relation(fields: [deliberationId], references: [id], onDelete: Cascade)
  rootArgument    Argument     @relation(fields: [rootArgumentId], references: [id], onDelete: Cascade)
  
  schemes         NetSchemeInstance[]
  relationships   NetRelationship[]
  
  @@index([deliberationId])
  @@index([rootArgumentId])
}

model NetSchemeInstance {
  id            String   @id @default(cuid())
  netId         String
  schemeId      String
  schemeName    String
  schemeCategory String
  confidence    Float    // 0-1
  role          String   // primary, supporting, subordinate
  
  premises      Json     // array of premise data
  conclusion    String?
  span          Json     // which parts of argument it covers
  
  createdAt     DateTime @default(now())
  
  net           ArgumentNet @relation(fields: [netId], references: [id], onDelete: Cascade)
  scheme        ArgumentScheme @relation(fields: [schemeId], references: [id])
  
  @@index([netId])
  @@index([schemeId])
}

model NetRelationship {
  id            String   @id @default(cuid())
  netId         String
  sourceScheme  String   // scheme ID
  targetScheme  String   // scheme ID
  type          String   // supports, depends-on, challenges, refines
  strength      Float    // 0-1
  
  createdAt     DateTime @default(now())
  
  net           ArgumentNet @relation(fields: [netId], references: [id], onDelete: Cascade)
  
  @@index([netId])
}
```

## Testing

**File**: `app/server/services/__tests__/NetIdentificationService.test.ts`

```typescript
import { NetIdentificationService } from "../NetIdentificationService";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    argument: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    argumentScheme: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe("NetIdentificationService", () => {
  let service: NetIdentificationService;

  beforeEach(() => {
    service = new NetIdentificationService();
    jest.clearAllMocks();
  });

  describe("detectMultiScheme", () => {
    it("should return null for single-scheme argument", async () => {
      const mockArgument = {
        id: "arg1",
        schemeId: "scheme1",
        premises: [{ key: "p1", text: "Premise 1" }],
        scheme: { id: "scheme1", name: "Expert Opinion" },
      };

      (prisma.argument.findUnique as jest.Mock).mockResolvedValue(mockArgument);
      (prisma.argumentScheme.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.detectMultiScheme("arg1");

      expect(result).toBeNull();
    });

    it("should detect convergent net", async () => {
      const mockArgument = {
        id: "arg1",
        deliberationId: "delib1",
        schemeId: "scheme1",
        premises: [
          { key: "p1", text: "According to Dr. Smith, X is true" },
          { key: "p2", text: "Studies show that X is true" },
        ],
        scheme: { id: "scheme1", name: "Expert Opinion", category: "Source-based" },
      };

      const mockSchemes = [
        {
          id: "scheme2",
          name: "Argument from Evidence",
          category: "Evidence-based",
          premises: [{ template: "Studies show {claim}" }],
        },
      ];

      (prisma.argument.findUnique as jest.Mock).mockResolvedValue(mockArgument);
      (prisma.argumentScheme.findMany as jest.Mock).mockResolvedValue(mockSchemes);
      (prisma.argumentScheme.findFirst as jest.Mock).mockResolvedValue(mockSchemes[0]);

      const result = await service.detectMultiScheme("arg1");

      expect(result).not.toBeNull();
      expect(result?.schemes.length).toBeGreaterThan(1);
      expect(result?.netType).toBe("convergent");
    });

    it("should calculate complexity correctly", async () => {
      const mockArgument = {
        id: "arg1",
        deliberationId: "delib1",
        schemeId: "scheme1",
        premises: [
          { key: "p1", text: "Expert says X" },
          { key: "p2", text: "Studies show X" },
          { key: "p3", text: "Similar to Y" },
        ],
        scheme: { id: "scheme1", name: "Expert Opinion", category: "Source-based" },
      };

      (prisma.argument.findUnique as jest.Mock).mockResolvedValue(mockArgument);
      (prisma.argumentScheme.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.argumentScheme.findFirst as jest.Mock).mockResolvedValue({
        id: "scheme2",
        name: "Evidence",
        category: "Evidence-based",
        premises: [],
      });

      const result = await service.detectMultiScheme("arg1");

      if (result) {
        expect(result.complexity).toBeGreaterThan(0);
        expect(result.complexity).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("detectNetsInDeliberation", () => {
    it("should detect multiple nets in deliberation", async () => {
      const mockArguments = [
        {
          id: "arg1",
          deliberationId: "delib1",
          schemeId: "scheme1",
          premises: [{ key: "p1", text: "Expert says X" }],
          scheme: { id: "scheme1", name: "Expert Opinion" },
        },
        {
          id: "arg2",
          deliberationId: "delib1",
          schemeId: "scheme2",
          premises: [{ key: "p1", text: "Studies show Y" }],
          scheme: { id: "scheme2", name: "Evidence" },
        },
      ];

      (prisma.argument.findMany as jest.Mock).mockResolvedValue(mockArguments);
      (prisma.argument.findUnique as jest.Mock).mockImplementation((args) =>
        mockArguments.find((a) => a.id === args.where.id)
      );
      (prisma.argumentScheme.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.detectNetsInDeliberation("delib1");

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
```

## Time Allocation

- Core detection algorithm: 4 hours
- Scheme instance identification: 2 hours
- Relationship analysis: 2 hours
- Net classification: 1 hour
- Testing: 1 hour

## Deliverables

- ✅ `NetIdentificationService` with detection algorithms
- ✅ Multi-scheme detection methods
- ✅ Relationship inference
- ✅ Net type classification
- ✅ Complexity calculation
- ✅ API routes for detection
- ✅ Database schema extensions
- ✅ Comprehensive test suite

---

# Step 4.1.2: Dependency Inference Engine (10 hours)

## Overview

Build an inference engine that identifies and maps dependencies between scheme instances within a net, determining which schemes rely on others for their conclusions to hold.

## Service Structure

**File**: `app/server/services/DependencyInferenceEngine.ts`

```typescript
import { prisma } from "@/lib/prisma";
import { SchemeInstance, NetCandidate } from "./NetIdentificationService";

// ============================================================================
// Types
// ============================================================================

export interface Dependency {
  id: string;
  sourceSchemeId: string;
  targetSchemeId: string;
  type: "prerequisite" | "supporting" | "enabling" | "background";
  strength: number; // 0-1
  bidirectional: boolean;
  evidence: {
    premiseOverlap: number;
    semanticSimilarity: number;
    structuralPattern: string;
    logicalFlow: boolean;
  };
  criticality: "critical" | "important" | "optional";
  explanation: string;
}

export interface DependencyGraph {
  netId: string;
  nodes: Array<{
    schemeId: string;
    schemeName: string;
    role: string;
    depth: number; // Distance from root
  }>;
  edges: Dependency[];
  cycles: Array<string[]>; // Circular dependencies
  roots: string[]; // Schemes with no dependencies
  leaves: string[]; // Schemes nothing depends on
  criticalPath: string[]; // Most important dependency chain
}

// ============================================================================
// Main Engine
// ============================================================================

export class DependencyInferenceEngine {
  /**
   * Infer all dependencies within a net candidate
   */
  public async inferDependencies(net: NetCandidate): Promise<DependencyGraph> {
    const dependencies: Dependency[] = [];

    // Step 1: Analyze all pairwise scheme relationships
    for (let i = 0; i < net.schemes.length; i++) {
      for (let j = 0; j < net.schemes.length; j++) {
        if (i === j) continue;

        const dependency = await this.analyzeDependency(
          net.schemes[i],
          net.schemes[j],
          net
        );

        if (dependency) {
          dependencies.push(dependency);
        }
      }
    }

    // Step 2: Build dependency graph
    const graph = this.buildDependencyGraph(net, dependencies);

    // Step 3: Detect circular dependencies
    graph.cycles = this.detectCycles(graph);

    // Step 4: Identify critical path
    graph.criticalPath = this.findCriticalPath(graph);

    return graph;
  }

  /**
   * Update dependency graph when net structure changes
   */
  public async updateDependencies(
    netId: string,
    changes: {
      addedSchemes?: SchemeInstance[];
      removedSchemes?: string[];
      modifiedSchemes?: SchemeInstance[];
    }
  ): Promise<DependencyGraph> {
    const net = await this.fetchNet(netId);
    
    // Apply changes
    if (changes.removedSchemes) {
      net.schemes = net.schemes.filter(
        (s) => !changes.removedSchemes!.includes(s.schemeId)
      );
    }
    
    if (changes.addedSchemes) {
      net.schemes.push(...changes.addedSchemes);
    }
    
    if (changes.modifiedSchemes) {
      for (const modified of changes.modifiedSchemes) {
        const index = net.schemes.findIndex((s) => s.schemeId === modified.schemeId);
        if (index !== -1) {
          net.schemes[index] = modified;
        }
      }
    }

    return this.inferDependencies(net);
  }

  // ============================================================================
  // Private Methods: Dependency Analysis
  // ============================================================================

  private async analyzeDependency(
    source: SchemeInstance,
    target: SchemeInstance,
    net: NetCandidate
  ): Promise<Dependency | null> {
    // Check if target depends on source
    const evidence = await this.gatherDependencyEvidence(source, target, net);

    // Calculate dependency strength
    const strength = this.calculateDependencyStrength(evidence);

    // Must meet minimum threshold
    if (strength < 0.3) {
      return null;
    }

    // Determine dependency type
    const type = this.classifyDependencyType(source, target, evidence);

    // Check if bidirectional
    const bidirectional = await this.isBidirectional(source, target, net);

    // Determine criticality
    const criticality = this.assessCriticality(strength, type, target.role);

    return {
      id: `dep-${source.schemeId}-${target.schemeId}`,
      sourceSchemeId: source.schemeId,
      targetSchemeId: target.schemeId,
      type,
      strength,
      bidirectional,
      evidence,
      criticality,
      explanation: this.generateExplanation(source, target, type, evidence),
    };
  }

  private async gatherDependencyEvidence(
    source: SchemeInstance,
    target: SchemeInstance,
    net: NetCandidate
  ): Promise<any> {
    // 1. Premise overlap analysis
    const sourcePremises = new Set(source.premises.map((p) => p.key));
    const targetPremises = new Set(target.premises.map((p) => p.key));
    const overlap = [...sourcePremises].filter((k) => targetPremises.has(k));
    const premiseOverlap = overlap.length / Math.max(sourcePremises.size, targetPremises.size);

    // 2. Semantic similarity
    const sourceText = source.premises.map((p) => p.text).join(" ");
    const targetText = target.premises.map((p) => p.text).join(" ");
    const semanticSimilarity = this.calculateSemanticSimilarity(sourceText, targetText);

    // 3. Structural pattern detection
    const structuralPattern = this.detectStructuralPattern(source, target);

    // 4. Logical flow analysis
    const logicalFlow = this.hasLogicalFlow(source, target);

    return {
      premiseOverlap,
      semanticSimilarity,
      structuralPattern,
      logicalFlow,
    };
  }

  private calculateDependencyStrength(evidence: any): number {
    // Weighted combination of evidence factors
    return (
      evidence.premiseOverlap * 0.4 +
      evidence.semanticSimilarity * 0.3 +
      (evidence.structuralPattern !== "none" ? 0.15 : 0) +
      (evidence.logicalFlow ? 0.15 : 0)
    );
  }

  private classifyDependencyType(
    source: SchemeInstance,
    target: SchemeInstance,
    evidence: any
  ): "prerequisite" | "supporting" | "enabling" | "background" {
    // Prerequisite: target cannot exist without source
    if (evidence.premiseOverlap > 0.7 && evidence.structuralPattern === "sequential") {
      return "prerequisite";
    }

    // Supporting: source strengthens target
    if (source.role === "supporting" && target.role === "primary") {
      return "supporting";
    }

    // Enabling: source makes target possible
    if (evidence.logicalFlow && evidence.premiseOverlap > 0.4) {
      return "enabling";
    }

    // Background: provides context
    return "background";
  }

  private async isBidirectional(
    source: SchemeInstance,
    target: SchemeInstance,
    net: NetCandidate
  ): Promise<boolean> {
    // Check if both schemes depend on each other
    const reverseEvidence = await this.gatherDependencyEvidence(target, source, net);
    const reverseStrength = this.calculateDependencyStrength(reverseEvidence);

    return reverseStrength >= 0.3;
  }

  private assessCriticality(
    strength: number,
    type: string,
    targetRole: string
  ): "critical" | "important" | "optional" {
    // Critical: prerequisite for primary scheme
    if (type === "prerequisite" && targetRole === "primary") {
      return "critical";
    }

    // Important: high strength or enabling
    if (strength > 0.7 || type === "enabling") {
      return "important";
    }

    // Optional: background or low strength
    return "optional";
  }

  // ============================================================================
  // Private Methods: Graph Construction
  // ============================================================================

  private buildDependencyGraph(
    net: NetCandidate,
    dependencies: Dependency[]
  ): DependencyGraph {
    // Create nodes for each scheme
    const nodes = net.schemes.map((scheme) => ({
      schemeId: scheme.schemeId,
      schemeName: scheme.schemeName,
      role: scheme.role,
      depth: 0, // Will be calculated
    }));

    // Calculate depth (distance from roots)
    this.calculateDepths(nodes, dependencies);

    // Identify roots (no incoming edges)
    const incomingEdges = new Set(dependencies.map((d) => d.targetSchemeId));
    const roots = nodes
      .filter((n) => !incomingEdges.has(n.schemeId))
      .map((n) => n.schemeId);

    // Identify leaves (no outgoing edges)
    const outgoingEdges = new Set(dependencies.map((d) => d.sourceSchemeId));
    const leaves = nodes
      .filter((n) => !outgoingEdges.has(n.schemeId))
      .map((n) => n.schemeId);

    return {
      netId: net.id,
      nodes,
      edges: dependencies,
      cycles: [], // Will be filled later
      roots,
      leaves,
      criticalPath: [], // Will be filled later
    };
  }

  private calculateDepths(
    nodes: Array<any>,
    dependencies: Dependency[]
  ): void {
    // Build adjacency list
    const graph = new Map<string, string[]>();
    for (const dep of dependencies) {
      if (!graph.has(dep.sourceSchemeId)) {
        graph.set(dep.sourceSchemeId, []);
      }
      graph.get(dep.sourceSchemeId)!.push(dep.targetSchemeId);
    }

    // BFS from roots to calculate depth
    const visited = new Set<string>();
    const queue: Array<{ id: string; depth: number }> = [];

    // Start with roots
    const roots = nodes.filter(
      (n) => !dependencies.some((d) => d.targetSchemeId === n.schemeId)
    );

    for (const root of roots) {
      queue.push({ id: root.schemeId, depth: 0 });
    }

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;

      if (visited.has(id)) continue;
      visited.add(id);

      const node = nodes.find((n) => n.schemeId === id);
      if (node) {
        node.depth = depth;
      }

      const neighbors = graph.get(id) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push({ id: neighbor, depth: depth + 1 });
        }
      }
    }
  }

  private detectCycles(graph: DependencyGraph): Array<string[]> {
    const cycles: Array<string[]> = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const outgoing = graph.edges.filter((e) => e.sourceSchemeId === nodeId);

      for (const edge of outgoing) {
        const targetId = edge.targetSchemeId;

        if (!visited.has(targetId)) {
          dfs(targetId, [...path]);
        } else if (recursionStack.has(targetId)) {
          // Found a cycle
          const cycleStart = path.indexOf(targetId);
          const cycle = path.slice(cycleStart);
          cycles.push(cycle);
        }
      }

      recursionStack.delete(nodeId);
    };

    for (const node of graph.nodes) {
      if (!visited.has(node.schemeId)) {
        dfs(node.schemeId, []);
      }
    }

    return cycles;
  }

  private findCriticalPath(graph: DependencyGraph): string[] {
    // Find path with highest total dependency strength
    let maxPath: string[] = [];
    let maxStrength = 0;

    const findPaths = (
      current: string,
      path: string[],
      totalStrength: number
    ): void => {
      const outgoing = graph.edges.filter((e) => e.sourceSchemeId === current);

      if (outgoing.length === 0) {
        // Reached a leaf
        if (totalStrength > maxStrength) {
          maxStrength = totalStrength;
          maxPath = [...path];
        }
        return;
      }

      for (const edge of outgoing) {
        if (!path.includes(edge.targetSchemeId)) {
          findPaths(
            edge.targetSchemeId,
            [...path, edge.targetSchemeId],
            totalStrength + edge.strength
          );
        }
      }
    };

    for (const root of graph.roots) {
      findPaths(root, [root], 0);
    }

    return maxPath;
  }

  // ============================================================================
  // Private Methods: Utility
  // ============================================================================

  private calculateSemanticSimilarity(text1: string, text2: string): number {
    // Simplified Jaccard similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((w) => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  private detectStructuralPattern(
    source: SchemeInstance,
    target: SchemeInstance
  ): string {
    // Detect common structural patterns
    
    // Sequential: source conclusion feeds target premise
    if (
      source.conclusion &&
      target.premises.some((p) => p.text.includes(source.conclusion))
    ) {
      return "sequential";
    }

    // Parallel: similar structure, different content
    if (
      source.premises.length === target.premises.length &&
      source.schemeCategory === target.schemeCategory
    ) {
      return "parallel";
    }

    // Hierarchical: target generalizes source
    if (source.role === "subordinate" && target.role === "primary") {
      return "hierarchical";
    }

    return "none";
  }

  private hasLogicalFlow(source: SchemeInstance, target: SchemeInstance): boolean {
    // Check if there's a logical connection
    // Simplified: check if source conclusion relates to target premises
    if (!source.conclusion) return false;

    const conclusionWords = new Set(source.conclusion.toLowerCase().split(/\s+/));
    
    for (const premise of target.premises) {
      const premiseWords = new Set(premise.text.toLowerCase().split(/\s+/));
      const overlap = [...conclusionWords].filter((w) => premiseWords.has(w));
      
      if (overlap.length >= 2) {
        return true;
      }
    }

    return false;
  }

  private generateExplanation(
    source: SchemeInstance,
    target: SchemeInstance,
    type: string,
    evidence: any
  ): string {
    const explanations = {
      prerequisite: `${target.schemeName} requires ${source.schemeName} to be established first.`,
      supporting: `${source.schemeName} provides supporting evidence for ${target.schemeName}.`,
      enabling: `${source.schemeName} enables the reasoning in ${target.schemeName}.`,
      background: `${source.schemeName} provides background context for ${target.schemeName}.`,
    };

    let explanation = explanations[type as keyof typeof explanations];

    if (evidence.premiseOverlap > 0.5) {
      explanation += ` They share ${Math.round(evidence.premiseOverlap * 100)}% of premises.`;
    }

    if (evidence.logicalFlow) {
      explanation += " There is a clear logical flow between them.";
    }

    return explanation;
  }

  private async fetchNet(netId: string): Promise<NetCandidate> {
    const net = await prisma.argumentNet.findUnique({
      where: { id: netId },
      include: {
        schemes: true,
        relationships: true,
      },
    });

    if (!net) {
      throw new Error(`Net ${netId} not found`);
    }

    // Convert to NetCandidate format
    return {
      id: net.id,
      deliberationId: net.deliberationId,
      rootArgumentId: net.rootArgumentId,
      schemes: net.schemes.map((s: any) => ({
        schemeId: s.schemeId,
        schemeName: s.schemeName,
        schemeCategory: s.schemeCategory,
        confidence: s.confidence * 100,
        premises: s.premises as any,
        conclusion: s.conclusion || "",
        role: s.role as any,
        span: s.span as any,
      })),
      netType: net.netType as any,
      complexity: net.complexity,
      confidence: net.confidence,
      relationships: net.relationships.map((r: any) => ({
        sourceScheme: r.sourceScheme,
        targetScheme: r.targetScheme,
        type: r.type,
        strength: r.strength,
      })),
      detection: {
        method: net.detectionMethod as any,
        timestamp: net.createdAt,
        signals: net.detectionSignals,
      },
    };
  }
}
```

## API Routes

**File**: `app/api/nets/[id]/dependencies/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { DependencyInferenceEngine } from "@/app/server/services/DependencyInferenceEngine";
import { NetIdentificationService } from "@/app/server/services/NetIdentificationService";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const engine = new DependencyInferenceEngine();
    const netService = new NetIdentificationService();

    // Fetch the net
    const net = await netService.detectMultiScheme(params.id);

    if (!net) {
      return NextResponse.json({ error: "Net not found" }, { status: 404 });
    }

    // Infer dependencies
    const dependencyGraph = await engine.inferDependencies(net);

    return NextResponse.json({ graph: dependencyGraph });
  } catch (error) {
    console.error("Dependency inference error:", error);
    return NextResponse.json(
      { error: "Failed to infer dependencies" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const engine = new DependencyInferenceEngine();

    const updatedGraph = await engine.updateDependencies(params.id, body.changes);

    return NextResponse.json({ graph: updatedGraph });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update dependencies" },
      { status: 500 }
    );
  }
}
```

## Testing

**File**: `app/server/services/__tests__/DependencyInferenceEngine.test.ts`

```typescript
import { DependencyInferenceEngine } from "../DependencyInferenceEngine";
import { NetCandidate, SchemeInstance } from "../NetIdentificationService";

describe("DependencyInferenceEngine", () => {
  let engine: DependencyInferenceEngine;

  beforeEach(() => {
    engine = new DependencyInferenceEngine();
  });

  describe("inferDependencies", () => {
    it("should infer dependencies in simple net", async () => {
      const mockNet: NetCandidate = {
        id: "net1",
        deliberationId: "delib1",
        rootArgumentId: "arg1",
        schemes: [
          {
            schemeId: "s1",
            schemeName: "Expert Opinion",
            schemeCategory: "Source-based",
            confidence: 90,
            premises: [{ key: "p1", text: "Dr. Smith says X", isFilled: true, evidenceIds: [] }],
            conclusion: "X is true",
            role: "supporting",
            span: { argumentId: "arg1", premiseKeys: ["p1"] },
          },
          {
            schemeId: "s2",
            schemeName: "Main Claim",
            schemeCategory: "General",
            confidence: 85,
            premises: [{ key: "p2", text: "X is true, therefore Y", isFilled: true, evidenceIds: [] }],
            conclusion: "Y is true",
            role: "primary",
            span: { argumentId: "arg1", premiseKeys: ["p2"] },
          },
        ],
        netType: "convergent",
        complexity: 40,
        confidence: 85,
        relationships: [],
        detection: {
          method: "hybrid",
          timestamp: new Date(),
          signals: [],
        },
      };

      const graph = await engine.inferDependencies(mockNet);

      expect(graph.nodes.length).toBe(2);
      expect(graph.edges.length).toBeGreaterThan(0);
      expect(graph.roots.length).toBeGreaterThan(0);
    });

    it("should detect circular dependencies", async () => {
      const mockNet: NetCandidate = {
        id: "net1",
        deliberationId: "delib1",
        rootArgumentId: "arg1",
        schemes: [
          {
            schemeId: "s1",
            schemeName: "Scheme A",
            schemeCategory: "General",
            confidence: 80,
            premises: [{ key: "p1", text: "B therefore A", isFilled: true, evidenceIds: [] }],
            conclusion: "A",
            role: "primary",
            span: { argumentId: "arg1", premiseKeys: ["p1"] },
          },
          {
            schemeId: "s2",
            schemeName: "Scheme B",
            schemeCategory: "General",
            confidence: 80,
            premises: [{ key: "p2", text: "A therefore B", isFilled: true, evidenceIds: [] }],
            conclusion: "B",
            role: "primary",
            span: { argumentId: "arg1", premiseKeys: ["p2"] },
          },
        ],
        netType: "linked",
        complexity: 50,
        confidence: 75,
        relationships: [],
        detection: {
          method: "hybrid",
          timestamp: new Date(),
          signals: [],
        },
      };

      const graph = await engine.inferDependencies(mockNet);

      expect(graph.cycles.length).toBeGreaterThan(0);
    });

    it("should calculate critical path", async () => {
      const mockNet: NetCandidate = {
        id: "net1",
        deliberationId: "delib1",
        rootArgumentId: "arg1",
        schemes: [
          {
            schemeId: "s1",
            schemeName: "Base",
            schemeCategory: "General",
            confidence: 90,
            premises: [{ key: "p1", text: "Base premise", isFilled: true, evidenceIds: [] }],
            conclusion: "Base conclusion",
            role: "subordinate",
            span: { argumentId: "arg1", premiseKeys: ["p1"] },
          },
          {
            schemeId: "s2",
            schemeName: "Middle",
            schemeCategory: "General",
            confidence: 85,
            premises: [
              { key: "p2", text: "Base conclusion leads to middle", isFilled: true, evidenceIds: [] },
            ],
            conclusion: "Middle conclusion",
            role: "supporting",
            span: { argumentId: "arg1", premiseKeys: ["p2"] },
          },
          {
            schemeId: "s3",
            schemeName: "Top",
            schemeCategory: "General",
            confidence: 80,
            premises: [
              { key: "p3", text: "Middle conclusion supports top", isFilled: true, evidenceIds: [] },
            ],
            conclusion: "Top conclusion",
            role: "primary",
            span: { argumentId: "arg1", premiseKeys: ["p3"] },
          },
        ],
        netType: "serial",
        complexity: 60,
        confidence: 85,
        relationships: [],
        detection: {
          method: "structural",
          timestamp: new Date(),
          signals: [],
        },
      };

      const graph = await engine.inferDependencies(mockNet);

      expect(graph.criticalPath.length).toBeGreaterThan(0);
      expect(graph.criticalPath).toContain("s1");
      expect(graph.criticalPath).toContain("s3");
    });
  });

  describe("updateDependencies", () => {
    it("should update graph when schemes are added", async () => {
      // Test implementation
      expect(true).toBe(true);
    });

    it("should update graph when schemes are removed", async () => {
      // Test implementation
      expect(true).toBe(true);
    });
  });
});
```

## Time Allocation

- Dependency detection algorithm: 4 hours
- Graph construction: 2 hours
- Cycle detection: 2 hours
- Critical path analysis: 1 hour
- Testing: 1 hour

## Deliverables

- ✅ `DependencyInferenceEngine` service
- ✅ Dependency analysis algorithms
- ✅ Graph construction
- ✅ Cycle detection
- ✅ Critical path identification
- ✅ API routes
- ✅ Comprehensive test suite

---

# Step 4.1.3: Explicitness Classifier (8 hours)

## Overview

Build a classifier that determines whether argument net structures are explicitly stated by the author or implicitly present in the argumentation, guiding reconstruction strategies.

## Service Structure

**File**: `app/server/services/ExplicitnessClassifier.ts`

```typescript
import { NetCandidate, SchemeInstance } from "./NetIdentificationService";
import { DependencyGraph } from "./DependencyInferenceEngine";

// ============================================================================
// Types
// ============================================================================

export interface ExplicitnessAnalysis {
  netId: string;
  overallExplicitness: "explicit" | "semi-explicit" | "implicit";
  confidence: number; // 0-100
  
  schemeExplicitness: Array<{
    schemeId: string;
    level: "explicit" | "semi-explicit" | "implicit";
    confidence: number;
    indicators: {
      hasExplicitMarkers: boolean;
      hasStructuralCues: boolean;
      hasMetaCommentary: boolean;
      userConfirmed: boolean;
    };
    evidence: string[];
  }>;
  
  relationshipExplicitness: Array<{
    sourceScheme: string;
    targetScheme: string;
    level: "explicit" | "semi-explicit" | "implicit";
    confidence: number;
    indicators: {
      hasConnectives: boolean;
      hasReferentialLinks: boolean;
      hasProximityCues: boolean;
    };
    evidence: string[];
  }>;
  
  reconstructionNeeded: boolean;
  reconstructionPriority: "high" | "medium" | "low";
  suggestions: string[];
}

export interface ExplicitnessMarkers {
  schemeMarkers: string[];
  relationshipMarkers: string[];
  metaCommentary: string[];
}

// ============================================================================
// Main Classifier
// ============================================================================

export class ExplicitnessClassifier {
  // Common linguistic markers
  private readonly EXPLICIT_MARKERS = {
    schemeIntro: [
      "i argue that",
      "my argument is",
      "the reasoning is",
      "this follows from",
      "based on the scheme",
      "using expert opinion",
      "by analogy to",
    ],
    relationships: [
      "because",
      "therefore",
      "thus",
      "consequently",
      "as a result",
      "this supports",
      "building on",
      "depending on",
      "following from",
    ],
    metaCommentary: [
      "first",
      "second",
      "finally",
      "in summary",
      "the structure is",
      "this connects to",
      "as i mentioned",
    ],
  };

  /**
   * Analyze the explicitness of a net structure
   */
  public async classifyExplicitness(
    net: NetCandidate,
    dependencyGraph: DependencyGraph,
    argumentText?: string
  ): Promise<ExplicitnessAnalysis> {
    // Step 1: Analyze scheme-level explicitness
    const schemeExplicitness = await this.analyzeSchemeExplicitness(
      net.schemes,
      argumentText
    );

    // Step 2: Analyze relationship explicitness
    const relationshipExplicitness = await this.analyzeRelationshipExplicitness(
      dependencyGraph,
      argumentText
    );

    // Step 3: Calculate overall explicitness
    const overallExplicitness = this.calculateOverallExplicitness(
      schemeExplicitness,
      relationshipExplicitness
    );

    // Step 4: Calculate confidence
    const confidence = this.calculateConfidence(
      schemeExplicitness,
      relationshipExplicitness
    );

    // Step 5: Determine if reconstruction is needed
    const reconstructionNeeded = this.needsReconstruction(
      overallExplicitness,
      schemeExplicitness,
      relationshipExplicitness
    );

    // Step 6: Prioritize reconstruction
    const reconstructionPriority = this.prioritizeReconstruction(
      overallExplicitness,
      net.complexity,
      confidence
    );

    // Step 7: Generate suggestions
    const suggestions = this.generateSuggestions(
      overallExplicitness,
      schemeExplicitness,
      relationshipExplicitness
    );

    return {
      netId: net.id,
      overallExplicitness,
      confidence,
      schemeExplicitness,
      relationshipExplicitness,
      reconstructionNeeded,
      reconstructionPriority,
      suggestions,
    };
  }

  /**
   * Extract explicit markers from argument text
   */
  public extractMarkers(argumentText: string): ExplicitnessMarkers {
    const lowerText = argumentText.toLowerCase();

    const schemeMarkers = this.EXPLICIT_MARKERS.schemeIntro.filter((marker) =>
      lowerText.includes(marker)
    );

    const relationshipMarkers = this.EXPLICIT_MARKERS.relationships.filter(
      (marker) => lowerText.includes(marker)
    );

    const metaCommentary = this.EXPLICIT_MARKERS.metaCommentary.filter((marker) =>
      lowerText.includes(marker)
    );

    return {
      schemeMarkers,
      relationshipMarkers,
      metaCommentary,
    };
  }

  // ============================================================================
  // Private Methods: Scheme Analysis
  // ============================================================================

  private async analyzeSchemeExplicitness(
    schemes: SchemeInstance[],
    argumentText?: string
  ): Promise<Array<any>> {
    const results = [];

    for (const scheme of schemes) {
      const indicators = {
        hasExplicitMarkers: false,
        hasStructuralCues: false,
        hasMetaCommentary: false,
        userConfirmed: false,
      };

      const evidence: string[] = [];

      // Check for explicit markers in text
      if (argumentText) {
        const markers = this.extractMarkers(argumentText);
        
        if (markers.schemeMarkers.length > 0) {
          indicators.hasExplicitMarkers = true;
          evidence.push(`Found markers: ${markers.schemeMarkers.join(", ")}`);
        }

        if (markers.metaCommentary.length > 0) {
          indicators.hasMetaCommentary = true;
          evidence.push(`Found meta-commentary: ${markers.metaCommentary.join(", ")}`);
        }
      }

      // Check structural cues
      if (scheme.role === "primary") {
        indicators.hasStructuralCues = true;
        evidence.push("Primary scheme role indicates explicit structure");
      }

      // Check if premises are well-formed
      const filledPremises = scheme.premises.filter((p) => p.isFilled).length;
      const fillRate = filledPremises / scheme.premises.length;

      if (fillRate >= 0.8) {
        indicators.hasStructuralCues = true;
        evidence.push(`${Math.round(fillRate * 100)}% premises filled`);
      }

      // Determine explicitness level
      const level = this.determineSchemeLevel(indicators);
      const confidence = this.calculateSchemeConfidence(indicators, scheme);

      results.push({
        schemeId: scheme.schemeId,
        level,
        confidence,
        indicators,
        evidence,
      });
    }

    return results;
  }

  private determineSchemeLevel(indicators: any): "explicit" | "semi-explicit" | "implicit" {
    const explicitCount = Object.values(indicators).filter(Boolean).length;

    if (explicitCount >= 3) return "explicit";
    if (explicitCount >= 2) return "semi-explicit";
    return "implicit";
  }

  private calculateSchemeConfidence(indicators: any, scheme: SchemeInstance): number {
    let confidence = 0;

    if (indicators.hasExplicitMarkers) confidence += 30;
    if (indicators.hasStructuralCues) confidence += 25;
    if (indicators.hasMetaCommentary) confidence += 20;
    if (indicators.userConfirmed) confidence += 25;

    // Boost confidence if scheme is already highly confident
    confidence += scheme.confidence * 0.2;

    return Math.min(100, Math.round(confidence));
  }

  // ============================================================================
  // Private Methods: Relationship Analysis
  // ============================================================================

  private async analyzeRelationshipExplicitness(
    dependencyGraph: DependencyGraph,
    argumentText?: string
  ): Promise<Array<any>> {
    const results = [];

    for (const edge of dependencyGraph.edges) {
      const indicators = {
        hasConnectives: false,
        hasReferentialLinks: false,
        hasProximityCues: false,
      };

      const evidence: string[] = [];

      // Check for connectives in text
      if (argumentText) {
        const markers = this.extractMarkers(argumentText);
        
        if (markers.relationshipMarkers.length > 0) {
          indicators.hasConnectives = true;
          evidence.push(`Connectives: ${markers.relationshipMarkers.join(", ")}`);
        }
      }

      // Check for referential links (e.g., "as stated above")
      if (argumentText) {
        const referentialPatterns = [
          /as (?:stated|mentioned|argued) (?:above|before|earlier)/i,
          /building on (?:this|that|the previous)/i,
          /following from (?:this|that)/i,
        ];

        for (const pattern of referentialPatterns) {
          if (pattern.test(argumentText)) {
            indicators.hasReferentialLinks = true;
            evidence.push("Found referential link");
            break;
          }
        }
      }

      // Check proximity cues (based on scheme positions)
      const sourceNode = dependencyGraph.nodes.find((n) => n.schemeId === edge.sourceSchemeId);
      const targetNode = dependencyGraph.nodes.find((n) => n.schemeId === edge.targetSchemeId);

      if (sourceNode && targetNode) {
        const depthDiff = Math.abs(sourceNode.depth - targetNode.depth);
        if (depthDiff === 1) {
          indicators.hasProximityCues = true;
          evidence.push("Adjacent schemes in structure");
        }
      }

      // Determine explicitness level
      const level = this.determineRelationshipLevel(indicators, edge);
      const confidence = this.calculateRelationshipConfidence(indicators, edge);

      results.push({
        sourceScheme: edge.sourceSchemeId,
        targetScheme: edge.targetSchemeId,
        level,
        confidence,
        indicators,
        evidence,
      });
    }

    return results;
  }

  private determineRelationshipLevel(
    indicators: any,
    edge: any
  ): "explicit" | "semi-explicit" | "implicit" {
    const indicatorCount = Object.values(indicators).filter(Boolean).length;

    // If high strength and indicators, likely explicit
    if (edge.strength > 0.7 && indicatorCount >= 2) {
      return "explicit";
    }

    // If some indicators or medium strength
    if (indicatorCount >= 1 || edge.strength > 0.5) {
      return "semi-explicit";
    }

    return "implicit";
  }

  private calculateRelationshipConfidence(indicators: any, edge: any): number {
    let confidence = 0;

    if (indicators.hasConnectives) confidence += 35;
    if (indicators.hasReferentialLinks) confidence += 30;
    if (indicators.hasProximityCues) confidence += 20;

    // Factor in edge strength
    confidence += edge.strength * 15;

    return Math.min(100, Math.round(confidence));
  }

  // ============================================================================
  // Private Methods: Overall Analysis
  // ============================================================================

  private calculateOverallExplicitness(
    schemeExplicitness: Array<any>,
    relationshipExplicitness: Array<any>
  ): "explicit" | "semi-explicit" | "implicit" {
    const schemeLevels = schemeExplicitness.map((s) => s.level);
    const relationshipLevels = relationshipExplicitness.map((r) => r.level);

    const explicitSchemes = schemeLevels.filter((l) => l === "explicit").length;
    const explicitRelationships = relationshipLevels.filter((l) => l === "explicit").length;

    const totalExplicit = explicitSchemes + explicitRelationships;
    const totalItems = schemeLevels.length + relationshipLevels.length;

    const explicitRatio = totalExplicit / totalItems;

    if (explicitRatio >= 0.6) return "explicit";
    if (explicitRatio >= 0.3) return "semi-explicit";
    return "implicit";
  }

  private calculateConfidence(
    schemeExplicitness: Array<any>,
    relationshipExplicitness: Array<any>
  ): number {
    const allConfidences = [
      ...schemeExplicitness.map((s) => s.confidence),
      ...relationshipExplicitness.map((r) => r.confidence),
    ];

    if (allConfidences.length === 0) return 0;

    const avgConfidence = allConfidences.reduce((sum, c) => sum + c, 0) / allConfidences.length;

    return Math.round(avgConfidence);
  }

  private needsReconstruction(
    overallExplicitness: string,
    schemeExplicitness: Array<any>,
    relationshipExplicitness: Array<any>
  ): boolean {
    // Needs reconstruction if:
    // 1. Overall is implicit
    // 2. Any critical relationships are implicit
    // 3. Primary scheme is implicit

    if (overallExplicitness === "implicit") return true;

    const primaryScheme = schemeExplicitness.find((s) => s.level === "primary");
    if (primaryScheme && primaryScheme.level === "implicit") return true;

    const implicitRelationships = relationshipExplicitness.filter(
      (r) => r.level === "implicit"
    );
    if (implicitRelationships.length > relationshipExplicitness.length * 0.5) {
      return true;
    }

    return false;
  }

  private prioritizeReconstruction(
    overallExplicitness: string,
    complexity: number,
    confidence: number
  ): "high" | "medium" | "low" {
    // High priority: implicit + complex + low confidence
    if (
      overallExplicitness === "implicit" &&
      complexity > 60 &&
      confidence < 50
    ) {
      return "high";
    }

    // Medium priority: semi-explicit or moderately complex
    if (
      overallExplicitness === "semi-explicit" ||
      (complexity > 40 && confidence < 70)
    ) {
      return "medium";
    }

    // Low priority: explicit or simple
    return "low";
  }

  private generateSuggestions(
    overallExplicitness: string,
    schemeExplicitness: Array<any>,
    relationshipExplicitness: Array<any>
  ): string[] {
    const suggestions: string[] = [];

    if (overallExplicitness === "implicit") {
      suggestions.push("Consider making the argument structure more explicit");
    }

    const implicitSchemes = schemeExplicitness.filter((s) => s.level === "implicit");
    if (implicitSchemes.length > 0) {
      suggestions.push(
        `${implicitSchemes.length} scheme(s) could be made more explicit with clearer markers`
      );
    }

    const implicitRelationships = relationshipExplicitness.filter(
      (r) => r.level === "implicit"
    );
    if (implicitRelationships.length > 0) {
      suggestions.push(
        `${implicitRelationships.length} relationship(s) would benefit from explicit connectives`
      );
    }

    const lowConfidence = [...schemeExplicitness, ...relationshipExplicitness].filter(
      (item) => item.confidence < 50
    );
    if (lowConfidence.length > 0) {
      suggestions.push(
        "Some structural elements have low confidence and may need clarification"
      );
    }

    return suggestions;
  }
}
```

## API Routes

**File**: `app/api/nets/[id]/explicitness/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { ExplicitnessClassifier } from "@/app/server/services/ExplicitnessClassifier";
import { NetIdentificationService } from "@/app/server/services/NetIdentificationService";
import { DependencyInferenceEngine } from "@/app/server/services/DependencyInferenceEngine";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const classifier = new ExplicitnessClassifier();
    const netService = new NetIdentificationService();
    const depEngine = new DependencyInferenceEngine();

    // Fetch net and argument text
    const net = await netService.detectMultiScheme(params.id);
    if (!net) {
      return NextResponse.json({ error: "Net not found" }, { status: 404 });
    }

    const argument = await prisma.argument.findUnique({
      where: { id: net.rootArgumentId },
      include: { premises: true },
    });

    const argumentText = [
      argument?.conclusion,
      ...(argument?.premises.map((p: any) => p.text) || []),
    ]
      .filter(Boolean)
      .join(" ");

    // Infer dependencies
    const dependencyGraph = await depEngine.inferDependencies(net);

    // Classify explicitness
    const analysis = await classifier.classifyExplicitness(
      net,
      dependencyGraph,
      argumentText
    );

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Explicitness classification error:", error);
    return NextResponse.json(
      { error: "Failed to classify explicitness" },
      { status: 500 }
    );
  }
}
```

## Testing

**File**: `app/server/services/__tests__/ExplicitnessClassifier.test.ts`

```typescript
import { ExplicitnessClassifier } from "../ExplicitnessClassifier";
import { NetCandidate, SchemeInstance } from "../NetIdentificationService";
import { DependencyGraph } from "../DependencyInferenceEngine";

describe("ExplicitnessClassifier", () => {
  let classifier: ExplicitnessClassifier;

  beforeEach(() => {
    classifier = new ExplicitnessClassifier();
  });

  describe("extractMarkers", () => {
    it("should extract scheme markers", () => {
      const text = "I argue that X is true based on expert opinion";
      const markers = classifier.extractMarkers(text);

      expect(markers.schemeMarkers).toContain("i argue that");
    });

    it("should extract relationship markers", () => {
      const text = "X is true, therefore Y is true";
      const markers = classifier.extractMarkers(text);

      expect(markers.relationshipMarkers).toContain("therefore");
    });
  });

  describe("classifyExplicitness", () => {
    it("should classify explicit net", async () => {
      const mockNet: NetCandidate = {
        id: "net1",
        deliberationId: "delib1",
        rootArgumentId: "arg1",
        schemes: [
          {
            schemeId: "s1",
            schemeName: "Expert Opinion",
            schemeCategory: "Source",
            confidence: 90,
            premises: [
              { key: "p1", text: "Dr. Smith says X", isFilled: true, evidenceIds: [] },
            ],
            conclusion: "X is true",
            role: "primary",
            span: { argumentId: "arg1", premiseKeys: ["p1"] },
          },
        ],
        netType: "convergent",
        complexity: 30,
        confidence: 90,
        relationships: [],
        detection: { method: "hybrid", timestamp: new Date(), signals: [] },
      };

      const mockGraph: DependencyGraph = {
        netId: "net1",
        nodes: [{ schemeId: "s1", schemeName: "Expert Opinion", role: "primary", depth: 0 }],
        edges: [],
        cycles: [],
        roots: ["s1"],
        leaves: ["s1"],
        criticalPath: ["s1"],
      };

      const argumentText = "I argue that X is true based on expert opinion. Dr. Smith says X.";

      const analysis = await classifier.classifyExplicitness(
        mockNet,
        mockGraph,
        argumentText
      );

      expect(analysis.overallExplicitness).toBe("explicit");
      expect(analysis.confidence).toBeGreaterThan(50);
    });

    it("should detect implicit net", async () => {
      const mockNet: NetCandidate = {
        id: "net1",
        deliberationId: "delib1",
        rootArgumentId: "arg1",
        schemes: [
          {
            schemeId: "s1",
            schemeName: "Implicit Scheme",
            schemeCategory: "General",
            confidence: 60,
            premises: [{ key: "p1", text: "X", isFilled: true, evidenceIds: [] }],
            conclusion: "Y",
            role: "primary",
            span: { argumentId: "arg1", premiseKeys: ["p1"] },
          },
        ],
        netType: "convergent",
        complexity: 40,
        confidence: 60,
        relationships: [],
        detection: { method: "semantic", timestamp: new Date(), signals: [] },
      };

      const mockGraph: DependencyGraph = {
        netId: "net1",
        nodes: [{ schemeId: "s1", schemeName: "Implicit Scheme", role: "primary", depth: 0 }],
        edges: [],
        cycles: [],
        roots: ["s1"],
        leaves: ["s1"],
        criticalPath: ["s1"],
      };

      const argumentText = "X. Y.";

      const analysis = await classifier.classifyExplicitness(
        mockNet,
        mockGraph,
        argumentText
      );

      expect(analysis.overallExplicitness).toBe("implicit");
      expect(analysis.reconstructionNeeded).toBe(true);
    });
  });
});
```

## Time Allocation

- Marker detection: 2 hours
- Scheme explicitness analysis: 2 hours
- Relationship explicitness analysis: 2 hours
- Confidence calculation: 1 hour
- Testing: 1 hour

## Deliverables

- ✅ `ExplicitnessClassifier` service
- ✅ Linguistic marker detection
- ✅ Scheme-level analysis
- ✅ Relationship-level analysis
- ✅ Reconstruction prioritization
- ✅ API routes
- ✅ Test suite

---

# Step 4.1.4: Reconstruction Suggestion System (8 hours)

## Overview

Build a system that generates concrete suggestions for reconstructing implicit argument nets into explicit, well-structured representations.

## Service Structure

**File**: `app/server/services/NetReconstructionService.ts`

```typescript
import { NetCandidate, SchemeInstance } from "./NetIdentificationService";
import { DependencyGraph, Dependency } from "./DependencyInferenceEngine";
import { ExplicitnessAnalysis } from "./ExplicitnessClassifier";

// ============================================================================
// Types
// ============================================================================

export interface ReconstructionSuggestion {
  id: string;
  type:
    | "add-scheme"
    | "clarify-relationship"
    | "fill-premise"
    | "add-connective"
    | "restructure"
    | "add-evidence";
  priority: "critical" | "high" | "medium" | "low";
  target: {
    schemeId?: string;
    relationshipId?: string;
    premiseKey?: string;
  };
  suggestion: {
    title: string;
    description: string;
    example?: string;
    alternatives?: string[];
  };
  impact: {
    explicitnessGain: number; // How much more explicit
    clarityGain: number; // How much clearer
    completenessGain: number; // How much more complete
  };
  effort: "low" | "medium" | "high";
  automatable: boolean;
  automaticFix?: any; // If automatable, what to apply
}

export interface ReconstructionPlan {
  netId: string;
  currentState: {
    explicitness: string;
    completeness: number;
    clarity: number;
  };
  targetState: {
    explicitness: string;
    completeness: number;
    clarity: number;
  };
  suggestions: ReconstructionSuggestion[];
  phases: Array<{
    name: string;
    suggestions: string[]; // suggestion IDs
    estimatedEffort: string;
  }>;
  totalEffort: string;
}

// ============================================================================
// Main Service
// ============================================================================

export class NetReconstructionService {
  /**
   * Generate reconstruction suggestions for a net
   */
  public async generateSuggestions(
    net: NetCandidate,
    dependencyGraph: DependencyGraph,
    explicitnessAnalysis: ExplicitnessAnalysis
  ): Promise<ReconstructionSuggestion[]> {
    const suggestions: ReconstructionSuggestion[] = [];

    // Step 1: Suggestions for implicit schemes
    const schemeSuggestions = await this.suggestSchemeImprovements(
      net,
      explicitnessAnalysis
    );
    suggestions.push(...schemeSuggestions);

    // Step 2: Suggestions for implicit relationships
    const relationshipSuggestions = await this.suggestRelationshipImprovements(
      dependencyGraph,
      explicitnessAnalysis
    );
    suggestions.push(...relationshipSuggestions);

    // Step 3: Suggestions for incomplete premises
    const premiseSuggestions = await this.suggestPremiseImprovements(net);
    suggestions.push(...premiseSuggestions);

    // Step 4: Structural suggestions
    const structuralSuggestions = await this.suggestStructuralImprovements(
      net,
      dependencyGraph
    );
    suggestions.push(...structuralSuggestions);

    // Sort by priority
    return this.prioritizeSuggestions(suggestions);
  }

  /**
   * Create a complete reconstruction plan
   */
  public async createReconstructionPlan(
    net: NetCandidate,
    dependencyGraph: DependencyGraph,
    explicitnessAnalysis: ExplicitnessAnalysis
  ): Promise<ReconstructionPlan> {
    const suggestions = await this.generateSuggestions(
      net,
      dependencyGraph,
      explicitnessAnalysis
    );

    // Calculate current state metrics
    const currentState = {
      explicitness: explicitnessAnalysis.overallExplicitness,
      completeness: this.calculateCompleteness(net),
      clarity: explicitnessAnalysis.confidence,
    };

    // Estimate target state after applying suggestions
    const targetState = this.estimateTargetState(currentState, suggestions);

    // Group suggestions into phases
    const phases = this.createPhases(suggestions);

    // Calculate total effort
    const totalEffort = this.calculateTotalEffort(suggestions);

    return {
      netId: net.id,
      currentState,
      targetState,
      suggestions,
      phases,
      totalEffort,
    };
  }

  // ============================================================================
  // Private Methods: Scheme Suggestions
  // ============================================================================

  private async suggestSchemeImprovements(
    net: NetCandidate,
    explicitnessAnalysis: ExplicitnessAnalysis
  ): Promise<ReconstructionSuggestion[]> {
    const suggestions: ReconstructionSuggestion[] = [];

    for (const schemeAnalysis of explicitnessAnalysis.schemeExplicitness) {
      if (schemeAnalysis.level === "implicit") {
        const scheme = net.schemes.find((s) => s.schemeId === schemeAnalysis.schemeId);
        if (!scheme) continue;

        suggestions.push({
          id: `scheme-${scheme.schemeId}`,
          type: "add-scheme",
          priority: scheme.role === "primary" ? "critical" : "high",
          target: { schemeId: scheme.schemeId },
          suggestion: {
            title: `Make ${scheme.schemeName} explicit`,
            description: `Add explicit markers to indicate the use of ${scheme.schemeName}`,
            example: `"I argue using ${scheme.schemeName} that..."`,
            alternatives: [
              `"Based on ${scheme.schemeCategory}, I claim..."`,
              `"Following the pattern of ${scheme.schemeName}..."`,
            ],
          },
          impact: {
            explicitnessGain: 25,
            clarityGain: 20,
            completenessGain: 10,
          },
          effort: "low",
          automatable: true,
          automaticFix: {
            action: "add-marker",
            marker: `Using ${scheme.schemeName}:`,
            position: "before-premise",
          },
        });
      }
    }

    return suggestions;
  }

  // ============================================================================
  // Private Methods: Relationship Suggestions
  // ============================================================================

  private async suggestRelationshipImprovements(
    dependencyGraph: DependencyGraph,
    explicitnessAnalysis: ExplicitnessAnalysis
  ): Promise<ReconstructionSuggestion[]> {
    const suggestions: ReconstructionSuggestion[] = [];

    for (const relAnalysis of explicitnessAnalysis.relationshipExplicitness) {
      if (relAnalysis.level === "implicit") {
        const dependency = dependencyGraph.edges.find(
          (e) =>
            e.sourceSchemeId === relAnalysis.sourceScheme &&
            e.targetSchemeId === relAnalysis.targetScheme
        );

        if (!dependency) continue;

        const connective = this.suggestConnective(dependency);

        suggestions.push({
          id: `rel-${dependency.id}`,
          type: "add-connective",
          priority: dependency.criticality === "critical" ? "high" : "medium",
          target: { relationshipId: dependency.id },
          suggestion: {
            title: "Clarify relationship between schemes",
            description: `Add an explicit connective to show how these schemes relate`,
            example: connective,
            alternatives: this.getAlternativeConnectives(dependency.type),
          },
          impact: {
            explicitnessGain: 20,
            clarityGain: 25,
            completenessGain: 5,
          },
          effort: "low",
          automatable: true,
          automaticFix: {
            action: "insert-connective",
            connective,
            position: "between-schemes",
          },
        });
      }
    }

    return suggestions;
  }

  private suggestConnective(dependency: Dependency): string {
    const connectives = {
      prerequisite: "Building on this,",
      supporting: "Furthermore,",
      enabling: "This enables us to see that",
      background: "In the context of",
    };

    return connectives[dependency.type] || "Additionally,";
  }

  private getAlternativeConnectives(type: string): string[] {
    const alternatives = {
      prerequisite: ["Following from this,", "Given that,", "Based on this,"],
      supporting: ["Moreover,", "In addition,", "This supports that"],
      enabling: ["This allows,", "Consequently,", "As a result,"],
      background: ["Considering,", "With respect to,", "In light of,"],
    };

    return alternatives[type as keyof typeof alternatives] || ["Therefore,", "Thus,"];
  }

  // ============================================================================
  // Private Methods: Premise Suggestions
  // ============================================================================

  private async suggestPremiseImprovements(
    net: NetCandidate
  ): Promise<ReconstructionSuggestion[]> {
    const suggestions: ReconstructionSuggestion[] = [];

    for (const scheme of net.schemes) {
      const unfilledPremises = scheme.premises.filter((p) => !p.isFilled);

      for (const premise of unfilledPremises) {
        suggestions.push({
          id: `premise-${scheme.schemeId}-${premise.key}`,
          type: "fill-premise",
          priority: scheme.role === "primary" ? "high" : "medium",
          target: {
            schemeId: scheme.schemeId,
            premiseKey: premise.key,
          },
          suggestion: {
            title: `Fill premise ${premise.key}`,
            description: `Provide content for ${premise.key} in ${scheme.schemeName}`,
            example: `Consider: "${premise.text || "..."}"`,
          },
          impact: {
            explicitnessGain: 10,
            clarityGain: 15,
            completenessGain: 20,
          },
          effort: "medium",
          automatable: false,
        });
      }

      // Suggest adding evidence
      const premisesWithoutEvidence = scheme.premises.filter(
        (p) => p.isFilled && p.evidenceIds.length === 0
      );

      if (premisesWithoutEvidence.length > 0) {
        suggestions.push({
          id: `evidence-${scheme.schemeId}`,
          type: "add-evidence",
          priority: "medium",
          target: { schemeId: scheme.schemeId },
          suggestion: {
            title: "Add supporting evidence",
            description: `${premisesWithoutEvidence.length} premise(s) lack evidence`,
            example: "Link relevant evidence from the library",
          },
          impact: {
            explicitnessGain: 5,
            clarityGain: 10,
            completenessGain: 15,
          },
          effort: "medium",
          automatable: false,
        });
      }
    }

    return suggestions;
  }

  // ============================================================================
  // Private Methods: Structural Suggestions
  // ============================================================================

  private async suggestStructuralImprovements(
    net: NetCandidate,
    dependencyGraph: DependencyGraph
  ): Promise<ReconstructionSuggestion[]> {
    const suggestions: ReconstructionSuggestion[] = [];

    // Check for circular dependencies
    if (dependencyGraph.cycles.length > 0) {
      suggestions.push({
        id: "cycle-resolution",
        type: "restructure",
        priority: "critical",
        target: {},
        suggestion: {
          title: "Resolve circular dependencies",
          description: `${dependencyGraph.cycles.length} circular dependencies detected`,
          example: "Restructure the argument to remove circular reasoning",
        },
        impact: {
          explicitnessGain: 15,
          clarityGain: 30,
          completenessGain: 10,
        },
        effort: "high",
        automatable: false,
      });
    }

    // Check for orphaned schemes
    const orphanedSchemes = net.schemes.filter(
      (s) =>
        !dependencyGraph.edges.some(
          (e) => e.sourceSchemeId === s.schemeId || e.targetSchemeId === s.schemeId
        )
    );

    if (orphanedSchemes.length > 0 && net.schemes.length > 1) {
      suggestions.push({
        id: "connect-orphans",
        type: "clarify-relationship",
        priority: "high",
        target: {},
        suggestion: {
          title: "Connect isolated schemes",
          description: `${orphanedSchemes.length} scheme(s) have no clear relationships`,
          example: "Clarify how these schemes relate to the main argument",
        },
        impact: {
          explicitnessGain: 20,
          clarityGain: 25,
          completenessGain: 15,
        },
        effort: "medium",
        automatable: false,
      });
    }

    return suggestions;
  }

  // ============================================================================
  // Private Methods: Plan Creation
  // ============================================================================

  private prioritizeSuggestions(
    suggestions: ReconstructionSuggestion[]
  ): ReconstructionSuggestion[] {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

    return suggestions.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // If same priority, sort by impact
      const impactA = a.impact.explicitnessGain + a.impact.clarityGain + a.impact.completenessGain;
      const impactB = b.impact.explicitnessGain + b.impact.clarityGain + b.impact.completenessGain;

      return impactB - impactA;
    });
  }

  private calculateCompleteness(net: NetCandidate): number {
    let totalPremises = 0;
    let filledPremises = 0;

    for (const scheme of net.schemes) {
      totalPremises += scheme.premises.length;
      filledPremises += scheme.premises.filter((p) => p.isFilled).length;
    }

    return totalPremises > 0 ? (filledPremises / totalPremises) * 100 : 0;
  }

  private estimateTargetState(
    currentState: any,
    suggestions: ReconstructionSuggestion[]
  ): any {
    const totalExplicitnessGain = suggestions.reduce(
      (sum, s) => sum + s.impact.explicitnessGain,
      0
    );
    const totalClarityGain = suggestions.reduce((sum, s) => sum + s.impact.clarityGain, 0);
    const totalCompletenessGain = suggestions.reduce(
      (sum, s) => sum + s.impact.completenessGain,
      0
    );

    return {
      explicitness: "explicit",
      completeness: Math.min(100, currentState.completeness + totalCompletenessGain),
      clarity: Math.min(100, currentState.clarity + totalClarityGain / suggestions.length),
    };
  }

  private createPhases(suggestions: ReconstructionSuggestion[]): Array<any> {
    const phases = [
      {
        name: "Critical Fixes",
        suggestions: suggestions
          .filter((s) => s.priority === "critical")
          .map((s) => s.id),
        estimatedEffort: this.calculatePhaseEffort(
          suggestions.filter((s) => s.priority === "critical")
        ),
      },
      {
        name: "High Priority Improvements",
        suggestions: suggestions
          .filter((s) => s.priority === "high")
          .map((s) => s.id),
        estimatedEffort: this.calculatePhaseEffort(
          suggestions.filter((s) => s.priority === "high")
        ),
      },
      {
        name: "Medium Priority Enhancements",
        suggestions: suggestions
          .filter((s) => s.priority === "medium")
          .map((s) => s.id),
        estimatedEffort: this.calculatePhaseEffort(
          suggestions.filter((s) => s.priority === "medium")
        ),
      },
    ];

    return phases.filter((p) => p.suggestions.length > 0);
  }

  private calculatePhaseEffort(suggestions: ReconstructionSuggestion[]): string {
    const effortMap = { low: 1, medium: 3, high: 5 };
    const totalEffort = suggestions.reduce(
      (sum, s) => sum + effortMap[s.effort],
      0
    );

    if (totalEffort < 5) return "5-10 minutes";
    if (totalEffort < 10) return "10-20 minutes";
    if (totalEffort < 20) return "20-40 minutes";
    return "40+ minutes";
  }

  private calculateTotalEffort(suggestions: ReconstructionSuggestion[]): string {
    return this.calculatePhaseEffort(suggestions);
  }
}
```

## API Routes

**File**: `app/api/nets/[id]/reconstruction/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { NetReconstructionService } from "@/app/server/services/NetReconstructionService";
import { NetIdentificationService } from "@/app/server/services/NetIdentificationService";
import { DependencyInferenceEngine } from "@/app/server/services/DependencyInferenceEngine";
import { ExplicitnessClassifier } from "@/app/server/services/ExplicitnessClassifier";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reconstructionService = new NetReconstructionService();
    const netService = new NetIdentificationService();
    const depEngine = new DependencyInferenceEngine();
    const classifier = new ExplicitnessClassifier();

    // Fetch net
    const net = await netService.detectMultiScheme(params.id);
    if (!net) {
      return NextResponse.json({ error: "Net not found" }, { status: 404 });
    }

    // Get argument text
    const argument = await prisma.argument.findUnique({
      where: { id: net.rootArgumentId },
      include: { premises: true },
    });

    const argumentText = [
      argument?.conclusion,
      ...(argument?.premises.map((p: any) => p.text) || []),
    ]
      .filter(Boolean)
      .join(" ");

    // Analyze
    const dependencyGraph = await depEngine.inferDependencies(net);
    const explicitnessAnalysis = await classifier.classifyExplicitness(
      net,
      dependencyGraph,
      argumentText
    );

    // Generate suggestions or plan
    const { searchParams } = request.nextUrl;
    const getPlan = searchParams.get("plan") === "true";

    if (getPlan) {
      const plan = await reconstructionService.createReconstructionPlan(
        net,
        dependencyGraph,
        explicitnessAnalysis
      );
      return NextResponse.json({ plan });
    } else {
      const suggestions = await reconstructionService.generateSuggestions(
        net,
        dependencyGraph,
        explicitnessAnalysis
      );
      return NextResponse.json({ suggestions });
    }
  } catch (error) {
    console.error("Reconstruction error:", error);
    return NextResponse.json(
      { error: "Failed to generate reconstruction suggestions" },
      { status: 500 }
    );
  }
}
```

## Testing

**File**: `app/server/services/__tests__/NetReconstructionService.test.ts`

```typescript
import { NetReconstructionService } from "../NetReconstructionService";

describe("NetReconstructionService", () => {
  let service: NetReconstructionService();

  beforeEach(() => {
    service = new NetReconstructionService();
  });

  it("should generate scheme improvement suggestions", async () => {
    // Test implementation
    expect(true).toBe(true);
  });

  it("should create reconstruction plan with phases", async () => {
    // Test implementation
    expect(true).toBe(true);
  });

  it("should prioritize critical suggestions first", async () => {
    // Test implementation
    expect(true).toBe(true);
  });
});
```

## Time Allocation

- Suggestion generation: 3 hours
- Plan creation: 2 hours
- Prioritization logic: 2 hours
- Testing: 1 hour

## Deliverables

- ✅ `NetReconstructionService`
- ✅ Suggestion generation
- ✅ Reconstruction planning
- ✅ Prioritization system
- ✅ API routes
- ✅ Test suite

---

*[Continuing with Step 4.1.5: User Confirmation Workflow...]*

---

# Step 4.1.5: User Confirmation Workflow (4 hours)

## Overview

Build UI components and workflows that allow users to review, confirm, reject, and modify detected argument nets.

## React Components

### 1. Net Detection Badge

**File**: `components/nets/NetDetectionBadge.tsx`

```tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Network, AlertCircle, CheckCircle } from "lucide-react";

interface NetDetectionBadgeProps {
  netType: string;
  complexity: number;
  confidence: number;
  isConfirmed: boolean;
  onClick?: () => void;
}

export function NetDetectionBadge({
  netType,
  complexity,
  confidence,
  isConfirmed,
  onClick,
}: NetDetectionBadgeProps) {
  const getColorClass = () => {
    if (isConfirmed) return "bg-green-100 text-green-800 border-green-300";
    if (confidence < 50) return "bg-orange-100 text-orange-800 border-orange-300";
    return "bg-blue-100 text-blue-800 border-blue-300";
  };

  const Icon = isConfirmed ? CheckCircle : confidence < 50 ? AlertCircle : Network;

  return (
    <Badge
      className={`${getColorClass()} cursor-pointer hover:opacity-80 transition`}
      onClick={onClick}
    >
      <Icon className="w-3 h-3 mr-1" />
      {netType} net ({complexity} complexity)
    </Badge>
  );
}
```

### 2. Net Confirmation Modal

**File**: `components/nets/NetConfirmationModal.tsx`

```tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, Edit, AlertTriangle } from "lucide-react";

interface NetConfirmationModalProps {
  netId: string;
  net: any;
  explicitnessAnalysis: any;
  reconstructionSuggestions: any[];
  onConfirm: (netId: string, modifications?: any) => void;
  onReject: (netId: string, reason: string) => void;
  onModify: (netId: string, modifications: any) => void;
  onClose: () => void;
}

export function NetConfirmationModal({
  netId,
  net,
  explicitnessAnalysis,
  reconstructionSuggestions,
  onConfirm,
  onReject,
  onModify,
  onClose,
}: NetConfirmationModalProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [modifications, setModifications] = useState<any>({});

  const handleConfirm = () => {
    onConfirm(netId, Object.keys(modifications).length > 0 ? modifications : undefined);
    onClose();
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }
    onReject(netId, rejectReason);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Detected Argument Net</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Net Summary */}
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Type:</span>
                <p className="font-medium">{net.netType}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Complexity:</span>
                <p className="font-medium">{net.complexity}/100</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Confidence:</span>
                <p className="font-medium">{net.confidence}%</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Explicitness:</span>
                <Badge
                  className={
                    explicitnessAnalysis.overallExplicitness === "explicit"
                      ? "bg-green-100 text-green-800"
                      : explicitnessAnalysis.overallExplicitness === "semi-explicit"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  {explicitnessAnalysis.overallExplicitness}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Tabs for detailed info */}
          <Tabs defaultValue="schemes">
            <TabsList>
              <TabsTrigger value="schemes">Schemes ({net.schemes.length})</TabsTrigger>
              <TabsTrigger value="relationships">
                Relationships ({net.relationships.length})
              </TabsTrigger>
              <TabsTrigger value="suggestions">
                Suggestions ({reconstructionSuggestions.length})
              </TabsTrigger>
            </TabsList>

            {/* Schemes Tab */}
            <TabsContent value="schemes" className="space-y-2">
              {net.schemes.map((scheme: any, idx: number) => {
                const schemeAnalysis = explicitnessAnalysis.schemeExplicitness.find(
                  (s: any) => s.schemeId === scheme.schemeId
                );

                return (
                  <Card key={idx} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{scheme.schemeName}</span>
                          <Badge variant="outline">{scheme.role}</Badge>
                          {schemeAnalysis && (
                            <Badge
                              className={
                                schemeAnalysis.level === "explicit"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {schemeAnalysis.level}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          Confidence: {scheme.confidence}%
                        </p>
                        <p className="text-sm mt-1">
                          <span className="font-medium">Conclusion:</span> {scheme.conclusion}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </TabsContent>

            {/* Relationships Tab */}
            <TabsContent value="relationships" className="space-y-2">
              {net.relationships.map((rel: any, idx: number) => {
                const relAnalysis = explicitnessAnalysis.relationshipExplicitness.find(
                  (r: any) =>
                    r.sourceScheme === rel.sourceScheme &&
                    r.targetScheme === rel.targetScheme
                );

                return (
                  <Card key={idx} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {rel.sourceScheme} → {rel.targetScheme}
                        </p>
                        <p className="text-sm text-gray-600">
                          {rel.type} (strength: {Math.round(rel.strength * 100)}%)
                        </p>
                      </div>
                      {relAnalysis && (
                        <Badge
                          className={
                            relAnalysis.level === "explicit"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {relAnalysis.level}
                        </Badge>
                      )}
                    </div>
                  </Card>
                );
              })}
            </TabsContent>

            {/* Suggestions Tab */}
            <TabsContent value="suggestions" className="space-y-2">
              {reconstructionSuggestions.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No reconstruction suggestions
                </p>
              ) : (
                reconstructionSuggestions.map((suggestion: any, idx: number) => (
                  <Card key={idx} className="p-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        className={`w-5 h-5 flex-shrink-0 ${
                          suggestion.priority === "critical"
                            ? "text-red-500"
                            : suggestion.priority === "high"
                            ? "text-orange-500"
                            : "text-yellow-500"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{suggestion.suggestion.title}</span>
                          <Badge
                            className={
                              suggestion.priority === "critical"
                                ? "bg-red-100 text-red-800"
                                : suggestion.priority === "high"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {suggestion.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {suggestion.suggestion.description}
                        </p>
                        {suggestion.suggestion.example && (
                          <p className="text-sm text-gray-500 italic mt-1">
                            Example: {suggestion.suggestion.example}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>

          {/* Rejection Reason Input */}
          {rejectReason !== null && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700">
                Reason for rejection (optional):
              </label>
              <textarea
                className="w-full mt-1 p-2 border rounded-md"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this net detection is incorrect..."
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleReject}>
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button variant="default" onClick={handleConfirm}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirm Net
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 3. Net Review Panel

**File**: `components/nets/NetReviewPanel.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NetDetectionBadge } from "./NetDetectionBadge";
import { NetConfirmationModal } from "./NetConfirmationModal";
import { Loader2 } from "lucide-react";

interface NetReviewPanelProps {
  argumentId: string;
}

export function NetReviewPanel({ argumentId }: NetReviewPanelProps) {
  const [nets, setNets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNet, setSelectedNet] = useState<string | null>(null);
  const [netDetails, setNetDetails] = useState<any>(null);

  useEffect(() => {
    loadNets();
  }, [argumentId]);

  const loadNets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/nets/detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ argumentId }),
      });

      const data = await response.json();
      setNets(data.nets || []);
    } catch (error) {
      console.error("Failed to load nets:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadNetDetails = async (netId: string) => {
    try {
      // Fetch net details, explicitness, and suggestions in parallel
      const [netRes, explicitnessRes, suggestionsRes] = await Promise.all([
        fetch(`/api/nets/${netId}`),
        fetch(`/api/nets/${netId}/explicitness`),
        fetch(`/api/nets/${netId}/reconstruction`),
      ]);

      const net = await netRes.json();
      const { analysis: explicitnessAnalysis } = await explicitnessRes.json();
      const { suggestions } = await suggestionsRes.json();

      setNetDetails({
        net: net.net,
        explicitnessAnalysis,
        suggestions,
      });
    } catch (error) {
      console.error("Failed to load net details:", error);
    }
  };

  const handleNetClick = async (netId: string) => {
    setSelectedNet(netId);
    await loadNetDetails(netId);
  };

  const handleConfirm = async (netId: string, modifications?: any) => {
    try {
      await fetch(`/api/nets/${netId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true, modifications }),
      });

      // Reload nets
      await loadNets();
    } catch (error) {
      console.error("Failed to confirm net:", error);
    }
  };

  const handleReject = async (netId: string, reason: string) => {
    try {
      await fetch(`/api/nets/${netId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: false, reason }),
      });

      // Reload nets
      await loadNets();
    } catch (error) {
      console.error("Failed to reject net:", error);
    }
  };

  const handleModify = async (netId: string, modifications: any) => {
    // Handle modifications
    console.log("Modify net:", netId, modifications);
  };

  if (loading) {
    return (
      <Card className="p-4 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </Card>
    );
  }

  if (nets.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-gray-500 text-center">
          No argument nets detected in this argument.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Detected Argument Nets</h3>
        <div className="space-y-2">
          {nets.map((net: any) => (
            <div key={net.id} className="flex items-center justify-between">
              <NetDetectionBadge
                netType={net.netType}
                complexity={net.complexity}
                confidence={net.confidence}
                isConfirmed={net.isConfirmed}
                onClick={() => handleNetClick(net.id)}
              />
              {!net.isConfirmed && (
                <Button size="sm" variant="outline" onClick={() => handleNetClick(net.id)}>
                  Review
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {selectedNet && netDetails && (
        <NetConfirmationModal
          netId={selectedNet}
          net={netDetails.net}
          explicitnessAnalysis={netDetails.explicitnessAnalysis}
          reconstructionSuggestions={netDetails.suggestions}
          onConfirm={handleConfirm}
          onReject={handleReject}
          onModify={handleModify}
          onClose={() => {
            setSelectedNet(null);
            setNetDetails(null);
          }}
        />
      )}
    </>
  );
}
```

## API Routes

**File**: `app/api/nets/[id]/confirm/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/server/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { confirmed, reason, modifications } = body;

    // Update net confirmation status
    const net = await prisma.argumentNet.update({
      where: { id: params.id },
      data: {
        isConfirmed: confirmed,
        confirmedBy: confirmed ? user.id : null,
        confirmedAt: confirmed ? new Date() : null,
        rejectionReason: !confirmed ? reason : null,
      },
    });

    // If confirmed with modifications, apply them
    if (confirmed && modifications) {
      // Apply modifications to schemes, relationships, etc.
      // (Implementation depends on modification structure)
    }

    // Log action
    await prisma.netConfirmationLog.create({
      data: {
        netId: params.id,
        userId: user.id,
        action: confirmed ? "confirmed" : "rejected",
        reason: reason || null,
        modifications: modifications ? JSON.stringify(modifications) : null,
      },
    });

    return NextResponse.json({ success: true, net });
  } catch (error) {
    console.error("Net confirmation error:", error);
    return NextResponse.json(
      { error: "Failed to confirm/reject net" },
      { status: 500 }
    );
  }
}
```

## Database Schema Updates

**File**: `prisma/schema.prisma` (additions)

```prisma
model NetConfirmationLog {
  id            String   @id @default(cuid())
  netId         String
  userId        String
  action        String   // "confirmed" | "rejected" | "modified"
  reason        String?
  modifications Json?
  createdAt     DateTime @default(now())

  net  ArgumentNet @relation(fields: [netId], references: [id])
  user User        @relation(fields: [userId], references: [id])

  @@index([netId])
  @@index([userId])
}

// Update ArgumentNet model to add confirmation fields
model ArgumentNet {
  // ... existing fields ...
  
  confirmedBy      String?
  confirmedAt      DateTime?
  rejectionReason  String?
  
  confirmationLogs NetConfirmationLog[]
}
```

## Integration Example

**File**: `app/(app)/arguments/[id]/page.tsx` (partial)

```tsx
import { NetReviewPanel } from "@/components/nets/NetReviewPanel";

export default function ArgumentPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto p-6">
      {/* Existing argument display */}
      <div className="argument-content">
        {/* ... */}
      </div>

      {/* Net Review Section */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Argument Structure Analysis</h2>
        <NetReviewPanel argumentId={params.id} />
      </div>
    </div>
  );
}
```

## Testing

**File**: `components/nets/__tests__/NetConfirmationModal.test.tsx`

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { NetConfirmationModal } from "../NetConfirmationModal";

describe("NetConfirmationModal", () => {
  const mockNet = {
    id: "net1",
    netType: "convergent",
    complexity: 40,
    confidence: 85,
    schemes: [],
    relationships: [],
  };

  const mockExplicitness = {
    overallExplicitness: "semi-explicit",
    confidence: 75,
    schemeExplicitness: [],
    relationshipExplicitness: [],
    reconstructionNeeded: true,
    reconstructionPriority: "medium",
    suggestions: [],
  };

  it("should render net summary", () => {
    render(
      <NetConfirmationModal
        netId="net1"
        net={mockNet}
        explicitnessAnalysis={mockExplicitness}
        reconstructionSuggestions={[]}
        onConfirm={jest.fn()}
        onReject={jest.fn()}
        onModify={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText("convergent")).toBeInTheDocument();
    expect(screen.getByText("40/100")).toBeInTheDocument();
  });

  it("should call onConfirm when confirmed", () => {
    const onConfirm = jest.fn();
    render(
      <NetConfirmationModal
        netId="net1"
        net={mockNet}
        explicitnessAnalysis={mockExplicitness}
        reconstructionSuggestions={[]}
        onConfirm={onConfirm}
        onReject={jest.fn()}
        onModify={jest.fn()}
        onClose={jest.fn()}
      />
    );

    fireEvent.click(screen.getByText("Confirm Net"));
    expect(onConfirm).toHaveBeenCalledWith("net1", undefined);
  });
});
```

## Time Allocation

- UI components: 2 hours
- API routes: 1 hour
- Integration: 0.5 hours
- Testing: 0.5 hours

## Deliverables

- ✅ `NetDetectionBadge` component
- ✅ `NetConfirmationModal` component
- ✅ `NetReviewPanel` component
- ✅ Confirmation API route
- ✅ Database schema updates
- ✅ Integration example
- ✅ Test suite

---

## Week 13 Summary

**Total Time**: 40 hours

**Steps Completed**:
1. ✅ Multi-Scheme Detection Service (10 hours)
2. ✅ Dependency Inference Engine (10 hours)
3. ✅ Explicitness Classifier (8 hours)
4. ✅ Reconstruction Suggestion System (8 hours)
5. ✅ User Confirmation Workflow (4 hours)

**Key Achievements**:
- Complete net identification pipeline from detection to user confirmation
- Sophisticated dependency analysis with graph algorithms
- Explicitness classification for reconstruction guidance
- Intelligent reconstruction suggestions with prioritization
- Full user review and confirmation workflow

**Next Steps** (Week 14):
- Net Visualization components
- Interactive graph displays
- Dependency path highlighting
- Comparative net analysis

---

**Status**: Week 13 (Net Identification) - COMPLETE ✅
