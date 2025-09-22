# app/schemas.py
from pydantic import BaseModel
from typing import List, Optional

class SessionOut(BaseModel):
    id: int
    title: str
    created_at: str

    class Config:
        orm_mode = True


class CaptureOut(BaseModel):
    id: int
    session_id: int
    timestamp: str
    mode: str
    latency_sec: float
    caption: str                            
    objects: Optional[List[dict]] = None
    image_url: str
    audio_url: Optional[str] = None

    class Config:
        orm_mode = True
