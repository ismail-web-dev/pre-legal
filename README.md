# Pre-Legal Document Generator

A web application for generating pre-legal document drafts from structured, curated templates.

> **Legal Disclaimer:** This tool generates document drafts for general informational purposes only. It does **not** constitute legal advice. Always have any document reviewed by a qualified legal professional before use.

---

## Overview

The Pre-Legal Document Generator lets a user:

1. Select a supported document type (NDA, Service Agreement, or Demand Letter)
2. Enter the required details (party name, context/terms)
3. Generate a document draft from a fixed, deterministic template
4. Preview the generated draft with an inline legal disclaimer
5. Download the draft as a plain-text `.txt` file

## Supported Document Types

| Type | Template |
|------|----------|
| `nda` | Non-Disclosure Agreement (NDA) |
| `service_agreement` | Service Agreement |
| `demand_letter` | Demand Letter |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI, Pydantic |
| Package manager (backend) | `uv` |
| Testing | `pytest` + FastAPI `TestClient` |
| Infrastructure (local) | Docker Compose (PostgreSQL, for future post-MVP use) |
| Deployment targets | Vercel (frontend), Render (backend), Supabase (DB, post-MVP) |

## Architecture Decision — PL-8 (Database)

The MVP does **not** use a database. Templates are deterministic Python `string.Template` objects in `backend/app/templates.py`. SQLAlchemy, Alembic, and PostgreSQL are declared in `pyproject.toml` for future phases (document persistence, user accounts), but no DB connection is established in the MVP code path.

See [`backend/ARCHITECTURE.md`](backend/ARCHITECTURE.md) for the formal ADR.

---

## Local Development

### Prerequisites

- Python 3.12+ with `uv` installed
- Node.js 18+ with `npm`
- (Optional) Docker + Docker Compose for PostgreSQL

### Backend

```bash
cd backend

# Install dependencies using uv
uv sync

# Run the dev server
uv run uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run the dev server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### Environment Variables

Copy `.env.example` and set your values:

```bash
cp .env.example .env
```

The only variable required for local MVP dev is:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/documents/templates` | List all supported document templates |
| `POST` | `/documents/generate` | Generate a document draft (returns JSON) |
| `POST` | `/documents/export` | Generate and download as `.txt` file |

### Request Body (`/generate` and `/export`)

```json
{
  "document_type": "nda",
  "party_name": "Acme Corp",
  "details": "This agreement covers proprietary software developed for Project X."
}
```

---

## Running Tests

```bash
cd backend
uv run pytest
```

All 22 tests should pass. Tests cover:

- Health check
- Template listing (`GET /documents/templates`)
- Document generation (NDA, Service Agreement, Demand Letter)
- Validation errors (missing/empty fields, short details, invalid type)
- Export with correct headers and disclaimer
- End-to-end MVP workflow

---

## Project Structure

```
pre-legal/
├── backend/
│   ├── app/
│   │   ├── routes/documents.py   # API routes
│   │   ├── schemas.py            # Pydantic models
│   │   └── templates.py         # Document templates + generation logic
│   ├── tests/test_documents.py   # Full test suite
│   ├── main.py                   # FastAPI app + CORS
│   ├── ARCHITECTURE.md           # ADRs
│   └── pyproject.toml
├── frontend/
│   └── src/app/
│       ├── page.tsx              # Main UI (form, preview, download)
│       └── layout.tsx
├── docker-compose.yml            # PostgreSQL for future use
├── .env.example
├── .gitignore
└── AGENTS.md
```

---

## License

[Add License Here]
