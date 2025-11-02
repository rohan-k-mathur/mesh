# AIF Export API Testing Guide (Phase 8E.2)

## 🎯 Overview

Test the AIF export API endpoints manually in your browser or API client (like Postman/Insomnia). These endpoints convert Mesh argument schemes to W3C AIF format in RDF/XML, Turtle, or JSON-LD.

## 🔗 API Endpoints

Assuming your dev server is running on `http://localhost:3002` (or your configured port):

---

### 1. **Export Scheme by ID**

**Endpoint**: `GET /api/aif/export/:schemeId`

**Base URL**: `http://localhost:3002/api/aif/export/cmghcuqw50009zq6mungs49z2`

#### Test URLs:

##### Default (Turtle format with all features)
```
http://localhost:3002/api/aif/export/cmghcuqw50009zq6mungs49z2
```

##### RDF/XML format
```
http://localhost:3002/api/aif/export/cmghcuqw50009zq6mungs49z2?format=rdfxml
```

##### JSON-LD format
```
http://localhost:3002/api/aif/export/cmghcuqw50009zq6mungs49z2?format=jsonld
```

##### Without Critical Questions
```
http://localhost:3002/api/aif/export/cmghcuqw50009zq6mungs49z2?includeCQs=false
```

##### Without Hierarchy
```
http://localhost:3002/api/aif/export/cmghcuqw50009zq6mungs49z2?includeHierarchy=false
```

##### Without Mesh Extensions
```
http://localhost:3002/api/aif/export/cmghcuqw50009zq6mungs49z2?includeMeshExtensions=false
```

##### Download as File
```
http://localhost:3002/api/aif/export/cmghcuqw50009zq6mungs49z2?download=true
```

##### Full Configuration Example
```
http://localhost:3002/api/aif/export/cmghcuqw50009zq6mungs49z2?format=turtle&includeCQs=true&includeHierarchy=true&includeMeshExtensions=true&download=true
```

---

### 2. **Export Scheme by Key**

**Endpoint**: `GET /api/aif/export/key/:schemeKey`

**Base URL**: `http://localhost:3002/api/aif/export/key/practical_reasoning`

#### Test URLs:

##### Default Turtle
```
http://localhost:3002/api/aif/export/key/practical_reasoning
```

##### RDF/XML
```
http://localhost:3002/api/aif/export/key/practical_reasoning?format=rdfxml
```

##### JSON-LD
```
http://localhost:3002/api/aif/export/key/practical_reasoning?format=jsonld
```

##### Other Schemes (try these keys if they exist in your DB)
```
http://localhost:3002/api/aif/export/key/argument_from_analogy
http://localhost:3002/api/aif/export/key/expert_opinion
http://localhost:3002/api/aif/export/key/causal_reasoning
http://localhost:3002/api/aif/export/key/good_consequences
```

---

### 3. **Export Cluster Family**

**Endpoint**: `GET /api/aif/export/cluster/:clusterTag`

**Base URL**: `http://localhost:3002/api/aif/export/cluster/practical_reasoning_family`

#### Test URLs:

##### Default Turtle
```
http://localhost:3002/api/aif/export/cluster/practical_reasoning_family
```

##### RDF/XML
```
http://localhost:3002/api/aif/export/cluster/practical_reasoning_family?format=rdfxml
```

##### JSON-LD
```
http://localhost:3002/api/aif/export/cluster/practical_reasoning_family?format=jsonld
```

##### Other Clusters (if they exist)
```
http://localhost:3002/api/aif/export/cluster/similarity_family
http://localhost:3002/api/aif/export/cluster/authority_family
http://localhost:3002/api/aif/export/cluster/causal_family
```

---

## 🧪 What to Test

### 1. **Basic Functionality**
- [ ] Open each URL in browser - should display RDF content
- [ ] Verify correct MIME types in response headers:
  - Turtle: `text/turtle`
  - RDF/XML: `application/rdf+xml`
  - JSON-LD: `application/ld+json`

