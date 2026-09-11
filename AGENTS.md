# Pre-Legal Document Generator - Development Instructions

## Product Purpose
The Pre-Legal Document Generator is a SaaS web application for creating document drafts from templates. It provides users with a platform to select from a curated library of templates (e.g., NDAs, Service Agreements), fill in necessary structured data, generate a document, preview it, download it as a PDF, and save it for future reference.

**Important Legal Disclaimer**: This tool generates document drafts from templates and does not provide legal advice. Documents should be reviewed by a qualified legal professional before use. The generated documents are not claimed to be legally valid for every jurisdiction.

## Architecture
- **Frontend**: Next.js (TypeScript, Tailwind CSS)
- **Backend**: Python (FastAPI, Pydantic, UV)
- **Database**: PostgreSQL (SQLAlchemy, Alembic)
- **Authentication**: JWT/Session-based authentication with secure password hashing.
- **Infrastructure**: Docker & Docker Compose for local development. Vercel for Frontend, Render for Backend, and Supabase for Database in production.

## Coding Conventions
- Use a clean project structure separated into `/frontend`, `/backend`, `/scripts`, and `/docker`.
- Keep code modular and single-purpose.
- Frontend must be built with usability, clean layout, and responsive design in mind. Use Tailwind CSS effectively without overcomplicating visual design.
- Backend should have clearly separated routes, models, schemas, and services.
- Never add unnecessary features (no complex admin panel, payments, advanced AI, etc. until MVP is stable).

## Security Rules
- NEVER commit `.env` files, passwords, API keys, JWT secrets, or database credentials.
- Create an `.env.example` with placeholders for required environment variables.
- Ensure strict multi-tenant data isolation: users must only be able to access and modify their own documents.
- Protect all sensitive API routes with authentication checks.

## Testing Rules
- Every ticket/feature must include appropriate tests.
- Before considering a ticket complete:
  - Run backend tests
  - Run frontend checks
  - Verify API behavior
  - Verify database behavior (where applicable)
  - Verify authentication/authorization rules
  - Check error handling

## Database Rules
- Users must only access their own documents (enforced at the database and API level).
- Development will use Docker PostgreSQL; production will use persistent PostgreSQL (Supabase).
- Never rely on an ephemeral filesystem for permanent data.
- Manage schema changes through structured migrations (e.g., Alembic).

## Development Workflow (Ticket-by-Ticket)
We will develop the product ticket-by-ticket using this disciplined workflow:
1. **Explore**: Read the ticket, inspect the repository, identify relevant existing code, dependencies, and risks.
2. **Clarify**: Ask only necessary clarification questions.
3. **Architect & Plan**: Propose an architecture and implementation plan. Wait for approval if changes are architectural or high-risk.
4. **Implement**: Write the code incrementally.
5. **Test**: Write and run tests, verifying behavior and security.
6. **Review**: Review the work against the requirements and Definition of Done.
7. **Finalize**: Report exactly what changed, tests performed, and remaining risks.
8. **Commit/PR**: Make meaningful commits with clear explanations.

*Never silently expand scope. Do not implement future tickets unless explicitly instructed.*

## Definition of Done
A ticket is considered done when:
- The implementation exists and satisfies the ticket's requirements.
- Tests pass.
- The user flow works correctly.
- Security implications have been considered and mitigated.
- No obvious errors remain.
- Documentation and context (including this file, if needed) are updated.
- Changes are ready for human review.
