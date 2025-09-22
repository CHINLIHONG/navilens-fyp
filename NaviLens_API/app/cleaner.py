# app/cleaner.py
import re

def clean_caption(text: str) -> str:
    """
    Cleans up BLIP caption by removing excessive word repetition and stutters.
    """
    words = text.split()
    cleaned = []
    for w in words:
        if len(cleaned) >= 2 and cleaned[-1] == w and cleaned[-2] == w:
            continue
        cleaned.append(w)

    out = " ".join(cleaned)
    out = re.sub(r"\b(\w+)(\s+\1){2,}\b", r"\1", out, flags=re.IGNORECASE)
    return out
