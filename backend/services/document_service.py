import io
import os
import logging
from typing import Tuple
from pypdf import PdfReader
from docx import Document

logger = logging.getLogger("document_service")
logging.basicConfig(level=logging.INFO)

MAX_CHARACTER_BUDGET = 8000
MIN_READABLE_CHARACTERS = 40

class EmptyDocumentError(ValueError):
    """Raised when extracted text from a document is empty or below readable threshold."""
    pass

class UnsupportedDocumentError(ValueError):
    """Raised when file extension is not supported for text extraction."""
    pass

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts text page-by-page from PDF bytes using pypdf.
    """
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        pages_text = []
        for idx, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                pages_text.append(text.strip())
        return "\n\n".join(pages_text).strip()
    except Exception as e:
        logger.error(f"Error parsing PDF: {e}")
        raise ValueError(f"Failed to parse PDF document: {str(e)}")

def extract_text_from_docx(file_bytes: bytes) -> str:
    """
    Extracts paragraph and table text from DOCX bytes using python-docx.
    """
    try:
        doc = Document(io.BytesIO(file_bytes))
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        
        # Also extract table text if present
        for table in doc.tables:
            for row in table.rows:
                row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_text:
                    paragraphs.append(" | ".join(row_text))
                    
        return "\n\n".join(paragraphs).strip()
    except Exception as e:
        logger.error(f"Error parsing DOCX: {e}")
        raise ValueError(f"Failed to parse DOCX document: {str(e)}")

def extract_text(filename: str, file_bytes: bytes, max_chars: int = MAX_CHARACTER_BUDGET) -> Tuple[str, bool]:
    """
    Dispatches extraction by filename extension.
    Returns: (extracted_text, is_truncated)
    Raises UnsupportedDocumentError on unsupported extensions.
    Raises EmptyDocumentError if extracted content is empty or unreadable.
    """
    if not file_bytes:
        raise EmptyDocumentError("The uploaded file is empty (0 bytes).")

    ext = os.path.splitext(filename)[1].lower()
    raw_text = ""

    if ext == ".pdf":
        raw_text = extract_text_from_pdf(file_bytes)
    elif ext in [".docx", ".doc"]:
        if ext == ".doc":
            # Best effort with docx, or raise explicit message
            try:
                raw_text = extract_text_from_docx(file_bytes)
            except Exception:
                raise UnsupportedDocumentError("Legacy .doc format is not supported. Please convert to modern .docx or .pdf.")
        else:
            raw_text = extract_text_from_docx(file_bytes)
    elif ext in [".txt", ".md"]:
        try:
            raw_text = file_bytes.decode("utf-8", errors="replace").strip()
        except Exception as e:
            raise ValueError(f"Failed to read text file: {str(e)}")
    else:
        raise UnsupportedDocumentError(
            f"Unsupported file format '{ext}'. Only .pdf, .docx, and .txt files are supported."
        )

    # Clean text
    clean_text = raw_text.strip()

    # Guard against scanned PDFs or empty text
    if len(clean_text) < MIN_READABLE_CHARACTERS:
        raise EmptyDocumentError(
            "Could not extract readable text from this document. If this is a scanned PDF or image-only document, please provide a text-based document."
        )

    is_truncated = False
    if len(clean_text) > max_chars:
        logger.warning(
            f"Document '{filename}' text length ({len(clean_text)} chars) exceeded budget ({max_chars} chars). Truncating."
        )
        clean_text = clean_text[:max_chars].rsplit(" ", 1)[0] + "\n\n[...Content truncated for quiz generation...]"
        is_truncated = True

    return clean_text, is_truncated