### 2. **Format Validation**

#### Turtle Format (`format=turtle`)
- [ ] Should start with `@prefix` declarations
- [ ] Should include `@prefix aif: <http://www.arg.dundee.ac.uk/aif#>`
- [ ] Should include `@prefix mesh: <http://mesh-platform.io/ontology/aif#>`
- [ ] Triples should use dot notation: `subject predicate object .`

#### RDF/XML Format (`format=rdfxml`)
- [ ] Should start with `<?xml version="1.0"?>`
- [ ] Should have `<rdf:RDF>` root element
- [ ] Should include namespace declarations: `xmlns:aif=`, `xmlns:mesh=`
- [ ] Should have nested XML elements for resources

#### JSON-LD Format (`format=jsonld`)
- [ ] Should be valid JSON (check in JSON validator)
- [ ] Should have `@context` object with namespace mappings
- [ ] Should have `@graph` array with resources
- [ ] Each resource should have `@id` and `@type`

### 3. **Content Validation**

For each scheme export:
- [ ] Verify scheme URI: `<http://mesh-platform.io/aif/schemes/{key}>`
- [ ] Verify type triple: `a aif:Scheme`
- [ ] Verify label: `rdfs:label "{key}"`
- [ ] Verify summary: `rdfs:comment "{summary}"`

For exports with CQs (`includeCQs=true`):
- [ ] Verify question URIs: `<http://mesh-platform.io/aif/schemes/{key}/questions/{cqKey}>`
- [ ] Verify question types: `a aif:Question`
- [ ] Verify links: `aif:hasQuestion`
- [ ] Verify question text: `aif:questionText`
- [ ] Verify attack kinds: `mesh:attackKind`

For exports with Mesh extensions (`includeMeshExtensions=true`):
- [ ] Verify cluster tags: `mesh:clusterTag`
- [ ] Verify inheritance flags: `mesh:inheritCQs`

### 4. **Option Testing**

#### Test `includeCQs=false`
- [ ] Export should NOT contain `aif:hasQuestion` triples
- [ ] Export should NOT contain `aif:Question` type declarations
- [ ] Should only have scheme metadata

#### Test `includeHierarchy=false`
- [ ] Export should NOT contain `aif:isSubtypeOf` triples
- [ ] Should not include parent/child relationships

#### Test `includeMeshExtensions=false`
- [ ] Export should NOT contain `mesh:clusterTag`
- [ ] Export should NOT contain `mesh:inheritCQs`
- [ ] Should only have standard AIF properties

### 5. **Download Functionality**

Test with `?download=true`:
- [ ] Browser should prompt to download file instead of displaying
- [ ] Filename should match format:
  - Turtle: `scheme-{key}.ttl`
  - RDF/XML: `scheme-{key}.xml`
  - JSON-LD: `scheme-{key}.jsonld`
- [ ] File should contain same content as non-download version

### 6. **Error Handling**

Try invalid inputs:
- [ ] Non-existent scheme ID: `http://localhost:3002/api/aif/export/invalid-id-123`
  - Should return 404 error with JSON error message
- [ ] Non-existent scheme key: `http://localhost:3002/api/aif/export/key/nonexistent_scheme`
  - Should return 404 error with JSON error message
- [ ] Invalid format: `http://localhost:3002/api/aif/export/cmghcuqw50009zq6mungs49z2?format=invalid`
  - Should return 400 error or default to turtle

---

## 📊 Expected Results

### Test Data From Script Execution

Based on the test script results:

#### Practical Reasoning Scheme
- **Scheme ID**: `cmghcuqw50009zq6mungs49z2`
- **Scheme Key**: `practical_reasoning`
- **CQs**: 9 critical questions
- **Triples**: 42 RDF triples
- **Cluster**: `practical_reasoning_family`

#### Similarity Family Cluster
- **Cluster Tag**: `similarity_family`
- **Schemes**: 1 scheme in cluster
- **CQs**: 2 total questions
- **Triples**: 14 RDF triples

