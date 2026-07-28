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
        new_image = cv2.drawContours(mask, [location], 0, 255, -1)
        new_image = cv2.bitwise_and(img, img, mask=mask)
        
        (x, y) = np.where(mask == 255)
        (topx, topy) = (np.min(x), np.min(y))
        (bottomx, bottomy) = (np.max(x), np.max(y))
        cropped = gray[topx:bottomx+1, topy:bottomy+1]
        
        # Run OCR on cropped image
        result = reader.readtext(cropped)
    else:
        # Fallback: Run OCR on the whole image (slower, but works if contour detection failed)
        result = reader.readtext(gray)

    # Process OCR results
    best_candidate = ""
    best_conf = 0.0
    
    for (bbox, text, conf) in result:
        cleaned = clean_plate_text(text)
        if len(cleaned) >= 4: # Plates are at least 4 chars long (e.g. B1AA)
            # Prioritize matches that fit the plate regex format
            if is_valid_plate_format(cleaned):
                if conf > best_conf or best_candidate == "":
                    best_candidate = cleaned
                    best_conf = float(conf)
            else:
                # If no valid format found yet, just keep the highest confidence long string
                if best_candidate == "" and conf > best_conf:
                    best_candidate = cleaned
                    best_conf = float(conf)

    processing_time_ms = int((time.time() - start_time) * 1000)

    return JSONResponse({
        "plateNumber": best_candidate,
        "confidence": round(best_conf, 4),
        "processingTimeMs": processing_time_ms
    })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
