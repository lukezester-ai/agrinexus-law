# Agrinexus AI Brain

Admin / AI Brain: shared AI gateway, chat, RAG, document analysis, search orchestration, user memory, case memory, and audit logs.

## Boundary

- Keep product-specific workflows here as they are extracted from `app/`, `components/`, `lib/`, and `services/`.
- Keep shared AI, search, memory, and audit contracts in `modules/ai-brain` or `modules/shared` instead of duplicating them per product.
- Move code into this module only with tests or smoke coverage for the affected user flow.
