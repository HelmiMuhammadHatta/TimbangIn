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
reader = easyocr.Reader(['en'], gpu=False)
print("EasyOCR model loaded.")

def clean_plate_text(text: str) -> str:
    """Removes non-alphanumeric characters and converts to uppercase."""
    return re.sub(r'[^A-Z0-9]', '', text.upper())

def format_plate(raw_text: str) -> str:
    """Formats a plate string into standard Indonesian format (e.g., 'R 3905 DW')."""
    clean = clean_plate_text(raw_text)
    match = re.match(r'^([A-Z]{1,2})([0-9]{1,4})([A-Z]{0,3})$', clean)
    if match:
        p, n, s = match.groups()
        return f"{p} {n} {s}".strip()
    return clean

def score_and_extract_plate(detected_blocks):
    """
    Evaluates detected text blocks (each: text, conf, min_x) and finds
    the best Indonesian license plate match.
    """
    if not detected_blocks:
        return ("", "", 0.0, "none")

    # Sort left to right
    detected_blocks.sort(key=lambda x: x[2])
    
    candidates = []
    
    # Check merged adjacent blocks first (all text combined left-to-right)
    joined_raw = " ".join([b[0] for b in detected_blocks])
    joined_clean = clean_plate_text(joined_raw)
    
    # Priority 1: Full plate match in merged text: Prefix (1-2) + Number (1-4) + Suffix (1-3)
    m_full = re.search(r'([A-Z]{1,2})([0-9]{1,4})([A-Z]{1,3})', joined_clean)
    if m_full:
        p, n, s = m_full.groups()
        avg_conf = sum(b[1] for b in detected_blocks) / len(detected_blocks)
        score = min(1.0, avg_conf + 0.35)  # Significant priority bonus for complete 3-segment plate
        candidates.append((f"{p} {n} {s}", f"{p}{n}{s}", score, "merged_full_plate"))

    # Priority 2: Full plate match in a single block
    for text, conf, _ in detected_blocks:
        clean = clean_plate_text(text)
        m = re.match(r'^([A-Z]{1,2})([0-9]{1,4})([A-Z]{1,3})$', clean)
        if m:
            p, n, s = m.groups()
            score = min(1.0, conf + 0.3)
            candidates.append((f"{p} {n} {s}", clean, score, "single_block_full"))

    # Priority 3: Partial plate (Prefix + Number only) - lower base score
    for text, conf, _ in detected_blocks:
        clean = clean_plate_text(text)
        m2 = re.match(r'^([A-Z]{1,2})([0-9]{1,4})$', clean)
        if m2:
            p, n = m2.groups()
            candidates.append((f"{p} {n}", clean, conf * 0.7, "single_block_partial"))

    m_partial = re.search(r'([A-Z]{1,2})([0-9]{1,4})', joined_clean)
    if m_partial and not m_full:
        p, n = m_partial.groups()
        avg_conf = sum(b[1] for b in detected_blocks) / len(detected_blocks)
        candidates.append((f"{p} {n}", f"{p}{n}", avg_conf * 0.65, "merged_partial"))

    # Priority 4: Fallback
    if not candidates and detected_blocks:
        avg_conf = sum(b[1] for b in detected_blocks) / len(detected_blocks)
        candidates.append((format_plate(joined_clean), joined_clean, avg_conf * 0.5, "raw_fallback"))

    # Rank by score
    candidates.sort(key=lambda x: x[2], reverse=True)
    return candidates[0] if candidates else ("", "", 0.0, "none")

