# Agrinexus Product Boundaries

Agrinexus is moving from a feature-rich MVP into a modular SaaS platform. The goal is to keep Next.js routes stable while product logic moves behind explicit module boundaries.

## Product Map

```text
Agrinexus Platform
├── Agrinexus Core
├── Agrinexus Law
├── TerraIQ
├── Agri Academy
├── FIELDLOT
└── Admin / AI Brain
```

## Current Extraction Rule

Do not move large folders just to make the tree look clean. Keep `app/` as the Next.js routing layer and move reusable product logic into `modules/` when a flow becomes shared, paid, or operationally important.

## Module Ownership

| Module | Owns | First extraction target |
| --- | --- | --- |
| `modules/law` | Agricultural document review, contracts, leases, notices, clause risk analysis, document summaries, letter generation, deadlines, version history, signing preparation | `/document-review` and `/api/document-review/*` |
| `modules/ai-brain` | Shared AI gateway contracts, RAG orchestration, document analysis primitives, search orchestration, user memory, case memory, audit logs | Case Memory contracts and AI service interfaces |
| `modules/terraiq` | Land, field, crop, weather, statistics, geospatial and decision-intelligence workflows | `moya-ferma`, weather, statistics, field insights |
| `modules/academy` | Courses, explainers, assessments, learning progress | future learning routes and content indexing |
| `modules/marketplace` | FIELDLOT listings, land/farm opportunities, marketplace workflows | future marketplace routes |
| `modules/shared` | Cross-product types, UI contracts, permissions, telemetry and integration helpers | shared module contracts only |

## AI Brain Contract

All products should call one AI center instead of creating separate AI islands:

```text
AI Brain
├── Chat
├── RAG
├── Document Analysis
├── Search
├── User Memory
├── Case Memory
└── Audit Logs
```

## Case Memory

Every important document, request, AI analysis, recommendation, and decision should become an Agrinexus case. The first implementation stores document reviews in `document_reviews` and also writes an `agrinexus_cases` row for cross-product retrieval.

A future similar-case query should be able to answer:

- similar contracts or leases
- previous risk level
- what action was recommended
- which document or source produced the case
- whether the issue belongs to Law, TerraIQ, Core, Academy, FIELDLOT, or Admin

## First Paid Product

Agrinexus Law should be positioned as:

**AI Legal Assistant for Agricultural Documents**

Avoid presenting it as an “AI lawyer”. The product assists with structure, risk discovery, summaries, letters, deadlines and preparation, while keeping professional legal review as the escalation path.