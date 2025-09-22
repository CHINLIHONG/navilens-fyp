# # app/main.py
# import os, json
# from datetime import datetime
# from fastapi import FastAPI, UploadFile, File, Form, Depends
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.staticfiles import StaticFiles
# from sqlalchemy.orm import Session

# from . import models, schemas, database
# from .captioner import generate_caption
# from .cleaner import clean_caption
# from .detector import detect_objects
# from .storage import save_image
# from .config import UPLOAD_DIR

# app = FastAPI(title="Navi Lens API")

# # Enable CORS for mobile app
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Serve static images
# app.mount(
#     "/static",
#     StaticFiles(directory=os.path.join(os.path.dirname(__file__), "..", "static")),
#     name="static",
# )

# # Create DB schema if not exists
# models.Base.metadata.create_all(bind=database.engine)


# # ---------------------------
# # Session Endpoints
# # ---------------------------
# @app.post("/api/sessions", response_model=schemas.SessionOut)
# def create_session(title: str = Form(...), db: Session = Depends(database.get_db)):
#     s = models.Session(title=title, created_at=datetime.utcnow().isoformat())
#     db.add(s)
#     db.commit()
#     db.refresh(s)
#     return s


# @app.get("/api/sessions", response_model=list[schemas.SessionOut])
# def list_sessions(db: Session = Depends(database.get_db)):
#     return db.query(models.Session).all()


# # ---------------------------
# # Capture Endpoint
# # ---------------------------
# @app.post("/api/capture", response_model=schemas.CaptureOut)
# async def upload_and_caption(
#     file: UploadFile = File(...),
#     mode: str = Form(...),
#     session_id: int = Form(...),
#     db: Session = Depends(database.get_db),
# ):
#     # Save uploaded image
#     img_path, filename = save_image(file)

#     # Step 1: BLIP caption
#     caption, latency = generate_caption(img_path)
#     caption = clean_caption(caption)

#     # Step 2: YOLO detection
#     objects, _ = detect_objects(img_path)

#     # Step 3: Merge into one caption sentence
#     if objects:
#         parts = []
#         for o in objects:
#             pos = f" on the {o['position']}" if "position" in o else ""
#             parts.append(f"{o['label']}{pos}")
#         obj_sentence = ", ".join(parts)
#         caption = f"{caption}. Detected: {obj_sentence}."

#     # Save capture record
#     db_capture = models.Capture(
#         session_id=session_id,
#         timestamp=datetime.utcnow().isoformat(),
#         mode=mode,
#         latency_sec=latency,
#         caption=caption,
#         objects=json.dumps(objects),
#         image_url=f"/static/images/{filename}",
#         audio_url=None,
#     )
#     db.add(db_capture)
#     db.commit()
#     db.refresh(db_capture)

#     # Return JSON with parsed objects
#     return {
#         **db_capture.__dict__,
#         "objects": json.loads(db_capture.objects) if db_capture.objects else [],
#     }


# @app.get("/api/captures", response_model=list[schemas.CaptureOut])
# def list_captures(session_id: int, db: Session = Depends(database.get_db)):
#     q = db.query(models.Capture).filter(models.Capture.session_id == session_id).all()
#     for cap in q:
#         cap.objects = json.loads(cap.objects) if cap.objects else []
#     return q

# app/main.py
import os, time
from fastapi import FastAPI, UploadFile, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session as DBSession
from .models import Base, User, Session as DBSessionModel, Capture, ErrorLog
from .storage import save_image
from .captioner import generate_caption
from .detector import detect_objects
from .cleaner import clean_caption

DATABASE_URL = "sqlite:///./navi_lens.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NaviLens API")

# Serve static files (images, etc.)
STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "static")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ------------------------
# USERS
# ------------------------
@app.post("/api/register")
def register_user(username: str = Form(...), password: str = Form(...), db: DBSession = Depends(get_db)):
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    user = User(username=username, password=password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "username": user.username}

@app.post("/api/login")
def login_user(username: str = Form(...), password: str = Form(...), db: DBSession = Depends(get_db)):
    user = db.query(User).filter(User.username == username, User.password == password).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {"id": user.id, "username": user.username}


