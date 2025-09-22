# import os
# import time
# from typing import Tuple
# from .config import IMAGES_DIR, BASE_URL

# def save_image(file_bytes: bytes, ext: str = ".jpg") -> str:
#     ts = int(time.time() * 1000)
#     filename = f"capture_{ts}{ext}"
#     abs_path = os.path.join(IMAGES_DIR, filename)
#     with open(abs_path, "wb") as f:
#         f.write(file_bytes)
#     return abs_path

# def to_url(abs_path: str) -> str:
#     # Convert absolute path under /static to URL
#     # e.g. /.../static/images/file.jpg -> http://127.0.0.1:8000/static/images/file.jpg
#     parts = abs_path.replace("\\", "/").split("/static/")
#     return f"{BASE_URL}/static/{parts[1]}" if len(parts) > 1 else abs_path

# app/storage.py
import os
import time
from fastapi import UploadFile

# Absolute path to the images directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "images")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_image(file: UploadFile):
    # Always generate a unique filename with timestamp
    filename = f"{int(time.time())}_{file.filename}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:
        f.write(file.file.read())

    # Return both the full path and the filename for URL building
    return path, filename
