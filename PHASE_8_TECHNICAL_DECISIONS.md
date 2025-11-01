# Phase 8 Technical Decision Matrix
## Key Implementation Choices & Trade-offs

**Purpose**: Document critical technical decisions before implementation begins

---

## Decision 1: Variable Binding Strategy

### Options

| Approach | Pros | Cons | Complexity | Cost |
|----------|------|------|------------|------|
| **A. Pattern Matching (Regex + spaCy)** | Fast, no API costs, deterministic | Limited accuracy, brittle | Low | $0 |
| **B. LLM API (GPT-4)** | High accuracy, handles complex cases | Slow (1-2s), API costs, non-deterministic | Medium | ~$0.05/call |
| **C. Fine-tuned NLP Model** | Fast, accurate, no per-call cost | Requires training data, maintenance | High | ~$500 training |
| **D. Hybrid (Pattern + LLM fallback)** | Best of both, cost-effective | Complex logic, error handling | Medium | ~$0.01/call avg |

### Recommendation: **D. Hybrid Approach**

**Rationale**:
- Use pattern matching for 80% of simple cases (e.g., "Ban X" → action="ban", target="X")
- Fallback to GPT-4 for complex bindings (e.g., implicit goals, abstract actions)
- User can always override/confirm bindings

**Implementation**:
```typescript
async function bindVariables(claim, template) {
  // Try pattern matching first
  const patternResult = tryPatternBinding(claim, template);
  if (patternResult.confidence > 0.8) {
    return patternResult;
  }
  
  // Fallback to LLM for complex cases
  const llmResult = await llmBinding(claim, template);
  return llmResult;
}
```

**Estimated Cost**: $50-100/month for production use (assuming 2000 LLM calls/month)

---

## Decision 2: Knowledge Base Storage

### Options

| Approach | Pros | Cons | Query Speed | Scalability |
|----------|------|------|-------------|-------------|
| **A. PostgreSQL JSON** | Simple, existing DB, ACID | Slow for complex queries, no semantic search | Medium | 100K facts |
| **B. Vector DB (Pinecone)** | Fast semantic search, scales well | Additional service, API costs | Fast | 10M+ facts |
| **C. Graph DB (Neo4j)** | Excellent for entity relations, ontology | Complex setup, learning curve | Fast | 1M+ facts |
| **D. Hybrid (Postgres + Embeddings)** | Balance of simplicity and semantic search | Requires embedding pipeline | Medium-Fast | 500K facts |

### Recommendation: **D. Hybrid (Postgres + pgvector)**

**Rationale**:
- Store facts in Postgres (existing infrastructure)
- Add `pgvector` extension for semantic similarity search
- Embedding pipeline: Generate embeddings on fact creation
- Best of both worlds: ACID + semantic search

**Implementation**:
```sql
-- Add vector column to KnowledgeFact
ALTER TABLE "KnowledgeFact" ADD COLUMN "embedding" vector(1536);

-- Create index for fast similarity search
CREATE INDEX ON "KnowledgeFact" USING ivfflat (embedding vector_cosine_ops);

-- Query: Find facts similar to claim
SELECT * FROM "KnowledgeFact"
ORDER BY embedding <=> $claim_embedding
LIMIT 10;
```

**Estimated Cost**: $0 (pgvector is free), ~$20/month for OpenAI embeddings API

---

## Decision 3: AIF Export Format

### Options

| Format | Pros | Cons | Tool Support | Human Readable |
|--------|------|------|--------------|----------------|
| **A. RDF/XML** | Official AIF format, validator exists | Verbose, hard to read | Excellent | Poor |
| **B. Turtle (TTL)** | Compact, human-readable | Less tool support | Good | Excellent |
| **C. JSON-LD** | Web-friendly, easier to parse | Not official AIF format | Medium | Good |
| **D. Multi-format (support all)** | Max compatibility | More maintenance | Excellent | Varies |

### Recommendation: **D. Multi-format with RDF/XML as primary**

**Rationale**:
- RDF/XML is the official AIF spec → must support for compliance
- Turtle for human debugging and documentation
- JSON-LD for API responses (web developers prefer JSON)

**Implementation**:
```typescript
// lib/aif/aifExporter.ts

export async function exportScheme(schemeId: string, format: "rdfxml" | "turtle" | "jsonld") {
  const scheme = await getScheme(schemeId);
  
  switch (format) {
    case "rdfxml":
      return generateRDFXML(scheme);
    case "turtle":
      return generateTurtle(scheme);
    case "jsonld":
      return generateJSONLD(scheme);
  }
}

// API endpoint: GET /api/aif/export/:id?format=turtle
```

**Estimated Effort**: +20 hours (multi-format support)

