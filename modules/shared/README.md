# Agrinexus Shared

Shared: cross-product types, utilities, UI primitives, permissions, telemetry contracts, and integration boundaries used by multiple modules.

## Boundary

- Keep product-specific workflows here as they are extracted from `app/`, `components/`, `lib/`, and `services/`.
- Keep shared AI, search, memory, and audit contracts in `modules/ai-brain` or `modules/shared` instead of duplicating them per product.
- Move code into this module only with tests or smoke coverage for the affected user flow.
