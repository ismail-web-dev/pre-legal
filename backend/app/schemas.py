"""
Pydantic schemas for document generation.
"""
from __future__ import annotations

from enum import Enum
from pydantic import BaseModel, Field, model_validator


class DocumentType(str, Enum):
    nda = "nda"
    service_agreement = "service_agreement"
    demand_letter = "demand_letter"


class GenerateRequest(BaseModel):
    document_type: DocumentType = Field(
        ..., description="One of: nda, service_agreement, demand_letter"
    )

    # Legacy / generic fallbacks
    party_name: str | None = None
    details: str | None = None

    # Shared / optional fields
    date: str | None = None
    governing_law: str | None = None

    # Demand Letter fields
    sender_name: str | None = None
    sender_address: str | None = None
    sender_contact: str | None = None
    recipient_name: str | None = None
    recipient_address: str | None = None
    subject: str | None = None
    facts: str | None = None
    demand: str | None = None
    deadline: str | None = None
    sender_title: str | None = None
    signature_name: str | None = None

    # NDA fields
    disclosing_party_name: str | None = None
    disclosing_party_address: str | None = None
    receiving_party_name: str | None = None
    receiving_party_address: str | None = None
    purpose: str | None = None
    confidential_info_desc: str | None = None
    confidentiality_period: str | None = None

    # Service Agreement fields
    service_provider_name: str | None = None
    service_provider_address: str | None = None
    client_name: str | None = None
    client_address: str | None = None
    services_description: str | None = None
    payment_terms: str | None = None
    start_date: str | None = None
    duration: str | None = None
    termination_notice: str | None = None
    additional_terms: str | None = None

    @model_validator(mode="after")
    def validate_required_fields(self) -> GenerateRequest:
        if self.document_type == DocumentType.demand_letter:
            sender = (self.sender_name or self.party_name or "").strip()
            recipient = (self.recipient_name or "").strip()
            demand_text = (self.demand or self.details or "").strip()
            if not sender:
                raise ValueError("Sender Name is required.")
            if not recipient:
                raise ValueError("Recipient Name is required.")
            if not demand_text:
                raise ValueError("Demand details are required.")

        elif self.document_type == DocumentType.nda:
            disclosing = (self.disclosing_party_name or self.party_name or "").strip()
            receiving = (self.receiving_party_name or "").strip()
            if not disclosing:
                raise ValueError("Disclosing Party Name is required.")
            if not receiving:
                raise ValueError("Receiving Party Name is required.")

        elif self.document_type == DocumentType.service_agreement:
            provider = (self.service_provider_name or self.party_name or "").strip()
            client = (self.client_name or "").strip()
            services = (self.services_description or self.details or "").strip()
            if not provider:
                raise ValueError("Service Provider Name is required.")
            if not client:
                raise ValueError("Client Name is required.")
            if not services:
                raise ValueError("Services Description is required.")

        return self


class GenerateResponse(BaseModel):
    document_type: DocumentType
    title: str = Field(..., description="Document display title")
    content: str
    disclaimer: str


class TemplateInfo(BaseModel):
    document_type: DocumentType
    title: str
    description: str
