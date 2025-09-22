import time
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration

# Load BLIP once
processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

def generate_caption(image_path: str):
    image = Image.open(image_path).convert("RGB")
    start = time.time()
    inputs = processor(images=image, return_tensors="pt")
    out = model.generate(**inputs)
    caption = processor.decode(out[0], skip_special_tokens=True)
    latency = round(time.time() - start, 2)
    return caption, latency