---

## Decision 4: Argument Generation Strategy

### Options

| Strategy | Pros | Cons | Quality | Speed |
|----------|------|------|---------|-------|
| **A. Eager (generate all upfront)** | Comprehensive, can compare quality | Slow, wastes compute on unused args | High | Slow (5-10s) |
| **B. Lazy (generate on-demand)** | Fast initial response, efficient | May miss better arguments | Medium | Fast (1-2s) |
| **C. Streaming (progressive refinement)** | Best UX, show progress | Complex implementation | High | Fast perceived |
| **D. Cached (pre-generate common claims)** | Instant for cached, efficient | Requires prediction, stale cache | High | Instant/Slow |

### Recommendation: **C. Streaming with caching for common claims**

**Rationale**:
- Stream first argument immediately (best match)
- Continue generating in background, stream additional arguments
- Cache results for common claims (e.g., "ban plastic straws")
- Best UX: User sees progress, doesn't wait for all results

**Implementation**:
```typescript
// API endpoint: GET /api/invention/generate?claim=X (streaming)

export async function GET(req: Request) {
  const claim = req.query.claim;
  
  // Check cache first
  const cached = await redis.get(`gen:${hash(claim)}`);
  if (cached) return Response.json(cached);
  
  // Stream results
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  generateArguments(claim, {
    onArgument: (arg) => {
      writer.write(JSON.stringify(arg) + "\n");
    },
    onComplete: () => {
      writer.close();
      // Cache for 24 hours
      redis.setex(`gen:${hash(claim)}`, 86400, results);
    }
  });
  
  return new Response(stream.readable, {
    headers: { "Content-Type": "text/event-stream" }
  });
}
```

**Estimated Effort**: +30 hours (streaming + caching)

---

## Decision 5: Ontology Reasoning Depth

### Options

| Depth | Capabilities | Performance | Complexity | Research Value |
|-------|-------------|-------------|------------|----------------|
| **A. No reasoning (direct DB queries)** | Basic parent-child | Fast | Low | Low |
| **B. Transitive closure (ancestors/descendants)** | Full hierarchy | Fast | Medium | Medium |
| **C. OWL inference (rules engine)** | Property inheritance, consistency | Slow | High | High |
| **D. Full SPARQL (query AIF graph)** | Arbitrary queries, ontology reasoning | Very slow | Very high | Very high |

### Recommendation: **B. Transitive Closure + Selected OWL Rules**

**Rationale**:
- Implement transitive closure manually (fast, no deps)
- Add specific OWL rules: CQ inheritance, subtype detection
- Skip full OWL reasoner (overkill, slow, complex)
- Sufficient for 95% of use cases

**Implementation**:
```typescript
// lib/aif/ontologyReasoner.ts

class AIF_OntologyReasoner {
  async getAncestorChain(schemeId: string): Promise<Scheme[]> {
    // Recursive query: walk up parentSchemeId
    const chain: Scheme[] = [];
    let current = await getScheme(schemeId);
    
    while (current) {
      chain.push(current);
      current = await getScheme(current.parentSchemeId);
    }
    
    return chain;
  }
  
  async inferCQs(schemeId: string): Promise<CriticalQuestion[]> {
    // OWL Rule: CQ inheritance from ancestors
    const ancestors = await this.getAncestorChain(schemeId);
    const allCQs = [];
    
    for (const ancestor of ancestors) {
      if (ancestor.inheritCQs) {
        allCQs.push(...ancestor.cqs);
      }
    }
    
    return deduplicateCQs(allCQs);
  }
}
```

**Estimated Effort**: 40-60 hours (vs. 100+ for full OWL reasoner)

---

## Decision 6: Testing Strategy

### Options

| Approach | Coverage | Maintenance | Speed | Confidence |
|----------|----------|-------------|-------|------------|
| **A. Manual testing only** | Low | Low | Fast | Low |
| **B. Unit tests only** | Medium | Medium | Fast | Medium |
| **C. Unit + Integration tests** | High | High | Medium | High |
| **D. Unit + Integration + E2E + User testing** | Very high | Very high | Slow | Very high |

### Recommendation: **C. Unit + Integration + Lightweight E2E**

**Rationale**:
- Unit tests for core algorithms (binding, scoring, etc.)
- Integration tests for API endpoints and DB interactions
- Lightweight E2E: Critical user flows (generate arg, accept arg)
- Skip heavy E2E (too slow, fragile)
- Manual user testing at end of each phase

**Test Coverage Targets**:
- Core algorithms: 90%+ coverage
- API endpoints: 80%+ coverage
- UI components: 60%+ coverage (focus on integration)

