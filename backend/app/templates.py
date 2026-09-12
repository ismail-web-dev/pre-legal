"""
Static document templates for MVP.
"""
from __future__ import annotations

from datetime import date
from app.schemas import DocumentType, GenerateRequest

DISCLAIMER = (
    "DISCLAIMER: This document is a draft generated from a pre-defined template "
    "for general informational purposes only. It does NOT constitute legal advice "
    "and is NOT a substitute for advice from a qualified legal professional. "
    "You should have this document reviewed by a lawyer before use. The authors "
    "make no representation that this document is legally valid in any jurisdiction."
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


def _generate_demand_letter(req: GenerateRequest) -> str:
    doc_date = req.date.strip() if req.date and req.date.strip() else date.today().strftime("%B %d, %Y")
    sender = (req.sender_name or req.party_name or "").strip()
    recipient = (req.recipient_name or "").strip()
    demand_text = (req.demand or req.details or "").strip()
    
    deadline_val = req.deadline.strip() if req.deadline and req.deadline.strip() else "15"
    if not deadline_val.lower().endswith("days") and not deadline_val.lower().endswith("day"):
        deadline_str = f"{deadline_val} calendar days"
    else:
        deadline_str = deadline_val

    from_parts = [sender]
    if req.sender_address and req.sender_address.strip():
        from_parts.append(req.sender_address.strip())
    if req.sender_contact and req.sender_contact.strip():
        from_parts.append(req.sender_contact.strip())
    from_block = "FROM:\n" + "\n".join(from_parts)

    to_parts = [recipient]
    if req.recipient_address and req.recipient_address.strip():
        to_parts.append(req.recipient_address.strip())
    to_block = "TO:\n" + "\n".join(to_parts)

    re_block = f"RE:\n{req.subject.strip()}\n\n" if req.subject and req.subject.strip() else ""

    facts_block = f"\n{req.facts.strip()}\n" if req.facts and req.facts.strip() else ""

    sig_name = (req.signature_name or sender).strip()
    sig_parts = [sig_name]
    if req.sender_title and req.sender_title.strip():
        sig_parts.append(req.sender_title.strip())
    if req.sender_contact and req.sender_contact.strip():
        if req.sender_contact.strip() != req.sender_title.strip():
            sig_parts.append(req.sender_contact.strip())
    sig_block = "\n".join(sig_parts)

    return f"""DEMAND LETTER (DRAFT)

Date: {doc_date}

{from_block}

{to_block}

{re_block}Dear {recipient},
{facts_block}
DEMAND
------
{demand_text}

We hereby formally demand that you remedy the above matter within {deadline_str} of receipt of this letter. If you fail to do so, we reserve all rights and remedies available to us under applicable law, including but not limited to commencing legal proceedings without further notice.

Please govern yourself accordingly.

Sincerely,

{sig_block}
"""


def _generate_nda(req: GenerateRequest) -> str:
    doc_date = req.date.strip() if req.date and req.date.strip() else date.today().strftime("%B %d, %Y")
    disclosing = (req.disclosing_party_name or req.party_name or "").strip()
    receiving = (req.receiving_party_name or "").strip()

    disclosing_addr = f", located at {req.disclosing_party_address.strip()}" if req.disclosing_party_address and req.disclosing_party_address.strip() else ""
    receiving_addr = f", located at {req.receiving_party_address.strip()}" if req.receiving_party_address and req.receiving_party_address.strip() else ""

    purpose_text = (req.purpose or req.details or "").strip()
    purpose_block = f"\nBACKGROUND & PURPOSE\n--------------------\n{purpose_text}\n" if purpose_text else ""

    conf_desc = f"\nSpecifically, Confidential Information includes:\n{req.confidential_info_desc.strip()}\n" if req.confidential_info_desc and req.confidential_info_desc.strip() else ""

    period = req.confidentiality_period.strip() if req.confidentiality_period and req.confidentiality_period.strip() else "two (2) years"
    gov_law = req.governing_law.strip() if req.governing_law and req.governing_law.strip() else "applicable law"

    return f"""NON-DISCLOSURE AGREEMENT (DRAFT)

Date: {doc_date}

PARTIES
-------
This Non-Disclosure Agreement ("Agreement") is entered into as of {doc_date} by and between {disclosing}{disclosing_addr} ("Disclosing Party") and {receiving}{receiving_addr} ("Receiving Party").
{purpose_block}
CONFIDENTIAL INFORMATION
-------------------------
"Confidential Information" means any non-public information disclosed by the Disclosing Party to the Receiving Party, whether orally, in writing, or by any other means.{conf_desc}
OBLIGATIONS
-----------
The Receiving Party agrees to:
  1. Hold all Confidential Information in strict confidence.
  2. Not disclose Confidential Information to any third party without prior written consent of the Disclosing Party.
  3. Use Confidential Information solely for the purpose of evaluating or engaging in a potential business relationship.

TERM
----
This Agreement shall remain in effect for a period of {period} from the date first written above, unless terminated earlier by written agreement of both parties.

GOVERNING LAW
-------------
This Agreement shall be governed by {gov_law}. Any disputes shall be resolved in a court of competent jurisdiction.

SIGNATURES
----------
Disclosing Party: {disclosing}     Date: ____________
Receiving Party:  {receiving}      Date: ____________
"""


def _generate_service_agreement(req: GenerateRequest) -> str:
    doc_date = req.date.strip() if req.date and req.date.strip() else date.today().strftime("%B %d, %Y")
    provider = (req.service_provider_name or req.party_name or "").strip()
    client = (req.client_name or "").strip()
    services = (req.services_description or req.details or "").strip()

    provider_addr = f", located at {req.service_provider_address.strip()}" if req.service_provider_address and req.service_provider_address.strip() else ""
    client_addr = f", located at {req.client_address.strip()}" if req.client_address and req.client_address.strip() else ""

    payment = req.payment_terms.strip() if req.payment_terms and req.payment_terms.strip() else "Compensation, payment schedule, and method shall be as mutually agreed in writing by the parties prior to commencement of services."
    start = req.start_date.strip() if req.start_date and req.start_date.strip() else doc_date
    duration = req.duration.strip() if req.duration and req.duration.strip() else "until the services are completed or the Agreement is terminated"
    termination = req.termination_notice.strip() if req.termination_notice and req.termination_notice.strip() else "thirty (30) days"
    gov_law = req.governing_law.strip() if req.governing_law and req.governing_law.strip() else "applicable law"

    add_terms_block = f"\nADDITIONAL TERMS\n----------------\n{req.additional_terms.strip()}\n" if req.additional_terms and req.additional_terms.strip() else ""

    return f"""SERVICE AGREEMENT (DRAFT)

Date: {doc_date}

PARTIES
-------
This Service Agreement ("Agreement") is entered into as of {doc_date} by and between {provider}{provider_addr} ("Service Provider") and {client}{client_addr} ("Client").

SCOPE OF SERVICES
-----------------
{services}

PAYMENT & COMPENSATION
----------------------
{payment}

TERM & TERMINATION
------------------
This Agreement begins on {start} and continues {duration}. Either party may terminate this Agreement by providing {termination} written notice to the other party.

INTELLECTUAL PROPERTY
---------------------
All work product created by the Service Provider under this Agreement shall be owned as agreed in writing. In the absence of a separate IP agreement, work-for-hire provisions of applicable law apply.

LIMITATION OF LIABILITY
-----------------------
Neither party shall be liable for indirect, incidental, or consequential damages.
{add_terms_block}
GOVERNING LAW
-------------
This Agreement shall be governed by {gov_law}. Any disputes shall be resolved in a court of competent jurisdiction.

SIGNATURES
----------
Service Provider: {provider}       Date: ____________
Client:           {client}         Date: ____________
"""


def generate_document(request: GenerateRequest) -> tuple[str, str]:
    """
    Returns (title, content) for the given document request.
    """
    if request.document_type not in _TEMPLATE_METADATA:
        raise KeyError(f"Unsupported document type: {request.document_type}")
        
    title = _TEMPLATE_METADATA[request.document_type]["title"]
    if request.document_type == DocumentType.demand_letter:
        content = _generate_demand_letter(request)
    elif request.document_type == DocumentType.nda:
        content = _generate_nda(request)
    elif request.document_type == DocumentType.service_agreement:
        content = _generate_service_agreement(request)
    else:
        raise KeyError(f"Unsupported document type: {request.document_type}")

    return title, content
