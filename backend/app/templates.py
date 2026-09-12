"""
Static document templates for MVP.

Architecture decision (PL-8):
  The MVP's three document types are fixed and deterministic. There is no
  per-tenant customisation or user-saved content requirement in the current
  scope, so a PostgreSQL document_templates table would add operational
  complexity without benefit. Templates are kept here as Python string
  templates. This decision should be revisited when dynamic/custom templates
  are required.
"""
from __future__ import annotations

from string import Template
from datetime import date

from app.schemas import DocumentType

DISCLAIMER = (
    "DISCLAIMER: This document is a draft generated from a pre-defined template "
    "for general informational purposes only. It does NOT constitute legal advice "
    "and is NOT a substitute for advice from a qualified legal professional. "
    "You should have this document reviewed by a lawyer before use. The authors "
    "make no representation that this document is legally valid in any jurisdiction."
)

# ---------------------------------------------------------------------------
# Template strings — $variable substitution via string.Template
# ---------------------------------------------------------------------------

_NDA_TEMPLATE = Template(
    """NON-DISCLOSURE AGREEMENT (DRAFT)

Date: $date

PARTIES
-------
This Non-Disclosure Agreement ("Agreement") is entered into as of $date
between $party_name ("Disclosing Party") and the receiving party described
in the details below.

BACKGROUND
----------
$details

CONFIDENTIAL INFORMATION
-------------------------
"Confidential Information" means any non-public information disclosed by the
Disclosing Party to the Receiving Party, whether orally, in writing, or by
any other means.

OBLIGATIONS
-----------
The Receiving Party agrees to:
  1. Hold all Confidential Information in strict confidence.
  2. Not disclose Confidential Information to any third party without prior
     written consent of the Disclosing Party.
  3. Use Confidential Information solely for the purpose of evaluating a
     potential business relationship.

TERM
----
This Agreement shall remain in effect for a period of two (2) years from the
date first written above, unless terminated earlier by written agreement of
both parties.

GOVERNING LAW
-------------
This Agreement shall be governed by applicable law. Any disputes shall be
resolved in a court of competent jurisdiction.

SIGNATURES
----------
Disclosing Party: $party_name     Date: ____________
Receiving Party:  _______________  Date: ____________
"""
)

_SERVICE_AGREEMENT_TEMPLATE = Template(
    """SERVICE AGREEMENT (DRAFT)

Date: $date

PARTIES
-------
This Service Agreement ("Agreement") is entered into as of $date between
$party_name ("Service Provider") and the client described in the details below.

SCOPE OF SERVICES
-----------------
$details

PAYMENT
-------
Compensation, payment schedule, and method shall be as mutually agreed in
writing by the parties prior to commencement of services.

TERM
----
This Agreement begins on $date and continues until the services are completed
or the Agreement is terminated by either party with thirty (30) days written
notice.

INTELLECTUAL PROPERTY
---------------------
All work product created by the Service Provider under this Agreement shall
be owned as agreed in writing. In the absence of a separate IP agreement,
work-for-hire provisions of applicable law apply.

LIMITATION OF LIABILITY
-----------------------
Neither party shall be liable for indirect, incidental, or consequential damages.

GOVERNING LAW
-------------
This Agreement shall be governed by applicable law.

SIGNATURES
----------
Service Provider: $party_name       Date: ____________
Client:           _______________    Date: ____________
"""
)

_DEMAND_LETTER_TEMPLATE = Template(
    """DEMAND LETTER (DRAFT)

Date: $date

FROM: $party_name
TO:   [Recipient Name and Address]

RE: Formal Demand

Dear [Recipient],

$details

DEMAND
------
We hereby formally demand that you remedy the above matter within fifteen (15)
calendar days of receipt of this letter. If you fail to do so, we reserve all
rights and remedies available to us under applicable law, including but not
limited to commencing legal proceedings without further notice.

Please govern yourself accordingly.

Sincerely,

$party_name
_______________
[Signature]
[Title / Capacity]
[Contact Information]
"""
)

_TEMPLATE_METADATA: dict[DocumentType, dict[str, str]] = {
    DocumentType.nda: {
        "title": "Non-Disclosure Agreement (NDA)",
        "description": "Standard mutual/unilateral confidentiality agreement protecting proprietary information.",
    },
    DocumentType.service_agreement: {
        "title": "Service Agreement",
        "description": "General service contract defining services, scope, payment terms, and obligations.",
    },
    DocumentType.demand_letter: {
        "title": "Demand Letter",
        "description": "Formal pre-litigation demand letter requesting action or payment within a notice period.",
    },
}

_TEMPLATES: dict[DocumentType, tuple[str, Template]] = {
    DocumentType.nda: (_TEMPLATE_METADATA[DocumentType.nda]["title"], _NDA_TEMPLATE),
    DocumentType.service_agreement: (_TEMPLATE_METADATA[DocumentType.service_agreement]["title"], _SERVICE_AGREEMENT_TEMPLATE),
    DocumentType.demand_letter: (_TEMPLATE_METADATA[DocumentType.demand_letter]["title"], _DEMAND_LETTER_TEMPLATE),
}


def list_available_templates() -> list[dict[str, str]]:
    """
    Returns metadata list for all supported document templates.
    """
    return [
        {
            "document_type": dt.value,
            "title": meta["title"],
            "description": meta["description"],
        }
        for dt, meta in _TEMPLATE_METADATA.items()
    ]


def generate_document(
    document_type: DocumentType,
    party_name: str,
    details: str,
) -> tuple[str, str]:
    """
    Returns (title, content) for the given document type.
    Raises KeyError if document_type is unknown (should not happen due to enum validation).
    """
    title, tmpl = _TEMPLATES[document_type]
    content = tmpl.substitute(
        date=date.today().strftime("%B %d, %Y"),
        party_name=party_name,
        details=details,
    )
    return title, content

