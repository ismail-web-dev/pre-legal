"""
Document generation routes (PL-4) + export route (PL-6).
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse

from app.schemas import DocumentType, GenerateRequest, GenerateResponse, TemplateInfo
from app.templates import DISCLAIMER, generate_document, list_available_templates

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("/templates", response_model=list[TemplateInfo])
def get_templates() -> list[dict[str, str]]:
    """
    Return all supported pre-legal document templates and their descriptions.
    """
    return list_available_templates()


@router.post("/generate", response_model=GenerateResponse)
def generate(request: GenerateRequest) -> GenerateResponse:
    """
    Accept validated form data and return the generated document draft.
    """
    try:
        title, content = generate_document(request)
    except KeyError:
        raise HTTPException(status_code=400, detail="Unsupported document type.")

    return GenerateResponse(
        document_type=request.document_type,
        title=title,
        content=content,
        disclaimer=DISCLAIMER,
    )


@router.post("/export")
def export_document(request: GenerateRequest) -> PlainTextResponse:
    """
    Generate and return the document as a downloadable plain-text file.
    The client should POST the same payload used for /generate.
    """
    try:
        title, content = generate_document(request)
    except KeyError:
        raise HTTPException(status_code=400, detail="Unsupported document type.")

    filename = f"{request.document_type.value}_draft.txt"
    full_text = f"{DISCLAIMER}\n\n{'='*70}\n\n{content}"

    return PlainTextResponse(
        content=full_text,
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
