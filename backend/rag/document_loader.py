import os
import io
import re
from dataclasses import dataclass
from typing import Optional, Dict, Any

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

try:
    import docx
except ImportError:
    docx = None

@dataclass
class DocumentContent:
    text: str
    filename: str
    file_type: str
    page_count: int
    char_count: int
    metadata: Dict[str, Any]

def _clean_text(text: str) -> str:
    """Normalize whitespace and remove non-printable characters."""
    if not text:
        return ""
    # Replace multiple newlines and spaces
    text = re.sub(r'\r\n|\r', '\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def extract_document_text(
    file_bytes: bytes,
    filename: str,
    content_type: Optional[str] = None
) -> DocumentContent:
    """
    Extracts text from PDF, DOCX, TXT, or pasted notes.
    Raises ValueError for unsupported formats or empty content.
    """
    if not file_bytes or len(file_bytes) == 0:
        raise ValueError("Uploaded document is empty.")

    MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB
    if len(file_bytes) > MAX_FILE_SIZE:
        raise ValueError(f"File size exceeds maximum limit of 25MB ({len(file_bytes) / 1024 / 1024:.1f}MB).")

    ext = os.path.splitext(filename.lower())[1]
    extracted_text = ""
    page_count = 1
    file_type = "txt"

    if ext == ".pdf" or (content_type and "pdf" in content_type.lower()):
        file_type = "pdf"
        if not PdfReader:
            raise RuntimeError("pypdf is not installed.")
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            page_count = len(reader.pages)
            pages_text = []
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    pages_text.append(f"--- Page {i + 1} ---\n" + page_text)
            extracted_text = "\n\n".join(pages_text)
        except Exception as e:
            raise ValueError(f"Failed to parse PDF document: {str(e)}")

    elif ext in [".docx", ".doc"] or (content_type and "word" in content_type.lower()):
        file_type = "docx"
        if not docx:
            raise RuntimeError("python-docx is not installed.")
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            for table in doc.tables:
                for row in table.rows:
                    row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                    if row_text:
                        paragraphs.append(row_text)
            extracted_text = "\n\n".join(paragraphs)
            page_count = max(1, len(paragraphs) // 10)
        except Exception as e:
            raise ValueError(f"Failed to parse Word (.docx) document: {str(e)}")

    elif ext in [".txt", ".md", ".csv", ".json", ""] or (content_type and "text" in content_type.lower()):
        file_type = "txt"
        # Try UTF-8 then fallback to Latin-1
        try:
            extracted_text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            extracted_text = file_bytes.decode("latin-1", errors="replace")
        page_count = 1

    else:
        raise ValueError(f"Unsupported file format '{ext}'. Supported formats are: PDF, DOCX, TXT.")

    clean_content = _clean_text(extracted_text)
    if not clean_content:
        raise ValueError("No readable text could be extracted from the document.")

    return DocumentContent(
        text=clean_content,
        filename=filename,
        file_type=file_type,
        page_count=page_count,
        char_count=len(clean_content),
        metadata={
            "filename": filename,
            "file_type": file_type,
            "page_count": page_count,
            "size_bytes": len(file_bytes),
        }
    )
