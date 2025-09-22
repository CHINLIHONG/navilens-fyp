# app/detector.py
from ultralytics import YOLO

# Load YOLO once
yolo = YOLO("yolov8n.pt")

def detect_objects(image_path: str):
    """
    Run YOLO object detection and return a list of objects with
    label and relative position (left, center, right).
    """
    results = yolo(image_path)[0]
    objects = []

    for box in results.boxes:
        cls_id = int(box.cls[0])
        label = results.names[cls_id]

        # midpoint X of bounding box
        x_mid = float((box.xyxy[0][0] + box.xyxy[0][2]) / 2)
        w = results.orig_shape[1]

        if x_mid < w / 3:
            pos = "left"
        elif x_mid > 2 * w / 3:
            pos = "right"
        else:
            pos = "center"

        objects.append({
            "label": label,
            "position": pos
        })

    return objects
