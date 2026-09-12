"""
Pydantic schemas for document generation.
"""
from __future__ import annotations

from enum import Enum
from typing import Annotated

from pydantic import BaseModel, Field, field_validator


class DocumentType(str, Enum):
    nda = "nda"
    service_agreement = "service_agreement"
    demand_letter = "demand_letter"


class GenerateRequest(BaseModel):
    document_type: DocumentType = Field(
        ..., description="One of: nda, service_agreement, demand_letter"
    )
    party_name: Annotated[str, Field(min_length=1, max_length=200)] = Field(
        ..., description="Primary party / company name"
    )
    details: Annotated[str, Field(min_length=10, max_length=4000)] = Field(
        ..., description="Key details, context, or clauses"
    )

    @field_validator("party_name", "details", mode="before")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()


class GenerateResponse(BaseModel):
    document_type: DocumentType
    title: str = Field(..., description="Document display title")
    content: str
    disclaimer: str


class TemplateInfo(BaseModel):
    document_type: DocumentType
    title: str
    description: str