# ------------------------
# SESSIONS
# ------------------------
@app.post("/api/sessions")
def create_session(title: str = Form(...), user_id: int = Form(...), db: DBSession = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    session = DBSessionModel(title=title, user_id=user.id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"id": session.id, "title": session.title, "user_id": session.user_id, "started_at": session.started_at}

@app.get("/api/sessions")
def list_sessions(user_id: int, db: DBSession = Depends(get_db)):
    sessions = db.query(DBSessionModel).filter(DBSessionModel.user_id == user_id).all()
    return [{"id": s.id, "title": s.title, "user_id": s.user_id, "started_at": s.started_at} for s in sessions]


# ------------------------
# CAPTURES
# ------------------------
@app.post("/api/capture")
def upload_and_caption(file: UploadFile, session_id: int = Form(...), mode: str = Form("manual"), db: DBSession = Depends(get_db)):
    session = db.query(DBSessionModel).filter(DBSessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    start_time = time.time()
    img_path, filename = save_image(file)

    # Generate base caption (string only)
    base_caption, _ = generate_caption(img_path)

    # YOLO detection (labels + positions only)
    objects = detect_objects(img_path)

    # Merge caption + objects into natural tone
    if objects:
        phrases = []
        for o in objects:
            if not isinstance(o, dict):
                continue
            label = o.get("label")
            position = o.get("position")

            if position:
                if position == "center":
                    phrases.append(f"a {label} in the center")
                else:
                    phrases.append(f"a {label} on the {position}")
            else:
                phrases.append(f"a {label}")

        if len(phrases) == 1:
            obj_sentence = phrases[0]
        elif len(phrases) == 2:
            obj_sentence = f"{phrases[0]} and {phrases[1]}"
        else:
            obj_sentence = ", ".join(phrases[:-1]) + f", and {phrases[-1]}"

        if base_caption.endswith("."):
            base_caption = base_caption[:-1]
        final_caption = f"{base_caption}, with {obj_sentence}."
    else:
        final_caption = base_caption

    final_caption = clean_caption(final_caption)
    latency = round(time.time() - start_time, 2)

    capture = Capture(
        session_id=session_id,
        mode=mode,
        latency_sec=latency,
        caption=final_caption,
        image_url=f"http://192.168.1.144:8000/static/images/{filename}",  # absolute URL
    )
    db.add(capture)
    db.commit()
    db.refresh(capture)

    return {
        "id": capture.id,
        "session_id": capture.session_id,
        "timestamp": capture.timestamp,
        "mode": capture.mode,
        "latency_sec": capture.latency_sec,
        "caption": capture.caption,
        "image_url": capture.image_url,
    }

@app.get("/api/captures")
def list_captures(session_id: int, db: DBSession = Depends(get_db)):
    captures = db.query(Capture).filter(Capture.session_id == session_id).all()
    return [{
        "id": c.id,
        "session_id": c.session_id,
        "timestamp": c.timestamp,
        "mode": c.mode,
        "latency_sec": c.latency_sec,
        "caption": c.caption,
        "image_url": c.image_url,
    } for c in captures]


# ------------------------
# ERRORS / FEEDBACK
# ------------------------
@app.post("/api/errors")
def log_error(capture_id: int = Form(...), error_type: str = Form(...), notes: str = Form(""), db: DBSession = Depends(get_db)):
    capture = db.query(Capture).filter(Capture.id == capture_id).first()
    if not capture:
        raise HTTPException(status_code=404, detail="Capture not found")
    error = ErrorLog(capture_id=capture_id, error_type=error_type, notes=notes)
    db.add(error)
    db.commit()
    db.refresh(error)
    return {"id": error.id, "capture_id": error.capture_id, "error_type": error.error_type, "notes": error.notes}

@app.get("/api/errors")
def list_errors(capture_id: int, db: DBSession = Depends(get_db)):
    errors = db.query(ErrorLog).filter(ErrorLog.capture_id == capture_id).all()
    return [{"id": e.id, "capture_id": e.capture_id, "error_type": e.error_type, "notes": e.notes, "created_at": e.created_at} for e in errors]
