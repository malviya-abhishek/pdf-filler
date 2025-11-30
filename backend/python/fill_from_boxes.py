import sys
import json
import fitz  # PyMuPDF
from pathlib import Path
import os

# Import your existing detect_boxes function
from detect_boxes import detect_boxes
FONT_PATH = "python/fonts/rf.ttf"
FONT = fitz.Font(fontfile=FONT_PATH)


FONT_PATH = os.path.join(
    os.path.dirname(__file__),
    "fonts",
    "rf.ttf",   # adjust to your actual file
)

def draw_text_in_box(page, box, char, font_size=8):
    """
    Draw a single character centered in the given box.
    box: dict with x0, y0, x1, y1
    """
    if not char:
        return
    
    if not os.path.exists(FONT_PATH):
        print(f"[WARN] Font file not found at {FONT_PATH}")
        return


    x0, y0, x1, y1 = box["x0"], box["y0"], box["x1"], box["y1"]


    box_width = x1 - x0
    box_height = y1 - y0

    # center point of box
    cx = x0 + box_width / 2.0
    cy = y0 + box_height / 2.0

    rect = fitz.Rect(box["x0"], box["y0"], box["x1"], box["y1"])

    box_w = rect.width
    box_h = rect.height

    # If the box is degenerate, skip
    if box_w <= 0 or box_h <= 0:
        print("[WARN] Degenerate box rect:", rect)
        return
    
    base = min(box_w, box_h)

    # Font sizes to try – descending
    candidate_sizes = [
        base * 0.9,
        base * 0.8,
        base * 0.7,
        base * 0.6,
        base * 0.5,
        8, 
        7, 
        6, 
        5, 
        4, 
        3
    ]

    margin = min(rect.width, rect.height) * 0.05 

    margin_rect = fitz.Rect(
        rect.x0 + margin,
        rect.y0 + margin,
        rect.x1 - margin,
        rect.y1 - margin,
    )

    page.draw_rect(margin_rect, color=(1, 0, 0), width=0.5)

    page.draw_rect(rect, color=(0, 1, 0), width=0.5)

    for fs in candidate_sizes:
        rc = page.insert_textbox(
            margin_rect,
            char,
            fontsize=fs,
            fontfile=FONT_PATH,
            color=(0, 0, 0),
            align=fitz.TEXT_ALIGN_CENTER,   # exactly centered horizontally
        )
        if rc >= 0.0:
            break;


def fill_from_box_values(input_pdf_path: str, box_values_path: str, output_pdf_path: str):
    # 1. Load values typed by user
    with open(box_values_path, "r") as f:
        box_values = json.load(f)   # { "page_0:run_3:5": "A", ... }

    # 2. Run detection again to get runs + boxes for this PDF
    detection = detect_boxes(input_pdf_path)

    # 3. Open PDF
    doc = fitz.open(input_pdf_path)

    for box_id, raw_value in box_values.items():
        # Keep only last character, uppercase
        char = (raw_value or "")[-1:].upper()
        if not char:
            continue

        # boxId format: "page_0:run_3:5"
        try:
            page_key, run_id, box_idx_str = box_id.split(":")
            page_index = int(page_key.split("_")[1])
            box_idx = int(box_idx_str)
        except Exception as e:
            print(f"[WARN] Invalid boxId '{box_id}': {e}")
            continue

        page_info = detection.get(page_key)
        if not page_info:
            print(f"[WARN] No page_info for key {page_key}")
            continue

        runs = page_info.get("runs", [])
        run = next((r for r in runs if r["id"] == run_id), None)
        if not run:
            print(f"[WARN] Run {run_id} not found on {page_key}")
            continue

        if box_idx < 0 or box_idx >= len(run["boxes"]):
            print(f"[WARN] Box index {box_idx} out of range for {run_id}")
            continue

        box = run["boxes"][box_idx]
        page = doc[page_index]

        draw_text_in_box(page, box, char, font_size=8)

    # 4. Save output PDF
    doc.save(output_pdf_path)
    doc.close()
    print(f"Filled PDF saved to: {output_pdf_path}")


if __name__ == "__main__":
    # Usage:
    #   python fill_from_boxes.py input.pdf box_values.json output.pdf
    if len(sys.argv) != 4:
        print(
            "Usage: python fill_from_boxes.py <input.pdf> <box_values.json> <output.pdf>",
            file=sys.stderr,
        )
        sys.exit(1)

    input_pdf = sys.argv[1]
    box_values_json = sys.argv[2]
    output_pdf = sys.argv[3]

    fill_from_box_values(input_pdf, box_values_json, output_pdf)
