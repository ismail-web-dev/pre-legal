# Pre-Legal Backend — Architecture Decision Records

## ADR-001: No database required for MVP template storage (PL-8)

**Date:** 2026-09-12  
**Status:** Accepted

### Context
PL-8 asks for the minimal database layer needed by the MVP.

The three MVP document types (NDA, Service Agreement, Demand Letter) use fixed, deterministic string templates. There are no per-user saved documents, no custom template uploads, and no template versioning requirements in the current MVP scope.

### Decision
Templates are stored as Python `string.Template` objects in `app/templates.py`. No database table is created for document types or templates.

**SQLAlchemy, Alembic, and PostgreSQL remain in `pyproject.toml`** so they are available for the next phase (saved document history, user accounts, etc.) without requiring a dependency change, but no migrations are run and no DB connection is established in the MVP code path.

### Consequences
- Zero operational overhead from a database for the MVP
- The API is stateless and horizontally scalable
- Template changes require a code deploy (acceptable for MVP)
- This decision must be revisited when the product needs to persist generated documents or allow custom templates