---

## 🔍 Visual Inspection Checklist

When viewing the output:

### Turtle Format
```turtle
@prefix aif: <http://www.arg.dundee.ac.uk/aif#>.
@prefix mesh: <http://mesh-platform.io/ontology/aif#>.
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.

<http://mesh-platform.io/aif/schemes/practical_reasoning> a aif:Scheme;
    rdfs:label "practical_reasoning";
    aif:schemeName "Practical Reasoning (Goal→Means→Ought)";
    rdfs:comment "";
    mesh:clusterTag "practical_reasoning_family";
    mesh:inheritCQs true.
```

### RDF/XML Format
```xml
<?xml version="1.0"?>
<rdf:RDF xmlns:aif="http://www.arg.dundee.ac.uk/aif#"
         xmlns:mesh="http://mesh-platform.io/ontology/aif#"
         xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">
  
  <aif:Scheme rdf:about="http://mesh-platform.io/aif/schemes/practical_reasoning">
    <rdfs:label>practical_reasoning</rdfs:label>
    <aif:schemeName>Practical Reasoning (Goal→Means→Ought)</aif:schemeName>
    <!-- ... -->
  </aif:Scheme>
</rdf:RDF>
```

### JSON-LD Format
```json
{
  "@context": {
    "aif": "http://www.arg.dundee.ac.uk/aif#",
    "mesh": "http://mesh-platform.io/ontology/aif#",
    "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    "rdfs": "http://www.w3.org/2000/01/rdf-schema#"
  },
  "@graph": [
    {
      "@id": "http://mesh-platform.io/aif/schemes/practical_reasoning",
      "@type": "aif:Scheme",
      "rdfs:label": "practical_reasoning",
      "aif:schemeName": "Practical Reasoning (Goal→Means→Ought)"
    }
  ]
}
```

---

## 🛠️ Testing with Tools

### Browser DevTools
1. Open URL in browser
2. Open DevTools (F12)
3. Check Network tab for response headers
4. Verify Content-Type header matches format
5. Check response status (200 for success)

### Command Line (if available)
```bash
# Test with curl (if auth allows)
curl -v http://localhost:3002/api/aif/export/key/practical_reasoning?format=turtle

# Save to file
curl http://localhost:3002/api/aif/export/key/practical_reasoning?format=turtle > test.ttl

# Validate Turtle with rapper (if installed)
rapper -i turtle test.ttl
```

### Postman/Insomnia
1. Create new GET request
2. Set URL with query params
3. Send request
4. View formatted response
5. Save response to file
6. Test different parameter combinations

---

## ✅ Success Criteria

Phase 8E.2 is complete when:

- [x] Test script runs successfully ✅
- [ ] All three formats (RDF/XML, Turtle, JSON-LD) display correctly in browser
- [ ] Export by ID endpoint works for valid scheme IDs
- [ ] Export by key endpoint works for valid scheme keys
- [ ] Export cluster endpoint works for valid cluster tags
- [ ] Query parameters correctly control output (includeCQs, includeHierarchy, etc.)
- [ ] Download functionality works (Content-Disposition header set)
- [ ] Error responses are properly formatted for invalid inputs
- [ ] All generated RDF is syntactically valid
- [ ] Content matches expected AIF/Mesh ontology structure

---

## 📝 Notes

- Server must be running: `npm run dev` or `yarn dev`
- Default port is 3002 (check your config)
- Files are saved to `test-output/aif-export/` by test script
- API endpoints handle authentication (if configured)
- CORS may need configuration for external testing

---

## 🚀 Next Steps After Testing

Once all manual tests pass:

1. **Phase 8E.3**: Enable hierarchy export with parentScheme/childSchemes
2. **Phase 8E.4**: Add CQ inheritance metadata to RDF
3. **Phase 8E.5**: Implement validation & standards compliance
4. **Integration**: Connect to frontend UI for scheme export buttons
5. **Documentation**: Update user docs with export feature
