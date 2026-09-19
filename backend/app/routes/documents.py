"""
Document generation routes (PL-4) + export route (PL-6).
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import PlainTextResponse

from app.pdf import generate_pdf_bytes
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


@router.post("/generate-pdf")
@router.post("/pdf")
def generate_pdf(request: GenerateRequest) -> Response:
    """
    Generate and return a professional PDF document draft.
    """
    try:
        title, content = generate_document(request)
    except KeyError:
        raise HTTPException(status_code=400, detail="Unsupported document type.")

    try:
        pdf_bytes = generate_pdf_bytes(title=title, content=content, disclaimer=DISCLAIMER)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate PDF document.") from e

    filename = f"{request.document_type.value}_draft.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )


@router.post("/export")
def export_document(
    request: GenerateRequest, format: str = Query("txt", description="Export format: 'txt' or 'pdf'")
) -> Response:
    """
    Generate and return the document as a downloadable file (text or PDF).
    The client should POST the same payload used for /generate.
    """
    try:
        title, content = generate_document(request)
    except KeyError:
        raise HTTPException(status_code=400, detail="Unsupported document type.")

    if format.lower() == "pdf":
        try:
            pdf_bytes = generate_pdf_bytes(title=title, content=content, disclaimer=DISCLAIMER)
        except Exception as e:
            raise HTTPException(status_code=500, detail="Failed to generate PDF document.") from e

        filename = f"{request.document_type.value}_draft.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    filename = f"{request.document_type.value}_draft.txt"
    full_text = f"{DISCLAIMER}\n\n{'='*70}\n\n{content}"

    return PlainTextResponse(
        content=full_text,
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

