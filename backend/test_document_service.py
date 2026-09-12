import io
import os
import pytest
from pypdf import PdfWriter
from docx import Document

from backend.services.document_service import (
    extract_text_from_pdf,
    extract_text_from_docx,
    extract_text,
    EmptyDocumentError,
    UnsupportedDocumentError
)

def create_sample_pdf(text: str) -> bytes:
    """Helper to create a simple PDF in memory using reportlab or pypdf with annotations."""
    # Since reportlab might not be installed, create a valid minimal PDF with text
    # Or use pypdf if it can write text, or create raw PDF bytes
    # A minimal valid PDF with a text stream:
    content = text.encode("latin-1", "replace")
    stream = f"BT /F1 12 Tf 72 712 Td ({text}) Tj ET".encode("latin-1", "replace")
    pdf_template = (
        b"%PDF-1.4\n"
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
        b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n"
        b"4 0 obj << /Length " + str(len(stream)).encode() + b" >> stream\n"
        + stream + b"\nendstream\nendobj\n"
        b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
        b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000330 00000 n \n"
        b"trailer << /Size 6 /Root 1 0 R >>\nstartxref\n410\n%%EOF"
    )
    return pdf_template

def create_sample_docx(text: str) -> bytes:
    doc = Document()
    doc.add_heading("Quantum Mechanics and Distributed Systems", 0)
    doc.add_paragraph(text)
    doc.add_paragraph("Secondary paragraph explaining consensus invariants and vector clocks.")
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()

def test_docx_extraction():
    sample_text = "Distributed transactions require two-phase commit or consensus protocols like Raft and Paxos to ensure atomicity across nodes."
    docx_bytes = create_sample_docx(sample_text)
    
    extracted, truncated = extract_text("lecture_notes.docx", docx_bytes)
    assert sample_text in extracted
    assert "Raft and Paxos" in extracted
    assert not truncated
    print("\n[CHECKPOINT 1 - TEST A] DOCX extraction PASSED! Extracted length:", len(extracted))

def test_pdf_extraction():
    sample_text = "Event-driven architecture decouples producers from consumers using message brokers."
    pdf_bytes = create_sample_pdf(sample_text)
    
    extracted, truncated = extract_text("architecture.pdf", pdf_bytes)
    assert "Event-driven architecture" in extracted
    assert not truncated
    print("[CHECKPOINT 1 - TEST B] PDF extraction PASSED! Extracted length:", len(extracted))

def test_empty_document_guard():
    empty_doc = Document()
    buf = io.BytesIO()
    doc_bytes = buf.getvalue()
    
    try:
        extract_text("empty.docx", doc_bytes)
        assert False, "Should have raised EmptyDocumentError"
    except EmptyDocumentError as e:
        print("[CHECKPOINT 1 - TEST C] Empty document guard PASSED! Error caught:", e)

def test_unsupported_format_guard():
    try:
        extract_text("image.png", b"fake image bytes")
        assert False, "Should have raised UnsupportedDocumentError"
    except UnsupportedDocumentError as e:
        print("[CHECKPOINT 1 - TEST D] Unsupported format guard PASSED! Error caught:", e)

def test_truncation():
    long_text = "Important concept sentence. " * 400  # ~11,000 characters
    docx_bytes = create_sample_docx(long_text)
    extracted, truncated = extract_text("long.docx", docx_bytes, max_chars=1000)
    assert truncated is True
    assert len(extracted) <= 1100
    print("[CHECKPOINT 1 - TEST E] Truncation budget guard PASSED! Truncated length:", len(extracted))

if __name__ == "__main__":
    test_docx_extraction()
    test_pdf_extraction()
    test_empty_document_guard()
    test_unsupported_format_guard()
    test_truncation()
    print("\nALL CHECKPOINT 1 TESTS PASSED SUCCESSFULLY!")
