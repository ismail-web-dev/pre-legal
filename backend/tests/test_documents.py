"""
End-to-end API tests covering PL-4 (generation), PL-6 (export),
PL-9 (validation/errors), and PL-10 (full workflow).
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

VALID_NDA = {
    "document_type": "nda",
    "party_name": "Acme Corp",
    "details": "This agreement covers proprietary software developed for Project X.",
}
VALID_SERVICE = {
    "document_type": "service_agreement",
    "party_name": "BuildRight LLC",
    "details": "Web development services including frontend and backend for 3 months.",
}
VALID_DEMAND = {
    "document_type": "demand_letter",
    "party_name": "John Doe",
    "details": "Client has failed to pay $5,000 owed under invoice #1234 dated 2026-08-01.",
}


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_get_templates():
    r = client.get("/documents/templates")
    assert r.status_code == 200
    templates = r.json()
    assert len(templates) == 3
    doc_types = [t["document_type"] for t in templates]
    assert "nda" in doc_types
    assert "service_agreement" in doc_types
    assert "demand_letter" in doc_types
    for t in templates:
        assert "title" in t and len(t["title"]) > 0
        assert "description" in t and len(t["description"]) > 0



# ---------------------------------------------------------------------------
# PL-4: Document generation — happy paths
# ---------------------------------------------------------------------------

def test_generate_nda():
    r = client.post("/documents/generate", json=VALID_NDA)
    assert r.status_code == 200
    body = r.json()
    assert body["document_type"] == "nda"
    assert "Non-Disclosure" in body["title"]
    assert "Acme Corp" in body["content"]
    assert "DISCLAIMER" in body["disclaimer"]


def test_generate_service_agreement():
    r = client.post("/documents/generate", json=VALID_SERVICE)
    assert r.status_code == 200
    body = r.json()
    assert body["document_type"] == "service_agreement"
    assert "Service Agreement" in body["title"]
    assert "BuildRight LLC" in body["content"]


def test_generate_demand_letter():
    r = client.post("/documents/generate", json=VALID_DEMAND)
    assert r.status_code == 200
    body = r.json()
    assert body["document_type"] == "demand_letter"
    assert "Demand Letter" in body["title"]
    assert "John Doe" in body["content"]


# ---------------------------------------------------------------------------
# PL-9: Validation errors
# ---------------------------------------------------------------------------

def test_missing_document_type():
    r = client.post("/documents/generate", json={
        "party_name": "Someone",
        "details": "Some details here for context.",
    })
    assert r.status_code == 422


def test_missing_party_name():
    r = client.post("/documents/generate", json={
        "document_type": "nda",
        "details": "Some details here for context.",
    })
    assert r.status_code == 422


def test_missing_details():
    r = client.post("/documents/generate", json={
        "document_type": "nda",
        "party_name": "Acme Corp",
    })
    assert r.status_code == 422


def test_empty_party_name():
    r = client.post("/documents/generate", json={
        "document_type": "nda",
        "party_name": "   ",
        "details": "Some details here for context.",
    })
    assert r.status_code == 422


def test_details_too_short():
    r = client.post("/documents/generate", json={
        "document_type": "nda",
        "party_name": "Acme",
        "details": "short",
    })
    assert r.status_code == 422


def test_invalid_document_type():
    r = client.post("/documents/generate", json={
        "document_type": "unknown_type",
        "party_name": "Acme Corp",
        "details": "Some details here for context.",
    })
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# PL-6: Export
# ---------------------------------------------------------------------------

def test_export_nda():
    r = client.post("/documents/export", json=VALID_NDA)
    assert r.status_code == 200
    assert "text/plain" in r.headers["content-type"]
    assert "attachment" in r.headers["content-disposition"]
    assert "nda_draft.txt" in r.headers["content-disposition"]
    text = r.text
    assert "DISCLAIMER" in text
    assert "Acme Corp" in text


def test_export_service_agreement():
    r = client.post("/documents/export", json=VALID_SERVICE)
    assert r.status_code == 200
    assert "service_agreement_draft.txt" in r.headers["content-disposition"]


def test_export_demand_letter():
    r = client.post("/documents/export", json=VALID_DEMAND)
    assert r.status_code == 200
    assert "demand_letter_draft.txt" in r.headers["content-disposition"]


def test_export_validation_error():
    r = client.post("/documents/export", json={
        "document_type": "nda",
        "party_name": "",
        "details": "Some details here for context.",
    })
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# PL-7: Disclaimer present in all outputs
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("payload", [VALID_NDA, VALID_SERVICE, VALID_DEMAND])
def test_disclaimer_in_generate(payload):
    r = client.post("/documents/generate", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert "DISCLAIMER" in body["disclaimer"]
    assert "legal advice" in body["disclaimer"].lower()


@pytest.mark.parametrize("payload", [VALID_NDA, VALID_SERVICE, VALID_DEMAND])
def test_disclaimer_in_export(payload):
    r = client.post("/documents/export", json=payload)
    assert r.status_code == 200
    assert "DISCLAIMER" in r.text
    assert "legal advice" in r.text.lower()


# ---------------------------------------------------------------------------
# PL-10: Full MVP workflow
# ---------------------------------------------------------------------------

def test_full_workflow_nda():
    """Simulate: select type → fill form → generate → preview → export → download."""
    # Step 1: generate (preview)
    gen = client.post("/documents/generate", json=VALID_NDA)
    assert gen.status_code == 200
    preview = gen.json()
    assert preview["content"]
    assert preview["disclaimer"]

    # Step 2: export (download)
    exp = client.post("/documents/export", json=VALID_NDA)
    assert exp.status_code == 200
    downloaded = exp.text
    # Downloaded file contains disclaimer + document content
    assert "DISCLAIMER" in downloaded
    assert "Acme Corp" in downloaded
    assert "NON-DISCLOSURE" in downloaded
