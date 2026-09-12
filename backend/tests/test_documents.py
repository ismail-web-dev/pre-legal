"""
End-to-end API tests covering document generation, template customization, validation, and exports.
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
    "disclosing_party_name": "Acme Corp",
    "receiving_party_name": "Beta Industries",
    "purpose": "Evaluating a potential merger or software acquisition.",
}

VALID_SERVICE = {
    "document_type": "service_agreement",
    "service_provider_name": "BuildRight LLC",
    "client_name": "Acme Corp",
    "services_description": "Web development services including frontend and backend for 3 months.",
}

VALID_DEMAND = {
    "document_type": "demand_letter",
    "sender_name": "John Doe",
    "recipient_name": "Acme Corp",
    "demand": "Client has failed to pay $5,000 owed under invoice #1234 dated 2026-08-01.",
}


# ---------------------------------------------------------------------------
# Health & Templates check
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


def test_cors_headers_production_origin():
    response = client.get(
        "/documents/templates",
        headers={"Origin": "https://pre-legal.vercel.app"}
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://pre-legal.vercel.app"


def test_cors_preflight_production_origin():
    response = client.options(
        "/documents/generate",
        headers={
            "Origin": "https://pre-legal.vercel.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://pre-legal.vercel.app"
    assert "POST" in response.headers.get("access-control-allow-methods", "")


# ---------------------------------------------------------------------------
# Specific Required & Optional Fields Testing
# ---------------------------------------------------------------------------

def test_demand_letter_required_only():
    payload = {
        "document_type": "demand_letter",
        "sender_name": "Alice Smith",
        "recipient_name": "Bob Jones",
        "demand": "Payment of $1,200 for outstanding invoice #99.",
    }
    r = client.post("/documents/generate", json=payload)
    assert r.status_code == 200
    content = r.json()["content"]
    assert "Alice Smith" in content
    assert "Bob Jones" in content
    assert "Payment of $1,200 for outstanding invoice #99." in content
    # Verify no unresolved placeholders
    assert "[Recipient]" not in content
    assert "[Recipient Name and Address]" not in content
    assert "[Signature]" not in content
    assert "[Title / Capacity]" not in content
    assert "[Contact Information]" not in content
    assert "null" not in content
    assert "undefined" not in content


def test_demand_letter_all_optional_fields():
    payload = {
        "document_type": "demand_letter",
        "sender_name": "Alice Smith",
        "sender_address": "123 Main St, Suite 4",
        "sender_contact": "alice@example.com",
        "recipient_name": "Bob Jones",
        "recipient_address": "456 Corporate Blvd",
        "date": "October 15, 2026",
        "subject": "Breach of Contract - Invoice #99",
        "facts": "Services were completed on September 1st, but payment remains unpaid.",
        "demand": "Full settlement of $1,200.",
        "deadline": "10 days",
        "sender_title": "Chief Financial Officer",
        "signature_name": "Alice M. Smith",
    }
    r = client.post("/documents/generate", json=payload)
    assert r.status_code == 200
    content = r.json()["content"]
    assert "October 15, 2026" in content
    assert "123 Main St, Suite 4" in content
    assert "456 Corporate Blvd" in content
    assert "Breach of Contract - Invoice #99" in content
    assert "Services were completed on September 1st" in content
    assert "10 days" in content
    assert "Chief Financial Officer" in content
    assert "Alice M. Smith" in content


def test_nda_required_only():
    payload = {
        "document_type": "nda",
        "disclosing_party_name": "Tech Corp",
        "receiving_party_name": "Dev Agency",
    }
    r = client.post("/documents/generate", json=payload)
    assert r.status_code == 200
    content = r.json()["content"]
    assert "Tech Corp" in content
    assert "Dev Agency" in content
    assert "null" not in content
    assert "undefined" not in content
    assert "[Disclosing Party]" not in content
    assert "[Receiving Party]" not in content


def test_service_agreement_required_only():
    payload = {
        "document_type": "service_agreement",
        "service_provider_name": "Fast Code Inc",
        "client_name": "Global Media",
        "services_description": "Mobile application development and QA testing.",
    }
    r = client.post("/documents/generate", json=payload)
    assert r.status_code == 200
    content = r.json()["content"]
    assert "Fast Code Inc" in content
    assert "Global Media" in content
    assert "Mobile application development and QA testing." in content
    assert "null" not in content
    assert "undefined" not in content
    assert "[Client]" not in content


# ---------------------------------------------------------------------------
# Validation errors
# ---------------------------------------------------------------------------

def test_missing_document_type():
    r = client.post("/documents/generate", json={
        "sender_name": "Someone",
        "demand": "Some details here for context.",
    })
    assert r.status_code == 422


def test_missing_required_field_demand_letter():
    r = client.post("/documents/generate", json={
        "document_type": "demand_letter",
        "sender_name": "Alice",
        # missing recipient_name and demand
    })
    assert r.status_code == 422


def test_invalid_document_type():
    r = client.post("/documents/generate", json={
        "document_type": "unknown_type",
        "sender_name": "Acme Corp",
    })
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# Export & Disclaimers
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


@pytest.mark.parametrize("payload", [VALID_NDA, VALID_SERVICE, VALID_DEMAND])
def test_disclaimer_in_generate(payload):
    r = client.post("/documents/generate", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert "DISCLAIMER" in body["disclaimer"]


@pytest.mark.parametrize("payload", [VALID_NDA, VALID_SERVICE, VALID_DEMAND])
def test_disclaimer_in_export(payload):
    r = client.post("/documents/export", json=payload)
    assert r.status_code == 200
    assert "DISCLAIMER" in r.text
