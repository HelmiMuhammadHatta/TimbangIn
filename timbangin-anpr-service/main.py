import time
import io
import re
import cv2
import numpy as np
import easyocr
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse

app = FastAPI(title="TimbangIn ANPR Service")

# Initialize EasyOCR reader once at startup
print("Loading EasyOCR model...")
# Setting gpu=False ensures it runs on any machine (laptop CPU). 
# Change to gpu=True if CUDA is available for much faster processing.
reader = easyocr.Reader(['en'], gpu=False)
print("EasyOCR model loaded.")

def clean_plate_text(text: str) -> str:
    """
    Cleans up the OCR text to match Indonesian plate format logic.
    - Remove special characters and spaces
    - Standard format: 1-2 letters, 1-4 numbers, 1-3 letters.
    - Example: B1234ABC
    """
    # Remove all non-alphanumeric characters
    cleaned = re.sub(r'[^A-Z0-9]', '', text.upper())
    
    # Simple heuristic to fix common OCR errors in plates
    # e.g., '0' read as 'O' or 'O' read as '0' depending on position
    # (A full regex-based correction requires knowing the exact segments, 
    # but a simple replace helps in edge cases if implemented carefully).
    
    return cleaned

def is_valid_plate_format(text: str) -> bool:
    """
    Check if the string loosely matches an Indonesian license plate.
    ^[A-Z]{1,2}[0-9]{1,4}[A-Z]{0,3}$
    """
    pattern = r'^[A-Z]{1,2}[0-9]{1,4}[A-Z]{0,3}$'
    return bool(re.match(pattern, text))

@app.post("/detect-plate")
async def detect_plate(image: UploadFile = File(...)):
    start_time = time.time()
    
    # Read the uploaded image bytes
    contents = await image.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file.")

    # Convert to grayscale for processing
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Apply bilateral filter to remove noise while keeping edges sharp
    bfilter = cv2.bilateralFilter(gray, 11, 17, 17)
    
    # Edge detection
    edged = cv2.Canny(bfilter, 30, 200)
    
    # Find contours
    contours, _ = cv2.findContours(edged.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    # Sort contours by area, keeping only the largest ones
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:10]
    
    location = None
    for contour in contours:
        # Approximate the polygon
        approx = cv2.approxPolyDP(contour, 10, True)
        # If it has 4 points, it might be a license plate
        if len(approx) == 4:
            x, y, w, h = cv2.boundingRect(contour)
            aspect_ratio = w / float(h)
            # Indonesian plates typically have an aspect ratio between 2.0 and 4.5
            if 2.0 <= aspect_ratio <= 4.5:
                location = approx
                break
                
    detected_text = ""
    confidence = 0.0
    
    # If a rectangular contour was found, crop and OCR that specific area
    if location is not None:
        mask = np.zeros(gray.shape, np.uint8)
        cv2.drawContours(mask, [location], 0, 255, -1)
        
        (x, y) = np.where(mask == 255)
        (topx, topy) = (np.min(x), np.min(y))
        (bottomx, bottomy) = (np.max(x), np.max(y))
        
        # Add 20% padding
        h = bottomx - topx
        w = bottomy - topy
        padding_y = int(h * 0.2)
        padding_x = int(w * 0.2)
        
        # Ensure padding does not exceed image bounds
        img_h, img_w = gray.shape
        topx_padded = max(0, topx - padding_y)
        bottomx_padded = min(img_h - 1, bottomx + padding_y)
        topy_padded = max(0, topy - padding_x)
        bottomy_padded = min(img_w - 1, bottomy + padding_x)
        
        cropped = gray[topx_padded:bottomx_padded+1, topy_padded:bottomy_padded+1]
        
        # Run OCR on cropped image
        result = reader.readtext(cropped)
    else:
        # Fallback: Run OCR on the whole image (slower, but works if contour detection failed)
        result = reader.readtext(gray)

    # Process OCR results: Merge all detected text blocks from left to right
    # result format: [(bbox, text, conf), ...]
    # bbox format: [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
    
    # Sort by the minimum X coordinate of the bounding box
    result.sort(key=lambda item: min(pt[0] for pt in item[0]))
    
    all_blocks = []
    merged_text = ""
    conf_sum = 0.0
    valid_blocks = 0
    
    for (bbox, text, conf) in result:
        # Log all raw detected blocks
        all_blocks.append({
            "text": text,
            "confidence": round(float(conf), 4)
        })
        
        cleaned = clean_plate_text(text)
        if cleaned: # If not empty after cleaning
            merged_text += cleaned
            conf_sum += float(conf)
            valid_blocks += 1

    best_candidate = merged_text
    best_conf = (conf_sum / valid_blocks) if valid_blocks > 0 else 0.0

    processing_time_ms = int((time.time() - start_time) * 1000)

    return JSONResponse({
        "plateNumber": best_candidate,
        "confidence": round(best_conf, 4),
        "processingTimeMs": processing_time_ms,
        "allDetectedTextBlocks": all_blocks
    })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
