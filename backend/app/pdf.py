"""
PDF Generation module using ReportLab for legal document drafts.
"""
from __future__ import annotations

import io
import re
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to compute total page count dynamically
    and draw professional running headers and footers ("Page X of Y").
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count: int):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        width, height = letter
        margin = 54  # 0.75 in

        # Header (pages 2+)
        if self._pageNumber > 1:
            self.drawString(margin, height - 36, "PRE-LEGAL DOCUMENT DRAFT")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(margin, height - 42, width - margin, height - 42)

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(margin, 46, width - margin, 46)

        footer_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(width - margin, 32, footer_text)
        self.drawString(
            margin,
            32,
            "CONFIDENTIAL DRAFT - FOR REVIEW ONLY - NOT LEGAL ADVICE",
        )
        self.restoreState()


def generate_pdf_bytes(title: str, content: str, disclaimer: str) -> bytes:
    """
    Renders legal document content and disclaimer into a clean, professional PDF byte array.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Define custom legal typography styles
    title_style = ParagraphStyle(
        "LegalTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0F172A"),
        alignment=1,  # Centered
        spaceAfter=14,
    )

    h2_style = ParagraphStyle(
        "LegalSectionHeader",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#1E293B"),
        spaceBefore=12,
        spaceAfter=4,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "LegalBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#334155"),
        spaceAfter=6,
    )

    bold_body_style = ParagraphStyle(
        "LegalBoldBody",
        parent=body_style,
        fontName="Helvetica-Bold",
    )

    disclaimer_header_style = ParagraphStyle(
        "DisclaimerHeader",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#92400E"),  # Amber 800
        spaceAfter=3,
    )

    disclaimer_body_style = ParagraphStyle(
        "DisclaimerBody",
        fontName="Helvetica",
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor("#78350F"),  # Amber 900
    )

    story = []

    # Title Banner
    story.append(Paragraph(title.upper(), title_style))
    story.append(
        HRFlowable(
            width="100%",
            thickness=1.5,
            color=colors.HexColor("#0F172A"),
            spaceBefore=0,
            spaceAfter=14,
        )
    )

    # Clean up and split text into logical sections
    raw_text = content.replace("\r\n", "\n").strip()

    # Strip top document title if present in raw text to avoid duplicate headers
    first_line = raw_text.split("\n", 1)[0]
    if "(DRAFT)" in first_line or first_line.upper() == title.upper():
        raw_text = raw_text.split("\n", 1)[1].lstrip()

    # Split lines and process headings & paragraphs
    lines = raw_text.split("\n")
    i = 0
    num_lines = len(lines)

    while i < num_lines:
        line = lines[i].rstrip()

        # Check if next line is a divider like "------" or "======"
        if i + 1 < num_lines and re.match(r"^[-=]{3,}$", lines[i + 1].strip()):
            header_text = line.strip()
            if header_text:
                story.append(Paragraph(header_text, h2_style))
            i += 2
            continue

        if not line:
            story.append(Spacer(1, 4))
            i += 1
            continue

        # Check for Key-Value prefixes like "Date:", "PARTIES", "SIGNATURES"
        if re.match(r"^(Date|FROM|TO|RE|Disclosing Party|Receiving Party|Service Provider|Client):", line, re.I):
            story.append(Paragraph(escape_xml(line), bold_body_style))
        elif line.startswith("  ") or line.startswith("\t"):
            # Indented lists or numbered items
            indent_style = ParagraphStyle(
                "IndentBody",
                parent=body_style,
                leftIndent=14,
            )
            story.append(Paragraph(escape_xml(line.strip()), indent_style))
        else:
            story.append(Paragraph(escape_xml(line), body_style))

        i += 1

    # Boxed Disclaimer Section
    if disclaimer:
        story.append(Spacer(1, 14))
        disclaimer_flowables = [
            Paragraph("LEGAL DISCLAIMER & NOTICE", disclaimer_header_style),
            Paragraph(escape_xml(disclaimer), disclaimer_body_style),
        ]

        disclaimer_table = Table(
            [[disclaimer_flowables]],
            colWidths=[letter[0] - 108],
        )
        disclaimer_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFFBEB")),
                    ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#FCD34D")),
                    ("PADDING", (0, 0), (-1, -1), 10),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ]
            )
        )
        story.append(KeepTogether(disclaimer_table))

    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer.getvalue()


def escape_xml(text: str) -> str:
    """
    Escapes special HTML/XML characters for safe insertion into ReportLab Paragraphs.
    """
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )
