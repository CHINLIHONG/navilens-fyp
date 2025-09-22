# from sqlalchemy import create_engine
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker
# from .config import DATABASE_URL

# engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# Base = declarative_base()

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# app/database.py
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Text, Float, DateTime
from sqlalchemy.orm import sessionmaker, relationship, declarative_base
from datetime import datetime

DATABASE_URL = "sqlite:///./navilens.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    language = Column(String, default="en")
    tts_rate = Column(Integer, default=150)

    sessions = relationship("Session", back_populates="user")


class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="sessions")
    captures = relationship("Capture", back_populates="session")


class Capture(Base):
    __tablename__ = "captures"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    mode = Column(String)
    latency_sec = Column(Float)
    caption = Column(Text)
    enriched_caption = Column(Text, nullable=True)
    image_url = Column(String)
    audio_url = Column(String, nullable=True)

    session = relationship("Session", back_populates="captures")
    errors = relationship("ErrorLog", back_populates="capture")


class ErrorLog(Base):
    __tablename__ = "errors"
    id = Column(Integer, primary_key=True, index=True)
    capture_id = Column(Integer, ForeignKey("captures.id"))
    error_type = Column(String)   # e.g., gibberish, wrong object, not useful
    notes = Column(Text, nullable=True)

    capture = relationship("Capture", back_populates="errors")


def init_db():
    Base.metadata.create_all(bind=engine)