**Implementation**:
```typescript
// Test structure

__tests__/
  unit/
    schemeMatcher.test.ts        # 20+ test cases
    templateInstantiation.test.ts # 30+ test cases
    confidenceScoring.test.ts    # 15+ test cases
  
  integration/
    api-generation.test.ts       # E2E API tests
    kb-queries.test.ts           # DB + KB integration
  
  e2e/
    generation-flow.spec.ts      # Playwright: User generates arg
    refinement-flow.spec.ts      # Playwright: User edits arg
```

**Estimated Effort**: 60-80 hours (25% of total dev time)

---

## Decision 7: User Experience Model

### Options

| Model | User Involvement | Accuracy | Speed | Learning Curve |
|-------|-----------------|----------|-------|----------------|
| **A. Fully automated (no user input)** | None | Low-Medium | Fast | None |
| **B. User confirms bindings** | Low | High | Medium | Low |
| **C. User selects KB facts** | Medium | Very high | Slow | Medium |
| **D. User builds + refines** | High | Highest | Very slow | High |

### Recommendation: **B. User confirms bindings (with auto-accept option)**

**Rationale**:
- Generate arguments fully automatically
- Show variable bindings for confirmation (e.g., G="protect environment", A="ban straws")
- User can accept, edit, or reject
- Save user corrections to improve future generations (learning system)

**Implementation**:
```typescript
// UI Flow

1. User enters claim: "Ban plastic straws"

2. System generates → shows preview:
   ┌─────────────────────────────────────────────┐
   │ Generated Argument (Practical Reasoning)    │
   ├─────────────────────────────────────────────┤
   │ Detected Variables:                         │
   │   Goal (G): Protect marine life  [Edit]    │
   │   Action (A): Ban plastic straws [Edit]    │
   │                                             │
   │ Premises:                                   │
   │   P1: Protecting marine life is a goal     │
   │   P2: Banning plastic straws promotes...   │
   │                                             │
   │ Confidence: 0.68 (Moderate)                │
   │                                             │
   │ [Accept] [Edit Premises] [Reject]          │
   └─────────────────────────────────────────────┘

3. User clicks [Accept] → Argument created with full structure
```

**Estimated Effort**: +20 hours for confirmation UI

---

## Decision 8: Knowledge Base Curation

### Options

| Approach | Quality | Scalability | Maintenance | User Trust |
|----------|---------|-------------|-------------|------------|
| **A. System-curated (admin only)** | High | Low | High | High |
| **B. Open contribution (wiki-style)** | Variable | High | Low | Medium |
| **C. Moderated contribution** | High | Medium | High | High |
| **D. AI-verified contribution** | Medium-High | High | Medium | Medium-High |

### Recommendation: **C. Moderated contribution (with AI pre-screening)**

**Rationale**:
- Users can submit facts to KB
- AI pre-screens for: duplication, relevance, source credibility
- Admin reviews flagged submissions
- Community upvote/downvote (like Stack Overflow)
- Build trust through transparency

**Implementation**:
```typescript
// Fact submission flow

1. User submits: "97% of climate scientists agree on human-caused warming"
2. AI checks:
   - Duplication: No existing fact matches
   - Source: URL provided (IPCC report)
   - Credibility: High (official scientific body)
   - Relevance: Tags match ["climate", "science", "consensus"]
3. AI auto-approves (high confidence)
4. Fact appears with "Community contributed" badge
5. Community can upvote/flag for review

// For contentious facts:
1. User submits: "Climate change is a hoax"
2. AI flags: Low credibility, conflicts with high-confidence facts
3. Admin review required
4. Likely rejected or marked as "disputed claim"
```

**Estimated Effort**: +40 hours for moderation system

---

## Decision 9: Performance Optimization Strategy

### Target Performance

| Operation | Target | Current Estimate | Optimization Needed? |
|-----------|--------|------------------|---------------------|
| Scheme matching | <100ms | ~150ms | Yes (caching) |
| Variable binding | <200ms | ~500ms (with LLM) | Yes (hybrid approach) |
| KB query | <50ms | ~80ms | Yes (indexing) |
| Template instantiation | <100ms | ~120ms | Minor |
| Full generation pipeline | <500ms | ~850ms | Yes (parallel + streaming) |

### Optimization Plan

**Phase 1 (Immediate):**
- Index KB facts by entities and topics
- Cache scheme queries (schemes rarely change)
- Parallel processing: Run KB queries + scheme matching simultaneously

**Phase 2 (If needed):**
- Pre-compute embeddings for all KB facts
- Add Redis cache for common claims
- Optimize binding algorithm (memoization)

**Phase 3 (Scale):**
- Horizontal scaling: Multiple generation workers
- CDN for scheme data (if serving globally)
- Database read replicas

