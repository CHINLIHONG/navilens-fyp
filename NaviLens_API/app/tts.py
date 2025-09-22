from gtts import gTTS
import time
import os
from .config import AUDIO_DIR

def synthesize_to_mp3(text: str) -> str:
    """
    Saves TTS to an MP3 file and returns the absolute path.
    """
    ts = int(time.time() * 1000)
    mp3_path = os.path.join(AUDIO_DIR, f"caption_{ts}.mp3")
    tts = gTTS(text=text, lang="en")
    tts.save(mp3_path)
    return mp3_path
