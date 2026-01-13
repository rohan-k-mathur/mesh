# Phase 3.2: Integration & Interoperability - Implementation Complete

## Overview

Phase 3.2 adds two major capabilities to Mesh's source management:
1. **Academic Database Integration** - Search and import from Semantic Scholar, OpenAlex, and CrossRef
2. **Reference Manager Sync** - Connect and sync with Zotero (Mendeley support ready for future implementation)

## Files Created

### 3.2.1 Academic Database Integration

#### Library Functions

**`lib/sources/academicSearch.ts`** - Core types and unified search
- `AcademicSearchResult` interface - standardized format across all databases
- `AcademicSearchOptions` interface - query options with filters
- `searchAcademicDatabases()` - unified search across multiple databases
- `getAcademicPaper()` - fetch single paper details
- `searchResultToSourceData()` - convert result to Source creation data
- Deduplication by DOI or normalized title
- Result interleaving for better UX

**`lib/sources/databases/semanticScholar.ts`** - Semantic Scholar API (200M+ papers)
- `searchSemanticScholar()` - full-text search
- `getSemanticScholarPaper()` - get by paper ID
- `getSemanticScholarPaperByDOI()` - lookup by DOI
- `getSemanticScholarPaperByArxiv()` - lookup by arXiv ID
- `getSemanticScholarRecommendations()` - similar papers
- `getSemanticScholarCitations()` - citing papers
- `getSemanticScholarReferences()` - referenced papers

**`lib/sources/databases/openAlex.ts`** - OpenAlex API (250M+ works)
- `searchOpenAlex()` - full-text search with filters
- `getOpenAlexWork()` - get by OpenAlex ID or DOI
- `getOpenAlexWorkByDOI()` - lookup by DOI
- `getOpenAlexCitations()` - citing works
- `getOpenAlexReferences()` - referenced works
- Abstract reconstruction from inverted index

**`lib/sources/databases/crossref.ts`** - CrossRef API (140M+ DOIs)
- `searchCrossRef()` - search with filters
- `getCrossRefWork()` - get by DOI
- `getCrossRefWorksByDOIs()` - batch lookup
- `getCrossRefReferences()` - reference list
- `searchByPrefix()` - search by DOI prefix (publisher)

#### API Endpoints

**`app/api/sources/search/route.ts`** - GET
- Unified search endpoint
- Query params: `q`, `databases`, `limit`, `offset`, `yearFrom`, `yearTo`, `openAccessOnly`

**`app/api/sources/import/route.ts`** - POST (single) / PUT (bulk)
- Import from search results to Source records
- Deduplication by DOI/URL
- Optional: add to stack

#### UI Component

**`components/sources/AcademicSearchModal.tsx`**
- Database selector (Semantic Scholar, OpenAlex, CrossRef)
- Year range filters
- Search results with metadata display
- Multi-select with import functionality
- Shows authors, year, venue, citation count, open access status

---

### 3.2.2 Reference Manager Sync

#### Schema (Prisma)

Added to `lib/models/schema.prisma`:

**Enums:**
- `ReferenceManagerProvider` - zotero, mendeley
- `SyncDirection` - import_only, export_only, bidirectional
- `SyncStatus` - pending, syncing, synced, error

**Models:**
- `ReferenceManagerConnection` - user's connection to external service
- `ReferenceManagerItem` - sync tracking for individual items

**Relations added:**
- `User.referenceManagerConnections`
- `Source.refManagerItems`
- `Stack.refManagerDefaults`

#### Library Functions

**`lib/sources/referenceManagers/zotero.ts`** - Full Zotero API client
- `ZoteroClient` class with full CRUD operations
- `verifyKey()` - validate API key
- `getLibraries()` - user and group libraries
- `getCollections()` - library collections
- `getItems()` - fetch items (with incremental sync)
- `getItem()`, `createItem()`, `updateItem()`, `deleteItem()`
- `searchItems()` - search within library
- `getModifiedItems()` - incremental sync support
- `zoteroItemToSource()` - convert Zotero → Source format
- `sourceToZoteroItem()` - convert Source → Zotero format
- `createZoteroClientFromConnection()` - factory function

#### API Endpoints

**`app/api/reference-managers/route.ts`**
- GET - list user's connections
- POST - create new connection (validates credentials)

**`app/api/reference-managers/[connectionId]/route.ts`**
- GET - connection details with sync items
- PATCH - update settings
- DELETE - remove connection

**`app/api/reference-managers/[connectionId]/sync/route.ts`**
- POST - trigger manual sync
- Imports new/updated items from Zotero
- Creates Sources and ReferenceManagerItem links
- Optionally adds to default stack

**`app/api/reference-managers/[connectionId]/libraries/route.ts`**
- GET - available libraries and collections

---

## Environment Variables

Optional but recommended:

```env
# Academic Database APIs (optional - increases rate limits)
SEMANTIC_SCHOLAR_API_KEY=your_key
OPENALEX_POLITE_EMAIL=your@email.com
CROSSREF_POLITE_EMAIL=your@email.com
```

---

## Usage Examples

### Academic Database Search

```typescript
// Search across databases
const response = await fetch('/api/sources/search?q=machine+learning&databases=semantic_scholar,openalex');
const { results } = await response.json();

// Import selected results
await fetch('/api/sources/import', {
  method: 'PUT',
  body: JSON.stringify({
    searchResults: selectedResults,
    stackId: 'optional-stack-id',
  }),
});
```

### Reference Manager Connection

```typescript
// Connect Zotero
const connection = await fetch('/api/reference-managers', {
  method: 'POST',
  body: JSON.stringify({
    provider: 'zotero',
    apiKey: 'user-zotero-api-key',
    libraryType: 'user',
    syncDirection: 'bidirectional',
  }),
});

// Trigger sync
await fetch(`/api/reference-managers/${connectionId}/sync`, {
  method: 'POST',
});
```

---

## Database Schema Changes

```sql
-- New enums
CREATE TYPE "ReferenceManagerProvider" AS ENUM ('zotero', 'mendeley');
CREATE TYPE "SyncDirection" AS ENUM ('import_only', 'export_only', 'bidirectional');
CREATE TYPE "SyncStatus" AS ENUM ('pending', 'syncing', 'synced', 'error');

-- New tables
CREATE TABLE "ReferenceManagerConnection" (...);
CREATE TABLE "ReferenceManagerItem" (...);
```

---

## Future Enhancements

1. **Mendeley support** - OAuth flow + API integration
2. **Export to Zotero** - bidirectional sync implementation  
3. **Conflict resolution UI** - visual diff when both sides modified
4. **Auto-sync worker** - background sync on schedule (similar to Phase 3.1 workers)
5. **PubMed/arXiv integration** - additional database sources
6. **Citation graph visualization** - show relationships between imported papers

---

## Testing

1. Academic Search:
   - Visit `/api/sources/search?q=test` to verify search works
   - Use AcademicSearchModal component in UI

2. Reference Manager:
   - Create Zotero API key at https://www.zotero.org/settings/keys
   - POST to `/api/reference-managers` with the key
   - POST to `/api/reference-managers/{id}/sync` to import

---

## Status: ✅ COMPLETE

All Phase 3.2 components implemented:
- [x] Semantic Scholar integration
- [x] OpenAlex integration  
- [x] CrossRef integration
- [x] Unified search API
- [x] Import API (single + bulk)
- [x] Academic Search Modal UI
- [x] Reference Manager schema
- [x] Zotero client
- [x] Connection management APIs
- [x] Sync API
- [x] Libraries/Collections API
