# Navi Lens – AI Scene Narrator for the Visually Impaired  

Final Year Project for CM3070, University of London.  

## Features
- Backend API with FastAPI + SQLite  
- Image captioning with BLIP (HuggingFace)  
- Object detection with YOLOv8 (Ultralytics)  
- React Native (Expo) mobile frontend with camera, session history, and feedback  

## Repository Structure
NaviLens_API/
├── app/
│ ├── main.py # FastAPI backend routes
│ ├── detector.py # YOLOv8 object detection
│ ├── captioner.py # BLIP caption generation
│ ├── cleaner.py # Caption post-processing
│ ├── storage.py # Save images
│ ├── database.py # SQLite schema
│ └── ...
├── static/
│ ├── images/ # Saved uploads
│ └── audio/ # Optional audio files
├── requirements.txt
└── README.md

FYP/ (frontend Expo app)
├── app/
│ ├── (tabs)/ # Capture, History, Profile tabs
│ ├── index.tsx # Capture screen
│ ├── history.tsx # History screen
│ └── login.tsx # Login screen
├── package.json
├── App.tsx
└── README.md

---

## Setup Instructions  

### Backend (FastAPI)  
1. Clone repo:  
   ```bash
   git clone https://github.com/CHINLIHONG/navilens-fyp.git
   cd navilens-fyp/NaviLens_API

## Install dependency
pip install -r requirements.txt

## Run API
uvicorn app.main:app --reload

## Frontend (Expo React Native)

Install dependencies: cd Apps
npm install
npx expo start

## Models

YOLOv8 weights (yolov8n.pt) → Download here

BLIP captioning → HuggingFace auto-download (Salesforce/blip-image-captioning-base)