**Estimated Effort**: 20-30 hours (Phase 1 only for MVP)

---

## Decision 10: Deployment & Infrastructure

### Options

| Approach | Cost | Complexity | Scalability | Maintenance |
|----------|------|------------|-------------|-------------|
| **A. Current monolith (Next.js)** | Low | Low | Medium | Low |
| **B. Microservice (separate invention service)** | Medium | High | High | High |
| **C. Serverless (Vercel Edge Functions)** | Low-Medium | Medium | High | Low |
| **D. Hybrid (monolith + worker queue)** | Medium | Medium | High | Medium |

### Recommendation: **A. Current monolith (with async workers for heavy tasks)**

**Rationale**:
- Keep invention logic in Next.js API routes (simple, consistent)
- Use BullMQ (existing in codebase) for heavy generation tasks
- Async generation: Queue job → poll for results → SSE updates
- Sufficient for MVP, can extract to microservice later if needed

**Implementation**:
```typescript
// API route: Start generation job

// POST /api/invention/generate
export async function POST(req: Request) {
  const { claim } = await req.json();
  
  // Add to BullMQ queue
  const job = await generationQueue.add("generate", { claim });
  
  return Response.json({ jobId: job.id });
}

// GET /api/invention/status/:jobId (poll for updates)
export async function GET(req: Request, { params }) {
  const job = await generationQueue.getJob(params.jobId);
  
  if (job.isCompleted()) {
    return Response.json({ status: "complete", result: job.returnvalue });
  } else {
    return Response.json({ status: "pending", progress: job.progress });
  }
}

// Worker: Process generation jobs
// workers/generationWorker.ts
generationQueue.process("generate", async (job) => {
  const { claim } = job.data;
  
  job.progress(10);  // Starting...
  const schemes = await findApplicableSchemes(claim);
  
  job.progress(50);  // Instantiating...
  const results = await instantiateSchemes(schemes, claim);
  
  job.progress(100); // Done
  return results;
});
```

**Estimated Effort**: +15 hours for async job system

---

## Summary of Recommendations

| Decision | Choice | Rationale | Added Effort |
|----------|--------|-----------|--------------|
| 1. Variable Binding | Hybrid (Pattern + LLM) | 80/20 rule, cost-effective | +10h |
| 2. Knowledge Base | Postgres + pgvector | Semantic search without new service | +20h |
| 3. AIF Export | Multi-format (RDF/XML primary) | Max compatibility | +20h |
| 4. Generation Strategy | Streaming + caching | Best UX, efficient | +30h |
| 5. Ontology Reasoning | Transitive + selected OWL | Balance performance/features | 0h (baseline) |
| 6. Testing | Unit + Integration + light E2E | High confidence, manageable | +60h (included) |
| 7. UX Model | User confirms bindings | High accuracy, user trust | +20h |
| 8. KB Curation | Moderated + AI screening | Quality + scalability | +40h |
| 9. Performance | Parallel + caching | Meet <500ms target | +20h |
| 10. Deployment | Monolith + async workers | Simple, consistent | +15h |

**Total Additional Effort**: ~235 hours (on top of baseline 400-520 hours)

**Revised Timeline**: 14-16 weeks (was 12-13 weeks)

---

## Risk Mitigation

### High Priority Risks

1. **LLM API reliability**
   - Risk: OpenAI downtime breaks generation
   - Mitigation: Implement fallback to pattern matching + retry logic

2. **Variable binding accuracy**
   - Risk: Users frustrated by wrong bindings
   - Mitigation: Always show bindings for confirmation, learn from corrections

3. **KB quality degrades**
   - Risk: Users submit low-quality/false facts
   - Mitigation: AI pre-screening + community moderation + admin review

4. **Performance worse than expected**
   - Risk: Generation takes 2-3 seconds
   - Mitigation: Streaming UI (show progress), optimize hot paths, async jobs

---

## Next Steps

1. **Review this decision matrix** (2 hours)
   - Discuss trade-offs with team
   - Adjust choices if needed

2. **Create technical spike for high-risk decisions** (1 week)
   - Test LLM API for variable binding (accuracy + speed)
   - Benchmark pgvector for semantic search
   - Prototype streaming generation UI

3. **Update Phase 8 timeline based on decisions** (1 hour)
   - Incorporate additional effort (+235 hours)
   - Adjust milestones

4. **Begin Phase 8A with confidence** (Week 1-2)
   - Database schema + KB API
   - No major unknowns remaining

---

**Status**: Ready for Review  
**Last Updated**: January 2025  
**Next Action**: Technical spike for high-risk items (LLM binding, pgvector, streaming)
