# Agrinexus Law

Agrinexus Law: AI Legal Assistant for Agricultural Documents. Owns contract/document review, clause risk analysis, legal document summaries, letter generation, deadlines, reminders, version history, and signing preparation workflows.

## Boundary

- Keep product-specific workflows here as they are extracted from `app/`, `components/`, `lib/`, and `services/`.
- Keep shared AI, search, memory, and audit contracts in `modules/ai-brain` or `modules/shared` instead of duplicating them per product.
- Move code into this module only with tests or smoke coverage for the affected user flow.