def preprocess_image_for_ocr(img_gray):
    """Generates enhanced image variations for robust OCR detection."""
    h, w = img_gray.shape
    
    # Upscale if small
    if h < 120 or w < 300:
        scale = max(120.0 / h, 300.0 / w, 2.0)
        img_gray = cv2.resize(img_gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

    # 1. CLAHE Contrast enhancement
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(img_gray)
    enhanced = cv2.bilateralFilter(enhanced, 9, 75, 75)

    return enhanced

@app.post("/detect-plate")
async def detect_plate(image: UploadFile = File(...)):
    start_time = time.time()
    
    # Read image
    contents = await image.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file.")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    img_h, img_w = gray.shape

    # Strategy 1: Center Viewfinder ROI Crop (Target Focus Box)
    # Most users position the plate within the center 60% of the viewfinder
    y1_roi = max(0, int(img_h * 0.20))
    y2_roi = min(img_h, int(img_h * 0.80))
    x1_roi = max(0, int(img_w * 0.15))
    x2_roi = min(img_w, int(img_w * 0.85))
    viewfinder_crop = gray[y1_roi:y2_roi, x1_roi:x2_roi]

    # Strategy 2: Morphological License Plate Localization
    contour_crops = []
    try:
        bfilter = cv2.bilateralFilter(gray, 11, 17, 17)
        grad_x = cv2.Sobel(bfilter, cv2.CV_16S, 1, 0, ksize=3)
        abs_grad_x = cv2.convertScaleAbs(grad_x)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (17, 3))
        morph = cv2.morphologyEx(abs_grad_x, cv2.MORPH_CLOSE, kernel)
        _, thresh = cv2.threshold(morph, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contours = sorted(contours, key=cv2.contourArea, reverse=True)[:5]
        
        for c in contours:
            x, y, w, h = cv2.boundingRect(c)
            aspect = w / float(h)
            area = w * h
            if 1.5 <= aspect <= 6.0 and area > 1200:
                pad_y = int(h * 0.35)
                pad_x = int(w * 0.35)
                cy1 = max(0, y - pad_y)
                cy2 = min(img_h, y + h + pad_y)
                cx1 = max(0, x - pad_x)
                cx2 = min(img_w, x + w + pad_x)
                contour_crops.append(gray[cy1:cy2, cx1:cx2])
    except Exception as e:
        print(f"Contour localization error: {e}")

    # Build candidates to run OCR on (Ordered by priority)
    ocr_targets = []
    
    # Priority A: Viewfinder Target ROI (Focused)
    ocr_targets.append(("viewfinder_focus", preprocess_image_for_ocr(viewfinder_crop)))
    
    # Priority B: Contour crops
    for idx, c_crop in enumerate(contour_crops[:2]):
        ocr_targets.append((f"contour_{idx}", preprocess_image_for_ocr(c_crop)))
        
    # Priority C: Full frame
    ocr_targets.append(("full_frame", preprocess_image_for_ocr(gray)))

    best_result = ("", "", 0.0, "none")
    all_blocks_logged = []
    winning_strategy = "none"

    allowlist_chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 '

    for strategy_name, target_img in ocr_targets:
        try:
            ocr_res = reader.readtext(target_img, allowlist=allowlist_chars, paragraph=False)
            if not ocr_res:
                continue

            current_blocks = []
            for (bbox, text, conf) in ocr_res:
                min_x = min(pt[0] for pt in bbox)
                current_blocks.append((text, float(conf), min_x))
                all_blocks_logged.append({
                    "strategy": strategy_name,
                    "text": text,
                    "confidence": round(float(conf), 4)
                })

            formatted, clean, score, method = score_and_extract_plate(current_blocks)
            if score > best_result[2]:
                best_result = (formatted, clean, score, method)
                winning_strategy = strategy_name

            # If we found a high confidence full plate match from focused viewfinder/contour, we can stop early
            if score >= 0.85 and "full" in method:
                break
        except Exception as ex:
            print(f"Error during OCR on {strategy_name}: {ex}")

    processing_time_ms = int((time.time() - start_time) * 1000)

    final_plate = best_result[0]
    final_confidence = min(1.0, round(best_result[2], 4))

    print(f"ANPR Result: '{final_plate}' (Conf: {final_confidence}, Strategy: {winning_strategy}, Time: {processing_time_ms}ms)")

    return JSONResponse({
        "plateNumber": final_plate,
        "confidence": final_confidence,
        "strategy": winning_strategy,
        "processingTimeMs": processing_time_ms,
        "allDetectedTextBlocks": all_blocks_logged
    })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
