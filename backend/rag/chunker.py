import os
import re
from dataclasses import dataclass
from typing import List, Dict, Any

DEFAULT_CHUNK_SIZE_TOKENS = int(os.getenv("CHUNK_SIZE", "700"))
DEFAULT_CHUNK_OVERLAP_TOKENS = int(os.getenv("CHUNK_OVERLAP", "100"))

# Approximation: 1 token ~ 4 characters
CHARS_PER_TOKEN = 4

@dataclass
class DocumentChunk:
    id: str
    document_id: str
    source: str
    chunk_index: int
    text: str
    token_count: int
    metadata: Dict[str, Any]

def estimate_tokens(text: str) -> int:
    return max(1, len(text) // CHARS_PER_TOKEN)

def chunk_document(
    text: str,
    document_id: str,
    source: str,
    chunk_size_tokens: int = DEFAULT_CHUNK_SIZE_TOKENS,
    chunk_overlap_tokens: int = DEFAULT_CHUNK_OVERLAP_TOKENS,
    extra_metadata: Dict[str, Any] = None
) -> List[DocumentChunk]:
    """
    Splits document text into semantic-friendly overlapping chunks.
    Preserves paragraph and sentence boundaries wherever feasible.
    """
    if not text or not text.strip():
        return []

    target_chars = chunk_size_tokens * CHARS_PER_TOKEN
    overlap_chars = chunk_overlap_tokens * CHARS_PER_TOKEN
    step_chars = max(100, target_chars - overlap_chars)

    # Split into logical paragraphs first
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

    chunks: List[DocumentChunk] = []
    current_chunk_parts: List[str] = []
    current_length = 0
    chunk_idx = 0

    def finalize_chunk(parts: List[str]) -> DocumentChunk:
        nonlocal chunk_idx
        chunk_text = "\n\n".join(parts).strip()
        c = DocumentChunk(
            id=f"{document_id}_chunk_{chunk_idx}",
            document_id=document_id,
            source=source,
            chunk_index=chunk_idx,
            text=chunk_text,
            token_count=estimate_tokens(chunk_text),
            metadata={
                "document_id": document_id,
                "source": source,
                "chunk_index": chunk_idx,
                **(extra_metadata or {})
            }
        )
        chunk_idx += 1
        return c

    for para in paragraphs:
        para_len = len(para)
        # If single paragraph exceeds target, split by sentences
        if para_len > target_chars:
            sentences = re.split(r'(?<=[.!?])\s+', para)
            for sentence in sentences:
                sent_len = len(sentence)
                if current_length + sent_len > target_chars and current_chunk_parts:
                    chunks.append(finalize_chunk(current_chunk_parts))
                    # Retain last part for overlap
                    overlap_parts = []
                    acc = 0
                    for p in reversed(current_chunk_parts):
                        if acc + len(p) <= overlap_chars:
                            overlap_parts.insert(0, p)
                            acc += len(p)
                        else:
                            break
                    current_chunk_parts = overlap_parts
                    current_length = acc

                current_chunk_parts.append(sentence)
                current_length += sent_len
        else:
            if current_length + para_len > target_chars and current_chunk_parts:
                chunks.append(finalize_chunk(current_chunk_parts))
                # Retain overlap
                overlap_parts = []
                acc = 0
                for p in reversed(current_chunk_parts):
                    if acc + len(p) <= overlap_chars:
                        overlap_parts.insert(0, p)
                        acc += len(p)
                    else:
                        break
                current_chunk_parts = overlap_parts
                current_length = acc

            current_chunk_parts.append(para)
            current_length += para_len

    if current_chunk_parts:
        chunks.append(finalize_chunk(current_chunk_parts))

    return chunks
