import os
import csv
import time
import cv2
import threading
import uuid
from gtts import gTTS
from playsound import playsound
from PIL import Image, ImageTk
import tkinter as tk
from tkinter import ttk
from transformers import BlipProcessor, BlipForConditionalGeneration

# Load models
processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

# Ensure log file exists
log_file = "evaluation_log.csv"
if not os.path.exists(log_file):
    with open(log_file, "w", newline='', encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Timestamp", "Caption", "Latency_sec", "Mode"])

# Create captures directory
capture_dir = "captures"
os.makedirs(capture_dir, exist_ok=True)

# Global state
capturing = False
mode = "manual"
cap = None
last_capture_time = 0
capture_interval = 10

def speak(text):
    def run():
        try:
            filename = f"speech_{uuid.uuid4().hex}.mp3"
            tts = gTTS(text=text, lang='en')
            tts.save(filename)
            playsound(filename)
            os.remove(filename)
        except Exception as e:
            print(f"[TTS Error]: {e}")
    threading.Thread(target=run).start()

def generate_caption(image_path):
    image = Image.open(image_path).convert('RGB')
    start = time.time()
    inputs = processor(images=image, return_tensors="pt")
    out = model.generate(**inputs)
    caption = processor.decode(out[0], skip_special_tokens=True)
    latency = round(time.time() - start, 2)
    return caption, latency

def capture_frame():
    global last_capture_time
    ret, frame = cap.read()
    if not ret:
        return

    timestamp = int(time.time())
    img_path = os.path.join(capture_dir, f"webcam_capture_{timestamp}.jpg")
    cv2.imwrite(img_path, frame)
    caption, latency = generate_caption(img_path)

    speak(caption)
    caption_label.config(text=f"Caption: {caption}")
    with open(log_file, "a", newline='', encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([time.ctime(), caption, latency, mode])
    last_capture_time = time.time()

def update_frame():
    if capturing:
        ret, frame = cap.read()
        if ret:
            cv2image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGBA)
            img = Image.fromarray(cv2image)
            imgtk = ImageTk.PhotoImage(image=img)
            video_label.imgtk = imgtk
            video_label.configure(image=imgtk)

        if mode == "auto" and (time.time() - last_capture_time) >= capture_interval:
            capture_frame()

        root.after(30, update_frame)

def start_camera():
    global cap, capturing
    cap = cv2.VideoCapture(0)
    capturing = True
    update_frame()

def stop_camera():
    global cap, capturing
    capturing = False
    if cap:
        cap.release()
    video_label.config(image='')

def capture_now():
    if mode == "manual":
        capture_frame()

def set_mode_auto():
    global mode
    mode = "auto"
    mode_label.config(text="Mode: AUTO")

def set_mode_manual():
    global mode
    mode = "manual"
    mode_label.config(text="Mode: MANUAL")

# GUI Setup
root = tk.Tk()
root.title("Navi Lens - AI Scene Narrator")

video_label = tk.Label(root)
video_label.pack()

btn_frame = tk.Frame(root)
btn_frame.pack()

start_btn = ttk.Button(btn_frame, text="Start Camera", command=start_camera)
start_btn.grid(row=0, column=0, padx=5, pady=5)

stop_btn = ttk.Button(btn_frame, text="Stop Camera", command=stop_camera)
stop_btn.grid(row=0, column=1, padx=5, pady=5)

capture_btn = ttk.Button(btn_frame, text="Capture Now", command=capture_now)
capture_btn.grid(row=0, column=2, padx=5, pady=5)

auto_btn = ttk.Button(btn_frame, text="Auto Mode", command=set_mode_auto)
auto_btn.grid(row=0, column=3, padx=5, pady=5)

manual_btn = ttk.Button(btn_frame, text="Manual Mode", command=set_mode_manual)
manual_btn.grid(row=0, column=4, padx=5, pady=5)

mode_label = tk.Label(root, text="Mode: MANUAL", font=("Helvetica", 12))
mode_label.pack(pady=5)

caption_label = tk.Label(root, text="Caption: ", font=("Helvetica", 12), wraplength=600, justify="center")
caption_label.pack(pady=10)

root.protocol("WM_DELETE_WINDOW", stop_camera)
root.mainloop()